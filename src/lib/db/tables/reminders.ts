import { Reminder, UUID, UUIDable } from '../entities';

import * as impl from '../impl/tauri/reminders';

export function getReminders(){
	return impl.getReminders();
}

export function newReminder(reminder: Omit<Reminder, keyof UUIDable>) {
	return impl.newReminder(reminder);
}

export function getReminder(uuid: UUID){
	return impl.getReminder(uuid)
}

export function removeReminder(uuid: UUID){
	return impl.removeReminder(uuid);
}

export function updateReminder(uuid: UUID, newContent: Partial<Reminder>) {
	return impl.updateReminder(uuid, newContent);
}
