import { Chat, UUIDable } from '../entities';

import * as impl from '../impl/tauri/chats';

export function newChat(chat: Omit<Chat, keyof UUIDable>) {
	return impl.newChat(chat);
}
