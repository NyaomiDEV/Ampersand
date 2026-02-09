import { invoke, InvokeArgs, InvokeOptions, addPluginListener } from "@tauri-apps/api/core";
import { replace, walk } from "../util/json";

export function invokePlugin<T>(cmd: string, args?: InvokeArgs, opts?: InvokeOptions){
	return invoke<T>(`plugin:ampersand|${cmd}`, args, opts);
}

export function dismissSplash(): Promise<void> {
	return invokePlugin<void>("dismiss_splash");
}

export function setCanGoBack(canGoBack: boolean): Promise<void> {
	return invokePlugin<void>("set_can_go_back", { canGoBack });
}

export async function openFile(path: string) {
	try {
		await invokePlugin("open_file", { path });
		return true;
	} catch (_e) {
		return false;
	}
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
	});
}

export async function addMobileListener(event: string, handler: () => void) {
	try {
		await addPluginListener("ampersand", event, handler);
	} catch (e) {
		console.error("Ampersand listener failed", e);
	}
}
