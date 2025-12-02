import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUID, UUIDable, CustomFieldDatum, Member } from "../entities";

export function getCustomFieldData(){
	return db.customFieldData.iterate();
}

export async function* getCustomFieldDataForMember(member: Member){
	for await(const datum of getCustomFieldData()){
		if(datum.member.id === member.id)
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

export async function deleteCustomFieldDatum(id: UUID) {
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