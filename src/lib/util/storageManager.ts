import { ref } from "vue";
import { isTauri } from "../mode";

export const wasPersisted = ref(isTauri());

export async function tryPersistStorage(){
	wasPersisted.value = isTauri() || await navigator.storage?.persisted();

	if (!wasPersisted.value) {
		const persist = await navigator.storage?.persist();

		if (!persist)
			console.error("Storage cannot be made persistent, data will be lost!", persist);
		else
			wasPersisted.value = persist;
	}

	return wasPersisted.value;
}
