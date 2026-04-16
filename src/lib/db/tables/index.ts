import { appDataDir, sep } from "@tauri-apps/api/path";
import * as fs from "@tauri-apps/plugin-fs";
import type { Asset, BoardMessage, CustomField, FrontingEntry, JournalPost, Member, Reminder, System, Tag, UUIDable } from "../entities";
import { ShittyTable } from "../impl/shittytable";
import type { SecondaryKey } from "../impl/types";

async function makeTable<T extends UUIDable>(tableName: string, secondaryKeys: SecondaryKey<T>[]) {
	const _path = `${appDataDirPath + sep()}database${sep() + tableName}`;
	await fs.mkdir(_path, { recursive: true });

	const table = new ShittyTable<T>(tableName, _path, secondaryKeys);
	await table.initializeHashes();
	await table.initializeIndex();
	await table.migrate();

	return table;
}

// DATABASE INIT
const appDataDirPath = await appDataDir();

// move old "system" database table in fs to "systems"
if (await fs.exists(`${appDataDirPath + sep()}database${sep()}system`))
	await fs.rename(`${appDataDirPath + sep()}database${sep()}system`, `${appDataDirPath + sep()}database${sep()}systems`);
export async function clearAllDatabase(){
	await Promise.all(
		Object.values(db)
			.map(x => x.clear())
	);
}

export function getTables() {
	return { ...db };
}

const db = {
	systems: await makeTable<System>("systems", ["name", "parent", "isPinned", "isArchived", "viewInLists"]),
	members: await makeTable<Member>("members", ["name", "system", "isPinned", "isArchived", "isCustomFront"]),
	boardMessages: await makeTable<BoardMessage>("boardMessages", ["member", "date", "isPinned", "isArchived"]),
	frontingEntries: await makeTable<FrontingEntry>("frontingEntries", ["member", "startTime", "endTime", "isLocked", "isMainFronter"]),
	journalPosts: await makeTable<JournalPost>("journalPosts", ["member", "date", "isPinned"]),
	reminders: await makeTable<Reminder>("reminders", []),
	tags: await makeTable<Tag>("tags", ["name", "type", "isArchived", "viewInLists"]),
	assets: await makeTable<Asset>("assets", ["friendlyName"]),
	customFields: await makeTable<CustomField>("customFields", ["name", "priority"])
};

export { db };