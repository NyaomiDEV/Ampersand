import { cancel, isPermissionGranted, Options, requestPermission, sendNotification } from "@choochmeque/tauri-plugin-notifications-api";

async function ensureNotifyPerms(request: boolean){
	if(await isPermissionGranted())
		return true;

	if(!request) return false;

	const perm = await requestPermission();
	if(perm !== "granted") return false;

	return true;
}

export async function notify(opts: Options){
	await ensureNotifyPerms(true);

	try{
		await sendNotification(opts);
	}catch(_e){
		console.error(_e);
		return false;
	}

	return true;
}

export async function unnotify(id: number | number[]) {
	await ensureNotifyPerms(false);

	try {
		await cancel(typeof id === "number" ? [id] : id);
	} catch (_e) {
		console.error(_e);
		return false;
	}

	return true;
}