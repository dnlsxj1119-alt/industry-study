-- Relaxes the books table to match the simplified form:
-- only title (always) and core_topic (for 읽는 중/완독) are required now.
-- Also adds a `content` column for freeform book content notes, and merges
-- "배운 점" + "내 삶에 적용할 점" into a single `learning` field going forward
-- (the old `application` column is left in place, unused, so no data is lost).

ALTER TABLE books ALTER COLUMN author DROP NOT NULL;
ALTER TABLE books ALTER COLUMN category DROP NOT NULL;
ALTER TABLE books ADD COLUMN IF NOT EXISTS content text;
