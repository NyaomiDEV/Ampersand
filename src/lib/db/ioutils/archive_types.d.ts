import { System } from "typescript";
import { AccessibilityConfig, AppConfig, SecurityConfig } from "../../config/types";
import type { Serialized } from "../../serialization";
import { Asset, BoardMessage, CustomField, FrontingEntry, JournalPost, Member, Tag, UUIDable } from "../entities";

export interface ArchiveStream {
	table: string,
	data: Serialized<unknown>
};

export interface ArchiveStreamDatabase {
	table: string,
	data: Serialized<UUIDable>;
};

export interface ArchiveStreamConfig extends ArchiveStream {
	table: "__config",
	data: Serialized<{
		appConfig: AppConfig,
		securityConfig: SecurityConfig,
		accessibilityConfig: AccessibilityConfig
	}>
}

export interface ArchiveStreamBoardMessage extends ArchiveStream {
	table: "boardMessages",
	data: Serialized<BoardMessage>;
}

export interface ArchiveStreamFrontingEntry extends ArchiveStream {
	table: "frontingEntries",
	data: Serialized<FrontingEntry>;
}

export interface ArchiveStreamJournalPost extends ArchiveStream {
	table: "journalPosts",
	data: Serialized<JournalPost>;
}

export interface ArchiveStreamMember extends ArchiveStream {
	table: "members",
	data: Serialized<Member>;
}

export interface ArchiveStreamSystem extends ArchiveStream {
	table: "systems",
	data: Serialized<System>;
}

export interface ArchiveStreamTag extends ArchiveStream {
	table: "tags",
	data: Serialized<Tag>;
}

export interface ArchiveStreamAsset extends ArchiveStream {
	table: "assets",
	data: Serialized<Asset>;
}

export interface ArchiveStreamCustomField extends ArchiveStream {
	table: "customFields",
	data: Serialized<CustomField>;
}