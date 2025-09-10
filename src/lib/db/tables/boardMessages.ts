import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUID, UUIDable, BoardMessage, BoardMessageComplete } from "../entities";
import { defaultMember, getMember } from "../tables/members";
import dayjs from "dayjs";
import { filterBoardMessage, filterBoardMessageIndex } from "../../search";

export function getBoardMessages(){
	return db.boardMessages.iterate();
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

export async function* getBoardMessagesOfDay(date: Date, query: string) {
	const _date = dayjs(date).startOf("day");

	for(const entry of db.boardMessages.index){
		if (dayjs(entry.date!).startOf('day').valueOf() !== _date.valueOf())
			continue;

		const boardMessage = await db.boardMessages.get(entry.uuid);
		if(!boardMessage) continue;

		const complete = await toBoardMessageComplete(boardMessage);
		if(await filterBoardMessage(query, complete))
			yield complete;
	}
}

export function getBoardMessagesDays(query: string) {
	const _map = db.boardMessages.index.filter(x => filterBoardMessageIndex(query, x)).map(x => dayjs(x.date!).startOf('day').valueOf());

	return _map.reduce((occurrences, current) => {
		occurrences.set(current, (occurrences.get(current) || 0) + 1)
		return occurrences;
	}, new Map<number, number>());
}