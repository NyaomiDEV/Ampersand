import { UUIDable, ChatMessage } from "../entities";

const impl = await import('../impl/dexie/chatMessages');

export function getChatMessagesTable() {
	return impl.getChatMessagesTable();
}

export function newChatMessage(chatMessage: Omit<ChatMessage, keyof UUIDable>) {
	return impl.newChatMessage(chatMessage);
}
