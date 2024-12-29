import { BoardMessage, BoardMessageComplete, UUIDable } from '../entities';

const impl = await import('../impl/dexie/boardMessages');

export function getBoardMessagesTable() {
	return impl.getBoardMessagesTable();
}

export function toBoardMessageComplete(boardMessage: BoardMessage): Promise<BoardMessageComplete> {
	return impl.toBoardMessageComplete(boardMessage);
}

export function newBoardMessage(boardMessage: Omit<BoardMessage, keyof UUIDable>) {
	return impl.newBoardMessage(boardMessage);
}
