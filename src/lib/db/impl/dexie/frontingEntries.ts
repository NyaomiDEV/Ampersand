import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../../events";
import { UUIDable, Member, FrontingEntry, FrontingEntryComplete, UUID } from "../../entities";
import { defaultMember } from "../../tables/members";
import { getMember } from "./members";
import dayjs from "dayjs";

export function getFrontingEntries(){
	return db.frontingEntries.toArray();
}

export async function getFrontingEntriesOffset(offset: number, limit?: number){
	return (await db.frontingEntries
		.toArray())
		.sort((a, b) => {
			if(!a.endTime && b.endTime) return -1;
			if(a.endTime && !b.endTime) return 1;
			return b.startTime!.getTime() - a.startTime!.getTime();
		})
		.slice(offset, limit ? offset + limit : undefined);
}

export async function toFrontingEntryComplete(frontingEntry: FrontingEntry): Promise<FrontingEntryComplete> {
	const member = (await getMember(frontingEntry.member)) || defaultMember();
	return { ...frontingEntry, member };
}

export async function newFrontingEntry(frontingEntry: Omit<FrontingEntry, keyof UUIDable>) {
	try{
		const uuid = window.crypto.randomUUID();
		await db.frontingEntries.add({
			...frontingEntry,
			uuid
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "frontingEntries",
			event: "new",
			data: uuid
		}));
		return uuid;
	}catch(error){
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
	} catch (error) {
		return false;
	}
}

export async function updateFrontingEntry(uuid: UUID, newContent: Partial<FrontingEntry>) {
	try{
		if (newContent.isMainFronter) {
			const toUpdate = (await db.frontingEntries.filter(x => !x.endTime && x.member !== uuid).toArray()).map(x => x.uuid);

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
	}catch(error){
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
	const toUpdate = (await db.frontingEntries.filter(x => !x.endTime && x.member !== member.uuid).toArray()).map(x => x.uuid);
	const endTime = new Date();

	for(const uuid of toUpdate)
		await updateFrontingEntry(uuid, { endTime });

	if(!await getCurrentFrontEntryForMember(member)){
		await newFrontingEntry({
			member: member.uuid,
			startTime: endTime,
			isMainFronter: false
		});
	}
}

export async function getCurrentFrontEntryForMember(member: Member){
	return await db.frontingEntries.filter(x => x.endTime === undefined && x.member === member.uuid).first();
}

export async function getMainFronter(){
	const mainFronterEntry = await db.frontingEntries.filter(x => x.endTime === undefined && x.isMainFronter).first();
	if(mainFronterEntry){
		return await getMember(mainFronterEntry.member);
	}
	return undefined;
}

export async function getFronting() {
	const frontersEntries = await db.frontingEntries.filter(x => x.endTime === undefined).toArray();

	return Promise.all(frontersEntries.map(async x => await toFrontingEntryComplete(x)));
}

export async function getRecentlyFronted() {
	return Promise.all((await db.frontingEntries
				.filter(x => !!x.endTime && Date.now() - x.endTime.getTime() <= 48 * 60 * 60 * 1000)
				.toArray())
			.sort((a, b) => b.endTime!.getTime() - a.endTime!.getTime())
			.map(x => toFrontingEntryComplete(x)));
}

export async function getFrontingEntriesOfDay(date: Date, currentlyFrontingToToday: boolean) {
	const _date = dayjs(date).startOf("day");
	
	let _filter = x => dayjs(x.startTime).startOf('day').valueOf() === _date.valueOf();
	
	if(currentlyFrontingToToday){
		_filter = x => x.endTime && dayjs(x.startTime).startOf('day').valueOf() === _date.valueOf();
	
		const _today = dayjs().startOf("day");
		if(_date.valueOf() === _today.valueOf()){
			_filter = x => !x.endTime || dayjs(x.startTime).startOf('day').valueOf() === _date.valueOf();
		}
	}

	return db.frontingEntries.filter(_filter).toArray();
}

export async function getFrontingEntriesDays() {
	const _map = (await db.frontingEntries.toArray()).map(x => dayjs(x.startTime).startOf('day').valueOf());
	
	return _map.reduce((occurrences, current) => {
		occurrences.set(current, (occurrences.get(current) || 0) + 1);
		return occurrences;
	}, new Map<number, number>());
}