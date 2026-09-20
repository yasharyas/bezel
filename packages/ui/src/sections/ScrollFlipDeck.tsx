"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";

/*
 * ScrollFlipDeck: a stack of images pinned to the viewport, each one tipping in
 * from below and away again as you scroll, like pages turning on a flipbook.
 *
 * No scroll library and no 3D library. The section is made as tall as the flip
 * needs, an inner stage sticks to the top, and one passive scroll listener maps
 * the page's scroll position to a rotation per card. Nothing writes to layout,
 * only to `transform` and `opacity`, so a long deck costs the same as a short
 * one.
 *
 * The deck is decoration wrapped around real content: the images keep their alt
 * text and stay in the accessibility tree in source order, whatever the scroll
 * position is doing to them.
 *
 * Reduced motion, a short viewport or a single item gets a plain column of
 * images instead. Nothing pins, nothing rotates.
 */

const CSS = `
.bz-sfd{position:relative;color:var(--bz-ink,#0a0a0a);font-family:var(--bz-font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif)}
.bz-sfd *,.bz-sfd *::before,.bz-sfd *::after{box-sizing:border-box}
.bz-sfd-stage{display:flex;align-items:center;justify-content:center}
.bz-sfd[data-layout="pinned"] .bz-sfd-stage{position:sticky;top:var(--bz-sfd-top,0px);height:calc(100vh - var(--bz-sfd-top,0px));perspective:1400px;perspective-origin:50% 45%}
.bz-sfd-list{position:relative;width:min(var(--bz-sfd-width,560px),100% - 32px);margin:0;padding:0;list-style:none}
.bz-sfd[data-layout="pinned"] .bz-sfd-list{height:min(var(--bz-sfd-height,64vh),72vw);transform-style:preserve-3d}
.bz-sfd[data-layout="column"] .bz-sfd-list{display:flex;flex-direction:column;gap:24px;margin-inline:auto;padding-block:24px}
.bz-sfd-card{margin:0}
.bz-sfd[data-layout="pinned"] .bz-sfd-card{position:absolute;inset:0;transform-origin:50% 100%;backface-visibility:hidden;will-change:transform,opacity}
.bz-sfd-frame{overflow:hidden;height:100%;border-radius:16px;background:var(--bz-paper-sunken,#fafafa);border:1px solid var(--bz-line,rgba(10,10,10,0.06));box-shadow:0 18px 40px -24px rgba(10,10,10,0.45)}
.bz-sfd-img{display:block;width:100%;height:100%;object-fit:cover}
.bz-sfd-caption{margin:10px 2px 0;font-size:0.8125rem;line-height:1.5;color:var(--bz-ink-muted,#4a4a4c)}
.bz-sfd[data-layout="pinned"] .bz-sfd-caption{position:absolute;left:0;right:0;top:100%}
.bz-sfd-count{position:absolute;left:50%;bottom:26px;transform:translateX(-50%);font-family:var(--bz-font-mono,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:0.6875rem;letter-spacing:0.16em;text-transform:uppercase;color:var(--bz-ink-subtle,#6b6b70)}
.bz-sfd[data-layout="column"] .bz-sfd-count{display:none}
`;

const RM_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(RM_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const readReducedMotion = () => window.matchMedia(RM_QUERY).matches;
const serverReducedMotion = () => false;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Degrees a card is tipped when it is one full step away from centre. */
const TIP = 58;
/** Share of the viewport height each card gets to travel through. */
const STEP = 0.85;
/** Extra scroll, as a share of the deck, spent holding on the last card. */
const HOLD = 0.25;

/*
 * Cards spend the middle third of their step face on rather than passing
 * through it. Without the dwell every card is mid-turn at every scroll
 * position, and the deck never resolves into something you can look at.
 */
const DWELL = 0.34;
const dwell = (offset: number) => {
  const sign = offset < 0 ? -1 : 1;
  const size = Math.abs(offset);
  if (size <= DWELL) return 0;
  const t = (size - DWELL) / (1 - DWELL);
  return sign * Math.min(1, t * t * (3 - 2 * t));
};

export type ScrollFlipItem = {
  src: string;
  /** Describe the image. Empty string only if the image says nothing the text does not. */
  alt: string;
  caption?: ReactNode;
};

export type ScrollFlipDeckProps = {
  items: ScrollFlipItem[];
  /** Names the deck for assistive tech. */
  label: string;
  /** "sequence" tips every card on the same axis. "alternate" turns every other card on its side. */
  mode?: "sequence" | "alternate";
  /** Distance from the top of the viewport to pin at, for a sticky header. */
  pinOffset?: number;
  /** Below this viewport height the deck is a plain column. */
  minHeight?: number;
  /** Width of the card stack. */
  width?: number;
  /** Shows "02 / 05" under the deck while it is pinned. */
  counter?: boolean;
  className?: string;
};

export function ScrollFlipDeck({
  items,
  label,
  mode = "sequence",
  pinOffset = 0,
  minHeight = 520,
  width = 560,
  counter = true,
  className = "",
}: ScrollFlipDeckProps) {
  const reduced = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, serverReducedMotion);
  const [layout, setLayout] = useState<"column" | "pinned">("column");
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const countRef = useRef<HTMLParagraphElement>(null);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  useEffect(() => {
    const section = sectionRef.current;
    const list = listRef.current;
    if (!section || !list) return;

    const cards = () => Array.from(list.children) as HTMLElement[];
    const reset = () => {
      for (const card of cards()) {
        card.style.cssText = "";
        const caption = card.querySelector<HTMLElement>(".bz-sfd-caption");
        if (caption) caption.style.opacity = "";
      }
    };
    let distance = 0;
    let start = 0;
    let raf = 0;

    const measure = () => {
      const next =
        !readReducedMotion() && window.innerHeight >= minHeight && items.length > 1 ? "pinned" : "column";
      if (next !== layoutRef.current) {
        layoutRef.current = next;
        setLayout(next);
      }
      if (next === "pinned") {
        const stage = window.innerHeight - pinOffset;
        // One step per gap between cards, not per card, so the deck ends on the
        // last card rather than on an empty pinned stage. HOLD keeps it there
        // for a moment before the page moves on.
        distance = Math.round(window.innerHeight * STEP * (items.length - 1) * (1 + HOLD));
        section.style.height = `${stage + distance}px`;
        start = section.getBoundingClientRect().top + window.scrollY - pinOffset;
      } else {
        distance = 0;
        section.style.height = "";
        reset();
      }
      update();
    };

    const update = () => {
      raf = 0;
      if (layoutRef.current !== "pinned" || distance <= 0) return;

      const progress = clamp((window.scrollY - start) / distance, 0, 1);
      const span = items.length - 1;
      const head = Math.min(progress * span * (1 + HOLD), span);
      const list_ = cards();

      for (let i = 0; i < list_.length; i++) {
        const card = list_[i];
        // How far this card is from the front of the deck: 0 is face on,
        // negative is still waiting underneath, positive is turning away.
        const offset = clamp(head - i, -2.2, 1.4);

        // Only the card on its way out turns. A waiting card that rotates
        // shows up as a sliver poking out from behind the front one, which
        // reads as a rendering fault rather than a deck.
        const turn = offset > 0 ? dwell(offset) : 0;
        const axis = mode === "alternate" && i % 2 === 1 ? "rotateY" : "rotateX";
        const angle = -turn * TIP;

        // Waiting cards stay square on, stacked back and down a little, so the
        // deck has visible depth and the next card is already legible.
        const waiting = Math.min(Math.max(-offset, 0), 2.4);
        const depth = -turn * 120 - waiting * 60;
        const scale = (1 - Math.abs(turn) * 0.05) * (1 - waiting * 0.035);
        const drop = waiting * 16;

        const fade =
          offset > 0
            ? 1 - clamp((offset - 0.5) / 0.45, 0, 1)
            : 1 - clamp((waiting - 1.6) / 0.7, 0, 1);

        card.style.transform = `translate3d(0, ${drop}px, ${depth}px) ${axis}(${angle}deg) scale(${scale})`;
        card.style.opacity = String(fade);
        card.style.zIndex = String(100 - Math.round(Math.abs(offset) * 20));
        // A card turned past its edge catches no pointer, so what is under it
        // stays clickable.
        card.style.pointerEvents = Math.abs(offset) < 0.5 ? "auto" : "none";

        // One caption at a time. They all sit in the same place under the
        // deck, so anything but the front card's is a pile of overlapping text.
        const caption = card.querySelector<HTMLElement>(".bz-sfd-caption");
        if (caption) caption.style.opacity = String(1 - clamp(Math.abs(offset) / 0.5, 0, 1));
      }

      if (countRef.current) {
        const current = clamp(Math.round(head) + 1, 1, items.length);
        countRef.current.textContent = `${String(current).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    const ro = new ResizeObserver(() => measure());
    ro.observe(list);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", onScroll, { passive: true });

    measure();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll);
      section.style.height = "";
      reset();
    };
  }, [reduced, items.length, mode, pinOffset, minHeight]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <section
        ref={sectionRef}
        className={`bz-sfd ${className}`.trim()}
        data-layout={layout}
        style={
          {
            ["--bz-sfd-top" as string]: `${pinOffset}px`,
            ["--bz-sfd-width" as string]: `${width}px`,
          } as CSSProperties
        }
      >
        <div className="bz-sfd-stage">
          <ul ref={listRef} className="bz-sfd-list" aria-label={label}>
            {items.map((item, i) => (
              <li key={item.src + i} className="bz-sfd-card">
                <figure className="bz-sfd-figure">
                  <div className="bz-sfd-frame">
                    <img className="bz-sfd-img" src={item.src} alt={item.alt} loading={i > 1 ? "lazy" : undefined} />
                  </div>
                  {item.caption ? <figcaption className="bz-sfd-caption">{item.caption}</figcaption> : null}
                </figure>
              </li>
            ))}
          </ul>
          {counter ? <p ref={countRef} className="bz-sfd-count" aria-hidden="true" /> : null}
        </div>
      </section>
    </>
  );
}
