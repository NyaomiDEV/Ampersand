import { invoke, InvokeArgs, InvokeOptions, addPluginListener } from "@tauri-apps/api/core";
import { replace, walk } from "../json";

export function invokePlugin<T>(cmd: string, args?: InvokeArgs, opts?: InvokeOptions){
	return invoke<T>(`plugin:ampersand|${cmd}`, args, opts);
}

export function dismissSplash(): Promise<void> {
	return invokePlugin("dismiss_splash") as Promise<void>;
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

export async function testDb(): Promise<string> {
	return invokePlugin<string>("db_test");
}

export async function runDbMigrations(): Promise<void> {
	return invokePlugin<void>("db_run_migrations");
}

export async function migrateOldDb(): Promise<void> {
	return invokePlugin<void>("db_migrate_old");
}

export async function listAssets(path: string): Promise<string[]> {
	return invokePlugin("list_assets", { path });
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
