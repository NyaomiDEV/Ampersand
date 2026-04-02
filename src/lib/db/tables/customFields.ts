import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUID, UUIDable, CustomField } from "../entities";
import { filterCustomField } from "../../search";
import { TransactionStatus } from "../types";

export function getCustomFields(){
	return db.customFields.iterate();
}

export async function* getFilteredCustomFields(query: string){
	for await (const customField of getCustomFields()){
		if (filterCustomField(query, customField))
			yield customField;
	}
}

export async function newCustomField(customField: Omit<CustomField, keyof UUIDable>): Promise<TransactionStatus<string>> {
	try{
		const uuid = window.crypto.randomUUID();
		const result = await db.customFields.add(uuid, {
			...customField,
			uuid
		});

		if(!result) throw new Error("already exists in database");

		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "customFields",
			event: "new",
			uuid,
			newData: customField
		}));
		return { success: true, detail: uuid };
	}catch(_e){
		console.error(_e);
		return { success: false, err: _e };
	}
}

export async function deleteCustomField(uuid: UUID): Promise<TransactionStatus<void>> {
	try {
		await db.customFields.delete(uuid);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "customFields",
			event: "deleted",
			uuid,
			delta: {}
		}));
		return { success: true };
	} catch (_e) {
		console.log(_e);
		return { success: false, err: _e };
	}
}

export async function updateCustomField(uuid: UUID, newContent: Partial<CustomField>): Promise<TransactionStatus<{ oldData: CustomField, newData: CustomField }>> {
	try{
		const updated = await db.customFields.update(uuid, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "customFields",
				event: "modified",
				uuid,
				delta: newContent,
				oldData: updated.oldData,
				newData: updated.newData
			}));
			return { success: true, detail: updated };
		}
		throw new Error("not updated, did not exist in db");
	}catch(_e){
		console.error(_e);
		return { success: false, err: _e };
	}
}