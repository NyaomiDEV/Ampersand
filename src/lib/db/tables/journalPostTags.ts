import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUID, UUIDable, JournalPostTag, JournalPost, Tag } from "../entities";

export function getJournalPostTags(){
	return db.journalPostTags.iterate();
}

export async function* getJournalPostTagsForPost(journalPost: JournalPost | UUID){
	const id = typeof journalPost === "string" ? journalPost : journalPost.id;
	for await (const entry of getJournalPostTags()){
		if(entry.post.id === id)
			yield entry;
	}
}

export async function* getJournalPostTagsForTag(tag: Tag | UUID) {
	const id = typeof tag === "string" ? tag : tag.id;
	for await (const entry of getJournalPostTags()) {
		if (entry.tag.id === id)
			yield entry;
	}
}

export async function journalPostHasTag(journalPost: JournalPost | UUID, tag: Tag | UUID){
	const postId = typeof journalPost === "string" ? journalPost : journalPost.id;
	const tagId = typeof tag === "string" ? tag : tag.id;

	for await (const entry of getJournalPostTags()){
		if(entry.post.id === postId && entry.tag.id === tagId)
			return true;
	}

	return false;
}

export async function newJournalPostTag(journalPostTag: Omit<JournalPostTag, keyof UUIDable>) {
	try{
		const id = window.crypto.randomUUID();
		await db.journalPostTags.add(id, {
			...journalPostTag,
			id
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "journalPostTags",
			event: "new",
			id,
			newData: journalPostTag
		}));
		return {
			...journalPostTag,
			id
		};
	}catch(_error){
		return;
	}
}

export async function deleteJournalPostTag(journalPostTag: JournalPostTag | UUID) {
	const id = typeof journalPostTag === "string" ? journalPostTag : journalPostTag.id;
	try {
		await db.journalPostTags.delete(id);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "journalPostTags",
			event: "deleted",
			id,
			delta: {}
		}));
		return true;
	} catch (_error) {
		return false;
	}
}

export async function updateJournalPostTag(id: UUID, newContent: Partial<JournalPostTag>) {
	try{
		const updated = await db.journalPostTags.update(id, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "journalPostTags",
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

export async function tagJournalPosts(tag: Tag, journalPosts: JournalPost[]){
	const allPostTags = await Array.fromAsync(getJournalPostTagsForTag(tag));
	for (const postTag of allPostTags) {
		const post = journalPosts.find(x => x.id === postTag.post.id);
		if (!post)
			await deleteJournalPostTag(postTag.id);
		else journalPosts = journalPosts.filter(x => x.id !== post.id);
	}
	for (const remainingPost of journalPosts) {
		await newJournalPostTag({
			tag,
			post: remainingPost
		});
	}
}

export async function journalPostTags(journalPost: JournalPost, tags: Tag[]){
	for await (const journalTag of getJournalPostTagsForPost(journalPost)) {
		const tag = tags.find(x => x.id === journalTag.tag.id);
		if (!tag)
			await deleteJournalPostTag(journalTag.id);
		else tags = tags.filter(x => x !== tag);
	}
	for (const remainingTag of tags) {
		await newJournalPostTag({
			tag: remainingTag,
			post: journalPost
		});
	}
}