import React, { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Network, Loader2, ExternalLink, X } from 'lucide-react';
import { Post, Presentation, Member } from '../types';
import { api } from '../lib/supabase';
import { embedItems, cosine } from '../lib/embeddings';
import { cn, getMemberColorClasses } from '../lib/utils';

interface MapPageProps {
  posts: Post[];
  onPostClick: (post: Post) => void;
  onGoToPresentations: () => void;
}

type Kind = 'post' | 'presentation';
interface GNode {
  id: string;
  kind: Kind;
  title: string;
  author: Member;
  date?: string;
  snippet: string;
  cluster: number;
  color: string;
  degree: number;
  x?: number;
  y?: number;
}
interface Cluster {
  ci: number;
  members: GNode[];
  hub: GNode;
  color: string;
  keywords: string[];
}
interface GLink {
  source: string | GNode;
  target: string | GNode;
  sim: number;
}

// hues picked to stay distinguishable from each other (no red/pink or cyan/teal pairs)
const CLUSTER_COLORS = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444', '#0ea5e9', '#a855f7', '#84cc16', '#ec4899', '#92400e', '#334155'];
const ISOLATED_COLOR = '#cbd5e1';
const NEIGHBORS = 4;

const strip = (html?: string) =>
  (html || '').replace(/<[^>]*>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

// stable hash so a cluster keeps its color across slider moves / reloads
const hashStr = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

// --- lightweight keyword extraction (TF-IDF) for cluster naming ---
const STOPWORDS = new Set([
  '그리고', '하지만', '위한', '위해', '대한', '대해', '관련', '기반', '어떻게', '무엇', '때문', '통해', '있다', '있는', '한다', '하는', '했다', '된다', '되는', '이번', '지난', '최근', '요즘', '그냥', '정말', '바로', '다시', '모든', '같은', '등의',
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'for', 'on', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'how', 'what', 'why', 'its', 'it', 'their', 'from', 'by', 'at', 'as', 'will', 'this', 'that', 'these', 'new', 'more', 'not', 'but', 'has', 'have', 'can', 'into', 'about', 'than', 'also', 'next', 'year', 'years',
]);
const PARTICLES = /(의|은|는|이|가|을|를|에|로|와|과|도|만|에서|으로|이다|까지|부터|처럼)$/;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9가-힣+]+/)
    .map(w => (w.length > 2 && /[가-힣]$/.test(w) ? w.replace(PARTICLES, '') : w))
    .filter(w => w.length >= 2 && !/^\d+$/.test(w) && !STOPWORDS.has(w));
}

function clusterKeywords(memberTexts: string[][], allDocs: string[][]): string[] {
  const df = new Map<string, number>();
  for (const doc of allDocs) for (const t of new Set(doc)) df.set(t, (df.get(t) || 0) + 1);
  const tf = new Map<string, number>();
  for (const doc of memberTexts) for (const t of doc) tf.set(t, (tf.get(t) || 0) + 1);
  return [...tf.entries()]
    .map(([t, f]) => ({ t, score: f * Math.log((allDocs.length + 1) / ((df.get(t) || 0) + 1)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(x => x.t);
}

// e5 similarities are squeezed into a narrow band, so remove the shared mean
// direction and pick the threshold as a percentile of all pairs instead of a fixed value.
function centered(vectors: Record<string, number[]>, ids: string[]): Record<string, number[]> {
  const dim = vectors[ids[0]].length;
  const mean = new Array(dim).fill(0);
  ids.forEach(id => vectors[id].forEach((x, i) => { mean[i] += x / ids.length; }));
  const out: Record<string, number[]> = {};
  for (const id of ids) {
    const v = vectors[id].map((x, i) => x - mean[i]);
    const norm = Math.sqrt(v.reduce((a, x) => a + x * x, 0)) || 1;
    out[id] = v.map(x => x / norm);
  }
  return out;
}

// strength 0 (loose) -> keep top 25% most similar pairs, 100 (strict) -> top 5%.
// Mutual kNN below keeps even the loose end from exploding.
const keepRatio = (strength: number) => 0.25 - (strength / 100) * 0.2;

function labelPropagation(ids: string[], adj: Map<string, { id: string; w: number }[]>): Map<string, number> {
  const label = new Map(ids.map((id, i) => [id, i]));
  for (let iter = 0; iter < 12; iter++) {
    let changed = false;
    for (const id of ids) {
      const nbrs = adj.get(id) || [];
      if (!nbrs.length) continue;
      const score = new Map<number, number>();
      for (const n of nbrs) score.set(label.get(n.id)!, (score.get(label.get(n.id)!) || 0) + n.w);
      let best = label.get(id)!;
      let bestScore = -1;
      for (const [l, s] of score) if (s > bestScore || (s === bestScore && l < best)) { best = l; bestScore = s; }
      if (best !== label.get(id)) { label.set(id, best); changed = true; }
    }
    if (!changed) break;
  }
  return label;
}

export function MapPage({ posts, onPostClick, onGoToPresentations }: MapPageProps) {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [vectors, setVectors] = useState<Record<string, number[]>>({});
  const [status, setStatus] = useState<{ done: number; total: number; modelPct?: number } | null>(null);
  const [error, setError] = useState('');
  const [strength, setStrength] = useState(45);
  const [showPosts, setShowPosts] = useState(true);
  const [showPres, setShowPres] = useState(true);
  const [hideIsolated, setHideIsolated] = useState(true);
  const [selected, setSelected] = useState<GNode | null>(null);
  const [search, setSearch] = useState('');
  const [size, setSize] = useState({ w: 800, h: 560 });
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getPresentations().then(setPresentations).catch(console.error);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const items = useMemo(() => {
    const p = posts.map(post => ({
      id: `post:${post.id}`,
      kind: 'post' as Kind,
      title: post.title,
      author: post.author,
      date: post.study_date,
      snippet: post.summary || strip(post.content).slice(0, 140),
      text: [post.title, strip(post.summary), strip(post.opinion), strip(post.content)].filter(Boolean).join('. ').slice(0, 1200),
    }));
    const pr = presentations.map(x => ({
      id: `pres:${x.id}`,
      kind: 'presentation' as Kind,
      title: x.title,
      author: x.author,
      date: x.study_date,
      snippet: strip(x.content).slice(0, 140),
      text: [x.title, strip(x.content)].filter(Boolean).join('. ').slice(0, 1200),
    }));
    return [...p, ...pr];
  }, [posts, presentations]);

  const itemKey = useMemo(() => items.map(i => i.id + i.text.length).join('|'), [items]);

  useEffect(() => {
    if (!items.length) return;
    let cancelled = false;
    embedItems(items.map(i => ({ id: i.id, text: i.text })), (done, total, modelPct) => {
      if (!cancelled) setStatus({ done, total, modelPct });
    })
      .then(v => { if (!cancelled) { setVectors(v); setStatus(null); setError(''); } })
      .catch(err => {
        console.error(err);
        if (!cancelled) { setError('임베딩 모델을 불러오지 못했습니다. 네트워크를 확인하고 새로고침해주세요.'); setStatus(null); }
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemKey]);

  const graph = useMemo(() => {
    const visible = items.filter(i => (i.kind === 'post' ? showPosts : showPres) && vectors[i.id]);
    const emptyResult = {
      nodes: visible.map((v, i) => ({ id: v.id, kind: v.kind, title: v.title, author: v.author, date: v.date, snippet: v.snippet, cluster: i, color: ISOLATED_COLOR, degree: 0 } as GNode)),
      links: [] as GLink[],
      clusters: [] as Cluster[],
      isolatedCount: 0,
    };
    if (visible.length < 2) return emptyResult;
    const cv = centered(vectors, visible.map(v => v.id));

    // each node's top-N candidates, reused for mutual-kNN check
    const tops = new Map<string, { id: string; sim: number }[]>();
    const allSims: number[] = [];
    for (let i = 0; i < visible.length; i++) {
      const a = visible[i];
      const sims = visible
        .filter(b => b.id !== a.id)
        .map(b => ({ id: b.id, sim: cosine(cv[a.id], cv[b.id]) }))
        .sort((x, y) => y.sim - x.sim);
      tops.set(a.id, sims.slice(0, NEIGHBORS));
      for (let j = i + 1; j < visible.length; j++) allSims.push(cosine(cv[a.id], cv[visible[j].id]));
    }
    allSims.sort((a, b) => b - a);
    const threshold = allSims[Math.max(0, Math.min(allSims.length - 1, Math.ceil(allSims.length * keepRatio(strength)) - 1))];

    // link only when a and b each rank the other in their own top-N (mutual kNN):
    // this prunes one-sided "bridges" between unrelated topics.
    const linkMap = new Map<string, GLink>();
    for (const a of visible) {
      for (const { id: bid, sim } of tops.get(a.id)!) {
        if (sim < threshold) continue;
        if (!tops.get(bid)!.some(x => x.id === a.id)) continue;
        const key = a.id < bid ? `${a.id}|${bid}` : `${bid}|${a.id}`;
        if (!linkMap.has(key)) linkMap.set(key, { source: a.id, target: bid, sim });
      }
    }
    const links = [...linkMap.values()];
    const adj = new Map<string, { id: string; w: number }[]>();
    for (const l of links) {
      const s = l.source as string, t = l.target as string;
      adj.set(s, [...(adj.get(s) || []), { id: t, w: l.sim }]);
      adj.set(t, [...(adj.get(t) || []), { id: s, w: l.sim }]);
    }

    const connected = visible.filter(v => adj.has(v.id));
    const isolatedCount = visible.length - connected.length;
    const shown = hideIsolated ? connected : visible;

    const labels = labelPropagation(shown.map(v => v.id), adj);
    const clusterIds = [...new Set(shown.map(v => labels.get(v.id)!))];
    const nodes: GNode[] = shown.map(v => ({
      id: v.id, kind: v.kind, title: v.title, author: v.author, date: v.date, snippet: v.snippet,
      cluster: clusterIds.indexOf(labels.get(v.id)!),
      color: ISOLATED_COLOR,
      degree: adj.get(v.id)?.length || 0,
    }));

    const allDocs = shown.map(v => tokenize(v.text));
    const docByNode = new Map(shown.map((v, i) => [v.id, allDocs[i]]));
    const clusters: Cluster[] = clusterIds
      .map((_, ci) => {
        const members = nodes.filter(n => n.cluster === ci);
        const hub = [...members].sort((a, b) => b.degree - a.degree)[0];
        const keywords = members.length >= 2 ? clusterKeywords(members.map(m => docByNode.get(m.id)!), allDocs) : [];
        return { ci, members, hub, color: ISOLATED_COLOR, keywords };
      })
      .filter(c => c.members.length >= 2)
      .sort((a, b) => b.members.length - a.members.length);
    // Each cluster prefers the color hashed from its hub id (stable across slider moves);
    // on collision it takes the next free color so no two clusters share one.
    const used = new Set<number>();
    for (const c of clusters) {
      let idx = hashStr(c.hub.id) % CLUSTER_COLORS.length;
      for (let k = 0; k < CLUSTER_COLORS.length && used.has(idx); k++) idx = (idx + 1) % CLUSTER_COLORS.length;
      if (used.has(idx)) {
        // more clusters than palette entries: spread extra hues by the golden angle
        c.color = `hsl(${Math.round((used.size * 137.5) % 360)}, 65%, 50%)`;
        used.add(used.size + CLUSTER_COLORS.length);
        continue;
      }
      used.add(idx);
      c.color = CLUSTER_COLORS[idx];
    }
    for (const c of clusters) for (const m of c.members) m.color = c.color;
    return { nodes, links, clusters, isolatedCount };
  }, [items, vectors, strength, showPosts, showPres, hideIsolated]);

  const matched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return new Set(graph.nodes.filter(n => n.title.toLowerCase().includes(q) || n.snippet.toLowerCase().includes(q)).map(n => n.id));
  }, [search, graph.nodes]);

  const openDetail = (n: GNode) => {
    if (n.kind === 'post') {
      const post = posts.find(p => `post:${p.id}` === n.id);
      if (post) onPostClick(post);
    } else {
      onGoToPresentations();
    }
  };

  const relatedOfSelected = useMemo(() => {
    if (!selected) return [];
    const ids = new Set<string>();
    graph.links.forEach(l => {
      const s = typeof l.source === 'string' ? l.source : l.source.id;
      const t = typeof l.target === 'string' ? l.target : l.target.id;
      if (s === selected.id) ids.add(t);
      if (t === selected.id) ids.add(s);
    });
    return graph.nodes.filter(n => ids.has(n.id));
  }, [selected, graph]);

  const loading = status !== null;
  const empty = !items.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-primary-100 text-primary-700 rounded-xl"><Network className="w-6 h-6" /></div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">지식 지도</h2>
          <p className="text-sm text-gray-500">기사와 발표를 내용의 의미로 자동 연결해요. 가까울수록 비슷한 주제예요.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => setShowPosts(v => !v)} className={cn('px-3 py-1.5 rounded-lg border font-medium', showPosts ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-400 border-gray-200')}>● 기사</button>
          <button onClick={() => setShowPres(v => !v)} className={cn('px-3 py-1.5 rounded-lg border font-medium', showPres ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-400 border-gray-200')}>■ 발표</button>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          연결 기준
          <span className="text-xs text-gray-400">느슨</span>
          <input type="range" min={0} max={100} value={strength} onChange={e => setStrength(Number(e.target.value))} className="w-32 accent-indigo-600" />
          <span className="text-xs text-gray-400">엄격</span>
        </label>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="제목·요약 검색"
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg w-44 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
        <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={hideIsolated} onChange={e => setHideIsolated(e.target.checked)} className="accent-indigo-600" />
          외딴 글 숨기기{graph.isolatedCount > 0 && <span className="text-xs text-gray-400">({graph.isolatedCount})</span>}
        </label>
        <span className="text-xs text-gray-400 ml-auto">노드 {graph.nodes.length} · 연결 {graph.links.length}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div ref={wrapRef} className="relative flex-1 h-[560px] bg-white rounded-2xl border border-gray-100 card-shadow overflow-hidden">
          {empty && <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">등록된 기사나 발표가 없어요.</div>}
          {loading && (
            <div className="absolute inset-0 z-10 bg-white/85 flex flex-col items-center justify-center gap-2 text-sm text-gray-600">
              <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
              {status!.modelPct !== undefined && status!.done === 0
                ? <>AI 모델 준비 중… {Math.round(status!.modelPct)}% <span className="text-xs text-gray-400">(처음 한 번만, 이후 저장돼요)</span></>
                : <>내용 분석 중… {status!.done} / {status!.total}</>}
            </div>
          )}
          {error && <div className="absolute inset-0 flex items-center justify-center text-sm text-red-500 px-6 text-center">{error}</div>}
          {!empty && !error && (
            <ForceGraph2D
              width={size.w}
              height={size.h}
              graphData={graph}
              cooldownTicks={120}
              nodeRelSize={5}
              nodeLabel={(n: object) => (n as GNode).title}
              linkColor={() => 'rgba(148,163,184,0.45)'}
              linkWidth={(l: object) => 0.8 + Math.max(0, (l as GLink).sim) * 3}
              onNodeClick={(n: object) => setSelected(n as GNode)}
              onBackgroundClick={() => setSelected(null)}
              nodeCanvasObject={(n: object, ctx: CanvasRenderingContext2D, scale: number) => {
                const node = n as GNode;
                const r = 4 + Math.min(node.degree, 6) * 1.2;
                const dim = (matched && !matched.has(node.id)) || (selected && selected.id !== node.id && !relatedOfSelected.some(x => x.id === node.id));
                ctx.globalAlpha = dim ? 0.15 : 1;
                ctx.fillStyle = node.color;
                const x = node.x ?? 0, y = node.y ?? 0;
                if (node.kind === 'post') {
                  ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fill();
                } else {
                  ctx.fillRect(x - r, y - r, r * 2, r * 2);
                }
                if (selected?.id === node.id) { ctx.strokeStyle = '#111827'; ctx.lineWidth = 2 / scale; ctx.stroke(); }
                if (scale > 1.3 || node.degree >= 3 || selected?.id === node.id) {
                  const label = node.title.length > 16 ? node.title.slice(0, 16) + '…' : node.title;
                  ctx.font = `${11 / Math.max(scale, 1)}px sans-serif`;
                  ctx.fillStyle = '#374151';
                  ctx.textAlign = 'center';
                  ctx.fillText(label, x, y + r + 10 / Math.max(scale, 1));
                }
                ctx.globalAlpha = 1;
              }}
              nodePointerAreaPaint={(n: object, color: string, ctx: CanvasRenderingContext2D) => {
                const node = n as GNode;
                ctx.fillStyle = color;
                ctx.beginPath(); ctx.arc(node.x ?? 0, node.y ?? 0, 4 + Math.min(node.degree, 6) * 1.2 + 2, 0, 2 * Math.PI); ctx.fill();
              }}
              onRenderFramePost={(ctx: CanvasRenderingContext2D, scale: number) => {
                // topic labels above each cluster, from TF-IDF keywords
                if (selected || matched) return;
                for (const c of graph.clusters.slice(0, 8)) {
                  if (c.members.length < 3 || !c.keywords.length) continue;
                  const pts = c.members.filter(m => m.x !== undefined && m.y !== undefined);
                  if (pts.length < 2) continue;
                  const cx = pts.reduce((s, m) => s + m.x!, 0) / pts.length;
                  const topY = Math.min(...pts.map(m => m.y!));
                  const fs = 13 / Math.max(scale, 0.7);
                  ctx.font = `bold ${fs}px sans-serif`;
                  ctx.textAlign = 'center';
                  const text = c.keywords.join(' · ');
                  const y = topY - 16 / Math.max(scale, 0.7);
                  ctx.lineWidth = 3.5 / Math.max(scale, 0.7);
                  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
                  ctx.strokeText(text, cx, y);
                  ctx.fillStyle = c.color;
                  ctx.fillText(text, cx, y);
                }
              }}
            />
          )}
        </div>

        <div className="lg:w-72 flex flex-col gap-4">
          {selected && (
            <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-bold text-gray-400">{selected.kind === 'post' ? '기사' : '발표'}{selected.date ? ` · ${selected.date}` : ''}</span>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              <h3 className="font-bold text-gray-900 mt-1 leading-snug">{selected.title}</h3>
              <span className={cn('inline-block mt-2 text-xs px-2 py-0.5 rounded-full border font-medium', getMemberColorClasses(selected.author))}>{selected.author}</span>
              {selected.snippet && <p className="text-sm text-gray-600 mt-3 line-clamp-4">{selected.snippet}</p>}
              <button onClick={() => openDetail(selected)} className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">
                <ExternalLink className="w-4 h-4" /> {selected.kind === 'post' ? '상세 보기' : '발표자료 탭으로'}
              </button>
              <div className="mt-4">
                <div className="text-xs font-bold text-gray-500 mb-2">연관된 글 {relatedOfSelected.length}</div>
                {relatedOfSelected.length === 0 && <p className="text-xs text-gray-400">연결 기준을 느슨하게 해보세요.</p>}
                <ul className="space-y-1.5">
                  {relatedOfSelected.map(n => (
                    <li key={n.id}>
                      <button onClick={() => setSelected(n)} className="text-left text-sm text-gray-700 hover:text-primary-600 leading-snug">
                        {n.kind === 'post' ? '● ' : '■ '}{n.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-4">
            <div className="text-xs font-bold text-gray-500 mb-2">자동 묶인 주제</div>
            {graph.clusters.length === 0 && <p className="text-xs text-gray-400">아직 묶인 주제가 없어요.</p>}
            <ul className="space-y-2">
              {graph.clusters.slice(0, 10).map(c => (
                <li key={c.ci}>
                  <button onClick={() => setSelected(c.hub)} className="flex items-start gap-2 text-left w-full">
                    <span className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ background: c.color }} />
                    <span className="text-sm leading-snug">
                      <span className="font-semibold text-gray-800">{c.keywords.join(' · ') || c.hub.title.slice(0, 22)}</span>
                      <span className="text-xs text-gray-400"> {c.members.length}건</span>
                      <span className="block text-xs text-gray-400 truncate">{c.hub.title}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
