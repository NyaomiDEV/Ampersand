import { Typeson } from "typeson";
import { getTables } from ".";
import { blob, file, filelist, imagebitmap, imagedata, map, set, typedArrays, undef } from "typeson-registry";
import { decode, encode } from "@msgpack/msgpack";
import { compressGzip, decompressGzip } from "../util/misc";
import { EncryptedPayload, decrypt, encrypt } from "../util/crypto";
import { accessibilityConfig, appConfig, securityConfig } from "../config";

const typeson = new Typeson({
	sync: false
}).register([
	file,
	filelist,
	blob,
	typedArrays,
	undef,
	map,
	set,
	imagebitmap,
	imagedata
]);

async function _exportDatabase(){
	const config = await typeson.encapsulate({ appConfig, accessibilityConfig, securityConfig });
	const database = await Promise.all(getTables().map(async x => await typeson.encapsulate(await x.toArray())));

	return { config, database };
}

export async function exportDatabaseToBinary(){
	const theEntireDatabase = await _exportDatabase();

	return await compressGzip(encode(theEntireDatabase));
}

export async function exportDatabaseToBinaryWithPassword(password: string){
	const theEntireDatabase = await _exportDatabase();
	const encodedDatabase = await encrypt(encode(theEntireDatabase), password);

	return await compressGzip(encode(encodedDatabase));
}

async function _importDatabase(tablesAndConfig: Record<"database" | "config", any>){
	for (const key of Object.getOwnPropertyNames(tablesAndConfig.database)) {
		const table = getTables().find((x) => x.name === key);
		if (table) {
			const contents = await typeson.revive(tablesAndConfig.database[key]);
			await table.clear();
			await table.bulkAdd(contents);
		}
	}
	const config = await typeson.revive(tablesAndConfig.config);
	Object.assign(appConfig, config.appConfig);
	Object.assign(accessibilityConfig, config.accessibilityConfig);
	Object.assign(securityConfig, config.securityConfig);
}

export async function importDatabaseFromBinary(data: Uint8Array) {
	const theEntireDatabase = decode(await decompressGzip(data)) as Record<string, any>;

	return await _importDatabase(theEntireDatabase);
}

export async function importDatabaseFromBinaryWithPassword(data: Uint8Array, password: string) {
	const encodedDatabase = decode(await decompressGzip(data)) as EncryptedPayload;
	const theEntireDatabase = decode(await decrypt(encodedDatabase, password)) as Record<string, any>;

	return await _importDatabase(theEntireDatabase);
}
