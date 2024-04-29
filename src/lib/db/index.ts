import Dexie, { Table } from 'dexie';
import { BoardMessage } from './entities/board';
import { Chat, ChatMessage } from './entities/chat';
import { FrontingEntry } from './entities/fronting';
import { JournalPost } from './entities/journal';
import { Member } from './entities/member';
import { EventReminder, PeriodicReminder } from './entities/reminders';
import { System } from './entities/system';
import { Tag } from './entities/tag';

export class AmpersandDatabase extends Dexie {

	boardMessages!: Table<BoardMessage>

	chats!: Table<Chat>
	chatMessages!: Table<ChatMessage>

	frontingEntries!: Table<FrontingEntry>

	journalPosts!: Table<JournalPost>

	members!: Table<Member>

	reminders!: Table<EventReminder | PeriodicReminder>

	system!: Table<System>

	tags!: Table<Tag>

	constructor(){
		super("ampersandDatabase");

		this.version(1).stores({
			boardMessages: "uuid, member, title",

			chats: "uuid, name",
			chatMessages: "uuid, chat, member",

			frontingEntries: "uuid, member, customStatus",

			journalPosts: "uuid, member, title",

			members: "uuid, name, isArchived, isCustomFront",

			reminders: "uuid, name",

			system: "uuid", // do we even?

			tags: "uuid, name"
		});
	}

}

export const db = new AmpersandDatabase();
