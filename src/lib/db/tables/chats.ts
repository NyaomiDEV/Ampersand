import { Chat, UUIDable } from '../entities';

const impl = await import('../impl/dexie/chats');

export function newChat(chat: Omit<Chat, keyof UUIDable>) {
	return impl.newChat(chat);
}
