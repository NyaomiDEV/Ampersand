import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUID, UUIDable, MemberTag, Member, Tag } from "../entities";

export function getMemberTags(){
	return db.memberTags.iterate();
}

export async function* getMemberTagsForMember(member: Member | UUID){
	const id = typeof member === "string" ? member : member.id;

	for await (const entry of getMemberTags()){
		if(entry.member.id === id)
			yield entry;
	}
}

export async function memberHasTag(member: Member | UUID, tag: Tag | UUID){
	const memberId = typeof member === "string" ? member : member.id;
	const tagId = typeof tag === "string" ? tag : tag.id;

	for await (const entry of getMemberTags()){
		if(entry.member.id === memberId && entry.tag.id === tagId)
			return true;
	}

	return false;
}

export async function newMemberTag(memberTag: Omit<MemberTag, keyof UUIDable>) {
	try{
		const id = window.crypto.randomUUID();
		await db.memberTags.add(id, {
			...memberTag,
			id
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "memberTags",
			event: "new",
			id,
			newData: memberTag
		}));
		return {
			...memberTag,
			id
		};
	}catch(_error){
		return;
	}
}

export async function deleteMemberTag(id: UUID) {
	try {
		await db.memberTags.delete(id);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "memberTags",
			event: "deleted",
			id,
			delta: {}
		}));
		return true;
	} catch (_error) {
		return false;
	}
}

export async function updateMemberTag(id: UUID, newContent: Partial<MemberTag>) {
	try{
		const updated = await db.memberTags.update(id, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "memberTags",
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