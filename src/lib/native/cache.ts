import { sep } from "@tauri-apps/api/path";
import { remove, writeFile } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";

async function ourTempDir(){
	// Assuming we have a string at the other side, it will be passed just fine
	return invoke<string>("our_temp_dir");
}

export async function clearTempDir(){
	// Result<T, Err> in Rust is mapped to a Promise<T> which rejects with Err
	try {
		await invoke<void>("clear_temp_dir");
		return true;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	}catch(e){
		return false;
	}
}

export async function writeToTemp(file: File){
	try{
		const path = await ourTempDir() + sep() + file.name;
		await writeFile(path, new Uint8Array(await file.arrayBuffer()));
		return path;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	}catch(e){
		return null;
	}
}

export async function deleteFromTemp(file: File | string){
	try {
		const path = await ourTempDir() + sep() + (typeof file === "string" ? file : file.name);
		await remove(path);
		return true;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (e) {
		return false;
	}
}
