import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../../events";
import { makeUUIDv5 } from "../../../util/uuid";
import { UUIDable, JournalPost } from "../../entities";
import { getSystemUUID } from "./system";

export function getJournalPosts(){
	return db.journalPosts.toArray();
}

async function genid(name: string) {
	return makeUUIDv5((await getSystemUUID())!, `journalPosts\0${name}\0${Date.now()}`);
}

export async function newJournalPost(journalPost: Omit<JournalPost, keyof UUIDable>) {
	try{
		const uuid = await genid(journalPost.member + journalPost.title);
		await db.journalPosts.add({
			...journalPost,
			uuid
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "journalPosts",
			event: "new",
			data: uuid
		}));
		return true;
	}catch(error){
		return false;
	}
}
