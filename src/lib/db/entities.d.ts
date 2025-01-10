export type UUIDable = {
	uuid: UUID
};

export type UUID = string;

export type BoardMessage = UUIDable & {
	member: UUID,
	title: string,
	body: string,
	date: Date
}

export type BoardMessageComplete = Omit<BoardMessage, "member"> & { member: Member }

export type ChatMessage = UUIDable & {
	chat: UUID,
	member: UUID,
	date: Date,
	message: string,
}

export type Chat = UUIDable & {
	name: string,
	image?: File
}

export type FrontingEntry = UUIDable & {
	member: UUID,
	startTime: Date,
	endTime?: Date,
	isMainFronter: boolean,
	customStatus?: string
}

export type FrontingEntryComplete = Omit<FrontingEntry, "member"> & { member: Member }

export type JournalPost = UUIDable & {
	member: UUID,
	date: Date,
	title: string,
	body: string,
	cover?: File,
	attachments?: Attachment[],
	tags: UUID[] // array of UUIDs
}

export type Attachment = UUIDable & {
	name: string,
	file: File
}

export type Member = UUIDable & {
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

type ReminderBase = UUIDable & {
	name: string,
	title: string,
	message: string,
	nativeId?: number
}

export type EventReminder = ReminderBase & {
	type: "event",
	triggeringEvent: {
		type: "memberAdded" | "memberRemoved",
		filterQuery?: string
	},
	delay: number // seconds
}

export type PeriodicReminder = ReminderBase & {
	type: "periodic",
	scheduleOn: {
		year?: number,
		month?: number,
		day?: number,
		weekday?: 1 | 2 | 3 | 4 | 5 | 6 | 7,
		hour?: number,
		minute?: number,
		second?: number
	}
}

export type Reminder = EventReminder | PeriodicReminder;

export type System = UUIDable & {
	name: string,
	description?: string,
	image?: File
}

export type Tag = UUIDable & {
	name: string,
	description?: string,
	type: "member" | "journal",
	color?: string
}