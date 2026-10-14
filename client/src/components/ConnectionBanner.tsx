import { useEffect, useRef, useState } from 'react';
import { socket } from '../socket.ts';
import Icon from './Icon.tsx';

type State = 'ok' | 'reconnecting' | 'failed' | 'back';

const FAIL_AFTER = 15000;
const BACK_FOR = 2000;

export function useConnection() {
  const [state, setState] = useState<State>(socket.connected ? 'ok' : 'reconnecting');
  const retryRef = useRef<() => void>(() => {});

  useEffect(() => {
    let wasDown = !socket.connected;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const startWaiting = () => {
      clearTimeout(timer);
      setState('reconnecting');
      timer = setTimeout(() => setState((s) => (s === 'reconnecting' ? 'failed' : s)), FAIL_AFTER);
    };
    const onConnect = () => {
      clearTimeout(timer);
      if (wasDown) {
        setState('back');
        timer = setTimeout(() => setState('ok'), BACK_FOR);
      } else setState('ok');
      wasDown = false;
    };
    const onDisconnect = () => {
      wasDown = true;
      startWaiting();
    };

    retryRef.current = () => {
      wasDown = true;
      startWaiting();
      if (!socket.active) socket.connect();
      else {
        socket.disconnect();
        socket.connect();
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    // İlk yüklemede hiç bağlanamazsak da 15 sn sonra "Bağlanamadık" göster.
    // Render ile effect arasında bağlanmışsak 'connect' kaçmıştır.
    if (!socket.connected) startWaiting();
    else setState('ok');
    return () => {
      clearTimeout(timer);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return { state, retry: () => retryRef.current() };
}

export type Connection = ReturnType<typeof useConnection>;

export default function ConnectionBanner({ connection }: { connection: Connection }) {
  const { state, retry } = connection;
  if (state === 'ok') return null;
  if (state === 'back')
    return (
      <div className="banner banner-success" role="status">
        <Icon name="check" /> Tekrar bağlandın
      </div>
    );
  if (state === 'failed')
    return (
      <div className="banner banner-danger" role="alert">
        <Icon name="offline" /> Bağlanamadık.
        <button type="button" className="btn btn-secondary btn-sm" onClick={retry}>
          Tekrar dene
        </button>
      </div>
    );
  return (
    <div className="banner banner-warning" role="status">
      <span className="spinner" aria-hidden="true" /> Bağlantı koptu, yeniden bağlanıyoruz…
    </div>
  );
}
