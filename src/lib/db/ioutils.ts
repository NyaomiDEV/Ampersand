import { Typeson } from "typeson";
import { db } from ".";
import { blob, file, filelist, imagebitmap, imagedata, map, set, typedArrays, undef } from "typeson-registry";
import { decode, encode } from "@msgpack/msgpack";

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

export async function exportDatabaseToBinary(){
	const theEntireDatabase: Record<string, any> = {};
	for(const x of db.tables){
		theEntireDatabase[x.name] = await typeson.encapsulate(await x.toArray());
	}

	return encode(theEntireDatabase);
}

export async function importDatabaseFromBinary(data: Uint8Array) {
	const theEntireDatabase = decode(data) as Record<string, any>;

	for(const key of Object.getOwnPropertyNames(theEntireDatabase)){
		const table = db.tables.find((x) => x.name === key);
		if(table){
			const contents = await typeson.revive(theEntireDatabase[key]);
			await table.clear();
			await table.bulkAdd(contents);
		}
	}
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
