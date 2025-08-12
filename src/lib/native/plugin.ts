import { invoke, InvokeArgs, InvokeOptions, addPluginListener } from "@tauri-apps/api/core";
import { writeToTemp } from "./cache";

function invokePlugin(cmd: string, args?: InvokeArgs, opts?: InvokeOptions): Promise<any> {
	return invoke("plugin:ampersand|" + cmd, args, opts);
}

export function exitApp(): Promise<void> {
	return invokePlugin("exit_app");
}

export function setCanGoBack(canGoBack: boolean): Promise<void> {
	return invokePlugin("set_can_go_back", { canGoBack });
}

export async function openFile(file: File) {
	const path = await writeToTemp(file);
	if (!path) return false;

	try {
		await invokePlugin("open_file", { path });
		return true;
	} catch (e) {
		return false;
	}
}

export async function addMobileListener(event: string, handler: () => void){
	try{
		await addPluginListener("ampersand", event, handler);
	}catch(e){
		console.error("Ampersand listener failed", e);
	}
}