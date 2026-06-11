import { getTables } from "../..";
import i18next from "../../../i18n";
import { maxUid, nilUid } from "../../../util/consts";
import { appConfig } from "../../../config";
import type { SimplyPluralAutomatedReminder, SimplyPluralBoardMessage, SimplyPluralComment, SimplyPluralCustomField, SimplyPluralFrontHistory, SimplyPluralFrontStatus, SimplyPluralGroup, SimplyPluralMember, SimplyPluralNote, SimplyPluralPoll, SimplyPluralUser, SimplyPluralCustomField as SPCustomField } from "../types/simplyplural_types";
import { getImage } from "../utils";
import { getSystems, newSystem, updateSystem } from "../../tables/system";
import { transactionSucceeded } from "../../utils";
import { newTag } from "../../tables/tags";
import { newCustomField } from "../../tables/customFields";
import { open } from "../../../native/open";
import { intoStream } from "../../../native/fs";
import { parseJsonStreamWithPaths, streamToIterable } from "json-stream-es";
import { newReminder } from "../../tables/reminders";
import { getJournalPosts, newJournalPost, updateJournalPost } from "../../tables/journalPosts";
import { getBoardMessages, newBoardMessage, updateBoardMessage } from "../../tables/boardMessages";
import { newFrontingEntry } from "../../tables/frontingEntries";
import { getMembers, newMember, updateMember } from "../../tables/members";

// -- UTILITY FUNCTIONS
function normalizeSPColor(color?: string) {
	if (!color || !color.length) return undefined;

	if (color.startsWith("#"))
		color = color.substring(1);

	if (color.length > 6) // argb
		color = color.substring(2);

	return `#${color}`;
}

function mapCustomFieldType(type: SPCustomField["type"], data: string) {
	switch(type){
		case 0: // text
			return String(data);
		case 1: // color
			return `<${normalizeSPColor(data)}>`;
		case 2: // date
			return `<t:${Math.round(new Date(data).getTime() / 1000)}:D>`;
		case 3: // month
			return `<t:${Math.round(new Date(data).getTime() / 1000)}:M>`;
		case 4: // year
			return `<t:${Math.round(new Date(data).getTime() / 1000)}:Y>`;
		case 5: // month + year
			return `<t:${Math.round(new Date(data).getTime() / 1000)}:K>`;
		case 6: // timestamp
			return `<t:${Math.round(new Date(data).getTime() / 1000)}:F>`;
		case 7: // month + day
			return `<t:${Math.round(new Date(data).getTime() / 1000)}:G>`;
	}
}

function getAvatarURL(systemId: string, avatarUuid: string){
	return `https://spaces.apparyllis.com/avatars/${systemId}/${avatarUuid}`;
}

// --- STUFF WE CAN JUST LIVE ADD OR UPDATE
async function system(prefilledUuid: string, spUser: SimplyPluralUser){
	const result = await updateSystem({
		uuid: prefilledUuid,
		name: spUser.username,
		description: spUser.desc,
		image: await getImage(spUser.avatarUrl || getAvatarURL(spUser.uid, spUser.avatarUuid)),
		isPinned: false,
		isArchived: false,
		viewInLists: true
	});

	if(!transactionSucceeded(result))
		throw new Error(`Could not update System: ${result.err.message}`);
}

async function tag(spGroup: SimplyPluralGroup){
	const result = await newTag({
		name: spGroup.name,
		description: spGroup.desc?.length ? spGroup.desc : undefined,
		color: normalizeSPColor(spGroup.color),
		type: "member",
		isArchived: false,
		viewInLists: false,
	});

	if (!transactionSucceeded(result))
		throw new Error(`Could not add tag: ${result.err.message}`);

	return [result.detail, spGroup.members] as [string, string[]];
}

async function customField(spCustomField: SimplyPluralCustomField, customFieldMapping: Map<string, [string, number]>){
	const result = await newCustomField({
		name: spCustomField.name,
		default: false,
		priority: 1,
	});

	if (!transactionSucceeded(result))
		throw new Error(`Could not add custom field: ${result.err.message}`);

	customFieldMapping.set(result.detail, [spCustomField._id, spCustomField.type]);
}

async function reminder(spReminder: SimplyPluralAutomatedReminder) {
	const result = await newReminder({
		title: spReminder.name,
		active: true,
		message: spReminder.message,
		trigger: "fronting",
		delay: spReminder.delayInHours * 60 * 60 * 1000
	});

	if (!transactionSucceeded(result))
		throw new Error(`Could not add reminder: ${result.err.message}`);
}

async function member(spMember: SimplyPluralMember) {
	const result = await newMember({
		name: spMember.name,
		image: await getImage(spMember.avatarUrl || getAvatarURL(spMember.uid, spMember.avatarUuid)),
		system: appConfig.defaultSystem,
		pronouns: spMember.pronouns?.length ? spMember.pronouns : undefined,
		description: spMember.desc?.length ? spMember.desc : undefined,
		color: normalizeSPColor(spMember.color),
		isPinned: false,
		isArchived: spMember.archived || false,
		isCustomFront: false,
		dateCreated: spMember.created ? new Date(spMember.created) : new Date(),
		tags: []
	});

	if (!transactionSucceeded(result))
		throw new Error(`Could not add member: ${result.err.message}`);

	const fields = spMember.info ? Object.entries(spMember.info)
		.filter(([_, value]) => value.length) : [];

	return [ result.detail, spMember._id, fields ] as [string, string, string[][]];
}

async function customFront(spCustomFront: SimplyPluralFrontStatus) {
	const result = await newMember({
		name: spCustomFront.name,
		image: await getImage(spCustomFront.avatarUrl || getAvatarURL(spCustomFront.uid, spCustomFront.avatarUuid)),
		system: appConfig.defaultSystem,
		description: spCustomFront.desc?.length ? spCustomFront.desc : undefined,
		color: normalizeSPColor(spCustomFront.color),
		isPinned: false,
		isArchived: false,
		isCustomFront: true,
		tags: [],
		dateCreated: spCustomFront.lastUpdate ? new Date(spCustomFront.lastUpdate) : new Date(), // does created exist in this?
	});

	if (!transactionSucceeded(result))
		throw new Error(`Could not add member: ${result.err.message}`);

	return [ result.detail, spCustomFront._id ];
}

// --- STUFF WE CANNOT REALLY ADD LIVE

async function journalPost(spNote: SimplyPluralNote, memberMapping: Map<string, string>) {
	const result = await newJournalPost({
		title: spNote.title || "--",
		body: spNote.note,
		members: spNote.member ? [memberMapping.get(spNote.member) || nilUid] : [],
		tags: [],
		isPrivate: false,
		isPinned: false,
		date: new Date(spNote.date || spNote.lastOperationTime || Date.now()),
	});
		
	if (!transactionSucceeded(result))
		throw new Error(`Could not add journal post: ${result.err.message}`);
}

async function boardMessage(spBoardMessage: SimplyPluralBoardMessage, memberMapping: Map<string, string>){
	const writtenBy = memberMapping.get(spBoardMessage.writtenBy);
	const writtenFor = memberMapping.get(spBoardMessage.writtenFor);

	const result = await newBoardMessage({
		members: writtenBy ? [writtenBy] : [],
		title: spBoardMessage.title,
		body: `${writtenFor ? `@<m:${writtenFor}>\n\n` : ""}${spBoardMessage.message?.length ? spBoardMessage.message : ""}`,
		date: spBoardMessage.writtenAt ? new Date(spBoardMessage.writtenAt) : new Date(),
		isArchived: false,
		isPinned: false,
	});

	if (!transactionSucceeded(result))
		throw new Error(`Could not add board message: ${result.err.message}`);

}

async function poll(spPoll: SimplyPluralPoll, memberMapping: Map<string, string>){
	const poll = {
		multipleChoice: false,
		entries: spPoll.custom
			? spPoll.options.map(option => ({
					choice: option.name,
					votes: spPoll.votes
						?.filter(vote => vote.vote === option.name)
						.map(vote => ({
							member: memberMapping.get(vote.id) || nilUid,
							reason: vote.comment?.length ? vote.comment : undefined
						})) || []
				}))
			: [
					{
						choice: i18next.t("messageBoard:polls.defaultPollValues.yes"),
						votes: spPoll.votes
							?.filter(vote => vote.vote === "yes")
							.map(vote => ({
								member: memberMapping.get(vote.id) || nilUid,
								reason: vote.comment?.length ? vote.comment : undefined
							})) || []
					},
					{
						choice: i18next.t("messageBoard:polls.defaultPollValues.no"),
						votes: spPoll.votes
							?.filter(vote => vote.vote === "no")
							.map(vote => ({
								member: memberMapping.get(vote.id) || nilUid,
								reason: vote.comment?.length ? vote.comment : undefined
							})) || []
					}
				]
	};

	if(spPoll.allowVeto){
		poll.entries.push({
			choice: i18next.t("messageBoard:polls.defaultPollValues.veto"),
			votes: spPoll.votes
				?.filter(vote => vote.vote === "veto")
				.map(vote => ({
					member: memberMapping.get(vote.id) || nilUid,
					reason: vote.comment?.length ? vote.comment : undefined
				})) || []
		});
	}

	if(spPoll.allowAbstain){
		poll.entries.push({
			choice: i18next.t("messageBoard:polls.defaultPollValues.abstain"),
			votes: spPoll.votes
				?.filter(vote => vote.vote === "abstain")
				.map(vote => ({
					member: memberMapping.get(vote.id) || nilUid,
					reason: vote.comment?.length ? vote.comment : undefined
				})) || []
		});
	}

	const result = await newBoardMessage({
		members: [],
		title: spPoll.name,
		body: spPoll.desc?.length ? spPoll.desc : "",
		date: spPoll.lastOperationTime ? new Date(spPoll.lastOperationTime) : new Date(),
		poll,
		isArchived: false,
		isPinned: false,
	});

	if (!transactionSucceeded(result))
		throw new Error(`Could not add board message: ${result.err.message}`);
}

async function frontingEntry(spFrontHistory: SimplyPluralFrontHistory, memberMapping: Map<string, string>, commentMapping: Map<string, [Date, string][]>) {
	if (!spFrontHistory.startTime || !spFrontHistory.member) return; // front entries without startTime nor member are null for us

	const result = await newFrontingEntry({
		member: memberMapping.get(spFrontHistory.member) || (spFrontHistory.custom ? maxUid : nilUid),
		startTime: new Date(spFrontHistory.startTime),
		endTime: spFrontHistory.endTime ? new Date(spFrontHistory.endTime) : (spFrontHistory.live ? undefined : new Date()),
		customStatus: spFrontHistory.customStatus?.length ? spFrontHistory.customStatus : undefined,
		isMainFronter: false,
		isLocked: false,
		comments: commentMapping.get(spFrontHistory._id)?.map(comment => ({
			member: memberMapping.get(spFrontHistory.member!) || (spFrontHistory.custom ? maxUid : nilUid),
			date: comment[0],
			comment: comment[1]
		}))
	});

	if (!transactionSucceeded(result))
		throw new Error(`Could not add fronting entry: ${result.err.message}`);
}

export async function importSimplyPlural(){
	const asideToken = `databaseSimplyPluralImport.${Date.now()}`;

	try {
		const path = await open({
			multiple: false,
			filters: [{ name: "Simply Plural JSON", extensions: ["json"] }],
			fileAccessMode: "scoped",
			pickerMode: "document"
		});
		if (!path) throw new Error("no path");

		// UUID in our database -> Array of ID in their one and custom field type
		const customFieldMapping = new Map<string, [string, number]>();
		// UUID in their database -> ID in our one
		const memberMapping = new Map<string, string>();
		// UUID in our database -> IDs of the members who have this tag in their one
		const tagsToMembers = new Map<string, string[]>();
		// UUID in our database -> Array of k/v where k is their ID and v is the custom field data
		const membersToFields = new Map<string, string[][]>();
		// ID of their fronting entry -> Comment texts and dates
		const commentMapping = new Map<string, [Date, string][]>();

		// We sadly need to cache fronts and polls
		const _notes: SimplyPluralNote[] = [];
		const _frontHistoryEntries: SimplyPluralFrontHistory[] = [];
		const _boardMessages: SimplyPluralBoardMessage[] = [];
		const _polls: SimplyPluralPoll[] = [];

		// WIPE AMPERSAND
		for (const table of Object.values(getTables()))
			await table.setAside(asideToken);

		// Create a dummy system (we will update it later)
		const _system = await newSystem({
			name: "Simply Plural",
			description: "",
			isPinned: false,
			isArchived: false,
			viewInLists: false
		});

		if (!transactionSucceeded(_system))
			throw new Error(`Could not add a dummy system: ${_system.err.message}`);

		appConfig.defaultSystem = _system.detail;

		const jsonStream = intoStream(path, undefined, true)
			.pipeThrough(parseJsonStreamWithPaths([[
				"users",
				"groups",
				"customFields",
				"frontHistory",
				"notes",
				"comments",
				"polls",
				"members",
				"frontStatuses",
				"boardMessages",
				"automatedReminders"
			]]));

		// Add values to database
		for await (const { path, value } of streamToIterable(jsonStream)){
			switch(path[0]){
				case "users": {
					await system(appConfig.defaultSystem, value as unknown as SimplyPluralUser);
					break;
				}
				case "groups": {
					const [ uuid, members ] = await tag(value as unknown as SimplyPluralGroup);
					tagsToMembers.set(uuid, members);
					break;
				}
				case "customFields": {
					await customField(value as unknown as SimplyPluralCustomField, customFieldMapping);
					break;
				}
				case "frontHistory": {
					_frontHistoryEntries.push(value as unknown as SimplyPluralFrontHistory);
					break;
				}
				case "notes": {
					_notes.push(value as unknown as SimplyPluralNote);
					break;
				}
				case "comments": {
					const spComment = value as unknown as SimplyPluralComment;
					if (spComment.collection !== "frontHistory") continue;

					commentMapping.getOrInsert(spComment.documentId, []).push([
						new Date(spComment.text),
						spComment.text
					]);
					break;
				}
				case "polls": {
					_polls.push(value as unknown as SimplyPluralPoll);
					break;
				}
				case "members": {
					const [ uuid, id, fields ] = await member(value as unknown as SimplyPluralMember);
					memberMapping.set(id, uuid);
					membersToFields.set(uuid, fields);
					break;
				}
				case "frontStatuses": {
					const [uuid, id ] = await customFront(value as unknown as SimplyPluralFrontStatus);
					memberMapping.set(id, uuid);
					break;
				}
				case "boardMessages": {
					_boardMessages.push(value as unknown as SimplyPluralBoardMessage);
					break;
				}
				case "automatedReminders": {
					await reminder(value as unknown as SimplyPluralAutomatedReminder);
					break;
				}
			}
		}

		// add stuff we had to cache ( :( )
		for (const _note of _notes)
			await journalPost(_note, memberMapping);

		for (const front of _frontHistoryEntries)
			await frontingEntry(front, memberMapping, commentMapping);

		for (const _message of _boardMessages)
			await boardMessage(_message, memberMapping);

		for (const _poll of _polls)
			await poll(_poll, memberMapping);

		// remap now
		for await (const system of getSystems()){
			if (!system.description || system.description.match(/<###@(\w+)###>/) === null) continue;

			const result = await updateSystem({
				uuid: system.uuid,
				description: system.description.replace(/<###@(\w+)###>/g, (_, p1) => `@<m:${memberMapping.get(p1) || nilUid}>`)
			});

			if (!transactionSucceeded(result))
				throw new Error(`Could not update a system: ${result.err.message}`);
		}

		for await (const member of getMembers()) {
			const spId = memberMapping.entries().find(([_id, uuid]) => uuid === member.uuid)?.[0];
			const fields = membersToFields.get(member.uuid)?.map(([id, value]) => {
				const mapped = customFieldMapping.get(id);
				if(!mapped) return;

				return [
					mapped[0],
					mapCustomFieldType(mapped[1] as SimplyPluralCustomField["type"], value)
						.replace(/<###@(\w+)###>/g, (_, p1) => `@<m:${memberMapping.get(p1) || nilUid}>`)
				] as [string, string];
			}).filter(x => !!x);

			if (
				!spId ||
				(!member.description || member.description.match(/<###@(\w+)###>/) === null) &&
				!fields
			) continue;

			const result = await updateMember({
				uuid: member.uuid,
				tags: Array.from(tagsToMembers.entries().filter(x => x[1].includes(spId)).map(x => x[0])),
				description: member.description?.replace(/<###@(\w+)###>/g, (_, p1) => `@<m:${memberMapping.get(p1) || nilUid}>`),
				customFields: fields ? new Map(fields) : undefined
			});

			if (!transactionSucceeded(result))
				throw new Error(`Could not update a member: ${result.err.message}`);
		}

		for await (const boardMessage of getBoardMessages()) {
			if (!boardMessage.body || boardMessage.body.match(/<###@(\w+)###>/) === null) continue;

			const result = await updateBoardMessage({
				uuid: boardMessage.uuid,
				body: boardMessage.body.replace(/<###@(\w+)###>/g, (_, p1) => `@<m:${memberMapping.get(p1) || nilUid}>`)
			});

			if (!transactionSucceeded(result))
				throw new Error(`Could not update a message on board: ${result.err.message}`);
		}

		for await (const post of getJournalPosts()){
			if (post.body.match(/<###@(\w+)###>/) === null) continue;

			const result = await updateJournalPost({
				uuid: post.body,
				body: post.body.replace(/<###@(\w+)###>/g, (_, p1) => `@<m:${memberMapping.get(p1) || nilUid}>`)
			});

			if (!transactionSucceeded(result))
				throw new Error(`Could not update a post: ${result.err.message}`);
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

		for (const table of Object.values(getTables())) {
			try {
				await table.restoreFromAside(asideToken);
			} catch (_e) {
				console.error(`Couldn't even restore from aside: ${_e as Error}`);
			}
		}

		return false;
	}

	return true;
}