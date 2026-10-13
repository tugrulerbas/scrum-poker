import type { RoomView } from '../../../shared/types.ts';
import Avatar from './Avatar.tsx';
import Icon, { CardFace, type IconName } from './Icon.tsx';

export default function Table({ view }: { view: RoomView }) {
  const revealed = view.round.status === 'revealed';
  return (
    <ul className="table" aria-label="Masa">
      {view.participants.map((p) => {
        const isF = p.id === view.facilitatorId;
        const isYou = p.id === view.you.id;
        const vote = view.round.votes?.[p.id];
        let state: string;
        let chip: string;
        let icon: IconName;
        if (!p.online) [state, chip, icon] = ['offline', 'Çevrimdışı', 'offline'];
        else if (p.hasVoted) [state, chip, icon] = ['voted', 'Oy verdi', 'check'];
        else [state, chip, icon] = ['waiting', 'Bekleniyor', 'clock'];
        return (
          <li key={p.id} className={`seat seat-${state}${isYou ? ' seat-you' : ''}`}>
            <div className="seat-card" aria-hidden={!revealed && !p.hasVoted}>
              {revealed ? (
                <span className={`seat-value${vote ? '' : ' none'}`}>{vote ? <CardFace card={vote} /> : '—'}</span>
              ) : p.hasVoted ? (
                <span className="card-back">
                  <span className="sr-only">Oy verdi, değer gizli</span>
                </span>
              ) : (
                <span className="card-slot" />
              )}
            </div>
            <div className="seat-who">
              <Avatar name={p.name} size={32} />
              <span className="seat-name" title={p.name}>
                {p.name}
              </span>
              {isYou && <span className="you-tag">(sen)</span>}
            </div>
            <div className="seat-meta">
              {isF && (
                <span className="badge-f" title="Facilitator">
                  <Icon name="crown" size={14} />
                  <span className="badge-f-text">Facilitator</span>
                </span>
              )}
              {!revealed || !p.online ? <span className={`chip chip-${state}`}>
                  <Icon name={icon} size={14} />
                  {chip}
                </span> : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
