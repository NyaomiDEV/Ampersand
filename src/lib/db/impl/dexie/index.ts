import Dexie from 'dexie';
import { AmpersandDexieDatabase } from './types';

export const db = new Dexie("ampersandDatabase") as AmpersandDexieDatabase;

db.version(1).stores({
	boardMessages: "uuid, date",
	chats: "uuid, name",
	chatMessages: "uuid, chat, date",
	frontingEntries: "uuid, startTime",
	journalPosts: "uuid, date",
	members: "uuid",
	reminders: "uuid",
	system: "uuid",
	tags: "uuid",
	assets: "uuid",
	customFields: "uuid"
});

export function getTables(){
	return db.tables;
}