import { db } from "..";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUID, UUIDable, FilterQuery, FilterQueryType } from "../entities";
import { TransactionStatus } from "../types";
import { sortName } from "../../util/misc";

export async function* getFilterQueries(maxIter = 10){
	const uuids = db.filterQueries.index.toSorted(sortName).map(x => x.uuid);
	
	const f = (offset: number, maxIter: number) => {
		const chunk: Promise<FilterQuery>[] = [];
		for (let i = offset; i < offset + maxIter; i++) {
			if (uuids[i]) {
				const data = db.filterQueries.get(uuids[i]);
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

export function getFilterQueriesIndex(){
	return db.filterQueries.index;
}

export async function* getFilterQueriesByType(type: FilterQueryType, maxIter = 10){
	const uuids = db.filterQueries.index.toSorted(sortName).filter(x => x.type === type).map(x => x.uuid);

	const f = (offset: number, maxIter: number) => {
		const chunk: Promise<FilterQuery>[] = [];
		for (let i = offset; i < offset + maxIter; i++) {
			if (uuids[i]) {
				const data = db.filterQueries.get(uuids[i]);
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

export async function* getFilteredFilterQueries(type: FilterQueryType, query: string){
	for await (const filterQuery of getFilterQueriesByType(type)){
		if (filterQuery.name.toLowerCase().includes(query.toLowerCase()))
			yield filterQuery;
	}
}

export async function newFilterQuery(filterQuery: Omit<FilterQuery, keyof UUIDable>): Promise<TransactionStatus<string>> {
	try{
		const uuid = await db.filterQueries.add(filterQuery);

		if(!uuid) throw new Error("already exists in database");

		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "filterQueries",
			event: "new",
			uuid,
			newData: filterQuery
		}));
		return { success: true, detail: uuid };
	}catch(_e){
		console.error(_e);
		return { success: false, err: _e instanceof Error ? _e : new Error(String(_e)) };
	}
}

export async function deleteFilterQuery(uuid: UUID): Promise<TransactionStatus<void>> {
	try {
		await db.filterQueries.delete(uuid);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "filterQueries",
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

export async function updateFilterQuery(newContent: UUIDable & Partial<FilterQuery>): Promise<TransactionStatus<{ oldData: FilterQuery, newData: FilterQuery }>> {
	try{
		const updated = await db.filterQueries.update(newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "filterQueries",
				event: "modified",
				uuid: newContent.uuid,
				delta: newContent,
				oldData: updated.oldData,
				newData: updated.newData
			}));
			return { success: true, detail: updated };
		}
		throw new Error("not updated, did not exist in db");
	}catch(_e){
		console.error(_e);
		return { success: false, err: _e instanceof Error ? _e : new Error(String(_e)) };
	}
}