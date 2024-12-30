import Dexie from 'dexie';
import { AmpersandDexieDatabase } from '../../types';

export const db = new Dexie("ampersandDatabase") as AmpersandDexieDatabase;

db.version(1).stores({
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

export function getTables(){
	return db.tables;
}