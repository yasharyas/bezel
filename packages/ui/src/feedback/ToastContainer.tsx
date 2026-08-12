import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface Toast {
  id: number;
  message: string;
}

let _toastId = 0;
const EXIT_MS = 200;

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

// @starting-style drives the entrance — it's paint-driven, not a mount
// effect + requestAnimationFrame, so it still animates even if the tab was
// backgrounded when the toast was queued (rAF is paused on hidden tabs).
// Exit uses the [data-leaving] attribute, toggled by plain React state.
const toastStyle = `
  .yui-toast {
    transform: translateY(0);
    opacity: 1;
    transition: transform 200ms cubic-bezier(0.23,1,0.32,1), opacity 200ms cubic-bezier(0.23,1,0.32,1);
  }
  @starting-style {
    .yui-toast { transform: translateY(100%); opacity: 0; }
  }
  .yui-toast[data-leaving="true"] { transform: translateY(100%); opacity: 0; }
`;

/**
 * Toasts fire in bursts, so exit uses an interruptible CSS transition (not
 * @keyframes) — the same approach Sonner uses. When a toast drops out of the
 * `toasts` prop it isn't unmounted immediately; it's kept around just long
 * enough to play its exit transition, matching how it slid in.
 */
export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  const [rendered, setRendered] = useState<(Toast & { leaving?: boolean })[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const incomingIds = new Set(toasts.map((t) => t.id));
    setRendered((prev) => {
      const stillLeaving = prev.filter((t) => !incomingIds.has(t.id) && t.leaving);
      const newlyLeaving = prev.filter((t) => !incomingIds.has(t.id) && !t.leaving);

      newlyLeaving.forEach((t) => {
        const timer = setTimeout(() => {
          setRendered((curr) => curr.filter((c) => c.id !== t.id));
          timers.current.delete(t.id);
        }, EXIT_MS);
        timers.current.set(t.id, timer);
      });

      return [...toasts, ...stillLeaving, ...newlyLeaving.map((t) => ({ ...t, leaving: true }))];
    });
  }, [toasts]);

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach(clearTimeout);
  }, []);

  if (rendered.length === 0) return null;

  return createPortal(
    <>
      <style>{toastStyle}</style>
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
        {rendered.map((t) => (
          <div
            key={t.id}
            data-leaving={t.leaving ? 'true' : undefined}
            className="yui-toast bg-neutral-800 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg"
          >
            {t.message}
          </div>
        ))}
      </div>
    </>,
    document.body
  );
}
