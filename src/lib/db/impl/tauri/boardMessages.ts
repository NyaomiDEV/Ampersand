import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../../events";
import { UUID, UUIDable, BoardMessage, BoardMessageComplete } from "../../entities";
import { defaultMember } from "../../tables/members";
import { getMember } from "./members";
import dayjs from "dayjs";

export function getBoardMessages(){
	return db.boardMessages.toArray();
}

export async function getBoardMessagesOffset(offset: number, limit?: number){
	return (await Promise.all(
		db.boardMessages.index
		.sort((a, b) => b.date!.getTime() - a.date!.getTime())
		.slice(offset, limit ? offset + limit : undefined)
		.map(x => db.boardMessages.get(x.uuid))
	)).filter(x => !!x);
}

export async function toBoardMessageComplete(boardMessage: BoardMessage): Promise<BoardMessageComplete> {
	const member = (await getMember(boardMessage.member)) || defaultMember();
	return { ...boardMessage, member };
}

export async function newBoardMessage(boardMessage: Omit<BoardMessage, keyof UUIDable>) {
	try{
		const uuid = window.crypto.randomUUID();
		await db.boardMessages.add(uuid, {
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
	return Promise.all((await Promise.all(
		db.boardMessages.index
			.filter(x => x.isPinned || dayjs().startOf('day').valueOf() - dayjs(x.date).startOf('day').valueOf() <= 3 * 24 * 60 * 60 * 1000)
			.map(x => db.boardMessages.get(x.uuid))
	)).filter(x => !!x).map(x => toBoardMessageComplete(x)));
}

export async function getBoardMessagesOfDay(date: Date) {
	const _date = dayjs(date).startOf("day");

	return (await Promise.all(
		db.boardMessages.index
		.filter(x => dayjs(x.date!).startOf('day').valueOf() === _date.valueOf())
		.map(async x => await db.boardMessages.get(x.uuid))
	)).filter(x => !!x);
}

export async function getBoardMessagesDays() {
	return [...new Set(db.boardMessages.index.map(x => dayjs(x.date!).startOf('day').valueOf()))].map(x => new Date(x));
}