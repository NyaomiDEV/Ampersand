// This feels so bad to actually write.
// God..
// I hope this will end well
// Naomi Calabretta, 15 March 2026 10:35 GMT+1

import { appConfig, securityConfig } from "../../config";
import { nilUid } from "../../util/consts";
import { BoardMessage, CustomField, FrontingEntry, Member, System, Tag } from "../entities";
import { fetchImage } from "../../util/fetchImage";
import { getTables } from "../tables";

import type { OctoconExport } from "./octocon_types";

async function getImage(url?: string){
	if(!url || !securityConfig.allowRemoteContent) return undefined;
	try {
		const req = (await fetchImage(url)).blob;
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
			const isLocked = ocExport.user.fields.find(y => y.id === x.id)?.locked || false;
			return [_uuid, isLocked ? `||${x.value}||` : x.value];
		}).filter(x => !!x);
		
		if(alter.proxy_name) {
			_fields.push(
				[customFieldMapping.get("AMPERSAND_proxyname")!, alter.proxy_name]
			);
		}

		if(alter.discord_proxies?.length) {
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
									votes: poll.data.responses.filter(x => x.vote === "yes" && memberMapping.get(x.alter_id)).map(x => ({ reason: x.comment, member: memberMapping.get(x.alter_id)! }))
								},
								{
									choice: "no",
									votes: poll.data.responses.filter(x => x.vote === "no" && memberMapping.get(x.alter_id)).map(x => ({ reason: x.comment, member: memberMapping.get(x.alter_id)! }))
								},
								{
									choice: "abstain",
									votes: poll.data.responses.filter(x => x.vote === "abstain" && memberMapping.get(x.alter_id)).map(x => ({ reason: x.comment, member: memberMapping.get(x.alter_id)! }))
								},
								poll.data.allow_veto ? {
									choice: "veto",
									votes: poll.data.responses.filter(x => x.vote === "veto" && memberMapping.get(x.alter_id)).map(x => ({ reason: x.comment, member: memberMapping.get(x.alter_id)! }))
								} : undefined,
							].filter(x => x !== undefined)
						: poll.data.choice?.map(x => ({ choice: x.name, votes: poll.data.responses.filter(y => y.choice_id === x.id && memberMapping.get(y.alter_id)).map(y => ({ reason: y.comment, member: memberMapping.get(y.alter_id)! })) })) || []
			}
		});
	}

	return boardMessages;
}

export async function importOctocon(ocExport: OctoconExport){
	try {
		const _system = await system(ocExport);
		const { customFields: _customFields, customFieldMapping } = customFields(ocExport);
		const { members: _members, memberMapping } = await members(ocExport, _system, customFieldMapping);
		const _tags = tags(ocExport, _members, memberMapping);
		const _frontingEntries = frontingEntries(ocExport, memberMapping);
		const _boardMessages = polls(ocExport, memberMapping);

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