ALTER TABLE board_messages RENAME COLUMN member TO member_bak;
ALTER TABLE board_messages ADD COLUMN member BLOB CHECK(length(member) = 16) REFERENCES members;
UPDATE board_messages SET member = member_bak;
ALTER TABLE board_messages DROP COLUMN member_bak;

ALTER TABLE board_messages RENAME COLUMN title TO title_bak;
ALTER TABLE board_messages ADD COLUMN title TEXT;
UPDATE board_messages SET title = title_bak;
ALTER TABLE board_messages DROP COLUMN title_bak;