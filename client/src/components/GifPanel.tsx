import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { GIF_QUERY_MAX } from '../../../shared/constants.ts';
import type { GifItem } from '../../../shared/types.ts';
import { useGifSearch } from '../useGifSearch.ts';
import { useMediaQuery } from '../useMediaQuery.ts';
import GifGrid from './GifGrid.tsx';
import Icon from './Icon.tsx';

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
const EDGE = 16;
const SKELETONS = 9;

interface Props {
  cooldownUntil: number;
  disabled: boolean;
  reducedMotion: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  onSend: (id: string) => Promise<boolean>;
  onClose: (restoreFocus?: boolean) => void;
}

export default function GifPanel({ cooldownUntil, disabled, reducedMotion, triggerRef, onSend, onClose }: Props) {
  const { query, normalized, setQuery, status, items, searched, retry } = useGifSearch();
  const [selected, setSelected] = useState<GifItem | null>(null);
  const [sending, setSending] = useState(false);
  const [now, setNow] = useState(Date.now);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const gridWrapRef = useRef<HTMLDivElement>(null);
  const sheet = useMediaQuery('(max-width: 767px)');
  const [shift, setShift] = useState({ x: 0, up: false });

  // Masaüstü popover: viewport'a sığmazsa içeri / yukarı kay.
  useLayoutEffect(() => {
    const el = panelRef.current;
    if (sheet || !el) return setShift({ x: 0, up: false });
    el.style.transform = 'none';
    const r = el.getBoundingClientRect();
    const host = el.offsetParent?.getBoundingClientRect();
    const x = Math.min(0, window.innerWidth - EDGE - r.right) || Math.max(0, EDGE - r.left);
    const up = r.bottom > window.innerHeight - EDGE && !!host && host.top - r.height - EDGE > 0;
    el.style.transform = '';
    setShift({ x, up });
  }, [sheet]);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !triggerRef.current?.contains(t)) onClose(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [onClose, triggerRef]);

  const off = status === 'disabled';
  useEffect(() => {
    // Arama kapanınca input disabled olur ve odak body'ye düşer; odağı panele al.
    if (off) panelRef.current?.focus();
    else inputRef.current?.focus();
  }, [off]);

  useEffect(() => setSelected(null), [normalized]);
  useEffect(() => setSelected((s) => (s && items.some((g) => g.id === s.id) ? s : null)), [items]);

  const cooldownLeft = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    setNow(Date.now());
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [cooldownUntil]);

  const canSend = !!selected && cooldownLeft === 0 && !disabled && !sending;
  const short = searched.length > 20 ? searched.slice(0, 20) + '…' : searched;

  function focusGrid() {
    gridWrapRef.current?.querySelector<HTMLElement>('[role="option"][tabindex="0"]')?.focus();
  }

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
      return;
    }
    if (!sheet || e.key !== 'Tab') return;
    const items = [...(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  async function submit() {
    if (!canSend || !selected) return;
    setSending(true);
    const ok = await onSend(selected.id);
    setSending(false);
    if (ok) onClose();
  }

  const panel = (
    <div
      ref={panelRef}
      className={`gif-panel${sheet ? ' is-sheet' : ''}${shift.up ? ' is-up' : ''}`}
      style={shift.x ? { left: shift.x } : undefined}
      role="dialog"
      tabIndex={-1}
      aria-modal={sheet || undefined}
      aria-labelledby={titleId}
      onKeyDown={onKey}
    >
      {sheet && <span className="sheet-grip" aria-hidden="true" />}
      <div className="gif-panel-head">
        <h2 id={titleId} className="section-title">
          GIF gönder
        </h2>
        <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label="Paneli kapat" onClick={() => onClose()}>
          <Icon name="x" size={18} />
        </button>
      </div>
      {disabled && (
        <p className="gif-chip gif-chip-offline">
          <Icon name="offline" size={14} />
          Bağlantı yok, GIF gönderemezsin.
        </p>
      )}
      {cooldownLeft > 0 && (
        <p className="gif-chip gif-chip-cooldown">
          <Icon name="clock" size={14} />
          {cooldownLeft} sn sonra tekrar gönderebilirsin
        </p>
      )}
      <div className="gif-search">
        <Icon name="search" size={20} />
        <input
          ref={inputRef}
          className="input"
          type="search"
          aria-label="GIF ara"
          autoComplete="off"
          spellCheck={false}
          maxLength={GIF_QUERY_MAX}
          placeholder={off ? 'Arama kapalı' : "GIPHY'de ara"}
          disabled={off}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
              e.preventDefault();
              focusGrid();
            }
          }}
        />
        {query && !off && (
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm gif-search-clear"
            aria-label="Aramayı temizle"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
          >
            <Icon name="x" size={16} />
          </button>
        )}
      </div>
      {!off && <p className="muted gif-label-row">{query.trim() ? 'Sonuçlar' : "Trend GIF'ler"}</p>}
      <div ref={gridWrapRef} className="gif-results">
        {status === 'loading' && items.length > 0 &&
          (reducedMotion ? (
            <p className="gif-loading-text" aria-hidden="true">
              Yükleniyor…
            </p>
          ) : (
            <div className="gif-loading-bar" aria-hidden="true" />
          ))}
        {status === 'loading' && !items.length && (
          <div className="gif-grid" aria-hidden="true">
            {Array.from({ length: SKELETONS }, (_, i) => (
              <span key={i} className="gif-tile gif-skeleton" />
            ))}
          </div>
        )}
        {items.length > 0 && (status === 'ready' || status === 'loading') && (
          <GifGrid
            items={items}
            selectedId={selected?.id ?? null}
            reducedMotion={reducedMotion}
            dim={status === 'loading'}
            onToggle={(g) => setSelected((s) => (s?.id === g.id ? null : g))}
          />
        )}
        <div className="gif-status" role="status" aria-live="polite">
          {status === 'loading' && <span className="sr-only">Yükleniyor…</span>}
          {status === 'empty' && (
            <>
              <Icon name="search" size={24} />
              <p>{searched ? `“${short}” için sonuç bulunamadı. Başka bir kelime dene.` : 'Şu an trend GIF yok.'}</p>
            </>
          )}
          {(status === 'error' || status === 'limited') && (
            <>
              <Icon name="alert" size={24} className="gif-status-alert" />
              <p>{status === 'error' ? "GIF'ler yüklenemedi." : 'Çok hızlı arıyorsun, biraz bekle.'}</p>
              <button type="button" className="btn btn-secondary" onClick={retry}>
                Tekrar dene
              </button>
            </>
          )}
          {off && (
            <>
              <Icon name="info" size={24} />
              <p>GIF araması şu an kullanılamıyor.</p>
            </>
          )}
        </div>
      </div>
      <p className="muted gif-note">GIF senin kartında herkese oynar.</p>
      <button type="button" className="btn btn-primary gif-submit" disabled={!canSend} onClick={submit}>
        {sending ? 'Gönderiliyor…' : 'Gönder'}
      </button>
      <div className="gif-attribution">
        <strong>Powered by GIPHY</strong>
        <span className="muted">GIF'ler GIPHY'den yüklenir.</span>
      </div>
    </div>
  );

  if (!sheet) return panel;
  return createPortal(
    <>
      <div className="gif-scrim" aria-hidden="true" />
      {panel}
    </>,
    document.body,
  );
}
