import { UUIDable, Member, FrontingEntry, FrontingEntryComplete, UUID } from "../entities";

const impl = await import('../impl/dexie/frontingEntries');

export function getFrontingEntries(){
	return impl.getFrontingEntries();
}

export function toFrontingEntryComplete(frontingEntry: FrontingEntry): Promise<FrontingEntryComplete> {
	return impl.toFrontingEntryComplete(frontingEntry);
}

export function newFrontingEntry(frontingEntry: Omit<FrontingEntry, keyof UUIDable>) {
	return impl.newFrontingEntry(frontingEntry);
}

export function removeFrontingEntry(uuid: UUID){
	return impl.removeFrontingEntry(uuid);
}

export function updateFrontingEntry(uuid: UUID, newContent: Partial<FrontingEntry>){
	return impl.updateFrontingEntry(uuid, newContent);
}

export function removeFronter(member: Member) {
	return impl.removeFronter(member)
}

export function setMainFronter(member: Member, value: boolean){
	return impl.setMainFronter(member, value)
}

export function setSoleFronter(member: Member) {
	return impl.setSoleFronter(member);
}

export function getCurrentFrontEntryForMember(member: Member){
	return impl.getCurrentFrontEntryForMember(member);
}

export function getMainFronter(){
	return impl.getMainFronter();
}

export function getFronting() {
	return impl.getFronting();
}