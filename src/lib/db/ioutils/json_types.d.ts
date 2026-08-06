import { AccessibilityConfig, AppConfig, SecurityConfig } from "../../config/types";
import type { UUID, BoardMessage, FrontingEntry, JournalPost, Member, System, Asset, FilterQuery, Comment, Note } from "../entities.d.ts";

export interface DatabaseJSON {
	revision: {
		count: number, // number of commits (git) since app inception
		humanReadable: string; // marketed version eg. 0.3.0 or for unstable builds 0.2.1+500
	},
	config: {
		appConfig: AppConfig,
		accessibilityConfig: AccessibilityConfig,
		securityConfig: SecurityConfig
	},
	database: {
		boardMessages: BoardMessageJSON[],
		frontingEntries: FrontingEntryJSON[],
		journalPosts: JournalPostJSON[],
		members: MemberJSON[],
		reminders: ReminderJSON[],
		systems: SystemJSON[],
		tags: TagJSON[],
		assets: AssetJSON[],
		customFields: CustomFieldJSON[],
		notes: NoteJSON[],
		filterQueries: FilterQueryJSON[]
	}
}

export interface CommentJSON extends Comment {
	date: string, // ISO 8601
	replyTo?: string // ISO 8601
}

export interface BoardMessageJSON extends BoardMessage {
	date: string // ISO 8601
	comments?: CommentJSON[],
	dateCreated: string; // ISO 8601
}

export interface FrontingEntryJSON extends FrontingEntry {
	startTime: string, // ISO 8601
	endTime?: string, // ISO 8601
	presence?: Record<string, number> // ISO 8601, number
	comments?: CommentJSON[],
	dateCreated: string; // ISO 8601

}

export interface JournalPostJSON extends JournalPost {
	date: string, // ISO 8601
	cover?: string, // Data URI
	comments?: CommentJSON[],
	dateCreated: string; // ISO 8601

}

export interface MemberJSON extends Member {
	image?: string, // Data URI
	cover?: string, // Data URI
	customFields?: Record<UUID, string>,
	dateCreated: string // ISO 8601
}

export interface ReminderJSON extends Reminder {
	dateCreated: string; // ISO 8601
}

export interface SystemJSON extends System {
	cover?: string, // Data URI
	image?: string, // Data URI
	dateCreated: string; // ISO 8601
}

export interface TagJSON extends Tag {
	dateCreated: string; // ISO 8601
}

export interface AssetJSON extends Asset {
	file: string; // Data URI
	dateCreated: string; // ISO 8601
}

export interface CustomFieldJSON extends CustomField {
	dateCreated: string; // ISO 8601
}

export interface NoteJSON extends Note {
	dateCreated: string; // ISO 8601
}

export interface FilterQueryJSON extends FilterQuery {
	dateCreated: string; // ISO 8601
}

type SerializableJson<T> = T extends object ? { [k in keyof T]: SerializableJson<T[k]> } : T;