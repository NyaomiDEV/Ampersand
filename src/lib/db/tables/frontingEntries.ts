import { db } from "..";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUIDable, Member, FrontingEntry, FrontingEntryComplete, UUID } from "../entities";
import { defaultMember, getMember } from "./members";
import dayjs from "dayjs";
import { filterFrontingEntry } from "../../search";
import { securityConfig } from "../../config";
import { broadcastEvent } from "../../native/plugin";
import { deleteFile } from "../../serialization";
import { FrontingCo, TransactionStatus } from "../types";
import { sortFrontingEntries } from "../../util/misc";
import { updateFrontingNotification } from "../../mode";
import { triggerReminders } from "./reminders";
import { transactionSucceeded } from "../utils";

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

export async function* getFilteredFrontingEntries(query: string) {
	for await (const entry of getFrontingEntries()){
		if(filterFrontingEntry(query, entry))
			yield entry;
	}
}

export function getFrontingEntry(uuid: UUID){
	return db.frontingEntries.get(uuid);
}

export function getFrontingEntryIndex(){
	return db.frontingEntries.index;
}

export async function toFrontingEntryComplete(frontingEntries: FrontingEntry[]): Promise<FrontingEntryComplete[]> {
	const _memberSet = await Promise.all(Array.from(new Set(
		frontingEntries.map(x => [x.member, x.influencing].filter((x): x is string => !!x)).flat(1)
	)).map(x => getMember(x).catch(_ => defaultMember(x))));

	return frontingEntries.map(x => ({
		...x,
		member: _memberSet.find(y => y.uuid === x.member) || defaultMember(x.member),
		influencing: x.influencing ? _memberSet.find(y => y.uuid === x.influencing) || defaultMember(x.influencing) : undefined
	}));
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
		return { success: false, err: _e instanceof Error ? _e : new Error(String(_e)) };
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
		return { success: false, err: _e instanceof Error ? _e : new Error(String(_e)) };
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
					if(!transactionSucceeded(res))
						throw new Error(`updating non-main-fronter entry failed with error: ${res.err.message}`);
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
		return { success: false, err: _e instanceof Error ? _e : new Error(String(_e)) };
	}
}

export async function removeFronter(member: Member) {
	try{
		const f = await getCurrentFrontEntryForMember(member);
		if(!f) throw new Error("no fronting entry for said member");

		return updateFrontingEntry({ uuid: f.uuid, endTime: new Date() });
	}catch(_e){
		console.error(_e);
		return { success: false, err: _e instanceof Error ? _e : new Error(String(_e)) };
	}
}

export async function setMainFronter(member: Member, value: boolean){
	try {
		const f = await getCurrentFrontEntryForMember(member);
		if (!f) throw new Error("no fronting entry for said member");
	
		return updateFrontingEntry({ uuid: f.uuid, isMainFronter: value });
	}catch (_e) {
		console.error(_e);
		return { success: false, err: _e instanceof Error ? _e : new Error(String(_e)) };
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
			if (!transactionSucceeded(res))
				throw new Error(`updating fronter entry failed with error: ${res.err.message}`);
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
		return { success: false, err: _e instanceof Error ? _e : new Error(String(_e)) };
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

		return db.frontingEntries.get(x.uuid);
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

export function getFrontingBetweenIndex(start: Date, end?: Date) {
	if (!end) end = new Date();
	return db.frontingEntries.index
		.toSorted(sortFrontingEntries)
		.filter(x => {
			const _start = x.startTime!;
			const _end = x.endTime || new Date(end);
			if (start.valueOf() <= _end.valueOf() && end.valueOf() >= _start.valueOf())
				return true;

			return false;
		});
}

export function getFrontingStatistics(entries: (FrontingEntry & { endTime: Date })[]){
	const maps = {
		frontingCount: new Map<string, number>(),
		frontingTotalSpan: new Map<string, number>(),
		frontingPercent: new Map<string, number>(),
		frontingMinSpan: new Map<string, number>(),
		frontingMaxSpan: new Map<string, number>(),
		frontingEntries: new Map<string, FrontingEntry[]>(),
		frontingCo: new Map<string, Map<string, FrontingCo>>(),
		frontingPresenceMean: new Map<string, number>(),
		frontingPresenceMin: new Map<string, number>(),
		frontingPresenceMax: new Map<string, number>(),

		influencingCount: new Map<string, number>(),
		influencingPercent: new Map<string, number>(),
		influencingTotalSpan: new Map<string, number>(),
		influencingMinSpan: new Map<string, number>(),
		influencingMaxSpan: new Map<string, number>(),
		influencingEntries: new Map<string, FrontingEntry[]>(),
		influencingPresenceMean: new Map<string, number>(),
		influencingPresenceMin: new Map<string, number>(),
		influencingPresenceMax: new Map<string, number>(),

		influencedCount: new Map<string, number>(),
		influencedPercent: new Map<string, number>(),
		influencedTotalSpan: new Map<string, number>(),
		influencedMinSpan: new Map<string, number>(),
		influencedMaxSpan: new Map<string, number>(),
		influencedEntries: new Map<string, FrontingEntry[]>(),

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

	for(const entry of entries){
		const span = entry.endTime.valueOf() - entry.startTime.valueOf();

		if(entry.influencing){

			const influencingCount = maps.influencingCount.get(entry.member) || 0;
			const influencingTotalSpan = maps.influencingTotalSpan.get(entry.member) || 0;
			const influencingMinSpan = maps.influencingMinSpan.get(entry.member) || 0;
			const influencingMaxSpan = maps.influencingMaxSpan.get(entry.member) || 0;
			const influencingEntries = maps.influencingEntries.get(entry.member) || [];

			maps.influencingCount.set(entry.member, influencingCount + 1);
			maps.influencingTotalSpan.set(entry.member, influencingTotalSpan + span);
			maps.influencingMinSpan.set(entry.member, influencingMinSpan === 0 ? span : Math.min(influencingMinSpan, span));
			maps.influencingMaxSpan.set(entry.member, Math.max(influencingMaxSpan, span));

			if (!maps.influencingEntries.has(entry.member))
				maps.influencingEntries.set(entry.member, influencingEntries);

			influencingEntries.push(entry);

			const influencedCount = maps.influencedCount.get(entry.influencing) || 0;
			const influencedTotalSpan = maps.influencedTotalSpan.get(entry.influencing) || 0;
			const influencedMinSpan = maps.influencedMinSpan.get(entry.influencing) || 0;
			const influencedMaxSpan = maps.influencedMaxSpan.get(entry.influencing) || 0;
			const influencedEntries = maps.influencedEntries.get(entry.influencing) || [];

			maps.influencedCount.set(entry.influencing, influencedCount + 1);
			maps.influencedTotalSpan.set(entry.influencing, influencedTotalSpan + span);
			maps.influencedMinSpan.set(entry.influencing, influencedMinSpan === 0 ? span : Math.min(influencedMinSpan, span));
			maps.influencedMaxSpan.set(entry.influencing, Math.max(influencedMaxSpan, span));

			if (!maps.influencedEntries.has(entry.influencing))
				maps.influencedEntries.set(entry.influencing, influencedEntries);

			influencedEntries.push(entry);


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

			if (hour >= 10 && hour < 17) {
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
			const frontingEntries = maps.frontingEntries.get(entry.member) || [];
			const frontingCo: Map<string, FrontingCo> = maps.frontingCo.get(entry.member) || new Map();

			maps.frontingCount.set(entry.member, frontingCount + 1);
			maps.frontingTotalSpan.set(entry.member, frontingTotalSpan + span);
			maps.frontingMinSpan.set(entry.member, frontingMinSpan === 0 ? span : Math.min(frontingMinSpan, span));
			maps.frontingMaxSpan.set(entry.member, Math.max(frontingMaxSpan, span));

			if (!maps.frontingEntries.has(entry.member))
				maps.frontingEntries.set(entry.member, frontingEntries);

			if (!maps.frontingCo.has(entry.member))
				maps.frontingCo.set(entry.member, frontingCo);

			frontingEntries.push(entry);

			for (const betweenEntry of entries.filter(e => entry.startTime.valueOf() < e.endTime.valueOf() && entry.endTime.valueOf() > e.startTime.valueOf())){
				// we don't want to co-front with ourselves, and we also don't want to co-front with people influencing others
				if(betweenEntry.member === entry.member || betweenEntry.influencing) continue;

				const co: FrontingCo = frontingCo.get(betweenEntry.member) || { count: 0, percent: 0, minSpan: 0, maxSpan: 0, totalSpan: 0, entries: [] };
				const coSpan = Math.min(betweenEntry.endTime.valueOf(), entry.endTime.valueOf()) - Math.max(betweenEntry.startTime.valueOf(), entry.startTime.valueOf());

				co.count += 1;
				co.maxSpan = Math.max(coSpan, co.maxSpan);
				co.minSpan = co.minSpan === 0 ? coSpan : Math.min(coSpan, co.minSpan);
				co.totalSpan += coSpan;
				co.entries.push(entry, betweenEntry);

				frontingCo.set(betweenEntry.member, co);
			}

			const hour = entry.startTime.getHours();

			if (hour <= 5 || hour >= 22){
				const count = maps.nightFronters.get(entry.member) || 0;
				maps.nightFronters.set(entry.member, count + 1);
			}

			if (hour >= 6 && hour < 10) {
				const count = maps.morningFronters.get(entry.member) || 0;
				maps.morningFronters.set(entry.member, count + 1);
			}

			if (hour >= 10 && hour < 17) {
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

	for (const cos of maps.frontingCo.values()) {
		const allCofrontingSpan = cos.values().reduce((p, c) => p + c.totalSpan, 0);
		for(const [withMember, co] of cos.entries()){
			co.percent = (co.totalSpan / allCofrontingSpan) * 100;
			co.entries = [...new Set(co.entries)];
			cos.set(withMember, co);
		}
	}

	for (const [member, span] of maps.influencingTotalSpan.entries()) {
		const percent = (span / allInfluencingSpan) * 100;
		maps.influencingPercent.set(member, percent);
	}

	for (const [member, span] of maps.influencedTotalSpan.entries()) {
		const percent = (span / allInfluencedSpan) * 100;
		maps.influencedPercent.set(member, percent);
	}

	for(const [member, entries] of maps.frontingEntries.entries()){
		const withPresence = entries.filter(x => x.presence?.size);
		const total = withPresence.length;
		if(total){
			maps.frontingPresenceMean.set(member, withPresence.reduce((p, c) => p + (c.presence!.values().reduce((x, y) => x + y, 0) / c.presence!.size), 0) / total);
			maps.frontingPresenceMin.set(member, withPresence.reduce((p, c) => Math.min(p, (c.presence!.values().reduce((x, y) => Math.min(x, y), 10))), 10));
			maps.frontingPresenceMax.set(member, withPresence.reduce((p, c) => Math.max(p, (c.presence!.values().reduce((x, y) => Math.max(x, y), 0))), 0));
		}
	}

	for (const [member, entries] of maps.influencingEntries.entries()) {
		const withPresence = entries.filter(x => x.presence?.size);
		const total = withPresence.length;
		if(total){
			maps.influencingPresenceMean.set(member, withPresence.reduce((p, c) => p + (c.presence!.values().reduce((x, y) => x + y, 0) / c.presence!.size), 0) / total);
			maps.influencingPresenceMin.set(member, withPresence.reduce((p, c) => Math.min(p, (c.presence!.values().reduce((x, y) => Math.min(x, y), 10))), 10));
			maps.influencingPresenceMax.set(member, withPresence.reduce((p, c) => Math.max(p, (c.presence!.values().reduce((x, y) => Math.max(x, y), 0))), 0));
		}
	}

	return maps;
}

export async function getRecentlyFronted(days: number) {
	return Promise.all(
		db.frontingEntries.index
			.filter(x => x.endTime && Date.now() - x.endTime.getTime() <= days * 24 * 60 * 60 * 1000)
			.sort((a, b) => b.endTime!.getTime() - a.endTime!.getTime())
			.map(x => db.frontingEntries.get(x.uuid))
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
			yield frontingEntry;
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
	const fronting = await toFrontingEntryComplete(await getFronting());

	if(!backfill){
		if (securityConfig.useIPC)
			await broadcastEvent("fronting_changed", deleteFile(fronting));
	}

	await triggerReminders(fronting);
	await updateFrontingNotification(fronting);
}
