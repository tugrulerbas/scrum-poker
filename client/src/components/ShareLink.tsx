import { useEffect, useId, useRef, useState } from 'react';
import { useToast } from '../toasts.tsx';
import Icon from './Icon.tsx';

const COPIED = 'Link panoya kopyalandı';
const FALLBACK = 'Kopyalayamadık. Link seçili, Ctrl/Cmd+C ile kopyalayabilirsin.';

export default function ShareLink({ roomId, highlight }: { roomId: string; highlight: boolean }) {
  const url = `${location.origin}/r/${roomId}`;
  const toast = useToast();
  const helpId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<'idle' | 'copied' | 'fallback'>('idle');
  const [flash, setFlash] = useState(highlight);
  const [announce, setAnnounce] = useState('');

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(false), 1000);
    return () => clearTimeout(t);
  }, [flash]);

  useEffect(() => {
    if (state !== 'copied') return;
    const t = setTimeout(() => setState('idle'), 2000);
    return () => clearTimeout(t);
  }, [state]);

  // Canlı bölge sürekli DOM'da; metni önce boşaltıp sonra yazmak art arda kopyalamalarda da duyurulmasını sağlar.
  function say(text: string) {
    setAnnounce('');
    setTimeout(() => setAnnounce(text), 50);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setState('copied');
      say(COPIED);
      toast(COPIED, 'success', { silent: true });
    } catch {
      setState('fallback');
      say(FALLBACK);
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }

  return (
    <div className={`share${state === 'fallback' ? ' share-fallback' : ''}`}>
      <input
        ref={inputRef}
        className={`input share-input${flash ? ' flash' : ''}`}
        readOnly
        value={url}
        aria-label="Oda linki"
        aria-describedby={state === 'fallback' ? helpId : undefined}
        onFocus={(e) => e.currentTarget.select()}
      />
      <button
        type="button"
        className={`btn btn-secondary btn-sm share-btn${state === 'copied' ? ' is-success' : ''}`}
        onClick={copy}
      >
        {state === 'copied' ? (
          <>
            <Icon name="check" size={16} /> Kopyalandı
          </>
        ) : state === 'fallback' ? (
          'Seç ve Ctrl+C'
        ) : (
          <>
            <Icon name="link" size={16} /> Linki kopyala
          </>
        )}
      </button>
      {state === 'fallback' && (
        <p id={helpId} className="share-help">
          {FALLBACK}
        </p>
      )}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </span>
    </div>
  );
}
