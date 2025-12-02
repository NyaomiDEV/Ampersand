import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUIDable, System, UUID } from "../entities";
import { nilUid } from "../../util/consts";

export function getSystems(){
	return db.systems.iterate();
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
		return id;
	}catch(_error){
		return false;
	}
}

export async function getSystem(uuid: UUID){
	if(uuid === nilUid) return undefined;
	return await db.systems.get(uuid);
}

export async function deleteSystem(id: UUID) {
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
