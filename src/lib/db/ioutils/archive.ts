/* eslint-disable @typescript-eslint/no-explicit-any */
import { decodeMultiStream, encode as msgpackEncode } from "@msgpack/msgpack";
import { accessibilityConfig, appConfig, initConfig, securityConfig } from "../../config";
import { getTables } from "..";
import type { Table } from "../types";
import { deleteNull, replace, revive, walkAsync } from "../../serialization";
import { dirname, documentDir, sep } from "@tauri-apps/api/path";
import { mkdir, open as openFile } from "@tauri-apps/plugin-fs";
import { open, save } from "../../native/open";
import { AMPERSAND_ARCHIVE_MAGICS, matchMagicNew } from "./magic";
import dayjs from "dayjs";
import { platform } from "@tauri-apps/plugin-os";
import { System, UUIDable } from "../entities";
import { ArchiveStreamConfig, ArchiveStreamDatabase, ArchiveStreamRevision } from "./archive_types";
import { intoStream } from "../utils";

const revision = parseInt(import.meta.env.AMPERSAND_REVCOUNT);

async function encode(data: any){
	return msgpackEncode(deleteNull(await walkAsync(data, replace)));
}

function reviver(data: any){
	return walkAsync(data, revive);
}

export function exportArchive() {

	async function _export() {
		try {
			const date = dayjs().format("YYYY-MM-DD");
			const fileName = `ampersand-archive-${date}.ampar`;
			let path: string | undefined = `${await documentDir()}${sep()}${fileName}`;

			if (platform() !== "ios") {
				// Use save file dialog outside of iOS
				const _path = await save({
					defaultPath: path,
					filters: [{
						name: "Ampersand archives",
						extensions: ["ampar"]
					}]
				});
				if (_path) path = _path;
				else path = undefined; // save file got canceled
			}

			if (!path) throw new Error("no path");

			const magic = AMPERSAND_ARCHIVE_MAGICS.get(2)!;

			// Android uses content:// for providing scoped file paths; here we just get the FD from the returned URI
			if (!path.startsWith("content://")) {
				// So in all other cases where the path is a real one, be it relative or not, we ensure we have a directory to write to
				const _dirname = await dirname(path);
				await mkdir(_dirname, { recursive: true });
			}

			// Start the file - write magic sequence
			const fd = await openFile(path, { create: true, write: true, truncate: true });
			await fd.write(new Uint8Array(magic));
			progress.dispatchEvent(new Event("start"));

			let progressTotal = 0;
			for (const [_name, table] of Object.entries(getTables()))
				progressTotal += table.count();

			// Write the revision
			await fd.write(
				await encode({ table: "__revision", data: revision })
			);

			// Write the configuration
			await fd.write(
				await encode({ table: "__config", data: { appConfig, accessibilityConfig, securityConfig } })
			);

			let progressCurrent = 0;
			for (const [name, table] of Object.entries(getTables())) {
				for await (const data of table.iterate(10)) {
					await fd.write(await encode({ table: name, data }));
					progressCurrent++;
					progress.dispatchEvent(new CustomEvent("progress", { detail: { progress: progressCurrent / progressTotal } }));
				}
			}

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

export function importArchive() {
	async function _import() {
		try {
			const path = await open({
				multiple: false,
				filters: [{ name: "Ampersand Archive file", extensions: ["ampar"] }],
				fileAccessMode: "scoped",
				pickerMode: "document"
			});
			if (!path) throw new Error("no path");

			const fd = await openFile(path, { read: true });

			const size = (await fd.stat()).size;
			let bytes = 0;
			const _progress = (read) => { bytes += read; emitProgress(bytes, size); };

			progress.dispatchEvent(new Event("start"));

			const magicBytesMaybe = new Uint8Array(10);
			const bytesRead = await fd.read(magicBytesMaybe);
			if (bytesRead === null || bytesRead === 0) throw new Error("eol before it even started");

			_progress(bytesRead);

			const magicVersion = matchMagicNew(magicBytesMaybe);
			if (!magicVersion) throw new Error("this is not an ampersand archive");

			const stream = intoStream(fd, _progress);
			const multiStreamDecoder = decodeMultiStream(stream) as AsyncGenerator<{ table: string, data: any; }>;

			let revisionWasParsed = magicVersion < 2 ? true : false;

			// clear all tables if magic version < 2 -- this is a tradeoff of not thinking things through the first time
			if(magicVersion < 2){
				for (const table of Object.values(getTables()))
					await table.clear();
			}

			for await (const rawData of multiStreamDecoder){
				const data: any = await reviver(rawData);
				switch (data.table) {
					case "__revision": {
						if (revisionWasParsed) throw new Error("malformed, there should only be one revision fragment");
						const _data = data as ArchiveStreamRevision;
						if (revision < _data.data)
							throw new Error("app too old");

						revisionWasParsed = true;

						// after parsing revision number we can clear tables
						for (const table of Object.values(getTables()))
							await table.clear();
						break;
					}
					case "__config": {
						if (!revisionWasParsed) throw new Error("malformed, revision fragment must be first");
						const _data = data as ArchiveStreamConfig;
						await initConfig({
							appConfig: _data.data.appConfig,
							accessibilityConfig: _data.data.accessibilityConfig,
							securityConfig: _data.data.securityConfig
						});
						break;
					}
					// Migrate system (old) to systems (new) upon import
					case "system": {
						if (!revisionWasParsed) throw new Error("malformed, revision fragment must be first");
						const _data = data as ArchiveStreamDatabase;
						const table: Table<System> = getTables().systems;
						const result = await table.add(_data.data, false);
						if (!result) throw new Error(`item already exists: ${_data.data.uuid}`);
						break;
					}
					default: {
						if (!revisionWasParsed) throw new Error("malformed, revision fragment must be first");
						const _data = data as ArchiveStreamDatabase;
						const table: Table<UUIDable> = getTables()[_data.table];
						const result = await table.add(_data.data, false);
						if (!result) throw new Error(`item already exists: ${_data.data.uuid}`);
					}
				}
			}

			for (const table of Object.values(getTables())){
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
