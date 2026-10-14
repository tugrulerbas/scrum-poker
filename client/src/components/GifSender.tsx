import { useCallback, useRef, useState } from 'react';
import GifPanel from './GifPanel.tsx';

interface Props {
  cooldownUntil: number;
  offline: boolean;
  reducedMotion: boolean;
  onSend: (id: string) => Promise<boolean>;
}

/** Kendi koltuktaki GIF butonu + panel. */
export default function GifSender({ cooldownUntil, offline, reducedMotion, onSend }: Props) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const cooling = cooldownUntil > 0;

  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) setTimeout(() => btnRef.current?.focus(), 0);
  }, []);

  const blocked = cooling || offline;
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
        title={cooling ? 'Biraz bekle' : offline ? 'Bağlantı yok' : undefined}
        onClick={() => {
          if (open) close();
          else if (!blocked) setOpen(true);
        }}
      >
        GIF
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
