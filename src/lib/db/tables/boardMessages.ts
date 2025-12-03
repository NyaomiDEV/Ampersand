import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUID, UUIDable, BoardMessage } from "../entities";
import dayjs from "dayjs";
import { filterBoardMessage } from "../../search";

export function getBoardMessages(){
	return db.boardMessages.iterate();
}

export async function newBoardMessage(boardMessage: Omit<BoardMessage, keyof UUIDable>) {
	try{
		const id = window.crypto.randomUUID();
		await db.boardMessages.add(id, {
			...boardMessage,
			id
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "boardMessages",
			event: "new",
			id,
			newData: boardMessage
		}));
		return {
			...boardMessage,
			id
		};
	}catch(_error){
		return;
	}
}

export async function deleteBoardMessage(id: UUID) {
	try {
		await db.boardMessages.delete(id);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "boardMessages",
			event: "deleted",
			id,
			delta: {}
		}));
		return true;
	} catch (_error) {
		return false;
	}
}

export async function updateBoardMessage(id: UUID, newContent: Partial<BoardMessage>) {
	try{
		const updated = await db.boardMessages.update(id, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "boardMessages",
				event: "modified",
				id,
				delta: newContent,
				oldData: updated.oldData,
				newData: updated.newData
			}));
			return true;
		}
		return false;
	}catch(_error){
		return false;
	}
}

export async function getRecentBoardMessages() {
	return (await Array.fromAsync(db.boardMessages.iterate()))
		.filter(x => !x.isArchived && (x.isPinned || dayjs().startOf("day").valueOf() - dayjs(x.date).startOf("day").valueOf() <= 3 * 24 * 60 * 60 * 1000));
}

export async function* getBoardMessagesOfDay(date: Date, query: string) {
	const _date = dayjs(date).startOf("day");

	for await(const boardMessage of db.boardMessages.iterate()){
		if (dayjs(boardMessage.date).startOf("day").valueOf() !== _date.valueOf())
			continue;

		if(filterBoardMessage(query, boardMessage))
			yield boardMessage;
	}
}

export async function getBoardMessagesDays(query: string) {
	const _map = (await Array.fromAsync(db.boardMessages.iterate()))
		.filter(x => filterBoardMessage(query, x)).map(x => dayjs(x.date).startOf("day").valueOf());

	return _map.reduce((occurrences, current) => {
		occurrences.set(current, (occurrences.get(current) || 0) + 1);
		return occurrences;
	}, new Map<number, number>());
}