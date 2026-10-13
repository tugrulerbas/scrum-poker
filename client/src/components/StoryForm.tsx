import { useId, useState, type FormEvent } from 'react';
import { STORY_DESC_MAX, STORY_TITLE_MAX } from '../../../shared/constants.ts';

interface Props {
  initial?: { title: string; description: string };
  submitLabel: string;
  onSubmit: (title: string, description: string) => Promise<boolean>;
  onCancel: () => void;
}

const len = (s: string) => [...s].length;

export default function StoryForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [busy, setBusy] = useState(false);
  const id = useId();
  const titleLen = len(title.trim());
  const descLen = len(description.trim());
  const valid = titleLen > 0 && titleLen <= STORY_TITLE_MAX && descLen <= STORY_DESC_MAX;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    const ok = await onSubmit(title.trim(), description.trim());
    setBusy(false);
    if (ok) onCancel();
  }

  return (
    <form className="story-form" onSubmit={submit} onKeyDown={(e) => {
        if (e.key !== 'Escape') return;
        e.stopPropagation();
        onCancel();
      }}>
      <div className="field">
        <label htmlFor={`${id}-t`}>Başlık</label>
        <input id={`${id}-t`} className="input" value={title} autoFocus onChange={(e) => setTitle(e.target.value)} aria-invalid={titleLen > STORY_TITLE_MAX} />
        <div className="field-meta">
          <span />
          <span className={`counter${titleLen > STORY_TITLE_MAX ? ' over' : ''}`}>
            {titleLen}/{STORY_TITLE_MAX}
          </span>
        </div>
      </div>
      <div className="field">
        <label htmlFor={`${id}-d`}>Açıklama veya link (isteğe bağlı)</label>
        <textarea id={`${id}-d`} className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} aria-invalid={descLen > STORY_DESC_MAX} />
        <div className="field-meta">
          <span />
          <span className={`counter${descLen > STORY_DESC_MAX ? ' over' : ''}`}>
            {descLen}/{STORY_DESC_MAX}
          </span>
        </div>
      </div>
      <div className="actions">
        <button type="submit" className="btn btn-primary btn-sm" disabled={!valid || busy}>
          {submitLabel}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
          Vazgeç
        </button>
      </div>
    </form>
  );
}
