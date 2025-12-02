import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUID, UUIDable, PollEntry, Poll } from "../entities";

export function getPollEntries(){
	return db.pollEntries.iterate();
}

export async function* getPollEntriesForPoll(poll: Poll){
	for await (const entry of getPollEntries()){
		if(entry.poll.id === poll.id)
			yield entry;
	}
}

export async function newPollEntry(pollEntry: Omit<PollEntry, keyof UUIDable>) {
	try{
		const id = window.crypto.randomUUID();
		await db.pollEntries.add(id, {
			...pollEntry,
			id
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "pollEntries",
			event: "new",
			id,
			newData: pollEntry
		}));
		return id;
	}catch(_error){
		return false;
	}
}

export async function deletePollEntry(id: UUID) {
	try {
		await db.pollEntries.delete(id);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "pollEntries",
			event: "deleted",
			id,
			delta: {}
		}));
		return true;
	} catch (_error) {
		return false;
	}
}

export async function updatePollEntry(id: UUID, newContent: Partial<PollEntry>) {
	try{
		const updated = await db.pollEntries.update(id, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "pollEntries",
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