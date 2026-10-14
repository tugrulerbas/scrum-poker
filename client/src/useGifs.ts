import { useCallback, useEffect, useRef, useState } from 'react';
import { GIF_COOLDOWN_MS, GIF_LOAD_TIMEOUT_MS, GIF_SHOW_MS } from '../../shared/constants.ts';
import { isGiphyMediaUrl } from '../../shared/gif.ts';
import type { GifEvent, RoomView } from '../../shared/types.ts';
import { storage } from './identity.ts';
import { call, socket } from './socket.ts';
import { useToast } from './toasts.tsx';
import { GENERIC_ERROR } from './useRoom.ts';

export type ActiveGif = { id: string; url: string };
const MUTE_KEY = 'sp:gif-muted';

export function useGifs(view: RoomView | null) {
  const toast = useToast();
  const [active, setActive] = useState<Record<string, ActiveGif>>({});
  const [muted, setMutedState] = useState(() => storage.get(MUTE_KEY) === '1');
  const [cooldownUntil, setCooldownUntil] = useState(0);
  // Kendi GIF'in oynarken true; bekleme süresi GIF bitince başlar.
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);
  playingRef.current = playing;
  const youId = useRef<string | null>(null);
  youId.current = view?.you.id ?? null;

  useEffect(() => {
    if (muted) return;
    const onGif = (g: GifEvent) => {
      if (document.hidden || !isGiphyMediaUrl(g.url)) return;
      setActive((a) => ({ ...a, [g.fromId]: { id: g.id, url: g.url } }));
    };
    const onVisibility = () => document.hidden && setActive({});
    socket.on('gif', onGif);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      socket.off('gif', onGif);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [muted]);

  useEffect(() => {
    if (!view) return;
    setActive((a) => {
      const keep = Object.entries(a).filter(([id]) => view.participants.some((p) => p.id === id && p.online));
      return keep.length === Object.keys(a).length ? a : Object.fromEntries(keep);
    });
  }, [view]);

  useEffect(() => {
    const left = cooldownUntil - Date.now();
    if (left <= 0) return;
    const t = setTimeout(() => setCooldownUntil(0), left);
    return () => clearTimeout(t);
  }, [cooldownUntil]);

  const finishOwn = useCallback(() => {
    if (!playingRef.current) return;
    playingRef.current = false;
    setPlaying(false);
    setCooldownUntil(Date.now() + GIF_COOLDOWN_MS);
  }, []);

  // Kendi GIF'in gösterilmezse (gizli, sekme arkada, yüklenemedi) yine de beklemeye geç.
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(finishOwn, muted ? GIF_SHOW_MS : GIF_LOAD_TIMEOUT_MS + GIF_SHOW_MS + 500);
    return () => clearTimeout(t);
  }, [playing, muted, finishOwn]);

  const setMuted = useCallback((m: boolean) => {
    storage.set(MUTE_KEY, m ? '1' : '0');
    setMutedState(m);
    if (m) setActive({});
  }, []);

  const dismiss = useCallback((fromId: string, id: string) => {
    if (fromId === youId.current) finishOwn();
    setActive((a) => {
      if (a[fromId]?.id !== id) return a;
      const { [fromId]: _, ...rest } = a;
      return rest;
    });
  }, [finishOwn]);

  const send = useCallback(
    async (id: string) => {
      const res = await call('gif:send', { id });
      if (res.ok) {
        toast('GIF gönderildi', 'success');
        playingRef.current = true;
        setPlaying(true);
        return true;
      }
      if (res.error === 'RATE_LIMITED') {
        toast('Biraz bekle, sonra tekrar gönderebilirsin.', 'warning');
        setCooldownUntil(Date.now() + GIF_COOLDOWN_MS);
      } else if (res.error === 'INVALID_INPUT') toast('Bu GIF gönderilemedi, yeniden ara.', 'warning');
      else toast(GENERIC_ERROR, 'warning');
      return false;
    },
    [toast],
  );

  return { active, dismiss, muted, setMuted, send, cooldownUntil, playing };
}
