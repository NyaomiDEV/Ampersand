import { t } from "i18next";

import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUIDable, Member, UUID } from "../entities";
import { maxUid, nilUid } from "../../util/consts";
import { filterMember } from "../../search";
import { PartialBy } from "../../types";

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
		const id = window.crypto.randomUUID();
		await db.members.add(id, {
			...member,
			id
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "members",
			event: "new",
			id,
			newData: member
		}));
		return {
			...member,
			id
		};
	}catch(_error){
		return;
	}
}

export async function getMember(id: UUID){
	if(id === nilUid) return undefined;
	return await db.members.get(id);
}

export async function deleteMember(member: Member | UUID) {
	const id = typeof member === "string" ? member : member.id;
	if (id === nilUid) return false;
	try {
		await db.members.delete(id);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "members",
			event: "deleted",
			id,
			delta: {}
		}));
		return true;
	} catch (_error) {
		return false;
	}
}

export async function updateMember(id: UUID, newContent: Partial<Member>) {
	if (id === nilUid) return undefined;
	try{
		const updated = await db.members.update(id, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "members",
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

export async function saveMember(member: PartialBy<Member, keyof UUIDable | "dateCreated">){
	if (member.id){
		await updateMember(member.id, { ...member });
		return member as Member;
	}
	return await newMember({
		...member,
		dateCreated: new Date()
	});
}

export const defaultMember = (): Member => ({
	name: t("members:deletedMember"),
	system: {
		id: nilUid,
		name: ""
	},
	isArchived: false,
	isCustomFront: false,
	isPinned: false,
	dateCreated: new Date(0),
	id: nilUid
});

export const defaultCustomFront = (): Member => ({
	name: t("members:deletedCustomFront"),
	system: {
		id: nilUid,
		name: ""
	},
	isArchived: false,
	isCustomFront: true,
	isPinned: false,
	dateCreated: new Date(0),
	id: maxUid
});

