import { db } from "..";
import { makeUUIDv5 } from "../../util/uuid";
import { UUID, UUIDable } from "../types";
import { getSystemUUID } from "./system";

export type BoardMessage = UUIDable & {
	member: UUID,
	title: string,
	body: string,
	date: Date
}

export function getTable() {
	return db.boardMessages;
}

function genid(name: string) {
	return makeUUIDv5(getSystemUUID(), `boardMessages\0${name}`);
}

export async function newBoardMessage(boardMessage: Omit<BoardMessage, keyof UUIDable>) {
	const uuid = genid(boardMessage.title);
	return await getTable().add({
		...boardMessage,
		uuid
	});
}


