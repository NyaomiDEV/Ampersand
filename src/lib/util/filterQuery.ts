import { getTagFromName } from "../db/tables/tags";
import { UUID } from "../db/entities";

export type SystemFilterQuery = {
	query: string,
	isDefault?: boolean,
	isPinned?: boolean,
	isArchived?: boolean,
};

export type MemberFilterQuery = {
	query: string,
	tags: Map<string, boolean>,
	system?: string,
	isPinned?: boolean,
	isArchived?: boolean,
	isCustomFront?: boolean,
	pronouns?: string,
	role?: string,
};

export type FrontingHistoryFilterQuery = {
	query: string,
	currentlyFronting?: boolean,
	member?: UUID
};

export type BoardMessageFilterQuery = {
	query: string,
	isPinned?: boolean,
	isArchived?: boolean,
	member?: UUID | boolean
};

export type AssetFilterQuery = {
	query: string,
	type?: string,
	filename?: string
};

export type CustomFieldFilterQuery = {
	query: string,
	default?: boolean
};

export type JournalPostFilterQuery = {
	query: string,
	tags: Map<string, boolean>,
	member?: UUID | boolean;
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
	const rawTokens = Array.from(search.matchAll(/(?=\S)[^'"\s]*(?:['"][^\\'"]*(?:\\[\s\S][^\\'"]*)*['"][^'"\s]*)*/g)).map(x => x[0]);

	const tags = new Map<string, boolean>();
	const queryParts: string[] = [];
	const variables = new Map<string, string>();

	for(const token of rawTokens){
		const tokenParts = token.slice(1).split(":");
		switch(token.charAt(0)){
			case "@":
				if(tokenParts[1])
					variables.set(tokenParts[0], tokenParts[1].replace(/['"]/g, ""));
				else 
					variables.set(tokenParts[0], "");
				break;
			case "#":
				if(tokenParts[1])
					tags.set(tokenParts[0], reduceToValue(tokenParts[1].replace(/['"]/g, "")));
				else 
					tags.set(tokenParts[0], true);
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

	for(const [variable, value] of rawParsed.variables){
		switch(variable.toLowerCase()){
			case "default":
				result.isDefault = reduceToValue(value);
				break;
			case "pinned":
				result.isPinned = reduceToValue(value);
				break;
			case "archived":
				result.isArchived = reduceToValue(value);
				break;
		}
	}
	return result;
}


export async function parseMemberFilterQuery(search: string): Promise<MemberFilterQuery> {
	const rawParsed = splitTokens(search);

	const result: MemberFilterQuery = {
		query: rawParsed.query,
		tags: new Map()
	};

	for(const [_tag, shouldInclude] of rawParsed.tags.entries()){
		const tag = await getTagFromName(_tag, true);
		if (tag) result.tags.set(tag.uuid, shouldInclude);
	}

	for(const [variable, value] of rawParsed.variables){
		switch(variable.toLowerCase()){
			case "system":
				result.system = value;
				break;
			case "archived":
				result.isArchived = reduceToValue(value);
				break;
			case "customfront":
				result.isCustomFront = reduceToValue(value);
				break;
			case "pinned":
				result.isPinned = reduceToValue(value);
				break;
			case "pronouns":
				result.pronouns = value;
				break;
			case "role":
				result.role = value;
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

	for (const [variable, value] of rawParsed.variables) {
		switch (variable.toLowerCase()) {
			case "current":
				result.currentlyFronting = reduceToValue(value);
				break;
			case "member":
				result.member = value;
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

	for (const [variable, value] of rawParsed.variables) {
		switch (variable.toLowerCase()) {
			case "pinned":
				result.isPinned = reduceToValue(value);
				break;
			case "archived":
				result.isArchived = reduceToValue(value);
				break;
			case "member":
				result.member = reduceToValue(value, true, true);
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
	};

	for (const [variable, value] of rawParsed.variables) {
		switch (variable.toLowerCase()) {
			case "type":
				result.type = value;
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

	for (const [variable, value] of rawParsed.variables) {
		switch (variable.toLowerCase()) {
			case "default":
				result.default = reduceToValue(value);
				break;
		}
		break;
	}

	return result;
}

export async function parseJournalPostFilterQuery(search: string) {
	const rawParsed = splitTokens(search);

	const result: JournalPostFilterQuery = {
		query: rawParsed.query,
		tags: new Map()
	};

	for(const [_tag, shouldInclude] of rawParsed.tags.entries()){
		const tag = await getTagFromName(_tag, true);
		if (tag) result.tags.set(tag.uuid, shouldInclude);
	}

	for (const [variable, value] of rawParsed.variables) {
		switch (variable.toLowerCase()) {
			case "member":
				result.member = reduceToValue(value, true, true);
				break;
		}
		break;
	}

	return result;
}