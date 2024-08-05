
import { Ref, ref, watch } from "vue";
import { Member, getMembersFromFilterQuery, members } from "./entities/members";
import { Tag, getTable as getTagsTable, tags } from "./entities/tags";
import { frontingEntries, FrontingEntryComplete, getFrontingEntriesFromFilterQuery } from "./entities/frontingEntries";
import dayjs from "dayjs";

export function getFilteredMembers(search: Ref<string>){
	const _members = ref<Member[]>();

	watch([
		search,
		members,
	], async () => {
		_members.value = await getMembersFromFilterQuery(search.value);
	}, { immediate: true });

	return _members;
}

export function getFilteredTags(search: Ref<string>, type: Ref<string>) {
	const _tags = ref<Tag[]>();

	watch([
		search,
		type,
		tags
	], async () => {
		if(!search.value.length)
			_tags.value = await getTagsTable().filter(x => x.type === type.value).toArray();
		else
			_tags.value = await getTagsTable().where("name").startsWithIgnoreCase(search.value).filter(x => x.type === type.value).toArray();
	}, { immediate: true });

	return _tags;
}

export function getFilteredFrontingEntries(search: Ref<string>){
	const _frontingEntries = ref<FrontingEntryComplete[]>();

	watch([
		search,
		frontingEntries
	], () => {
		if(!search.value.length)
			_frontingEntries.value = [...frontingEntries.value];
		else {
			_frontingEntries.value = getFrontingEntriesFromFilterQuery(search.value);
		}

	}, { immediate: true });

	return _frontingEntries;
}