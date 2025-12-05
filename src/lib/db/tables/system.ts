import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUIDable, System, UUID } from "../entities";
import { nilUid } from "../../util/consts";
import { filterSystem } from "../../search";
import { PartialBy } from "../../types";

export function getSystems(){
	return db.systems.iterate();
}

export async function* getFilteredSystems(query: string){
	for await (const system of getSystems()){
		if(filterSystem(query, system))
			yield system;
	}
}

export async function newSystem(system: Omit<System, keyof UUIDable>){
	try{
		const id = window.crypto.randomUUID();
		await db.systems.add(id, {
			...system,
			id
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "systems",
			event: "new",
			id,
			newData: system
		}));
		return {
			...system,
			id
		};
	}catch(_error){
		return;
	}
}

export async function getSystem(uuid: UUID){
	if(uuid === nilUid) return undefined;
	return await db.systems.get(uuid);
}

export async function deleteSystem(system: System | UUID) {
	const id = typeof system === "string" ? system : system.id;
	if (id === nilUid) return false;
	try {
		await db.systems.delete(id);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "systems",
			event: "deleted",
			id,
			delta: {}
		}));
		return true;
	} catch (_error) {
		return false;
	}
}

export async function updateSystem(id: UUID, system: Partial<System>) {
	try {
		const updated = await db.systems.update(id, system);
		if(updated){
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "systems",
				event: "modified",
				id,
				delta: system
			}));
			return true;
		}
		return false;
	} catch (_error) {
		return false;
	}
}

export async function saveSystem(system: PartialBy<System, keyof UUIDable>) {
	if (system.id){
		await updateSystem(system.id, { ...system });
		return system as System;
	}
	return await newSystem({ ...system });
}