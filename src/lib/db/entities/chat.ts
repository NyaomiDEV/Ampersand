import { UUID, UUIDable } from "../types";

export type Chat = UUIDable & {
	name: string,
	image?: Blob
}

export type ChatMessage = UUIDable & {
	chat: UUID,
	member: UUID,
	date: Date,
	message: string,
}