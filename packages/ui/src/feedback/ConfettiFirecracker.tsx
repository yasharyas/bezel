"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type RefObject,
} from "react";

/**
 * A shell climbs, cracks, and throws fragments that look like an ordinary
 * firework for 400ms before they gather into a word, hold, and let go.
 *
 * The text is rasterised to an offscreen canvas and read back: every cell on a
 * grid where the glyph is opaque becomes one fragment's destination. Fragments
 * beyond that count never get a destination and keep falling, which is what
 * stops the assembly reading as a machine.
 *
 * Canvas only: one rect per fragment per frame, no node per particle, no
 * animation library, no confetti library.
 */

export type FirecrackerColors = {
  /** Thrown fragments, before they are recalled. */
  fragment: string[];
  /** Fragments that land in the word. */
  letter: string[];
  /** The report: the ring and the flash. Loudest colour against the ground. */
  ink: string;
};

export type FirecrackerTiming = {
  /** Ember rises to the apex. */
  climb: number;
  /** Ordinary firework, before anything is recalled. */
  break: number;
  /** Fragments ease from where the break threw them onto the word. */
  assemble: number;
  /** The word sits, drifting a pixel. */
  hold: number;
  /** Gravity back on, and out of frame. */
  release: number;
  /** Fade, counted back from the end of the release. */
  fade: number;
};

export type FirecrackerHandle = {
  /** Ignite at a viewport point. Defaults to the bottom centre. */
  fire: (x?: number, y?: number) => void;
};

export type ConfettiFirecrackerProps = {
  /** What assembles. Changing it re-samples. Empty text mounts nothing. */
  text: string;
  /**
   * The surface this fires over, as a hex. It decides the default palette:
   * fragments have to be darker than a light ground and lighter than a dark
   * one, or the whole report is invisible.
   */
  ground?: string;
  colors?: Partial<FirecrackerColors>;
  timing?: Partial<FirecrackerTiming>;
  density?: "low" | "normal" | "dense";
  fontFamily?: string;
  fontWeight?: number | string;
  /** Above page chrome, below any dialog layer (this library puts those at 110). */
  zIndex?: number;
  /** Watch this element for a burst of taps. Off unless it is given. */
  triggerRef?: RefObject<HTMLElement | null>;
  /** Taps needed inside the window. */
  taps?: number;
  /** The rolling window those taps have to land in. */
  windowMs?: number;
  /** Force the still version on or off. Left out, the media query decides. */
  reducedMotion?: boolean;
  /** How many taps are currently inside the window, for a visible counter. */
  onTapProgress?: (count: number, needed: number) => void;
  onDone?: () => void;
};

const DEFAULT_TIMING: FirecrackerTiming = {
  climb: 480,
  break: 420,
  assemble: 750,
  hold: 900,
  release: 1050,
  fade: 760,
};

const RING_MS = 420;
const RING_FROM = 14;
const RING_TO = 204;
const FLASH_MS = 170;
const DRAG = 0.965;
const GRAVITY = 0.16;
/** Recalled fragments fall slowly enough to still be in frame at assembly. */
const PLACED_GRAVITY = GRAVITY * 0.25;
const MAX_FRAGMENTS = 1200;
const ALPHA_CUTOFF = 130;
const MAX_LAG = 170;
const SPEED_REFERENCE = 900;
const COOLDOWN_MS = 400;
const INTERACTIVE = "a, button, input, textarea, select, label, [role=button]";

const SURPLUS_RATIO = { low: 0.2, normal: 0.35, dense: 0.55 };
const STEP_SHIFT = { low: 1, normal: 0, dense: -1 };

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** WCAG relative luminance, for deciding which way the palette has to go. */
function luminance(hex: string) {
  const v = hex.replace("#", "");
  const full = v.length === 3 ? v.split("").map((c) => c + c).join("") : v;
  const rgb = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const lin = rgb.map((c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

/** Every default here clears 3:1 against its ground. */
function defaultColors(ground: string): FirecrackerColors {
  return luminance(ground) > 0.45
    ? {
        fragment: ["#912c22", "#b45309", "#7a6015", "#047857", "#0a0a0a"],
        letter: ["#0a0a0a", "#912c22", "#7a6015"],
        ink: "#912c22",
      }
    : {
        fragment: ["#f4a522", "#fbbf24", "#6ee7b7", "#e0e7ff", "#ffffff"],
        letter: ["#ffffff", "#fbbf24"],
        ink: "#fbbf24",
      };
}

type SampledPoints = { points: Array<{ x: number; y: number }>; width: number; height: number; step: number };

const sampleCache = new Map<string, SampledPoints>();

/**
 * Rasterise the text and collect a grid of opaque cells. The step scales with
 * the rendered width, so small text is not sampled into nothing and large text
 * is not sampled into a million fragments.
 */
function sampleText(
  text: string,
  maxWidth: number,
  font: (size: number) => string,
  stepShift: number,
): SampledPoints | null {
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) return null;

  const lines = text.trim().length > 16 && text.includes(" ") ? splitLines(text.trim()) : [text.trim()];
  let size = clamp(Math.round(maxWidth * 0.2), 40, 148);
  const widthAt = (s: number) => {
    measure.font = font(s);
    return Math.max(...lines.map((line) => measure.measureText(line).width));
  };
  while (size > 16 && widthAt(size) > maxWidth) size -= 2;

  const textWidth = widthAt(size);
  const lineHeight = Math.round(size * 1.12);
  const pad = Math.round(size * 0.3);
  const w = Math.ceil(textWidth + pad * 2);
  const h = lineHeight * lines.length + pad * 2;

  const key = `${text}|${w}|${stepShift}|${font(size)}`;
  const cached = sampleCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.font = font(size);
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  lines.forEach((line, i) => {
    ctx.fillText(line, w / 2, pad + lineHeight * (i + 0.5));
  });

  let data: ImageData;
  try {
    data = ctx.getImageData(0, 0, w, h);
  } catch {
    // A tainted canvas throws. An easter egg is the last thing that should
    // raise, so the caller falls back to confetti with no assembly.
    return null;
  }

  const baseStep = clamp((textWidth < 300 ? 2 : textWidth < 420 ? 3 : 4) + stepShift, 2, 6);
  let step = baseStep;
  let points: Array<{ x: number; y: number }> = [];
  // Thin the word evenly by stepping wider, rather than by dropping fragments.
  for (; step <= 12; step++) {
    points = [];
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        if (data.data[(y * w + x) * 4 + 3] > ALPHA_CUTOFF) points.push({ x, y });
      }
    }
    if (points.length <= MAX_FRAGMENTS) break;
  }
  if (!points.length) return null;

  for (let i = points.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [points[i], points[j]] = [points[j], points[i]];
  }

  const result = { points, width: w, height: h, step };
  sampleCache.set(key, result);
  return result;
}

function splitLines(text: string) {
  const mid = text.length / 2;
  let at = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === " " && (at < 0 || Math.abs(i - mid) < Math.abs(at - mid))) at = i;
  }
  return at < 0 ? [text] : [text.slice(0, at), text.slice(at + 1)];
}

type Fragment = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  dest: { x: number; y: number } | null;
  lag: number;
  phase: number;
  drift: number;
  fx: number;
  fy: number;
  frozen: boolean;
};

export const ConfettiFirecracker = forwardRef<FirecrackerHandle, ConfettiFirecrackerProps>(
  function ConfettiFirecracker(
    {
      text,
      ground = "#fafafa",
      colors,
      timing,
      density = "normal",
      fontFamily = "Georgia, 'Times New Roman', serif",
      fontWeight = 700,
      zIndex = 90,
      triggerRef,
      taps = 9,
      windowMs = 4000,
      reducedMotion,
      onTapProgress,
      onDone,
    },
    ref,
  ) {
    const raf = useRef(0);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const lastFire = useRef(0);
    const hits = useRef<number[]>([]);
    const onDoneRef = useRef(onDone);
    onDoneRef.current = onDone;

    const cleanup = useCallback(() => {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
      canvasRef.current?.remove();
      canvasRef.current = null;
    }, []);

    useEffect(() => cleanup, [cleanup]);

    const fire = useCallback(
      (originX?: number, originY?: number) => {
        if (typeof window === "undefined") return;
        if (!text.trim()) return;
        const now = performance.now();
        // One run at a time: two canvases must never stack.
        if (canvasRef.current || now - lastFire.current < COOLDOWN_MS) return;
        lastFire.current = now;

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const x0 = originX ?? vw / 2;
        const y0 = originY ?? vh * 0.92;
        const cx = vw / 2;
        const cy = vh * 0.42;

        const t = { ...DEFAULT_TIMING, ...timing };
        const palette = { ...defaultColors(ground), ...colors };
        const font = (size: number) => `${fontWeight} ${size}px ${fontFamily}`;
        // Read imperatively at fire time: deriving it during render mismatches
        // on hydration.
        const reduced = reducedMotion ?? window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const canvas = document.createElement("canvas");
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(vw * dpr);
        canvas.height = Math.floor(vh * dpr);
        canvas.setAttribute("aria-hidden", "true");
        Object.assign(canvas.style, {
          position: "fixed",
          inset: "0",
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: String(zIndex),
        } satisfies Partial<CSSStyleDeclaration>);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.scale(dpr, dpr);
        document.body.appendChild(canvas);
        canvasRef.current = canvas;

        const start = (sampled: SampledPoints | null) => {
          if (!canvasRef.current) return;
          const fragments: Fragment[] = [];
          const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)];

          const originLeft = sampled ? cx - sampled.width / 2 : 0;
          const originTop = sampled ? cy - sampled.height / 2 : 0;
          const textWidth = sampled ? sampled.width : vw * 0.5;
          const step = sampled ? sampled.step : 3;
          const speed = 7.2 * clamp(textWidth / SPEED_REFERENCE, 0.5, 1);

          const spawn = (dest: { x: number; y: number } | null) => {
            const angle = Math.random() * Math.PI * 2;
            // The surplus leaves about twice as fast, so it is well past the
            // word by the time the word appears instead of littering it.
            const power = (0.6 + Math.random() * 0.6) * speed * (dest ? 1 : 2);
            fragments.push({
              x: cx,
              y: cy,
              vx: Math.cos(angle) * power,
              vy: Math.sin(angle) * power - 1.2,
              size: step * 0.8 + Math.random() * (step / 3),
              color: dest ? pick(palette.letter) : pick(palette.fragment),
              dest,
              lag: Math.random() * MAX_LAG,
              phase: Math.random() * Math.PI * 2,
              drift: 0.6 + Math.random() * 0.8,
              fx: cx,
              fy: cy,
              frozen: false,
            });
          };

          if (sampled) {
            for (const p of sampled.points) spawn({ x: originLeft + p.x, y: originTop + p.y });
          }
          const surplus = Math.max(40, Math.round((sampled?.points.length ?? 120) * SURPLUS_RATIO[density]));
          for (let i = 0; i < surplus; i++) spawn(null);

          const climbEnd = t.climb;
          const breakEnd = climbEnd + t.break;
          const assembleEnd = breakEnd + t.assemble;
          const holdEnd = assembleEnd + t.hold;
          const end = holdEnd + t.release;

          if (reduced) {
            // Less movement, not less of the thing: the word fades up at rest
            // with a static scatter around it.
            for (const f of fragments) {
              if (f.dest) {
                f.x = f.dest.x;
                f.y = f.dest.y;
              } else {
                f.x = Math.random() * vw;
                f.y = Math.random() * vh;
              }
            }
          }

          const began = performance.now();
          let previous = began;

          const frame = (time: number) => {
            if (!canvasRef.current) return;
            const elapsed = time - began;
            const dt = Math.min(time - previous, 48);
            previous = time;
            const frameScale = dt / 16.6667;
            ctx.clearRect(0, 0, vw, vh);

            if (reduced) {
              const still = 400;
              const total = still + t.assemble + t.hold + still;
              const alpha =
                elapsed < still
                  ? elapsed / still
                  : elapsed > total - still
                    ? Math.max(0, (total - elapsed) / still)
                    : 1;
              ctx.globalAlpha = alpha;
              for (const f of fragments) {
                ctx.fillStyle = f.color;
                ctx.fillRect(f.x, f.y, f.size, f.size);
              }
              ctx.globalAlpha = 1;
              if (elapsed >= total) {
                cleanup();
                onDoneRef.current?.();
                return;
              }
              raf.current = requestAnimationFrame(frame);
              return;
            }

            if (elapsed < climbEnd) {
              // The climb: an ember and a short tail, nothing else.
              const p = easeOutCubic(elapsed / climbEnd);
              const ex = x0 + (cx - x0) * p;
              const ey = y0 + (cy - y0) * p;
              const tail = ctx.createLinearGradient(ex, ey, ex, ey + 46);
              tail.addColorStop(0, palette.ink);
              tail.addColorStop(1, "transparent");
              ctx.fillStyle = tail;
              ctx.fillRect(ex - 1.5, ey, 3, 46);
              ctx.fillStyle = palette.ink;
              ctx.beginPath();
              ctx.arc(ex, ey, 3.4, 0, Math.PI * 2);
              ctx.fill();
              raf.current = requestAnimationFrame(frame);
              return;
            }

            const sinceReport = elapsed - climbEnd;

            if (sinceReport < FLASH_MS) {
              const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
              glow.addColorStop(0, palette.ink);
              glow.addColorStop(1, "transparent");
              ctx.globalAlpha = 0.55 * (1 - sinceReport / FLASH_MS);
              ctx.fillStyle = glow;
              ctx.fillRect(cx - 120, cy - 120, 240, 240);
              ctx.globalAlpha = 1;
            }
            if (sinceReport < RING_MS) {
              const p = sinceReport / RING_MS;
              ctx.globalAlpha = 1 - p;
              ctx.strokeStyle = palette.ink;
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.arc(cx, cy, RING_FROM + (RING_TO - RING_FROM) * p, 0, Math.PI * 2);
              ctx.stroke();
              ctx.globalAlpha = 1;
            }

            const releasing = elapsed >= holdEnd;
            const fade = releasing ? clamp((end - elapsed) / t.fade, 0, 1) : 1;

            for (const f of fragments) {
              const placed = f.dest !== null;

              if (elapsed < breakEnd || !placed || releasing) {
                if (releasing && placed && !f.frozen) {
                  // The word lets go rather than switching off: a shove out
                  // and up before gravity takes over again.
                  f.frozen = true;
                  f.vx = (f.x - cx) * 0.012 + (Math.random() - 0.5) * 1.6;
                  f.vy = -(0.8 + Math.random() * 2.2);
                }
                const g = placed && !releasing ? PLACED_GRAVITY : GRAVITY;
                const drag = Math.pow(DRAG, frameScale);
                f.vx *= drag;
                f.vy = f.vy * drag + g * frameScale;
                f.x += f.vx * frameScale;
                f.y += f.vy * frameScale;
              } else if (elapsed < assembleEnd) {
                if (!f.frozen) {
                  // Ease from wherever the break left it, not from the apex.
                  f.frozen = true;
                  f.fx = f.x;
                  f.fy = f.y;
                }
                const local = clamp((elapsed - breakEnd - f.lag) / (t.assemble - MAX_LAG), 0, 1);
                const e = easeOutCubic(local);
                f.x = f.fx + (f.dest!.x - f.fx) * e;
                f.y = f.fy + (f.dest!.y - f.fy) * e;
              } else {
                // The hold drifts a pixel on each fragment's own phase, so the
                // word stays made of something instead of freezing into an image.
                f.frozen = false;
                f.x = f.dest!.x + Math.sin(elapsed / 700 + f.phase) * f.drift;
                f.y = f.dest!.y + Math.cos(elapsed / 640 + f.phase) * f.drift * 0.7;
              }
            }

            ctx.globalAlpha = fade;
            // Two passes: stray confetti has to pass behind the letters.
            for (const f of fragments) {
              if (f.dest) continue;
              ctx.fillStyle = f.color;
              ctx.fillRect(f.x, f.y, f.size, f.size);
            }
            for (const f of fragments) {
              if (!f.dest) continue;
              ctx.fillStyle = f.color;
              ctx.fillRect(f.x, f.y, f.size, f.size);
            }
            ctx.globalAlpha = 1;

            if (elapsed >= end) {
              cleanup();
              onDoneRef.current?.();
              return;
            }
            raf.current = requestAnimationFrame(frame);
          };

          raf.current = requestAnimationFrame(frame);
        };

        // Sampling the fallback face silently assembles the wrong typeface, so
        // wait for the webfont before reading pixels back.
        const maxWidth = Math.min(vw * 0.86, 1100);
        const ready = document.fonts
          ? document.fonts.load(font(96)).then(() => document.fonts.ready)
          : Promise.resolve();
        void ready
          .catch(() => undefined)
          .then(() => {
            if (!canvasRef.current) return;
            start(sampleText(text, maxWidth, font, STEP_SHIFT[density]));
          });
      },
      [cleanup, colors, density, fontFamily, fontWeight, ground, reducedMotion, text, timing, zIndex],
    );

    useImperativeHandle(ref, () => ({ fire }), [fire]);

    useEffect(() => {
      const el = triggerRef?.current;
      if (!el || taps < 1) return;
      const onPointerDown = (event: PointerEvent) => {
        // One press is one hit, and a press on a control is not a hit at all.
        if (!event.isPrimary) return;
        if ((event.target as HTMLElement | null)?.closest?.(INTERACTIVE)) return;
        const now = performance.now();
        // A rolling window, not a streak: old hits fall out of the array.
        hits.current = hits.current.filter((at) => now - at < windowMs);
        hits.current.push(now);
        onTapProgress?.(hits.current.length, taps);
        if (hits.current.length >= taps) {
          hits.current = [];
          onTapProgress?.(0, taps);
          fire(event.clientX, event.clientY);
        }
      };
      el.addEventListener("pointerdown", onPointerDown);
      return () => el.removeEventListener("pointerdown", onPointerDown);
    }, [fire, onTapProgress, taps, triggerRef, windowMs]);

    return null;
  },
);
