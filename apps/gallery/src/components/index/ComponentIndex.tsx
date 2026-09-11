"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import type { CatalogEntry, CategoryOption } from "@/lib/catalog";
import { ComponentCard } from "./ComponentCard";
import { PreviewDialog } from "./PreviewDialog";

type Props = {
  entries: CatalogEntry[];
  categories: CategoryOption[];
  featured: string[];
};

type ViewProps = Props & { initialQuery: string; initialCategory: string };

const ALL = "all";

/** Reads `?q=` and `?category=` so filtered views can be linked. */
export function ComponentIndex(props: Props) {
  const params = useSearchParams();
  return (
    <ComponentIndexView
      {...props}
      initialQuery={params.get("q") ?? ""}
      initialCategory={params.get("category") ?? ALL}
    />
  );
}

export function ComponentIndexView({ entries, categories, featured, initialQuery, initialCategory }: ViewProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(
    categories.some((c) => c.id === initialCategory) ? initialCategory : ALL,
  );
  const [dialog, setDialog] = useState<{ slug: string; trigger: HTMLElement } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const normalized = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      entries.filter((entry) => {
        if (category !== ALL && entry.category !== category) return false;
        if (!normalized) return true;
        return [entry.name, entry.description, entry.category, ...entry.tags].some((field) =>
          field.toLowerCase().includes(normalized),
        );
      }),
    [entries, category, normalized],
  );

  // Reflect the filters in the URL without adding history entries.
  useEffect(() => {
    const t = window.setTimeout(() => {
      const next = new URLSearchParams(window.location.search);
      if (normalized) next.set("q", query.trim());
      else next.delete("q");
      if (category !== ALL) next.set("category", category);
      else next.delete("category");
      const search = next.toString();
      const url = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;
      if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
        window.history.replaceState(window.history.state, "", url);
      }
    }, 250);
    return () => window.clearTimeout(t);
  }, [query, normalized, category]);

  // Announce the result count once typing settles, not on every keystroke.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setAnnouncement(
        filtered.length === 0
          ? "No components match."
          : `${filtered.length} ${filtered.length === 1 ? "component" : "components"} shown.`,
      );
    }, 450);
    return () => window.clearTimeout(t);
  }, [filtered.length]);

  const featuredEntries = featured
    .map((slug) => entries.find((entry) => entry.slug === slug))
    .filter((entry): entry is CatalogEntry => Boolean(entry));
  const dialogEntry = dialog ? entries.find((entry) => entry.slug === dialog.slug) : undefined;
  const openDialog = (slug: string, trigger: HTMLElement) => setDialog({ slug, trigger });
  const filtering = category !== ALL || normalized.length > 0;

  return (
    <>
      {featuredEntries.length ? (
        <section aria-labelledby="featured-heading" className="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <h2 id="featured-heading" className="text-xl font-semibold tracking-tight">
              Start with these
            </h2>
            <p className="hidden text-sm text-void-muted sm:block">The pieces that best show what the library is for.</p>
          </div>
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredEntries.map((entry) => (
              <li key={entry.slug} className="flex">
                <ComponentCard entry={entry} onExpand={openDialog} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section id="components" aria-labelledby="index-heading" className="mx-auto max-w-7xl scroll-mt-20 px-4 pt-14 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <h2 id="index-heading" className="text-xl font-semibold tracking-tight">
            All components
          </h2>
          <p className="text-sm text-void-muted">
            {filtering ? `Showing ${filtered.length} of ${entries.length}` : `${entries.length} components`}
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-4">
          <div className="relative max-w-md">
            <label htmlFor="component-search" className="sr-only">
              Search components
            </label>
            <Search aria-hidden size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-void-muted" />
            <input
              ref={searchRef}
              id="component-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, purpose or tag"
              autoComplete="off"
              spellCheck={false}
              className="h-11 w-full rounded-xl border border-[rgba(255,255,255,0.18)] bg-void-raised pl-10 pr-10 text-[15px] text-void-ink placeholder:text-void-muted focus-visible:border-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white [&::-webkit-search-cancel-button]:appearance-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
                aria-label="Clear search"
                className="focus-ring absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-void-ink hover:bg-[rgba(255,255,255,0.08)]"
              >
                <X aria-hidden size={16} />
              </button>
            ) : null}
          </div>

          <div
            role="group"
            aria-label="Filter by category"
            className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1 [mask-image:linear-gradient(to_right,transparent,#000_16px,#000_calc(100%-24px),transparent)] sm:-mx-6 sm:px-6"
          >
            {[{ id: ALL, label: "All", count: entries.length }, ...categories].map((option) => {
              const active = option.id === category;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(option.id)}
                  className={`focus-ring inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-sm transition-colors ${
                    active
                      ? "border-transparent bg-paper-raised text-[#0a0a0a]"
                      : "border-[rgba(255,255,255,0.18)] text-void-ink hover:border-[rgba(255,255,255,0.4)]"
                  }`}
                >
                  {option.label}
                  <span className={`tabular-nums ${active ? "text-[#4a4a4c]" : "text-void-muted"}`}>{option.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>

        {filtered.length ? (
          <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((entry) => (
              <li key={entry.slug} className="flex" data-card-slug={entry.slug}>
                <ComponentCard entry={entry} onExpand={openDialog} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-void-line px-6 py-16 text-center">
            <p className="text-base text-void-ink">
              No components match{normalized ? ` “${query.trim()}”` : ""}
              {category !== ALL ? ` in ${categories.find((c) => c.id === category)?.label}` : ""}.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory(ALL);
              }}
              className="focus-ring mt-4 rounded-lg border border-[rgba(255,255,255,0.18)] px-3.5 py-2 text-sm text-void-ink hover:border-[rgba(255,255,255,0.4)]"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {dialog && dialogEntry ? (
        <PreviewDialog entry={dialogEntry} returnFocusTo={dialog.trigger} onClose={() => setDialog(null)} />
      ) : null}
    </>
  );
}
