import { UUIDable, System } from "../entities";

import * as impl from '../impl/tauri/system';

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
