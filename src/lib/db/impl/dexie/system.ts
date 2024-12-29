import { db } from ".";
import { AppNamespace, makeUUIDv5 } from "../../../util/uuid"
import { UUIDable, System } from "../../entities"

export function getSystemTable(){
	return db.system;
}

export function genid(name: string) {
	return makeUUIDv5(AppNamespace, name);
}

export async function newSystem(system: Omit<System, keyof UUIDable>){
	const uuid = genid(system.name);
	const res = await getSystemTable().add({
		...system,
		uuid
	});

	return res;
}

// Extra because there shall only be one
export async function getSystem(){
	return await getSystemTable().toCollection().first();
}

export async function getSystemUUID(){
	return (await getSystemTable().toCollection().first())?.uuid;
}

export async function modifySystem(system: Partial<System>) {
	return db.system.update(await getSystemUUID(), system);
}
