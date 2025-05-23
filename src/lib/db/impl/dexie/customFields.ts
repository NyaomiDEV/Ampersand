import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../../events";
import { UUID, UUIDable, CustomField } from "../../entities";

export function getCustomFields(){
	return db.customFields.toArray();
}

export async function newCustomField(customField: Omit<CustomField, keyof UUIDable>) {
	try{
		const uuid = window.crypto.randomUUID();
		await db.customFields.add({
			...customField,
			uuid
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "customFields",
			event: "new",
			data: uuid
		}));
		return uuid;
	}catch(error){
		return false;
	}
}

export async function deleteCustomField(uuid: UUID) {
	try {
		await db.customFields.delete(uuid);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "customFields",
			event: "deleted",
			data: uuid
		}));
		return true;
	} catch (error) {
		return false;
	}
}

export async function updateCustomField(uuid: UUID, newContent: Partial<CustomField>) {
	try{
		const updated = await db.customFields.update(uuid, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "customFields",
				event: "modified",
				data: uuid
			}));
			return true;
		}
		return false;
	}catch(error){
		return false;
	}
}