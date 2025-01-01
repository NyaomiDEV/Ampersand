import { BoardMessage, BoardMessageComplete, UUIDable, UUID } from '../entities';

const impl = await ("isTauri" in window ? import('../impl/tauri/boardMessages') : import('../impl/dexie/boardMessages'));

export function getBoardMessages(){
	return impl.getBoardMessages();
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