import { invoke as i, InvokeArgs, InvokeOptions, addPluginListener } from "@tauri-apps/api/core";

function invoke(cmd: string, args?: InvokeArgs, opts?: InvokeOptions): Promise<any> {
	return i("plugin:ampersand|" + cmd, args, opts);
}

export function exitApp(): Promise<void> {
	return invoke("exit_app");
}

export function setCanGoBack(canGoBack: boolean): Promise<void> {
	return invoke("set_can_go_back", { canGoBack });
}

export async function openFile(path: string): Promise<boolean> {
	try{
		await invoke("open_file", { path });
		return true;
	}catch(e){
		return false;
	}
}

export function addListener(event: string, handler: () => void){
	return addPluginListener("ampersand", event, handler);
}