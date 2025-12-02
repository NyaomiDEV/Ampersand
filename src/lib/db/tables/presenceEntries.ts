import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUID, UUIDable, FrontingEntry, PresenceEntry } from "../entities";

export function getPresenceEntries(){
	return db.presenceEntries.iterate();
}

export async function* getPresenceEntriesForFrontEntry(frontingEntry: FrontingEntry){
	for await (const entry of getPresenceEntries()){
		if(entry.frontingEntry.id === frontingEntry.id)
			yield entry;
	}
}

export async function newPresenceEntry(presenceEntry: Omit<PresenceEntry, keyof UUIDable>) {
	try{
		const id = window.crypto.randomUUID();
		await db.presenceEntries.add(id, {
			...presenceEntry,
			id
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "presenceEntries",
			event: "new",
			id,
			newData: presenceEntry
		}));
		return id;
	}catch(_error){
		return false;
	}
}

export async function deletePresenceEntry(id: UUID) {
	try {
		await db.presenceEntries.delete(id);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "presenceEntries",
			event: "deleted",
			id,
			delta: {}
		}));
		return true;
	} catch (_error) {
		return false;
	}
}

export async function updatePresenceEntry(id: UUID, newContent: Partial<PresenceEntry>) {
	try{
		const updated = await db.presenceEntries.update(id, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "presenceEntries",
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