import { Typeson } from "typeson";
import { getTables, ShittyTable } from "./tables";
import { file, map, undef } from "typeson-registry";
import { decode, encode } from "@msgpack/msgpack";
import { compressGzip, decompressGzip } from "../util/misc";
import { accessibilityConfig, appConfig, securityConfig } from "../config";
import { UUIDable } from "./entities";
import { replace, revive, walk } from "../json";

const typeson = new Typeson({
	sync: false
}).register([
	file,
	undef,
	map
]);

async function _exportDatabase(){
	const config = { appConfig, accessibilityConfig, securityConfig };
	const database: Record<string, unknown> = {};
	for(const [name, table] of Object.entries(getTables())) database[name] = await Array.fromAsync<unknown>(table.iterate());

	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return walk({ config, database }, replace);
}

export async function exportDatabaseToBinary(){
	const theEntireDatabase = await _exportDatabase();

	return await compressGzip(encode(theEntireDatabase) as Uint8Array<ArrayBuffer>);
}

async function _importDatabase(tablesAndConfig){
	try{
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let revived: any;
		if(tablesAndConfig.$types) // typeson
			revived = await typeson.revive(tablesAndConfig);
		else
			revived = walk(tablesAndConfig, revive);

		Object.assign(appConfig, revived.config.appConfig);
		Object.assign(accessibilityConfig, revived.config.accessibilityConfig);
		Object.assign(securityConfig, revived.config.securityConfig);

		for (const key of Object.getOwnPropertyNames(revived.database)) {
			const table: ShittyTable<UUIDable> = getTables()[key];
			if (table) {
				if(await table.clear() === false) return false;
				if(await table.bulkAdd(revived.database[key]) === false) return false;
			}
		}
	}catch(_e){
		console.error(_e);
		return false;
	}

	return true;
}

export async function importDatabaseFromBinary(data: Uint8Array<ArrayBuffer>) {
	try{
		const theEntireDatabase = decode(await decompressGzip(data)) as Record<string, unknown>;

		return await _importDatabase(theEntireDatabase);
	}catch(_e){
		return false;
	}
}
