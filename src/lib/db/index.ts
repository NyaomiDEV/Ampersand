import { DatabaseEventData } from './types';

const impl = await import('./impl/dexie');

export const DatabaseEvents = new EventTarget();

export class DatabaseEvent extends Event {
	data: DatabaseEventData;
	constructor(type: string, data: DatabaseEventData) {
		super(type);
		this.data = data;
	}
}

export function getTables() {
	return impl.getTables();
}
