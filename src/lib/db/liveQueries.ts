import { from, useObservable } from "@vueuse/rxjs";
import { liveQuery } from "dexie";
import { Ref, ref, watch } from "vue";
import { Member, getMembersFromFilterQuery, getTable as getMembersTable } from "./entities/members";
import { Tag, getTagsFromFilterQuery, getTable as getTagsTable } from "./entities/tags";

export function getFilteredMembers(search: Ref<string>){
	const members = ref<Member[]>();

	watch([
		search,
		useObservable(from(liveQuery(() => getMembersTable().toArray())))
	], async () => {
		members.value = await getMembersFromFilterQuery(search.value);
	}, { immediate: true });

	return members;
}

export function getFilteredTags(search: Ref<string>) {
	const tags = ref<Tag[]>();

	watch([
		search,
		useObservable(from(liveQuery(() => getTagsTable().toArray())))
	], async () => {
		tags.value = await getTagsFromFilterQuery(search.value);
	}, { immediate: true });

	return tags;
}