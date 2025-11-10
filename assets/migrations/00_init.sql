CREATE TABLE IF NOT EXISTS board_messages (
	id BLOB CHECK(length(id) = 16) PRIMARY KEY,
	member BLOB CHECK(length(member) = 16) NOT NULL REFERENCES members,
	title TEXT NOT NULL,
	body TEXT NOT NULL,
	date DATETIME NOT NULL,
	is_pinned BOOLEAN,
	is_archived BOOLEAN NOT NULL,
	poll BLOB CHECK(length(poll) = 16) REFERENCES polls
);

CREATE TABLE IF NOT EXISTS polls (
	id BLOB CHECK(length(id) = 16) PRIMARY KEY,
	multiple_choice BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS poll_entries (
	id BLOB CHECK(length(id) = 16) PRIMARY KEY,
	poll BLOB CHECK(length(poll) = 16) NOT NULL REFERENCES polls,
	choice TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS votes (
	id BLOB CHECK(length(id) = 16) PRIMARY KEY,
	poll_entry BLOB CHECK(length(poll_entry) = 16) NOT NULL REFERENCES poll_entries,
	member BLOB CHECK(length(member) = 16) NOT NULL REFERENCES members,
	reason TEXT
);

CREATE TABLE IF NOT EXISTS fronting_entries (
	id BLOB CHECK(length(id) = 16) PRIMARY KEY,
	member BLOB CHECK(length(member) = 16) NOT NULL REFERENCES members,
	start_time DATETIME NOT NULL,
	end_time DATETIME,
	is_main_fronter BOOLEAN NOT NULL,
	is_locked BOOLEAN NOT NULL,
	custom_status TEXT,
	influencing BLOB CHECK(length(influencing) = 16) REFERENCES members,
	comment TEXT
);

CREATE TABLE IF NOT EXISTS journal_posts (
	id BLOB CHECK(length(id) = 16) PRIMARY KEY,
	member BLOB CHECK(length(member) = 16) REFERENCES members,
	date DATETIME NOT NULL,
	title TEXT NOT NULL,
	subtitle TEXT,
	body TEXT NOT NULL,
	cover BLOB CHECK(length(cover) = 16) REFERENCES files,
	is_pinned BOOLEAN NOT NULL,
	is_private BOOLEAN NOT NULL,
	content_warning TEXT
);

CREATE TABLE IF NOT EXISTS journal_post_tags (
	id BLOB CHECK(length(id) = 16) PRIMARY KEY,
	post BLOB CHECK(length(post) = 16) NOT NULL REFERENCES journal_posts,
	tag BLOB CHECK(length(tag) = 16) NOT NULL REFERENCES tags
);

CREATE TABLE IF NOT EXISTS members (
	id BLOB CHECK(length(id) = 16) PRIMARY KEY,
	name TEXT NOT NULL,
	pronouns TEXT,
	description TEXT,
	role TEXT,
	image BLOB CHECK(length(image) = 16) REFERENCES files,
	cover BLOB CHECK(length(cover) = 16) REFERENCES files,
	color TEXT,
	is_pinned BOOLEAN,
	is_archived BOOLEAN NOT NULL,
	is_custom_front BOOLEAN NOT NULL,
	date_created DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS member_tags (
	id BLOB CHECK(length(id) = 16) PRIMARY KEY,
	member BLOB CHECK(length(member) = 16) NOT NULL REFERENCES members,
	tag BLOB CHECK(length(tag) = 16) NOT NULL REFERENCES tags
);

CREATE TABLE IF NOT EXISTS systems (
	id BLOB CHECK(length(id) = 16) PRIMARY KEY,
	name TEXT NOT NULL,
	description TEXT,
	image BLOB CHECK(length(image) = 16) REFERENCES files
);

CREATE TABLE IF NOT EXISTS tags (
	id BLOB CHECK(length(id) = 16) PRIMARY KEY,
	name TEXT NOT NULL,
	description TEXT,
	type BLOB CHECK(length(type) = 16) NOT NULL REFERENCES tag_types,
	color TEXT,
	view_in_lists BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS tag_types (
	id BLOB CHECK(length(id) = 16) PRIMARY KEY,
	label TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS assets (
	id BLOB CHECK(length(id) = 16) PRIMARY KEY,
	file BLOB CHECK(length(file) = 16) NOT NULL REFERENCES files,
	friendly_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS files (
	id BLOB CHECK(length(id) = 16) PRIMARY KEY,
	path TEXT NOT NULL,
	friendly_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS custom_fields (
	id BLOB CHECK(length(id) = 16) PRIMARY KEY,
	name TEXT NOT NULL,
	priority INT NOT NULL,
	is_default BOOLEAN
);

CREATE TABLE IF NOT EXISTS custom_field_data (
	id BLOB CHECK(length(id) = 16) PRIMARY KEY,
	member BLOB CHECK(length(member) = 16) NOT NULL REFERENCES members,
	field BLOB CHECK(length(field) = 16) NOT NULL REFERENCES custom_fields,
	value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS migrations (
	id BIGSERIAL PRIMARY KEY,
	filename TEXT NOT NULL
);
