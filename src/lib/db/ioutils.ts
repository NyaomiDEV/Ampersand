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
	const config = { appConfig, accessibilityConfig, securityConfig };
	const database: Record<string, any> = {};
	for(const table of getTables()) database[table.name] = await table.toArray();

	return await typeson.encapsulate({ config, database });
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

async function _importDatabase(tablesAndConfig){
	const revived = await typeson.revive(tablesAndConfig);

	for (const key of Object.getOwnPropertyNames(revived.database)) {
		const table = getTables().find((x) => x.name === key);
		if (table) {
			await table.clear();
			await table.bulkAdd(revived.database[key]);
		}
	}

	const config = await typeson.revive(revived.config);
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
