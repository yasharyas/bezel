"use client";

import {
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

export type SketchMark = "highlight" | "underline" | "strike";

/**
 * The highlighter set. A wash sits behind the words and a pen line crosses
 * them, so each colour carries two values: a wash the text stays legible on
 * and an ink that reads as a confident stroke. Each is a [paper, void] pair
 * picked by light-dark(), the same switch the rest of the library uses, so a
 * host that declares `color-scheme: dark` gets the void values with no prop.
 * On paper the wash is opaque and pale enough for dark text (13:1 or better).
 * On void it is the saturated colour at partial alpha: the page keeps its
 * light text and the ground darkens the tint enough to hold 4.8:1 or better.
 * That holds for full-strength text only: muted text (white at 80%) drops
 * under 4.5:1 on the yellow and lime washes, so keep marked words at full ink.
 * Pen inks clear 3:1 as marks on paper, paper-raised, void and void-raised.
 */
export const SKETCH_PALETTE = {
  yellow: {
    // Warmed toward gold on void: a pale yellow darkened by the ground turns olive.
    wash: ["#fff04d", "rgba(255, 190, 20, 0.5)"],
    ink: ["#b38400", "#ffe14d"],
  },
  lime: {
    wash: ["#c8f560", "rgba(190, 240, 60, 0.4)"],
    ink: ["#4f9a00", "#bef264"],
  },
  purple: {
    wash: ["#ecc6ff", "rgba(214, 110, 255, 0.42)"],
    ink: ["#a31fc9", "#e27cff"],
  },
  violet: {
    wash: ["#d7d0ff", "rgba(140, 110, 255, 0.46)"],
    ink: ["#6a3cf0", "#a996ff"],
  },
} as const;

export type SketchColor = keyof typeof SKETCH_PALETTE;

const isPreset = (value: string): value is SketchColor =>
  Object.prototype.hasOwnProperty.call(SKETCH_PALETTE, value);

type Layer = { stroke: string; blend?: CSSProperties["mixBlendMode"] };

/**
 * The layers a mark is painted in. A plain colour, or a preset pen line, is one
 * layer. A preset wash is two, because its overshoot reaches into the words on
 * either side and those words are painted underneath it. On paper the wash
 * multiplies, the way highlighter ink does, so a neighbouring letter stays
 * black instead of vanishing under an opaque pastel. On void it paints
 * normally: it is already translucent there, and multiplying it into a dark
 * ground would erase it. light-dark() cannot switch a blend mode, so each layer
 * carries the other ground's value as transparent.
 */
function resolveLayers(color: string, mark: SketchMark): { layers: Layer[]; preset: boolean } {
  if (!isPreset(color)) return { layers: [{ stroke: color }], preset: false };
  const [paper, dark] = SKETCH_PALETTE[color][mark === "highlight" ? "wash" : "ink"];
  if (mark !== "highlight") return { layers: [{ stroke: `light-dark(${paper}, ${dark})` }], preset: true };
  return {
    layers: [
      { stroke: `light-dark(${paper}, transparent)`, blend: "multiply" },
      { stroke: `light-dark(transparent, ${dark})` },
    ],
    preset: true,
  };
}

export type SketchHighlightProps = {
  children: ReactNode;
  /** highlight lays a marker wash behind the words; the other two draw over them. */
  mark?: SketchMark;
  /**
   * yellow, lime, purple or violet for the tuned highlighter set, or any CSS
   * colour. The default takes the text colour, so it works on any ground.
   */
  color?: SketchColor | (string & {});
  /**
   * 0 to 1. A preset is already mixed for its ground, so it defaults to 1. A
   * plain colour defaults to 0.3 for the wash and 1 for a pen line.
   */
  opacity?: number;
  /** Hand wobble in the stroke: 0 is a ruler, 2 is a bad pen. */
  roughness?: number;
  /**
   * How far the ink shifts between takes, 0 to 1. Above 0 the mark is redrawn
   * three ways and cycles between them, the way hand-drawn animation boils.
   * 0 pins it to one still take and runs no timer at all.
   */
  boil?: number;
  /** How long each take holds. Drawn animation sits around 2 to 3 frames a second. */
  boilMs?: number;
  /**
   * Fixes which sketch you get. The default is a hash of the words, so the
   * same phrase is always marked the same way; change it to shuffle.
   */
  seed?: number;
  /** Re-roll the sketch while a pointer rests on the words. */
  resketchOnHover?: boolean;
  /** Overrides the width derived from the line height. */
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
};

type Line = { x: number; y: number; w: number; h: number };
type Stroke = { d: string; width: number };
/** One drawing of a mark: every pass of the pen, in order. */
type Take = Stroke[];

const TAKES = 3;

/** Sub-pixel moves are noise, not a new layout. */
const near = (a: number, b: number) => Math.abs(a - b) < 0.5;

/**
 * The block the words are laid out in. ResizeObserver skips non-replaced
 * inline elements, so watching the marked span itself would never fire: it is
 * this box getting narrower that rewraps the line.
 */
function blockAncestor(element: HTMLElement | null) {
  let node = element;
  while (node && getComputedStyle(node).display === "inline") node = node.parentElement;
  return node ?? document.body;
}

const sameBox = (a: { left: number; top: number; w: number; h: number }, b: typeof a) =>
  near(a.left, b.left) && near(a.top, b.top) && near(a.w, b.w) && near(a.h, b.h);

const sameLines = (a: Line[], b: Line[]) =>
  a.length === b.length &&
  a.every(
    (line, i) =>
      near(line.x, b[i].x) && near(line.y, b[i].y) && near(line.w, b[i].w) && near(line.h, b[i].h),
  );

/* --------------------------------------------------------------- the hand */

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

/** FNV-1a, so a phrase can be its own seed without the caller passing one. */
function hashSeed(text: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** The words inside, so the seed can come from what is being marked. */
function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children);
  return "";
}

/** Smooth a polyline into quadratics: every point becomes a control point. */
function toPath(points: Array<[number, number]>) {
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

/**
 * One pass of the pen over one line of text.
 *
 * The wash is a marker sweep: it leans forward up the box and back down it, so
 * the legs overlap and the edges come out ragged rather than boxed. A pen line
 * is a single shallow bow, drawn twice with different wobble for an underline
 * because nobody lands the same line on the second go.
 */
function penPass(line: Line, mark: SketchMark, roughness: number, pass: number, rand: () => number) {
  const { x, y, w, h } = line;
  const wobble = (amount: number) => (rand() - 0.5) * 2 * amount * roughness;
  const points: Array<[number, number]> = [];

  if (mark === "highlight") {
    // Legs about a third of the line height apart, leaning far enough that the
    // return stroke runs backwards. Any wider and the sweep reads as a zigzag
    // rather than one pass of a marker.
    const legWidth = Math.max(h * 0.29, 7);
    const legs = Math.max(4, Math.round(w / legWidth)) * 2;
    const overhang = h * 0.24;
    const step = (w + overhang * 2) / legs;
    const lean = step * 0.9;
    const top = y + h * 0.1;
    const bottom = y + h * 0.96;
    for (let i = 0; i <= legs; i += 1) {
      const up = i % 2 === 0;
      points.push([
        x - overhang + i * step + (up ? -lean : lean) + wobble(h * 0.08),
        (up ? top : bottom) + wobble(h * 0.07),
      ]);
    }
    return points;
  }

  const baseline = mark === "underline" ? y + h * (0.93 + pass * 0.045) : y + h * 0.57;
  const overhang = h * (pass === 0 ? 0.14 : 0.04);
  const span = w + overhang * 2;
  const steps = Math.max(4, Math.round(span / 24));
  // A hand-drawn line bows: the middle drifts off the straight by a hair.
  const bow = h * 0.09 * (rand() - 0.35);
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    points.push([
      x - overhang + t * span + wobble(h * 0.05),
      baseline + Math.sin(t * Math.PI) * bow + wobble(h * 0.045),
    ]);
  }
  return points;
}

/** Every take of every pass for one line, ready to drop into an `<svg>`. */
function drawLine(
  line: Line,
  mark: SketchMark,
  { roughness, boil, seed, strokeWidth, takes }: {
    roughness: number;
    boil: number;
    seed: number;
    strokeWidth?: number;
    takes: number;
  },
): Take[] {
  const passes = mark === "underline" ? 2 : 1;
  const width =
    strokeWidth ??
    (mark === "highlight"
      ? Math.min(24, Math.max(5, line.h * 0.36))
      : Math.max(1.6, line.h * 0.07));

  // One base shape per pass, then each take nudges it. Keeping the base means
  // the mark stays recognisably itself while the ink moves.
  const bases = Array.from({ length: passes }, (_, pass) =>
    penPass(line, mark, roughness, pass, makeRandom(seed + pass * 104729)),
  );

  const drift = line.h * 0.05 * boil;
  return Array.from({ length: takes }, (_, take) => {
    const rand = makeRandom(seed + (take + 1) * 7919);
    return bases.map((base) => ({
      width,
      d: toPath(
        base.map(([px, py]) => [
          px + (rand() - 0.5) * 2 * drift,
          py + (rand() - 0.5) * 2 * drift,
        ] as [number, number]),
      ),
    }));
  });
}

/* ------------------------------------------------------------- the marker */

/**
 * A marker mark on a run of words, drawn as its own SVG strokes rather than
 * handed to a sketch library.
 *
 * The mark does not play an entrance and stop. It is redrawn three ways from
 * one seed and cycles between them, so the ink keeps boiling the way cel
 * animation does, and it survives wrapping: each line of a wrapped phrase gets
 * its own sweep. Reduced motion holds the first take still, a hidden tab
 * pauses the cycle, and `boil={0}` opts out of the timer entirely.
 */
export function SketchHighlight({
  children,
  mark = "highlight",
  color = "currentColor",
  opacity,
  roughness = 1,
  boil = 0.3,
  boilMs = 420,
  seed,
  resketchOnHover = false,
  strokeWidth,
  className = "",
  style,
}: SketchHighlightProps) {
  const probeRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [box, setBox] = useState<{ left: number; top: number; w: number; h: number } | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [roll, setRoll] = useState(0);
  const [frame, setFrame] = useState(0);

  const words = textOf(children);
  const takeCount = boil > 0 ? TAKES : 1;
  const baseSeed = ((seed ?? hashSeed(words || mark)) + roll * 0x9e3779b1) >>> 0;

  const measure = useCallback(() => {
    const probe = probeRef.current;
    const text = textRef.current;
    if (!probe || !text) return;
    const rects = Array.from(text.getClientRects()).filter((r) => r.width > 0 && r.height > 0);
    if (rects.length === 0) {
      setLines((previous) => (previous.length === 0 ? previous : []));
      setBox(null);
      return;
    }
    const origin = probe.getBoundingClientRect();
    const union = text.getBoundingClientRect();
    // getBoundingClientRect reports screen pixels. Inside a scaled ancestor
    // those are not the pixels the SVG is laid out in, so divide them back.
    const block = probe.offsetParent as HTMLElement | null;
    const ratio = block?.offsetWidth ? block.getBoundingClientRect().width / block.offsetWidth : 1;
    const scale = Number.isFinite(ratio) && ratio > 0.01 ? ratio : 1;
    const next = {
      left: (union.left - origin.left) / scale,
      top: (union.top - origin.top) / scale,
      w: union.width / scale,
      h: union.height / scale,
    };
    const nextLines = rects.map((r) => ({
      x: (r.left - union.left) / scale,
      y: (r.top - union.top) / scale,
      w: r.width / scale,
      h: r.height / scale,
    }));
    // A ResizeObserver on the page fires for things that never moved these
    // words. Dropping the no-op keeps the strokes from being rebuilt for free.
    setBox((previous) => (previous && sameBox(previous, next) ? previous : next));
    setLines((previous) => (sameLines(previous, nextLines) ? previous : nextLines));
  }, []);

  useLayoutEffect(() => {
    measure();
    const text = textRef.current;
    if (!text) return;
    const observer = new ResizeObserver(measure);
    observer.observe(blockAncestor(text));
    observer.observe(document.body);
    // Web fonts land after first paint and move every word on the line.
    void document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, [measure, words]);

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

  const ink = resolveLayers(color, mark);
  const defaultOpacity = ink.preset || mark !== "highlight" ? 1 : 0.3;

  const takes = useMemo(
    () =>
      lines.map((line, index) =>
        drawLine(line, mark, {
          roughness,
          boil,
          seed: baseSeed + index * 131071,
          strokeWidth,
          takes: takeCount,
        }),
      ),
    [lines, mark, roughness, boil, baseSeed, strokeWidth, takeCount],
  );

  const drawing = ink.layers.map((layer, layerIndex) => (
    <svg
      key={layerIndex}
      aria-hidden="true"
      focusable="false"
      width={box?.w ?? 0}
      height={box?.h ?? 0}
      viewBox={box ? `0 0 ${box.w} ${box.h}` : undefined}
      style={{
        position: "absolute",
        left: box?.left ?? 0,
        top: box?.top ?? 0,
        overflow: "visible",
        pointerEvents: "none",
        opacity: box ? (opacity ?? defaultOpacity) : 0,
        transition: "opacity var(--bz-duration-fast, 150ms) linear",
        mixBlendMode: layer.blend,
      }}
    >
      {takes.map((line, lineIndex) =>
        line.map((passes, take) =>
          passes.map((pass, passIndex) => (
            <path
              key={`${lineIndex}-${take}-${passIndex}`}
              d={pass.d}
              fill="none"
              strokeWidth={pass.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              // Set as a style so a preset's light-dark() pair resolves in the cascade.
              style={{ stroke: layer.stroke, visibility: take === frame ? "visible" : "hidden" }}
            />
          )),
        ),
      )}
    </svg>
  ));

  const hoverProps = resketchOnHover
    ? { onPointerEnter: () => setRoll((r) => r + 1) }
    : undefined;

  return (
    <span className={className} style={style} data-mark={mark} {...hoverProps}>
      {/* Zero-size probe. Absolutely positioned children of this span share its
          containing block, so reading the probe gives that block's origin
          exactly, whichever ancestor turns out to be positioned. */}
      <span
        ref={probeRef}
        aria-hidden="true"
        style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0 }}
      />
      {/* Document order is the whole z-order story here: the wash is painted
          before the words, a pen line after them. */}
      {mark === "highlight" ? drawing : null}
      <span ref={textRef} style={{ position: "relative" }}>
        {children}
      </span>
      {mark === "highlight" ? null : drawing}
    </span>
  );
}
