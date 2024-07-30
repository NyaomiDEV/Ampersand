
import { Ref, ref, watch } from "vue";
import { Member, getMembersFromFilterQuery, members } from "./entities/members";
import { Tag, getTable as getTagsTable, tags } from "./entities/tags";

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
		if(search.value.length == 0)
			_tags.value = await getTagsTable().filter(x => x.type === type.value).toArray();
		else
			_tags.value = await getTagsTable().where("name").startsWithIgnoreCase(search.value).filter(x => x.type === type.value).toArray();
	}, { immediate: true });

	return _tags;
}