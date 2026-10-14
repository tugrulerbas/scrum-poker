import { GIF_RESULTS } from '../shared/constants.ts';
import { isGifId, isGiphyMediaUrl } from '../shared/gif.ts';
import type { GifItem } from '../shared/types.ts';
import { createLimiter } from './rate-limit.ts';

// Anahtar yalnızca istek URL'inde kullanılır; URL ve hata nesneleri asla loglanmaz/döndürülmez.
const KEY = process.env.GIPHY_API_KEY?.trim() || '';
export const giphyEnabled = !!KEY;

const envMax = Number(process.env.GIPHY_HOURLY_MAX);
const HOURLY_MAX = Number.isInteger(envMax) && envMax > 0 ? envMax : 90;
const upstreamLimit = createLimiter(HOURLY_MAX, 3_600_000);
// Tek kullanıcı global kotayı bitirmesin: önbellek ıskalarında kullanıcı başına saatlik pay.
const ownerLimit = createLimiter(Math.max(1, Math.floor(HOURLY_MAX / 5)), 3_600_000);

const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 300;
const SERVED_TTL_MS = 60 * 60 * 1000;
const SERVED_MAX = 5000;

type Result = GifItem[] | 'UNAVAILABLE';
const cache = new Map<string, { at: number; items: GifItem[] }>();
const inflight = new Map<string, Promise<Result>>();
const served = new Map<string, { url: string; at: number }>();

function remember(items: GifItem[]): void {
  const now = Date.now();
  for (const it of items) {
    served.delete(it.id);
    served.set(it.id, { url: it.preview, at: now });
  }
  for (const [id, v] of served) {
    if (served.size <= SERVED_MAX && now - v.at < SERVED_TTL_MS) break;
    served.delete(id);
  }
}

function cleanUrl(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  try {
    const u = new URL(v);
    const clean = u.origin + u.pathname;
    return isGiphyMediaUrl(clean) ? clean : null;
  } catch {
    return null;
  }
}

function toItems(data: unknown): GifItem[] {
  if (!Array.isArray(data)) return [];
  const items: GifItem[] = [];
  for (const g of data) {
    if (!g || typeof g !== 'object' || g.type !== 'gif' || g.rating !== 'g' || !isGifId(g.id)) continue;
    const fw = g.images?.fixed_width;
    const preview = cleanUrl(fw?.webp) ?? cleanUrl(fw?.url);
    const still = cleanUrl(g.images?.fixed_width_still?.url);
    if (!preview || !still) continue;
    const w = Number(fw.width);
    const h = Number(fw.height);
    const ok = w > 0 && h > 0 && Number.isFinite(w) && Number.isFinite(h);
    items.push({ id: g.id, w: ok ? w : 200, h: ok ? h : 200, preview, still });
  }
  return items;
}

async function fetchGifs(q: string): Promise<Result> {
  if (!upstreamLimit('giphy')) return 'UNAVAILABLE';
  const params = new URLSearchParams({ api_key: KEY, limit: String(GIF_RESULTS), rating: 'g' });
  if (q) {
    params.set('q', q);
    params.set('lang', 'tr');
  }
  try {
    const res = await fetch(`https://api.giphy.com/v1/gifs/${q ? 'search' : 'trending'}?${params}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.warn('GIPHY hata', res.status);
      return 'UNAVAILABLE';
    }
    const json = (await res.json()) as { data?: unknown };
    return toItems(json?.data);
  } catch (err) {
    console.warn('GIPHY erişilemedi', err instanceof Error ? err.name : 'Error');
    return 'UNAVAILABLE';
  }
}

/** Arama (q boşsa trend). Sonuçlar önbelleğe alınır ve gönderim için hatırlanır. */
export async function searchGifs(q: string, owner: string): Promise<Result> {
  const key = q ? 'search:' + q.toLowerCase() : 'trending';
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    remember(hit.items);
    return hit.items;
  }
  let p = inflight.get(key);
  if (!p) {
    if (!ownerLimit(owner)) return 'UNAVAILABLE';
    p = fetchGifs(q).then((items) => {
      if (items !== 'UNAVAILABLE') {
        cache.delete(key);
        cache.set(key, { at: Date.now(), items });
        if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value!);
      }
      return items;
    });
    p.finally(() => inflight.delete(key));
    inflight.set(key, p);
  }
  const items = await p;
  if (items !== 'UNAVAILABLE') remember(items);
  return items;
}

/** Sunucunun yakın zamanda verdiği bir GIF'in oynatma URL'i. */
export function resolveGif(id: string): string | null {
  const v = served.get(id);
  return v && Date.now() - v.at < SERVED_TTL_MS ? v.url : null;
}
