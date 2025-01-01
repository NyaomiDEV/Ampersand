import { Typeson } from "typeson";
import { blob, file, filelist, map, typedArrays, undef, set as Tset, imagebitmap, imagedata } from "typeson-registry";
import { load } from '@tauri-apps/plugin-store';
import * as path from '@tauri-apps/api/path';

const store = await load(await path.join(await path.appConfigDir(), "appConfig.json"));

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

export function set(key: string, value: any): Promise<void> {
	return store.set(key, typeson.encapsulate(value));
}

export async function get(key: string): Promise<any> {
	const value: any = await store.get(key);

	try {
		if (typeof value !== "undefined" && value !== null) {
			return typeson.revive(value);
		}
	} catch (e) {
		console.error(e, value);
	}

	return undefined;
}
