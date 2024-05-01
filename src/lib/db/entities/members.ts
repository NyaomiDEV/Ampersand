import { db } from "..";
import { parseMemberFilterQuery } from "../../filterquery";
import { makeUUIDv5 } from "../../util/uuid";
import { UUID, UUIDable } from "../types";
import { getSystemUUID } from "./system";

export type Member = UUIDable & {
	name: string,
	pronouns?: string,
	description?: string,
	role?: string,
	image?: Blob,
	color?: string, // todo
	isArchived: boolean,
	isCustomFront: boolean, // todo
	tags?: UUID[] // array of UUIDs
}

export function getTable() {
	return db.members;
}

function genid(name: string) {
	return makeUUIDv5(getSystemUUID(), `members\0${name}`);
}

export async function newMember(member: Omit<Member, keyof UUIDable>) {
	const uuid = genid(member.name);
	return await getTable().add({
		...member,
		uuid
	});
}

export async function getMembersFromFilterQuery(filterQuery: string) {
	const parsed = await parseMemberFilterQuery(filterQuery);

	return getTable().where("name").startsWithIgnoreCase(parsed.query).filter(x => {

		if(parsed.pronouns){
			if (!x.pronouns || x.pronouns.toLowerCase() !== parsed.pronouns.toLowerCase())
				return false;
		}

		if (parsed.role) {
			if (!x.role || x.role.toLowerCase() !== parsed.role.toLowerCase())
				return false;
		}

		if(parsed.isArchived !== undefined){
			if(x.isArchived !== parsed.isArchived)
				return false;
		}

		if (parsed.isCustomFront !== undefined) {
			if (x.isCustomFront !== parsed.isCustomFront)
				return false;
		}

		return true;
	});
}
