import { openPath } from "@tauri-apps/plugin-opener";
import { writeToTemp } from "./cache";

export async function openFile(file: File){
	const path = await writeToTemp(file);
	if (!path) return;

	try{
		await openPath(path);
	}catch(e){
		if(!window.AmpersandNative.openFile(path))
			return false;
	}

	return true;
}