import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../..";
import { makeUUIDv5 } from "../../../util/uuid";
import { UUIDable, ChatMessage } from "../../entities";
import { getSystemUUID } from "./system";

async function genid(name: string) {
	return makeUUIDv5((await getSystemUUID())!, `chatMessages\0${name}`);
}

export async function newChatMessage(chatMessage: Omit<ChatMessage, keyof UUIDable>) {
	try{
		const uuid = await genid(chatMessage.member + chatMessage.date.toTimeString());
		await db.chatMessages.add({
			...chatMessage,
			uuid
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "chatMessages",
			event: "new",
			data: uuid
		}));
		return true;
	}catch(error){
		return false;
	}
}

