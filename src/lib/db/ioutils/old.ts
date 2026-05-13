import { decodeAsync, encode } from "@msgpack/msgpack";
import { accessibilityConfig, appConfig, securityConfig } from "../../config";
import { getTables } from "..";
import type { Table } from "../types";
import { deleteNull, replace, revive, walk, walkAsync } from "../../serialization";
import { dirname, documentDir, sep } from "@tauri-apps/api/path";
import { mkdir, open as openFile, SeekMode } from "@tauri-apps/plugin-fs";
import { open, save } from "../../native/open";
import { AMPERSAND_BACKUP_MAGICS, matchMagicOld } from "./magic";
import { UUIDable } from "../entities";
import dayjs from "dayjs";
import { platform } from "@tauri-apps/plugin-os";
import { DatabaseExport, SerializedDatabaseExport } from "./old_types";
import { intoStream } from "../utils";

export function exportDatabaseToBinary() {

	async function _export(){
		try {
			const date = dayjs().format("YYYY-MM-DD");
			const fileName = `ampersand-backup-${date}.ampdb`;
			let path: string | undefined = `${await documentDir()}${sep()}${fileName}`;

			if (platform() !== "ios") {
				// Use save file dialog outside of iOS
				const _path = await save({
					defaultPath: path,
					filters: [{
						name: "Ampersand backups (.ampdb)",
						extensions: ["ampdb"]
					}]
				});
				if (_path) path = _path;
				else path = undefined; // save file got canceled
			}

			if(!path) throw new Error("no path");

			progress.dispatchEvent(new Event("start"));
			const config = { appConfig, accessibilityConfig, securityConfig };
			const database: Record<string, Array<unknown>> = {};

			let progressTotal = 0;
			for (const [_name, table] of Object.entries(getTables()))
				progressTotal += table.count();

			let progressCurrent = 0;
			for (const [name, table] of Object.entries(getTables())) {
				database[name] = [];
				for await (const data of table.iterate(10)) {
					database[name].push(data);
					progressCurrent++;
					progress.dispatchEvent(new CustomEvent("progress", { detail: { progress: progressCurrent / progressTotal } }));
				}
			}

			const data = encode(
				deleteNull(await walkAsync({ config, database }, replace))
			);

			// Android uses content:// for providing scoped file paths; here we just get the FD from the returned URI
			if (!path.startsWith("content://")) {
				// So in all other cases where the path is a real one, be it relative or not, we ensure we have a directory to write to
				const _dirname = await dirname(path);
				await mkdir(_dirname, { recursive: true });
			}


			const magic = AMPERSAND_BACKUP_MAGICS.get(2)!;

			const fd = await openFile(path, { create: true, write: true, truncate: true });
			await fd.write(new Uint8Array(magic));

			for (let i = 0; i < data.length; i += 512000)
				await fd.write(data.slice(i, i + 512000));
			
			await fd.close();
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

export function importDatabaseFromBinary() {
	async function _import() {
		try {
			const path = await open({
				multiple: false,
				filters: [{ name: "Ampersand Backup file", extensions: ["ampdb"] }],
				fileAccessMode: "scoped",
				pickerMode: "document"
			});
			if (!path) throw new Error("no path");

			const fd = await openFile(path, { read: true });

			const magicBytesMaybe = new Uint8Array(10);
			const bytesRead = await fd.read(magicBytesMaybe);
			if (bytesRead === null || bytesRead === 0) throw new Error("eol before it even started");

			const magicVersion = matchMagicOld(magicBytesMaybe);
			if (!magicVersion) throw new Error("this is not an ampdb file");

			let stream: ReadableStream<Uint8Array<ArrayBuffer>>;
			switch (magicVersion) {
				case 1: {
					// it's gzip, decompress it
					await fd.seek(0, SeekMode.Start);
					stream = intoStream(fd).pipeThrough(new DecompressionStream("gzip"));
					break;
				}
				case 2: {
					// in all other cases we need to strip our magic
					stream = intoStream(fd);
					break;
				}
				default: {
					throw new Error("what the fuck");
				}
			}

			const tablesAndConfig = await decodeAsync(stream) as SerializedDatabaseExport;

			progress.dispatchEvent(new Event("start"));
			const revived = walk(tablesAndConfig, revive) as DatabaseExport;

			const progressTotal = Object.getOwnPropertyNames(revived.database).length + 3;
			let progressCurrent = 0;

			Object.assign(appConfig, revived.config.appConfig);
			progressCurrent++;

			Object.assign(accessibilityConfig, revived.config.accessibilityConfig);
			progressCurrent++;

			Object.assign(securityConfig, revived.config.securityConfig);
			progressCurrent++;

			for (const key of Object.getOwnPropertyNames(revived.database)) {
				// also mitigate system (old) to systems (new)
				const table: Table<UUIDable> = getTables()[key === "system" ? "systems" : key];
				if (table) {
					await table.clear();
					await table.bulkAdd(revived.database[key]);
					await table.migrate(0);
				}
				progressCurrent++;
				progress.dispatchEvent(new CustomEvent("progress", { detail: { progress: progressCurrent / progressTotal } }));
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
