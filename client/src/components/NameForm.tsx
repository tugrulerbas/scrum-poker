import { useId, useState, type FormEvent } from 'react';
import { NAME_MAX } from '../../../shared/constants.ts';
import type { AckError } from '../../../shared/types.ts';
import { getProfileName } from '../identity.ts';
import Icon from './Icon.tsx';

interface Props {
  title: string;
  subtitle: string;
  submitLabel: string;
  loadingLabel: string;
  /** Hata yoksa null, varsa sunucu hatası. */
  onSubmit: (name: string) => Promise<AckError | null>;
  errorText?: (err: AckError) => string;
}

const len = (s: string) => [...s].length;

export default function NameForm({ title, subtitle, submitLabel, loadingLabel, onSubmit, errorText }: Props) {
  const [name, setName] = useState(getProfileName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const id = useId();

  const trimmed = name.trim();
  const tooLong = len(trimmed) > NAME_MAX;
  const shownError = tooLong ? 'En fazla 24 karakter olabilir.' : error;

  async function submit(value: string) {
    if (!value.trim()) return setError('Adını yazmadan olmaz.');
    if (len(value.trim()) > NAME_MAX) return;
    setBusy(true);
    setError(null);
    setSuggestion(null);
    const err = await onSubmit(value);
    setBusy(false);
    if (!err) return;
    if (err.error === 'NAME_TAKEN' && err.suggestion) {
      setSuggestion(err.suggestion);
      setError(`Bu isim odada kullanılıyor. “${err.suggestion}” olarak katılmak ister misin?`);
    } else if (err.error === 'INVALID_NAME') {
      setError(err.reason === 'TOO_LONG' ? 'En fazla 24 karakter olabilir.' : 'Adını yazmadan olmaz.');
    } else {
      setError(errorText?.(err) ?? 'Bir şeyler ters gitti, tekrar dene.');
    }
  }

  return (
    <form
      className="panel name-form"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        submit(name);
      }}
    >
      <h1>{title}</h1>
      <p className="muted">{subtitle}</p>
      <div className="field">
        <label htmlFor={id}>Adın</label>
        <input
          id={id}
          className="input"
          value={name}
          placeholder="Örn. Tuğrul"
          autoComplete="nickname"
          autoFocus
          aria-invalid={!!shownError}
          aria-describedby={shownError ? `${id}-err` : undefined}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
            setSuggestion(null);
          }}
        />
        <div className="field-meta">
          <span id={`${id}-err`} className="field-error" role={shownError ? 'alert' : undefined}>
            {shownError}
          </span>
          <span className={`counter${tooLong ? ' over' : ''}`}>
            {len(trimmed)}/{NAME_MAX}
          </span>
        </div>
      </div>
      {suggestion ? (
        <div className="actions">
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => {
            setName(suggestion);
            submit(suggestion);
          }}>
            Evet, bunu kullan
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => {
            setSuggestion(null);
            setError(null);
            document.getElementById(id)?.focus();
          }}>
            Başka isim yaz
          </button>
        </div>
      ) : (
        <button type="submit" className="btn btn-primary btn-block" disabled={busy || !trimmed || tooLong}>
          {busy ? <><span className="spinner" aria-hidden="true" /> {loadingLabel}</> : <>{submitLabel} <Icon name="arrowRight" /></>}
        </button>
      )}
    </form>
  );
}
