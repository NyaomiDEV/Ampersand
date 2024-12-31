import { DatabaseEventData } from "./types";

export const DatabaseEvents = new EventTarget();

export class DatabaseEvent extends Event {
	data: DatabaseEventData;
	constructor(type: string, data: DatabaseEventData) {
		super(type);
		this.data = data;
	}
}