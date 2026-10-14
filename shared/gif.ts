import { GIF_URL_MAX } from './constants.ts';

export type GifUrlError = 'EMPTY' | 'TOO_LONG' | 'INVALID' | 'NOT_HTTPS' | 'CREDENTIALS' | 'PRIVATE_HOST';
export type GifUrlCheck = { ok: true; url: string } | { ok: false; reason: GifUrlError };

const PRIVATE_SUFFIXES = ['.localhost', '.local', '.internal', '.lan', '.home.arpa'];

/** GIF linki için istemci ve sunucunun ortak doğrulaması. */
export function checkGifUrl(v: unknown): GifUrlCheck {
  if (typeof v !== 'string' || !v.trim()) return { ok: false, reason: 'EMPTY' };
  const raw = v.trim();
  if (raw.length > GIF_URL_MAX) return { ok: false, reason: 'TOO_LONG' };
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return { ok: false, reason: 'INVALID' };
  }
  if (u.protocol !== 'https:') return { ok: false, reason: 'NOT_HTTPS' };
  if (u.username || u.password) return { ok: false, reason: 'CREDENTIALS' };
  if (u.port !== '') return { ok: false, reason: 'INVALID' };
  const host = u.hostname.toLowerCase().replace(/\.$/, '');
  if (
    /^\d+(\.\d+){3}$/.test(host) ||
    host.startsWith('[') ||
    host === 'localhost' ||
    !host.includes('.') ||
    PRIVATE_SUFFIXES.some((s) => host.endsWith(s))
  )
    return { ok: false, reason: 'PRIVATE_HOST' };
  if (u.href.length > GIF_URL_MAX) return { ok: false, reason: 'TOO_LONG' };
  return { ok: true, url: u.href };
}
