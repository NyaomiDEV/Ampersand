import { t } from "i18next";

import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUIDable, Member, UUID } from "../entities";
import { maxUid, nilUid } from "../../util/misc";
import { filterMember } from "../../search";

export function getMembers(){
	return db.members.iterate();
}

export async function* getFilteredMembers(query: string){
	for await (const member of getMembers()){
		if(await filterMember(query, member))
			yield member;
	}
}

export async function newMember(member: Omit<Member, keyof UUIDable>) {
	try{
		const uuid = window.crypto.randomUUID();
		await db.members.add(uuid, {
			...member,
			uuid
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "members",
			event: "new",
			uuid,
			delta: member
		}));
		return uuid;
	}catch(_error){
		return false;
	}
}

export async function getMember(uuid: UUID){
	if(uuid === nilUid) return undefined;
	return await db.members.get(uuid);
}

export async function deleteMember(uuid: UUID) {
	if (uuid === nilUid) return false;
	try {
		await db.members.delete(uuid);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "members",
			event: "deleted",
			uuid,
			delta: {}
		}));
		return true;
	} catch (_error) {
		return false;
	}
}

export async function updateMember(uuid: UUID, newContent: Partial<Member>) {
	if (uuid === nilUid) return undefined;
	try{
		const updated = await db.members.update(uuid, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "members",
				event: "modified",
				uuid,
				delta: newContent
			}));
			return true;
		}
		return false;
	}catch(_error){
		return false;
	}
}

export const defaultMember = (): Member => ({
	name: t("members:deletedMember"),
	isArchived: false,
	isCustomFront: false,
	dateCreated: new Date(0),
	tags: [],
	uuid: nilUid
});

export const defaultCustomFront = (): Member => ({
	name: t("members:deletedCustomFront"),
	isArchived: false,
	isCustomFront: true,
	dateCreated: new Date(0),
	tags: [],
	uuid: maxUid
});