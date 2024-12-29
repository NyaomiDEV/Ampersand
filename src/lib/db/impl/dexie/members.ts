import { db } from ".";
import { makeUUIDv5 } from "../../../util/uuid";
import { UUIDable, Member } from "../../entities";
import { getSystemUUID } from "./system";

export function getMembersTable() {
	return db.members;
}

async function genid(name: string) {
	return makeUUIDv5((await getSystemUUID())!, `members\0${name}`);
}

export async function newMember(member: Omit<Member, keyof UUIDable>) {
	const uuid = await genid(member.name);
	return await getMembersTable().add({
		...member,
		uuid
	});
}
