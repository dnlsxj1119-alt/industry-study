-- Shared cache for the 지도 (knowledge map) tab.
-- Vectors are computed once in someone's browser and stored here, so other
-- members load them instantly instead of downloading the AI model again.
-- Safe to run more than once. Run it in the Supabase Dashboard SQL Editor.

CREATE TABLE IF NOT EXISTS embeddings (
  id text primary key,                 -- 'post:<uuid>' or 'pres:<uuid>'
  hash text not null,                  -- hash of the embedded text; changes when the post is edited
  model text not null,                 -- embedding model name, so a model change triggers recompute
  vector jsonb not null,               -- number[] (384 dims)
  updated_at timestamptz not null default now()
);

-- Same trust model as the other tables (no real auth, members pick a name).
ALTER TABLE embeddings DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON embeddings TO anon, authenticated;
