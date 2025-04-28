import { t } from "i18next";
import { UUIDable, Member, UUID } from "../entities";
import { maxUid, nilUid } from "../../util/misc";

const impl = await ("isTauri" in window ? import('../impl/tauri/members') : import('../impl/dexie/members'));

export function getMembers() {
	return impl.getMembers();
}

export function newMember(member: Omit<Member, keyof UUIDable>) {
	return impl.newMember(member);
}

export function getMember(uuid: UUID){
	return impl.getMember(uuid);
}

export async function deleteMember(uuid: UUID){
	return await impl.deleteMember(uuid);
}

export async function updateMember(uuid: UUID, newContent: Partial<Member>){
	return impl.updateMember(uuid, newContent);
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