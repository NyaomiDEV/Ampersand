import { from, useObservable } from "@vueuse/rxjs";
import { liveQuery } from "dexie";
import { Ref, ref, watch } from "vue";
import { Member, getMembersFromFilterQuery, getTable as getMembersTable } from "./entities/members";
import { Tag, getTable as getTagsTable } from "./entities/tags";

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

export function getFilteredTags(search: Ref<string>, type: Ref<string>) {
	const tags = ref<Tag[]>();

	watch([
		search,
		type,
		useObservable(from(liveQuery(() => getTagsTable().toArray())))
	], async () => {
		if(search.value.length == 0)
			tags.value = await getTagsTable().filter(x => x.type === type.value).toArray();
		else
			tags.value = await getTagsTable().where("name").startsWithIgnoreCase(search.value).filter(x => x.type === type.value).toArray();
	}, { immediate: true });

	return tags;
}