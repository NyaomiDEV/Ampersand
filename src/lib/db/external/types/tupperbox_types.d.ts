export interface TupperboxExport {
	groups: TupperboxGroup[],
	tuppers: TupperboxMember[]
}

export interface TupperboxGroup {
	id: number,
	name: string,
	description: string | null,
	avatar: string | null,
	tag: string | null
}

export interface TupperboxMember {
	id: number,
	name: string,
	brackets: string[],
	avatar_url: string,
	avatar: string | null,
	banner: string | null,
	posts: number,
	show_brackets: boolean,
	birthday: string | null, // ISO
	description: string | null,
	tag: string | null,
	nick: string | null,
	pronouns: string | null,
	created_at: string | null, // ISO
	group_id: number | null,
	last_used: string | null // ISO
}