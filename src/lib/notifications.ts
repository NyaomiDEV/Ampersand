import { cancel, Channel, channels, createChannel, isPermissionGranted, Options, removeActive, removeChannel, requestPermission, Schedule, sendNotification } from "@choochmeque/tauri-plugin-notifications-api";
import { platform } from "@tauri-apps/plugin-os";
import { t } from "i18next";

export async function ensureNotifyPerms(request: boolean){
	if(await isPermissionGranted())
		return true;

	if(!request) return false;

	const perm = await requestPermission();
	if(perm !== "granted") return false;

	return true;
}

export async function registerChannels(){
	// channels are only available on android
	if(platform() !== "android") return;

	try{
		const _channels = await channels().catch(_e => [] as Channel[]);
		const _channelsWeWant = [
			{
				id: "frontingNotifications",
				name: t("accessibility:frontingNotification.title"),
				lights: false,
				importance: 1, //as Importance.Min,
				visibility: 0 //as Visibility.Private
			},
			{
				id: "reminders",
				name: t("reminders:header"),
				lights: false,
				importance: 3, //as Importance.Default,
				visibility: 0 //as Visibility.Private
			},
		];

		for (const channel of _channelsWeWant) {
			const existing = _channels.find(x => x.id === channel.id);

			if (!existing) {
				await createChannel(channel).catch(_e => {
					throw new Error(`Failed to create channel: ${_e.message}`);
				});
				continue;
			}

			console.log(existing);

			if (!(
				channel.name === existing.name &&
				channel.lights === existing.lights &&
				// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
				channel.importance === existing.importance &&
				// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
				channel.visibility === existing.visibility
			)) {
				await removeChannel(channel.id).catch(_e => {
					throw new Error(`Failed to remove channel: ${_e.message}`);
				});
				await createChannel(channel).catch(_e => {
					throw new Error(`Failed to create channel (differential): ${_e.message}`);
				});
			}
		}
	}catch(_e){
		console.error(_e);
	}
}

export async function notify(id: number, title: string, body: string, channelId?: string, schedule?: Schedule, opts?: Partial<Options>){
	try{
		await sendNotification({
			id,
			title,
			body,
			largeBody: body,
			schedule,
			channelId,
			icon: "ic_notify_ampersand",
			...opts
		});
	}catch(_e){
		console.error("Problem when notifying:", _e);
		return false;
	}

	return true;
}

export async function unnotify(id: number | number[]) {
	// canceling notifications is not available on pc
	if(!["android", "macos", "ios"].includes(platform()))
		return false;

	try {
		await cancel(typeof id === "number" ? [id] : id);
	} catch (_e) {
		console.error("Problem when canceling notification:", _e);
		return false;
	}

	return true;
}

export async function remove(id: number | number[]){
	// canceling notifications is not available on pc
	if (!["android", "macos", "ios"].includes(platform()))
		return false;

	try {
		await removeActive(
			typeof id === "number"
				? [{ id }]
				: id.map(x => ({ id: x }))
		);
	} catch (_e) {
		console.error("Problem when removing an active notification:", _e);
		return false;
	}

	return true;
}