"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";

/*
 * ScrollFlipDeck: a stack of images pinned to the viewport. As you scroll, the
 * front card turns on its top edge and lifts out of the frame like a page, and
 * the next one is already sitting square underneath it.
 *
 * No scroll library and no 3D library. The section is made as tall as the flip
 * needs, an inner stage sticks to the top, and one passive scroll listener maps
 * the page's scroll position to a transform per card. Nothing writes to layout,
 * only to `transform` and `opacity`, so a long deck costs the same as a short
 * one.
 *
 * Two rules keep the turn from reading as a rendering fault rather than a deck:
 *
 * - A leaving card never shares the frame with the card underneath. It rises
 *   clear of the deck while it is still square on and only then finishes
 *   tipping over, and it holds full opacity until it is out, so you never see
 *   two images through each other or one squashed against the other.
 * - Each card is flattened into its own plane, with its own `perspective()` and
 *   a plain `z-index`. Cards sharing one 3D space intersect as they turn, and
 *   the browser splits them along the intersection, which is a hard seam
 *   straight across the middle of the deck.
 *
 * The deck is decoration wrapped around real content: the images keep their alt
 * text and stay in the accessibility tree in source order, whatever the scroll
 * position is doing to them.
 *
 * Reduced motion, a short viewport or a single item gets a plain column of
 * images instead. Nothing pins, nothing turns.
 */

const CSS = `
.bz-sfd{position:relative;color:var(--bz-ink,#0a0a0a);font-family:var(--bz-font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif)}
.bz-sfd *,.bz-sfd *::before,.bz-sfd *::after{box-sizing:border-box}
.bz-sfd-stage{display:flex;align-items:center;justify-content:center}
.bz-sfd[data-layout="pinned"] .bz-sfd-stage{position:sticky;top:var(--bz-sfd-top,0px);height:calc(100vh - var(--bz-sfd-top,0px))}
.bz-sfd-list{position:relative;width:min(var(--bz-sfd-width,560px),100% - 32px);margin:0;padding:0;list-style:none}
.bz-sfd[data-layout="pinned"] .bz-sfd-list{height:min(var(--bz-sfd-height,64vh),72vw)}
.bz-sfd[data-layout="column"] .bz-sfd-list{display:flex;flex-direction:column;gap:24px;margin-inline:auto;padding-block:24px}
.bz-sfd-card{margin:0}
.bz-sfd[data-layout="pinned"] .bz-sfd-card{position:absolute;inset:0}
.bz-sfd-frame{overflow:hidden;height:100%;border-radius:16px;background:var(--bz-paper-sunken,#fafafa);border:1px solid var(--bz-line,rgba(10,10,10,0.06));box-shadow:0 18px 40px -24px rgba(10,10,10,0.45)}
.bz-sfd[data-layout="pinned"] .bz-sfd-frame{transform-origin:50% 50%;backface-visibility:hidden;will-change:transform,opacity}
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

/** Degrees a card has turned over by the time it is gone. */
const TIP = 72;
/** How far a card rises as it leaves, as a share of its own height. */
const LIFT = 150;
/** Degrees a card leans as it peels off, so its edge never lines up with the one below. */
const TILT = 6;
/** Share of the viewport height each card gets to travel through. */
const STEP = 0.85;
/** Extra scroll, as a share of the deck, spent holding on the last card. */
const HOLD = 0.25;

/*
 * Cards spend the middle third of their step face on rather than passing
 * through it. Without the dwell every card is mid-turn at every scroll
 * position, and the deck never resolves into something you can look at.
 */
const DWELL = 0.3;
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
        const frame = card.querySelector<HTMLElement>(".bz-sfd-frame");
        if (frame) frame.style.cssText = "";
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
      const front = clamp(Math.round(head), 0, span);
      const list_ = cards();

      for (let i = 0; i < list_.length; i++) {
        const card = list_[i];
        // The frame moves, not the card. The caption belongs to the card and
        // has to stay where it is while the picture above it turns away.
        const frame = card.querySelector<HTMLElement>(".bz-sfd-frame");
        if (!frame) continue;

        // How far this card is from the front of the deck: 0 is face on,
        // negative is still waiting underneath, positive is on its way out.
        const offset = clamp(head - i, -3, 1.2);

        // Only the card on its way out turns. A waiting card that rotates
        // shows up as a sliver poking out from behind the front one, which
        // reads as a rendering fault rather than a deck.
        const turn = offset > 0 ? dwell(offset) : 0;

        if (turn > 0) {
          // Leaving. The rise is front loaded and the tip is back loaded, so
          // the card clears the deck while it is still square on and only
          // finishes turning over once it is out of the frame. Tipping first
          // would foreshorten it into a half height card pressed against a
          // full height one, joined at a seam across the middle.
          const rise = 1 - (1 - turn) * (1 - turn);
          // "alternate" sends every other card off the other way.
          const side = mode === "alternate" && i % 2 === 1 ? 1 : -1;
          const lean = (side * TILT * rise).toFixed(2);
          const drift = mode === "alternate" ? (side * 9 * rise).toFixed(2) : "0";
          const angle = (TIP * Math.pow(turn, 1.4)).toFixed(2);
          const shrink = (1 - turn * 0.06).toFixed(4);

          frame.style.transformOrigin = "50% 0%";
          frame.style.transform = `translate3d(${drift}%, ${(-LIFT * rise).toFixed(2)}%, 0) rotate(${lean}deg) perspective(1400px) rotateX(${angle}deg) scale(${shrink})`;
          // Opaque until it is out. Fading a card that still covers the next
          // one shows both pictures through each other at once.
          frame.style.opacity = (1 - clamp((turn - 0.38) / 0.28, 0, 1)).toFixed(3);
          // A card on its way out passes over the whole deck, never through it.
          card.style.zIndex = String(200 + i);
        } else {
          // Waiting. Square on, stacked back and down a little, so the deck has
          // visible depth and the next card is already legible. The stack stops
          // growing after two, so everything deeper sits exactly behind the
          // last visible card instead of fading in from nowhere.
          const stack = clamp(-offset, 0, 2);
          frame.style.transformOrigin = "50% 50%";
          frame.style.transform = `translate3d(0, ${(stack * 14).toFixed(2)}px, 0) scale(${(1 - stack * 0.04).toFixed(4)})`;
          frame.style.opacity = "1";
          card.style.zIndex = String(100 - i);
        }

        // A card turned past its edge catches no pointer, so what is under it
        // stays clickable.
        card.style.pointerEvents = Math.abs(offset) < 0.5 ? "auto" : "none";

        // One caption at a time. They all sit in the same place under the deck,
        // so the nearest card owns it outright. It dips and is replaced rather
        // than crossfading, which would pile two lines of text on each other.
        const caption = card.querySelector<HTMLElement>(".bz-sfd-caption");
        if (caption) {
          const focus = 1 - Math.min(1, Math.abs(head - i) * 2);
          caption.style.opacity = i === front ? (0.22 + 0.78 * focus * focus).toFixed(3) : "0";
        }
      }

      if (countRef.current) {
        const current = clamp(front + 1, 1, items.length);
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
