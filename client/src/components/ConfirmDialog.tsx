import { useCallback, useRef, useState } from 'react';

interface Pending {
  message: string;
  confirmLabel: string;
  danger: boolean;
  resolve: (ok: boolean) => void;
}

/** Native <dialog> ile onay: odak tuzağı ve Esc tarayıcıdan gelir. */
export function useConfirm() {
  const ref = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = useCallback(
    (message: string, confirmLabel: string, danger = false) =>
      new Promise<boolean>((resolve) => {
        setPending({ message, confirmLabel, danger, resolve });
        requestAnimationFrame(() => ref.current?.showModal());
      }),
    [],
  );

  const close = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
    ref.current?.close();
  };

  const dialog = (
    <dialog ref={ref} className="dialog" onCancel={() => close(false)} aria-labelledby="confirm-msg">
      {pending && (
        <>
          <p id="confirm-msg">{pending.message}</p>
          <div className="actions">
            <button type="button" className={`btn ${pending.danger ? 'btn-danger-ghost' : 'btn-primary'}`} onClick={() => close(true)}>
              {pending.confirmLabel}
            </button>
            <button type="button" className="btn btn-secondary" autoFocus onClick={() => close(false)}>
              Vazgeç
            </button>
          </div>
        </>
      )}
    </dialog>
  );

  return [dialog, confirm] as const;
}
