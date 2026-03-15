// This feels so bad to actually write.
// God..
// I hope this will end well
// Naomi Calabretta, 15 March 2026 10:35 GMT+1

import { appConfig, securityConfig } from "../../config";
import { nilUid } from "../../util/consts";
import { BoardMessage, CustomField, FrontingEntry, Member, System, Tag } from "../entities";
import { fetch } from "@tauri-apps/plugin-http";
import { getTables } from "../tables";

type OctoconExport = {
	user: OctoconUser,
	alters: OctoconAlter[],
	fronts: OctoconFront[],
	tags: OctoconTag[],
	polls: OctoconPoll[]
};

type OctoconUser = {
	id: string, // 7 characters, lowercase, alphabetical
	username?: string,
	description?: string,
	avatar_url?: string,
	fields: OctoconUserField[]
};

type OctoconUserField = {
	id: string,
	name: string,
	type: "text" | "number" | "boolean",
	locked: boolean,
	security_level: "private" | "trusted_only" | "friends_only" | "public"
};

type OctoconAlter = {
	id: number,
	name?: string, // Alters will have null names -> Unnamed alter
	pronouns?: string,
	description?: string,
	color?: string, // HEX RGB (without alpha)
	avatar_url?: string,
	proxy_name?: string,
	discord_proxies: string[], // "prefix-text-suffix"
	fields: OctoconAlterField[]
};

type OctoconAlterField = {
	id: string, // same as OctoconUserField.id
	value: string // always a string, we should parse them afterwards
};

type OctoconFront = {
	id: string,
	alter_id: number, // same as OctoconAlter.id
	comment?: string,
	time_start: string, // UTC ISO-8601, without final Z it seems? Elixir what
	time_end?: string
};

type OctoconTag = {
	id: string,
	name: string,
	description?: string,
	color?: string, // HEX RGB (without alpha)
	security_level: "private" | "trusted_only" | "friends_only" | "public",
	parent_tag_id?: string,
	alters: number[]
};

type OctoconPoll = {
	id: string,
	title: string,
	description: string,
	type: "vote" | "choice",
	data: OctoconPollData,
	time_end?: string, // UTC ISO-8601, without final Z it seems? Elixir what
	inserted_at: string, // UTC ISO-8601, without final Z it seems? Elixir what
	updated_at: string // UTC ISO-8601, without final Z it seems? Elixir what
};

type OctoconPollData = {
	allow_veto?: boolean, // only when poll type is vote
	choice?: OctoconPollChoice[], // only when poll type is choice
	responses: OctoconPollResponse[]
};

type OctoconPollChoice = {
	id: string,
	name: string
};

type OctoconPollResponse = {
	alter_id: number, // related to OctoconAlter.id,
	comment?: string,
	vote?: "yes" | "no" | "abstain" | "veto", // only when poll type is vote
	choice_id?: string // related to OctoconPollChoice.id and only when poll type is choice
};

async function getImage(url?: string){
	if(!url || !securityConfig.allowRemoteContent) return undefined;
	try {
		const req = await (await fetch(url)).blob();
		return new File([req], new URL(url).pathname.split("/").pop()!);
	}catch(_e){
		return undefined;
	}
}

async function system(ocExport: OctoconExport){
	return {
		uuid: window.crypto.randomUUID(),
		name: ocExport.user.username || ocExport.user.id,
		description: ocExport.user.description,
		image: await getImage(ocExport.user.avatar_url),
		isPinned: false,
		isArchived: false
	} as System;
}

function customFields(ocExport: OctoconExport){
	const customFieldMapping = new Map<string, string>();
	const customFields: CustomField[] = [];

	for(const field of ocExport.user.fields){
		const uuid = window.crypto.randomUUID();
		customFields.push({
			uuid,
			name: field.name,
			default: false,
			priority: 1
		});
		customFieldMapping.set(field.id, uuid);
	}

	// Make two custom fields for data preservation
	let uuid = window.crypto.randomUUID();
	customFields.push({
		uuid,
		name: "Proxy name",
		default: false,
		priority: 2
	});
	customFieldMapping.set("AMPERSAND_proxyname", uuid);

	uuid = window.crypto.randomUUID();
	customFields.push({
		uuid: window.crypto.randomUUID(),
		name: "Proxy tags",
		default: false,
		priority: 2
	});
	customFieldMapping.set("AMPERSAND_proxytags", uuid);

	return { customFields, customFieldMapping };
}

function tags(ocExport: OctoconExport, members: Member[], memberMapping: Map<number, string>){
	const tags: Tag[] = [];
	
	for(const tag of ocExport.tags){
		const uuid = window.crypto.randomUUID();
		tags.push({
			uuid,
			name: tag.name,
			color: tag.color,
			description: tag.description,
			type: "member",
			viewInLists: false
		});

		for(const alterId of tag.alters){
			const _uuid = memberMapping.get(alterId);
			if(!_uuid) continue; // wtf? should never happen

			const member = members.find(x => x.uuid === _uuid);
			if(!member) continue; // wtf? should never happen

			member.tags.push(uuid);
		}
	}

	return tags;
}

async function members(ocExport: OctoconExport, system: System, customFieldMapping: Map<string, string>){
	const memberMapping = new Map<number, string>();
	const members: Member[] = [];

	for(const alter of ocExport.alters){
		const _fields = alter.fields.map(x => {
			const _uuid = customFieldMapping.get(x.id);
			if (!_uuid) return undefined;

			return [_uuid, x.value];
		}).filter(x => !!x);
		
		if(alter.proxy_name) {
			_fields.push(
				[customFieldMapping.get("AMPERSAND_proxyname")!, alter.proxy_name]
			);
		}

		if(alter.discord_proxies.length) {
			_fields.push(
				[customFieldMapping.get("AMPERSAND_proxytags")!, alter.discord_proxies.join("\n")]
			);
		}

		const uuid = window.crypto.randomUUID();
		members.push({
			uuid,
			image: await getImage(alter.avatar_url),
			name: alter.name || "Unnamed member",
			pronouns: alter.pronouns,
			description: alter.description,
			system: system.uuid,
			color: alter.color,
			isArchived: false,
			isPinned: false,
			isCustomFront: false,
			dateCreated: new Date(),
			tags: [],
			customFields: new Map(_fields as [string, string][])
		});
		memberMapping.set(alter.id, uuid);
	}

	return { members, memberMapping };
}

function frontingEntries(ocExport: OctoconExport, memberMapping: Map<number, string>){
	const frontingEntries: FrontingEntry[] = [];
	for(const front of ocExport.fronts){
		frontingEntries.push({
			uuid: window.crypto.randomUUID(),
			member: memberMapping.get(front.alter_id) || nilUid,
			startTime: new Date(front.time_start),
			endTime: front.time_end ? new Date(front.time_end) : undefined,
			comment: front.comment,
			isMainFronter: false,
			isLocked: false
		});
	}

	return frontingEntries;
}

function polls(ocExport: OctoconExport, memberMapping: Map<number, string>){
	const boardMessages: BoardMessage[] = [];
	for(const poll of ocExport.polls){
		boardMessages.push({
			uuid: window.crypto.randomUUID(),
			title: poll.title,
			body: poll.description,
			date: new Date(poll.inserted_at),
			isPinned: false,
			isArchived: false,
			poll: {
				multipleChoice: false,
				entries:
					poll.type === "vote"
						? [
								{
									choice: "yes",
									votes: poll.data.responses.filter(x => x.vote === "yes").map(x => ({ reason: x.comment, member: memberMapping.get(x.alter_id)! }))
								},
								{
									choice: "no",
									votes: poll.data.responses.filter(x => x.vote === "no").map(x => ({ reason: x.comment, member: memberMapping.get(x.alter_id)! }))
								},
								{
									choice: "abstain",
									votes: poll.data.responses.filter(x => x.vote === "abstain").map(x => ({ reason: x.comment, member: memberMapping.get(x.alter_id)! }))
								},
								poll.data.allow_veto ? {
									choice: "veto",
									votes: poll.data.responses.filter(x => x.vote === "veto").map(x => ({ reason: x.comment, member: memberMapping.get(x.alter_id)! }))
								} : undefined,
							].filter(x => x !== undefined)
						: poll.data.choice?.map(x => ({ choice: x.name, votes: poll.data.responses.filter(y => y.choice_id === x.id).map(y => ({ reason: y.comment, member: memberMapping.get(y.alter_id)! })) })) || []
			}
		});
	}

	return boardMessages;
}

export async function importOctocon(ocExport: OctoconExport){
	const _system = await system(ocExport);
	const { customFields: _customFields, customFieldMapping } = customFields(ocExport);
	const { members: _members, memberMapping } = await members(ocExport, _system, customFieldMapping);
	const _tags = tags(ocExport, _members, memberMapping);
	const _frontingEntries = frontingEntries(ocExport, memberMapping);
	const _boardMessages = polls(ocExport, memberMapping);

	try {
		// WIPE AMPERSAND
		await Promise.all(Object.values(getTables()).map(x => x.clear()));

		// ADD TO DATABASE
		const tables = getTables();
		await tables.customFields.bulkAdd(_customFields);
		await tables.systems.bulkAdd([_system]);
		appConfig.defaultSystem = _system.uuid;
		await tables.tags.bulkAdd(_tags);
		await tables.members.bulkAdd(_members);
		await tables.frontingEntries.bulkAdd(_frontingEntries);
		await tables.boardMessages.bulkAdd(_boardMessages);
	} catch (e) {
		console.error(e);
		return false;
	}

	return true;
}