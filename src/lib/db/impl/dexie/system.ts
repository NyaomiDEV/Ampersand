import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../../events";
import { UUIDable, System } from "../../entities"

export async function newSystem(system: Omit<System, keyof UUIDable>){
	try{
		const uuid = window.crypto.randomUUID();
		await db.system.add({
			...system,
			uuid
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "system",
			event: "new",
			data: uuid
		}));
		return uuid;
	}catch(error){
		return false;
	}
}

// Extra because there shall only be one
export function getSystem(){
	return db.system.toCollection().first();
}

export async function getSystemUUID(){
	return (await db.system.toCollection().first())?.uuid;
}

export async function modifySystem(system: Partial<System>) {
	try {
		const uuid = (await getSystemUUID())!;
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
	} catch (error) {
		return false;
	}
}
