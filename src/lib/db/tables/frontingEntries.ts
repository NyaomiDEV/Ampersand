import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUIDable, Member, FrontingEntry, UUID } from "../entities";
import dayjs from "dayjs";
import { filterFrontingEntry } from "../search";
import { appConfig } from "../../config";
import { broadcastEvent } from "../../native/plugin";
import { deleteFile } from "../../util/json";
import { PartialBy } from "../../types";

export function getFrontingEntries(){
	return db.frontingEntries.iterate();
}

export async function newFrontingEntry(frontingEntry: Omit<FrontingEntry, keyof UUIDable>) {
	try{
		const id = window.crypto.randomUUID();
		await db.frontingEntries.add(id, {
			...frontingEntry,
			id
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "frontingEntries",
			event: "new",
			id,
			newData: frontingEntry
		}));
		return {
			...frontingEntry,
			id
		};
	}catch(_error){
		return;
	}
}

export async function deleteFrontingEntry(frontingEntry: FrontingEntry | UUID) {
	const id = typeof frontingEntry  === "string" ? frontingEntry : frontingEntry.id;
	try {
		await db.frontingEntries.delete(id);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "frontingEntries",
			event: "deleted",
			id,
			delta: {}
		}));
		return true;
	} catch (_error) {
		return false;
	}
}

export async function updateFrontingEntry(id: UUID, newContent: Partial<FrontingEntry>) {
	try{
		if(newContent.isMainFronter){
			const toUpdate = (await Array.fromAsync(db.frontingEntries.iterate()))
				.filter(x => !x.endTime && x.member.id !== id);

			for (const _entry of toUpdate)
				await updateFrontingEntry(_entry.id, { isMainFronter: false });
		}

		const updated = await db.frontingEntries.update(id, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "frontingEntries",
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

export async function removeFronter(member: Member) {
	const f = await getCurrentFrontEntryForMember(member);
	if(!f) return false;

	return await updateFrontingEntry(f.id, { endTime: new Date() });
}

export async function setMainFronter(member: Member, value: boolean){
	const f = await getCurrentFrontEntryForMember(member);
	if (!f) return false;
	
	return await updateFrontingEntry(f.id, { isMainFronter: value });
}

export async function setSoleFronter(member: Member) {
	const toUpdate = (await Array.fromAsync(db.frontingEntries.iterate()))
		.filter(x => !x.endTime && !x.isLocked && x.member.id !== member.id);

	const endTime = new Date();

	for(const _entry of toUpdate)
		await updateFrontingEntry(_entry.id, { endTime });

	if(!await getCurrentFrontEntryForMember(member)){
		await newFrontingEntry({
			member,
			startTime: endTime,
			isMainFronter: false,
			isLocked: false
		});
	}
}

export async function getCurrentFrontEntryForMember(member: Member){
	const _id = (await Array.fromAsync(db.frontingEntries.iterate())).find(x => !x.endTime && x.member.id === member.id)?.id;
	if(!_id) return;

	return db.frontingEntries.get(_id);
}

export async function getMainFronter(){
	const mainFronterEntry = (await Array.fromAsync(db.frontingEntries.iterate()))
		.filter(x => !x.endTime)
		.find(x => x.isMainFronter);

	if(!mainFronterEntry) return;
	return mainFronterEntry.member;
}

export async function getFronting() {
	const frontingEntries: FrontingEntry[] = [];
	for await (const entry of db.frontingEntries.iterate()){
		if (!entry.endTime)
			frontingEntries.push(entry);
	}
	return frontingEntries;
}

export async function getRecentlyFronted() {
	return (await Array.fromAsync(db.frontingEntries.iterate()))
		.filter(x => x.endTime && Date.now() - x.endTime.getTime() <= 48 * 60 * 60 * 1000)
		.sort((a, b) => b.endTime!.getTime() - a.endTime!.getTime());
}

export async function* getFrontingEntriesOfDay(date: Date, query: string) {
	const _date = dayjs(date).startOf("day").valueOf();

	for await(const entry of db.frontingEntries.iterate()){
		const startDay = dayjs(entry.startTime).startOf("day").valueOf();
		const endDay = entry.endTime ? dayjs(entry.endTime).endOf("day").valueOf() : dayjs().endOf("day").valueOf();

		if(_date < startDay || _date > endDay) continue;

		if (filterFrontingEntry(query, entry))
			yield entry;
	}
}

export async function getFrontingEntriesDays(query: string) {
	const _map = (await Array.fromAsync(db.frontingEntries.iterate()))
		.filter(x => !!x.endTime && filterFrontingEntry(query, x))
		.map(x => dayjs(x.startTime).startOf("day").valueOf());

	return _map.reduce((occurrences, current) => {
		occurrences.set(current, (occurrences.get(current) || 0) + 1);
		return occurrences;
	}, new Map<number, number>());
}

export async function saveFrontingEntry(frontingEntry: PartialBy<FrontingEntry, keyof UUIDable>){
	if (frontingEntry.isMainFronter)
		delete frontingEntry.influencing;

	if (frontingEntry.id)
		await updateFrontingEntry(frontingEntry.id, { ...frontingEntry });
	else{
		const _frontingEntry = await newFrontingEntry(frontingEntry);
		if(_frontingEntry) frontingEntry = _frontingEntry;
	}

	void sendFrontingChangedEvent();

	return frontingEntry as FrontingEntry;
}

export async function sendFrontingChangedEvent(){
	const fronting = await getFronting();

	if(appConfig.useIPC)
		await broadcastEvent("fronting_changed", deleteFile(fronting));
}
