import { db } from ".";
import { makeUUIDv5 } from "../../../util/uuid";
import { UUIDable, Chat } from "../../entities";
import { getSystemUUID } from "./system";

export function getChatsTable(){
	return db.chats;
}

async function genid(name: string) {
	return makeUUIDv5((await getSystemUUID())!, `chats\0${name}`);
}

export async function newChat(chat: Omit<Chat, keyof UUIDable>) {
	const uuid = await genid(chat.name);
	return await getChatsTable().add({
		...chat,
		uuid
	});
}
