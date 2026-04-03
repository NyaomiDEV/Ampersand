import { decode, encode } from "@msgpack/msgpack";
import { accessibilityConfig, appConfig, securityConfig } from "../../config";
import { getTables, ShittyTable } from "../tables";
import { deleteNull, replace, revive, walk, walkAsync } from "../../serialization";
import { dirname, documentDir, sep } from "@tauri-apps/api/path";
import { mkdir, open as openFile, readFile } from "@tauri-apps/plugin-fs";
import { open, save } from "@tauri-apps/plugin-dialog";
import { AMPERSAND_BACKUP_MAGICS, matchMagicOld, stripMagicOld } from "./magic";
import { UUIDable } from "../entities";
import { decompressGzip } from "../../util/misc";
import dayjs from "dayjs";
import { platform } from "@tauri-apps/plugin-os";
import { DatabaseExport, SerializedDatabaseExport } from "./old_types";

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

			const fd = await openFile(path, { create: true, write: true });
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

			let array = await readFile(path);
			const magicVersion = matchMagicOld(array);
			if (!magicVersion) throw new Error("this is not an ampdb file");

			switch (magicVersion) {
				case 1: {
					// it's gzip, decompress it
					const reader = decompressGzip(array).getReader();
					const chunks: Uint8Array[] = [];
					while (true) {
						const { done, value } = await reader.read();
						if (value) chunks.push(value);
						if (done) {
							reader.releaseLock();
							break;
						}
					}

					const length = chunks.reduce((p, c) => p + c.length, 0);
					let offset = 0;

					array = new Uint8Array(length);
					chunks.forEach(item => {
						array.set(item, offset);
						offset += item.length;
					});
					break;
				}
				case 2: {
					// in all other cases we need to strip our magic
					const stripped = stripMagicOld(array, magicVersion);
					if (!stripped) throw new Error("unable to strip magic from ampdb file");
					array = stripped;
					break;
				}
				default:
					// possible msgpack without tar.gz?
					break;
			}

			const tablesAndConfig = decode(array) as SerializedDatabaseExport;

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
				const table: ShittyTable<UUIDable> = getTables()[key];
				if (table) {
					await table.clear();
					await table.bulkAdd(revived.database[key]);
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
