import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { GIF_URL_MAX } from '../../../shared/constants.ts';
import { checkGifUrl, type GifUrlError } from '../../../shared/gif.ts';
import { useMediaQuery } from '../useMediaQuery.ts';
import Icon from './Icon.tsx';

const ERRORS: Record<Exclude<GifUrlError, 'EMPTY'>, string> = {
  TOO_LONG: `Link en fazla ${GIF_URL_MAX} karakter olabilir.`,
  INVALID: 'Geçerli bir link değil.',
  NOT_HTTPS: 'Yalnızca https:// ile başlayan linkler kabul edilir.',
  CREDENTIALS: 'Kullanıcı adı/şifre içeren linkler kabul edilmez.',
  PRIVATE_HOST: 'Yerel ağ veya IP adresi linkleri kabul edilmez.',
};
const PREVIEW_ERROR = "Bu link bir görsel açmadı. GIF'in doğrudan linkini kopyala (sayfa linki değil).";

type Preview = 'idle' | 'loading' | 'loaded' | 'error';
const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
const EDGE = 16;

interface Props {
  cooldownUntil: number;
  disabled: boolean;
  reducedMotion: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  onSend: (url: string) => Promise<boolean>;
  onClose: (restoreFocus?: boolean) => void;
}

export default function GifPanel({ cooldownUntil, disabled, reducedMotion, triggerRef, onSend, onClose }: Props) {
  const [url, setUrl] = useState('');
  const [checked, setChecked] = useState('');
  const [preview, setPreview] = useState<Preview>('idle');
  const [sending, setSending] = useState(false);
  const [now, setNow] = useState(Date.now);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const errId = useId();
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
    inputRef.current?.focus();
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !triggerRef.current?.contains(t)) onClose(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [onClose, triggerRef]);

  useEffect(() => {
    const t = setTimeout(() => setChecked(url), 300);
    return () => clearTimeout(t);
  }, [url]);

  const check = checkGifUrl(checked);
  const previewUrl = check.ok ? check.url : '';

  useEffect(() => {
    setPreview(previewUrl ? 'loading' : 'idle');
  }, [previewUrl]);

  const cooldownLeft = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    setNow(Date.now());
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [cooldownUntil]);

  const stale = checked !== url;
  const error = !stale && !check.ok && check.reason !== 'EMPTY' ? ERRORS[check.reason] : preview === 'error' ? PREVIEW_ERROR : '';
  const canSend = !stale && check.ok && preview === 'loaded' && cooldownLeft === 0 && !disabled && !sending;

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
    if (!canSend || !check.ok) return;
    setSending(true);
    const ok = await onSend(check.url);
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
      <form
        className="gif-form"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="field">
          <label htmlFor={`${titleId}-url`} className="sr-only">
            GIF linki
          </label>
          <input
            ref={inputRef}
            id={`${titleId}-url`}
            className="input"
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="https://…/ornek.gif"
            value={url}
            aria-invalid={!!error || undefined}
            aria-describedby={error ? errId : undefined}
            onChange={(e) => setUrl(e.target.value)}
          />
          <p id={errId} className="field-error gif-error" role="status">
            {error && <Icon name="alert" size={14} />}
            {error}
          </p>
        </div>
        <div className={`gif-preview is-${preview}`}>
          {previewUrl && (
            <img
              key={previewUrl}
              src={previewUrl}
              alt=""
              referrerPolicy="no-referrer"
              decoding="async"
              hidden={reducedMotion || preview !== 'loaded'}
              onLoad={() => setPreview('loaded')}
              onError={() => setPreview('error')}
            />
          )}
          {preview === 'idle' && <span>Önizleme burada görünecek</span>}
          {preview === 'loading' && <span>Yükleniyor…</span>}
          {preview === 'error' && <Icon name="image-off" size={28} />}
          {preview === 'loaded' && reducedMotion && (
            <span className="gif-preview-msg">
              <Icon name="check" size={20} />
              Link geçerli, görsel yüklendi
            </span>
          )}
        </div>
        {cooldownLeft > 0 && (
          <p className="gif-chip gif-chip-cooldown">
            <Icon name="clock" size={14} />
            {cooldownLeft} sn sonra tekrar gönderebilirsin
          </p>
        )}
        <p className="muted gif-note">GIF senin kartında herkese oynar.</p>
        <button type="submit" className="btn btn-primary gif-submit" disabled={!canSend}>
          {sending ? 'Gönderiliyor…' : 'Gönder'}
        </button>
        <p className="muted gif-note">GIF, linkin bulunduğu siteden yüklenir; bu site izleyenlerin IP adresini görebilir.</p>
      </form>
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
