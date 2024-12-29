import { UUIDable, JournalPost } from "../entities";

const impl = await import('../impl/dexie/journalPosts');

export function getJournalPostsTable() {
	return impl.getJournalPostsTable();
}

export function newJournalPost(journalPost: Omit<JournalPost, keyof UUIDable>) {
	return impl.newJournalPost(journalPost);
}
