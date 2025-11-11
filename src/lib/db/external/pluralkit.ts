/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { CustomField, FrontingEntry, Member, System, Tag } from "../entities";
import { getTables } from "../tables";
import { fetch } from "@tauri-apps/plugin-http";
import { nilUid } from "../../util/misc";

function pkCustomField(): CustomField {
	return {
		uuid: window.crypto.randomUUID(),
		name: "PluralKit ID",
		priority: 1,
		default: false
	};
}

async function system(pkExport: any){
	const systemInfo: System = {
		name: pkExport.name,
		description: pkExport.description,
		uuid: window.crypto.randomUUID()
	};
	if (pkExport.avatar_url) {
		try {
			const request = await fetch(pkExport.avatar_url);
			systemInfo.image = new File([await request.blob()], (pkExport.avatar_url as string).split("/").pop()!);
		} catch (_e) {
			// whatever
		}
	}

	return systemInfo;
}

function tag(pkExport: any){
	const tagMapping = new Map<string, string>();
	const tags: Tag[] = [];

	for (const pkGroup of pkExport.groups) {
		const tag: Tag = {
			name: pkGroup.display_name || pkGroup.name,
			description: pkGroup.description || undefined,
			color: pkGroup.color ? `#${pkGroup.color}` : undefined,
			type: "member",
			viewInLists: false,
			uuid: window.crypto.randomUUID()
		};
		tags.push(tag);
		tagMapping.set(pkGroup.id, tag.uuid);
	}

	return {
		tags,
		tagMapping
	};
}

async function member(pkExport: any, tagMapping: Map<string, string>, systemInfo: System, pkField: CustomField) {
	const memberMapping = new Map<string, string>();
	const members: Member[] = [];

	for (const pkMember of pkExport.members) {
		const member: Member = {
			name: pkMember.display_name || pkMember.name,
			system: systemInfo.uuid,
			description: pkMember.description || undefined,
			pronouns: pkMember.pronouns || undefined,
			color: pkMember.color ? `#${pkMember.color}` : undefined,
			isArchived: false,
			isCustomFront: false,
			dateCreated: new Date(pkMember.created),
			tags: pkExport.groups.filter(x => (x.members as string[]).includes(pkMember.id)).map(x => tagMapping.get(x.id)),
			customFields: new Map([[pkField.uuid, pkMember.id]]),
			uuid: window.crypto.randomUUID()
		};
		if (pkMember.avatar_url) {
			try {
				const request = await fetch(pkMember.avatar_url);
				member.image = new File([await request.blob()], pkMember.avatar_url.split("/").pop());
			} catch (_e) {
				// whatever, again
			}
		}
		if (pkMember.banner) {
			try {
				const request = await fetch(pkMember.banner);
				member.cover = new File([await request.blob()], pkMember.banner.split("/").pop());
			} catch (_e) {
				// whatever, again
			}
		}
		members.push(member);
		memberMapping.set(pkMember.id, member.uuid);
	}

	return {
		members,
		memberMapping
	};
}

function frontingEntry(pkExport: any, memberMapping: Map<string, string>){
	const trackedFronting = new Map<string, FrontingEntry>();
	const frontingEntries: FrontingEntry[] = [];

	for (const pkSwitch of pkExport.switches.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())) {
		const date = new Date(pkSwitch.timestamp);

		// check who left
		for (const id of trackedFronting.keys()) {
			if (!pkSwitch.members.includes(id)) {
				const frontingEntry = trackedFronting.get(id)!;
				frontingEntry.endTime = date;
				frontingEntries.push(frontingEntry);
				trackedFronting.delete(id);
			}
		}

		// check who's new
		for (const id of pkSwitch.members) {
			if (!trackedFronting.has(id)) {
				const frontingEntry: FrontingEntry = {
					member: memberMapping.get(id) || nilUid,
					startTime: date,
					isMainFronter: false,
					isLocked: false,
					uuid: window.crypto.randomUUID()
				};
				trackedFronting.set(id, frontingEntry);
			}
		}
	}

	// push whatever is still in the tracking map
	for (const frontingEntry of trackedFronting.values())
		frontingEntries.push(frontingEntry);

	return frontingEntries;
}

export async function importPluralKit(pkExport: any){
	const field = pkCustomField();
	const systemInfo = await system(pkExport);
	const { tags, tagMapping } = tag(pkExport);
	const { members, memberMapping } = await member(pkExport, tagMapping, systemInfo, field);
	const frontingEntries = frontingEntry(pkExport, memberMapping);

	try {
		// WIPE AMPERSAND
		await Promise.all(Object.values(getTables()).map(x => x.clear()));

		// ADD TO DATABASE
		const tables = getTables();
		await tables.customFields.bulkAdd([field]);
		await tables.systems.bulkAdd([systemInfo]);
		await tables.tags.bulkAdd(tags);
		await tables.members.bulkAdd(members);
		await tables.frontingEntries.bulkAdd(frontingEntries);
	} catch (e) {
		console.error(e);
		return false;
	}

	return true;
}
