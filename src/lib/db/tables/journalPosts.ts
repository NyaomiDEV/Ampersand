import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUIDable, JournalPost, UUID } from "../entities";
import { getMember, defaultMember } from "./members";
import dayjs from "dayjs";
import { filterJournalPost } from "../../search";
import { TransactionStatus } from "../types";

export function getJournalPosts(){
	return db.journalPosts.iterate();
}

export async function toJournalPostComplete(journalPost: JournalPost){
	return {
		...journalPost,
		member: journalPost.member ? (await getMember(journalPost.member)) || defaultMember() : undefined
	};
}

export async function newJournalPost(journalPost: Omit<JournalPost, keyof UUIDable>): Promise<TransactionStatus<string>> {
	try{
		const uuid = window.crypto.randomUUID();
		const result = await db.journalPosts.add(uuid, {
			...journalPost,
			uuid
		});

		if(!result) throw new Error("already exists in database");

		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "journalPosts",
			event: "new",
			uuid,
			newData: journalPost
		}));
		return { success: true, detail: uuid };
	}catch(_e){
		console.error(_e);
		return { success: false, err: _e };
	}
}

export async function getJournalPost(uuid: UUID){
	return await db.journalPosts.get(uuid);
}

export async function deleteJournalPost(uuid: UUID): Promise<TransactionStatus<void>> {
	try {
		await db.journalPosts.delete(uuid);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "journalPosts",
			event: "deleted",
			uuid,
			delta: {}
		}));
		return { success: true };
	} catch (_e) {
		console.error(_e);
		return { success: false, err: _e };
	}
}

export async function updateJournalPost(uuid: UUID, newContent: Partial<JournalPost>): Promise<TransactionStatus<{ oldData: JournalPost, newData: JournalPost }>> {
	try{
		const updated = await db.journalPosts.update(uuid, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "journalPosts",
				event: "modified",
				uuid,
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

export async function* getJournalPostsOfDay(date: Date, includePinned: boolean, query: string) {
	const _date = dayjs(date).startOf("day");

	for(const entry of db.journalPosts.index){
		if ((includePinned && !entry.isPinned) && dayjs(entry.date).startOf("day").valueOf() !== _date.valueOf())
			continue;

		const post = await db.journalPosts.get(entry.uuid);

		if (await filterJournalPost(query, post))
			yield await toJournalPostComplete(post);
	}
}

export async function getJournalPostsDays(query: string, start: Date, end: Date) {
	const _map = Promise.all(db.journalPosts.index.map(async x => {
		if(x.date!.valueOf() > end.valueOf() || x.date!.valueOf() < start.valueOf())
			return undefined;

		const post = await getJournalPost(x.uuid);

		if(await filterJournalPost(query, post))
			return dayjs(x.date).startOf("day").valueOf();

		return undefined;
	}));
	
	return (await _map).reduce((occurrences, current) => {
		if(current)
			occurrences.set(current, (occurrences.get(current) || 0) + 1);

		return occurrences;
	}, new Map<number, number>());
}