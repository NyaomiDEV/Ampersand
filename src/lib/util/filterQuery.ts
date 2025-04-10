import { getTagFromNameHashtag } from "../db/tables/tags";
import { UUID } from "../db/entities";

export type MemberFilterQuery = {
	query: string,
	tags: string[],
	all?: boolean,
	isPinned?: boolean,
	isArchived?: boolean,
	isCustomFront?: boolean,
	pronouns?: string,
	role?: string,
	sort?: "name-asc" | "name-desc" | "created-asc" | "created-desc"
};

export type FrontingHistoryFilterQuery = {
	query: string,
	all?: boolean,
	startDateString?: string,
	endDateString?: string,
	startDay?: number,
	endDay?: number,
	startMonth?: number,
	endMonth?: number,
	startYear?: number,
	endYear?: number,
	currentlyFronting?: boolean,
	member?: UUID
};

export type BoardMessageFilterQuery = {
	query: string,
	all?: boolean,
	pinned?: boolean,
	dateString?: string,
	day?: number,
	month?: number,
	year?: number,
	member?: UUID
};

export type AssetFilterQuery = {
	query: string,
	all?: boolean,
	type?: string,
	filename?: string
};

export type CustomFieldFilterQuery = {
	query: string,
	default?: boolean
}

export type JournalPostFilterQuery = {
	query: string,
	tags: string[],
	all?: boolean,
	dateString?: string,
	day?: number,
	month?: number,
	year?: number,
	member?: UUID;
};

export async function parseMemberFilterQuery(search: string): Promise<MemberFilterQuery> {
	const tokens = search.split(" ");

	const queryTokens: string[] = [];

	const result: MemberFilterQuery = {
		query: "",
		tags: []
	};

	for(const token of tokens){
		switch(token.charAt(0)){
			case "@":
				const tokenParts = token.slice(1).split(":");
				switch(tokenParts[0].toLowerCase()){
					case "all":
						if (tokenParts[1]) {
							switch (tokenParts[1].toLowerCase()) {
								case "yes":
								case "true":
									result.all = true;
									break;
								case "no":
								case "false":
									result.all = false;
									break;
								default:
									queryTokens.push(token);
									break;
							}
						} else
							result.all = true;

						break;
					case "archived":
						if(tokenParts[1]){
							switch (tokenParts[1].toLowerCase()) {
								case "yes":
								case "true":
									result.isArchived = true;
									break;
								case "no":
								case "false":
									result.isArchived = false;
									break;
								default:
									queryTokens.push(token);
									break;
							}
						} else
							result.isArchived = true;
						
						break;
					case "customfront":
						if(tokenParts[1]){
							switch (tokenParts[1]?.toLowerCase()) {
								case "yes":
								case "true":
									result.isCustomFront = true;
									break;
								case "no":
								case "false":
									result.isCustomFront = false;
									break;
								default:
									queryTokens.push(token);
									break;
							}
						} else
							result.isCustomFront = true;
						
						break;
					case "pinned":
						if (tokenParts[1]) {
							switch (tokenParts[1]?.toLowerCase()) {
								case "yes":
								case "true":
									result.isPinned = true;
									break;
								case "no":
								case "false":
									result.isPinned = false;
									break;
								default:
									queryTokens.push(token);
									break;
							}
						} else
							result.isPinned = true;

						break;
					case "pronouns":
						result.pronouns = tokenParts[1];
						break;
					case "role":
						result.role = tokenParts[1];
						break;
					case "sort":
						if(tokenParts[1]){
							switch(tokenParts[1]){
								case "name":
								case "name-asc":
									result.sort = "name-asc";
									break;
								case "name-desc":
									result.sort = "name-desc";
									break;
								case "created":
								case "created-asc":
									result.sort = "created-asc";
									break;
								case "created-desc":
									result.sort = "created-desc";
									break;
								default:
									queryTokens.push(token);
									break;
							}
						} else
							queryTokens.push(token);
						break;
					default:
						queryTokens.push(token);
						break;
				}
				break;
			case "#":
				const probableTag = token.slice(1);
				const tag = await getTagFromNameHashtag(probableTag);
				if(tag)
					result.tags.push(tag.uuid)
				else
					queryTokens.push(token);
				
				break;
			default:
				queryTokens.push(token);
				break;
		}
	}

	result.query = queryTokens.filter(Boolean).join(" ");
	return result;
}

export function parseFrontingHistoryFilterQuery(search: string) {
	const tokens = search.split(" ");

	const queryTokens: string[] = [];

	const result: FrontingHistoryFilterQuery = {
		query: "",
	};

	for (const token of tokens) {
		switch (token.charAt(0)) {
			case "@":
				const tokenParts = token.slice(1).split(":");
				switch (tokenParts[0].toLowerCase()) {
					case "all":
						if (tokenParts[1]) {
							switch (tokenParts[1].toLowerCase()) {
								case "yes":
								case "true":
									result.all = true;
									break;
								case "no":
								case "false":
									result.all = false;
									break;
								default:
									queryTokens.push(token);
									break;
							}
						} else
							result.all = true;

						break;
					case "current":
						result.currentlyFronting = true;
						break;
					case "date":
						result.startDateString = tokenParts[1];
						break;
					case "day":
						result.startDay = Number(tokenParts[1]);
						break;
					case "month":
						result.startMonth = Number(tokenParts[1]);
						break;
					case "year":
						result.startYear = Number(tokenParts[1]);
						break;
					case "enddate":
						result.endDateString = tokenParts[1];
						break;
					case "endday":
						result.endDay = Number(tokenParts[1]);
						break;
					case "endmonth":
						result.endMonth = Number(tokenParts[1]);
						break;
					case "endyear":
						result.endYear = Number(tokenParts[1]);
						break;
					case "member":
						result.member = tokenParts[1];
						break;
					default:
						queryTokens.push(token);
						break;
				}
				break;
			default:
				queryTokens.push(token);
				break;
		}
	}

	result.query = queryTokens.filter(Boolean).join(" ");
	return result;
}

export function parseBoardMessageFilterQuery(search: string) {
	const tokens = search.split(" ");

	const queryTokens: string[] = [];

	const result: BoardMessageFilterQuery = {
		query: "",
	};

	for (const token of tokens) {
		switch (token.charAt(0)) {
			case "@":
				const tokenParts = token.slice(1).split(":");
				switch (tokenParts[0].toLowerCase()) {
					case "all":
						if (tokenParts[1]) {
							switch (tokenParts[1].toLowerCase()) {
								case "yes":
								case "true":
									result.all = true;
									break;
								case "no":
								case "false":
									result.all = false;
									break;
								default:
									queryTokens.push(token);
									break;
							}
						} else
							result.all = true;

						break;
					case "pinned":
						if (tokenParts[1]) {
							switch (tokenParts[1].toLowerCase()) {
								case "yes":
								case "true":
									result.pinned = true;
									break;
								case "no":
								case "false":
									result.pinned = false;
									break;
								default:
									queryTokens.push(token);
									break;
							}
						} else
							result.pinned = true;

						break;
					case "date":
						result.dateString = tokenParts[1];
						break;
					case "day":
						result.day = Number(tokenParts[1]);
						break;
					case "month":
						result.month = Number(tokenParts[1]);
						break;
					case "year":
						result.year = Number(tokenParts[1]);
						break;
					case "member":
						result.member = tokenParts[1];
						break;
					default:
						queryTokens.push(token);
						break;
				}
				break;
			default:
				queryTokens.push(token);
				break;
		}
	}

	result.query = queryTokens.filter(Boolean).join(" ");
	return result;
}

export function parseAssetFilterQuery(search: string) {
	const tokens = search.split(" ");

	const queryTokens: string[] = [];

	const result: AssetFilterQuery = {
		query: "",
	};

	for (const token of tokens) {
		switch (token.charAt(0)) {
			case "@":
				const tokenParts = token.slice(1).split(":");
				switch (tokenParts[0].toLowerCase()) {
					case "all":
						if (tokenParts[1]) {
							switch (tokenParts[1].toLowerCase()) {
								case "yes":
								case "true":
									result.all = true;
									break;
								case "no":
								case "false":
									result.all = false;
									break;
								default:
									queryTokens.push(token);
									break;
							}
						} else
							result.all = true;

						break;
					case "type":
						result.type = tokenParts[1];
						break;
					case "filename":
						result.filename = tokenParts[1];
						break;
					default:
						queryTokens.push(token);
						break;
				}
				break;
			default:
				queryTokens.push(token);
				break;
		}
	}

	result.query = queryTokens.filter(Boolean).join(" ");
	return result;
}

export function parseCustomFieldFilterQuery(search: string) {
	const tokens = search.split(" ");

	const queryTokens: string[] = [];

	const result: CustomFieldFilterQuery = {
		query: "",
	};

	for (const token of tokens) {
		switch (token.charAt(0)) {
			case "@":
				const tokenParts = token.slice(1).split(":");
				switch (tokenParts[0].toLowerCase()) {
					case "default":
						if (tokenParts[1]) {
							switch (tokenParts[1].toLowerCase()) {
								case "yes":
								case "true":
									result.default = true;
									break;
								case "no":
								case "false":
									result.default = false;
									break;
								default:
									queryTokens.push(token);
									break;
							}
						} else
							result.default = true;

						break;
					default:
						queryTokens.push(token);
						break;
				}
				break;
			default:
				queryTokens.push(token);
				break;
		}
	}

	result.query = queryTokens.filter(Boolean).join(" ");
	return result;
}

export async function parseJournalPostFilterQuery(search: string) {
	const tokens = search.split(" ");

	const queryTokens: string[] = [];

	const result: JournalPostFilterQuery = {
		query: "",
		tags: []
	};

	for (const token of tokens) {
		switch (token.charAt(0)) {
			case "@":
				const tokenParts = token.slice(1).split(":");
				switch (tokenParts[0].toLowerCase()) {
					case "all":
						if (tokenParts[1]) {
							switch (tokenParts[1].toLowerCase()) {
								case "yes":
								case "true":
									result.all = true;
									break;
								case "no":
								case "false":
									result.all = false;
									break;
								default:
									queryTokens.push(token);
									break;
							}
						} else
							result.all = true;

						break;
					case "date":
						result.dateString = tokenParts[1];
						break;
					case "day":
						result.day = Number(tokenParts[1]);
						break;
					case "month":
						result.month = Number(tokenParts[1]);
						break;
					case "year":
						result.year = Number(tokenParts[1]);
						break;
					case "member":
						result.member = tokenParts[1];
						break;
					default:
						queryTokens.push(token);
						break;
				}
				break;
			case "#":
				const probableTag = token.slice(1);
				const tag = await getTagFromNameHashtag(probableTag);
				if (tag)
					result.tags.push(tag.uuid);
				else
					queryTokens.push(token);

				break;
			default:
				queryTokens.push(token);
				break;
		}
	}

	result.query = queryTokens.filter(Boolean).join(" ");
	return result;
}