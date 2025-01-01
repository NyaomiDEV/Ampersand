import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../../events";
import { makeUUIDv5 } from "../../../util/uuid";
import { UUIDable, Chat } from "../../entities";
import { getSystemUUID } from "./system";

async function genid(name: string) {
	return makeUUIDv5((await getSystemUUID())!, `chats\0${name}`);
}

export async function newChat(chat: Omit<Chat, keyof UUIDable>) {
	try{
		const uuid = await genid(chat.name);
		await db.chats.add(uuid, {
			...chat,
			uuid
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "chats",
			event: "new",
			data: uuid
		}));
		return true;
	}catch(error){
		return false;
	}
}
