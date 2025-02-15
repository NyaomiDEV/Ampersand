import { System, Member, FrontingEntry, Tag, BoardMessage, CustomField } from "../entities";
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
import { newCustomField } from "../tables/customFields";
import { resizeImage } from "../../util/image";

const fetch = isTauri() ? tauriFetch : window.fetch;

function normalizeSPColor(color: string) {
	if (color.length) return undefined;

	if (color.startsWith("#"))
		color = color.substring(1);

	if (color.length > 6) // argb
		color = color.substring(2);

	return "#" + color;
}

function mapCustomFieldType(type: number, data: any) {
	switch(type){
		case 0: //text
			return String(data);
		case 1: //color
			return `<${normalizeSPColor(data)}>`;
		case 2: // date
			return `<t:${Math.round(new Date(data).getTime() / 1000)}:D>`
		case 3: // month
			return `<t:${Math.round(new Date(data).getTime() / 1000)}:M>`
		case 4: // year
			return `<t:${Math.round(new Date(data).getTime() / 1000)}:Y>`
		case 5: // month + year
			return `<t:${Math.round(new Date(data).getTime() / 1000)}:K>`
		case 6: // timestamp
			return `<t:${Math.round(new Date(data).getTime() / 1000)}:F>`
		case 7: // month + day
			return `<t:${Math.round(new Date(data).getTime() / 1000)}:G>`
	}

	return "";
}

async function getAvatarFromUuid(systemId: string, avatarUuid: string){
	if(!avatarUuid || !avatarUuid.length) return undefined;
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
	const spSystem = spExport.users[0];
	if(!spSystem) return false;
	console.debug("[SP] Creating system:", spSystem);

	const systemInfo: PartialBy<System, "uuid"> = {
		name: spSystem.username,
		description: spSystem.desc,
	};

	if (spSystem.avatarUrl?.length) {
		try {
			const image = new File(
				[await (await fetch(spSystem.avatarUrl)).blob()],
				spSystem.avatarUrl.split("/").pop()
			);
			systemInfo.image = await resizeImage(image);
		} catch (e) {
			// whatever
		}
	} else if (spSystem.avatarUuid?.length) {
		const image = await getAvatarFromUuid(spSystem.uid, spSystem.avatarUuid);
		if(image) systemInfo.image = await resizeImage(image);
	}

	if(!await newSystem(systemInfo)) return false;

	console.debug("[SP] System created");

	// TAGS
	const tagMapping = new Map<string, string>();
	for (const spGroup of spExport.groups) {
		console.debug("[SP] Creating tag for group:", spGroup);
		const tag: PartialBy<Tag, "uuid"> = {
			name: spGroup.name,
			description: spGroup.desc?.length ? spGroup.desc : undefined,
			color: normalizeSPColor(spGroup.color),
			type: "member"
		};

		const uuid = await newTag(tag);
		if(!uuid) return false;
		tagMapping.set(spGroup._id, uuid);
		console.debug("[SP] Created tag for group:", spGroup, "with UUID:", uuid);
	}

	// CUSTOM FIELDS
	const customFieldMapping = new Map<string, [string, number]>();
	for (const spCustomField of spExport.customFields) {
		console.debug("[SP] Creating custom field for:", spCustomField);
		const customField: PartialBy<CustomField, "uuid"> = {
			name: spCustomField.name,
			default: false
		};

		const uuid = await newCustomField(customField);
		if (!uuid) return false;
		customFieldMapping.set(spCustomField._id, [uuid, spCustomField.type]);
		console.debug("[SP] Created custom field for:", spCustomField, "with UUID:", uuid);
	}

	// MEMBERS
	const memberMapping = new Map<string, string>();
	for (const spMember of spExport.members) {
		console.debug("[SP] Creating member for:", spMember);
		const member: PartialBy<Member, "uuid"> = {
			name: spMember.name,
			pronouns: spMember.pronouns?.length ? spMember.pronouns : undefined,
			description: spMember.desc?.length ? spMember.desc : undefined,
			color: normalizeSPColor(spMember.color),
			isArchived: spMember.archived || false,
			isCustomFront: false,
			dateCreated: spMember.created ? new Date(spMember.created) : new Date(),
			tags: [
				...spExport.groups
					.filter(x => x.members?.includes(spMember._id))
					.map(x => tagMapping.get(x._id))
			],
			customFields: new Map(
				Object.entries(spMember.info || {})
				.filter(([_, v]) => (v as string).length)
				.map(([_id, value]) => {
					const mapped = customFieldMapping.get(_id);
					if(!mapped) return undefined;
					return [ mapped[0], mapCustomFieldType(mapped[1], value)] as [string, string];
				})
				.filter(x => !!x)
			),
		};

		if (spMember.avatarUrl?.length) {
			try {
				const image = new File(
					[await (await fetch(spMember.avatarUrl)).blob()],
					spMember.avatarUrl.split("/").pop()
				);
				member.image = await resizeImage(image);
			} catch (e) {
				// whatever
			}
		} else if (spMember.avatarUuid?.length) {
			const image = await getAvatarFromUuid(spSystem.uid, spMember.avatarUuid);
			if(image) member.image = await resizeImage(image);
		}

		const uuid = await newMember(member);
		if(!uuid) return false;
		memberMapping.set(spMember._id, uuid);
		console.debug("[SP] Created member for:", spMember, "with UUID:", uuid);
	}

	// CUSTOM FRONTS
	for (const spCustomFront of spExport.frontStatuses) {
		console.debug("[SP] Creating member for custom front:", spCustomFront);
		const member: PartialBy<Member, "uuid"> = {
			name: spCustomFront.name,
			description: spCustomFront.desc?.length ? spCustomFront.desc : undefined,
			color: normalizeSPColor(spCustomFront.color),
			isArchived: false,
			isCustomFront: true,
			tags: [],
			dateCreated: spCustomFront.created ? new Date(spCustomFront.created) : new Date(),
		};
		if (spCustomFront.avatarUrl?.length) {
			try {
				const image = new File(
					[await (await fetch(spCustomFront.avatarUrl)).blob()],
					spCustomFront.avatarUrl.split("/").pop()
				);
				member.image = await resizeImage(image)
			} catch (e) {
				// whatever
			}
		} else if (spCustomFront.avatarUuid?.length) {
			member.image = await getAvatarFromUuid(spSystem.uid, spCustomFront.avatarUuid);
		}

		const uuid = await newMember(member);
		if (!uuid) return false;
		memberMapping.set(spCustomFront._id, uuid);
		console.debug("[SP] Created member for custom front:", spCustomFront, "with UUID:", uuid);
	}

	// FRONTING ENTRIES
	for (const spFrontHistory of spExport.frontHistory) {
		if(!spFrontHistory.startTime) continue; // front entries without startTime are null for us
		console.debug("[SP] Creating fronting entry for:", spFrontHistory);
		const frontingEntry: PartialBy<FrontingEntry, "uuid"> = {
			member: memberMapping.get(spFrontHistory.member) || "00000000-0000-0000-0000-000000000000",
			startTime: new Date(spFrontHistory.startTime),
			endTime: spFrontHistory.endTime ? new Date(spFrontHistory.endTime) : undefined,
			customStatus: spFrontHistory.customStatus?.length ? spFrontHistory.customStatus : undefined,
			isMainFronter: false
		}
		
		const uuid = await newFrontingEntry(frontingEntry);
		if(!uuid) return false;
		console.debug("[SP] Created fronting entry for:", spFrontHistory, "with UUID:", uuid);
	}

	// BOARD MESSAGES
	for (const spBoardMessage of spExport.boardMessages){
		console.debug("[SP] Creating message board entry for:", spBoardMessage);
		const boardMessage: PartialBy<BoardMessage, "uuid"> = {
			member: memberMapping.get(spBoardMessage.writtenBy) || "00000000-0000-0000-0000-000000000000",
			title: spBoardMessage.title,
			body: `@<m:${memberMapping.get(spBoardMessage.writtenFor)}>\n\n` + spBoardMessage.message?.length ? spBoardMessage.message : "",
			date: spBoardMessage.writtenAt ? new Date(spBoardMessage.writtenAt) : new Date()
		};
		
		const uuid = await newBoardMessage(boardMessage);
		if (!uuid) return false;
		console.debug("[SP] Created message board entry for:", spBoardMessage, "with UUID:", uuid);
	}

	// POLLS AS BOARD MESSAGES
	for (const spPoll of spExport.polls) {
		console.debug("[SP] Creating message board entry for poll:", spPoll);
		const boardMessage: PartialBy<BoardMessage, "uuid"> = {
			member: "00000000-0000-0000-0000-000000000000",
			title: spPoll.name,
			body: spPoll.desc?.length ? spPoll.desc : undefined,
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
								reason: y.comment?.length ? y.comment : undefined
							}))
					}))
					: [
						{
							choice: t("messageBoard:polls.defaultPollValues.yes"),
							votes: spPoll.votes
								.filter(x => x.vote === "yes")
								.map(x => ({
									member: memberMapping.get(x.id) || "00000000-0000-0000-0000-000000000000",
									reason: x.comment?.length ? x.comment : undefined
								}))
						},
						{
							choice: t("messageBoard:polls.defaultPollValues.no"),
							votes: spPoll.votes
								.filter(x => x.vote === "no")
								.map(x => ({
									member: memberMapping.get(x.id) || "00000000-0000-0000-0000-000000000000",
									reason: x.comment?.length ? x.comment : undefined
								}))
						},
						spPoll.allowVeto ? {
							choice: t("messageBoard:polls.defaultPollValues.veto"),
							votes: spPoll.votes
								.filter(x => x.vote === "veto")
								.map(x => ({
									member: memberMapping.get(x.id) || "00000000-0000-0000-0000-000000000000",
									reason: x.comment?.length ? x.comment : undefined
								}))
						} : undefined,
						spPoll.allowAbstain ? {
							choice: t("messageBoard:polls.defaultPollValues.abstain"),
							votes: spPoll.votes
								.filter(x => x.vote === "abstain")
								.map(x => ({
									member: memberMapping.get(x.id) || "00000000-0000-0000-0000-000000000000",
									reason: x.comment?.length ? x.comment : undefined
								}))
						} : undefined,
					].filter(Boolean)
			}
		};
		
		const uuid = await newBoardMessage(boardMessage);
		if(!uuid) return false;
		console.debug("[SP] Created message board entry for poll:", spPoll, "with UUID:", uuid);
	}

	// REMAP ALL MEMBER MENTIONS
	console.debug("[SP] Performing remappings");

	const systemDesc = (await getSystem())?.description;
	if (systemDesc)
		if (!await modifySystem({
			description: systemDesc.replace(/<###@(\w+)###>/g, (_, p1) => `@<m:${memberMapping.get(p1) || "00000000-0000-0000-0000-000000000000"}>`)
		})) return false;

	for (const member of await getMembers()) {
		const update: Partial<Member> = {};
		if (member.description)
			update.description = member.description.replace(/<###@(\w+)###>/g, (_, p1) => `@<m:${memberMapping.get(p1) || "00000000-0000-0000-0000-000000000000"}>`);

		if(member.customFields)
			update.customFields = new Map(Array.from(member.customFields.entries()).map(([k, v]) => [k, v.replace(/<###@(\w+)###>/g, (_, p1) => `@<m:${memberMapping.get(p1) || "00000000-0000-0000-0000-000000000000"}>`)]));

		if (!await updateMember(member.uuid, update)) return false;
	}

	for (const boardMessage of await getBoardMessages()) {
		if (boardMessage.body)
			if (!await updateBoardMessage(boardMessage.uuid, {
				body: boardMessage.body.replace(/<###@(\w+)###>/g, (_, p1) => `@<m:${memberMapping.get(p1) || "00000000-0000-0000-0000-000000000000"}>`)
			})) return false;
	}

	console.debug("[SP] Performed remappings");

	return true;
}
