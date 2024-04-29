import { UUID, UUIDable } from "../types";

export type FrontingEntry = UUIDable & {
	member: UUID,
	startTime: Date,
	endTime?: Date,
	customStatus?: string
}
