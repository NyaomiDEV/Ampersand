import { Typeson } from "typeson";
import { blob, file, filelist, map, typedArrays, undef, set as Tset, imagebitmap, imagedata } from "typeson-registry";

const typeson = new Typeson({
	sync: true
}).register([
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

export function set(key: string, value: any){
	return window.localStorage.setItem(key, JSON.stringify(typeson.encapsulate(value)));
}

export function get(key: string): any {
	const value = window.localStorage.getItem(key);

	try{
		if (value !== "undefined" && value !== null) {
			const obj = JSON.parse(value);
			return typeson.revive(obj);
		}
	}catch(e){
		console.error(e, value?.split(""));
	}

	return undefined;
}
