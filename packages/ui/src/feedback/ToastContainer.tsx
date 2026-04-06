import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface Toast {
  id: number;
  message: string;
}

let _toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, duration = 2500) => {
    const id = ++_toastId;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return { toasts, show };
}

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;
  return createPortal(
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-neutral-800 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg animate-[slideUp_0.2s_ease-out]"
        >
          {t.message}
        </div>
      ))}
    </div>,
    document.body
  );
}
