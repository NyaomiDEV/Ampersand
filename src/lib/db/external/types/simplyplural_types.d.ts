export type SimplyPluralExport = {
	users: SimplyPluralUser[],
	groups: SimplyPluralGroup[],
	customFields: SimplyPluralCustomField[],
	frontHistory: SimplyPluralFrontHistory[],
	notes: SimplyPluralNote[],
	comments: SimplyPluralComment[],
	polls: SimplyPluralPoll[],
	members: SimplyPluralMember[],
	frontStatuses: SimplyPluralFrontStatus[],
	boardMessages: SimplyPluralBoardMessage[],
	automatedReminders: SimplyPluralAutomatedReminder[],
	[x: string]: unknown
};

interface SPwithSystemID {
	uid: string
}

interface MongoDocument {
	_id: string
}

export interface SimplyPluralCustomField extends SPwithSystemID, MongoDocument {
	name: string,
	order: number,
	private: boolean,
	preventTrusted: boolean,
	buckets: string[],
	oid?: string,
	lastOperationTime: number,
	type: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7, // text|color|date|month|year|month+year|timestamp|month+day
	supportMarkdown?: boolean
}

interface FrameType {
	bgShape?: string | null,
	bgClip?: string | null,
	bgStartColor?: string | null,
	bgEndColor?: string | null
}

interface SimplyPluralUser extends SPwithSystemID, MongoDocument {
	username: string,
	isAsystem: boolean,
	avatarUrl: string,
	avatarUuid: string,
	color: string,
	desc: string,
	supportDescMarkdown: boolean,
	fields: Record<string, SystemCustomField>,
	frame: FrameType,
	fromFirebase: boolean,
	shownMigration: boolean,
	patron: boolean
}

interface SimplyPluralGroup extends SPwithSystemID, MongoDocument {
	name: string,
	desc: string,
	emoji: string,
	members?: string[],
	supportsDescMarkdown: boolean,
	parent: string,
	color: string,
	private: boolean,
	preventTrusted: boolean,
	lastOperationTime: number,
	buckets: string[]
}

interface SimplyPluralNote extends SPwithSystemID, MongoDocument {
	title: string,
	note: string,
	color: string,
	lastUpdate?: number,
	member?: string, // relates to Member._id
	date?: number,
	lastOperationTime?: number,
	supportMarkdown?: boolean,
}

interface SimplyPluralFrontHistory extends SPwithSystemID, MongoDocument {
	member?: string, // relates to Member._id
	startTime?: number,
	endTime?: number | null,
	lastUpdate?: number,
	custom?: boolean,
	uuid?: string,
	containingDays?: number[],
	comments?: {
		text: string,
		time: {
			_seconds: number,
			_nanoseconds: number
		} | number
	}[],
	commentCount?: number,
	customStatus?: string,
	lastOperationTime?: number,
	live?: boolean
}

interface SimplyPluralComment extends SPwithSystemID, MongoDocument {
	time: number,
	text: string,
	collection: "frontHistory", // are there other collections?
	documentId: string, // relates to FrontHistory._id, maybe other stuff too?
	lastOperationTime?: number,
	supportMarkdown?: boolean
}

interface SimplyPluralPoll extends SPwithSystemID, MongoDocument {
	allowAbstain: boolean,
	allowVeto: boolean,
	name: string,
	desc: string,
	custom: boolean,
	endTime: number,
	lastOperationTime: number,
	options: {
		name: string,
		color: string
	}[],
	supportDescMarkdown: boolean,
	votes?: {
		id: string, // relates to Member._id
		vote: string,
		comment: string
	}[]
}

interface SimplyPluralMember extends SPwithSystemID, MongoDocument {
	id?: string, // it's fun, having it a million times
	info: Record<string, string>, // custom field values
	preventsFrontNotifs: boolean,
	lastUpdate?: number,
	created?: string, // ISO date
	name: string,
	color: string,
	avatarUuidUrl?: string,
	pronouns: string,
	privateMember?: boolean,
	avatarUuid: string,
	desc: string,
	privacy?: Privacy,
	avatarUrl: string,
	pkId: string,
	private?: boolean,
	preventTrusted?: boolean,
	lastOperationTime: number,
	supportDescMarkdown: boolean,
	frame: FrameType,
	archived: boolean,
	archivedReason: string,
	receiveMessageBoardNotifs: boolean,
	buckets: string[]
}

interface SimplyPluralFrontStatus extends SPwithSystemID, MongoDocument {
	avatarUrl: string,
	desc: string,
	name: string,
	avatarUuid: string,
	avatarUuidUrl?: string,
	private: boolean,
	color: string,
	lastUpdate?: number,
	preventTrusted: boolean,
	lastOperationTime: number,
	supportDescMarkdown: boolean,
	frame: FrameType,
	buckets: string[]
}

interface SimplyPluralBoardMessage extends SPwithSystemID, MongoDocument {
	title: string,
	message: string,
	writtenBy: string, // relates to Member._id
	writtenFor: string // relates to Member._id
	read: boolean,
	writtenAt: number,
	supportMarkdown: boolean,
	lastOperationTime: number
}

interface SimplyPluralAutomatedReminder extends SPwithSystemID, MongoDocument {
	name: string,
	message: string,
	action: number, // always zero?
	delayInHours: number, // literally an hour (float)
	type: number // 0 - Member, 1 - Custom Front, 2 - Member or custom front
}