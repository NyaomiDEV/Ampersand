import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUIDable, JournalPost, UUID } from "../entities";
import { getMember, defaultMember } from "./members";
import dayjs from "dayjs";
import { filterJournalPost } from "../../search";
import { TransactionStatus } from "../types";
import { sortDate } from "../../util/misc";

export async function* getJournalPosts(maxIter = 10){
	const uuids = db.journalPosts.index.toSorted(sortDate).map(x => x.uuid);
		
	const f = (offset: number, maxIter: number) => {
		const chunk: Promise<JournalPost>[] = [];
		for (let i = offset; i < offset + maxIter; i++) {
			if (uuids[i]) {
				const data = db.journalPosts.get(uuids[i]);
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

export async function toJournalPostComplete(journalPost: JournalPost){
	return {
		...journalPost,
		members: await Promise.all(journalPost.members.map(async x => (await getMember(x).catch(() => defaultMember(x))) || defaultMember()))
	};
}

export async function newJournalPost(journalPost: Omit<JournalPost, keyof UUIDable>): Promise<TransactionStatus<string>> {
	try{
		const uuid = await db.journalPosts.add(journalPost);

		if(!uuid) throw new Error("already exists in database");

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

export async function updateJournalPost(newContent: UUIDable & Partial<JournalPost>): Promise<TransactionStatus<{ oldData: JournalPost, newData: JournalPost }>> {
	try{
		const updated = await db.journalPosts.update(newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "journalPosts",
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

export async function* getJournalPostsOfDay(date: Date, includePinned: boolean, query: string) {
	const _date = dayjs(date).startOf("day");

	for(const entry of db.journalPosts.index.toSorted(sortDate)){
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