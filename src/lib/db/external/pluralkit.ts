import { FrontingEntry, Member, System, Tag } from "../entities";
import { PartialBy } from "../../types";
import { newSystem } from "../tables/system";
import { getTables } from "..";
import { newTag } from "../tables/tags";
import { newMember } from "../tables/members";
import { newFrontingEntry } from "../tables/frontingEntries";
import { isTauri } from "../../mode";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

const fetch = isTauri() ? tauriFetch : window.fetch;

export async function importPluralKit(pkExport: any){
	// WIPE AMPERSAND
	await Promise.all(getTables().map(async x => x.clear()));

	// SYSTEM
	const systemInfo: PartialBy<System, "uuid"> = {
		name: pkExport.name,
		description: pkExport.description,
	}
	if (pkExport.avatar_url) {
		try{
			const request = await fetch(pkExport.avatar_url);
			systemInfo.image = new File([await request.blob()], pkExport.avatar_url.split("/").pop());
		}catch(e) {
			// whatever
		}
	}
	await newSystem(systemInfo);

	// TAGS
	const tagMapping = new Map<string, string>();
	for (const pkGroup of pkExport.groups) {
		const tag: PartialBy<Tag, "uuid"> = {
			name: pkGroup.display_name || pkGroup.name,
			description: pkGroup.description || undefined,
			color: pkGroup.color ? "#" + pkGroup.color : undefined,
			type: "member"
		};
		const uuid = await newTag(tag);
		if(!uuid) return false;
		tagMapping.set(pkGroup.id, uuid);
	}

	// MEMBERS
	const memberMapping = new Map<string, string>();
	for (const pkMember of pkExport.members) {
		const member: PartialBy<Member, "uuid"> = {
			name: pkMember.display_name || pkMember.name,
			description: pkMember.description || undefined,
			pronouns: pkMember.pronouns || undefined,
			color: pkMember.color ? "#" + pkMember.color : undefined,
			isArchived: false,
			isCustomFront: false,
			dateCreated: new Date(pkMember.created),
			tags: pkExport.groups.filter(x => x.members.includes(pkMember.id)).map(x => tagMapping.get(x.id))
		}
		if (pkMember.avatar_url) {
			try{
				const request = await fetch(pkMember.avatar_url);
				member.image = new File([await request.blob()], pkMember.avatar_url.split("/").pop());
			}catch(e){
				// whatever, again
			}
		}
		const uuid = await newMember(member);
		if(!uuid) return false;
		memberMapping.set(pkMember.id, uuid);
	}

	// FRONTING ENTRIES
	const frontingEntries = new Map<string, PartialBy<FrontingEntry, "uuid">>();
	for(const pkSwitch of pkExport.switches.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())){
		const date = new Date(pkSwitch.timestamp);

		// check who left
		for(const id of frontingEntries.keys()){
			if(!pkSwitch.members.includes(id)){
				const frontingEntry = frontingEntries.get(id)!;
				frontingEntry.endTime = date;
				await newFrontingEntry(frontingEntry);
				frontingEntries.delete(id);
			}
		}

		// check who's new
		for(const id of pkSwitch.members){
			if(!frontingEntries.has(id)){
				const frontingEntry: PartialBy<FrontingEntry, "uuid"> = {
					member: memberMapping.get(id)!,
					startTime: date,
					isMainFronter: false
				}
				frontingEntries.set(id, frontingEntry);
			}
		}

	}
	for(const frontingEntry of frontingEntries.values()){
		await newFrontingEntry(frontingEntry);
	}

	return true;
}
