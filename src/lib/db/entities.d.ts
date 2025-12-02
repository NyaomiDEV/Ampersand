export interface UUIDable {
	id: UUID,
};

export type UUID = string;

export interface BoardMessage extends UUIDable {
	member?: Member,
	title: string,
	body: string,
	date: Date,
	isPinned: boolean,
	isArchived: boolean,
	poll?: Poll
}

export interface Poll extends UUIDable {
	multipleChoice: boolean
}

export interface PollEntry extends UUIDable {
	poll: Poll,
	choice: string,
}

export interface Vote extends UUIDable {
	entry: PollEntry,
	member: Member,
	reason?: string
}

export interface FrontingEntry extends UUIDable {
	member: Member,
	startTime: Date,
	endTime?: Date,
	isMainFronter: boolean,
	isLocked: boolean,
	customStatus?: string,
	influencing?: Member,
	comment?: string
}

export interface PresenceEntry extends UUIDable {
	frontingEntry: FrontingEntry,
	date: Date,
	presence: number,
}

export interface JournalPost extends UUIDable {
	member?: Member,
	date: Date,
	title: string,
	subtitle?: string,
	body: string,
	cover?: SQLFile,
	isPinned: boolean,
	isPrivate: boolean,
	contentWarning?: string
}

export interface Member extends UUIDable {
	system: System,
	name: string,
	pronouns?: string,
	description?: string,
	role?: string,
	image?: SQLFile,
	cover?: SQLFile,
	color?: string,
	isPinned: boolean,
	isArchived: boolean,
	isCustomFront: boolean,
	dateCreated: Date
}

export interface CustomField extends UUIDable {
	name: string,
	priority: number,
	default: boolean,
}

export interface CustomFieldDatum extends UUIDable {
	member: Member,
	field: CustomField,
	value: string
}


export interface System extends UUIDable {
	name: string,
	description?: string,
	image?: SQLFile
}

export interface Tag extends UUIDable {
	name: string,
	description?: string,
	type: number, // 0: member, 1: journal
	color?: string,
	viewInLists: boolean
}

export interface MemberTag extends UUIDable {
	member: Member,
	tag: Tag
}

export interface JournalPostTag extends UUIDable {
	post: JournalPost,
	tag: Tag
}

export interface Asset extends UUIDable {
	file: SQLFile,
	friendlyName: string
}

export interface SQLFile extends UUIDable {
	path: string,
	friendlyName: string
}


// WALL OF SHAME
/*

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

/\*
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
*\/
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
	};

	// make it either-or in regards to EventReminder
	triggeringEvent?: never,
	delay?: never;
}

export type Reminder = EventReminder | PeriodicReminder;
*/