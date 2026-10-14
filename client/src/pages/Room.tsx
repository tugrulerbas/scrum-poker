import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { Card, StoryView } from '../../../shared/types.ts';
import type { Navigate } from '../App.tsx';
import { useConfirm } from '../components/ConfirmDialog.tsx';
import ConnectionBanner, { useConnection } from '../components/ConnectionBanner.tsx';
import Deck from '../components/Deck.tsx';
import ErrorScreen from '../components/ErrorScreen.tsx';
import FacilitatorControls from '../components/FacilitatorControls.tsx';
import GifSender from '../components/GifSender.tsx';
import GifToggle from '../components/GifToggle.tsx';
import Icon from '../components/Icon.tsx';
import Logo from '../components/Logo.tsx';
import NameForm from '../components/NameForm.tsx';
import Results from '../components/Results.tsx';
import ShareLink from '../components/ShareLink.tsx';
import StoryQueue, { type StoryActions } from '../components/StoryQueue.tsx';
import StorySummary from '../components/StorySummary.tsx';
import StoryDescription from '../components/StoryText.tsx';
import Table from '../components/Table.tsx';
import ThemeToggle from '../components/ThemeToggle.tsx';
import VoteProgress from '../components/VoteProgress.tsx';
import { useToast } from '../toasts.tsx';
import { useGifs } from '../useGifs.ts';
import { useMediaQuery } from '../useMediaQuery.ts';
import { useRoom } from '../useRoom.ts';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface Props {
  roomId: string;
  navigate: Navigate;
  justCreated: boolean;
}

export default function Room({ roomId, navigate, justCreated }: Props) {
  const { status, setStatus, view, myVote, join, vote, act } = useRoom(roomId);
  const connection = useConnection();
  const gifs = useGifs(view);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const toast = useToast();
  const [dialog, confirm] = useConfirm();
  const [sheetOpen, setSheetOpen] = useState(false);
  const compact = useMediaQuery('(max-width: 1023px)');
  const sideRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const goHome = () => navigate('/');
  const sheetActive = compact && sheetOpen;

  const openSheet = () => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    setSheetOpen(true);
  };
  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    const el = returnFocusRef.current;
    returnFocusRef.current = null;
    setTimeout(() => el?.isConnected && el.focus(), 0);
  }, []);

  useEffect(() => {
    if (!compact) setSheetOpen(false);
  }, [compact]);

  useEffect(() => {
    if (!sheetActive) return;
    // inert kalkıp panel görünür olduktan sonra odakla.
    const t = setTimeout(() => sideRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus(), 0);
    return () => clearTimeout(t);
  }, [sheetActive]);

  function onSheetKey(e: KeyboardEvent<HTMLElement>) {
    if (!sheetActive) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeSheet();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = [...(sideRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].filter((el) => el.offsetParent !== null);
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

  if (status === 'notFound')
    return (
      <ErrorScreen icon="search" title="Bu oda bulunamadı" text="Süresi dolmuş ya da link hatalı olabilir.">
        <button type="button" className="btn btn-primary" onClick={goHome}>
          Yeni oda kur
        </button>
      </ErrorScreen>
    );

  if (status === 'full')
    return (
      <ErrorScreen icon="users" title="Oda dolu" text="Bu odada en fazla 20 kişi olabilir. Yer açılınca tekrar dene ya da yeni bir oda kur.">
        <button type="button" className="btn btn-primary" onClick={() => setStatus('name')}>
          Tekrar dene
        </button>
        <button type="button" className="btn btn-secondary" onClick={goHome}>
          Yeni oda kur
        </button>
      </ErrorScreen>
    );

  if (status === 'name')
    return (
      <div className="page">
        <header className="topbar">
          <Logo onClick={goHome} />
          <div className="topbar-end">
            <ThemeToggle />
          </div>
        </header>
        <ConnectionBanner connection={connection} />
        <main className="center-page">
          <NameForm
            title="Odaya katıl"
            subtitle="Sadece adını yaz, gerisini biz hallederiz."
            submitLabel="Katıl"
            loadingLabel="Katılıyorsun…"
            onSubmit={join}
          />
        </main>
      </div>
    );

  if (status === 'loading' || !view)
    return (
      <div className="page">
        <ConnectionBanner connection={connection} />
        <main className="center-page" aria-busy="true">
          <span className="spinner spinner-lg" role="img" aria-label="Yükleniyor" />
        </main>
      </div>
    );

  const isF = view.facilitatorId === view.you.id;
  const revealed = view.round.status === 'revealed';
  const offline = connection.state !== 'ok' && connection.state !== 'back';
  const activeStory = view.stories.find((s) => s.id === view.activeStoryId);
  const showSummary = view.stories.length > 0 && !view.activeStoryId && view.stories.every((s) => s.points);
  const roundId = view.round.id;

  async function revote() {
    const hasVotes = view!.participants.some((p) => p.hasVoted);
    if (hasVotes && !(await confirm('Mevcut oylar silinecek. Devam edilsin mi?', 'Yeniden oyla'))) return;
    act('round:revote', { roundId });
  }

  async function savePoints(storyId: string, card: Card) {
    if (await act('story:setPoints', { storyId, card })) toast('Puan kaydedildi', 'success');
  }

  const storyActions: StoryActions = {
    add: (title, description) => act('story:add', { title, description }),
    update: (storyId, title, description) => act('story:update', { storyId, title, description }),
    remove: async (story: StoryView) => {
      if (await confirm('Bu story silinsin mi?', 'Sil', true)) act('story:delete', { storyId: story.id });
    },
    move: (storyId, toIndex) => act('story:move', { storyId, toIndex }),
    activate: (storyId) => act('story:activate', { storyId }),
  };

  return (
    <div className={`page room${revealed ? ' is-revealed' : ''}`}>
      <header className="topbar">
        <Logo onClick={goHome} />
        <ShareLink roomId={view.id} highlight={justCreated} />
        <div className="topbar-end">
          <ThemeToggle />
          <GifToggle muted={gifs.muted} onChange={gifs.setMuted} />
        </div>
      </header>
      <ConnectionBanner connection={connection} />

      <div className={`room-grid${offline ? ' is-offline' : ''}`}>
        <main className="stage">
          <section className="active-story" aria-label="Aktif story">
            <h1 className="active-title">{activeStory ? activeStory.title : 'Hızlı tur'}</h1>
            {activeStory && <StoryDescription text={activeStory.description} />}
          </section>

          {showSummary ? (
            <StorySummary view={view} isFacilitator={isF} onAdd={storyActions.add} />
          ) : (
            <>
              <Table
                view={view}
                gifs={gifs.active}
                onGifDone={gifs.dismiss}
                reducedMotion={reducedMotion}
                gifSlot={
                  <GifSender cooldownUntil={gifs.cooldownUntil} offline={offline} reducedMotion={reducedMotion} onSend={gifs.send} />
                }
              />
              <VoteProgress view={view} />
              {isF ? (
                <FacilitatorControls
                  view={view}
                  disabled={offline}
                  onReveal={() => act('round:reveal', { roundId })}
                  onRevote={revote}
                  onNext={() => act('story:next', {})}
                />
              ) : (
                !revealed && <p className="muted hint">Owner kartları açınca sonuçlar görünür.</p>
              )}
              {revealed && <Results view={view} isFacilitator={isF} disabled={offline} onSave={savePoints} />}
              <Deck
                selected={myVote}
                disabled={revealed || offline}
                lockedHint={revealed ? (isF ? 'Yeni tur için "Yeniden oyla"ya bas.' : 'Kartlar açıldı. Yeni turda oy verebilirsin.') : undefined}
                onSelect={vote}
              />
            </>
          )}
        </main>

        <aside
          ref={sideRef}
          id="story-panel"
          className={`side${sheetOpen ? ' open' : ''}`}
          aria-labelledby="queue-title"
          role={compact ? 'dialog' : undefined}
          aria-modal={sheetActive || undefined}
          inert={compact && !sheetOpen}
          onKeyDown={onSheetKey}
        >
          <div className="sheet-head">
            <span className="sheet-grip" aria-hidden="true" />
            <button type="button" className="btn btn-ghost btn-sm sheet-close" onClick={closeSheet}>
              Kapat <Icon name="x" size={16} />
            </button>
          </div>
          <StoryQueue view={view} isFacilitator={isF} actions={storyActions} />
        </aside>
      </div>

      {sheetActive && <div className="sheet-scrim" aria-hidden="true" onClick={closeSheet} />}
      <button
        type="button"
        className="sheet-tab"
        aria-expanded={sheetOpen}
        aria-controls="story-panel"
        onClick={() => (sheetOpen ? closeSheet() : openSheet())}
      >
        Story sırası ({view.stories.length})
      </button>
      {dialog}
    </div>
  );
}
