"use client";

import {
  memo,
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
 * FlapGateLoader: a multi-step loader drawn as a Flappy-style flight, where a
 * jetpack pilot clears one pipe gate per step.
 *
 * Every step is a pipe pair with a gap, and distance is progress. The pipes
 * sit on one world strip that moves only when the host reports something
 * real: each progress event is one flap (a short flame burst and a 6px rise)
 * and the gate closes in by exactly that much; a finished step flies the
 * pilot out through the gap and lines it up with the next one. The big score
 * at the top is the number of steps done. A skipped gate retracts and leaves
 * dashed ghosts, and the last gate carries a flag.
 *
 * Honesty: geometry moves only on host events. The world strip and the bar
 * land exactly on steps[front].progress, at most once every 400ms, and nothing
 * interpolates between events on a timer. A step of unknown size (progress
 * left out) keeps the world still, hatches the front pipe and says "Working,
 * size unknown". The picture may lag the host by one short beat and is never
 * ahead of it.
 *
 * The host owns the run. `steps` is the only state: the loader never
 * advances, completes, fails, retries or skips a step. When a step fails, the
 * dialogue box turns into a menu that calls onRetry, onSkip or onCancel, and
 * the host decides what happens next by sending new steps.
 *
 * Accessibility: the nameplate is the one progressbar, named by the heading.
 * The dialogue box is a role="log" that narrates milestones in sentences
 * (never every percent), a role="alert" carries the error, and a visually
 * hidden list mirrors every step with aria-current on the running one. The
 * menu is one tab stop with arrow keys, Home and End. Focus moves only when it
 * is already inside the loader: to Retry when an error appears, to the
 * narration when a retry starts, and to Continue when the results open.
 *
 * Motion: reduced motion (the media query, or the reducedMotion prop) and the
 * Pause motion button drop every loop, flap and glide. Positions snap to
 * their honest place and the pilot lands hurt on the ground at once after an
 * error.
 * Off screen or in a hidden tab, loops hold still and queued beats resolve
 * without playing; on return the meta line says what finished meanwhile.
 */

/* ---------------- shared: types and labels ---------------- */

/** Where a step is. Only the host changes it; the loader shows it. */
export type LoaderStepStatus = "pending" | "active" | "done" | "error" | "skipped";

export type LoaderStep = {
  /** Stable key. Beats and announcements key on it; a changed id list or length rebuilds the run. */
  id: string;
  /** Present tense, shown on the nameplate and in narration: "Import 1,240 contacts". */
  label: string;
  /** Where the step is. Only the host moves it. */
  status: LoaderStepStatus;
  /** 0 to 1, from real host events only. Leave it out (or null) when the size of the work is unknown. */
  progress?: number | null;
  /** A real count shown on the nameplate and never announced: "620 of 1,240 contacts". */
  detail?: string;
  /** Total units of work. Brick Wall draws one brick per unit when this is 16 or fewer; the other games ignore it. */
  count?: number;
  /** Past-tense narration: "Imported 1,240 contacts". Defaults to "<label>: done". */
  doneText?: string;
  /** A plain sentence, shown and sent to role="alert" when the status is "error". */
  error?: string;
  /** Longer text behind Show details. */
  errorDetail?: string;
  /** 1-based. 2 or more shows "Attempt 2", and a step that then finishes counts as a recovered hiccup. */
  attempt?: number;
  /** Host clock for the running or failed attempt, in ms. */
  elapsedMs?: number;
  /** Host clock for a finished step, in ms. The results Time tile is the sum. */
  durationMs?: number;
};

/** One extra tile on the results screen. Real numbers only. */
export type LoaderStat = {
  /** Tile heading: "Contacts". */
  label: string;
  /** The value shown large. A number counts up when motion is on; a string shows as written. */
  value: string | number;
  /** A short line under the value: "imported". */
  sub?: string;
};

/**
 * The interface strings: buttons, nameplate words, the meta line and the
 * run-level sentences. Pass any subset through `labels`. Per-step narration,
 * the error sentence and the results tile names are English, built around
 * each step's own label, doneText and error.
 */
export type LoaderLabels = {
  /** What one step is called on the meta line. Default set per game ("Gate" here). */
  unit: string;
  /** The banner and meta line once every step is settled. Default set per game ("All gates cleared" here). */
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
  /** The motion toggle. Default "Pause motion". */
  pauseMotion: string;
  /** The results button. Default "Continue". */
  continue: string;
  /** The mark on a failed nameplate. Default "Failed". */
  failed: string;
  /** Meta line while the menu waits for a choice. Default "Waiting for you". */
  waiting: string;
  /** Nameplate text for a step without progress. Default "Working, size unknown". */
  sizeUnknown: string;
  /** Nameplate tag on a retried step. Default "Attempt 2". */
  attempt: (n: number) => string;
  /** Placeholder before anything has happened. Default "5 steps queued. Up first: Create the workspace." */
  queued: (n: number, first: string) => string;
  /** Placeholder when mounted mid-run, never announced. Default "1 of 5 done. Now: Import 1,240 contacts." */
  progress: (done: number, total: number, now: string) => string;
  /** Meta note after a hidden tab, never announced. Default "While you were away: 2 steps finished." */
  away: (n: number) => string;
  /** Completion line. Default "All 5 steps finished." or "All 5 steps finished (1 skipped)." */
  complete: (total: number, skipped: number) => string;
  /** Line after Cancel. Default "Stopped. 2 finished steps are kept." */
  stopped: (kept: number) => string;
};

const LOADER_LABELS: Omit<LoaderLabels, "unit" | "clear"> = {
  narration: "Narration",
  menu: "What next",
  retry: "Retry",
  skip: "Skip",
  cancel: "Cancel",
  showDetails: "Show details",
  hideDetails: "Hide details",
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

/* ---------------- flap gate: palettes ---------------- */

/** Scene colours for one theme. Every value is a hex string. */
export type FlapGateLoaderColors = {
  /** Sky behind everything. */
  sky: string;
  /** The static clouds low on the horizon. */
  cloud: string;
  /** Pipe body. */
  pipe: string;
  /** Pipe shade, on the right of each pipe. */
  pipeShade: string;
  /** Pipe highlight, on the left of each pipe. In the dark set it also draws the ghost of a skipped gate. */
  pipeLight: string;
  /** Pipe outline and the size-unknown hatch. In the light set it also draws the ghost of a skipped gate. */
  pipeLine: string;
  /** Ground fill. */
  ground: string;
  /** Diagonal stripes in the ground. */
  groundStripe: string;
  /** Grass band on top of the ground. */
  grass: string;
  /** Ground edges. */
  groundLine: string;
  /** Jetpack tank. */
  jetpack: string;
  /** Jetpack shade and the smoke puff after a failure. */
  jetpackShade: string;
  /** Jetpack flame. */
  flame: string;
  /** Flame core and the sparks of a bonk. */
  flameCore: string;
  /** Score digits and the checkered lips of the last gate. */
  score: string;
  /** Score outline and spark outline. */
  scoreLine: string;
  /** The character's outline. Dark enough to carry the silhouette on a light sky. */
  spriteOutline: string;
  /** A one art pixel rim round the character, so the silhouette still reads on a dark sky. Leave it out for none; the presets set it on their dark skies only. */
  spriteHalo?: string;
  /** Primary buttons, the nameplate bar, the Attempt tag and the flag. */
  accent: string;
  /** Text on accent: white on light themes, ink on dark ones. */
  onAccent: string;
};

/** A colour set for each theme; `light-dark()` picks one from the host's color-scheme. */
export type FlapGateLoaderPalette = { light: FlapGateLoaderColors; dark: FlapGateLoaderColors };

export type FlapGateLoaderPaletteName = "daybreak" | "sunset";

/** The presets. Spread one to customise it: `{ ...FLAP_GATE_LOADER_PALETTES.sunset, dark: {...} }`. */
export const FLAP_GATE_LOADER_PALETTES: Record<FlapGateLoaderPaletteName, FlapGateLoaderPalette> = {
  daybreak: {
    light: {
      sky: "#7fd0f0", cloud: "#ffffff", pipe: "#3cb043", pipeShade: "#23812b", pipeLight: "#a6e8a0", pipeLine: "#13461a",
      ground: "#ded895", groundStripe: "#c9b26b", grass: "#7ac943", groundLine: "#13461a",
      jetpack: "#9aa5b1", jetpackShade: "#5f6b78", flame: "#ff7a1a", flameCore: "#ffd23f",
      score: "#ffffff", scoreLine: "#17142e", spriteOutline: "#17142e", accent: "#15803d", onAccent: "#ffffff",
    },
    dark: {
      sky: "#132a4f", cloud: "#24406f", pipe: "#4cc153", pipeShade: "#2e8a36", pipeLight: "#a6e8a0", pipeLine: "#0b2a10",
      ground: "#c9a85a", groundStripe: "#a3843f", grass: "#3fa34d", groundLine: "#e9d9a0",
      jetpack: "#b8c2cc", jetpackShade: "#6f7b88", flame: "#ff8c3a", flameCore: "#ffe066",
      score: "#ffffff", scoreLine: "#0b0918", spriteOutline: "#0b0918", spriteHalo: "#7fa6d6", accent: "#86efac", onAccent: "#0a0a0a",
    },
  },
  sunset: {
    light: {
      sky: "#ffd2a8", cloud: "#fff1e0", pipe: "#1fa39a", pipeShade: "#137a73", pipeLight: "#8ee6dd", pipeLine: "#0b4f4a",
      ground: "#f0b46a", groundStripe: "#d9924a", grass: "#e8590c", groundLine: "#5a2a08",
      jetpack: "#9aa5b1", jetpackShade: "#5f6b78", flame: "#ff5d8f", flameCore: "#ffd23f",
      score: "#ffffff", scoreLine: "#17142e", spriteOutline: "#17142e", accent: "#be185d", onAccent: "#ffffff",
    },
    dark: {
      sky: "#3a1d4f", cloud: "#57306f", pipe: "#2ec4b6", pipeShade: "#1a8a80", pipeLight: "#8ee6dd", pipeLine: "#082e2b",
      ground: "#b5653a", groundStripe: "#8f4a26", grass: "#f08c4a", groundLine: "#f4c08a",
      jetpack: "#b8c2cc", jetpackShade: "#6f7b88", flame: "#ff8fb1", flameCore: "#ffe066",
      score: "#ffffff", scoreLine: "#0b0918", spriteOutline: "#0b0918", spriteHalo: "#c48fd6", accent: "#f9a8d4", onAccent: "#0a0a0a",
    },
  },
};

/* The halo is optional, so it is set apart from the keys every palette has. */
const FGL_COLOR_KEYS = Object.keys(FLAP_GATE_LOADER_PALETTES.daybreak.light) as Exclude<keyof FlapGateLoaderColors, "spriteHalo">[];

/* ---------------- flap gate: props ---------------- */

export type FlapGateLoaderProps = {
  /** The run, and the only state. The loader never changes it; send a new array on every host event. */
  steps: LoaderStep[];
  /** The heading, which also names the progressbar: "Setting up your workspace". */
  title: string;
  /** Heading level for the title. Default 2. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** A preset name or your own colours for light and dark. Default "daybreak". */
  palette?: FlapGateLoaderPaletteName | FlapGateLoaderPalette;
  /** The pilot: "ember", "tide", "moss", "plum" or your own colours. Default "ember". */
  character?: LoaderCharacterName | LoaderCharacter;
  /** Force a theme. Default: inherit the host's color-scheme. */
  colorScheme?: "light" | "dark";
  /** Override any visible or announced string. */
  labels?: Partial<LoaderLabels>;
  /** Extra results tiles, real numbers only. */
  stats?: LoaderStat[];
  /** Appended to the completion line: "Your workspace is ready." */
  completeText?: string;
  /** Called with the failed step's id. Without it there is no Retry button. */
  onRetry?: (id: string) => void;
  /** Called with the failed step's id. Without it there is no Skip button. */
  onSkip?: (id: string) => void;
  /** Called after the loader has stopped. Without it there is no Cancel button. */
  onCancel?: () => void;
  /** With it, the results screen shows Continue, which calls it. */
  onContinue?: () => void;
  /** Called once per run, after the finale's last beat. */
  onComplete?: () => void;
  /** Mirrors everything the log and the alert say, for your own logging or tests. */
  onAnnounce?: (text: string, politeness: "polite" | "assertive") => void;
  /** Force reduced motion on or off. Default: follow prefers-reduced-motion, live. */
  reducedMotion?: boolean;
  /** Extra classes on the root section. */
  className?: string;
  /** Inline styles on the root section, applied after the palette and character variables. */
  style?: CSSProperties;
};

/* ---------------- shared: timing constants and helpers ---------------- */

const FAST = 150;
const BASE = 300;
const SLOW = 500;
const BEAT = 2400;
/** At most one progress hit per 400ms; increments in between merge into the next hit. */
const HIT_GAP = 400;
/** A finishing blow lands this long after its beat starts. */
const IMPACT = 100;
/** Completions this close together share a beat. */
const COLLECT = 100;
/** A step holds the front for at least this long. */
const DWELL = 300;
/** This many queued completions become one burst beat. */
const BURST_MIN = 3;
/** Completions this close share one sentence and one announcement. */
const COALESCE = 400;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);
const easeIn = (t: number) => t * t;
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const now = () => performance.now();
const settled = (s: LoaderStep | undefined) => !!s && (s.status === "done" || s.status === "skipped");
const lowerFirst = (s: string) => (s && s.length > 1 && s[1] === s[1].toLowerCase() ? s[0].toLowerCase() + s.slice(1) : s || "");
const listJoin = (a: string[]) => (a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);
const fmtNum = (n: number) => Math.round(n).toLocaleString("en-US");

/** 0.9s, 12s, 1m 05s. */
function fmtDur(ms: number | undefined | null): string {
  if (ms == null || !isFinite(ms)) return "";
  if (ms < 950) return `${(Math.max(1, Math.round(ms / 100)) / 10).toFixed(1)}s`;
  if (ms < 9950) return `${(Math.round(ms / 100) / 10).toFixed(1)}s`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}

/** A text map to one path per colour key, horizontal runs merged, in map pixels. */
function pixelPaths(map: string[]): [string, string][] {
  const paths = new Map<string, string>();
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
      paths.set(c, `${paths.get(c) ?? ""}M${x} ${y}h${x2 - x}v1h${x - x2}z`);
      x = x2;
    }
  });
  return [...paths];
}

/** Whole-pixel travel: keyframes sampled from an ease curve, each held with step-end. */
function glideFrames(from: number[], to: number[], dur: number, ease: (t: number) => number, fmt: (v: number[]) => string, hold = 0) {
  const total = dur + hold;
  const n = Math.max(2, Math.round(dur / 16));
  const frames: Keyframe[] = [{ offset: 0, easing: "step-end", transform: fmt(from) }];
  for (let k = 1; k <= n; k++) {
    const e = ease(k / n);
    frames.push({ offset: (hold + (k / n) * dur) / total, easing: "step-end", transform: fmt(from.map((f, j) => Math.round(f + (to[j] - f) * e))) });
  }
  return { frames, duration: total };
}

/** Held translate points: [offset, x, y, opacity?]. */
function steppedFrames(points: [number, number, number, number?][]): Keyframe[] {
  return points.map(([offset, x, y, o]) => ({
    offset,
    easing: "step-end",
    transform: `translate(${Math.round(x)}px, ${Math.round(y)}px)`,
    ...(o == null ? {} : { opacity: o }),
  }));
}

/** The translate a node shows right now, mid-animation included. */
function readXY(node: HTMLElement): number[] {
  const t = getComputedStyle(node).transform;
  const m = t && t !== "none" ? t.match(/matrix(3d)?\(([^)]+)\)/) : null;
  if (!m) return [0, 0];
  const v = m[2].split(",").map(parseFloat);
  return m[1] ? [v[12], v[13]] : [v[4], v[5]];
}

const GLYPHS: Record<string, string[]> = {
  done: [".......", "......#", ".....##", "#...##.", "##.##..", ".###...", "..#...."],
  skipped: [".......", ".......", ".......", "#######", "#######", ".......", "......."],
  retry: ["..###.#", ".#...##", "#...###", "#......", "#.....#", ".#...#.", "..###.."],
  finish: ["...#...", "...#...", "#######", ".#####.", "..###..", ".##.##.", "##...##"],
  stop: [".......", ".#####.", ".#####.", ".#####.", ".#####.", ".#####.", "......."],
  cross: ["##...##", "###.###", ".#####.", "..###..", ".#####.", "###.###", "##...##"],
  pause: [".......", ".##.##.", ".##.##.", ".##.##.", ".##.##.", ".##.##.", "......."],
  cursor: ["#...", "##..", "###.", "####", "###.", "##..", "#..."],
  clock: ["..###..", ".#...#.", "#..#..#", "#..##.#", "#.....#", ".#...#.", "..###.."],
};
const GLYPH_PATHS: Record<string, string> = Object.fromEntries(Object.entries(GLYPHS).map(([k, m]) => [k, pixelPaths(m)[0]?.[1] ?? ""]));

/** A pixel glyph in currentColor. Decorative: the words beside it carry the meaning. */
function Glyph({ name }: { name: string }) {
  const map = GLYPHS[name] ?? GLYPHS.done;
  return (
    <svg className="bz-fgl-g" data-g={name} viewBox={`0 0 ${map[0].length} ${map.length}`} shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <path className="bz-fgl-gp" d={GLYPH_PATHS[name] ?? GLYPH_PATHS.done} />
    </svg>
  );
}

/* ---------------- end shared: timing constants and helpers ---------------- */

/* ---------------- shared: character ---------------- */

export type LoaderCharacterName = "ember" | "tide" | "moss" | "plum";

/** A pilot's colours. Every value is a hex string; the outline comes from the game palette. */
export type LoaderCharacter = {
  /** Which head to draw: "puffs", "ponytail", "short" or "wrap" (a head scarf in hair and hairShade). */
  hairStyle: "puffs" | "ponytail" | "short" | "wrap";
  /** Skin. */
  skin: string;
  /** Skin shade: the far cheek, the jaw and the ear. */
  skinShade: string;
  /** Hair, or the wrap fabric. */
  hair: string;
  /** Hair shade. Darker than hair: under the fringe, on the far side and at the nape. */
  hairShade: string;
  /** Tunic. */
  outfit: string;
  /** Tunic shade, on the right of the body. */
  outfitShade: string;
  /** Tunic highlight: the left column and the near sleeve. */
  outfitLight: string;
  /** Scarf, belt buckle, hair tie and wrap band. */
  accent: string;
  /** Trousers, the near leg. */
  pants: string;
  /** Trousers shade, the far leg. */
  pantsShade: string;
  /** Boots and belt leather. */
  boots: string;
  /** Boot shade. */
  bootsShade: string;
  /** Eye white. Default "#ffffff". */
  eyeWhite?: string;
  /** Pupils and mouth. Default "#1b1630". */
  eye?: string;
};

/** Four bright, inclusive pilots: four skin tones, four hair styles, four outfit hues. */
export const LOADER_CHARACTERS: Record<LoaderCharacterName, LoaderCharacter> = {
  ember: { hairStyle: "puffs", skin: "#8d5524", skinShade: "#6b3d18", hair: "#4a3128", hairShade: "#2a1b15", outfit: "#ff5a36", outfitShade: "#c43d20", outfitLight: "#ff9a7a", accent: "#ffd23f", pants: "#3f64b5", pantsShade: "#2b4a8a", boots: "#5b3a1e", bootsShade: "#3d2614" },
  tide: { hairStyle: "ponytail", skin: "#f3c7a5", skinShade: "#d9a07c", hair: "#e0702c", hairShade: "#a84e1a", outfit: "#3d8bfd", outfitShade: "#2563c9", outfitLight: "#8cbcff", accent: "#ff6fa5", pants: "#e6d3a3", pantsShade: "#c2a970", boots: "#7a4a28", bootsShade: "#55331b" },
  moss: { hairStyle: "short", skin: "#c68e5f", skinShade: "#a06c42", hair: "#4f4760", hairShade: "#2e2838", outfit: "#3fbf5a", outfitShade: "#2a8a3f", outfitLight: "#8fe39f", accent: "#ff9f1c", pants: "#8b5e34", pantsShade: "#6b4526", boots: "#2f2a3a", bootsShade: "#1f1b27" },
  plum: { hairStyle: "wrap", skin: "#a8693f", skinShade: "#82502c", hair: "#e0457b", hairShade: "#b02f5e", outfit: "#a06cf0", outfitShade: "#7a4bc4", outfitLight: "#c9a8ff", accent: "#2ec4b6", pants: "#4a5a8c", pantsShade: "#36426a", boots: "#8a5a2b", bootsShade: "#62401e" },
};

/*
 * The art: 16 x 24 art pixels, facing right, feet on row 23, a 1px outline all
 * round, light from the top left. Keys: o outline, h hair, H hair shade, s skin,
 * S skin shade, w eye white, e pupil, m mouth, c outfit, C outfit shade,
 * l outfit light, a accent, p trousers, P trousers shade, b boots, B boot shade.
 * A frame is a 16 x 11 head (with a face patch) placed at a per-frame offset,
 * under a body anchored to the bottom row. The pilot's set has six frames:
 * fly1 and fly2 (knees tucked, the two beats of the flight loop), hurt
 * (knocked back, squinting, held while a step has failed), sit (resting on the
 * ground after a stop), and celebrate1 and celebrate2 (a fist pump at the
 * finish). The other game loaders share this character with poses of their own.
 */
type LoaderHairStyle = LoaderCharacter["hairStyle"];
type LoaderEyes = "open" | "blink" | "squint" | "happy";
type LoaderPose = "hurt" | "sit" | "celebrate1" | "celebrate2" | "fly1" | "fly2";
type LoaderFrameName = "hurt" | "sit" | "celebrate1" | "celebrate2" | "fly1" | "fly2";
type LoaderAccessory = { x: number; y: number; rows: string[] };
type LoaderAccessories = { under?: LoaderAccessory[]; over?: LoaderAccessory[] };
type LoaderSpriteLayer = { name: string; x: number; y: number; rows: string[] };

const LOADER_W = 16;
const LOADER_H = 24;

const LOADER_HEADS: Record<LoaderHairStyle, string[]> = {
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

/* Face patches over cols 7 to 13, rows 6 to 9 of a head. "_" keeps the head pixel. */
const LOADER_FACES: Record<LoaderEyes, string[]> = {
  open: ["_we_we_", "_we_we_", "_______", "____m__"],
  blink: ["_______", "_ee_ee_", "_______", "____m__"],
  squint: ["_e___e_", "__e_e__", "_e___e_", "___mm__"],
  happy: ["_e___e_", "e_e_e_e", "_______", "___mm__"],
};

const LOADER_BODIES: Record<LoaderPose, string[]> = {
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
  fly1: [
    "....oaaaaaaaao..",
    "....oClcccColco.",
    "....oClcccColcso",
    "....oClcccCCoooo",
    "....oSbbabbbo...",
    "....oolcccCCooo.",
    ".....opppppppPo.",
    ".....oPPPPopppo.",
    "......oooo.obbo.",
    "...........obbBo",
    "...........ooooo",
    "................",
    "................",
  ],
  fly2: [
    "....oaaaaaaaao..",
    "....oClcccColco.",
    "....oClcccColcso",
    "....oClcccCCoooo",
    "....oSbbabbbo...",
    "....oolcccCCoo..",
    ".....opppppPPo..",
    ".....oPPPoppPo..",
    "......ooo.obbo..",
    "..........obbBo.",
    "..........ooooo.",
    "................",
    "................",
  ],
};

const LOADER_FRAMES: Record<LoaderFrameName, { body: LoaderPose; eyes: LoaderEyes; dx: number; dy: number }> = {
  hurt: { body: "hurt", eyes: "squint", dx: -1, dy: 1 },
  sit: { body: "sit", eyes: "blink", dx: -1, dy: 6 },
  celebrate1: { body: "celebrate1", eyes: "happy", dx: -1, dy: 0 },
  celebrate2: { body: "celebrate2", eyes: "happy", dx: -1, dy: 1 },
  fly1: { body: "fly1", eyes: "open", dx: 1, dy: 0 },
  fly2: { body: "fly2", eyes: "open", dx: 1, dy: 0 },
};

/** Colour key to the role used in class names: bz-fgl-c-hair, bz-fgl-c-outfit-light. */
const LOADER_ROLES: Record<string, string> = {
  o: "outline", h: "hair", H: "hair-shade", s: "skin", S: "skin-shade", w: "eye-white", e: "eye", m: "mouth",
  c: "outfit", C: "outfit-shade", l: "outfit-light", a: "accent", p: "pants", P: "pants-shade", b: "boots", B: "boots-shade",
  j: "jetpack", J: "jetpack-shade", f: "flame", F: "flame-core", k: "wood", K: "wood-shade",
};
const LOADER_BODY_KEYS = "hHsSwemcClapPbB";

/** One frame as a text map: accessories under, head, body, accessories over. */
function composeLoaderFrame(style: LoaderHairStyle, name: LoaderFrameName, acc: LoaderAccessories = {}): string[] {
  const f = LOADER_FRAMES[name];
  const grid: string[][] = Array.from({ length: LOADER_H }, () => Array(LOADER_W).fill("."));
  const put = (a: LoaderAccessory) => {
    a.rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const gx = a.x + x;
        const gy = a.y + y;
        if (row[x] !== "." && gx >= 0 && gx < LOADER_W && gy >= 0 && gy < LOADER_H) grid[gy][gx] = row[x];
      }
    });
  };
  const head = LOADER_HEADS[style].map((r) => r.split(""));
  LOADER_FACES[f.eyes].forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] !== "_") head[6 + y][7 + x] = row[x];
  });
  acc.under?.forEach(put);
  put({ x: f.dx, y: f.dy, rows: head.map((r) => r.join("")) });
  const body = LOADER_BODIES[f.body];
  put({ x: 0, y: LOADER_H - body.length, rows: body });
  acc.over?.forEach(put);
  // A body pixel clipped at the box edge keeps a clean edge: it becomes outline.
  for (let y = 0; y < LOADER_H; y++) {
    for (const x of [0, LOADER_W - 1]) if (LOADER_BODY_KEYS.includes(grid[y][x])) grid[y][x] = "o";
  }
  return grid.map((r) => r.join(""));
}

/** The character's colours as custom properties, the same in light and dark. */
function loaderCharacterVars(ch: LoaderCharacter): Record<string, string> {
  return {
    "--chr-hair": ch.hair, "--chr-hair-shade": ch.hairShade, "--chr-skin": ch.skin, "--chr-skin-shade": ch.skinShade,
    "--chr-eye-white": ch.eyeWhite ?? "#ffffff", "--chr-eye": ch.eye ?? "#1b1630",
    "--chr-outfit": ch.outfit, "--chr-outfit-shade": ch.outfitShade, "--chr-outfit-light": ch.outfitLight, "--chr-accent": ch.accent,
    "--chr-pants": ch.pants, "--chr-pants-shade": ch.pantsShade, "--chr-boots": ch.boots, "--chr-boots-shade": ch.bootsShade,
  };
}

const loaderFrameCache = new Map<string, [string, string][]>();

/** Paths for one frame, cached by hair style, frame and accessory set. */
function loaderFramePaths(style: LoaderHairStyle, name: LoaderFrameName, accKey: string, acc?: (f: LoaderFrameName) => LoaderAccessories) {
  const key = `${style}|${name}|${accKey}`;
  let paths = loaderFrameCache.get(key);
  if (!paths) {
    paths = pixelPaths(composeLoaderFrame(style, name, acc?.(name)));
    loaderFrameCache.set(key, paths);
  }
  return paths;
}

/**
 * Every frame the game uses, in one svg. CSS shows one through the parent's
 * data-frame (or two, alternating, through data-loop), so a pose change is an
 * attribute change and never a React render.
 */
const CharacterSprite = memo(function CharacterSprite({
  hairStyle,
  frames,
  accessories,
  accessoriesKey = "",
  layers = [],
}: {
  hairStyle: LoaderHairStyle;
  frames: LoaderFrameName[];
  accessories?: (f: LoaderFrameName) => LoaderAccessories;
  accessoriesKey?: string;
  layers?: LoaderSpriteLayer[];
}) {
  const groups = useMemo(
    () => frames.map((f) => [f, loaderFramePaths(hairStyle, f, accessoriesKey, accessories)] as const),
    [hairStyle, frames, accessories, accessoriesKey],
  );
  return (
    <svg viewBox={`0 0 ${LOADER_W} ${LOADER_H}`} shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      {groups.map(([f, paths]) => (
        <g key={f} data-f={f}>
          {paths.map(([k, d]) => (
            <path key={k} className={`bz-fgl-c-${LOADER_ROLES[k] ?? k}`} d={d} />
          ))}
        </g>
      ))}
      {layers.map((layer) => (
        <g key={layer.name} data-l={layer.name}>
          {pixelPaths(layer.rows.map((r) => `${".".repeat(layer.x)}${r}`)).map(([k, d]) => (
            <path key={k} className={`bz-fgl-c-${LOADER_ROLES[k] ?? k}`} d={d} transform={`translate(0 ${layer.y})`} />
          ))}
        </g>
      ))}
    </svg>
  );
});

/* ---------------- end shared: character ---------------- */

/* ---------------- shared: engine ---------------- */

type LoaderPhase = "idle" | "run" | "error" | "complete" | "stopped";
type LoaderLineKind = "done" | "skipped" | "retry" | "finish" | "stop";
type LoaderLine = { key: number; kind: LoaderLineKind; text: string };
type LoaderTile = { label: string; text: string; sub: string; to: number | null; fmt: (v: number) => string };
type LoaderEntry = { i: number; kind: "done" | "skipped"; at: number; said?: boolean };
type LoaderMotion = { reduced: boolean; paused: boolean; onscreen: boolean; visible: boolean };

/** What React renders from. The engine changes it only through emit(). */
type LoaderView = {
  run: number;
  phase: LoaderPhase;
  front: number;
  barP: number | null;
  barDetail: string | null;
  lines: LoaderLine[];
  intro: string;
  alert: string;
  errorAt: number;
  details: string;
  detailsOpen: boolean;
  menu: number;
  tiles: LoaderTile[];
  counts: string[];
  finishText: string;
  resultsOpen: boolean;
  banner: boolean;
  continueOn: boolean;
  note: string | null;
  focus: { to: "retry" | "log" | "continue"; n: number } | null;
};

type LoaderHost = {
  completeText?: string;
  stats?: LoaderStat[];
  onComplete?: () => void;
  onCancel?: () => void;
  onAnnounce?: (text: string, politeness: "polite" | "assertive") => void;
};

type LoaderIO = {
  labels: () => LoaderLabels;
  host: () => LoaderHost;
  emit: (patch: Partial<LoaderView>) => void;
  /** Focus is somewhere inside the loader. */
  focusInside: () => boolean;
  /** Focus is inside the error panel. */
  focusInError: () => boolean;
  root: () => HTMLElement | null;
  resized: () => void;
};

/** What the engine shares with a game's arena. */
type LoaderCore = {
  host: LoaderStep[];
  /** Per step: true once its beat has landed on screen. */
  vis: boolean[];
  /** The step at the front of the arena (may lag the host by one beat, never ahead). */
  front: number;
  phase: LoaderPhase;
  /** Front progress as the picture shows it: changes only on a hit. */
  barP: number | null;
  /** Not reduced and not paused. */
  motionAllowed: () => boolean;
  /** On screen and in a visible tab. */
  running: () => boolean;
  motionOn: () => boolean;
  later: (fn: () => void, ms: number) => number;
  clear: (id: number) => number;
  anim: (node: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) => Animation;
};

/** A game's arena: imperative, aria-hidden, driven by the engine. */
type LoaderArena = {
  build: () => void;
  layout: () => void;
  sync: () => void;
  hit: (showy: boolean) => void;
  /** A beat starts; returns the ms until it lands. */
  beat: (entries: LoaderEntry[], showy: boolean) => number;
  /** A beat lands; returns the ms to hold before the front moves on. */
  land: (entries: LoaderEntry[], showy: boolean) => number;
  flush: (entries: LoaderEntry[]) => void;
  advance: (animate: boolean, dur: number) => void;
  error: (i: number, showy: boolean) => void;
  recover: (showy: boolean) => void;
  stop: (showy: boolean) => void;
  finale: (showy: boolean, silent: boolean) => void;
  pose: () => void;
  motion: () => void;
  destroy: () => void;
};

type LoaderEngine = {
  rebuild: (steps: LoaderStep[]) => void;
  update: (steps: LoaderStep[]) => void;
  motion: (m: LoaderMotion) => void;
  cancel: () => void;
  destroy: () => void;
};

function introText(steps: LoaderStep[], L: LoaderLabels): string {
  if (!steps.length) return "";
  if (steps.every((s) => s.status === "pending")) return L.queued(steps.length, steps[0].label);
  const cur = steps.find((s) => s.status === "active" || s.status === "error");
  return L.progress(steps.filter(settled).length, steps.length, cur ? cur.label : "");
}

function initialLoaderView(steps: LoaderStep[], L: LoaderLabels): LoaderView {
  let front = 0;
  while (front < steps.length && settled(steps[front])) front++;
  const s = steps[front];
  const started = steps.some((x) => x.status !== "pending");
  return {
    run: 0,
    phase: !started ? "idle" : steps.every(settled) ? "complete" : "run",
    front,
    barP: s ? (s.status === "done" ? 1 : s.progress ?? null) : null,
    barDetail: s?.detail ?? null,
    lines: [],
    intro: introText(steps, L),
    alert: "",
    errorAt: -1,
    details: "",
    detailsOpen: false,
    menu: 0,
    tiles: [],
    counts: [],
    finishText: "",
    resultsOpen: false,
    banner: false,
    continueOn: false,
    note: null,
    focus: null,
  };
}

/**
 * The step engine: diffs each new steps array against the last, queues
 * completions as beats, narrates them, and drives the arena. It owns timers
 * and animations and releases all of them in destroy(), so React StrictMode
 * can create it twice.
 */
function createLoaderEngine(io: LoaderIO, makeArena: (core: LoaderCore) => LoaderArena): LoaderEngine {
  const timers = new Set<number>();
  const anims = new Set<Animation>();
  let mo: LoaderMotion = { reduced: false, paused: false, onscreen: true, visible: true };
  const core: LoaderCore = {
    host: [],
    vis: [],
    front: 0,
    phase: "idle",
    barP: null,
    motionAllowed: () => !mo.reduced && !mo.paused,
    running: () => mo.onscreen && mo.visible,
    motionOn: () => core.motionAllowed() && core.running(),
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
    anim: (node, frames, opts) => {
      const a = node.animate(frames, opts);
      anims.add(a);
      const done = () => anims.delete(a);
      a.finished.then(done, done);
      return a;
    },
  };
  const arena = makeArena(core);
  let alive = true;
  let run = 0;
  let frontSince = -1e9;
  let beatUntil = 0;
  let beatBusy = false;
  let inflight: { entries: LoaderEntry[]; landed: boolean; timer: number } | null = null;
  let backlog: LoaderEntry[] = [];
  let barDetail: string | null = null;
  let lastSeenP: number | null | undefined = null;
  let lastHit = -1e9;
  let hitT = 0;
  let pumpT = 0;
  let noteT = 0;
  let countRaf = 0;
  let finaleStarted = false;
  let finalPrefix = "";
  let lines: LoaderLine[] = [];
  let lineKey = 0;
  let focusN = 0;
  let awayFrom: number | null = null;

  const emit = (patch: Partial<LoaderView>) => {
    if (alive) io.emit(patch);
  };
  const announce = (text: string, politeness: "polite" | "assertive") => io.host().onAnnounce?.(text, politeness);
  const focus = (to: "retry" | "log" | "continue") => emit({ focus: { to, n: ++focusN } });
  const settledCount = () => core.host.filter(settled).length;

  function render() {
    emit({ phase: core.phase, front: core.front, barP: core.barP, barDetail });
    arena.sync();
  }

  function appendLine(kind: LoaderLineKind, text: string) {
    lines = lines.concat({ key: ++lineKey, kind, text }).slice(-40);
    emit({ lines });
    announce(text, "polite");
  }

  function syncBar() {
    const s = core.host[core.front];
    core.barP = s ? (s.status === "done" ? 1 : s.progress ?? null) : null;
    barDetail = s ? s.detail ?? null : null;
    lastSeenP = s ? s.progress : null;
  }

  function clearNote() {
    noteT = core.clear(noteT);
    emit({ note: null });
  }

  function rebuild(steps: LoaderStep[]) {
    timers.forEach((id) => window.clearTimeout(id));
    timers.clear();
    anims.forEach((a) => a.cancel());
    anims.clear();
    cancelAnimationFrame(countRaf);
    hitT = pumpT = noteT = countRaf = 0;
    core.host = steps.map((s) => ({ ...s }));
    core.vis = core.host.map(settled);
    backlog = [];
    inflight = null;
    beatBusy = false;
    finaleStarted = false;
    finalPrefix = "";
    lastHit = -1e9;
    lines = [];
    core.phase = core.host.some((s) => s.status !== "pending") ? (core.host.every(settled) ? "complete" : "run") : "idle";
    core.front = 0;
    while (core.front < core.host.length && core.vis[core.front]) core.front++;
    frontSince = -1e9;
    syncBar();
    emit({
      run: ++run,
      lines,
      intro: introText(core.host, io.labels()),
      alert: "",
      errorAt: -1,
      details: "",
      detailsOpen: false,
      menu: 0,
      tiles: [],
      counts: [],
      finishText: "",
      resultsOpen: false,
      banner: false,
      continueOn: false,
      note: null,
    });
    arena.build();
    render();
    arena.pose();
    if (core.phase === "complete") finale(true);
    else {
      const e = core.host.findIndex((s) => s.status === "error");
      if (e >= 0) showError(e, true);
    }
  }

  function needsRebuild(prev: LoaderStep[], next: LoaderStep[]) {
    if (prev.length !== next.length) return true;
    for (let i = 0; i < next.length; i++) if (prev[i].id !== next[i].id) return true;
    return next.every((s) => s.status === "pending") && (core.phase !== "idle" || prev.some((s) => s.status !== "pending"));
  }

  function update(steps: LoaderStep[]) {
    const next = steps.map((s) => ({ ...s }));
    const prev = core.host;
    if (needsRebuild(prev, next)) {
      rebuild(next);
      return;
    }
    core.host = next;
    if (core.phase === "stopped") {
      arena.sync();
      return;
    }
    if (core.phase === "idle" && next.some((s) => s.status !== "pending")) {
      core.phase = "run";
      // The queued placeholder would be stale now: say what is running instead.
      emit({ intro: introText(next, io.labels()) });
    }
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
    else if (leftError && core.phase === "error" && clearError()) focus("log");
    if (errAt >= 0) {
      showError(errAt, false);
      return;
    }
    const s = core.host[core.front];
    if (core.phase === "run" && s && s.status === "active" && s.progress != null && s.progress !== lastSeenP) {
      if (core.motionOn()) {
        lastSeenP = s.progress;
        requestHit();
      } else syncBar();
    }
    render();
    pump();
  }

  /* ---- hits: one per real progress event, merged when they come faster than HIT_GAP */
  function requestHit() {
    if (hitT) return;
    hitT = core.later(doHit, Math.max(lastHit + HIT_GAP - now(), frontSince + BASE - now(), 0));
  }

  function doHit() {
    hitT = 0;
    const s = core.host[core.front];
    if (core.phase !== "run" || !s || s.status !== "active" || s.progress == null) return;
    lastHit = now();
    syncBar();
    arena.hit(core.motionOn());
    render();
  }

  /* ---- beats: completions play one at a time, bursts and coalesced finishes share one */
  function pump() {
    pumpT = core.clear(pumpT);
    if (core.phase === "error" || core.phase === "stopped" || beatBusy) return;
    if (!backlog.length) {
      maybeFinale();
      return;
    }
    if (!core.running()) {
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
    // A skip that arrived with this completion resolves in the same beat.
    let take = 1;
    while (take < backlog.length && backlog[take].kind === "skipped" && backlog[take].at - backlog[0].at <= COALESCE) take++;
    runBeat(backlog.splice(0, take));
  }

  function runBeat(entries: LoaderEntry[]) {
    const head = entries[0];
    const showy = core.motionOn();
    beatBusy = true;
    const delay = arena.beat(entries, showy);
    beatUntil = now() + delay;
    const land = () => {
      entries.forEach((e) => {
        core.vis[e.i] = true;
      });
      const hold = arena.land(entries, showy);
      speak(entries.concat(backlog.filter((b) => b.at - head.at <= COALESCE)));
      const travel = entries.length >= BURST_MIN ? SLOW : BASE;
      const settle = () => {
        beatBusy = false;
        inflight = null;
        advanceFront(showy, travel);
        pump();
      };
      if (hold > 0) inflight = { entries, landed: true, timer: core.later(settle, hold) };
      else settle();
    };
    if (delay > 0) inflight = { entries, landed: false, timer: core.later(land, delay) };
    else land();
  }

  function flushBacklog() {
    pumpT = core.clear(pumpT);
    let held = false;
    if (inflight) {
      core.clear(inflight.timer);
      if (inflight.landed) held = true;
      else backlog = inflight.entries.concat(backlog);
      inflight = null;
      beatBusy = false;
    }
    if (!backlog.length) {
      if (held) {
        advanceFront(false, 0);
        maybeFinale();
      }
      return;
    }
    const entries = backlog.splice(0);
    entries.forEach((e) => {
      core.vis[e.i] = true;
    });
    arena.flush(entries);
    speak(entries);
    advanceFront(false, 0);
    maybeFinale();
  }

  function advanceFront(animate: boolean, dur: number) {
    let f = 0;
    while (f < core.host.length && core.vis[f]) f++;
    core.front = f;
    frontSince = now();
    syncBar();
    arena.advance(animate, dur);
    render();
    arena.pose();
    const s = core.host[f];
    if (s && s.status === "active" && s.progress != null && core.motionOn()) requestHit();
  }

  /* ---- narration */
  function doneSentence(s: LoaderStep) {
    const base = s.doneText || `${s.label}: done`;
    const dur = s.durationMs != null ? ` in ${fmtDur(s.durationMs)}` : "";
    const tries = (s.attempt ?? 1) > 1 ? `, on attempt ${s.attempt}` : "";
    return `${base}${dur}${tries}.`;
  }
  const skipSentence = (s: LoaderStep) => `Skipped: ${s.label}${s.detail ? ` (${lowerFirst(s.detail)})` : ""}.`;

  function nextAfter(list: LoaderEntry[]) {
    let i = Math.max(...list.map((e) => e.i)) + 1;
    while (i < core.host.length && settled(core.host[i])) i++;
    return i < core.host.length ? i : -1;
  }

  /* One sentence per group of milestones: two quick finishes share a sentence,
     a burst is summed up, and the line ends with what comes next. */
  function sentence(list: LoaderEntry[]) {
    list = list.slice().sort((a, b) => a.i - b.i);
    let text: string;
    if (list.length >= BURST_MIN) {
      const done = list.filter((e) => e.kind === "done").map((e) => core.host[e.i]);
      const skipped = list.filter((e) => e.kind === "skipped").map((e) => core.host[e.i].label);
      text = done.length === 1 ? doneSentence(done[0]) : done.length ? `Finished ${done.length} steps at once: ${listJoin(done.map((s) => s.label))}.` : "";
      if (skipped.length) text += `${text ? " " : ""}Skipped: ${listJoin(skipped)}.`;
    } else {
      const parts = list.map((e) => (e.kind === "done" ? doneSentence(core.host[e.i]) : skipSentence(core.host[e.i])));
      text = parts.length === 2 && list[0].kind === "done" && list[1].kind === "done" ? `${parts[0].replace(/\.$/, "")}, then ${lowerFirst(parts[1])}` : parts.join(" ");
    }
    const n = nextAfter(list);
    if (n >= 0) text += `${n === core.host.length - 1 ? " Last up: " : " On to "}${lowerFirst(core.host[n].label)}.`;
    return text;
  }

  /* Narrates every completion not told yet as one line. The last news before
     the finale is held and merged into the completion line. */
  function speak(list: LoaderEntry[]) {
    const fresh = list.filter((e) => !e.said);
    if (!fresh.length) return;
    fresh.forEach((e) => {
      e.said = true;
    });
    const text = sentence(fresh);
    if (core.host.every(settled) && backlog.every((b) => b.said)) {
      finalPrefix = `${finalPrefix ? `${finalPrefix} ` : ""}${text}`;
      return;
    }
    appendLine(fresh.some((e) => e.kind === "done") ? "done" : "skipped", text);
  }

  /* ---- errors */
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
    return `${bits.join(" · ")}${s.errorDetail ? `. ${s.errorDetail}` : ""}`;
  }

  function showError(i: number, silent: boolean) {
    const hadFocus = io.focusInside();
    flushBacklog();
    core.phase = "error";
    clearNote();
    hitT = core.clear(hitT);
    const s = core.host[i];
    const text = errorText(s);
    if (s.progress != null) core.barP = s.progress;
    if (s.detail) barDetail = s.detail;
    emit({ alert: text, errorAt: i, details: detailsText(i), detailsOpen: false, menu: 0 });
    if (!silent) announce(text, "assertive");
    render();
    arena.error(i, core.motionOn() && !silent);
    if (hadFocus) focus("retry");
  }

  /** Leaves the error state. Returns whether focus was in the menu. */
  function clearError() {
    const hadFocus = io.focusInError();
    core.phase = "run";
    emit({ alert: "", detailsOpen: false });
    arena.recover(core.motionOn());
    return hadFocus;
  }

  function retryStarted(i: number) {
    const hadFocus = clearError();
    syncBar();
    render();
    arena.pose();
    const s = core.host[i];
    appendLine("retry", `Trying again: ${s.label}, attempt ${s.attempt ?? 2}.`);
    if (hadFocus) focus("log");
  }

  /* ---- the end of a run */
  function maybeFinale() {
    if (finaleStarted || core.phase === "error" || core.phase === "stopped" || !core.host.length) return;
    if (backlog.length || !core.host.every(settled) || core.vis.some((v) => !v)) return;
    finale(false);
  }

  function buildResults(): LoaderTile[] {
    const n = core.host.length;
    const done = core.host.filter((s) => s.status === "done");
    const skipped = core.host.filter((s) => s.status === "skipped").length;
    const total = done.reduce((a, s) => a + (s.durationMs ?? 0), 0);
    const longest = done.reduce<LoaderStep | null>((a, s) => (!a || (s.durationMs ?? 0) > (a.durationMs ?? 0) ? s : a), null);
    const retried = done.filter((s) => (s.attempt ?? 1) > 1);
    const tile = (label: string, to: number | null, fmt: (v: number) => string, sub: string, text?: string): LoaderTile => ({
      label,
      to,
      fmt,
      sub,
      text: text ?? fmt(to ?? 0),
    });
    const tiles = [tile("Steps", done.length + skipped, (v) => `${Math.round(v)} of ${n}`, skipped ? `${skipped} skipped` : "none skipped")];
    if (total > 0) tiles.push(tile("Time", total, fmtDur, longest?.durationMs ? `Longest: ${longest.label}, ${fmtDur(longest.durationMs)}` : ""));
    (io.host().stats ?? []).forEach((st) => {
      if (typeof st.value === "number") tiles.push(tile(st.label, st.value, fmtNum, st.sub ?? ""));
      else tiles.push(tile(st.label, null, String, st.sub ?? "", st.value));
    });
    if (retried.length) {
      const hiccups = retried.reduce((a, s) => a + (s.attempt ?? 1) - 1, 0);
      tiles.push(tile(hiccups === 1 ? "Hiccup" : "Hiccups", hiccups, (v) => `${Math.round(v)} recovered`, `at ${listJoin(retried.map((s) => s.label))}`));
    }
    return tiles;
  }

  function countUp(animate: boolean, tiles: LoaderTile[]) {
    const final = () => emit({ counts: tiles.map((t) => t.text) });
    cancelAnimationFrame(countRaf);
    if (!animate) {
      final();
      return;
    }
    const t0 = now();
    const ease = (x: number) => 1 - Math.pow(1 - x, 3);
    const tick = () => {
      if (!alive) return;
      if (!core.motionOn()) {
        final();
        return;
      }
      const x = Math.min(1, (now() - t0) / SLOW);
      emit({ counts: tiles.map((t) => (t.to == null ? t.text : t.fmt(t.to * ease(x)))) });
      if (x < 1) countRaf = requestAnimationFrame(tick);
      else final();
    };
    countRaf = requestAnimationFrame(tick);
  }

  function finale(silent: boolean) {
    finaleStarted = true;
    const hadFocus = io.focusInside();
    core.phase = "complete";
    clearNote();
    const L = io.labels();
    const host = io.host();
    const n = core.host.length;
    const skipped = core.host.filter((s) => s.status === "skipped").length;
    const showy = core.motionOn() && !silent;
    const closing = `${L.complete(n, skipped)}${host.completeText ? ` ${host.completeText}` : ""}`;
    render();
    if (!silent) appendLine("finish", `${finalPrefix ? `${finalPrefix} ` : ""}${closing}`);
    finalPrefix = "";
    const tiles = buildResults();
    emit({ tiles, counts: tiles.map((t) => (showy && t.to != null ? t.fmt(0) : t.text)), finishText: closing });
    arena.finale(showy, silent);
    if (!silent) {
      emit({ banner: true });
      core.later(() => emit({ banner: false }), FAST + BEAT);
    }
    const open = () => {
      emit({ resultsOpen: true });
      countUp(showy, tiles);
      core.later(
        () => {
          emit({ continueOn: true });
          if (hadFocus || io.focusInside()) focus("continue");
          if (!silent) host.onComplete?.();
        },
        showy ? SLOW + 200 : 0,
      );
    };
    // The completion line is in the log before the results replace it, so it is announced.
    if (silent) open();
    else core.later(open, showy ? FAST + BASE : 400);
  }

  /* ---- cancel */
  function cancel() {
    if (core.phase === "complete" || core.phase === "stopped") return;
    const hadFocus = io.focusInside();
    const kept = core.host.filter((s) => s.status === "done").length;
    flushBacklog();
    pumpT = core.clear(pumpT);
    hitT = core.clear(hitT);
    clearNote();
    core.phase = "stopped";
    emit({ alert: "", detailsOpen: false });
    render();
    arena.stop(core.motionOn());
    arena.pose();
    appendLine("stop", `${finalPrefix ? `${finalPrefix} ` : ""}${io.labels().stopped(kept)}`);
    finalPrefix = "";
    io.host().onCancel?.();
    if (hadFocus) focus("log");
  }

  /* ---- motion, off screen and hidden tabs */
  function motion(next: LoaderMotion) {
    const wasRunning = core.running();
    mo = next;
    if (wasRunning && !core.running()) awayFrom = settledCount();
    if (!core.motionOn()) {
      anims.forEach((a) => {
        try {
          a.finish();
        } catch {
          a.cancel();
        }
      });
      if (!core.running() && backlog.length) flushBacklog();
    }
    if (hitT && !core.motionOn()) {
      hitT = core.clear(hitT);
      syncBar();
      render();
    }
    arena.motion();
    arena.pose();
    if (!wasRunning && core.running() && awayFrom != null) {
      const d = settledCount() - awayFrom;
      awayFrom = null;
      if (d > 0 && (core.phase === "run" || core.phase === "complete")) {
        noteT = core.clear(noteT);
        emit({ note: io.labels().away(d) });
        noteT = core.later(() => emit({ note: null }), BEAT * 2);
      }
    }
  }

  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(() => {
    arena.layout();
    io.resized();
  }) : null;
  const rootEl = io.root();
  if (ro && rootEl) ro.observe(rootEl);

  return {
    rebuild,
    update,
    motion,
    cancel,
    destroy() {
      alive = false;
      ro?.disconnect();
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
      anims.forEach((a) => a.cancel());
      anims.clear();
      cancelAnimationFrame(countRaf);
      arena.destroy();
    },
  };
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const RM_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(RM_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

/** prefers-reduced-motion, live. */
function useReducedMotionPreference() {
  return useSyncExternalStore(subscribeReducedMotion, () => window.matchMedia(RM_QUERY).matches, () => false);
}

const subscribeVisibility = (onChange: () => void) => {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
};

/** The browser tab is visible. */
function usePageVisible() {
  return useSyncExternalStore(subscribeVisibility, () => document.visibilityState !== "hidden", () => true);
}

/** The element is at least partly on screen. */
function useOnscreen(ref: RefObject<Element>) {
  const [onscreen, setOnscreen] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver !== "function") return;
    const io = new IntersectionObserver((list) => setOnscreen(list[list.length - 1].isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return onscreen;
}

/** Scrolls the log so it starts on a whole line and shows the newest one. */
function scrollLogToLines(log: HTMLElement | null) {
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
}

/* ---------------- end shared: engine ---------------- */

/* ---------------- flap gate: arena ---------------- */

/** One art pixel in CSS px, at every width. */
const FGL_U = 2;
const FGL_SKY = 100;
const FGL_SKY_NARROW = 84;
const FGL_GROUND = 8;
const FGL_PIPE = 16;
const FGL_GAP = 36;
const FGL_SPACE = 80;
const FGL_LIP = 6;
const FGL_LIP_FIN = 7;
/* Gaps shift by index, never at random. Neighbours differ by 4 art px at most,
   less than the 6 the pilot clears on each side, so lining up never clips a lip. */
const FGL_GAP_VAR = [0, -3, 1, 4, 1, -3, -4, 0, 3, -1];
const FGL_HERO_W = LOADER_W * FGL_U;
const FGL_HERO_H = LOADER_H * FGL_U;
const FGL_SCORE_U = 3;
/* The score chip's padding on the left and top; the digit map's own outline and shadow pad the other two sides. */
const FGL_SCORE_PAD = 3;

const FGL_FRAMES: LoaderFrameName[] = ["fly1", "fly2", "hurt", "sit", "celebrate1", "celebrate2"];
/* The jetpack sits on the back, behind the body, with a strap across the chest. */
const FGL_JETPACK = ["..oo..", ".ojJo.", "ojjjJo", "ojjjJo", "oooooo", "ojjjJo", "ojjjJo", "oJJJJo", ".oJJo."];
const fglAccessories = (f: LoaderFrameName): LoaderAccessories => {
  const y = f === "sit" ? 15 : 10;
  return { under: [{ x: 0, y, rows: FGL_JETPACK }], over: [{ x: 5, y: y + 2, rows: ["J", "J", "J"] }] };
};
/* Flames glow, so they have no outline. CSS alternates them on the beat. */
const FGL_LAYERS: LoaderSpriteLayer[] = [
  { name: "fl1", x: 1, y: 19, rows: [".fFf", "..f."] },
  { name: "fl2", x: 1, y: 19, rows: ["fFFf", ".fFf", "..f."] },
];

const FGL_CLOUD_L = [
  "......####..........",
  "....########.####...",
  "...###############..",
  ".#################..",
  "###################.",
  "####################",
  ".##################.",
];
const FGL_CLOUD_S = ["....###.....", "..########..", ".##########.", "############", ".##########."];
const FGL_CLOUDS: [string[], number, number][] = [
  [FGL_CLOUD_L, 0.04, 0.6],
  [FGL_CLOUD_S, 0.5, 0.66],
  [FGL_CLOUD_S, 0.78, 0.2],
];
const FGL_FLAG = ["o....", "offf.", "offff", "offf.", "o....", "o...."];
const FGL_SPARK = ["..o..", ".oFo.", "oFFFo", ".oFo.", "..o.."];
const FGL_SMOKE = [
  ["......", "..JJ..", ".JJJJ.", "..JJ..", "......"],
  [".J..J.", "J....J", "..JJ..", "J....J", ".J..J."],
];
const FGL_DIGITS = [
  [".###.", "##.##", "##.##", "##.##", "##.##", "##.##", ".###."],
  ["..##.", ".###.", "..##.", "..##.", "..##.", "..##.", "..##."],
  [".###.", "##.##", "...##", "..##.", ".##..", "##...", "#####"],
  ["####.", "...##", "...##", ".###.", "...##", "...##", "####."],
  ["...##", "..###", ".####", "##.##", "#####", "...##", "...##"],
  ["#####", "##...", "####.", "...##", "...##", "##.##", ".###."],
  [".###.", "##...", "####.", "##.##", "##.##", "##.##", ".###."],
  ["#####", "...##", "..##.", "..##.", ".##..", ".##..", ".##.."],
  [".###.", "##.##", "##.##", ".###.", "##.##", "##.##", ".###."],
  [".###.", "##.##", "##.##", ".####", "...##", "...##", ".###."],
];

/* Map keys to palette roles, one set per kind of art. */
const FGL_PIPE_ROLES: Record<string, keyof FlapGateLoaderColors> = { o: "pipeLine", x: "pipeLine", p: "pipe", l: "pipeLight", s: "pipeShade", w: "score", f: "accent" };
const FGL_SCORE_ROLES: Record<string, keyof FlapGateLoaderColors> = { w: "score", o: "scoreLine" };
const FGL_CLOUD_ROLES: Record<string, keyof FlapGateLoaderColors> = { "#": "cloud" };
const FGL_FX_ROLES: Record<string, keyof FlapGateLoaderColors> = { o: "scoreLine", F: "flameCore", J: "jetpackShade" };
const FGL_GROUND_ROLES: Record<string, keyof FlapGateLoaderColors> = { o: "groundLine", g: "grass", d: "ground", s: "groundStripe" };

/** Arena art as an svg string: one path per colour key, classed by palette role. */
function fglSvg(map: string[], roles: Record<string, string>, cls = ""): string {
  const paths = pixelPaths(map)
    .map(([k, d]) => `<path class="bz-fgl-a-${roles[k] ?? "pipeLine"}" d="${d}"/>`)
    .join("");
  return `<svg${cls ? ` class="${cls}"` : ""} viewBox="0 0 ${map[0].length} ${map.length}" preserveAspectRatio="none" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${paths}</svg>`;
}

/* A pipe, 16 art px wide: the lip spans all 16, the body the middle 14. Outline,
   a highlight band on the left and shade on the right. The last gate's lips are
   checkered. Size unknown hatches the body. */
function fglPipeMap(rows: number, lipBelow: boolean, finish: boolean, hatched: boolean): string[] {
  const lipH = finish ? FGL_LIP_FIN : FGL_LIP;
  const body: string[] = [];
  for (let y = 0; y < rows - lipH; y++) {
    let r = ".o";
    for (let x = 2; x < 14; x++) r += hatched && (x + y) % 4 === 0 ? "x" : x === 3 || x === 4 ? "l" : x >= 11 ? "s" : "p";
    body.push(`${r}o.`);
  }
  const lip = ["oooooooooooooooo"];
  for (let y = 1; y < lipH - 1; y++) {
    let r = "o";
    for (let x = 1; x < 15; x++) {
      if (finish) r += (Math.floor((x - 1) / 2) + Math.floor((y - 1) / 2)) % 2 ? "w" : "o";
      else r += x === 2 || x === 3 ? "l" : x >= 12 ? "s" : "p";
    }
    lip.push(`${r}o`);
  }
  lip.push("oooooooooooooooo");
  return lipBelow ? body.concat(lip) : lip.concat(body);
}

/* Chunky 5 x 7 digits with an outline and a drop shadow, like the game's own. */
function fglScoreMap(n: number): string[] {
  const ds = String(Math.max(0, Math.floor(n))).split("").map((c) => FGL_DIGITS[+c]);
  const W = ds.length * 6 - 1 + 3;
  const H = 10;
  const F: number[][] = Array.from({ length: H }, () => Array(W).fill(0));
  ds.forEach((g, k) => g.forEach((row, y) => {
    for (let x = 0; x < 5; x++) if (row[x] === "#") F[y + 1][x + 1 + k * 6] = 1;
  }));
  const on = (x: number, y: number) => y >= 0 && y < H && x >= 0 && x < W && F[y][x] === 1;
  const O = F.map((r) => r.slice());
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (F[y][x]) continue;
      for (let dy = -1; dy <= 1 && !O[y][x]; dy++) for (let dx = -1; dx <= 1; dx++) if (on(x + dx, y + dy)) { O[y][x] = 2; break; }
    }
  }
  for (let y = H - 1; y > 0; y--) for (let x = W - 1; x > 0; x--) if (!O[y][x] && O[y - 1][x - 1]) O[y][x] = 2;
  return O.map((r) => r.map((v) => (v === 1 ? "w" : v ? "o" : ".")).join(""));
}

type FglRefs = {
  root: RefObject<HTMLElement>;
  art: RefObject<HTMLDivElement>;
  clouds: RefObject<HTMLDivElement>;
  world: RefObject<HTMLDivElement>;
  pipes: RefObject<HTMLDivElement>;
  ground: RefObject<HTMLDivElement>;
  hero: RefObject<HTMLDivElement>;
  hop: RefObject<HTMLDivElement>;
  bob: RefObject<HTMLDivElement>;
  sprite: RefObject<HTMLDivElement>;
  fx: RefObject<HTMLDivElement>;
  score: RefObject<HTMLDivElement>;
  banner: RefObject<HTMLDivElement>;
};

type FglGeo = { W: number; narrow: boolean; sky: number; skyH: number; groundH: number; S: number; pass: number; reach: number; heroCX: number; heroX: number; lipW: number };

/**
 * The flight. Pipe i's centre sits at (i + 1) x spacing - pass on the world
 * strip, and the strip stands at heroCX - (front x spacing + progress x reach):
 * a gate starts one reach ahead of the pilot, is centred on it at 100%, and is
 * behind it once done. So the pilot is never past a gate the host has not
 * finished.
 */
function createFlapGateArena(core: LoaderCore, refs: FglRefs, uid: string): LoaderArena {
  let G: FglGeo | null = null;
  let pipes: (HTMLDivElement | null)[] = [];
  let ghosts: (HTMLDivElement[] | null)[] = [];
  let pipeLive: boolean[] = [];
  let worldTo: number | null = null;
  let worldAnim: Animation | null = null;
  let heroTo: string | null = null;
  let heroAnim: Animation | null = null;
  let hopAnim: Animation | null = null;
  let scoreShown = -1;
  let scoreW = 0;
  let scoreH = 0;
  let recoil = 0;
  let transientUntil = 0;
  let poseTimers: number[] = [];
  let celebrating = false;
  let celebT = 0;
  let groundKey = "";

  const n = () => core.host.length;
  const topRows = (i: number) => (G ? (G.sky - FGL_GAP) / 2 : 32) + (i === n() - 1 ? 0 : FGL_GAP_VAR[i % FGL_GAP_VAR.length]);
  const pipeX = (i: number) => (G ? (i + 1) * G.S - G.pass : 0);
  const hoverY = (i: number) => (topRows(i) + (FGL_GAP - LOADER_H) / 2) * FGL_U;

  function makePipe(i: number) {
    const g = G as FglGeo;
    const fin = i === n() - 1;
    const t = topRows(i);
    const b = g.sky - FGL_GAP - t;
    const node = document.createElement("div");
    node.className = "bz-fgl-pipe";
    const half = (rows: number, below: boolean) =>
      `<div class="bz-fgl-half">${fglSvg(fglPipeMap(rows, below, fin, false), FGL_PIPE_ROLES, "bz-fgl-pl")}${fglSvg(fglPipeMap(rows, below, fin, true), FGL_PIPE_ROLES, "bz-fgl-hx")}</div>`;
    node.innerHTML = half(t, true) + half(b, false) + (fin ? `<div class="bz-fgl-flag">${fglSvg(FGL_FLAG, FGL_PIPE_ROLES)}</div>` : "");
    node.dataset.t = String(t);
    node.dataset.b = String(b);
    return node;
  }

  function sizePipe(node: HTMLDivElement, i: number) {
    const g = G as FglGeo;
    const U = FGL_U;
    const t = Number(node.dataset.t);
    const b = Number(node.dataset.b);
    node.style.cssText = `left:${pipeX(i) - g.lipW / 2}px;width:${g.lipW}px;height:${g.skyH}px`;
    const [top, bot, flag] = Array.from(node.children) as HTMLElement[];
    top.style.cssText = `top:0;width:${g.lipW}px;height:${t * U}px`;
    bot.style.cssText = `top:${(g.sky - b) * U}px;width:${g.lipW}px;height:${b * U}px`;
    if (flag) flag.style.cssText = `left:${10 * U}px;top:${(g.sky - b - FGL_FLAG.length) * U}px;width:${FGL_FLAG[0].length * U}px;height:${FGL_FLAG.length * U}px`;
  }

  function makeGhost(i: number) {
    const parts = [0, 1].map(() => {
      const d = document.createElement("div");
      d.className = "bz-fgl-ghost";
      refs.pipes.current?.appendChild(d);
      return d;
    });
    ghosts[i] = parts;
    sizeGhost(parts, i);
  }

  function sizeGhost(parts: HTMLDivElement[], i: number) {
    if (!G) return;
    const t = topRows(i);
    const b = G.sky - FGL_GAP - t;
    const x = pipeX(i) - G.lipW / 2;
    parts[0].style.cssText = `left:${x}px;top:0;width:${G.lipW}px;height:${t * FGL_U}px`;
    parts[1].style.cssText = `left:${x}px;top:${(G.sky - b) * FGL_U}px;width:${G.lipW}px;height:${b * FGL_U}px`;
  }

  // The ground is part of the world strip, so it moves only with it.
  function buildGround() {
    const g = G as FglGeo;
    const el = refs.ground.current;
    if (!el) return;
    const left = -(g.W + g.S);
    const w = (n() + 3) * g.S + 2 * g.W;
    const tile: string[] = [];
    for (let y = 0; y < FGL_GROUND; y++) {
      let r = "";
      for (let x = 0; x < 8; x++) r += y === 0 ? "o" : y < 3 ? "g" : y === 3 ? "o" : (x + y) % 8 < 2 ? "s" : "d";
      tile.push(r);
    }
    const paths = pixelPaths(tile)
      .map(([k, d]) => `<path class="bz-fgl-a-${FGL_GROUND_ROLES[k]}" d="${d}"/>`)
      .join("");
    el.style.cssText = `left:${left}px;top:${g.skyH}px;width:${w}px;height:${g.groundH}px`;
    el.innerHTML = `<svg viewBox="0 0 ${w / FGL_U} ${FGL_GROUND}" preserveAspectRatio="none" shape-rendering="crispEdges" aria-hidden="true" focusable="false"><defs><pattern id="${uid}-ground" width="8" height="${FGL_GROUND}" patternUnits="userSpaceOnUse">${paths}</pattern></defs><rect width="100%" height="100%" fill="url(#${uid}-ground)"/></svg>`;
  }

  function buildClouds() {
    const el = refs.clouds.current;
    if (!el || !G) return;
    const g = G;
    el.innerHTML = FGL_CLOUDS.map(([m, fx, fy]) => {
      const top = Math.round(fy * (g.sky - m.length)) * FGL_U;
      return `<div class="bz-fgl-cloud" style="left:${Math.round(g.W * fx)}px;top:${top}px;width:${m[0].length * FGL_U}px;height:${m.length * FGL_U}px">${fglSvg(m, FGL_CLOUD_ROLES)}</div>`;
    }).join("");
  }

  // The front gate's progress as the world shows it: the last progress flapped for.
  function worldP() {
    const s = core.host[core.front];
    if (!s || s.status === "pending" || s.status === "skipped") return 0;
    if (s.status === "active" && s.progress == null) return 0;
    return Math.max(0, Math.min(1, core.barP ?? 0));
  }
  const worldTarget = () => {
    const g = G as FglGeo;
    return Math.round(g.heroCX - (core.front * g.S + (core.front < n() ? worldP() : 0) * g.reach));
  };

  function glide(node: HTMLElement, from: number[], to: number[], dur: number, ease: (t: number) => number, fmt: (v: number[]) => string, hold = 0) {
    const { frames, duration } = glideFrames(from, to, dur, ease, fmt, hold);
    return core.anim(node, frames, { duration });
  }

  function placeWorld(animate: boolean, dur: number) {
    const world = refs.world.current;
    if (!G || !world) return;
    const to = worldTarget();
    if (to === worldTo) return;
    const from = worldTo == null ? to : readXY(world)[0];
    worldTo = to;
    worldAnim?.cancel();
    worldAnim = null;
    const fmt = (v: number[]) => `translateX(${v[0]}px)`;
    world.style.transform = fmt([to]);
    if (animate && core.motionOn() && Math.round(from) !== to) worldAnim = glide(world, [Math.round(from)], [to], dur || BASE, easeOut, fmt);
  }

  // Lined up with the front gap in flight, on the ground after an error or a stop,
  // a little higher at the finale.
  function heroTarget(): number[] {
    const g = G as FglGeo;
    const last = Math.max(0, n() - 1);
    if (core.phase === "error" || core.phase === "stopped") return [g.heroX - recoil, g.skyH - FGL_HERO_H];
    if (core.phase === "complete") return [g.heroX, Math.max(FGL_U, hoverY(last) - 4 * FGL_U)];
    return [g.heroX, hoverY(Math.min(core.front, last))];
  }

  function placeHero(animate: boolean, dur = BASE, ease = easeOut, hold = 0) {
    const hero = refs.hero.current;
    if (!G || !hero) return;
    const to = heroTarget();
    const key = to.join(",");
    if (key === heroTo) return;
    const from = heroTo == null ? to : readXY(hero).map(Math.round);
    heroTo = key;
    heroAnim?.cancel();
    heroAnim = null;
    const fmt = (v: number[]) => `translate(${v[0]}px, ${v[1]}px)`;
    hero.style.transform = fmt(to);
    if (animate && core.motionOn() && (from[0] !== to[0] || from[1] !== to[1])) heroAnim = glide(hero, from, to, dur, ease, fmt, hold);
  }

  // One flap: up 6px fast, then settle, 300ms in all.
  function flap() {
    const hop = refs.hop.current;
    if (!hop) return;
    hopAnim?.cancel();
    const frames: Keyframe[] = [];
    const steps = 18;
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const y = t <= 0.3 ? -6 * easeOut(t / 0.3) : -6 * (1 - easeInOut((t - 0.3) / 0.7));
      frames.push({ offset: t, easing: "step-end", transform: `translateY(${Math.round(y)}px)` });
    }
    hopAnim = core.anim(hop, frames, { duration: BASE });
  }

  // The digits sit on a chip of their own outline colour, so a pipe passing behind never muddles them.
  function sizeScore() {
    const el = refs.score.current;
    if (!G || !el || !scoreW) return;
    const w = scoreW * FGL_SCORE_U + FGL_SCORE_PAD;
    el.style.cssText = `left:${Math.round((G.W - w) / 2)}px;top:${3 * FGL_U}px;width:${w}px;height:${scoreH * FGL_SCORE_U + FGL_SCORE_PAD}px`;
  }

  function renderScore(pop: boolean) {
    const el = refs.score.current;
    if (!el) return;
    const score = core.host.reduce((a, s, i) => a + (core.vis[i] && s.status === "done" ? 1 : 0), 0);
    if (score === scoreShown) return;
    const up = scoreShown >= 0 && score > scoreShown;
    scoreShown = score;
    const m = fglScoreMap(score);
    scoreW = m[0].length;
    scoreH = m.length;
    el.innerHTML = fglSvg(m, FGL_SCORE_ROLES);
    el.dataset.n = String(score);
    sizeScore();
    if (pop && up && core.motionOn()) core.anim(el, steppedFrames([[0, 0, -4], [0.5, 0, -2], [1, 0, 0]]), { duration: BASE });
  }

  // The banner sits under the score: centred if it clears the pilot, otherwise to its right.
  function placeBanner() {
    const el = refs.banner.current;
    if (!G || !el) return;
    const bw = el.offsetWidth || 0;
    const right = G.heroCX + FGL_HERO_W / 2 + 12;
    const left = Math.min(Math.max(Math.round((G.W - bw) / 2), right), G.W - 6 - bw);
    el.style.setProperty("--bz-fgl-bx", `${Math.max(6, left)}px`);
    el.style.setProperty("--bz-fgl-by", `${3 * FGL_U + scoreH * FGL_SCORE_U + FGL_SCORE_PAD + 3 * FGL_U}px`);
  }

  /* ---- poses */
  function setSprite(frame: string, loop: string, flame: string) {
    const sp = refs.sprite.current;
    if (!sp) return;
    if (sp.dataset.frame !== frame) sp.dataset.frame = frame;
    if ((sp.dataset.loop ?? "") !== loop) sp.dataset.loop = loop;
    if (sp.dataset.flame !== flame) sp.dataset.flame = flame;
  }

  function pose() {
    if (transientUntil > now()) return;
    let frame = "fly1";
    let loop = "";
    let flame = "on";
    let bob = false;
    if (core.phase === "error") {
      // Held for as long as the menu waits, so the failure reads in a still frame too.
      frame = "hurt";
      flame = "off";
    } else if (core.phase === "stopped") {
      frame = "sit";
      flame = "off";
    } else if (core.phase === "complete") {
      frame = "celebrate1";
      if (celebrating && core.motionAllowed()) loop = "celebrate";
    } else if (core.motionAllowed()) {
      loop = "fly";
      const s = core.host[core.front];
      bob = !!s && s.status === "active" && s.progress == null;
    }
    setSprite(loop ? "" : frame, loop, flame);
    const b = refs.bob.current;
    if (b && b.dataset.bob !== String(bob)) b.dataset.bob = String(bob);
  }

  // Plays frames in order (the first at once), then hands back to pose().
  function playTransient(seq: [string, number, string][]) {
    poseTimers.forEach((id) => core.clear(id));
    poseTimers = [];
    let at = 0;
    seq.forEach(([frame, ms, flame], k) => {
      if (k === 0) setSprite(frame, "", flame);
      else poseTimers.push(core.later(() => setSprite(frame, "", flame), at));
      at += ms;
    });
    transientUntil = now() + at;
    poseTimers.push(core.later(() => {
      transientUntil = 0;
      pose();
    }, at));
  }

  function sparks() {
    const fx = refs.fx.current;
    const hero = refs.hero.current;
    if (!G || !fx || !hero) return;
    const [hx, hy] = readXY(hero);
    const s = FGL_SPARK.length * FGL_U;
    ([[hx + 13 * FGL_U, hy, 8, -10], [hx + 9 * FGL_U, hy - FGL_U, -6, -12]] as number[][]).forEach(([x, y, dx, dy]) => {
      const sp = document.createElement("div");
      sp.className = "bz-fgl-spark";
      sp.style.cssText = `left:${Math.round(x)}px;top:${Math.round(y)}px;width:${s}px;height:${s}px`;
      sp.innerHTML = fglSvg(FGL_SPARK, FGL_FX_ROLES);
      fx.appendChild(sp);
      const a = core.anim(sp, steppedFrames([[0, 0, 0, 1], [0.34, dx / 2, dy / 2, 1], [0.67, dx, dy, 1], [1, dx, dy, 0]]), { duration: BASE + FAST, fill: "forwards" });
      a.finished.then(() => sp.remove(), () => sp.remove());
    });
  }

  // The jetpack sputters: one 2-frame puff under the tank.
  function smoke() {
    const fx = refs.fx.current;
    const hero = refs.hero.current;
    if (!G || !fx || !hero) return;
    const [hx, hy] = readXY(hero);
    const w = FGL_SMOKE[0][0].length * FGL_U;
    const h = FGL_SMOKE[0].length * FGL_U;
    const puff = document.createElement("div");
    puff.className = "bz-fgl-smoke";
    puff.style.cssText = `left:${Math.round(hx - FGL_U)}px;top:${Math.round(hy + 18 * FGL_U)}px;width:${w}px;height:${h}px`;
    puff.innerHTML = FGL_SMOKE.map((m) => fglSvg(m, FGL_FX_ROLES)).join("");
    fx.appendChild(puff);
    const [a, b] = Array.from(puff.children) as HTMLElement[];
    core.anim(a, [{ opacity: 1, easing: "step-end" }, { opacity: 0, offset: 0.5, easing: "step-end" }, { opacity: 0 }], { duration: BASE, fill: "forwards" });
    const last = core.anim(b, [{ opacity: 0, easing: "step-end" }, { opacity: 1, offset: 0.5, easing: "step-end" }, { opacity: 0 }], { duration: BASE, fill: "forwards" });
    last.finished.then(() => puff.remove(), () => puff.remove());
  }

  // A skipped gate retracts, the top up and the bottom down, over its dashed ghost.
  function retract(i: number) {
    const node = pipes[i];
    pipeLive[i] = false;
    pipes[i] = null;
    makeGhost(i);
    if (!node || !G) return;
    const g = G;
    const slide = (half: HTMLElement, d: number) =>
      core.anim(half, [0, 1, 2, 3, 4, 5, 6].map((k) => ({ offset: k / 6, easing: "step-end", transform: `translateY(${Math.round(d * easeIn(k / 6))}px)` })), { duration: BASE, fill: "forwards" });
    const [top, bot, flag] = Array.from(node.children) as HTMLElement[];
    slide(top, -(top.offsetHeight + FGL_U));
    const down = bot.offsetHeight + g.groundH + FGL_U;
    if (flag) slide(flag, down + FGL_FLAG.length * FGL_U);
    const a = slide(bot, down);
    a.finished.then(() => node.remove(), () => node.remove());
  }

  function fadeOut(i: number) {
    const node = pipes[i];
    pipeLive[i] = false;
    pipes[i] = null;
    node?.remove();
    if (!ghosts[i]) makeGhost(i);
  }

  function layoutPipes() {
    const el = refs.pipes.current;
    if (!el) return;
    el.textContent = "";
    pipes = core.host.map((_, i) => {
      if (!pipeLive[i]) return null;
      const p = makePipe(i);
      el.appendChild(p);
      return p;
    });
    const had = ghosts;
    ghosts = [];
    had.forEach((g, i) => {
      if (g) makeGhost(i);
    });
  }

  function layout() {
    const root = refs.root.current;
    const art = refs.art.current;
    if (!root || !art) return;
    const W = art.clientWidth;
    if (!W) return;
    const narrow = root.clientWidth < 560;
    if (root.dataset.narrow !== String(narrow)) root.dataset.narrow = String(narrow);
    const sky = narrow ? FGL_SKY_NARROW : FGL_SKY;
    const changed = !G || G.W !== W || G.sky !== sky;
    if (changed) {
      const S = FGL_SPACE * FGL_U;
      const pass = (LOADER_W / 2 + FGL_PIPE / 2 + 1) * FGL_U;
      const heroCX = Math.round(W * 0.27);
      G = { W, narrow, sky, skyH: sky * FGL_U, groundH: FGL_GROUND * FGL_U, S, pass, reach: S - pass, heroCX, heroX: heroCX - FGL_HERO_W / 2, lipW: FGL_PIPE * FGL_U };
      buildClouds();
      layoutPipes();
      sizeScore();
      placeBanner();
    }
    const gk = `${W}|${sky}|${n()}`;
    if (gk !== groundKey) {
      groundKey = gk;
      buildGround();
    }
    pipes.forEach((p, i) => {
      if (p) sizePipe(p, i);
    });
    ghosts.forEach((g, i) => {
      if (g) sizeGhost(g, i);
    });
    if (changed) {
      worldTo = null;
      heroTo = null;
      placeWorld(false, 0);
      placeHero(false);
      sync();
    }
  }

  // Pipe roles: which is the front, whether its size is unknown, whether it failed.
  function sync() {
    const s = core.host[core.front];
    const indet = !!s && (s.status === "active" || s.status === "error") && s.progress == null;
    pipes.forEach((p, i) => {
      if (!p) return;
      const role = i === core.front ? "front" : i < core.front ? "past" : "queue";
      if (p.dataset.role !== role) p.dataset.role = role;
      const h = String(i === core.front && indet);
      if (p.dataset.indet !== h) p.dataset.indet = h;
      const st = i === core.front && core.phase === "error" ? "error" : "";
      if ((p.dataset.state ?? "") !== st) p.dataset.state = st;
    });
    renderScore(false);
    placeWorld(false, 0);
  }

  return {
    build() {
      refs.fx.current?.replaceChildren();
      pipeLive = core.host.map((s) => s.status !== "skipped");
      ghosts = core.host.map(() => null);
      core.host.forEach((s, i) => {
        if (s.status === "skipped") ghosts[i] = [];
      });
      G = null;
      worldTo = null;
      heroTo = null;
      recoil = 0;
      scoreShown = -1;
      groundKey = "";
      celebrating = false;
      transientUntil = 0;
      poseTimers = [];
      celebT = 0;
      layout();
      renderScore(false);
    },
    layout,
    sync,
    hit(showy) {
      if (showy) {
        playTransient([["fly2", FAST, "burst"], ["fly1", FAST, "on"]]);
        flap();
      }
      placeWorld(showy, BASE);
    },
    beat(entries, showy) {
      if (!showy || entries[0].kind !== "done") return 0;
      // The down-stroke as the pilot commits to the gap, then a glide out.
      playTransient([["fly2", IMPACT, "burst"], ["fly1", FAST, "on"], ["fly2", FAST, "on"]]);
      return IMPACT;
    },
    land(entries, showy) {
      let hold = 0;
      entries.forEach((e) => {
        if (e.kind !== "skipped") return;
        if (showy) {
          retract(e.i);
          hold = BASE;
        } else fadeOut(e.i);
      });
      renderScore(showy);
      return hold;
    },
    flush(entries) {
      entries.forEach((e) => {
        if (e.kind === "skipped") fadeOut(e.i);
      });
      renderScore(false);
    },
    advance(animate, dur) {
      placeWorld(animate, dur);
      placeHero(animate, dur || BASE, easeOut);
    },
    error(i, showy) {
      // Knocked back off the lip, so the fall never passes through the bottom pipe.
      if (G && worldTo != null) {
        const pipeLeft = pipeX(i) - G.lipW / 2 + worldTo;
        recoil = Math.max(0, G.heroX + FGL_HERO_W + 2 * FGL_U - pipeLeft);
      }
      if (showy) {
        hopAnim?.cancel();
        hopAnim = null;
        sparks();
        smoke();
      }
      // A flap still playing gives way to the hurt pose at once.
      poseTimers.forEach((id) => core.clear(id));
      poseTimers = [];
      transientUntil = 0;
      placeHero(showy, BASE, easeIn, FAST);
      pose();
    },
    recover(showy) {
      recoil = 0;
      if (showy) playTransient([["fly2", FAST, "burst"], ["fly1", FAST, "on"]]);
      placeHero(showy, SLOW, easeOut);
      sync();
      pose();
    },
    stop(showy) {
      if (G && worldTo != null && core.front < n()) {
        const pipeLeft = pipeX(core.front) - G.lipW / 2 + worldTo;
        recoil = Math.max(recoil, G.heroX + FGL_HERO_W + 2 * FGL_U - pipeLeft);
      }
      placeHero(showy, BASE, easeIn);
      sync();
    },
    finale(showy, silent) {
      celebrating = showy;
      placeHero(showy && !silent, SLOW, easeOut);
      sync();
      placeBanner();
      if (showy) {
        playTransient([["celebrate1", BASE, "burst"]]);
        celebT = core.later(() => {
          celebrating = false;
          pose();
        }, BEAT * 3);
      } else pose();
    },
    pose,
    motion() {
      if (!core.motionAllowed()) {
        transientUntil = 0;
        poseTimers.forEach((id) => core.clear(id));
        poseTimers = [];
        celebT = core.clear(celebT);
        celebrating = false;
      }
      if (!core.motionOn()) {
        // Snap anything mid-travel to where it belongs.
        worldTo = null;
        heroTo = null;
        placeWorld(false, 0);
        placeHero(false);
      }
    },
    destroy() {
      refs.pipes.current?.replaceChildren();
      refs.fx.current?.replaceChildren();
      refs.ground.current?.replaceChildren();
      refs.clouds.current?.replaceChildren();
      refs.score.current?.replaceChildren();
    },
  };
}

/* ---------------- flap gate: styles ---------------- */

const STEP_OUTER =
  "polygon(4px 0,calc(100% - 4px) 0,calc(100% - 4px) 2px,calc(100% - 2px) 2px,calc(100% - 2px) 4px,100% 4px,100% calc(100% - 4px),calc(100% - 2px) calc(100% - 4px),calc(100% - 2px) calc(100% - 2px),calc(100% - 4px) calc(100% - 2px),calc(100% - 4px) 100%,4px 100%,4px calc(100% - 2px),2px calc(100% - 2px),2px calc(100% - 4px),0 calc(100% - 4px),0 4px,2px 4px,2px 2px,4px 2px)";
const STEP_INNER =
  "polygon(2px 0,calc(100% - 2px) 0,calc(100% - 2px) 2px,100% 2px,100% calc(100% - 2px),calc(100% - 2px) calc(100% - 2px),calc(100% - 2px) 100%,2px 100%,2px calc(100% - 2px),0 calc(100% - 2px),0 2px,2px 2px)";

const CSS = `
.bz-fgl{
  --bz-fgl-ink:light-dark(var(--bz-ink,#0a0a0a),var(--bz-void-ink,#ffffff));
  --bz-fgl-muted:light-dark(var(--bz-ink-muted,#4a4a4c),rgba(255,255,255,0.8));
  --bz-fgl-panel:light-dark(var(--bz-paper,#ffffff),var(--bz-void-raised,#1a1a1a));
  --bz-fgl-track:light-dark(var(--bz-line-opaque,#f0f0f0),#313131);
  --bz-fgl-edge:light-dark(rgba(10,10,10,0.13),rgba(255,255,255,0.16));
  --bz-fgl-danger:light-dark(var(--bz-danger,#b91c1c),#fca5a5);
  --bz-fgl-danger-mark:light-dark(#dc2626,#f87171);
  --bz-fgl-success:light-dark(var(--bz-emerald,#047857),var(--bz-emerald-on-void,#34d399));
  --bz-fgl-focus:light-dark(var(--bz-focus-ring,#912c22),var(--bz-focus-ring-void,#ffffff));
  --bz-fgl-sans:var(--bz-font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);
  --bz-fgl-mono:var(--bz-font-mono,ui-monospace,"SF Mono",SFMono-Regular,Menlo,Consolas,monospace);
  --bz-fgl-fast:var(--bz-duration-fast,150ms);
  --bz-fgl-base:var(--bz-duration-base,300ms);
  --bz-fgl-ease:var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1));
  --bz-fgl-beat:var(--bz-duration-beat,2.4s);
  container-type:inline-size;
  display:block;
  width:100%;
  color:var(--bz-fgl-ink);
  font-family:var(--bz-fgl-sans);
  font-size:15px;
  line-height:1.5;
  text-align:left;
}
.bz-fgl *,.bz-fgl *::before,.bz-fgl *::after{box-sizing:border-box}
.bz-fgl-frame{padding:14px 20px 18px;border:1px solid var(--bz-fgl-edge);border-radius:16px;background:var(--bz-fgl-panel)}
.bz-fgl-sr{position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
.bz-fgl-title{margin:0;font-size:15px;font-weight:600;line-height:1.4;color:var(--bz-fgl-ink)}
.bz-fgl-title:focus{outline:none}
.bz-fgl-title:focus-visible{outline:2px solid var(--bz-fgl-focus);outline-offset:2px}
.bz-fgl-g{flex:none;width:14px;height:14px}
.bz-fgl-gp{fill:currentColor}

/* arena: a stepped pixel frame around the sky */
.bz-fgl-arena{margin-top:10px;padding:2px;background:var(--bz-fgl-ink);clip-path:${STEP_OUTER}}
.bz-fgl-art{position:relative;height:216px;overflow:hidden;background:var(--fgl-sky);clip-path:${STEP_INNER}}
.bz-fgl-clouds,.bz-fgl-world,.bz-fgl-pipes,.bz-fgl-fx{position:absolute;left:0;top:0;width:0;height:0}
.bz-fgl-cloud,.bz-fgl-pipe,.bz-fgl-half,.bz-fgl-flag,.bz-fgl-ghost,.bz-fgl-ground,.bz-fgl-spark,.bz-fgl-smoke,.bz-fgl-score{position:absolute}
.bz-fgl-art svg{display:block;width:100%;height:100%}
.bz-fgl-half>svg,.bz-fgl-smoke>svg{position:absolute;inset:0}
.bz-fgl-pipe{top:0}
.bz-fgl-half>.bz-fgl-hx,.bz-fgl-pipe[data-indet="true"] .bz-fgl-half>.bz-fgl-pl{visibility:hidden}
.bz-fgl-pipe[data-indet="true"] .bz-fgl-half>.bz-fgl-hx{visibility:visible}
.bz-fgl-pipe[data-state="error"] .bz-fgl-a-pipeLine{fill:var(--bz-fgl-danger-mark)}
.bz-fgl-ghost{border:2px dashed var(--fgl-ghost)}
${FGL_COLOR_KEYS.map((k) => `.bz-fgl-a-${k}{fill:var(--fgl-${k})}`).join("")}
.bz-fgl-hero{position:absolute;left:0;top:0;width:${FGL_HERO_W}px;height:${FGL_HERO_H}px}
.bz-fgl-hop,.bz-fgl-bob,.bz-fgl-sprite{width:100%;height:100%}
.bz-fgl-sprite>svg{display:block;width:100%;height:100%;overflow:visible}
/* One art pixel of rim on every side; transparent unless the palette sets a halo. */
.bz-fgl-sprite>svg{filter:drop-shadow(${FGL_U}px 0 0 var(--fgl-halo)) drop-shadow(-${FGL_U}px 0 0 var(--fgl-halo)) drop-shadow(0 ${FGL_U}px 0 var(--fgl-halo)) drop-shadow(0 -${FGL_U}px 0 var(--fgl-halo))}
.bz-fgl-score{padding:${FGL_SCORE_PAD}px 0 0 ${FGL_SCORE_PAD}px;background:var(--fgl-scoreLine);clip-path:${STEP_INNER}}
.bz-fgl-sprite g[data-f],.bz-fgl-sprite g[data-l]{display:none}
${FGL_FRAMES.map((f) => `.bz-fgl-sprite[data-frame="${f}"] g[data-f="${f}"]`).join(",")}{display:inline}
.bz-fgl-sprite[data-loop="fly"] g[data-f="fly1"],.bz-fgl-sprite[data-loop="celebrate"] g[data-f="celebrate1"]{display:inline;animation:bz-fgl-a var(--bz-fgl-beat) step-end infinite}
.bz-fgl-sprite[data-loop="fly"] g[data-f="fly2"],.bz-fgl-sprite[data-loop="celebrate"] g[data-f="celebrate2"]{display:inline;animation:bz-fgl-b var(--bz-fgl-beat) step-end infinite}
.bz-fgl-sprite[data-flame="on"] g[data-l="fl1"],.bz-fgl-sprite[data-flame="burst"] g[data-l="fl2"]{display:inline}
.bz-fgl[data-motion="on"] .bz-fgl-sprite[data-flame="on"] g[data-l="fl1"]{animation:bz-fgl-a var(--bz-fgl-beat) step-end infinite}
.bz-fgl[data-motion="on"] .bz-fgl-sprite[data-flame="on"] g[data-l="fl2"]{display:inline;animation:bz-fgl-b var(--bz-fgl-beat) step-end infinite}
@keyframes bz-fgl-a{0%{opacity:1}50%{opacity:0}100%{opacity:0}}
@keyframes bz-fgl-b{0%{opacity:0}50%{opacity:1}100%{opacity:1}}
.bz-fgl[data-motion="on"] .bz-fgl-bob[data-bob="true"]{animation:bz-fgl-bob var(--bz-fgl-beat) step-end infinite}
@keyframes bz-fgl-bob{0%{transform:translateY(0)}50%{transform:translateY(-2px)}100%{transform:translateY(-2px)}}
.bz-fgl-c-outline{fill:var(--fgl-spriteOutline)}
.bz-fgl-c-hair{fill:var(--chr-hair)}
.bz-fgl-c-hair-shade{fill:var(--chr-hair-shade)}
.bz-fgl-c-skin{fill:var(--chr-skin)}
.bz-fgl-c-skin-shade{fill:var(--chr-skin-shade)}
.bz-fgl-c-eye-white{fill:var(--chr-eye-white)}
.bz-fgl-c-eye,.bz-fgl-c-mouth{fill:var(--chr-eye)}
.bz-fgl-c-outfit{fill:var(--chr-outfit)}
.bz-fgl-c-outfit-shade{fill:var(--chr-outfit-shade)}
.bz-fgl-c-outfit-light{fill:var(--chr-outfit-light)}
.bz-fgl-c-accent{fill:var(--chr-accent)}
.bz-fgl-c-pants{fill:var(--chr-pants)}
.bz-fgl-c-pants-shade{fill:var(--chr-pants-shade)}
.bz-fgl-c-boots{fill:var(--chr-boots)}
.bz-fgl-c-boots-shade{fill:var(--chr-boots-shade)}
.bz-fgl-c-jetpack{fill:var(--fgl-jetpack)}
.bz-fgl-c-jetpack-shade{fill:var(--fgl-jetpackShade)}
.bz-fgl-c-flame{fill:var(--fgl-flame)}
.bz-fgl-c-flame-core{fill:var(--fgl-flameCore)}
.bz-fgl-banner{position:absolute;left:var(--bz-fgl-bx,40%);top:var(--bz-fgl-by,48px);padding:2px;background:var(--bz-fgl-ink);clip-path:${STEP_OUTER};visibility:hidden}
.bz-fgl-banner[data-on="true"]{visibility:visible}
.bz-fgl-banner-in{display:block;padding:9px 18px 8px;background:var(--bz-fgl-panel);clip-path:${STEP_INNER};color:var(--bz-fgl-ink);font:700 14px/1 var(--bz-fgl-mono);letter-spacing:0.12em;text-transform:uppercase;white-space:nowrap}
.bz-fgl-banner-rule{display:block;height:4px;margin-top:7px;background:var(--fgl-accent)}

/* nameplate: the one progressbar, under the arena */
.bz-fgl-plate{position:relative;width:min(360px,100%);margin-top:12px;padding:6px 10px 8px 16px;border:2px solid var(--bz-fgl-ink);background:var(--bz-fgl-panel)}
.bz-fgl-plate::before{content:"";position:absolute;left:0;top:0;bottom:0;width:6px;background:var(--fgl-accent)}
.bz-fgl-plate[data-state="error"]::before{background:var(--bz-fgl-danger-mark)}
.bz-fgl-plate-top{display:flex;align-items:center;gap:8px;min-width:0;height:22px}
.bz-fgl-plate-label{flex:1 1 auto;min-width:0;overflow:hidden;font-size:14px;font-weight:600;line-height:22px;white-space:nowrap;text-overflow:ellipsis}
.bz-fgl-tag{flex:none;padding:4px 6px 3px;background:var(--fgl-accent);color:var(--fgl-onAccent);font:700 11px/1 var(--bz-fgl-mono);letter-spacing:0.04em;white-space:nowrap}
.bz-fgl-failed{flex:none;display:inline-flex;align-items:center;gap:5px;color:var(--bz-fgl-danger);font-size:13px;font-weight:700;line-height:1}
.bz-fgl-failed .bz-fgl-g{width:12px;height:12px;color:var(--bz-fgl-danger-mark)}
.bz-fgl-tag[hidden],.bz-fgl-failed[hidden]{display:none}
/* A fixed row height, so the plate is the same size with or without count text. */
.bz-fgl-plate-row{display:flex;align-items:center;gap:10px;height:16px;margin-top:6px}
.bz-fgl-bar{position:relative;flex:1 1 100px;min-width:56px;height:12px;overflow:hidden;border:2px solid var(--bz-fgl-ink);background:var(--bz-fgl-track)}
.bz-fgl-fill{position:absolute;left:0;top:0;bottom:0;background:var(--fgl-accent)}
.bz-fgl[data-motion="on"][data-running="true"] .bz-fgl-fill{transition:width var(--bz-fgl-base) var(--bz-fgl-ease)}
.bz-fgl-hatch{position:absolute;top:0;bottom:0;left:-8px;right:0;display:none}
.bz-fgl-hatch svg{display:block;width:100%;height:100%}
.bz-fgl-hatch path{fill:var(--fgl-accent)}
.bz-fgl-bar[data-indet="true"] .bz-fgl-fill{display:none}
.bz-fgl-bar[data-indet="true"] .bz-fgl-hatch{display:block}
.bz-fgl[data-motion="on"] .bz-fgl-bar[data-indet="true"] .bz-fgl-hatch{animation:bz-fgl-march var(--bz-fgl-beat) steps(4) infinite}
@keyframes bz-fgl-march{from{transform:translateX(0)}to{transform:translateX(8px)}}
.bz-fgl-plate[data-state="error"] .bz-fgl-hatch{animation:none!important}
.bz-fgl-count{flex:none;font:500 12px/16px var(--bz-fgl-mono);color:var(--bz-fgl-muted);white-space:nowrap;font-variant-numeric:tabular-nums}

/* dialogue box: three panels in one cell, so it never changes height */
.bz-fgl-box{margin-top:12px;padding:2px;background:var(--bz-fgl-ink);clip-path:${STEP_OUTER}}
.bz-fgl-box-in{padding:14px 18px 12px;background:var(--bz-fgl-panel);clip-path:${STEP_INNER}}
.bz-fgl-stack{display:grid}
.bz-fgl-panel{grid-area:1/1;min-width:0;visibility:hidden}
.bz-fgl-panel[data-on="true"]{visibility:visible}
/* Under the error menu the narration is covered, not hidden: the log stays in
   the accessibility tree, so the retry line that uncovers it is announced. */
.bz-fgl-talk[data-covered="true"]{opacity:0;pointer-events:none}
.bz-fgl-talk{position:relative;display:flex;flex-direction:column}
.bz-fgl-log{position:relative;flex:1 1 auto;height:0;min-height:72px;overflow-y:auto;scrollbar-width:none;overscroll-behavior:contain;font-size:15px;line-height:24px}
.bz-fgl-log::-webkit-scrollbar{display:none}
.bz-fgl-log:focus{outline:none}
.bz-fgl-log:focus-visible{outline:2px solid var(--bz-fgl-focus);outline-offset:2px}
.bz-fgl-line{display:flex;gap:8px;margin:0;color:var(--bz-fgl-muted);font-size:14px}
.bz-fgl-line:last-child{color:var(--bz-fgl-ink);font-size:16px;font-weight:500}
.bz-fgl-line>.bz-fgl-g{margin-top:5px}
.bz-fgl-line:not(:last-child)>.bz-fgl-g{visibility:hidden}
.bz-fgl-line[data-kind="done"]>.bz-fgl-g{color:var(--bz-fgl-success)}
.bz-fgl-line[data-kind="retry"]>.bz-fgl-g,.bz-fgl-line[data-kind="finish"]>.bz-fgl-g{color:var(--fgl-accent)}
.bz-fgl-line[data-kind="stop"]>.bz-fgl-g{color:var(--bz-fgl-danger-mark)}
.bz-fgl-intro{position:absolute;left:0;top:0;margin:0;color:var(--bz-fgl-muted);font-size:15px;line-height:24px}
/* The error panel fills the box, and the details scroll inside the space above
   the menu, so no length of detail text can make the box grow. */
.bz-fgl-err{display:flex;flex-direction:column}
.bz-fgl-errtop{position:relative;flex:1 1 auto;min-width:0}
.bz-fgl-alert{display:flex;gap:10px;min-height:48px;font-size:15px;font-weight:500;line-height:24px}
/* Covered by the details rather than hidden, so closing them does not show the alert anew and repeat it. */
.bz-fgl-alert[data-covered="true"]{opacity:0}
.bz-fgl-alert>.bz-fgl-g{margin-top:5px;color:var(--bz-fgl-danger-mark)}
.bz-fgl-menu{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.bz-fgl-details{position:absolute;inset:0;margin:0;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;font:500 12.5px/20px var(--bz-fgl-mono);color:var(--bz-fgl-muted)}
.bz-fgl-details:focus{outline:none}
.bz-fgl-details:focus-visible{outline:2px solid var(--bz-fgl-focus);outline-offset:2px}
.bz-fgl-details:not([data-open="true"]){visibility:hidden}
.bz-fgl-finish{display:flex;gap:8px;margin:0 0 10px;font-size:15px;font-weight:500;line-height:24px}
.bz-fgl-finish>.bz-fgl-g{margin-top:5px;color:var(--fgl-accent)}
.bz-fgl-finish-text{display:grid;min-width:0}
.bz-fgl-finish-text>span{grid-area:1/1}
.bz-fgl-sizer{visibility:hidden}
.bz-fgl-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:10px 16px;margin:0}
.bz-fgl-stat{min-width:0;padding-top:6px;border-top:2px solid var(--bz-fgl-ink)}
.bz-fgl-stat[data-empty="true"]{visibility:hidden}
.bz-fgl-stat dt{overflow:hidden;font:700 11px/14px var(--bz-fgl-mono);white-space:nowrap;text-overflow:ellipsis;letter-spacing:0.08em;text-transform:uppercase;color:var(--bz-fgl-muted)}
.bz-fgl-stat dd{margin:2px 0 0}
.bz-fgl-num{display:block;overflow:hidden;font:700 16px/26px var(--bz-fgl-mono);white-space:nowrap;text-overflow:ellipsis;font-variant-numeric:tabular-nums}
.bz-fgl-sub{display:-webkit-box;min-height:36px;overflow:hidden;font-size:13px;line-height:18px;color:var(--bz-fgl-muted);-webkit-box-orient:vertical;-webkit-line-clamp:2}

/* buttons and the footer */
.bz-fgl-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;min-width:48px;margin:0;padding:0 16px;border:2px solid var(--bz-fgl-ink);border-radius:0;background:var(--bz-fgl-panel);color:var(--bz-fgl-ink);font:600 14px/1.2 var(--bz-fgl-sans);text-align:left;cursor:pointer;transition:background-color var(--bz-fgl-fast) var(--bz-fgl-ease),transform var(--bz-fgl-fast) var(--bz-fgl-ease)}
.bz-fgl-btn:hover,.bz-fgl-btn:focus-visible{background:var(--bz-fgl-track)}
.bz-fgl-btn:focus{outline:none}
.bz-fgl-btn:focus-visible{outline:2px solid var(--bz-fgl-focus);outline-offset:2px}
.bz-fgl[data-motion="on"] .bz-fgl-btn:active{transform:scale(0.97)}
.bz-fgl-btn:disabled{opacity:0.5;cursor:not-allowed}
.bz-fgl-primary{border-color:var(--fgl-accent);background:var(--fgl-accent);color:var(--fgl-onAccent)}
.bz-fgl-primary:hover,.bz-fgl-primary:focus-visible{background:color-mix(in srgb,var(--fgl-accent) 86%,var(--bz-fgl-ink))}
.bz-fgl-btn[aria-pressed="true"]{border-color:var(--bz-fgl-ink);background:var(--bz-fgl-ink);color:var(--bz-fgl-panel)}
.bz-fgl-cur{display:inline-flex}
.bz-fgl-cur .bz-fgl-g{width:8px;height:14px}
.bz-fgl-btn:not([data-current="true"]) .bz-fgl-cur{visibility:hidden}
.bz-fgl-foot{display:flex;align-items:center;gap:10px 16px;margin-top:12px}
.bz-fgl-meta{flex:1 1 auto;display:-webkit-box;min-width:0;min-height:38px;margin:0;overflow:hidden;font-size:13px;line-height:19px;color:var(--bz-fgl-muted);-webkit-box-orient:vertical;-webkit-line-clamp:2}
.bz-fgl-meta b{font-weight:600;color:var(--bz-fgl-ink)}
.bz-fgl-meta .bz-fgl-g{display:inline-block;margin-right:6px;vertical-align:-2px;color:var(--fgl-accent)}
.bz-fgl-toys{display:flex;flex:none;gap:8px}
.bz-fgl-toy{padding:0 14px;font-size:13.5px}
.bz-fgl-toy[data-hide="true"],.bz-fgl-continue[data-hide="true"]{visibility:hidden}

/* narrow: under 560px of container */
@container (max-width:559px){
.bz-fgl-frame{padding:12px 12px 14px}
.bz-fgl-art{height:184px}
.bz-fgl-plate{width:100%}
.bz-fgl-box-in{padding:12px 12px 10px}
.bz-fgl-log{min-height:96px}
.bz-fgl-alert{min-height:72px}
.bz-fgl-menu{display:grid;grid-template-columns:1fr 1fr}
.bz-fgl-menu .bz-fgl-btn{justify-content:flex-start;padding:0 12px}
/* Compact results: the box reserves their height for the whole run, so keep it near the menu's. */
.bz-fgl-finish{margin-bottom:8px}
.bz-fgl-stats{gap:10px 12px}
.bz-fgl-num{line-height:22px}
.bz-fgl-sub{min-height:18px;-webkit-line-clamp:1}
.bz-fgl-foot{flex-wrap:wrap}
.bz-fgl-meta{flex-basis:100%}
.bz-fgl-toys{flex:1 1 auto;justify-content:space-between}
}

/* motion off: no loops, no travel */
.bz-fgl[data-motion="off"] .bz-fgl-sprite g,.bz-fgl[data-motion="off"] .bz-fgl-bob,.bz-fgl[data-motion="off"] .bz-fgl-hatch{animation:none!important}
.bz-fgl[data-motion="off"] .bz-fgl-btn{transition:background-color var(--bz-fgl-fast) linear}
.bz-fgl[data-running="false"] *{animation-play-state:paused!important}
`;

/* ---------------- flap gate: component ---------------- */

const FGL_MENU = ["retry", "skip", "cancel", "details"] as const;
type FglMenuItem = (typeof FGL_MENU)[number];

export function FlapGateLoader(props: FlapGateLoaderProps) {
  const {
    steps,
    title,
    headingLevel = 2,
    palette = "daybreak",
    character = "ember",
    colorScheme,
    labels: labelsProp,
    stats,
    onRetry,
    onSkip,
    onCancel,
    onContinue,
    reducedMotion,
    className = "",
    style,
  } = props;

  const uid = `bz-fgl-${useId().replace(/:/g, "")}`;
  const titleId = `${uid}-title`;
  const detailsId = `${uid}-details`;
  const labels: LoaderLabels = useMemo(() => ({ ...LOADER_LABELS, unit: "Gate", clear: "All gates cleared", ...labelsProp }), [labelsProp]);

  const prefersReduced = useReducedMotionPreference();
  const reduced = reducedMotion ?? prefersReduced;
  const [paused, setPaused] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const onscreen = useOnscreen(rootRef);
  const visible = usePageVisible();
  const motionAllowed = !reduced && !paused;
  const running = onscreen && visible;

  const [view, setView] = useState<LoaderView>(() => initialLoaderView(steps, labels));

  const refs: FglRefs = {
    root: rootRef,
    art: useRef<HTMLDivElement>(null),
    clouds: useRef<HTMLDivElement>(null),
    world: useRef<HTMLDivElement>(null),
    pipes: useRef<HTMLDivElement>(null),
    ground: useRef<HTMLDivElement>(null),
    hero: useRef<HTMLDivElement>(null),
    hop: useRef<HTMLDivElement>(null),
    bob: useRef<HTMLDivElement>(null),
    sprite: useRef<HTMLDivElement>(null),
    fx: useRef<HTMLDivElement>(null),
    score: useRef<HTMLDivElement>(null),
    banner: useRef<HTMLDivElement>(null),
  };
  const logRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const menuRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const detailsRef = useRef<HTMLParagraphElement>(null);
  const [detailsScroll, setDetailsScroll] = useState(false);
  const engineRef = useRef<LoaderEngine | null>(null);
  const latest = useRef({ props, labels, steps, motion: { reduced, paused, onscreen, visible } });
  latest.current = { props, labels, steps, motion: { reduced, paused, onscreen, visible } };

  useIsoLayoutEffect(() => {
    const engine = createLoaderEngine(
      {
        labels: () => latest.current.labels,
        host: () => latest.current.props,
        emit: (patch) => setView((v) => ({ ...v, ...patch })),
        focusInside: () => {
          const a = document.activeElement;
          return !!a && a !== rootRef.current && !!rootRef.current?.contains(a);
        },
        focusInError: () => !!errorRef.current?.contains(document.activeElement),
        root: () => rootRef.current,
        resized: () => scrollLogToLines(logRef.current),
      },
      (core) => createFlapGateArena(core, refs, uid),
    );
    engineRef.current = engine;
    engine.motion(latest.current.motion);
    engine.rebuild(latest.current.steps);
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
    // The engine lives for the component's life; it reads props through `latest`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useIsoLayoutEffect(() => {
    engineRef.current?.update(steps);
  }, [steps]);

  useIsoLayoutEffect(() => {
    engineRef.current?.motion({ reduced, paused, onscreen, visible });
  }, [reduced, paused, onscreen, visible]);

  useIsoLayoutEffect(() => {
    scrollLogToLines(logRef.current);
  }, [view.lines]);

  // Details longer than their space scroll, so they take a tab stop to be scrolled from the keyboard.
  useIsoLayoutEffect(() => {
    const el = detailsRef.current;
    setDetailsScroll(!!el && view.detailsOpen && el.scrollHeight > el.clientHeight + 1);
  }, [view.detailsOpen, view.details]);

  const menuItems = FGL_MENU.filter((m) => (m === "retry" ? !!onRetry : m === "skip" ? !!onSkip : m === "cancel" ? !!onCancel : true));
  const menuCur = Math.max(0, Math.min(view.menu, menuItems.length - 1));

  useIsoLayoutEffect(() => {
    const f = view.focus;
    if (!f) return;
    const target = f.to === "retry" ? menuRefs.current[0] : f.to === "log" ? logRef.current : continueRef.current;
    target?.focus();
  }, [view.focus]);

  /* ---- derived text */
  const n = steps.length;
  const settledN = steps.filter(settled).length;
  const skippedN = steps.filter((s) => s.status === "skipped").length;
  let hostAt = steps.findIndex((s) => s.status === "active" || s.status === "error");
  if (hostAt < 0) hostAt = steps.findIndex((s) => s.status === "pending");
  const phase = view.phase;
  let valueText: string;
  if (phase === "stopped") valueText = `Stopped at step ${Math.max(0, hostAt) + 1} of ${n}`;
  else if (n && settledN === n) valueText = labels.complete(n, skippedN).replace(/\.$/, "");
  else if (hostAt >= 0 && steps[hostAt].status === "error") valueText = `Step ${hostAt + 1} of ${n}: ${steps[hostAt].label}, failed`;
  else if (hostAt >= 0 && steps[hostAt].status === "active") valueText = `Step ${hostAt + 1} of ${n}: ${steps[hostAt].label}`;
  else valueText = labels.queued(n, steps[0]?.label ?? "");

  const ps = steps[view.front];
  const complete = phase === "complete" || !ps;
  // Size unknown while running, and still unknown if that step fails: the hatch stays, without the march.
  const indet = !complete && (ps.status === "active" || ps.status === "error") && ps.progress == null;
  const isError = !complete && phase === "error";
  const attempt = ps?.attempt ?? 1;
  const showTag = !complete && attempt > 1 && (ps.status === "active" || ps.status === "error");
  let count = "";
  if (complete) count = `${n} of ${n}`;
  else if (ps.status === "skipped") count = "Skipped";
  else if (indet) {
    const secs = Math.floor((ps.elapsedMs ?? 0) / 1000);
    count = `${labels.sizeUnknown}${secs >= 10 ? ` · ${secs}s` : ""}`;
  } else if (ps.status === "done") count = ps.detail || "Done";
  else if (ps.status === "active" || ps.status === "error") count = view.barDetail ?? (view.barP != null ? `${Math.floor(view.barP * 100)}%` : "");
  const fill = complete ? 100 : ps.status === "pending" ? 0 : Math.round((view.barP ?? 0) * 1000) / 10;

  let metaHead: string;
  let metaTail = "";
  const frontNo = Math.min(view.front + 1, n);
  if (phase === "complete") {
    metaHead = labels.clear;
    metaTail = `${n} of ${n}`;
  } else if (phase === "stopped") {
    metaHead = `${labels.unit} ${frontNo} of ${n}`;
    metaTail = labels.stopped(steps.filter((s) => s.status === "done").length);
  } else if (phase === "error") {
    metaHead = `${labels.unit} ${frontNo} of ${n}`;
    metaTail = labels.waiting;
  } else {
    metaHead = `${labels.unit} ${frontNo} of ${n}`;
    const next = steps.slice(view.front + 1).filter((s) => !settled(s)).slice(0, 2).map((s) => s.label);
    if (next.length) metaTail = `Next: ${next.join(", then ")}`;
  }

  const errStep = steps[view.errorAt];
  const statsN = stats?.length ?? 0;
  // The longest completion line this run can produce reserves its height from the start.
  const finishSizer = `${labels.complete(n, n)}${props.completeText ? ` ${props.completeText}` : ""}`;
  const slots = Array.from({ length: 3 + statsN }, (_, k) => view.tiles[k] ?? null);
  const showContinue = !!onContinue;
  const H = `h${headingLevel}` as "h2";

  const paletteSet = typeof palette === "string" ? FLAP_GATE_LOADER_PALETTES[palette] ?? FLAP_GATE_LOADER_PALETTES.daybreak : palette;
  const ch = typeof character === "string" ? LOADER_CHARACTERS[character] ?? LOADER_CHARACTERS.ember : character;
  const rootStyle = useMemo(() => {
    const vars: Record<string, string> = {};
    FGL_COLOR_KEYS.forEach((k) => {
      vars[`--fgl-${k}`] = `light-dark(${paletteSet.light[k]}, ${paletteSet.dark[k]})`;
    });
    // A skipped gate's ghost: the pipe line on light skies, the pipe highlight on dark ones.
    vars["--fgl-ghost"] = `light-dark(${paletteSet.light.pipeLine}, ${paletteSet.dark.pipeLight})`;
    vars["--fgl-halo"] = `light-dark(${paletteSet.light.spriteHalo ?? "transparent"}, ${paletteSet.dark.spriteHalo ?? "transparent"})`;
    return { ...vars, ...loaderCharacterVars(ch), ...(colorScheme ? { colorScheme } : {}) } as CSSProperties;
  }, [paletteSet, ch, colorScheme]);

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const total = menuItems.length;
    let j = menuCur;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") j = (menuCur + 1) % total;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") j = (menuCur - 1 + total) % total;
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = total - 1;
    else return;
    e.preventDefault();
    setView((v) => ({ ...v, menu: j }));
    menuRefs.current[j]?.focus();
  };

  const onMenu = (item: FglMenuItem) => {
    if (item === "retry") {
      if (errStep) onRetry?.(errStep.id);
    } else if (item === "skip") {
      if (errStep) onSkip?.(errStep.id);
    } else if (item === "cancel") engineRef.current?.cancel();
    else setView((v) => ({ ...v, detailsOpen: !v.detailsOpen }));
  };

  const menuText = (item: FglMenuItem) =>
    item === "retry" ? labels.retry : item === "skip" ? labels.skip : item === "cancel" ? labels.cancel : view.detailsOpen ? labels.hideDetails : labels.showDetails;

  return (
    <section
      ref={rootRef}
      className={`bz-fgl ${className}`.trim()}
      aria-labelledby={titleId}
      data-phase={phase}
      data-motion={motionAllowed ? "on" : "off"}
      data-running={String(running)}
      style={{ ...rootStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="bz-fgl-frame">
        <H id={titleId} className="bz-fgl-title" tabIndex={-1}>
          {title}
        </H>
        <ol className="bz-fgl-sr" aria-busy={phase === "run" ? "true" : "false"}>
          {steps.map((s, i) => {
            const word =
              s.status === "active"
                ? `Running${(s.attempt ?? 1) > 1 ? `, ${labels.attempt(s.attempt ?? 1).toLowerCase()}` : ""}`
                : s.status === "done"
                  ? `Done${s.durationMs != null ? ` in ${fmtDur(s.durationMs)}` : ""}`
                  : s.status === "skipped"
                    ? "Skipped"
                    : s.status === "error"
                      ? labels.failed
                      : "Waiting";
            return (
              <li key={s.id} aria-current={i === hostAt && (s.status === "active" || s.status === "error") ? "step" : undefined}>
                {`${s.label}: ${word}`}
              </li>
            );
          })}
        </ol>

        <div className="bz-fgl-arena">
          <div className="bz-fgl-art" ref={refs.art} aria-hidden="true">
            <div className="bz-fgl-clouds" ref={refs.clouds} />
            <div className="bz-fgl-world" ref={refs.world}>
              <div className="bz-fgl-pipes" ref={refs.pipes} />
              <div className="bz-fgl-ground" ref={refs.ground} />
            </div>
            <div className="bz-fgl-hero" ref={refs.hero}>
              <div className="bz-fgl-hop" ref={refs.hop}>
                <div className="bz-fgl-bob" ref={refs.bob}>
                  <div className="bz-fgl-sprite" ref={refs.sprite} data-frame="fly1" data-flame="on">
                    <CharacterSprite hairStyle={ch.hairStyle} frames={FGL_FRAMES} accessories={fglAccessories} accessoriesKey="jetpack" layers={FGL_LAYERS} />
                  </div>
                </div>
              </div>
            </div>
            <div className="bz-fgl-fx" ref={refs.fx} />
            <div className="bz-fgl-score" ref={refs.score} />
            <div className="bz-fgl-banner" ref={refs.banner} data-on={String(view.banner)}>
              <span className="bz-fgl-banner-in">
                {labels.clear}
                <span className="bz-fgl-banner-rule" />
              </span>
            </div>
          </div>
        </div>

        <div
          className="bz-fgl-plate"
          role="progressbar"
          aria-labelledby={titleId}
          aria-valuemin={0}
          aria-valuemax={Math.max(1, n)}
          aria-valuenow={settledN}
          aria-valuetext={valueText}
          data-state={isError ? "error" : complete ? "done" : ps.status}
        >
          <div className="bz-fgl-plate-top">
            <span className="bz-fgl-plate-label">{complete ? labels.clear : ps.label}</span>
            <span className="bz-fgl-tag" hidden={!showTag}>
              {labels.attempt(attempt)}
            </span>
            <span className="bz-fgl-failed" hidden={!isError}>
              <Glyph name="cross" />
              {labels.failed}
            </span>
          </div>
          <div className="bz-fgl-plate-row">
            <span className="bz-fgl-bar" data-indet={String(indet)}>
              <span key={`${view.run}-${view.front}`} className="bz-fgl-fill" style={{ width: `${fill}%` }} />
              <span className="bz-fgl-hatch">
                <svg shapeRendering="crispEdges" aria-hidden="true" focusable="false">
                  <defs>
                    <pattern id={`${uid}-hatch`} width="8" height="8" patternUnits="userSpaceOnUse">
                      <path d="M0 6h2v2H0zM2 4h2v2H2zM4 2h2v2H4zM6 0h2v2H6z" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#${uid}-hatch)`} />
                </svg>
              </span>
            </span>
            <span className="bz-fgl-count">{count}</span>
          </div>
        </div>

        <div className="bz-fgl-box">
          <div className="bz-fgl-box-in">
            <div className="bz-fgl-stack">
              <div className="bz-fgl-panel bz-fgl-talk" data-on={String(!view.resultsOpen)} data-covered={String(phase === "error")}>
                <div className="bz-fgl-log" ref={logRef} role="log" aria-label={labels.narration} tabIndex={phase === "error" || view.resultsOpen ? -1 : 0}>
                  {view.lines.map((l) => (
                    <p key={l.key} className="bz-fgl-line" data-kind={l.kind}>
                      <Glyph name={l.kind} />
                      <span>{l.text}</span>
                    </p>
                  ))}
                </div>
                {view.lines.length === 0 && (
                  <p className="bz-fgl-intro" aria-hidden="true">
                    {view.intro}
                  </p>
                )}
              </div>

              <div className="bz-fgl-panel bz-fgl-err" ref={errorRef} data-on={String(phase === "error")}>
                {/* The details open in the alert's place, so the box never grows. */}
                <div className="bz-fgl-errtop">
                  <div className="bz-fgl-alert" role="alert" data-covered={String(view.detailsOpen)}>
                    {view.alert ? (
                      <>
                        <Glyph name="cross" />
                        <span>{view.alert}</span>
                      </>
                    ) : null}
                  </div>
                  <p id={detailsId} ref={detailsRef} className="bz-fgl-details" data-open={String(view.detailsOpen)} tabIndex={detailsScroll ? 0 : undefined}>
                    {view.details}
                  </p>
                </div>
                <div className="bz-fgl-menu" role="group" aria-label={labels.menu} onKeyDown={onMenuKey}>
                  {menuItems.map((item, k) => (
                    <button
                      key={item}
                      ref={(el) => {
                        menuRefs.current[k] = el;
                      }}
                      type="button"
                      className={`bz-fgl-btn${item === "retry" ? " bz-fgl-primary" : ""}`}
                      tabIndex={k === menuCur ? 0 : -1}
                      data-current={String(k === menuCur)}
                      aria-expanded={item === "details" ? view.detailsOpen : undefined}
                      aria-controls={item === "details" ? detailsId : undefined}
                      onFocus={() => {
                        if (k !== menuCur) setView((v) => ({ ...v, menu: k }));
                      }}
                      onClick={() => onMenu(item)}
                    >
                      <span className="bz-fgl-cur">
                        <Glyph name="cursor" />
                      </span>
                      {menuText(item)}
                      {(item === "retry" || item === "skip") && errStep ? <span className="bz-fgl-sr">{` ${errStep.label}`}</span> : null}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bz-fgl-panel bz-fgl-results" data-on={String(view.resultsOpen)}>
                <p className="bz-fgl-finish">
                  <Glyph name="finish" />
                  <span className="bz-fgl-finish-text">
                    <span className="bz-fgl-sizer" aria-hidden="true">
                      {finishSizer}
                    </span>
                    <span>{view.finishText}</span>
                  </span>
                </p>
                <dl className="bz-fgl-stats">
                  {slots.map((t, k) => (
                    <div key={k} className="bz-fgl-stat" data-empty={String(!t)}>
                      <dt>{t ? t.label : "\u00a0"}</dt>
                      <dd>
                        <span className="bz-fgl-num" aria-hidden="true">
                          {t ? view.counts[k] ?? t.text : "\u00a0"}
                        </span>
                        {t ? <span className="bz-fgl-sr">{t.text}</span> : null}
                        <span className="bz-fgl-sub">{t ? t.sub || "\u00a0" : "\u00a0"}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bz-fgl-foot">
          <p className="bz-fgl-meta" aria-hidden="true">
            {view.note ? (
              <>
                <Glyph name="clock" />
                {view.note}
              </>
            ) : (
              <>
                <b>{metaHead}</b>
                {metaTail ? ` · ${metaTail}` : ""}
              </>
            )}
          </p>
          <div className="bz-fgl-toys">
            <button
              type="button"
              className="bz-fgl-btn bz-fgl-toy"
              aria-pressed={paused}
              data-hide={String(reduced)}
              onClick={() => setPaused((p) => !p)}
            >
              <Glyph name="pause" />
              {labels.pauseMotion}
            </button>
            {showContinue ? (
              <button
                ref={continueRef}
                type="button"
                className="bz-fgl-btn bz-fgl-primary bz-fgl-continue"
                data-hide={String(!(view.resultsOpen && view.continueOn))}
                onClick={() => onContinue?.()}
              >
                {labels.continue}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
