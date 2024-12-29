import { db } from ".";
import { makeUUIDv5 } from "../../../util/uuid";
import { UUIDable, JournalPost } from "../../entities";
import { getSystemUUID } from "./system";

export function getJournalPostsTable() {
	return db.journalPosts;
}

async function genid(name: string) {
	return makeUUIDv5((await getSystemUUID())!, `journalPosts\0${name}`);
}

export async function newJournalPost(journalPost: Omit<JournalPost, keyof UUIDable>) {
	const uuid = await genid(journalPost.member + journalPost.title);
	return await getJournalPostsTable().add({
		...journalPost,
		uuid
	});
}
