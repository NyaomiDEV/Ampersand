import { invoke as i, InvokeArgs, InvokeOptions } from "@tauri-apps/api/core";

function invoke(cmd: string, args?: InvokeArgs, opts?: InvokeOptions): Promise<any> {
	return i("plugin:ampersand|" + cmd, args, opts);
}

export function exitApp(): Promise<void> {
	return invoke("exit_app");
}

export async function openFile(path: string): Promise<boolean> {
	try{
		await invoke("open_file", { path });
		return true;
	}catch(e){
		return false;
	}
}
