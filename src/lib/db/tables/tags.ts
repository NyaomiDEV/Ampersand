import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUID, UUIDable, Tag } from "../entities";
import { filterTag } from "../../search";
import { getMembers, updateMember } from "./members";
import { getJournalPosts, updateJournalPost } from "./journalPosts";
import { TransactionStatus } from "../types";
import { sortName } from "../../util/misc";

export async function* getTags(maxIter = 20){
	const uuids = db.tags.index.sort(sortName).map(x => x.uuid);
	
	const f = (offset: number, maxIter: number) => {
		const chunk: Promise<Tag>[] = [];
		for (let i = offset; i < offset + maxIter; i++) {
			if (uuids[i]) {
				const data = db.tags.get(uuids[i]);
				chunk.push(data);
			}
		}
		return chunk;
	};
	
	let offset = 0;
	while (offset < uuids.length) {
		const promises = f(offset, maxIter);
		offset += maxIter;
		for (const promise of promises)
			yield await promise;
	};
}

export async function* getFilteredTags(query: string){
	for await (const tag of getTags()){
		if(filterTag(query, tag))
			yield tag;
	}
}

export async function newTag(tag: Omit<Tag, keyof UUIDable>): Promise<TransactionStatus<string>> {
	try{
		const uuid = window.crypto.randomUUID();
		await db.tags.add({
			...tag,
			uuid
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "tags",
			event: "new",
			uuid,
			newData: tag
		}));
		return { success: true, detail: uuid };
	}catch(_e){
		console.error(_e);
		return { success: false, err: _e };
	}
}

export function getTag(uuid: UUID){
	return db.tags.get(uuid);
}

export async function removeTag(uuid: UUID): Promise<TransactionStatus<void>> {
	try {
		const tag = await db.tags.get(uuid);

		switch(tag.type){
			case "member":
				for await (const member of getMembers()) {
					if (!member.tags.includes(uuid)) continue;

					const delta = { uuid: member.uuid, tags: member.tags.filter(tag => tag !== uuid) };
					await updateMember(delta);	
				}
				break;
			case "journal":
				for await (const journalPost of getJournalPosts()) {
					if(!journalPost.tags.includes(uuid)) continue;

					const delta = { uuid: journalPost.uuid, tags: journalPost.tags.filter(tag => tag !== uuid) };
					await updateJournalPost(delta);
				}
				break;
		}

		await db.tags.delete(uuid);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "tags",
			event: "deleted",
			uuid,
			delta: {}
		}));

		return { success: true };
	} catch(_e){
		console.error(_e);
		return { success: false, err: _e };
	}
}

export async function updateTag(newContent: UUIDable & Partial<Tag>): Promise<TransactionStatus<{ oldData: Tag, newData: Tag }>> {
	try{
		const updated = await db.tags.update(newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "tags",
				event: "modified",
				uuid: newContent.uuid,
				delta: newContent,
				oldData: updated.oldData,
				newData: updated.newData
			}));
			return { success: true, detail: updated };
		}
		throw new Error("not updated, did not exist in db");
	}catch(_e){
		console.error(_e);
		return { success: false, err: _e };
	}
}

export async function getTagFromName(name: string, allAttached: boolean){
	for (const x of db.tags.index){
		if(allAttached){
			if (
				x.name!.toLowerCase().replace(/\s/g, "") === name.toLowerCase()
			) return getTag(x.uuid);
		} else 
			if(x.name!.toLowerCase() === name.toLowerCase()) return getTag(x.uuid);
	}
	return undefined;
}
