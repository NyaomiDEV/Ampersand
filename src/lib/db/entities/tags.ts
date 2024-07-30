import { db } from "..";
import { makeUUIDv5 } from "../../util/uuid";
import { UUID, UUIDable } from "../types";
import { getSystemUUID } from "./system";

import { getTable as getMembers } from "./members";
import { getTable as getJournalPosts } from "./journalPosts";
import { liveQuery } from "dexie";
import { useObservable, from } from "@vueuse/rxjs";
import { ref, Ref, watch } from "vue";

export type Tag = UUIDable & {
	name: string,
	type: "member" | "journal",
	color?: string
}

export function getTable() {
	return db.tags;
}

export const tags: Ref<Tag[]> = ref([]);

export async function updateTagsRef() {
	tags.value = await getTable().toArray();
}

watch([useObservable(from(liveQuery(() => getTable().toArray())))], updateTagsRef, { immediate: true });


function genid(name: string) {
	return makeUUIDv5(getSystemUUID(), `tags\0${name}`);
}

export async function newTag(tag: Omit<Tag, keyof UUIDable>) {
	const uuid = genid(tag.name);
	return await getTable().add({
		...tag,
		uuid
	});
}

export async function removeTag(uuid: UUID){
	const tag = await getTable().get(uuid);
	if(tag?.type === "member"){
		await getMembers().toCollection().modify(member => {
			member.tags = member.tags?.filter(tag => tag !== uuid)
		});
	} else if(tag?.type === "journal") {
		await getJournalPosts().toCollection().modify(journalPost => {
			journalPost.tags = journalPost.tags?.filter(tag => tag !== uuid)
		});
	}
	await getTable().delete(uuid);
}

export async function getTagFromName(name: string){
	return await getTable().get({ name });
}