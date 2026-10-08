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
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";

/*
 * SnakeLineLoader: a multi-step loader drawn as a Snake board, where the snake
 * moves only when the work does.
 *
 * A fixed serpentine path runs across the board, and every step owns a run of
 * cells on it with a pellet at the end; the last step's pellet is a gold apple
 * you can see from the start. The head sits at the previous pellet plus the
 * share of the cells your process has reported, so the snake slides forward
 * only on real progress, and it eats a pellet only when the step is done. It
 * grows one segment per finished step, so its length always reads 3 plus the
 * steps done. A skipped step leaves a dashed slot the snake passes over without
 * growing. The player stands in a booth beside the status strip and wears the
 * same scarf as the snake: a hop when a pellet goes, a stumble and a sit when a
 * step fails, a cheer at the end.
 *
 * Nothing moves on a timer. The snake, the bar and the count change only when
 * the steps you pass in change: at most one hit every 400ms, with the
 * increments in between merged, and every slide ends exactly on the reported
 * progress. A step whose size is unknown gets a hatched bar and a snake that
 * holds still and flicks its tongue on the beat, instead of invented progress.
 *
 * The loader is controlled, the same way Stepper is. `steps` is its only
 * state and the host owns every transition: it starts, advances, fails,
 * retries and skips steps. The error menu calls `onRetry`, `onSkip` and
 * `onCancel`, the results screen calls `onContinue`, and `onComplete` fires
 * once per run after the finale.
 *
 * The section is named by its heading. A visually hidden list carries every
 * step and its state, with `aria-current` on the current one and `aria-busy`
 * only while work runs, so neither live region sits in a busy subtree. The
 * status strip is the one progressbar. The dialogue box is a `role="log"` that
 * narrates milestones in sentences rather than ticks; errors go to a
 * `role="alert"` and a menu with a roving focus. Focus moves only when it is
 * already inside the loader.
 *
 * Reduced motion (followed live, or forced with `reducedMotion`) removes
 * every loop and tween: the snake snaps to its honest cell and the player
 * holds a still pose. The Pause motion button does the same on request. Off
 * screen or in a hidden tab nothing animates and finished steps settle
 * without their beats; on return the footer says what finished meanwhile.
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
  /** The completion sentence. Default "All 5 steps finished." or "All 5 steps finished (1 skipped)." */
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
  queued: (n, first) => `${n} step${n === 1 ? "" : "s"} queued. Up first: ${first}.`,
  progress: (done, total, now) => `${done} of ${total} done. Now: ${now}.`,
  away: (n) => `While you were away: ${n} step${n === 1 ? "" : "s"} finished.`,
  complete: (total, skipped) => `All ${total} step${total === 1 ? "" : "s"} finished${skipped ? ` (${skipped} skipped)` : ""}.`,
  stopped: (kept) => `Stopped. ${kept} finished step${kept === 1 ? " is" : "s are"} kept.`,
};

/* ---------------- end shared: types and labels ---------------- */

/* ---------------- palettes ---------------- */

export type SnakeLineLoaderColors = {
  /** The board. */
  board: string;
  /** The dot in the middle of every cell. */
  grid: string;
  /** The board's frame, the player's booth and the dialogue box border. */
  frame: string;
  /** The snake's body. */
  snake: string;
  /** Its shaded side, under and to the right of each segment. */
  snakeShade: string;
  /** Its outline. */
  snakeLine: string;
  /** Pellet fill, and the snake's tongue. */
  pellet: string;
  /** Pellet outline. */
  pelletLine: string;
  /** The last step's apple. */
  apple: string;
  /** Its shaded side. */
  appleShade: string;
  /** Its outline and stem. */
  appleLine: string;
  /** Its leaf. */
  leaf: string;
  /** The dashed slot a skipped step leaves. */
  ghost: string;
  /** The player's silhouette edge, the outermost ring of pixels. Pick one that clears 3:1 on the board: dark on a light board, a light rim on a dark one, so dark hair keeps its edge. */
  spriteOutline: string;
  /** The player's inner lines: the jaw, the arm against the body, the belt. Usually a near black. */
  spriteLine: string;
  /** Primary buttons, the status bar and the attempt tag. */
  accent: string;
  /** Text on accent: white on light themes, near black on dark ones. */
  onAccent: string;
};

/** One colour set per theme. The loader picks between them with light-dark(), following the host's color-scheme. */
export type SnakeLineLoaderPalette = { light: SnakeLineLoaderColors; dark: SnakeLineLoaderColors };

/**
 * Two presets. Every text and control pair is AA on both themes. The snake,
 * the pellets, the frame and the dashed slot of a skipped step clear 3:1 on
 * their board, and so does the player's silhouette edge: near black on the
 * light boards, a pale rim on the dark ones (about 6:1 or more), so dark hair
 * still has an edge. Spread one to customise:
 * `{ ...SNAKE_LINE_LOADER_PALETTES.classic, dark: { ... } }`.
 */
export const SNAKE_LINE_LOADER_PALETTES = {
  classic: {
    light: { board: "#d8f5b4", grid: "#8fbf62", frame: "#14532d", snake: "#2b8a3e", snakeShade: "#1f6e30", snakeLine: "#14532d", pellet: "#d6336c", pelletLine: "#6b0f2f", apple: "#f4b740", appleShade: "#c98a12", appleLine: "#5a3a00", leaf: "#2f9e44", ghost: "#14532d", spriteOutline: "#17142e", spriteLine: "#17142e", accent: "#15803d", onAccent: "#ffffff" },
    dark: { board: "#0e2318", grid: "#1f4a32", frame: "#4ade80", snake: "#4ade80", snakeShade: "#22a35a", snakeLine: "#0a1a12", pellet: "#ff6b9a", pelletLine: "#3a0a1a", apple: "#fbbf24", appleShade: "#d4970f", appleLine: "#3a2500", leaf: "#4ade80", ghost: "#86efac", spriteOutline: "#6fbf8f", spriteLine: "#0b0918", accent: "#4ade80", onAccent: "#0a0a0a" },
  },
  neon: {
    light: { board: "#eef9ff", grid: "#c4e4f2", frame: "#17142e", snake: "#0e7490", snakeShade: "#0b5a70", snakeLine: "#082f3d", pellet: "#be185d", pelletLine: "#4a0a24", apple: "#facc15", appleShade: "#d4a106", appleLine: "#5a3a00", leaf: "#0e7490", ghost: "#17142e", spriteOutline: "#17142e", spriteLine: "#17142e", accent: "#0e7490", onAccent: "#ffffff" },
    dark: { board: "#120b2e", grid: "#2a1f55", frame: "#a78bfa", snake: "#22d3ee", snakeShade: "#0891b2", snakeLine: "#061a26", pellet: "#f472b6", pelletLine: "#3a0a24", apple: "#facc15", appleShade: "#d4a106", appleLine: "#3a2500", leaf: "#22d3ee", ghost: "#a78bfa", spriteOutline: "#9d8fd4", spriteLine: "#0b0918", accent: "#22d3ee", onAccent: "#0a0a0a" },
  },
} as const satisfies Record<string, SnakeLineLoaderPalette>;

export type SnakeLineLoaderPaletteName = keyof typeof SNAKE_LINE_LOADER_PALETTES;

export type SnakeLineLoaderProps = {
  /** The run, and the only state. The host replaces the array whenever a step changes. */
  steps: LoaderStep[];
  /** The heading, and the progressbar's accessible name. */
  title: string;
  /** Heading level of the title. Default 2. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** A preset name or your own light and dark colours. Default "classic". */
  palette?: SnakeLineLoaderPaletteName | SnakeLineLoaderPalette;
  /** A preset player or your own colours. The player's accent is also the snake's scarf. Default "ember". */
  character?: LoaderCharacterName | LoaderCharacter;
  /** Force a theme. Default: inherit the host's color-scheme. */
  colorScheme?: "light" | "dark";
  /** Override any visible or announced string. Default English copy. */
  labels?: Partial<LoaderLabels>;
  /** Extra results tiles, real figures only. Default none. */
  stats?: LoaderStat[];
  /** Added to the completion line: "Your workspace is ready." Default none. */
  completeText?: string;
  /** Called with the failed step's id. Without it there is no Retry button. */
  onRetry?: (id: string) => void;
  /** Called with the failed step's id. Without it there is no Skip button. */
  onSkip?: (id: string) => void;
  /** Called once the loader shows its stopped state. Without it there is no Cancel button. */
  onCancel?: () => void;
  /** Adds a Continue button to the results screen. Default none. */
  onContinue?: () => void;
  /** Called once per run, after the finale's last beat. */
  onComplete?: () => void;
  /** Mirrors every line the log and the alert speak, for your own logging or tests. */
  onAnnounce?: (text: string, politeness: "polite" | "assertive") => void;
  /** Force motion off (true) or on (false). Default: follow prefers-reduced-motion live. */
  reducedMotion?: boolean;
  /** Class on the root section. */
  className?: string;
  /** Style on the root section. */
  style?: CSSProperties;
};

/* ---------------- shared: timing constants and helpers ---------------- */

/* The motion ladder, in milliseconds. BEAT is the one ambient beat. */
const FAST = 150;
const BASE = 300;
const SLOW = 500;
const BEAT = 2400;
const HIT_GAP = 400; // at most one progress hit per 400ms; increments in between merge
const IMPACT = 100; // a blow lands this long after the swing starts
const COLLECT = 100; // completions this close share a beat
const DWELL = 300; // a step holds the front at least this long
const BURST_MIN = 3; // this many queued completions become one beat
const COALESCE = 400; // completions this close share one sentence and one announcement

const loaderNow = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

function fmtDur(ms: number | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return "";
  if (ms < 950) return `${(Math.max(1, Math.round(ms / 100)) / 10).toFixed(1)}s`;
  if (ms < 9950) return `${(Math.round(ms / 100) / 10).toFixed(1)}s`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}

const listJoin = (a: string[]) => (a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);

/** Lowercases a leading capital unless the word is an initialism ("CSV"). */
const lowerFirst = (s: string) => (s && s.length > 1 && s[1] === s[1].toLowerCase() ? s[0].toLowerCase() + s.slice(1) : s || "");

const isSettled = (s: LoaderStep | undefined) => !!s && (s.status === "done" || s.status === "skipped");

/** The library's ease-out, cubic-bezier(0.23, 1, 0.32, 1), sampled in JS for stepped keyframes. */
function loaderEase(t: number): number {
  const curve = (a: number, b: number, s: number) => 3 * a * s * (1 - s) * (1 - s) + 3 * b * s * s * (1 - s) + s * s * s;
  let lo = 0;
  let hi = 1;
  let s = t;
  for (let i = 0; i < 24; i++) {
    s = (lo + hi) / 2;
    if (curve(0.23, 0.32, s) < t) lo = s;
    else hi = s;
  }
  return curve(1, 1, s);
}

/** Held positions in whole CSS pixels: each keyframe holds until the next, so pixel art is never resampled mid-move. */
function loaderStepped(points: Array<[number, number, number, number?]>): Keyframe[] {
  return points.map(([offset, x, y, o]) => ({
    offset,
    easing: "step-end",
    transform: `translate(${Math.round(x)}px, ${Math.round(y)}px)`,
    ...(o == null ? {} : { opacity: o }),
  }));
}

/** A slide sampled from the ease-out curve about every 33ms, as stepped whole-pixel keyframes. */
function loaderGlide(fx: number, fy: number, tx: number, ty: number, ms: number): Keyframe[] {
  const n = Math.max(2, Math.round(ms / 33));
  const out: Keyframe[] = [];
  for (let j = 0; j <= n; j++) {
    const e = loaderEase(j / n);
    out.push({
      offset: j / n,
      easing: "step-end",
      transform: `translate(${Math.round(fx + (tx - fx) * e)}px, ${Math.round(fy + (ty - fy) * e)}px)`,
    });
  }
  return out;
}

/** Horizontal runs of one colour key merged into one path each, in art pixels. */
function loaderPixelPaths(map: readonly string[]): Array<[string, string]> {
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
  return Array.from(paths);
}

/** Markup for an arena sprite: one path per key, each with a class that CSS maps to a palette colour. */
function loaderPixelSvg(map: readonly string[], roles: Record<string, string>, crop?: [number, number, number, number]): string {
  const box = crop ?? [0, 0, map[0].length, map.length];
  let out = `<svg viewBox="${box.join(" ")}" preserveAspectRatio="none" shape-rendering="crispEdges" aria-hidden="true" focusable="false">`;
  for (const [k, d] of loaderPixelPaths(map)) out += `<path class="bz-snl-k-${roles[k] ?? k}" d="${d}"/>`;
  return `${out}</svg>`;
}

const loaderKebab = (key: string) => key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/** A palette as custom properties on the root, each one light-dark(<light>, <dark>). */
function loaderPaletteVars(light: Record<string, string>, dark: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(light)) out[`--bz-snl-${loaderKebab(key)}`] = `light-dark(${light[key]}, ${dark[key] ?? light[key]})`;
  return out;
}

/* 7 x 7 glyphs (the cursor is 4 x 7), drawn in currentColor. */
const LOADER_GLYPHS = {
  done: [".......", "......#", ".....##", "#...##.", "##.##..", ".###...", "..#...."],
  skipped: [".......", ".......", ".......", "#######", "#######", ".......", "......."],
  retry: ["..###.#", ".#...##", "#...###", "#......", "#.....#", ".#...#.", "..###.."],
  finish: ["...#...", "...#...", "#######", ".#####.", "..###..", ".##.##.", "##...##"],
  stop: [".......", ".#####.", ".#####.", ".#####.", ".#####.", ".#####.", "......."],
  cross: ["##...##", "###.###", ".#####.", "..###..", ".#####.", "###.###", "##...##"],
  pause: [".......", ".##.##.", ".##.##.", ".##.##.", ".##.##.", ".##.##.", "......."],
  cursor: ["#...", "##..", "###.", "####", "###.", "##..", "#..."],
  clock: ["..###..", ".#...#.", "#..#..#", "#..##.#", "#.....#", ".#...#.", "..###.."],
} as const;

type LoaderGlyphName = keyof typeof LOADER_GLYPHS;

const LOADER_GLYPH_D = Object.fromEntries(
  Object.entries(LOADER_GLYPHS).map(([name, map]) => [name, loaderPixelPaths(map).map(([, d]) => d).join("")]),
) as Record<LoaderGlyphName, string>;

function LoaderGlyph({ name }: { name: LoaderGlyphName }) {
  const map = LOADER_GLYPHS[name];
  return (
    <svg className="bz-snl-g" viewBox={`0 0 ${map[0].length} ${map.length}`} shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <path d={LOADER_GLYPH_D[name]} />
    </svg>
  );
}

/* ---------------- end shared: timing constants and helpers ---------------- */

/* ---------------- shared: character ---------------- */

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
  /** Hair shade, darker than hair: under the fringe, on the far side and at the nape. */
  hairShade: string;
  /** Tunic body. */
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
  /** Boots and the belt leather. */
  boots: string;
  /** Boot shade. */
  bootsShade: string;
  /** Eye white. Default #ffffff. */
  eyeWhite?: string;
  /** Pupils and mouth. Default #1b1630. */
  eye?: string;
};

/** Four adventurers: four skin tones, four hair styles, four outfit hues. The outfits carry the silhouette on dark skies. */
export const LOADER_CHARACTERS: Record<LoaderCharacterName, LoaderCharacter> = {
  ember: { hairStyle: "puffs", skin: "#8d5524", skinShade: "#6b3d18", hair: "#4a3128", hairShade: "#2a1b15", outfit: "#ff5a36", outfitShade: "#c43d20", outfitLight: "#ff9a7a", accent: "#ffd23f", pants: "#3f64b5", pantsShade: "#2b4a8a", boots: "#5b3a1e", bootsShade: "#3d2614" },
  tide: { hairStyle: "ponytail", skin: "#f3c7a5", skinShade: "#d9a07c", hair: "#e0702c", hairShade: "#a84e1a", outfit: "#3d8bfd", outfitShade: "#2563c9", outfitLight: "#8cbcff", accent: "#ff6fa5", pants: "#e6d3a3", pantsShade: "#c2a970", boots: "#7a4a28", bootsShade: "#55331b" },
  moss: { hairStyle: "short", skin: "#c68e5f", skinShade: "#a06c42", hair: "#4f4760", hairShade: "#2e2838", outfit: "#3fbf5a", outfitShade: "#2a8a3f", outfitLight: "#8fe39f", accent: "#ff9f1c", pants: "#8b5e34", pantsShade: "#6b4526", boots: "#2f2a3a", bootsShade: "#1f1b27" },
  plum: { hairStyle: "wrap", skin: "#a8693f", skinShade: "#82502c", hair: "#e0457b", hairShade: "#b02f5e", outfit: "#a06cf0", outfitShade: "#7a4bc4", outfitLight: "#c9a8ff", accent: "#2ec4b6", pants: "#4a5a8c", pantsShade: "#36426a", boots: "#8a5a2b", bootsShade: "#62401e" },
};

/*
 * The adventurer is 16 x 24 art pixels, faces right and stands on row 23,
 * with a 1px outline all round and the light from the top left. Keys:
 *   . clear   o outline (the game palette)   h hair   H hair shade
 *   s skin    S skin shade   w eye white   e pupil   m mouth
 *   c outfit  C outfit shade   l outfit light   a accent (scarf, buckle)
 *   p trousers   P trousers shade   b boots and belt   B boot shade
 * Accessories add j and J (jetpack), f and F (flame), k and K (wood).
 * A head (16 x 11) takes a face patch and sits at a per-frame offset; the
 * body for the pose is anchored to the bottom row and drawn over it.
 * Once a frame is composed, every outline pixel that does not touch the
 * outside becomes i, an inner line, so a light rim on a dark sky wraps the
 * silhouette while the jaw, arm and belt lines stay dark.
 */
const LOADER_HERO_W = 16;
const LOADER_HERO_H = 24;

const LOADER_HEADS: Record<LoaderCharacter["hairStyle"], readonly string[]> = {
  short: ["....oo.oo.oo....", "...ohhohhohho...", "..ohhhhhhhhhhoo.", "..ohhhhhhhhhHHo.", "..ohhhhhhhHhHHo.", "..ohhhhhHHsHsso.", "..ohhSsssssssso.", "..ohHssssssssso.", "..oHHsssssSssSo.", "...oHsssssssSo..", "....ooooooooo..."],
  ponytail: [".....oooooo.....", "...oohhhhhhhoo..", ".ooahhhhhhhhhho.", "ohHohhhhhhhhhHo.", "ohHohhhhhhhhHHo.", "ohHohhhhhHshsso.", "oHHohSsssssssso.", ".oHoHssssssssso.", ".oHoHsssssSssSo.", "..ooHsssssssSo..", "....ooooooooo..."],
  puffs: [".ooo...ooooo....", "ohhho.ohhhhho...", "ohhHhohhhhhHo...", ".oHHhhhhhHHhhho.", "..ohhhhhhhhhhHo.", "..ohhhhssssssso.", "..ohhSsssssssso.", "..ohHssssssssso.", "..oHHsssssSssSo.", "...oHsssssssSo..", "....ooooooooo..."],
  wrap: [".......oooo.oo..", ".....oohhhhoHho.", "...oohhhhhHHHo..", "..ohhhhhhhHhhho.", "..ohhhhhhhhhhHo.", "..oaaaaaaaaaaao.", "..ohhSsssssssso.", "..ohHssssssssso.", "..oHHsssssSssSo.", "...oHsssssssSo..", "....ooooooooo..."],
};

/* Face patches over cols 7 to 13 and rows 6 to 9 of a head; "_" keeps the head pixel. */
type LoaderEyes = "open" | "blink" | "squint" | "happy";
const LOADER_FACE_X = 7;
const LOADER_FACE_Y = 6;
const LOADER_FACES: Record<LoaderEyes, readonly string[]> = {
  open: ["_we_we_", "_we_we_", "_______", "____m__"],
  blink: ["_______", "_ee_ee_", "_______", "____m__"],
  squint: ["_e___e_", "__e_e__", "_e___e_", "___mm__"],
  happy: ["_e___e_", "e_e_e_e", "_______", "___mm__"],
};

type LoaderPose = "idle" | "run1" | "run2" | "run3" | "run4" | "jump" | "bonk" | "swing1" | "swing2" | "hurt" | "sit" | "celebrate1" | "celebrate2" | "fly1" | "fly2";

/* Bodies are anchored to the bottom row; taller maps reach up past the chin for a raised arm. */
const LOADER_BODIES: Record<LoaderPose, readonly string[]> = {
  idle: ["...oaaaaaaaao...", "...oClcccColco..", "...oClcccColco..", "...oClcccColco..", "...oSbbabbosso..", "...oolcccCCoo...", "....oppppPPo....", "....opPoppPo....", "....opPoppPo....", "....opPoppPo....", "....obBobbBo....", "....obBobbbBo...", "....ooooooooo..."],
  run1: [".ooo............", "oaaaaaaaaaaaao..", ".oaooClcccColco.", "..o.oClcccColcco", "....oClcccCoosso", "....oSbbabboooo.", "....oolcccCCo...", ".....oppppPPo...", "....oPPo.oppo...", "...oPPo..oppo...", "..oPPo....oppo..", ".oBBo.....obbBo.", ".oBo......obbbBo", "..o.......oooooo"],
  run2: ["..oaaaaaaaaaao..", ".oaaoClcccColco.", "..oooClcccColco.", "....oClcccColco.", "....oSbbabbosso.", "....oolcccCCoo..", ".....oppppPo....", ".....oPPoppo....", "..oBBBPoppPo....", "...oooooppPo....", ".......obbBo....", ".......obbbBo...", ".......oooooo..."],
  run3: [".ooo............", "oaaaaaaaaaaaao..", ".oaooClcccColco.", "..o.oClcccColcco", "....oClcccCoosso", "....oSbbabboooo.", "....oolcccCCo...", ".....oppppPPo...", "....oppo.oPPo...", "...oppo..oPPo...", "..oppo....oPPo..", ".obbo.....oBBBo.", ".obo......oBBBBo", "..o.......oooooo"],
  run4: ["..oaaaaaaaaaao..", ".oaaoClcccColco.", "..oooClcccColco.", "....oClcccColco.", "....oSbbabbosso.", "....oolcccCCoo..", ".....oppppPo....", ".....oppoPPo....", "..obbbpoPPPo....", "...oooooPPPo....", ".......oBBBo....", ".......oBBBBo...", ".......oooooo..."],
  jump: ["............oo..", "...oaaaaaaaosso.", "...oClcccColcCo.", "...oClcccCCo....", "..oSClcccCCo....", "...oobbabbbo....", "....olcccCCo....", "....oppppPPPo...", "....oPPoopppPo..", "...oPPo..obbBo..", "...oBBo..obbbBo.", "...oBBo..oooooo.", "....oo..........", "................"],
  bonk: [".............oo.", "............osso", "............oSso", ".............lco", ".............lco", ".............lco", ".............lco", ".............lco", "...oaaaaaaaaolco", "...oClcccCCCClco", "...oClcccCCCCco.", "...oClcccCCCCo..", "...oSbbabbbbo...", "....olcccCCo....", "....oppppPPo....", "....opPoppPo....", "....opPoopPo....", "....obBo.obBo...", "....oBBo.obbo...", ".....oo...oo....", "................"],
  swing1: ["..oaaaaaaaao.oo.", "..oClcccColcosso", "..oClcccColcolco", "..oClcccColccco.", "..oSbbabbooooo..", "...olcccCCo.....", "...oppppPPPo....", "...opPPoopPPo...", "..opPo...opPo...", "..opPo...opPo...", "..obBo...obbBo..", "..obbBo..obbbBo.", "..ooooo..oooooo."],
  swing2: ["....oaaaaaaaao..", "....oClcccCoooo.", "....oClcccClcsso", "....oClcccCoooo.", "....oSbbabbo....", ".....olcccCo....", ".....opppPPPo...", "....oPPo.oppPo..", "...oPPo...oppPo.", "..oPPo....oppPo.", ".oBBo.....obbBo.", "oBBBo.....obbbBo", "ooooo.....oooooo"],
  hurt: [".............oo.", "............osso", "..oaaaaaaaaolco.", "..oClcccCClco...", ".ooClcccCCo.....", "oSSoClccCCo.....", "oSoobbabbo......", ".o.olcccCo......", "...oppppPPo.....", "...opPoppPPo....", "...opPo.oppPo...", "...opPo..obbBo..", "...obBo..obbbBo.", "...obbBo..ooooo.", "...ooooo........"],
  sit: ["..oaaaaaaaao....", ".oCClcccColco...", "oSoClcccColcooo.", "oSobbabbossoobBo", "oSoppppppppppbBo", "ooPPPPPPPPPPPbBo", ".ooooooooooooooo"],
  celebrate1: [".............oo.", "............osso", "............oSso", ".............lco", ".............lco", ".............lco", ".............lco", ".............lco", "...oaaaaaaaaolco", "...oClcccCCCClco", "...oClcccCCCCco.", "...oClcccCCCCo..", "...oSbbabbbbo...", "....olcccCCo....", "....oppppPPo....", "....opPoppPo....", "....opPoppPo....", "....opPoppPo....", "....obBobbBo....", "....obBobbbBo...", "....ooooooooo..."],
  celebrate2: [".............oo.", "............osso", "............oSso", ".............lco", ".............lco", "...oaaaaaaaaolco", "...oClcccCCCClco", "...oClcccCCCCco.", "...oClcccCCCCo..", "...oSbbabbbbo...", "....olcccCCo....", "....oppppPPo....", "...opPPoopPPo...", "...opPo..opPo...", "...obBo..obBo...", "...obbBo.obbbBo.", "...ooooo.oooooo."],
  fly1: ["....oaaaaaaaao..", "....oClcccColco.", "....oClcccColcso", "....oClcccCCoooo", "....oSbbabbbo...", "....oolcccCCooo.", ".....opppppppPo.", ".....oPPPPopppo.", "......oooo.obbo.", "...........obbBo", "...........ooooo", "................", "................"],
  fly2: ["....oaaaaaaaao..", "....oClcccColco.", "....oClcccColcso", "....oClcccCCoooo", "....oSbbabbbo...", "....oolcccCCoo..", ".....opppppPPo..", ".....oPPPoppPo..", "......ooo.obbo..", "..........obbBo.", "..........ooooo.", "................", "................"],
};

export type LoaderFrameName = "idle1" | "idle2" | "run1" | "run2" | "run3" | "run4" | "jump" | "bonk" | "swing1" | "swing2" | "hurt" | "sit" | "celebrate1" | "celebrate2" | "fly1" | "fly2";

const LOADER_FRAMES: Record<LoaderFrameName, { body: LoaderPose; eyes: LoaderEyes; dx: number; dy: number }> = {
  idle1: { body: "idle", eyes: "open", dx: 0, dy: 0 },
  idle2: { body: "idle", eyes: "open", dx: 0, dy: 1 },
  run1: { body: "run1", eyes: "open", dx: 1, dy: 1 },
  run2: { body: "run2", eyes: "open", dx: 1, dy: 0 },
  run3: { body: "run3", eyes: "open", dx: 1, dy: 1 },
  run4: { body: "run4", eyes: "open", dx: 1, dy: 0 },
  jump: { body: "jump", eyes: "open", dx: 0, dy: 0 },
  bonk: { body: "bonk", eyes: "squint", dx: -1, dy: 0 },
  swing1: { body: "swing1", eyes: "open", dx: -1, dy: 0 },
  swing2: { body: "swing2", eyes: "open", dx: 1, dy: 0 },
  hurt: { body: "hurt", eyes: "squint", dx: -1, dy: 1 },
  sit: { body: "sit", eyes: "blink", dx: -1, dy: 6 },
  celebrate1: { body: "celebrate1", eyes: "happy", dx: -1, dy: 0 },
  celebrate2: { body: "celebrate2", eyes: "happy", dx: -1, dy: 1 },
  fly1: { body: "fly1", eyes: "open", dx: 1, dy: 0 },
  fly2: { body: "fly2", eyes: "open", dx: 1, dy: 0 },
};

const LOADER_FRAME_NAMES = Object.keys(LOADER_FRAMES) as LoaderFrameName[];

/* Colour key to the class role (bz-snl-c-<role>), which the stylesheet maps to a custom property. */
const LOADER_HERO_ROLES: Record<string, string> = {
  o: "outline", i: "line", h: "hair", H: "hair-shade", s: "skin", S: "skin-shade", w: "eye-white", e: "eye", m: "mouth",
  c: "outfit", C: "outfit-shade", l: "outfit-light", a: "accent", p: "pants", P: "pants-shade", b: "boots", B: "boots-shade",
  j: "jetpack", J: "jetpack-shade", f: "flame", F: "flame-core", k: "wood", K: "wood-shade",
};

/** A small map placed at (x, y) in the adventurer's art pixels. */
type LoaderLayer = { x: number; y: number; rows: readonly string[] };

/** A game's prop for the adventurer: layers drawn behind the head, or in front after the outline pass. */
type LoaderAccessory = { id: string; layers: (frame: LoaderFrameName) => { back?: LoaderLayer[]; front?: LoaderLayer[] } | null };

function composeLoaderHero(hairStyle: LoaderCharacter["hairStyle"], frame: LoaderFrameName, extra: { back?: LoaderLayer[]; front?: LoaderLayer[] } | null): string[] {
  const f = LOADER_FRAMES[frame];
  const back = extra?.back ?? [];
  const front = extra?.front ?? [];
  let width = LOADER_HERO_W;
  for (const l of front) width = Math.max(width, l.x + l.rows[0].length);
  const grid: string[][] = Array.from({ length: LOADER_HERO_H }, () => Array<string>(width).fill("."));
  const put = (rows: readonly string[], ox: number, oy: number, maxX: number) => {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const gx = ox + x;
        const gy = oy + y;
        if (row[x] !== "." && gx >= 0 && gx < maxX && gy >= 0 && gy < LOADER_HERO_H) grid[gy][gx] = row[x];
      }
    });
  };
  const head = LOADER_HEADS[hairStyle].map((r) => r.split(""));
  LOADER_FACES[f.eyes].forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] !== "_") head[LOADER_FACE_Y + y][LOADER_FACE_X + x] = row[x];
  });
  for (const l of back) put(l.rows, l.x, l.y, LOADER_HERO_W);
  put(head.map((r) => r.join("")), f.dx, f.dy, LOADER_HERO_W);
  const body = LOADER_BODIES[f.body];
  put(body, 0, LOADER_HERO_H - body.length, LOADER_HERO_W);
  // A pixel clipped at the box edge would lose its outline, so the edge columns become outline.
  for (let y = 0; y < LOADER_HERO_H; y++) {
    for (const x of [0, LOADER_HERO_W - 1]) if (grid[y][x] !== "." && grid[y][x] !== "f" && grid[y][x] !== "F") grid[y][x] = "o";
  }
  for (const l of front) put(l.rows, l.x, l.y, width);
  return loaderInnerLines(grid.map((r) => r.join("")));
}

/**
 * Splits the outline: a pixel with any clear neighbour (of eight) stays the
 * silhouette edge; the rest become inner lines (i). Past the top, left or right
 * of the map counts as clear; past the bottom is the floor or the portrait's
 * frame, so the soles and the scarf's lower edge keep their dark line.
 */
function loaderInnerLines(map: readonly string[]): string[] {
  const h = map.length;
  const clear = (x: number, y: number) => y < 0 || (y < h && (x < 0 || x >= map[y].length || map[y][x] === "."));
  return map.map((row, y) =>
    row.replace(/o/g, (_, x: number) => {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && clear(x + dx, y + dy)) return "o";
      return "i";
    }),
  );
}

/* Every frame's paths depend only on the hair style, the accessory and the frame list, never on colour, so they are built once. */
const loaderHeroCache = new Map<string, string>();
function loaderHeroMarkup(hairStyle: LoaderCharacter["hairStyle"], accessory: LoaderAccessory | null, frames: readonly LoaderFrameName[]): string {
  const key = `${hairStyle}:${accessory?.id ?? ""}:${frames.join(",")}`;
  const hit = loaderHeroCache.get(key);
  if (hit) return hit;
  let out = "";
  for (const name of frames) {
    let paths = "";
    for (const [k, d] of loaderPixelPaths(composeLoaderHero(hairStyle, name, accessory ? accessory.layers(name) : null))) {
      paths += `<path class="bz-snl-c-${LOADER_HERO_ROLES[k] ?? k}" d="${d}"/>`;
    }
    out += `<g class="bz-snl-f" data-f="${name}">${paths}</g>`;
  }
  loaderHeroCache.set(key, out);
  return out;
}

/** The game's frames in one svg; the wrapper's data-frame (or data-loop) decides which one shows. */
function LoaderHeroSprite({ hairStyle, accessory, frames = LOADER_FRAME_NAMES }: { hairStyle: LoaderCharacter["hairStyle"]; accessory: LoaderAccessory | null; frames?: readonly LoaderFrameName[] }) {
  return (
    <svg
      className="bz-snl-sprite"
      viewBox={`0 0 ${LOADER_HERO_W} ${LOADER_HERO_H}`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      overflow="visible"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: loaderHeroMarkup(hairStyle, accessory, frames) }}
    />
  );
}

function loaderCharacter(c: LoaderCharacterName | LoaderCharacter | undefined): LoaderCharacter {
  if (!c) return LOADER_CHARACTERS.ember;
  return typeof c === "string" ? LOADER_CHARACTERS[c] ?? LOADER_CHARACTERS.ember : c;
}

/** The adventurer's colours as --chr-* properties. They do not change with the theme. */
function loaderCharacterVars(ch: LoaderCharacter): Record<string, string> {
  return {
    "--chr-hair": ch.hair, "--chr-hair-shade": ch.hairShade, "--chr-skin": ch.skin, "--chr-skin-shade": ch.skinShade,
    "--chr-eye-white": ch.eyeWhite ?? "#ffffff", "--chr-eye": ch.eye ?? "#1b1630",
    "--chr-outfit": ch.outfit, "--chr-outfit-shade": ch.outfitShade, "--chr-outfit-light": ch.outfitLight, "--chr-accent": ch.accent,
    "--chr-pants": ch.pants, "--chr-pants-shade": ch.pantsShade, "--chr-boots": ch.boots, "--chr-boots-shade": ch.bootsShade,
  };
}

/* The speaker portrait in the dialogue box: the head and scarf at a larger scale, one group per expression. */
type LoaderFace = "open" | "blink" | "squint" | "happy";
const LOADER_SCARF_ROW = "...oaaaaaaaao...";
const loaderPortraitCache = new Map<string, string>();
function loaderPortraitMarkup(hairStyle: LoaderCharacter["hairStyle"]): string {
  const hit = loaderPortraitCache.get(hairStyle);
  if (hit) return hit;
  let out = "";
  for (const eyes of ["open", "blink", "squint", "happy"] as LoaderFace[]) {
    const head = LOADER_HEADS[hairStyle].map((r) => r.split(""));
    LOADER_FACES[eyes].forEach((row, y) => {
      for (let x = 0; x < row.length; x++) if (row[x] !== "_") head[LOADER_FACE_Y + y][LOADER_FACE_X + x] = row[x];
    });
    let paths = "";
    for (const [k, d] of loaderPixelPaths(loaderInnerLines([...head.map((r) => r.join("")), LOADER_SCARF_ROW]))) paths += `<path class="bz-snl-c-${LOADER_HERO_ROLES[k] ?? k}" d="${d}"/>`;
    out += `<g data-f="${eyes}">${paths}</g>`;
  }
  loaderPortraitCache.set(hairStyle, out);
  return out;
}

/** Open eyes that blink now and then while work runs, a squint on an error, dazed when stopped, happy at the end. */
function LoaderPortrait({ hairStyle, face }: { hairStyle: LoaderCharacter["hairStyle"]; face: LoaderFace }) {
  return (
    <div className="bz-snl-face" data-face={face} aria-hidden="true">
      <svg viewBox="0 0 16 12" preserveAspectRatio="none" shapeRendering="crispEdges" focusable="false" dangerouslySetInnerHTML={{ __html: loaderPortraitMarkup(hairStyle) }} />
    </div>
  );
}

type LoaderLoop = "" | "idle" | "working" | "celebrate" | "run" | "fly";

/** Shows one frame, or starts a CSS loop. An attribute change, never a React render. */
function loaderSetPose(hero: HTMLElement | null, frame: LoaderFrameName | "", loop: LoaderLoop) {
  if (!hero) return;
  if (hero.dataset.frame !== frame) hero.dataset.frame = frame;
  if ((hero.dataset.loop ?? "") !== loop) hero.dataset.loop = loop;
}

/* ---------------- end shared: character ---------------- */

/* ---------------- shared: engine ---------------- */

type LoaderPhase = "idle" | "run" | "error" | "complete" | "stopped";
type LoaderLineKind = "done" | "skipped" | "retry" | "finish" | "stop";
type LoaderLine = { key: number; kind: LoaderLineKind; text: string };
/** `more` is read after the sub and shown on hover, never drawn: a tile has little room. */
type LoaderTile = { label: string; value: number | string; kind: "steps" | "time" | "stat" | "hiccup"; total: number; sub: string; more?: string };
type LoaderFocusTarget = "retry" | "log" | "continue";
type LoaderVis = "live" | "gone";
type LoaderEntry = { i: number; kind: "done" | "skipped"; at: number; said?: boolean };
type LoaderMotion = { reduced: boolean; paused: boolean; onscreen: boolean; visible: boolean };

/** What the chassis renders. The engine owns it and pushes every change through setState. */
type LoaderView = {
  phase: LoaderPhase;
  /** The step at the front of the arena. It may lag the host by one beat, never lead it. */
  front: number;
  frontKey: number;
  /** The progress the art shows: it changes only when a hit lands. */
  barP: number | null;
  barDetail: string | null;
  lines: LoaderLine[];
  alert: string;
  errorIndex: number;
  details: string;
  detailMore: string;
  tiles: LoaderTile[];
  results: boolean;
  resultsKey: number;
  banner: boolean;
  done: boolean;
  meta: string | null;
  focus: { target: LoaderFocusTarget; n: number } | null;
  /** The run was already under way when the loader mounted, so the log starts from a summary. */
  midRun: boolean;
};

/** Read-only access to the engine for a game's arena driver. */
type LoaderArenaCtx = {
  steps: () => LoaderStep[];
  vis: () => LoaderVis[];
  front: () => number;
  phase: () => LoaderPhase;
  /** The front step's progress as the art should show it (0 when pending or of unknown size, 1 when done). */
  frontP: () => number;
  motionAllowed: () => boolean;
  motionOn: () => boolean;
  running: () => boolean;
  later: (fn: () => void, ms: number) => number;
  clear: (id: number) => number;
  anim: (el: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) => Animation | null;
};

/** What each game implements. The engine decides when; the arena decides how it looks. */
type LoaderArena = {
  rebuild: () => void;
  layout: (animate: boolean) => void;
  /** Starts a hit on the front step and returns when it lands, in ms. */
  hit: (i: number) => number;
  /** Draws the honest progress of step i; `showy` adds the impact effects. */
  progress: (i: number, showy: boolean) => void;
  /** Starts the finishing blow and returns when it lands, in ms. */
  finish: (i: number) => number;
  /** Resolves finished or skipped steps and returns how long to hold before the next one moves up. */
  resolve: (entries: LoaderEntry[], showy: boolean) => number;
  advance: (changed: boolean) => void;
  error: (i: number, showy: boolean) => void;
  recover: (i: number, showy: boolean) => void;
  stop: (showy: boolean) => void;
  finale: (showy: boolean) => void;
  pose: () => void;
  motion: () => void;
  destroy: () => void;
};

type LoaderGame = { unit: string; clear: string; arena: (root: HTMLElement, ctx: LoaderArenaCtx) => LoaderArena };

/** The props the engine reads. Every game's props satisfy it. */
type LoaderHostProps = {
  steps: LoaderStep[];
  title: string;
  labels?: Partial<LoaderLabels>;
  stats?: LoaderStat[];
  completeText?: string;
  onRetry?: (id: string) => void;
  onSkip?: (id: string) => void;
  onCancel?: () => void;
  onContinue?: () => void;
  onComplete?: () => void;
  onAnnounce?: (text: string, politeness: "polite" | "assertive") => void;
  reducedMotion?: boolean;
};

function loaderFirstLive(steps: LoaderStep[]) {
  let f = 0;
  while (f < steps.length && isSettled(steps[f])) f++;
  return f;
}

function loaderInitialView(steps: LoaderStep[]): LoaderView {
  const front = loaderFirstLive(steps);
  const s = steps[front];
  const started = steps.some((x) => x.status !== "pending");
  return {
    phase: steps.length && steps.every(isSettled) ? "complete" : started ? "run" : "idle",
    front,
    frontKey: 0,
    barP: s ? (s.status === "done" ? 1 : s.progress ?? null) : null,
    barDetail: s?.detail ?? null,
    lines: [],
    alert: "",
    errorIndex: -1,
    details: "",
    detailMore: "",
    tiles: [],
    results: false,
    resultsKey: 0,
    banner: false,
    done: false,
    meta: null,
    focus: null,
    midRun: started,
  };
}

function loaderNeedsRebuild(prev: LoaderStep[], next: LoaderStep[], phase: LoaderPhase) {
  if (prev.length !== next.length) return true;
  for (let i = 0; i < next.length; i++) if (prev[i].id !== next[i].id) return true;
  // A settled step never comes back. If the host reopens one, it has started a different run.
  for (let i = 0; i < next.length; i++) if (isSettled(prev[i]) && !isSettled(next[i])) return true;
  const allPending = next.every((s) => s.status === "pending");
  return allPending && (phase !== "idle" || prev.some((s) => s.status !== "pending"));
}

type LoaderEngine = ReturnType<typeof createLoaderEngine>;

function createLoaderEngine(env: {
  root: RefObject<HTMLElement>;
  game: LoaderGame;
  labels: () => LoaderLabels;
  props: () => LoaderHostProps;
  emit: (view: LoaderView) => void;
}) {
  let host: LoaderStep[] = [];
  let vis: LoaderVis[] = [];
  let front = 0;
  let frontSince = -1e9;
  let beatUntil = 0;
  let beatBusy = false;
  let inflight: { entries: LoaderEntry[]; landed: boolean; timer: number } | null = null;
  let backlog: LoaderEntry[] = [];
  let phase: LoaderPhase = "idle";
  let barP: number | null = null;
  let barDetail: string | null = null;
  let lastSeenP: number | null | undefined;
  let lastHit = -1e9;
  let hitT = 0;
  let pumpT = 0;
  let metaT = 0;
  let finaleStarted = false;
  let finalPrefix = "";
  let motion: LoaderMotion = { reduced: false, paused: false, onscreen: true, visible: true };
  let awayFrom: number | null = null;
  let lineKey = 0;
  let focusN = 0;
  let alive = true;
  const timers = new Set<number>();
  const anims = new Set<Animation>();
  let view: LoaderView = loaderInitialView([]);

  const set = (patch: Partial<LoaderView>) => {
    if (!alive) return;
    view = { ...view, ...patch };
    env.emit(view);
  };
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      if (alive) fn();
    }, Math.max(0, ms));
    timers.add(id);
    return id;
  };
  const clear = (id: number) => {
    if (id) {
      window.clearTimeout(id);
      timers.delete(id);
    }
    return 0;
  };
  const motionAllowed = () => !motion.reduced && !motion.paused;
  const running = () => motion.onscreen && motion.visible;
  const motionOn = () => motionAllowed() && running();
  const anim = (el: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) => {
    if (!alive || typeof el.animate !== "function") return null;
    const a = el.animate(frames, opts);
    anims.add(a);
    const drop = () => anims.delete(a);
    a.finished.then(drop, drop);
    return a;
  };
  const frontP = () => {
    const s = host[front];
    if (!s) return 0;
    if (s.status === "done") return 1;
    if (s.status === "pending" || s.status === "skipped" || (s.status === "active" && s.progress == null)) return 0;
    return barP ?? 0;
  };

  const ctx: LoaderArenaCtx = {
    steps: () => host,
    vis: () => vis,
    front: () => front,
    phase: () => phase,
    frontP,
    motionAllowed,
    motionOn,
    running,
    later,
    clear,
    anim,
  };
  const root = env.root.current;
  const arena = root ? env.game.arena(root, ctx) : null;

  const L = () => env.labels();
  const P = () => env.props();
  const announce = (text: string, politeness: "polite" | "assertive") => P().onAnnounce?.(text, politeness);
  const focusInside = () => {
    const r = env.root.current;
    const a = typeof document !== "undefined" ? document.activeElement : null;
    return !!r && !!a && a !== r && r.contains(a);
  };
  const requestFocus = (target: LoaderFocusTarget) => set({ focus: { target, n: ++focusN } });

  function appendLine(kind: LoaderLineKind, text: string) {
    const lines = view.lines.concat({ key: ++lineKey, kind, text });
    set({ lines: lines.length > 40 ? lines.slice(-40) : lines });
    announce(text, "polite");
  }

  /* -------- narration: written to be heard, not ticked -------- */

  function doneSentence(s: LoaderStep) {
    const base = s.doneText || `${s.label}: done`;
    const dur = s.durationMs != null ? ` in ${fmtDur(s.durationMs)}` : "";
    const tries = (s.attempt ?? 1) > 1 ? `, on attempt ${s.attempt}` : "";
    return `${base}${dur}${tries}.`;
  }
  const skipSentence = (s: LoaderStep) => `Skipped: ${s.label}${s.detail ? ` (${lowerFirst(s.detail)})` : ""}.`;

  /** The next step still to come after these, never one that already finished. */
  function nextAfter(list: LoaderEntry[]) {
    let i = Math.max(...list.map((e) => e.i)) + 1;
    while (i < host.length && isSettled(host[i])) i++;
    return i < host.length ? i : -1;
  }

  /* Two quick finishes share a sentence, a skip that lands with a finish joins
     it, three or more are summed up, and the line ends with what comes next. */
  function sentence(input: LoaderEntry[]) {
    const list = input.slice().sort((a, b) => a.i - b.i);
    let text: string;
    if (list.length >= BURST_MIN) {
      const done = list.filter((e) => e.kind === "done").map((e) => host[e.i]);
      const skipped = list.filter((e) => e.kind === "skipped").map((e) => host[e.i].label);
      text = done.length === 1 ? doneSentence(done[0]) : done.length ? `Finished ${done.length} steps at once: ${listJoin(done.map((s) => s.label))}.` : "";
      if (skipped.length) text += `${text ? " " : ""}Skipped: ${listJoin(skipped)}.`;
    } else {
      const parts = list.map((e) => (e.kind === "done" ? doneSentence(host[e.i]) : skipSentence(host[e.i])));
      text =
        parts.length === 2 && list[0].kind === "done" && list[1].kind === "done"
          ? `${parts[0].replace(/\.$/, "")}, then ${lowerFirst(parts[1])}`
          : parts.join(" ");
    }
    const n = nextAfter(list);
    if (n >= 0) text += `${n === host.length - 1 ? " Last up: " : " On to "}${lowerFirst(host[n].label)}.`;
    return text;
  }

  /* Narrates every completion not told yet as one line. When it is the last
     news before the finale it is held and merged into the completion line, so
     the end of a run is one announcement, not two. */
  function speak(list: LoaderEntry[]) {
    const fresh = list.filter((e) => !e.said);
    if (!fresh.length) return;
    fresh.forEach((e) => {
      e.said = true;
    });
    const text = sentence(fresh);
    if (host.every(isSettled) && backlog.every((b) => b.said)) {
      finalPrefix = finalPrefix ? `${finalPrefix} ${text}` : text;
      return;
    }
    appendLine(fresh.some((e) => e.kind === "done") ? "done" : "skipped", text);
  }

  /* -------- the bar and the hits -------- */

  function syncBar() {
    const s = host[front];
    barP = s ? (s.status === "done" ? 1 : s.progress ?? null) : null;
    barDetail = s ? s.detail ?? null : null;
    lastSeenP = s ? s.progress : null;
  }

  function requestHit() {
    if (hitT) return;
    const t = loaderNow();
    hitT = later(doHit, Math.max(lastHit + HIT_GAP - t, frontSince + BASE - t, 0));
  }

  function doHit() {
    hitT = 0;
    const s = host[front];
    if (phase !== "run" || !s || s.status !== "active" || s.progress == null) return;
    lastHit = loaderNow();
    if (!motionOn() || !arena) {
      syncBar();
      arena?.progress(front, false);
      set({ barP, barDetail });
      return;
    }
    const id = s.id;
    const delay = arena.hit(front);
    later(() => {
      if (host[front]?.id !== id) return;
      syncBar();
      arena.progress(front, motionOn());
      set({ barP, barDetail });
    }, delay);
  }

  /* -------- the beats -------- */

  function pump() {
    pumpT = clear(pumpT);
    if (phase === "error" || phase === "stopped" || beatBusy) return;
    if (!backlog.length) {
      maybeFinale();
      return;
    }
    if (!running()) {
      flushBacklog();
      return;
    }
    const t = loaderNow();
    if (t < beatUntil) {
      pumpT = later(pump, beatUntil - t);
      return;
    }
    const oldest = backlog[0].at;
    const newest = backlog[backlog.length - 1].at;
    if (t - newest < COLLECT && t - oldest < BASE) {
      pumpT = later(pump, COLLECT - (t - newest));
      return;
    }
    if (backlog.length >= BURST_MIN || t - oldest > 900) {
      runBeat(backlog.splice(0));
      return;
    }
    const dwellLeft = frontSince + DWELL - t;
    if (dwellLeft > 0) {
      pumpT = later(pump, dwellLeft);
      return;
    }
    // A skip that arrived with this completion resolves in the same beat.
    let take = 1;
    while (take < backlog.length && backlog[take].kind === "skipped" && backlog[take].at - backlog[0].at <= COALESCE) take++;
    runBeat(backlog.splice(0, take));
  }

  function runBeat(entries: LoaderEntry[]) {
    const head = entries[0];
    const showy = motionOn();
    const delay = showy && head.kind === "done" && arena ? arena.finish(head.i) : 0;
    beatUntil = loaderNow() + delay;
    beatBusy = true;
    const land = () => {
      entries.forEach((e) => {
        vis[e.i] = "gone";
      });
      const hold = arena ? arena.resolve(entries, showy) : 0;
      speak(entries.concat(backlog.filter((b) => b.at - head.at <= COALESCE)));
      const settle = () => {
        beatBusy = false;
        inflight = null;
        advanceFront();
        pump();
      };
      if (hold > 0) inflight = { entries, landed: true, timer: later(settle, hold) };
      else settle();
    };
    if (delay) inflight = { entries, landed: false, timer: later(land, delay) };
    else land();
  }

  /** Resolves everything queued at once, without beats: hidden tab, off screen, an error or a cancel. */
  function flushBacklog() {
    pumpT = clear(pumpT);
    let held = false;
    if (inflight) {
      clear(inflight.timer);
      if (inflight.landed) held = true;
      else backlog = inflight.entries.concat(backlog);
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
    const entries = backlog.splice(0);
    entries.forEach((e) => {
      vis[e.i] = "gone";
    });
    arena?.resolve(entries, false);
    speak(entries);
    advanceFront();
    maybeFinale();
  }

  function advanceFront() {
    const f = loaderFirstLiveVis();
    const changed = f !== front;
    front = f;
    frontSince = loaderNow();
    syncBar();
    set({ front, barP, barDetail, frontKey: changed ? view.frontKey + 1 : view.frontKey });
    arena?.advance(changed);
    arena?.pose();
    const s = host[front];
    if (s && s.status === "active" && s.progress != null && s.progress > 0 && motionOn()) requestHit();
  }

  function loaderFirstLiveVis() {
    let f = 0;
    while (f < host.length && vis[f] === "gone") f++;
    return f;
  }

  /* -------- the error path -------- */

  function errorText(s: LoaderStep) {
    const msg = s.error || "Something went wrong.";
    if (msg.toLowerCase().includes(s.label.toLowerCase())) return msg;
    return `${s.label} failed: ${lowerFirst(msg)}${/[.!?]$/.test(msg) ? "" : "."}`;
  }

  function detailsText(i: number) {
    const s = host[i];
    const bits = [`Step ${i + 1} of ${host.length}`, `attempt ${s.attempt ?? 1}`];
    if (s.detail) bits.push(`reached ${s.detail}`);
    else if (s.progress != null) bits.push(`reached ${Math.floor(s.progress * 100)}%`);
    if (s.elapsedMs != null) bits.push(`ran ${fmtDur(s.elapsedMs)}`);
    return bits.join(" · ");
  }

  function showError(i: number) {
    const hadFocus = focusInside();
    flushBacklog();
    phase = "error";
    clearFlash();
    hitT = clear(hitT);
    const s = host[i];
    const text = errorText(s);
    if (s.progress != null) barP = s.progress;
    if (s.detail) barDetail = s.detail;
    set({ phase, alert: text, errorIndex: i, details: detailsText(i), detailMore: s.errorDetail ?? "", barP, barDetail });
    announce(text, "assertive");
    arena?.error(i, motionOn());
    arena?.pose();
    if (hadFocus) requestFocus("retry");
  }

  /** Returns whether focus was in the error menu, so the caller can move it on. */
  function clearError() {
    const r = env.root.current;
    const a = document.activeElement;
    const panels = Array.from(r?.querySelectorAll('[data-panel="error"]') ?? []);
    const had = !!a && panels.some((p) => p.contains(a));
    const i = view.errorIndex;
    phase = "run";
    set({ phase, alert: "", details: "", detailMore: "" });
    arena?.recover(i, motionOn());
    return had;
  }

  function retryStarted(i: number) {
    const had = clearError();
    const s = host[i];
    syncBar();
    set({ barP, barDetail });
    arena?.progress(front, false);
    arena?.pose();
    appendLine("retry", `Trying again: ${s.label}, attempt ${s.attempt ?? 2}${s.detail && s.progress ? `, from ${s.detail}` : ""}.`);
    if (had) requestFocus("log");
  }

  /* -------- the finale -------- */

  function maybeFinale() {
    if (finaleStarted || phase === "error" || phase === "stopped" || !host.length) return;
    if (backlog.length || !host.every(isSettled) || vis.some((v) => v !== "gone")) return;
    finale(false);
  }

  function buildTiles(): LoaderTile[] {
    const n = host.length;
    const done = host.filter((s) => s.status === "done");
    const skipped = host.filter((s) => s.status === "skipped").length;
    const total = done.reduce((a, s) => a + (s.durationMs ?? 0), 0);
    let longest: LoaderStep | null = null;
    for (const s of done) if (s.durationMs != null && (!longest || s.durationMs > (longest.durationMs ?? 0))) longest = s;
    const tiles: LoaderTile[] = [
      { label: "Steps", value: done.length + skipped, kind: "steps", total: n, sub: skipped ? `${skipped} skipped` : "none skipped" },
    ];
    // The longest step's name stays off the tile, so a narrow tile never cuts the figure in half.
    if (total > 0) tiles.push({ label: "Time", value: total, kind: "time", total: 0, sub: longest ? `Longest step ${fmtDur(longest.durationMs)}` : "", more: longest ? `: ${longest.label}` : undefined });
    for (const st of P().stats ?? []) tiles.push({ label: st.label, value: st.value, kind: "stat", total: 0, sub: st.sub ?? "" });
    const retried = done.filter((s) => (s.attempt ?? 1) > 1);
    if (retried.length) {
      const hiccups = retried.reduce((a, s) => a + (s.attempt ?? 1) - 1, 0);
      tiles.push({ label: hiccups === 1 ? "Hiccup" : "Hiccups", value: hiccups, kind: "hiccup", total: 0, sub: `at ${listJoin(retried.map((s) => s.label))}` });
    }
    return tiles;
  }

  function finale(silent: boolean) {
    finaleStarted = true;
    const hadFocus = focusInside();
    phase = "complete";
    clearFlash();
    const n = host.length;
    const skipped = host.filter((s) => s.status === "skipped").length;
    const showy = motionOn();
    const extra = P().completeText;
    if (!silent) appendLine("finish", `${finalPrefix ? `${finalPrefix} ` : ""}${L().complete(n, skipped)}${extra ? ` ${extra}` : ""}`);
    finalPrefix = "";
    set({ phase, tiles: buildTiles(), banner: !silent, results: false, done: false });
    arena?.finale(showy);
    arena?.pose();
    if (!silent) later(() => set({ banner: false }), FAST + BEAT);
    const open = () => {
      set({ results: true, resultsKey: view.resultsKey + 1 });
      later(() => {
        set({ done: true });
        if (hadFocus || focusInside()) requestFocus("continue");
        P().onComplete?.();
      }, showy ? SLOW + 200 : 0);
    };
    // The log line lands first and the results cover it a moment later, so the line is announced.
    if (silent) open();
    else later(open, showy ? FAST + BASE : FAST);
  }

  /* -------- stop, flash, motion -------- */

  function flashMeta(text: string, ms: number) {
    if (phase !== "run" && phase !== "complete") return;
    metaT = clear(metaT);
    set({ meta: text });
    metaT = later(() => set({ meta: null }), ms);
  }
  function clearFlash() {
    metaT = clear(metaT);
    if (view.meta) set({ meta: null });
  }

  function cancel() {
    if (phase === "complete" || phase === "stopped") return;
    const hadFocus = focusInside();
    const kept = host.filter((s) => s.status === "done").length;
    flushBacklog();
    pumpT = clear(pumpT);
    hitT = clear(hitT);
    clearFlash();
    phase = "stopped";
    set({ phase, alert: "", details: "", detailMore: "" });
    arena?.stop(motionOn());
    arena?.pose();
    appendLine("stop", `${finalPrefix ? `${finalPrefix} ` : ""}${L().stopped(kept)}`);
    finalPrefix = "";
    P().onCancel?.();
    if (hadFocus) requestFocus("log");
  }

  function setMotion(next: LoaderMotion) {
    const wasRunning = running();
    motion = next;
    const isRunning = running();
    if (wasRunning && !isRunning && awayFrom == null) awayFrom = host.filter(isSettled).length;
    if (!motionOn()) {
      anims.forEach((a) => {
        try {
          a.finish();
        } catch {
          a.cancel();
        }
      });
      if (hitT) {
        hitT = clear(hitT);
        syncBar();
        arena?.progress(front, false);
        set({ barP, barDetail });
      }
    }
    if (!isRunning && (backlog.length || inflight)) flushBacklog();
    arena?.motion();
    arena?.pose();
    if (!wasRunning && isRunning && awayFrom != null) {
      const d = host.filter(isSettled).length - awayFrom;
      awayFrom = null;
      if (d > 0) flashMeta(L().away(d), BEAT * 2);
    }
    pump();
  }

  /* -------- the host's steps -------- */

  function rebuild(steps: LoaderStep[]) {
    timers.forEach((id) => window.clearTimeout(id));
    timers.clear();
    anims.forEach((a) => a.cancel());
    anims.clear();
    hitT = pumpT = metaT = 0;
    host = steps.map((s) => ({ ...s }));
    backlog = [];
    inflight = null;
    beatBusy = false;
    beatUntil = 0;
    finaleStarted = false;
    finalPrefix = "";
    lastHit = -1e9;
    vis = host.map((s) => (isSettled(s) ? "gone" : "live"));
    const started = host.some((s) => s.status !== "pending");
    phase = started ? (host.length && host.every(isSettled) ? "complete" : "run") : "idle";
    front = loaderFirstLiveVis();
    frontSince = -1e9;
    syncBar();
    view = { ...loaderInitialView(host), frontKey: view.frontKey + 1, resultsKey: view.resultsKey, phase };
    set({ front, barP, barDetail });
    arena?.rebuild();
    arena?.pose();
    const errAt = host.findIndex((s) => s.status === "error");
    if (phase === "complete") finale(true);
    else if (errAt >= 0) showError(errAt);
  }

  function update(steps: LoaderStep[]) {
    const next = steps.map((s) => ({ ...s }));
    const prev = host;
    if (loaderNeedsRebuild(prev, next, phase)) {
      rebuild(next);
      return;
    }
    host = next;
    if (phase === "stopped") return;
    if (phase === "idle" && host.some((s) => s.status !== "pending")) {
      phase = "run";
      set({ phase });
    }
    const t = loaderNow();
    let errAt = -1;
    let retryAt = -1;
    let leftError = false;
    host.forEach((s, i) => {
      const was = prev[i]?.status ?? "pending";
      if (was === s.status) return;
      if (was === "error") leftError = true;
      if (s.status === "done" || s.status === "skipped") backlog.push({ i, kind: s.status, at: t });
      else if (s.status === "error") errAt = i;
      else if (s.status === "active" && was === "error") retryAt = i;
    });
    if (retryAt >= 0) retryStarted(retryAt);
    else if (leftError && phase === "error") {
      if (clearError()) requestFocus("log");
    }
    if (errAt >= 0) {
      showError(errAt);
      return;
    }
    const s = host[front];
    if (phase === "run" && s && s.status === "active" && s.progress != null && s.progress !== lastSeenP) {
      // A step that only just started reports 0: nothing to hit yet.
      if (motionOn() && !(s.progress === 0 && lastSeenP == null)) {
        lastSeenP = s.progress;
        requestHit();
      } else {
        syncBar();
        arena?.progress(front, false);
        set({ barP, barDetail });
      }
    } else if (phase === "run" && s && s.status === "active" && s.progress == null && view.front === front) {
      arena?.pose();
    }
    pump();
  }

  function layout() {
    arena?.layout(false);
  }

  function destroy() {
    alive = false;
    timers.forEach((id) => window.clearTimeout(id));
    timers.clear();
    anims.forEach((a) => a.cancel());
    anims.clear();
    arena?.destroy();
  }

  return { rebuild, update, setMotion, cancel, layout, destroy };
}

/* -------- hooks -------- */

const LOADER_RM_QUERY = "(prefers-reduced-motion: reduce)";
const loaderSubscribeRM = (onChange: () => void) => {
  const q = window.matchMedia(LOADER_RM_QUERY);
  q.addEventListener("change", onChange);
  return () => q.removeEventListener("change", onChange);
};
const loaderReadRM = () => window.matchMedia(LOADER_RM_QUERY).matches;
const loaderServerRM = () => false;

/** prefers-reduced-motion, followed live; a boolean prop wins. */
function useReducedMotionPreference(forced: boolean | undefined) {
  const media = useSyncExternalStore(loaderSubscribeRM, loaderReadRM, loaderServerRM);
  return forced ?? media;
}

/** Whether the element is on screen. Starts true so a first paint is never treated as off screen. */
function useOnscreen(ref: RefObject<Element>) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((list) => setOn(list[list.length - 1].isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return on;
}

/** Whether the browser tab is visible. */
function usePageVisible() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const sync = () => setVisible(document.visibilityState !== "hidden");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);
  return visible;
}

function loaderStateWord(s: LoaderStep, L: LoaderLabels) {
  switch (s.status) {
    case "active":
      return (s.attempt ?? 1) > 1 ? `Running, attempt ${s.attempt}` : "Running";
    case "done":
      return s.durationMs != null ? `Done in ${fmtDur(s.durationMs)}` : "Done";
    case "skipped":
      return "Skipped";
    case "error":
      return L.failed;
    default:
      return "Waiting";
  }
}

function loaderTileText(t: LoaderTile, k: number) {
  if (typeof t.value === "string") return t.value;
  const v = t.value * k;
  if (t.kind === "steps") return `${Math.round(v)} of ${t.total}`;
  if (t.kind === "time") return fmtDur(v);
  if (t.kind === "hiccup") return `${Math.round(v)} recovered`;
  return Math.round(v).toLocaleString("en-US");
}

/** Everything the chassis needs: the engine, its view, the motion state and the handlers. */
function useLoader(props: LoaderHostProps, game: LoaderGame) {
  const rootRef = useRef<HTMLElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const engineRef = useRef<LoaderEngine | null>(null);
  const uid = useId().replace(/:/g, "");
  const labels = useMemo<LoaderLabels>(
    () => ({ ...LOADER_DEFAULT_LABELS, unit: game.unit, clear: game.clear, ...props.labels }),
    [props.labels, game],
  );
  const propsRef = useRef(props);
  propsRef.current = props;
  const labelsRef = useRef(labels);
  labelsRef.current = labels;

  const reduced = useReducedMotionPreference(props.reducedMotion);
  const onscreen = useOnscreen(rootRef);
  const visible = usePageVisible();
  const [paused, setPaused] = useState(false);
  const motion: LoaderMotion = { reduced, paused, onscreen, visible };
  const motionRef = useRef(motion);
  motionRef.current = motion;

  const [view, setView] = useState<LoaderView>(() => loaderInitialView(props.steps));
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [countT, setCountT] = useState(1);

  // The engine and the arena live for the component's lifetime; StrictMode's second mount builds them again.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const engine = createLoaderEngine({
      root: rootRef,
      game,
      labels: () => labelsRef.current,
      props: () => propsRef.current,
      emit: setView,
    });
    engineRef.current = engine;
    engine.setMotion(motionRef.current);
    engine.rebuild(propsRef.current.steps);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => engine.layout()) : null;
    ro?.observe(root);
    return () => {
      ro?.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
  }, [game]);

  useLayoutEffect(() => {
    engineRef.current?.update(props.steps);
  }, [props.steps]);

  useEffect(() => {
    engineRef.current?.setMotion({ reduced, paused, onscreen, visible });
  }, [reduced, paused, onscreen, visible]);

  // A new error starts with the menu cursor on Retry and the details closed.
  useEffect(() => {
    setDetailsOpen(false);
    setCursor(0);
  }, [view.alert]);

  useLayoutEffect(() => {
    const f = view.focus;
    if (!f) return;
    if (f.target === "retry") menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    else if (f.target === "log") logRef.current?.focus();
    else if (f.target === "continue") continueRef.current?.focus();
  }, [view.focus]);

  // The log shows its newest lines, starting on a whole line rather than mid-sentence.
  useLayoutEffect(() => {
    const log = logRef.current;
    if (!log) return;
    log.style.paddingBottom = "";
    const target = log.scrollHeight - log.clientHeight;
    if (target <= 0) {
      log.scrollTop = 0;
      return;
    }
    const lines = Array.from(log.children) as HTMLElement[];
    const base = lines[0].offsetTop;
    let top = lines[lines.length - 1].offsetTop - base;
    for (let k = lines.length - 1; k >= 0; k--) {
      const y = lines[k].offsetTop - base;
      if (y < target) break;
      top = y;
    }
    if (top > target) log.style.paddingBottom = `${top - target}px`;
    log.scrollTop = top;
  }, [view.lines]);

  // Results count up over SLOW when motion is allowed.
  useEffect(() => {
    if (!view.results) return;
    const m = motionRef.current;
    if (m.reduced || m.paused || !m.onscreen || !m.visible) {
      setCountT(1);
      return;
    }
    let raf = 0;
    const t0 = loaderNow();
    setCountT(0);
    const tick = () => {
      const x = Math.min(1, (loaderNow() - t0) / SLOW);
      setCountT(1 - (1 - x) * (1 - x) * (1 - x));
      if (x < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      setCountT(1);
    };
  }, [view.resultsKey, view.results]);

  const steps = props.steps;
  const n = steps.length;
  const settled = steps.filter(isSettled).length;
  let current = steps.findIndex((s) => s.status === "active" || s.status === "error");
  if (current < 0) current = steps.findIndex((s) => s.status === "pending");
  const cur = current >= 0 ? steps[current] : undefined;

  let valueText: string;
  if (view.phase === "stopped") valueText = `Stopped at step ${current + 1} of ${n}`;
  else if (n && settled === n) valueText = n === 1 ? "The step finished" : `All ${n} steps finished`;
  else if (view.phase === "idle" || !cur) valueText = labels.queued(n, steps[0]?.label ?? "");
  else valueText = `Step ${current + 1} of ${n}: ${cur.label}${cur.status === "error" ? ", failed" : ""}`;

  const ps = steps[view.front];
  let plateP = 0;
  if (ps) {
    if (ps.status === "done") plateP = 1;
    else if (ps.status === "pending" || ps.status === "skipped" || (ps.status === "active" && ps.progress == null)) plateP = 0;
    else plateP = Math.max(0, Math.min(1, view.barP ?? 0));
  }
  let count = "";
  if (ps) {
    if (ps.status === "active" && ps.progress == null) {
      const secs = Math.floor((ps.elapsedMs ?? 0) / 1000);
      count = `${labels.sizeUnknown}${secs >= 10 ? ` · ${secs}s` : ""}`;
    } else if (ps.status === "done") count = ps.detail ?? "";
    else if (ps.status === "active" || (ps.status === "error" && ps.progress != null)) count = view.barDetail ?? `${Math.floor(plateP * 100)}%`;
  }
  const plate = {
    label: ps?.label ?? "",
    state: !ps || ps.status === "skipped" ? "pending" : ps.status,
    attempt: ps && (ps.attempt ?? 1) > 1 && (ps.status === "active" || ps.status === "error") ? ps.attempt ?? 0 : 0,
    failed: ps?.status === "error",
    indet: ps?.status === "active" && ps.progress == null,
    gone: view.phase === "complete" || !ps,
    p: plateP,
    count,
  };

  const placeholder = view.midRun ? labels.progress(settled, n, cur?.label ?? "") : labels.queued(n, steps[0]?.label ?? "");

  let metaHead = "";
  let metaTail = "";
  const at = Math.min(view.front + 1, Math.max(1, n));
  if (view.phase === "complete") {
    metaHead = labels.clear;
    metaTail = `${n} of ${n}`;
  } else if (view.phase === "stopped") {
    metaHead = `${labels.unit} ${Math.max(1, current + 1)} of ${n}`;
    metaTail = labels.stopped(steps.filter((s) => s.status === "done").length);
  } else if (view.phase === "error") {
    metaHead = `${labels.unit} ${at} of ${n}`;
    metaTail = labels.waiting;
  } else {
    const next = steps.slice(view.front + 1).filter((s) => !isSettled(s)).map((s) => s.label);
    metaHead = `${labels.unit} ${at} of ${n}`;
    metaTail = next.length === 0 ? "Last step" : next.length === 1 ? `Next: ${next[0]}` : `Next: ${next[0]}, then ${next[1]}`;
  }

  const errStep = view.errorIndex >= 0 ? steps[view.errorIndex] : undefined;
  const commands: Array<{ key: string; label: string; sr?: string; primary?: boolean; expanded?: boolean; run: () => void }> = [];
  if (props.onRetry) commands.push({ key: "retry", label: labels.retry, sr: errStep ? ` ${errStep.label}` : undefined, primary: true, run: () => errStep && propsRef.current.onRetry?.(errStep.id) });
  if (props.onSkip) commands.push({ key: "skip", label: labels.skip, sr: errStep ? ` ${errStep.label}` : undefined, run: () => errStep && propsRef.current.onSkip?.(errStep.id) });
  if (props.onCancel) commands.push({ key: "cancel", label: labels.cancel, run: () => engineRef.current?.cancel() });
  commands.push({ key: "details", label: detailsOpen ? labels.hideDetails : labels.showDetails, expanded: detailsOpen, run: () => setDetailsOpen((o) => !o) });

  const onMenuKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const btns = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
    const i = btns.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    let j = i;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") j = (i + 1) % btns.length;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") j = (i - 1 + btns.length) % btns.length;
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = btns.length - 1;
    else return;
    e.preventDefault();
    setCursor(j);
    btns[j].focus();
  };

  return {
    props,
    view,
    labels,
    steps,
    n,
    settled,
    current,
    valueText,
    plate,
    placeholder,
    metaHead,
    metaTail,
    commands,
    cursor: Math.min(cursor, commands.length - 1),
    setCursor,
    onMenuKey,
    detailsOpen,
    countT,
    reduced,
    paused,
    togglePause: () => setPaused((p) => !p),
    motionAllowed: !reduced && !paused,
    running: onscreen && visible,
    rootRef,
    logRef,
    menuRef,
    continueRef,
    titleId: `bz-snl-title-${uid}`,
    detailsId: `bz-snl-details-${uid}`,
    hatchId: `bz-snl-hatch-${uid}`,
  };
}

type LoaderApi = ReturnType<typeof useLoader>;

/* ---------------- end shared: engine ---------------- */

/* ---------------- shared: chassis ---------------- */

/** The structure for screen readers: every step and its state. */
function LoaderStepList({ api }: { api: LoaderApi }) {
  return (
    <ol className="bz-snl-sr" aria-busy={api.view.phase === "run" ? "true" : "false"}>
      {api.steps.map((s, i) => (
        <li key={`${s.id}-${i}`} aria-current={i === api.current ? "step" : undefined}>
          {`${s.label}: ${loaderStateWord(s, api.labels)}`}
        </li>
      ))}
    </ol>
  );
}

/** The nameplate: the one progressbar. The arena positions it. */
function LoaderPlate({ api }: { api: LoaderApi }) {
  const { plate, labels } = api;
  return (
    <div
      className="bz-snl-plate"
      role="progressbar"
      aria-labelledby={api.titleId}
      aria-valuemin={0}
      aria-valuemax={Math.max(1, api.n)}
      aria-valuenow={api.settled}
      aria-valuetext={api.valueText}
      data-state={plate.state}
      data-gone={plate.gone ? "true" : "false"}
    >
      <div className="bz-snl-plate-in" key={api.view.frontKey}>
        <div className="bz-snl-plate-top">
          <span className="bz-snl-plate-label">{plate.label}</span>
          <span className="bz-snl-badges">
            {plate.attempt ? <span className="bz-snl-tag">{labels.attempt(plate.attempt)}</span> : null}
            {plate.failed ? (
              <span className="bz-snl-failed">
                <LoaderGlyph name="cross" />
                {labels.failed}
              </span>
            ) : null}
          </span>
        </div>
        <div className="bz-snl-plate-row">
          <span className="bz-snl-bar" data-indet={plate.indet ? "true" : "false"}>
            <span className="bz-snl-fill" style={{ width: `${Math.round(plate.p * 1000) / 10}%` }} />
            <svg className="bz-snl-hatch" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
              <defs>
                <pattern id={api.hatchId} width="8" height="8" patternUnits="userSpaceOnUse">
                  <path d="M0 6h2v2H0zM2 4h2v2H2zM4 2h2v2H4zM6 0h2v2H6z" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#${api.hatchId})`} />
            </svg>
          </span>
          <span className="bz-snl-count" title={plate.count || undefined}>
            {plate.count}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Whether a scroll box holds more than it shows (so it joins the tab order only
 * when it has to), and whether there is more below the fold right now (so the
 * box can fade its last line as a cue, even where scrollbars stay hidden).
 */
function useLoaderOverflow(ref: RefObject<HTMLElement>, key: unknown) {
  const [state, setState] = useState({ over: false, more: false });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => {
      const over = el.scrollHeight > el.clientHeight + 1;
      const more = over && el.scrollTop + el.clientHeight < el.scrollHeight - 1;
      setState((s) => (s.over === over && s.more === more ? s : { over, more }));
    };
    check();
    el.addEventListener("scroll", check, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(check) : null;
    ro?.observe(el);
    for (const child of Array.from(el.children)) ro?.observe(child);
    return () => {
      el.removeEventListener("scroll", check);
      ro?.disconnect();
    };
  }, [ref, key]);
  return state;
}

/**
 * The error details, as a card over the paused arena: the dialogue box below
 * has room for the message and the menu, not for a paragraph more. It comes
 * after the box in the source, right after the menu that opens it, and the
 * arena it covers is only drawing. Long details scroll inside the card.
 */
function LoaderDetails({ api }: { api: LoaderApi }) {
  const { view, labels } = api;
  const open = view.phase === "error" && api.detailsOpen && !!view.details;
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = useLoaderOverflow(scrollRef, `${open}|${view.details}|${view.detailMore}`);
  return (
    <div id={api.detailsId} className="bz-snl-frame bz-snl-sheet" data-panel="error" hidden={!open}>
      <div
        ref={scrollRef}
        className="bz-snl-frame-in bz-snl-sheet-in"
        role="region"
        aria-label={labels.details}
        tabIndex={open && scroll.over ? 0 : undefined}
        data-more={scroll.more ? "true" : undefined}
      >
        <p className="bz-snl-sheet-head" aria-hidden="true">
          {labels.details}
        </p>
        <p className="bz-snl-details">{view.details}</p>
        {view.detailMore ? <p className="bz-snl-more-detail">{view.detailMore}</p> : null}
      </div>
    </div>
  );
}

const LOADER_LINE_GLYPH: Record<LoaderLineKind, LoaderGlyphName> = { done: "done", skipped: "skipped", retry: "retry", finish: "finish", stop: "stop" };

/** The dialogue box: narration, the error menu and the results share one cell, so it never changes height. */
function LoaderBox({
  api,
  hairStyle,
}: {
  api: LoaderApi;
  /** The speaker portrait's head, or null for a game whose player is already on screen. */
  hairStyle: LoaderCharacter["hairStyle"] | null;
}) {
  const { view, labels } = api;
  const errorOn = view.phase === "error";
  const resultsOn = view.results;
  const lastLine = view.lines.length ? view.lines[view.lines.length - 1].text : "";
  const face: LoaderFace = errorOn ? "squint" : view.phase === "stopped" ? "blink" : view.phase === "complete" ? "happy" : "open";
  const errTextRef = useRef<HTMLDivElement>(null);
  const errScroll = useLoaderOverflow(errTextRef, view.alert);
  return (
    <div className="bz-snl-frame bz-snl-box">
      <div className="bz-snl-frame-in bz-snl-box-in" data-portrait={hairStyle ? undefined : "none"}>
        {hairStyle ? <LoaderPortrait hairStyle={hairStyle} face={face} /> : null}
        <div className="bz-snl-panels">
          <div className="bz-snl-panel bz-snl-talk">
            <div ref={api.logRef} className="bz-snl-log" role="log" aria-label={labels.narration} tabIndex={errorOn || resultsOn ? -1 : 0}>
              {view.lines.map((line, k) => (
                <p key={line.key} className="bz-snl-line" data-kind={line.kind} data-last={k === view.lines.length - 1 ? "true" : undefined}>
                  <LoaderGlyph name={LOADER_LINE_GLYPH[line.kind]} />
                  <span>{line.text}</span>
                </p>
              ))}
            </div>
            {view.lines.length ? null : (
              <p className="bz-snl-ph" aria-hidden="true">
                {api.placeholder}
              </p>
            )}
          </div>
          <div className="bz-snl-panel bz-snl-err" data-panel="error" data-on={errorOn ? "true" : "false"}>
            {/* Only the message lives here; the details open as a card over the arena. A message
                too long for the box scrolls, and only then joins the tab order with a name. */}
            <div
              ref={errTextRef}
              className="bz-snl-err-text"
              role={errScroll.over ? "region" : undefined}
              aria-label={errScroll.over ? labels.errorMessage : undefined}
              tabIndex={errScroll.over && errorOn ? 0 : undefined}
              data-more={errScroll.more ? "true" : undefined}
            >
              <div className="bz-snl-alert" role="alert">
                {view.alert ? (
                  <>
                    <LoaderGlyph name="cross" />
                    <span>{view.alert}</span>
                  </>
                ) : null}
              </div>
            </div>
            <div ref={api.menuRef} className="bz-snl-menu" role="group" aria-label={labels.menu} onKeyDown={api.onMenuKey}>
              {api.commands.map((c, k) => (
                <button
                  key={c.key}
                  type="button"
                  className={`bz-snl-btn${c.primary ? " bz-snl-primary" : ""}`}
                  tabIndex={k === api.cursor ? 0 : -1}
                  data-cursor={k === api.cursor ? "true" : undefined}
                  aria-expanded={c.key === "details" ? c.expanded : undefined}
                  aria-controls={c.key === "details" ? api.detailsId : undefined}
                  onFocus={() => api.setCursor(k)}
                  onClick={c.run}
                >
                  <span className="bz-snl-cur" aria-hidden="true">
                    <LoaderGlyph name="cursor" />
                  </span>
                  {c.label}
                  {c.sr ? <span className="bz-snl-sr">{c.sr}</span> : null}
                </button>
              ))}
            </div>
          </div>
          <div className="bz-snl-panel bz-snl-res" data-on={resultsOn ? "true" : "false"}>
            <p className="bz-snl-res-line" aria-hidden="true">
              {resultsOn ? lastLine : ""}
            </p>
            <dl className="bz-snl-tiles">
              {view.tiles.map((t) => (
                <div className="bz-snl-tile" key={t.label}>
                  <dt>{t.label}</dt>
                  <dd>
                    <span className="bz-snl-num" aria-hidden="true">
                      {loaderTileText(t, api.countT)}
                    </span>
                    <span className="bz-snl-sr">{loaderTileText(t, 1)}</span>
                    {t.sub ? (
                      <span className="bz-snl-sub" title={`${t.sub}${t.more ?? ""}`}>
                        {t.sub}
                        {t.more ? <span className="bz-snl-sr">{t.more}</span> : null}
                      </span>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <div className="bz-snl-foot">
          <p className="bz-snl-meta" aria-hidden="true">
            {view.meta ? (
              <>
                <LoaderGlyph name="clock" />
                {view.meta}
              </>
            ) : (
              <>
                <b>{api.metaHead}</b>
                {` · ${api.metaTail}`}
              </>
            )}
          </p>
          <div className="bz-snl-tools">
            <button
              type="button"
              className="bz-snl-btn bz-snl-toy"
              aria-pressed={api.paused}
              data-hide={api.reduced ? "true" : undefined}
              onClick={api.togglePause}
            >
              <LoaderGlyph name="pause" />
              {labels.pauseMotion}
            </button>
            {api.props.onContinue ? (
              <button
                ref={api.continueRef}
                type="button"
                className="bz-snl-btn bz-snl-primary bz-snl-continue"
                data-on={view.done ? "true" : "false"}
                onClick={() => api.props.onContinue?.()}
              >
                {labels.continue}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

const LOADER_STEP_OUTER =
  "polygon(4px 0,calc(100% - 4px) 0,calc(100% - 4px) 2px,calc(100% - 2px) 2px,calc(100% - 2px) 4px,100% 4px,100% calc(100% - 4px),calc(100% - 2px) calc(100% - 4px),calc(100% - 2px) calc(100% - 2px),calc(100% - 4px) calc(100% - 2px),calc(100% - 4px) 100%,4px 100%,4px calc(100% - 2px),2px calc(100% - 2px),2px calc(100% - 4px),0 calc(100% - 4px),0 4px,2px 4px,2px 2px,4px 2px)";
const LOADER_STEP_INNER =
  "polygon(2px 0,calc(100% - 2px) 0,calc(100% - 2px) 2px,100% 2px,100% calc(100% - 2px),calc(100% - 2px) calc(100% - 2px),calc(100% - 2px) 100%,2px 100%,2px calc(100% - 2px),0 calc(100% - 2px),0 2px,2px 2px)";

const LOADER_CHARACTER_KEYS = ["hair", "hair-shade", "skin", "skin-shade", "eye-white", "eye", "outfit", "outfit-shade", "outfit-light", "accent", "pants", "pants-shade", "boots", "boots-shade"];

/* The chassis: the frame, the nameplate's insides, the dialogue box, the footer and the adventurer's frames. */
const LOADER_CSS = `
.bz-snl{container-type:inline-size;display:block;width:100%;min-width:0;
--bz-snl-ink:light-dark(var(--bz-ink,#0a0a0a),var(--bz-void-ink,#ffffff));
--bz-snl-muted:light-dark(var(--bz-ink-muted,#4a4a4c),rgba(255,255,255,0.8));
--bz-snl-panel:light-dark(var(--bz-paper,#ffffff),var(--bz-void-raised,#1a1a1a));
--bz-snl-track:light-dark(var(--bz-line-opaque,#f0f0f0),#313131);
--bz-snl-danger:light-dark(var(--bz-danger,#b91c1c),#fca5a5);
--bz-snl-danger-mark:light-dark(#dc2626,#f87171);
--bz-snl-success:light-dark(var(--bz-emerald,#047857),var(--bz-emerald-on-void,#34d399));
--bz-snl-focus:light-dark(var(--bz-focus-ring,#912c22),var(--bz-focus-ring-void,#ffffff));
--bz-snl-hairline:light-dark(rgba(10,10,10,0.13),rgba(255,255,255,0.16));
--bz-snl-idle:light-dark(#8a8a8e,#8c8c8c);
--bz-snl-fast:var(--bz-duration-fast,150ms);
--bz-snl-base:var(--bz-duration-base,300ms);
--bz-snl-ease:var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1));
--bz-snl-beat:var(--bz-duration-beat,2.4s);
--bz-snl-sans:var(--bz-font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);
--bz-snl-mono:var(--bz-font-mono,ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace)}
.bz-snl *,.bz-snl *::before,.bz-snl *::after{box-sizing:border-box}
.bz-snl-in{--bz-snl-u:3px;position:relative;display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto auto auto;padding:16px;border:1px solid var(--bz-snl-hairline);border-radius:16px;background:var(--bz-snl-panel);color:var(--bz-snl-ink);font-family:var(--bz-snl-sans);font-size:15px;line-height:1.5;text-align:left}
.bz-snl-sr{position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}
.bz-snl-title{grid-area:1/1;margin:0 0 10px;font-size:15px;font-weight:600;line-height:21px;color:var(--bz-snl-ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bz-snl-stage{grid-area:2/1}
.bz-snl-box{grid-area:3/1}
.bz-snl-title:focus{outline:none}
.bz-snl-title:focus-visible{outline:2px solid var(--bz-snl-focus);outline-offset:2px}
.bz-snl-frame{position:relative;padding:2px;background:var(--bz-snl-ink);clip-path:${LOADER_STEP_OUTER}}
.bz-snl-frame-in{position:relative;background:var(--bz-snl-panel);clip-path:${LOADER_STEP_INNER}}
.bz-snl-g{display:block;flex:none}
.bz-snl-g path{fill:currentColor}

.bz-snl-plate{position:relative;padding:6px 10px 8px 16px;background:var(--bz-snl-panel);border:2px solid var(--bz-snl-ink);color:var(--bz-snl-ink)}
.bz-snl-plate::before{content:"";position:absolute;left:0;top:0;bottom:0;width:6px;background:var(--bz-snl-accent)}
.bz-snl-plate[data-state="pending"]::before{background:var(--bz-snl-idle)}
.bz-snl-plate[data-state="error"]::before{background:var(--bz-snl-danger-mark)}
.bz-snl-plate[data-gone="true"]{position:absolute!important;width:1px!important;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);border:0}
.bz-snl-plate-in{animation:bz-snl-fade var(--bz-snl-fast) linear}
.bz-snl-plate-top{display:flex;align-items:center;gap:2px 8px;min-height:22px}
.bz-snl-plate-label{flex:1 1 auto;min-width:0;font-size:14px;font-weight:600;line-height:20px;overflow:hidden;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.bz-snl-badges{display:inline-flex;flex:none;align-items:center;gap:6px}
.bz-snl-badges:empty{display:none}
.bz-snl-tag{flex:none;padding:3px 6px 2px;background:var(--bz-snl-accent);color:var(--bz-snl-on-accent);font:700 11px/1.2 var(--bz-snl-mono);letter-spacing:0.02em;white-space:nowrap}
.bz-snl-failed{flex:none;display:inline-flex;align-items:center;gap:5px;color:var(--bz-snl-danger);font-size:13px;font-weight:700;line-height:1}
.bz-snl-failed .bz-snl-g{width:12px;height:12px;color:var(--bz-snl-danger-mark)}
.bz-snl-plate-row{display:flex;align-items:center;gap:4px 10px;margin-top:6px}
.bz-snl-bar{position:relative;flex:1 1 56px;min-width:56px;height:12px;overflow:hidden;border:2px solid var(--bz-snl-ink);background:var(--bz-snl-track)}
.bz-snl-fill{position:absolute;left:0;top:0;bottom:0;background:var(--bz-snl-accent);transition:width var(--bz-snl-base) var(--bz-snl-ease)}
.bz-snl-hatch{position:absolute;top:0;left:-8px;width:calc(100% + 8px);height:100%;display:none;color:var(--bz-snl-accent)}
.bz-snl-hatch path{fill:currentColor}
.bz-snl-bar[data-indet="true"] .bz-snl-fill{display:none}
.bz-snl-bar[data-indet="true"] .bz-snl-hatch{display:block;animation:bz-snl-march var(--bz-snl-beat) steps(4) infinite}
.bz-snl-count{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;font:500 12px/16px var(--bz-snl-mono);color:var(--bz-snl-muted);white-space:nowrap;font-variant-numeric:tabular-nums}
@keyframes bz-snl-march{from{transform:translateX(0)}to{transform:translateX(8px)}}
@keyframes bz-snl-fade{from{opacity:0}to{opacity:1}}

.bz-snl-box{margin-top:12px}
.bz-snl-box-in{display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:16px;padding:14px 18px 12px}
.bz-snl-box-in[data-portrait="none"]{grid-template-columns:minmax(0,1fr)}
.bz-snl-face{align-self:start;width:72px;height:58px;padding:6px 2px 0;border:2px solid var(--bz-snl-ink);background:var(--bz-snl-portrait,var(--bz-snl-track));overflow:hidden}
.bz-snl-face svg{display:block;width:64px;height:48px}
.bz-snl-face g{display:none}
.bz-snl-face[data-face="open"] g[data-f="open"],.bz-snl-face[data-face="blink"] g[data-f="blink"],.bz-snl-face[data-face="squint"] g[data-f="squint"],.bz-snl-face[data-face="happy"] g[data-f="happy"]{display:inline}
.bz-snl[data-motion="on"] .bz-snl-face[data-face="open"] g[data-f="blink"]{display:inline;animation:bz-snl-blink calc(var(--bz-snl-beat) * 2) step-end infinite}
@keyframes bz-snl-blink{0%{visibility:hidden}96%{visibility:visible}100%{visibility:visible}}
.bz-snl-panels{display:grid;height:140px}
.bz-snl-panel{grid-area:1/1;min-width:0;min-height:0;background:var(--bz-snl-panel)}
.bz-snl-talk{position:relative}
.bz-snl-err,.bz-snl-res{z-index:1;visibility:hidden}
.bz-snl-err[data-on="true"],.bz-snl-res[data-on="true"]{visibility:visible}
.bz-snl-log{position:relative;height:120px;overflow-y:auto;scrollbar-width:none;overscroll-behavior:contain;font-size:15px;line-height:24px}
.bz-snl-log::-webkit-scrollbar{display:none}
.bz-snl-log:focus{outline:none}
.bz-snl-log:focus-visible{outline:2px solid var(--bz-snl-focus);outline-offset:2px}
.bz-snl-line{display:flex;gap:8px;margin:0;color:var(--bz-snl-muted);font-size:14px}
.bz-snl-line[data-last="true"]{color:var(--bz-snl-ink);font-size:16px;font-weight:500}
.bz-snl-line>.bz-snl-g{width:14px;height:14px;margin-top:5px;visibility:hidden}
.bz-snl-line[data-last="true"]>.bz-snl-g{visibility:visible}
.bz-snl-line[data-kind="done"]>.bz-snl-g{color:var(--bz-snl-success)}
.bz-snl-line[data-kind="skipped"]>.bz-snl-g,.bz-snl-line[data-kind="stop"]>.bz-snl-g{color:var(--bz-snl-muted)}
.bz-snl-line[data-kind="retry"]>.bz-snl-g,.bz-snl-line[data-kind="finish"]>.bz-snl-g{color:var(--bz-snl-accent)}
.bz-snl-ph{position:absolute;left:0;top:0;margin:0;font-size:15px;line-height:24px;color:var(--bz-snl-muted)}

.bz-snl-err{display:grid;grid-template-rows:minmax(0,1fr) auto;row-gap:10px}
.bz-snl-err-text,.bz-snl-sheet-in{min-height:0;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:var(--bz-snl-muted) transparent}
.bz-snl-err-text:focus,.bz-snl-sheet-in:focus{outline:none}
.bz-snl-err-text:focus-visible,.bz-snl-sheet-in:focus-visible{outline:2px solid var(--bz-snl-focus);outline-offset:-2px}
.bz-snl-err-text[data-more="true"]::after,.bz-snl-sheet-in[data-more="true"]::after{content:"";position:sticky;bottom:0;display:block;height:20px;margin-top:-20px;background:linear-gradient(to bottom,transparent,var(--bz-snl-panel));pointer-events:none}
.bz-snl-alert{visibility:visible;display:flex;gap:10px;color:var(--bz-snl-ink);font-size:15px;font-weight:500;line-height:24px}
.bz-snl-alert>.bz-snl-g{width:14px;height:14px;margin-top:5px;color:var(--bz-snl-danger-mark)}

.bz-snl-sheet{position:absolute;grid-area:2/1/3/2;z-index:5;top:10px;left:10px;right:10px;display:flex;max-height:calc(100% - 20px)}
.bz-snl-sheet[hidden]{display:none}
.bz-snl-sheet-in{flex:1 1 auto;padding:10px 14px 12px}
.bz-snl-sheet-head{margin:0 0 4px;font:700 11px/14px var(--bz-snl-mono);letter-spacing:0.08em;text-transform:uppercase;color:var(--bz-snl-muted)}
.bz-snl-details{margin:0;font:500 12px/18px var(--bz-snl-mono);color:var(--bz-snl-ink);overflow-wrap:anywhere}
.bz-snl-more-detail{margin:6px 0 0;font-size:13px;line-height:18px;color:var(--bz-snl-muted)}
.bz-snl-menu{display:flex;flex-wrap:wrap;gap:8px}
.bz-snl-menu .bz-snl-btn{justify-content:flex-start;gap:6px;padding:0 16px 0 8px}
.bz-snl-cur{display:inline-flex;width:8px;visibility:hidden}
.bz-snl-cur .bz-snl-g{width:8px;height:14px}
.bz-snl-err[data-on="true"] .bz-snl-btn[data-cursor="true"] .bz-snl-cur{visibility:visible}

.bz-snl-res{display:flex;flex-direction:column;gap:8px;overflow:hidden}
.bz-snl-res-line{flex:none;margin:0;font-size:15px;font-weight:500;line-height:22px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.bz-snl-tiles{display:flex;flex-wrap:wrap;align-content:flex-start;gap:8px 12px;min-height:0;margin:0;overflow-y:auto}
.bz-snl-tile{flex:1 1 auto;min-width:0;padding-top:6px;border-top:2px solid var(--bz-snl-ink)}
.bz-snl-tile dt{font:700 11px/14px var(--bz-snl-mono);letter-spacing:0.08em;text-transform:uppercase;color:var(--bz-snl-muted)}
.bz-snl-tile dd{margin:2px 0 0}
.bz-snl-num{display:block;font:700 18px/24px var(--bz-snl-mono);color:var(--bz-snl-ink);font-variant-numeric:tabular-nums;white-space:nowrap}
.bz-snl-sub{width:0;min-width:100%;font-size:12px;line-height:16px;color:var(--bz-snl-muted);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}

.bz-snl-foot{grid-column:1/-1;display:flex;align-items:center;gap:8px 16px;margin-top:12px}
.bz-snl-meta{flex:1 1 auto;min-width:0;height:40px;margin:0;overflow:hidden;font-size:13px;line-height:20px;color:var(--bz-snl-muted);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.bz-snl-meta b{font-weight:600;color:var(--bz-snl-ink)}
.bz-snl-meta .bz-snl-g{display:inline-block;width:12px;height:12px;margin-right:6px;vertical-align:-1px;color:var(--bz-snl-accent)}
.bz-snl-tools{display:flex;flex:none;gap:8px}

.bz-snl-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-width:48px;min-height:48px;margin:0;padding:0 16px;border:2px solid var(--bz-snl-ink);border-radius:0;background:var(--bz-snl-panel);color:var(--bz-snl-ink);box-shadow:inset 0 -3px 0 var(--bz-snl-track);font:600 14px/1.2 var(--bz-snl-sans);text-align:left;cursor:pointer;transition:background-color var(--bz-snl-fast) var(--bz-snl-ease),transform var(--bz-snl-fast) var(--bz-snl-ease)}
.bz-snl-btn .bz-snl-g{width:12px;height:12px}
.bz-snl-btn:focus{outline:none}
.bz-snl-btn:focus-visible{outline:2px solid var(--bz-snl-focus);outline-offset:2px;background:var(--bz-snl-track)}
@media (hover:hover){.bz-snl-btn:hover{background:var(--bz-snl-track)}}
.bz-snl[data-motion="on"] .bz-snl-btn:active{transform:scale(0.97)}
.bz-snl-btn:disabled{opacity:0.5;cursor:not-allowed}
.bz-snl-primary{border-color:var(--bz-snl-accent);background:var(--bz-snl-accent);color:var(--bz-snl-on-accent);box-shadow:inset 0 -3px 0 rgba(0,0,0,0.25)}
.bz-snl-primary:focus-visible{background:var(--bz-snl-accent);box-shadow:inset 0 -3px 0 rgba(0,0,0,0.25),inset 0 0 0 2px var(--bz-snl-panel)}
@media (hover:hover){.bz-snl-primary:hover{background:var(--bz-snl-accent);box-shadow:inset 0 -3px 0 rgba(0,0,0,0.25),inset 0 0 0 2px var(--bz-snl-panel)}}
.bz-snl-toy{padding:0 14px;font-size:13.5px}
.bz-snl-toy[aria-pressed="true"]{border-color:var(--bz-snl-ink);background:var(--bz-snl-ink);color:var(--bz-snl-panel);box-shadow:none}
.bz-snl-toy[data-hide="true"]{visibility:hidden}
.bz-snl-continue{min-width:112px;visibility:hidden}
.bz-snl-continue[data-on="true"]{visibility:visible}

@container (max-width:559px){
.bz-snl-in{--bz-snl-u:2px;padding:12px}
.bz-snl-box-in{padding:12px 12px 10px}
.bz-snl-box-in{grid-template-columns:minmax(0,1fr)}
.bz-snl-face{display:none}
.bz-snl-panels{height:240px}
.bz-snl-log{height:220px}
.bz-snl-plate-row{flex-wrap:wrap}
.bz-snl-bar{flex-basis:100%}
.bz-snl-badges{position:absolute;top:-12px;right:8px}
.bz-snl-tag,.bz-snl-failed{padding:3px 6px 2px;border:2px solid var(--bz-snl-ink)}
.bz-snl-failed{background:var(--bz-snl-panel);line-height:1.2}
.bz-snl-menu{display:grid;grid-template-columns:1fr 1fr}
.bz-snl-tile{flex-basis:40%}
.bz-snl-sub{display:block;white-space:nowrap;text-overflow:ellipsis}
.bz-snl-res-line{-webkit-line-clamp:3}
.bz-snl-foot{flex-wrap:wrap}
.bz-snl-meta{flex:1 1 100%}
.bz-snl-tools{flex:1 1 100%}
}

.bz-snl-hero .bz-snl-f{display:none}
${LOADER_FRAME_NAMES.map((f) => `.bz-snl-hero[data-frame="${f}"] .bz-snl-f[data-f="${f}"]`).join(",")}{display:inline}
.bz-snl-hero[data-loop="idle"] .bz-snl-f[data-f="idle1"],.bz-snl-hero[data-loop="working"] .bz-snl-f[data-f="idle1"],.bz-snl-hero[data-loop="celebrate"] .bz-snl-f[data-f="celebrate1"],.bz-snl-hero[data-loop="fly"] .bz-snl-f[data-f="fly1"]{display:inline;animation:bz-snl-a var(--bz-snl-loop) step-end infinite}
.bz-snl-hero[data-loop="idle"] .bz-snl-f[data-f="idle2"],.bz-snl-hero[data-loop="working"] .bz-snl-f[data-f="swing1"],.bz-snl-hero[data-loop="celebrate"] .bz-snl-f[data-f="celebrate2"],.bz-snl-hero[data-loop="fly"] .bz-snl-f[data-f="fly2"]{display:inline;animation:bz-snl-b var(--bz-snl-loop) step-end infinite}
.bz-snl-hero{--bz-snl-loop:var(--bz-snl-beat)}
.bz-snl-hero[data-loop="celebrate"]{--bz-snl-loop:calc(var(--bz-snl-beat) / 4)}
.bz-snl-hero[data-loop="fly"]{--bz-snl-loop:calc(var(--bz-snl-beat) / 8)}
.bz-snl-hero[data-loop="run"] .bz-snl-f[data-f^="run"]{display:inline;animation:bz-snl-r 400ms step-end infinite}
.bz-snl-hero[data-loop="run"] .bz-snl-f[data-f="run2"]{animation-delay:-300ms}
.bz-snl-hero[data-loop="run"] .bz-snl-f[data-f="run3"]{animation-delay:-200ms}
.bz-snl-hero[data-loop="run"] .bz-snl-f[data-f="run4"]{animation-delay:-100ms}
@keyframes bz-snl-a{0%{visibility:visible}50%{visibility:hidden}100%{visibility:hidden}}
@keyframes bz-snl-b{0%{visibility:hidden}50%{visibility:visible}100%{visibility:visible}}
@keyframes bz-snl-r{0%{visibility:visible}25%{visibility:hidden}100%{visibility:hidden}}
.bz-snl-c-outline{fill:var(--bz-snl-sprite-outline)}
.bz-snl-c-line{fill:var(--bz-snl-sprite-line)}
.bz-snl-c-mouth{fill:var(--chr-eye)}
${LOADER_CHARACTER_KEYS.map((k) => `.bz-snl-c-${k}{fill:var(--chr-${k})}`).join("\n")}

.bz-snl[data-motion="off"] .bz-snl-f,.bz-snl[data-motion="off"] .bz-snl-hatch{animation:none!important}
.bz-snl[data-motion="off"] .bz-snl-fill{transition:none}
.bz-snl[data-motion="off"] .bz-snl-btn{transition:background-color var(--bz-snl-fast) linear}
.bz-snl[data-running="false"] *,.bz-snl[data-running="false"] *::before{animation-play-state:paused!important}
`;

/* ---------------- end shared: chassis ---------------- */

/* ---------------- Snake Line arena ---------------- */

/*
 * What this game uses of the shared sections above: the player draws only the
 * frames in SNL_FRAMES, and the dialogue box runs without its speaker portrait
 * because the player stands in the booth. The other frames, the portrait art,
 * the accessory hook and its jetpack, flame and wood colours serve the other
 * loaders built on the same chassis; they stay so those sections remain line
 * for line the same in each of them.
 */

/*
 * The board is a grid of 5 x 5 art-pixel cells. Pieces are authored facing
 * right and turned for the other directions. Keys: o snake outline, g body,
 * G body shade, a scarf (the player's accent), w white, e eye, t tongue,
 * q pellet outline, p pellet, r apple outline, y apple, Y apple shade, l leaf,
 * x dashed slot, d danger ring, k spark.
 *
 * The snake is drawn as filled cells and then outlined once round its whole
 * silhouette, so it reads as one tube on light and dark boards alike. Every
 * cell keeps notched corners, which leaves a nick in the outline at each
 * joint: the segments stay countable.
 */
const SNL_CELL_PX = 5;
/* The player's frames here: the idle and working loops, the hop, the stumble, the sit and the cheer. */
const SNL_FRAMES: readonly LoaderFrameName[] = ["idle1", "idle2", "swing1", "jump", "hurt", "sit", "celebrate1", "celebrate2"];
const SNL_ROLES: Record<string, string> = {
  o: "line", g: "body", G: "shade", a: "scarf", w: "white", e: "eye", t: "tongue", q: "pellet-line", p: "pellet",
  r: "apple-line", y: "apple", Y: "apple-shade", l: "leaf", x: "ghost", d: "danger", k: "spark",
};
const SNL_CELL = {
  /* Straight runs: light on top (or on the left), shade underneath (or on the right). */
  across: [".ggg.", "ggggg", "gggGG", "gGGGG", ".GGG."],
  down: [".ggg.", "gggGG", "gggGG", "ggGGG", ".gGG."],
  turn: [".ggg.", "ggggG", "gggGG", "ggGGG", ".GGG."],
  scarf: [".aaa.", "aaaaa", "aaaaa", "aaaaa", ".aaa."],
  open: ["gggg.", "ggweg", "ggggg", "ggweg", "GGGG."],
  ko: ["gggg.", "gwgwg", "ggwgg", "gwgwg", "GGGG."],
  rest: ["gggg.", "ggeeg", "ggggg", "ggeeg", "GGGG."],
  tail: [".....", "..ggg", "ggggG", "..GGG", "....."],
  tongue: [".....", "...t.", "ttt..", "...t.", "....."],
  pellet: [".qqq.", "qwppq", "qpppq", "qpppq", ".qqq."],
  ghost: ["x.x.x", ".....", "x...x", ".....", "x.x.x"],
};
/* The last step's pellet: a 2 x 2 cell apple, and the dashed slot it leaves if skipped. */
const SNL_APPLE = ["......ll..", ".....rll..", "..rr.rrr..", ".ryyryyyr.", "rywyyyyyYr", "rywyyyyyYr", "ryyyyyyyYr", "ryyyyyyYYr", ".ryyyyYYr.", "..rrrrrr.."];
const SNL_GHOST_BIG = ["x.x.x.x.x.", "..........", "x........x", "..........", "x........x", "..........", "x........x", "..........", "x........x", ".x.x.x.x.x"];

type SnlDir = "R" | "D" | "L" | "U";
type SnlCell = [number, number];
const SNL_DIRS: SnlDir[] = ["R", "D", "L", "U"];
const SNL_VEC: Record<SnlDir, SnlCell> = { R: [1, 0], D: [0, 1], L: [-1, 0], U: [0, -1] };
const snlRotCW = (m: readonly string[]) => m.map((_, y) => m.map((__, x) => m[m.length - 1 - x][y]).join(""));
const snlTurned = (m: readonly string[], d: SnlDir) => {
  let out = [...m];
  for (let k = 0; k < SNL_DIRS.indexOf(d); k++) out = snlRotCW(out);
  return out;
};
type SnlTurnedPiece = "open" | "ko" | "rest" | "tail" | "tongue";
const SNL_ROT = Object.fromEntries(
  (["open", "ko", "rest", "tail", "tongue"] as SnlTurnedPiece[]).map((name) => [name, Object.fromEntries(SNL_DIRS.map((d) => [d, snlTurned(SNL_CELL[name], d)]))]),
) as Record<SnlTurnedPiece, Record<SnlDir, string[]>>;
/* The eye whites of the open head, which the blink covers. */
const SNL_EYES = Object.fromEntries(
  SNL_DIRS.map((d) => {
    const pts: SnlCell[] = [];
    SNL_ROT.open[d].forEach((row, y) => [...row].forEach((c, x) => c === "w" && pts.push([x, y])));
    return [d, pts];
  }),
) as Record<SnlDir, SnlCell[]>;
/* The scarf's knot: three pixels just outside the band, streaming back, in the scarf's own row or column. On a corner, where the body already fills that side, it flies on the other. */
const SNL_KNOT: Record<SnlDir, SnlCell[]> = {
  R: [[2, -1], [1, -1], [0, -2]],
  L: [[2, -1], [3, -1], [4, -2]],
  D: [[5, 2], [5, 1], [6, 0]],
  U: [[5, 2], [5, 3], [6, 4]],
};
/* The victory wave travels along the body: neighbouring segments differ by one art pixel. */
const SNL_WAVE = [0, 1, 0, -1];
const SNL_WIGGLE = [0, 1, 2, 3, 0, 1, 2, 3];
const snlDirOf = (a: SnlCell, b: SnlCell): SnlDir => (b[0] > a[0] ? "R" : b[0] < a[0] ? "L" : b[1] > a[1] ? "D" : "U");
const SNL_BACK: Record<SnlDir, SnlDir> = { R: "L", L: "R", D: "U", U: "D" };
/* The middle three pixels of each side of a cell, where it meets the next segment. */
const SNL_EDGE: Record<SnlDir, SnlCell[]> = {
  R: [[4, 1], [4, 2], [4, 3]],
  L: [[0, 1], [0, 2], [0, 3]],
  D: [[1, 4], [2, 4], [3, 4]],
  U: [[1, 0], [2, 0], [3, 0]],
};

/*
 * The path is a serpentine one cell in from the frame: right along a lane,
 * down a short turn, left along the next. Lanes sit 3 rows apart, and the lane
 * count comes from the step count and the breakpoint alone (enough lanes that
 * every step gets 6 cells on the narrowest board of that breakpoint), so the
 * board's height is reserved in CSS before anything is measured.
 */
const SNL_LANE_GAP = 3;
const SNL_HEAD0 = 2;
const SNL_MIN_CELLS = 6;
function snlSerpentine(cols: number, lanes: number): SnlCell[] {
  const path: SnlCell[] = [];
  for (let k = 0; k < lanes; k++) {
    const y = 1 + k * SNL_LANE_GAP;
    const right = k % 2 === 0;
    for (let i = 0; i < cols - 2; i++) path.push([right ? 1 + i : cols - 2 - i, y]);
    if (k < lanes - 1) for (let j = 1; j < SNL_LANE_GAP; j++) path.push([right ? cols - 2 : 1, y + j]);
  }
  return path;
}
function snlLanes(n: number, narrow: boolean) {
  const cols = narrow ? 24 : 34;
  for (let lanes = 3; lanes < 8; lanes++) {
    const len = lanes * (cols - 2) + (lanes - 1) * (SNL_LANE_GAP - 1);
    if (Math.floor((len - 2 - SNL_HEAD0) / Math.max(1, n)) >= SNL_MIN_CELLS) return lanes;
  }
  return 8;
}
const snlRows = (lanes: number) => 1 + (lanes - 1) * SNL_LANE_GAP + 3;

type SnlBoard = { key: string; cols: number; rows: number; path: SnlCell[]; S: number; pel: number[] };
function snlBoard(cols: number, n: number, narrow: boolean, u: number): SnlBoard {
  const path = snlSerpentine(cols, snlLanes(n, narrow));
  let S = Math.max(1, Math.floor((path.length - 2 - SNL_HEAD0) / Math.max(1, n)));
  // The apple needs the next path cell beside it, on the same row.
  while (n && S > 1) {
    const a = path[SNL_HEAD0 + n * S];
    const b = path[SNL_HEAD0 + n * S + 1];
    if (a && b && a[1] === b[1]) break;
    S--;
  }
  const pel: number[] = [];
  for (let k = 0; k < n; k++) pel.push(SNL_HEAD0 + (k + 1) * S);
  return { key: `${cols}x${u}x${n}`, cols, rows: snlRows(snlLanes(n, narrow)), path, S, pel };
}

/** Art assembled from many pieces: a sparse layer, emitted as one path per colour key. */
class SnlLayer {
  private rows = new Map<number, Map<number, string>>();
  set(x: number, y: number, c: string) {
    let r = this.rows.get(y);
    if (!r) this.rows.set(y, (r = new Map()));
    r.set(x, c);
  }
  blit(map: readonly string[], ox: number, oy: number) {
    for (let y = 0; y < map.length; y++) for (let x = 0; x < map[y].length; x++) if (map[y][x] !== ".") this.set(ox + x, oy + y, map[y][x]);
  }
  /** Rings everything drawn so far with `c`: each empty pixel beside a filled one, sides only. */
  outline(c: string) {
    const ring: SnlCell[] = [];
    const filled = (x: number, y: number) => !!this.rows.get(y)?.has(x);
    this.rows.forEach((r, y) =>
      r.forEach((_, x) => {
        for (const [dx, dy] of SNL_DIRS.map((d) => SNL_VEC[d])) if (!filled(x + dx, y + dy)) ring.push([x + dx, y + dy]);
      }),
    );
    ring.forEach(([x, y]) => this.set(x, y, c));
  }
  markup(): string {
    const out: Record<string, string> = {};
    this.rows.forEach((r, y) => {
      const xs = [...r.keys()].sort((a, b) => a - b);
      let i = 0;
      while (i < xs.length) {
        const c = r.get(xs[i]) as string;
        let j = i + 1;
        while (j < xs.length && xs[j] === xs[j - 1] + 1 && r.get(xs[j]) === c) j++;
        out[c] = `${out[c] ?? ""}M${xs[i]} ${y}h${j - i}v1h${i - j}z`;
        i = j;
      }
    });
    let s = "";
    for (const k in out) s += `<path class="bz-snl-k-${SNL_ROLES[k] ?? k}" d="${out[k]}"/>`;
    return s;
  }
}
const snlMap = (map: readonly string[], ox = 0, oy = 0) => {
  const l = new SnlLayer();
  l.blit(map, ox, oy);
  return l.markup();
};

/**
 * Distance along the path is progress: the head sits at the previous pellet
 * plus floor(progress x cells to the next pellet), and the body is the path
 * behind it. Length is 3 plus the pellets eaten.
 */
function createSnakeArena(root: HTMLElement, ctx: LoaderArenaCtx): LoaderArena {
  const q = <T extends Element>(sel: string) => root.querySelector(sel) as T | null;
  const boardEl = q<HTMLDivElement>(".bz-snl-board");
  const screenEl = q<HTMLDivElement>(".bz-snl-screen");
  const svgEl = q<SVGSVGElement>(".bz-snl-svg");
  const pelsEl = q<SVGGElement>(".bz-snl-pels");
  const snakeEl = q<SVGGElement>(".bz-snl-snake");
  const fxEl = q<SVGGElement>(".bz-snl-fx");
  const heroEl = q<HTMLDivElement>(".bz-snl-hero");

  let G: SnlBoard | null = null;
  let head = SNL_HEAD0;
  let len = 3;
  let slide: { ids: number[]; h: number; l: number } | null = null;
  let pelEls: Array<SVGGElement | null> = [];
  let pelKey: string[] = [];
  const freshGhost = new Set<number>();
  let errorAt = -1;
  let wave: number | null = null;
  let tongue = false;
  let snakeTimers: number[] = [];
  let poseTimers: number[] = [];
  let transientUntil = 0;
  let celebrateUntil = 0;
  let snakeHtml = "";
  let flashUntil = 0;
  let flashT = 0;

  function geomHead(f: number, p: number) {
    if (!G) return SNL_HEAD0;
    const n = G.pel.length;
    if (!n) return SNL_HEAD0;
    const base = SNL_HEAD0 + Math.min(f, n) * G.S;
    if (f >= n) return base;
    return base + Math.floor(Math.min(Math.max(p, 0), 0.999) * G.S);
  }
  function lenTarget() {
    const vis = ctx.vis();
    return 3 + ctx.steps().reduce((a, s, i) => a + (vis[i] === "gone" && s.status === "done" ? 1 : 0), 0);
  }

  /* -------- the snake -------- */

  /** One 150ms danger flash. It has its own timer, and every render also drops it once it is due. */
  function flash() {
    if (!snakeEl) return;
    snakeEl.classList.add("is-flash");
    flashUntil = loaderNow() + FAST;
    ctx.clear(flashT);
    flashT = ctx.later(unflash, FAST);
  }
  function unflash() {
    flashT = 0;
    flashUntil = 0;
    snakeEl?.classList.remove("is-flash");
  }

  function setSnake(h: number, l: number) {
    head = h;
    len = l;
    renderSnake();
  }
  function snap() {
    if (G) setSnake(geomHead(ctx.front(), ctx.frontP()), lenTarget());
  }
  /** Stops travel; `jump` lands it where it was going. */
  function stopSlide(jump: boolean) {
    const s = slide;
    if (!s) return;
    s.ids.forEach(ctx.clear);
    slide = null;
    if (jump) setSnake(s.h, s.l);
  }
  /** Whole-cell travel: the head steps cell by cell, the tail follows, growth spreads over the slide. */
  function slideTo(h: number, l: number, dur: number) {
    stopSlide(false);
    const h0 = head;
    const t0 = head - len + 1;
    const t1 = h - l + 1;
    const dist = Math.max(Math.abs(h - h0), Math.abs(t1 - t0));
    if (!dur || !G || !dist) {
      setSnake(h, l);
      return;
    }
    const n = Math.max(1, Math.min(dist, Math.round(dur / 16)));
    const s = { ids: [] as number[], h, l };
    slide = s;
    for (let k = 1; k <= n; k++) {
      s.ids.push(
        ctx.later(() => {
          const f = k / n;
          const hh = h0 + Math.round((h - h0) * f);
          const tt = t0 + Math.round((t1 - t0) * f);
          if (k === n) slide = null;
          setSnake(hh, hh - tt + 1);
        }, ((k - 1) / n) * dur),
      );
    }
    renderSnake();
  }

  function snakeMarkup(face: "open" | "ko" | "rest", w: number | null, tg: boolean) {
    const P = (G as SnlBoard).path;
    const h = Math.min(head, P.length - 1);
    const tail = Math.max(0, h - len + 1);
    const body = new SnlLayer();
    const blink = new SnlLayer();
    const tongueL = new SnlLayer();
    for (let d = tail; d <= h; d++) {
      const j = h - d;
      const dir = j === 0 ? (d > 0 ? snlDirOf(P[d - 1], P[d]) : "R") : snlDirOf(P[d], P[d + 1]);
      let ox = P[d][0] * SNL_CELL_PX;
      let oy = P[d][1] * SNL_CELL_PX;
      if (w != null) {
        const off = SNL_WAVE[(j + w) % 4];
        if (dir === "R" || dir === "L") oy += off;
        else ox += off;
      }
      if (j === 0) {
        body.blit(SNL_ROT[face][dir], ox, oy);
        if (face === "open") {
          SNL_EYES[dir].forEach(([x, y]) => blink.set(ox + x, oy + y, "g"));
          tongueL.blit(SNL_ROT.tongue[dir], ox + SNL_VEC[dir][0] * SNL_CELL_PX, oy + SNL_VEC[dir][1] * SNL_CELL_PX);
        }
      } else if (j === 1) {
        // The scarf is edged in the outline where it meets the head and the body, so it reads even on a snake of nearly its colour.
        const back = SNL_BACK[snlDirOf(P[d - 1], P[d])];
        const across = dir === "R" || dir === "L";
        body.blit(SNL_CELL.scarf, ox, oy);
        for (const side of [dir, back]) SNL_EDGE[side].forEach(([x, y]) => body.set(ox + x, oy + y, "o"));
        const flip = back === (across ? "U" : "R");
        SNL_KNOT[dir].forEach(([x, y]) => body.set(ox + (flip && !across ? 4 - x : x), oy + (flip && across ? 4 - y : y), "a"));
      } else if (d === tail) body.blit(SNL_ROT.tail[dir], ox, oy);
      else {
        const into = snlDirOf(P[d - 1], P[d]);
        body.blit(into !== dir ? SNL_CELL.turn : dir === "R" || dir === "L" ? SNL_CELL.across : SNL_CELL.down, ox, oy);
      }
    }
    body.outline("o");
    return `${body.markup()}<g class="bz-snl-lid">${blink.markup()}</g><g class="bz-snl-tongue${tg ? " is-on" : ""}">${tongueL.markup()}</g>`;
  }

  function renderSnake() {
    if (!G || !snakeEl || !boardEl) return;
    if (flashUntil && loaderNow() >= flashUntil) unflash();
    const phase = ctx.phase();
    const face = phase === "error" ? "ko" : phase === "stopped" ? "rest" : "open";
    const html =
      boardEl.dataset.loop === "victory" && wave == null
        ? `<g class="bz-snl-wig-a">${snakeMarkup("open", 0, false)}</g><g class="bz-snl-wig-b">${snakeMarkup("open", 2, true)}</g>`
        : snakeMarkup(face, wave, tongue);
    if (html !== snakeHtml) {
      snakeEl.innerHTML = html;
      snakeHtml = html;
    }
    // For tests and devtools: the drawn length and whether it is travelling.
    if (boardEl.dataset.len !== String(len)) boardEl.dataset.len = String(len);
    const moving = slide ? "true" : "false";
    if (boardEl.dataset.moving !== moving) boardEl.dataset.moving = moving;
  }

  /** A one-off sequence of wave phases (null for none), one per frame. */
  function playSnake(frames: Array<number | null>, ms: number, tg: boolean) {
    snakeTimers.forEach(ctx.clear);
    snakeTimers = [];
    wave = frames[0];
    tongue = tg;
    frames.forEach((w, k) => {
      if (k) snakeTimers.push(ctx.later(() => ((wave = w), renderSnake()), k * ms));
    });
    snakeTimers.push(
      ctx.later(() => {
        wave = null;
        tongue = false;
        renderSnake();
      }, frames.length * ms),
    );
    renderSnake();
  }

  /* -------- pellets -------- */

  function pelBox(i: number) {
    const B = G as SnlBoard;
    const d = B.pel[i];
    const cell = B.path[d];
    if (i !== B.pel.length - 1) return { x: cell[0] * SNL_CELL_PX, y: cell[1] * SNL_CELL_PX, size: SNL_CELL_PX };
    const nx = B.path[d + 1] ?? cell;
    return { x: Math.min(cell[0], nx[0]) * SNL_CELL_PX, y: cell[1] * SNL_CELL_PX, size: 2 * SNL_CELL_PX };
  }
  function pelState(i: number) {
    if (ctx.vis()[i] === "gone") return ctx.steps()[i].status === "skipped" ? "ghost" : "eaten";
    if (i === errorAt) return "error";
    return i === ctx.front() ? "front" : "queue";
  }
  function renderPellets(force: boolean) {
    if (!G || !pelsEl) return;
    if (force) {
      pelsEl.textContent = "";
      pelEls = [];
      pelKey = [];
    }
    const last = ctx.steps().length - 1;
    ctx.steps().forEach((_, i) => {
      const st = pelState(i);
      if (pelKey[i] === st) return;
      pelKey[i] = st;
      let g = pelEls[i];
      if (st === "eaten") {
        g?.remove();
        pelEls[i] = null;
        return;
      }
      if (!g) {
        g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        pelsEl.appendChild(g);
        pelEls[i] = g;
      }
      const b = pelBox(i);
      g.setAttribute("class", "bz-snl-pel");
      g.setAttribute("transform", `translate(${b.x} ${b.y})`);
      g.setAttribute("data-state", st);
      let html = snlMap(st === "ghost" ? (i === last ? SNL_GHOST_BIG : SNL_CELL.ghost) : i === last ? SNL_APPLE : SNL_CELL.pellet);
      if (st === "error") {
        // A danger ring one art pixel outside the pellet.
        const ring = new SnlLayer();
        for (let k = -1; k <= b.size; k++) {
          ring.set(k, -1, "d");
          ring.set(k, b.size, "d");
          ring.set(-1, k, "d");
          ring.set(b.size, k, "d");
        }
        html += `<g class="bz-snl-ring">${ring.markup()}</g>`;
      }
      g.innerHTML = html;
      if (st === "ghost" && freshGhost.has(i)) {
        freshGhost.delete(i);
        const node = g;
        node.classList.add("is-fresh");
        ctx.later(() => node.classList.remove("is-fresh"), BASE);
      }
    });
  }

  /* -------- effects, in whole art pixels on held frames -------- */

  function fxFrames(frames: Array<Array<[number, number, string]>>, ms: number) {
    if (!fxEl) return;
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    fxEl.appendChild(g);
    frames.forEach((px, k) =>
      ctx.later(() => {
        const l = new SnlLayer();
        px.forEach(([x, y, c]) => l.set(x, y, c));
        g.innerHTML = l.markup();
      }, k * ms),
    );
    ctx.later(() => g.remove(), frames.length * ms);
  }
  /** The eaten pellet pops: sparks fly out of its corners, and the apple adds edge sparks. */
  function pop(i: number) {
    if (!G) return;
    const b = pelBox(i);
    const big = b.size > SNL_CELL_PX;
    const [x0, y0, x1, y1, m] = [b.x, b.y, b.x + b.size - 1, b.y + b.size - 1, b.size / 2];
    const frames = (big ? [1, 3, 5] : [0, 2]).map((k, f) => {
      const c = big && f % 2 === 0 ? "y" : "k";
      const px: Array<[number, number, string]> = [[x0 - k, y0 - k, c], [x1 + k, y0 - k, c], [x0 - k, y1 + k, c], [x1 + k, y1 + k, c]];
      if (big) {
        px.push(
          [b.x + m - 1, y0 - k - 1, c], [b.x + m, y0 - k - 1, c], [b.x + m - 1, y1 + k + 1, c], [b.x + m, y1 + k + 1, c],
          [x0 - k - 1, b.y + m - 1, c], [x0 - k - 1, b.y + m, c], [x1 + k + 1, b.y + m - 1, c], [x1 + k + 1, b.y + m, c],
        );
      }
      return px;
    });
    fxFrames(frames, big ? 90 : 70);
  }
  /** The new target gets corner brackets for a moment. */
  function highlight(i: number) {
    if (!G || i >= ctx.steps().length) return;
    const b = pelBox(i);
    const [x0, y0, x1, y1] = [b.x - 1, b.y - 1, b.x + b.size, b.y + b.size];
    const pts: SnlCell[] = [[x0, y0], [x0 + 1, y0], [x0, y0 + 1], [x1, y0], [x1 - 1, y0], [x1, y0 + 1], [x0, y1], [x0 + 1, y1], [x0, y1 - 1], [x1, y1], [x1 - 1, y1], [x1, y1 - 1]];
    fxFrames([pts.map(([x, y]) => [x, y, "k"])], SLOW);
  }

  /* -------- the player -------- */

  function pose() {
    const phase = ctx.phase();
    const m = ctx.motionAllowed();
    const s = ctx.steps()[ctx.front()];
    const indet = phase === "run" && !!s && s.status === "active" && s.progress == null;
    const victory = phase === "complete" && m && celebrateUntil > loaderNow();
    const loop = victory ? "victory" : indet && m ? "wait" : "";
    if (boardEl && (boardEl.dataset.loop ?? "") !== loop) boardEl.dataset.loop = loop;
    renderSnake();
    if (transientUntil > loaderNow()) return;
    if (phase === "error" || phase === "stopped") return loaderSetPose(heroEl, "sit", "");
    if (phase === "complete") return victory ? loaderSetPose(heroEl, "", "celebrate") : loaderSetPose(heroEl, "celebrate1", "");
    if (!m) return loaderSetPose(heroEl, "idle1", "");
    loaderSetPose(heroEl, "", indet ? "working" : "idle");
  }

  /** A short sequence of held frames, then back to the resting pose. */
  function play(seq: Array<[LoaderFrameName, number]>) {
    poseTimers.forEach(ctx.clear);
    poseTimers = [];
    let at = 0;
    seq.forEach(([frame, ms], k) => {
      if (k === 0) loaderSetPose(heroEl, frame, "");
      else poseTimers.push(ctx.later(() => loaderSetPose(heroEl, frame, ""), at));
      at += ms;
    });
    transientUntil = loaderNow() + at;
    poseTimers.push(
      ctx.later(() => {
        transientUntil = 0;
        pose();
      }, at),
    );
  }

  /* -------- the driver -------- */

  function layout() {
    if (!svgEl || !boardEl) return;
    const narrow = root.clientWidth > 0 && root.clientWidth < 560;
    if (root.dataset.narrow !== String(narrow)) root.dataset.narrow = String(narrow);
    const W = boardEl.clientWidth;
    if (!W) return;
    const u = narrow ? 2 : 3;
    const cell = SNL_CELL_PX * u;
    const cols = Math.max(14, Math.floor((W - 2 * u) / cell));
    const n = ctx.steps().length;
    if (G && G.key === `${cols}x${u}x${n}`) return;
    G = snlBoard(cols, n, narrow, u);
    svgEl.setAttribute("viewBox", `0 0 ${cols * SNL_CELL_PX} ${G.rows * SNL_CELL_PX}`);
    svgEl.setAttribute("width", String(cols * cell));
    svgEl.setAttribute("height", String(G.rows * cell));
    if (screenEl) screenEl.style.width = `${cols * cell + 2 * u}px`;
    stopSlide(false);
    if (fxEl) fxEl.textContent = "";
    renderPellets(true);
    snakeHtml = "";
    snap();
  }

  function rebuild() {
    slide = null;
    snakeTimers = [];
    poseTimers = [];
    wave = null;
    tongue = false;
    transientUntil = 0;
    celebrateUntil = 0;
    errorAt = -1;
    freshGhost.clear();
    unflash();
    if (fxEl) fxEl.textContent = "";
    G = null;
    head = SNL_HEAD0;
    len = 3;
    layout();
  }

  /* A progress hit has no wind-up here: the slide is the hit. */
  function hit() {
    return 0;
  }

  function progress(i: number, showy: boolean) {
    if (!G || i !== ctx.front()) return;
    const h = geomHead(i, ctx.frontP());
    const l = lenTarget();
    if (showy) {
      slideTo(h, l, BASE);
      return;
    }
    // A restarted step respawns the snake at the last pellet: a snake never reverses.
    const back = h < head;
    stopSlide(false);
    setSnake(h, l);
    if (back && snakeEl && ctx.running() && ctx.motionAllowed()) {
      ctx.anim(snakeEl, [0, 1, 2, 3].map((j) => ({ offset: j / 3, easing: "step-end", opacity: j / 3 })), { duration: BASE });
    }
  }

  /* The finishing dash: the head reaches the pellet as the blow lands, and eats it there. */
  function finish(i: number) {
    if (!G) return 0;
    slideTo(geomHead(i + 1, 0), lenTarget() + 1, IMPACT);
    return IMPACT;
  }

  function resolve(entries: LoaderEntry[], showy: boolean) {
    if (showy && G) {
      entries.forEach((e) => {
        if (e.kind === "done") pop(e.i);
        else freshGhost.add(e.i);
      });
      if (entries.some((e) => e.kind === "done")) play([["jump", 200]]);
      const skipsOnly = entries.every((e) => e.kind === "skipped");
      slideTo(geomHead(entries[entries.length - 1].i + 1, 0), lenTarget(), skipsOnly ? BASE : IMPACT);
    }
    renderPellets(false);
    return 0;
  }

  function advance(changed: boolean) {
    if (!G) return;
    const h = geomHead(ctx.front(), ctx.frontP());
    const l = lenTarget();
    if (!(slide && slide.h === h && slide.l === l)) {
      if (changed && ctx.motionOn()) slideTo(h, l, BASE);
      else {
        stopSlide(false);
        setSnake(h, l);
      }
    }
    renderPellets(false);
    if (changed && ctx.motionOn()) highlight(ctx.front());
  }

  function error(i: number, showy: boolean) {
    errorAt = i;
    stopSlide(false);
    snap();
    renderPellets(false);
    if (!showy) return;
    flash();
    const ring = pelEls[i]?.querySelector(".bz-snl-ring");
    if (ring) ctx.anim(ring, [1, 0, 1, 0, 1].map((o, j) => ({ offset: j / 4, easing: "step-end", opacity: o })), { duration: 600 });
    play([["hurt", 450]]);
  }

  function recover(_i: number, showy: boolean) {
    errorAt = -1;
    renderPellets(false);
    renderSnake();
    transientUntil = 0;
    if (showy) play([["jump", 150]]);
  }

  function stop() {
    unflash();
    stopSlide(true);
    snakeTimers.forEach(ctx.clear);
    snakeTimers = [];
    wave = null;
    tongue = false;
    transientUntil = 0;
    renderSnake();
  }

  function finale(showy: boolean) {
    errorAt = -1;
    renderPellets(false);
    if (!showy) return;
    celebrateUntil = loaderNow() + BEAT * 3;
    playSnake(SNL_WIGGLE, 90, false);
    ctx.later(pose, BEAT * 3 + 20);
  }

  function motion() {
    if (!ctx.motionOn()) {
      stopSlide(true);
      snakeTimers.forEach(ctx.clear);
      poseTimers.forEach(ctx.clear);
      snakeTimers = [];
      poseTimers = [];
      wave = null;
      tongue = false;
      transientUntil = 0;
      if (!ctx.motionAllowed()) celebrateUntil = 0;
      unflash();
      if (fxEl) fxEl.textContent = "";
    }
    renderSnake();
  }

  return { rebuild, layout, hit, progress, finish, resolve, advance, error, recover, stop, finale, pose, motion, destroy: () => stopSlide(false) };
}

const SNAKE_GAME: LoaderGame = { unit: "Step", clear: "Board cleared", arena: createSnakeArena };

const CSS = `${LOADER_CSS}
.bz-snl-arena{position:relative}
.bz-snl-board{position:relative;display:flex;justify-content:center;height:calc(var(--bz-snl-rows-w) * 15px + 6px)}
.bz-snl-screen{position:relative;width:100%;height:100%;background:var(--bz-snl-board);border:var(--bz-snl-u) solid var(--bz-snl-frame)}
.bz-snl-svg{display:block;overflow:visible}
.bz-snl-k-grid{fill:var(--bz-snl-grid)}
.bz-snl-k-line{fill:var(--bz-snl-snake-line)}
.bz-snl-k-body{fill:var(--bz-snl-snake)}
.bz-snl-k-shade{fill:var(--bz-snl-snake-shade)}
.bz-snl-k-scarf{fill:var(--chr-accent)}
.bz-snl-k-white{fill:var(--chr-eye-white)}
.bz-snl-k-eye{fill:var(--chr-eye)}
.bz-snl-k-tongue,.bz-snl-k-pellet{fill:var(--bz-snl-pellet)}
.bz-snl-k-pellet-line{fill:var(--bz-snl-pellet-line)}
.bz-snl-k-apple{fill:var(--bz-snl-apple)}
.bz-snl-k-apple-shade{fill:var(--bz-snl-apple-shade)}
.bz-snl-k-apple-line{fill:var(--bz-snl-apple-line)}
.bz-snl-k-leaf{fill:var(--bz-snl-leaf)}
.bz-snl-k-ghost{fill:var(--bz-snl-ghost)}
.bz-snl-k-danger{fill:var(--bz-snl-danger-mark)}
.bz-snl-k-spark{fill:var(--bz-snl-accent)}
.bz-snl-snake.is-flash .bz-snl-k-body,.bz-snl-snake.is-flash .bz-snl-k-shade{fill:var(--bz-snl-danger-mark)}
.bz-snl-pel[data-state="ghost"]{opacity:0.7;transition:opacity var(--bz-snl-fast) linear}
.bz-snl-pel[data-state="ghost"].is-fresh{opacity:1}
.bz-snl-tongue,.bz-snl-lid{opacity:0}
.bz-snl-tongue.is-on{opacity:1}
.bz-snl-board[data-loop="wait"] .bz-snl-tongue{animation:bz-snl-flick var(--bz-snl-beat) step-end infinite}
.bz-snl-board[data-loop="wait"] .bz-snl-lid{animation:bz-snl-lid var(--bz-snl-beat) step-end infinite}
.bz-snl-board[data-loop="wait"] .bz-snl-pel[data-state="front"]{animation:bz-snl-pulse var(--bz-snl-beat) step-end infinite}
.bz-snl-board[data-loop="victory"] .bz-snl-wig-a{animation:bz-snl-wig-a calc(var(--bz-snl-beat) / 4) step-end infinite}
.bz-snl-board[data-loop="victory"] .bz-snl-wig-b{animation:bz-snl-wig-b calc(var(--bz-snl-beat) / 4) step-end infinite}
@keyframes bz-snl-flick{0%{opacity:1}7%{opacity:0}14%{opacity:1}21%{opacity:0}100%{opacity:0}}
@keyframes bz-snl-lid{0%{opacity:0}60%{opacity:1}66%{opacity:0}100%{opacity:0}}
@keyframes bz-snl-pulse{0%{opacity:1}50%{opacity:0.4}100%{opacity:0.4}}
@keyframes bz-snl-wig-a{0%{opacity:1}50%{opacity:0}100%{opacity:0}}
@keyframes bz-snl-wig-b{0%{opacity:0}50%{opacity:1}100%{opacity:1}}
.bz-snl-banner{position:absolute;left:50%;top:50%;z-index:2;padding:2px;background:var(--bz-snl-frame);clip-path:${LOADER_STEP_OUTER};transform:translate(-50%,-50%);visibility:hidden}
.bz-snl-banner[data-on="true"]{visibility:inherit}
.bz-snl-banner-in{display:block;padding:9px 20px 8px;background:var(--bz-snl-panel);clip-path:${LOADER_STEP_INNER};color:var(--bz-snl-ink);font:700 15px/1.2 var(--bz-snl-mono);letter-spacing:0.14em;text-transform:uppercase;white-space:nowrap}
.bz-snl-strip{display:flex;gap:8px;margin-top:8px;height:calc(28 * var(--bz-snl-u))}
.bz-snl-booth{position:relative;flex:none;width:calc(24 * var(--bz-snl-u));background:var(--bz-snl-board);border:var(--bz-snl-u) solid var(--bz-snl-frame)}
.bz-snl-hero{position:absolute;left:calc(3 * var(--bz-snl-u));bottom:calc(2 * var(--bz-snl-u));width:calc(16 * var(--bz-snl-u));height:calc(24 * var(--bz-snl-u))}
.bz-snl-sprite{display:block;width:100%;height:100%}
.bz-snl-ledge{position:absolute;left:0;right:0;bottom:0;height:calc(2 * var(--bz-snl-u));background:var(--bz-snl-snake-shade);border-top:var(--bz-snl-u) solid var(--bz-snl-snake-line)}
.bz-snl-slot{position:relative;flex:1;min-width:0;display:grid}
.bz-snl-slot>.bz-snl-plate,.bz-snl-cleared{grid-area:1/1;display:flex;flex-direction:column;justify-content:center;min-width:0;border-color:var(--bz-snl-frame)}
.bz-snl-slot .bz-snl-plate-label{display:block;white-space:nowrap;text-overflow:ellipsis}
.bz-snl-cleared{position:relative;padding:6px 10px 8px 16px;background:var(--bz-snl-panel);border:2px solid var(--bz-snl-frame);visibility:hidden}
.bz-snl-cleared::before{content:"";position:absolute;left:0;top:0;bottom:0;width:6px;background:var(--bz-snl-accent)}
.bz-snl[data-phase="complete"] .bz-snl-cleared{visibility:inherit}
.bz-snl-cleared .bz-snl-bar{border-color:var(--bz-snl-ink)}
.bz-snl-full{position:absolute;inset:0;background:var(--bz-snl-accent)}
.bz-snl-box{background:var(--bz-snl-frame)}
@container (max-width:559px){
.bz-snl-board{height:calc(var(--bz-snl-rows-n) * 10px + 4px)}
/* The plate wears its badges on its top edge at this width, so the gap above it is wide enough to hold them. */
.bz-snl-strip{height:80px;margin-top:12px}
/* The details card covers the whole board and strip here rather than ending across the nameplate. */
.bz-snl-sheet{bottom:10px}
.bz-snl-banner-in{padding:7px 14px 6px;font-size:13px}
}
.bz-snl[data-motion="off"] .bz-snl-board *{animation:none!important}
.bz-snl[data-motion="off"] .bz-snl-pel{transition:none}
`;

function snakePalette(p: SnakeLineLoaderProps["palette"]): SnakeLineLoaderPalette {
  if (!p) return SNAKE_LINE_LOADER_PALETTES.classic;
  return typeof p === "string" ? SNAKE_LINE_LOADER_PALETTES[p] ?? SNAKE_LINE_LOADER_PALETTES.classic : p;
}

export function SnakeLineLoader(props: SnakeLineLoaderProps) {
  const { title, headingLevel = 2, palette, character, colorScheme, className, style } = props;
  const api = useLoader(props, SNAKE_GAME);
  const dotsId = `bz-snl-dots-${useId().replace(/:/g, "")}`;
  const hero = loaderCharacter(character);
  const pal = snakePalette(palette);
  const n = props.steps.length;
  const rootStyle = useMemo(
    () =>
      ({
        ...loaderPaletteVars(pal.light, pal.dark),
        ...loaderCharacterVars(hero),
        ...(colorScheme ? { colorScheme } : {}),
        ...style,
      }) as CSSProperties,
    [pal, hero, colorScheme, style],
  );
  const Heading = `h${headingLevel}` as "h2";
  const { view, labels } = api;

  return (
    <section
      ref={api.rootRef}
      className={`bz-snl${className ? ` ${className}` : ""}`}
      aria-labelledby={api.titleId}
      data-phase={view.phase}
      data-motion={api.motionAllowed ? "on" : "off"}
      data-running={api.running ? "true" : "false"}
      style={rootStyle}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="bz-snl-in">
        <Heading id={api.titleId} className="bz-snl-title" tabIndex={-1}>
          {title}
        </Heading>
        <LoaderStepList api={api} />
        <div
          className="bz-snl-arena bz-snl-stage"
          style={{ "--bz-snl-rows-w": snlRows(snlLanes(n, false)), "--bz-snl-rows-n": snlRows(snlLanes(n, true)) } as CSSProperties}
        >
          <div className="bz-snl-board" aria-hidden="true">
            <div className="bz-snl-screen">
              <svg className="bz-snl-svg" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
                <defs>
                  <pattern id={dotsId} width="5" height="5" patternUnits="userSpaceOnUse">
                    <rect className="bz-snl-k-grid" x="2" y="2" width="1" height="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill={`url(#${dotsId})`} />
                <g className="bz-snl-pels" />
                <g className="bz-snl-snake" />
                <g className="bz-snl-fx" />
              </svg>
            </div>
            <div className="bz-snl-banner" data-on={view.banner ? "true" : "false"}>
              <span className="bz-snl-banner-in">{labels.clear}</span>
            </div>
          </div>
          <div className="bz-snl-strip">
            <div className="bz-snl-booth" aria-hidden="true">
              <div className="bz-snl-hero" data-frame="idle1">
                <LoaderHeroSprite hairStyle={hero.hairStyle} accessory={null} frames={SNL_FRAMES} />
              </div>
              <div className="bz-snl-ledge" />
            </div>
            <div className="bz-snl-slot">
              {/* The strip's resting face once the run is over (the progressbar itself steps out of view). */}
              <div className="bz-snl-cleared" aria-hidden="true">
                <div className="bz-snl-plate-top">
                  <span className="bz-snl-plate-label">{labels.clear}</span>
                </div>
                <div className="bz-snl-plate-row">
                  <span className="bz-snl-bar">
                    <span className="bz-snl-full" />
                  </span>
                  <span className="bz-snl-count">{`${n} of ${n}`}</span>
                </div>
              </div>
              <LoaderPlate api={api} />
            </div>
          </div>
        </div>
        {/* The player already stands in the booth, so the dialogue box goes without the speaker portrait. */}
        <LoaderBox api={api} hairStyle={null} />
        <LoaderDetails api={api} />
      </div>
    </section>
  );
}
