import { useCallback, useEffect, useRef, useState } from 'react';
import GifPanel from './GifPanel.tsx';

interface Props {
  cooldownUntil: number;
  playing: boolean;
  offline: boolean;
  reducedMotion: boolean;
  onSend: (id: string) => Promise<boolean>;
}

/** Kendi koltuktaki GIF butonu + panel. */
export default function GifSender({ cooldownUntil, playing, offline, reducedMotion, onSend }: Props) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const cooling = cooldownUntil > 0;
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!cooling) return;
    setNow(Date.now());
    const i = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(i);
  }, [cooling]);
  const left = cooling ? Math.max(1, Math.ceil((cooldownUntil - now) / 1000)) : 0;

  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) setTimeout(() => btnRef.current?.focus(), 0);
  }, []);

  const blocked = playing || cooling || offline;
  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="gif-btn"
        aria-label="GIF gönder"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-disabled={blocked || undefined}
        title={playing ? 'GIF oynuyor' : cooling ? `${left} sn sonra tekrar gönderebilirsin` : offline ? 'Bağlantı yok' : undefined}
        onClick={() => {
          if (open) close();
          else if (!blocked) setOpen(true);
        }}
      >
        {cooling ? `${left} sn` : 'GIF'}
      </button>
      {open && (
        <GifPanel
          cooldownUntil={cooldownUntil}
          disabled={offline}
          reducedMotion={reducedMotion}
          triggerRef={btnRef}
          onSend={onSend}
          onClose={close}
        />
      )}
    </>
  );
}
