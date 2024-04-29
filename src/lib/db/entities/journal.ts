import { UUID, UUIDable } from "../types";

export type JournalPost = UUIDable & {
	member: UUID,
	date: Date,
	title: string,
	body: string,
	cover?: Blob,
	attachments?: Attachment[]
}

export type Attachment = UUIDable & {
	name: string,
	data: Blob
}