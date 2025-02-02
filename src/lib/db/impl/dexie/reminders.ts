import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../../events";
import { makeUUIDv5 } from "../../../util/uuid";
import { UUIDable, Reminder, UUID } from "../../entities";
import { getSystemUUID } from "./system";

async function genid(name: string) {
	return makeUUIDv5((await getSystemUUID())!, `reminders\0${name}\0${Date.now()}`);
}

export function getReminders(){
	return db.reminders.toArray();
}

export async function newReminder(reminder: Omit<Reminder, keyof UUIDable>) {
	try{
		const uuid = await genid(reminder.name);
		await db.reminders.add({
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
