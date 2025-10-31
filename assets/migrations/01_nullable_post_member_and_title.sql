ALTER TABLE board_messages RENAME COLUMN member member_bak;
ALTER TABLE board_messages ADD COLUMN member BLOB CHECK(length(member) = 16) REFERENCES members;
UPDATE board_messages SET member = member_bak;
ALTER TABLE board_messages DROP COLUMN member_bak;

ALTER TABLE board_messages RENAME COLUMN title title_bak;
ALTER TABLE board_messages ADD COLUMN title TEXT;
UPDATE board_messages SET title = title_bak;
ALTER TABLE board_messages DROP COLUMN title_bak;