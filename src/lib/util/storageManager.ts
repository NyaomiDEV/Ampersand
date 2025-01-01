import { ref } from "vue";

export const wasPersisted = ref('isTauri' in window || false);

export async function tryPersistStorage(){
	wasPersisted.value = 'isTauri' in window || await navigator.storage?.persisted();

	if (!wasPersisted.value) {
		const persist = await navigator.storage?.persist();

		if (!persist)
			console.error("Storage cannot be made persistent, data will be lost!", persist);
		else
			wasPersisted.value = persist;
	}

	return wasPersisted.value;
}
