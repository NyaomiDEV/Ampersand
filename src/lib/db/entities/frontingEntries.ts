import { db } from "..";
import { makeUUIDv5 } from "../../util/uuid";
import { UUID, UUIDable } from "../types";
import { getSystemUUID } from "./system";

export type FrontingEntry = UUIDable & {
	member: UUID,
	startTime: Date,
	endTime?: Date,
	customStatus?: string
}

export function getTable(){
	return db.frontingEntries;
}

function genid(name: string) {
	return makeUUIDv5(getSystemUUID(), `frontingEntries\0${name}`);
}

export async function newFrontingEntry(frontingEntry: Omit<FrontingEntry, keyof UUIDable>) {
	const uuid = genid(frontingEntry.member + frontingEntry.startTime.getTime());
	return await getTable().add({
		...frontingEntry,
		uuid
	});
}