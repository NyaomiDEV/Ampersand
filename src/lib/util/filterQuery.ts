import { getTagUUIDByName } from "../db/tables/tags";
import { getMemberUUIDByName } from "../db/tables/members";
import { getSystemUUIDByName } from "../db/tables/system";

type QueryItem = {
	value: string,
	shouldInclude: boolean,
};

export type SystemFilterQuery = {
	query: string,
	isDefault?: boolean,
	isPinned?: boolean,
	isArchived?: boolean,
};

export type MemberFilterQuery = {
	query: string,
	tags: Map<string, boolean>,
	system?: QueryItem,
	isPinned?: boolean,
	isArchived?: boolean,
	isCustomFront?: boolean,
	pronouns?: QueryItem,
	role?: QueryItem,
	age?: number,
};

export type FrontingHistoryFilterQuery = {
	query: string,
	currentlyFronting?: boolean,
	member?: QueryItem
};

export type BoardMessageFilterQuery = {
	query: string,
	isPinned?: boolean,
	isArchived?: boolean,
	member?: QueryItem
};

export type AssetFilterQuery = {
	query: string,
	tags: Map<string, boolean>,
	type?: QueryItem,
	filename?: string
};

export type CustomFieldFilterQuery = {
	query: string,
	default?: boolean
};

export type NoteFilterQuery = {
	query: string,
	isArchived?: boolean
};

export type JournalPostFilterQuery = {
	query: string,
	tags: Map<string, boolean>,
	member?: QueryItem;
};

export type TagFilterQuery = {
	query: string,
	isArchived?: boolean;
};

function reduceToValue(value: string, emptyMeansTrue?: boolean, trueMeansValueItself?: false): boolean;
function reduceToValue(value: string, emptyMeansTrue?: boolean, trueMeansValueItself?: true): boolean | string;
function reduceToValue(value: string, emptyMeansTrue = true, trueMeansValueItself = false) {
	switch(value.toLowerCase()) {
		case "yes":
		case "true":
			return trueMeansValueItself ? value : true;
		case "no":
		case "false":
			return false;
		default:
			return emptyMeansTrue ? (trueMeansValueItself ? value : true) : false;
	}
}


function splitTokens(search: string){
	const rawTokens = Array.from(search.matchAll(/(?=\S)[^"\s]*(?:["][^\\"]*(?:\\[\s\S][^\\"]*)*["][^"\s]*)*/g)).map(x => x[0]);

	const tags = new Map<string, { 
		shouldInclude: boolean,
		allAttached: boolean,
	}>();
	const queryParts: string[] = [];
	const variables = new Map<string, {
		value: string,
		shouldInclude: string,
	}>();

	for(const token of rawTokens){
		const tokenParts = token.slice(1).split(":");

		let value = tokenParts[1]?.replace(/['"]/g, "") ?? "";
		let shouldInclude = tokenParts[2]?.replace(/['"]/g, "") ?? "";
		
		switch(token.charAt(0)){
			case "@":
				if (tokenParts[0] === "tag" && tokenParts[1]) {
					tags.set(tokenParts[1].replace(/['"]/g, ""), {
						shouldInclude: tokenParts[2] ? reduceToValue(tokenParts[2]?.replace(/['"]/g, "")) : true,
						allAttached: false
					});
					break;
				}

				if (typeof reduceToValue(value, true, true) === "boolean") {
					shouldInclude = value;
					value = "";
				}

				variables.set(tokenParts[0], {
					value,
					shouldInclude,
				});
				break;
			case "#":
				tags.set(tokenParts[0], {
					shouldInclude: tokenParts[1] ? reduceToValue(tokenParts[1]?.replace(/['"]/g, "")) : true,
					allAttached: true
				});
				break;
			default:
				queryParts.push(token);
				break;
		}
	}

	return {
		tags,
		variables,
		query: queryParts.filter(Boolean).join(" ")
	};
}

export function parseSystemFilterQuery(search: string): SystemFilterQuery {
	const rawParsed = splitTokens(search);

	const result: SystemFilterQuery = {
		query: rawParsed.query,
	};

	for(const [variable, { shouldInclude }] of rawParsed.variables){
		switch(variable.toLowerCase()){
			case "default":
				result.isDefault = reduceToValue(shouldInclude);
				break;
			case "pinned":
				result.isPinned = reduceToValue(shouldInclude);
				break;
			case "archived":
				result.isArchived = reduceToValue(shouldInclude);
				break;
		}
	}
	return result;
}


export function parseMemberFilterQuery(search: string): MemberFilterQuery {
	const rawParsed = splitTokens(search);

	const result: MemberFilterQuery = {
		query: rawParsed.query,
		tags: new Map()
	};

	for(const [_tag, { shouldInclude, allAttached }] of rawParsed.tags.entries()){
		const tag = getTagUUIDByName(_tag, allAttached);
		if (tag) result.tags.set(tag, shouldInclude);
	}

	for(const [variable, { value, shouldInclude }] of rawParsed.variables){
		switch(variable.toLowerCase()){
			case "system":
				result.system = {
					value: getSystemUUIDByName(value) ?? "",
					shouldInclude: reduceToValue(shouldInclude)
				};
				break;
			case "archived":
				result.isArchived = reduceToValue(shouldInclude);
				break;
			case "customfront":
				result.isCustomFront = reduceToValue(shouldInclude);
				break;
			case "pinned":
				result.isPinned = reduceToValue(shouldInclude);
				break;
			case "pronouns":
				result.pronouns = {
					value,
					shouldInclude: reduceToValue(shouldInclude)
				};
				break;
			case "role":
				result.role = {
					value,
					shouldInclude: reduceToValue(shouldInclude)
				};
				break;
			case "age":
				result.age = parseInt(value);
				break;
		}
	}
	return result;
}

export function parseFrontingHistoryFilterQuery(search: string) {
	const rawParsed = splitTokens(search);

	const result: FrontingHistoryFilterQuery = {
		query: rawParsed.query,
	};

	for (const [variable, { value, shouldInclude }] of rawParsed.variables) {
		switch (variable.toLowerCase()) {
			case "current":
				result.currentlyFronting = reduceToValue(shouldInclude);
				break;
			case "member":
				result.member = {
					value: getMemberUUIDByName(value) ?? "",
					shouldInclude: reduceToValue(shouldInclude)
				};
				break;
		}
		break;
	}

	return result;
}

export function parseBoardMessageFilterQuery(search: string) {
	const rawParsed = splitTokens(search);

	const result: BoardMessageFilterQuery = {
		query: rawParsed.query,
	};

	for (const [variable, { value, shouldInclude }] of rawParsed.variables) {
		switch (variable.toLowerCase()) {
			case "pinned":
				result.isPinned = reduceToValue(shouldInclude);
				break;
			case "archived":
				result.isArchived = reduceToValue(shouldInclude);
				break;
			case "member":
				result.member = {
					value: getMemberUUIDByName(value) ?? "",
					shouldInclude: reduceToValue(shouldInclude)
				};
				break;
		}
		break;
	}

	return result;
}

export function parseAssetFilterQuery(search: string) {
	const rawParsed = splitTokens(search);

	const result: AssetFilterQuery = {
		query: rawParsed.query,
		tags: new Map()
	};

	for(const [_tag, { shouldInclude, allAttached }] of rawParsed.tags.entries()){
		const tag = getTagUUIDByName(_tag, allAttached);
		if (tag) result.tags.set(tag, shouldInclude);
	}

	for (const [variable, { value, shouldInclude }] of rawParsed.variables) {
		switch (variable.toLowerCase()) {
			case "type":
				result.type = {
					value,
					shouldInclude: reduceToValue(shouldInclude)
				};
				break;
			case "filename":
				result.filename = value;
				break;
		}
		break;
	}

	return result;
}

export function parseCustomFieldFilterQuery(search: string) {
	const rawParsed = splitTokens(search);

	const result: CustomFieldFilterQuery = {
		query: rawParsed.query,
	};

	for (const [variable, { shouldInclude }] of rawParsed.variables) {
		switch (variable.toLowerCase()) {
			case "default":
				result.default = reduceToValue(shouldInclude);
				break;
		}
		break;
	}

	return result;
}

export function parseNoteFilterQuery(search: string) {
	const rawParsed = splitTokens(search);

	const result: NoteFilterQuery = {
		query: rawParsed.query,
	};

	for (const [variable, { shouldInclude }] of rawParsed.variables) {
		switch (variable.toLowerCase()) {
			case "archived":
				result.isArchived = reduceToValue(shouldInclude);
				break;
		}
		break;
	}

	return result;
}

export function parseJournalPostFilterQuery(search: string) {
	const rawParsed = splitTokens(search);

	const result: JournalPostFilterQuery = {
		query: rawParsed.query,
		tags: new Map()
	};

	for(const [_tag, { shouldInclude, allAttached }] of rawParsed.tags.entries()){
		const tag = getTagUUIDByName(_tag, allAttached);
		if (tag) result.tags.set(tag, shouldInclude);
	}

	for (const [variable, { value, shouldInclude }] of rawParsed.variables) {
		switch (variable.toLowerCase()) {
			case "member":
				result.member = {
					value: getMemberUUIDByName(value) ?? "",
					shouldInclude: reduceToValue(shouldInclude)
				};
				break;
		}
		break;
	}

	return result;
}

export function parseTagFilterQuery(search: string) {
	const rawParsed = splitTokens(search);

	const result: TagFilterQuery = {
		query: rawParsed.query,
	};

	for (const [variable, { shouldInclude }] of rawParsed.variables) {
		switch (variable.toLowerCase()) {
			case "archived":
				result.isArchived = reduceToValue(shouldInclude);
				break;
		}
		break;
	}

	return result;
}