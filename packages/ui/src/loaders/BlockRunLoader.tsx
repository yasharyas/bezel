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
 * BlockRunLoader: a multi-step loader played as a side-scrolling platformer.
 *
 * Every step is a question block floating one hop above an adventurer's head.
 * When your process reports progress, the adventurer jumps and bonks the block
 * from below: the block bumps, a coin pops out and the nameplate bar fills to
 * the value you sent. When you mark the step done, a last bonk turns the block
 * solid and the course scrolls left, so the next block arrives overhead. A
 * skipped step becomes a dashed ghost block. After the last block the
 * adventurer runs to the flagpole, the flag comes down and the dialogue box
 * turns into a results screen built from your real numbers.
 *
 * Nothing moves on a timer. The bar fills at a bonk, at most one bonk every
 * 400ms with the increments in between merged, and the course scrolls only
 * when a step is done or skipped, so its position is always the number of
 * resolved steps. Coins and hops are feedback for something that happened;
 * they never add up to anything. A step whose size is unknown gets a hatched
 * bar and a blinking block instead of invented progress.
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
 * nameplate is the one progressbar. The dialogue box is a `role="log"` that
 * narrates milestones in sentences rather than ticks; errors go to a
 * `role="alert"` and a menu with a roving focus. Focus moves only when it is
 * already inside the loader.
 *
 * Reduced motion (followed live, or forced with `reducedMotion`) removes
 * every loop and tween: blocks swap state, the course snaps to its honest
 * place and the adventurer holds a still pose. The Pause motion button does
 * the same on request. Off screen or in a hidden tab nothing animates and
 * finished steps settle without their beats; on return the footer says what
 * finished meanwhile.
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

export type BlockRunLoaderColors = {
  /** The sky behind the course. */
  sky: string;
  /** Clouds. Set it to the sky colour for a course with no clouds. */
  cloud: string;
  /** Hills, bushes and the pipe highlight. */
  hill: string;
  /** Hill outlines and spots. */
  hillShade: string;
  /** Ground bricks. */
  ground: string;
  /** Mortar between the ground bricks. */
  groundMortar: string;
  /** The top edge of the ground, which carries it against the sky. */
  groundEdge: string;
  /** Question block fill. */
  block: string;
  /** Question block bevel shade. */
  blockShade: string;
  /** Block outline, rivets and the shadow under the "?". On a light sky it carries the block's edge; on a dark sky the bright block fill does. */
  blockLine: string;
  /** The "?" mark and the block's light bevel. */
  blockMark: string;
  /** A used block, once its step is done. */
  used: string;
  /** Used block shade. */
  usedShade: string;
  /** Coins, sparkles and the rivets of a block that needed a retry. */
  coin: string;
  /** Coin shade. */
  coinShade: string;
  /** Coin outline. */
  coinLine: string;
  /** The flagpole and the start pipe. */
  pole: string;
  /** The flag. */
  flag: string;
  /** Castle wall. */
  castle: string;
  /** Castle outline and bricks. */
  castleShade: string;
  /** Castle door and windows. */
  castleDoor: string;
  /** The adventurer's outline and the start pipe's. Pick one that clears 3:1 on the sky: near black on a light sky, a lifted slate on a dark one. */
  spriteOutline: string;
  /** Primary buttons, the nameplate bar, the banner rule and the attempt tag. Keep it clear of red, which marks a failed step. */
  accent: string;
  /** Text on accent: white on light themes, near black on dark ones. */
  onAccent: string;
};

/** One colour set per theme. The loader picks between them with light-dark(), following the host's color-scheme. */
export type BlockRunLoaderPalette = { light: BlockRunLoaderColors; dark: BlockRunLoaderColors };

export type BlockRunLoaderPaletteName = "overworld" | "underground";

/**
 * Two presets. Every text and control pair is AA on both themes. The
 * adventurer's outline and the ground edge clear 3:1 on their sky, and so do
 * the block outlines on the light skies; on the dark skies the bright block
 * fill carries the shape. Red belongs to the flag and the failed step alone.
 * Spread one to customise: `{ ...BLOCK_RUN_LOADER_PALETTES.overworld, dark: { ... } }`.
 */
export const BLOCK_RUN_LOADER_PALETTES: Record<BlockRunLoaderPaletteName, BlockRunLoaderPalette> = {
  overworld: {
    light: {
      sky: "#8fd3ff", cloud: "#ffffff", hill: "#4cc35a", hillShade: "#2e8b3d",
      ground: "#b5470d", groundMortar: "#f2a65a", groundEdge: "#4a1c05",
      block: "#f7b32b", blockShade: "#c27c0e", blockLine: "#5a3200", blockMark: "#fff3c4",
      used: "#a0522d", usedShade: "#6e3618",
      coin: "#ffd23f", coinShade: "#e09b00", coinLine: "#6b4500",
      pole: "#2f9e44", flag: "#e03131", castle: "#c8642a", castleShade: "#8a3d14", castleDoor: "#17142e",
      spriteOutline: "#17142e", accent: "#1864ab", onAccent: "#ffffff",
    },
    dark: {
      sky: "#16245a", cloud: "#2c3c7a", hill: "#2f9e44", hillShade: "#1f6e30",
      ground: "#c84c0c", groundMortar: "#7a2e08", groundEdge: "#f2a65a",
      block: "#f7b32b", blockShade: "#c27c0e", blockLine: "#5a3200", blockMark: "#fff3c4",
      used: "#b5653a", usedShade: "#7a3a1a",
      coin: "#ffd23f", coinShade: "#e09b00", coinLine: "#6b4500",
      pole: "#51cf66", flag: "#ff6b6b", castle: "#d9773a", castleShade: "#9a4a1c", castleDoor: "#0b0918",
      spriteOutline: "#6f80c0", accent: "#74c0fc", onAccent: "#0a0a0a",
    },
  },
  underground: {
    light: {
      sky: "#bfe6ee", cloud: "#f4fcfd", hill: "#3fb6c9", hillShade: "#1f7f91",
      ground: "#1f6f8b", groundMortar: "#9fd8e4", groundEdge: "#0b3a4a",
      block: "#f7b32b", blockShade: "#c27c0e", blockLine: "#5a3200", blockMark: "#fff3c4",
      used: "#3d6f80", usedShade: "#24505e",
      coin: "#ffd23f", coinShade: "#e09b00", coinLine: "#6b4500",
      pole: "#0e7490", flag: "#f59f00", castle: "#2b7a8c", castleShade: "#1a5462", castleDoor: "#17142e",
      spriteOutline: "#17142e", accent: "#0e7490", onAccent: "#ffffff",
    },
    dark: {
      sky: "#0b1a2b", cloud: "#0b1a2b", hill: "#123a4a", hillShade: "#0d2c38",
      ground: "#3bb3c9", groundMortar: "#0e4c5c", groundEdge: "#9be7f2",
      block: "#f7b32b", blockShade: "#c27c0e", blockLine: "#5a3200", blockMark: "#fff3c4",
      used: "#4f8fa3", usedShade: "#2f6a7c",
      coin: "#ffd23f", coinShade: "#e09b00", coinLine: "#6b4500",
      pole: "#67e8f9", flag: "#fbbf24", castle: "#3bb3c9", castleShade: "#237d8f", castleDoor: "#0b0918",
      spriteOutline: "#5f7896", accent: "#67e8f9", onAccent: "#0a0a0a",
    },
  },
};

export type BlockRunLoaderProps = {
  /** The run, and the only state. The host replaces the array whenever a step changes. */
  steps: LoaderStep[];
  /** The heading, and the progressbar's accessible name. */
  title: string;
  /** Heading level of the title. Default 2. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** A preset name or your own light and dark colours. Default "overworld". */
  palette?: BlockRunLoaderPaletteName | BlockRunLoaderPalette;
  /** A preset adventurer or your own colours. Default "ember". */
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
  for (const [k, d] of loaderPixelPaths(map)) out += `<path class="bz-brl-k-${roles[k] ?? k}" d="${d}"/>`;
  return `${out}</svg>`;
}

const loaderKebab = (key: string) => key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/** A palette as custom properties on the root, each one light-dark(<light>, <dark>). */
function loaderPaletteVars(light: Record<string, string>, dark: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(light)) out[`--bz-brl-${loaderKebab(key)}`] = `light-dark(${light[key]}, ${dark[key] ?? light[key]})`;
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
    <svg className="bz-brl-g" viewBox={`0 0 ${map[0].length} ${map.length}`} shapeRendering="crispEdges" aria-hidden="true" focusable="false">
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

/* Colour key to the class role (bz-brl-c-<role>), which the stylesheet maps to a custom property. */
const LOADER_HERO_ROLES: Record<string, string> = {
  o: "outline", h: "hair", H: "hair-shade", s: "skin", S: "skin-shade", w: "eye-white", e: "eye", m: "mouth",
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
  return grid.map((r) => r.join(""));
}

/* Every frame's paths depend only on the hair style and the accessory, never on colour, so they are built once. */
const loaderHeroCache = new Map<string, string>();
function loaderHeroMarkup(hairStyle: LoaderCharacter["hairStyle"], accessory: LoaderAccessory | null): string {
  const key = `${hairStyle}:${accessory?.id ?? ""}`;
  const hit = loaderHeroCache.get(key);
  if (hit) return hit;
  let out = "";
  for (const name of LOADER_FRAME_NAMES) {
    let paths = "";
    for (const [k, d] of loaderPixelPaths(composeLoaderHero(hairStyle, name, accessory ? accessory.layers(name) : null))) {
      paths += `<path class="bz-brl-c-${LOADER_HERO_ROLES[k] ?? k}" d="${d}"/>`;
    }
    out += `<g class="bz-brl-f" data-f="${name}">${paths}</g>`;
  }
  loaderHeroCache.set(key, out);
  return out;
}

/** All sixteen frames in one svg; the wrapper's data-frame (or data-loop) decides which one shows. */
function LoaderHeroSprite({ hairStyle, accessory }: { hairStyle: LoaderCharacter["hairStyle"]; accessory: LoaderAccessory | null }) {
  return (
    <svg
      className="bz-brl-sprite"
      viewBox={`0 0 ${LOADER_HERO_W} ${LOADER_HERO_H}`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      overflow="visible"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: loaderHeroMarkup(hairStyle, accessory) }}
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
    for (const [k, d] of loaderPixelPaths([...head.map((r) => r.join("")), LOADER_SCARF_ROW])) paths += `<path class="bz-brl-c-${LOADER_HERO_ROLES[k] ?? k}" d="${d}"/>`;
    out += `<g data-f="${eyes}">${paths}</g>`;
  }
  loaderPortraitCache.set(hairStyle, out);
  return out;
}

/** Open eyes that blink now and then while work runs, a squint on an error, dazed when stopped, happy at the end. */
function LoaderPortrait({ hairStyle, face }: { hairStyle: LoaderCharacter["hairStyle"]; face: LoaderFace }) {
  return (
    <div className="bz-brl-face" data-face={face} aria-hidden="true">
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
type LoaderTile = { label: string; value: number | string; kind: "steps" | "time" | "stat" | "hiccup"; total: number; sub: string };
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
    const panel = r?.querySelector('[data-panel="error"]');
    const had = !!panel && !!a && panel.contains(a);
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
    if (total > 0) tiles.push({ label: "Time", value: total, kind: "time", total: 0, sub: longest ? `Longest: ${longest.label}, ${fmtDur(longest.durationMs)}` : "" });
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
    titleId: `bz-brl-title-${uid}`,
    detailsId: `bz-brl-details-${uid}`,
    hatchId: `bz-brl-hatch-${uid}`,
  };
}

type LoaderApi = ReturnType<typeof useLoader>;

/* ---------------- end shared: engine ---------------- */

/* ---------------- shared: chassis ---------------- */

/** The structure for screen readers: every step and its state. */
function LoaderStepList({ api }: { api: LoaderApi }) {
  return (
    <ol className="bz-brl-sr" aria-busy={api.view.phase === "run" ? "true" : "false"}>
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
  // "620 of 1,240 contacts": the unit word can drop on the narrowest layouts, the numbers never do.
  const unit = /^(.*\d)(\s+[^\d·]+)$/.exec(plate.count);
  return (
    <div
      className="bz-brl-plate"
      role="progressbar"
      aria-labelledby={api.titleId}
      aria-valuemin={0}
      aria-valuemax={Math.max(1, api.n)}
      aria-valuenow={api.settled}
      aria-valuetext={api.valueText}
      data-state={plate.state}
      data-gone={plate.gone ? "true" : "false"}
    >
      <div className="bz-brl-plate-in" key={api.view.frontKey}>
        <div className="bz-brl-plate-top">
          <span className="bz-brl-plate-label">{plate.label}</span>
          <span className="bz-brl-badges">
            {plate.attempt ? <span className="bz-brl-tag">{labels.attempt(plate.attempt)}</span> : null}
            {plate.failed ? (
              <span className="bz-brl-failed">
                <LoaderGlyph name="cross" />
                {labels.failed}
              </span>
            ) : null}
          </span>
        </div>
        <div className="bz-brl-plate-row">
          <span className="bz-brl-bar" data-indet={plate.indet ? "true" : "false"}>
            <span className="bz-brl-fill" style={{ width: `${Math.round(plate.p * 1000) / 10}%` }} />
            <svg className="bz-brl-hatch" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
              <defs>
                <pattern id={api.hatchId} width="8" height="8" patternUnits="userSpaceOnUse">
                  <path d="M0 6h2v2H0zM2 4h2v2H2zM4 2h2v2H4zM6 0h2v2H6z" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#${api.hatchId})`} />
            </svg>
          </span>
          <span className="bz-brl-count">
            {unit ? unit[1] : plate.count}
            {unit ? <span className="bz-brl-unit">{unit[2]}</span> : null}
          </span>
        </div>
      </div>
    </div>
  );
}

const LOADER_LINE_GLYPH: Record<LoaderLineKind, LoaderGlyphName> = { done: "done", skipped: "skipped", retry: "retry", finish: "finish", stop: "stop" };

/** The dialogue box: narration, the error menu and the results share one cell, so it never changes height. */
function LoaderBox({ api, hairStyle }: { api: LoaderApi; hairStyle: LoaderCharacter["hairStyle"] }) {
  const { view, labels } = api;
  const errorOn = view.phase === "error";
  const resultsOn = view.results;
  const errTextRef = useRef<HTMLDivElement>(null);
  const [errScroll, setErrScroll] = useState(false);
  // Long host text on a narrow screen can outgrow the error cell. Then the cell scrolls and takes focus, so a keyboard reaches all of it.
  useLayoutEffect(() => {
    const el = errTextRef.current;
    if (!el || !errorOn) {
      setErrScroll(false);
      return;
    }
    const check = () => setErrScroll(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(check) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [errorOn, api.detailsOpen, view.alert, view.details, view.detailMore]);
  const lastLine = view.lines.length ? view.lines[view.lines.length - 1].text : "";
  const face: LoaderFace = errorOn ? "squint" : view.phase === "stopped" ? "blink" : view.phase === "complete" ? "happy" : "open";
  return (
    <div className="bz-brl-frame bz-brl-box">
      <div className="bz-brl-frame-in bz-brl-box-in">
        <LoaderPortrait hairStyle={hairStyle} face={face} />
        <div className="bz-brl-panels">
          <div className="bz-brl-panel bz-brl-talk">
            <div ref={api.logRef} className="bz-brl-log" role="log" aria-label={labels.narration} tabIndex={errorOn || resultsOn ? -1 : 0}>
              {view.lines.map((line, k) => (
                <p key={line.key} className="bz-brl-line" data-kind={line.kind} data-last={k === view.lines.length - 1 ? "true" : undefined}>
                  <LoaderGlyph name={LOADER_LINE_GLYPH[line.kind]} />
                  <span>{line.text}</span>
                </p>
              ))}
            </div>
            {view.lines.length ? null : (
              <p className="bz-brl-ph" aria-hidden="true">
                {api.placeholder}
              </p>
            )}
          </div>
          <div className="bz-brl-panel bz-brl-err" data-panel="error" data-on={errorOn ? "true" : "false"}>
            <div
              ref={errTextRef}
              className="bz-brl-err-text"
              data-scroll={errScroll ? "true" : undefined}
              tabIndex={errScroll ? 0 : undefined}
              role={errScroll ? "region" : undefined}
              aria-labelledby={errScroll ? `${api.detailsId}-alert` : undefined}
            >
              <div id={`${api.detailsId}-alert`} className="bz-brl-alert" role="alert">
                {view.alert ? (
                  <>
                    <LoaderGlyph name="cross" />
                    <span>{view.alert}</span>
                  </>
                ) : null}
              </div>
              <p id={api.detailsId} className="bz-brl-details" hidden={!api.detailsOpen}>
                <span>{view.details}</span>
                {view.detailMore ? <span className="bz-brl-more-detail">{view.detailMore}</span> : null}
              </p>
            </div>
            <div ref={api.menuRef} className="bz-brl-menu" role="group" aria-label={labels.menu} onKeyDown={api.onMenuKey}>
              {api.commands.map((c, k) => (
                <button
                  key={c.key}
                  type="button"
                  className={`bz-brl-btn${c.primary ? " bz-brl-primary" : ""}`}
                  tabIndex={k === api.cursor ? 0 : -1}
                  data-cursor={k === api.cursor ? "true" : undefined}
                  aria-expanded={c.key === "details" ? c.expanded : undefined}
                  aria-controls={c.key === "details" ? api.detailsId : undefined}
                  onFocus={() => api.setCursor(k)}
                  onClick={c.run}
                >
                  <span className="bz-brl-cur" aria-hidden="true">
                    <LoaderGlyph name="cursor" />
                  </span>
                  {c.label}
                  {c.sr ? <span className="bz-brl-sr">{c.sr}</span> : null}
                </button>
              ))}
            </div>
          </div>
          <div className="bz-brl-panel bz-brl-res" data-on={resultsOn ? "true" : "false"}>
            <p className="bz-brl-res-line" aria-hidden="true">
              {resultsOn ? lastLine : ""}
            </p>
            <dl className="bz-brl-tiles">
              {view.tiles.map((t) => (
                <div className="bz-brl-tile" key={t.label} data-kind={t.kind}>
                  <dt>{t.label}</dt>
                  <dd>
                    <span className="bz-brl-num" aria-hidden="true">
                      {loaderTileText(t, api.countT)}
                    </span>
                    <span className="bz-brl-sr">{loaderTileText(t, 1)}</span>
                    {t.sub ? (
                      <span className="bz-brl-sub" title={t.sub}>
                        {t.sub}
                      </span>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <div className="bz-brl-foot">
          <p className="bz-brl-meta" aria-hidden="true">
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
          <div className="bz-brl-tools">
            {api.props.onContinue ? (
              <button
                ref={api.continueRef}
                type="button"
                className="bz-brl-btn bz-brl-primary bz-brl-continue"
                data-on={view.done ? "true" : "false"}
                onClick={() => api.props.onContinue?.()}
              >
                {labels.continue}
              </button>
            ) : null}
            <button
              type="button"
              className="bz-brl-btn bz-brl-toy"
              aria-pressed={api.paused}
              data-hide={api.reduced ? "true" : undefined}
              onClick={api.togglePause}
            >
              <LoaderGlyph name="pause" />
              {labels.pauseMotion}
            </button>
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
.bz-brl{container-type:inline-size;display:block;width:100%;min-width:0;
--bz-brl-ink:light-dark(var(--bz-ink,#0a0a0a),var(--bz-void-ink,#ffffff));
--bz-brl-muted:light-dark(var(--bz-ink-muted,#4a4a4c),rgba(255,255,255,0.8));
--bz-brl-panel:light-dark(var(--bz-paper,#ffffff),var(--bz-void-raised,#1a1a1a));
--bz-brl-track:light-dark(var(--bz-line-opaque,#f0f0f0),#313131);
--bz-brl-danger:light-dark(var(--bz-danger,#b91c1c),#fca5a5);
--bz-brl-danger-mark:light-dark(#dc2626,#f87171);
--bz-brl-success:light-dark(var(--bz-emerald,#047857),var(--bz-emerald-on-void,#34d399));
--bz-brl-focus:light-dark(var(--bz-focus-ring,#912c22),var(--bz-focus-ring-void,#ffffff));
--bz-brl-hairline:light-dark(rgba(10,10,10,0.13),rgba(255,255,255,0.16));
--bz-brl-idle:light-dark(#8a8a8e,#8c8c8c);
--bz-brl-fast:var(--bz-duration-fast,150ms);
--bz-brl-base:var(--bz-duration-base,300ms);
--bz-brl-ease:var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1));
--bz-brl-beat:var(--bz-duration-beat,2.4s);
--bz-brl-sans:var(--bz-font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);
--bz-brl-mono:var(--bz-font-mono,ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace)}
.bz-brl *,.bz-brl *::before,.bz-brl *::after{box-sizing:border-box}
.bz-brl-in{--bz-brl-u:3px;position:relative;padding:16px;border:1px solid var(--bz-brl-hairline);border-radius:16px;background:var(--bz-brl-panel);color:var(--bz-brl-ink);font-family:var(--bz-brl-sans);font-size:15px;line-height:1.5;text-align:left}
.bz-brl-sr{position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}
.bz-brl-title{margin:0 0 10px;font-size:15px;font-weight:600;line-height:21px;color:var(--bz-brl-ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bz-brl-title:focus{outline:none}
.bz-brl-title:focus-visible{outline:2px solid var(--bz-brl-focus);outline-offset:2px}
.bz-brl-frame{position:relative;padding:2px;background:var(--bz-brl-ink);clip-path:${LOADER_STEP_OUTER}}
.bz-brl-frame-in{position:relative;background:var(--bz-brl-panel);clip-path:${LOADER_STEP_INNER}}
.bz-brl-g{display:block;flex:none}
.bz-brl-g path{fill:currentColor}

.bz-brl-plate{position:relative;padding:6px 10px 8px 16px;background:var(--bz-brl-panel);border:2px solid var(--bz-brl-ink);color:var(--bz-brl-ink)}
.bz-brl-plate::before{content:"";position:absolute;left:0;top:0;bottom:0;width:6px;background:var(--bz-brl-accent)}
.bz-brl-plate[data-state="pending"]::before{background:var(--bz-brl-idle)}
.bz-brl-plate[data-state="error"]::before{background:var(--bz-brl-danger-mark)}
.bz-brl-plate[data-gone="true"]{position:absolute!important;width:1px!important;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);border:0}
.bz-brl-plate-in{animation:bz-brl-fade var(--bz-brl-fast) linear}
.bz-brl-plate-top{display:flex;align-items:center;gap:2px 8px;min-height:22px}
.bz-brl-plate-label{flex:1 1 auto;min-width:0;font-size:14px;font-weight:600;line-height:20px;overflow:hidden;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.bz-brl-badges{display:inline-flex;flex:none;align-items:center;gap:6px}
.bz-brl-badges:empty{display:none}
.bz-brl-tag{flex:none;padding:3px 6px 2px;background:var(--bz-brl-accent);color:var(--bz-brl-on-accent);font:700 11px/1.2 var(--bz-brl-mono);letter-spacing:0.02em;white-space:nowrap}
.bz-brl-failed{flex:none;display:inline-flex;align-items:center;gap:5px;color:var(--bz-brl-danger);font-size:13px;font-weight:700;line-height:1}
.bz-brl-failed .bz-brl-g{width:12px;height:12px;color:var(--bz-brl-danger-mark)}
.bz-brl-plate-row{display:flex;align-items:center;gap:4px 10px;margin-top:6px}
.bz-brl-bar{position:relative;flex:1 1 56px;min-width:56px;height:12px;overflow:hidden;border:2px solid var(--bz-brl-ink);background:var(--bz-brl-track)}
.bz-brl-fill{position:absolute;left:0;top:0;bottom:0;background:var(--bz-brl-accent);transition:width var(--bz-brl-base) var(--bz-brl-ease)}
.bz-brl-hatch{position:absolute;top:0;left:-8px;width:calc(100% + 8px);height:100%;display:none;color:var(--bz-brl-accent)}
.bz-brl-hatch path{fill:currentColor}
.bz-brl-bar[data-indet="true"] .bz-brl-fill{display:none}
.bz-brl-bar[data-indet="true"] .bz-brl-hatch{display:block;animation:bz-brl-march var(--bz-brl-beat) steps(4) infinite}
.bz-brl-count{flex:none;font:500 12px/16px var(--bz-brl-mono);color:var(--bz-brl-muted);white-space:nowrap;font-variant-numeric:tabular-nums}
@keyframes bz-brl-march{from{transform:translateX(0)}to{transform:translateX(8px)}}
@keyframes bz-brl-fade{from{opacity:0}to{opacity:1}}

.bz-brl-box{margin-top:12px}
.bz-brl-box-in{display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:16px;padding:14px 18px 12px}
.bz-brl-face{align-self:start;width:72px;height:58px;padding:6px 2px 0;border:2px solid var(--bz-brl-ink);background:var(--bz-brl-portrait,var(--bz-brl-track));overflow:hidden}
.bz-brl-face svg{display:block;width:64px;height:48px}
.bz-brl-face g{display:none}
.bz-brl-face[data-face="open"] g[data-f="open"],.bz-brl-face[data-face="blink"] g[data-f="blink"],.bz-brl-face[data-face="squint"] g[data-f="squint"],.bz-brl-face[data-face="happy"] g[data-f="happy"]{display:inline}
.bz-brl[data-motion="on"] .bz-brl-face[data-face="open"] g[data-f="blink"]{display:inline;animation:bz-brl-blink calc(var(--bz-brl-beat) * 2) step-end infinite}
@keyframes bz-brl-blink{0%{visibility:hidden}96%{visibility:visible}100%{visibility:visible}}
.bz-brl-panels{display:grid;height:140px}
.bz-brl-panel{grid-area:1/1;min-width:0;min-height:0;background:var(--bz-brl-panel)}
.bz-brl-talk{position:relative}
.bz-brl-err,.bz-brl-res{z-index:1;visibility:hidden}
.bz-brl-err[data-on="true"],.bz-brl-res[data-on="true"]{visibility:visible}
.bz-brl-log{position:relative;height:120px;overflow-y:auto;scrollbar-width:none;overscroll-behavior:contain;font-size:15px;line-height:24px}
.bz-brl-log::-webkit-scrollbar{display:none}
.bz-brl-log:focus{outline:none}
.bz-brl-log:focus-visible{outline:2px solid var(--bz-brl-focus);outline-offset:2px}
.bz-brl-line{display:flex;gap:8px;margin:0;color:var(--bz-brl-muted);font-size:14px}
.bz-brl-line[data-last="true"]{color:var(--bz-brl-ink);font-size:16px;font-weight:500}
.bz-brl-line>.bz-brl-g{width:14px;height:14px;margin-top:5px;visibility:hidden}
.bz-brl-line[data-last="true"]>.bz-brl-g{visibility:visible}
.bz-brl-line[data-kind="done"]>.bz-brl-g{color:var(--bz-brl-success)}
.bz-brl-line[data-kind="skipped"]>.bz-brl-g,.bz-brl-line[data-kind="stop"]>.bz-brl-g{color:var(--bz-brl-muted)}
.bz-brl-line[data-kind="retry"]>.bz-brl-g,.bz-brl-line[data-kind="finish"]>.bz-brl-g{color:var(--bz-brl-accent)}
.bz-brl-ph{position:absolute;left:0;top:0;margin:0;font-size:15px;line-height:24px;color:var(--bz-brl-muted)}

.bz-brl-err{display:grid;grid-template-rows:minmax(0,1fr) auto;row-gap:10px}
.bz-brl-err-text{min-height:0;overflow-y:auto;scrollbar-width:thin}
.bz-brl-err-text:focus{outline:none}
.bz-brl-err-text:focus-visible{outline:2px solid var(--bz-brl-focus);outline-offset:2px}
.bz-brl-err-text[data-scroll="true"]{background:linear-gradient(var(--bz-brl-panel),var(--bz-brl-panel)) 0 100%/100% 6px no-repeat local,linear-gradient(var(--bz-brl-muted),var(--bz-brl-muted)) 0 100%/100% 2px no-repeat scroll}
.bz-brl-alert{visibility:visible;display:flex;gap:10px;color:var(--bz-brl-ink);font-size:15px;font-weight:500;line-height:24px}
.bz-brl-alert>.bz-brl-g{width:14px;height:14px;margin-top:5px;color:var(--bz-brl-danger-mark)}
.bz-brl-details{margin:4px 0 0 24px;font:500 12px/18px var(--bz-brl-mono);color:var(--bz-brl-muted)}
.bz-brl-details[hidden]{display:none}
.bz-brl-more-detail{display:block;font-family:var(--bz-brl-sans);font-size:13px;line-height:18px}
.bz-brl-menu{display:flex;flex-wrap:wrap;gap:8px}
.bz-brl-menu .bz-brl-btn{justify-content:flex-start;gap:6px;padding:0 16px 0 8px}
.bz-brl-cur{display:inline-flex;width:8px;visibility:hidden}
.bz-brl-cur .bz-brl-g{width:8px;height:14px}
.bz-brl-err[data-on="true"] .bz-brl-btn[data-cursor="true"] .bz-brl-cur{visibility:visible}

.bz-brl-res{display:flex;flex-direction:column;gap:8px;overflow:hidden}
.bz-brl-res-line{flex:none;margin:0;font-size:15px;font-weight:500;line-height:22px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.bz-brl-tiles{display:flex;flex-wrap:wrap;align-content:flex-start;gap:8px 12px;min-height:0;margin:0;overflow-y:auto}
.bz-brl-tile{flex:1 1 auto;min-width:0;padding-top:6px;border-top:2px solid var(--bz-brl-ink)}
.bz-brl-tile[data-kind="time"]{flex-grow:4}
.bz-brl-tile dt{font:700 11px/14px var(--bz-brl-mono);letter-spacing:0.08em;text-transform:uppercase;color:var(--bz-brl-muted)}
.bz-brl-tile dd{margin:2px 0 0}
.bz-brl-num{display:block;font:700 18px/24px var(--bz-brl-mono);color:var(--bz-brl-ink);font-variant-numeric:tabular-nums;white-space:nowrap}
.bz-brl-sub{width:0;min-width:100%;font-size:12px;line-height:16px;color:var(--bz-brl-muted);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}

.bz-brl-foot{grid-column:1/-1;display:flex;align-items:center;gap:8px 16px;margin-top:12px}
.bz-brl-meta{flex:1 1 auto;min-width:0;height:40px;margin:0;overflow:hidden;font-size:13px;line-height:20px;color:var(--bz-brl-muted);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.bz-brl-meta b{font-weight:600;color:var(--bz-brl-ink)}
.bz-brl-meta .bz-brl-g{display:inline-block;width:12px;height:12px;margin-right:6px;vertical-align:-1px;color:var(--bz-brl-accent)}
.bz-brl-tools{display:flex;flex:none;justify-content:flex-end;gap:8px}

.bz-brl-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-width:48px;min-height:48px;margin:0;padding:0 16px;border:2px solid var(--bz-brl-ink);border-radius:0;background:var(--bz-brl-panel);color:var(--bz-brl-ink);box-shadow:inset 0 -3px 0 var(--bz-brl-track);font:600 14px/1.2 var(--bz-brl-sans);text-align:left;cursor:pointer;transition:background-color var(--bz-brl-fast) var(--bz-brl-ease),transform var(--bz-brl-fast) var(--bz-brl-ease)}
.bz-brl-btn .bz-brl-g{width:12px;height:12px}
.bz-brl-btn:focus{outline:none}
.bz-brl-btn:focus-visible{outline:2px solid var(--bz-brl-focus);outline-offset:2px;background:var(--bz-brl-track)}
@media (hover:hover){.bz-brl-btn:hover{background:var(--bz-brl-track)}}
.bz-brl[data-motion="on"] .bz-brl-btn:active{transform:scale(0.97)}
.bz-brl-btn:disabled{opacity:0.5;cursor:not-allowed}
.bz-brl-primary{border-color:var(--bz-brl-accent);background:var(--bz-brl-accent);color:var(--bz-brl-on-accent);box-shadow:inset 0 -3px 0 rgba(0,0,0,0.25)}
.bz-brl-primary:focus-visible{background:var(--bz-brl-accent);box-shadow:inset 0 -3px 0 rgba(0,0,0,0.25),inset 0 0 0 2px var(--bz-brl-panel)}
@media (hover:hover){.bz-brl-primary:hover{background:var(--bz-brl-accent);box-shadow:inset 0 -3px 0 rgba(0,0,0,0.25),inset 0 0 0 2px var(--bz-brl-panel)}}
.bz-brl-toy{padding:0 14px;font-size:13.5px}
.bz-brl-toy[aria-pressed="true"]{border-color:var(--bz-brl-ink);background:var(--bz-brl-ink);color:var(--bz-brl-panel);box-shadow:none}
.bz-brl-toy[data-hide="true"]{display:none}
.bz-brl-continue{min-width:112px;visibility:hidden}
.bz-brl-continue[data-on="true"]{visibility:visible}

@container (max-width:559px){
.bz-brl-in{--bz-brl-u:2px;padding:12px}
.bz-brl-box-in{padding:12px 12px 10px}
.bz-brl-box-in{grid-template-columns:minmax(0,1fr)}
.bz-brl-face{display:none}
.bz-brl-panels{height:240px}
.bz-brl-log{height:220px}
.bz-brl-plate-row{flex-wrap:wrap}
.bz-brl-bar{flex-basis:100%}
.bz-brl-badges{position:absolute;top:-12px;right:8px}
.bz-brl-tag,.bz-brl-failed{padding:3px 6px 2px;border:2px solid var(--bz-brl-ink)}
.bz-brl-failed{background:var(--bz-brl-panel);line-height:1.2}
.bz-brl-menu{display:grid;grid-template-columns:1fr 1fr}
.bz-brl-tile{flex-basis:40%}
.bz-brl-sub{display:block;white-space:nowrap;text-overflow:ellipsis}
.bz-brl-res-line{-webkit-line-clamp:3}
.bz-brl-foot{flex-wrap:wrap}
.bz-brl-meta{flex:1 1 100%}
.bz-brl-tools{flex:1 1 100%}
}
@container (max-width:339px){
.bz-brl-unit{display:none}
.bz-brl-menu .bz-brl-btn{padding:0 8px 0 4px;gap:4px;font-size:13.5px}
.bz-brl-toy{padding:0 10px;gap:6px}
.bz-brl-continue{min-width:96px;padding:0 12px}
.bz-brl-toy,.bz-brl-continue,.bz-brl-menu .bz-brl-btn{white-space:nowrap}
}

.bz-brl-hero .bz-brl-f{display:none}
${LOADER_FRAME_NAMES.map((f) => `.bz-brl-hero[data-frame="${f}"] .bz-brl-f[data-f="${f}"]`).join(",")}{display:inline}
.bz-brl-hero[data-loop="idle"] .bz-brl-f[data-f="idle1"],.bz-brl-hero[data-loop="working"] .bz-brl-f[data-f="idle1"],.bz-brl-hero[data-loop="celebrate"] .bz-brl-f[data-f="celebrate1"],.bz-brl-hero[data-loop="fly"] .bz-brl-f[data-f="fly1"]{display:inline;animation:bz-brl-a var(--bz-brl-loop) step-end infinite}
.bz-brl-hero[data-loop="idle"] .bz-brl-f[data-f="idle2"],.bz-brl-hero[data-loop="working"] .bz-brl-f[data-f="swing1"],.bz-brl-hero[data-loop="celebrate"] .bz-brl-f[data-f="celebrate2"],.bz-brl-hero[data-loop="fly"] .bz-brl-f[data-f="fly2"]{display:inline;animation:bz-brl-b var(--bz-brl-loop) step-end infinite}
.bz-brl-hero{--bz-brl-loop:var(--bz-brl-beat)}
.bz-brl-hero[data-loop="celebrate"]{--bz-brl-loop:calc(var(--bz-brl-beat) / 4)}
.bz-brl-hero[data-loop="fly"]{--bz-brl-loop:calc(var(--bz-brl-beat) / 8)}
.bz-brl-hero[data-loop="run"] .bz-brl-f[data-f^="run"]{display:inline;animation:bz-brl-r 400ms step-end infinite}
.bz-brl-hero[data-loop="run"] .bz-brl-f[data-f="run2"]{animation-delay:-300ms}
.bz-brl-hero[data-loop="run"] .bz-brl-f[data-f="run3"]{animation-delay:-200ms}
.bz-brl-hero[data-loop="run"] .bz-brl-f[data-f="run4"]{animation-delay:-100ms}
@keyframes bz-brl-a{0%{visibility:visible}50%{visibility:hidden}100%{visibility:hidden}}
@keyframes bz-brl-b{0%{visibility:hidden}50%{visibility:visible}100%{visibility:visible}}
@keyframes bz-brl-r{0%{visibility:visible}25%{visibility:hidden}100%{visibility:hidden}}
.bz-brl-c-outline{fill:var(--bz-brl-sprite-outline)}
.bz-brl-c-mouth{fill:var(--chr-eye)}
${LOADER_CHARACTER_KEYS.map((k) => `.bz-brl-c-${k}{fill:var(--chr-${k})}`).join("\n")}

.bz-brl[data-motion="off"] .bz-brl-f,.bz-brl[data-motion="off"] .bz-brl-hatch{animation:none!important}
.bz-brl[data-motion="off"] .bz-brl-fill{transition:none}
.bz-brl[data-motion="off"] .bz-brl-btn{transition:background-color var(--bz-brl-fast) linear}
.bz-brl[data-running="false"] *,.bz-brl[data-running="false"] *::before{animation-play-state:paused!important}
`;

/* ---------------- end shared: chassis ---------------- */

/* ---------------- Block Run arena ---------------- */

/* Art keys for the course, each mapped by class (bz-brl-k-<role>) to a palette colour. */
const BRL_ROLES: Record<string, string> = {
  k: "block-line", q: "block", Q: "block-shade", m: "block-mark", u: "used", U: "used-shade",
  c: "coin", C: "coin-shade", n: "coin-line", h: "hill", H: "hill-shade", w: "cloud",
  g: "ground", G: "ground-mortar", e: "ground-edge", p: "pole", f: "flag",
  t: "castle", T: "castle-shade", d: "castle-door", o: "sprite-outline", x: "danger-mark", z: "ghost",
};

const BRL_Q = [".####.", "##..##", "....##", "...##.", "..##..", "......", "..##..", "..##.."];
const BRL_Q_BIG = ["..####..", ".##..##.", "##....##", "......##", ".....##.", "....##..", "...##...", "........", "...##...", "...##..."];
const BRL_BANG = ["..##..", "..##..", "..##..", "..##..", "..##..", "......", "..##..", "..##.."];
const BRL_BANG_BIG = ["...##...", "...##...", "...##...", "...##...", "...##...", "...##...", "...##...", "........", "...##...", "...##..."];
const BRL_COIN = ["..nn..", ".nccn.", "nccCcn", "nccCcn", "nccCcn", "nccCcn", ".nccn.", "..nn.."];
const BRL_COIN_TURN = ["..nn..", ".ncCn.", ".ncCn.", ".ncCn.", ".ncCn.", ".ncCn.", ".ncCn.", "..nn.."];
const BRL_SPARK = ["..c..", "..c..", "cc.cc", "..c..", "..c.."];
const BRL_SPARK_SMALL = [".....", "..c..", ".c.c.", "..c..", "....."];
const BRL_GROUND = ["eeeeeeee", "gggGgggg", "gggGgggg", "GGGGGGGG", "gggggggG", "gggggggG", "GGGGGGGG"];
const BRL_CLOUD = [".....wwww.......", "...wwwwwwww.....", "..wwwwwwwwwwww..", ".wwwwwwwwwwwwww.", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", ".wwwwwwwwwwwwww."];
const BRL_HILL = [".......HHHHHH.......", ".....HHhhhhhhHH.....", "....HhhhhhhhhhhH....", "...HhhhHhhhhHhhhH...", "..HhhhhhhhhhhhhhhH..", ".HhhhhHhhhhhhhHhhhH.", ".HhhhhhhhhhhhhhhhhH.", "HhhhhhhhhhhhhhhhhhhH"];
const BRL_BUSH = ["...HH..HH...", "..HhhHHhhH..", ".HhhhhhhhhH.", "HhhhhhhhhhhH"];
const BRL_PIPE = ["oooooooooo", "ohhppppppo", "ohhppppppo", "oooooooooo", ".ohpppppo.", ".ohpppppo.", ".ohpppppo.", ".ohpppppo.", ".ohpppppo.", ".ohpppppo."];
const BRL_CASTLE = [
  "......TT.TT.TT......",
  "......TTTTTTTT......",
  "......TttttttT......",
  "......TtdttdtT......",
  "......TtdttdtT......",
  "......TttttttT......",
  "TT.TT.TttttttT.TT.TT",
  "TTTTTTTTTTTTTTTTTTTT",
  "TttttttttttttttttttT",
  "TttTttttttttttttTttT",
  "TttttttTddddTttttttT",
  "TttttttddddddttttttT",
  "TttttttddddddttttttT",
  "TttttttddddddttttttT",
  "TttttttddddddttttttT",
];
const BRL_FLAG = [".....f", "...fff", ".fffff", "ffffff", ".fffff", "...fff", ".....f"];
const BRL_BALL = [".p.", "ppp", ".p."];
const BRL_POLE_BASE = ["kkk", "kuk", "kkk"];

type BrlBlockKind = "q" | "err" | "used" | "usedg" | "ghost";

/* A block is n x n art pixels: an outline with cut corners, a light bevel at
   the top left and a shade at the bottom right, four rivets, and a glyph with
   a one-pixel shadow in its own layer so the "?" can blink on the beat. A
   skipped step is a dashed outline; a used block needed a retry when its
   rivets are gold. */
function brlBlockMaps(n: number, kind: BrlBlockKind): { base: string[]; mark: string[] | null } {
  const grid = Array.from({ length: n }, () => Array<string>(n).fill("."));
  if (kind === "ghost") {
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const ex = x === 0 || x === n - 1;
        const ey = y === 0 || y === n - 1;
        const at = ex && !ey ? y : ey && !ex ? x : -1;
        if (at > 0 && (at % 4 === 1 || at % 4 === 2)) grid[y][x] = "z";
      }
    }
    return { base: grid.map((r) => r.join("")), mark: null };
  }
  const fill = kind === "err" ? "x" : kind === "q" ? "q" : "u";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const ex = x === 0 || x === n - 1;
      const ey = y === 0 || y === n - 1;
      grid[y][x] = ex && ey ? "." : ex || ey ? "k" : fill;
    }
  }
  if (kind === "q") for (let i = 1; i < n - 2; i++) grid[1][i] = grid[i][1] = "m";
  const shade = kind === "q" ? "Q" : kind === "err" ? "" : "U";
  if (shade) for (let i = 2; i < n - 1; i++) grid[n - 2][i] = grid[i][n - 2] = shade;
  const rivet = kind === "usedg" ? "c" : "k";
  for (const [x, y] of [[3, 3], [n - 4, 3], [3, n - 4], [n - 4, n - 4]]) grid[y][x] = rivet;
  const base = grid.map((r) => r.join(""));
  const glyph = kind === "q" ? (n > 16 ? BRL_Q_BIG : BRL_Q) : kind === "err" ? (n > 16 ? BRL_BANG_BIG : BRL_BANG) : null;
  if (!glyph) return { base, mark: null };
  const mark = Array.from({ length: n }, () => Array<string>(n).fill("."));
  const gx = Math.floor((n - glyph[0].length) / 2);
  const gy = Math.floor((n - glyph.length) / 2);
  glyph.forEach((row, y) => [...row].forEach((c, x) => { if (c === "#") mark[gy + y + 1][gx + x + 1] = "k"; }));
  glyph.forEach((row, y) => [...row].forEach((c, x) => { if (c === "#") mark[gy + y][gx + x] = "m"; }));
  return { base, mark: mark.map((r) => r.join("")) };
}

const brlBlockCache = new Map<string, string>();
function brlBlockHtml(n: number, kind: BrlBlockKind): string {
  const key = `${kind}${n}`;
  let html = brlBlockCache.get(key);
  if (!html) {
    const { base, mark } = brlBlockMaps(n, kind);
    html = loaderPixelSvg(base, BRL_ROLES) + (mark ? `<div class="bz-brl-mark"${kind === "q" ? ' data-q="true"' : ""}>${loaderPixelSvg(mark, BRL_ROLES)}</div>` : "");
    brlBlockCache.set(key, html);
  }
  return html;
}

/* Integer scales only, one per layout: u = 3 at 560px and wider, 2 below.
   The adventurer is 16 x 24 art pixels, blocks 16 (the last one 20), the ground 7. */
const BRL_WIDE = { u: 3, lead: 108, ahead: 5, gapP: 16, pad: 4, flagGap: 8 };
const BRL_NARROW = { u: 2, lead: 10, ahead: 5, gapP: 8, pad: 4, flagGap: 7 };
const BRL_RUN = 400;

type BrlGeom = {
  u: number; W: number; n: number; big: number; G: number; bb: number; pb: number; P: number;
  critX: number; x0: number; spacing: number; castleX: number; px: number; pw: number; standX: number; bannerW: number;
};

function createBlockRunArena(root: HTMLElement, ctx: LoaderArenaCtx): LoaderArena {
  const q = <T extends Element>(sel: string) => root.querySelector(sel) as T;
  const arenaEl = q<HTMLDivElement>(".bz-brl-arena");
  const worldEl = q<HTMLDivElement>(".bz-brl-world");
  const heroEl = q<HTMLDivElement>(".bz-brl-hero");
  const moverEl = q<HTMLDivElement>(".bz-brl-mover");
  const bannerEl = q<HTMLDivElement>(".bz-brl-banner");
  const plateEl = q<HTMLDivElement>(".bz-brl-plate");
  // The nameplate's hatch pattern carries an id unique to this instance; the ground's is built from it once.
  const groundId = `${plateEl?.querySelector("pattern")?.id ?? "bz-brl"}-ground`;

  let g: BrlGeom | null = null;
  let cam = 0;
  let scrollAnim: Animation | null = null;
  let scrollEnd = 0;
  let atFlag = false;
  let flagDown = false;
  let holdError = false;
  let played = false;
  let groundKey = "";
  let sceneryKey = "";
  let parts: { scenery: HTMLElement; pole: HTMLElement; flag: HTMLElement; castle: HTMLElement; ground: HTMLElement; blocks: HTMLElement; fx: HTMLElement } | null = null;
  let blockEls: HTMLDivElement[] = [];
  let transientUntil = 0;
  let poseTimers: number[] = [];
  let celebrateUntil = 0;
  let celebrateT = 0;

  const steps = () => ctx.steps();
  const gone = (i: number) => ctx.vis()[i] === "gone";
  const sizeOf = (i: number) => (i === steps().length - 1 ? 20 : 16);

  /* -------- poses -------- */

  function pose() {
    paint();
    if (transientUntil > loaderNow()) return;
    const phase = ctx.phase();
    const m = ctx.motionAllowed();
    if (phase === "error" || phase === "stopped") return loaderSetPose(heroEl, "sit", "");
    if (phase === "complete") return m && celebrateUntil > loaderNow() ? loaderSetPose(heroEl, "", "celebrate") : loaderSetPose(heroEl, "celebrate1", "");
    if (!m) return loaderSetPose(heroEl, "idle1", "");
    const s = steps()[ctx.front()];
    loaderSetPose(heroEl, "", s && s.status === "active" && s.progress == null ? "working" : "idle");
  }

  function clearTransient() {
    poseTimers.forEach(ctx.clear);
    poseTimers = [];
    transientUntil = 0;
  }

  /** A short sequence of held frames, or a CSS loop for ms, then back to the resting pose. */
  function play(seq: Array<[LoaderFrameName, number]>, loop: LoaderLoop = "") {
    clearTransient();
    let at = 0;
    seq.forEach(([frame, ms], k) => {
      if (k === 0) loaderSetPose(heroEl, loop ? "" : frame, loop);
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

  const bonk = () => play([["jump", IMPACT], ["bonk", 120], ["jump", BASE - IMPACT - 120]]);

  /** Up one hop (4 art pixels) in held steps: contact at IMPACT, back on the ground by BASE. */
  function hop() {
    if (!g) return;
    const h = 4 * g.u;
    ctx.anim(moverEl, loaderStepped([[0, 0, 0], [0.12, 0, -h / 2], [0.33, 0, -h], [0.6, 0, -h], [0.76, 0, -h / 2], [0.9, 0, 0], [1, 0, 0]]), { duration: BASE });
  }

  /* -------- the blocks -------- */

  /* What a block shows comes from the host's status and from vis (has its
     beat played), never from a timer. */
  function blockKind(i: number): BrlBlockKind {
    const s = steps()[i];
    if (gone(i)) return s.status === "skipped" ? "ghost" : (s.attempt ?? 1) > 1 ? "usedg" : "used";
    const phase = ctx.phase();
    if (i === ctx.front() && s.status === "error" && (phase === "error" || phase === "stopped") && !holdError) return "err";
    return "q";
  }

  function paint() {
    const list = steps();
    const front = ctx.front();
    const phase = ctx.phase();
    blockEls.forEach((el, i) => {
      const s = list[i];
      if (!s) return;
      const kind = blockKind(i);
      const role = gone(i) ? "past" : i === front ? "front" : "queue";
      const blink = kind === "q" && role === "front" && phase === "run" && s.status === "active" && s.progress == null;
      if (el.dataset.role !== role) el.dataset.role = role;
      if (el.dataset.kind !== kind) el.dataset.kind = kind;
      const b = blink ? "true" : "false";
      if (el.dataset.blink !== b) el.dataset.blink = b;
      const key = `${kind}${sizeOf(i)}`;
      if (el.dataset.key !== key) {
        el.dataset.key = key;
        (el.firstElementChild as HTMLElement).innerHTML = brlBlockHtml(sizeOf(i), kind);
      }
    });
  }

  /* -------- building -------- */

  function rebuild() {
    clearTransient();
    ctx.clear(celebrateT);
    celebrateUntil = 0;
    worldEl.innerHTML =
      `<div class="bz-brl-scenery"></div>` +
      `<div class="bz-brl-pole"><span class="bz-brl-pole-line"></span><div class="bz-brl-ball">${loaderPixelSvg(BRL_BALL, BRL_ROLES)}</div><div class="bz-brl-base">${loaderPixelSvg(BRL_POLE_BASE, BRL_ROLES)}</div><div class="bz-brl-flag">${loaderPixelSvg(BRL_FLAG, BRL_ROLES)}</div></div>` +
      `<div class="bz-brl-castle">${loaderPixelSvg(BRL_CASTLE, BRL_ROLES)}</div>` +
      `<div class="bz-brl-groundwrap"></div><div class="bz-brl-blocks"></div><div class="bz-brl-fx"></div>`;
    const w = <T extends HTMLElement>(sel: string) => worldEl.querySelector(sel) as T;
    parts = { scenery: w(".bz-brl-scenery"), pole: w(".bz-brl-pole"), flag: w(".bz-brl-flag"), castle: w(".bz-brl-castle"), ground: w(".bz-brl-groundwrap"), blocks: w(".bz-brl-blocks"), fx: w(".bz-brl-fx") };
    const blocks = parts.blocks;
    blockEls = steps().map(() => {
      const b = document.createElement("div");
      b.className = "bz-brl-block";
      b.innerHTML = '<div class="bz-brl-block-art"></div>';
      blocks.appendChild(b);
      return b;
    });
    cam = 0;
    scrollAnim = null;
    scrollEnd = 0;
    atFlag = flagDown = holdError = played = false;
    groundKey = sceneryKey = "";
    worldEl.style.transform = "translateX(0px)";
    place(0);
  }

  const thing = (map: readonly string[], x: number, bottom: number, u: number) =>
    `<div class="bz-brl-thing" style="left:${Math.round(x)}px;bottom:${bottom}px;width:${map[0].length * u}px;height:${map.length * u}px">${loaderPixelSvg(map, BRL_ROLES)}</div>`;

  /* No cloud rests as a sliver at the left edge at any camera stop, or peeks
     out from behind the nameplate or the banner. A cloud with no such spot
     near where it wants to be is left out. */
  function placeCloud(want: number, w: number, geo: BrlGeom): number | null {
    const stops: number[] = [];
    for (let k = 0; k < Math.max(1, geo.n); k++) stops.push(k * geo.spacing);
    const lastStop = stops[stops.length - 1];
    const bl = (geo.W - geo.bannerW) / 2 - geo.u;
    const br = (geo.W + geo.bannerW) / 2 + geo.u;
    const cuts = (sx: number, e: number) => sx < e && sx + w > e;
    const ok = (x: number) =>
      x >= 0 &&
      stops.every((c) => {
        const sx = x - c;
        if (cuts(sx, 0) || cuts(sx, geo.px - 2) || cuts(sx, geo.px + geo.pw + 2)) return false;
        return c !== lastStop || sx + w <= bl || sx >= br;
      });
    const range = Math.ceil(Math.max(geo.spacing, 16 * geo.u) / geo.u);
    for (let d = 0; d <= range; d++) {
      for (const x of d ? [want + d * geo.u, want - d * geo.u] : [want]) if (ok(Math.round(x))) return Math.round(x);
    }
    return null;
  }

  function sceneryHtml(geo: BrlGeom): string {
    const { u, x0, spacing, n, G, pb, critX, big } = geo;
    const span = Math.max(0, n - 1) * spacing;
    let h = thing(BRL_HILL, x0 + spacing * 0.5, G, u);
    if (n > 3) h += thing(BRL_BUSH, x0 + span * 0.62, G, u);
    if (n > 5) h += thing(BRL_HILL, x0 + span * 0.9, G, u);
    const cloud = (want: number, bottom: number) => {
      const x = placeCloud(want, BRL_CLOUD[0].length * u, geo);
      if (x != null) h += thing(BRL_CLOUD, x, bottom, u);
    };
    cloud(x0 - 16 * u, pb + 3 * u);
    cloud(x0 + span * 0.45 + 8 * u, pb + 5 * u);
    cloud(x0 + span + big + 20 * u, pb + 4 * u);
    // Past the castle too, so the finished course is not left half empty.
    const after = geo.castleX + BRL_CASTLE[0].length * u;
    h += thing(BRL_BUSH, after + 4 * u, G, u);
    h += thing(BRL_HILL, after + 22 * u, G, u);
    cloud(after + 14 * u, pb - 2 * u);
    // The start pipe is gone after the first scroll, never left as a sliver.
    const pipeX = Math.min(critX - 2 * u, spacing || critX) - 10 * u;
    if (pipeX >= 2 * u) h += thing(BRL_PIPE, pipeX, G, u);
    return h;
  }

  function groundSvg(width: number, u: number) {
    const id = groundId;
    let paths = "";
    for (const [k, d] of loaderPixelPaths(BRL_GROUND)) paths += `<path class="bz-brl-k-${BRL_ROLES[k]}" d="${d}"/>`;
    return `<svg class="bz-brl-ground" width="${width}" height="${7 * u}" shape-rendering="crispEdges" aria-hidden="true" focusable="false"><defs><pattern id="${id}" width="${8 * u}" height="${7 * u}" patternUnits="userSpaceOnUse" viewBox="0 0 8 7">${paths}</pattern></defs><rect width="100%" height="100%" fill="url(#${id})"/></svg>`;
  }

  /* -------- layout -------- */

  /* The blocks float exactly one hop above the adventurer's head. Step i sits
     at x0 + i * spacing and the camera is front * spacing, so the course is
     only ever as far along as the resolved steps. The nameplate floats right
     of the front block's column and above every block top, so it never covers
     the adventurer, the block being bonked or a coin. */
  function place(ms: number) {
    if (!parts) return;
    const W = arenaEl.clientWidth;
    const narrow = root.clientWidth < 560;
    if (root.dataset.narrow !== String(narrow)) root.dataset.narrow = String(narrow);
    const n = steps().length;
    if (!W || !n) return;
    const c = narrow ? BRL_NARROW : BRL_WIDE;
    const u = c.u;
    const last = n - 1;
    const blk = 16 * u;
    const big = 20 * u;
    const G = 7 * u;
    const bb = G + (LOADER_HERO_H + 4) * u;
    const pb = bb + big + 2 * u;
    const P = pb - G - 2 * u;
    const critX = c.lead;
    const x0 = critX + c.ahead * u;
    let flagGap = c.flagGap * u;
    const castleW = BRL_CASTLE[0].length * u;
    const standOff = 5 * u;
    const castleOff = standOff + LOADER_HERO_W * u + 3 * u;
    const tail = flagGap + castleOff + castleW;
    const spacing = n > 1 ? Math.max(blk + 2 * u, Math.min(blk + 9 * u, Math.floor((W - c.pad - x0 - big - tail) / last))) : 0;
    // On a course longer than the arena the flag never rests half cut at the right edge.
    const straddles = () => {
      for (let k = 0; k < n; k++) {
        const l = x0 + last * spacing + big + flagGap - 5 * u - k * spacing;
        if (l < W && l + 9 * u > W) return true;
      }
      return false;
    };
    for (let e = 0; e < 40 && straddles(); e++) flagGap += u;
    const poleX = x0 + last * spacing + big + flagGap;
    const castleX = poleX + castleOff;
    const worldW = castleX + castleW + W;
    const px = x0 + big + c.gapP;
    const pw = Math.min(340, W - px - c.pad);
    const standX = x0 + big + flagGap + standOff;
    const bannerW = bannerEl?.offsetWidth || 200;
    g = { u, W, n, big, G, bb, pb, P, critX, x0, spacing, castleX, px, pw, standX, bannerW };

    worldEl.style.width = `${worldW}px`;
    worldEl.style.setProperty("--u", `${u}px`);
    const gk = `${worldW}|${u}`;
    if (gk !== groundKey) {
      groundKey = gk;
      parts.ground.innerHTML = groundSvg(worldW, u);
    }
    const sk = [u, n, spacing, x0, W, bannerW, px, pw].join("|");
    if (sk !== sceneryKey) {
      sceneryKey = sk;
      parts.scenery.innerHTML = sceneryHtml(g);
    }
    parts.pole.style.cssText = `left:${poleX}px;bottom:${G}px;width:${3 * u}px;height:${P}px`;
    parts.flag.style.transform = flagDown ? `translateY(${P - 13 * u}px)` : "";
    parts.castle.style.cssText = `left:${castleX}px;bottom:${G}px;width:${castleW}px;height:${BRL_CASTLE.length * u}px`;
    blockEls.forEach((el, i) => {
      const size = sizeOf(i) * u;
      const keep = el.style.visibility;
      el.style.cssText = `left:${x0 + i * spacing}px;bottom:${bb}px;width:${size}px;height:${size}px`;
      if (keep) el.style.visibility = keep;
    });
    paint();
    heroEl.style.transform = `translateX(${atFlag ? standX : critX}px)`;
    plateEl.style.left = `${px}px`;
    plateEl.style.width = `${Math.max(120, pw)}px`;
    plateEl.style.bottom = `${pb}px`;
    setCamera(Math.min(ctx.front(), last) * spacing, ms);
  }

  /* The camera moves the whole world in held whole-pixel steps sampled from
     the ease-out curve. A new scroll starts from wherever the last one is, so
     steps settling back to back never queue up travel. */
  function worldX(): number {
    const m = /matrix\(([^)]+)\)/.exec(getComputedStyle(worldEl).transform || "");
    return m ? parseFloat(m[1].split(",")[4]) || 0 : -cam;
  }

  function setCamera(target: number, ms: number) {
    if (target === cam && !ms) {
      if (!scrollAnim) {
        worldEl.style.transform = `translateX(${-cam}px)`;
        trimEdge();
      }
      return;
    }
    const from = scrollAnim ? worldX() : -cam;
    if (scrollAnim) {
      scrollAnim.cancel();
      scrollAnim = null;
    }
    cam = target;
    const to = -cam;
    worldEl.style.transform = `translateX(${to}px)`;
    if (!ms || Math.abs(to - from) < 1) {
      trimEdge();
      return;
    }
    const a = ctx.anim(worldEl, loaderGlide(from, 0, to, 0, ms), { duration: ms });
    scrollAnim = a;
    if (!a) {
      trimEdge();
      return;
    }
    const done = () => {
      if (scrollAnim === a) {
        scrollAnim = null;
        trimEdge();
      }
    };
    a.finished.then(done, done);
  }

  /* History that would rest as a sliver at the left edge is hidden once the camera stops. */
  function trimEdge() {
    const geo = g;
    if (!geo) return;
    blockEls.forEach((el, i) => {
      const size = sizeOf(i) * geo.u;
      const right = geo.x0 + i * geo.spacing + size - cam;
      const v = gone(i) && right > 0 && right < size * 0.5 ? "hidden" : "";
      if (el.style.visibility !== v) el.style.visibility = v;
    });
  }

  /* -------- effects -------- */

  function blockBox(i: number) {
    const el = blockEls[i];
    if (!el || !g) return null;
    const size = sizeOf(i) * g.u;
    return { el, x: parseFloat(el.style.left) || 0, size, top: g.bb + size };
  }

  /** The block jumps one art pixel and settles back. */
  function bump(i: number) {
    const b = blockBox(i);
    const art = b?.el.firstElementChild;
    if (b && art && g) ctx.anim(art, loaderStepped([[0, 0, -g.u], [1, 0, 0]]), { duration: FAST });
  }

  /** A coin pops out of the top, spinning (face on, half turned), rises and fades. Feedback only, never counted. */
  function coin(i: number, big: boolean) {
    const b = blockBox(i);
    if (!b || !g || !parts) return;
    const u = g.u;
    const w = 6 * u;
    const h = 8 * u;
    const rise = (big ? 7 : 5) * u;
    const dur = big ? 420 : BASE;
    const el = document.createElement("div");
    el.className = "bz-brl-coin";
    el.style.cssText = `left:${Math.round(b.x + (b.size - w) / 2)}px;bottom:${b.top + u}px;width:${w}px;height:${h}px`;
    el.innerHTML = `<div class="bz-brl-fr1">${loaderPixelSvg(BRL_COIN, BRL_ROLES)}</div><div class="bz-brl-fr2">${loaderPixelSvg(BRL_COIN_TURN, BRL_ROLES)}</div>`;
    parts.fx.appendChild(el);
    const pts: Array<[number, number, number, number?]> = [];
    for (let j = 0; j <= 6; j++) {
      const t = j / 6;
      pts.push([t, 0, -Math.round((rise * (1 - (1 - t) * (1 - t))) / u) * u, t <= 0.5 ? 1 : 1 - (t - 0.5) * 2]);
    }
    const a = ctx.anim(el, loaderStepped(pts), { duration: dur, fill: "forwards" });
    const spin = [0, 1, 2, 3, 4, 5, 6].map((j) => j / 6);
    ctx.anim(el.children[0], spin.map((o, j) => ({ offset: o, easing: "step-end", opacity: j % 2 ? 0 : 1 })), { duration: dur });
    ctx.anim(el.children[1], spin.map((o, j) => ({ offset: o, easing: "step-end", opacity: j % 2 ? 1 : 0 })), { duration: dur });
    const rm = () => el.remove();
    if (a) a.finished.then(rm, rm);
    else rm();
  }

  /** Two small stars at the top corners of a block that was just used up. */
  function sparkle(i: number) {
    const b = blockBox(i);
    if (!b || !g || !parts) return;
    const fx = parts.fx;
    const s = 5 * g.u;
    const spots: Array<[number, number]> = [[b.x - Math.round(s * 0.4), b.top - Math.round(s * 0.2)], [b.x + b.size - Math.round(s * 0.6), b.top + Math.round(s * 0.3)]];
    spots.forEach(([x, y], k) => {
      const el = document.createElement("div");
      el.className = "bz-brl-spark";
      el.style.cssText = `left:${x}px;bottom:${y}px;width:${s}px;height:${s}px`;
      el.innerHTML = `<div class="bz-brl-fr1">${loaderPixelSvg(BRL_SPARK, BRL_ROLES)}</div><div class="bz-brl-fr2">${loaderPixelSvg(BRL_SPARK_SMALL, BRL_ROLES)}</div>`;
      fx.appendChild(el);
      const d = BASE + 60;
      const a = ctx.anim(el, [{ offset: 0, easing: "step-end", opacity: 0 }, { offset: 0.1 + k * 0.15, easing: "step-end", opacity: 1 }, { offset: 1, opacity: 1 }], { duration: d, fill: "forwards" });
      ctx.anim(el.children[0], [{ offset: 0, easing: "step-end", opacity: 1 }, { offset: 0.6, easing: "step-end", opacity: 0 }, { offset: 1, opacity: 0 }], { duration: d, fill: "forwards" });
      ctx.anim(el.children[1], [{ offset: 0, easing: "step-end", opacity: 0 }, { offset: 0.6, easing: "step-end", opacity: 1 }, { offset: 1, opacity: 1 }], { duration: d, fill: "forwards" });
      const rm = () => el.remove();
      if (a) a.finished.then(rm, rm);
      else rm();
    });
  }

  /** The error flash: the "!" block lights up in its mark colour for one frame. */
  function glint(i: number) {
    const art = blockEls[i]?.firstElementChild;
    if (!art) return;
    const el = document.createElement("div");
    el.className = "bz-brl-glint";
    el.innerHTML = loaderPixelSvg(brlBlockMaps(sizeOf(i), "err").base.map((r) => r.replace(/[^.]/g, "m")), BRL_ROLES);
    art.appendChild(el);
    ctx.later(() => el.remove(), FAST);
  }

  /** Without travel, a changed block only cross-fades, at most 150ms. */
  function fadeIn(el?: Element | null) {
    if (el && ctx.running()) ctx.anim(el, [{ opacity: 0.25 }, { opacity: 1 }], { duration: FAST, easing: "linear" });
  }

  /** A hop waits for a scroll in flight, so the block is overhead when it lands. */
  function afterScroll(fn: () => void) {
    const wait = Math.max(0, Math.round(scrollEnd - loaderNow()));
    if (wait) ctx.later(fn, wait);
    else fn();
    return wait;
  }

  return {
    rebuild,
    layout: () => place(0),
    hit() {
      return (
        afterScroll(() => {
          bonk();
          hop();
        }) + IMPACT
      );
    },
    progress(i, showy) {
      paint();
      if (showy) {
        bump(i);
        coin(i, false);
      }
    },
    finish() {
      return (
        afterScroll(() => {
          bonk();
          hop();
        }) + IMPACT
      );
    },
    resolve(entries, showy) {
      played = true;
      paint();
      const done = entries.find((e) => e.kind === "done");
      if (showy && done) {
        bump(done.i);
        coin(done.i, true);
        sparkle(done.i);
        return BASE - IMPACT;
      }
      entries.forEach((e) => fadeIn(blockEls[e.i]));
      return 0;
    },
    advance(changed) {
      paint();
      if (!g) return;
      const last = steps().length - 1;
      const target = Math.min(ctx.front(), last) * g.spacing;
      const blocks = g.spacing ? Math.round((target - cam) / g.spacing) : 0;
      const ms = blocks > 0 && ctx.motionOn() ? Math.min(SLOW, BASE + (blocks - 1) * 100) : 0;
      setCamera(target, ms);
      if (ms) {
        scrollEnd = loaderNow() + ms;
        play([["run1", ms]], "run");
      } else if (changed && blocks > 0) fadeIn(parts?.blocks);
    },
    error(i, showy) {
      if (!showy) {
        holdError = false;
        clearTransient();
        paint();
        return;
      }
      // The bonk lands on the block, which turns into "!", and the adventurer is
      // knocked down. A scroll still in flight finishes first, so the block is
      // overhead and still a "?" when the bonk lands.
      holdError = true;
      paint();
      const strike = () => {
        if (ctx.phase() !== "error" || !ctx.motionOn()) {
          holdError = false;
          pose();
          return;
        }
        play([["jump", IMPACT], ["bonk", 80], ["hurt", BASE]]);
        hop();
        ctx.later(() => {
          holdError = false;
          paint();
          if (ctx.phase() === "error" && ctx.motionOn()) glint(i);
        }, IMPACT);
      };
      const wait = Math.max(0, Math.round(scrollEnd - loaderNow()));
      if (wait) {
        // The run carries on until the strike takes over, with no resting frame between them.
        play([["run1", wait + FAST]], "run");
        // Kept with the pose timers, so Retry, Cancel or Pause motion during the wait drops it.
        poseTimers.push(ctx.later(strike, wait));
      } else strike();
    },
    recover() {
      holdError = false;
      clearTransient();
      paint();
    },
    stop() {
      holdError = false;
      clearTransient();
      paint();
    },
    finale(showy) {
      const run = showy && played && !atFlag && !!g;
      const from = g ? g.critX : 0;
      atFlag = flagDown = true;
      clearTransient();
      ctx.clear(celebrateT);
      place(0);
      celebrateUntil = showy ? loaderNow() + (run ? BRL_RUN : 0) + BEAT * 3 : 0;
      if (showy) celebrateT = ctx.later(pose, (run ? BRL_RUN : 0) + BEAT * 3 + 20);
      if (!run || !g) return;
      // The run to the flagpole in whole art pixels, then the flag slides down the pole.
      const geo = g;
      const k = Math.max(2, Math.round((geo.standX - from) / geo.u));
      ctx.anim(heroEl, Array.from({ length: k + 1 }, (_, j) => ({ offset: j / k, easing: "step-end", transform: `translateX(${Math.round(from + ((geo.standX - from) * j) / k)}px)` })), { duration: BRL_RUN });
      play([["run1", BRL_RUN]], "run");
      const drop = geo.P - 13 * geo.u;
      const f = Math.max(2, Math.round(drop / geo.u));
      if (parts) ctx.anim(parts.flag, Array.from({ length: f + 1 }, (_, j) => ({ offset: j / f, easing: "step-end", transform: `translateY(${Math.round((drop * j) / f)}px)` })), { duration: BRL_RUN, delay: Math.round(BRL_RUN * 0.6), fill: "backwards" });
    },
    pose,
    motion() {
      if (!ctx.motionAllowed()) {
        clearTransient();
        ctx.clear(celebrateT);
        celebrateUntil = 0;
        scrollEnd = 0;
        if (holdError) {
          holdError = false;
          paint();
        }
      }
    },
    destroy() {
      clearTransient();
      ctx.clear(celebrateT);
      worldEl.textContent = "";
      parts = null;
      blockEls = [];
    },
  };
}

const BLOCK_RUN_GAME: LoaderGame = { unit: "Block", clear: "Course clear", arena: createBlockRunArena };

const CSS = `${LOADER_CSS}
.bz-brl-stage{margin:0}
.bz-brl-arena{height:240px;overflow:hidden;background:var(--bz-brl-sky)}
.bz-brl-art{position:absolute;inset:0;z-index:0;isolation:isolate;overflow:hidden}
.bz-brl-world{position:absolute;top:0;bottom:0;left:0}
.bz-brl-world svg{display:block;overflow:visible}
.bz-brl-thing,.bz-brl-block,.bz-brl-coin,.bz-brl-spark,.bz-brl-castle,.bz-brl-pole,.bz-brl-ground{position:absolute}
.bz-brl-ground{bottom:0;left:0}
.bz-brl-thing>svg,.bz-brl-block-art>svg,.bz-brl-mark,.bz-brl-mark>svg,.bz-brl-fr1,.bz-brl-fr2,.bz-brl-fr1>svg,.bz-brl-fr2>svg,.bz-brl-castle>svg,.bz-brl-flag>svg,.bz-brl-ball>svg,.bz-brl-base>svg,.bz-brl-glint,.bz-brl-glint>svg{position:absolute;inset:0;width:100%;height:100%}
.bz-brl-block-art{position:absolute;inset:0}
.bz-brl-fr2{opacity:0}
.bz-brl-block[data-blink="true"] .bz-brl-mark[data-q="true"]{animation:bz-brl-a var(--bz-brl-beat) step-end infinite}
.bz-brl-pole-line{position:absolute;top:calc(var(--u) * 3);bottom:calc(var(--u) * 3);left:var(--u);width:var(--u);background:var(--bz-brl-pole)}
.bz-brl-ball,.bz-brl-base{position:absolute;left:0;width:calc(var(--u) * 3);height:calc(var(--u) * 3)}
.bz-brl-ball{top:0}
.bz-brl-base{bottom:0}
.bz-brl-flag{position:absolute;top:calc(var(--u) * 3);left:calc(var(--u) * -5);width:calc(var(--u) * 6);height:calc(var(--u) * 7)}
.bz-brl-hero{position:absolute;bottom:calc(7 * var(--bz-brl-u));left:0;z-index:2;width:calc(16 * var(--bz-brl-u));height:calc(24 * var(--bz-brl-u))}
.bz-brl-mover{width:100%;height:100%}
.bz-brl-sprite{display:block;width:100%;height:100%;overflow:visible}
.bz-brl-veil{position:absolute;inset:0;z-index:2;background:var(--bz-brl-panel);opacity:0;visibility:hidden}
.bz-brl[data-phase="stopped"] .bz-brl-veil{opacity:0.35;visibility:visible}
.bz-brl-banner{position:absolute;top:calc(5 * var(--bz-brl-u));left:50%;z-index:3;padding:8px 18px 6px;border:2px solid var(--bz-brl-ink);background:var(--bz-brl-panel);color:var(--bz-brl-ink);font:700 15px/1 var(--bz-brl-mono);letter-spacing:0.14em;text-transform:uppercase;white-space:nowrap;transform:translateX(-50%);visibility:hidden}
.bz-brl-banner::after{content:"";display:block;height:4px;margin-top:6px;background:var(--bz-brl-accent)}
.bz-brl-banner[data-on="true"]{visibility:visible}
.bz-brl[data-motion="on"] .bz-brl-banner[data-on="true"]{animation:bz-brl-drop var(--bz-brl-base) steps(3,end) both}
@keyframes bz-brl-drop{from{transform:translate(-50%,-9px)}to{transform:translate(-50%,0)}}
.bz-brl-arena .bz-brl-plate{position:absolute;bottom:171px;left:0;z-index:4;width:300px}
.bz-brl-arena .bz-brl-plate-label{display:block;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;overflow-wrap:normal}
.bz-brl-arena .bz-brl-count{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis}
${Object.values(BRL_ROLES).map((r) => `.bz-brl-k-${r}{fill:var(--bz-brl-${r})}`).join("\n")}
.bz-brl[data-motion="off"] .bz-brl-mark,.bz-brl[data-motion="off"] .bz-brl-banner{animation:none!important}
@container (max-width:559px){
/* 16px taller than the course needs, so the nameplate's badges ride its top edge without touching the frame. */
.bz-brl-arena{height:200px}
.bz-brl-arena .bz-brl-badges{top:-16px}
.bz-brl-arena .bz-brl-plate-row{flex-wrap:nowrap}
.bz-brl-arena .bz-brl-bar{flex:1 1 40px;min-width:40px}
.bz-brl-arena .bz-brl-count{font-size:11px}
.bz-brl-banner{padding:6px 12px 5px;font-size:13px}
}
`;

/* ---------------- the component ---------------- */

function blockRunPalette(p: BlockRunLoaderProps["palette"]): BlockRunLoaderPalette {
  if (!p) return BLOCK_RUN_LOADER_PALETTES.overworld;
  return typeof p === "string" ? BLOCK_RUN_LOADER_PALETTES[p] ?? BLOCK_RUN_LOADER_PALETTES.overworld : p;
}

export function BlockRunLoader(props: BlockRunLoaderProps) {
  const { title, headingLevel = 2, palette, character, colorScheme, className, style } = props;
  const api = useLoader(props, BLOCK_RUN_GAME);
  const hero = loaderCharacter(character);
  const pal = blockRunPalette(palette);
  const rootStyle = useMemo(
    () =>
      ({
        ...loaderPaletteVars(pal.light, pal.dark),
        // A skipped block's dashes: the block outline on light skies, the block fill on dark ones.
        "--bz-brl-ghost": `light-dark(${pal.light.blockLine}, ${pal.dark.block})`,
        "--bz-brl-portrait": `light-dark(${pal.light.sky}, ${pal.dark.sky})`,
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
      className={`bz-brl${className ? ` ${className}` : ""}`}
      aria-labelledby={api.titleId}
      data-phase={view.phase}
      data-motion={api.motionAllowed ? "on" : "off"}
      data-running={api.running ? "true" : "false"}
      style={rootStyle}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="bz-brl-in">
        <Heading id={api.titleId} className="bz-brl-title" tabIndex={-1}>
          {title}
        </Heading>
        <LoaderStepList api={api} />
        <div className="bz-brl-frame bz-brl-stage">
          <div className="bz-brl-frame-in bz-brl-arena">
            <div className="bz-brl-art" aria-hidden="true">
              <div className="bz-brl-world" />
              <div className="bz-brl-hero" data-frame="idle1">
                <div className="bz-brl-mover">
                  <LoaderHeroSprite hairStyle={hero.hairStyle} accessory={null} />
                </div>
              </div>
            </div>
            <div className="bz-brl-veil" aria-hidden="true" />
            <div className="bz-brl-banner" aria-hidden="true" data-on={view.banner ? "true" : "false"}>
              {labels.clear}
            </div>
            <LoaderPlate api={api} />
          </div>
        </div>
        <LoaderBox api={api} hairStyle={hero.hairStyle} />
      </div>
    </section>
  );
}
