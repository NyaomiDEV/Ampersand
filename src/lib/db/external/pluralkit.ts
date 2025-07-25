import { FrontingEntry, Member, System, Tag } from "../entities";
import { getTables } from "..";
import { fetch } from "@tauri-apps/plugin-http";
import { nilUid } from "../../util/misc";

async function system(pkExport: any){
	const systemInfo: System = {
		name: pkExport.name,
		description: pkExport.description,
		uuid: window.crypto.randomUUID()
	};
	if (pkExport.avatar_url) {
		try {
			const request = await fetch(pkExport.avatar_url);
			systemInfo.image = new File([await request.blob()], pkExport.avatar_url.split("/").pop());
		} catch (e) {
			// whatever
		}
	}

	return systemInfo;
}

async function tag(pkExport: any){
	const tagMapping = new Map<string, string>();
	const tags: Tag[] = [];

	for (const pkGroup of pkExport.groups) {
		const tag: Tag = {
			name: pkGroup.display_name || pkGroup.name,
			description: pkGroup.description || undefined,
			color: pkGroup.color ? "#" + pkGroup.color : undefined,
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

async function member(pkExport: any, tagMapping: Map<string, string>) {
	const memberMapping = new Map<string, string>();
	const members: Member[] = [];

	for (const pkMember of pkExport.members) {
		const member: Member = {
			name: pkMember.display_name || pkMember.name,
			description: pkMember.description || undefined,
			pronouns: pkMember.pronouns || undefined,
			color: pkMember.color ? "#" + pkMember.color : undefined,
			isArchived: false,
			isCustomFront: false,
			dateCreated: new Date(pkMember.created),
			tags: pkExport.groups.filter(x => x.members.includes(pkMember.id)).map(x => tagMapping.get(x.id)),
			uuid: window.crypto.randomUUID()
		};
		if (pkMember.avatar_url) {
			try {
				const request = await fetch(pkMember.avatar_url);
				member.image = new File([await request.blob()], pkMember.avatar_url.split("/").pop());
			} catch (e) {
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

async function frontingEntry(pkExport: any, memberMapping: Map<string, string>){
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
	const systemInfo = await system(pkExport);
	const { tags, tagMapping } = await tag(pkExport);
	const { members, memberMapping } = await member(pkExport, tagMapping);
	const frontingEntries = await frontingEntry(pkExport, memberMapping);

	try {
		// WIPE AMPERSAND
		await Promise.all(Object.values(getTables()).map(x => x.clear()));

		// ADD TO DATABASE
		const tables = getTables();
		await tables.system.bulkAdd([systemInfo]);
		await tables.tags.bulkAdd(tags);
		await tables.members.bulkAdd(members);
		await tables.frontingEntries.bulkAdd(frontingEntries);
	} catch (e) {
		console.error(e);
		return false;
	}

	return true;
}
