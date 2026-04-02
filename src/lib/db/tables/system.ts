import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUIDable, System, UUID } from "../entities";
import { nilUid } from "../../util/consts";
import { filterSystem } from "../../search";
import { TransactionStatus } from "../types";
import { sortSystems } from "../../util/misc";

export async function* getSystems(maxIter = 20){
	const uuids = db.systems.index.sort(sortSystems).map(x => x.uuid);
	
	const f = (offset: number, maxIter: number) => {
		const chunk: Promise<System | undefined>[] = [];
		for (let i = offset; i < offset + maxIter; i++) {
			if (uuids[i]) {
				const data = db.systems.get(uuids[i]);
				chunk.push(data);
			}
		}
		return chunk;
	};
	
	let offset = 0;
	while (offset < uuids.length) {
		const promises = f(offset, maxIter);
		offset += maxIter;
		for (const promise of promises) {
			const data = await promise;
			if (data) yield data;
		}
	};
}

export async function getSystem(uuid: UUID) {
	if (uuid === nilUid) return undefined;
	return await db.systems.get(uuid);
}

export async function* getFilteredSystems(query: string){
	for await (const system of getSystems()){
		if(filterSystem(query, system))
			yield system;
	}
}

export async function newSystem(system: Omit<System, keyof UUIDable>): Promise<TransactionStatus<string>> {
	try{
		const uuid = window.crypto.randomUUID();
		const result = await db.systems.add(uuid, {
			...system,
			uuid
		});

		if(!result) throw new Error("already exists in database");

		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "systems",
			event: "new",
			uuid,
			newData: system
		}));
		return { success: true, detail: uuid };
	}catch(_e){
		console.error(_e);
		return { success: false, err: _e };
	}
}

export async function deleteSystem(uuid: UUID): Promise<TransactionStatus<void>> {
	if (uuid === nilUid) return { success: false };
	try {
		await db.systems.delete(uuid);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "systems",
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

export async function updateSystem(uuid: UUID, system: Partial<System>): Promise<TransactionStatus<{ oldData: System, newData: System }>> {
	try {
		const updated = await db.systems.update(uuid, system);
		if(updated){
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "systems",
				event: "modified",
				uuid,
				delta: system
			}));
			return { success: true, detail: updated };
		}
		throw new Error("not updated, did not exist in db");
	} catch (_e) {
		console.error(_e);
		return { success: false, err: _e };
	}
}

export function countSystemMembers(uuid: UUID){
	const object = {
		normal: 0,
		archived: 0,
		customFronts: 0,
		archivedCustomFronts: 0
	};

	for(const x of db.members.index.filter(x => x.system === uuid)){
		if (x.isCustomFront){
			if(x.isArchived) object.archivedCustomFronts++;
			else object.customFronts++;
		} else {
			if (x.isArchived) object.archived++;
			else object.normal++;
		}
	}

	return object;
}