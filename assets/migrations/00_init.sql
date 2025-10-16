CREATE TABLE IF NOT EXISTS board_messages (
    id BIGSERIAL PRIMARY KEY,
    member BIGINT NOT NULL REFERENCES members,
	title TEXT NOT NULL,
	body TEXT NOT NULL,
	date DATETIME NOT NULL,
	is_pinned BOOLEAN,
	is_archived BOOLEAN NOT NULL,
	poll BIGINT REFERENCES polls
);

CREATE TABLE IF NOT EXISTS polls (
    id BIGSERIAL PRIMARY KEY,
	multiple_choice BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS poll_entries (
    id BIGSERIAL PRIMARY KEY,
    poll BIGINT NOT NULL REFERENCES polls,
	choice TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS votes (
    id BIGSERIAL PRIMARY KEY,
    poll_entry BIGINT NOT NULL REFERENCES poll_entries,
    member BIGINT NOT NULL REFERENCES members,
	reason TEXT
);

CREATE TABLE IF NOT EXISTS fronting_entries (
    id BIGSERIAL PRIMARY KEY,
    member BIGINT NOT NULL REFERENCES members,
	start_time DATETIME NOT NULL,
	end_time DATETIME,
	is_main_fronter BOOLEAN NOT NULL,
	is_locked BOOLEAN NOT NULL,
	custom_status TEXT,
	influencing BIGINT REFERENCES members,
	comment TEXT
);

CREATE TABLE IF NOT EXISTS journal_posts (
    id BIGSERIAL PRIMARY KEY,
    member BIGINT NOT NULL REFERENCES members,
	date DATETIME NOT NULL,
	title TEXT NOT NULL,
	subtitle TEXT,
	body TEXT NOT NULL,
    cover BIGINT REFERENCES files,
	is_pinned BOOLEAN NOT NULL,
	is_private BOOLEAN NOT NULL,
	content_warning TEXT
);

CREATE TABLE IF NOT EXISTS journal_post_tags (
    id BIGSERIAL PRIMARY KEY,
    post BIGINT NOT NULL REFERENCES journal_posts,
    tag BIGINT NOT NULL REFERENCES tags
);

CREATE TABLE IF NOT EXISTS members (
    id BIGSERIAL PRIMARY KEY,
	name TEXT NOT NULL,
	pronouns TEXT,
	description TEXT,
	role TEXT,
    image BIGINT REFERENCES files,
    cover BIGINT REFERENCES files,
	color TEXT,
	is_pinned BOOLEAN,
	is_archived BOOLEAN NOT NULL,
	is_custom_front BOOLEAN NOT NULL,
	date_created DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS member_tags (
    id BIGSERIAL PRIMARY KEY,
    member BIGINT NOT NULL REFERENCES members,
    tag BIGINT NOT NULL REFERENCES tags
);

CREATE TABLE IF NOT EXISTS systems (
    id BIGSERIAL PRIMARY KEY,
	name TEXT NOT NULL,
	description TEXT,
    image BIGINT REFERENCES files
);

CREATE TABLE IF NOT EXISTS tags (
    id BIGSERIAL PRIMARY KEY,
	name TEXT NOT NULL,
	description TEXT,
    type BIGINT NOT NULL REFERENCES tag_types,
	color TEXT,
	view_in_lists BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS tag_types (
    id BIGSERIAL PRIMARY KEY,
    label TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS assets (
    id BIGSERIAL PRIMARY KEY,
    file BIGINT NOT NULL REFERENCES files,
	friendly_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS files (
    id BIGSERIAL PRIMARY KEY,
	path TEXT NOT NULL,
	friendly_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS custom_fields (
    id BIGSERIAL PRIMARY KEY,
	name TEXT NOT NULL,
	priority INT NOT NULL,
	is_default BOOLEAN
);

CREATE TABLE IF NOT EXISTS custom_field_data (
    id BIGSERIAL PRIMARY KEY,
    field BIGINT NOT NULL REFERENCES custom_fields,
    value TEXT NOT NULL
);