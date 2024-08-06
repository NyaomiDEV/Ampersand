import { db } from "..";
import { makeUUIDv5 } from "../../util/uuid";
import { UUID, UUIDable } from "../types";
import { getSystemUUID } from "./system";

import { getMembersTable as getMembers } from "./members";
import { getJournalPostsTable as getJournalPosts } from "./journalPosts";
import { liveQuery } from "dexie";
import { useObservable, from } from "@vueuse/rxjs";
import { Ref, shallowRef, watch } from "vue";

export type Tag = UUIDable & {
	name: string,
	description?: string,
	type: "member" | "journal",
	color?: string
}

export function getTagsTable() {
	return db.tags;
}

export const tags: Ref<Tag[]> = shallowRef([]);

export async function updateTagsRef() {
	tags.value = await getTagsTable().toArray();
}

watch(useObservable(from(liveQuery(() => getTagsTable().toArray()))), updateTagsRef, { immediate: true });


function genid(name: string) {
	return makeUUIDv5(getSystemUUID(), `tags\0${name}`);
}

export async function newTag(tag: Omit<Tag, keyof UUIDable>) {
	const uuid = genid(tag.name);
	return await getTagsTable().add({
		...tag,
		uuid
	});
}

export async function removeTag(uuid: UUID){
	const tag = await getTagsTable().get(uuid);
	if(tag?.type === "member"){
		await getMembers().toCollection().modify(member => {
			member.tags = member.tags?.filter(tag => tag !== uuid)
		});
	} else if(tag?.type === "journal") {
		await getJournalPosts().toCollection().modify(journalPost => {
			journalPost.tags = journalPost.tags?.filter(tag => tag !== uuid)
		});
	}
	await getTagsTable().delete(uuid);
}

export async function getTagFromNameHashtag(name: string){
	return await getTagsTable().filter(x => x.name.toLowerCase().replace(/\s/g, "") === name.toLowerCase()).first();
}
