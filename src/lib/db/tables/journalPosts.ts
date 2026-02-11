import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUIDable, JournalPost, UUID } from "../entities";
import { getMember, defaultMember } from "./members";
import dayjs from "dayjs";
import { filterJournalPost, filterJournalPostIndex } from "../../search";

export function getJournalPosts(){
	return db.journalPosts.iterate();
}

export async function toJournalPostComplete(journalPost: JournalPost){
	return {
		...journalPost,
		member: journalPost.member ? (await getMember(journalPost.member)) || defaultMember() : undefined
	};
}

export async function newJournalPost(journalPost: Omit<JournalPost, keyof UUIDable>) {
	try{
		const uuid = window.crypto.randomUUID();
		await db.journalPosts.add(uuid, {
			...journalPost,
			uuid
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "journalPosts",
			event: "new",
			uuid,
			newData: journalPost
		}));
		return uuid;
	}catch(_error){
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
			uuid,
			delta: {}
		}));
		return true;
	} catch (_error) {
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
				uuid,
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

	for(const entry of db.journalPosts.index){
		if ((includePinned && !entry.isPinned) && dayjs(entry.date).startOf("day").valueOf() !== _date.valueOf())
			continue;

		const post = await db.journalPosts.get(entry.uuid);
		if(!post) continue;

		const completePost = await toJournalPostComplete(post);

		if(await filterJournalPost(query, completePost)){
			console.log("true", completePost);
			yield completePost;
		}
	}
}

export async function getJournalPostsDays(query: string) {
	const _map = await Promise.all(db.journalPosts.index.map(async x => {
		if (await filterJournalPostIndex(query, x))
			return dayjs(x.date).startOf("day").valueOf();

		return undefined;
	}));
	
	return _map.reduce((occurrences, current) => {
		if(current)
			occurrences.set(current, (occurrences.get(current) || 0) + 1);

		return occurrences;
	}, new Map<number, number>());
}