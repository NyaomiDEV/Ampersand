import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../../events";
import { UUIDable, JournalPost, UUID } from "../../entities";
import { getMember } from "./members";
import { defaultMember } from "../../tables/members";
import dayjs from "dayjs";

export function getJournalPosts(){
	return db.journalPosts.toArray();
}

export async function getJournalPostsOffset(offset: number, limit?: number) {
	const query = db.journalPosts
		.orderBy("date")
		.reverse()
		.offset(offset);

	if (limit)
		return query.limit(limit).toArray();

	return query.toArray();
}


export async function toJournalPostComplete(journalPost: JournalPost){
	const member = (await getMember(journalPost.member)) || defaultMember();
	return { ...journalPost, member };
}

export async function newJournalPost(journalPost: Omit<JournalPost, keyof UUIDable>) {
	try{
		const uuid = window.crypto.randomUUID();
		await db.journalPosts.add({
			...journalPost,
			uuid
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "journalPosts",
			event: "new",
			data: uuid
		}));
		return uuid;
	}catch(error){
		return false;
	}
}

export async function getJournalPost(uuid: UUID){
	return await db.journalPosts.get(uuid);
}

export async function deleteJournalPost(uuid: UUID) {
	try {
		await db.journalPosts.delete(uuid);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "journalPosts",
			event: "deleted",
			data: uuid
		}));
		return true;
	} catch (error) {
		return false;
	}
}

export async function updateJournalPost(uuid: UUID, newContent: Partial<JournalPost>) {
	try{
		const updated = await db.journalPosts.update(uuid, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "journalPosts",
				event: "modified",
				data: uuid
			}));
			return true;
		}
		return false;
	}catch(error){
		return false;
	}
}

export async function getJournalPostsOfDay(date: Date, includePinned: boolean) {
	const _date = dayjs(date).startOf("day");

	return db.journalPosts.filter(x => (includePinned && x.isPinned) || dayjs(x.date).startOf('day').valueOf() === _date.valueOf()).toArray()
}

export async function getJournalPostsDays() {
	return [...new Set((await db.journalPosts.toArray()).map(x => dayjs(x.date).startOf('day').valueOf()))].map(x => new Date(x));
}