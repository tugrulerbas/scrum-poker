import Icon from './components/Icon.tsx';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type Kind = 'info' | 'success' | 'warning';
interface Toast {
  id: number;
  text: string;
  kind: Kind;
  silent: boolean;
}

/** silent: duyuruyu çağıran bileşen kendi aria-live alanıyla yapıyorsa çift okunmasın. */
type Push = (text: string, kind?: Kind, opts?: { silent?: boolean }) => void;

const ToastContext = createContext<Push>(() => {});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const push = useCallback<Push>((text, kind = 'info', opts) => {
    const id = nextId.current++;
    setToasts((t) => [...t.slice(-3), { id, text, kind, silent: !!opts?.silent }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`} aria-hidden={t.silent || undefined}>
            <Icon name={t.kind === 'success' ? 'check' : t.kind === 'warning' ? 'alert' : 'info'} />
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
