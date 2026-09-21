"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** A scroll container, however the consumer happens to have it to hand. */
type ScrollerSource = "auto" | "window" | Element | RefObject<Element | null>;

type ScrollParallaxLayerProps = {
  /**
   * Drift along the scroll axis. 1 moves the layer a quarter of the distance
   * it travels through the frame, so on an 800px viewport 0.25 is about 50px.
   * Positive reads as near (it outruns the scroll), negative as far.
   */
  speed?: number;
  /** Sideways drift over the same range, in the same units as `speed`. */
  drift?: number;
  /** Total degrees swept across the range. */
  rotate?: number;
  /** Scale gained across the range, so a near plane grows as it comes past. */
  scale?: number;
  /** Blur in px at both ends of the range, pulling into focus at the centre. */
  blur?: number;
  /** Opacity at both ends of the range. 1 keeps the layer solid throughout. */
  fade?: number;
  /**
   * Which scroll container the range is measured against. "auto" walks up to
   * the nearest scrolling ancestor and falls back to the window, so the same
   * layer works in a 200px panel and on a full page.
   */
  scroller?: ScrollerSource;
  /** Seconds of catch-up between the scrollbar and the layer. */
  scrub?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

type FallingPetalFieldProps = {
  colors: string[];
  count?: number;
  className?: string;
};

/** Nearest ancestor that actually scrolls; null means the window does. */
function nearestScroller(el: HTMLElement): Element | null {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const overflow = getComputedStyle(node).overflowY;
    const scrolls = overflow === "auto" || overflow === "scroll" || overflow === "overlay";
    if (scrolls && node.scrollHeight > node.clientHeight + 1) return node;
  }
  return null;
}

/**
 * One plane of a scroll-scrubbed parallax composition (GSAP ScrollTrigger).
 *
 * Depth is more than different speeds, so a layer can also gain scale, take a
 * little rotation, and pull into focus out of blur and fade as it crosses the
 * middle of the range. Stack three or four with different values and the
 * planes read as distance rather than as things sliding at different rates.
 *
 * The range is measured from the scroll container, not the viewport, so the
 * composition holds together in a small panel as well as on a full page. Only
 * transform, opacity and filter are touched, and every layer rides the single
 * scroll listener ScrollTrigger keeps per container.
 */
export function ScrollParallaxLayer({
  speed = 0.25,
  drift = 0,
  rotate = 0,
  scale = 0,
  blur = 0,
  fade = 1,
  scroller = "auto",
  scrub = 0.6,
  className,
  style,
  children,
}: ScrollParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const plane = planeRef.current;
    if (!el || !plane) return;

    const mm = gsap.matchMedia();
    // Reduced motion never enters this branch, so the layer stays exactly as
    // the markup left it: in place, sharp, fully opaque.
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const box =
        scroller === "window"
          ? null
          : scroller === "auto"
            ? nearestScroller(el)
            : "current" in scroller
              ? scroller.current
              : scroller;

      // The sweep is how far the layer travels through the frame, so the same
      // speed reads the same at any container size.
      const span = () => (box ? box.clientHeight : window.innerHeight) + el.offsetHeight;
      const sweep = (amount: number, sign: number) => () => (sign * amount * span()) / 8;

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: el,
          scroller: box ?? undefined,
          start: "top bottom",
          end: "bottom top",
          scrub,
          invalidateOnRefresh: true,
        },
      });

      tl.fromTo(
        plane,
        {
          y: sweep(speed, 1),
          x: sweep(drift, 1),
          rotation: -rotate / 2,
          scale: 1 - scale / 2,
        },
        {
          y: sweep(speed, -1),
          x: sweep(drift, -1),
          rotation: rotate / 2,
          scale: 1 + scale / 2,
          force3D: true,
          duration: 1,
        },
        0,
      );

      // Arrive, settle, leave: the plane resolves as it reaches the middle.
      if (fade < 1 || blur > 0) {
        const ends = blur > 0 ? { opacity: fade, filter: `blur(${blur}px)` } : { opacity: fade };
        const settled = blur > 0 ? { opacity: 1, filter: "blur(0px)" } : { opacity: 1 };
        tl.fromTo(plane, { ...ends }, { ...settled, duration: 0.5 }, 0);
        tl.to(plane, { ...ends, duration: 0.5 }, 0.5);
      }

      // ScrollTrigger refreshes itself on window resize; a panel that changes
      // size on its own has to say so.
      let queued = 0;
      const remeasure = () => {
        cancelAnimationFrame(queued);
        queued = requestAnimationFrame(() => tl.scrollTrigger?.refresh());
      };
      const ro = new ResizeObserver(remeasure);
      ro.observe(el);
      if (box) ro.observe(box);

      return () => {
        ro.disconnect();
        cancelAnimationFrame(queued);
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    });

    return () => mm.revert();
  }, [speed, drift, rotate, scale, blur, fade, scroller, scrub]);

  return (
    <div ref={ref} className={className} style={style}>
      {/* The wrapper is the trigger and the plane is what moves, so a layer's
          own transform can never feed back into the measurement driving it. */}
      <div ref={planeRef} style={{ height: "100%" }}>
        {children}
      </div>
    </div>
  );
}

function PetalShape({ variant, color }: { variant: number; color: string }) {
  const paths = [
    "M12 2 C17 6 19 12 16 18 C14 21 10 21 8 18 C5 12 7 6 12 2 Z",
    "M12 3 C18 5 20 12 15 19 Q12 22 9 19 C4 12 6 5 12 3 Z",
    "M12 1 C15 7 18 10 16 17 C14 22 9 22 8 16 C7 9 9 6 12 1 Z",
  ];
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
      <path d={paths[variant % paths.length]} fill={color} />
    </svg>
  );
}

const PETALS = [
  { left: 6, size: 13, delay: 0.0, dur: 11, drift: 46, spin: 300, o: 0.8 },
  { left: 14, size: 9, delay: 3.2, dur: 14, drift: -34, spin: -260, o: 0.55 },
  { left: 24, size: 12, delay: 6.4, dur: 12, drift: 42, spin: 340, o: 0.7 },
  { left: 34, size: 8, delay: 1.6, dur: 15, drift: -28, spin: 220, o: 0.5 },
  { left: 45, size: 14, delay: 4.8, dur: 10.5, drift: 36, spin: -300, o: 0.85 },
  { left: 55, size: 9, delay: 8.2, dur: 13.5, drift: -44, spin: 280, o: 0.55 },
  { left: 64, size: 12, delay: 2.4, dur: 11.5, drift: 30, spin: -240, o: 0.75 },
  { left: 74, size: 8, delay: 5.6, dur: 14.5, drift: -38, spin: 320, o: 0.5 },
  { left: 84, size: 13, delay: 0.8, dur: 12.5, drift: 40, spin: -280, o: 0.8 },
  { left: 92, size: 10, delay: 7.0, dur: 13, drift: -30, spin: 260, o: 0.6 },
];

/** The fall the delays and durations below were authored against. */
const PETAL_BASIS = 900;

/**
 * Deterministic CSS falling petal field (no Math.random → no hydration drift).
 * Ships with ScrollParallaxLayer as the ambient companion.
 *
 * The fall is measured from the field itself rather than the viewport, so a
 * petal crosses a short panel in the same sort of time it crosses a page
 * instead of streaking past in the first second.
 */
export function FallingPetalField({
  colors,
  count = 10,
  className = "inset-x-0 top-0 h-[110vh]",
}: FallingPetalFieldProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setHeight(el.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fall = height ? height + 40 : 0;
  const pace = fall ? Math.min(1.25, Math.max(0.45, fall / PETAL_BASIS)) : 1;

  return (
    <div
      ref={ref}
      className={`pointer-events-none absolute select-none overflow-hidden ${className}`}
      aria-hidden
    >
      <style>{`
        @keyframes petal-fall {
          0% { transform: translate3d(0, 0, 0) rotate(0deg); opacity: 0; }
          6% { opacity: var(--petal-o, 0.7); }
          85% { opacity: var(--petal-o, 0.7); }
          100% {
            transform: translate3d(var(--petal-drift, 40px), var(--petal-fall, 112vh), 0)
              rotate(var(--petal-spin, 300deg));
            opacity: 0;
          }
        }
        .fall-petal {
          animation-name: petal-fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform, opacity;
        }
        @media (prefers-reduced-motion: reduce) {
          .fall-petal { animation: none !important; opacity: 0 !important; }
        }
      `}</style>
      {PETALS.slice(0, count).map((p, i) => (
        <span
          key={i}
          className="fall-petal absolute"
          style={
            {
              left: `${p.left}%`,
              top: -24,
              width: p.size,
              height: p.size,
              "--petal-drift": `${p.drift}px`,
              "--petal-spin": `${p.spin}deg`,
              "--petal-o": p.o,
              "--petal-fall": fall ? `${fall}px` : "112vh",
              animationDuration: `${(p.dur * pace).toFixed(2)}s`,
              animationDelay: `${(p.delay * pace).toFixed(2)}s`,
            } as CSSProperties
          }
        >
          <PetalShape variant={i} color={colors[i % colors.length]} />
        </span>
      ))}
    </div>
  );
}
