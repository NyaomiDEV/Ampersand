import { Ref, shallowRef, watch } from "vue";
import { db } from "..";
import { makeUUIDv5 } from "../../util/uuid";
import { UUID, UUIDable } from "../types";
import { getMembersTable, Member } from "./members";
import { getSystemUUID } from "./system";
import { from, useObservable } from "@vueuse/rxjs";
import { liveQuery } from "dexie";

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

export const boardMessages: Ref<BoardMessageComplete[]> = shallowRef([]);

export async function updateBoardMessagesRef() {
	const boardMessagesComplete: BoardMessageComplete[] = [];
	for (const boardMessage of await getBoardMessagesTable().toArray()) {
		const member = (await getMembersTable().get(boardMessage.member))!
		boardMessagesComplete.push({ ...boardMessage, member});
	}
	boardMessages.value = boardMessagesComplete;
}

watch([
	useObservable(from(liveQuery(() => getBoardMessagesTable().toArray()))),
	useObservable(from(liveQuery(() => getMembersTable().toArray()))),
], updateBoardMessagesRef, { immediate: true });


function genid(name: string) {
	return makeUUIDv5(getSystemUUID(), `boardMessages\0${name}`);
}

export async function newBoardMessage(boardMessage: Omit<BoardMessage, keyof UUIDable>) {
	const uuid = genid(boardMessage.title);
	return await getBoardMessagesTable().add({
		...boardMessage,
		uuid
	});
}


