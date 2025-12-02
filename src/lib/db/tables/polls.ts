import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUID, UUIDable, Poll } from "../entities";
import { deletePollEntry, getPollEntriesForPoll } from "./pollEntries";

export function getPolls(){
	return db.polls.iterate();
}

export async function newPoll(poll: Omit<Poll, keyof UUIDable>) {
	try{
		const id = window.crypto.randomUUID();
		await db.polls.add(id, {
			...poll,
			id
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "polls",
			event: "new",
			id,
			newData: poll
		}));
		return {
			...poll,
			id
		};
	}catch(_error){
		return;
	}
}

export async function deletePoll(poll: Poll | UUID) {
	const id = typeof poll === "string" ? poll : poll.id;
	try {
		for await(const entry of getPollEntriesForPoll(id))
			await deletePollEntry(entry.id);

		await db.polls.delete(id);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "polls",
			event: "deleted",
			id,
			delta: {}
		}));
		return true;
	} catch (_error) {
		return false;
	}
}

export async function updatePoll(id: UUID, newContent: Partial<Poll>) {
	try{
		const updated = await db.polls.update(id, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "polls",
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