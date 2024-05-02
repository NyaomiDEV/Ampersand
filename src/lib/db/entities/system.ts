import { db } from "..";
import { getConfigEntry, saveConfig } from "../../config";
import { AppNamespace, makeUUIDv5 } from "../../util/uuid"
import { UUIDable } from "../types"

export type System = UUIDable & {
	name: string,
	image?: File
}

export function getTable(){
	return db.system;
}

export function genid(name: string) {
	return makeUUIDv5(AppNamespace, name);
}

export async function newSystem(system: Omit<System, keyof UUIDable>){
	const uuid = genid(system.name);
	const res = await getTable().add({
		...system,
		uuid
	});
	saveConfig({
		currentSystemUUID: uuid
	});

	return res;
}

// Extra because there shall only be one

export function getSystem(){
	return db.system.get(getSystemUUID());
}

export function getSystemUUID(){
	return getConfigEntry("currentSystemUUID") as string;
}

export function modifySystem(system: Partial<System>) {
	return db.system.update(getSystemUUID(), system);
}
