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
	const member = (await getMember(frontingEntry.member)) || defaultMember();
	return { ...frontingEntry, member };
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
		if(newContent.isMainFronter){
			const toUpdate = (await db.frontingEntries.toArray()).filter(x => !x.endTime && x.member !== uuid).map(x => x.uuid);

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
	const toUpdate = (await Promise.all(
		db.frontingEntries.index.filter(x => !x.endTime).map(async x => await db.frontingEntries.get(x.uuid))
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
			isMainFronter: false
		});
	}
}

export async function getCurrentFrontEntryForMember(member: Member){
	const _uuid = db.frontingEntries.index.find(x => x.endTime === undefined && x.member === member.uuid)?.uuid;
	if(!_uuid) return;

	return db.frontingEntries.get(_uuid);
}

export async function getMainFronter(){
	const mainFronterIndexEntry = db.frontingEntries.index.find(x => x.endTime === undefined && x.isMainFronter);
	if(!mainFronterIndexEntry) return;

	const mainFronterEntry = await db.frontingEntries.get(mainFronterIndexEntry.uuid);
	if(!mainFronterEntry) return;

	return await getMember(mainFronterEntry.member);
}

export async function getFronting() {
	const frontersIndexEntries = db.frontingEntries.index.filter(x => x.endTime === undefined);
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

export async function getFrontingEntriesOfDay(date: Date) {
	const _date = dayjs(date).startOf("day");

	return (await Promise.all(
		db.frontingEntries.index
		.filter(x => dayjs(x.startTime!).startOf('day').valueOf() === _date.valueOf())
		.map(async x => await db.frontingEntries.get(x.uuid))
	)).filter(x => !!x);
}

export async function getFrontingEntriesDays() {
	return [...new Set(db.frontingEntries.index.map(x => dayjs(x.startTime!).startOf('day').valueOf()))].map(x => new Date(x));
}