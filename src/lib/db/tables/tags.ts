import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUID, UUIDable, Tag } from "../entities";
import { filterTag } from "../../search";
import { deleteMemberTag, getMemberTags } from "./memberTags";
import { deleteJournalPostTag, getJournalPostTags } from "./journalPostTags";

export function getTags(){
	return db.tags.iterate();
}

export async function* getFilteredTags(query: string){
	for await (const tag of getTags()){
		if(filterTag(query, tag))
			yield tag;
	}
}

export async function newTag(tag: Omit<Tag, keyof UUIDable>) {
	try{
		const id = window.crypto.randomUUID();
		await db.tags.add(id, {
			...tag,
			id
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "tags",
			event: "new",
			id,
			newData: tag
		}));
		return {
			...tag,
			id
		};
	}catch(_error){
		return;
	}
}

export function getTag(uuid: UUID){
	return db.tags.get(uuid);
}

export async function removeTag(id: UUID){
	// TODO: should we do this here?
	const tag = await db.tags.get(id);
	if(tag.type === 0){
		for await(const tag of getMemberTags()){
			if(tag.tag.id === id)
				await deleteMemberTag(tag.id);
		}
	} else if(tag?.type === 1) {
		for await (const tag of getJournalPostTags()) {
			if (tag.tag.id === id)
				await deleteJournalPostTag(tag.id);
		}
	}
	// END TODO
	await db.tags.delete(id);
	DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
		table: "tags",
		event: "deleted",
		id,
		delta: {}
	}));
}

export async function updateTag(id: UUID, newContent: Partial<Tag>) {
	try{
		const updated = await db.tags.update(id, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "tags",
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

export async function getTagFromNameHashtag(name: string){
	for await (const x of db.tags.iterate()){
		if(
			x.name.toLowerCase().replace(/\s/g, "") === name.toLowerCase()
		) return x;
	}
	return;
}
