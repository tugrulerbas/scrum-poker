import { useEffect, useState } from 'react';
import { GIF_LOAD_TIMEOUT_MS, GIF_SHOW_MS } from '../../../shared/constants.ts';
import type { ActiveGif } from '../useGifs.ts';
import Icon from './Icon.tsx';

const FADE_OUT_MS = 150;

interface Props {
  gif: ActiveGif;
  reducedMotion: boolean;
  onDone: () => void;
}

export default function GifOverlay({ gif, reducedMotion, onDone }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Bileşen GIF id'siyle key'lenir; yeni GIF gelince state ve zamanlayıcılar sıfırlanır.
  // onDone her render'da yeni olduğundan bağımlılıklara alınmaz.
  useEffect(() => {
    const t = setTimeout(onDone, reducedMotion || loaded ? GIF_SHOW_MS : GIF_LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [reducedMotion, loaded]);

  useEffect(() => {
    if (reducedMotion || !loaded) return;
    const t = setTimeout(() => setLeaving(true), GIF_SHOW_MS - FADE_OUT_MS);
    return () => clearTimeout(t);
  }, [reducedMotion, loaded]);

  if (reducedMotion)
    return (
      <span className="gif-label" aria-hidden="true">
        <Icon name="image" size={14} />
        GIF gönderdi
      </span>
    );

  return (
    <div className={`seat-overlay${loaded && !leaving ? ' is-loaded' : ''}${leaving ? ' is-leaving' : ''}`} aria-hidden="true">
      <img
        src={gif.url}
        alt=""
        referrerPolicy="no-referrer"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={onDone}
      />
    </div>
  );
}
