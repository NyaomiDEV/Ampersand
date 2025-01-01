import { Reminder, UUIDable } from '../entities';

const impl = await (/*"isTauri" in window ? import('../impl/tauri/reminders') : */import('../impl/dexie/reminders'));

export function newReminder(reminder: Omit<Reminder, keyof UUIDable>) {
	return impl.newReminder(reminder);
}
