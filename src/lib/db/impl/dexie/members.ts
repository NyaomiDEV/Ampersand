import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../../events";
import { UUIDable, Member, UUID } from "../../entities";
import { nilUid } from "../../../util/misc";

export function getMembers(){
	return db.members.toArray();
}

export async function newMember(member: Omit<Member, keyof UUIDable>) {
	try{
		const uuid = window.crypto.randomUUID();
		await db.members.add({
			...member,
			uuid
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "members",
			event: "new",
			data: uuid
		}));
		return uuid;
	}catch(error){
		return false;
	}
}

export async function getMember(uuid: UUID) {
	if(uuid === nilUid) return undefined;
	return await db.members.get(uuid);
}

export async function deleteMember(uuid: UUID) {
	if(uuid === nilUid) return false;
	try {
		await db.members.delete(uuid);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "members",
			event: "deleted",
			data: uuid
		}));
		return true;
	} catch (error) {
		return false;
	}
}

export async function updateMember(uuid: UUID, newContent: Partial<Member>) {
	if(uuid === nilUid) return false;
	try{
		const updated = await db.members.update(uuid, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "members",
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