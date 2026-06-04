import { db } from "..";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUIDable, JournalPost, UUID, JournalPostComplete } from "../entities";
import { getMember, defaultMember } from "./members";
import dayjs from "dayjs";
import { filterJournalPost } from "../../search";
import { TransactionStatus } from "../types";
import { isUuid, sortJournalPosts } from "../../util/misc";

export async function* getJournalPosts(maxIter = 10){
	const uuids = db.journalPosts.index.toSorted(sortJournalPosts).map(x => x.uuid);
		
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

export async function toJournalPostComplete(journalPosts: JournalPost[]): Promise<JournalPostComplete[]> {
	const _memberSet = await Promise.all(Array.from(new Set(
		journalPosts.map(x => x.members).flat(1)
	)).map(x => getMember(x).catch(() => defaultMember(x))));

	return journalPosts.map(x => ({
		...x,
		members: x.members.map(member => _memberSet.find(y => y.uuid === member) || defaultMember(member)),
	}));
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

export async function getRecentJournalPosts(days: number) {
	return Promise.all(
		db.journalPosts.index
			.toSorted(sortJournalPosts)
			.filter(x => (x.isPinned || dayjs().startOf("day").valueOf() - dayjs(x.date).startOf("day").valueOf() <= days * 24 * 60 * 60 * 1000))
			.map(x => db.journalPosts.get(x.uuid))
	);
}

export async function* getJournalPostsOfDay(date: Date, includePinned: boolean, query: string) {
	const _date = dayjs(date).startOf("day");

	for (const entry of db.journalPosts.index.toSorted(sortJournalPosts)){
		if ((includePinned && entry.isPinned) || dayjs(entry.date).startOf("day").valueOf() === _date.valueOf()){
			const post = await db.journalPosts.get(entry.uuid);

			if (filterJournalPost(query, post))
				yield post;
		}
	}
}

export async function getJournalPostsDays(query: string, start: Date, end: Date) {
	const _map = Promise.all(db.journalPosts.index.map(async x => {
		if(x.date!.valueOf() > end.valueOf() || x.date!.valueOf() < start.valueOf())
			return undefined;

		const post = await getJournalPost(x.uuid);

		if(filterJournalPost(query, post))
			return dayjs(x.date).startOf("day").valueOf();

		return undefined;
	}));
	
	return (await _map).reduce((occurrences, current) => {
		if(current)
			occurrences.set(current, (occurrences.get(current) || 0) + 1);

		return occurrences;
	}, new Map<number, number>());
}

export function getJournalUUIDByTitle(title: string) {
	if (isUuid(title)) return title;
	for (const x of db.journalPosts.index)
		if(x.title!.toLowerCase() === title.toLowerCase()) return x.uuid;
	
	return undefined;
}