export interface UUIDable {
	uuid: UUID
};

export type UUID = string;

export interface BoardMessage extends UUIDable {
	member?: UUID,
	title: string,
	body: string,
	date: Date,
	isPinned?: boolean,
	isArchived: boolean,
	poll?: Poll
}

export interface BoardMessageComplete extends BoardMessage {
	member?: Member
}

export interface Poll {
	entries: PollEntry[],
	multipleChoice: boolean
}

export interface PollEntry {
	choice: string,
	votes: Vote[]
}

export interface Vote {
	member: UUID,
	reason?: string
}

export interface FrontingEntry extends UUIDable {
	member: UUID,
	startTime: Date,
	endTime?: Date,
	isMainFronter: boolean,
	isLocked: boolean,
	customStatus?: string,
	influencing?: UUID,
	presence?: Map<Date, number>
	comment?: string
}

export interface FrontingEntryComplete extends FrontingEntry {
	member: Member,
	influencing?: Member
}

export interface JournalPost extends UUIDable {
	member?: UUID,
	date: Date,
	title: string,
	subtitle?: string,
	body: string,
	cover?: File,
	tags: UUID[], // array of UUIDs
	isPinned: boolean,
	isPrivate: boolean,
	contentWarning?: string
}

export interface JournalPostComplete extends JournalPost {
	member?: Member
}

export interface Member extends UUIDable {
	name: string,
	pronouns?: string,
	description?: string,
	role?: string,
	image?: File,
	cover?: File,
	color?: string,
	customFields?: Map<UUID, string>,
	isPinned?: boolean,
	isArchived: boolean,
	isCustomFront: boolean,
	tags: UUID[] // array of UUIDs
	dateCreated: Date
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
	scheduleInterval?: never
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
interface PeriodicReminder extends ReminderBase {
	type: "periodic",
	scheduleInterval?: {
		year?: number,
		monthOfYear?: number,
		dayOfMonth?: number, // it probably will overflow on february lmao
		dayOfWeek?: number, // 1 is sunday, REPENT
		hourOfDay?: number,
		minuteOfHour?: number,
		//secondOfMinute?: number // nah won't bother
	}

	// make it either-or in regards to EventReminder
	triggeringEvent?: never,
	delay?: never
}

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
	color?: string,
	viewInLists: boolean
}

export interface Asset extends UUIDable {
	file: File,
	friendlyName: string
}

export interface CustomField extends UUIDable {
	name: string,
	priority: number,
	default?: boolean,
}