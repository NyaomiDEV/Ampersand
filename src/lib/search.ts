
import { Member, Tag, Asset, CustomField, JournalPost, BoardMessage, FrontingEntry, System, Note } from "./db/entities";
import { parseAssetFilterQuery, parseBoardMessageFilterQuery, parseCustomFieldFilterQuery, parseFrontingHistoryFilterQuery, parseJournalPostFilterQuery, parseMemberFilterQuery, parseSystemFilterQuery, parseTagFilterQuery, parseNoteFilterQuery } from "./util/filterQuery";
import { appConfig } from "./config";
import { getMemberIndex } from "./db/tables/members";

export function filterSystem(search: string, system: System) {
	const parsed = parseSystemFilterQuery(search.length ? search : appConfig.defaultFilterQueries.systems || "");
	if (parsed.query.length){
		if (!system.name.toLowerCase().includes(parsed.query.toLowerCase()))
			return false;
	}

	if (parsed.isDefault) {
		if (appConfig.defaultSystem !== system.uuid)
			return false;
	}

	if (parsed.isPinned !== undefined) {
		if (system.isPinned !== parsed.isPinned)
			return false;
	}

	if (parsed.isArchived !== undefined) {
		if (system.isArchived !== parsed.isArchived)
			return false;
	}

	return true;
}

export async function filterMember(search: string, member: Member){
	const parsed = await parseMemberFilterQuery(search.length ? search : appConfig.defaultFilterQueries.members || "");

	if (parsed.query.length){
		if (!(
			member.name.toLowerCase().includes(parsed.query.toLowerCase()) ||
			member.description?.toLowerCase().includes(parsed.query.toLowerCase()) ||
			!!member.customFields?.values().find(x => x.toLowerCase().includes(parsed.query.toLowerCase()))
		))
			return false;
	}

	if (parsed.system) {
		if (member.system !== parsed.system)
			return false;
	}

	if (parsed.pronouns) {
		if (!member.pronouns || !member.pronouns.toLowerCase().includes(parsed.pronouns.toLowerCase()))
			return false;
	}

	if (parsed.role) {
		if (!member.role || !member.role.toLowerCase().includes(parsed.role.toLowerCase()))
			return false;
	}

	if (parsed.isPinned !== undefined) {
		if (member.isPinned !== parsed.isPinned)
			return false;
	}

	if (parsed.isArchived !== undefined) {
		if (member.isArchived !== parsed.isArchived)
			return false;
	}

	if (parsed.isCustomFront !== undefined) {
		if (member.isCustomFront !== parsed.isCustomFront)
			return false;
	}

	if (parsed.tags.size) {
		if (!parsed.tags.entries().every(([uuid, include]) => include === member.tags.includes(uuid)))
			return false;
	}

	return true;
}

export function filterTag(search: string, tag: Tag) {
	const parsed = parseTagFilterQuery(search.length ? search : appConfig.defaultFilterQueries.tags || "");

	if(parsed.query.length){
		if (!tag.name.toLowerCase().includes(parsed.query.toLowerCase()))
			return false;
	}

	if (parsed.isArchived !== undefined) {
		if (tag.isArchived !== parsed.isArchived)
			return false;
	}

	return true;
}

export function filterFrontingEntry(search: string, frontingEntry: FrontingEntry){
	const parsed = parseFrontingHistoryFilterQuery(search.length ? search : appConfig.defaultFilterQueries.frontingHistory || "");

	if(parsed.query.length){
		const memberIndex = getMemberIndex().find(x => x.uuid === frontingEntry.member);
		if (!memberIndex?.name?.toLowerCase().includes(parsed.query.toLowerCase()))
			return false;
	}

	if (parsed.member) {
		if (frontingEntry.member !== parsed.member)
			return false;
	}

	if (parsed.currentlyFronting) {
		if (frontingEntry.endTime)
			return false;
	}

	return true;
}

export function filterBoardMessage(search: string, boardMessage: BoardMessage) {
	const parsed = parseBoardMessageFilterQuery(search.length ? search : appConfig.defaultFilterQueries.messageBoard || "");

	if (parsed.isPinned !== undefined) {
		if(parsed.isPinned && !boardMessage.isPinned)
			return false;
		else if(!parsed.isPinned && boardMessage.isPinned)
			return false;
	}

	if (parsed.isArchived !== undefined) {
		if (parsed.isArchived && !boardMessage.isArchived)
			return false;
		else if (!parsed.isArchived && boardMessage.isArchived)
			return false;
	}

	if(parsed.query.length){
		const memberIndices = getMemberIndex().filter(x => boardMessage.members.includes(x.uuid));

		if (
			![
				boardMessage.title.toLowerCase().split(" "),
				memberIndices.map(x => x.name!.toLowerCase().split(" ")).flat()
			].filter(x => !!x).flat().find(x => x.includes(parsed.query.toLowerCase()))
		)
			return false;
	}

	if (typeof parsed.member !== "undefined") {
		if (parsed.member === false && boardMessage.members.length)
			return false;

		if (!boardMessage.members.find(x => x === parsed.member))
			return false;
	}

	return true;
}

export async function filterAsset(search: string, asset: Asset) {
	const parsed = await parseAssetFilterQuery(search.length ? search : appConfig.defaultFilterQueries.assetManager || "");

	if(parsed.query.length){
		if (!asset.friendlyName.toLowerCase().includes(parsed.query.toLowerCase()))
			return false;
	}

	if (parsed.type) {
		if (asset.file.type.split("/")[1].toLowerCase() !== parsed.type.toLowerCase())
			return false;
	}

	if (parsed.filename) {
		if (asset.file.name.toLowerCase() !== parsed.filename.toLowerCase())
			return false;
	}

	if (parsed.tags.size) {
		if (!parsed.tags.entries().every(([uuid, include]) => include === asset.tags.includes(uuid)))
			return false;
	}

	return true;
}

export function filterCustomField(search: string, customField: CustomField) {
	const parsed = parseCustomFieldFilterQuery(search.length ? search : appConfig.defaultFilterQueries.customFields || "");

	if(parsed.query.length) {
		if (!customField.name.toLowerCase().includes(parsed.query.toLowerCase()))
			return false;
	}

	if (parsed.default) {
		if (!customField.default)
			return false;
	}

	return true;
}

export function filterNote(search: string, note: Note) {
	const parsed = parseNoteFilterQuery(search.length ? search : appConfig.defaultFilterQueries.notes || "");

	if(parsed.query.length) {
		if (!(
			note.title.toLowerCase().includes(parsed.query.toLowerCase()) ||
			note.content.toLowerCase().includes(parsed.query.toLowerCase())
		))
			return false;
	}

	if (parsed.isArchived !== undefined) {
		if (parsed.isArchived && !note.isArchived)
			return false;
		else if (!parsed.isArchived && note.isArchived)
			return false;
	}

	return true;
}

export async function filterJournalPost(search: string, post: JournalPost) {
	const parsed = await parseJournalPostFilterQuery(search.length ? search : appConfig.defaultFilterQueries.journal || "");
	if (parsed.query.length) {
		const memberIndices = getMemberIndex().filter(x => post.members.includes(x.uuid));
		if (
			![
				post.title.toLowerCase().split(" "),
				memberIndices.map(x => x.name!.toLowerCase().split(" ")).flat()
			].filter(x => !!x).flat().find(x => x.includes(parsed.query.toLowerCase()))
		)
			return false;
	}

	if (typeof parsed.member !== "undefined") {
		if(parsed.member === false && post.members.length)
			return false;

		if (!post.members.find(x => x === parsed.member))
			return false;
	}

	if (parsed.tags.size) {
		if (!parsed.tags.entries().every(([uuid, include]) => include === post.tags.includes(uuid)))
			return false;
	}

	return true;
}
