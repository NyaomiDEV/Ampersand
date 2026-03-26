/* eslint-disable @typescript-eslint/no-explicit-any */
import { decodeMultiStream, encode as msgpackEncode } from "@msgpack/msgpack";
import { accessibilityConfig, appConfig, securityConfig } from "../../config";
import { getTables, ShittyTable } from "../tables";
import { deleteNull, replace, walk } from "../../serialization";
import { dirname, documentDir, sep } from "@tauri-apps/api/path";
import { mkdir, open as openFile } from "@tauri-apps/plugin-fs";
import { open, save } from "@tauri-apps/plugin-dialog";
import { AMPERSAND_ARCHIVE_MAGICS, matchMagicNew } from "./magic";
import dayjs from "dayjs";
import { platform } from "@tauri-apps/plugin-os";
import { UUIDable } from "../entities";

function encode(data: any){
	return msgpackEncode(deleteNull(walk(data, replace)));
}

function revive(data: any){
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return walk(data, revive);
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
				encode({ table: "__config", data: { appConfig, accessibilityConfig, securityConfig } })
			);

			let progressCurrent = 0;
			for (const [name, table] of Object.entries(getTables())) {
				for await (const data of table.iterate()) {
					await fd.write(encode({ table: name, data }));
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
			const magicBytesMaybe = new Uint8Array(10);
			await fd.read(magicBytesMaybe);
			const magicVersion = matchMagicNew(magicBytesMaybe);
			if (!magicVersion) return false;

			progress.dispatchEvent(new Event("start"));

			switch (magicVersion) {
				case 1: {
					//for (const table of Object.values(getTables())) if (!await table.clear()) return false;

					const stream = new ReadableStream({
						type: "bytes",
						async start(controller) {
							async function read(){
								console.log("reading");
								const buf = new Uint8Array(1024);
								const bytesRead = await fd.read(buf);

								if(bytesRead !== null && bytesRead > 0)
									controller.enqueue(buf.slice(0, bytesRead));
								else if(bytesRead === null)
									return;

								return read();
							}
							return read();
						}
					});

					const multiStreamDecoder = decodeMultiStream(stream) as AsyncGenerator<{ table: string, data: any }>;

					for await (const rawData of multiStreamDecoder){
						console.log(rawData);
						const data = revive(rawData);
						console.log(data);
						switch(data.table){
							case "__config": {
								Object.assign(appConfig, data.data.appConfig);
								Object.assign(accessibilityConfig, data.data.accessibilityConfig);
								Object.assign(securityConfig, data.data.securityConfig);
								break;
							}
							default: {
								const table: ShittyTable<UUIDable> = getTables()[data.table];
								await table.add(data.data.uuid, data.data);
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

	const progress = new EventTarget();
	const status = _import();
	return { progress, status };
}
