import Dexie, { PromiseExtended, Table, liveQuery } from 'dexie';
import { BoardMessage } from './entities/boardMessages';
import { Chat } from './entities/chats';
import { ChatMessage } from './entities/chatMessages';
import { FrontingEntry } from './entities/frontingEntries';
import { JournalPost } from './entities/journalPosts';
import { Member } from './entities/members';
import { Reminder } from './entities/reminders';
import { System } from './entities/system';
import { Tag } from './entities/tags';
import { from, useObservable } from '@vueuse/rxjs';

export class AmpersandDatabase extends Dexie {

	boardMessages!: Table<BoardMessage>
	chats!: Table<Chat>
	chatMessages!: Table<ChatMessage>
	frontingEntries!: Table<FrontingEntry>
	journalPosts!: Table<JournalPost>
	members!: Table<Member>
	reminders!: Table<Reminder>
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

export function toObservable(databaseCall: () => PromiseExtended){
	return useObservable(
		from(liveQuery(databaseCall))
	);
}
