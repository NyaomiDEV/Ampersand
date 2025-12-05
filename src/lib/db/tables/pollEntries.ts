import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUID, UUIDable, PollEntry, Poll } from "../entities";
import { deleteVote, getVotesForPollEntry } from "./votes";

export function getPollEntries(){
	return db.pollEntries.iterate();
}

export async function* getPollEntriesForPoll(poll: Poll | UUID){
	const id = typeof poll === "string" ? poll : poll.id;
	for await (const entry of getPollEntries()){
		if(entry.poll.id === id)
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
		return {
			...pollEntry,
			id
		};
	}catch(_error){
		return;
	}
}

export async function deletePollEntry(id: UUID) {
	try {
		for await(const vote of getVotesForPollEntry(id))
			await deleteVote(vote.id);
		
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