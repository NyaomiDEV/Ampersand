import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUID, UUIDable, FrontingEntry, PresenceEntry } from "../entities";

export function getPresenceEntries(){
	return db.presenceEntries.iterate();
}

export async function* getPresenceEntriesForFrontEntry(frontingEntry: FrontingEntry | UUID){
	const id = typeof frontingEntry === "string" ? frontingEntry : frontingEntry.id;
	for await (const entry of getPresenceEntries()){
		if(entry.frontingEntry.id === id)
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
		return {
			...presenceEntry,
			id
		};
	}catch(_error){
		return;
	}
}

export async function deletePresenceEntry(presenceEntry: PresenceEntry | UUID) {
	const id = typeof presenceEntry === "string" ? presenceEntry : presenceEntry.id;
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

export async function savePresenceData(frontingEntry: FrontingEntry | UUID, presenceData: Map<Date, number>){
	const allPresences = await Array.fromAsync(getPresenceEntriesForFrontEntry(frontingEntry));
	for (const dbPresence of allPresences) {
		const tuple = presenceData.entries().find(x => x[0].valueOf() === dbPresence.date.valueOf());
		if (!tuple)
			await deletePresenceEntry(dbPresence.id);
		else presenceData = new Map(presenceData.entries().filter(x => x !== tuple));
	}
	for (const remainingPresence of presenceData) {
		await newPresenceEntry({
			date: remainingPresence[0],
			presence: remainingPresence[1],
			frontingEntry: { id: typeof frontingEntry === "string" ? frontingEntry : frontingEntry.id }
		});
	}
}