import { Typeson } from "typeson";
import { getTables } from "./tables";
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
	for(const [name, table] of Object.entries(getTables())) database[name] = await Array.fromAsync<any>(table.iterate());

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
	try{
		const revived = await typeson.revive(tablesAndConfig);

		Object.assign(appConfig, revived.config.appConfig);
		Object.assign(accessibilityConfig, revived.config.accessibilityConfig);
		Object.assign(securityConfig, revived.config.securityConfig);

		for (const key of Object.getOwnPropertyNames(revived.database)) {
			const table = getTables()[key];
			if (table) {
				if(await table.clear() === false) return false;
				if(await table.bulkAdd(revived.database[key]) === false) return false;
			}
		}
	}catch(e){
		return false;
	}

	return true;
}

export async function importDatabaseFromBinary(data: Uint8Array) {
	try{
		const theEntireDatabase = decode(await decompressGzip(data)) as Record<string, any>;

		return await _importDatabase(theEntireDatabase);
	}catch(e){
		return false;
	}
}

export async function importDatabaseFromBinaryWithPassword(data: Uint8Array, password: string) {
	try{
		const encodedDatabase = decode(await decompressGzip(data)) as EncryptedPayload;
		const theEntireDatabase = decode(await decrypt(encodedDatabase, password)) as Record<string, any>;

		return await _importDatabase(theEntireDatabase);
	}catch(e){
		return false;
	}
}
