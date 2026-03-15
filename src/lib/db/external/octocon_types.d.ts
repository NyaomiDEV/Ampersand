export type OctoconExport = {
	user: OctoconUser,
	alters: OctoconAlter[],
	fronts: OctoconFront[],
	tags: OctoconTag[],
	polls: OctoconPoll[]
};

type OctoconUser = {
	id: string, // 7 characters, lowercase, alphabetical
	username?: string,
	description?: string,
	avatar_url?: string,
	fields: OctoconUserField[]
};

type OctoconUserField = {
	id: string,
	name: string,
	type: "text" | "number" | "boolean",
	locked: boolean,
	security_level: "private" | "trusted_only" | "friends_only" | "public"
};

type OctoconAlter = {
	id: number,
	name?: string, // Alters will have null names -> Unnamed alter
	pronouns?: string,
	description?: string,
	color?: string, // HEX RGB (without alpha)
	avatar_url?: string,
	proxy_name?: string,
	discord_proxies: string[], // "prefix-text-suffix"
	fields: OctoconAlterField[]
};

type OctoconAlterField = {
	id: string, // same as OctoconUserField.id
	value: string // always a string, we should parse them afterwards
};

type OctoconFront = {
	id: string,
	alter_id: number, // same as OctoconAlter.id
	comment?: string,
	time_start: string, // UTC ISO-8601, without final Z it seems? Elixir what
	time_end?: string
};

type OctoconTag = {
	id: string,
	name: string,
	description?: string,
	color?: string, // HEX RGB (without alpha)
	security_level: "private" | "trusted_only" | "friends_only" | "public",
	parent_tag_id?: string,
	alters: number[]
};

type OctoconPoll = {
	id: string,
	title: string,
	description: string,
	type: "vote" | "choice",
	data: OctoconPollData,
	time_end?: string, // UTC ISO-8601, without final Z it seems? Elixir what
	inserted_at: string, // UTC ISO-8601, without final Z it seems? Elixir what
	updated_at: string // UTC ISO-8601, without final Z it seems? Elixir what
};

type OctoconPollData = {
	allow_veto?: boolean, // only when poll type is vote
	choice?: OctoconPollChoice[], // only when poll type is choice
	responses: OctoconPollResponse[]
};

type OctoconPollChoice = {
	id: string,
	name: string
};

type OctoconPollResponse = {
	alter_id: number, // related to OctoconAlter.id,
	comment?: string,
	vote?: "yes" | "no" | "abstain" | "veto", // only when poll type is vote
	choice_id?: string // related to OctoconPollChoice.id and only when poll type is choice
};