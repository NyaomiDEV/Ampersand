import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUIDable, Reminder, UUID } from "../entities";

export function getReminders(){
	return db.reminders.iterate();
}

export async function newReminder(reminder: Omit<Reminder, keyof UUIDable>) {
	try{
		const uuid = window.crypto.randomUUID();
		await db.reminders.add(uuid, {
			...reminder,
			uuid
		} as Reminder);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "reminders",
			event: "new",
			uuid,
			newData: reminder
		}));
		return uuid;
	}catch(_error){
		return false;
	}
}

export function getReminder(uuid: UUID){
	return db.reminders.get(uuid);
}

export async function removeReminder(uuid: UUID) {
	try {
		await db.reminders.delete(uuid);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "reminders",
			event: "deleted",
			uuid,
			delta: {}
		}));
		return true;
	} catch (_error) {
		return false;
	}
}

export async function updateReminder(uuid: UUID, newContent: Partial<Reminder>) {
	try{
		const updated = await db.reminders.update(uuid, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "reminders",
				event: "modified",
				uuid,
				delta: newContent,
				oldData: updated.oldData,
				newData: updated.newData
			}));
			return true;
		}
		return false;
	}catch(_error){
		return false;
	}
}
