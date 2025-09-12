/* eslint-disable @typescript-eslint/no-unused-vars */

import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUIDable, ChatMessage } from "../entities";

export async function newChatMessage(chatMessage: Omit<ChatMessage, keyof UUIDable>) {
	try{
		const uuid = window.crypto.randomUUID();
		await db.chatMessages.add(uuid, {
			...chatMessage,
			uuid
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "chatMessages",
			event: "new",
			data: uuid
		}));
		return uuid;
	}catch(error){
		return false;
	}
}

