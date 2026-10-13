import { useRef, type KeyboardEvent } from 'react';
import { DECK } from '../../../shared/constants.ts';
import type { Card } from '../../../shared/types.ts';
import { CardFace } from './Icon.tsx';

interface Props {
  selected: Card | null;
  disabled: boolean;
  onSelect: (card: Card | null) => void;
}

export default function Deck({ selected, disabled, onSelect }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const focusIndex = Math.max(0, selected ? DECK.indexOf(selected) : 0);

  function onKeyDown(e: KeyboardEvent, i: number) {
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    refs.current[(i + delta + DECK.length) % DECK.length]?.focus();
  }

  return (
    <section className="deck-wrap" aria-labelledby="deck-title">
      <div className="deck-head">
        <h2 id="deck-title" className="section-title">Kartını seç</h2>
        {selected && !disabled && <span className="muted">Oyun gizli, değiştirebilirsin.</span>}
      </div>
      <div className="deck" role="radiogroup" aria-labelledby="deck-title">
        {DECK.map((card, i) => {
          const isSel = card === selected;
          return (
            <button
              key={card}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isSel}
              aria-disabled={disabled}
              tabIndex={i === focusIndex ? 0 : -1}
              className={`playing-card${isSel ? ' selected' : ''}`}
              onKeyDown={(e) => onKeyDown(e, i)}
              onClick={() => !disabled && onSelect(isSel ? null : card)}
            >
              <span className="card-inner">
                <CardFace card={card} />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
