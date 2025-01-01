import { Typeson } from "typeson";
import { blob, file, filelist, map, typedArrays, undef, set as Tset, imagebitmap, imagedata } from "typeson-registry";

const typeson = new Typeson().register([
	file,
	filelist,
	blob,
	typedArrays,
	undef,
	map,
	Tset,
	imagebitmap,
	imagedata
]);

export async function set(key: string, value: any): Promise<void> {
	return window.localStorage.setItem(key, JSON.stringify(await typeson.encapsulate(value)));
}

export async function get(key: string): Promise<any> {
	const value = window.localStorage.getItem(key);

	try{
		if (typeof value !== "undefined" && value !== null) {
			const obj = JSON.parse(value);
			return await typeson.revive(obj);
		}
	}catch(e){
		console.error(e, value);
	}

	return undefined;
}
