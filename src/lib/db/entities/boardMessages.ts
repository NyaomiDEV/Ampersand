import { db } from "..";
import { makeUUIDv5 } from "../../util/uuid";
import { UUID, UUIDable } from "../types";
import { getMembersTable, Member } from "./members";
import { getSystemUUID } from "./system";

export type BoardMessage = UUIDable & {
	member: UUID,
	title: string,
	body: string,
	date: Date
}

export type BoardMessageComplete = Omit<BoardMessage, "member"> & { member: Member }

export function getBoardMessagesTable() {
	return db.boardMessages;
}

export async function toBoardMessageComplete(boardMessage: BoardMessage): Promise<BoardMessageComplete> {
	const member = (await getMembersTable().get(boardMessage.member))!;
	return { ...boardMessage, member };
}

async function genid(name: string) {
	return makeUUIDv5((await getSystemUUID())!, `boardMessages\0${name}`);
}

export async function newBoardMessage(boardMessage: Omit<BoardMessage, keyof UUIDable>) {
	const uuid = await genid(boardMessage.title);
	return await getBoardMessagesTable().add({
		...boardMessage,
		uuid
	});
}
