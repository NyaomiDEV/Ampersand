import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../../events";
import { UUIDable, Member, FrontingEntry, FrontingEntryComplete, UUID } from "../../entities";
import { defaultMember } from "../../tables/members";
import { getMember } from "./members";

export function getFrontingEntries(){
	return db.frontingEntries.toArray();
}

export async function toFrontingEntryComplete(frontingEntry: FrontingEntry): Promise<FrontingEntryComplete> {
	const member = (await getMember(frontingEntry.member)) || defaultMember();
	return { ...frontingEntry, member };
}

export async function newFrontingEntry(frontingEntry: Omit<FrontingEntry, keyof UUIDable>) {
	try{
		const uuid = window.crypto.randomUUID();
		await db.frontingEntries.add(uuid, {
			...frontingEntry,
			uuid
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "frontingEntries",
			event: "new",
			data: uuid
		}));
		return uuid;
	}catch(error){
		return false;
	}
}

export async function deleteFrontingEntry(uuid: UUID) {
	try {
		await db.frontingEntries.delete(uuid);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "frontingEntries",
			event: "deleted",
			data: uuid
		}));
		return true;
	} catch (error) {
		return false;
	}
}

export async function updateFrontingEntry(uuid: UUID, newContent: Partial<FrontingEntry>) {
	try{
		if(newContent.isMainFronter){
			const toUpdate = (await db.frontingEntries.toArray()).filter(x => !x.endTime && x.member !== uuid).map(x => x.uuid);

			for (const _uuid of toUpdate)
				await updateFrontingEntry(_uuid, { isMainFronter: false });
		}

		const updated = await db.frontingEntries.update(uuid, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "frontingEntries",
				event: "modified",
				data: uuid
			}));
			return true;
		}
		return false;
	}catch(error){
		return false;
	}
}

export async function removeFronter(member: Member) {
	const f = await getCurrentFrontEntryForMember(member);
	if(!f) return false;

	return await updateFrontingEntry(f.uuid, { endTime: new Date() });
}

export async function setMainFronter(member: Member, value: boolean){
	const f = await getCurrentFrontEntryForMember(member);
	if (!f) return false;
	
	return await updateFrontingEntry(f.uuid, { isMainFronter: value });
}

export async function setSoleFronter(member: Member) {
	const toUpdate = (await db.frontingEntries.toArray()).filter(x => !x.endTime && x.member !== member.uuid).map(x => x.uuid);
	const endTime = new Date();

	for(const uuid of toUpdate)
		await updateFrontingEntry(uuid, { endTime });

	if(!await getCurrentFrontEntryForMember(member)){
		await newFrontingEntry({
			member: member.uuid,
			startTime: endTime,
			isMainFronter: false
		});
	}
}

export async function getCurrentFrontEntryForMember(member: Member){
	return (await db.frontingEntries.toArray()).filter(x => x.endTime === undefined && x.member === member.uuid)[0];
}

export async function getMainFronter(){
	const mainFronterEntry = (await db.frontingEntries.toArray()).filter(x => x.endTime === undefined && x.isMainFronter)[0];
	if(mainFronterEntry){
		return await getMember(mainFronterEntry.member);
	}
	return undefined;
}

export async function getFronting() {
	const frontersEntries = (await db.frontingEntries.toArray()).filter(x => x.endTime === undefined);
	const frontingMembers: Member[] = [];
	for(const entry of frontersEntries){
		const member = await getMember(entry.member);
		if(member)
			frontingMembers.push(member);
	}
	return frontingMembers;
}