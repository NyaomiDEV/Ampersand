import { broadcastEvent } from "../native/plugin";
import { DatabaseEventData } from "./types";
import { appConfig } from "../config";
import { deleteFile } from "../json";

export const DatabaseEvents = new EventTarget();

export class DatabaseEvent extends Event {
	data: DatabaseEventData;
	constructor(type: "updated", data: DatabaseEventData) {
		super(type);
		this.data = data;
	}
}

DatabaseEvents.addEventListener("updated", (event) => {
	if(!appConfig.useIPC) return;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let eventName: string, payload: any;
	switch ((event as DatabaseEvent).data.table){
		case "boardMessages":
			eventName = "boardMessage";
			break;
		case "files":
			eventName = "file";
			break;
		case "frontingEntries":
			eventName = "frontingEntry";
			break;
		case "journalPosts":
			eventName = "journalPost";
			break;
		case "members":
			eventName = "member";
			break;
		case "systems":
			eventName = "system";
			break;
		case "tags":
			eventName = "tag";
			break;
		case "assets":
			eventName = "asset";
			break;
		case "customFields":
			eventName = "customField";
			break;
		case "polls":
			eventName = "poll";
			break;
		case "pollEntries":
			eventName = "pollEntry";
			break;
		case "votes":
			eventName = "vote";
			break;
		case "presenceEntries":
			eventName = "presenceEntry";
			break;
		case "customFieldData":
			eventName = "customFieldDatum";
			break;
		case "memberTags":
			eventName = "memberTag";
			break;
		case "journalPostTags":
			eventName = "journalPostTag";
			break;
	}

	switch ((event as DatabaseEvent).data.event){
		case "new":
			eventName += "_added";
			payload = (event as DatabaseEvent).data.newData;
			break;
		case "modified":
			eventName += "_modified";
			payload = (event as DatabaseEvent).data.newData;
			break;
		case "deleted":
			eventName += "_removed";
			payload = { uuid: (event as DatabaseEvent).data.id };
			break;
	}

	void broadcastEvent(eventName, deleteFile(payload));
});