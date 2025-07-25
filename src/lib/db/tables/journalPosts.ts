import { UUIDable, JournalPost, UUID, JournalPostComplete } from "../entities";

import * as impl from '../impl/tauri/journalPosts';

export function getJournalPosts(){
	return impl.getJournalPosts();
}

export function getJournalPostsOffset(offset: number, limit?: number){
	return impl.getJournalPostsOffset(offset, limit);
}

export function toJournalPostComplete(journalPost: JournalPost): Promise<JournalPostComplete> {
	return impl.toJournalPostComplete(journalPost);
}

export function newJournalPost(journalPost: Omit<JournalPost, keyof UUIDable>) {
	return impl.newJournalPost(journalPost);
}

export function getJournalPost(uuid: UUID){
	return impl.getJournalPost(uuid);
}

export function deleteJournalPost(uuid: UUID){
	return impl.deleteJournalPost(uuid);
}

export function updateJournalPost(uuid: UUID, newContent: Partial<JournalPost>){
	return impl.updateJournalPost(uuid, newContent);
}

export function getJournalPostsOfDay(date: Date, includePinned: boolean){
	return impl.getJournalPostsOfDay(date, includePinned);
}

export function getJournalPostsDays(){
	return impl.getJournalPostsDays()
}