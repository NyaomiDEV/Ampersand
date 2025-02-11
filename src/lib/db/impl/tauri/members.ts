import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../../events";
import { UUIDable, Member, UUID } from "../../entities";

export function getMembers(){
	return db.members.toArray();
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
			data: uuid
		}));
		return uuid;
	}catch(error){
		return false;
	}
}

export async function deleteMember(uuid: UUID) {
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