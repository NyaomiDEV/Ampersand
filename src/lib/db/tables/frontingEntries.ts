import { db, IndexEntry } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUIDable, Member, FrontingEntry, FrontingEntryComplete, UUID } from "../entities";
import { defaultMember, getMember } from "./members";
import dayjs from "dayjs";
import { filterFrontingEntry, filterFrontingEntryIndex } from "../../search";

export function getFrontingEntries(){
	return db.frontingEntries.iterate();
}

export async function getFrontingEntriesOffset(offset: number, limit?: number){
	return (await Promise.all(
		db.frontingEntries.index
			.sort((a, b) => {
				if(!a.endTime && b.endTime) return -1;
				if(a.endTime && !b.endTime) return 1;
				return b.startTime!.getTime() - a.startTime!.getTime();
			})
			.slice(offset, limit ? offset + limit : undefined)
			.map(x => db.frontingEntries.get(x.uuid))
	)).filter(x => !!x);
}

export async function toFrontingEntryComplete(frontingEntry: FrontingEntry): Promise<FrontingEntryComplete> {
	return {
		...frontingEntry,
		member: (await getMember(frontingEntry.member)) || defaultMember(),
		influencing: frontingEntry.influencing ? (await getMember(frontingEntry.influencing)) || defaultMember() : undefined,
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
			data: uuid
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
			data: uuid
		}));
		return true;
	} catch (_error) {
		return false;
	}
}

export async function updateFrontingEntry(uuid: UUID, newContent: Partial<FrontingEntry>) {
	try{
		if(newContent.isMainFronter){
			const toUpdate = (await Promise.all(
				db.frontingEntries.index.filter(x => !x.endTime)
					.map(x => db.frontingEntries.get(x.uuid))
			))
				.filter(x => x?.member !== uuid)
				.map(x => x!.uuid);

			for (const _uuid of toUpdate)
				await updateFrontingEntry(_uuid, { isMainFronter: false });
		}

		const updated = await db.frontingEntries.update(uuid, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "frontingEntries",
				event: "modified",
				data: uuid
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

export async function getRecentlyFronted() {
	return Promise.all((await Promise.all(
		db.frontingEntries.index
			.filter(x => x.endTime && Date.now() - x.endTime.getTime() <= 48 * 60 * 60 * 1000)
			.sort((a, b) => b.endTime!.getTime() - a.endTime!.getTime())
			.map(x => db.frontingEntries.get(x.uuid))
	)).filter(x => !!x).map(x => toFrontingEntryComplete(x)));
}

export async function* getFrontingEntriesOfDay(date: Date, currentlyFrontingToToday: boolean, query: string) {
	const _date = dayjs(date).startOf("day");

	let _filter = (x: IndexEntry<FrontingEntry>) => dayjs(x.startTime).startOf("day").valueOf() === _date.valueOf();

	if(currentlyFrontingToToday){
		_filter = (x: IndexEntry<FrontingEntry>) => !!x.endTime && dayjs(x.startTime).startOf("day").valueOf() === _date.valueOf();

		const _today = dayjs().startOf("day");
		if(_date.valueOf() === _today.valueOf())
			_filter = (x: IndexEntry<FrontingEntry>) => !x.endTime || dayjs(x.startTime).startOf("day").valueOf() === _date.valueOf();
		
	}

	for(const entry of db.frontingEntries.index){
		if(!_filter(entry))
			continue;

		const frontingEntry = await db.frontingEntries.get(entry.uuid);
		if(!frontingEntry) continue;

		const complete = await toFrontingEntryComplete(frontingEntry);
		if(filterFrontingEntry(query, complete))
			yield complete;
	}
}

export function getFrontingEntriesDays(query: string) {
	const _map = db.frontingEntries.index.filter(x => filterFrontingEntryIndex(query, x)).map(x => dayjs(x.startTime).startOf("day").valueOf());

	return _map.reduce((occurrences, current) => {
		occurrences.set(current, (occurrences.get(current) || 0) + 1);
		return occurrences;
	}, new Map<number, number>());
}