// This file specifically works around this issue here:
// https://github.com/tauri-apps/plugins-workspace/issues/3366

import { invoke } from "@tauri-apps/api/core";
import { open as dialogOpen, save as dialogSave } from "@tauri-apps/plugin-dialog";
import { platform } from "@tauri-apps/plugin-os";

export async function open(...args: Parameters<typeof dialogOpen>): Promise<string | null> {
	const promise = dialogOpen(...args);
	if(platform() === "android"){
		const iid = setInterval(async () => await invoke("noop"), 200);
		try {
			return await promise;
		} finally {
			clearInterval(iid);
		}
	} else
		return await promise;
}

export async function save(...args: Parameters<typeof dialogSave>): Promise<string | null> {
	const promise = dialogSave(...args);
	if(platform() === "android"){
		const iid = setInterval(async () => await invoke("noop"), 200);
		try {
			return await promise;
		} finally {
			clearInterval(iid);
		}
	} else
		return await promise;
}