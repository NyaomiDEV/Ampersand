import { db } from "..";
import { parseTagFilterQuery } from "../../filterquery";
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

	return getTable().toCollection().filter(x => 
		(typeof parsed.type === "undefined" && x.type === parsed.type) ||
		x.name.includes(parsed.query) ||
		false
	);
}
