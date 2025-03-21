import { openPath } from "@tauri-apps/plugin-opener";
import { writeToTemp } from "./cache";
import { openFile as openFileNative } from "./ampersand";

export async function openFile(file: File){
	const path = await writeToTemp(file);
	if (!path) return;

	try{
		await openPath(path);
	}catch(e){
		if(!openFileNative(path))
			return false;
	}

	return true;
}