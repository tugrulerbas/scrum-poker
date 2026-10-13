import { useCallback, useEffect, useState } from 'react';
import Home from './pages/Home.tsx';
import Room from './pages/Room.tsx';
import { ToastProvider } from './toasts.tsx';

export type Navigate = (path: string, state?: { justCreated?: boolean }) => void;

const ROOM_PATH = /^\/r\/([A-Za-z0-9_-]{1,64})\/?$/;

export default function App() {
  const [path, setPath] = useState(() => location.pathname);

  useEffect(() => {
    const onPop = () => setPath(location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback<Navigate>((to, state) => {
    history.pushState(state ?? null, '', to);
    setPath(to);
  }, []);

  const match = ROOM_PATH.exec(path);
  return (
    <ToastProvider>
      {match ? (
        <Room key={match[1]} roomId={match[1]} navigate={navigate} justCreated={!!history.state?.justCreated} />
      ) : (
        <Home navigate={navigate} />
      )}
    </ToastProvider>
  );
}
