import { Tag, getTagFromName } from "../db/entities/tags";

export type MemberFilterQuery = {
	query: string,
	tags: string[],
	isArchived?: boolean,
	isCustomFront?: boolean,
	pronouns?: string,
	role?: string
};

export type TagFilterQuery = {
	query: string,
	type?: Tag["type"]
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
					case "pronouns":
						result.pronouns = tokenParts[1];
						break;
					case "role":
						result.role = tokenParts[1];
						break;
					default:
						queryTokens.push(token);
						break;
				}
				break;
			case "#":
				const probableTag = token.slice(1);
				const tag = await getTagFromName(probableTag);
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
