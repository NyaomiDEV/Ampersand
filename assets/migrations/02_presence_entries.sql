CREATE TABLE IF NOT EXISTS presence_entries (
	id BLOB CHECK(length(id) = 16) PRIMARY KEY,
	fronting_entry BLOB CHECK(length(fronting_entry) = 16) NOT NULL REFERENCES fronting_entries,
	presence INTEGER CHECK(presence >0 AND presence <=10) NOT NULL
);