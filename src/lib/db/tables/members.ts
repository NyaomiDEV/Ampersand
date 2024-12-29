import { UUIDable, Member } from "../entities";

const impl = await import('../impl/dexie/members');

export function getMembersTable() {
	return impl.getMembersTable();
}

export function newMember(member: Omit<Member, keyof UUIDable>) {
	return impl.newMember(member);
}
