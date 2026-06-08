import { appConfig } from "../../../config";
import { clearAllDatabase } from "../..";
import { newSystem } from "../../tables/system";
import { newTag } from "../../tables/tags";
import { newMember, updateMember } from "../../tables/members";
import { parseJsonStreamWithPaths, streamToIterable } from "json-stream-es";
import { transactionSucceeded } from "../../utils";
import { Group, Tupper } from "../types/tupperbox_types";
import { getImage } from "../utils";

async function tag(tuGroup: Group, tagMapping: Map<number, string>){
	const result = await newTag({
		name: tuGroup.name,
		description: tuGroup.description || undefined,
		type: "member",
		viewInLists: false,
		isArchived: false,
	});

	if(!transactionSucceeded(result))
		throw new Error(`Could not add Tupperbox tag: ${result.err.message}`);

	tagMapping.set(tuGroup.id, result.detail);
}

async function member(tuMember: Tupper){
	const result = await newMember({
		name: tuMember.name,
		system: appConfig.defaultSystem,
		image: await getImage(tuMember.avatar_url),
		cover: await getImage(tuMember.banner, 1024),
		description: tuMember.description || undefined,
		pronouns: tuMember.pronouns || undefined,
		isArchived: false,
		isCustomFront: false,
		isPinned: false,
		dateCreated: new Date(tuMember.created_at),
		tags: []
	});

	if(!transactionSucceeded(result))
		throw new Error(`Could not add Tupperbox member: ${result.err.message}`);

	return [result.detail, tuMember.group_id] as [string, number | undefined];
}

export async function importTupperBox(tuExport: ReadableStream<string>){
	const tagMapping = new Map<number, string>();
	const memberWantsTags = new Map<string, number | undefined>();

	try {
		// WIPE AMPERSAND
		await clearAllDatabase();

		// Tupperbox doesn't have the concept of a system so we will just add one ourselves
		const systemUuid = (await newSystem({
			name: "Tupperbox",
			description: "",
			isPinned: false,
			isArchived: false,
			viewInLists: false
		}));

		if(!transactionSucceeded(systemUuid)) throw new Error("Could not add a dummy system");
		appConfig.defaultSystem = systemUuid.detail;

		const jsonStream = tuExport
			.pipeThrough(parseJsonStreamWithPaths([["groups", "tuppers"]]));

		// Add values to database
		for await (const { path, value } of streamToIterable(jsonStream)){
			switch(path[0]){
				case "groups": {
					await tag(value as unknown as Group, tagMapping);
					break;
				}
				case "tuppers": {
					const [uuid, tbTag] = await member(value as unknown as Tupper);
					memberWantsTags.set(uuid, tbTag);
					break;
				}
			}
		}

		// Assign tags to members at a later step
		for(const [uuid, tag] of memberWantsTags){
			if(!tag) continue;
			const _tagId = tagMapping.get(tag);
			if (!_tagId) continue;

			const result = await updateMember({
				uuid,
				tags: [_tagId]
			});
			if (!transactionSucceeded(result))
				throw new Error(`Could not remap Tupperbox member -> tag: ${result.err.message}`);
		}
	}catch(e){
		console.error(e);
		return false;
	}

	return true;
}
