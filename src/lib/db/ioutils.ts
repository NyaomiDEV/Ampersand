import { Typeson } from "typeson";
import { db } from ".";
import { blob, file, filelist, imagebitmap, imagedata, map, set, typedArrays, undef } from "typeson-registry";
import { decode, encode } from "@msgpack/msgpack";
import { compressGzip, decompressGzip } from "../util/misc";
import { EncryptedPayload, decrypt, encrypt } from "../util/crypto";

const typeson = new Typeson({
	sync: false,

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
	const theEntireDatabase: Record<string, any> = {};
	for (const x of db.tables) {
		theEntireDatabase[x.name] = await typeson.encapsulate(await x.toArray());
	}

	return theEntireDatabase;
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

async function _importDatabase(theEntireDatabase: Record<string, any>){
	for (const key of Object.getOwnPropertyNames(theEntireDatabase)) {
		const table = db.tables.find((x) => x.name === key);
		if (table) {
			const contents = await typeson.revive(theEntireDatabase[key]);
			await table.clear();
			await table.bulkAdd(contents);
		}
	}
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

export async function exportTableToBinary(tableName: string){
	const table = db.tables.find((x) => x.name === tableName);
	if(table){
		return encode(
			await typeson.encapsulate(await table.toArray())
		)
	}
	return null;
}

export async function importTableFromBinary(tableName: string, data: Uint8Array){
	const table = db.tables.find((x) => x.name === tableName);
	if (table) {
		const contents = await typeson.revive(decode(data));
		await table.clear();
		return await table.bulkAdd(contents);
	}
	return null;
}
