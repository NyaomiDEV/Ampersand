import { dirname, documentDir, sep } from "@tauri-apps/api/path";
import { deleteNull } from "../../serialization";
import { getTables } from "..";
import type { Table } from "../types";
import { mkdir, open as openFile } from "@tauri-apps/plugin-fs";
import dayjs from "dayjs";
import { platform } from "@tauri-apps/plugin-os";
import { open, save } from "../../native/open";
import { Asset, BoardMessage, FrontingEntry, JournalPost, Member, System, UUIDable } from "../entities";
import { AssetJSON, BoardMessageJSON, FrontingEntryJSON, JournalPostJSON, MemberJSON, SerializableJson, SystemJSON } from "./json_types";
import { fromDataURI, toDataURI } from "../../util/blob";
import { appConfig, accessibilityConfig, securityConfig, initConfig } from "../../config";
import { ArrayStream, arrayStream, matchesJsonPathSelector, objectStream, parseJsonStreamWithPaths, SerializableJsonValue, streamToIterable, stringifyJsonStream } from "json-stream-es";
import { intoStream } from "../utils";
import { AccessibilityConfig, AppConfig, SecurityConfig } from "../../config/types";

export function exportDatabaseToJSON() {

	async function* generateTables<T extends UUIDable>(table: Table<T>): AsyncGenerator<SerializableJsonValue> {
		for await (const data of table.iterate(10)) {
			switch (table.name) {
				case "boardMessages": {
					const _data = data as unknown as BoardMessage;
					yield {
						..._data,
						date: _data.date.toISOString()
					} as SerializableJson<BoardMessageJSON>;
					break;
				}
				case "frontingEntries": {
					const _data = data as unknown as FrontingEntry;
					yield deleteNull({
						..._data,
						startTime: _data.startTime.toISOString(),
						endTime: _data.endTime?.toISOString() || undefined,
						presence: _data.presence
							? Object.fromEntries(_data.presence.entries()
									.map(x => [x[0].toISOString(), x[1]])
								)
							: undefined
					}) as SerializableJson<FrontingEntryJSON>;
					break;
				}
				case "journalPosts": {
					const _data = data as unknown as JournalPost;
					yield deleteNull({
						..._data,
						date: _data.date.toISOString(),
						cover: _data.cover ? await toDataURI(_data.cover) : undefined,
					}) as SerializableJson<JournalPostJSON>;
					break;
				}
				case "members": {
					const _data = data as unknown as Member;
					yield deleteNull({
						..._data,
						image: _data.image ? await toDataURI(_data.image) : undefined,
						cover: _data.cover ? await toDataURI(_data.cover) : undefined,
						customFields: _data.customFields ? Object.fromEntries(_data.customFields.entries()) : undefined,
						dateCreated: _data.dateCreated.toISOString()
					});
					break;
				}
				case "systems": {
					const _data = data as unknown as System;
					yield deleteNull({
						..._data,
						image: _data.image ? await toDataURI(_data.image) : undefined,
						cover: _data.cover ? await toDataURI(_data.cover) : undefined,
					});
					break;
				}
				case "assets": {
					const _data = data as unknown as Asset;
					yield deleteNull({
						..._data,
						file: _data.file ? await toDataURI(_data.file) : undefined,
					});
					break;
				}
				default:
					yield deleteNull(data) as SerializableJson<typeof data>;
					break;
			}
		}
	}

	function* generateDatabase(): Generator<[string, ArrayStream<SerializableJsonValue>]>{
		const tables = getTables();
		
		const progressTotal = Object.keys(getTables()).length;
		let progressCurrent = 0;

		for (const [name, table] of Object.entries(tables)) {
			yield [name, arrayStream(generateTables(table as unknown as Table<UUIDable>))];
			progressCurrent++;
			emitProgress(progressCurrent, progressTotal);
		}
	}

	async function _export() {
		try {
			const date = dayjs().format("YYYY-MM-DD");
			const fileName = `ampersand-export-${date}.json`;
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

			// Android uses content:// for providing scoped file paths; here we just get the FD from the returned URI
			if (!path.startsWith("content://")) {
				// So in all other cases where the path is a real one, be it relative or not, we ensure we have a directory to write to
				const _dirname = await dirname(path);
				await mkdir(_dirname, { recursive: true });
			}

			const fd = await openFile(path, { create: true, write: true, truncate: true });

			const json = stringifyJsonStream({
				config: {
					// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
					appConfig: appConfig as SerializableJson<AppConfig>,
					// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
					accessibilityConfig: accessibilityConfig as SerializableJson<AccessibilityConfig>,
					// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
					securityConfig: securityConfig as SerializableJson<SecurityConfig>
				},
				database: objectStream(generateDatabase())
			});
			const reader = json.getReader();
			const encoder = new TextEncoder();

			while(true) {
				const chunk = await reader.read();
				if (chunk.value) await fd.write(encoder.encode(chunk.value));
				if (chunk.done) break;
			}

			await fd.close();

			progress.dispatchEvent(new Event("finish"));
			return true;
		} catch (_e) {
			console.error(_e);
			return false;
		}
	}

	const emitProgress = (cur: number, tot: number) => {
		progress.dispatchEvent(new CustomEvent("progress", { detail: { progress: cur / tot } }));
	};

	const progress = new EventTarget();
	const status = _export();
	return { progress, status };
}

export function importDatabaseFromJSON() {
	async function putTableData(tableName: string, data: unknown){
		switch (tableName) {
			case "boardMessages": {
				const _data = data as BoardMessageJSON;
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
				return getTables().boardMessages.add({
					..._data,
					date: new Date(_data.date)
				} as BoardMessage, false);
			}
			case "frontingEntries": {
				const _data = data as FrontingEntryJSON;
				return getTables().frontingEntries.add({
					..._data,
					startTime: new Date(_data.startTime),
					endTime: _data.endTime ? new Date(_data.endTime) : undefined,
					presence: _data.presence
						? new Map(Object.entries(_data.presence).map(x => [new Date(x[0]), x[1]]))
						: undefined
				}, false);
			}
			case "journalPosts": {
				const _data = data as JournalPostJSON;
				return getTables().journalPosts.add({
					..._data,
					date: new Date(_data.date),
					cover: _data.cover ? await fromDataURI(_data.cover) : undefined,
				}, false);
			}
			case "members": {
				const _data = data as MemberJSON;
				return getTables().members.add({
					..._data,
					image: _data.image ? await fromDataURI(_data.image) : undefined,
					cover: _data.cover ? await fromDataURI(_data.cover) : undefined,
					customFields: _data.customFields ? new Map(Object.entries(_data.customFields)) : undefined,
					dateCreated: new Date(_data.dateCreated)
				}, false);
			}
			case "systems": {
				const _data = data as SystemJSON;
				return getTables().systems.add({
					..._data,
					image: _data.image ? await fromDataURI(_data.image) : undefined,
					cover: _data.cover ? await fromDataURI(_data.cover) : undefined,
				}, false);
			}
			case "assets": {
				const _data = data as AssetJSON;
				return getTables().assets.add({
					..._data,
					file: _data.file ? await fromDataURI(_data.file) : undefined,
				}, false);
			}
		}
		
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
		return getTables()[tableName].add(data, false);
	}

	async function _import() {
		try {
			const path = await open({
				multiple: false,
				filters: [{ name: "Ampersand Export JSON", extensions: ["json"] }],
				fileAccessMode: "scoped",
				pickerMode: "document"
			});
			if (!path) throw new Error("no path");

			const totalStuffToImport = ["appConfig", "accessibilityConfig", "securityConfig", ...Object.keys(getTables())];
			const importedTables: string[] = [];

			const jsonStream = intoStream(path, undefined, true)
				.pipeThrough(parseJsonStreamWithPaths((path) => {
					if(!path[0]) return false;
					if(path.length === 1 && path[0] === "config") return true;
					return matchesJsonPathSelector(path, ["database", undefined]);
				}));

			progress.dispatchEvent(new Event("start"));

			for (const table of Object.values(getTables()))
				await table.clear();

			for await (const { path, value } of streamToIterable(jsonStream)){				
				switch(path[0]){
					case "config":
						switch(path[1]){
							case "appConfig":
								Object.assign(appConfig, value);
								await initConfig();
								break;
							case "accessibilityConfig":
								Object.assign(accessibilityConfig, value);
								await initConfig();
								break;
							case "securityConfig":
								Object.assign(securityConfig, value);
								await initConfig();
								break;
						}
						break;
					case "database":
						if(typeof path[1] === "string" && value){
							const result = await putTableData(path[1], value);
							if (!result) throw new Error(`item already exists: ${JSON.stringify(value)}`);
						}
						break;
				}

				if (typeof path[1] === "string" && totalStuffToImport.includes(path[1]) && !importedTables.includes(path[1])){
					importedTables.push(path[1]);
					emitProgress(importedTables.length, totalStuffToImport.length);
				}
			}

			for (const table of Object.values(getTables())) {
				await table.saveIndexToDisk();
				await table.saveHashesToDisk?.();
				await table.migrate(0);
			}

			progress.dispatchEvent(new Event("finish"));
			return true;
		} catch (_e) {
			console.error(_e);
			return false;
		}
	}

	const emitProgress = (cur: number, tot: number) => {
		progress.dispatchEvent(new CustomEvent("progress", { detail: { progress: cur / tot } }));
	};

	const progress = new EventTarget();
	const status = _import();
	return { progress, status };
}
