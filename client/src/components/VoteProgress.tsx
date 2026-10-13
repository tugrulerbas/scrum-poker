import type { RoomView } from '../../../shared/types.ts';

export default function VoteProgress({ view }: { view: RoomView }) {
  const total = view.participants.length;
  const voted = view.participants.filter((p) => p.hasVoted).length;
  const offline = view.participants.filter((p) => !p.online).length;
  return (
    <div className="progress" aria-live="polite">
      <span className="progress-text">
        {voted}/{total} oy verdi{offline > 0 && <span className="muted"> ({offline} çevrimdışı)</span>}
      </span>
      <div className="progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={voted} aria-label="Oy ilerlemesi">
        <div className="progress-fill" style={{ width: `${total ? (voted / total) * 100 : 0}%` }} />
      </div>
    </div>
  );
}
