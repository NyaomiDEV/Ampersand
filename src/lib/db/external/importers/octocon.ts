import { appConfig } from "../../../config";
import { nilUid } from "../../../util/consts";
import { clearAllDatabase } from "../..";
import type { OctoconAlter, OctoconFront, OctoconPoll, OctoconTag, OctoconUser } from "../types/octocon_types";
import { getImage } from "../utils";
import { newSystem, updateSystem } from "../../tables/system";
import { transactionSucceeded } from "../../utils";
import { JsonDeserializer, JsonParser, JsonPathDetector, JsonPathSelector, JsonPathSelectorExpression, matchesJsonPathSelector, streamToIterable } from "json-stream-es";
import { newCustomField } from "../../tables/customFields";
import { newTag } from "../../tables/tags";
import { newMember, updateMember } from "../../tables/members";
import { newFrontingEntry } from "../../tables/frontingEntries";
import { newBoardMessage } from "../../tables/boardMessages";
import { open } from "../../../native/open";
import { intoStream } from "../../../native/fs";

async function system(prefilledUuid: string, ocUser: OctoconUser){
	const result = await updateSystem({
		uuid: prefilledUuid,
		name: ocUser.username || ocUser.id,
		description: ocUser.description,
		image: await getImage(ocUser.avatar_url),
	});

	if(!transactionSucceeded(result))
		throw new Error(`Could not update System: ${result.err.message}`);
}

async function customFields(ocUser: OctoconUser, customFieldMapping: Map<string, [string, boolean]>){
	for (const field of ocUser.fields || []){
		const result = await newCustomField({
			name: field.name,
			default: false,
			priority: 1
		});
		if(!transactionSucceeded(result))
			throw new Error(`Could not add custom field: ${result.err.message}`);

		customFieldMapping.set(result.detail, [field.id, field.locked]);
	}

	// Make two custom fields for data preservation
	const proxyName = await newCustomField({
		name: "Proxy name",
		default: false,
		priority: 2
	});
	if (!transactionSucceeded(proxyName))
		throw new Error(`Could not add custom field: ${proxyName.err.message}`);

	customFieldMapping.set(proxyName.detail, ["AMPERSAND_proxyname", false]);

	const proxyTags = await newCustomField({
		name: "Proxy tags",
		default: false,
		priority: 2
	});
	if (!transactionSucceeded(proxyTags))
		throw new Error(`Could not add custom field: ${proxyTags.err.message}`);

	customFieldMapping.set(proxyTags.detail, ["AMPERSAND_proxytags", false]);
}

async function tags(ocTag: OctoconTag){
	const result = await newTag({
		name: ocTag.name,
		color: ocTag.color,
		description: ocTag.description,
		type: "member",
		isArchived: false,
		viewInLists: false
	});

	if (!transactionSucceeded(result))
		throw new Error(`Could not add tag: ${result.err.message}`);

	return [result.detail, ocTag.alters] as [string, number[]];
}

async function members(ocAlter: OctoconAlter){
	const result = await newMember({
		image: await getImage(ocAlter.avatar_url),
		name: ocAlter.name || "Unnamed member",
		pronouns: ocAlter.pronouns,
		description: ocAlter.description,
		system: appConfig.defaultSystem,
		color: ocAlter.color,
		isArchived: false,
		isPinned: false,
		isCustomFront: false,
		dateCreated: new Date(),
		tags: [],
		customFields: new Map()
	});

	if (!transactionSucceeded(result))
		throw new Error(`Could not add member: ${result.err.message}`);

	const fields = ocAlter.fields.map(x => [x.id, x.value]);

	if (ocAlter.proxy_name) 
		fields.push(["AMPERSAND_proxyname", ocAlter.proxy_name]);
	
	if (ocAlter.discord_proxies?.length) 
		fields.push(["AMPERSAND_proxytags", ocAlter.discord_proxies.join("\n")]);
	
	return [ result.detail, ocAlter.id, fields ] as [string, number, string[][]];
}

async function frontingEntries(ocFront: OctoconFront, memberMapping: Map<number, string>){
	const result = await newFrontingEntry({
		member: memberMapping.get(ocFront.alter_id) || nilUid,
		startTime: new Date(ocFront.time_start),
		endTime: ocFront.time_end ? new Date(ocFront.time_end) : undefined,
		comment: ocFront.comment,
		isMainFronter: false,
		isLocked: false
	});

	if (!transactionSucceeded(result))
		throw new Error(`Could not add fronting entry: ${result.err.message}`);
	
	return result.detail;
}

async function polls(ocPoll: OctoconPoll, memberMapping: Map<number, string>){
	const poll = {
		multipleChoice: false,
		entries:
		ocPoll.type === "vote"
			? [
					{
						choice: "yes",
						votes: ocPoll.data.responses
							.filter(response => response.vote === "yes")
							.map(response => ({
								member: memberMapping.get(response.alter_id) || nilUid,
								reason: response.comment
							}))
					},
					{
						choice: "no",
						votes: ocPoll.data.responses
							.filter(response => response.vote === "no")
							.map(response => ({
								member: memberMapping.get(response.alter_id) || nilUid,
								reason: response.comment
							}))
					},
					{
						choice: "abstain",
						votes: ocPoll.data.responses
							.filter(response => response.vote === "abstain")
							.map(response => ({
								member: memberMapping.get(response.alter_id) || nilUid,
								reason: response.comment
							}))
					}
				]
			: ocPoll.data.choice
				?.map(choice => ({
					choice: choice.name,
					votes: ocPoll.data.responses
						.filter(response => response.choice_id === choice.id)
						.map(response => ({
							member: memberMapping.get(response.alter_id) || nilUid,
							reason: response.comment
						}))
				})) || []
	};

	if (ocPoll.type === "vote" && ocPoll.data.allow_veto){
		poll.entries?.push({
			choice: "veto",
			votes: ocPoll.data.responses
				.filter(response => response.vote === "veto")
				.map(response => ({
					member: memberMapping.get(response.alter_id) || nilUid,
					reason: response.comment
				}))
		});
	}

	const result = await newBoardMessage({
		members: [],
		title: ocPoll.title,
		body: ocPoll.description,
		date: new Date(ocPoll.inserted_at),
		isPinned: false,
		isArchived: false,
		poll
	});

	if (!transactionSucceeded(result))
		throw new Error(`Could not add poll: ${result.err.message}`);

	return result.detail;
}

export async function importOctocon(){
	try {
		const path = await open({
			multiple: false,
			filters: [{ name: "Octocon JSON", extensions: ["json"] }],
			fileAccessMode: "scoped",
			pickerMode: "document"
		});
		if (!path) throw new Error("no path");

		// UUID in our database -> Array of ID in their one and locked status
		const customFieldMapping = new Map<string, [string, boolean]>();
		// ID in their database -> UUID in ours
		const memberMapping = new Map<number, string>();
		// UUID in our database -> IDs of the alters who have this tag in their one
		const tagsToAlters = new Map<string, number[]>();
		// UUID in our database -> Array of k/v where k is their ID and v is the custom field data
		const membersToFields = new Map<string, string[][]>();

		// We sadly need to cache fronts and polls
		const _fronts: OctoconFront[] = [];
		const _polls: OctoconPoll[] = [];

		// WIPE AMPERSAND
		await clearAllDatabase();

		// Create a dummy system (we will update it later)
		const _system = await newSystem({
			name: "Octocon",
			description: "",
			isPinned: false,
			isArchived: false,
			viewInLists: false
		});

		if (!transactionSucceeded(_system))
			throw new Error(`Could not add a dummy system: ${_system.err.message}`);

		appConfig.defaultSystem = _system.detail;

		const jsonStream = intoStream(path, undefined, true)
			.pipeThrough(new JsonParser())
			.pipeThrough(new JsonPathDetector())
			.pipeThrough(new JsonPathSelector((path) => {
				const matcher: JsonPathSelectorExpression = [path[0]];
				switch (path[0]) {
					case "user":
						break;
					case "tags":
					case "alters":
					case "fronts":
					case "polls":
						matcher.push(undefined);
						break;
					default:
						return false;
				}
				return matchesJsonPathSelector(path, matcher);
			}))
			.pipeThrough(new JsonDeserializer());

		// Add values to database
		for await (const { path, value } of streamToIterable(jsonStream)){
			switch(path[0]){
				case "user": {
					await system(appConfig.defaultSystem, value as OctoconUser);
					await customFields(value as OctoconUser, customFieldMapping);
					break;
				}
				case "tags": {
					const [ uuid, members ] = await tags(value as OctoconTag);
					tagsToAlters.set(uuid, members);
					break;
				}
				case "alters": {
					const [ uuid, id, fields ] = await members(value as OctoconAlter);
					memberMapping.set(id, uuid);
					membersToFields.set(uuid, fields);
					break;
				}
				case "fronts": {
					_fronts.push(value as OctoconFront);
					break;
				}
				case "polls": {
					_polls.push(value as OctoconPoll);
					break;
				}
			}
		}

		// add stuff we had to cache ( :( )
		for (const front of _fronts)
			await frontingEntries(front, memberMapping);

		for (const poll of _polls)
			await polls(poll, memberMapping);

		// remap now
		// membersToFields holds all member UUIDs we set, so we can safely use that as a member index
		for(const [uuid, fields] of membersToFields){
			const _memberId = memberMapping.entries().find(x => x[1] === uuid)?.[0];
			const result = await updateMember({
				uuid,
				tags: Array.from(
					tagsToAlters.entries()
						.filter(x => x[1].includes(_memberId || NaN))
						.map(x => x[0])
				),
				customFields: new Map(fields.map(([id, value]) => {
					const isLocked = customFieldMapping.entries().find(x => x[1][0] === id)?.[1][1] || false;
					return [uuid, isLocked ? `||${value}||` : value];
				}))
			});
			if (!transactionSucceeded(result))
				throw new Error(`Could not update a member: ${result.err.message}`);
		}

		// I KNOW YOU'RE SEEING THIS AND THINKING IT'S CURSED
		// I WILL SHOW UP AT YOUR DOOR

	} catch (e) {
		console.error(e);
		return false;
	}

	return true;
}