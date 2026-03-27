import { AccessibilityConfig, AppConfig, SecurityConfig } from "../../config/types";
import { Serialized } from "../../serialization";
import { BoardMessage, FrontingEntry, JournalPost, Member, Reminder, System, Tag, Asset, CustomField } from "../entities";

export interface DatabaseExport {
	config: {
		appConfig: AppConfig,
		accessibilityConfig: AccessibilityConfig,
		securityConfig: SecurityConfig
	},
	database: {
		boardMessages: BoardMessage[],
		frontingEntries: FrontingEntry[],
		journalPosts: JournalPost[],
		members: Member[],
		reminders: Reminder[],
		systems: System[],
		tags: Tag[],
		assets: Asset[],
		customFields: CustomField[]
	}
}

export type SerializedDatabaseExport = Serialized<DatabaseExport>;