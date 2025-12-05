import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUIDable, JournalPost, UUID } from "../entities";
import dayjs from "dayjs";
import { filterJournalPost } from "../search";
import { PartialBy } from "../../types";
import { formatDate } from "../../util/misc";

export function getJournalPosts(){
	return db.journalPosts.iterate();
}

export async function newJournalPost(journalPost: Omit<JournalPost, keyof UUIDable>) {
	try{
		const id = window.crypto.randomUUID();
		await db.journalPosts.add(id, {
			...journalPost,
			id
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "journalPosts",
			event: "new",
			id,
			newData: journalPost
		}));
		return {
			...journalPost,
			id
		};
	}catch(_error){
		return;
	}
}

export async function getJournalPost(id: UUID){
	return await db.journalPosts.get(id);
}

export async function deleteJournalPost(journalPost: JournalPost | UUID) {
	const id = typeof journalPost === "string" ? journalPost : journalPost.id;
	try {
		await db.journalPosts.delete(id);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "journalPosts",
			event: "deleted",
			id,
			delta: {}
		}));
		return true;
	} catch (_error) {
		return false;
	}
}

export async function updateJournalPost(id: UUID, newContent: Partial<JournalPost>) {
	try{
		const updated = await db.journalPosts.update(id, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "journalPosts",
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

export async function* getJournalPostsOfDay(date: Date, includePinned: boolean, query: string) {
	const _date = dayjs(date).startOf("day");

	for await (const journalPost of db.journalPosts.iterate()){
		if ((includePinned && !journalPost.isPinned) && dayjs(journalPost.date).startOf("day").valueOf() !== _date.valueOf())
			continue;

		if(await filterJournalPost(query, journalPost))
			yield journalPost;
	}
}

export async function getJournalPostsDays(query: string) {
	const _map = await Promise.all((await Array.fromAsync(db.journalPosts.iterate())).map(async x => {
		if (await filterJournalPost(query, x))
			return dayjs(x.date).startOf("day").valueOf();

		return undefined;
	}));
	
	return _map.reduce((occurrences, current) => {
		if(current)
			occurrences.set(current, (occurrences.get(current) || 0) + 1);

		return occurrences;
	}, new Map<number, number>());
}

export async function saveJournalPost(journalPost: PartialBy<JournalPost, keyof UUIDable>){
	if (!journalPost.title.length)
		journalPost.title = formatDate(journalPost.date, "collapsed");

	if (journalPost.id){
		await updateJournalPost(journalPost.id, { ...journalPost });
		return journalPost as JournalPost;
	}
	return await newJournalPost({ ...journalPost });
}