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

export async function* getMemberTagsForTag(tag: Tag | UUID) {
	const id = typeof tag === "string" ? tag : tag.id;

	for await (const entry of getMemberTags()) {
		if (entry.tag.id === id)
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

export async function deleteMemberTag(memberTag: MemberTag | UUID) {
	const id = typeof memberTag === "string" ? memberTag : memberTag.id;
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

export async function tagMembers(tag: Tag, members: Member[]){
	const allMemberTags = await Array.fromAsync(getMemberTagsForTag(tag));
	for (const memberTag of allMemberTags) {
		const member = members.find(x => x.id === memberTag.member.id);
		if (!member)
			await deleteMemberTag(memberTag.id);
		else members = members.filter(x => x.id !== member.id);
	}
	for (const remainingMember of members) {
		await newMemberTag({
			tag,
			member: remainingMember
		});
	}
}

export async function memberTags(member: Member, tags: Tag[]){
	for await (const memberTag of getMemberTagsForMember(member)) {
		const tag = tags.find(x => x.id === memberTag.tag.id);
		if (!tag)
			await deleteMemberTag(memberTag.id);
		else tags = tags.filter(x => x !== tag);
	}
	for (const remainingTag of tags) {
		await newMemberTag({
			tag: remainingTag,
			member
		});
	}
}