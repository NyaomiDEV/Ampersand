import { System, Member, FrontingEntry, Tag, BoardMessage } from "../entities";
import { PartialBy } from "../../types";
import { AsyncUnzipOptions, unzip, Unzipped } from "fflate";
import { getTables } from "..";
import { newSystem } from "../tables/system";
import { newTag } from "../tables/tags";
import { getMembers, newMember, updateMember } from "../tables/members";
import { newFrontingEntry } from "../tables/frontingEntries";
import { getBoardMessages, newBoardMessage, updateBoardMessage } from "../tables/boardMessages";
import { t } from "i18next";

function normalizeSPColor(color: string) {
	if (color.startsWith("#"))
		color = color.substring(1);

	if (color.length > 6) // argb
		color = color.substring(2);

	return "#" + color;
}

function unzipAsync(data: Uint8Array, opts?: AsyncUnzipOptions): Promise<Unzipped> {
	return new Promise((resolve, reject) => {
		const cb = (err: any, res: Unzipped) => err ? reject(err) : resolve(res);
		if (opts)
			unzip(data, opts, cb);
		else
			unzip(data, cb);
	});
}

export async function importSimplyPlural(spExport) {
	// WIPE AMPERSAND
	await Promise.all(getTables().map(async x => x.clear()));

	// if a valid avatar export is present let's use it
	const avatarExport = spExport.avatarExports.find(x => Date.now() < x.exp);
	const avatars = new Map<string, File>();
	if (avatarExport) {
		const url = `https://api.apparyllis.com/v1/user/export/avatars/?key=${avatarExport.key}&uid=${avatarExport.uid}`;
		try {
			const avatarZip = new Uint8Array(await (await fetch(url)).arrayBuffer());
			const decompressed = await unzipAsync(avatarZip);
			for (const key in decompressed) {
				avatars.set(key.replace(/\.\w+?$/, ""), new File([decompressed[key]], key));
			}
		} catch (e) {
			// whatever
		}
	}

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
		systemInfo.image = avatars.get(spExport.users[0].avatarUuid);
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
					spMember.avatarUrl.avatarUrl.split("/").pop()
				);
			} catch (e) {
				// whatever
			}
		} else if (spMember.avatarUuid.length) {
			systemInfo.image = avatars.get(spMember.avatarUuid);
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
					spCustomFront.avatarUrl.avatarUrl.split("/").pop()
				);
			} catch (e) {
				// whatever
			}
		} else if (spCustomFront.avatarUuid.length) {
			systemInfo.image = avatars.get(spCustomFront.avatarUuid);
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

	// POLLS AS BOARD MESSAGES
	for (const spPoll of spExport.polls) {
		const boardMessage: PartialBy<BoardMessage, "uuid"> = {
			member: (await getMembers())[0].uuid,
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
								member: memberMapping.get(y.id),
								reason: y.comment.length ? y.comment : undefined
							}))
					}))
					: [
						{
							choice: t("messageBoard:polls.defaultPollValues.yes"),
							votes: spPoll.votes
								.filter(x => x.vote === "yes")
								.map(x => ({
									member: memberMapping.get(x.id),
									reason: x.comment.length ? x.comment : undefined
								}))
						},
						{
							choice: t("messageBoard:polls.defaultPollValues.no"),
							votes: spPoll.votes
								.filter(x => x.vote === "no")
								.map(x => ({
									member: memberMapping.get(x.id),
									reason: x.comment.length ? x.comment : undefined
								}))
						},
						spPoll.allowVeto ? {
							choice: t("messageBoard:polls.defaultPollValues.veto"),
							votes: spPoll.votes
								.filter(x => x.vote === "veto")
								.map(x => ({
									member: memberMapping.get(x.id),
									reason: x.comment.length ? x.comment : undefined
								}))
						} : undefined,
						spPoll.allowAbstain ? {
							choice: t("messageBoard:polls.defaultPollValues.abstain"),
							votes: spPoll.votes
								.filter(x => x.vote === "abstain")
								.map(x => ({
									member: memberMapping.get(x.id),
									reason: x.comment.length ? x.comment : undefined
								}))
						} : undefined,
					].filter(Boolean)
			}
		};
		
		if(!await newBoardMessage(boardMessage)) return false;
	}

	// REMAP ALL MEMBER MENTIONS
	for (const member of await getMembers()) {
		if (member.description)
			if(!await updateMember(member.uuid, {
				description: member.description.replace(/<###@(\w+)###>/g, (_, p1) => `@<m:${memberMapping.get(p1)}>`)
			})) return false;
	}

	for (const boardMessage of await getBoardMessages()) {
		if (boardMessage.body)
			if (!await updateBoardMessage(boardMessage.uuid, {
				body: boardMessage.body.replace(/<###@(\w+)###>/g, (_, p1) => `@<m:${memberMapping.get(p1)}>`)
			})) return false;
	}

	return true;
}
