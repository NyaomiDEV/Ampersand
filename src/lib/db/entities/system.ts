import { ref, Ref, watch } from "vue";
import { db } from "..";
import { AppNamespace, makeUUIDv5 } from "../../util/uuid"
import { UUIDable } from "../types"
import { from, useObservable } from "@vueuse/rxjs";
import { liveQuery } from "dexie";

export type System = UUIDable & {
	name: string,
	image?: File
}

export function getTable(){
	return db.system;
}

export const system: Ref<System> = ref({
	name: "",
	uuid: ""
});

export async function updateSystemRef() {
	const _system = await getTable().toArray();
	if(_system.length)
		system.value = _system[0];
}

watch([useObservable(from(liveQuery(() => getTable().toArray())))], updateSystemRef, { immediate: true });

export function genid(name: string) {
	return makeUUIDv5(AppNamespace, name);
}

export async function newSystem(system: Omit<System, keyof UUIDable>){
	const uuid = genid(system.name);
	const res = await getTable().add({
		...system,
		uuid
	});

	return res;
}

// Extra because there shall only be one
export function getSystem(){
	return {...system.value}
}

export function getSystemUUID(){
	return system.value.uuid;
}

export function modifySystem(system: Partial<System>) {
	return db.system.update(getSystemUUID(), system);
}
