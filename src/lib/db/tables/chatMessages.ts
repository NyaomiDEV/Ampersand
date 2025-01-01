import { UUIDable, ChatMessage } from "../entities";

const impl = await ("isTauri" in window ? import('../impl/tauri/chatMessages') : import('../impl/dexie/chatMessages'));

export function newChatMessage(chatMessage: Omit<ChatMessage, keyof UUIDable>) {
	return impl.newChatMessage(chatMessage);
}
