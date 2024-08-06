
import { Ref, ref, shallowReactive, watch } from "vue";
import { Member, getMembersFromFilterQuery, members } from "./entities/members";
import { Tag, getTagsTable as getTagsTable, tags } from "./entities/tags";
import { frontingEntries, FrontingEntryComplete, getFrontingEntriesFromFilterQuery } from "./entities/frontingEntries";

export function getFilteredMembers(search: Ref<string>){
	const _members = ref<Member[]>([]);

	watch([
		search,
		members,
	], async () => {
		_members.value = await getMembersFromFilterQuery(search.value);
	}, { immediate: true });

	return _members;
}

export function getFilteredTags(search: Ref<string>, type: Ref<string>) {
	const _tags = shallowReactive<Tag[]>([]);

	watch([
		search,
		type,
		tags
	], async () => {
		_tags.length = 0;
		if(!search.value.length){
			_tags.push(...await getTagsTable().filter(x => x.type === type.value).toArray());
		} else {
			_tags.push(...await getTagsTable().where("name").startsWithIgnoreCase(search.value).filter(x => x.type === type.value).toArray());
		}
	}, { immediate: true });

	return _tags;
}

export function getFilteredFrontingEntries(search: Ref<string>){
	const _frontingEntries = ref<FrontingEntryComplete[]>([]);

	watch([
		search,
		frontingEntries
	], async () => {
		if(!search.value.length)
			_frontingEntries.value = [...frontingEntries.value];
		else {
			_frontingEntries.value = await getFrontingEntriesFromFilterQuery(search.value);
		}

	}, { immediate: true });

	return _frontingEntries;
}