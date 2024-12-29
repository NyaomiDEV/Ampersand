import { db } from ".";
import { makeUUIDv5 } from "../../../util/uuid";
import { UUIDable, ChatMessage } from "../../entities";
import { getSystemUUID } from "./system";

export function getChatMessagesTable() {
	return db.chatMessages;
}

async function genid(name: string) {
	return makeUUIDv5((await getSystemUUID())!, `chatMessages\0${name}`);
}

export async function newChatMessage(chatMessage: Omit<ChatMessage, keyof UUIDable>) {
	const uuid = await genid(chatMessage.member + chatMessage.date.toTimeString());
	return await getChatMessagesTable().add({
		...chatMessage,
		uuid
	});
}

