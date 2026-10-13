import { supabase, isSupabaseConfigured } from './supabase';

// In-browser multilingual embeddings (free, no API key). Vectors are cached in
// localStorage and shared through the Supabase `embeddings` table, so the model
// is only downloaded when some post has not been embedded by anyone yet.
const MODEL = 'Xenova/multilingual-e5-small';
const CACHE_KEY = 'study_board_embeddings_v1';

type Extractor = (
  texts: string[],
  opts: { pooling: 'mean'; normalize: boolean }
) => Promise<{ tolist: () => number[][] }>;

let extractorPromise: Promise<Extractor> | null = null;

function getExtractor(onProgress?: (pct: number) => void): Promise<Extractor> {
  if (!extractorPromise) {
    extractorPromise = import('@huggingface/transformers').then(async ({ pipeline }) => {
      const pipe = await pipeline('feature-extraction', MODEL, {
        progress_callback: (p: { status?: string; progress?: number }) => {
          if (p.status === 'progress' && typeof p.progress === 'number') onProgress?.(p.progress);
        },
      });
      return pipe as unknown as Extractor;
    });
    extractorPromise.catch(() => { extractorPromise = null; });
  }
  return extractorPromise;
}

type Cache = Record<string, { h: string; v: number[] }>;

function readCache(): Cache {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') as Cache;
  } catch {
    return {};
  }
}

function writeCache(cache: Cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // quota / private mode: vectors will simply be recomputed next visit
  }
}

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return String(h);
}

export interface EmbedItem {
  id: string;
  text: string;
}

export async function embedItems(
  items: EmbedItem[],
  onProgress: (done: number, total: number, modelPct?: number) => void
): Promise<Record<string, number[]>> {
  const cache = readCache();
  const result: Record<string, number[]> = {};
  const todo: (EmbedItem & { h: string })[] = [];

  for (const it of items) {
    const h = hash(it.text);
    const hit = cache[it.id];
    if (hit && hit.h === h) result[it.id] = hit.v;
    else todo.push({ ...it, h });
  }
  // Pull vectors other members already computed
  if (todo.length && isSupabaseConfigured) {
    const remote = await fetchShared(todo.map(t => t.id));
    for (let i = todo.length - 1; i >= 0; i--) {
      const r = remote[todo[i].id];
      if (r && r.hash === todo[i].h) {
        result[todo[i].id] = r.vector;
        cache[todo[i].id] = { h: todo[i].h, v: r.vector };
        todo.splice(i, 1);
      }
    }
  }

  onProgress(items.length - todo.length, items.length);
  if (todo.length === 0) {
    pruneAndSave(cache, items);
    return result;
  }

  const extractor = await getExtractor(pct => onProgress(items.length - todo.length, items.length, pct));

  const BATCH = 8;
  for (let i = 0; i < todo.length; i += BATCH) {
    const batch = todo.slice(i, i + BATCH);
    const out = await extractor(batch.map(b => `passage: ${b.text}`), { pooling: 'mean', normalize: true });
    const vecs = out.tolist();
    batch.forEach((b, j) => {
      const v = vecs[j].map(x => Math.round(x * 1e4) / 1e4);
      result[b.id] = v;
      cache[b.id] = { h: b.h, v };
    });
    if (isSupabaseConfigured) await saveShared(batch.map(b => ({ id: b.id, hash: b.h, vector: result[b.id] })));
    onProgress(items.length - todo.length + i + batch.length, items.length);
    await new Promise(r => setTimeout(r, 0));
  }

  pruneAndSave(cache, items);
  return result;
}

function pruneAndSave(cache: Cache, items: EmbedItem[]) {
  // Drop vectors for items that no longer exist
  const live = new Set(items.map(i => i.id));
  for (const k of Object.keys(cache)) if (!live.has(k)) delete cache[k];
  writeCache(cache);
}

type SharedRow = { id: string; hash: string; vector: number[] };

async function fetchShared(ids: string[]): Promise<Record<string, SharedRow>> {
  const out: Record<string, SharedRow> = {};
  try {
    for (let i = 0; i < ids.length; i += 200) {
      const { data, error } = await supabase
        .from('embeddings')
        .select('id, hash, vector')
        .eq('model', MODEL)
        .in('id', ids.slice(i, i + 200));
      if (error) throw error;
      for (const r of (data || []) as SharedRow[]) out[r.id] = r;
    }
  } catch (err) {
    // table missing or offline: fall back to computing locally
    console.warn('Shared embeddings unavailable:', err);
  }
  return out;
}

async function saveShared(rows: SharedRow[]) {
  try {
    const { error } = await supabase
      .from('embeddings')
      .upsert(rows.map(r => ({ ...r, model: MODEL, updated_at: new Date().toISOString() })));
    if (error) throw error;
  } catch (err) {
    console.warn('Could not save shared embeddings:', err);
  }
}

export function cosine(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s; // vectors are normalized
}
