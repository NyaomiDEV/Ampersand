import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUIDable, System } from "../entities";

export async function newSystem(system: Omit<System, keyof UUIDable>){
	try{
		const uuid = window.crypto.randomUUID();
		await db.system.add(uuid, {
			...system,
			uuid
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "system",
			event: "new",
			data: uuid
		}));
		return uuid;
	}catch(_error){
		return false;
	}
}

// Extra because there shall only be one
export async function getSystem(): Promise<System | undefined> {
	return (await db.system.iterate().next()).value || undefined;
}

export async function getSystemUUID(){
	return (await db.system.iterate().next()).value?.uuid;
}

export async function modifySystem(system: Partial<System>) {
	try {
		const uuid = await getSystemUUID();
		if(!uuid) return false;
		
		const updated = await db.system.update(uuid, system);
		if(updated){
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "system",
				event: "modified",
				data: uuid
			}));
			return true;
		}
		return false;
	} catch (_error) {
		return false;
	}
}
