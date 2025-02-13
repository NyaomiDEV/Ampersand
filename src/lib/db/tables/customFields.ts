import { CustomField, UUIDable, UUID } from '../entities';

const impl = await ("isTauri" in window ? import('../impl/tauri/customFields') : import('../impl/dexie/customFields'));

export function getCustomFields(){
	return impl.getCustomFields();
}

export function newCustomField(customField: Omit<CustomField, keyof UUIDable>) {
	return impl.newCustomField(customField);
}

export function deleteCustomField(uuid: UUID) {
	return impl.deleteCustomField(uuid);
}

export function updateCustomField(uuid: UUID, newContent: Partial<CustomField>) {
	return impl.updateCustomField(uuid, newContent);
}
