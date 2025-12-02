export type TableName =
	"board_messages" |
	"polls" |
	"poll_entries" |
	"votes" |
	"fronting_entries" |
	"presence_entries" |
	"journal_posts" |
	"members" |
	"custom_fields" |
	"custom_field_data" |
	"systems" |
	"tags" |
	"member_tags" |
	"journal_post_tags" |
	"assets";

export type TableNameCamelCase =
	"boardMessages" |
	"polls" |
	"pollEntries" |
	"votes" |
	"frontingEntries" |
	"presenceEntries" |
	"journalPosts" |
	"members" |
	"customFields" |
	"customFieldData" |
	"systems" |
	"tags" |
	"memberTags" |
	"journalPostTags" |
	"assets";

export type DatabaseEventData = {
	table: TableNameCamelCase,
	event: "new" | "modified" | "deleted",
	id: string,
	delta?: unknown,
	oldData?: unknown,
	newData?: unknown
};

export type TableIter<T> = {
	result: T,
	end: boolean
};