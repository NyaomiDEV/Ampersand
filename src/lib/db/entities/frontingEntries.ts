import { ref, Ref, watch } from "vue";
import { db } from "..";
import { makeUUIDv5 } from "../../util/uuid";
import { UUID, UUIDable } from "../types";
import { getSystemUUID } from "./system";
import { from, useObservable } from "@vueuse/rxjs";
import { liveQuery } from "dexie";
import { Member, members } from "./members";

export type FrontingEntry = UUIDable & {
	member: UUID,
	startTime: Date,
	endTime?: Date,
	isMainFronter: boolean,
	customStatus?: string
}

export type FrontingEntryComplete = Omit<FrontingEntry, "member"> & { member: Member }

export function getTable(){
	return db.frontingEntries;
}

export const frontingEntries: Ref<FrontingEntryComplete[]> = ref([]);

export async function updateFrontingEntriesRef() {
	const _frontingEntries = await getTable().toArray();
	frontingEntries.value = _frontingEntries.map(x => ({
		...x,
		member: members.value.find(y => y.uuid === x.member)!
	}));
}

watch([
	useObservable(from(liveQuery(() => getTable().toArray()))),
	members
], updateFrontingEntriesRef, { immediate: true });


function genid(name: string) {
	return makeUUIDv5(getSystemUUID(), `frontingEntries\0${name}`);
}

export async function newFrontingEntry(frontingEntry: Omit<FrontingEntry, keyof UUIDable>) {
	const uuid = genid(frontingEntry.member + frontingEntry.startTime.getTime());
	return await getTable().add({
		...frontingEntry,
		uuid
	});
}

export async function removeFronter(member: Member) {
	const f = getCurrentFrontEntryForMember(member);
	if(!f) return;

	await getTable().update(f.uuid, {
		endTime: new Date()
	});
}

export async function setMainFronter(member: Member, value: boolean){
	const f = getCurrentFrontEntryForMember(member);
	if (!f) return;

	await getTable().update(f.uuid, {
		isMainFronter: value
	});
}

export async function setSoleFronter(member: Member) {
	const toUpdate = frontingEntries.value.filter(x => !x.endTime && x.member.uuid !== member.uuid).map(x => x.uuid);
	const endTime = new Date();

	for(const uuid of toUpdate){
		await getTable().update(uuid, {
			endTime
		});
	}

	if(!getCurrentFrontEntryForMember(member)){
		await newFrontingEntry({
			member: member.uuid,
			startTime: endTime,
			isMainFronter: false
		});
	}
}

export function getCurrentFrontEntryForMember(member: Member){
	return frontingEntries.value.find(x => {
		return x.endTime === undefined && x.member.uuid === member.uuid
	});
}