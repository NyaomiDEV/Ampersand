import { resolve, tempDir } from "@tauri-apps/api/path"
import { exists, mkdir, readDir, remove, writeFile } from "@tauri-apps/plugin-fs";

async function ourTempDir(){
	const path = await resolve(
		await tempDir(),
		"ampersandTemp"
	);

	if(!await exists(path)){
		try{
			await mkdir(path, { recursive: true });
		}catch(e){
			return "";
		}
	}

	return path;
}

export async function clearTempDir(){
	try{
		const _ourTempDir = await ourTempDir();
		for (const f of await readDir(_ourTempDir)) {
			await remove(await resolve(_ourTempDir, f.name));
		}
	}catch(e){
		return false;
	}
	return true;
}

export async function writeToTemp(file: File){
	try{
		const path = await resolve(
			await ourTempDir(),
			file.name
		);
		(window as any).file = file;
		await writeFile(path, new Uint8Array(await file.arrayBuffer()));
		return path;
	}catch(e){
		return null;
	}
}

export async function deleteFromTemp(file: File | string){
	try {
		const path = await resolve(
			await ourTempDir(),
			typeof file == "string" ? file : file.name
		);
		await remove(path);
		return true;
	} catch (e) {
		return false;
	}
}

