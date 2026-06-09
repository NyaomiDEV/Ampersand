import { appConfig } from "../../../config";
import { clearAllDatabase } from "../..";
import { newSystem } from "../../tables/system";
import { newMember, updateMember } from "../../tables/members";
import { parseJsonStreamWithPaths, streamToIterable } from "json-stream-es";
import { transactionSucceeded } from "../../utils";
import { TupperboxGroup, TupperboxMember } from "../types/tupperbox_types";
import { getImage } from "../utils";
import { open } from "../../../native/open";
import { intoStream } from "../../../native/fs";

function deriveHash(imageString: string | null, discordId?: string){
	if(!discordId || !imageString) return;
	return `https://cdn.tupperbox.app/${discordId}/${imageString}.webp`;
}

async function subsystems(tuGroup: TupperboxGroup, systemMapping: Map<number, string>, discordId?: string){
	const result = await newSystem({
		name: tuGroup.name,
		image: await getImage(deriveHash(tuGroup.avatar, discordId)),
		description: tuGroup.description || undefined,
		viewInLists: true,
		isArchived: false,
		isPinned: false
	});

	if(!transactionSucceeded(result))
		throw new Error(`Could not add Tupperbox tag: ${result.err.message}`);

	systemMapping.set(tuGroup.id, result.detail);
}

async function member(tuMember: TupperboxMember, discordId?: string){
	const result = await newMember({
		name: tuMember.name,
		system: appConfig.defaultSystem,
		image: await getImage(deriveHash(tuMember.avatar, discordId) || tuMember.avatar_url),
		cover: await getImage(deriveHash(tuMember.banner, discordId), 1024),
		description: tuMember.description || undefined,
		pronouns: tuMember.pronouns || undefined,
		isArchived: false,
		isCustomFront: false,
		isPinned: false,
		dateCreated: tuMember.created_at ? new Date(tuMember.created_at) : new Date(),
		tags: []
	});

	if(!transactionSucceeded(result))
		throw new Error(`Could not add Tupperbox member: ${result.err.message}`);

	return [result.detail, tuMember.group_id] as [string, number | undefined];
}

export async function importTupperBox(){
	try {
		const path = await open({
			multiple: false,
			filters: [{ name: "Tupperbox JSON", extensions: ["json"] }],
			fileAccessMode: "scoped",
			pickerMode: "document"
		});
		if (!path) throw new Error("no path");

		const subsystemMapping = new Map<number, string>();
		const memberWantsSubsystem = new Map<string, number | undefined>();

		// WIPE AMPERSAND
		await clearAllDatabase();

		// Tupperbox doesn't have the concept of a system so we will just add one ourselves
		const _system = (await newSystem({
			name: "Tupperbox",
			description: "",
			isPinned: false,
			isArchived: false,
			viewInLists: false
		}));

		if(!transactionSucceeded(_system))
			throw new Error(`Could not add a dummy system: ${_system.err.message}`);

		appConfig.defaultSystem = _system.detail;

		const jsonStream = intoStream(path, undefined, true)
			.pipeThrough(parseJsonStreamWithPaths([["groups", "tuppers"]]));

		// Add values to database
		for await (const { path, value } of streamToIterable(jsonStream)){
			switch(path[0]){
				case "groups": {
					await subsystems(value as unknown as TupperboxGroup, subsystemMapping);
					break;
				}
				case "tuppers": {
					const [uuid, tbGroup] = await member(value as unknown as TupperboxMember);
					memberWantsSubsystem.set(uuid, tbGroup);
					break;
				}
			}
		}

		// Assign tags to members at a later step
		for(const [uuid, tbGroup] of memberWantsSubsystem){
			if(!tbGroup) continue;
			const _systemId = subsystemMapping.get(tbGroup);
			if (!_systemId) continue;

			const result = await updateMember({
				uuid,
				system: _systemId
			});

			if (!transactionSucceeded(result))
				throw new Error(`Could not remap Tupperbox member -> system: ${result.err.message}`);
		}
	}catch(e){
		console.error(e);
		return false;
	}

	return true;
}
