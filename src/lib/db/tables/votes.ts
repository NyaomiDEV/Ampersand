import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { Member, Poll, PollEntry, UUID, UUIDable, Vote } from "../entities";
import { getPollEntriesForPoll } from "./pollEntries";

export function getVotes(){
	return db.votes.iterate();
}

export async function* getVotesForPollEntry(pollEntry: PollEntry | UUID){
	const id = typeof pollEntry === "string" ? pollEntry : pollEntry.id;
	for await(const entry of getVotes()){
		if(entry.entry.id === id)
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
		return {
			...vote,
			id
		};
	}catch(_error){
		return;
	}
}

export async function deleteVote(vote: Vote | UUID) {
	const id = typeof vote === "string" ? vote : vote.id;
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

export async function resetVotesForPoll(poll: Poll | UUID){
	const id = typeof poll === "string" ? poll : poll.id;

	for await (const entry of getPollEntriesForPoll(id)){
		for await (const vote of getVotesForPollEntry(entry))
			await deleteVote(vote.id);
	}
}

export async function voteForPoll(poll: Poll, voter: Member, choice: PollEntry, reason?: string){
	// if the poll is not multiple choice we have to undo the vote to the other choices
	if (!poll.multipleChoice) {
		for await (const _entry of getPollEntriesForPoll(poll)) {
			if(_entry.id === poll.id) continue;

			for await (const vote of getVotesForPollEntry(_entry)){
				if(vote.member.id === voter.id)
					await deleteVote(vote);
			}
		}
	}

	return await newVote({
		member: voter,
		entry: choice,
		reason,
	});
}