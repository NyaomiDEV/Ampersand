import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../../events";
import { UUID, UUIDable, BoardMessage, BoardMessageComplete } from "../../entities";
import { defaultMember } from "../../tables/members";

export function getBoardMessages(){
	return db.boardMessages.toArray();
}

export async function toBoardMessageComplete(boardMessage: BoardMessage): Promise<BoardMessageComplete> {
	const member = (await db.members.get(boardMessage.member)) || defaultMember();
	return { ...boardMessage, member };
}

export async function newBoardMessage(boardMessage: Omit<BoardMessage, keyof UUIDable>) {
	try{
		const uuid = window.crypto.randomUUID();
		await db.boardMessages.add({
			...boardMessage,
			uuid
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "boardMessages",
			event: "new",
			data: uuid
		}));
		return uuid;
	}catch(error){
		return false;
	}
}

export async function deleteBoardMessage(uuid: UUID) {
	try {
		await db.boardMessages.delete(uuid);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "boardMessages",
			event: "deleted",
			data: uuid
		}));
		return true;
	} catch (error) {
		return false;
	}
}

export async function updateBoardMessage(uuid: UUID, newContent: Partial<BoardMessage>) {
	try{
		const updated = await db.boardMessages.update(uuid, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "boardMessages",
				event: "modified",
				data: uuid
			}));
			return true;
		}
		return false;
	}catch(error){
		return false;
	}
}