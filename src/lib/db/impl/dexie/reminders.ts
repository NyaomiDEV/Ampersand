import { db } from ".";
import { makeUUIDv5 } from "../../../util/uuid";
import { UUIDable, Reminder } from "../../entities";
import { getSystemUUID } from "./system";

export function getRemindersTable() {
	return db.reminders;
}

async function genid(name: string) {
	return makeUUIDv5((await getSystemUUID())!, `reminders\0${name}`);
}

export async function newReminder(reminder: Omit<Reminder, keyof UUIDable>) {
	const uuid = await genid(reminder.name);
	return await getRemindersTable().add({
		...reminder,
		uuid
	});
}
