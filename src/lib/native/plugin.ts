import { invoke, InvokeArgs, InvokeOptions, addPluginListener } from "@tauri-apps/api/core";
import { writeToTemp } from "./cache";
import { replace, walk } from "../json";

function invokePlugin(cmd: string, args?: InvokeArgs, opts?: InvokeOptions): Promise<unknown> {
	return invoke(`plugin:ampersand|${cmd}`, args, opts);
}

export function dismissSplash(): Promise<void> {
	return invokePlugin("dismiss_splash") as Promise<void>;
}

export function setCanGoBack(canGoBack: boolean): Promise<void> {
	return invokePlugin("set_can_go_back", { canGoBack }) as Promise<void>;
}

export async function openFile(file: File) {
	//if(platform() === "ios") return false; // iOS open is unsupported
	const path = await writeToTemp(file);
	if (!path) return false;

	try {
		await invokePlugin("open_file", { path });
		return true;
	} catch (_e) {
		return false;
	}
}

export async function testDb(): Promise<string> {
	return invokePlugin("test_db") as Promise<string>;
}

export async function listAssets(path: string): Promise<string[]> {
	return invokePlugin("list_assets", { path }) as Promise<string[]>;
}

export async function getWebkitVersion(): Promise<string> {
	return invoke<string>("get_webkit_version");
}

export async function broadcastEvent(event: string, payload: object): Promise<void> {
	return invokePlugin("broadcast_event", {
		payload: JSON.stringify({
			event,
			data: walk(payload, replace)
		}) 
	}) as Promise<void>;
}

export async function addMobileListener(event: string, handler: () => void){
	try{
		await addPluginListener("ampersand", event, handler);
	}catch(e){
		console.error("Ampersand listener failed", e);
	}
}
