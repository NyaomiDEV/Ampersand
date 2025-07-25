import { UUIDable, ChatMessage } from "../entities";

import * as impl from '../impl/tauri/chatMessages';

export function newChatMessage(chatMessage: Omit<ChatMessage, keyof UUIDable>) {
	return impl.newChatMessage(chatMessage);
}
