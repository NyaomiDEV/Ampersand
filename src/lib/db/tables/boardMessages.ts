import { BoardMessage, BoardMessageComplete, UUIDable, UUID } from '../entities';

import * as impl from '../impl/tauri/boardMessages';

export function getBoardMessages(){
	return impl.getBoardMessages();
}

export function getBoardMessagesOffset(offset: number, limit?: number){
	return impl.getBoardMessagesOffset(offset, limit);
}

export function toBoardMessageComplete(boardMessage: BoardMessage): Promise<BoardMessageComplete> {
	return impl.toBoardMessageComplete(boardMessage);
}

export function newBoardMessage(boardMessage: Omit<BoardMessage, keyof UUIDable>) {
	return impl.newBoardMessage(boardMessage);
}

export function deleteBoardMessage(uuid: UUID) {
	return impl.deleteBoardMessage(uuid);
}

export function updateBoardMessage(uuid: UUID, newContent: Partial<BoardMessage>) {
	return impl.updateBoardMessage(uuid, newContent);
}

export function getRecentBoardMessages(){
	return impl.getRecentBoardMessages();
}

export function getBoardMessagesOfDay(date: Date){
	return impl.getBoardMessagesOfDay(date);
}

export function getBoardMessagesDays() {
	return impl.getBoardMessagesDays();
}