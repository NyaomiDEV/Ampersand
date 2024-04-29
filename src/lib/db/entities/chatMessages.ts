import { db } from "..";
import { makeUUIDv5 } from "../../util/uuid";
import { UUID, UUIDable } from "../types";
import { getSystemUUID } from "./system";

export type ChatMessage = UUIDable & {
	chat: UUID,
	member: UUID,
	date: Date,
	message: string,
}

export function getTable() {
	return db.chatMessages;
}

function genid(name: string) {
	return makeUUIDv5(getSystemUUID(), `chatMessages\0${name}`);
}

export async function newChatMessage(chatMessage: Omit<ChatMessage, keyof UUIDable>) {
	const uuid = genid(chatMessage.member + chatMessage.date.toTimeString());
	return await getTable().add({
		...chatMessage,
		uuid
	});
}

