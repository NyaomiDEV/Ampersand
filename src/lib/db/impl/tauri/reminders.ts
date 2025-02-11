import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../../events";
import { UUIDable, Reminder, UUID } from "../../entities";

export function getReminders(){
	return db.reminders.toArray();
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
			data: uuid
		}));
		return uuid;
	}catch(error){
		return false;
	}
}

export async function removeReminder(uuid: UUID) {
	try {
		await db.reminders.delete(uuid);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "reminders",
			event: "deleted",
			data: uuid
		}));
		return true;
	} catch (error) {
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
				data: uuid
			}));
			return true;
		}
		return false;
	}catch(error){
		return false;
	}
}
