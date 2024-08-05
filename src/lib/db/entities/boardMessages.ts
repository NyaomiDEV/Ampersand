import { Ref, ref, watch } from "vue";
import { db } from "..";
import { makeUUIDv5 } from "../../util/uuid";
import { UUID, UUIDable } from "../types";
import { Member, members } from "./members";
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

export function getTable() {
	return db.boardMessages;
}

export const boardMessages: Ref<BoardMessageComplete[]> = ref([]);

export async function updateBoardMessagesRef() {
	const _boardMessages = await getTable().toArray();
	boardMessages.value = _boardMessages.map(x => ({
		...x,
		member: members.value.find(y => y.uuid === x.member)!
	}));
}

watch([
	useObservable(from(liveQuery(() => getTable().toArray()))),
	members
], updateBoardMessagesRef, { immediate: true });


function genid(name: string) {
	return makeUUIDv5(getSystemUUID(), `boardMessages\0${name}`);
}

export async function newBoardMessage(boardMessage: Omit<BoardMessage, keyof UUIDable>) {
	const uuid = genid(boardMessage.title);
	return await getTable().add({
		...boardMessage,
		uuid
	});
}


