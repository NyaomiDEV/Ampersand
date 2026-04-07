import { t } from "i18next";

import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUIDable, Member, UUID } from "../entities";
import { maxUid, nilUid } from "../../util/consts";
import { filterMember } from "../../search";
import { sortMembers } from "../../util/misc";
import { TransactionStatus } from "../types";

export async function* getMembers(maxIter = 20){
	const uuids = db.members.index.sort(sortMembers).map(x => x.uuid);

	const f = (offset: number, maxIter: number) => {
		const chunk: Promise<Member>[] = [];
		for (let i = offset; i < offset + maxIter; i++) {
			if (uuids[i]) {
				const data = db.members.get(uuids[i]);
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

export function getMemberIndex(){
	return db.members.index;
}

export async function* getFilteredMembers(query: string){
	for await (const member of getMembers()){
		if(await filterMember(query, member))
			yield member;
	}
}

export async function newMember(member: Omit<Member, keyof UUIDable>): Promise<TransactionStatus<string>> {
	try{
		const uuid = await db.members.add(member);

		if(!uuid) throw new Error("already exists in database");

		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "members",
			event: "new",
			uuid,
			newData: member
		}));
		return { success: true, detail: uuid };
	}catch(_e){
		console.error(_e);
		return { success: false, err: _e };
	}
}

export async function getMember(uuid: UUID){
	if(uuid === nilUid)
		return defaultMember();

	return await db.members.get(uuid);
}

export async function deleteMember(uuid: UUID): Promise<TransactionStatus<void>> {
	if (uuid === nilUid) return { success: false };
	try {
		await db.members.delete(uuid);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "members",
			event: "deleted",
			uuid,
			delta: {}
		}));
		return { success: true };
	} catch (_e) {
		console.error(_e);
		return { success: false, err: _e };
	}
}

export async function updateMember(newContent: UUIDable & Partial<Member>): Promise<TransactionStatus<{ oldData: Member, newData: Member }>> {
	if (newContent.uuid === nilUid) return { success: false };
	try{
		const updated = await db.members.update(newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "members",
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
		return { success: false, err: _e };
	}
}

export const defaultMember = (uuid?: UUID): Member => ({
	name: t("members:deletedMember"),
	system: nilUid,
	isArchived: false,
	isCustomFront: false,
	isPinned: false,
	dateCreated: new Date(0),
	tags: [],
	uuid: uuid || nilUid
});

export const defaultCustomFront = (): Member => ({
	name: t("members:deletedCustomFront"),
	system: nilUid,
	isArchived: false,
	isCustomFront: true,
	isPinned: false,
	dateCreated: new Date(0),
	tags: [],
	uuid: maxUid
});

