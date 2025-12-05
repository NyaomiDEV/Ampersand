import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUID, UUIDable, CustomField } from "../entities";
import { filterCustomField } from "../../search";
import { PartialBy } from "../../types";

export function getCustomFields(){
	return db.customFields.iterate();
}

export async function* getFilteredCustomFields(query: string){
	for await (const customField of getCustomFields()){
		if (filterCustomField(query, customField))
			yield customField;
	}
}

export async function newCustomField(customField: Omit<CustomField, keyof UUIDable>) {
	try{
		const id = window.crypto.randomUUID();
		await db.customFields.add(id, {
			...customField,
			id
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "customFields",
			event: "new",
			id,
			newData: customField
		}));
		return {
			...customField,
			id
		};
	}catch(_error){
		return;
	}
}

export async function deleteCustomField(customField: CustomField | UUID) {
	const id = typeof customField === "string" ? customField : customField.id;
	try {
		await db.customFields.delete(id);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "customFields",
			event: "deleted",
			id,
			delta: {}
		}));
		return true;
	} catch (_error) {
		return false;
	}
}

export async function updateCustomField(id: UUID, newContent: Partial<CustomField>) {
	try{
		const updated = await db.customFields.update(id, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "customFields",
				event: "modified",
				id,
				delta: newContent,
				oldData: updated.oldData,
				newData: updated.newData
			}));
			return true;
		}
		return false;
	}catch(_error){
		return false;
	}
}

export async function saveCustomField(customField: PartialBy<CustomField, keyof UUIDable>){
	if (customField.id){
		await updateCustomField(customField.id, { ...customField });
		return customField as CustomField;
	}
	return await newCustomField({ ...customField });
}