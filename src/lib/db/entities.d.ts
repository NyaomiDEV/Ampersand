export interface UUIDable {
	uuid: UUID
};

export type UUID = string;

export type ImageClip =
	"arch" |
	"arrow" |
	"boom" |
	"bun" |
	"burst" |
	"clamshell" |
	"diamond" |
	"fan" |
	"flower" |
	"gem" |
	"ghost-ish" |
	"heart" |
	"leaf-clover4" |
	"leaf-clover8" |
	"oval" |
	"pentagon" |
	"pill" |
	"pixel-circle" |
	"pixel-triangle" |
	"puffy-diamond" |
	"puffy" |
	"semicircle" |
	"sided-cookie12" |
	"sided-cookie4" |
	"sided-cookie6" |
	"sided-cookie7" |
	"sided-cookie9" |
	"slanted" |
	"soft-boom" |
	"soft-burst" |
	"square" |
	"sunny" |
	"triangle" |
	"very-sunny";

export interface BoardMessage extends UUIDable {
	members: UUID[],
	title: string,
	body: string,
	date: Date,
	isPinned: boolean,
	isArchived: boolean,
	poll?: Poll
}

export interface BoardMessageComplete extends BoardMessage {
	members: Member[]
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
	members: UUID[],
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
	members: Member[]
}

export interface Member extends UUIDable {
	system: UUID,
	name: string,
	pronouns?: string,
	description?: string,
	role?: string,
	image?: File,
	imageClip?: ImageClip,
	cover?: File,
	color?: string,
	customFields?: Map<UUID, string>,
	isPinned: boolean,
	isArchived: boolean,
	isCustomFront: boolean,
	tags: UUID[] // array of UUIDs
	dateCreated: Date
}

export interface Reminder extends UUIDable {
	active: boolean,
	title: string,
	message: string,
	trigger: "fronting" | "fronted",
	members?: UUID[],
	delay: number // milliseconds
}

export interface ReminderComplete extends Reminder {
	members?: Member[]
}

export interface System extends UUIDable {
	name: string,
	description?: string,
	cover?: File,
	image?: File,
	imageClip?: ImageClip,
	parent?: UUID,
	color?: string,
	isPinned: boolean,
	isArchived: boolean,
	viewInLists: boolean
}

export interface Tag extends UUIDable {
	name: string,
	description?: string,
	type: "member" | "journal" | "asset",
	color?: string,
	isArchived: boolean,
	viewInLists: boolean
}

export interface Asset extends UUIDable {
	file: File,
	friendlyName: string,
	tags: UUID[] // array of UUIDs
}

export interface CustomField extends UUIDable {
	name: string,
	priority: number,
	default: boolean
}

export interface Note extends UUIDable {
	title: string,
	content: string,
	priority: number,
	isArchived: boolean
}