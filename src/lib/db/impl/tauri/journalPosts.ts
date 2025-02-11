import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../../events";
import { UUIDable, JournalPost } from "../../entities";

export function getJournalPosts(){
	return db.journalPosts.toArray();
}

export async function newJournalPost(journalPost: Omit<JournalPost, keyof UUIDable>) {
	try{
		const uuid = window.crypto.randomUUID();
		await db.journalPosts.add(uuid, {
			...journalPost,
			uuid
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "journalPosts",
			event: "new",
			data: uuid
		}));
		return uuid;
	}catch(error){
		return false;
	}
}
