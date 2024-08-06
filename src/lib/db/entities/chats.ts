import { db } from "..";
import { makeUUIDv5 } from "../../util/uuid";
import { UUIDable } from "../types";
import { getSystemUUID } from "./system";

export type Chat = UUIDable & {
	name: string,
	image?: File
}

export function getChatsTable(){
	return db.chats;
}

function genid(name: string) {
	return makeUUIDv5(getSystemUUID(), `chats\0${name}`);
}

export async function newChat(chat: Omit<Chat, keyof UUIDable>) {
	const uuid = genid(chat.name);
	return await getChatsTable().add({
		...chat,
		uuid
	});
}
