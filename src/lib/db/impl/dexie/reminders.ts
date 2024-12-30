import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../..";
import { makeUUIDv5 } from "../../../util/uuid";
import { UUIDable, Reminder } from "../../entities";
import { getSystemUUID } from "./system";

async function genid(name: string) {
	return makeUUIDv5((await getSystemUUID())!, `reminders\0${name}`);
}

export async function newReminder(reminder: Omit<Reminder, keyof UUIDable>) {
	try{
		const uuid = await genid(reminder.name);
		await db.reminders.add({
			...reminder,
			uuid
		});
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
