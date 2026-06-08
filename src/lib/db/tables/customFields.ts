import { db } from "..";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUID, UUIDable, CustomField } from "../entities";
import { filterCustomField } from "../../search";
import { TransactionStatus } from "../types";
import { sortCustomFields } from "../../util/misc";
import { getMembers, updateMember } from "./members";

export async function* getCustomFields(maxIter = 10){
	const uuids = db.customFields.index.toSorted(sortCustomFields).map(x => x.uuid);
	
	const f = (offset: number, maxIter: number) => {
		const chunk: Promise<CustomField>[] = [];
		for (let i = offset; i < offset + maxIter; i++) {
			if (uuids[i]) {
				const data = db.customFields.get(uuids[i]);
				chunk.push(data);
			}
		}
		return chunk;
	};
	
	let offset = 0;
	while (offset < uuids.length) {
		const promises = f(offset, maxIter);
		offset += maxIter;
		for (const promise of promises)
			yield await promise;
	};
}

export function getCustomFieldsIndex(){
	return db.customFields.index;
}

export async function* getFilteredCustomFields(query: string){
	for await (const customField of getCustomFields()){
		if (filterCustomField(query, customField))
			yield customField;
	}
}

export async function newCustomField(customField: Omit<CustomField, keyof UUIDable>): Promise<TransactionStatus<string>> {
	try{
		const uuid = await db.customFields.add(customField);

		if(!uuid) throw new Error("already exists in database");

		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "customFields",
			event: "new",
			uuid,
			newData: customField
		}));
		return { success: true, detail: uuid };
	}catch(_e){
		console.error(_e);
		return { success: false, err: _e instanceof Error ? _e : new Error(String(_e)) };
	}
}

export async function deleteCustomField(uuid: UUID): Promise<TransactionStatus<void>> {
	try {
		for await (const member of getMembers()) {
			if (!member.customFields?.has(uuid)) continue;

			const delta = { uuid: member.uuid, customFields: new Map(member.customFields?.entries().filter(x => x[0] !== uuid)) };
			await updateMember(delta);	
		}

		await db.customFields.delete(uuid);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "customFields",
			event: "deleted",
			uuid,
			delta: {}
		}));
		return { success: true };
	} catch (_e) {
		console.error(_e);
		return { success: false, err: _e instanceof Error ? _e : new Error(String(_e)) };
	}
}

export async function updateCustomField(newContent: UUIDable & Partial<CustomField>): Promise<TransactionStatus<{ oldData: CustomField, newData: CustomField }>> {
	try{
		const updated = await db.customFields.update(newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "customFields",
				event: "modified",
				uuid: newContent.uuid,
				delta: newContent,
				oldData: updated.oldData,
				newData: updated.newData
			}));
			return { success: true, detail: updated };
		}
		throw new Error("not updated, did not exist in db");
	}catch(_e){
		console.error(_e);
		return { success: false, err: _e instanceof Error ? _e : new Error(String(_e)) };
	}
}

export function isValidCustomField(customField: CustomField | UUID){
	return typeof customField === "string" ? !!getCustomFieldsIndex().find(x => x.uuid === customField) : !!getCustomFieldsIndex().find(x => x.uuid === customField.uuid);
}
