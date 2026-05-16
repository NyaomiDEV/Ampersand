import { FilterQuery, type Asset, type BoardMessage, type CustomField, type FrontingEntry, type JournalPost, type Member, type Note, type Reminder, type System, type Tag } from "./entities";
import { makeShittyTable } from "./impl/shittytable";
import type { Database } from "./types";
import { Molise } from "./impl/molise";
import { ref } from "vue";
import { appConfig } from "../config";

export const db: Database = {
	systems: new Molise<System>("systems"),
	members: new Molise<Member>("members"),
	boardMessages: new Molise<BoardMessage>("boardMessages"),
	frontingEntries: new Molise<FrontingEntry>("frontingEntries"),
	journalPosts: new Molise<JournalPost>("journalPosts"),
	reminders: new Molise<Reminder>("reminders"),
	tags: new Molise<Tag>("tags"),
	assets: new Molise<Asset>("assets"),
	customFields: new Molise<CustomField>("customFields"),
	notes: new Molise<Note>("notes"),
	filterQueries: new Molise<FilterQuery>("filterQueries")
};

export const init = ref(false);
export const initProgress = ref(0);

export function databaseDidInit(){
	return init.value;
}

export async function clearAllDatabase(){
	await Promise.all(
		Object.values(db)
			.map(x => x.clear())
	);
}

export function getTables() {
	return { ...db };
}

export async function initDatabase(){
	function thenIncrement<T>(ret: T): typeof ret {
		initProgress.value += 1 / Object.keys(db).length;
		return ret;
	};

	const shittyDb = {
		systems: await makeShittyTable<System>("systems", ["name", "parent", "isPinned", "isArchived", "viewInLists"]).then(thenIncrement),
		members: await makeShittyTable<Member>("members", ["name", "system", "isPinned", "isArchived", "isCustomFront"]).then(thenIncrement),
		boardMessages: await makeShittyTable<BoardMessage>("boardMessages", ["members", "date", "isPinned", "isArchived"]).then(thenIncrement),
		frontingEntries: await makeShittyTable<FrontingEntry>("frontingEntries", ["member", "startTime", "endTime", "isLocked", "isMainFronter"]).then(thenIncrement),
		journalPosts: await makeShittyTable<JournalPost>("journalPosts", ["members", "date", "isPinned"]).then(thenIncrement),
		reminders: await makeShittyTable<Reminder>("reminders", ["active"]).then(thenIncrement),
		tags: await makeShittyTable<Tag>("tags", ["name", "type", "isArchived", "viewInLists"]).then(thenIncrement),
		assets: await makeShittyTable<Asset>("assets", ["friendlyName"]).then(thenIncrement),
		customFields: await makeShittyTable<CustomField>("customFields", ["name", "priority"]).then(thenIncrement),
		notes: await makeShittyTable<Note>("notes", ["title", "priority", "isArchived"]).then(thenIncrement),
		filterQueries: await makeShittyTable<FilterQuery>("filterQueries", ["name", "type"]).then(thenIncrement)
	};

	Object.assign(db, shittyDb);

	const maybeSystem = db.systems.index[0]?.uuid || undefined;
	if (!db.systems.index.map(x => x.uuid).includes(appConfig.defaultSystem)) {
		if (maybeSystem)
			appConfig.defaultSystem = maybeSystem;
	}

	init.value = true;
}
