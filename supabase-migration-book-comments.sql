-- Allows comments and comment-notifications to attach to a book, not just a post.
-- Run this once in the Supabase Dashboard SQL Editor.

ALTER TABLE comments ALTER COLUMN post_id DROP NOT NULL;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS book_id uuid REFERENCES books(id) ON DELETE CASCADE;

ALTER TABLE notifications ALTER COLUMN post_id DROP NOT NULL;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS book_id uuid;
