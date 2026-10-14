import { useCallback, useEffect, useRef, useState } from 'react';
import { GIF_SEARCH_DEBOUNCE_MS } from '../../shared/constants.ts';
import type { GifItem } from '../../shared/types.ts';
import { call } from './socket.ts';

export type GifSearchStatus = 'loading' | 'ready' | 'empty' | 'error' | 'disabled' | 'limited';

export function useGifSearch() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<GifSearchStatus>('loading');
  const [items, setItems] = useState<GifItem[]>([]);
  const [searched, setSearched] = useState('');
  const normalized = query.trim().replace(/\s+/g, ' ');
  const reqSeq = useRef(0);

  const run = useCallback(async (raw: string) => {
    const q = raw.trim().replace(/\s+/g, ' ');
    const seq = ++reqSeq.current;
    setStatus((s) => (s === 'disabled' ? s : 'loading'));
    const res = await call('gif:search', { q });
    if (seq !== reqSeq.current) return;
    setSearched(q);
    if (res.ok) {
      setItems(res.items);
      setStatus(res.items.length ? 'ready' : 'empty');
    } else if (res.error === 'GIF_DISABLED') {
      setItems([]);
      setStatus('disabled');
    } else setStatus(res.error === 'RATE_LIMITED' ? 'limited' : 'error');
  }, []);

  useEffect(() => {
    // Boş sorgu (açılış, temizleme) beklemeden trendi ister.
    const t = setTimeout(() => run(normalized), normalized ? GIF_SEARCH_DEBOUNCE_MS : 0);
    return () => clearTimeout(t);
  }, [normalized, run]);

  useEffect(
    () => () => {
      reqSeq.current++;
    },
    [],
  );

  const retry = useCallback(() => run(normalized), [normalized, run]);

  return { query, normalized, setQuery, status, items, searched, retry };
}
