"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";

/*
 * SidewaysScroll: a row of cards that pins to the viewport and pans one pixel
 * sideways for every pixel scrolled down, then holds on the last card for a
 * moment before the page moves on.
 *
 * It needs no scroll library. The section is made as tall as the pan, an inner
 * block sticks to the top, and a single passive scroll listener maps the page's
 * scroll position to the row's translate. Tabbing to a card that is out of view
 * scrolls the page to the point where that card is in view, so the keyboard
 * never lands on something hidden.
 *
 * Narrow or short viewports, reduced motion and rows that already fit get a
 * plain snap scroller instead.
 */

const CSS = `
.bz-ss{position:relative;color:var(--bz-ink,#0a0a0a);font-family:var(--bz-font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif)}
.bz-ss *,.bz-ss *::before,.bz-ss *::after{box-sizing:border-box}
.bz-ss-sticky{display:flex;flex-direction:column;justify-content:center;gap:20px;padding-block:24px}
.bz-ss[data-layout="pinned"] .bz-ss-sticky{position:sticky;top:var(--bz-ss-top,0px);height:calc(100vh - var(--bz-ss-top,0px));overflow:hidden}
.bz-ss-head{padding-inline:var(--bz-ss-pad,24px)}
.bz-ss-row{position:relative;-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - min(12%,96px)),transparent);mask-image:linear-gradient(90deg,#000 calc(100% - min(12%,96px)),transparent)}
.bz-ss[data-end="true"] .bz-ss-row{-webkit-mask-image:none;mask-image:none}
.bz-ss-track{position:relative;display:flex;gap:16px;padding:4px var(--bz-ss-pad,24px) 16px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-padding-inline:var(--bz-ss-pad,24px);overscroll-behavior-x:contain;outline:none}
.bz-ss-track:focus-visible{outline:2px solid var(--bz-focus-ring,#912c22);outline-offset:-2px;border-radius:12px}
.bz-ss[data-layout="pinned"] .bz-ss-track{overflow:visible;scroll-snap-type:none;will-change:transform}
.bz-ss-item{flex:none;scroll-snap-align:start}
.bz-ss-hint{display:none;align-self:flex-start;align-items:center;gap:10px;margin-inline:var(--bz-ss-pad,24px);font-size:0.8125rem;font-weight:500;line-height:1;color:var(--bz-ink-muted,#4a4a4c);transition:opacity 300ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-ss[data-layout="pinned"] .bz-ss-hint{display:inline-flex}
.bz-ss-mouse{position:relative;width:18px;height:28px;border:1.5px solid currentColor;border-radius:10px}
.bz-ss-mouse::after{content:"";position:absolute;top:6px;left:50%;width:3px;height:6px;margin-left:-1.5px;border-radius:2px;background:currentColor;animation:bz-ss-wheel 1.6s var(--bz-ease-in-out,cubic-bezier(0.77,0,0.175,1)) infinite}
.bz-ss[data-onscreen="false"] .bz-ss-mouse::after,.bz-ss[data-hint="off"] .bz-ss-mouse::after{animation-play-state:paused}
@keyframes bz-ss-wheel{0%{transform:translateY(0);opacity:1}70%{transform:translateY(8px);opacity:0}100%{transform:translateY(0);opacity:0}}
@media (prefers-reduced-motion:reduce){.bz-ss-mouse::after{animation:none}.bz-ss-hint{transition:none}}
`;

const RM_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(RM_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const readReducedMotion = () => window.matchMedia(RM_QUERY).matches;
const serverReducedMotion = () => false;

/** Extra scroll, as a share of the pan, spent holding on the last card. */
const HOLD = 0.18;

export type SidewaysScrollProps = {
  /** One card per child. */
  children: ReactNode;
  /** Names the list of cards for assistive tech. */
  label: string;
  /** Pinned above the row, and panned with it out of the way of nothing. */
  heading?: ReactNode;
  /** Distance from the top of the viewport to pin at, for a sticky header. */
  pinOffset?: number;
  /** Below this viewport width the row is a snap scroller. */
  minWidth?: number;
  /** Below this viewport height the row is a snap scroller. */
  minHeight?: number;
  /** Text beside the scroll cue while pinned. */
  hint?: string;
  className?: string;
};

export function SidewaysScroll({
  children,
  label,
  heading,
  pinOffset = 0,
  minWidth = 640,
  minHeight = 420,
  hint = "Scroll",
  className = "",
}: SidewaysScrollProps) {
  const reduced = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, serverReducedMotion);
  const [mode, setMode] = useState<"scroller" | "pinned">("scroller");
  const sectionRef = useRef<HTMLElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    const section = sectionRef.current;
    const row = rowRef.current;
    const track = trackRef.current;
    if (!section || !row || !track) return;

    let distance = 0;
    let start = 0;
    let raf = 0;

    const measure = () => {
      const items = track.children;
      const lastItem = items[items.length - 1] as HTMLElement | undefined;
      const padRight = parseFloat(getComputedStyle(track).paddingRight) || 0;
      const contentRight = lastItem ? lastItem.offsetLeft + lastItem.offsetWidth + padRight : 0;
      distance = Math.max(0, Math.round(contentRight - row.clientWidth));
      const allowPan =
        !readReducedMotion() && window.innerWidth >= minWidth && window.innerHeight >= minHeight && distance > 0;
      const nextMode = allowPan ? "pinned" : "scroller";
      if (nextMode !== modeRef.current) {
        modeRef.current = nextMode;
        setMode(nextMode);
      }
      if (nextMode === "pinned") {
        const stickyHeight = window.innerHeight - pinOffset;
        section.style.height = `${Math.round(stickyHeight + distance * (1 + HOLD))}px`;
        start = section.getBoundingClientRect().top + window.scrollY - pinOffset;
      } else {
        section.style.height = "";
        track.style.transform = "";
      }
      update();
    };

    const update = () => {
      raf = 0;
      if (modeRef.current !== "pinned") {
        section.dataset.end = String(track.scrollLeft + track.clientWidth >= track.scrollWidth - 4);
        return;
      }
      const travel = Math.max(0, Math.min(window.scrollY - start, distance * (1 + HOLD)));
      const x = Math.min(travel, distance);
      track.style.transform = `translate3d(${-x}px, 0, 0)`;
      section.dataset.end = String(x >= distance - 1);
      const showHint = travel < 24;
      section.dataset.hint = showHint ? "on" : "off";
      if (hintRef.current) hintRef.current.style.opacity = showHint ? "1" : "0";
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    const onFocusIn = (event: FocusEvent) => {
      if (modeRef.current !== "pinned") return;
      const item = (event.target as Element | null)?.closest?.(".bz-ss-item") as HTMLElement | null;
      if (!item || !track.contains(item)) return;
      const current = Math.max(0, Math.min(window.scrollY - start, distance));
      const left = item.offsetLeft - current;
      const right = left + item.offsetWidth;
      if (left >= 0 && right <= row.clientWidth) return;
      const padLeft = parseFloat(getComputedStyle(track).paddingLeft) || 0;
      const wanted = Math.max(0, Math.min(item.offsetLeft - padLeft, distance));
      // After the browser's own scroll-into-view has run.
      requestAnimationFrame(() => window.scrollTo({ top: start + wanted, behavior: "auto" }));
    };

    const ro = new ResizeObserver(() => measure());
    ro.observe(row);
    ro.observe(track);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", onScroll, { passive: true });
    track.addEventListener("scroll", onScroll, { passive: true });
    track.addEventListener("focusin", onFocusIn);

    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(([entry]) => {
        section.dataset.onscreen = String(entry.isIntersecting);
      });
      io.observe(section);
    }

    measure();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io?.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll);
      track.removeEventListener("scroll", onScroll);
      track.removeEventListener("focusin", onFocusIn);
      section.style.height = "";
      track.style.transform = "";
    };
  }, [reduced, pinOffset, minWidth, minHeight, mode]);

  const items = Children.toArray(children);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <section
        ref={sectionRef}
        className={`bz-ss ${className}`.trim()}
        data-layout={mode}
        aria-label={heading ? undefined : label}
        style={{ ["--bz-ss-top" as string]: `${pinOffset}px` } as CSSProperties}
      >
        <div className="bz-ss-sticky">
          {heading ? <div className="bz-ss-head">{heading}</div> : null}
          <div ref={rowRef} className="bz-ss-row">
            <div
              ref={trackRef}
              className="bz-ss-track"
              role="list"
              aria-label={label}
              tabIndex={mode === "scroller" ? 0 : undefined}
            >
              {items.map((child, index) => (
                <div key={isValidElement(child) && child.key != null ? child.key : index} className="bz-ss-item" role="listitem">
                  {child}
                </div>
              ))}
            </div>
          </div>
          <div ref={hintRef} className="bz-ss-hint" aria-hidden="true">
            <span className="bz-ss-mouse" />
            {hint}
          </div>
        </div>
      </section>
    </>
  );
}
