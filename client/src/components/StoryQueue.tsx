import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { isNumericCard } from '../../../shared/stats.ts';
import type { RoomView, StoryView } from '../../../shared/types.ts';
import StoryForm from './StoryForm.tsx';
import StoryDescription from './StoryText.tsx';
import Icon from './Icon.tsx';

interface MenuItem {
  label: string;
  danger?: boolean;
  run: () => void;
}

/** ⋯ menüsü: açılınca ilk öğeye odaklanır; ok tuşları/Home/End gezinir, Esc kapatıp tetikleyiciye döner. */
function StoryMenu({ id, title, open, onToggle, items }: {
  id: string;
  title: string;
  open: boolean;
  onToggle: (open: boolean) => void;
  items: (MenuItem | false)[];
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const list = items.filter((x): x is MenuItem => !!x);

  const toggleRef = useRef(onToggle);
  toggleRef.current = onToggle;

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    const onDoc = (e: MouseEvent) => {
      if (e.target instanceof Node && menuRef.current?.parentElement?.contains(e.target)) return;
      toggleRef.current(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  function close(refocus: boolean) {
    onToggle(false);
    if (refocus) triggerRef.current?.focus();
  }

  function onMenuKey(e: KeyboardEvent<HTMLDivElement>) {
    const btns = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])];
    const i = btns.indexOf(document.activeElement as HTMLButtonElement);
    let next = -1;
    if (e.key === 'ArrowDown') next = (i + 1) % btns.length;
    else if (e.key === 'ArrowUp') next = (i - 1 + btns.length) % btns.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = btns.length - 1;
    else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      return close(true);
    } else if (e.key === 'Tab') return close(false);
    if (next < 0) return;
    e.preventDefault();
    btns[next]?.focus();
  }

  return (
    <div className="story-menu">
      <button
        ref={triggerRef}
        type="button"
        data-menu-for={id}
        className="btn btn-ghost btn-icon btn-sm"
        aria-label={`${title} için işlemler`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => onToggle(!open)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault();
            onToggle(true);
          }
        }}
      >
        <Icon name="more" size={20} />
      </button>
      {open && (
        <div ref={menuRef} className="menu" role="menu" aria-label={`${title} için işlemler`} onKeyDown={onMenuKey}>
          {list.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              type="button"
              tabIndex={-1}
              className={item.danger ? 'danger' : undefined}
              onClick={() => {
                close(true);
                item.run();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export interface StoryActions {
  add: (title: string, description: string) => Promise<boolean>;
  update: (storyId: string, title: string, description: string) => Promise<boolean>;
  remove: (story: StoryView) => void;
  move: (storyId: string, toIndex: number) => void;
  activate: (storyId: string) => void;
}

export const totalPoints = (stories: StoryView[]) =>
  stories.reduce((sum, s) => sum + (s.points && isNumericCard(s.points) ? Number(s.points) : 0), 0);

interface Props {
  view: RoomView;
  isFacilitator: boolean;
  actions: StoryActions;
}

export default function StoryQueue({ view, isFacilitator, actions }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { stories } = view;

  const toggle = (id: string) =>
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <section className="queue" aria-labelledby="queue-title">
      <header className="queue-head">
        <h2 id="queue-title" className="section-title">
          Story sırası <span className="count">{stories.length}</span>
        </h2>
        {isFacilitator && !adding && (
          <button ref={addRef} type="button" className="btn btn-secondary btn-sm" onClick={() => setAdding(true)}>
            <Icon name="plus" size={16} /> Story ekle
          </button>
        )}
      </header>

      {adding && (
        <StoryForm
          submitLabel="Ekle"
          onSubmit={actions.add}
          onCancel={() => {
            setAdding(false);
            requestAnimationFrame(() => addRef.current?.focus());
          }}
        />
      )}

      {stories.length === 0 ? (
        <p className="muted empty">Henüz story yok. Eklemeden de hızlı tur oynayabilirsin.</p>
      ) : (
        <ol className="queue-list">
          {stories.map((s, i) => {
            const active = s.id === view.activeStoryId;
            const icon = active ? 'play' : s.points ? 'check' : 'circle';
            const status = active ? 'Aktif' : s.points ? 'Puanlandı' : 'Bekliyor';
            if (editingId === s.id)
              return (
                <li key={s.id} className="story editing">
                  <StoryForm
                    initial={s}
                    submitLabel="Kaydet"
                    onSubmit={(t, d) => actions.update(s.id, t, d)}
                    onCancel={() => {
                      setEditingId(null);
                      requestAnimationFrame(() =>
                        document.querySelector<HTMLButtonElement>(`[data-menu-for="${CSS.escape(s.id)}"]`)?.focus(),
                      );
                    }}
                  />
                </li>
              );
            return (
              <li key={s.id} className={`story${active ? ' active' : ''}`} aria-current={active ? 'true' : undefined}>
                <span className="story-icon">
                  <Icon name={icon} size={16} />
                </span>
                <span className="sr-only">{status}: </span>
                <div className="story-body">
                  <button
                    type="button"
                    className={`story-title${expanded.has(s.id) ? ' expanded' : ''}`}
                    aria-expanded={expanded.has(s.id)}
                    onClick={() => toggle(s.id)}
                    title={s.title}
                  >
                    {s.title}
                  </button>
                  {expanded.has(s.id) && <StoryDescription text={s.description} />}
                </div>
                {s.points && <span className="points-badge" aria-label={`Puan ${s.points}`}>{s.points}</span>}
                {isFacilitator && (
                  <StoryMenu
                    id={s.id}
                    title={s.title}
                    open={menuId === s.id}
                    onToggle={(open) => setMenuId(open ? s.id : null)}
                    items={[
                      !active && { label: 'Aktif yap', run: () => actions.activate(s.id) },
                      { label: 'Düzenle', run: () => setEditingId(s.id) },
                      i > 0 && { label: 'Yukarı taşı', run: () => actions.move(s.id, i - 1) },
                      i < stories.length - 1 && { label: 'Aşağı taşı', run: () => actions.move(s.id, i + 1) },
                      { label: 'Sil', danger: true, run: () => actions.remove(s) },
                    ]}
                  />
                )}
              </li>
            );
          })}
        </ol>
      )}

      {stories.length > 0 && <footer className="queue-foot">Toplam: {totalPoints(stories)} puan</footer>}
    </section>
  );
}
