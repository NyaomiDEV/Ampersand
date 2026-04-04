
import { Member, Tag, Asset, CustomField, JournalPost, BoardMessage, FrontingEntry, System } from "./db/entities";
import { parseAssetFilterQuery, parseBoardMessageFilterQuery, parseCustomFieldFilterQuery, parseFrontingHistoryFilterQuery, parseJournalPostFilterQuery, parseMemberFilterQuery, parseSystemFilterQuery } from "./util/filterQuery";
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
		if (!member.name.toLowerCase().includes(parsed.query.toLowerCase()))
			return false;
	}

	if (parsed.system) {
		if (member.system !== parsed.system)
			return false;
	}

	if (parsed.pronouns) {
		if (!member.pronouns || member.pronouns.toLowerCase() !== parsed.pronouns.toLowerCase())
			return false;
	}

	if (parsed.role) {
		if (!member.role || member.role.toLowerCase() !== parsed.role.toLowerCase())
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
	const query = search.length ? search : appConfig.defaultFilterQueries.tags || "";

	if(!query.length)
		return true;
	else
		return tag.name.toLowerCase().includes(query.toLowerCase());
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
		const memberIndex = getMemberIndex().find(x => x.uuid === boardMessage.member);
		if (
			![
				boardMessage.title.toLowerCase().split(" "),
				memberIndex?.name?.toLowerCase().split(" ")
			].filter(x => !!x).flat().find(x => x.includes(parsed.query.toLowerCase()))
		)
			return false;
	}

	if (typeof parsed.member !== "undefined") {
		if(boardMessage.member){
			if(parsed.member === false)
				return false;

			if (boardMessage.member !== parsed.member)
				return false;
		}
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

export async function filterJournalPost(search: string, post: JournalPost) {
	const parsed = await parseJournalPostFilterQuery(search.length ? search : appConfig.defaultFilterQueries.journal || "");
	if (parsed.query.length) {
		const memberIndex = getMemberIndex().find(x => x.uuid === post.member);
		if (
			![
				post.title.toLowerCase().split(" "),
				memberIndex?.name?.toLowerCase().split(" ")
			].filter(x => !!x).flat().find(x => x.includes(parsed.query.toLowerCase()))
		)
			return false;
	}

	if (typeof parsed.member !== "undefined") {
		if(parsed.member === false && post.member)
			return false;

		if (post.member !== parsed.member)
			return false;
	}

	if (parsed.tags.size) {
		if (!parsed.tags.entries().every(([uuid, include]) => include === post.tags.includes(uuid)))
			return false;
	}

	return true;
}
