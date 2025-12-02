import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { PollEntry, UUID, UUIDable, Vote } from "../entities";

export function getVotes(){
	return db.votes.iterate();
}

export async function* getVotesForPollEntry(pollEntry: PollEntry){
	for await(const entry of getVotes()){
		if(entry.entry.id === pollEntry.id)
			yield entry;
	}
}

export async function newVote(vote: Omit<Vote, keyof UUIDable>) {
	try{
		const id = window.crypto.randomUUID();
		await db.votes.add(id, {
			...vote,
			id
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "votes",
			event: "new",
			id,
			newData: vote
		}));
		return id;
	}catch(_error){
		return false;
	}
}

export async function deleteVote(id: UUID) {
	try {
		await db.votes.delete(id);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "votes",
			event: "deleted",
			id,
			delta: {}
		}));
		return true;
	} catch (_error) {
		return false;
	}
}

export async function updateVote(id: UUID, newContent: Partial<Vote>) {
	try{
		const updated = await db.votes.update(id, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "votes",
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