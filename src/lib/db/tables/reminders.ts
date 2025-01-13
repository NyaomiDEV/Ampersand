import { Reminder, UUID, UUIDable } from '../entities';

const impl = await ("isTauri" in window ? import('../impl/tauri/reminders') : import('../impl/dexie/reminders'));

export function getReminders(){
	return impl.getReminders();
}

export function newReminder(reminder: Omit<Reminder, keyof UUIDable>) {
	return impl.newReminder(reminder);
}

export function removeReminder(uuid: UUID){
	return impl.removeReminder(uuid);
}

export function updateReminder(uuid: UUID, newContent: Partial<Reminder>) {
	return impl.updateReminder(uuid, newContent);
}
