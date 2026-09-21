"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { Pause, Play, Search, X } from "lucide-react";
import type { CatalogEntry, CategoryOption } from "@/lib/catalog";
import { SHOWCASE_POOL } from "@/lib/featured";
import { useReducedMotion } from "@/previews/kit";
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

  // Announce the result count once typing settles, not on every keystroke,
  // and not on first load, when nothing has changed yet.
  const firstCount = useRef(true);
  useEffect(() => {
    if (firstCount.current) {
      firstCount.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      setAnnouncement(
        filtered.length === 0
          ? "No components match."
          : `${filtered.length} ${filtered.length === 1 ? "component" : "components"} shown.`,
      );
    }, 450);
    return () => window.clearTimeout(t);
  }, [filtered.length]);

  const dialogEntry = dialog ? entries.find((entry) => entry.slug === dialog.slug) : undefined;
  const openDialog = (slug: string, trigger: HTMLElement) => setDialog({ slug, trigger });
  const filtering = category !== ALL || normalized.length > 0;

  return (
    <>
      <ShowcaseStrip entries={entries} featured={featured} onExpand={openDialog} held={Boolean(dialog)} />

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
              className="h-11 w-full rounded-xl border border-[rgba(255,255,255,0.36)] bg-void-raised pl-10 pr-10 text-[15px] text-void-ink placeholder:text-void-muted focus-visible:border-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white [&::-webkit-search-cancel-button]:appearance-none"
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
                      ? "border-transparent bg-paper-raised text-ink"
                      : "border-[rgba(255,255,255,0.18)] text-void-ink hover:border-[rgba(255,255,255,0.4)]"
                  }`}
                >
                  {option.label}
                  <span className={`tabular-nums ${active ? "text-ink-muted" : "text-void-muted"}`}>{option.count}</span>
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

/* ---------------------------------------------------------------- showcase */

const FIRST_SWAP_MS = 2600;
const BETWEEN_SWAPS_MS = 3200;
/** The arriving card mounts hidden for this long, so it has something to show
    by the time it is visible. */
const WARMUP_MS = 600;
/** The layers say 500ms; this waits a frame past the end. */
const CROSSFADE_MS = 560;

type Swap = { slot: number; slug: string; crossing: boolean };

/**
 * Change far-apart slots in turn, so two cards that touch never move one after
 * the other and the row never reads as a single flip.
 */
function slotOrder(count: number) {
  const half = Math.ceil(count / 2);
  const order: number[] = [];
  for (let i = 0; i < half; i++) {
    order.push(i);
    if (i + half < count) order.push(i + half);
  }
  return order;
}

type StripProps = {
  entries: CatalogEntry[];
  featured: string[];
  onExpand: (slug: string, trigger: HTMLElement) => void;
  /** An open dialog has to return focus to the card that opened it. */
  held: boolean;
};

/**
 * "Start with these": six live cards cycling through a larger pool, one card
 * at a time. Only the six on screen are ever mounted, plus the one arriving.
 *
 * It holds still while a pointer or focus is inside it, while a dialog is
 * open, off screen, in a hidden tab, on request, and under reduced motion,
 * where it settles on FEATURED instead of going blank.
 */
function ShowcaseStrip({ entries, featured, onExpand, held }: StripProps) {
  const bySlug = useMemo(() => new Map(entries.map((entry) => [entry.slug, entry])), [entries]);
  const opening = useMemo(() => featured.filter((slug) => bySlug.has(slug)), [featured, bySlug]);

  const [slots, setSlots] = useState(opening);
  const [swap, setSwap] = useState<Swap | null>(null);
  const waiting = useRef(SHOWCASE_POOL.filter((slug) => bySlug.has(slug) && !opening.includes(slug)));
  const cursor = useRef(0);
  const started = useRef(false);

  const [pointerInside, setPointerInside] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const [offScreen, setOffScreen] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [stopped, setStopped] = useState(false);
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const rotates = waiting.current.length > 0 && !reducedMotion;
  const paused = held || stopped || pointerInside || focusInside || offScreen || tabHidden;

  // A strip nobody can see has no reason to change.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setOffScreen(!entry.isIntersecting), {
      rootMargin: "80px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const update = () => setTabHidden(document.visibilityState === "hidden");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  // Start the next swap.
  useEffect(() => {
    if (!rotates || paused || swap) return;
    const t = window.setTimeout(
      () => {
        // Never move a card a keyboard user is standing in.
        if (listRef.current?.contains(document.activeElement)) {
          setFocusInside(true);
          return;
        }
        const next = waiting.current[0];
        if (!next) return;
        started.current = true;
        const order = slotOrder(slots.length);
        setSwap({ slot: order[cursor.current % order.length], slug: next, crossing: false });
      },
      started.current ? BETWEEN_SWAPS_MS : FIRST_SWAP_MS,
    );
    return () => window.clearTimeout(t);
  }, [rotates, paused, swap, slots.length]);

  // Let the arriving card mount and load, then cross it over.
  useEffect(() => {
    if (!swap || swap.crossing) return;
    // Nothing of it is visible yet, so a pause at this point simply drops it,
    // and the card the visitor is reaching for stays where it is.
    if (paused) {
      setSwap(null);
      return;
    }
    const t = window.setTimeout(
      () => setSwap((current) => (current ? { ...current, crossing: true } : current)),
      WARMUP_MS,
    );
    return () => window.clearTimeout(t);
  }, [swap, paused]);

  // The arriving card takes the slot; the one it replaced goes to the back of
  // the queue. A swap already under way finishes even if the strip pauses, so
  // it never stops half faded.
  useEffect(() => {
    if (!swap || !swap.crossing) return;
    const t = window.setTimeout(() => {
      const retired = slots[swap.slot];
      waiting.current = [...waiting.current.filter((slug) => slug !== swap.slug), retired];
      setSlots((current) => current.map((slug, i) => (i === swap.slot ? swap.slug : slug)));
      cursor.current += 1;
      setSwap(null);
    }, CROSSFADE_MS);
    return () => window.clearTimeout(t);
  }, [swap, slots]);

  if (!slots.length) return null;

  return (
    <section
      ref={rootRef}
      aria-labelledby="featured-heading"
      className="mx-auto max-w-7xl px-4 pb-6 sm:px-6"
    >
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h2 id="featured-heading" className="text-xl font-semibold tracking-tight">
          Start with these
        </h2>
        <div className="flex items-center gap-3">
          <p className="hidden text-sm text-void-muted sm:block">The pieces that best show what the library is for.</p>
          {rotates ? (
            <button
              type="button"
              aria-label={stopped ? "Start the rotation" : "Stop the rotation"}
              title={stopped ? "Start the rotation" : "Stop the rotation"}
              onClick={() => setStopped((value) => !value)}
              className="focus-ring -my-1.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-void-ink transition-colors hover:bg-[rgba(255,255,255,0.08)]"
            >
              {stopped ? <Play aria-hidden size={15} strokeWidth={2} /> : <Pause aria-hidden size={15} strokeWidth={2} />}
            </button>
          ) : null}
        </div>
      </div>

      {/* The pointer and focus tests are on the list rather than the section, so
          that pressing the control above does not leave the strip paused.

          Every card is the same height: the stage is a fixed ratio, the name is
          one line and the description is held at two by the path below, which
          is anchored to the card's own text and cannot reach into a preview. So
          a card arriving in one slot cannot move the row. */}
      <ul
        ref={listRef}
        onPointerEnter={() => setPointerInside(true)}
        onPointerLeave={() => setPointerInside(false)}
        onFocusCapture={() => setFocusInside(true)}
        onBlurCapture={() => {
          window.setTimeout(
            () => setFocusInside(Boolean(listRef.current?.contains(document.activeElement))),
            0,
          );
        }}
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 [&>li>div>article>div>div>h3+p]:min-h-[2.9em]"
      >
        {slots.map((slug, i) => {
          const swapping = swap?.slot === i ? swap : null;
          const layers = swapping ? [slug, swapping.slug] : [slug];
          return (
            <li key={i} className="relative flex">
              {layers.map((layerSlug, depth) => {
                const entry = bySlug.get(layerSlug);
                if (!entry) return null;
                const arriving = depth === 1;
                const crossing = Boolean(swapping?.crossing);
                const resting = arriving ? "translate-y-1.5 opacity-0" : "-translate-y-1.5 opacity-0";
                return (
                  <Layer
                    key={layerSlug}
                    live={arriving === crossing}
                    className={`flex w-full transition-[opacity,transform] duration-500 ease-bz-out ${
                      arriving ? "absolute inset-0" : ""
                    } ${arriving === crossing ? "translate-y-0 opacity-100" : resting}`}
                  >
                    <ComponentCard entry={entry} onExpand={onExpand} />
                  </Layer>
                );
              })}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * One card in a slot. React 18 has no `inert` prop, so the copy that is on its
 * way in or out gets the attribute directly: while it is still painted it stays
 * out of the tab order, out of the pointer's way and away from screen readers.
 */
function Layer({ live, className, children }: { live: boolean; className: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (live) el.removeAttribute("inert");
    else el.setAttribute("inert", "");
  }, [live]);
  return (
    <div ref={ref} aria-hidden={!live || undefined} className={className}>
      {children}
    </div>
  );
}
