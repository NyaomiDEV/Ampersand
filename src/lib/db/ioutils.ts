import { Typeson } from "typeson";
import { getTables, ShittyTable } from "./tables";
import { file, map, undef } from "typeson-registry";
import { decode, encode } from "@msgpack/msgpack";
import { compressGzip, decompressGzip } from "../util/misc";
import { accessibilityConfig, appConfig, securityConfig } from "../config";
import { UUIDable } from "./entities";
import { deleteNull, replace, revive, walk } from "../json";

const typeson = new Typeson({
	sync: false
}).register([
	file,
	undef,
	map
]);

async function _exportDatabase(progress: EventTarget){
	progress.dispatchEvent(new Event("start"));
	const config = { appConfig, accessibilityConfig, securityConfig };
	const database: Record<string, Array<unknown>> = {};

	let progressTotal = 0;
	for(const [_name, table] of Object.entries(getTables())) 
		progressTotal += table.count();
	
	let progressCurrent = 0;
	for (const [name, table] of Object.entries(getTables())) {
		database[name] = [];
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		for (const x of table.index.map(x => x.uuid)) {
			const data = await table.get(x);
			if (data) database[name].push(data);
			progressCurrent++;
			progress.dispatchEvent(new CustomEvent("progress", { detail: { progress: progressCurrent / progressTotal } }));
		}
	}

	progress.dispatchEvent(new Event("finish"));
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return deleteNull(walk({ config, database }, replace));
}

export function exportDatabaseToBinary(){
	const progress = new EventTarget();
	const dbPromise = _exportDatabase(progress).then(res => compressGzip(encode(res) as Uint8Array<ArrayBuffer>));

	return { progress, dbPromise };
}

async function _importDatabase(tablesAndConfig: Record<string, unknown>, progress: EventTarget){
	try{
		progress.dispatchEvent(new Event("start"));
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let revived: any;
		if(tablesAndConfig.$types) // typeson
			revived = await typeson.revive(tablesAndConfig);
		else
			revived = walk(tablesAndConfig, revive);

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
				if(await table.clear() === false) return false;
				if(await table.bulkAdd(revived.database[key]) === false) return false;
			}
			progressCurrent++;
			progress.dispatchEvent(new CustomEvent("progress", { detail: { progress: progressCurrent / progressTotal } }));
		}
	}catch(_e){
		console.error(_e);
		return false;
	}

	progress.dispatchEvent(new Event("finish"));
	return true;
}

export function importDatabaseFromBinary(data: Uint8Array<ArrayBuffer>) {
	const progress = new EventTarget();
	const stream = decompressGzip(data);
	const dbPromise = new Response(stream).bytes().then(res => _importDatabase(decode(res) as Record<string, unknown>, progress));

	return { progress, dbPromise };
}
