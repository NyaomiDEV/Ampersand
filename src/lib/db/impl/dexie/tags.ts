import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../../events";
import { UUID, UUIDable, Tag } from "../../entities";

export function getTags(){
	return db.tags.toArray();
}

export async function newTag(tag: Omit<Tag, keyof UUIDable>) {
	try{
		const uuid = window.crypto.randomUUID();
		await db.tags.add({
			...tag,
			uuid
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "tags",
			event: "new",
			data: uuid
		}));
		return uuid;
	}catch(error){
		return false;
	}
}

export function getTag(uuid: UUID){
	return db.tags.get(uuid);
}

export async function removeTag(uuid: UUID){
	const tag = await db.tags.get(uuid);
	if(tag?.type === "member"){
		await db.members.toCollection().modify(member => {
			member.tags = member.tags?.filter(tag => tag !== uuid);
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "members",
				event: "modified",
				data: member.uuid
			}));
		});

	} else if(tag?.type === "journal") {
		await db.journalPosts.toCollection().modify(journalPost => {
			journalPost.tags = journalPost.tags?.filter(tag => tag !== uuid);
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "journalPosts",
				event: "modified",
				data: journalPost.uuid
			}));
		});
	}
	await db.tags.delete(uuid);
	DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
		table: "tags",
		event: "deleted",
		data: uuid
	}));
}

export async function updateTag(uuid: UUID, newContent: Partial<Tag>) {
	try{
		const updated = await db.tags.update(uuid, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "tags",
				event: "modified",
				data: uuid
			}));
			return true;
		}
		return false;
	}catch(error){
		return false;
	}
}

export function getTagFromNameHashtag(name: string){
	return db.tags.filter(x => x.name.toLowerCase().replace(/\s/g, "") === name.toLowerCase()).first();
}
