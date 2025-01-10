import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../../events";
import { makeUUIDv5 } from "../../../util/uuid";
import { UUIDable, Reminder } from "../../entities";
import { getSystemUUID } from "./system";

async function genid(name: string) {
	return makeUUIDv5((await getSystemUUID())!, `reminders\0${name}\0${Date.now()}`);
}

export async function newReminder(reminder: Omit<Reminder, keyof UUIDable>) {
	try{
		const uuid = await genid(reminder.name);
		await db.reminders.add(uuid, {
			...reminder,
			uuid
		} as Reminder);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "reminders",
			event: "new",
			data: uuid
		}));
		return true;
	}catch(error){
		return false;
	}
}
