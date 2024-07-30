import { Ref, ref, watch } from "vue";
import { db } from "..";
import { parseMemberFilterQuery } from "../../util/filterQuery";
import { makeUUIDv5 } from "../../util/uuid";
import { UUID, UUIDable } from "../types";
import { getSystemUUID } from "./system";
import { from, useObservable } from "@vueuse/rxjs";
import { liveQuery } from "dexie";

export type Member = UUIDable & {
	name: string,
	pronouns?: string,
	description?: string,
	role?: string,
	image?: File,
	color?: string, // todo
	isArchived: boolean,
	isCustomFront: boolean, // todo
	tags: UUID[] // array of UUIDs
}

export function getTable() {
	return db.members;
}

export const members: Ref<Member[]> = ref([]);

export async function updateMembersRef(){
	members.value = await getTable().toArray();
}

watch([useObservable(from(liveQuery(() => getTable().toArray())))], updateMembersRef, { immediate: true });

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

export function getMembersFromFilterQuery(filterQuery: string) {
	const parsed = parseMemberFilterQuery(filterQuery);

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

		if (parsed.tags.length) {
			for(const uuid of parsed.tags){
				if (!x.tags.includes(uuid))
					return false;
			}
		}

		return true;
	}).toArray();
}
