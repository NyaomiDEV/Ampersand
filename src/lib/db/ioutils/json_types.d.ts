import { AccessibilityConfig, AppConfig, SecurityConfig } from "../../config/types";
import type { BoardMessage, FrontingEntry, JournalPost, Member, System, Asset } from "../entities.d.ts";

export interface DatabaseJSON {
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
		//reminders: Reminder[], we're not doing that yet
		systems: SystemJSON[],
		tags: Tag[],
		assets: AssetJSON[],
		customFields: CustomField[]
	}
}



export interface BoardMessageJSON extends BoardMessage {
	date: string // ISO 8601
}

export interface FrontingEntryJSON extends FrontingEntry {
	startTime: string, // ISO 8601
	endTime?: string, // ISO 8601
	presence?: Record<string, number> // ISO 8601, number
}

export interface JournalPostJSON extends JournalPost {
	date: string, // ISO 8601
	cover?: string, // Data URI
}

export interface MemberJSON extends Member {
	image?: string, // Data URI
	cover?: string, // Data URI
	customFields?: Record<UUID, string>,
	dateCreated: string // ISO 8601
}

export interface SystemJSON extends System {
	cover?: string, // Data URI
	image?: string, // Data URI
}

export interface AssetJSON extends Asset {
	file: string; // Data URI
}