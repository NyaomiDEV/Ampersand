/* eslint-disable @typescript-eslint/no-explicit-any */
import { decodeMultiStream, encode as msgpackEncode } from "@msgpack/msgpack";
import { accessibilityConfig, appConfig, securityConfig } from "../../config";
import { getTables, ShittyTable } from "../tables";
import { deleteNull, replace, walk, revive, walkAsync } from "../../serialization";
import { dirname, documentDir, sep } from "@tauri-apps/api/path";
import { FileHandle, mkdir, open as openFile } from "@tauri-apps/plugin-fs";
import { open, save } from "@tauri-apps/plugin-dialog";
import { AMPERSAND_ARCHIVE_MAGICS, matchMagicNew } from "./magic";
import dayjs from "dayjs";
import { platform } from "@tauri-apps/plugin-os";
import { UUIDable } from "../entities";
import { ArchiveStreamConfig, ArchiveStreamDatabase } from "./archive_types";
async function encode(data: any){
	return msgpackEncode(deleteNull(await walkAsync(data, replace)));
}

function reviver(data: any){
	return walk(data, revive);
}

function intoStream(fd: FileHandle, onRead?: (bytes: number) => void){
	return new ReadableStream({
		async start(controller) {
			async function read() {
				const buf = new Uint8Array(512000);
				const bytesRead = await fd.read(buf);

				if (bytesRead !== null && bytesRead > 0){
					controller.enqueue(buf.slice(0, bytesRead));
					onRead?.(bytesRead);
				}
				else if (bytesRead === null){
					await fd.close();
					return controller.close();
				}

				return read();
			}
			return read();
		}
	});
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

			if (!path) return false;

			const magic = AMPERSAND_ARCHIVE_MAGICS.get(1)!;

			// Android uses content:// for providing scoped file paths; here we just get the FD from the returned URI
			if (!path.startsWith("content://")) {
				// So in all other cases where the path is a real one, be it relative or not, we ensure we have a directory to write to
				const _dirname = await dirname(path);
				await mkdir(_dirname, { recursive: true });
			}

			// Start the file - write magic sequence
			const fd = await openFile(path, { create: true, write: true });
			await fd.write(new Uint8Array(magic));
			progress.dispatchEvent(new Event("start"));

			let progressTotal = 0;
			for (const [_name, table] of Object.entries(getTables()))
				progressTotal += table.count();

			// Write the configuration
			await fd.write(
				await encode({ table: "__config", data: { appConfig, accessibilityConfig, securityConfig } })
			);

			let progressCurrent = 0;
			for (const [name, table] of Object.entries(getTables())) {
				for await (const data of table.iterate()) {
					await fd.write(await encode({ table: name, data }));
					progressCurrent++;
					progress.dispatchEvent(new CustomEvent("progress", { detail: { progress: progressCurrent / progressTotal } }));
				}
			}

			await fd.close();
			progress.dispatchEvent(new Event("finish"));
			return true;
		} catch (_e) {
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
			if (!path) return false;

			const fd = await openFile(path, { read: true });

			const size = (await fd.stat()).size;
			let bytes = 0;
			const _progress = (read) => { bytes += read; emitProgress(bytes, size); };

			progress.dispatchEvent(new Event("start"));

			const magicBytesMaybe = new Uint8Array(10);
			const bytesRead = await fd.read(magicBytesMaybe);
			if (bytesRead === null || bytesRead === 0) return false;

			_progress(bytesRead);

			const magicVersion = matchMagicNew(magicBytesMaybe);
			if (!magicVersion) return false;

			switch (magicVersion) {
				case 1: {
					for (const table of Object.values(getTables())){
						try{
							await table.clear();
						}catch(e){
							console.error(e);
							return false;
						}
					}

					const stream = intoStream(fd, _progress);

					const multiStreamDecoder = decodeMultiStream(stream) as AsyncGenerator<{ table: string, data: any }>;

					for await(const rawData of multiStreamDecoder){
						const data: any = reviver(rawData);
						switch (data.table) {
							case "__config": {
								const _data = data as ArchiveStreamConfig;
								Object.assign(appConfig, _data.data.appConfig);
								Object.assign(accessibilityConfig, _data.data.accessibilityConfig);
								Object.assign(securityConfig, _data.data.securityConfig);
								break;
							}
							default: {
								try {
									const _data = data as ArchiveStreamDatabase;
									const table: ShittyTable<UUIDable> = getTables()[_data.table];
									const result = await table.add(_data.data.uuid, _data.data);
									if (!result) throw new Error(`item already exists: ${_data.data.uuid}`);
								} catch(e) {
									console.error(e);
									return false;
								}
							}
						}
					}
					break;
				}
			}

			progress.dispatchEvent(new Event("finish"));
			return true;
		} catch (_e) {
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
