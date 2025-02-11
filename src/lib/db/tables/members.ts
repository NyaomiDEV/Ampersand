import { t } from "i18next";
import { UUIDable, Member, UUID } from "../entities";

const impl = await ("isTauri" in window ? import('../impl/tauri/members') : import('../impl/dexie/members'));

export function getMembers() {
	return impl.getMembers();
}

export function newMember(member: Omit<Member, keyof UUIDable>) {
	return impl.newMember(member);
}

export function deleteMember(uuid: UUID){
	return impl.deleteMember(uuid);
}

export function updateMember(uuid: UUID, newContent: Partial<Member>){
	return impl.updateMember(uuid, newContent);
}

export const defaultMember = (): Member => ({
	name: t("members:deletedMember"),
	isArchived: false,
	isCustomFront: false,
	dateCreated: new Date(0),
	tags: [],
	uuid: "00000000-0000-0000-0000-000000000000"
});