"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type RefObject,
} from "react";

/*
 * BrickWallLoader: a multi-step loader played as a game of Breakout, where every
 * step is a row of bricks and only real progress breaks them.
 *
 * Each step is one row of bricks in a framed playfield. The first step's row
 * sits at the bottom of the wall, nearest the paddle; later steps stack above
 * it and the last step is a row of steel. A pixel adventurer rides the paddle.
 * Every progress event the host reports sends the ball up from the paddle, and
 * the front row then shows exactly floor(progress x bricks) broken bricks, with
 * a crack on the next brick for the part in between. When the host says a step
 * is done, the rest of its row breaks and the wall drops one row. A step of
 * unknown size hatches its row and the ball only dribbles.
 *
 * Honesty: nothing in the playfield moves on a timer. The bar and the wall
 * change only when `steps` changes, at most one shot per 400ms with increments
 * merged. The wall may lag the host by one beat, but it is never ahead of it.
 *
 * The host owns the run. `steps` is the only state, the same convention as
 * Stepper: the loader never advances, completes, fails, retries or skips a
 * step. It calls `onRetry(id)`, `onSkip(id)` and `onCancel()` from its error
 * menu, `onContinue()` from the results screen and `onComplete()` once the
 * finale has played.
 *
 * Accessibility: the nameplate is the one progressbar, named by the heading.
 * A visually hidden list carries every step's state, and `aria-busy` sits on
 * that list only, so the narration log (role="log", milestones only, one
 * sentence per beat) and the error alert (role="alert") are never inside a
 * busy subtree. The error menu is a group with a roving tabindex. Focus moves
 * only when it is already inside the loader: to Retry when a step fails, to the
 * log when a retry starts and to Continue when the results open.
 *
 * Motion: `reducedMotion` follows the media query live unless you set it.
 * Reduced motion, the Pause motion toggle, an off-screen loader and a hidden
 * tab all stop the ball, the loops and the shards, and the wall snaps to its
 * honest position, so nothing is lost. A hidden tab plays no beats: finished
 * steps are flushed at once, and on return the footer says what happened while
 * you were away. The loader keeps one height for a given number of steps and
 * width, whatever state it is in.
 */

/* ---------------- shared: types and labels ---------------- */

export type LoaderStepStatus = "pending" | "active" | "done" | "error" | "skipped";

export type LoaderStep = {
  /** Stable key. Beats and announcements key on it. A changed id list or length rebuilds the run. */
  id: string;
  /** Present tense: "Import 1,240 contacts". */
  label: string;
  /** Where the step is. Only the host changes it. */
  status: LoaderStepStatus;
  /** 0 to 1, from real host events only. Leave it out (or null) when the size of the work is unknown. */
  progress?: number | null;
  /** A real count, shown on the nameplate and never announced: "620 of 1,240 contacts". */
  detail?: string;
  /** Total units of work. Brick Wall draws one brick per unit when this is 16 or fewer. The other four ignore it. */
  count?: number;
  /** Past-tense narration: "Imported 1,240 contacts". Falls back to "<label>: done". */
  doneText?: string;
  /** Plain sentence, shown and sent to role="alert" when status is "error". */
  error?: string;
  /** Longer text behind Show details. */
  errorDetail?: string;
  /** 1-based. 2 or more shows "Attempt 2", and a step that then finishes counts as a recovered hiccup. */
  attempt?: number;
  /** Host clock for the running or failed attempt, in milliseconds. */
  elapsedMs?: number;
  /** Host clock for a finished step, in milliseconds. The results Time tile is the sum. */
  durationMs?: number;
};

export type LoaderStat = {
  /** Tile heading on the results screen: "Contacts". */
  label: string;
  /** A real figure. Numbers count up when motion is allowed; strings show as given. */
  value: string | number;
  /** Small line under the value: "imported". Default none. */
  sub?: string;
};

export type LoaderLabels = {
  /** The game's word for one step, used in the footer. Encounter: "Stage". */
  unit: string;
  /** The finale banner and the footer once every step is settled. Encounter: "Stage clear". */
  clear: string;
  /** Accessible name of the narration log. Default "Narration". */
  narration: string;
  /** Accessible name of the error menu. Default "What next". */
  menu: string;
  /** Retry button. Default "Retry". */
  retry: string;
  /** Skip button. Default "Skip". */
  skip: string;
  /** Cancel button. Default "Cancel". */
  cancel: string;
  /** Details toggle while closed. Default "Show details". */
  showDetails: string;
  /** Details toggle while open. Default "Hide details". */
  hideDetails: string;
  /** Heading and accessible name of the details card. Default "Details". */
  details: string;
  /** Accessible name of the error message when it is long enough to scroll. Default "Error message". */
  errorMessage: string;
  /** The motion toggle. Default "Pause motion". */
  pauseMotion: string;
  /** The results button. Default "Continue". */
  continue: string;
  /** The nameplate mark on a failed step. Default "Failed". */
  failed: string;
  /** Footer note while the error menu waits. Default "Waiting for you". */
  waiting: string;
  /** Nameplate count for a step of unknown size. Default "Working, size unknown". */
  sizeUnknown: string;
  /** Nameplate tag from the second attempt. Default "Attempt 2". */
  attempt: (n: number) => string;
  /** Log placeholder before the first milestone. Default "5 steps queued. Up first: Create the workspace." */
  queued: (n: number, first: string) => string;
  /** Log placeholder when mounted mid-run, never announced. Default "1 of 5 done. Now: Import 1,240 contacts." */
  progress: (done: number, total: number, now: string) => string;
  /** Footer note after a hidden tab or scroll away, never announced. Default "While you were away: 2 steps finished." */
  away: (n: number) => string;
  /** The completion sentence. Default "All 5 steps finished." or "All 5 steps finished (1 skipped).", "The step finished." for one */
  complete: (total: number, skipped: number) => string;
  /** The line after Cancel. Default "Stopped. 2 finished steps are kept." */
  stopped: (kept: number) => string;
};

const LOADER_DEFAULT_LABELS: Omit<LoaderLabels, "unit" | "clear"> = {
  narration: "Narration",
  menu: "What next",
  retry: "Retry",
  skip: "Skip",
  cancel: "Cancel",
  showDetails: "Show details",
  hideDetails: "Hide details",
  details: "Details",
  errorMessage: "Error message",
  pauseMotion: "Pause motion",
  continue: "Continue",
  failed: "Failed",
  waiting: "Waiting for you",
  sizeUnknown: "Working, size unknown",
  attempt: (n) => `Attempt ${n}`,
  queued: (n, first) => `${n} step${n === 1 ? "" : "s"} queued.${first ? ` Up first: ${first}.` : ""}`,
  progress: (done, total, now) => `${done} of ${total} done.${now ? ` Now: ${now}.` : ""}`,
  away: (n) => `While you were away: ${n} step${n === 1 ? "" : "s"} finished.`,
  complete: (total, skipped) => `${total === 1 ? "The step" : `All ${total} steps`} finished${skipped ? ` (${skipped} skipped)` : ""}.`,
  stopped: (kept) => `Stopped. ${kept} finished step${kept === 1 ? " is" : "s are"} kept.`,
};

/* ---------------- end shared: types and labels ---------------- */

/* Brick Wall palettes. Every row colour clears 4.5:1 on the dark field; on the
   light field the rows lean on their ink outline instead. Accent fills the
   bar, the paddle caps and the primary buttons: white text in light themes,
   ink in dark ones. */

export type BrickWallLoaderColors = {
  /** Playfield ground. */
  field: string;
  /** The pixel frame on the playfield's left, right and top. */
  frame: string;
  /** Eight brick colours; the row for step k takes rows[k % 8]. */
  rows: string[];
  /** Brick outlines, cracks and rubble outlines. */
  brickLine: string;
  /** The last step's steel row. */
  steel: string;
  /** Steel highlight. */
  steelLight: string;
  /** Steel shade, the rivets and the dimmed paddle caps after an error. */
  steelShade: string;
  /** The paddle body. */
  paddle: string;
  /** The paddle's end caps. */
  paddleCap: string;
  /** The ball. */
  ball: string;
  /** Skipped rows and the empty tally slot for a skipped step. */
  hatch: string;
  /** The character's 1px outline. */
  spriteOutline: string;
  /** A 1px rim around the character's silhouette, so dark hair and boots still read on a dark field. Transparent in the light presets. */
  spriteRim?: string;
  /** Bar fill, the attempt tag and the primary buttons. */
  accent: string;
  /** Text on accent. */
  onAccent: string;
};

export type BrickWallLoaderPalette = { light: BrickWallLoaderColors; dark: BrickWallLoaderColors };

const RAINBOW_ROWS = ["#ef4444", "#f97316", "#facc15", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];
const CANDY_ROWS = ["#fda4af", "#fdba74", "#fde68a", "#86efac", "#67e8f9", "#93c5fd", "#c4b5fd", "#f9a8d4"];

/** Two presets. Spread one to customise it: { ...BRICK_WALL_LOADER_PALETTES.rainbow, dark: { ... } }. */
export const BRICK_WALL_LOADER_PALETTES = {
  rainbow: {
    light: {
      field: "#f3f1ff", frame: "#17142e", rows: RAINBOW_ROWS, brickLine: "#17142e",
      steel: "#94a3b8", steelLight: "#e2e8f0", steelShade: "#475569",
      paddle: "#17142e", paddleCap: "#2563eb", ball: "#17142e", hatch: "#17142e",
      spriteOutline: "#17142e", spriteRim: "transparent", accent: "#2563eb", onAccent: "#ffffff",
    },
    dark: {
      field: "#0f0c24", frame: "#c9c5e6", rows: RAINBOW_ROWS, brickLine: "#0f0c24",
      steel: "#94a3b8", steelLight: "#e2e8f0", steelShade: "#475569",
      paddle: "#e9e6ff", paddleCap: "#93c5fd", ball: "#ffffff", hatch: "#c9c5e6",
      spriteOutline: "#0b0918", spriteRim: "#c9c5e6", accent: "#93c5fd", onAccent: "#0a0a0a",
    },
  },
  candy: {
    light: {
      field: "#fff4fb", frame: "#3a1240", rows: CANDY_ROWS, brickLine: "#3a1240",
      steel: "#cbd5e1", steelLight: "#f1f5f9", steelShade: "#64748b",
      paddle: "#3a1240", paddleCap: "#c026d3", ball: "#3a1240", hatch: "#3a1240",
      spriteOutline: "#17142e", spriteRim: "transparent", accent: "#c026d3", onAccent: "#ffffff",
    },
    dark: {
      field: "#1d0f26", frame: "#f0abfc", rows: CANDY_ROWS, brickLine: "#1d0f26",
      steel: "#cbd5e1", steelLight: "#f1f5f9", steelShade: "#64748b",
      paddle: "#f0abfc", paddleCap: "#c4b5fd", ball: "#ffffff", hatch: "#f0abfc",
      spriteOutline: "#0b0918", spriteRim: "#f0abfc", accent: "#f0abfc", onAccent: "#0a0a0a",
    },
  },
} satisfies Record<string, BrickWallLoaderPalette>;

export type BrickWallLoaderPaletteName = keyof typeof BRICK_WALL_LOADER_PALETTES;

export type BrickWallLoaderProps = {
  /**
   * The run, and the only state the loader reads. Required. A new run starts
   * when every step is pending again, when the ids change, when a done or
   * skipped step goes back to pending or active, or when a stopped run's host
   * makes a step active.
   */
  steps: LoaderStep[];
  /** The heading text and the progressbar's name. Required. */
  title: string;
  /** Heading level for the title. Default 2. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** A preset name ("rainbow" or "candy") or your own light and dark colours. Default "rainbow". */
  palette?: BrickWallLoaderPaletteName | BrickWallLoaderPalette;
  /** A preset name ("ember", "tide", "moss" or "plum") or your own character. Default "ember". */
  character?: LoaderCharacterName | LoaderCharacter;
  /** Forces a colour scheme. Default: inherit the host's color-scheme, which light-dark() follows. */
  colorScheme?: "light" | "dark";
  /** Overrides for any visible or announced string. Default: English labels, unit "Row", clear "Wall cleared". */
  labels?: Partial<LoaderLabels>;
  /** Extra results tiles, real numbers only. Default none. */
  stats?: LoaderStat[];
  /** Appended to the completion line: "Your workspace is ready." Default none. */
  completeText?: string;
  /** Called with the failed step's id. Absent: no Retry button. */
  onRetry?: (id: string) => void;
  /** Called with the failed step's id. Absent: no Skip button. */
  onSkip?: (id: string) => void;
  /** Called after the loader stops and narrates it. Absent: no Cancel button. */
  onCancel?: () => void;
  /** Present: a Continue button on the results screen. Default absent. */
  onContinue?: () => void;
  /** Called once per run, after the finale's last beat. */
  onComplete?: () => void;
  /** Mirrors what the log and the alert say, for your own announcer or logs. */
  onAnnounce?: (text: string, politeness: "polite" | "assertive") => void;
  /** true or false forces it. Default undefined: follows prefers-reduced-motion live. */
  reducedMotion?: boolean;
  /** Added to the root section. */
  className?: string;
  /** Merged into the root section's style. */
  style?: CSSProperties;
};

/* ---------------- shared: timing constants and helpers ---------------- */

const FAST = 150;
const BASE = 300;
const SLOW = 500;
const BEAT = 2400;
/** At most one progress hit per 400ms; increments in between merge into the next. */
const HIT_GAP = 400;
/** A finishing blow lands this long after it starts. */
const IMPACT = 100;
/** Completions this close together share a beat. */
const COLLECT = 100;
/** A step holds the front for at least this long. */
const DWELL = 300;
/** This many queued completions become one beat. */
const BURST_MIN = 3;
/** Completions this close share one sentence and one announcement. */
const COALESCE = 400;

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
const settled = (s?: LoaderStep) => !!s && (s.status === "done" || s.status === "skipped");
const lowerFirst = (s: string) => (s && s.length > 1 && s[1] === s[1].toLowerCase() ? s[0].toLowerCase() + s.slice(1) : s || "");
const listJoin = (a: string[]) => (a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);
const fmtNum = (n: number) => Math.round(n).toLocaleString("en-US");

function fmtDur(ms: number) {
  if (!Number.isFinite(ms)) return "";
  if (ms < 950) return `${(Math.max(1, Math.round(ms / 100)) / 10).toFixed(1)}s`;
  if (ms < 9950) return `${(Math.round(ms / 100) / 10).toFixed(1)}s`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}

/** cubic-bezier(x1, y1, x2, y2) as a function of time, solved by bisection. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const at = (t: number, a: number, b: number) => 3 * a * t * (1 - t) * (1 - t) + 3 * b * t * t * (1 - t) + t * t * t;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0;
    let hi = 1;
    let t = x;
    for (let i = 0; i < 24; i++) {
      const v = at(t, x1, x2);
      if (Math.abs(v - x) < 1e-5) break;
      if (v < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return at(t, y1, y2);
  };
}
/** The one editorial ease-out (--bz-ease-out), sampled for stepped keyframes. */
const EASE_OUT = bezier(0.23, 1, 0.32, 1);

/** [offset, x, y, opacity?]: one held position of a pixel-true move. */
type PixelStep = [number, number, number, number?];

/** Held positions in whole CSS pixels (step-end between them), so pixel art is never resampled mid-move. */
function steppedFrames(points: PixelStep[]): Keyframe[] {
  return points.map(([offset, x, y, o]) => {
    const k: Keyframe = { offset: Math.min(1, Math.max(0, offset)), easing: "step-end", transform: `translate(${Math.round(x)}px, ${Math.round(y)}px)` };
    if (o != null) k.opacity = o;
    return k;
  });
}

/** Horizontal runs merged into one path per colour key, in art pixels. */
const PATH_CACHE = new Map<readonly string[], Record<string, string>>();
function pixelPaths(map: readonly string[]): Record<string, string> {
  const hit = PATH_CACHE.get(map);
  if (hit) return hit;
  const paths: Record<string, string> = {};
  map.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      if (c === ".") {
        x++;
        continue;
      }
      let x2 = x;
      while (x2 < row.length && row[x2] === c) x2++;
      paths[c] = `${paths[c] ?? ""}M${x} ${y}h${x2 - x}v1h${x - x2}z`;
      x = x2;
    }
  });
  PATH_CACHE.set(map, paths);
  return paths;
}

/** A crisp pixel svg as markup, one classed path per key, for art built outside React. */
function pixelMarkup(map: readonly string[], prefix: string, roles: Record<string, string>, scale: number, className = "") {
  const w = map[0].length;
  const h = map.length;
  const p = pixelPaths(map);
  let out = `<svg${className ? ` class="${className}"` : ""} viewBox="0 0 ${w} ${h}" width="${w * scale}" height="${h * scale}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">`;
  for (const k in p) out += `<path class="${prefix}${roles[k] ?? k}" d="${p[k]}"/>`;
  return `${out}</svg>`;
}

/** A crisp pixel svg, one classed path per key (CSS maps each class to a colour). */
function PixelSvg({ map, prefix, roles, scale, className }: { map: readonly string[]; prefix: string; roles: Record<string, string>; scale: number; className?: string }) {
  const p = pixelPaths(map);
  const w = map[0].length;
  const h = map.length;
  return (
    <svg className={className} viewBox={`0 0 ${w} ${h}`} width={w * scale} height={h * scale} shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      {Object.keys(p).map((k) => (
        <path key={k} className={`${prefix}${roles[k] ?? k}`} d={p[k]} />
      ))}
    </svg>
  );
}

type GlyphName = "done" | "skipped" | "retry" | "finish" | "stop" | "cross" | "pause" | "cursor" | "pointer" | "clock";

const GLYPHS: Record<GlyphName, readonly string[]> = {
  done: [".......", "......#", ".....##", "#...##.", "##.##..", ".###...", "..#...."],
  skipped: [".......", ".......", ".......", "#######", "#######", ".......", "......."],
  retry: ["..###.#", ".#...##", "#...###", "#......", "#.....#", ".#...#.", "..###.."],
  finish: ["...#...", "...#...", "#######", ".#####.", "..###..", ".##.##.", "##...##"],
  stop: [".......", ".#####.", ".#####.", ".#####.", ".#####.", ".#####.", "......."],
  cross: ["##...##", "###.###", ".#####.", "..###..", ".#####.", "###.###", "##...##"],
  pause: [".......", ".##.##.", ".##.##.", ".##.##.", ".##.##.", ".##.##.", "......."],
  cursor: ["#...", "##..", "###.", "####", "###.", "##..", "#..."],
  pointer: ["...#", "..##", ".###", "####", ".###", "..##", "...#"],
  clock: ["..###..", ".#...#.", "#..#..#", "#..##.#", "#.....#", ".#...#.", "..###.."],
};
const GLYPH_ROLES: Record<string, string> = { "#": "ink" };

/* ---------------- end shared: timing constants and helpers ---------------- */

/* ---------------- shared: character ---------------- */

/* Brick Wall's copy carries only the frames this game draws (idle, swing,
   hurt, sit and celebrate) and no accessory layer. The run, jump, bonk and
   fly frames and the jetpack and glider colours live in the other games. */

export type LoaderCharacterName = "ember" | "tide" | "moss" | "plum";

export type LoaderCharacter = {
  /** Which head to draw: "puffs", "ponytail", "short" or "wrap" (a head scarf coloured by hair and hairShade). */
  hairStyle: "puffs" | "ponytail" | "short" | "wrap";
  /** Skin colour. */
  skin: string;
  /** Skin shade: the far cheek, the jaw and the ear. */
  skinShade: string;
  /** Hair, or the wrap fabric. */
  hair: string;
  /** Hair shade, darker than hair. */
  hairShade: string;
  /** Tunic body. */
  outfit: string;
  /** Tunic shade, on the right of the body. */
  outfitShade: string;
  /** Tunic highlight: the left column and the near sleeve. */
  outfitLight: string;
  /** Scarf, belt buckle, hair tie and wrap band. */
  accent: string;
  /** Trousers. */
  pants: string;
  /** Trousers shade. */
  pantsShade: string;
  /** Boots and the belt leather. */
  boots: string;
  /** Boot shade. */
  bootsShade: string;
  /** Eye white. Default #ffffff. */
  eyeWhite?: string;
  /** Pupils and mouth. Default #1b1630. */
  eye?: string;
};

/** Four bright adventurers: four skin tones, four hair styles, four outfit hues. */
export const LOADER_CHARACTERS: Record<LoaderCharacterName, LoaderCharacter> = {
  ember: { hairStyle: "puffs", skin: "#8d5524", skinShade: "#6b3d18", hair: "#4a3128", hairShade: "#2a1b15", outfit: "#ff5a36", outfitShade: "#c43d20", outfitLight: "#ff9a7a", accent: "#ffd23f", pants: "#3f64b5", pantsShade: "#2b4a8a", boots: "#5b3a1e", bootsShade: "#3d2614" },
  tide: { hairStyle: "ponytail", skin: "#f3c7a5", skinShade: "#d9a07c", hair: "#e0702c", hairShade: "#a84e1a", outfit: "#3d8bfd", outfitShade: "#2563c9", outfitLight: "#8cbcff", accent: "#ff6fa5", pants: "#e6d3a3", pantsShade: "#c2a970", boots: "#7a4a28", bootsShade: "#55331b" },
  moss: { hairStyle: "short", skin: "#c68e5f", skinShade: "#a06c42", hair: "#4f4760", hairShade: "#2e2838", outfit: "#3fbf5a", outfitShade: "#2a8a3f", outfitLight: "#8fe39f", accent: "#ff9f1c", pants: "#8b5e34", pantsShade: "#6b4526", boots: "#2f2a3a", bootsShade: "#1f1b27" },
  plum: { hairStyle: "wrap", skin: "#a8693f", skinShade: "#82502c", hair: "#e0457b", hairShade: "#b02f5e", outfit: "#a06cf0", outfitShade: "#7a4bc4", outfitLight: "#c9a8ff", accent: "#2ec4b6", pants: "#4a5a8c", pantsShade: "#36426a", boots: "#8a5a2b", bootsShade: "#62401e" },
};

/* Art: 16 x 24 art pixels, facing right, feet on row 23, a 1px outline all
   round, light from the top left. Keys: . clear, o outline, h hair, H hair
   shade, s skin, S skin shade, w eye white, e pupil, m mouth, c outfit,
   C outfit shade, l outfit light, a accent, p trousers, P trousers shade,
   b boots, B boot shade. A 16 x 11 head per hair style takes a face patch and
   sits at a per-frame dx and dy; the body for the pose is anchored to the
   bottom row and drawn over it. */

const CHARACTER_HEADS: Record<LoaderCharacter["hairStyle"], readonly string[]> = {
  short: [
    "....oo.oo.oo....",
    "...ohhohhohho...",
    "..ohhhhhhhhhhoo.",
    "..ohhhhhhhhhHHo.",
    "..ohhhhhhhHhHHo.",
    "..ohhhhhHHsHsso.",
    "..ohhSsssssssso.",
    "..ohHssssssssso.",
    "..oHHsssssSssSo.",
    "...oHsssssssSo..",
    "....ooooooooo...",
  ],
  ponytail: [
    ".....oooooo.....",
    "...oohhhhhhhoo..",
    ".ooahhhhhhhhhho.",
    "ohHohhhhhhhhhHo.",
    "ohHohhhhhhhhHHo.",
    "ohHohhhhhHshsso.",
    "oHHohSsssssssso.",
    ".oHoHssssssssso.",
    ".oHoHsssssSssSo.",
    "..ooHsssssssSo..",
    "....ooooooooo...",
  ],
  puffs: [
    ".ooo...ooooo....",
    "ohhho.ohhhhho...",
    "ohhHhohhhhhHo...",
    ".oHHhhhhhHHhhho.",
    "..ohhhhhhhhhhHo.",
    "..ohhhhssssssso.",
    "..ohhSsssssssso.",
    "..ohHssssssssso.",
    "..oHHsssssSssSo.",
    "...oHsssssssSo..",
    "....ooooooooo...",
  ],
  wrap: [
    ".......oooo.oo..",
    ".....oohhhhoHho.",
    "...oohhhhhHHHo..",
    "..ohhhhhhhHhhho.",
    "..ohhhhhhhhhhHo.",
    "..oaaaaaaaaaaao.",
    "..ohhSsssssssso.",
    "..ohHssssssssso.",
    "..oHHsssssSssSo.",
    "...oHsssssssSo..",
    "....ooooooooo...",
  ],
};

type CharacterEyes = "open" | "blink" | "squint" | "happy";

/* Face patches over cols 7 to 13 and rows 6 to 9 of a head; "_" keeps the head pixel. */
const CHARACTER_FACES: Record<CharacterEyes, readonly string[]> = {
  open: ["_we_we_", "_we_we_", "_______", "____m__"],
  blink: ["_______", "_ee_ee_", "_______", "____m__"],
  squint: ["_e___e_", "__e_e__", "_e___e_", "___mm__"],
  happy: ["_e___e_", "e_e_e_e", "_______", "___mm__"],
};

type CharacterPose = "idle" | "swing1" | "swing2" | "hurt" | "sit" | "celebrate1" | "celebrate2";

const CHARACTER_BODIES: Record<CharacterPose, readonly string[]> = {
  idle: [
    "...oaaaaaaaao...",
    "...oClcccColco..",
    "...oClcccColco..",
    "...oClcccColco..",
    "...oSbbabbosso..",
    "...oolcccCCoo...",
    "....oppppPPo....",
    "....opPoppPo....",
    "....opPoppPo....",
    "....opPoppPo....",
    "....obBobbBo....",
    "....obBobbbBo...",
    "....ooooooooo...",
  ],
  swing1: [
    "..oaaaaaaaao.oo.",
    "..oClcccColcosso",
    "..oClcccColcolco",
    "..oClcccColccco.",
    "..oSbbabbooooo..",
    "...olcccCCo.....",
    "...oppppPPPo....",
    "...opPPoopPPo...",
    "..opPo...opPo...",
    "..opPo...opPo...",
    "..obBo...obbBo..",
    "..obbBo..obbbBo.",
    "..ooooo..oooooo.",
  ],
  swing2: [
    "....oaaaaaaaao..",
    "....oClcccCoooo.",
    "....oClcccClcsso",
    "....oClcccCoooo.",
    "....oSbbabbo....",
    ".....olcccCo....",
    ".....opppPPPo...",
    "....oPPo.oppPo..",
    "...oPPo...oppPo.",
    "..oPPo....oppPo.",
    ".oBBo.....obbBo.",
    "oBBBo.....obbbBo",
    "ooooo.....oooooo",
  ],
  hurt: [
    ".............oo.",
    "............osso",
    "..oaaaaaaaaolco.",
    "..oClcccCClco...",
    ".ooClcccCCo.....",
    "oSSoClccCCo.....",
    "oSoobbabbo......",
    ".o.olcccCo......",
    "...oppppPPo.....",
    "...opPoppPPo....",
    "...opPo.oppPo...",
    "...opPo..obbBo..",
    "...obBo..obbbBo.",
    "...obbBo..ooooo.",
    "...ooooo........",
  ],
  sit: [
    "..oaaaaaaaao....",
    ".oCClcccColco...",
    "oSoClcccColcooo.",
    "oSobbabbossoobBo",
    "oSoppppppppppbBo",
    "ooPPPPPPPPPPPbBo",
    ".ooooooooooooooo",
  ],
  celebrate1: [
    ".............oo.",
    "............osso",
    "............oSso",
    ".............lco",
    ".............lco",
    ".............lco",
    ".............lco",
    ".............lco",
    "...oaaaaaaaaolco",
    "...oClcccCCCClco",
    "...oClcccCCCCco.",
    "...oClcccCCCCo..",
    "...oSbbabbbbo...",
    "....olcccCCo....",
    "....oppppPPo....",
    "....opPoppPo....",
    "....opPoppPo....",
    "....opPoppPo....",
    "....obBobbBo....",
    "....obBobbbBo...",
    "....ooooooooo...",
  ],
  celebrate2: [
    ".............oo.",
    "............osso",
    "............oSso",
    ".............lco",
    ".............lco",
    "...oaaaaaaaaolco",
    "...oClcccCCCClco",
    "...oClcccCCCCco.",
    "...oClcccCCCCo..",
    "...oSbbabbbbo...",
    "....olcccCCo....",
    "....oppppPPo....",
    "...opPPoopPPo...",
    "...opPo..opPo...",
    "...obBo..obBo...",
    "...obbBo.obbbBo.",
    "...ooooo.oooooo.",
  ],
};

const CHARACTER_FRAMES = ["idle1", "idle2", "swing1", "swing2", "hurt", "sit", "celebrate1", "celebrate2"] as const;
type CharacterFrame = (typeof CHARACTER_FRAMES)[number];

const CHARACTER_POSES: Record<CharacterFrame, { body: CharacterPose; eyes: CharacterEyes; dx: number; dy: number }> = {
  idle1: { body: "idle", eyes: "open", dx: 0, dy: 0 },
  idle2: { body: "idle", eyes: "open", dx: 0, dy: 1 },
  swing1: { body: "swing1", eyes: "open", dx: -1, dy: 0 },
  swing2: { body: "swing2", eyes: "open", dx: 1, dy: 0 },
  hurt: { body: "hurt", eyes: "squint", dx: -1, dy: 1 },
  sit: { body: "sit", eyes: "blink", dx: -1, dy: 6 },
  celebrate1: { body: "celebrate1", eyes: "happy", dx: -1, dy: 0 },
  celebrate2: { body: "celebrate2", eyes: "happy", dx: -1, dy: 1 },
};

const CHARACTER_W = 16;
const CHARACTER_H = 24;

/** One frame as a text map, 16 x 24. */
function composeCharacterFrame(hairStyle: LoaderCharacter["hairStyle"], name: CharacterFrame): string[] {
  const f = CHARACTER_POSES[name];
  const grid: string[][] = Array.from({ length: CHARACTER_H }, () => Array<string>(CHARACTER_W).fill("."));
  const put = (rows: readonly string[], ox: number, oy: number) => {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const c = row[x];
        const gx = ox + x;
        const gy = oy + y;
        if (c !== "." && gx >= 0 && gx < CHARACTER_W && gy >= 0 && gy < CHARACTER_H) grid[gy][gx] = c;
      }
    });
  };
  const head = CHARACTER_HEADS[hairStyle].map((r) => r.split(""));
  CHARACTER_FACES[f.eyes].forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] !== "_") head[6 + y][7 + x] = row[x];
  });
  put(head.map((r) => r.join("")), f.dx, f.dy);
  const body = CHARACTER_BODIES[f.body];
  put(body, 0, CHARACTER_H - body.length);
  /* A pixel clipped at the box edge would lose its outline, so the edge columns become outline. */
  for (let y = 0; y < CHARACTER_H; y++) {
    for (const x of [0, CHARACTER_W - 1]) if (grid[y][x] !== ".") grid[y][x] = "o";
  }
  return grid.map((r) => r.join(""));
}

/** Colour key to the role used in class names and custom properties (--chr-hair, --chr-outfit-light). */
const CHARACTER_ROLES: Record<string, string> = {
  o: "outline", h: "hair", H: "hair-shade", s: "skin", S: "skin-shade", w: "eye-white", e: "eye", m: "mouth",
  c: "outfit", C: "outfit-shade", l: "outfit-light", a: "accent", p: "pants", P: "pants-shade", b: "boots", B: "boots-shade",
};

/** Character colours as custom properties for the root. They do not change with the theme. */
function characterVars(ch: LoaderCharacter): Record<string, string> {
  return {
    "--chr-hair": ch.hair, "--chr-hair-shade": ch.hairShade, "--chr-skin": ch.skin, "--chr-skin-shade": ch.skinShade,
    "--chr-eye-white": ch.eyeWhite ?? "#ffffff", "--chr-eye": ch.eye ?? "#1b1630", "--chr-mouth": ch.eye ?? "#1b1630",
    "--chr-outfit": ch.outfit, "--chr-outfit-shade": ch.outfitShade, "--chr-outfit-light": ch.outfitLight, "--chr-accent": ch.accent,
    "--chr-pants": ch.pants, "--chr-pants-shade": ch.pantsShade, "--chr-boots": ch.boots, "--chr-boots-shade": ch.bootsShade,
  };
}

/* Every frame's paths, memoised per hair style. */
const CHARACTER_ART = new Map<string, [CharacterFrame, [string, string][]][]>();
function characterArt(hairStyle: LoaderCharacter["hairStyle"]) {
  let art = CHARACTER_ART.get(hairStyle);
  if (!art) {
    art = CHARACTER_FRAMES.map((frame) => {
      const map = composeCharacterFrame(hairStyle, frame);
      const paths = pixelPaths(map);
      return [frame, Object.keys(paths).map((k) => [CHARACTER_ROLES[k] ?? k, paths[k]] as [string, string])];
    });
    CHARACTER_ART.set(hairStyle, art);
  }
  return art;
}

/**
 * Every frame of the character in one svg. CSS shows one through the parent's
 * data-frame (or two through data-loop), so changing pose is an attribute change.
 */
function CharacterSprite({ hairStyle, prefix }: { hairStyle: LoaderCharacter["hairStyle"]; prefix: string }) {
  const art = useMemo(() => characterArt(hairStyle), [hairStyle]);
  return (
    <svg className={`${prefix}sprite`} viewBox={`0 0 ${CHARACTER_W} ${CHARACTER_H}`} shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      {art.map(([frame, paths]) => (
        <g key={frame} data-f={frame}>
          {paths.map(([role, d]) => (
            <path key={role} className={`${prefix}c-${role}`} d={d} />
          ))}
        </g>
      ))}
    </svg>
  );
}

/* ---------------- end shared: character ---------------- */

/* ---------------- shared: engine ---------------- */

type LoaderPhase = "idle" | "run" | "error" | "complete" | "stopped";
type LoaderLineKind = "done" | "skipped" | "retry" | "finish" | "stop";
type LoaderLine = { key: number; kind: LoaderLineKind; text: string };
type LoaderBeat = { i: number; kind: "done" | "skipped"; at: number; said?: boolean };
type LoaderTile = { label: string; value: number | string; format: (v: number) => string; sub: string };
type LoaderFocus = "menu" | "log" | "continue";

/** Everything the chassis shows. The engine owns it and React renders it. */
type LoaderView = {
  phase: LoaderPhase;
  front: number;
  gone: boolean[];
  barP: number | null;
  barDetail: string | null;
  lines: LoaderLine[];
  errorAt: number;
  alert: string;
  details: string[];
  meta: string | null;
  tiles: LoaderTile[] | null;
  resultsOpen: boolean;
  completion: string;
};

type LoaderConfig = {
  labels: LoaderLabels;
  stats?: LoaderStat[];
  completeText?: string;
  onCancel?: () => void;
  onComplete?: () => void;
  onAnnounce?: (text: string, politeness: "polite" | "assertive") => void;
};

/** How the engine talks to React. */
type LoaderBridge = {
  config: () => LoaderConfig;
  render: (view: LoaderView) => void;
  focus: (target: LoaderFocus) => void;
  focusInside: () => boolean;
  focusInMenu: () => boolean;
  resetMenu: () => void;
};

/** What the engine hands its arena: the run as the eye should see it, and the timing helpers. */
type LoaderCore = {
  host: LoaderStep[];
  gone: boolean[];
  front: number;
  phase: LoaderPhase;
  barP: number | null;
  motionAllowed: boolean;
  running: boolean;
  motionOn: () => boolean;
  later: (fn: () => void, ms: number) => number;
  clear: (id: number) => 0;
  anim: (el: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) => Animation | null;
};

/** The game. It draws the run and never changes it. */
type LoaderArena = {
  /** Builds the arena for core.host, with settled steps already resolved. */
  rebuild: () => void;
  /** Geometry for the current size. */
  layout: () => void;
  /** The front shows core.barP; fx plays the breaking pieces. */
  progress: (fx: boolean) => void;
  /** Per-step looks that follow the host, such as size unknown. */
  sync: () => void;
  /** One progress hit. Returns the ms until contact, when the bar and the arena take the new progress. */
  hit: () => number;
  /** The finishing blow of a done beat. Returns the ms until it lands. */
  strike: (beat: LoaderBeat) => number;
  /** A beat lands. Returns the ms to hold before the front moves on. */
  resolve: (beats: LoaderBeat[], showy: boolean) => number;
  /** Resolves steps with no beat (hidden tab, error, cancel). */
  flush: (beats: LoaderBeat[]) => void;
  /** The front moved (or stayed, after a flush). */
  advance: (changed: boolean) => void;
  /** One mark per resolved step. */
  tally: (fade: boolean) => void;
  error: () => void;
  retry: () => void;
  stop: () => void;
  finale: (showy: boolean) => void;
  /** The character's pose for the phase. */
  pose: () => void;
  /** Motion was allowed or stopped. */
  motion: () => void;
  destroy: () => void;
};

type LoaderEngine = {
  update: (steps: LoaderStep[]) => void;
  setMotion: (allowed: boolean, running: boolean) => void;
  layout: () => void;
  cancel: () => void;
  destroy: () => void;
};

const firstLive = (gone: boolean[]) => {
  let f = 0;
  while (f < gone.length && gone[f]) f++;
  return f;
};

function initialView(steps: LoaderStep[]): LoaderView {
  const gone = steps.map(settled);
  const front = firstLive(gone);
  const s = steps[front];
  const phase: LoaderPhase = steps.some((x) => x.status !== "pending") ? (steps.every(settled) ? "complete" : "run") : "idle";
  return {
    phase, front, gone,
    barP: s ? (s.status === "done" ? 1 : s.progress ?? null) : null,
    barDetail: s?.detail ?? null,
    lines: [], errorAt: -1, alert: "", details: [], meta: null, tiles: null, resultsOpen: false, completion: "",
  };
}

function buildTiles(host: LoaderStep[], stats: LoaderStat[] = []): LoaderTile[] {
  const n = host.length;
  const done = host.filter((s) => s.status === "done");
  const skipped = host.filter((s) => s.status === "skipped").length;
  const total = done.reduce((a, s) => a + (s.durationMs ?? 0), 0);
  let longest: LoaderStep | null = null;
  for (const s of done) if (s.durationMs != null && (!longest || s.durationMs > (longest.durationMs ?? 0))) longest = s;
  const retried = done.filter((s) => (s.attempt ?? 1) > 1);
  const tiles: LoaderTile[] = [
    { label: "Steps", value: done.length + skipped, format: (v) => `${Math.round(v)} of ${n}`, sub: skipped ? `${skipped} skipped` : "none skipped" },
  ];
  if (total > 0) tiles.push({ label: "Time", value: total, format: fmtDur, sub: longest ? `Longest: ${longest.label}, ${fmtDur(longest.durationMs ?? 0)}` : "" });
  for (const st of stats) tiles.push({ label: st.label, value: st.value, format: fmtNum, sub: st.sub ?? "" });
  if (retried.length) {
    const h = retried.reduce((a, s) => a + (s.attempt ?? 1) - 1, 0);
    tiles.push({ label: h === 1 ? "Hiccup" : "Hiccups", value: h, format: (v) => `${Math.round(v)} recovered`, sub: `at ${listJoin(retried.map((s) => s.label))}` });
  }
  return tiles;
}

const tileText = (t: LoaderTile) => (typeof t.value === "number" ? t.format(t.value) : t.value);

function createLoaderEngine(bridge: LoaderBridge, makeArena: (core: LoaderCore) => LoaderArena): LoaderEngine {
  const timers = new Set<number>();
  const anims = new Set<Animation>();
  const core: LoaderCore = {
    host: [],
    gone: [],
    front: 0,
    phase: "idle",
    barP: null,
    motionAllowed: true,
    running: true,
    motionOn: () => core.motionAllowed && core.running,
    later: (fn, ms) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, Math.max(0, ms));
      timers.add(id);
      return id;
    },
    clear: (id) => {
      if (id) {
        window.clearTimeout(id);
        timers.delete(id);
      }
      return 0;
    },
    anim: (el, frames, opts) => {
      if (typeof (el as HTMLElement).animate !== "function") return null;
      const a = el.animate(frames, opts);
      anims.add(a);
      const done = () => anims.delete(a);
      a.finished.then(done, done);
      return a;
    },
  };
  const arena = makeArena(core);

  let frontSince = -1e9;
  let beatUntil = 0;
  let beatBusy = false;
  let inflight: { beats: LoaderBeat[]; landed: boolean; timer: number } | null = null;
  let backlog: LoaderBeat[] = [];
  let barDetail: string | null = null;
  let lastSeenP: number | null | undefined = null;
  let lastHit = -1e9;
  let hitT = 0;
  let pumpT = 0;
  let metaT = 0;
  let lines: LoaderLine[] = [];
  let lineKey = 0;
  let errorAt = -1;
  let alert = "";
  let details: string[] = [];
  let meta: string | null = null;
  let tiles: LoaderTile[] | null = null;
  let resultsOpen = false;
  let completion = "";
  let finaleStarted = false;
  let finalPrefix = "";
  let awayFrom: number | null = null;
  let alive = true;

  const labels = () => bridge.config().labels;
  const settledCount = () => core.host.filter(settled).length;

  function emit() {
    if (!alive) return;
    bridge.render({
      phase: core.phase, front: core.front, gone: core.gone.slice(), barP: core.barP, barDetail,
      lines, errorAt, alert, details, meta, tiles, resultsOpen, completion,
    });
  }

  function announce(text: string, politeness: "polite" | "assertive") {
    bridge.config().onAnnounce?.(text, politeness);
  }

  function appendLine(kind: LoaderLineKind, text: string) {
    lines = [...lines.slice(-24), { key: ++lineKey, kind, text }];
    emit();
    announce(text, "polite");
  }

  /* A line that lands as the box swaps back from the menu waits a frame, so
     the log is visible (and in the accessibility tree) before it changes. */
  function appendSoon(kind: LoaderLineKind, text: string, then?: () => void) {
    core.later(() => {
      appendLine(kind, text);
      then?.();
    }, FAST / 2);
  }

  function syncBar() {
    const s = core.host[core.front];
    core.barP = s ? (s.status === "done" ? 1 : s.progress ?? null) : null;
    barDetail = s ? s.detail || null : null;
    lastSeenP = s ? s.progress : null;
  }

  function clearMeta() {
    metaT = core.clear(metaT);
    meta = null;
  }

  /* A short visual note on the footer line (the away recap). Never announced. */
  function flashMeta(text: string, ms: number) {
    if (core.phase !== "run" && core.phase !== "complete") return;
    meta = text;
    metaT = core.clear(metaT);
    metaT = core.later(() => {
      meta = null;
      emit();
    }, ms);
    emit();
  }

  /* ------------------------------------------------------------ build */

  function rebuild(steps: LoaderStep[]) {
    timers.forEach((id) => window.clearTimeout(id));
    timers.clear();
    anims.forEach((a) => a.cancel());
    anims.clear();
    hitT = pumpT = metaT = 0;
    core.host = steps;
    backlog = [];
    inflight = null;
    beatBusy = false;
    beatUntil = 0;
    finaleStarted = false;
    finalPrefix = "";
    lastHit = -1e9;
    lines = [];
    errorAt = -1;
    alert = "";
    details = [];
    meta = null;
    tiles = null;
    resultsOpen = false;
    completion = "";
    core.gone = steps.map(settled);
    core.phase = steps.some((s) => s.status !== "pending") ? (steps.every(settled) ? "complete" : "run") : "idle";
    core.front = firstLive(core.gone);
    frontSince = -1e9;
    syncBar();
    bridge.resetMenu();
    arena.rebuild();
    arena.tally(false);
    arena.pose();
    emit();
    const failed = steps.findIndex((s) => s.status === "error");
    if (failed >= 0 && core.phase === "run") showError(failed);
    else if (core.phase === "complete") finale(true);
  }

  function needsRebuild(prev: LoaderStep[], next: LoaderStep[]) {
    if (prev.length !== next.length) return true;
    for (let i = 0; i < next.length; i++) if (prev[i].id !== next[i].id) return true;
    /* A done or skipped step that goes back to work, or a stopped run whose host starts a step, is a new run. */
    if (next.some((s, i) => settled(prev[i]) && !settled(s))) return true;
    if (core.phase === "stopped" && next.some((s, i) => s.status === "active" && prev[i].status !== "active")) return true;
    const allPending = next.every((s) => s.status === "pending");
    return allPending && (core.phase !== "idle" || prev.some((s) => s.status !== "pending"));
  }

  function update(steps: LoaderStep[]) {
    const next = steps.map((s) => ({ ...s }));
    const prev = core.host;
    if (needsRebuild(prev, next)) {
      rebuild(next);
      return;
    }
    core.host = next;
    if (core.phase === "stopped" || core.phase === "complete") {
      emit();
      return;
    }
    if (core.phase === "idle" && next.some((s) => s.status !== "pending")) core.phase = "run";
    const t = now();
    let errAt = -1;
    let retryAt = -1;
    let leftError = false;
    next.forEach((s, i) => {
      const was = prev[i] ? prev[i].status : "pending";
      if (was === s.status) return;
      if (was === "error") leftError = true;
      if (s.status === "done" || s.status === "skipped") backlog.push({ i, kind: s.status, at: t });
      else if (s.status === "error") errAt = i;
      else if (s.status === "active" && was === "error") retryAt = i;
    });
    if (retryAt >= 0) retryStarted(retryAt);
    else if (leftError && core.phase === "error" && clearError()) bridge.focus("log");
    if (errAt >= 0) {
      showError(errAt);
      return;
    }
    const s = next[core.front];
    if (core.phase === "run" && s && s.status === "active" && s.progress != null && s.progress !== lastSeenP) {
      if (core.motionOn()) {
        lastSeenP = s.progress;
        requestHit();
      } else {
        syncBar();
        arena.progress(false);
      }
    }
    arena.sync();
    arena.pose();
    emit();
    pump();
  }

  /* ------------------------------------------------------------- hits */

  function requestHit() {
    if (hitT) return;
    hitT = core.later(doHit, Math.max(lastHit + HIT_GAP - now(), frontSince + BASE - now(), 0));
  }

  /* One progress hit: the arena plays it, and at contact the bar and the arena
     take the newest progress together (increments that arrived since merge). */
  function doHit() {
    hitT = 0;
    const s = core.host[core.front];
    if (core.phase !== "run" || !s || s.status !== "active" || s.progress == null) return;
    lastHit = now();
    if (!core.motionOn()) {
      syncBar();
      arena.progress(false);
      emit();
      return;
    }
    const id = s.id;
    const contact = arena.hit();
    core.later(() => {
      const cur = core.host[core.front];
      if (!cur || cur.id !== id || core.phase !== "run") return;
      syncBar();
      arena.progress(core.motionOn());
      emit();
    }, contact);
  }

  /* -------------------------------------------------------- narration */

  function doneSentence(s: LoaderStep) {
    const base = s.doneText || `${s.label}: done`;
    const dur = s.durationMs != null ? ` in ${fmtDur(s.durationMs)}` : "";
    const tries = (s.attempt ?? 1) > 1 ? `, on attempt ${s.attempt}` : "";
    return `${base}${dur}${tries}.`;
  }
  const skipSentence = (s: LoaderStep) => `Skipped: ${s.label}${s.detail ? ` (${lowerFirst(s.detail)})` : ""}.`;

  /* The next step still to come after these, never one that already finished. */
  function nextAfter(list: LoaderBeat[]) {
    let i = Math.max(...list.map((e) => e.i)) + 1;
    while (i < core.host.length && settled(core.host[i])) i++;
    return i < core.host.length ? i : -1;
  }

  /* One sentence per group of milestones, written to be heard: two quick
     finishes share a sentence, a burst is summed up, and the line ends with
     what comes next. */
  function sentence(input: LoaderBeat[]) {
    const list = input.slice().sort((a, b) => a.i - b.i);
    let text: string;
    if (list.length >= BURST_MIN) {
      const done = list.filter((e) => e.kind === "done").map((e) => core.host[e.i]);
      const skipped = list.filter((e) => e.kind === "skipped").map((e) => core.host[e.i].label);
      text = done.length === 1 ? doneSentence(done[0]) : done.length ? `Finished ${done.length} steps at once: ${listJoin(done.map((s) => s.label))}.` : "";
      if (skipped.length) text += `${text ? " " : ""}Skipped: ${listJoin(skipped)}.`;
    } else {
      const parts = list.map((e) => (e.kind === "done" ? doneSentence(core.host[e.i]) : skipSentence(core.host[e.i])));
      text = parts.length === 2 && list[0].kind === "done" && list[1].kind === "done"
        ? `${parts[0].replace(/\.$/, "")}, then ${lowerFirst(parts[1])}`
        : parts.join(" ");
    }
    const n = nextAfter(list);
    if (n >= 0) text += `${n === core.host.length - 1 ? " Last up: " : " On to "}${lowerFirst(core.host[n].label)}.`;
    return text;
  }

  /* Narrates every completion not told yet as one line. The last news before
     the finale is held and merged into the completion line, so the end of a
     run is one announcement. */
  function speak(list: LoaderBeat[]) {
    const fresh = list.filter((e) => !e.said);
    if (!fresh.length) return;
    fresh.forEach((e) => {
      e.said = true;
    });
    const text = sentence(fresh);
    if (core.host.every(settled) && backlog.every((b) => b.said)) {
      finalPrefix = finalPrefix ? `${finalPrefix} ${text}` : text;
      return;
    }
    appendLine(fresh.some((e) => e.kind === "done") ? "done" : "skipped", text);
  }

  /* -------------------------------------------------------- the beats */

  function pump() {
    pumpT = core.clear(pumpT);
    if (core.phase === "error" || core.phase === "stopped" || beatBusy) return;
    if (!backlog.length) {
      maybeFinale();
      return;
    }
    if (!core.running) {
      flushBacklog();
      return;
    }
    const t = now();
    if (t < beatUntil) {
      pumpT = core.later(pump, beatUntil - t);
      return;
    }
    const oldest = backlog[0].at;
    const newest = backlog[backlog.length - 1].at;
    if (t - newest < COLLECT && t - oldest < BASE) {
      pumpT = core.later(pump, COLLECT - (t - newest));
      return;
    }
    if (backlog.length >= BURST_MIN || t - oldest > 900) {
      runBeat(backlog.splice(0));
      return;
    }
    const dwellLeft = frontSince + DWELL - t;
    if (dwellLeft > 0) {
      pumpT = core.later(pump, dwellLeft);
      return;
    }
    /* A skip that arrived with this completion steps aside in the same beat. */
    let take = 1;
    while (take < backlog.length && backlog[take].kind === "skipped" && backlog[take].at - backlog[0].at <= COALESCE) take++;
    runBeat(backlog.splice(0, take));
  }

  function runBeat(beats: LoaderBeat[]) {
    const head = beats[0];
    const showy = core.motionOn();
    const delay = showy && head.kind === "done" ? arena.strike(head) : 0;
    beatUntil = now() + delay;
    beatBusy = true;
    const land = () => {
      const hold = arena.resolve(beats, showy);
      beats.forEach((b) => {
        core.gone[b.i] = true;
      });
      arena.tally(true);
      speak(beats.concat(backlog.filter((b) => b.at - head.at <= COALESCE)));
      const settle = () => {
        beatBusy = false;
        inflight = null;
        advanceFront();
        pump();
      };
      if (hold > 0) inflight = { beats, landed: true, timer: core.later(settle, hold) };
      else settle();
    };
    if (delay) inflight = { beats, landed: false, timer: core.later(land, delay) };
    else land();
  }

  function flushBacklog() {
    pumpT = core.clear(pumpT);
    let held = false;
    if (inflight) {
      core.clear(inflight.timer);
      if (inflight.landed) held = true;
      else backlog = inflight.beats.concat(backlog);
      inflight = null;
      beatBusy = false;
    }
    if (!backlog.length) {
      if (held) {
        advanceFront();
        maybeFinale();
      }
      return;
    }
    const beats = backlog.splice(0);
    arena.flush(beats);
    beats.forEach((b) => {
      core.gone[b.i] = true;
    });
    speak(beats);
    advanceFront();
    maybeFinale();
  }

  function advanceFront() {
    const f = firstLive(core.gone);
    const changed = f !== core.front;
    core.front = f;
    frontSince = now();
    syncBar();
    arena.tally(true);
    arena.advance(changed);
    arena.progress(false);
    arena.pose();
    emit();
  }

  /* ------------------------------------------------------- error path */

  function errorText(s: LoaderStep) {
    const msg = s.error || "Something went wrong.";
    if (msg.toLowerCase().includes(s.label.toLowerCase())) return msg;
    return `${s.label} failed: ${lowerFirst(msg)}${/[.!?]$/.test(msg) ? "" : "."}`;
  }

  function detailsText(i: number) {
    const s = core.host[i];
    const bits = [`Step ${i + 1} of ${core.host.length}`, `attempt ${s.attempt ?? 1}`];
    if (s.detail) bits.push(`reached ${s.detail}`);
    else if (s.progress != null) bits.push(`reached ${Math.floor(s.progress * 100)}%`);
    if (s.elapsedMs != null) bits.push(`ran ${fmtDur(s.elapsedMs)}`);
    return s.errorDetail ? [bits.join(" · "), s.errorDetail] : [bits.join(" · ")];
  }

  function showError(i: number) {
    const hadFocus = bridge.focusInside();
    flushBacklog();
    core.phase = "error";
    clearMeta();
    hitT = core.clear(hitT);
    const s = core.host[i];
    errorAt = i;
    alert = errorText(s);
    details = detailsText(i);
    if (s.progress != null) core.barP = s.progress;
    barDetail = s.detail || barDetail;
    bridge.resetMenu();
    arena.progress(false);
    arena.error();
    arena.pose();
    emit();
    announce(alert, "assertive");
    if (hadFocus) bridge.focus("menu");
  }

  /* Returns whether focus was in the menu, so the caller can move it on. */
  function clearError() {
    const hadFocus = bridge.focusInMenu();
    alert = "";
    details = [];
    errorAt = -1;
    core.phase = "run";
    beatUntil = Math.max(beatUntil, now() + FAST);
    arena.retry();
    return hadFocus;
  }

  function retryStarted(i: number) {
    const hadFocus = clearError();
    const s = core.host[i];
    syncBar();
    arena.progress(false);
    arena.pose();
    emit();
    appendSoon("retry", `Trying again: ${s.label}, attempt ${s.attempt ?? 2}.`);
    if (hadFocus) bridge.focus("log");
  }

  /* ----------------------------------------------------------- finale */

  function maybeFinale() {
    if (finaleStarted || core.phase === "error" || core.phase === "stopped" || !core.host.length) return;
    if (backlog.length || !core.host.every(settled) || core.gone.some((g) => !g)) return;
    finale(false);
  }

  function finale(silent: boolean) {
    if (finaleStarted) return;
    finaleStarted = true;
    const hadFocus = bridge.focusInside();
    const cfg = bridge.config();
    core.phase = "complete";
    clearMeta();
    const n = core.host.length;
    const skipped = core.host.filter((s) => s.status === "skipped").length;
    const showy = core.motionOn();
    completion = cfg.labels.complete(n, skipped) + (cfg.completeText ? ` ${cfg.completeText}` : "");
    tiles = buildTiles(core.host, cfg.stats);
    arena.finale(showy);
    arena.pose();
    if (silent) emit();
    else appendLine("finish", finalPrefix ? `${finalPrefix} ${completion}` : completion);
    finalPrefix = "";
    /* The completion line is heard first; the results take the box after it. */
    core.later(() => {
      resultsOpen = true;
      emit();
      if (hadFocus || bridge.focusInside()) bridge.focus("continue");
      bridge.config().onComplete?.();
    }, silent ? 0 : showy ? BASE + SLOW : BASE);
  }

  /* ------------------------------------------------------------ cancel */

  function cancel() {
    if (core.phase === "complete" || core.phase === "stopped") return;
    const hadFocus = bridge.focusInside();
    const kept = core.host.filter((s) => s.status === "done").length;
    flushBacklog();
    pumpT = core.clear(pumpT);
    hitT = core.clear(hitT);
    clearMeta();
    alert = "";
    details = [];
    errorAt = -1;
    core.phase = "stopped";
    arena.stop();
    arena.pose();
    emit();
    const text = finalPrefix ? `${finalPrefix} ${labels().stopped(kept)}` : labels().stopped(kept);
    finalPrefix = "";
    appendSoon("stop", text, () => bridge.config().onCancel?.());
    if (hadFocus) bridge.focus("log");
  }

  /* ------------------------------------------------------------ motion */

  function setMotion(allowed: boolean, running: boolean) {
    const was = core.running;
    core.motionAllowed = allowed;
    core.running = running;
    if (was && !running) awayFrom = settledCount();
    if (!core.motionOn()) {
      anims.forEach((a) => {
        try {
          a.finish();
        } catch {
          a.cancel();
        }
      });
      if (backlog.length && !running) flushBacklog();
    }
    if (hitT && !core.motionOn()) {
      hitT = core.clear(hitT);
      syncBar();
      arena.progress(false);
    }
    arena.motion();
    arena.pose();
    if (!was && running && awayFrom != null) {
      const d = settledCount() - awayFrom;
      awayFrom = null;
      if (d > 0) flashMeta(labels().away(d), BEAT * 2);
    }
    emit();
  }

  return {
    update,
    setMotion,
    layout: () => arena.layout(),
    cancel,
    destroy() {
      alive = false;
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
      anims.forEach((a) => a.cancel());
      anims.clear();
      arena.destroy();
    },
  };
}

const RM_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(RM_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
/** Live prefers-reduced-motion, false on the server. */
function useReducedMotionPreference() {
  return useSyncExternalStore(subscribeReducedMotion, () => window.matchMedia(RM_QUERY).matches, () => false);
}

const subscribeVisibility = (onChange: () => void) => {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
};
/** False while the browser tab is hidden. */
function usePageVisible() {
  return useSyncExternalStore(subscribeVisibility, () => document.visibilityState !== "hidden", () => true);
}

/** False while the element is scrolled out of view. */
function useOnscreen(ref: RefObject<Element>) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => setOn(entries[entries.length - 1].isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return on;
}

/* ---------------- end shared: engine ---------------- */

/* ---------------- arena: brick wall ---------------- */

/* One art unit for everything in the playfield: 2 CSS px per art pixel. */
const U = 2;
const SHOT_UP = 140;
const SHOT_DOWN = 200;
/** The bricks one contact breaks pop left to right within this. */
const CHAIN = 100;
/** Bricks in a row whose step has no small count. */
const FIXED = 12;
/* Playfield geometry, in CSS px. The height depends on the step count only. */
const FRAME = 4;
const SIDE = 10;
const TOP = 12;
const FRONT_H = 16;
const QUEUE_H = 12;
const PITCH = 16;
const AIR = 84;
/** The ball's flight room on phones, so the whole loader fits a phone screen unscaled. */
const AIR_NARROW = 28;
const HERO_PX = CHARACTER_H * U;
const PADDLE_H = 3 * U;
const BOTTOM = 14;
const PADDLE_W = 30 * U;
const BALL = 4 * U;
/** Where the character stands and the ball rests on the paddle. */
const HERO_X = 4 * U;
const BALL_X = 22 * U;
const fieldHeight = (n: number, air = AIR) => FRAME + TOP + Math.max(0, n - 1) * PITCH + FRONT_H + air + HERO_PX + PADDLE_H + BOTTOM;
const snap = (v: number) => Math.round(v / U) * U;

/* The paddle: a capsule with end caps and a glint, after Arkanoid's Vaus. */
const PADDLE_MAP = [
  ".aaaPPPPPPPPPPPPPPPPPPPPPPaaa.",
  "aaaaPffffffffffffffffffffPaaaa",
  ".aaaPPPPPPPPPPPPPPPPPPPPPPaaa.",
];
const BALL_MAP = [".bb.", "bbbb", "bbbb", ".bb."];
/* The tally: a heap of brick bits per finished row (gold flecks after a retry,
   steel for the last row) and an empty bracket for a skipped one. */
const RUBBLE = ["..oo..", ".orro.", "orrrro", "oooooo"];
const RUBBLE_GOLD = ["..oo..", ".ogro.", "orrgro", "oooooo"];
const RUBBLE_STEEL = ["..oo..", ".otso.", "osssdo", "oooooo"];
const SLOT_MAP = ["hh..hh", "h....h", "h....h", "hh..hh"];
const ARENA_ROLES: Record<string, string> = {
  o: "line", r: "row", g: "gold", s: "steel", t: "steel-light", d: "steel-shade", h: "hatch",
  a: "cap", P: "paddle", f: "glint", b: "ball",
};

type BrickRow = {
  el: HTMLDivElement;
  bricks: HTMLSpanElement[];
  n: number;
  broken: number;
  crackAt: number;
  crack: number;
  crackEl: Element | null;
  x: number[] | null;
  bw: number;
  y: number;
  h: number;
};

type BrickGeometry = { W: number; H: number; yf: number; padX: number; restX: number; restTop: number; tx: number; slot: number };

type BrickWallRefs = {
  root: RefObject<HTMLElement>;
  field: RefObject<HTMLDivElement>;
  wall: RefObject<HTMLDivElement>;
  tally: RefObject<HTMLDivElement>;
  rider: RefObject<HTMLDivElement>;
  hero: RefObject<HTMLDivElement>;
  ball: RefObject<HTMLDivElement>;
  fx: RefObject<HTMLDivElement>;
};

const bricksFor = (s: LoaderStep) => (s.count != null && s.count > 0 && s.count <= 16 ? Math.round(s.count) : FIXED);
/* Hatched only while the step is running at an unknown size; a waiting row is solid. */
const isHatch = (s: LoaderStep) => s.progress == null && (s.status === "active" || s.status === "error");

/* A crack in whole art pixels down the middle of a w x h brick: the top half
   at stage 1, all the way through with a branch at stage 2. */
function crackMarkup(w: number, h: number, stage: number) {
  const cx = Math.max(U, Math.round(w / 2 / U) * U - U);
  const zig = [0, 1, 1, 0, -1, -1, 0, 1];
  const cells = Math.floor(h / U);
  const upto = stage >= 2 ? cells - 1 : Math.ceil(cells / 2);
  const cell = (x: number, y: number) => `M${x} ${y}h${U}v${U}h-${U}z`;
  let d = "";
  for (let y = 1; y < upto; y++) d += cell(cx + zig[y % 8] * U, y * U);
  if (stage >= 2) d += cell(cx + 2 * U, 3 * U) + cell(cx + 3 * U, 4 * U);
  return `<svg class="bz-bwl-crack" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" shape-rendering="crispEdges" aria-hidden="true" focusable="false"><path class="bz-bwl-p-line" d="${d}"/></svg>`;
}

function createBrickWallArena(core: LoaderCore, refs: BrickWallRefs): LoaderArena {
  let rows: (BrickRow | null)[] = [];
  let marks: (HTMLDivElement | null)[] = [];
  let G: BrickGeometry | null = null;
  let ballLost = false;
  let ballAnim: Animation | null = null;
  let poseTimers: number[] = [];
  let transientUntil = 0;
  let celebrating = false;
  let celebrateT = 0;
  let dropDelay = 0;

  /* ------------------------------------------------------------- rows */

  function makeRow(i: number): BrickRow | null {
    const wall = refs.wall.current;
    if (!wall) return null;
    const s = core.host[i];
    const el = document.createElement("div");
    el.className = "bz-bwl-row";
    el.dataset.kind = i === core.host.length - 1 ? "steel" : "brick";
    el.dataset.hatch = isHatch(s) ? "true" : "false";
    el.style.setProperty("--bwl-row", i === core.host.length - 1 ? "var(--bwl-steel)" : `var(--bwl-row-${i % 8})`);
    const n = bricksFor(s);
    const bricks: HTMLSpanElement[] = [];
    for (let j = 0; j < n; j++) {
      const b = document.createElement("span");
      b.className = "bz-bwl-brick";
      el.appendChild(b);
      bricks.push(b);
    }
    wall.appendChild(el);
    return { el, bricks, n, broken: 0, crackAt: -1, crack: 0, crackEl: null, x: null, bw: 0, y: 0, h: 0 };
  }

  function frontP() {
    const s = core.host[core.front];
    if (!s) return 0;
    if (s.status === "done") return 1;
    if (s.status === "pending" || s.status === "skipped" || (s.status === "active" && s.progress == null)) return 0;
    return core.barP ?? 0;
  }

  /* The front row always shows floor(progress x bricks) broken bricks, left to
     right, and a crack on the next for the part in between. It reads the same
     number the bar fills to, so the wall never runs ahead of the bar. */
  function progress(fx: boolean) {
    const r = rows[core.front];
    const s = core.host[core.front];
    if (!r || !s || settled(s)) return;
    const hatch = isHatch(s);
    const p = hatch ? 0 : Math.max(0, Math.min(1, frontP()));
    const exact = p * r.n;
    const want = Math.min(r.n, Math.floor(exact + 1e-9));
    const part = hatch || want >= r.n ? 0 : exact - want;
    const crack = part >= 2 / 3 - 1e-9 ? 2 : part >= 1 / 3 - 1e-9 ? 1 : 0;
    const before = r.broken;
    const beforeCrack = r.crack;
    setBroken(r, want, fx);
    setCrack(r, want, crack);
    if (fx && want === before && crack === beforeCrack && want < r.n) flash(r.bricks[want]);
  }

  function setBroken(r: BrickRow, want: number, fx: boolean) {
    if (want === r.broken) return;
    if (want < r.broken) {
      /* Progress went back (a retry that starts over): the bricks return. */
      for (let j = want; j < r.broken; j++) {
        const b = r.bricks[j];
        b.dataset.b = "0";
        if (core.running) core.anim(b, [{ opacity: 0 }, { opacity: 1 }], { duration: FAST, easing: "steps(3, end)" });
      }
      r.broken = want;
      return;
    }
    /* Several bricks from one shot pop left to right inside CHAIN. */
    const k = want - r.broken;
    const gap = fx && k > 1 ? Math.min(25, CHAIN / (k - 1)) : 0;
    for (let j = r.broken; j < want; j++) {
      const b = r.bricks[j];
      const d = Math.round((j - r.broken) * gap);
      const go = () => {
        b.dataset.b = "1";
        if (fx) shards(r, j, false);
      };
      if (d) core.later(go, d);
      else go();
    }
    r.broken = want;
  }

  function setCrack(r: BrickRow, at: number, stage: number, force = false) {
    if (!force && r.crackAt === at && r.crack === stage) return;
    r.crackEl?.remove();
    r.crackEl = null;
    r.crackAt = at;
    r.crack = stage;
    if (!stage || at < 0 || at >= r.n || !r.bw) return;
    r.bricks[at].insertAdjacentHTML("beforeend", crackMarkup(r.bw, FRONT_H, stage));
    r.crackEl = r.bricks[at].lastElementChild;
  }

  /* One inverted frame on the brick a shot touched when it adds too little to
     break or crack anything: something real still arrived. */
  function flash(b: HTMLSpanElement) {
    b.dataset.flash = "true";
    core.later(() => {
      b.dataset.flash = "false";
    }, 70);
  }

  /* A broken brick throws three chips (four from steel) that hop and fall in
     whole art pixels, then fade. */
  function shards(r: BrickRow, j: number, big: boolean) {
    const fx = refs.fx.current;
    if (!G || !r.x || !fx || !core.motionOn()) return;
    const steel = r.el.dataset.kind === "steel";
    const cx = r.x[j] + snap(r.bw / 2);
    const cy = r.y + snap(r.h / 2);
    const spec: [number, number][] = [[-1, 1], [0, 2], [1, 1]];
    if (steel) spec.push([0.5, 1.5]);
    const spread = Math.min(snap(r.bw / 3), 4 * U);
    for (const [fxk, hopK] of spec) {
      const p = document.createElement("div");
      p.className = "bz-bwl-shard";
      p.dataset.kind = steel ? "steel" : "brick";
      p.style.setProperty("--bwl-row", r.el.style.getPropertyValue("--bwl-row"));
      p.style.left = `${cx + snap(fxk * spread) - U}px`;
      p.style.top = `${cy - U}px`;
      fx.appendChild(p);
      const dx = fxk * U * (big ? 4 : 3);
      const hop = hopK * U * (big ? 1.5 : 1);
      const fall = U * (big ? 9 : 6);
      const pts: PixelStep[] = [];
      for (let k = 0; k <= 5; k++) {
        const t = k / 5;
        pts.push([t, snap(dx * t), snap(-4 * hop * t * (1 - t) + fall * t * t), t < 0.4 ? 1 : Math.max(0, 1 - (t - 0.4) / 0.6)]);
      }
      const a = core.anim(p, steppedFrames(pts), { duration: big ? SLOW : BASE, fill: "forwards" });
      const remove = () => p.remove();
      if (a) a.finished.then(remove, remove);
      else remove();
    }
  }

  /* Done: every brick still standing breaks, left to right, in one chain. */
  function shatterRow(i: number, big: boolean) {
    const r = rows[i];
    if (!r) return;
    rows[i] = null;
    setCrack(r, -1, 0);
    r.el.dataset.error = "false";
    const left = r.bricks.map((b, j) => (b.dataset.b === "1" ? -1 : j)).filter((j) => j >= 0);
    const gap = left.length > 1 ? Math.min(25, CHAIN / (left.length - 1)) : 0;
    left.forEach((j, k) => {
      const d = Math.round(k * gap);
      const go = () => {
        r.bricks[j].dataset.b = "1";
        shards(r, j, big);
      };
      if (d) core.later(go, d);
      else go();
    });
    core.later(() => r.el.remove(), CHAIN + FAST);
  }

  /* Skipped: the row turns to dashed outlines and fades upward. No shards. */
  function stepAsideRow(i: number) {
    const r = rows[i];
    if (!r) return;
    rows[i] = null;
    setCrack(r, -1, 0);
    r.el.dataset.error = "false";
    r.el.dataset.ghost = "true";
    const lift = [0, 2, 4, 4];
    const fade = [1, 0.6, 0.25, 0];
    const a = core.anim(
      r.el,
      lift.map((dy, k) => ({ offset: k / 3, easing: "step-end", transform: `translateY(${r.y - dy}px)`, opacity: fade[k] })),
      { duration: BASE, fill: "forwards" },
    );
    const remove = () => r.el.remove();
    if (a) a.finished.then(remove, remove);
    else remove();
  }

  function fadeOutRow(i: number) {
    const r = rows[i];
    if (!r) return;
    rows[i] = null;
    if (!core.running) {
      r.el.remove();
      return;
    }
    const a = core.anim(r.el, [{ opacity: 1 }, { opacity: 0 }], { duration: FAST, easing: "linear", fill: "forwards" });
    const remove = () => r.el.remove();
    if (a) a.finished.then(remove, remove);
    else remove();
  }

  function sync() {
    core.host.forEach((s, i) => {
      const r = rows[i];
      if (!r || settled(s)) return;
      const h = isHatch(s) ? "true" : "false";
      if (r.el.dataset.hatch !== h) r.el.dataset.hatch = h;
    });
  }

  /* ------------------------------------------------------------ tally */

  function rubbleMap(i: number) {
    const s = core.host[i];
    if (s.status === "skipped") return SLOT_MAP;
    if (i === core.host.length - 1) return RUBBLE_STEEL;
    return (s.attempt ?? 1) > 1 ? RUBBLE_GOLD : RUBBLE;
  }

  function placeMark(m: HTMLDivElement, i: number) {
    if (G) m.style.left = `${G.tx + i * G.slot}px`;
  }

  function tally(fade: boolean) {
    const box = refs.tally.current;
    if (!box) return;
    core.host.forEach((_, i) => {
      let m = marks[i];
      if (!core.gone[i]) {
        if (m) {
          m.remove();
          marks[i] = null;
        }
        return;
      }
      const map = rubbleMap(i);
      const kind = map === SLOT_MAP ? "skipped" : map === RUBBLE_STEEL ? "steel" : map === RUBBLE_GOLD ? "gold" : "done";
      if (m && m.dataset.kind === kind) return;
      m?.remove();
      m = document.createElement("div");
      m.className = "bz-bwl-mark";
      m.dataset.kind = kind;
      m.style.setProperty("--bwl-row", `var(--bwl-row-${i % 8})`);
      m.innerHTML = pixelMarkup(map, "bz-bwl-p-", ARENA_ROLES, U);
      box.appendChild(m);
      marks[i] = m;
      placeMark(m, i);
      if (fade && core.running) core.anim(m, [{ opacity: 0 }, { opacity: 1 }], { duration: FAST, easing: "linear" });
    });
  }

  /* ----------------------------------------------------------- layout
     The first step's row is the bottom of the wall; that front place never
     moves, and the rows above drop into it in four held steps. */

  function placeRow(r: BrickRow, y: number, h: number, animate: boolean) {
    const oy = r.y;
    const oh = r.h;
    r.y = y;
    r.h = h;
    r.el.style.transform = `translateY(${y}px)`;
    r.el.style.height = `${h}px`;
    if (!animate || !oh || (oy === y && oh === h) || !core.motionOn()) return;
    const frames: Keyframe[] = [];
    for (let k = 0; k <= 4; k++) {
      const p = EASE_OUT(k / 4);
      frames.push({ offset: k / 4, easing: "step-end", transform: `translateY(${snap(oy + (y - oy) * p)}px)`, height: `${snap(oh + (h - oh) * p)}px` });
    }
    core.anim(r.el, frames, { duration: BASE, delay: dropDelay, fill: "backwards" });
  }

  function layout(animate = false) {
    const field = refs.field.current;
    const root = refs.root.current;
    const rider = refs.rider.current;
    const ball = refs.ball.current;
    if (!field || !rider || !ball) return;
    const W = field.clientWidth;
    if (!W) return;
    const narrow = !!root && root.clientWidth < 560;
    const bgap = narrow ? 2 : 4;
    const n = core.host.length;
    const H = fieldHeight(n, narrow ? AIR_NARROW : AIR);
    const yf = FRAME + TOP + Math.max(0, n - 1) * PITCH;
    const padX = snap((W - PADDLE_W) / 2);
    const tx = FRAME + SIDE;
    const slot = Math.max(8, Math.min(7 * U, Math.floor((padX - 3 * U - tx) / Math.max(1, n) / U) * U));
    G = { W, H, yf, padX, restX: padX + BALL_X, restTop: H - BOTTOM - PADDLE_H - BALL, tx, slot };
    rider.style.left = `${padX}px`;
    ball.style.left = `${G.restX}px`;
    ball.style.top = `${G.restTop}px`;
    marks.forEach((m, i) => {
      if (m) placeMark(m, i);
    });
    const innerW = W - 2 * tx;
    let k = 0;
    core.host.forEach((_, i) => {
      const r = rows[i];
      if (!r || core.gone[i]) return;
      const role = k === 0 ? "front" : "queue";
      const y = yf - k * PITCH;
      const h = k === 0 ? FRONT_H : QUEUE_H;
      k++;
      if (r.el.dataset.role !== role) r.el.dataset.role = role;
      const bw = Math.max(2 * U, Math.floor((innerW - (r.n - 1) * bgap) / r.n / U) * U);
      const span = r.n * bw + (r.n - 1) * bgap;
      const x0 = tx + snap((innerW - span) / 2);
      if (r.bw !== bw || !r.x || r.x[0] !== x0) {
        r.bw = bw;
        r.el.style.left = `${x0}px`;
        r.el.style.width = `${span}px`;
        r.x = r.bricks.map((b, j) => {
          const lx = j * (bw + bgap);
          b.style.left = `${lx}px`;
          b.style.width = `${bw}px`;
          b.style.setProperty("--bwl-bw", `${bw}px`);
          return x0 + lx;
        });
        if (r.crack) setCrack(r, r.crackAt, r.crack, true);
      }
      placeRow(r, y, h, animate);
    });
  }

  /* ------------------------------------------------------------- ball */

  function ballNow(): [number, number] {
    const ball = refs.ball.current;
    if (!ball) return [0, 0];
    const m = /matrix\(([^)]+)\)/.exec(getComputedStyle(ball).transform || "");
    if (!m) return [0, 0];
    const v = m[1].split(",").map(Number);
    return [Math.round(v[4]) || 0, Math.round(v[5]) || 0];
  }

  /* A straight line as held positions, one per 16ms frame: a fast Breakout ball. */
  function line(x0: number, y0: number, x1: number, y1: number, ms: number, t0: number, total: number, out: PixelStep[]) {
    const n = Math.max(2, Math.round(ms / 16));
    for (let k = 1; k <= n; k++) {
      const f = k / n;
      out.push([(t0 + ms * f) / total, snap(x0 + (x1 - x0) * f), snap(y0 + (y1 - y0) * f)]);
    }
  }

  function syncBall() {
    const ball = refs.ball.current;
    if (!ball) return;
    const s = core.host[core.front];
    const dribble = core.phase === "run" && !ballLost && !ballAnim && !!s && s.status === "active" && s.progress == null && core.motionAllowed;
    const d = dribble ? "true" : "false";
    if (ball.dataset.dribble !== d) ball.dataset.dribble = d;
    const st = ballLost && !ballAnim ? "lost" : "rest";
    if (ball.dataset.state !== st) ball.dataset.state = st;
  }

  function fly(points: PixelStep[], ms: number) {
    const ball = refs.ball.current;
    if (!ball) return;
    ballAnim?.cancel();
    ball.dataset.dribble = "false";
    ball.dataset.state = "rest";
    const a = core.anim(ball, steppedFrames(points), { duration: ms });
    ballAnim = a;
    const end = () => {
      if (ballAnim === a) {
        ballAnim = null;
        syncBall();
      }
    };
    if (a) a.finished.then(end, end);
    else end();
  }

  /* Just under the next standing brick of row i, relative to the ball's rest spot. */
  function aimAt(i: number): [number, number] | null {
    const r = rows[i];
    if (!r || !r.x || !G) return null;
    let j = r.bricks.findIndex((b) => b.dataset.b !== "1");
    if (j < 0) j = r.n - 1;
    return [snap(r.x[j] + r.bw / 2 - BALL / 2) - G.restX, r.y + r.h - G.restTop];
  }

  /* Up to the row and straight back down; the paddle gives one art pixel as it takes the ball. */
  function shoot(i: number, up: number, down: number) {
    const t = aimAt(i);
    const rider = refs.rider.current;
    if (!t || !G) return;
    const [x0, y0] = ballNow();
    const total = up + down;
    const pts: PixelStep[] = [[0, x0, y0]];
    line(x0, y0, t[0], t[1], up, 0, total, pts);
    line(t[0], t[1], 0, 0, down, up, total, pts);
    fly(pts, total);
    if (rider) core.anim(rider, steppedFrames([[0, 0, U], [1, 0, 0]]), { duration: 80, delay: total });
  }

  /* Error: the ball hops off the paddle's end and drops out of the bottom, fading. */
  function loseBall() {
    if (ballLost) return;
    ballLost = true;
    if (!core.motionOn() || !G) {
      ballAnim?.cancel();
      ballAnim = null;
      syncBall();
      return;
    }
    const [x0, y0] = ballNow();
    const edge = PADDLE_W + 2 * U - BALL_X;
    const top = Math.min(y0, 0) - 2 * U;
    const off = G.H - G.restTop + 3 * U;
    const pts: PixelStep[] = [[0, x0, y0, 1]];
    line(x0, y0, edge, top, 90, 0, BASE, pts);
    for (let k = 1; k <= 13; k++) {
      const f = k / 13;
      pts.push([(90 + 210 * f) / BASE, snap(edge + 2 * U * f), snap(top + (off - top) * f * f), f > 0.6 ? 1 - (f - 0.6) / 0.4 : 1]);
    }
    fly(pts, BASE);
  }

  /* A retry, or the host moving on, serves a new ball from the paddle. */
  function newBall() {
    if (!ballLost) return;
    ballLost = false;
    ballAnim?.cancel();
    ballAnim = null;
    syncBall();
    const ball = refs.ball.current;
    if (!ball) return;
    if (core.motionOn()) core.anim(ball, steppedFrames([[0, 0, -4 * U, 0], [0.34, 0, -4 * U, 1], [0.67, 0, -2 * U, 1], [1, 0, 0, 1]]), { duration: FAST });
    else if (core.running) core.anim(ball, [{ opacity: 0 }, { opacity: 1 }], { duration: FAST, easing: "linear" });
  }

  /* Finale: three bounces on the paddle, each lower, in whole art pixels. */
  function victoryBounce() {
    if (!G || ballLost) return;
    const hops: [number, number][] = [[10, 360], [4, 220], [2, 140]];
    const total = hops.reduce((a, h) => a + h[1], 0);
    const pts: PixelStep[] = [[0, 0, 0]];
    let t0 = 0;
    for (const [h, ms] of hops) {
      const n = Math.round(ms / 30);
      for (let j = 1; j <= n; j++) {
        const f = j / n;
        pts.push([(t0 + ms * f) / total, 0, -Math.round(4 * h * f * (1 - f)) * U]);
      }
      t0 += ms;
    }
    fly(pts, total);
  }

  /* ------------------------------------------------------------ poses */

  function setSprite(frame: string, loop: string) {
    const hero = refs.hero.current;
    if (!hero) return;
    if (hero.getAttribute("data-frame") !== frame) hero.setAttribute("data-frame", frame);
    if (hero.getAttribute("data-loop") !== loop) hero.setAttribute("data-loop", loop);
  }

  function pose() {
    if (transientUntil > now()) {
      syncBall();
      return;
    }
    let frame: CharacterFrame = "idle1";
    let loop = "";
    if (core.phase === "error" || core.phase === "stopped") frame = "sit";
    else if (core.phase === "complete") {
      frame = "celebrate1";
      if (celebrating && core.motionAllowed) loop = "celebrate";
    } else if (core.motionAllowed) {
      const s = core.host[core.front];
      loop = s && s.status === "active" && s.progress == null ? "working" : "idle";
    }
    setSprite(loop ? "" : frame, loop);
    syncBall();
  }

  function playTransient(seq: [CharacterFrame, number][]) {
    poseTimers.forEach(core.clear);
    poseTimers = [];
    if (!core.motionOn()) return;
    let at = 0;
    for (const [frame, ms] of seq) {
      poseTimers.push(core.later(() => setSprite(frame, ""), at));
      at += ms;
    }
    transientUntil = now() + at;
    poseTimers.push(
      core.later(() => {
        transientUntil = 0;
        pose();
      }, at),
    );
  }

  /* --------------------------------------------------------- the API */

  return {
    rebuild() {
      refs.wall.current?.replaceChildren();
      refs.tally.current?.replaceChildren();
      refs.fx.current?.replaceChildren();
      poseTimers = [];
      transientUntil = 0;
      celebrating = false;
      celebrateT = 0;
      ballLost = false;
      ballAnim = null;
      dropDelay = 0;
      rows = core.host.map((_, i) => (core.gone[i] ? null : makeRow(i)));
      marks = core.host.map(() => null);
      layout(false);
      progress(false);
      syncBall();
    },
    layout: () => layout(false),
    progress,
    sync,
    hit() {
      playTransient([["swing1", 60], ["swing2", 90], ["idle1", SHOT_UP + SHOT_DOWN - 150]]);
      if (G && rows[core.front] && !ballLost) {
        shoot(core.front, SHOT_UP, SHOT_DOWN);
        return SHOT_UP;
      }
      return IMPACT;
    },
    strike(beat) {
      playTransient([["swing1", 50], ["swing2", 250]]);
      if (G && rows[beat.i] && !ballLost) shoot(beat.i, IMPACT, 200);
      return IMPACT;
    },
    resolve(beats, showy) {
      const last = core.host.length - 1;
      let hold = 0;
      dropDelay = 0;
      for (const b of beats) {
        if (!showy) fadeOutRow(b.i);
        else if (b.kind === "done") {
          shatterRow(b.i, b.i === last);
          dropDelay = CHAIN;
        } else {
          stepAsideRow(b.i);
          hold = BASE;
        }
      }
      return hold;
    },
    flush(beats) {
      beats.forEach((b) => fadeOutRow(b.i));
    },
    advance(changed) {
      layout(true);
      dropDelay = 0;
      const r = rows[core.front];
      if (changed && r && !core.motionAllowed && core.running) core.anim(r.el, [{ opacity: 0 }, { opacity: 1 }], { duration: FAST, easing: "linear" });
      sync();
    },
    tally,
    error() {
      const r = rows[core.front];
      if (r) r.el.dataset.error = "true";
      loseBall();
      playTransient([["hurt", 260]]);
    },
    retry() {
      rows.forEach((r) => {
        if (r) r.el.dataset.error = "false";
      });
      newBall();
    },
    stop() {
      poseTimers.forEach(core.clear);
      poseTimers = [];
      transientUntil = 0;
    },
    finale(showy) {
      celebrateT = core.clear(celebrateT);
      celebrating = showy && core.motionAllowed;
      if (showy) victoryBounce();
      if (celebrating) {
        celebrateT = core.later(() => {
          celebrating = false;
          pose();
        }, BEAT * 3);
      }
    },
    pose,
    motion() {
      if (!core.motionAllowed) {
        celebrating = false;
        celebrateT = core.clear(celebrateT);
      }
      if (!core.motionOn()) {
        poseTimers.forEach(core.clear);
        poseTimers = [];
        transientUntil = 0;
      }
      syncBall();
    },
    destroy() {
      refs.wall.current?.replaceChildren();
      refs.tally.current?.replaceChildren();
      refs.fx.current?.replaceChildren();
      rows = [];
      marks = [];
    },
  };
}

/* ---------------- end arena: brick wall ---------------- */

/* ---------------- styles ---------------- */

/* Stepped corners for the dialogue box and the banner, so they read as pixel frames. */
const STEP_OUTER = "polygon(4px 0,calc(100% - 4px) 0,calc(100% - 4px) 2px,calc(100% - 2px) 2px,calc(100% - 2px) 4px,100% 4px,100% calc(100% - 4px),calc(100% - 2px) calc(100% - 4px),calc(100% - 2px) calc(100% - 2px),calc(100% - 4px) calc(100% - 2px),calc(100% - 4px) 100%,4px 100%,4px calc(100% - 2px),2px calc(100% - 2px),2px calc(100% - 4px),0 calc(100% - 4px),0 4px,2px 4px,2px 2px,4px 2px)";
const STEP_INNER = "polygon(2px 0,calc(100% - 2px) 0,calc(100% - 2px) 2px,100% 2px,100% calc(100% - 2px),calc(100% - 2px) calc(100% - 2px),calc(100% - 2px) 100%,2px 100%,2px calc(100% - 2px),0 calc(100% - 2px),0 2px,2px 2px)";
/* A stepped diagonal hatch (2px cells, 6px repeat), used as a mask so it takes the row's colour. */
const HATCH = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='6'%3E%3Cpath d='M4 0h2v2H4zM2 2h2v2H2zM0 4h2v2H0z'/%3E%3C/svg%3E")`;
const BAR_HATCH = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Cpath d='M0 6h2v2H0zM2 4h2v2H2zM4 2h2v2H4zM6 0h2v2H6z'/%3E%3C/svg%3E")`;

const CHARACTER_CSS =
  Object.values(CHARACTER_ROLES)
    .filter((r) => r !== "outline")
    .map((r) => `.bz-bwl-c-${r}{fill:var(--chr-${r})}`)
    .join("") +
  `.bz-bwl-c-outline{fill:var(--bwl-sprite-outline)}` +
  `.bz-bwl-sprite{display:block;width:100%;height:100%;overflow:visible}.bz-bwl-sprite g{display:none}` +
  `.bz-bwl-hero:not([data-frame]):not([data-loop]) g[data-f="idle1"],` +
  CHARACTER_FRAMES.map((f) => `.bz-bwl-hero[data-frame="${f}"] g[data-f="${f}"]`).join(",") +
  `{display:inline}`;

const CSS = `
.bz-bwl{
  --bwl-ink:light-dark(var(--bz-ink,#0a0a0a),var(--bz-void-ink,#ffffff));
  --bwl-muted:light-dark(var(--bz-ink-muted,#4a4a4c),rgba(255,255,255,0.8));
  --bwl-panel:light-dark(var(--bz-paper,#ffffff),var(--bz-void-raised,#1a1a1a));
  --bwl-track:light-dark(var(--bz-line-opaque,#f0f0f0),#313131);
  --bwl-hover:light-dark(var(--bz-line-opaque,#f0f0f0),#2b2b2b);
  --bwl-line:light-dark(rgba(10,10,10,0.13),rgba(255,255,255,0.16));
  --bwl-danger:light-dark(var(--bz-danger,#b91c1c),#fca5a5);
  --bwl-danger-mark:light-dark(#dc2626,#f87171);
  --bwl-success:light-dark(var(--bz-emerald,#047857),var(--bz-emerald-on-void,#34d399));
  --bwl-focus:light-dark(var(--bz-focus-ring,#912c22),var(--bz-focus-ring-void,#ffffff));
  --bwl-sans:var(--bz-font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);
  --bwl-mono:var(--bz-font-mono,ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace);
  --bwl-fast:var(--bz-duration-fast,150ms);
  --bwl-base:var(--bz-duration-base,300ms);
  --bwl-ease:var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1));
  --bwl-beat:var(--bz-duration-beat,2.4s);
  container-type:inline-size;
  position:relative;
  box-sizing:border-box;
  width:100%;
  border:1px solid var(--bwl-line);
  border-radius:16px;
  background:var(--bwl-panel);
  color:var(--bwl-ink);
  font-family:var(--bwl-sans);
  font-size:15px;
  line-height:1.5;
  text-align:left;
}
.bz-bwl *,.bz-bwl *::before,.bz-bwl *::after{box-sizing:border-box}
.bz-bwl-in{padding:14px 20px 20px}
.bz-bwl-sr{position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}
.bz-bwl-title{margin:0;font-size:15px;font-weight:600;line-height:1.4;color:var(--bwl-ink)}
.bz-bwl-title:focus{outline:none}
.bz-bwl-title:focus-visible{outline:2px solid var(--bwl-focus);outline-offset:2px}
.bz-bwl-g{display:block;flex:none}
.bz-bwl-g-ink{fill:currentColor}

/* arena: the playfield, with the nameplate beside it (above it when narrow) */
.bz-bwl-arena{display:grid;grid-template-columns:minmax(0,1fr) 220px;column-gap:20px;margin-top:10px}
.bz-bwl-field{position:relative;grid-column:1;grid-row:1;height:calc(${fieldHeight(1)}px + (var(--bwl-n,5) - 1) * ${PITCH}px);overflow:hidden;background:var(--bwl-field)}
.bz-bwl-frame{position:absolute;inset:0;border:4px solid var(--bwl-frame);border-bottom:0;pointer-events:none}
.bz-bwl-frame::before,.bz-bwl-frame::after{content:"";position:absolute;top:0;width:2px;height:2px;background:var(--bwl-frame)}
.bz-bwl-frame::before{left:0;box-shadow:2px 0 0 var(--bwl-frame),0 2px 0 var(--bwl-frame)}
.bz-bwl-frame::after{right:0;box-shadow:-2px 0 0 var(--bwl-frame),0 2px 0 var(--bwl-frame)}
.bz-bwl-wall,.bz-bwl-fx{position:absolute;inset:0;pointer-events:none}
.bz-bwl-row{position:absolute;left:0;top:0;height:${QUEUE_H}px}
.bz-bwl-row[data-error="true"]{outline:2px solid var(--bwl-danger-mark);outline-offset:2px}
.bz-bwl-brick{position:absolute;top:0;height:100%;background:var(--bwl-row);box-shadow:inset 0 0 0 2px var(--bwl-brick-line)}
.bz-bwl-brick::after{content:"";position:absolute;inset:2px;box-shadow:inset 2px 2px 0 color-mix(in srgb,var(--bwl-row) 45%,#ffffff),inset -2px -2px 0 color-mix(in srgb,var(--bwl-row) 70%,#000000)}
.bz-bwl-brick[data-b="1"]{visibility:hidden}
.bz-bwl-brick[data-flash="true"]{background:var(--bwl-field)}
.bz-bwl-brick[data-flash="true"]::after{box-shadow:none}
.bz-bwl-row[data-kind="steel"] .bz-bwl-brick{background:var(--bwl-steel)}
.bz-bwl-row[data-kind="steel"] .bz-bwl-brick::after{box-shadow:inset 2px 2px 0 var(--bwl-steel-light),inset -2px -2px 0 var(--bwl-steel-shade)}
.bz-bwl-row[data-kind="steel"] .bz-bwl-brick::before{content:"";position:absolute;z-index:1;left:4px;top:calc(50% - 1px);width:2px;height:2px;background:var(--bwl-steel-shade);box-shadow:calc(var(--bwl-bw,20px) - 10px) 0 0 var(--bwl-steel-shade)}
.bz-bwl-row[data-hatch="true"] .bz-bwl-brick{background:var(--bwl-field)}
.bz-bwl-row[data-hatch="true"] .bz-bwl-brick::before{display:none}
.bz-bwl-row[data-hatch="true"] .bz-bwl-brick::after{box-shadow:none;background:var(--bwl-row);-webkit-mask:${HATCH} 0 0/6px 6px repeat;mask:${HATCH} 0 0/6px 6px repeat}
.bz-bwl-row[data-ghost="true"] .bz-bwl-brick{background:transparent;box-shadow:none;outline:2px dashed var(--bwl-hatch);outline-offset:-2px}
.bz-bwl-row[data-ghost="true"] .bz-bwl-brick::before,.bz-bwl-row[data-ghost="true"] .bz-bwl-brick::after,.bz-bwl-row[data-ghost="true"] .bz-bwl-crack{display:none}
.bz-bwl-crack{position:absolute;inset:0;z-index:2;display:block;width:100%;height:100%}
.bz-bwl-shard{position:absolute;width:4px;height:4px;background:var(--bwl-row);box-shadow:0 0 0 2px var(--bwl-brick-line)}
.bz-bwl-shard[data-kind="steel"]{background:var(--bwl-steel)}
.bz-bwl-p-line{fill:var(--bwl-brick-line)}
.bz-bwl-p-row{fill:var(--bwl-row)}
.bz-bwl-p-gold{fill:var(--bwl-row-2)}
.bz-bwl-p-steel{fill:var(--bwl-steel)}
.bz-bwl-p-steel-light{fill:var(--bwl-steel-light)}
.bz-bwl-p-steel-shade{fill:var(--bwl-steel-shade)}
.bz-bwl-p-hatch{fill:var(--bwl-hatch)}
.bz-bwl-p-cap{fill:var(--bwl-paddle-cap)}
.bz-bwl-p-paddle{fill:var(--bwl-paddle)}
.bz-bwl-p-glint{fill:var(--bwl-field)}
.bz-bwl-p-ball{fill:var(--bwl-ball)}
.bz-bwl[data-phase="error"] .bz-bwl-p-cap,.bz-bwl[data-phase="stopped"] .bz-bwl-p-cap{fill:var(--bwl-steel-shade)}

/* the rider: the character on the paddle */
.bz-bwl-rider{position:absolute;left:0;bottom:${BOTTOM}px;width:${PADDLE_W}px;height:${PADDLE_H + HERO_PX}px}
.bz-bwl-hero{position:absolute;left:${HERO_X}px;bottom:${PADDLE_H}px;width:${CHARACTER_W * U}px;height:${HERO_PX}px;filter:drop-shadow(${U}px 0 0 var(--bwl-sprite-rim,transparent)) drop-shadow(-${U}px 0 0 var(--bwl-sprite-rim,transparent)) drop-shadow(0 ${U}px 0 var(--bwl-sprite-rim,transparent)) drop-shadow(0 -${U}px 0 var(--bwl-sprite-rim,transparent))}
.bz-bwl-paddle{position:absolute;left:0;bottom:0;display:block}
.bz-bwl-ball{position:absolute;left:0;top:0;width:${BALL}px;height:${BALL}px}
.bz-bwl-ball > svg{display:block}
.bz-bwl-ball[data-state="lost"]{visibility:hidden}
.bz-bwl-ball[data-dribble="true"]{animation:bz-bwl-dribble var(--bwl-beat) step-end infinite}
@keyframes bz-bwl-dribble{0%,30%,100%{translate:0 0}5%,25%{translate:0 -2px}10%,20%{translate:0 -4px}15%{translate:0 -6px}}
.bz-bwl-tally{position:absolute;left:0;bottom:${BOTTOM}px;width:0;height:0}
.bz-bwl-mark{position:absolute;bottom:0;width:${6 * U}px;height:${4 * U}px}
.bz-bwl-mark > svg{display:block}
${CHARACTER_CSS}
.bz-bwl-hero[data-loop="idle"] g[data-f="idle1"],.bz-bwl-hero[data-loop="working"] g[data-f="idle1"],.bz-bwl-hero[data-loop="celebrate"] g[data-f="celebrate1"]{display:inline;animation:bz-bwl-a var(--bwl-beat) step-end infinite}
.bz-bwl-hero[data-loop="idle"] g[data-f="idle2"],.bz-bwl-hero[data-loop="working"] g[data-f="swing1"],.bz-bwl-hero[data-loop="celebrate"] g[data-f="celebrate2"]{display:inline;animation:bz-bwl-b var(--bwl-beat) step-end infinite}
.bz-bwl-hero[data-loop="celebrate"] g{animation-iteration-count:3;animation-fill-mode:forwards}
@keyframes bz-bwl-a{0%{opacity:1}50%{opacity:0}100%{opacity:0}}
@keyframes bz-bwl-b{0%{opacity:0}50%{opacity:1}100%{opacity:1}}

/* the nameplate (the one progressbar) and, at the end, the banner in its place */
.bz-bwl-side{position:relative;grid-column:2;grid-row:1;min-width:0}
.bz-bwl-plate{position:relative;margin-top:var(--bwl-pt,0px);padding:8px 10px 10px 16px;background:var(--bwl-panel);border:2px solid var(--bwl-ink)}
.bz-bwl-plate::before{content:"";position:absolute;left:0;top:0;bottom:0;width:6px;background:var(--bwl-accent)}
.bz-bwl-plate[data-state="pending"]::before{background:var(--bwl-muted)}
.bz-bwl-plate[data-state="error"]::before{background:var(--bwl-danger-mark)}
.bz-bwl[data-phase="complete"] .bz-bwl-plate{position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}
.bz-bwl-ptr{position:absolute;left:-18px;top:var(--bwl-ay,12px);color:var(--bwl-ink)}
.bz-bwl-plate-top{display:flex;flex-wrap:wrap;align-items:center;gap:2px 8px;min-height:22px}
.bz-bwl-plate-label{min-width:0;font-size:14px;font-weight:600;line-height:1.4;color:var(--bwl-ink);overflow-wrap:anywhere}
.bz-bwl-tag{flex:none;padding:4px 6px 3px;background:var(--bwl-accent);color:var(--bwl-on-accent);font:700 11px/1 var(--bwl-mono);letter-spacing:0.04em;white-space:nowrap}
.bz-bwl-failed{flex:none;display:inline-flex;align-items:center;gap:5px;margin-left:auto;color:var(--bwl-danger);font-size:13px;font-weight:700;line-height:1}
.bz-bwl-failed .bz-bwl-g{color:var(--bwl-danger-mark)}
.bz-bwl-plate-row{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin-top:6px}
.bz-bwl-bar{position:relative;flex:1 1 100%;min-width:48px;height:12px;overflow:hidden;border:2px solid var(--bwl-ink);background:var(--bwl-track)}
.bz-bwl-fill{position:absolute;left:0;top:0;bottom:0;background:var(--bwl-accent);transition:width var(--bwl-base) var(--bwl-ease)}
.bz-bwl-hatch{position:absolute;top:0;bottom:0;left:-8px;right:0;display:none;background:var(--bwl-accent);-webkit-mask:${BAR_HATCH} 0 0/8px 8px repeat;mask:${BAR_HATCH} 0 0/8px 8px repeat}
.bz-bwl-bar[data-indet="true"] .bz-bwl-fill{display:none}
.bz-bwl-bar[data-indet="true"] .bz-bwl-hatch{display:block;animation:bz-bwl-march var(--bwl-beat) steps(4) infinite}
@keyframes bz-bwl-march{from{transform:translateX(0)}to{transform:translateX(8px)}}
.bz-bwl-count{flex:none;font:500 12px/1.2 var(--bwl-mono);color:var(--bwl-muted);white-space:nowrap;font-variant-numeric:tabular-nums}
.bz-bwl-banner{position:absolute;left:0;right:0;top:var(--bwl-pt,0px);visibility:hidden;padding:2px;background:var(--bwl-ink);clip-path:${STEP_OUTER}}
.bz-bwl[data-phase="complete"] .bz-bwl-banner{visibility:visible}
.bz-bwl[data-phase="complete"][data-motion="on"] .bz-bwl-banner{animation:bz-bwl-fade var(--bwl-base) var(--bwl-ease) both}
@keyframes bz-bwl-fade{from{opacity:0}to{opacity:1}}
.bz-bwl-banner-in{display:block;padding:12px 14px 10px;background:var(--bwl-panel);clip-path:${STEP_INNER};font:700 15px/1.25 var(--bwl-mono);letter-spacing:0.12em;text-transform:uppercase;overflow-wrap:anywhere;text-wrap:balance;color:var(--bwl-ink);text-align:center}
.bz-bwl-banner-rule{display:block;height:4px;margin-top:8px;background:var(--bwl-accent)}

/* the dialogue box: three panels in one cell, so it never changes height. The
   error and results panels have bounded heights and size the cell; the log
   stretches to fill it and never adds height of its own. */
.bz-bwl-box{position:relative;margin-top:12px;padding:2px;background:var(--bwl-ink);clip-path:${STEP_OUTER}}
.bz-bwl-box-in{position:relative;padding:14px 18px 12px;background:var(--bwl-panel);clip-path:${STEP_INNER}}
.bz-bwl-panels{display:grid}
.bz-bwl-panel{grid-area:1/1;min-width:0;visibility:hidden}
.bz-bwl[data-panel="log"] .bz-bwl-panel[data-panel="log"],.bz-bwl[data-panel="error"] .bz-bwl-panel[data-panel="error"],.bz-bwl[data-panel="results"] .bz-bwl-panel[data-panel="results"]{visibility:visible}
.bz-bwl-panel[data-panel="log"]{position:relative;display:flex;flex-direction:column}
.bz-bwl-log{flex:1 1 0px;min-height:72px;overflow-y:auto;scrollbar-width:none;overscroll-behavior:contain}
.bz-bwl-log::-webkit-scrollbar{display:none}
.bz-bwl-log:focus{outline:none}
.bz-bwl-log:focus-visible{outline:2px solid var(--bwl-focus);outline-offset:2px}
.bz-bwl-line{display:flex;gap:8px;margin:0;color:var(--bwl-muted);font-size:14px;line-height:24px}
.bz-bwl-line:last-child{color:var(--bwl-ink);font-size:16px;font-weight:500}
.bz-bwl-line > .bz-bwl-g{margin-top:5px;visibility:hidden}
.bz-bwl-line:last-child > .bz-bwl-g{visibility:inherit}
.bz-bwl-line[data-kind="done"] > .bz-bwl-g,.bz-bwl-final > .bz-bwl-g{color:var(--bwl-success)}
.bz-bwl-line[data-kind="skipped"] > .bz-bwl-g,.bz-bwl-line[data-kind="stop"] > .bz-bwl-g{color:var(--bwl-muted)}
.bz-bwl-line[data-kind="finish"] > .bz-bwl-g{color:var(--bwl-success)}
.bz-bwl-line[data-kind="retry"] > .bz-bwl-g{color:var(--bwl-accent)}
.bz-bwl-ph{position:absolute;left:0;top:0;margin:0;font-size:15px;line-height:24px;color:var(--bwl-muted)}
.bz-bwl-err{display:grid;row-gap:10px;align-content:start}
.bz-bwl-alert{display:flex;gap:10px;height:48px;overflow:hidden;font-size:15px;font-weight:500;line-height:24px;color:var(--bwl-ink);visibility:visible}
.bz-bwl-alert > .bz-bwl-g{margin-top:5px;color:var(--bwl-danger-mark)}
.bz-bwl-alert > span{display:-webkit-box;min-width:0;overflow:hidden;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow-wrap:anywhere}
.bz-bwl-menu{display:flex;flex-wrap:wrap;gap:8px}
.bz-bwl-cur{visibility:hidden}
.bz-bwl-menu .bz-bwl-btn[data-current="true"] .bz-bwl-cur{visibility:inherit}
.bz-bwl-details{height:40px;margin:0;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;font:500 12px/20px var(--bwl-mono);color:var(--bwl-muted);overflow-wrap:anywhere}
.bz-bwl-details:focus{outline:none}
.bz-bwl-details:focus-visible{outline:2px solid var(--bwl-focus);outline-offset:2px}
.bz-bwl-details > span{display:block}
.bz-bwl-details[data-open="false"]{visibility:hidden}
.bz-bwl-final{display:flex;gap:8px;height:48px;overflow:hidden;margin:0 0 10px;font-size:16px;font-weight:500;line-height:24px;color:var(--bwl-ink)}
.bz-bwl-final > .bz-bwl-g{margin-top:5px}
.bz-bwl-final > span{display:-webkit-box;min-width:0;overflow:hidden;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.bz-bwl-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:12px 16px;margin:0}
.bz-bwl-stat{min-width:0;padding-top:8px;border-top:2px solid var(--bwl-ink)}
.bz-bwl-stat[data-empty="true"]{visibility:hidden}
.bz-bwl-stat dt{font:700 11px/14px var(--bwl-mono);letter-spacing:0.08em;text-transform:uppercase;color:var(--bwl-muted)}
.bz-bwl-stat dd{margin:2px 0 0}
.bz-bwl-num{display:block;font:700 18px/26px var(--bwl-mono);color:var(--bwl-ink);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.bz-bwl-sub{display:-webkit-box;min-height:36px;overflow:hidden;font-size:13px;line-height:18px;color:var(--bwl-muted);-webkit-line-clamp:2;-webkit-box-orient:vertical}

/* the footer line and the buttons */
.bz-bwl-foot{display:flex;align-items:center;gap:10px 16px;margin-top:12px}
.bz-bwl-meta{flex:1 1 auto;min-width:0;min-height:38px;margin:0;font-size:13px;line-height:19px;color:var(--bwl-muted);display:-webkit-box;overflow:hidden;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.bz-bwl-meta b{font-weight:600;color:var(--bwl-ink)}
.bz-bwl-meta .bz-bwl-g{display:inline-block;margin-right:6px;vertical-align:-2px;color:var(--bwl-ink)}
.bz-bwl-toys{display:flex;flex:none;gap:8px;margin-left:auto}
.bz-bwl-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;min-width:48px;margin:0;padding:0 16px;border:2px solid var(--bwl-ink);border-radius:0;background:var(--bwl-panel);color:var(--bwl-ink);font:600 14px/1.2 var(--bwl-sans);text-align:left;cursor:pointer;transition:background-color var(--bwl-fast) var(--bwl-ease),transform var(--bwl-fast) var(--bwl-ease)}
.bz-bwl-btn:focus{outline:none}
.bz-bwl-btn:focus-visible{outline:2px solid var(--bwl-focus);outline-offset:2px;background:var(--bwl-hover)}
@media (hover:hover){.bz-bwl-btn:hover{background:var(--bwl-hover)}}
.bz-bwl[data-motion="on"] .bz-bwl-btn:active{transform:scale(0.97)}
.bz-bwl-btn:disabled{opacity:0.5;cursor:not-allowed}
.bz-bwl-primary,.bz-bwl-primary:focus-visible{background:var(--bwl-accent);border-color:var(--bwl-accent);color:var(--bwl-on-accent)}
.bz-bwl-primary:focus-visible{box-shadow:inset 0 0 0 2px var(--bwl-panel)}
@media (hover:hover){.bz-bwl-primary:hover{background:var(--bwl-accent);box-shadow:inset 0 0 0 2px var(--bwl-panel)}}
.bz-bwl-toy[aria-pressed="true"],.bz-bwl-toy[aria-pressed="true"]:focus-visible{background:var(--bwl-ink);color:var(--bwl-panel)}
@media (hover:hover){.bz-bwl-toy[aria-pressed="true"]:hover{background:var(--bwl-ink)}}
.bz-bwl-toy[data-hidden="true"],.bz-bwl-cont[data-shown="false"]{visibility:hidden}

/* narrow: the nameplate sits above the playfield, the menu becomes a 2 x 2 grid */
@container (max-width:559px){
  .bz-bwl-in{padding:10px 10px 12px}
  .bz-bwl-arena{grid-template-columns:minmax(0,1fr);row-gap:8px;margin-top:8px}
  .bz-bwl-side{grid-column:1;grid-row:1;height:56px}
  .bz-bwl-field{grid-row:2;height:calc(${fieldHeight(1, AIR_NARROW)}px + (var(--bwl-n,5) - 1) * ${PITCH}px)}
  .bz-bwl-plate{height:56px;margin-top:0;padding:5px 10px 6px 16px}
  .bz-bwl-plate-top{flex-wrap:nowrap;min-height:20px}
  .bz-bwl-plate-label{flex:1 1 0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;line-height:20px}
  .bz-bwl-plate-row{flex-wrap:nowrap;margin-top:5px}
  .bz-bwl-bar{flex:1 1 60px}
  .bz-bwl-ptr{display:none}
  .bz-bwl-banner{top:0;bottom:0;display:flex;flex-direction:column;justify-content:center}
  .bz-bwl-banner-in{flex:1;display:flex;flex-direction:column;justify-content:center;padding:6px 12px;font-size:14px;line-height:1.2}
  .bz-bwl-banner-rule{margin-top:6px}
  .bz-bwl-box{margin-top:10px}
  .bz-bwl-box-in{padding:10px 12px}
  /* one fixed height for the log, the error menu and the results, so nothing shifts between them */
  .bz-bwl-panels{height:196px}
  .bz-bwl-panel{overflow:hidden}
  .bz-bwl-line{font-size:13px;line-height:22px}
  .bz-bwl-line:last-child{font-size:15px}
  .bz-bwl-line > .bz-bwl-g{margin-top:4px}
  .bz-bwl-ph{font-size:14px;line-height:22px}
  /* the details open in the message's place, so the menu never moves */
  .bz-bwl-err{grid-template-areas:"msg" "menu";row-gap:8px}
  .bz-bwl-alert,.bz-bwl-details{grid-area:msg;height:66px}
  .bz-bwl-menu{grid-area:menu;display:grid;grid-template-columns:1fr 1fr}
  .bz-bwl-alert{font-size:14px;line-height:22px}
  .bz-bwl-alert > .bz-bwl-g{margin-top:4px}
  .bz-bwl-alert > span{-webkit-line-clamp:3}
  .bz-bwl-err[data-details="true"] .bz-bwl-alert{visibility:hidden}
  .bz-bwl-details{line-height:22px}
  .bz-bwl-final{height:44px;margin-bottom:8px;font-size:15px;line-height:22px}
  .bz-bwl-final > .bz-bwl-g{margin-top:4px}
  .bz-bwl-stats{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px 10px}
  .bz-bwl-stat{padding-top:6px}
  .bz-bwl-stat dt{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:12px;letter-spacing:0.04em}
  .bz-bwl-num{font-size:16px;line-height:22px}
  .bz-bwl-sub{display:block;min-height:18px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:12px}
  .bz-bwl-foot{flex-wrap:wrap;gap:6px 8px;margin-top:8px}
  .bz-bwl-meta{flex-basis:100%;min-height:19px;-webkit-line-clamp:1}
  .bz-bwl-toys{margin-left:0}
}

/* motion off (reduced motion, Pause motion, off screen, hidden tab): no loops, no tweens */
.bz-bwl[data-motion="off"] .bz-bwl-hero g,.bz-bwl[data-motion="off"] .bz-bwl-ball,.bz-bwl[data-motion="off"] .bz-bwl-hatch,.bz-bwl[data-motion="off"] .bz-bwl-banner{animation:none!important}
.bz-bwl[data-motion="off"] .bz-bwl-fill,.bz-bwl[data-motion="off"] .bz-bwl-btn{transition:none}
.bz-bwl[data-running="false"] *{animation-play-state:paused!important}
`;

/* ---------------- end styles ---------------- */

/* ---------------- component ---------------- */

function paletteVars(p: BrickWallLoaderPalette): Record<string, string> {
  const out: Record<string, string> = {};
  const keys = new Set([...Object.keys(p.light), ...Object.keys(p.dark)]) as Set<keyof BrickWallLoaderColors>;
  for (const k of keys) {
    if (k === "rows") continue;
    out[`--bwl-${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`] = `light-dark(${p.light[k] ?? "transparent"}, ${p.dark[k] ?? "transparent"})`;
  }
  for (let i = 0; i < 8; i++) {
    const l = p.light.rows[i % p.light.rows.length];
    const d = p.dark.rows[i % p.dark.rows.length];
    out[`--bwl-row-${i}`] = `light-dark(${l}, ${d})`;
  }
  return out;
}

function stateWord(s: LoaderStep) {
  switch (s.status) {
    case "active":
      return `Running${(s.attempt ?? 1) > 1 ? `, attempt ${s.attempt}` : ""}`;
    case "done":
      return `Done${s.durationMs != null ? ` in ${fmtDur(s.durationMs)}` : ""}`;
    case "skipped":
      return "Skipped";
    case "error":
      return "Failed";
    default:
      return "Waiting";
  }
}

type MenuCommand = "retry" | "skip" | "cancel" | "details";

export function BrickWallLoader({
  steps,
  title,
  headingLevel = 2,
  palette = "rainbow",
  character = "ember",
  colorScheme,
  labels,
  stats,
  completeText,
  onRetry,
  onSkip,
  onCancel,
  onContinue,
  onComplete,
  onAnnounce,
  reducedMotion,
  className = "",
  style,
}: BrickWallLoaderProps) {
  const uid = useId().replace(/:/g, "");
  const titleId = `${uid}-title`;
  const detailsId = `${uid}-details`;
  const L = useMemo<LoaderLabels>(() => ({ ...LOADER_DEFAULT_LABELS, unit: "Row", clear: "Wall cleared", ...labels }), [labels]);

  const prefersReduced = useReducedMotionPreference();
  const reduced = reducedMotion ?? prefersReduced;
  const [userPaused, setUserPaused] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const onscreen = useOnscreen(rootRef);
  const pageVisible = usePageVisible();
  const motionAllowed = !reduced && !userPaused;
  const running = onscreen && pageVisible;

  const [view, setView] = useState<LoaderView>(() => initialView(steps));
  const [cursor, setCursor] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  /* Whether the alert is cut to its reserved lines (its full text then leads
     the details) and whether the details need scrolling (then they take focus). */
  const [overflow, setOverflow] = useState({ alert: false, details: false });
  const plateHold = useRef<{ i: number; fillP: number; count: string; indet: boolean } | null>(null);
  const [focusTick, setFocusTick] = useState(0);
  const pendingFocus = useRef<LoaderFocus | null>(null);

  const engineRef = useRef<LoaderEngine | null>(null);
  const stepsRef = useRef(steps);
  stepsRef.current = steps;
  const motionRef = useRef({ allowed: motionAllowed, running });
  motionRef.current = { allowed: motionAllowed, running };
  const cfgRef = useRef<LoaderConfig>({ labels: L });
  cfgRef.current = { labels: L, stats, completeText, onCancel, onComplete, onAnnounce };

  const fieldRef = useRef<HTMLDivElement>(null);
  const wallRef = useRef<HTMLDivElement>(null);
  const tallyRef = useRef<HTMLDivElement>(null);
  const riderRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<HTMLDivElement>(null);
  const sideRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const alertTextRef = useRef<HTMLSpanElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const menuButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const numRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const plateHeight = useRef(66);

  /* The engine lives for the life of the component. StrictMode's double effects
     destroy it and build a fresh one from the same steps. */
  useLayoutEffect(() => {
    const bridge: LoaderBridge = {
      config: () => cfgRef.current,
      render: (v) => setView(v),
      focus: (target) => {
        pendingFocus.current = target;
        setFocusTick((t) => t + 1);
      },
      focusInside: () => {
        const root = rootRef.current;
        const a = document.activeElement;
        return !!root && !!a && a !== root && root.contains(a);
      },
      focusInMenu: () => {
        const a = document.activeElement;
        return !!a && (!!menuRef.current?.contains(a) || !!detailsRef.current?.contains(a));
      },
      resetMenu: () => {
        setCursor(0);
        setDetailsOpen(false);
      },
    };
    const refs: BrickWallRefs = { root: rootRef, field: fieldRef, wall: wallRef, tally: tallyRef, rider: riderRef, hero: heroRef, ball: ballRef, fx: fxRef };
    const engine = createLoaderEngine(bridge, (core) => createBrickWallArena(core, refs));
    engineRef.current = engine;
    engine.setMotion(motionRef.current.allowed, motionRef.current.running);
    engine.update(stepsRef.current);
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    engineRef.current?.update(steps);
  }, [steps]);

  useEffect(() => {
    engineRef.current?.setMotion(motionAllowed, running);
  }, [motionAllowed, running]);

  /* Wide: the nameplate sits level with the front row, its pointer at that row. */
  const fitPlate = () => {
    const root = rootRef.current;
    const plate = plateRef.current;
    const side = sideRef.current;
    if (!root || !plate || !side) return;
    if (root.clientWidth < 560) {
      side.style.removeProperty("--bwl-pt");
      side.style.removeProperty("--bwl-ay");
      return;
    }
    const n = Math.max(1, stepsRef.current.length);
    const mid = FRAME + TOP + (n - 1) * PITCH + FRONT_H / 2;
    /* At the end the plate is visually hidden and the banner keeps its place. */
    if (plate.offsetHeight > 8) plateHeight.current = plate.offsetHeight;
    const ph = plateHeight.current;
    const pt = Math.max(0, Math.min(fieldHeight(n) - ph, Math.round(mid - ph / 2)));
    const ay = Math.max(4, Math.min(ph - 18, Math.round(mid - pt - 2 - 7)));
    side.style.setProperty("--bwl-pt", `${pt}px`);
    side.style.setProperty("--bwl-ay", `${ay}px`);
  };

  /* Shows the newest narration from the start of a whole line. */
  const scrollLog = () => {
    const log = logRef.current;
    if (!log) return;
    log.style.paddingBottom = "";
    const target = log.scrollHeight - log.clientHeight;
    if (target <= 0) {
      log.scrollTop = 0;
      return;
    }
    const items = Array.from(log.children) as HTMLElement[];
    const base = items[0].offsetTop;
    let top = items[items.length - 1].offsetTop - base;
    for (let k = items.length - 1; k >= 0; k--) {
      const y = items[k].offsetTop - base;
      if (y < target) break;
      top = y;
    }
    if (top > target) log.style.paddingBottom = `${top - target}px`;
    log.scrollTop = top;
  };

  useLayoutEffect(() => {
    fitPlate();
  });

  useLayoutEffect(() => {
    scrollLog();
  }, [view.lines]);

  const measureOverflow = () => {
    const a = alertTextRef.current;
    const d = detailsRef.current;
    const next = { alert: !!a && a.scrollHeight > a.clientHeight + 1, details: !!d && d.scrollHeight > d.clientHeight + 1 };
    setOverflow((o) => (o.alert === next.alert && o.details === next.details ? o : next));
  };

  useLayoutEffect(() => {
    measureOverflow();
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      engineRef.current?.layout();
      fitPlate();
      scrollLog();
      measureOverflow();
    });
    ro.observe(root);
    return () => ro.disconnect();
    // fitPlate, scrollLog and measureOverflow read refs only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Focus moves only when it was already inside the loader. */
  useLayoutEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    if (target === "menu") menuButtons.current.find(Boolean)?.focus();
    else if (target === "log") logRef.current?.focus();
    else if (continueRef.current) continueRef.current.focus();
    else headingRef.current?.focus();
  }, [focusTick, view]);

  /* The results count up over 500ms, only when motion is allowed. */
  useEffect(() => {
    const tiles = view.tiles;
    if (!view.resultsOpen || !tiles) return;
    const nodes = numRefs.current;
    const finish = () => tiles.forEach((t, k) => {
      const node = nodes[k];
      if (node) node.textContent = tileText(t);
    });
    if (!(motionRef.current.allowed && motionRef.current.running)) {
      finish();
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = () => {
      const x = Math.min(1, (performance.now() - t0) / SLOW);
      const e = 1 - Math.pow(1 - x, 3);
      tiles.forEach((t, k) => {
        const node = nodes[k];
        if (node && typeof t.value === "number") node.textContent = t.format(t.value * e);
      });
      if (x < 1) raf = requestAnimationFrame(tick);
      else finish();
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      finish();
    };
  }, [view.resultsOpen, view.tiles]);

  const pal = typeof palette === "string" ? BRICK_WALL_LOADER_PALETTES[palette] ?? BRICK_WALL_LOADER_PALETTES.rainbow : palette;
  const chr = typeof character === "string" ? LOADER_CHARACTERS[character] ?? LOADER_CHARACTERS.ember : character;
  const rootStyle = useMemo(
    () => ({ ...paletteVars(pal), ...characterVars(chr), "--bwl-n": String(Math.max(1, steps.length)), ...(colorScheme ? { colorScheme } : null), ...style }) as CSSProperties,
    [pal, chr, steps.length, colorScheme, style],
  );

  /* ------------------------------------------------------ what to show */

  const n = steps.length;
  const settledN = steps.filter(settled).length;
  const phase = view.phase;
  const front = Math.min(view.front, n);
  const fs: LoaderStep | undefined = steps[front];
  const unitLower = lowerFirst(L.unit);

  let hostAt = steps.findIndex((s) => s.status === "active" || s.status === "error");
  if (hostAt < 0) hostAt = steps.findIndex((s) => s.status === "pending");
  let valueText: string;
  if (phase === "stopped") valueText = `Stopped at step ${Math.max(0, hostAt) + 1} of ${n}`;
  else if (n && settledN === n) valueText = n === 1 ? "The step finished" : `All ${n} steps finished`;
  else if (hostAt >= 0 && steps[hostAt].status === "error") valueText = `Step ${hostAt + 1} of ${n}: ${steps[hostAt].label}, failed`;
  else if (hostAt >= 0 && phase !== "idle") valueText = `Step ${hostAt + 1} of ${n}: ${steps[hostAt].label}`;
  else valueText = `Not started, ${n} step${n === 1 ? "" : "s"}`;

  let fillP = 0;
  if (fs) {
    if (fs.status === "done") fillP = 1;
    else if (fs.status === "active" || fs.status === "error") fillP = fs.progress == null && fs.status === "active" ? 0 : view.barP ?? 0;
  }
  const indet = !!fs && fs.status === "active" && fs.progress == null;
  let count = "";
  if (fs) {
    if (fs.status === "pending") count = phase === "idle" ? "Waiting to start" : "Next up";
    else if (fs.status === "skipped") count = "Skipped";
    else if (indet) {
      const secs = Math.floor((fs.elapsedMs ?? 0) / 1000);
      count = `${L.sizeUnknown}${secs >= 10 ? ` · ${secs}s` : ""}`;
    } else if (fs.status === "done") count = fs.detail || "Done";
    else if (view.barDetail) count = view.barDetail;
    else if (view.barP != null) count = `${Math.floor(view.barP * 100)}%`;
  }
  /* The host can mark the front step done a beat before its row breaks. Until the row
     breaks the plate holds what it last showed, so it never says Done over standing bricks. */
  const held = plateHold.current;
  if (fs && fs.status === "done" && phase === "run" && held && held.i === front) {
    fillP = held.fillP;
    count = held.count;
  } else plateHold.current = fs && fs.status !== "done" ? { i: front, fillP, count, indet } : null;
  const holdIndet = !!fs && fs.status === "done" && phase === "run" && !!held && held.i === front && held.indet;
  const showTag = !!fs && (fs.attempt ?? 1) > 1 && (fs.status === "active" || fs.status === "error");

  let metaLead: string;
  let metaTail = "";
  if (phase === "complete") {
    metaLead = L.clear;
    metaTail = `${n} of ${n}`;
  } else if (phase === "stopped") metaLead = `Stopped at ${unitLower} ${Math.min(front + 1, n)} of ${n}`;
  else if (phase === "error") {
    metaLead = `${L.unit} ${Math.min(front + 1, n)} of ${n}`;
    metaTail = L.waiting;
  } else if (phase === "idle") {
    metaLead = "Ready";
    metaTail = `${n} ${unitLower}${n === 1 ? "" : "s"} to clear`;
  } else {
    metaLead = `${L.unit} ${Math.min(front + 1, n)} of ${n}`;
    const next: string[] = [];
    for (let i = front + 1; i < n && next.length < 2; i++) if (!view.gone[i]) next.push(steps[i].label);
    metaTail = next.length === 0 ? `Last ${unitLower}` : next.length === 1 ? `Next: ${next[0]}` : `Next: ${next[0]}, then ${next[1]}`;
  }

  const placeholder = view.lines.length
    ? ""
    : settledN > 0 && fs && phase !== "complete"
      ? L.progress(settledN, n, fs.label)
      : n
        ? L.queued(n, steps[0].label)
        : "";

  const failing = view.errorAt >= 0 ? steps[view.errorAt] : undefined;
  const menu: { cmd: MenuCommand; text: string; sr?: string; primary?: boolean }[] = [];
  if (onRetry) menu.push({ cmd: "retry", text: L.retry, sr: failing?.label, primary: true });
  if (onSkip) menu.push({ cmd: "skip", text: L.skip, sr: failing?.label });
  if (onCancel) menu.push({ cmd: "cancel", text: L.cancel });
  menu.push({ cmd: "details", text: detailsOpen ? L.hideDetails : L.showDetails });
  const current = Math.min(cursor, menu.length - 1);

  const runCommand = (cmd: MenuCommand) => {
    const id = failing?.id;
    if (cmd === "retry" && id != null) onRetry?.(id);
    else if (cmd === "skip" && id != null) onSkip?.(id);
    else if (cmd === "cancel") engineRef.current?.cancel();
    else if (cmd === "details") setDetailsOpen((o) => !o);
  };

  const onMenuKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = { ArrowDown: current + 1, ArrowRight: current + 1, ArrowUp: current - 1, ArrowLeft: current - 1, Home: 0, End: menu.length - 1 };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const next = (moves[event.key] + menu.length) % menu.length;
    setCursor(next);
    menuButtons.current[next]?.focus();
  };

  const slots = 3 + (stats?.length ?? 0);
  const tiles = view.tiles ?? [];
  const panel = phase === "error" ? "error" : view.resultsOpen ? "results" : "log";
  const Heading = `h${headingLevel}` as "h2";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <section
        ref={rootRef}
        aria-labelledby={titleId}
        className={`bz-bwl ${className}`.trim()}
        style={rootStyle}
        data-phase={phase}
        data-panel={panel}
        data-motion={motionAllowed ? "on" : "off"}
        data-running={running ? "true" : "false"}
      >
        <div className="bz-bwl-in">
          <Heading ref={headingRef} id={titleId} tabIndex={-1} className="bz-bwl-title">
            {title}
          </Heading>
          <ol className="bz-bwl-sr" aria-busy={phase === "run" ? "true" : "false"}>
            {steps.map((s) => (
              <li key={s.id} aria-current={s.status === "active" || s.status === "error" ? "step" : undefined}>
                {`${s.label}: ${stateWord(s)}`}
              </li>
            ))}
          </ol>

          <div className="bz-bwl-arena">
            <div ref={fieldRef} className="bz-bwl-field" aria-hidden="true">
              <div ref={wallRef} className="bz-bwl-wall" />
              <div className="bz-bwl-frame" />
              <div ref={tallyRef} className="bz-bwl-tally" />
              <div ref={riderRef} className="bz-bwl-rider">
                <div ref={heroRef} className="bz-bwl-hero">
                  <CharacterSprite hairStyle={chr.hairStyle} prefix="bz-bwl-" />
                </div>
                <PixelSvg map={PADDLE_MAP} prefix="bz-bwl-p-" roles={ARENA_ROLES} scale={U} className="bz-bwl-paddle" />
              </div>
              <div ref={ballRef} className="bz-bwl-ball">
                <PixelSvg map={BALL_MAP} prefix="bz-bwl-p-" roles={ARENA_ROLES} scale={U} />
              </div>
              <div ref={fxRef} className="bz-bwl-fx" />
            </div>
            <div ref={sideRef} className="bz-bwl-side">
              <div
                ref={plateRef}
                className="bz-bwl-plate"
                role="progressbar"
                aria-labelledby={titleId}
                aria-valuemin={0}
                aria-valuemax={Math.max(1, n)}
                aria-valuenow={settledN}
                aria-valuetext={valueText}
                data-state={fs?.status ?? "pending"}
              >
                <span className="bz-bwl-ptr" aria-hidden="true">
                  <PixelSvg map={GLYPHS.pointer} prefix="bz-bwl-g-" roles={GLYPH_ROLES} scale={2} className="bz-bwl-g" />
                </span>
                <div className="bz-bwl-plate-top">
                  <span className="bz-bwl-plate-label">{fs?.label ?? ""}</span>
                  {showTag ? <span className="bz-bwl-tag">{L.attempt(fs?.attempt ?? 2)}</span> : null}
                  {fs?.status === "error" ? (
                    <span className="bz-bwl-failed">
                      <PixelSvg map={GLYPHS.cross} prefix="bz-bwl-g-" roles={GLYPH_ROLES} scale={2} className="bz-bwl-g" />
                      {L.failed}
                    </span>
                  ) : null}
                </div>
                <div className="bz-bwl-plate-row">
                  <span className="bz-bwl-bar" data-indet={indet || holdIndet ? "true" : "false"}>
                    <span className="bz-bwl-fill" style={{ width: `${Math.round(fillP * 1000) / 10}%` }} />
                    <span className="bz-bwl-hatch" />
                  </span>
                  <span className="bz-bwl-count">{count}</span>
                </div>
              </div>
              <div className="bz-bwl-banner" aria-hidden="true">
                <span className="bz-bwl-banner-in">
                  {L.clear}
                  <span className="bz-bwl-banner-rule" />
                </span>
              </div>
            </div>
          </div>

          <div className="bz-bwl-box">
            <div className="bz-bwl-box-in">
              <div className="bz-bwl-panels">
                <div className="bz-bwl-panel" data-panel="log">
                  <div ref={logRef} className="bz-bwl-log" role="log" aria-label={L.narration} tabIndex={0}>
                    {view.lines.map((line) => (
                      <p key={line.key} className="bz-bwl-line" data-kind={line.kind}>
                        <PixelSvg map={GLYPHS[line.kind]} prefix="bz-bwl-g-" roles={GLYPH_ROLES} scale={2} className="bz-bwl-g" />
                        <span>{line.text}</span>
                      </p>
                    ))}
                  </div>
                  {placeholder ? (
                    <p className="bz-bwl-ph" aria-hidden="true">
                      {placeholder}
                    </p>
                  ) : null}
                </div>

                <div className="bz-bwl-panel bz-bwl-err" data-panel="error" data-details={detailsOpen ? "true" : "false"}>
                  <div className="bz-bwl-alert" role="alert">
                    {view.alert ? (
                      <>
                        <PixelSvg map={GLYPHS.cross} prefix="bz-bwl-g-" roles={GLYPH_ROLES} scale={2} className="bz-bwl-g" />
                        <span ref={alertTextRef}>{view.alert}</span>
                      </>
                    ) : null}
                  </div>
                  <div ref={menuRef} className="bz-bwl-menu" role="group" aria-label={L.menu} onKeyDown={onMenuKey}>
                    {menu.map((item, k) => (
                      <button
                        key={item.cmd}
                        ref={(node) => {
                          menuButtons.current[k] = node;
                        }}
                        type="button"
                        className={`bz-bwl-btn${item.primary ? " bz-bwl-primary" : ""}`}
                        tabIndex={k === current ? 0 : -1}
                        data-current={k === current ? "true" : "false"}
                        aria-expanded={item.cmd === "details" ? detailsOpen : undefined}
                        aria-controls={item.cmd === "details" ? detailsId : undefined}
                        onFocus={() => setCursor(k)}
                        onClick={() => runCommand(item.cmd)}
                      >
                        <PixelSvg map={GLYPHS.cursor} prefix="bz-bwl-g-" roles={GLYPH_ROLES} scale={2} className="bz-bwl-g bz-bwl-cur" />
                        {item.text}
                        {item.sr ? <span className="bz-bwl-sr"> {item.sr}</span> : null}
                      </button>
                    ))}
                  </div>
                  <div
                    ref={detailsRef}
                    id={detailsId}
                    className="bz-bwl-details"
                    data-open={detailsOpen ? "true" : "false"}
                    role={detailsOpen && overflow.details ? "region" : undefined}
                    aria-label={detailsOpen && overflow.details ? L.details : undefined}
                    tabIndex={detailsOpen && overflow.details ? 0 : undefined}
                  >
                    {(overflow.alert && view.alert ? [view.alert, ...view.details] : view.details).map((d, k) => (
                      <span key={k}>{d}</span>
                    ))}
                  </div>
                </div>

                <div className="bz-bwl-panel" data-panel="results">
                  <p className="bz-bwl-final">
                    <PixelSvg map={GLYPHS.finish} prefix="bz-bwl-g-" roles={GLYPH_ROLES} scale={2} className="bz-bwl-g" />
                    <span>{view.completion || L.complete(n, 0)}</span>
                  </p>
                  <dl className="bz-bwl-stats">
                    {Array.from({ length: Math.max(slots, tiles.length) }, (_, k) => {
                      const t = tiles[k];
                      return (
                        <div key={k} className="bz-bwl-stat" data-empty={t ? "false" : "true"} aria-hidden={t ? undefined : "true"}>
                          <dt>{t ? t.label : "Steps"}</dt>
                          <dd>
                            <span
                              ref={(node) => {
                                numRefs.current[k] = node;
                              }}
                              className="bz-bwl-num"
                              aria-hidden="true"
                            >
                              {t ? tileText(t) : "0"}
                            </span>
                            <span className="bz-bwl-sr">{t ? tileText(t) : ""}</span>
                            <span className="bz-bwl-sub">{t ? t.sub : ""}</span>
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>
              </div>

              <div className="bz-bwl-foot">
                <p className="bz-bwl-meta" aria-hidden="true">
                  {view.meta ? (
                    <>
                      <PixelSvg map={GLYPHS.clock} prefix="bz-bwl-g-" roles={GLYPH_ROLES} scale={2} className="bz-bwl-g" />
                      {view.meta}
                    </>
                  ) : (
                    <>
                      <b>{metaLead}</b>
                      {metaTail ? ` · ${metaTail}` : ""}
                    </>
                  )}
                </p>
                <div className="bz-bwl-toys">
                  <button
                    type="button"
                    className="bz-bwl-btn bz-bwl-toy"
                    aria-pressed={userPaused}
                    data-hidden={reduced ? "true" : "false"}
                    onClick={() => setUserPaused((p) => !p)}
                  >
                    <PixelSvg map={GLYPHS.pause} prefix="bz-bwl-g-" roles={GLYPH_ROLES} scale={2} className="bz-bwl-g" />
                    {L.pauseMotion}
                  </button>
                  {onContinue ? (
                    <button
                      ref={continueRef}
                      type="button"
                      className="bz-bwl-btn bz-bwl-primary bz-bwl-cont"
                      data-shown={view.resultsOpen ? "true" : "false"}
                      onClick={() => onContinue()}
                    >
                      {L.continue}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
