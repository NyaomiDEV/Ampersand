import { Tag, getTagFromName } from "./db/entities/tags";

export type MemberFilterQuery = {
	query: string,
	tags: string[],
	archived?: boolean,
	customFront?: boolean
};

export type TagFilterQuery = {
	query: string,
	type?: Tag["type"]
};

export async function parseMemberFilterQuery(search: string): Promise<MemberFilterQuery> {
	const tokens = search.split(" ");

	const queryTokens: string[] = [];
	const tags: string[] = [];

	let archived, customFront;

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
									archived = true;
									break;
								case "no":
								case "false":
									archived = false;
									break;
								default:
									queryTokens.push(token);
									break;
							}
						} else
							archived = true;
						
						break;
					case "customfront":
						if(tokenParts[1]){
							switch (tokenParts[1]?.toLowerCase()) {
								case "yes":
								case "true":
									customFront = true;
									break;
								case "no":
								case "false":
									customFront = false;
									break;
								default:
									queryTokens.push(token);
									break;
							}
						} else
							customFront = true;
						
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
					tags.push(tag.uuid)
				else
					queryTokens.push(token);
				
				break;
			default:
				queryTokens.push(token);
				break;
		}
	}

	return {
		query: queryTokens.join(" "),
		tags,
		archived,
		customFront
	};
}


export function parseTagFilterQuery(search: string): TagFilterQuery {
	const tokens = search.split(" ");

	const queryTokens: string[] = [];

	let type: TagFilterQuery["type"];

	for (const token of tokens) {
		switch (token.charAt(0)) {
			case "@":
				const tokenParts = token.slice(1).split(":");
				switch (tokenParts[0].toLowerCase()) {
					case "type":
						switch (tokenParts[1]?.toLowerCase()){
							case "journal":
								type = "journal";
								break;
							case "member":
								type = "member";
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
				break;
			default:
				queryTokens.push(token);
				break;
		}
	}

	return {
		query: queryTokens.join(" "),
		type
	};
}
