import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUIDable, Member, FrontingEntry, FrontingEntryComplete, UUID } from "../entities";
import { defaultMember, getMember } from "./members";
import dayjs from "dayjs";
import { filterFrontingEntry } from "../../search";
import { securityConfig } from "../../config";
import { broadcastEvent } from "../../native/plugin";
import { deleteFile } from "../../serialization";

export function getFrontingEntries(){
	return db.frontingEntries.iterate();
}

export function getFrontingEntry(uuid: UUID){
	return db.frontingEntries.get(uuid);
}

export async function toFrontingEntryComplete(frontingEntry: FrontingEntry): Promise<FrontingEntryComplete> {
	return {
		...frontingEntry,
		member: (await getMember(frontingEntry.member)) || defaultMember(),
		influencing: frontingEntry.influencing ? (await getMember(frontingEntry.influencing)) || defaultMember() : undefined
	};
}

export async function newFrontingEntry(frontingEntry: Omit<FrontingEntry, keyof UUIDable>) {
	try{
		const uuid = window.crypto.randomUUID();
		await db.frontingEntries.add(uuid, {
			...frontingEntry,
			uuid
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "frontingEntries",
			event: "new",
			uuid,
			newData: frontingEntry
		}));
		return uuid;
	}catch(_error){
		return false;
	}
}

export async function deleteFrontingEntry(uuid: UUID) {
	try {
		await db.frontingEntries.delete(uuid);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "frontingEntries",
			event: "deleted",
			uuid,
			delta: {}
		}));
		return true;
	} catch (_error) {
		return false;
	}
}

// HACK: Think of a better way
let shouldDebounce = false;
export async function updateFrontingEntry(uuid: UUID, newContent: Partial<FrontingEntry>) {
	try{
		const updated = await db.frontingEntries.update(uuid, newContent);
		if(updated) {
			if(newContent.isMainFronter){
				const toUpdate = (await getFrontingBetween(updated.newData.startTime, updated.newData.endTime))
					.filter(x => x.uuid !== uuid)
					.map(x => x.uuid);
				shouldDebounce = true;

				for (const _uuid of toUpdate)
					await updateFrontingEntry(_uuid, { isMainFronter: false });

				shouldDebounce = false;
			}

			if (!shouldDebounce) {
				DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
					table: "frontingEntries",
					event: "modified",
					uuid,
					delta: newContent,
					oldData: updated.oldData,
					newData: updated.newData
				}));
			}
			return true;
		}
		return false;
	}catch(_error){
		return false;
	}
}

export async function removeFronter(member: Member) {
	const f = await getCurrentFrontEntryForMember(member);
	if(!f) return false;

	return await updateFrontingEntry(f.uuid, { endTime: new Date() });
}

export async function setMainFronter(member: Member, value: boolean){
	const f = await getCurrentFrontEntryForMember(member);
	if (!f) return false;
	
	return await updateFrontingEntry(f.uuid, { isMainFronter: value });
}

export async function setSoleFronter(member: Member) {
	const toUpdate = (await Promise.all(
		db.frontingEntries.index.filter(x => !x.endTime && !x.isLocked).map(x => db.frontingEntries.get(x.uuid))
	)).filter(x => !!x)
		.filter(x => x.member !== member.uuid)
		.map(x => x.uuid);

	const endTime = new Date();

	for(const uuid of toUpdate)
		await updateFrontingEntry(uuid, { endTime });

	if(!await getCurrentFrontEntryForMember(member)){
		await newFrontingEntry({
			member: member.uuid,
			startTime: endTime,
			isMainFronter: false,
			isLocked: false
		});
	}
}

export async function getCurrentFrontEntryForMember(member: Member){
	const _uuid = db.frontingEntries.index.find(x => !x.endTime && x.member === member.uuid)?.uuid;
	if(!_uuid) return;

	return db.frontingEntries.get(_uuid);
}

export async function getMainFronter(){
	const mainFronterIndexEntry = (await Promise.all(
		db.frontingEntries.index
			.filter(x => !x.endTime)
			.map(x => db.frontingEntries.get(x.uuid))
	))
		.filter(x => !!x)
		.find(x => x.isMainFronter);
	if(!mainFronterIndexEntry) return;

	const mainFronterEntry = await db.frontingEntries.get(mainFronterIndexEntry.uuid);
	if(!mainFronterEntry) return;

	return await getMember(mainFronterEntry.member);
}

export async function getFronting() {
	const frontersIndexEntries = db.frontingEntries.index.filter(x => !x.endTime);
	const frontingEntries: FrontingEntryComplete[] = [];
	for(const entry of frontersIndexEntries){
		const frontingEntry = await db.frontingEntries.get(entry.uuid);
		if(!frontingEntry) continue;
		
		frontingEntries.push(await toFrontingEntryComplete(frontingEntry));
	}
	return frontingEntries;
}

export async function getFrontingBetween(start: Date, end?: Date){
	if(!end) end = new Date();
	return (await Promise.all(db.frontingEntries.index.filter(x => {

		const _start = x.startTime!;
		const _end = x.endTime || new Date(end);
		return start.valueOf() <= _end.valueOf() && end.valueOf() >= _start.valueOf();

	}).map(async (x) => {

		const entry = await db.frontingEntries.get(x.uuid);
		if (!entry) return undefined;
		return entry;
		
	}))).filter(x => x !== undefined);
}

export async function getFrontingBetweenComplete(start: Date, end?: Date) {
	return await Promise.all(
		(await getFrontingBetween(start, end)).map(x => toFrontingEntryComplete(x))
	);
}

export async function getRecentlyFronted() {
	return Promise.all((await Promise.all(
		db.frontingEntries.index
			.filter(x => x.endTime && Date.now() - x.endTime.getTime() <= 48 * 60 * 60 * 1000)
			.sort((a, b) => b.endTime!.getTime() - a.endTime!.getTime())
			.map(x => db.frontingEntries.get(x.uuid))
	)).filter(x => !!x).map(x => toFrontingEntryComplete(x)));
}

export async function* getFrontingEntriesOfDay(date: Date, query: string) {
	const _date = dayjs(date).startOf("day").valueOf();

	for(const entry of db.frontingEntries.index){
		const startDay = dayjs(entry.startTime).startOf("day").valueOf();
		const endDay = entry.endTime ? dayjs(entry.endTime).endOf("day").valueOf() : dayjs().endOf("day").valueOf();

		if(_date < startDay || _date > endDay) continue;
		
		const frontingEntry = await db.frontingEntries.get(entry.uuid);
		if (!frontingEntry) continue;

		if (filterFrontingEntry(query, frontingEntry))
			yield await toFrontingEntryComplete(frontingEntry);
	}
}

export async function getFrontingEntriesDays(query: string, start: Date, end: Date) {
	const _map = Promise.all(db.frontingEntries.index.map(async x => {
		if(x.startTime!.valueOf() > end.valueOf() || x.startTime!.valueOf() < start.valueOf())
			return undefined;
		
		const entry = await getFrontingEntry(x.uuid);
		if(!entry)
			return undefined;
		
		if (filterFrontingEntry(query, entry))
			return dayjs(x.startTime).startOf("day").valueOf();
		
		return undefined;
	}));

	return (await _map).reduce((occurrences, current) => {
		if(current)
			occurrences.set(current, (occurrences.get(current) || 0) + 1);
		return occurrences;
	}, new Map<number, number>());
}

export async function sendFrontingChangedEvent(){
	const fronting = await getFronting();

	if(securityConfig.useIPC)
		await broadcastEvent("fronting_changed", deleteFile(fronting));
}
