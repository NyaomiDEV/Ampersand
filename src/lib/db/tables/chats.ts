import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUIDable, Chat } from "../entities";

export async function newChat(chat: Omit<Chat, keyof UUIDable>) {
	try{
		const uuid = window.crypto.randomUUID();
		await db.chats.add(uuid, {
			...chat,
			uuid
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "chats",
			event: "new",
			data: uuid
		}));
		return uuid;
	}catch(error){
		return false;
	}
}
