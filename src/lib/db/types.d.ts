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

export type DatabaseEventData = {
	table: keyof AmpersandDatabase,
	event: "new" | "modified" | "deleted",
	data: any,
};