/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { System, Member, FrontingEntry, Tag, BoardMessage, CustomField, JournalPost } from "../entities";
import { getTables } from "../tables";
import { t } from "i18next";
import { fetch } from "@tauri-apps/plugin-http";
import { resizeImage } from "../../util/image";
import { maxUid, nilUid } from "../../util/consts";

function normalizeSPColor(color?: string) {
	if (!color || !color.length) return undefined;

	if (color.startsWith("#"))
		color = color.substring(1);

	if (color.length > 6) // argb
		color = color.substring(2);

	return `#${color}`;
}

function mapCustomFieldType(type: number, data: any) {
	switch(type){
		case 0: // text
			return String(data);
		case 1: // color
			return `<${normalizeSPColor(data)}>`;
		case 2: // date
			return `<t:${Math.round(new Date(data).getTime() / 1000)}:D>`;
		case 3: // month
			return `<t:${Math.round(new Date(data).getTime() / 1000)}:M>`;
		case 4: // year
			return `<t:${Math.round(new Date(data).getTime() / 1000)}:Y>`;
		case 5: // month + year
			return `<t:${Math.round(new Date(data).getTime() / 1000)}:K>`;
		case 6: // timestamp
			return `<t:${Math.round(new Date(data).getTime() / 1000)}:F>`;
		case 7: // month + day
			return `<t:${Math.round(new Date(data).getTime() / 1000)}:G>`;
	}

	return "";
}

async function getAvatarFromUuid(systemId: string, avatarUuid: string){
	if(!avatarUuid || !avatarUuid.length) return undefined;
	try {
		const url = `https://spaces.apparyllis.com/avatars/${systemId}/${avatarUuid}`;
		const req = await (await fetch(url)).blob();
		return new File([req], `${avatarUuid}.${req.type.split("/")[1]}`);
	}catch(_e){
		return undefined;
	}
}

async function system(spExport: any){
	const spSystem = spExport.users[0];
	if (!spSystem) return;

	const systemInfo: System = {
		name: spSystem.username,
		description: spSystem.desc,
		uuid: window.crypto.randomUUID()
	};

	if (spSystem.avatarUrl?.length) {
		try {
			const image = new File(
				[await (await fetch(spSystem.avatarUrl)).blob()],
				spSystem.avatarUrl.split("/").pop()
			);
			systemInfo.image = await resizeImage(image);
		} catch (_e) {
			// whatever
		}
	} else if (spSystem.avatarUuid?.length) {
		const image = await getAvatarFromUuid(spSystem.uid, spSystem.avatarUuid);
		if (image) systemInfo.image = await resizeImage(image);
	}

	return {
		systemInfo,
		systemUid: spSystem.uid
	};
}

function tag(spExport: any){
	const tagMapping = new Map<string, string>();
	const tags: Tag[] = [];

	for (const spGroup of spExport.groups) {
		const tag: Tag = {
			name: spGroup.name,
			description: spGroup.desc?.length ? spGroup.desc : undefined,
			color: normalizeSPColor(spGroup.color),
			type: "member",
			viewInLists: false,
			uuid: window.crypto.randomUUID()
		};

		tags.push(tag);
		tagMapping.set(spGroup._id, tag.uuid);
	}
	
	return {
		tags,
		tagMapping
	};
}

function customField(spExport: any){
	const customFieldMapping = new Map<string, [string, number]>();
	const customFields: CustomField[] = [];

	for (const spCustomField of spExport.customFields) {
		const customField: CustomField = {
			name: spCustomField.name,
			default: false,
			priority: 1,
			uuid: window.crypto.randomUUID()
		};

		customFields.push(customField);
		customFieldMapping.set(spCustomField._id, [customField.uuid, spCustomField.type]);
	}

	return {
		customFields,
		customFieldMapping
	};
}

export async function member(spExport: any, systemInfo: System, systemUid: string, tagMapping: Map<string, string>, customFieldMapping: Map<string, [string, number]>){
	const memberMapping = new Map<string, string>();
	const members: Member[] = [];

	// MEMBERS
	for (const spMember of spExport.members) {
		console.debug("[SP] Creating member for:", spMember);
		const member: Member = {
			name: spMember.name,
			system: systemInfo.uuid,
			pronouns: spMember.pronouns?.length ? spMember.pronouns : undefined,
			description: spMember.desc?.length ? spMember.desc : undefined,
			color: normalizeSPColor(spMember.color),
			isArchived: spMember.archived || false,
			isCustomFront: false,
			dateCreated: spMember.created ? new Date(spMember.created) : new Date(),
			tags: [
				...spExport.groups
					.filter(x => (x.members as string | undefined)?.includes(spMember._id))
					.map(x => tagMapping.get(x._id))
			],
			customFields: new Map(
				Object.entries(spMember.info || {})
					.filter(([_, v]) => (v as string).length)
					.map(([_id, value]) => {
						const mapped = customFieldMapping.get(_id);
						if (!mapped) return undefined;
						return [mapped[0], mapCustomFieldType(mapped[1], value)] as [string, string];
					})
					.filter(x => !!x)
			),
			uuid: window.crypto.randomUUID()
		};

		if (spMember.avatarUrl?.length) {
			try {
				const image = new File(
					[await (await fetch(spMember.avatarUrl)).blob()],
					spMember.avatarUrl.split("/").pop()
				);
				member.image = await resizeImage(image);
			} catch (_e) {
				// whatever
			}
		} else if (spMember.avatarUuid?.length) {
			const image = await getAvatarFromUuid(systemUid, spMember.avatarUuid);
			if (image) member.image = await resizeImage(image);
		}

		members.push(member);
		memberMapping.set(spMember._id, member.uuid);
		console.debug("[SP] Created member for:", spMember, "with UUID:", member.uuid);
	}
	// END MEMBERS

	// CUSTOM FRONTS
	for (const spCustomFront of spExport.frontStatuses) {
		console.debug("[SP] Creating member for custom front:", spCustomFront);
		const member: Member = {
			name: spCustomFront.name,
			system: systemInfo.uuid,
			description: spCustomFront.desc?.length ? spCustomFront.desc : undefined,
			color: normalizeSPColor(spCustomFront.color),
			isArchived: false,
			isCustomFront: true,
			tags: [],
			dateCreated: spCustomFront.created ? new Date(spCustomFront.created) : new Date(),
			uuid: window.crypto.randomUUID()
		};

		if (spCustomFront.avatarUrl?.length) {
			try {
				const image = new File(
					[await (await fetch(spCustomFront.avatarUrl)).blob()],
					spCustomFront.avatarUrl.split("/").pop()
				);
				member.image = await resizeImage(image);
			} catch (_e) {
				// whatever
			}
		} else if (spCustomFront.avatarUuid?.length) 
			member.image = await getAvatarFromUuid(systemUid, spCustomFront.avatarUuid);
		

		members.push(member);
		memberMapping.set(spCustomFront._id, member.uuid);
		console.debug("[SP] Created member for custom front:", spCustomFront, "with UUID:", member.uuid);
	}
	// END CUSTOM FRONTS

	return {
		members,
		memberMapping
	};
}

function frontingEntry(spExport: any, memberMapping: Map<string, string>){
	const frontingEntries: FrontingEntry[] = [];

	for (const spFrontHistory of spExport.frontHistory) {
		if (!spFrontHistory.startTime) continue; // front entries without startTime are null for us
		console.debug("[SP] Creating fronting entry for:", spFrontHistory);
		const frontingEntry: FrontingEntry = {
			member: memberMapping.get(spFrontHistory.member) || (spFrontHistory.custom ? maxUid : nilUid),
			startTime: new Date(spFrontHistory.startTime),
			endTime: spFrontHistory.endTime ? new Date(spFrontHistory.endTime) : undefined,
			customStatus: spFrontHistory.customStatus?.length ? spFrontHistory.customStatus : undefined,
			isMainFronter: false,
			isLocked: false,
			uuid: window.crypto.randomUUID(),
			comment: spExport.comments
				.filter(x => x.collection === "frontHistory" && x.documentId === spFrontHistory._id)
				.sort((a, b) => a.time - b.time)
				.map(x => `<t:${Math.round(x.time / 1000)}:f> - ${x.text}`)
				.join("\n\n")
		};

		frontingEntries.push(frontingEntry);
		console.debug("[SP] Created fronting entry for:", spFrontHistory, "with UUID:", frontingEntry.uuid);
	}

	return frontingEntries;
}

function boardMessage(spExport: any, memberMapping: Map<string, string>){
	const boardMessages: BoardMessage[] = [];

	// BOARD MESSAGES
	for (const spBoardMessage of spExport.boardMessages) {
		console.debug("[SP] Creating message board entry for:", spBoardMessage);
		const boardMessage: BoardMessage = {
			member: memberMapping.get(spBoardMessage.writtenBy) || nilUid,
			title: spBoardMessage.title,
			body: `@<m:${memberMapping.get(spBoardMessage.writtenFor)}>\n\n${spBoardMessage.message?.length ? spBoardMessage.message : ""}`,
			date: spBoardMessage.writtenAt ? new Date(spBoardMessage.writtenAt) : new Date(),
			isArchived: false,
			uuid: window.crypto.randomUUID()
		};

		boardMessages.push(boardMessage);
		console.debug("[SP] Created message board entry for:", spBoardMessage, "with UUID:", boardMessage.uuid);
	}
	// END BOARD MESSAGES

	// POLLS
	for (const spPoll of spExport.polls) {
		console.debug("[SP] Creating message board entry for poll:", spPoll);
		const boardMessage: BoardMessage = {
			member: nilUid,
			title: spPoll.name,
			body: spPoll.desc?.length ? spPoll.desc : undefined,
			date: spPoll.lastOperationTime ? new Date(spPoll.lastOperationTime) : new Date(),
			poll: {
				multipleChoice: false,
				entries: spPoll.custom
					? spPoll.options.map(x => ({
							choice: x.name,
							votes: spPoll.votes
								.filter(y => y.vote === x.name)
								.map(y => ({
									member: memberMapping.get(y.id) || nilUid,
									reason: y.comment?.length ? y.comment : undefined
								}))
						}))
					: [
							{
								choice: t("messageBoard:polls.defaultPollValues.yes"),
								votes: spPoll.votes
									.filter(x => x.vote === "yes")
									.map(x => ({
										member: memberMapping.get(x.id) || nilUid,
										reason: x.comment?.length ? x.comment : undefined
									}))
							},
							{
								choice: t("messageBoard:polls.defaultPollValues.no"),
								votes: spPoll.votes
									.filter(x => x.vote === "no")
									.map(x => ({
										member: memberMapping.get(x.id) || nilUid,
										reason: x.comment?.length ? x.comment : undefined
									}))
							},
							spPoll.allowVeto ? {
								choice: t("messageBoard:polls.defaultPollValues.veto"),
								votes: spPoll.votes
									.filter(x => x.vote === "veto")
									.map(x => ({
										member: memberMapping.get(x.id) || nilUid,
										reason: x.comment?.length ? x.comment : undefined
									}))
							} : undefined,
							spPoll.allowAbstain ? {
								choice: t("messageBoard:polls.defaultPollValues.abstain"),
								votes: spPoll.votes
									.filter(x => x.vote === "abstain")
									.map(x => ({
										member: memberMapping.get(x.id) || nilUid,
										reason: x.comment?.length ? x.comment : undefined
									}))
							} : undefined,
						].filter(Boolean)
			},
			isArchived: false,
			uuid: window.crypto.randomUUID()
		};

		boardMessages.push(boardMessage);
		console.debug("[SP] Created message board entry for poll:", spPoll, "with UUID:", boardMessage.uuid);
	}
	// END POLLS

	return boardMessages;
}

function journalPost(spExport: any, memberMapping: Map<string, string>){
	const posts: JournalPost[] = [];

	for(const spNote of spExport.notes){
		const post: JournalPost = {
			title: spNote.title || "--",
			body: spNote.note,
			member: spNote.member ? memberMapping.get(spNote.member) || nilUid : nilUid,
			tags: [],
			isPrivate: false,
			isPinned: false,
			date: new Date(spNote.date || spNote.lastOperationTime),
			uuid: window.crypto.randomUUID()
		};
		posts.push(post);
	}

	return posts;
}

function remap(
	memberMapping: Map<string, string>,
	systemInfo: System,
	members: Member[],
	boardMessages: BoardMessage[],
	posts: JournalPost[]
){
	if (systemInfo.description)
		systemInfo.description = systemInfo.description.replace(/<###@(\w+)###>/g, (_, p1) => `@<m:${memberMapping.get(p1) || nilUid}>`);

	for (const member of members) {
		if (member.description)
			member.description = member.description.replace(/<###@(\w+)###>/g, (_, p1) => `@<m:${memberMapping.get(p1) || nilUid}>`);

		if (member.customFields)
			member.customFields = new Map(Array.from(member.customFields.entries()).map(([k, v]) => [k, v.replace(/<###@(\w+)###>/g, (_, p1) => `@<m:${memberMapping.get(p1) || nilUid}>`)]));
	}

	for (const boardMessage of boardMessages) {
		if (boardMessage.body)
			boardMessage.body = boardMessage.body.replace(/<###@(\w+)###>/g, (_, p1) => `@<m:${memberMapping.get(p1) || nilUid}>`);
	}

	for (const post of posts) 
		post.body = post.body.replace(/<###@(\w+)###>/g, (_, p1) => `@<m:${memberMapping.get(p1) || nilUid}>`);
	
}

export async function importSimplyPlural(spExport: any) {
	const _system = await system(spExport);
	if(!_system) return false;
	const { systemInfo, systemUid } = _system;
	
	const { tags, tagMapping } = tag(spExport);
	const { customFields, customFieldMapping } = customField(spExport);
	const { members, memberMapping } = await member(spExport, systemInfo, systemUid, tagMapping, customFieldMapping);
	const frontingEntries = frontingEntry(spExport, memberMapping);
	const boardMessages = boardMessage(spExport, memberMapping);
	const posts = journalPost(spExport, memberMapping);

	remap(
		memberMapping,
		systemInfo, members, boardMessages, posts
	);

	try{
		// WIPE AMPERSAND
		await Promise.all(Object.values(getTables()).map(x => x.clear()));

		// ADD TO DATABASE
		const tables = getTables();
		await tables.systems.bulkAdd([systemInfo]);
		await tables.tags.bulkAdd(tags);
		await tables.customFields.bulkAdd(customFields);
		await tables.members.bulkAdd(members);
		await tables.frontingEntries.bulkAdd(frontingEntries);
		await tables.boardMessages.bulkAdd(boardMessages);
		await tables.journalPosts.bulkAdd(posts);
	}catch(_e){
		return false;
	}

	return true;
}
