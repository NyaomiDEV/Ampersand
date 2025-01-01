import { Chat, UUIDable } from '../entities';

const impl = await ("isTauri" in window ? import('../impl/tauri/chats') : import('../impl/dexie/chats'));

export function newChat(chat: Omit<Chat, keyof UUIDable>) {
	return impl.newChat(chat);
}
