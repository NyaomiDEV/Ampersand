import { FrontingEntry } from "../../entities";
import { getTables } from "../..";
import { nilUid } from "../../../util/consts";
import { appConfig } from "../../../config";
import { getImage } from "../utils";
import { newSystem, updateSystem } from "../../tables/system";
import { transactionSucceeded } from "../../utils";
import { newCustomField } from "../../tables/customFields";
import { newTag } from "../../tables/tags";
import { newMember, updateMember } from "../../tables/members";
import { open } from "../../../native/open";
import { newFrontingEntry } from "../../tables/frontingEntries";
import { PartialBy } from "../../../types";
import { PluralKitGroup, PluralKitMember, PluralKitSwitch } from "../types/pluralkit_types";
import { intoStream } from "../../../native/fs";
import { JsonDeserializer, JsonParser, JsonPathDetector, JsonPathSelector, JsonPathSelectorExpression, matchesJsonPathSelector, streamToIterable } from "json-stream-es";

async function system(prefilledUuid: string, name: string, description?: string, avatarUrl?: string, banner?: string, color?: string){
	const result = await updateSystem({
		uuid: prefilledUuid,
		name,
		description,
		image: await getImage(avatarUrl),
		cover: await getImage(banner),
		color: color ? `#${color}` : undefined,
		isPinned: false,
		isArchived: false,
		viewInLists: false,
	});

	if(!transactionSucceeded(result))
		throw new Error(`Could not update System: ${result.err.message}`);
}

async function customFields() {
	const result = await newCustomField({
		name: "PluralKit ID",
		default: false,
		priority: 1
	});
	if(!transactionSucceeded(result))
		throw new Error(`Could not add custom field: ${result.err.message}`);

	return result.detail;
}

async function tags(pkGroup: PluralKitGroup){
	const result = await newTag({
		name: pkGroup.display_name || pkGroup.name,
		description: pkGroup.description || undefined,
		color: pkGroup.color ? `#${pkGroup.color}` : undefined,
		type: "member",
		isArchived: false,
		viewInLists: false
	});

	if (!transactionSucceeded(result))
		throw new Error(`Could not add tag: ${result.err.message}`);

	return [result.detail, pkGroup.members] as [string, string[]];
}

async function members(pkMember: PluralKitMember) {
	const result = await newMember({
		name: pkMember.display_name || pkMember.name,
		system: appConfig.defaultSystem,
		image: await getImage(pkMember.avatar_url),
		cover: await getImage(pkMember.banner),
		description: pkMember.description || undefined,
		pronouns: pkMember.pronouns || undefined,
		color: pkMember.color ? `#${pkMember.color}` : undefined,
		isArchived: false,
		isPinned: false,
		isCustomFront: false,
		dateCreated: new Date(pkMember.created),
		tags: [],
		customFields: new Map(),
	});

	if (!transactionSucceeded(result))
		throw new Error(`Could not add member: ${result.err.message}`);

	return [result.detail, pkMember.id] as [string, string];
}

async function frontingEntries(pkSwitches: PluralKitSwitch[], memberMapping: Map<string, string>){
	const trackedFronting = new Map<string, PartialBy<FrontingEntry, "uuid">>();
	for (const pkSwitch of pkSwitches.toSorted((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())) {
		const date = new Date(pkSwitch.timestamp);

		// check who left
		for (const id of trackedFronting.keys()) {
			if (!pkSwitch.members.includes(id)) {
				const frontingEntry = trackedFronting.get(id)!;
				frontingEntry.endTime = date;

				const result = await newFrontingEntry(frontingEntry);

				if (!transactionSucceeded(result))
					throw new Error(`Could not add fronting entry: ${result.err.message}`);

				trackedFronting.delete(id);
			}
		}

		// check who's new
		for (const id of pkSwitch.members) {
			if (!trackedFronting.has(id)) {
				const frontingEntry: PartialBy<FrontingEntry, "uuid"> = {
					member: memberMapping.get(id) || nilUid,
					startTime: date,
					isMainFronter: false,
					isLocked: false,
				};
				trackedFronting.set(id, frontingEntry);
			}
		}
	}

	// push whatever is still in the tracking map
	for (const frontingEntry of trackedFronting.values()){
		const result = await newFrontingEntry(frontingEntry);

		if (!transactionSucceeded(result))
			throw new Error(`Could not add fronting entry: ${result.err.message}`);
	}
}

export async function importPluralKit(){
	const asideToken = `databasePluralKitImport.${Date.now()}`;

	try {
		const path = await open({
			multiple: false,
			filters: [{ name: "PluralKit JSON", extensions: ["json"] }],
			fileAccessMode: "scoped",
			pickerMode: "document"
		});
		if (!path) throw new Error("no path");

		// System name, description and avatar
		let name = "PluralKit";
		let description: string | undefined = undefined;
		let avatarUrl: string | undefined = undefined;
		let banner: string | undefined = undefined;
		let color: string | undefined = undefined;

		// ID in their database -> UUID in our one
		const memberMapping = new Map<string, string>();

		// UUID in our database -> IDs of the members who have this tag in their one
		const tagsToMembers = new Map<string, string[]>();

		// We sadly need to cache fronts
		const _switches: PluralKitSwitch[] = [];

		// WIPE AMPERSAND
		for (const table of Object.values(getTables()))
			await table.setAside(asideToken);

		// Create a dummy system (we will update it later)
		const _system = await newSystem({
			name: "PluralKit",
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
					case "name":
					case "description":
					case "avatar_url":
					case "banner":
					case "color":
						break;
					case "groups":
					case "members":
					case "switches":
						matcher.push(undefined);
						break;
					default:
						return false;
				}
				return matchesJsonPathSelector(path, matcher);
			}))
			.pipeThrough(new JsonDeserializer());

		// Add our pluralkit custom field
		const pkField = await customFields();

		// Add values to database
		for await (const { path, value } of streamToIterable(jsonStream)){
			switch(path[0]){
				case "name": {
					name = value as string;
					break;
				}
				case "description": {
					description = value as string;
					break;
				}
				case "avatar_url": {
					avatarUrl = value as string;
					break;
				}
				case "banner": {
					banner = value as string;
					break;
				}
				case "color": {
					color = value as string;
					break;
				}
				case "groups": {
					const [uuid, members] = await tags(value as PluralKitGroup);
					tagsToMembers.set(uuid, members);
					break;
				}
				case "members": {
					const [ uuid, id ] = await members(value as PluralKitMember);
					memberMapping.set(id, uuid);
					break;
				}
				case "switches": {
					_switches.push(value as PluralKitSwitch);
					break;
				}
			}
		}

		// add stuff we had to cache ( :( )
		await system(appConfig.defaultSystem, name, description, avatarUrl, banner, color);
		await frontingEntries(_switches, memberMapping);

		// remap now
		// membersToFields holds all member UUIDs we set, so we can safely use that as a member index
		for(const [id, uuid] of memberMapping){
			await updateMember({
				uuid,
				tags: Array.from(
					tagsToMembers.entries()
						.filter(x => x[1].includes(id))
						.map(x => x[0])
				),
				customFields: new Map([[pkField, id]])
			});
		}

		for (const table of Object.values(getTables())) {
			try {
				await table.removeAside(asideToken);
			} catch (_e) {
				console.error(`Couldn't remove aside: ${_e as Error}`);
			}
		}

		// I KNOW YOU'RE SEEING THIS AND THINKING IT'S CURSED
		// I WILL SHOW UP AT YOUR DOOR

	} catch (e) {
		console.error(e);

		for (const table of Object.values(getTables())){
			try{
				await table.restoreFromAside(asideToken);
			}catch(_e){
				console.error(`Couldn't even restore from aside: ${_e as Error}`);
			}
		}

		return false;
	}

	return true;
}
