import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUIDable, Member, FrontingEntry, FrontingEntryComplete, UUID } from "../entities";
import { defaultMember, getMember } from "./members";
import dayjs from "dayjs";
import { filterFrontingEntry } from "../../search";
import { securityConfig } from "../../config";
import { broadcastEvent } from "../../native/plugin";
import { deleteFile } from "../../serialization";
import { TransactionStatus } from "../types";
import { sortFrontingEntries } from "../../util/misc";

export async function* getFrontingEntries(maxIter = 20){
	const uuids = db.frontingEntries.index.sort(sortFrontingEntries).map(x => x.uuid);
		
	const f = (offset: number, maxIter: number) => {
		const chunk: Promise<FrontingEntry>[] = [];
		for (let i = offset; i < offset + maxIter; i++) {
			if (uuids[i]) {
				const data = db.frontingEntries.get(uuids[i]);
				chunk.push(data);
			}
		}
		return chunk;
	};
		
	let offset = 0;
	while (offset < uuids.length) {
		const promises = f(offset, maxIter);
		offset += maxIter;
		for (const promise of promises)
			yield await promise;
	};
}

export function getFrontingEntry(uuid: UUID){
	return db.frontingEntries.get(uuid);
}

export async function toFrontingEntryComplete(frontingEntry: FrontingEntry): Promise<FrontingEntryComplete> {
	return {
		...frontingEntry,
		member: (await getMember(frontingEntry.member).catch(() => defaultMember(frontingEntry.member))),
		influencing: frontingEntry.influencing ? (await getMember(frontingEntry.influencing).catch(() => defaultMember(frontingEntry.influencing))) || defaultMember() : undefined
	};
}

export async function newFrontingEntry(frontingEntry: Omit<FrontingEntry, keyof UUIDable>): Promise<TransactionStatus<string>> {
	try{
		const uuid = await db.frontingEntries.add(frontingEntry);

		if(!uuid) throw new Error("already exists in database");

		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "frontingEntries",
			event: "new",
			uuid,
			newData: frontingEntry
		}));
		return { success: true, detail: uuid };
	}catch(_e){
		console.error(_e);
		return { success: false, err: _e };
	}
}

export async function deleteFrontingEntry(uuid: UUID): Promise<TransactionStatus<void>> {
	try {
		await db.frontingEntries.delete(uuid);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "frontingEntries",
			event: "deleted",
			uuid,
			delta: {}
		}));
		return { success: true };
	} catch (_e) {
		console.log(_e);
		return { success: false, err: _e };
	}
}

// HACK: Think of a better way
let shouldDebounce = false;
export async function updateFrontingEntry(newContent: UUIDable & Partial<FrontingEntry>): Promise<TransactionStatus<{ oldData: FrontingEntry, newData: FrontingEntry }>> {
	try{
		const updated = await db.frontingEntries.update(newContent);
		if(updated) {
			if(newContent.isMainFronter){
				const toUpdate = (await getFrontingBetween(updated.newData.startTime, updated.newData.endTime))
					.filter(x => x.uuid !== newContent.uuid)
					.map(x => x.uuid);
				shouldDebounce = true;

				for (const _uuid of toUpdate){
					const res = await updateFrontingEntry({ uuid: _uuid, isMainFronter: false });
					if(res.err)
						throw new Error(`updating non-main-fronter entry failed with error: ${res.err as Error}`);
				}

				shouldDebounce = false;
			}

			if (!shouldDebounce) {
				DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
					table: "frontingEntries",
					event: "modified",
					uuid: newContent.uuid,
					delta: newContent,
					oldData: updated.oldData,
					newData: updated.newData
				}));
			}
			return { success: true, detail: updated };
		}
		throw new Error("not updated, did not exist in db");
	}catch(_e){
		console.error(_e);
		return { success: false, err: _e };
	}
}

export async function removeFronter(member: Member) {
	try{
		const f = await getCurrentFrontEntryForMember(member);
		if(!f) throw new Error("no fronting entry for said member");

		return updateFrontingEntry({ uuid: f.uuid, endTime: new Date() });
	}catch(_e){
		console.error(_e);
		return { success: false, err: _e };
	}
}

export async function setMainFronter(member: Member, value: boolean){
	try {
		const f = await getCurrentFrontEntryForMember(member);
		if (!f) throw new Error("no fronting entry for said member");
	
		return updateFrontingEntry({ uuid: f.uuid, isMainFronter: value });
	}catch (_e) {
		console.error(_e);
		return { success: false, err: _e };
	}
}

export async function setSoleFronter(member: Member) {
	try{
		const toUpdate = db.frontingEntries.index
			.filter(x => !x.endTime && !x.isLocked && x.member !== member.uuid)
			.map(x => x.uuid);

		const endTime = new Date();

		for(const uuid of toUpdate){
			const res = await updateFrontingEntry({ uuid, endTime });
			if (res.err)
				throw new Error(`updating fronter entry failed with error: ${res.err as Error}`);
		}

		if(!await getCurrentFrontEntryForMember(member)){
			return newFrontingEntry({
				member: member.uuid,
				startTime: endTime,
				isMainFronter: false,
				isLocked: false
			});
		}

		return { success: true };
	}catch(_e){
		console.error(_e);
		return { success: false, err: _e };
	}
}

export async function getCurrentFrontEntryForMember(member: Member){
	const _uuid = db.frontingEntries.index.find(x => !x.endTime && x.member === member.uuid)?.uuid;
	if(!_uuid) return;

	return db.frontingEntries.get(_uuid);
}

export async function getMainFronter(){
	const mainFronterIndexEntry = db.frontingEntries.index
		.find(x => !x.endTime && x.isMainFronter);
	if(!mainFronterIndexEntry) return;

	return await getMember(mainFronterIndexEntry.member!).catch((e) => { console.error(e); return undefined; });
}

export async function getFronting() {
	const entries = Promise.all(db.frontingEntries.index.map(async x => {
		if(x.endTime) return;

		return toFrontingEntryComplete(await db.frontingEntries.get(x.uuid));
	}));

	return (await entries).filter(x => x !== undefined);
}

export async function getFrontingBetween(start: Date, end?: Date){
	if(!end) end = new Date();
	const entries = Promise.all(db.frontingEntries.index.map(x => {
		const _start = x.startTime!;
		const _end = x.endTime || new Date(end);
		if(start.valueOf() <= _end.valueOf() && end.valueOf() >= _start.valueOf())
			return db.frontingEntries.get(x.uuid);

		return Promise.resolve(); // undefined
	}));

	return (await entries).filter(x => x !== undefined);
}

export async function getFrontingBetweenComplete(start: Date, end?: Date) {
	return await Promise.all(
		(await getFrontingBetween(start, end)).map(x => toFrontingEntryComplete(x))
	);
}

export async function getRecentlyFronted() {
	return Promise.all(
		db.frontingEntries.index
			.filter(x => x.endTime && Date.now() - x.endTime.getTime() <= 48 * 60 * 60 * 1000)
			.sort((a, b) => b.endTime!.getTime() - a.endTime!.getTime())
			.map(async x => toFrontingEntryComplete(await db.frontingEntries.get(x.uuid)))
	);
}

export async function* getFrontingEntriesOfDay(date: Date, query: string) {
	const _date = dayjs(date).startOf("day").valueOf();

	for(const entry of db.frontingEntries.index){
		const startDay = dayjs(entry.startTime).startOf("day").valueOf();
		const endDay = entry.endTime ? dayjs(entry.endTime).endOf("day").valueOf() : dayjs().endOf("day").valueOf();

		if(_date < startDay || _date > endDay) continue;
		
		const frontingEntry = await db.frontingEntries.get(entry.uuid);

		if (filterFrontingEntry(query, frontingEntry))
			yield await toFrontingEntryComplete(frontingEntry);
	}
}

export async function getFrontingEntriesDays(query: string, start: Date, end: Date) {
	const _map = Promise.all(db.frontingEntries.index.map(async x => {
		if(x.startTime!.valueOf() > end.valueOf() || x.startTime!.valueOf() < start.valueOf())
			return undefined;
		
		const entry = await getFrontingEntry(x.uuid);
		
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
