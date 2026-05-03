import { cancel, isPermissionGranted, Options, requestPermission, sendNotification } from "@choochmeque/tauri-plugin-notifications-api";

async function ensureNotifyPerms(){
	if(await isPermissionGranted())
		return true;

	const perm = await requestPermission();
	if(perm !== "granted") return false;

	return true;
}

export async function notify(opts: Options){
	await ensureNotifyPerms();

	try{
		await sendNotification(opts);
	}catch(_e){
		console.error(_e);
		return false;
	}

	return true;
}

export async function unnotify(id: number | number[]) {
	await ensureNotifyPerms();

	try {
		await cancel(typeof id === "number" ? [id] : id);
	} catch (_e) {
		console.error(_e);
		return false;
	}

	return true;
}