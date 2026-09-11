"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { ArrowRight, X } from "lucide-react";
import { PreviewStage } from "@/components/preview/PreviewStage";
import type { CatalogEntry } from "@/lib/catalog";

type Props = {
  entry: CatalogEntry;
  /** The control that opened the dialog, which gets focus back on close. */
  returnFocusTo: HTMLElement | null;
  onClose: () => void;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

/**
 * A modal <dialog>: the rest of the page becomes inert, Escape closes it, the
 * page behind stops scrolling, Tab cycles inside, and focus returns to the
 * control that opened it.
 */
export function PreviewDialog({ entry, returnFocusTo, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previousOverflow;
      returnFocusTo?.focus();
    };
  }, [returnFocusTo]);

  const trapTab = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Tab" || !ref.current) return;
    const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !el.closest("[inert]") && el.getClientRects().length > 0,
    );
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <dialog
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClose={onClose}
      onKeyDown={trapTab}
      onClick={(event) => {
        // A click on the backdrop lands on the dialog element itself.
        if (event.target === ref.current) ref.current.close();
      }}
      className="m-auto w-[min(1100px,calc(100vw-24px))] max-w-none overflow-hidden rounded-2xl border border-void-line bg-void p-0 text-void-ink shadow-2xl backdrop:bg-[rgba(0,0,0,0.72)] backdrop:backdrop-blur-sm"
    >
      <div className="flex items-start gap-4 px-5 pb-4 pt-5 sm:px-6">
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight">
            {entry.name}
          </h2>
          <p id={descriptionId} className="mt-1 text-sm text-void-muted">
            {entry.description}
          </p>
        </div>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          aria-label="Close preview"
          className="focus-ring -mr-2 -mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-lg transition-colors hover:bg-[rgba(255,255,255,0.08)]"
        >
          <X aria-hidden size={18} />
        </button>
      </div>
      <div className="px-3 sm:px-4">
        <PreviewStage slug={entry.slug} name={entry.name} size="large" eager className="rounded-xl" />
      </div>
      <div className="flex justify-end px-5 py-4 sm:px-6">
        <Link
          href={`/component/${entry.slug}`}
          className="focus-ring inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-void-ink hover:underline"
        >
          Source and install
          <ArrowRight aria-hidden size={15} />
        </Link>
      </div>
    </dialog>
  );
}
