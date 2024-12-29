import { Chat, UUIDable } from '../entities';

const impl = await import('../impl/dexie/chats');

export function getChatsTable() {
	return impl.getChatsTable();
}

export function newChat(chat: Omit<Chat, keyof UUIDable>) {
	return impl.newChat(chat);
}
