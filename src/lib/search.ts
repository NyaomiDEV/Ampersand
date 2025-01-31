
import { Member, Tag, FrontingEntry, FrontingEntryComplete, BoardMessage, BoardMessageComplete, Asset } from "./db/entities";
import { parseAssetFilterQuery, parseBoardMessageFilterQuery, parseFrontingHistoryFilterQuery, parseMemberFilterQuery } from "./util/filterQuery";
import dayjs from "dayjs";
import { toBoardMessageComplete } from "./db/tables/boardMessages";
import { toFrontingEntryComplete } from "./db/tables/frontingEntries";
import { appConfig } from "./config";

const sortingFunctions = {
	alphabetic: (a: string, b: string) => a.localeCompare(b),
	numeric: (a: number, b: number) => a - b
}

export async function getFilteredMembers(search: string, members?: Member[]){
	if (!members) return;
	const filtered: Member[] = [];
	const parsed = await parseMemberFilterQuery(search.length ? search : appConfig.defaultFilterQueries.members || "");
	const sorted = members.sort((a, b) => sortingFunctions.alphabetic(a.name, b.name));
	if(parsed.all) return sorted;

	for(const x of sorted){

		if (!x.name.toLowerCase().startsWith(parsed.query.toLowerCase()))
			continue;

		if (parsed.pronouns) {
			if (!x.pronouns || x.pronouns.toLowerCase() !== parsed.pronouns.toLowerCase())
				continue;
		}

		if (parsed.role) {
			if (!x.role || x.role.toLowerCase() !== parsed.role.toLowerCase())
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
			for (const uuid of parsed.tags) {
				if (!x.tags.includes(uuid))
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
	const complete = await Promise.all(frontingEntries.map(x => toFrontingEntryComplete(x)));

	if(parsed.all) return complete;

	for (const x of complete) {
		if (!x.member.name.toLowerCase().startsWith(parsed.query.toLowerCase()))
			continue;

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

		if (
			![
				x.title.toLowerCase().split(" "),
				x.member.name.toLowerCase().split(" ")
			].flat().find(x => x.startsWith(parsed.query.toLowerCase()))
		)
			continue;

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
			if (!x.friendlyName.toLowerCase().startsWith(parsed.query.toLowerCase()))
				continue;

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
