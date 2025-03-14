import { UUIDable, Member, FrontingEntry, FrontingEntryComplete, UUID } from "../entities";

const impl = await ("isTauri" in window ? import('../impl/tauri/frontingEntries') : import('../impl/dexie/frontingEntries'));

export function getFrontingEntries(){
	return impl.getFrontingEntries();
}

export function getFrontingEntriesOffset(offset: number, limit?: number){
	return impl.getFrontingEntriesOffset(offset, limit);
}

export function toFrontingEntryComplete(frontingEntry: FrontingEntry): Promise<FrontingEntryComplete> {
	return impl.toFrontingEntryComplete(frontingEntry);
}

export function newFrontingEntry(frontingEntry: Omit<FrontingEntry, keyof UUIDable>) {
	return impl.newFrontingEntry(frontingEntry);
}

export function deleteFrontingEntry(uuid: UUID){
	return impl.deleteFrontingEntry(uuid);
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

export function getRecentlyFronted(){
	return impl.getRecentlyFronted();
}

export function getFrontingEntriesOfDay(date: Date, currentlyFrontingToToday: boolean) {
	return impl.getFrontingEntriesOfDay(date, currentlyFrontingToToday)
}

export function getFrontingEntriesDays() {
	return impl.getFrontingEntriesDays();
}