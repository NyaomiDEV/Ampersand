import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUIDable, System, UUID } from "../entities";
import { nilUid } from "../../util/misc";

export function getSystems(){
	return db.systems.iterate();
}

export async function newSystem(system: Omit<System, keyof UUIDable>){
	try{
		const uuid = window.crypto.randomUUID();
		await db.systems.add(uuid, {
			...system,
			uuid
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "systems",
			event: "new",
			uuid,
			newData: system
		}));
		return uuid;
	}catch(_error){
		return false;
	}
}

export async function getSystem(uuid: UUID){
	if(uuid === nilUid) return undefined;
	return await db.systems.get(uuid);
}

export async function deleteMember(uuid: UUID) {
	if (uuid === nilUid) return false;
	try {
		await db.systems.delete(uuid);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "systems",
			event: "deleted",
			uuid,
			delta: {}
		}));
		return true;
	} catch (_error) {
		return false;
	}
}

export async function modifySystem(uuid: UUID, system: Partial<System>) {
	try {
		const updated = await db.systems.update(uuid, system);
		if(updated){
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "systems",
				event: "modified",
				uuid,
				delta: system
			}));
			return true;
		}
		return false;
	} catch (_error) {
		return false;
	}
}
