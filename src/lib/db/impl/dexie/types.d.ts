import Dexie, { Table } from "dexie";
import { BoardMessage, Chat, ChatMessage, FrontingEntry, JournalPost, Member, Reminder, System, Tag } from "../../entities";
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