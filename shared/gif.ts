import { GIF_QUERY_MAX } from './constants.ts';

export const GIPHY_MEDIA_HOSTS = /^(media\d?|i)\.giphy\.com$/;

/** Yalnızca GIPHY medya sunucularındaki https URL'leri. */
export function isGiphyMediaUrl(v: unknown): v is string {
  if (typeof v !== 'string' || v.length > 500) return false;
  let u: URL;
  try {
    u = new URL(v);
  } catch {
    return false;
  }
  return u.protocol === 'https:' && u.port === '' && !u.username && !u.password && GIPHY_MEDIA_HOSTS.test(u.hostname);
}

export function isGifId(v: unknown): v is string {
  return typeof v === 'string' && /^[A-Za-z0-9]{1,40}$/.test(v);
}

/** Arama metnini sadeleştirir; geçersiz/çok uzunsa null. Boş metin = trend. */
export function normalizeQuery(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const q = v.trim().replace(/\s+/g, ' ');
  return q.length > GIF_QUERY_MAX ? null : q;
}
