"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

/** A ref to the element, or a CSS selector looked up inside the container. */
export type SketchArrowTarget = RefObject<HTMLElement | null> | string;

export type SketchArrowProps = {
  from: SketchArrowTarget;
  to: SketchArrowTarget;
  /** How far the line bows off the straight, as a fraction of its length. The sign picks the side. */
  bend?: number;
  /** Which ends get a head. */
  head?: "end" | "start" | "both" | "none";
  /** Any CSS colour. The default takes the surrounding text colour. */
  color?: string;
  /** Hand wobble in the stroke: 0 is a ruler, 2 is a bad pen. */
  roughness?: number;
  /**
   * How far the ink shifts between takes, 0 to 1. Above 0 the arrow is drawn
   * three ways and cycles between them, the way hand-drawn animation boils.
   * 0 pins it to one still take and runs no timer at all.
   */
  boil?: number;
  /** How long each take holds. Drawn animation sits around 2 to 3 frames a second. */
  boilMs?: number;
  /** Fixes which sketch you get. Change it to shuffle. */
  seed?: number;
  strokeWidth?: number;
  /** Clearance left between each box and the end of the line. */
  gap?: number;
  /**
   * What the arrow says, for a screen reader. Without one the arrow is treated
   * as decoration and hidden, which is right when the copy already says it.
   */
  label?: string;
  className?: string;
  style?: CSSProperties;
};

type Point = [number, number];
type Box = { cx: number; cy: number; hw: number; hh: number };

const TAKES = 3;
/** Any fixed value will do: it only has to be stable, so the arrow does not
 *  redraw itself differently on every render. */
const DEFAULT_SEED = 0x51ed270b;

/* --------------------------------------------------------------- the hand */

/* These four are deliberately carried in the file rather than imported: every
   Bezel component is copied out on its own. */

/** xorshift32. Small, fast, and the same seed always draws the same stroke. */
function makeRandom(seed: number) {
  let state = seed >>> 0 || 0x9e3779b9;
  return () => {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0x100000000;
  };
}

/** Smooth a polyline into quadratics: every point becomes a control point. */
function toPath(points: Point[]) {
  if (points.length < 2) return "";
  const r = (n: number) => Math.round(n * 100) / 100;
  let d = `M${r(points[0][0])} ${r(points[0][1])}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const [cx, cy] = points[i];
    const [nx, ny] = points[i + 1];
    d += `Q${r(cx)} ${r(cy)} ${r((cx + nx) / 2)} ${r((cy + ny) / 2)}`;
  }
  const end = points[points.length - 1];
  return `${d}L${r(end[0])} ${r(end[1])}`;
}

/** Walk a quadratic curve as a polyline, wobbling each sample off the ideal. */
function penCurve(a: Point, control: Point, b: Point, steps: number, spread: number, rand: () => number): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const u = 1 - t;
    // Ends are pinned: a stroke that misses its own target reads as a mistake.
    const grip = Math.sin(t * Math.PI);
    points.push([
      u * u * a[0] + 2 * u * t * control[0] + t * t * b[0] + (rand() - 0.5) * 2 * spread * grip,
      u * u * a[1] + 2 * u * t * control[1] + t * t * b[1] + (rand() - 0.5) * 2 * spread * grip,
    ]);
  }
  return points;
}

/** Where a ray from the middle of a box toward `target` leaves the box. */
function edgeToward(box: Box, target: Point, gap: number): Point {
  const dx = target[0] - box.cx;
  const dy = target[1] - box.cy;
  const length = Math.hypot(dx, dy) || 1;
  const tx = dx === 0 ? Infinity : box.hw / Math.abs(dx);
  const ty = dy === 0 ? Infinity : box.hh / Math.abs(dy);
  const t = Math.min(tx, ty, 1e6) + gap / length;
  return [box.cx + dx * t, box.cy + dy * t];
}

/** The two short strokes of a head, pointing back up the line. */
function headStrokes(tip: Point, towards: Point, size: number, spread: number, rand: () => number) {
  const angle = Math.atan2(tip[1] - towards[1], tip[0] - towards[0]);
  return [0.52, -0.52].map((turn) => {
    const a = angle + Math.PI + turn;
    const end: Point = [tip[0] + Math.cos(a) * size, tip[1] + Math.sin(a) * size];
    const mid: Point = [
      (tip[0] + end[0]) / 2 + (rand() - 0.5) * 2 * spread,
      (tip[1] + end[1]) / 2 + (rand() - 0.5) * 2 * spread,
    ];
    return toPath([tip, mid, end]);
  });
}

/* -------------------------------------------------------------- the arrow */

/** Sub-pixel moves are noise, not a new layout. */
const near = (a: number, b: number) => Math.abs(a - b) < 0.5;

const sameBox = (a: Box | null, b: Box | null) =>
  a === b ||
  (!!a && !!b && near(a.cx, b.cx) && near(a.cy, b.cy) && near(a.hw, b.hw) && near(a.hh, b.hh));

/**
 * The block an element is laid out in. ResizeObserver skips non-replaced
 * inline elements, and an endpoint often moves because the box around it
 * changed rather than because the endpoint itself did.
 */
function blockAncestor(element: HTMLElement | null) {
  let node = element;
  while (node && getComputedStyle(node).display === "inline") node = node.parentElement;
  return node ?? document.body;
}

function resolve(target: SketchArrowTarget, root: Element | Document): HTMLElement | null {
  if (typeof target === "string") return root.querySelector<HTMLElement>(target);
  return target.current ?? null;
}

/**
 * A drawn arrow between two elements on the page, for pointing at a control in
 * a walkthrough or tying a note to the thing it is about.
 *
 * It measures both ends and redraws itself whenever either one moves, so it
 * stays attached through a resize or a reflow rather than being a fixed
 * picture. The stroke is generated from a seed, and with `boil` above 0 it
 * cycles between three takes so the ink keeps moving the way cel animation
 * does. Reduced motion holds the first take still, a hidden tab pauses the
 * cycle, and `boil={0}` runs no timer at all.
 *
 * Put it inside the same positioned container as the two elements: it fills
 * that container, ignores the pointer, and a selector string is looked up
 * inside it.
 */
export function SketchArrow({
  from,
  to,
  bend = 0.16,
  head = "end",
  color = "currentColor",
  roughness = 1,
  boil = 0.3,
  boilMs = 420,
  seed = DEFAULT_SEED,
  strokeWidth = 2,
  gap = 8,
  label,
  className = "",
  style,
}: SketchArrowProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [ends, setEnds] = useState<{ a: Box; b: Box } | null>(null);
  const [frame, setFrame] = useState(0);

  const takeCount = boil > 0 ? TAKES : 1;

  const measure = useCallback(() => {
    const host = hostRef.current;
    if (!host) return;
    const root = host.offsetParent ?? host.ownerDocument;
    const a = resolve(from, root);
    const b = resolve(to, root);
    const frameBox = host.getBoundingClientRect();
    if (!a || !b || frameBox.width === 0) {
      setEnds(null);
      return;
    }
    // getBoundingClientRect reports screen pixels. Inside a scaled ancestor
    // those are not the pixels the SVG is laid out in, so divide them back.
    const ratio = host.offsetWidth ? frameBox.width / host.offsetWidth : 1;
    const scale = Number.isFinite(ratio) && ratio > 0.01 ? ratio : 1;
    const boxOf = (element: HTMLElement): Box => {
      const r = element.getBoundingClientRect();
      return {
        cx: (r.left - frameBox.left + r.width / 2) / scale,
        cy: (r.top - frameBox.top + r.height / 2) / scale,
        hw: r.width / 2 / scale,
        hh: r.height / 2 / scale,
      };
    };
    const next = { a: boxOf(a), b: boxOf(b) };
    const w = host.offsetWidth || frameBox.width;
    const h = host.offsetHeight || frameBox.height;
    setSize((previous) =>
      previous && near(previous.w, w) && near(previous.h, h) ? previous : { w, h },
    );
    setEnds((previous) =>
      previous && sameBox(previous.a, next.a) && sameBox(previous.b, next.b) ? previous : next,
    );
  }, [from, to]);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    const root = host.offsetParent ?? host.ownerDocument;
    for (const target of [resolve(from, root), resolve(to, root)]) {
      if (!target) continue;
      observer.observe(target);
      observer.observe(blockAncestor(target));
    }
    // Both ends can move without either box changing size, so watch the page too.
    observer.observe(document.body);
    void document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, [measure, from, to]);

  useEffect(() => {
    if (takeCount < 2) {
      setFrame(0);
      return;
    }
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer = 0;
    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = 0;
    };
    const sync = () => {
      stop();
      if (query.matches) {
        setFrame(0);
        return;
      }
      if (document.hidden) return;
      timer = window.setInterval(() => setFrame((f) => (f + 1) % takeCount), boilMs);
    };
    sync();
    query.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      stop();
      query.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [takeCount, boilMs]);

  const takes = useMemo(() => {
    if (!ends) return [];
    const { a, b } = ends;
    const dx = b.cx - a.cx;
    const dy = b.cy - a.cy;
    const length = Math.hypot(dx, dy);
    if (length < 4) return [];
    // The bow is a control point pushed off the midline at a right angle.
    const control: Point = [
      (a.cx + b.cx) / 2 - dy * bend,
      (a.cy + b.cy) / 2 + dx * bend,
    ];
    const start = edgeToward(a, control, gap);
    const end = edgeToward(b, control, gap);
    const steps = Math.max(6, Math.min(28, Math.round(length / 18)));
    const spread = Math.min(6, Math.max(1.2, length * 0.012)) * roughness;
    const headSize = Math.max(12, strokeWidth * 5.5, length * 0.07);
    const drift = spread * boil * 1.6;

    return Array.from({ length: takeCount }, (_, take) => {
      const rand = makeRandom(seed + (take + 1) * 7919);
      // Two passes: nobody lands the same line twice, and the overlap is the
      // whole reason a drawn arrow reads as drawn.
      const shaft = [
        toPath(penCurve(start, control, end, steps, spread, rand)),
        toPath(penCurve(start, control, end, steps, spread * 0.8, rand)),
      ];
      const heads: string[] = [];
      if (head === "end" || head === "both") heads.push(...headStrokes(end, control, headSize, drift + 1, rand));
      if (head === "start" || head === "both") heads.push(...headStrokes(start, control, headSize, drift + 1, rand));
      const wobble = (): Point => [(rand() - 0.5) * 2 * drift, (rand() - 0.5) * 2 * drift];
      const [ox, oy] = wobble();
      return { d: [...shaft, ...heads].join(""), ox, oy };
    });
  }, [ends, bend, gap, roughness, strokeWidth, head, seed, boil, takeCount]);

  return (
    <div
      ref={hostRef}
      className={className}
      style={{ position: "absolute", inset: 0, pointerEvents: "none", ...style }}
    >
      <svg
        width={size?.w ?? 0}
        height={size?.h ?? 0}
        viewBox={size ? `0 0 ${size.w} ${size.h}` : undefined}
        role={label ? "img" : undefined}
        aria-hidden={label ? undefined : "true"}
        focusable="false"
        style={{
          display: "block",
          overflow: "visible",
          opacity: takes.length > 0 ? 1 : 0,
          transition: "opacity var(--bz-duration-fast, 150ms) linear",
        }}
      >
        {label ? <title>{label}</title> : null}
        {takes.map((take, index) => (
          <path
            key={index}
            d={take.d}
            transform={`translate(${take.ox.toFixed(2)} ${take.oy.toFixed(2)})`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ visibility: index === frame ? "visible" : "hidden" }}
          />
        ))}
      </svg>
    </div>
  );
}
