import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUID, UUIDable, BoardMessage, BoardMessageComplete } from "../entities";
import { defaultMember, getMember } from "../tables/members";
import dayjs from "dayjs";
import { filterBoardMessage } from "../../search";
import { TransactionStatus } from "../types";

export function getBoardMessages(){
	return db.boardMessages.iterate();
}

export function getBoardMessage(uuid: UUID){
	return db.boardMessages.get(uuid);
}

export async function toBoardMessageComplete(boardMessage: BoardMessage): Promise<BoardMessageComplete> {
	return {
		...boardMessage,
		member: boardMessage.member ? (await getMember(boardMessage.member)) || defaultMember() : undefined
	};
}

export async function newBoardMessage(boardMessage: Omit<BoardMessage, keyof UUIDable>): Promise<TransactionStatus<string>> {
	try{
		const uuid = window.crypto.randomUUID();
		const result = await db.boardMessages.add(uuid, {
			...boardMessage,
			uuid
		});

		if(!result) throw new Error("already exists in database");

		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "boardMessages",
			event: "new",
			uuid,
			newData: boardMessage
		}));
		return { success: true, detail: uuid };
	}catch(_e){
		console.error(_e);
		return { success: false, err: _e };
	}
}

export async function deleteBoardMessage(uuid: UUID): Promise<TransactionStatus<void>> {
	try {
		await db.boardMessages.delete(uuid);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "boardMessages",
			event: "deleted",
			uuid,
			delta: {}
		}));
		return { success: true };
	} catch (_e) {
		console.error(_e);
		return { success: false, err: _e };
	}
}

export async function updateBoardMessage(uuid: UUID, newContent: Partial<BoardMessage>): Promise<TransactionStatus<{ oldData: BoardMessage, newData: BoardMessage }>> {
	try{
		const updated = await db.boardMessages.update(uuid, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "boardMessages",
				event: "modified",
				uuid,
				delta: newContent,
				oldData: updated.oldData,
				newData: updated.newData
			}));
			return { success: true, detail: updated };
		}
		throw new Error("not updated, did not exist in db");
	}catch(_e){
		console.error(_e);
		return { success: false, err: _e };
	}
}

export async function getRecentBoardMessages() {
	return Promise.all(
		db.boardMessages.index
			.filter(x => !x.isArchived && (x.isPinned || dayjs().startOf("day").valueOf() - dayjs(x.date).startOf("day").valueOf() <= 3 * 24 * 60 * 60 * 1000))
			.map(async x => toBoardMessageComplete(await db.boardMessages.get(x.uuid)))
	);
}

export async function* getBoardMessagesOfDay(date: Date, query: string) {
	const _date = dayjs(date).startOf("day");

	for(const entry of db.boardMessages.index){
		if (dayjs(entry.date).startOf("day").valueOf() !== _date.valueOf())
			continue;

		const boardMessage = await db.boardMessages.get(entry.uuid);
		if (filterBoardMessage(query, boardMessage))
			yield await toBoardMessageComplete(boardMessage);
	}
}

export async function getBoardMessagesDays(query: string, start: Date, end: Date) {
	const _map = Promise.all(db.boardMessages.index.map(async x => {
		if(x.date!.valueOf() > end.valueOf() || x.date!.valueOf() < start.valueOf())
			return undefined;

		const message = await getBoardMessage(x.uuid);

		if (filterBoardMessage(query, message))
			return dayjs(x.date).startOf("day").valueOf();

		return undefined;
	}));

	return (await _map).reduce((occurrences, current) => {
		if(current)
			occurrences.set(current, (occurrences.get(current) || 0) + 1);
		return occurrences;
	}, new Map<number, number>());
}