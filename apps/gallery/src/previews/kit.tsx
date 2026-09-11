"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { StageSize } from "./types";

/* ------------------------------------------------------------------ context */

export type PreviewEnv = {
  /** Someone is pointing at, or focused inside, this preview right now. */
  engaged: boolean;
  reducedMotion: boolean;
  size: StageSize | "frame";
};

export const PreviewEnvContext = createContext<PreviewEnv>({
  engaged: false,
  reducedMotion: false,
  size: "card",
});

export const usePreviewEnv = () => useContext(PreviewEnvContext);

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

/* -------------------------------------------------------------------- loops */

/**
 * Call `tick` every `ms` while nobody is interacting with the preview, motion
 * is allowed and the tab is visible. Used to demonstrate behaviour that would
 * otherwise only exist under a pointer.
 */
export function useIdleInterval(tick: () => void, ms: number, enabled = true) {
  const { engaged, reducedMotion } = usePreviewEnv();
  const ref = useRef(tick);
  ref.current = tick;
  useEffect(() => {
    if (!enabled || engaged || reducedMotion) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") ref.current();
    }, ms);
    return () => window.clearInterval(id);
  }, [enabled, engaged, reducedMotion, ms]);
}

/** A key that changes every `ms` while idle, to replay one-shot entrances. */
export function useLoopKey(ms: number) {
  const [key, setKey] = useState(0);
  useIdleInterval(() => setKey((k) => k + 1), ms);
  return key;
}

/* --------------------------------------------------------- synthetic input */

/** Fire the enter or leave events both React and native listeners observe. */
export function simulateHover(el: Element | null, on: boolean) {
  if (!el) return;
  const bubbling = { bubbles: true, cancelable: true, composed: true };
  if (on) {
    el.dispatchEvent(new PointerEvent("pointerover", bubbling));
    el.dispatchEvent(new PointerEvent("pointerenter", { bubbles: false }));
    el.dispatchEvent(new MouseEvent("mouseover", bubbling));
    el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false }));
  } else {
    el.dispatchEvent(new PointerEvent("pointerout", bubbling));
    el.dispatchEvent(new PointerEvent("pointerleave", { bubbles: false }));
    el.dispatchEvent(new MouseEvent("mouseout", bubbling));
    el.dispatchEvent(new MouseEvent("mouseleave", { bubbles: false }));
  }
}

/** Move a synthetic pointer to a fraction of `el`'s box. */
export function simulateMove(el: Element | null, fx: number, fy: number, target?: EventTarget) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  const init = {
    bubbles: true,
    cancelable: true,
    clientX: r.left + r.width * fx,
    clientY: r.top + r.height * fy,
  };
  const t = target ?? el;
  t.dispatchEvent(new PointerEvent("pointermove", init));
  t.dispatchEvent(new MouseEvent("mousemove", init));
}

/**
 * Sweep a synthetic pointer across `el` over `duration` ms along a gentle
 * curve, then leave. Returns a cancel function.
 */
export function sweep(
  el: Element | null,
  {
    duration = 1600,
    target,
    enterLeave = true,
    path = (t: number) => [0.15 + 0.7 * t, 0.5 + 0.28 * Math.sin(t * Math.PI * 2)] as const,
  }: {
    duration?: number;
    target?: EventTarget;
    enterLeave?: boolean;
    path?: (t: number) => readonly [number, number];
  } = {},
) {
  if (!el) return () => {};
  let raf = 0;
  const start = performance.now();
  if (enterLeave) simulateHover(el, true);
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const [fx, fy] = path(t);
    simulateMove(el, fx, fy, target);
    if (t < 1) raf = requestAnimationFrame(step);
    else if (enterLeave) simulateHover(el, false);
  };
  raf = requestAnimationFrame(step);
  return () => {
    cancelAnimationFrame(raf);
    if (enterLeave) simulateHover(el, false);
  };
}

/* ------------------------------------------------------------------ layout */

export function Center({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`flex h-full w-full items-center justify-center p-6 ${className}`} style={style}>
      {children}
    </div>
  );
}

/** A small uppercase caption for labelling variants inside a preview. */
export function Caption({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`font-mono text-[10px] uppercase tracking-[0.14em] opacity-70 ${className}`}>
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ assets */

const unsplash = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

export const IMAGES = {
  mountains: unsplash("photo-1506905925346-21bda4d32df4", 1200),
  lake: unsplash("photo-1493246507139-91e8fad9978e"),
  forest: unsplash("photo-1441974231531-c6227db76b6e"),
  city: unsplash("photo-1486406146926-c627a92ad1ab"),
  rice: unsplash("photo-1586201375761-83865001e31c", 600),
  cake: unsplash("photo-1578985545062-69928b1d9587", 600),
  watch: unsplash("photo-1523275335684-37898b6baf30", 600),
  headphones: unsplash("photo-1505740420928-5e560c06d30e", 600),
};

/** A serif wordmark as an SVG data URI, for components that take a logo. */
export const WORDMARK = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="120" viewBox="0 0 320 120"><text x="160" y="78" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="64" letter-spacing="2" fill="#2b2320">Bezel</text></svg>`,
)}`;
