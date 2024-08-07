import { db } from "..";
import { makeUUIDv5 } from "../../util/uuid";
import { UUIDable } from "../types";
import { getSystemUUID } from "./system";

type ReminderBase = UUIDable & {
	name: string,
	title: string,
	message: string,
	type: "event" | "periodic"
}

export type EventReminder = ReminderBase & {
	triggeringEvent?: {
		type: "memberAdded" | "memberRemoved",
		filterQuery?: string
	},
	delay?: number // seconds
}

export type PeriodicReminder = ReminderBase & {
	scheduleOn?: {
		year?: number,
		month?: number,
		day?: number,
		weekday?: 1|2|3|4|5|6|7,
		hour?: number,
		minute?: number,
		second?: number
	}
}

export type Reminder = EventReminder | PeriodicReminder;

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
