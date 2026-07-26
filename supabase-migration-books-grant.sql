-- Fixes "Failed to load resource: 401" errors when saving a book.
-- The `books` table exists and RLS is disabled, but the anon/authenticated
-- roles used by the app's API key never got table-level privileges granted
-- (a separate thing from RLS policies). Run this once in the Supabase
-- Dashboard SQL Editor.

GRANT ALL ON TABLE books TO anon, authenticated, service_role;
