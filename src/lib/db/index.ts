import { FilterQuery, type Asset, type BoardMessage, type CustomField, type FrontingEntry, type JournalPost, type Member, type Note, type Reminder, type System, type Tag } from "./entities";
import { ShittyTable } from "./impl/shittytable";
import type { AmpersandTableMapping, Database, SecondaryKey } from "./types";
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
export const initMetrics = ref<Map<string, number>>(new Map());

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
	const initTable = async <T extends keyof AmpersandTableMapping>(name: T, secondaryKeys: SecondaryKey<AmpersandTableMapping[T]>[]) => {
		const date = Date.now();
		// @ts-expect-error db[name] has to be a name we can assign to, however i don't know how to type it correctly (also because name is already keyof AmpersandTableMapping so idk why)
		db[name] = await ShittyTable.new(name, secondaryKeys);
		initMetrics.value.set(name, Date.now() - date);
	};

	const initBefore = Date.now();

	const promises = [
		initTable("systems", ["name", "parent", "isPinned", "isArchived", "viewInLists"]),
		initTable("members", ["name", "system", "isPinned", "isArchived", "isCustomFront"]),
		initTable("boardMessages", ["members", "date", "isPinned", "isArchived"]),
		initTable("frontingEntries", ["member", "startTime", "endTime", "isLocked", "isMainFronter"]),
		initTable("journalPosts", ["members", "date", "isPinned"]),
		initTable("reminders", ["active"]),
		initTable("tags", ["name", "type", "isArchived", "viewInLists"]),
		initTable("assets", ["friendlyName"]),
		initTable("customFields", ["name", "priority"]),
		initTable("notes", ["title", "priority", "isArchived"]),
		initTable("filterQueries", ["name", "type"])
	];

	await Promise.all(promises);

	const maybeSystem = db.systems.index[0]?.uuid || undefined;
	if (!db.systems.index.map(x => x.uuid).includes(appConfig.defaultSystem)) {
		if (maybeSystem)
			appConfig.defaultSystem = maybeSystem;
	}

	initMetrics.value.set("_total", Date.now() - initBefore);
	init.value = true;
}
