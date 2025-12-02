import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUID, UUIDable, Poll } from "../entities";

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
		return id;
	}catch(_error){
		return false;
	}
}

export async function deletePoll(id: UUID) {
	try {
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