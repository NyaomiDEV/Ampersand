import { db } from "..";
import { parseTagFilterQuery } from "../../filterQuery";
import { makeUUIDv5 } from "../../util/uuid";
import { UUIDable } from "../types";
import { getSystemUUID } from "./system";

export type Tag = UUIDable & {
	name: string,
	type: "member" | "journal",
	color: string
}

export function getTable() {
	return db.tags;
}

function genid(name: string) {
	return makeUUIDv5(getSystemUUID(), `tags\0${name}`);
}

export async function newTag(tag: Omit<Tag, keyof UUIDable>) {
	const uuid = genid(tag.name);
	return await getTable().add({
		...tag,
		uuid
	});
}

export async function getTagFromName(name: string){
	return await getTable().get({ name });
}

export async function getTagsFromFilterQuery(filterQuery: string){
	const parsed = await parseTagFilterQuery(filterQuery);

	return getTable().where("name").startsWithIgnoreCase(parsed.query).filter(x => {

		if (parsed.type) {
			if (x.type !== parsed.type.toLowerCase())
				return false;
		}

		return true;
	}).toArray();
}
