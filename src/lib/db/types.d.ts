import { BoardMessage, Chat, ChatMessage, FrontingEntry, JournalPost, Member, Reminder, System, Tag, Asset, CustomField } from "./entities";

export type AmpersandEntityMapping = {
	boardMessages: BoardMessage
	chats: Chat
	chatMessages: ChatMessage
	frontingEntries: FrontingEntry
	journalPosts: JournalPost
	members: Member
	reminders: Reminder
	system: System
	tags: Tag,
	assets: Asset,
	customFields: CustomField
};

export type DatabaseEventData = {
	table: keyof AmpersandEntityMapping,
	event: "new" | "modified" | "deleted",
	data: string,
};