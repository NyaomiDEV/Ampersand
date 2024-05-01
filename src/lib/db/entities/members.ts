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

	return getTable().toCollection().filter(x =>
		(typeof parsed.archived !== "undefined" && x.isArchived === parsed.archived) ||
		(typeof parsed.customFront !== "undefined" && x.isCustomFront === parsed.customFront) ||
		parsed.tags.reduce(
			(v, y) => 
				(v && x.tags)
					? x.tags.includes(y)
					: v,
					true
		) ||
		x.name.includes(parsed.query) ||
		false
	);
}
