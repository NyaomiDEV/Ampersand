import { BoardMessage, FrontingEntry, JournalPost, Member, Reminder, System, Tag, Asset, CustomField, UUIDable, Note, FilterQuery } from "./entities";
export type IndexEntry<T> = UUIDable & Partial<T>;

export type SecondaryKey<T> = (Exclude<keyof T, keyof UUIDable>);
export type Update<T> = {
	newData: T,
	oldData: T
};

export interface Table<T extends UUIDable> {
	name: string
	index: Array<IndexEntry<T>>
	getIndexFromDisk(): Promise<Array<IndexEntry<T>> | undefined>
	saveIndexToDisk(): Promise<void>
	updateIndexWithData(data: T, saveAfterwards: boolean): Promise<void>
	removeIndex(uuid: string): Promise<void>
	initializeIndex(): Promise<void>

	getRaw(uuid: string): Promise<Uint8Array<ArrayBuffer>>
	get(uuid: string): Promise<T>
	count(): number
	iterate(maxIter: number): AsyncGenerator<T, void, unknown>
	refresh(): Promise<void>
	write(data: T, saveIndexAndHashesAfterwards: boolean): Promise<void>
	exists(uuid: string): boolean
	add(data: PartialBy<T, keyof UUIDable>, saveIndexAndHashesAfterwards = true): Promise<false | T["uuid"]>
	bulkAdd(contents: T[]): Promise<Array<false | T["uuid"]>>
	update(newData: UUIDable & Partial<T>, saveIndexAndHashesAfterwards = true): Promise<false | Update<T>>
	bulkUpdate(contents: (UUIDable & Partial<T>)[]): Promise<Array<false | Update<T>>>
	delete(uuid: UUID): Promise<void>
	bulkDelete(uuids: UUID[]): Promise<void>
	clear(): Promise<void>
	migrate(versionOverride?: number): Promise<void>
}

export type Database = { [K in keyof AmpersandTableMapping]: Table<AmpersandTableMapping[K]> };

export type AmpersandTableMapping = {
	boardMessages: BoardMessage
	frontingEntries: FrontingEntry
	journalPosts: JournalPost
	members: Member
	reminders: Reminder
	systems: System
	tags: Tag,
	assets: Asset,
	customFields: CustomField,
	notes: Note,
	filterQueries: FilterQuery
};

export type MigrationsMapping = {
	version: number,
};

export type DatabaseEventData = {
	table: keyof AmpersandTableMapping,
	event: "new" | "modified" | "deleted",
	uuid: string,
	delta?: unknown,
	oldData?: unknown,
	newData?: unknown
};

export type TransactionStatus<T = unknown, E = unknown> = {
	success: boolean,
	err?: E,
	detail?: T
};

export type FrontingCo = {
	count: number,
	percent: number,
	totalSpan: number,
	minSpan: number,
	maxSpan: number,
	entries: FrontingEntry[]
};