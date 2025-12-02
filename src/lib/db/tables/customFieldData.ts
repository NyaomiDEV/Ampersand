import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUID, UUIDable, CustomFieldDatum, Member, CustomField } from "../entities";

export function getCustomFieldData(){
	return db.customFieldData.iterate();
}

export async function* getCustomFieldDataForMember(member: Member | UUID){
	const id = typeof member === "string" ? member : member.id;
	for await(const datum of getCustomFieldData()){
		if(datum.member.id === id)
			yield datum;
	}
}

export async function newCustomFieldDatum(customFieldDatum: Omit<CustomFieldDatum, keyof UUIDable>) {
	try{
		const id = window.crypto.randomUUID();
		await db.customFieldData.add(id, {
			...customFieldDatum,
			id
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "customFieldData",
			event: "new",
			id,
			newData: customFieldDatum
		}));
		return {
			...customFieldDatum,
			id
		};
	}catch(_error){
		return;
	}
}

export async function deleteCustomFieldDatum(customFieldDatum: CustomFieldDatum | UUID) {
	const id = typeof customFieldDatum === "string" ? customFieldDatum : customFieldDatum.id;
	try {
		await db.customFieldData.delete(id);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "customFieldData",
			event: "deleted",
			id,
			delta: {}
		}));
		return true;
	} catch (_error) {
		return false;
	}
}

export async function updateCustomFieldDatum(id: UUID, newContent: Partial<CustomFieldDatum>) {
	try{
		const updated = await db.customFieldData.update(id, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "customFieldData",
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

export async function memberCustomFields(member: Member, customFields: Map<CustomField, string>){
	let _customFields = Array.from(customFields.entries());
	for await (const customFieldDatum of getCustomFieldDataForMember(member)) {
		const field = _customFields.find(x => x[0].id === customFieldDatum.field.id);
		if (!field || !field[1].length)
			await deleteCustomFieldDatum(customFieldDatum.id);
		else {
			await updateCustomFieldDatum(customFieldDatum.id, {
				value: field[1]
			});
			_customFields = _customFields.filter(x => x !== field);
		}
	}

	for (const remainingField of _customFields) {
		if (remainingField[1].length) {
			await newCustomFieldDatum({
				value: remainingField[1],
				member,
				field: remainingField[0]
			});
		}
	}
}