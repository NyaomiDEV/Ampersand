import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUIDable, Reminder, UUID } from "../entities";
import { TransactionStatus } from "../types";

export async function* getReminders(maxIter = 20){
	const uuids = db.reminders.index.map(x => x.uuid);
	
	const f = (offset: number, maxIter: number) => {
		const chunk: Promise<Reminder>[] = [];
		for (let i = offset; i < offset + maxIter; i++) {
			if (uuids[i]) {
				const data = db.reminders.get(uuids[i]);
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

export async function newReminder(reminder: Omit<Reminder, keyof UUIDable>): Promise<TransactionStatus<string>> {
	try{
		const uuid = window.crypto.randomUUID();
		const result = await db.reminders.add({
			...reminder,
			uuid
		} as Reminder);

		if(!result) throw new Error("already exists in database");

		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "reminders",
			event: "new",
			uuid,
			newData: reminder
		}));

		return { success: true, detail: uuid };
	}catch(_e){
		console.error(_e);
		return { success: false, err: _e };
	}
}

export function getReminder(uuid: UUID){
	return db.reminders.get(uuid);
}

export async function removeReminder(uuid: UUID): Promise<TransactionStatus<void>> {
	try {
		await db.reminders.delete(uuid);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "reminders",
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

export async function updateReminder(newContent: UUIDable & Partial<Reminder>): Promise<TransactionStatus<{ oldData: Reminder, newData: Reminder }>> {
	try{
		const updated = await db.reminders.update(newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "reminders",
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
