-- Creates the "bookmarks" table used by the 북마크 (bookmark) feature.
-- Safe to run more than once. Run it in the Supabase Dashboard SQL Editor
-- if your project does not already have this table.

CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author text not null,               -- 북마크한 스터디 멤버
  created_at timestamptz not null default now()
);

-- One bookmark per member per post.
CREATE UNIQUE INDEX IF NOT EXISTS bookmarks_post_author_unique
  ON bookmarks (post_id, author);

-- Same trust model as the other tables (no real auth, members pick a name).
ALTER TABLE bookmarks DISABLE ROW LEVEL SECURITY;
