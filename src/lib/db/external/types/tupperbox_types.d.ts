export interface TupperboxExport {
	groups: Group[],
	tuppers: Tupper[]
}

export interface Group {
	id: number,
	name: string,
	description: string | null,
}

export interface Tupper {
	name: string,
	avatar_url: string | null,
	banner: string | null,
	description: string | null,
	pronouns: string | null,
	created_at: string
	group_id: number | null
}