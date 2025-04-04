
import { Member, Tag, FrontingEntry, FrontingEntryComplete, BoardMessage, BoardMessageComplete, Asset, CustomField, JournalPost, JournalPostComplete } from "./db/entities";
import { parseAssetFilterQuery, parseBoardMessageFilterQuery, parseCustomFieldFilterQuery, parseFrontingHistoryFilterQuery, parseJournalPostFilterQuery, parseMemberFilterQuery } from "./util/filterQuery";
import dayjs from "dayjs";
import { toBoardMessageComplete } from "./db/tables/boardMessages";
import { toFrontingEntryComplete } from "./db/tables/frontingEntries";
import { appConfig } from "./config";
import { toJournalPostComplete } from "./db/tables/journalPosts";

const sortingFunctions = {
	alphabetic: (a: string, b: string) => a.localeCompare(b),
	numeric: (a: number, b: number) => a - b
}

export async function getFilteredMembers(search: string, members?: Member[]){
	if (!members) return;
	const filtered: Member[] = [];
	const parsed = await parseMemberFilterQuery(search.length ? search : appConfig.defaultFilterQueries.members || "");
	const sorted = members.sort((a, b) => {
		if(appConfig.showMembersBeforeCustomFronts){
			if (!a.isCustomFront && b.isCustomFront) return -1;
			if (a.isCustomFront && !b.isCustomFront) return 1;
		}

		if(a.isPinned && !b.isPinned) return -1;
		if(!a.isPinned && b.isPinned) return 1;

		switch(parsed.sort){
			case "name-asc":
			default:
				return sortingFunctions.alphabetic(a.name, b.name);
			case "name-desc":
				return sortingFunctions.alphabetic(b.name, a.name);
			case "created-asc":
				return sortingFunctions.numeric(a.dateCreated.getTime(), b.dateCreated.getTime());
			case "created-desc":
				return sortingFunctions.numeric(b.dateCreated.getTime(), a.dateCreated.getTime());
		}
	});

	if(parsed.all) return sorted;

	for(const x of sorted){

		if (parsed.query.length){
			if (!x.name.toLowerCase().startsWith(parsed.query.toLowerCase()))
				continue;
		}

		if (parsed.pronouns) {
			if (!x.pronouns || x.pronouns.toLowerCase() !== parsed.pronouns.toLowerCase())
				continue;
		}

		if (parsed.role) {
			if (!x.role || x.role.toLowerCase() !== parsed.role.toLowerCase())
				continue;
		}

		if (parsed.isPinned !== undefined) {
			if (x.isPinned !== parsed.isPinned)
				continue;
		}

		if (parsed.isArchived !== undefined) {
			if (x.isArchived !== parsed.isArchived)
				continue;
		}

		if (parsed.isCustomFront !== undefined) {
			if (x.isCustomFront !== parsed.isCustomFront)
				continue;
		}

		if (parsed.tags.length) {
			if (!parsed.tags.every(uuid => x.tags.includes(uuid))){
				continue;
			}
		}

		filtered.push(x);
	}

	return filtered;
}

export function getFilteredTags(search: string, tags?: Tag[]) {
	if(!tags) return;
	const query = search.length ? search : appConfig.defaultFilterQueries.tags || "";
	const sorted = tags.sort((a, b) => sortingFunctions.alphabetic(a.name, b.name));

	if(!query.length)
		return sorted;
	else
		return sorted.filter(x => x.name.toLowerCase().startsWith(query.toLowerCase()));
}

export async function getFilteredFrontingEntries(search: string, frontingEntries?: FrontingEntry[]){
	if(!frontingEntries) return;
	const filtered: FrontingEntryComplete[] = [];
	const parsed = parseFrontingHistoryFilterQuery(search.length ? search : appConfig.defaultFilterQueries.frontingHistory || "");
	const complete = await Promise.all(frontingEntries.sort((a, b) => sortingFunctions.numeric(b.startTime.getTime(), a.startTime.getTime())).map(x => toFrontingEntryComplete(x)));

	if(parsed.all) return complete;

	for (const x of complete) {
		if(parsed.query.length){
			if (!x.member.name.toLowerCase().startsWith(parsed.query.toLowerCase()))
				continue;
		}

		if (parsed.member) {
			if (x.member.uuid !== parsed.member)
				continue;
		}

		if (parsed.currentlyFronting) {
			if (x.endTime)
				continue;
		}

		if (parsed.startDateString) {
			const date = dayjs(parsed.startDateString).startOf("day");
			if (date.valueOf() !== dayjs(x.startTime).startOf("day").valueOf())
				continue;
		}

		if (parsed.endDateString) {
			const date = dayjs(parsed.endDateString).startOf("day");
			if (date.valueOf() !== dayjs(x.endTime).startOf("day").valueOf())
				continue;
		}

		if (parsed.startDay) {
			if (parsed.startDay !== dayjs(x.startTime).get("date"))
				continue;
		}

		if (parsed.endDay) {
			if (parsed.endDay !== dayjs(x.endTime).get("date"))
				continue;
		}

		if (parsed.startMonth) {
			if (parsed.startMonth !== dayjs(x.startTime).get("month") + 1)
				continue;
		}

		if (parsed.endMonth) {
			if (parsed.endMonth !== dayjs(x.endTime).get("month") + 1)
				continue;
		}

		if (parsed.startYear) {
			if (parsed.startYear !== dayjs(x.startTime).get("year"))
				continue;
		}

		if (parsed.endYear) {
			if (parsed.endYear !== dayjs(x.endTime).get("year"))
				continue;
		}

		filtered.push(x)
	}

	return filtered;
}

export async function getFilteredBoardMessages(search: string, boardMessages?: BoardMessage[]) {
	if(!boardMessages) return;
	const filtered: BoardMessageComplete[] = [];
	const parsed = parseBoardMessageFilterQuery(search.length ? search : appConfig.defaultFilterQueries.messageBoard || "");
	const complete = await Promise.all(boardMessages.map(async x => await toBoardMessageComplete(x)));

	if (parsed.all) return complete;

	for (const x of complete) {

		if (parsed.pinned !== undefined) {
			if(parsed.pinned && !x.isPinned)
				continue;
			else if(!parsed.pinned && x.isPinned)
				continue;
		}

		if(parsed.query.length){
			if (
				![
					x.title.toLowerCase().split(" "),
					x.member.name.toLowerCase().split(" ")
				].flat().find(x => x.startsWith(parsed.query.toLowerCase()))
			)
				continue;
		}

		if (parsed.member) {
			if (x.member.uuid !== parsed.member)
				continue;
		}

		if (parsed.dateString) {
			const date = dayjs(parsed.dateString).startOf("day");
			if (date.valueOf() !== dayjs(x.date).startOf("day").valueOf())
				continue;
		}

		if (parsed.day) {
			if (parsed.day !== dayjs(x.date).get("date"))
				continue;
		}

		if (parsed.month) {
			if (parsed.month !== dayjs(x.date).get("month") + 1)
				continue;
		}

		if (parsed.year) {
			if (parsed.year !== dayjs(x.date).get("year"))
				continue;
		}

		filtered.push(x)
	}

	return filtered;
}

export function getFilteredAssets(search: string, assets?: Asset[]) {
	if (!assets) return;
	const filtered: Asset[] = [];
	const parsed = parseAssetFilterQuery(search.length ? search : appConfig.defaultFilterQueries.assetManager || "");
	const sorted = assets.sort((a, b) => sortingFunctions.alphabetic(a.friendlyName, b.friendlyName));

	if(parsed.all) return sorted;

	for (const x of sorted) {
			if(parsed.query.length){
				if (!x.friendlyName.toLowerCase().startsWith(parsed.query.toLowerCase()))
					continue;
			}

			if (parsed.type) {
				if (x.file.type.split("/")[1].toLowerCase() !== parsed.type.toLowerCase())
					continue;
			}

			if (parsed.filename) {
				if (x.file.name.toLowerCase() !== parsed.filename.toLowerCase())
					continue;
			}

			filtered.push(x)
		}

	return filtered;
}

export function getFilteredCustomFields(search: string, customFields?: CustomField[]) {
	if (!customFields) return;
	const filtered: CustomField[] = [];
	const parsed = parseCustomFieldFilterQuery(search.length ? search : appConfig.defaultFilterQueries.customFields || "");
	const sorted = customFields.sort((a, b) => sortingFunctions.alphabetic(a.name, b.name));

	for (const x of sorted) {
		if(parsed.query.length) {
			if (!x.name.toLowerCase().startsWith(parsed.query.toLowerCase()))
				continue;
		}

		if (parsed.default) {
			if (!x.default)
				continue;
		}

		filtered.push(x);
	}

	return filtered;
}

export async function getFilteredJournalPosts(search: string, posts?: JournalPost[]) {
	if (!posts) return;
	const filtered: JournalPostComplete[] = [];
	const parsed = await parseJournalPostFilterQuery(search.length ? search : appConfig.defaultFilterQueries.messageBoard || "");
	const complete = await Promise.all(posts.map(async x => await toJournalPostComplete(x)));

	if (parsed.all) return complete;

	for (const x of complete) {
		if(parsed.query.length){
			if (
				![
					x.title.toLowerCase().split(" "),
					x.member.name.toLowerCase().split(" ")
				].flat().find(x => x.startsWith(parsed.query.toLowerCase()))
			)
				continue;
		}

		if (parsed.member) {
			if (x.member.uuid !== parsed.member)
				continue;
		}

		if (parsed.dateString) {
			const date = dayjs(parsed.dateString).startOf("day");
			if (date.valueOf() !== dayjs(x.date).startOf("day").valueOf())
				continue;
		}

		if (parsed.day) {
			if (parsed.day !== dayjs(x.date).get("date"))
				continue;
		}

		if (parsed.month) {
			if (parsed.month !== dayjs(x.date).get("month") + 1)
				continue;
		}

		if (parsed.year) {
			if (parsed.year !== dayjs(x.date).get("year"))
				continue;
		}

		if (parsed.tags.length) {
			if (!parsed.tags.every(uuid => x.tags.includes(uuid))) {
				continue;
			}
		}

		filtered.push(x);
	}

	return filtered;
}