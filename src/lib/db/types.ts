import Dexie, { Table } from "dexie";
import { BoardMessage, Chat, ChatMessage, FrontingEntry, JournalPost, Member, Reminder, System, Tag } from "./entities";

export type AmpersandDatabase = {
	boardMessages: BoardMessage[]
	chats: Chat[]
	chatMessages: ChatMessage[]
	frontingEntries: FrontingEntry[]
	journalPosts: JournalPost[]
	members: Member[]
	reminders: Reminder[]
	system: System[]
	tags: Tag[]
}

export type AmpersandDexieDatabase = Dexie & {
	boardMessages: Table<BoardMessage>
	chats: Table<Chat>
	chatMessages: Table<ChatMessage>
	frontingEntries: Table<FrontingEntry>
	journalPosts: Table<JournalPost>
	members: Table<Member>
	reminders: Table<Reminder>
	system: Table<System>
	tags: Table<Tag>
};

export type DatabaseEventData = {
	table: keyof AmpersandDatabase,
	event: "new" | "modified" | "deleted",
	data: any,
};