import { UUID, UUIDable } from "../types";

export type BoardMessage = UUIDable & {
	member: UUID,
	title: string,
	body: string,
	date: Date
}