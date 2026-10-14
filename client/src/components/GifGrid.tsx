import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { GifItem } from '../../../shared/types.ts';
import Icon from './Icon.tsx';

interface Props {
  items: GifItem[];
  selectedId: string | null;
  reducedMotion: boolean;
  dim?: boolean;
  onToggle: (item: GifItem) => void;
}

export default function GifGrid({ items, selectedId, reducedMotion, dim, onToggle }: Props) {
  const [broken, setBroken] = useState<Set<string>>(() => new Set());
  const [loaded, setLoaded] = useState<Set<string>>(() => new Set());
  const [focusId, setFocusId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const visible = items.filter((g) => !broken.has(g.id));

  useEffect(() => setBroken(new Set()), [items]);

  const current = visible.find((g) => g.id === focusId) ?? visible.find((g) => g.id === selectedId) ?? visible[0];

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    const i = visible.findIndex((g) => g.id === current?.id);
    if (i < 0) return;
    const btns = ref.current?.querySelectorAll<HTMLElement>('[role="option"]');
    const first = btns?.[0];
    const cols = first ? Math.max(1, Math.round((ref.current!.clientWidth || 1) / (first.offsetWidth || 1))) : 1;
    const moves: Record<string, number> = {
      ArrowLeft: i - 1,
      ArrowRight: i + 1,
      ArrowUp: i - cols,
      ArrowDown: i + cols,
      Home: 0,
      End: visible.length - 1,
    };
    if (!(e.key in moves)) return;
    e.preventDefault();
    const next = Math.min(visible.length - 1, Math.max(0, moves[e.key]));
    setFocusId(visible[next].id);
    btns?.[next]?.focus();
  }

  if (!visible.length) return <p className="gif-status">Sonuç bulunamadı. Başka bir kelime dene.</p>;

  return (
    <div
      ref={ref}
      className={`gif-grid${dim ? ' is-dim' : ''}`}
      role="listbox"
      aria-label="GIF sonuçları"
      onKeyDown={onKey}
    >
      {visible.map((g, n) => {
        const selected = g.id === selectedId;
        const ready = loaded.has(g.id);
        return (
          <button
            key={g.id}
            type="button"
            role="option"
            className={`gif-tile${selected ? ' is-selected' : ''}${ready ? ' is-loaded' : ''}`}
            aria-selected={selected}
            aria-label={`GIF ${n + 1} / ${visible.length}`}
            tabIndex={g.id === current?.id ? 0 : -1}
            onFocus={() => setFocusId(g.id)}
            onClick={() => onToggle(g)}
          >
            <img
              src={reducedMotion ? g.still : g.preview}
              width={g.w}
              height={g.h}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              alt=""
              onLoad={() => setLoaded((l) => (l.has(g.id) ? l : new Set(l).add(g.id)))}
              onError={() => setBroken((b) => new Set(b).add(g.id))}
            />
            {selected && (
              <span className="gif-tile-check" aria-hidden="true">
                <Icon name="check" size={14} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
