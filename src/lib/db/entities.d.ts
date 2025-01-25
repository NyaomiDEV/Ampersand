export interface UUIDable {
	uuid: UUID
};

export type UUID = string;

export interface BoardMessage extends UUIDable {
	member: UUID,
	title: string,
	body: string,
	date: Date
}

export interface BoardMessageComplete extends BoardMessage {
	member: Member
}

export interface ChatMessage extends UUIDable {
	chat: UUID,
	member: UUID,
	date: Date,
	message: string,
}

export interface Chat extends UUIDable {
	name: string,
	image?: File
}

export interface FrontingEntry extends UUIDable {
	member: UUID,
	startTime: Date,
	endTime?: Date,
	isMainFronter: boolean,
	customStatus?: string
}

export interface FrontingEntryComplete extends FrontingEntry {
	member: Member
}

export interface JournalPost extends UUIDable {
	member: UUID,
	date: Date,
	title: string,
	body: string,
	cover?: File,
	attachments?: Attachment[],
	tags: UUID[] // array of UUIDs
}

export interface Attachment extends UUIDable {
	name: string,
	file: File
}

export interface Member extends UUIDable {
	name: string,
	pronouns?: string,
	description?: string,
	role?: string,
	image?: File,
	color?: string, // todo
	isArchived: boolean,
	isCustomFront: boolean, // todo
	tags: UUID[] // array of UUIDs
}

interface ReminderBase extends UUIDable {
	name: string,
	title: string,
	message: string,
	nativeId?: number // if nativeId is present then the reminder is active
}

interface EventReminder extends ReminderBase {
	type: "event",
	triggeringEvent: {
		type: "memberAdded" | "memberRemoved",
		filterQuery?: string
	},
	delay: {
		hours: number,
		minutes: number
	},

	// make it either-or in regards to PeriodicReminder
	scheduleEveryDateInterval?: never,
	scheduleEveryWeekdayInterval?: never,
	scheduleTimeInterval?: never
}

/*
	periodic reminders are strange in how they work.
	let's suppose you want a notification every day at 7.30:
	you'd set the minutes at 30, the hours at 7
	but you shall not set the day, as an undefined value means "it will repeat every day".
	once you set a day, it will repeat every month on that day,
	and by this fashion, if you set a month it will repeat every year that month,
	that day, so on and so forth.

	to keep this consistent and simple, seconds will be always set to zero,
	the hours and minutes will always be asked.

	the frontend should then ask "every day" or "set a day in the month"
	and so on and so forth, "every month" or "set a month in the year"...

	the problem is that we can't do stuff "every two days, every three days" in this way,
	and Tauri doesn't give us any better ways, sadly.
*/
interface PeriodicReminderBase extends ReminderBase {
	type: "periodic",
	scheduleTimeInterval?: {
		hour?: number,
		minute?: number,
		second?: number
	}

	// make it either-or in regards to EventReminder
	triggeringEvent?: never,
	delay?: never
}

interface PeriodicReminderDate extends PeriodicReminderBase {
	scheduleEveryDateInterval?: {
		year?: number,
		month?: number,
		day?: number,
	},
	scheduleEveryWeekdayInterval?: never
}
interface PeriodicReminderWeekday extends PeriodicReminderBase {
	scheduleEveryWeekdayInterval?: {
		monday?: boolean,
		tuesday?: boolean,
		wednesday?: boolean,
		thursday?: boolean,
		friday?: boolean,
		saturday?: boolean,
		sunday?: boolean
	},
	scheduleEveryDateInterval?: never
}

export type PeriodicReminder = PeriodicReminderDate | PeriodicReminderWeekday;
export type Reminder = EventReminder | PeriodicReminder;

export interface System extends UUIDable {
	name: string,
	description?: string,
	image?: File
}

export interface Tag extends UUIDable {
	name: string,
	description?: string,
	type: "member" | "journal",
	color?: string
}