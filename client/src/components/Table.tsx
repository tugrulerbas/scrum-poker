import type { ReactNode } from 'react';
import type { RoomView } from '../../../shared/types.ts';
import type { ActiveGif } from '../useGifs.ts';
import Avatar from './Avatar.tsx';
import CardBack from './CardBack.tsx';
import GifOverlay from './GifOverlay.tsx';
import Icon, { CardFace, type IconName } from './Icon.tsx';

interface Props {
  view: RoomView;
  gifs: Record<string, ActiveGif>;
  onGifDone: (fromId: string, id: string) => void;
  reducedMotion: boolean;
  gifSlot?: ReactNode;
}

export default function Table({ view, gifs, onGifDone, reducedMotion, gifSlot }: Props) {
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
        const gif = p.online ? gifs[p.id] : undefined;
        return (
          <li key={p.id} className={`seat seat-${state}${isYou ? ' seat-you' : ''}`}>
            {gif && (
              <GifOverlay key={gif.id} gif={gif} reducedMotion={reducedMotion} onDone={() => onGifDone(p.id, gif.id)} />
            )}
            {isYou && gifSlot}
            <div className="seat-card" aria-hidden={!revealed && !p.hasVoted}>
              {revealed ? (
                <span className={`seat-value${vote ? '' : ' none'}`}>{vote ? <CardFace card={vote} /> : '—'}</span>
              ) : p.hasVoted ? (
                <CardBack seed={p.id}>
                  <span className="sr-only">Oy verdi, değer gizli</span>
                </CardBack>
              ) : (
                <span className="card-slot" />
              )}
            </div>
            <div className="seat-who">
              <Avatar name={p.name} size={24} />
              <span className="seat-name" title={p.name}>
                {p.name}
              </span>
              {isYou && <span className="you-tag">(sen)</span>}
            </div>
            <div className="seat-meta">
              {isF && (
                <span className="badge-f" title="Owner">
                  <Icon name="crown" size={14} />
                  <span className="badge-f-text">Owner</span>
                </span>
              )}
              {(!revealed || !p.online) && (
                <span className={`chip chip-${state}`}>
                  <Icon name={icon} size={14} />
                  {chip}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
