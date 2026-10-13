import { useId } from 'react';
import type { RoomView } from '../../../shared/types.ts';
import Icon from './Icon.tsx';

interface Props {
  view: RoomView;
  disabled?: boolean;
  onReveal: () => void;
  onRevote: () => void;
  onNext: () => void;
}

export default function FacilitatorControls({ view, disabled = false, onReveal, onRevote, onNext }: Props) {
  const tipId = useId();
  const voting = view.round.status === 'voting';
  const hasVotes = view.participants.some((p) => p.hasVoted);
  const revealBlocked = !hasVotes;
  return (
    <div className="controls">
      {voting && (
        <span className="tooltip-wrap">
          {/* aria-disabled: odaklanabilir kalsın ki ipucu klavye ve dokunmayla da görünsün. */}
          <button
            type="button"
            className="btn btn-primary"
            aria-disabled={revealBlocked || disabled}
            aria-describedby={revealBlocked ? tipId : undefined}
            onClick={() => !revealBlocked && !disabled && onReveal()}
          >
            Kartları aç
          </button>
          {revealBlocked && (
            <span id={tipId} role="tooltip" className="tooltip">
              Henüz kimse oy vermedi
            </span>
          )}
        </span>
      )}
      {(!voting || hasVotes) && (
        <button type="button" className="btn btn-secondary" disabled={disabled} onClick={onRevote}>
          Yeniden oyla
        </button>
      )}
      {view.stories.length > 0 && (
        <button type="button" className="btn btn-ghost" disabled={disabled} onClick={onNext}>
          Sonraki story <Icon name="arrowRight" />
        </button>
      )}
    </div>
  );
}
