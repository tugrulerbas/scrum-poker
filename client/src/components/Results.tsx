import { useEffect, useMemo, useState } from 'react';
import { NUMERIC_CARDS } from '../../../shared/constants.ts';
import { computeResults, type Extreme } from '../../../shared/stats.ts';
import type { Card, RoomView } from '../../../shared/types.ts';
import { CardFace } from './Icon.tsx';

const fmt = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 });

interface Props {
  view: RoomView;
  isFacilitator: boolean;
  disabled?: boolean;
  onSave: (storyId: string, card: Card) => void;
}

export default function Results({ view, isFacilitator, disabled = false, onSave }: Props) {
  const r = useMemo(() => computeResults(view.round.votes ?? {}), [view.round.votes]);
  const [choice, setChoice] = useState<Card | null>(r.suggested);
  useEffect(() => setChoice(r.suggested), [r.suggested, view.round.id]);

  const nameOf = (id: string) => view.participants.find((p) => p.id === id)?.name ?? '?';
  const who = (e: Extreme) => `${e.participantIds.map(nameOf).join(', ')} (${e.card})`;
  const maxCount = Math.max(1, ...r.distribution.map((d) => d.count), ...r.nonNumeric.map((d) => d.count));
  const activeStory = view.stories.find((s) => s.id === view.activeStoryId);

  return (
    <section className="panel results" aria-labelledby="results-title">
      <h2 id="results-title" className="sr-only">Sonuçlar</h2>
      <p className="sr-only" aria-live="polite">
        Oylar açıldı.{r.median !== null ? ` Medyan ${fmt.format(r.median)}.` : ''}
      </p>

      {r.allUnknown ? (
        <div className="band band-warning">Belirsiz — daha fazla bilgi gerek.</div>
      ) : r.consensus ? (
        <div className="band band-success">
          <strong>Fikir birliği 🎯</strong> Herkes aynı fikirde.
        </div>
      ) : r.dispersed && r.lowest && r.highest ? (
        <div className="band band-warning">
          <strong>Tartışmaya değer — oylar çok dağınık.</strong>
          <span>
            En düşük: {who(r.lowest)} · En yüksek: {who(r.highest)}
          </span>
        </div>
      ) : null}

      {(r.numericCount > 0 || r.distribution.length > 0 || r.nonNumeric.length > 0) && (
        <div className="results-body">
          {r.numericCount > 0 && (
            <dl className="stats">
              <div className="stat stat-main">
                <dt>Medyan</dt>
                <dd>{fmt.format(r.median!)}</dd>
              </div>
              <div className="stat">
                <dt>Ortalama</dt>
                <dd>{fmt.format(r.average!)}</dd>
              </div>
            </dl>
          )}
          {(r.distribution.length > 0 || r.nonNumeric.length > 0) && (
            <div className="dist">
              <h3 className="section-title">Dağılım</h3>
              {r.distribution.length > 0 && (
                <ul>
                  {r.distribution.map((d) => (
                    <li key={d.card} className="dist-row">
                      <span className="dist-card">{d.card}</span>
                      <span className="dist-bar" aria-hidden="true">
                        <span style={{ width: `${(d.count / maxCount) * 100}%` }} />
                      </span>
                      <span className="dist-count">
                        {d.count}
                        <span className="sr-only"> oy</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {r.nonNumeric.length > 0 && (
                <p className="non-numeric">
                  <span className="muted">Sayısal olmayan:</span>
                  {r.nonNumeric.map((d) => (
                    <span key={d.card} className="chip">
                      <CardFace card={d.card} size={16} /> × {d.count}
                    </span>
                  ))}
                </p>
              )}
            </div>
          )}
        </div>
      )}
      {r.numericCount === 0 && !r.allUnknown && <p className="muted">Sayısal oy yok.</p>}

      {isFacilitator && activeStory && (
        <div className="save-points">
          <span id="save-label" className="section-title">Kaydedilecek puan</span>
          <div className="chips" role="radiogroup" aria-labelledby="save-label">
            {NUMERIC_CARDS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={choice === c}
                className={`chip-btn${choice === c ? ' selected' : ''}`}
                tabIndex={choice === c || (!choice && c === NUMERIC_CARDS[0]) ? 0 : -1}
                onKeyDown={(e) => {
                  const i = NUMERIC_CARDS.indexOf(c);
                  const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
                  if (!d) return;
                  e.preventDefault();
                  const next = NUMERIC_CARDS[(i + d + NUMERIC_CARDS.length) % NUMERIC_CARDS.length];
                  setChoice(next);
                  (e.currentTarget.parentElement?.children[NUMERIC_CARDS.indexOf(next)] as HTMLElement | undefined)?.focus();
                }}
                onClick={() => setChoice(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="save-actions">
            <button type="button" className="btn btn-primary" disabled={!choice || disabled} onClick={() => choice && onSave(activeStory.id, choice)}>
              {choice ? `Bu puanı kaydet: ${choice}` : 'Puan seç'}
            </button>
            {activeStory.points && <span className="muted hint">Kayıtlı puan: {activeStory.points}</span>}
          </div>
        </div>
      )}
    </section>
  );
}
