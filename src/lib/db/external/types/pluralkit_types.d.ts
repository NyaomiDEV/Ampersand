// NON EXHAUSTIVE - USED ONLY FOR IMPORTING PURPOSES

export type PluralKitExport = {
	name: string,
	description?: string,
	avatar_url?: string,
	groups: PluralKitGroup[],
	members: PluralKitMember[],
	switches: PluralKitSwitch[]
};

export type PluralKitGroup = {
	id: string,
	name: string,
	display_name?: string,
	description?: string | null,
	color?: string | null, // hex but it doesn't have # at the start
	members: string[] // array of pk id
};

export type PluralKitMember = {
	id: string,
	name: string,
	display_name?: string,
	avatar_url?: string | null,
	banner?: string | null,
	description?: string | null,
	pronouns?: string | null,
	created: string,
	color?: string | null, // hex but it doesn't have # at the start
};

export type PluralKitSwitch = {
	timestamp: string, // ISO date
	members: string[] // related to member ID
};