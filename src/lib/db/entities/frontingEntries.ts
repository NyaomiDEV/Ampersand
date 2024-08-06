import { Ref, shallowRef, watch } from "vue";
import { db } from "..";
import { makeUUIDv5 } from "../../util/uuid";
import { UUID, UUIDable } from "../types";
import { getSystemUUID } from "./system";
import { from, useObservable } from "@vueuse/rxjs";
import { liveQuery } from "dexie";
import { getMembersTable, Member } from "./members";
import { parseFrontingHistoryFilterQuery as parseFrontingEntriesFilterQuery } from "../../util/filterQuery";
import dayjs from "dayjs";

export type FrontingEntry = UUIDable & {
	member: UUID,
	startTime: Date,
	endTime?: Date,
	isMainFronter: boolean,
	customStatus?: string
}

export type FrontingEntryComplete = Omit<FrontingEntry, "member"> & { member: Member }

export function getFrontingEntriesTable(){
	return db.frontingEntries;
}

export async function toFrontingEntryComplete(frontingEntry: FrontingEntry): Promise<FrontingEntryComplete> {
	const member = (await getMembersTable().get(frontingEntry.member))!;
	return { ...frontingEntry, member };
}

export const frontingEntries: Ref<FrontingEntryComplete[]> = shallowRef([]);

export async function updateFrontingEntriesRef() {
	const frontingEntriesComplete: FrontingEntryComplete[] = [];
	for (const frontingEntry of await getFrontingEntriesTable().toArray()) {
		frontingEntriesComplete.push(await toFrontingEntryComplete(frontingEntry));
	}
	frontingEntries.value = frontingEntriesComplete;
}

watch([
	useObservable(from(liveQuery(() => getFrontingEntriesTable().toArray()))),
	useObservable(from(liveQuery(() => getMembersTable().toArray())))
], updateFrontingEntriesRef, { immediate: true });


function genid(name: string) {
	return makeUUIDv5(getSystemUUID(), `frontingEntries\0${name}`);
}

export async function newFrontingEntry(frontingEntry: Omit<FrontingEntry, keyof UUIDable>) {
	const uuid = genid(frontingEntry.member + frontingEntry.startTime.getTime());
	return await getFrontingEntriesTable().add({
		...frontingEntry,
		uuid
	});
}

export async function removeFronter(member: Member) {
	const f = await getCurrentFrontEntryForMember(member);
	if(!f) return;

	await getFrontingEntriesTable().update(f.uuid, {
		endTime: new Date()
	});
}

export async function setMainFronter(member: Member, value: boolean){
	const f = await getCurrentFrontEntryForMember(member);
	if (!f) return;

	if(value){
		const toUpdate = (await getFrontingEntriesTable().filter(x => !x.endTime && x.member !== member.uuid).toArray()).map(x => x.uuid);

		for (const uuid of toUpdate) {
			await getFrontingEntriesTable().update(uuid, {
				isMainFronter: false
			});
		}
	}

	await getFrontingEntriesTable().update(f.uuid, {
		isMainFronter: value
	});
}

export async function setSoleFronter(member: Member) {
	const toUpdate = (await getFrontingEntriesTable().filter(x => !x.endTime && x.member !== member.uuid).toArray()).map(x => x.uuid);
	const endTime = new Date();

	for(const uuid of toUpdate){
		await getFrontingEntriesTable().update(uuid, {
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

export async function getCurrentFrontEntryForMember(member: Member){
	return await getFrontingEntriesTable().filter(x => x.endTime === undefined && x.member === member.uuid).first();
}

export async function getMainFronter(){
	const mainFronterEntry = await getFrontingEntriesTable().get({ endTime: undefined, isMainFronter: true });
	if(mainFronterEntry){
		return await getMembersTable().get(mainFronterEntry.member);
	}
	return undefined;
}

export async function getFronting() {
	const frontersEntries = await getFrontingEntriesTable().filter(x => x.endTime === undefined).toArray();
	const frontingMembers: Member[] = [];
	for(const entry of frontersEntries){
		const member = await getMembersTable().get(entry.member);
		if(member)
			frontingMembers.push(member);
	}
	return frontingMembers;
}

export async function getFrontingEntriesFromFilterQuery(filterQuery: string) {
	const parsed = parseFrontingEntriesFilterQuery(filterQuery);

	const filtered: FrontingEntryComplete[] = [];

	for(const x of await getFrontingEntriesTable().toArray()){
			const complete = await toFrontingEntryComplete(x);

			if (!complete.member.name.startsWith(parsed.query))
				continue;

			if (parsed.currentlyFronting) {
				if (x.endTime)
					continue;
			}

			if (parsed.dateString) {
				const date = dayjs(parsed.dateString).startOf("day");
				if (date.valueOf() !== dayjs(x.startTime).startOf("day").valueOf())
					continue;
			}

			if (parsed.day) {
				if (parsed.day !== dayjs(x.startTime).get("date"))
					continue;
			}

			if (parsed.month) {
				if (parsed.month !== dayjs(x.startTime).get("month") + 1)
					continue;
			}

			if (parsed.year) {
				if (parsed.year !== dayjs(x.startTime).get("year"))
					continue;
			}

			filtered.push(complete)
	}

	return filtered;
}
