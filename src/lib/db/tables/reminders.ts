import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUIDable, Reminder, UUID, ReminderComplete, FrontingEntryComplete } from "../entities";
import { getMember, defaultMember } from "./members";
import { TransactionStatus } from "../types";
import { IndexEntry } from "../impl/types";
import { notify, unnotify } from "../../notifications";
import { platform } from "@tauri-apps/plugin-os";
import { Schedule } from "@choochmeque/tauri-plugin-notifications-api";

export async function* getReminders(maxIter = 10){
	const uuids = db.reminders.index.map(x => x.uuid);
	
	const f = (offset: number, maxIter: number) => {
		const chunk: Promise<Reminder>[] = [];
		for (let i = offset; i < offset + maxIter; i++) {
			if (uuids[i]) {
				const data = db.reminders.get(uuids[i]);
				chunk.push(data);
			}
		}
		return chunk;
	};
	
	let offset = 0;
	while (offset < uuids.length) {
		const promises = f(offset, maxIter);
		offset += maxIter;
		for (const promise of promises)
			yield await promise;
	};
}

export async function* getActiveReminders(maxIter = 10) {
	const uuids = db.reminders.index.filter(x => x.active).map(x => x.uuid);

	const f = (offset: number, maxIter: number) => {
		const chunk: Promise<Reminder>[] = [];
		for (let i = offset; i < offset + maxIter; i++) {
			if (uuids[i]) {
				const data = db.reminders.get(uuids[i]);
				chunk.push(data);
			}
		}
		return chunk;
	};

	let offset = 0;
	while (offset < uuids.length) {
		const promises = f(offset, maxIter);
		offset += maxIter;
		for (const promise of promises)
			yield await promise;
	};
}

export async function getReminder(uuid: UUID){
	return await db.reminders.get(uuid);
}

export async function getReminderFromNativeID(id: number){
	const index = db.reminders.index.find(x => id === getNativeID(x));
	if(!index) return undefined;

	return getReminder(index.uuid);
}

export async function toReminderComplete(reminder: Reminder): Promise<ReminderComplete> {
	return {
		...reminder,
		members: reminder.members ? await Promise.all(reminder.members.map(async x => await getMember(x).catch(() => defaultMember(x)))) : undefined,
	};
}

export async function newReminder(reminder: Omit<Reminder, keyof UUIDable>): Promise<TransactionStatus<string>> {
	try{
		const uuid = await db.reminders.add(reminder);

		if(!uuid) throw new Error("already exists in database");

		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "reminders",
			event: "new",
			uuid,
			newData: reminder
		}));

		return { success: true, detail: uuid };
	}catch(_e){
		console.error(_e);
		return { success: false, err: _e };
	}
}

export async function removeReminder(uuid: UUID): Promise<TransactionStatus<void>> {
	try {
		await db.reminders.delete(uuid);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "reminders",
			event: "deleted",
			uuid,
			delta: {}
		}));
		return { success: true };
	} catch (_e) {
		console.error(_e);
		return { success: false, err: _e };
	}
}

export async function updateReminder(newContent: UUIDable & Partial<Reminder>): Promise<TransactionStatus<{ oldData: Reminder, newData: Reminder }>> {
	try{
		const updated = await db.reminders.update(newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "reminders",
				event: "modified",
				uuid: newContent.uuid,
				delta: newContent,
				oldData: updated.oldData,
				newData: updated.newData
			}));
			return { success: true, detail: updated };
		}
		throw new Error("not updated, did not exist in db");
	}catch(_e){
		console.error(_e);
		return { success: false, err: _e };
	}
}

export function getNativeID(reminder: IndexEntry<Reminder>){
	return parseInt(reminder.uuid.split("-")[0]) & 0x7FFFFFFF;
}

let frontingCache: FrontingEntryComplete[];
export async function triggerReminders(fronting: FrontingEntryComplete[]){
	// scheduled notifications are unsupported on computers
	if(!["macos", "ios", "android"].includes(platform())) return;

	if(!frontingCache){
		// cannot trigger anything if we don't know the previous state
		frontingCache = fronting;
		return;
	}

	const reminders = await Array.fromAsync(getActiveReminders());

	for(const reminder of reminders){
		switch(reminder.trigger){
			case "fronting":
				if(reminder.members){
					if (
						!frontingCache.find(x => reminder.members!.includes(x.member.uuid)) &&
						fronting.find(x => reminder.members!.includes(x.member.uuid))
					) {
						await notify(
							getNativeID(reminder),
							reminder.title,
							reminder.message,
							"reminders",
							reminder.delay > 0 ? Schedule.at(new Date(Date.now() + reminder.delay), false, true) : undefined
						);
					} else if (
						frontingCache.find(x => reminder.members!.includes(x.member.uuid)) &&
						!fronting.find(x => reminder.members!.includes(x.member.uuid))
					)
						await unnotify(getNativeID(reminder));
				} else {
					if (frontingCache.length < fronting.length) {
						await notify(
							getNativeID(reminder),
							reminder.title,
							reminder.message,
							"reminders",
							reminder.delay > 0 ? Schedule.at(new Date(Date.now() + reminder.delay), false, true) : undefined
						);
					}
				}
				break;
			case "fronted":
				if(typeof reminder.members !== "undefined"){
					if (
						!frontingCache.find(x => reminder.members!.includes(x.member.uuid)) &&
						fronting.find(x => reminder.members!.includes(x.member.uuid))
					)
						await unnotify(getNativeID(reminder));
					else if (
						frontingCache.find(x => reminder.members!.includes(x.member.uuid)) &&
						!fronting.find(x => reminder.members!.includes(x.member.uuid))
					) {
						await notify(
							getNativeID(reminder),
							reminder.title,
							reminder.message,
							"reminders",
							reminder.delay > 0 ? Schedule.at(new Date(Date.now() + reminder.delay), false, true) : undefined
						);
					}
				} else {
					if (frontingCache.length > fronting.length) {
						await notify(
							getNativeID(reminder),
							reminder.title,
							reminder.message,
							"reminders",
							reminder.delay > 0 ? Schedule.at(new Date(Date.now() + reminder.delay), false, true) : undefined
						);
					}
				}
				break;
		}
	}

	frontingCache = fronting;
}