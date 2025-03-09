import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../../events";
import { UUID, UUIDable, BoardMessage, BoardMessageComplete } from "../../entities";
import { defaultMember } from "../../tables/members";
import { getMember } from "./members";
import dayjs from "dayjs";

export function getBoardMessages(){
	return db.boardMessages.toArray();
}

export async function getBoardMessagesOffset(offset: number, limit?: number) {
	const query = db.boardMessages
		.orderBy("date")
		.reverse()
		.offset(offset);

	if (limit)
		return query.limit(limit).toArray();

	return query.toArray();
}

export async function toBoardMessageComplete(boardMessage: BoardMessage): Promise<BoardMessageComplete> {
	const member = (await getMember(boardMessage.member)) || defaultMember();
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

export async function getRecentBoardMessages() {
	return Promise.all((await db.boardMessages
		.filter(x => x.isPinned || dayjs().startOf('day').valueOf() - dayjs(x.date).startOf('day').valueOf() <= 3 * 24 * 60 * 60 * 1000)
		.toArray()
	).map(x => toBoardMessageComplete(x)));
}

export async function getBoardMessagesOfDay(date: Date) {
	const _date = dayjs(date).startOf("day");

	return db.boardMessages.filter(x => dayjs(x.date).startOf('day').valueOf() === _date.valueOf()).toArray()
}

export async function getBoardMessagesDays() {
	return [...new Set((await db.boardMessages.toArray()).map(x => dayjs(x.date).startOf('day').valueOf()))].map(x => new Date(x));
}