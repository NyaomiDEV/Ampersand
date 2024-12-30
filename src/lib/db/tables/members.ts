import { UUIDable, Member, UUID } from "../entities";

const impl = await import('../impl/dexie/members');

export function getMembers() {
	return impl.getMembers();
}

export function newMember(member: Omit<Member, keyof UUIDable>) {
	return impl.newMember(member);
}

export function removeMember(uuid: UUID){
	return impl.removeMember(uuid);
}

export function updateMember(uuid: UUID, newContent: Partial<Member>){
	return impl.updateMember(uuid, newContent);
}