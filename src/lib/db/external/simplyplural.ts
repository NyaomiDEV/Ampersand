import { System, Member, FrontingEntry, Tag, BoardMessage } from "../entities";
import { PartialBy } from "../../types";
import { getTables } from "..";
import { getSystem, modifySystem, newSystem } from "../tables/system";
import { newTag } from "../tables/tags";
import { getMembers, newMember, updateMember } from "../tables/members";
import { newFrontingEntry } from "../tables/frontingEntries";
import { getBoardMessages, newBoardMessage, updateBoardMessage } from "../tables/boardMessages";
import { t } from "i18next";
import { isTauri } from "../../mode";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

const fetch = isTauri() ? tauriFetch : window.fetch;

function normalizeSPColor(color: string) {
	if (color.startsWith("#"))
		color = color.substring(1);

	if (color.length > 6) // argb
		color = color.substring(2);

	return "#" + color;
}

async function getAvatarFromUuid(systemId: string, avatarUuid: string){
	try {
		const url = `https://spaces.apparyllis.com/avatars/${systemId}/${avatarUuid}`;
		const req = await (await fetch(url)).blob();
		return new File([req], avatarUuid + "." + req.type.split("/")[1]);
	}catch(e){
		return undefined;
	}
}

export async function importSimplyPlural(spExport) {
	// WIPE AMPERSAND
	await Promise.all(getTables().map(async x => x.clear()));

	// SYSTEM
	const systemInfo: PartialBy<System, "uuid"> = {
		name: spExport.users[0].username,
		description: spExport.users[0].desc,
	};

	if (spExport.users[0].avatarUrl) {
		try {
			systemInfo.image = new File(
				[await (await fetch(spExport.users[0].avatarUrl)).blob()],
				spExport.users[0].avatarUrl.split("/").pop()
			);
		} catch (e) {
			// whatever
		}
	} else if (spExport.users[0].avatarUuid.length) {
		systemInfo.image = await getAvatarFromUuid(spExport.users[0].uid, spExport.users[0].avatarUuid);
	}

	if(!await newSystem(systemInfo)) return false;

	// TAGS
	const tagMapping = new Map<string, string>();
	for (const spGroup of spExport.groups) {
		const tag: PartialBy<Tag, "uuid"> = {
			name: spGroup.name,
			description: spGroup.desc,
			color: normalizeSPColor(spGroup.color),
			type: "member"
		};

		const uuid = await newTag(tag);
		if(!uuid) return false;
		tagMapping.set(spGroup._id, uuid);
	}

	// MEMBERS
	const memberMapping = new Map<string, string>();
	for (const spMember of spExport.members) {
		const member: PartialBy<Member, "uuid"> = {
			name: spMember.name,
			pronouns: spMember.pronouns,
			description: spMember.desc,
			color: normalizeSPColor(spMember.color),
			isArchived: spMember.archived,
			isCustomFront: false,
			tags: [
				...spExport.groups
					.filter(x => x.members.includes(spMember._id))
					.map(x => tagMapping.get(x._id))
			],
			dateCreated: spMember.created ? new Date(spMember.created) : new Date(),
		};

		if (spMember.avatarUrl) {
			try {
				member.image = new File(
					[await (await fetch(spMember.avatarUrl)).blob()],
					spMember.avatarUrl.split("/").pop()
				);
			} catch (e) {
				// whatever
			}
		} else if (spMember.avatarUuid.length) {
			member.image = await getAvatarFromUuid(spExport.users[0].uid, spMember.avatarUuid);
		}

		const uuid = await newMember(member);
		if(!uuid) return false;
		memberMapping.set(spMember._id, uuid);
	}

	// CUSTOM FRONTS
	for (const spCustomFront of spExport.frontStatuses) {
		const member: PartialBy<Member, "uuid"> = {
			name: spCustomFront.name,
			description: spCustomFront.desc,
			color: normalizeSPColor(spCustomFront.color),
			isArchived: false,
			isCustomFront: true,
			tags: [],
			dateCreated: spCustomFront.created ? new Date(spCustomFront.created) : new Date(),
		};
		if (spCustomFront.avatarUrl) {
			try {
				member.image = new File(
					[await (await fetch(spCustomFront.avatarUrl)).blob()],
					spCustomFront.avatarUrl.split("/").pop()
				);
			} catch (e) {
				// whatever
			}
		} else if (spCustomFront.avatarUuid.length) {
			member.image = await getAvatarFromUuid(spExport.users[0].uid, spCustomFront.avatarUuid);
		}

		const uuid = await newMember(member);
		if (!uuid) return false;
		memberMapping.set(spCustomFront._id, uuid);
	}

	// FRONTING ENTRIES
	for (const spFrontHistory of spExport.frontHistory) {
		const frontingEntry: PartialBy<FrontingEntry, "uuid"> = {
			member: memberMapping.get(spFrontHistory.member)!,
			startTime: new Date(spFrontHistory.startTime),
			endTime: spFrontHistory.endTime ? new Date(spFrontHistory.endTime) : undefined,
			customStatus: spFrontHistory.customStatus,
			isMainFronter: false
		}
		
		if(!await newFrontingEntry(frontingEntry)) return false;
	}

	// BOARD MESSAGES
	for (const spBoardMessage of spExport.boardMessages){
		const boardMessage: PartialBy<BoardMessage, "uuid"> = {
			member: memberMapping.get(spBoardMessage.writtenBy) || "00000000-0000-0000-0000-000000000000",
			title: spBoardMessage.title,
			body: `@<m:${memberMapping.get(spBoardMessage.writtenFor)}>\n\n` + spBoardMessage.message,
			date: new Date(spBoardMessage.writtenAt)
		};

		if (!await newBoardMessage(boardMessage)) return false;
	}

	// POLLS AS BOARD MESSAGES
	for (const spPoll of spExport.polls) {
		const boardMessage: PartialBy<BoardMessage, "uuid"> = {
			member: "00000000-0000-0000-0000-000000000000",
			title: spPoll.name,
			body: spPoll.desc,
			date: new Date(),
			poll: {
				multipleChoice: false,
				entries: spPoll.custom
					? spPoll.options.map(x => ({
						choice: x.name,
						votes: spPoll.votes
							.filter(y => y.vote === x.name)
							.map(y => ({
								member: memberMapping.get(y.id) || "00000000-0000-0000-0000-000000000000",
								reason: y.comment.length ? y.comment : undefined
							}))
					}))
					: [
						{
							choice: t("messageBoard:polls.defaultPollValues.yes"),
							votes: spPoll.votes
								.filter(x => x.vote === "yes")
								.map(x => ({
									member: memberMapping.get(x.id) || "00000000-0000-0000-0000-000000000000",
									reason: x.comment.length ? x.comment : undefined
								}))
						},
						{
							choice: t("messageBoard:polls.defaultPollValues.no"),
							votes: spPoll.votes
								.filter(x => x.vote === "no")
								.map(x => ({
									member: memberMapping.get(x.id) || "00000000-0000-0000-0000-000000000000",
									reason: x.comment.length ? x.comment : undefined
								}))
						},
						spPoll.allowVeto ? {
							choice: t("messageBoard:polls.defaultPollValues.veto"),
							votes: spPoll.votes
								.filter(x => x.vote === "veto")
								.map(x => ({
									member: memberMapping.get(x.id) || "00000000-0000-0000-0000-000000000000",
									reason: x.comment.length ? x.comment : undefined
								}))
						} : undefined,
						spPoll.allowAbstain ? {
							choice: t("messageBoard:polls.defaultPollValues.abstain"),
							votes: spPoll.votes
								.filter(x => x.vote === "abstain")
								.map(x => ({
									member: memberMapping.get(x.id) || "00000000-0000-0000-0000-000000000000",
									reason: x.comment.length ? x.comment : undefined
								}))
						} : undefined,
					].filter(Boolean)
			}
		};
		
		if(!await newBoardMessage(boardMessage)) return false;
	}

	// REMAP ALL MEMBER MENTIONS
	const systemDesc = (await getSystem())?.description;
	if (systemDesc)
		if (!await modifySystem({
			description: systemDesc.replace(/<###@(\w+)###>/g, (_, p1) => `@<m:${memberMapping.get(p1) || "00000000-0000-0000-0000-000000000000"}>`)
		})) return false;

	for (const member of await getMembers()) {
		if (member.description)
			if(!await updateMember(member.uuid, {
				description: member.description.replace(/<###@(\w+)###>/g, (_, p1) => `@<m:${memberMapping.get(p1) || "00000000-0000-0000-0000-000000000000"}>`)
			})) return false;
	}

	for (const boardMessage of await getBoardMessages()) {
		if (boardMessage.body)
			if (!await updateBoardMessage(boardMessage.uuid, {
				body: boardMessage.body.replace(/<###@(\w+)###>/g, (_, p1) => `@<m:${memberMapping.get(p1) || "00000000-0000-0000-0000-000000000000"}>`)
			})) return false;
	}

	return true;
}
