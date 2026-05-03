import { cancel, channels, createChannel, Importance, isPermissionGranted, Options, removeChannel, requestPermission, sendNotification, Visibility } from "@choochmeque/tauri-plugin-notifications-api";
import { platform } from "@tauri-apps/plugin-os";
import { t } from "i18next";

async function ensureNotifyPerms(request: boolean){
	if(await isPermissionGranted()){
		await registerChannels();
		return true;
	}

	if(!request) return false;

	const perm = await requestPermission();
	if(perm !== "granted") return false;

	await registerChannels();
	return true;
}

async function registerChannels(){
	if(platform() !== "android") return;

	const _channels = await channels();
	const _channelsWeWant = [{
		id: "frontingNotifications",
		name: t("accessibility:frontingNotification.title"),
		lights: false,
		importance: Importance.None,
		visibility: Visibility.Private
	}];

	for(const channel of _channelsWeWant){
		const existing = _channels.find(x => x.id === channel.id);

		if(!existing) {
			await createChannel(channel);
			continue;
		}

		if(!(
			channel.name === existing.name &&
			channel.lights === existing.lights &&
			channel.importance === existing.importance &&
			channel.visibility === existing.visibility
		)){
			await removeChannel(channel.id);
			await createChannel(channel);
		}
	}
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