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
	scheduleEveryInterval?: never,
	scheduleEveryWeekday?: never,
	scheduleTimeAt?: never
}

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

interface PeriodicReminderDate extends ReminderBase {
	scheduleEveryDateInterval?: {
		year?: number,
		month?: number,
		day?: number,
	},
	scheduleEveryWeekdayInterval?: never
}
interface PeriodicReminderWeekday extends ReminderBase {
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