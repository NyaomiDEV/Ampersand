import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUID, UUIDable, Note } from "../entities";
import { filterNote } from "../../search";
import { TransactionStatus } from "../types";
import { sortNotes } from "../../util/misc";

export async function* getNotes(maxIter = 10){
	const uuids = db.notes.index.toSorted(sortNotes).map(x => x.uuid);
	
	const f = (offset: number, maxIter: number) => {
		const chunk: Promise<Note>[] = [];
		for (let i = offset; i < offset + maxIter; i++) {
			if (uuids[i]) {
				const data = db.notes.get(uuids[i]);
				chunk.push(data);
			}
		}
		return chunk;
	};
	
	let offset = 0;
	while (offset < uuids.length) {
		const promises = f(offset, maxIter);
		offset += maxIter;
		for (const promise of promises)
			yield await promise;
	};
}

export async function* getNotesToDisplay(maxIter = 10){
	const uuids = db.notes.index.filter(x => !x.isArchived).sort(sortNotes).map(x => x.uuid);
	
	const f = (offset: number, maxIter: number) => {
		const chunk: Promise<Note>[] = [];
		for (let i = offset; i < offset + maxIter; i++) {
			if (uuids[i]) {
				const data = db.notes.get(uuids[i]);
				chunk.push(data);
			}
		}
		return chunk;
	};
	
	let offset = 0;
	while (offset < uuids.length) {
		const promises = f(offset, maxIter);
		offset += maxIter;
		for (const promise of promises)
			yield await promise;
	};
}

export async function* getFilteredNotes(query: string){
	for await (const note of getNotes()){
		if (filterNote(query, note))
			yield note;
	}
}

export async function newNote(note: Omit<Note, keyof UUIDable>): Promise<TransactionStatus<string>> {
	try{
		const uuid = await db.notes.add(note);

		if(!uuid) throw new Error("already exists in database");

		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "notes",
			event: "new",
			uuid,
			newData: note
		}));
		return { success: true, detail: uuid };
	}catch(_e){
		console.error(_e);
		return { success: false, err: _e };
	}
}

export async function deleteNote(uuid: UUID): Promise<TransactionStatus<void>> {
	try {
		await db.notes.delete(uuid);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "notes",
			event: "deleted",
			uuid,
			delta: {}
		}));
		return { success: true };
	} catch (_e) {
		console.error(_e);
		return { success: false, err: _e };
	}
}

export async function updateNote(newContent: UUIDable & Partial<Note>): Promise<TransactionStatus<{ oldData: Note, newData: Note }>> {
	try{
		const updated = await db.notes.update(newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "notes",
				event: "modified",
				uuid: newContent.uuid,
				delta: newContent,
				oldData: updated.oldData,
				newData: updated.newData
			}));
			return { success: true, detail: updated };
		}
		throw new Error("not updated, did not exist in db");
	}catch(_e){
		console.error(_e);
		return { success: false, err: _e };
	}
}