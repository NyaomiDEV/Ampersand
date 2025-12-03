import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUID, UUIDable, JournalPostTag, JournalPost, Tag } from "../entities";

export function getJournalPostTags(){
	return db.journalPostTags.iterate();
}

export async function* getJournalPostTagsForPost(journalPost: JournalPost){
	for await (const entry of getJournalPostTags()){
		if(entry.post.id === journalPost.id)
			yield entry;
	}
}

export async function journalPostHasTag(journalPost: JournalPost, tag: Tag){
	for await (const entry of getJournalPostTags()){
		if(entry.post.id === journalPost.id && entry.tag.id === tag.id)
			return true;
	}

	return false;
}

export async function newJournalPostTag(journalPostTag: Omit<JournalPostTag, keyof UUIDable>) {
	try{
		const id = window.crypto.randomUUID();
		await db.journalPostTags.add(id, {
			...journalPostTag,
			id
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "journalPostTags",
			event: "new",
			id,
			newData: journalPostTag
		}));
		return {
			...journalPostTag,
			id
		};
	}catch(_error){
		return;
	}
}

export async function deleteJournalPostTag(id: UUID) {
	try {
		await db.journalPostTags.delete(id);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "journalPostTags",
			event: "deleted",
			id,
			delta: {}
		}));
		return true;
	} catch (_error) {
		return false;
	}
}

export async function updateJournalPostTag(id: UUID, newContent: Partial<JournalPostTag>) {
	try{
		const updated = await db.journalPostTags.update(id, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "journalPostTags",
				event: "modified",
				id,
				delta: newContent,
				oldData: updated.oldData,
				newData: updated.newData
			}));
			return true;
		}
		return false;
	}catch(_error){
		return false;
	}
}