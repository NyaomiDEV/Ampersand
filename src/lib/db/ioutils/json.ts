import { dirname, documentDir, sep } from "@tauri-apps/api/path";
import { deleteNull } from "../../serialization";
import { getTables, ShittyTable } from "../tables";
import { mkdir, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import dayjs from "dayjs";
import { platform } from "@tauri-apps/plugin-os";
import { open, save } from "@tauri-apps/plugin-dialog";
import { Asset, BoardMessage, CustomField, FrontingEntry, JournalPost, Member, System, Tag, UUIDable } from "../entities";
import { AssetJSON, BoardMessageJSON, DatabaseJSON, FrontingEntryJSON, JournalPostJSON, MemberJSON, SystemJSON } from "./json_types";
import { fromDataURI, toDataURI } from "../../util/blob";
import { appConfig, accessibilityConfig, securityConfig } from "../../config";

export function exportDatabaseToJSON(withFiles: boolean) {
	async function _export() {
		try {
			const date = dayjs().format("YYYY-MM-DD");
			const fileName = `ampersand-export-${withFiles ? "with-files-" : ""}${date}.json`;
			let path: string | undefined = `${await documentDir()}${sep()}${fileName}`;

			if (platform() !== "ios") {
				// Use save file dialog outside of iOS
				const _path = await save({
					defaultPath: path,
					filters: [{
						name: "JSON",
						extensions: ["json"]
					}]
				});
				if (_path) path = _path;
				else path = undefined; // save file got canceled
			}

			if (!path) throw new Error("no path");

			progress.dispatchEvent(new Event("start"));
			const json: DatabaseJSON = {
				config: { appConfig, accessibilityConfig, securityConfig },
				database: {
					boardMessages: [],
					frontingEntries: [],
					journalPosts: [],
					members: [],
					systems: [],
					tags: [],
					assets: [],
					customFields: []
				}
			};
			const tables = getTables();

			let progressTotal = 0;
			for (const [name, table] of Object.entries(tables)){
				if (name === "reminders") continue; // we are not supporting those yet
				if (name === "assets" && !withFiles) continue;
				progressTotal += table.count();
			}

			let progressCurrent = 0;
			for (const [name, table] of Object.entries(tables)) {
				if(name === "reminders") continue; // we are not supporting those yet
				if(name === "assets" && !withFiles) continue;
				for await (const data of table.iterate(10)) {
					switch(name){
						case "boardMessages": {
							const _data = data as BoardMessage;
							json.database[name].push({
								..._data,
								date: _data.date.toISOString()
							} as BoardMessageJSON);
							break;
						}
						case "frontingEntries": {
							const _data = data as FrontingEntry;
							json.database[name].push({
								..._data,
								startTime: _data.startTime.toISOString(),
								endTime: _data.endTime?.toISOString() || undefined,
								presence: _data.presence
									? Object.fromEntries(_data.presence.entries()
											.map(x => [x[0].toISOString(), x[1]])
										)
									: undefined
							} as FrontingEntryJSON);
							break;
						}
						case "journalPosts": {
							const _data = data as JournalPost;
							json.database[name].push({
								..._data,
								date: _data.date.toISOString(),
								cover: withFiles && _data.cover ? await toDataURI(_data.cover) : undefined,
							} as JournalPostJSON);
							break;
						}
						case "members": {
							const _data = data as Member;
							json.database[name].push({
								..._data,
								image: withFiles && _data.image ? await toDataURI(_data.image) : undefined,
								cover: withFiles && _data.cover ? await toDataURI(_data.cover) : undefined,
								customFields: _data.customFields ? Object.fromEntries(_data.customFields.entries()) : undefined,
								dateCreated: _data.dateCreated.toISOString()
							} as MemberJSON);
							break;
						}
						case "systems": {
							const _data = data as System;
							json.database[name].push({
								..._data,
								image: withFiles && _data.image ? await toDataURI(_data.image) : undefined,
								cover: withFiles &&_data.cover ? await toDataURI(_data.cover) : undefined,
							} as SystemJSON);
							break;
						}
						case "assets": {
							const _data = data as Asset;
							json.database[name].push({
								..._data,
								file: _data.file ? await toDataURI(_data.file) : undefined,
							} as AssetJSON);
							break;
						}
						case "customFields":
							json.database[name].push((data as CustomField));
							break;
						case "tags":
							json.database[name].push((data as Tag));
							break;
					}
					progressCurrent++;
					progress.dispatchEvent(new CustomEvent("progress", { detail: { progress: progressCurrent / progressTotal } }));
				}
			}

			const data = JSON.stringify(deleteNull(json));

			// Android uses content:// for providing scoped file paths; here we just get the FD from the returned URI
			if (!path.startsWith("content://")) {
				// So in all other cases where the path is a real one, be it relative or not, we ensure we have a directory to write to
				const _dirname = await dirname(path);
				await mkdir(_dirname, { recursive: true });
			}

			await writeTextFile(path, data, { create: true });
			progress.dispatchEvent(new Event("finish"));
			return true;
		} catch (_e) {
			console.error(_e);
			return false;
		}
	}

	const progress = new EventTarget();
	const status = _export();
	return { progress, status };
}

export function importDatabaseFromJSON() {
	async function _import() {
		try {
			const path = await open({
				multiple: false,
				filters: [{ name: "Ampersand Export JSON", extensions: ["json"] }],
				fileAccessMode: "scoped",
				pickerMode: "document"
			});
			if (!path) throw new Error("no path");

			const jsonText = await readTextFile(path);
			const json = JSON.parse(jsonText) as DatabaseJSON;

			progress.dispatchEvent(new Event("start"));

			Object.assign(appConfig, json.config.appConfig);
			Object.assign(accessibilityConfig, json.config.accessibilityConfig);
			Object.assign(securityConfig, json.config.securityConfig);

			let progressTotal = 0;
			for (const [_name, table] of Object.entries(json.database)) 
				progressTotal += table.length;

			let progressCurrent = 0;
			for (const [name, entries] of Object.entries(json.database)) {
				const table: ShittyTable<UUIDable> = getTables()[name];

				await table.clear();

				for (const data of entries) {
					switch (name) {
						case "boardMessages": {
							const _data = data as BoardMessageJSON;
							await table.add({
								..._data,
								date: new Date(_data.date)
							} as BoardMessage, false);
							break;
						}
						case "frontingEntries": {
							const _data = data as FrontingEntryJSON;
							await table.add({
								..._data,
								startTime: new Date(_data.startTime),
								endTime: _data.endTime ? new Date(_data.endTime) : undefined,
								presence: _data.presence
									? new Map(Object.entries(_data.presence).map(x => [new Date(x[0]), x[1]]))
									: undefined
							} as FrontingEntry, false);
							break;
						}
						case "journalPosts": {
							const _data = data as JournalPostJSON;
							await table.add({
								..._data,
								date: new Date(_data.date),
								cover: _data.cover ? await fromDataURI(_data.cover) : undefined,
							} as JournalPost, false);
							break;
						}
						case "members": {
							const _data = data as MemberJSON;
							await table.add({
								..._data,
								image: _data.image ? await fromDataURI(_data.image) : undefined,
								cover: _data.cover ? await fromDataURI(_data.cover) : undefined,
								customFields: _data.customFields ? new Map(Object.entries(_data.customFields)) : undefined,
								dateCreated: new Date(_data.dateCreated)
							} as Member, false);
							break;
						}
						case "systems": {
							const _data = data as SystemJSON;
							await table.add({
								..._data,
								image: _data.image ? await fromDataURI(_data.image) : undefined,
								cover: _data.cover ? await fromDataURI(_data.cover) : undefined,
							} as System, false);
							break;
						}
						case "assets": {
							const _data = data as AssetJSON;
							await table.add({
								..._data,
								file: _data.file ? await fromDataURI(_data.file) : undefined,
							} as Asset, false);
							break;
						}
						default:
							await table.add(data as UUIDable, false);
							break;
					}
					progressCurrent++;
					progress.dispatchEvent(new CustomEvent("progress", { detail: { progress: progressCurrent / progressTotal } }));
				}
				await table.saveIndexToDisk();
			}

			progress.dispatchEvent(new Event("finish"));
			return true;
		} catch (_e) {
			console.error(_e);
			return false;
		}
	}

	const progress = new EventTarget();
	const status = _import();
	return { progress, status };
}
