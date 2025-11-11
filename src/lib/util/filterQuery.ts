import { getTagFromNameHashtag } from "../db/tables/tags";
import { UUID } from "../db/entities";

export type MemberFilterQuery = {
	query: string,
	tags: string[],
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
	tags: string[],
	member?: UUID | boolean;
};

function splitTokens(search: string){
	const rawTokens = Array.from(search.matchAll(/(?=\S)[^'"\s]*(?:['"][^\\'"]*(?:\\[\s\S][^\\'"]*)*['"][^'"\s]*)*/g)).map(x => x[0]);

	const tags: string[] = [];
	const queryParts: string[] = [];
	const variables = new Map<string, string>();

	for(const token of rawTokens){
		switch(token.charAt(0)){
			case "@":
				const tokenParts = token.slice(1).split(":");
				if(tokenParts[1])
					variables.set(tokenParts[0], tokenParts[1].replace(/['"]/g, ""));
				else 
					variables.set(tokenParts[0], "");
				break;
			case "#":
				tags.push(token.slice(1));
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

export async function parseMemberFilterQuery(search: string): Promise<MemberFilterQuery> {
	const rawParsed = splitTokens(search);

	const result: MemberFilterQuery = {
		query: rawParsed.query,
		tags: []
	};

	for(const _tag of rawParsed.tags){
		const tag = await getTagFromNameHashtag(_tag);
		if (tag) result.tags.push(tag.uuid);
	}

	for(const [variable, value] of rawParsed.variables){
		switch(variable.toLowerCase()){
			case "archived":
				if(value.length){
					switch (value.toLowerCase()) {
						case "yes":
						case "true":
							result.isArchived = true;
							break;
						case "no":
						case "false":
							result.isArchived = false;
							break;
					}
				} else
					result.isArchived = true;
				break;
			case "customfront":
				if (value.length){
					switch (value.toLowerCase()) {
						case "yes":
						case "true":
							result.isCustomFront = true;
							break;
						case "no":
						case "false":
							result.isCustomFront = false;
							break;
					}
				} else
					result.isCustomFront = true;
				break;
			case "pinned":
				if (value.length) {
					switch (value.toLowerCase()) {
						case "yes":
						case "true":
							result.isPinned = true;
							break;
						case "no":
						case "false":
							result.isPinned = false;
							break;
					}
				} else
					result.isPinned = true;
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
				if (value) {
					switch (value.toLowerCase()) {
						case "yes":
						case "true":
							result.currentlyFronting = true;
							break;
						case "no":
						case "false":
							result.currentlyFronting = false;
							break;
					}
				} else
					result.currentlyFronting = true;
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
				if (value) {
					switch (value.toLowerCase()) {
						case "yes":
						case "true":
							result.isPinned = true;
							break;
						case "no":
						case "false":
							result.isPinned = false;
							break;
					}
				} else
					result.isPinned = true;
				break;
			case "archived":
				if (value) {
					switch (value.toLowerCase()) {
						case "yes":
						case "true":
							result.isArchived = true;
							break;
						case "no":
						case "false":
							result.isArchived = false;
							break;
					}
				} else
					result.isArchived = true;
				break;
			case "member":
				switch (value.toLowerCase()) {
					case "no":
					case "false":
						result.member = false;
						break;
					default:
						result.member = value;
						break;
				}
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
				if (value) {
					switch (value.toLowerCase()) {
						case "yes":
						case "true":
							result.default = true;
							break;
						case "no":
						case "false":
							result.default = false;
							break;
					}
				} else
					result.default = true;
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
		tags: []
	};

	for (const _tag of rawParsed.tags) {
		const tag = await getTagFromNameHashtag(_tag);
		if (tag) result.tags.push(tag.uuid);
	}

	for (const [variable, value] of rawParsed.variables) {
		switch (variable.toLowerCase()) {
			case "member":
				switch (value.toLowerCase()) {
					case "no":
					case "false":
						result.member = false;
						break;
					default:
						result.member = value;
						break;
				}
				break;
		}
		break;
	}

	return result;
}