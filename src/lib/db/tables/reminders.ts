import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUIDable, Reminder, UUID } from "../entities";
import { TransactionStatus } from "../types";

export function getReminders(){
	return db.reminders.iterate();
}

export async function newReminder(reminder: Omit<Reminder, keyof UUIDable>): Promise<TransactionStatus<string>> {
	try{
		const uuid = window.crypto.randomUUID();
		const result = await db.reminders.add(uuid, {
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

export async function updateReminder(uuid: UUID, newContent: Partial<Reminder>): Promise<TransactionStatus<{ oldData: Reminder, newData: Reminder }>> {
	try{
		const updated = await db.reminders.update(uuid, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "reminders",
				event: "modified",
				uuid,
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
