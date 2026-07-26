-- Add contribution point (기여도) support to the posts table.
-- This project has no Supabase CLI/migration folder set up, so run this
-- script once in the Supabase Dashboard (SQL Editor) against your project.

-- 1. Add the column with a default of 1, so existing rows are backfilled to 1 automatically.
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS contribution_point smallint NOT NULL DEFAULT 1;

-- 2. Restrict values to 1, 2 or 3.
ALTER TABLE posts
  DROP CONSTRAINT IF EXISTS posts_contribution_point_check;
ALTER TABLE posts
  ADD CONSTRAINT posts_contribution_point_check CHECK (contribution_point BETWEEN 1 AND 3);

-- 3. Backfill any rows that may already have NULL (e.g. inserted before the
--    default existed) to 1, just to be safe.
UPDATE posts SET contribution_point = 1 WHERE contribution_point IS NULL;
