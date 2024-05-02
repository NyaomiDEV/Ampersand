import { db } from "..";
import { makeUUIDv5 } from "../../util/uuid";
import { UUID, UUIDable } from "../types";
import { getSystemUUID } from "./system";

export type JournalPost = UUIDable & {
	member: UUID,
	date: Date,
	title: string,
	body: string,
	cover?: File,
	attachments?: Attachment[]
}

export type Attachment = UUIDable & {
	name: string,
	file: File
}

export function getTable() {
	return db.journalPosts;
}

function genid(name: string) {
	return makeUUIDv5(getSystemUUID(), `journalPosts\0${name}`);
}

export async function newJournalPost(journalPost: Omit<JournalPost, keyof UUIDable>) {
	const uuid = genid(journalPost.member + journalPost.title);
	return await getTable().add({
		...journalPost,
		uuid
	});
}
