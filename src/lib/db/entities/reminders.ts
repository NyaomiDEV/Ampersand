import { UUIDable } from "../types";

export type Reminder = UUIDable & {
	name: string,
	title: string,
	message: string,
	type: "event" | "periodic"
}

export type EventReminder = Reminder & {
	triggeringEvent: {
		type: "memberAdded" | "memberRemoved",
		filterQuery?: string
	},
	delay: number // seconds
}

export type PeriodicReminder = Reminder & {
	scheduleOn: {
		year?: number,
		month?: number,
		day?: number,
		weekday?: 1|2|3|4|5|6|7,
		hour?: number,
		minute?: number,
		second?: number
	}
}