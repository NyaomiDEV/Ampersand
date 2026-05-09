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
import { updateFrontingNotification } from "../../mode";
import { triggerReminders } from "./reminders";

export async function* getFrontingEntries(maxIter = 10){
	const uuids = db.frontingEntries.index.toSorted(sortFrontingEntries).map(x => x.uuid);
		
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
		console.error(_e);
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

		let uuid: string;
		const _entry = await getCurrentFrontEntryForMember(member);
		if(!_entry){
			const res = await newFrontingEntry({
				member: member.uuid,
				startTime: endTime,
				isMainFronter: true,
				isLocked: false
			});
			if(res.success)
				uuid = res.detail!;
			else throw res.err;
		} else {
			const res = await updateFrontingEntry({
				uuid: _entry.uuid,
				isMainFronter: true
			});
			if (res.success)
				uuid = _entry.uuid;
			else throw res.err;
		}

		return { success: true, detail: uuid };
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
	const entries = Promise.all(db.frontingEntries.index.toSorted(sortFrontingEntries).map(async x => {
		if(x.endTime) return;

		return toFrontingEntryComplete(await db.frontingEntries.get(x.uuid));
	}));

	return (await entries).filter(x => x !== undefined);
}

export async function getFrontingBetween(start: Date, end?: Date){
	if(!end) end = new Date();
	const entries = Promise.all(db.frontingEntries.index.toSorted(sortFrontingEntries).map(x => {
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

export async function getFrontingStatistics(start: Date, end: Date){
	const frontingEntries = await getFrontingBetween(start, end);

	const maps = {
		frontingCount: new Map<string, number>(),
		frontingTotalSpan: new Map<string, number>(),
		frontingPercent: new Map<string, number>(),
		frontingMinSpan: new Map<string, number>(),
		frontingMaxSpan: new Map<string, number>(),

		influencingCount: new Map<string, number>(),
		influencingPercent: new Map<string, number>(),
		influencingTotalSpan: new Map<string, number>(),
		influencingMinSpan: new Map<string, number>(),
		influencingMaxSpan: new Map<string, number>(),

		influencedCount: new Map<string, number>(),
		influencedPercent: new Map<string, number>(),
		influencedTotalSpan: new Map<string, number>(),
		influencedMinSpan: new Map<string, number>(),
		influencedMaxSpan: new Map<string, number>(),

		morningFronters: new Map<string, number>(),
		dayFronters: new Map<string, number>(),
		eveningFronters: new Map<string, number>(),
		nightFronters: new Map<string, number>(),

		morningInfluencers: new Map<string, number>(),
		dayInfluencers: new Map<string, number>(),
		eveningInfluencers: new Map<string, number>(),
		nightInfluencers: new Map<string, number>(),

		morningInfluenced: new Map<string, number>(),
		dayInfluenced: new Map<string, number>(),
		eveningInfluenced: new Map<string, number>(),
		nightInfluenced: new Map<string, number>()
	};

	for(const entry of frontingEntries){
		if(!entry.endTime) continue;

		const span = entry.endTime.valueOf() - entry.startTime.valueOf();

		if(entry.influencing){

			const influencingCount = maps.influencingCount.get(entry.member) || 0;
			const influencingTotalSpan = maps.influencingTotalSpan.get(entry.member) || 0;
			const influencingMinSpan = maps.influencingMinSpan.get(entry.member) || 0;
			const influencingMaxSpan = maps.influencingMaxSpan.get(entry.member) || 0;

			maps.influencingCount.set(entry.member, influencingCount + 1);
			maps.influencingTotalSpan.set(entry.member, influencingTotalSpan + span);
			maps.influencingMinSpan.set(entry.member, influencingMinSpan === 0 ? span : Math.min(influencingMinSpan, span));
			maps.influencingMaxSpan.set(entry.member, Math.max(influencingMaxSpan, span));

			const influencedCount = maps.influencedCount.get(entry.influencing) || 0;
			const influencedTotalSpan = maps.influencedTotalSpan.get(entry.influencing) || 0;
			const influencedMinSpan = maps.influencedMinSpan.get(entry.influencing) || 0;
			const influencedMaxSpan = maps.influencedMaxSpan.get(entry.influencing) || 0;

			maps.influencedCount.set(entry.influencing, influencedCount + 1);
			maps.influencedTotalSpan.set(entry.influencing, influencedTotalSpan + span);
			maps.influencedMinSpan.set(entry.influencing, influencedMinSpan === 0 ? span : Math.min(influencedMinSpan, span));
			maps.influencedMaxSpan.set(entry.influencing, Math.max(influencedMaxSpan, span));

			const hour = entry.startTime.getHours();

			if (hour <= 5 || hour >= 22) {
				const influencersCount = maps.nightInfluencers.get(entry.member) || 0;
				maps.nightInfluencers.set(entry.member, influencersCount + 1);

				const influencedCount = maps.nightInfluenced.get(entry.influencing) || 0;
				maps.nightInfluenced.set(entry.influencing, influencedCount + 1);
			}

			if (hour >= 6 && hour < 10) {
				const influencersCount = maps.morningInfluencers.get(entry.member) || 0;
				maps.morningInfluencers.set(entry.member, influencersCount + 1);

				const influencedCount = maps.morningInfluenced.get(entry.influencing) || 0;
				maps.morningInfluenced.set(entry.influencing, influencedCount + 1);
			}

			if (hour >= 11 && hour < 17) {
				const influencersCount = maps.dayInfluencers.get(entry.member) || 0;
				maps.dayInfluencers.set(entry.member, influencersCount + 1);

				const influencedCount = maps.dayInfluenced.get(entry.influencing) || 0;
				maps.dayInfluenced.set(entry.influencing, influencedCount + 1);
			}

			if (hour >= 17 && hour < 22) {
				const influencersCount = maps.eveningInfluencers.get(entry.member) || 0;
				maps.eveningInfluencers.set(entry.member, influencersCount + 1);

				const influencedCount = maps.eveningInfluenced.get(entry.influencing) || 0;
				maps.eveningInfluenced.set(entry.influencing, influencedCount + 1);
			}

		} else {

			const frontingCount = maps.frontingCount.get(entry.member) || 0;
			const frontingTotalSpan = maps.frontingTotalSpan.get(entry.member) || 0;
			const frontingMinSpan = maps.frontingMinSpan.get(entry.member) || 0;
			const frontingMaxSpan = maps.frontingMaxSpan.get(entry.member) || 0;

			maps.frontingCount.set(entry.member, frontingCount + 1);
			maps.frontingTotalSpan.set(entry.member, frontingTotalSpan + span);
			maps.frontingMinSpan.set(entry.member, frontingMinSpan === 0 ? span : Math.min(frontingMinSpan, span));
			maps.frontingMaxSpan.set(entry.member, Math.max(frontingMaxSpan, span));

			const hour = entry.startTime.getHours();

			if (hour <= 5 || hour >= 22){
				const count = maps.nightFronters.get(entry.member) || 0;
				maps.nightFronters.set(entry.member, count + 1);
			}

			if (hour >= 6 && hour < 10) {
				const count = maps.morningFronters.get(entry.member) || 0;
				maps.morningFronters.set(entry.member, count + 1);
			}

			if (hour >= 11 && hour < 17) {
				const count = maps.dayFronters.get(entry.member) || 0;
				maps.dayFronters.set(entry.member, count + 1);
			}

			if (hour >= 17 && hour < 22) {
				const count = maps.eveningFronters.get(entry.member) || 0;
				maps.eveningFronters.set(entry.member, count + 1);
			}

		}
	}

	const allFrontingSpan = maps.frontingTotalSpan.values().reduce((p, c) => p + c, 0);
	const allInfluencingSpan = maps.influencingTotalSpan.values().reduce((p, c) => p + c, 0);
	const allInfluencedSpan = maps.influencedTotalSpan.values().reduce((p, c) => p + c, 0);

	for(const [member, span] of maps.frontingTotalSpan.entries()){
		const percent = (span / allFrontingSpan) * 100;
		maps.frontingPercent.set(member, percent);
	}

	for (const [member, span] of maps.influencingTotalSpan.entries()) {
		const percent = (span / allInfluencingSpan) * 100;
		maps.influencingPercent.set(member, percent);
	}

	for (const [member, span] of maps.influencedTotalSpan.entries()) {
		const percent = (span / allInfluencedSpan) * 100;
		maps.influencedPercent.set(member, percent);
	}

	return maps;
}

export async function getRecentlyFronted(days: number) {
	return Promise.all(
		db.frontingEntries.index
			.filter(x => x.endTime && Date.now() - x.endTime.getTime() <= days * 24 * 60 * 60 * 1000)
			.sort((a, b) => b.endTime!.getTime() - a.endTime!.getTime())
			.map(async x => toFrontingEntryComplete(await db.frontingEntries.get(x.uuid)))
	);
}

export async function* getFrontingEntriesOfDay(date: Date, query: string) {
	const _date = dayjs(date).startOf("day").valueOf();

	for(const entry of db.frontingEntries.index.toSorted(sortFrontingEntries)){
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

export async function sendFrontingChangedEvent(backfill?: boolean){
	const fronting = await getFronting();

	if(!backfill){
		if (securityConfig.useIPC)
			await broadcastEvent("fronting_changed", deleteFile(fronting));
	}

	await triggerReminders(fronting);
	await updateFrontingNotification(fronting);
}
