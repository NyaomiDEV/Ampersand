import { decode, encode } from "@msgpack/msgpack";
import { appConfigDir, appDataDir, sep } from "@tauri-apps/api/path";
import { mkdir, readFile, writeFile } from "@tauri-apps/plugin-fs";

async function getConfigDirectory(){
	const tauriAppConfigDir = await appConfigDir();
	const tauriAppDataDir = await appDataDir();

	if(tauriAppConfigDir === tauriAppDataDir)
		return `${tauriAppDataDir + sep()}config`;
	else
		return tauriAppConfigDir;
}

const ourConfigDir = await getConfigDirectory();

try {
	await mkdir(ourConfigDir, { recursive: true });
}catch(e){
	console.error(e);
}

export async function getConfig<T>(name: string): Promise<T | undefined> {
	const configDir = `${ourConfigDir + sep() + name}.conf`;

	try {
		const blob = await readFile(configDir);
		return decode(blob) as T;
	} catch(e) {
		console.error(e);
		return undefined;
	}
}

export async function saveConfig<T>(name: string, values: T) {
	const configDir = `${ourConfigDir + sep() + name}.conf`;

	try {
		await writeFile(configDir, encode(values));
		return true;
	} catch (e) {
		console.error(e);
		return false;
	}
}
