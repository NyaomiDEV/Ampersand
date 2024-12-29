import { db } from ".";
import { makeUUIDv5 } from "../../../util/uuid";
import { UUIDable, Member, FrontingEntry, FrontingEntryComplete } from "../../entities";
import { getSystemUUID } from "./system";
import { getMembersTable } from "./members";

export function getFrontingEntriesTable(){
	return db.frontingEntries;
}

export async function toFrontingEntryComplete(frontingEntry: FrontingEntry): Promise<FrontingEntryComplete> {
	const member = (await getMembersTable().get(frontingEntry.member))!;
	return { ...frontingEntry, member };
}

async function genid(name: string) {
	return makeUUIDv5((await getSystemUUID())!, `frontingEntries\0${name}`);
}

export async function newFrontingEntry(frontingEntry: Omit<FrontingEntry, keyof UUIDable>) {
	const uuid = await genid(frontingEntry.member + frontingEntry.startTime.getTime());
	return await getFrontingEntriesTable().add({
		...frontingEntry,
		uuid
	});
}

export async function removeFronter(member: Member) {
	const f = await getCurrentFrontEntryForMember(member);
	if(!f) return;

	await getFrontingEntriesTable().update(f.uuid, {
		endTime: new Date()
	});
}

export async function setMainFronter(member: Member, value: boolean){
	const f = await getCurrentFrontEntryForMember(member);
	if (!f) return;

	if(value){
		const toUpdate = (await getFrontingEntriesTable().filter(x => !x.endTime && x.member !== member.uuid).toArray()).map(x => x.uuid);

		for (const uuid of toUpdate) {
			await getFrontingEntriesTable().update(uuid, {
				isMainFronter: false
			});
		}
	}

	await getFrontingEntriesTable().update(f.uuid, {
		isMainFronter: value
	});
}

export async function setSoleFronter(member: Member) {
	const toUpdate = (await getFrontingEntriesTable().filter(x => !x.endTime && x.member !== member.uuid).toArray()).map(x => x.uuid);
	const endTime = new Date();

	for(const uuid of toUpdate){
		await getFrontingEntriesTable().update(uuid, {
			endTime
		});
	}

	if(!getCurrentFrontEntryForMember(member)){
		await newFrontingEntry({
			member: member.uuid,
			startTime: endTime,
			isMainFronter: false
		});
	}
}

export async function getCurrentFrontEntryForMember(member: Member){
	return await getFrontingEntriesTable().filter(x => x.endTime === undefined && x.member === member.uuid).first();
}

export async function getMainFronter(){
	const mainFronterEntry = await getFrontingEntriesTable().filter(x => x.endTime === undefined && x.isMainFronter).first();
	if(mainFronterEntry){
		return await getMembersTable().get(mainFronterEntry.member);
	}
	return undefined;
}

export async function getFronting() {
	const frontersEntries = await getFrontingEntriesTable().filter(x => x.endTime === undefined).toArray();
	const frontingMembers: Member[] = [];
	for(const entry of frontersEntries){
		const member = await getMembersTable().get(entry.member);
		if(member)
			frontingMembers.push(member);
	}
	return frontingMembers;
}