import Dexie from 'dexie';
import { AmpersandDexieDatabase, GetTableDexieExport } from './types';

export const db = new Dexie("ampersandDatabase") as AmpersandDexieDatabase;

db.version(1).stores({
	boardMessages: "uuid, date",
	chats: "uuid, name",
	chatMessages: "uuid, chat, date",
	frontingEntries: "uuid, member, startTime, endTime",
	journalPosts: "uuid, date",
	members: "uuid",
	reminders: "uuid",
	system: "uuid",
	tags: "uuid",
	assets: "uuid",
	customFields: "uuid"
});

export function getTables() {
	const _tables: Partial<GetTableDexieExport> = {};
	for(const table of db.tables)
		_tables[table.name] = table;

	return _tables as GetTableDexieExport;
}