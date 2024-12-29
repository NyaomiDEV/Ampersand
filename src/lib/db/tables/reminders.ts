import { Reminder, UUIDable } from '../entities';

const impl = await import('../impl/dexie/reminders');

export function getRemindersTable() {
	return impl.getRemindersTable();
}

export function newReminder(reminder: Omit<Reminder, keyof UUIDable>) {
	return impl.newReminder(reminder);
}
