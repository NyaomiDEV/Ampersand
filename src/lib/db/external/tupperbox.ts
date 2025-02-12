import { Member, System, Tag } from "../entities";
import { PartialBy } from "../../types";
import { newSystem } from "../tables/system";
import { getTables } from "..";
import { newTag } from "../tables/tags";
import { newMember } from "../tables/members";
import { isTauri } from "../../mode";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

const fetch = isTauri() ? tauriFetch : window.fetch;

export async function importTupperBox(tuExport: any){
	// WIPE AMPERSAND
	await Promise.all(getTables().map(async x => x.clear()));

	// SYSTEM
	const systemInfo: PartialBy<System, "uuid"> = {
		name: "",
		description: "",
	}
	await newSystem(systemInfo);

	// TAGS
	const tagMapping = new Map<number, string>();
	for (const tuGroup of tuExport.groups) {
		const tag: PartialBy<Tag, "uuid"> = {
			name: tuGroup.name,
			description: tuGroup.description || undefined,
			type: "member"
		};
		const uuid = await newTag(tag);
		if(!uuid) return false;
		tagMapping.set(tuGroup.id, uuid);
	}

	// MEMBERS
	for (const tuMember of tuExport.tuppers) {
		const member: PartialBy<Member, "uuid"> = {
			name: tuMember.name,
			description: tuMember.description || undefined,
			pronouns: tuMember.pronouns || undefined,
			isArchived: false,
			isCustomFront: false,
			dateCreated: new Date(tuMember.created_at),
			tags: tuMember.group_id ? [tagMapping.get(tuMember.group_id)!] : []
		}
		if (tuMember.avatar_url) {
			try{
				const request = await fetch(tuMember.avatar_url);
				member.image = new File([await request.blob()], tuMember.avatar_url.split("/").pop());
			}catch(e){
				// whatever, again
			}
		}
		const uuid = await newMember(member);
		if(!uuid) return false;
	}

	return true;
}
