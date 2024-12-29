import { db } from ".";
import { makeUUIDv5 } from "../../../util/uuid";
import { UUID, UUIDable, Tag } from "../../entities";
import { getSystemUUID } from "./system";

import { getMembersTable } from "./members";
import { getJournalPostsTable } from "./journalPosts";

export function getTagsTable() {
	return db.tags;
}

async function genid(name: string) {
	return makeUUIDv5((await getSystemUUID())!, `tags\0${name}`);
}

export async function newTag(tag: Omit<Tag, keyof UUIDable>) {
	const uuid = await genid(tag.name);
	return await getTagsTable().add({
		...tag,
		uuid
	});
}

export async function removeTag(uuid: UUID){
	const tag = await getTagsTable().get(uuid);
	if(tag?.type === "member"){
		await getMembersTable().toCollection().modify(member => {
			member.tags = member.tags?.filter(tag => tag !== uuid)
		});
	} else if(tag?.type === "journal") {
		await getJournalPostsTable().toCollection().modify(journalPost => {
			journalPost.tags = journalPost.tags?.filter(tag => tag !== uuid)
		});
	}
	await getTagsTable().delete(uuid);
}

export async function getTagFromNameHashtag(name: string){
	return await getTagsTable().filter(x => x.name.toLowerCase().replace(/\s/g, "") === name.toLowerCase()).first();
}
