import { UUIDable, JournalPost } from "../entities";

const impl = await (/*"isTauri" in window ? import('../impl/tauri/journalPosts') : */import('../impl/dexie/journalPosts'));

export function getJournalPosts(){
	return impl.getJournalPosts();
}

export function newJournalPost(journalPost: Omit<JournalPost, keyof UUIDable>) {
	return impl.newJournalPost(journalPost);
}
