// NON EXHAUSTIVE - USED ONLY FOR IMPORTING PURPOSES

export type PluralKitExport = {
	version: number,
	id: string,
	uuid: string,
	name: string,
	description?: string,
	tag?: string,
	pronouns?: string | null,
	avatar_url?: string | null,
	banner?: string | null,
	color?: string | null,
	created: string, // ISO 8601
	webhook_url?: string | null,
	privacy: PluralKitSystemPrivacy,
	config: PluralKitConfig,
	accounts: number[],
	groups: PluralKitGroup[],
	members: PluralKitMember[],
	switches: PluralKitSwitch[]
};

export type PluralKitPrivacyEnum = "public" | "private";

export type PluralKitSystemPrivacy = {
	name_privacy: PluralKitPrivacyEnum,
	avatar_privacy: PluralKitPrivacyEnum,
	description_privacy: PluralKitPrivacyEnum,
	banner_privacy: PluralKitPrivacyEnum,
	pronoun_privacy: PluralKitPrivacyEnum,
	member_list_privacy: PluralKitPrivacyEnum,
	group_list_privacy: PluralKitPrivacyEnum,
	front_privacy: PluralKitPrivacyEnum,
	front_history_privacy: PluralKitPrivacyEnum
};

export type PluralKitMemberPrivacy = {
	visibility: PluralKitPrivacyEnum,
	name_privacy: PluralKitPrivacyEnum,
	description_privacy: PluralKitPrivacyEnum,
	banner_privacy: PluralKitPrivacyEnum,
	birthday_privacy: PluralKitPrivacyEnum,
	pronoun_privacy: PluralKitPrivacyEnum,
	avatar_privacy: PluralKitPrivacyEnum,
	metadata_privacy: PluralKitPrivacyEnum,
	proxy_privacy: PluralKitPrivacyEnum
};

export type PluralKitGroupPrivacy = {
	name_privacy: PluralKitPrivacyEnum
	description_privacy: PluralKitPrivacyEnum
	banner_privacy: PluralKitPrivacyEnum
	icon_privacy: PluralKitPrivacyEnum
	list_privacy: PluralKitPrivacyEnum
	metadata_privacy: PluralKitPrivacyEnum
	visibility: PluralKitPrivacyEnum;
};

export type PluralKitConfig = {
	timezone: string,
	pings_enabled: boolean,
	latch_timeout: number,
	member_default_private: boolean,
	group_default_private: boolean,
	show_private_info: boolean,
	member_limit: number,
	group_limit: number,
	case_sensitive_proxy_tags: boolean,
	proxy_error_message_enabled: boolean,
	hid_display_split: boolean,
	hid_display_caps: boolean,
	hid_list_padding: string,
	card_show_color_hex: boolean,
	proxy_switch: string,
	name_format: boolean,
	description_templates: []
};

export type PluralKitGroup = {
	id: string,
	uuid: string,
	name: string,
	display_name?: string,
	description?: string | null,
	icon?: string | null,
	banner?: string | null,
	color?: string | null, // hex but it doesn't have # at the start
	created: string // ISO
	members: string[] // array of pk id,
	privacy: PluralKitGroupPrivacy
};

export type PluralKitMember = {
	id: string,
	uuid: string,
	name: string,
	display_name?: string,
	color?: string | null, // hex but it doesn't have # at the start
	birthday?: string | null,
	pronouns?: string | null,
	avatar_url?: string | null,
	webhook_avatar_url?: string | null,
	banner?: string | null,
	description?: string | null,
	created: string,
	keep_proxy: boolean,
	tts: boolean,
	autoproxy_enabled: boolean,
	message_count: number,
	last_message_timestamp?: string | null,
	proxy_tags: PluralKitProxyTag[],
	privacy: PluralKitMemberPrivacy
};

export type PluralKitProxyTag = {
	prefix?: string | null,
	suffix?: string | null
};

export type PluralKitSwitch = {
	timestamp: string, // ISO date
	members: string[] // related to member ID
};