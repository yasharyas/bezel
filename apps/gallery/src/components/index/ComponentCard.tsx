"use client";

import Link from "next/link";
import { Maximize2 } from "lucide-react";
import { PreviewStage } from "@/components/preview/PreviewStage";
import { categoryLabel, type CatalogEntry } from "@/lib/catalog";

type Props = {
  entry: CatalogEntry;
  onExpand: (slug: string, trigger: HTMLElement) => void;
};

/**
 * One component in the index. The name is a real link that covers the card's
 * text area; the expand control opens a larger live preview in a dialog. That
 * is two tab stops per card: previews stay out of the tab order here and are
 * fully keyboard operable on the component page and in the dialog.
 */
export function ComponentCard({ entry, onExpand }: Props) {
  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-void-line bg-void transition-colors duration-200 hover:border-[rgba(255,255,255,0.22)] has-[a:focus-visible]:outline has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-white">
      <PreviewStage slug={entry.slug} name={entry.name} size="card" />
      <div className="relative flex items-start gap-3 border-t border-void-line px-4 pb-4 pt-3.5">
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-medium leading-snug text-void-ink">
            <Link
              href={`/component/${entry.slug}`}
              className="outline-none after:absolute after:inset-0 after:content-['']"
            >
              {entry.name}
            </Link>
          </h3>
          <p className="mt-1 line-clamp-2 text-[13px] leading-[1.45] text-void-muted">{entry.description}</p>
          <p className="mt-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-void-muted">
            {categoryLabel(entry.category)}
          </p>
        </div>
        <button
          type="button"
          aria-haspopup="dialog"
          aria-label={`Expand ${entry.name} preview`}
          title="Expand preview"
          onClick={(event) => onExpand(entry.slug, event.currentTarget)}
          className="focus-ring relative z-10 -mr-1.5 -mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-void-ink transition-colors hover:bg-[rgba(255,255,255,0.08)]"
        >
          <Maximize2 aria-hidden size={16} strokeWidth={2} />
        </button>
      </div>
    </article>
  );
}
