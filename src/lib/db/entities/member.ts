import { UUID, UUIDable } from "../types";

export type Member = UUIDable & {
	name: string,
	pronouns?: string,
	description?: string,
	role?: string,
	image?: Blob,
	color?: string, // todo
	isArchived: boolean,
	isCustomFront: boolean, // todo
	tags: UUID[] // array of UUIDs
}