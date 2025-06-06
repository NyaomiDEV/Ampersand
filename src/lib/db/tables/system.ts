import { UUIDable, System } from "../entities";

const impl = await ("isTauri" in window ? import('../impl/tauri/system') : import('../impl/dexie/system'));

export function newSystem(system: Omit<System, keyof UUIDable>){
	return impl.newSystem(system);
}

// Extra because there shall only be one
export function getSystem(){
	return impl.getSystem();
}

export function getSystemUUID(){
	return impl.getSystemUUID();
}

export function modifySystem(system: Partial<System>) {
	return impl.modifySystem(system);
}
