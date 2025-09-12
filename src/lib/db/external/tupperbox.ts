/* eslint-disable @typescript-eslint/no-explicit-any */

import { Member, Tag, System } from "../entities";
import { getTables } from "../tables";
import { fetch } from "@tauri-apps/plugin-http";

function tag(tuExport: any){
	const tagMapping = new Map<number, string>();
	const tags: Tag[] = [];
	for (const tuGroup of tuExport.groups) {
		const tag: Tag = {
			name: tuGroup.name,
			description: tuGroup.description || undefined,
			type: "member",
			viewInLists: false,
			uuid: window.crypto.randomUUID()
		};
		tags.push(tag);
		tagMapping.set(tuGroup.id, tag.uuid);
	}

	return {
		tags,
		tagMapping
	};
}

async function member(tuExport: any, tagMapping: Map<number, string>){
	const members: Member[] = [];

	for (const tuMember of tuExport.tuppers) {
		const member: Member = {
			name: tuMember.name,
			description: tuMember.description || undefined,
			pronouns: tuMember.pronouns || undefined,
			isArchived: false,
			isCustomFront: false,
			dateCreated: new Date(tuMember.created_at),
			tags: tuMember.group_id ? [tagMapping.get(tuMember.group_id)!] : [],
			uuid: window.crypto.randomUUID()
		};
		if (tuMember.avatar_url) {
			try {
				const request = await fetch(tuMember.avatar_url);
				member.image = new File([await request.blob()], (tuMember.avatar_url as string).split("/").pop()!);
			} catch (_e) {
				// whatever, again
			}
		}
		// This is assumed as we cannot subscribe to TupperBox Premium to figure out the exact format
		if (tuMember.banner) {
			try {
				const request = await fetch(tuMember.banner);
				member.cover = new File([await request.blob()], (tuMember.banner as string).split("/").pop()!);
			} catch (_e) {
				// whatever, again
			}
		}
		members.push(member);
	}

	return members;
}

export async function importTupperBox(tuExport: any){
	const { tags, tagMapping } = tag(tuExport);
	const members = await member(tuExport, tagMapping);

	try {
		// WIPE AMPERSAND
		await Promise.all(Object.values(getTables()).map(x => x.clear()));

		// ADD TO DATABASE
		const tables = getTables();
		await tables.system.bulkAdd([{
			name: "",
			description: "",
			uuid: window.crypto.randomUUID()
		}] as System[]);
		await tables.tags.bulkAdd(tags);
		await tables.members.bulkAdd(members);
	}catch(e){
		console.error(e);
		return false;
	}

	return true;
}
