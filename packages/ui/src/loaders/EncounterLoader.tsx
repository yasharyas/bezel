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
 * EncounterLoader: a multi-step loader drawn as a turn-based pixel game.
 *
 * Each step is a crate in a queue to the right of a pixel adventurer, and the
 * last one is a bigger banded crate you can see from the start. The
 * adventurer swings at the crate at the front, and it cracks one cell further
 * each time your process reports progress. When the step is done the crate
 * shatters and leaves a rubble mark on the floor behind the adventurer, so the
 * floor reads as the trail of finished steps, and the next crate slides up.
 *
 * Nothing moves on a timer. The cracks, the bar on the nameplate and the
 * queue change only when the steps you pass in change: at most one hit every
 * 400ms, with the increments in between merged, and the cracks never run
 * ahead of the bar. A step whose size is unknown gets a hatched bar and a
 * wind-up pose instead of invented progress.
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
 * every loop and tween: the art snaps to its honest state and the adventurer
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

/* ---------------- palettes ---------------- */

export type EncounterLoaderColors = {
  /** The arena background. */
  sky: string;
  /** The grass floor. */
  ground: string;
  /** The top edge of the floor and the grass tufts. */
  groundEdge: string;
  /** Crate planks. */
  crate: string;
  /** Crate panels and the shaded side. */
  crateShade: string;
  /** Crate outline and the cracks. */
  crateLine: string;
  /** Metal corners and the bands on the last crate. */
  crateBand: string;
  /** The last, bigger crate. */
  boss: string;
  /** Its shaded side and plank seams. */
  bossShade: string;
  /** Its outline and cracks. */
  bossLine: string;
  /** Rubble left on the floor by a finished step. */
  rubble: string;
  /** Sparks on a hit and the flecks on a recovered step's rubble. */
  spark: string;
  /** The adventurer's silhouette edge, the outermost ring of pixels. Pick one that clears 3:1 on the sky: dark on a light sky, a light rim on a dark one. */
  spriteOutline: string;
  /** The adventurer's inner lines: the jaw, the arm against the body, the belt. Usually a near black. */
  spriteLine: string;
  /** Primary buttons, the nameplate bar and the banner rule. */
  accent: string;
  /** Text on accent: white on light themes, near black on dark ones. */
  onAccent: string;
};

/** One colour set per theme. The loader picks between them with light-dark(), following the host's color-scheme. */
export type EncounterLoaderPalette = { light: EncounterLoaderColors; dark: EncounterLoaderColors };

/**
 * Two presets. Every text and control pair is AA on both themes. In the arena,
 * the light themes draw shapes with dark lines: the crate outlines, the floor
 * edge and the adventurer's silhouette clear 3:1 on the sky (5:1 or more). The
 * dark themes draw them with fills instead: the crate and last-crate fills and
 * the floor edge clear 3:1 on the night sky (5:1 or more), and the adventurer
 * gets a pale rim that clears 3:1 (about 6:1), so dark hair still has an edge.
 * The crate outlines there are seams inside the fill, not edges on the sky.
 * Spread one to customise: `{ ...ENCOUNTER_LOADER_PALETTES.meadow, dark: { ... } }`.
 */
export const ENCOUNTER_LOADER_PALETTES = {
  meadow: {
    light: { sky: "#c9ecff", ground: "#5bb543", groundEdge: "#2c6e1f", crate: "#d88a3c", crateShade: "#a25d22", crateLine: "#3b2412", crateBand: "#8a8fa3", boss: "#f2b632", bossShade: "#b07d0e", bossLine: "#4a3206", rubble: "#a25d22", spark: "#ffd23f", spriteOutline: "#17142e", spriteLine: "#17142e", accent: "#c2410c", onAccent: "#ffffff" },
    dark: { sky: "#1a2350", ground: "#3fa34d", groundEdge: "#9be37a", crate: "#d88a3c", crateShade: "#a25d22", crateLine: "#3b2412", crateBand: "#b8bdd0", boss: "#f2b632", bossShade: "#b07d0e", bossLine: "#4a3206", rubble: "#c47a3a", spark: "#ffe066", spriteOutline: "#8fa0e6", spriteLine: "#0b0918", accent: "#ff922b", onAccent: "#0a0a0a" },
  },
  dungeon: {
    light: { sky: "#e8e3f3", ground: "#5c5470", groundEdge: "#2d2640", crate: "#c08a52", crateShade: "#8a5a2e", crateLine: "#2d1c0e", crateBand: "#7c7690", boss: "#a78bfa", bossShade: "#6d4fd0", bossLine: "#2e1a6b", rubble: "#8a5a2e", spark: "#f59e0b", spriteOutline: "#17142e", spriteLine: "#17142e", accent: "#7c3aed", onAccent: "#ffffff" },
    dark: { sky: "#1c1830", ground: "#8e86a8", groundEdge: "#c9c2e0", crate: "#c08a52", crateShade: "#8a5a2e", crateLine: "#2d1c0e", crateBand: "#a9a3c2", boss: "#c4b5fd", bossShade: "#8b72e8", bossLine: "#2e1a6b", rubble: "#b07a45", spark: "#fbbf24", spriteOutline: "#9d8fd4", spriteLine: "#0b0918", accent: "#c4b5fd", onAccent: "#0a0a0a" },
  },
} as const satisfies Record<string, EncounterLoaderPalette>;

export type EncounterLoaderPaletteName = keyof typeof ENCOUNTER_LOADER_PALETTES;

export type EncounterLoaderProps = {
  /** The run, and the only state. The host replaces the array whenever a step changes. */
  steps: LoaderStep[];
  /** The heading, and the progressbar's accessible name. */
  title: string;
  /** Heading level of the title. Default 2. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** A preset name or your own light and dark colours. Default "meadow". */
  palette?: EncounterLoaderPaletteName | EncounterLoaderPalette;
  /** A preset adventurer or your own colours. Default "ember". */
  character?: LoaderCharacterName | LoaderCharacter;
  /** Force a theme. Default: inherit the host's color-scheme. */
  colorScheme?: "light" | "dark";
  /**
   * Replace the words listed in LoaderLabels: the buttons, the footer words and
   * the queued, progress, away, complete and stopped sentences. Default English.
   * The sentences built around your step labels (done, skipped, retry and error
   * lines, the error details), the results tiles and the step states read to
   * screen readers are English only and are not covered by this prop.
   */
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
  for (const [k, d] of loaderPixelPaths(map)) out += `<path class="bz-enc-k-${roles[k] ?? k}" d="${d}"/>`;
  return `${out}</svg>`;
}

const loaderKebab = (key: string) => key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/** A palette as custom properties on the root, each one light-dark(<light>, <dark>). */
function loaderPaletteVars(light: Record<string, string>, dark: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(light)) out[`--bz-enc-${loaderKebab(key)}`] = `light-dark(${light[key]}, ${dark[key] ?? light[key]})`;
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
    <svg className="bz-enc-g" viewBox={`0 0 ${map[0].length} ${map.length}`} shapeRendering="crispEdges" aria-hidden="true" focusable="false">
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

/* Colour key to the class role (bz-enc-c-<role>), which the stylesheet maps to a custom property. */
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
      paths += `<path class="bz-enc-c-${LOADER_HERO_ROLES[k] ?? k}" d="${d}"/>`;
    }
    out += `<g class="bz-enc-f" data-f="${name}">${paths}</g>`;
  }
  loaderHeroCache.set(key, out);
  return out;
}

/** The game's frames in one svg; the wrapper's data-frame (or data-loop) decides which one shows. */
function LoaderHeroSprite({ hairStyle, accessory, frames = LOADER_FRAME_NAMES }: { hairStyle: LoaderCharacter["hairStyle"]; accessory: LoaderAccessory | null; frames?: readonly LoaderFrameName[] }) {
  return (
    <svg
      className="bz-enc-sprite"
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
    for (const [k, d] of loaderPixelPaths(loaderInnerLines([...head.map((r) => r.join("")), LOADER_SCARF_ROW]))) paths += `<path class="bz-enc-c-${LOADER_HERO_ROLES[k] ?? k}" d="${d}"/>`;
    out += `<g data-f="${eyes}">${paths}</g>`;
  }
  loaderPortraitCache.set(hairStyle, out);
  return out;
}

/** Open eyes that blink now and then while work runs, a squint on an error, dazed when stopped, happy at the end. */
function LoaderPortrait({ hairStyle, face }: { hairStyle: LoaderCharacter["hairStyle"]; face: LoaderFace }) {
  return (
    <div className="bz-enc-face" data-face={face} aria-hidden="true">
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
    titleId: `bz-enc-title-${uid}`,
    detailsId: `bz-enc-details-${uid}`,
    hatchId: `bz-enc-hatch-${uid}`,
  };
}

type LoaderApi = ReturnType<typeof useLoader>;

/* ---------------- end shared: engine ---------------- */

/* ---------------- shared: chassis ---------------- */

/** The structure for screen readers: every step and its state. */
function LoaderStepList({ api }: { api: LoaderApi }) {
  return (
    <ol className="bz-enc-sr" aria-busy={api.view.phase === "run" ? "true" : "false"}>
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
      className="bz-enc-plate"
      role="progressbar"
      aria-labelledby={api.titleId}
      aria-valuemin={0}
      aria-valuemax={Math.max(1, api.n)}
      aria-valuenow={api.settled}
      aria-valuetext={api.valueText}
      data-state={plate.state}
      data-gone={plate.gone ? "true" : "false"}
    >
      <div className="bz-enc-plate-in" key={api.view.frontKey}>
        <div className="bz-enc-plate-top">
          <span className="bz-enc-plate-label">{plate.label}</span>
          <span className="bz-enc-badges">
            {plate.attempt ? <span className="bz-enc-tag">{labels.attempt(plate.attempt)}</span> : null}
            {plate.failed ? (
              <span className="bz-enc-failed">
                <LoaderGlyph name="cross" />
                {labels.failed}
              </span>
            ) : null}
          </span>
        </div>
        <div className="bz-enc-plate-row">
          <span className="bz-enc-bar" data-indet={plate.indet ? "true" : "false"}>
            <span className="bz-enc-fill" style={{ width: `${Math.round(plate.p * 1000) / 10}%` }} />
            <svg className="bz-enc-hatch" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
              <defs>
                <pattern id={api.hatchId} width="8" height="8" patternUnits="userSpaceOnUse">
                  <path d="M0 6h2v2H0zM2 4h2v2H2zM4 2h2v2H4zM6 0h2v2H6z" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#${api.hatchId})`} />
            </svg>
          </span>
          <span className="bz-enc-count" title={plate.count || undefined}>
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
    <div id={api.detailsId} className="bz-enc-frame bz-enc-sheet" data-panel="error" hidden={!open}>
      <div
        ref={scrollRef}
        className="bz-enc-frame-in bz-enc-sheet-in"
        role="region"
        aria-label={labels.details}
        tabIndex={open && scroll.over ? 0 : undefined}
        data-more={scroll.more ? "true" : undefined}
      >
        <p className="bz-enc-sheet-head" aria-hidden="true">
          {labels.details}
        </p>
        <p className="bz-enc-details">{view.details}</p>
        {view.detailMore ? <p className="bz-enc-more-detail">{view.detailMore}</p> : null}
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
  const lastLine = view.lines.length ? view.lines[view.lines.length - 1].text : "";
  const face: LoaderFace = errorOn ? "squint" : view.phase === "stopped" ? "blink" : view.phase === "complete" ? "happy" : "open";
  const errTextRef = useRef<HTMLDivElement>(null);
  const errScroll = useLoaderOverflow(errTextRef, view.alert);
  return (
    <div className="bz-enc-frame bz-enc-box">
      <div className="bz-enc-frame-in bz-enc-box-in">
        <LoaderPortrait hairStyle={hairStyle} face={face} />
        <div className="bz-enc-panels">
          <div className="bz-enc-panel bz-enc-talk">
            <div ref={api.logRef} className="bz-enc-log" role="log" aria-label={labels.narration} tabIndex={errorOn || resultsOn ? -1 : 0}>
              {view.lines.map((line, k) => (
                <p key={line.key} className="bz-enc-line" data-kind={line.kind} data-last={k === view.lines.length - 1 ? "true" : undefined}>
                  <LoaderGlyph name={LOADER_LINE_GLYPH[line.kind]} />
                  <span>{line.text}</span>
                </p>
              ))}
            </div>
            {view.lines.length ? null : (
              <p className="bz-enc-ph" aria-hidden="true">
                {api.placeholder}
              </p>
            )}
          </div>
          <div className="bz-enc-panel bz-enc-err" data-panel="error" data-on={errorOn ? "true" : "false"}>
            {/* Only the message lives here; the details open as a card over the arena. A message
                too long for the box scrolls, and only then joins the tab order with a name. */}
            <div
              ref={errTextRef}
              className="bz-enc-err-text"
              role={errScroll.over ? "region" : undefined}
              aria-label={errScroll.over ? labels.errorMessage : undefined}
              tabIndex={errScroll.over && errorOn ? 0 : undefined}
              data-more={errScroll.more ? "true" : undefined}
            >
              <div className="bz-enc-alert" role="alert">
                {view.alert ? (
                  <>
                    <LoaderGlyph name="cross" />
                    <span>{view.alert}</span>
                  </>
                ) : null}
              </div>
            </div>
            <div ref={api.menuRef} className="bz-enc-menu" role="group" aria-label={labels.menu} onKeyDown={api.onMenuKey}>
              {api.commands.map((c, k) => (
                <button
                  key={c.key}
                  type="button"
                  className={`bz-enc-btn${c.primary ? " bz-enc-primary" : ""}`}
                  tabIndex={k === api.cursor ? 0 : -1}
                  data-cursor={k === api.cursor ? "true" : undefined}
                  aria-expanded={c.key === "details" ? c.expanded : undefined}
                  aria-controls={c.key === "details" ? api.detailsId : undefined}
                  onFocus={() => api.setCursor(k)}
                  onClick={c.run}
                >
                  <span className="bz-enc-cur" aria-hidden="true">
                    <LoaderGlyph name="cursor" />
                  </span>
                  {c.label}
                  {c.sr ? <span className="bz-enc-sr">{c.sr}</span> : null}
                </button>
              ))}
            </div>
          </div>
          <div className="bz-enc-panel bz-enc-res" data-on={resultsOn ? "true" : "false"}>
            <p className="bz-enc-res-line" aria-hidden="true">
              {resultsOn ? lastLine : ""}
            </p>
            <dl className="bz-enc-tiles">
              {view.tiles.map((t) => (
                <div className="bz-enc-tile" key={t.label}>
                  <dt>{t.label}</dt>
                  <dd>
                    <span className="bz-enc-num" aria-hidden="true">
                      {loaderTileText(t, api.countT)}
                    </span>
                    <span className="bz-enc-sr">{loaderTileText(t, 1)}</span>
                    {t.sub ? (
                      <span className="bz-enc-sub" title={`${t.sub}${t.more ?? ""}`}>
                        {t.sub}
                        {t.more ? <span className="bz-enc-sr">{t.more}</span> : null}
                      </span>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <div className="bz-enc-foot">
          <p className="bz-enc-meta" aria-hidden="true">
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
          <div className="bz-enc-tools">
            <button
              type="button"
              className="bz-enc-btn bz-enc-toy"
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
                className="bz-enc-btn bz-enc-primary bz-enc-continue"
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
.bz-enc{container-type:inline-size;display:block;width:100%;min-width:0;
--bz-enc-ink:light-dark(var(--bz-ink,#0a0a0a),var(--bz-void-ink,#ffffff));
--bz-enc-muted:light-dark(var(--bz-ink-muted,#4a4a4c),rgba(255,255,255,0.8));
--bz-enc-panel:light-dark(var(--bz-paper,#ffffff),var(--bz-void-raised,#1a1a1a));
--bz-enc-track:light-dark(var(--bz-line-opaque,#f0f0f0),#313131);
--bz-enc-danger:light-dark(var(--bz-danger,#b91c1c),#fca5a5);
--bz-enc-danger-mark:light-dark(#dc2626,#f87171);
--bz-enc-success:light-dark(var(--bz-emerald,#047857),var(--bz-emerald-on-void,#34d399));
--bz-enc-focus:light-dark(var(--bz-focus-ring,#912c22),var(--bz-focus-ring-void,#ffffff));
--bz-enc-hairline:light-dark(rgba(10,10,10,0.13),rgba(255,255,255,0.16));
--bz-enc-idle:light-dark(#8a8a8e,#8c8c8c);
--bz-enc-fast:var(--bz-duration-fast,150ms);
--bz-enc-base:var(--bz-duration-base,300ms);
--bz-enc-ease:var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1));
--bz-enc-beat:var(--bz-duration-beat,2.4s);
--bz-enc-sans:var(--bz-font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);
--bz-enc-mono:var(--bz-font-mono,ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace)}
.bz-enc *,.bz-enc *::before,.bz-enc *::after{box-sizing:border-box}
.bz-enc-in{--bz-enc-u:3px;position:relative;display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto auto auto;padding:16px;border:1px solid var(--bz-enc-hairline);border-radius:16px;background:var(--bz-enc-panel);color:var(--bz-enc-ink);font-family:var(--bz-enc-sans);font-size:15px;line-height:1.5;text-align:left}
.bz-enc-sr{position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}
.bz-enc-title{grid-area:1/1;margin:0 0 10px;font-size:15px;font-weight:600;line-height:21px;color:var(--bz-enc-ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bz-enc-stage{grid-area:2/1}
.bz-enc-box{grid-area:3/1}
.bz-enc-title:focus{outline:none}
.bz-enc-title:focus-visible{outline:2px solid var(--bz-enc-focus);outline-offset:2px}
.bz-enc-frame{position:relative;padding:2px;background:var(--bz-enc-ink);clip-path:${LOADER_STEP_OUTER}}
.bz-enc-frame-in{position:relative;background:var(--bz-enc-panel);clip-path:${LOADER_STEP_INNER}}
.bz-enc-g{display:block;flex:none}
.bz-enc-g path{fill:currentColor}

.bz-enc-plate{position:relative;padding:6px 10px 8px 16px;background:var(--bz-enc-panel);border:2px solid var(--bz-enc-ink);color:var(--bz-enc-ink)}
.bz-enc-plate::before{content:"";position:absolute;left:0;top:0;bottom:0;width:6px;background:var(--bz-enc-accent)}
.bz-enc-plate[data-state="pending"]::before{background:var(--bz-enc-idle)}
.bz-enc-plate[data-state="error"]::before{background:var(--bz-enc-danger-mark)}
.bz-enc-plate[data-gone="true"]{position:absolute!important;width:1px!important;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);border:0}
.bz-enc-plate-in{animation:bz-enc-fade var(--bz-enc-fast) linear}
.bz-enc-plate-top{display:flex;align-items:center;gap:2px 8px;min-height:22px}
.bz-enc-plate-label{flex:1 1 auto;min-width:0;font-size:14px;font-weight:600;line-height:20px;overflow:hidden;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.bz-enc-badges{display:inline-flex;flex:none;align-items:center;gap:6px}
.bz-enc-badges:empty{display:none}
.bz-enc-tag{flex:none;padding:3px 6px 2px;background:var(--bz-enc-accent);color:var(--bz-enc-on-accent);font:700 11px/1.2 var(--bz-enc-mono);letter-spacing:0.02em;white-space:nowrap}
.bz-enc-failed{flex:none;display:inline-flex;align-items:center;gap:5px;color:var(--bz-enc-danger);font-size:13px;font-weight:700;line-height:1}
.bz-enc-failed .bz-enc-g{width:12px;height:12px;color:var(--bz-enc-danger-mark)}
.bz-enc-plate-row{display:flex;align-items:center;gap:4px 10px;margin-top:6px}
.bz-enc-bar{position:relative;flex:1 1 56px;min-width:56px;height:12px;overflow:hidden;border:2px solid var(--bz-enc-ink);background:var(--bz-enc-track)}
.bz-enc-fill{position:absolute;left:0;top:0;bottom:0;background:var(--bz-enc-accent);transition:width var(--bz-enc-base) var(--bz-enc-ease)}
.bz-enc-hatch{position:absolute;top:0;left:-8px;width:calc(100% + 8px);height:100%;display:none;color:var(--bz-enc-accent)}
.bz-enc-hatch path{fill:currentColor}
.bz-enc-bar[data-indet="true"] .bz-enc-fill{display:none}
.bz-enc-bar[data-indet="true"] .bz-enc-hatch{display:block;animation:bz-enc-march var(--bz-enc-beat) steps(4) infinite}
.bz-enc-count{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;font:500 12px/16px var(--bz-enc-mono);color:var(--bz-enc-muted);white-space:nowrap;font-variant-numeric:tabular-nums}
@keyframes bz-enc-march{from{transform:translateX(0)}to{transform:translateX(8px)}}
@keyframes bz-enc-fade{from{opacity:0}to{opacity:1}}

.bz-enc-box{margin-top:12px}
.bz-enc-box-in{display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:16px;padding:14px 18px 12px}
.bz-enc-face{align-self:start;width:72px;height:58px;padding:6px 2px 0;border:2px solid var(--bz-enc-ink);background:var(--bz-enc-portrait,var(--bz-enc-track));overflow:hidden}
.bz-enc-face svg{display:block;width:64px;height:48px}
.bz-enc-face g{display:none}
.bz-enc-face[data-face="open"] g[data-f="open"],.bz-enc-face[data-face="blink"] g[data-f="blink"],.bz-enc-face[data-face="squint"] g[data-f="squint"],.bz-enc-face[data-face="happy"] g[data-f="happy"]{display:inline}
.bz-enc[data-motion="on"] .bz-enc-face[data-face="open"] g[data-f="blink"]{display:inline;animation:bz-enc-blink calc(var(--bz-enc-beat) * 2) step-end infinite}
@keyframes bz-enc-blink{0%{visibility:hidden}96%{visibility:visible}100%{visibility:visible}}
.bz-enc-panels{display:grid;height:140px}
.bz-enc-panel{grid-area:1/1;min-width:0;min-height:0;background:var(--bz-enc-panel)}
.bz-enc-talk{position:relative}
.bz-enc-err,.bz-enc-res{z-index:1;visibility:hidden}
.bz-enc-err[data-on="true"],.bz-enc-res[data-on="true"]{visibility:visible}
.bz-enc-log{position:relative;height:120px;overflow-y:auto;scrollbar-width:none;overscroll-behavior:contain;font-size:15px;line-height:24px}
.bz-enc-log::-webkit-scrollbar{display:none}
.bz-enc-log:focus{outline:none}
.bz-enc-log:focus-visible{outline:2px solid var(--bz-enc-focus);outline-offset:2px}
.bz-enc-line{display:flex;gap:8px;margin:0;color:var(--bz-enc-muted);font-size:14px}
.bz-enc-line[data-last="true"]{color:var(--bz-enc-ink);font-size:16px;font-weight:500}
.bz-enc-line>.bz-enc-g{width:14px;height:14px;margin-top:5px;visibility:hidden}
.bz-enc-line[data-last="true"]>.bz-enc-g{visibility:visible}
.bz-enc-line[data-kind="done"]>.bz-enc-g{color:var(--bz-enc-success)}
.bz-enc-line[data-kind="skipped"]>.bz-enc-g,.bz-enc-line[data-kind="stop"]>.bz-enc-g{color:var(--bz-enc-muted)}
.bz-enc-line[data-kind="retry"]>.bz-enc-g,.bz-enc-line[data-kind="finish"]>.bz-enc-g{color:var(--bz-enc-accent)}
.bz-enc-ph{position:absolute;left:0;top:0;margin:0;font-size:15px;line-height:24px;color:var(--bz-enc-muted)}

.bz-enc-err{display:grid;grid-template-rows:minmax(0,1fr) auto;row-gap:10px}
.bz-enc-err-text,.bz-enc-sheet-in{min-height:0;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:var(--bz-enc-muted) transparent}
.bz-enc-err-text:focus,.bz-enc-sheet-in:focus{outline:none}
.bz-enc-err-text:focus-visible,.bz-enc-sheet-in:focus-visible{outline:2px solid var(--bz-enc-focus);outline-offset:-2px}
.bz-enc-err-text[data-more="true"]::after,.bz-enc-sheet-in[data-more="true"]::after{content:"";position:sticky;bottom:0;display:block;height:20px;margin-top:-20px;background:linear-gradient(to bottom,transparent,var(--bz-enc-panel));pointer-events:none}
.bz-enc-alert{visibility:visible;display:flex;gap:10px;color:var(--bz-enc-ink);font-size:15px;font-weight:500;line-height:24px}
.bz-enc-alert>.bz-enc-g{width:14px;height:14px;margin-top:5px;color:var(--bz-enc-danger-mark)}

.bz-enc-sheet{position:absolute;grid-area:2/1/3/2;z-index:5;top:10px;left:10px;right:10px;display:flex;max-height:calc(100% - 20px)}
.bz-enc-sheet[hidden]{display:none}
.bz-enc-sheet-in{flex:1 1 auto;padding:10px 14px 12px}
.bz-enc-sheet-head{margin:0 0 4px;font:700 11px/14px var(--bz-enc-mono);letter-spacing:0.08em;text-transform:uppercase;color:var(--bz-enc-muted)}
.bz-enc-details{margin:0;font:500 12px/18px var(--bz-enc-mono);color:var(--bz-enc-ink);overflow-wrap:anywhere}
.bz-enc-more-detail{margin:6px 0 0;font-size:13px;line-height:18px;color:var(--bz-enc-muted)}
.bz-enc-menu{display:flex;flex-wrap:wrap;gap:8px}
.bz-enc-menu .bz-enc-btn{justify-content:flex-start;gap:6px;padding:0 16px 0 8px}
.bz-enc-cur{display:inline-flex;width:8px;visibility:hidden}
.bz-enc-cur .bz-enc-g{width:8px;height:14px}
.bz-enc-err[data-on="true"] .bz-enc-btn[data-cursor="true"] .bz-enc-cur{visibility:visible}

.bz-enc-res{display:flex;flex-direction:column;gap:8px;overflow:hidden}
.bz-enc-res-line{flex:none;margin:0;font-size:15px;font-weight:500;line-height:22px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.bz-enc-tiles{display:flex;flex-wrap:wrap;align-content:flex-start;gap:8px 12px;min-height:0;margin:0;overflow-y:auto}
.bz-enc-tile{flex:1 1 auto;min-width:0;padding-top:6px;border-top:2px solid var(--bz-enc-ink)}
.bz-enc-tile dt{font:700 11px/14px var(--bz-enc-mono);letter-spacing:0.08em;text-transform:uppercase;color:var(--bz-enc-muted)}
.bz-enc-tile dd{margin:2px 0 0}
.bz-enc-num{display:block;font:700 18px/24px var(--bz-enc-mono);color:var(--bz-enc-ink);font-variant-numeric:tabular-nums;white-space:nowrap}
.bz-enc-sub{width:0;min-width:100%;font-size:12px;line-height:16px;color:var(--bz-enc-muted);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}

.bz-enc-foot{grid-column:1/-1;display:flex;align-items:center;gap:8px 16px;margin-top:12px}
.bz-enc-meta{flex:1 1 auto;min-width:0;height:40px;margin:0;overflow:hidden;font-size:13px;line-height:20px;color:var(--bz-enc-muted);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.bz-enc-meta b{font-weight:600;color:var(--bz-enc-ink)}
.bz-enc-meta .bz-enc-g{display:inline-block;width:12px;height:12px;margin-right:6px;vertical-align:-1px;color:var(--bz-enc-accent)}
.bz-enc-tools{display:flex;flex:none;gap:8px}

.bz-enc-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-width:48px;min-height:48px;margin:0;padding:0 16px;border:2px solid var(--bz-enc-ink);border-radius:0;background:var(--bz-enc-panel);color:var(--bz-enc-ink);box-shadow:inset 0 -3px 0 var(--bz-enc-track);font:600 14px/1.2 var(--bz-enc-sans);text-align:left;cursor:pointer;transition:background-color var(--bz-enc-fast) var(--bz-enc-ease),transform var(--bz-enc-fast) var(--bz-enc-ease)}
.bz-enc-btn .bz-enc-g{width:12px;height:12px}
.bz-enc-btn:focus{outline:none}
.bz-enc-btn:focus-visible{outline:2px solid var(--bz-enc-focus);outline-offset:2px;background:var(--bz-enc-track)}
@media (hover:hover){.bz-enc-btn:hover{background:var(--bz-enc-track)}}
.bz-enc[data-motion="on"] .bz-enc-btn:active{transform:scale(0.97)}
.bz-enc-btn:disabled{opacity:0.5;cursor:not-allowed}
.bz-enc-primary{border-color:var(--bz-enc-accent);background:var(--bz-enc-accent);color:var(--bz-enc-on-accent);box-shadow:inset 0 -3px 0 rgba(0,0,0,0.25)}
.bz-enc-primary:focus-visible{background:var(--bz-enc-accent);box-shadow:inset 0 -3px 0 rgba(0,0,0,0.25),inset 0 0 0 2px var(--bz-enc-panel)}
@media (hover:hover){.bz-enc-primary:hover{background:var(--bz-enc-accent);box-shadow:inset 0 -3px 0 rgba(0,0,0,0.25),inset 0 0 0 2px var(--bz-enc-panel)}}
.bz-enc-toy{padding:0 14px;font-size:13.5px}
.bz-enc-toy[aria-pressed="true"]{border-color:var(--bz-enc-ink);background:var(--bz-enc-ink);color:var(--bz-enc-panel);box-shadow:none}
.bz-enc-toy[data-hide="true"]{visibility:hidden}
.bz-enc-continue{min-width:112px;visibility:hidden}
.bz-enc-continue[data-on="true"]{visibility:visible}

@container (max-width:559px){
.bz-enc-in{--bz-enc-u:2px;padding:12px}
.bz-enc-box-in{padding:12px 12px 10px}
.bz-enc-box-in{grid-template-columns:minmax(0,1fr)}
.bz-enc-face{display:none}
.bz-enc-panels{height:240px}
.bz-enc-log{height:220px}
.bz-enc-plate-row{flex-wrap:wrap}
.bz-enc-bar{flex-basis:100%}
.bz-enc-badges{position:absolute;top:-12px;right:8px}
.bz-enc-tag,.bz-enc-failed{padding:3px 6px 2px;border:2px solid var(--bz-enc-ink)}
.bz-enc-failed{background:var(--bz-enc-panel);line-height:1.2}
.bz-enc-menu{display:grid;grid-template-columns:1fr 1fr}
.bz-enc-tile{flex-basis:40%}
.bz-enc-sub{display:block;white-space:nowrap;text-overflow:ellipsis}
.bz-enc-res-line{-webkit-line-clamp:3}
.bz-enc-foot{flex-wrap:wrap}
.bz-enc-meta{flex:1 1 100%}
.bz-enc-tools{flex:1 1 100%}
}

.bz-enc-hero .bz-enc-f{display:none}
${LOADER_FRAME_NAMES.map((f) => `.bz-enc-hero[data-frame="${f}"] .bz-enc-f[data-f="${f}"]`).join(",")}{display:inline}
.bz-enc-hero[data-loop="idle"] .bz-enc-f[data-f="idle1"],.bz-enc-hero[data-loop="working"] .bz-enc-f[data-f="idle1"],.bz-enc-hero[data-loop="celebrate"] .bz-enc-f[data-f="celebrate1"],.bz-enc-hero[data-loop="fly"] .bz-enc-f[data-f="fly1"]{display:inline;animation:bz-enc-a var(--bz-enc-loop) step-end infinite}
.bz-enc-hero[data-loop="idle"] .bz-enc-f[data-f="idle2"],.bz-enc-hero[data-loop="working"] .bz-enc-f[data-f="swing1"],.bz-enc-hero[data-loop="celebrate"] .bz-enc-f[data-f="celebrate2"],.bz-enc-hero[data-loop="fly"] .bz-enc-f[data-f="fly2"]{display:inline;animation:bz-enc-b var(--bz-enc-loop) step-end infinite}
.bz-enc-hero{--bz-enc-loop:var(--bz-enc-beat)}
.bz-enc-hero[data-loop="celebrate"]{--bz-enc-loop:calc(var(--bz-enc-beat) / 4)}
.bz-enc-hero[data-loop="fly"]{--bz-enc-loop:calc(var(--bz-enc-beat) / 8)}
.bz-enc-hero[data-loop="run"] .bz-enc-f[data-f^="run"]{display:inline;animation:bz-enc-r 400ms step-end infinite}
.bz-enc-hero[data-loop="run"] .bz-enc-f[data-f="run2"]{animation-delay:-300ms}
.bz-enc-hero[data-loop="run"] .bz-enc-f[data-f="run3"]{animation-delay:-200ms}
.bz-enc-hero[data-loop="run"] .bz-enc-f[data-f="run4"]{animation-delay:-100ms}
@keyframes bz-enc-a{0%{visibility:visible}50%{visibility:hidden}100%{visibility:hidden}}
@keyframes bz-enc-b{0%{visibility:hidden}50%{visibility:visible}100%{visibility:visible}}
@keyframes bz-enc-r{0%{visibility:visible}25%{visibility:hidden}100%{visibility:hidden}}
.bz-enc-c-outline{fill:var(--bz-enc-sprite-outline)}
.bz-enc-c-line{fill:var(--bz-enc-sprite-line)}
.bz-enc-c-mouth{fill:var(--chr-eye)}
${LOADER_CHARACTER_KEYS.map((k) => `.bz-enc-c-${k}{fill:var(--chr-${k})}`).join("\n")}

.bz-enc[data-motion="off"] .bz-enc-f,.bz-enc[data-motion="off"] .bz-enc-hatch{animation:none!important}
.bz-enc[data-motion="off"] .bz-enc-fill{transition:none}
.bz-enc[data-motion="off"] .bz-enc-btn{transition:background-color var(--bz-enc-fast) linear}
.bz-enc[data-running="false"] *,.bz-enc[data-running="false"] *::before{animation-play-state:paused!important}
`;

/* ---------------- end shared: chassis ---------------- */

/* ---------------- Encounter arena ---------------- */

/* Crates are 14 x 14 art pixels; the last crate is 18 x 18. Keys: o outline,
   c planks, C panels and shade, b metal corners and bands, g and G the last
   crate's planks and seams. */
const ENC_CRATE = [
  "oooooooooooooo",
  "obbccccccccbbo",
  "obcccccccccCbo",
  "occoooooooocCo",
  "occoCCCCccocCo",
  "occoCCCccCocCo",
  "occoCCccCCocCo",
  "occoCccCCCocCo",
  "occoccCCCCocCo",
  "occocCCCCCocCo",
  "occoooooooocCo",
  "obcccccccccCbo",
  "obbCCCCCCCCbbo",
  "oooooooooooooo",
];
const ENC_BOSS = [
  "oooooooooooooooooo",
  "obbgggGggggGgggbbo",
  "obbgggGggggGgggbbo",
  "ogggggGggggGggggGo",
  "ogggggGggggGggggGo",
  "obobbbbbbbbbbbbobo",
  "ogggggGggggGggggGo",
  "ogggggGggggGggggGo",
  "ogggggGggggGggggGo",
  "ogggggGggggGggggGo",
  "ogggggGggggGggggGo",
  "ogggggGggggGggggGo",
  "obobbbbbbbbbbbbobo",
  "ogggggGggggGggggGo",
  "ogggggGggggGggggGo",
  "obbgggGggggGgggbbo",
  "obbGGGGGGGGGGGGbbo",
  "oooooooooooooooooo",
];
const ENC_CRATE_ROLES: Record<string, string> = { o: "crate-line", c: "crate", C: "crate-shade", b: "crate-band", x: "crate-line", w: "glint" };
const ENC_BOSS_ROLES: Record<string, string> = { o: "boss-line", g: "boss", G: "boss-shade", b: "crate-band", x: "boss-line", w: "glint" };

/* Two jagged splits that grow together, one cell each per twelfth of progress, so the art never runs ahead of the bar. */
const ENC_CRACKS: Array<Array<[number, number]>> = [
  [[6, 1], [6, 2], [5, 4], [6, 5], [5, 6], [5, 7], [4, 8], [4, 9], [3, 11], [4, 12], [2, 8], [1, 9]],
  [[10, 1], [10, 2], [11, 4], [12, 5], [11, 6], [9, 6], [8, 7], [9, 8], [8, 9], [9, 11], [10, 12], [12, 3]],
];
const ENC_BOSS_CRACKS: Array<Array<[number, number]>> = [
  [[8, 1], [8, 2], [9, 3], [8, 4], [8, 6], [9, 7], [8, 8], [9, 9], [8, 10], [9, 11], [8, 13], [9, 14]],
  [[3, 3], [4, 4], [3, 6], [2, 7], [3, 8], [4, 9], [14, 10], [13, 11], [14, 13], [15, 14], [14, 6], [13, 7]],
];

/* One mark per resolved step on the floor behind the adventurer: rubble when
   done (gold flecks after a retry, a bigger heap for the last crate) and an
   empty bracket when skipped. */
const ENC_RUBBLE = ["...oo...", "..ocCo..", ".orrrro.", "orrrrrro"];
const ENC_RUBBLE_GOLD = ["...oo...", "..ocyo..", ".oryrro.", "orrryrro"];
const ENC_RUBBLE_BOSS = ["....oo....", "...ogGo...", "..ogGGyo..", ".orrgrrro.", "orrrrrrrro"];
const ENC_SLOT = ["ss....ss", "s......s", "s......s", "ss....ss"];
const ENC_TRAIL_ROLES: Record<string, string> = { o: "crate-line", c: "crate", C: "crate-shade", r: "rubble", y: "spark", g: "boss", G: "boss-shade", s: "slot" };
const ENC_SPARK = ["..o..", ".oyo.", "oyyyo", ".oyo.", "..o.."];
const ENC_SPARK_ROLES: Record<string, string> = { o: "outline", y: "spark" };
const ENC_TUFT = ["e...e", "e.e.e", "eeeee"];
const ENC_TUFT_ROLES: Record<string, string> = { e: "ground-edge" };

/* The wooden sword is Encounter's own prop: raised on the wind-up, forward on the strike. */
const ENC_SWORD_UP = ["..oo..", ".okKo.", ".okKo.", ".okKo.", ".okKo.", ".okKo.", ".okKo.", "oooooo", "oKKKKo", "oooooo"];
const ENC_SWORD_FORWARD = ["ooo........", "oKoooooooo.", "oKokkkkkkko", "oKoKKKKKKo.", "oKooooooo..", "ooo........"];
/* The frames Encounter shows: the rest of the shared set (running, jumping, flying) never appear here, so they are not drawn. */
const ENC_FRAMES: readonly LoaderFrameName[] = ["idle1", "idle2", "swing1", "swing2", "hurt", "sit", "celebrate1", "celebrate2"];

const ENC_SWORD: LoaderAccessory = {
  id: "sword",
  layers: (frame) =>
    frame === "swing1"
      ? { front: [{ x: 12, y: 2, rows: ENC_SWORD_UP }] }
      : frame === "swing2"
        ? { front: [{ x: 15, y: 11, rows: ENC_SWORD_FORWARD }] }
        : null,
};

const encCrackCount = (p: number) => (p >= 1 ? 12 : Math.max(0, Math.floor(p * 12 + 1e-9)));

function encCracked(art: readonly string[], cracks: Array<Array<[number, number]>>, k: number): string[] {
  const rows = art.map((r) => r.split(""));
  for (const line of cracks) for (let j = 0; j < Math.min(k, line.length); j++) rows[line[j][1]][line[j][0]] = "x";
  return rows.map((r) => r.join(""));
}

function encCrackOverlay(art: readonly string[], cracks: Array<Array<[number, number]>>, k: number): string[] {
  const grid = art.map((r) => r.replace(/./g, ".").split(""));
  for (const line of cracks) for (let j = 0; j < Math.min(k, line.length); j++) grid[line[j][1]][line[j][0]] = "x";
  return grid.map((r) => r.join(""));
}

type EncGeom = { u: number; W: number; H: number; floor: number; lead: number; slot: number; critX: number; x0: number };

function createEncounterArena(root: HTMLElement, ctx: LoaderArenaCtx): LoaderArena {
  const q = <T extends Element>(sel: string) => root.querySelector(sel) as T;
  const arenaEl = q<HTMLDivElement>(".bz-enc-arena");
  const cratesEl = q<HTMLDivElement>(".bz-enc-crates");
  const trailEl = q<HTMLDivElement>(".bz-enc-trail");
  const fxEl = q<HTMLDivElement>(".bz-enc-fx");
  const tuftsEl = q<HTMLDivElement>(".bz-enc-tufts");
  const heroEl = q<HTMLDivElement>(".bz-enc-hero");
  const moverEl = q<HTMLDivElement>(".bz-enc-mover");
  const moreEl = q<HTMLSpanElement>(".bz-enc-more");
  const plateEl = q<HTMLDivElement>(".bz-enc-plate");

  let crates: Array<HTMLDivElement | null> = [];
  let crateX: number[] = [];
  let trail: Array<HTMLDivElement | null> = [];
  let g: EncGeom = { u: 3, W: 0, H: 0, floor: 24, lead: 6, slot: 18, critX: 0, x0: 0 };
  let transientUntil = 0;
  let poseTimers: number[] = [];
  let celebrateUntil = 0;
  let tuftKey = "";

  const isBoss = (i: number) => i === ctx.steps().length - 1;
  const artOf = (i: number) => (isBoss(i) ? ENC_BOSS : ENC_CRATE);
  const rolesOf = (i: number) => (isBoss(i) ? ENC_BOSS_ROLES : ENC_CRATE_ROLES);
  const cracksOf = (i: number) => (isBoss(i) ? ENC_BOSS_CRACKS : ENC_CRACKS);
  const sizeOf = (i: number) => artOf(i).length * g.u;
  const crateTop = (i: number) => g.H - g.floor - sizeOf(i);

  /* -------- poses -------- */

  function pose() {
    if (transientUntil > loaderNow()) return;
    const phase = ctx.phase();
    const m = ctx.motionAllowed();
    if (phase === "error" || phase === "stopped") return loaderSetPose(heroEl, "sit", "");
    if (phase === "complete") return m && celebrateUntil > loaderNow() ? loaderSetPose(heroEl, "", "celebrate") : loaderSetPose(heroEl, "celebrate1", "");
    if (!m) return loaderSetPose(heroEl, "idle1", "");
    const s = ctx.steps()[ctx.front()];
    loaderSetPose(heroEl, "", s && s.status === "active" && s.progress == null ? "working" : "idle");
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

  /** The adventurer steps in by d pixels, holds, and steps back. */
  function lunge(d: number) {
    ctx.anim(moverEl, loaderStepped([[0, 0, 0], [0.08, d, 0], [0.5, Math.round(d / 3), 0], [0.75, 0, 0], [1, 0, 0]]), { duration: BASE });
  }

  /* -------- building -------- */

  function makeCrate(i: number) {
    const el = document.createElement("div");
    el.className = "bz-enc-crate";
    if (isBoss(i)) el.dataset.boss = "true";
    el.innerHTML = `<div class="bz-enc-crate-art">${loaderPixelSvg(artOf(i), rolesOf(i))}<div class="bz-enc-cracks"></div></div>`;
    cratesEl.appendChild(el);
    return el;
  }

  function trailMap(i: number) {
    const s = ctx.steps()[i];
    if (s.status === "skipped") return ENC_SLOT;
    if (isBoss(i)) return ENC_RUBBLE_BOSS;
    return (s.attempt ?? 1) > 1 ? ENC_RUBBLE_GOLD : ENC_RUBBLE;
  }

  function placeTrail(el: HTMLDivElement, i: number) {
    const m = trailMap(i);
    el.style.left = `${g.lead + i * g.slot}px`;
    el.style.width = `${m[0].length * g.u}px`;
    el.style.height = `${m.length * g.u}px`;
  }

  function renderTrail(fade: boolean) {
    const steps = ctx.steps();
    const vis = ctx.vis();
    steps.forEach((s, i) => {
      const want = vis[i] === "gone";
      let el = trail[i];
      if (!want) {
        if (el) {
          el.remove();
          trail[i] = null;
        }
        return;
      }
      const kind = s.status === "skipped" ? "skipped" : (s.attempt ?? 1) > 1 ? "gold" : "done";
      if (el && el.dataset.kind === kind) return;
      el?.remove();
      el = document.createElement("div");
      el.className = "bz-enc-rub";
      el.dataset.kind = kind;
      el.innerHTML = loaderPixelSvg(trailMap(i), ENC_TRAIL_ROLES);
      trailEl.appendChild(el);
      trail[i] = el;
      placeTrail(el, i);
      if (fade && ctx.running()) ctx.anim(el, [{ opacity: 0 }, { opacity: 1 }], { duration: FAST, easing: "linear" });
    });
  }

  function drawCracks() {
    const i = ctx.front();
    const el = crates[i];
    if (!el) return;
    const k = encCrackCount(ctx.frontP());
    if (el.dataset.cracks === String(k)) return;
    el.dataset.cracks = String(k);
    const layer = el.querySelector(".bz-enc-cracks");
    if (layer) layer.innerHTML = k ? loaderPixelSvg(encCrackOverlay(artOf(i), cracksOf(i), k), rolesOf(i)) : "";
  }

  function rebuild() {
    cratesEl.textContent = "";
    trailEl.textContent = "";
    fxEl.textContent = "";
    poseTimers.forEach(ctx.clear);
    poseTimers = [];
    transientUntil = 0;
    celebrateUntil = 0;
    const steps = ctx.steps();
    const vis = ctx.vis();
    crates = steps.map((_, i) => (vis[i] === "live" ? makeCrate(i) : null));
    crateX = steps.map(() => 0);
    trail = steps.map(() => null);
    layout(false);
    renderTrail(false);
    drawCracks();
  }

  /* -------- layout: one art unit at a time, 3px wide and 2px narrow -------- */

  function layout(animate: boolean) {
    const W = arenaEl.clientWidth;
    const H = arenaEl.clientHeight;
    if (!W || !H) return;
    const narrow = root.clientWidth < 560;
    if (root.dataset.narrow !== String(narrow)) root.dataset.narrow = String(narrow);
    const u = narrow ? 2 : 3;
    const steps = ctx.steps();
    const vis = ctx.vis();
    const n = steps.length;
    const last = n - 1;
    const floor = 8 * u;
    const lead = 2 * u;
    const slot = Math.max(5 * u, Math.min(10 * u, Math.floor((W * 0.26) / Math.max(1, n))));
    const trailW = n ? (n - 1) * slot + 10 * u : 0;
    const critX = lead + trailW + 3 * u;
    const heroW = 16 * u;
    const crate = 14 * u;
    const boss = 18 * u;
    const gap = narrow ? 6 * u : 8 * u;
    const x0 = critX + heroW + gap;
    const qgap = 4 * u;
    const pad = 4 * u;
    const resized = g.u !== u || g.W !== W;
    g = { u, W, H, floor, lead, slot, critX, x0 };

    trail.forEach((el, i) => el && placeTrail(el, i));
    heroEl.style.transform = `translate(${critX}px, 0px)`;
    arenaEl.style.setProperty("--bz-enc-bx", `${Math.round(critX + heroW + (W - critX - heroW) / 2)}px`);

    const tk = `${W}:${u}`;
    if (tk !== tuftKey) {
      tuftKey = tk;
      tuftsEl.textContent = "";
      for (const f of [0.08, 0.44, 0.7, 0.93]) {
        const t = document.createElement("div");
        t.className = "bz-enc-tuft";
        t.style.left = `${Math.round((W * f) / u) * u}px`;
        t.style.width = `${ENC_TUFT[0].length * u}px`;
        t.style.height = `${ENC_TUFT.length * u}px`;
        t.innerHTML = loaderPixelSvg(ENC_TUFT, ENC_TUFT_ROLES);
        tuftsEl.appendChild(t);
      }
    }

    const live: number[] = [];
    for (let i = 0; i < n; i++) if (vis[i] === "live") live.push(i);
    const bossQueued = live.length > 1 && live[live.length - 1] === last;
    const bossX = W - pad - boss;
    const queued = live.slice(1, bossQueued ? -1 : undefined);
    const frontSize = live.length && live[0] === last ? boss : crate;
    const start = x0 + frontSize + qgap;
    const end = bossQueued ? bossX - qgap : W - pad;
    const chipW = 9 * u + 6;
    let shown = Math.min(queued.length, 4, Math.max(0, Math.floor((end - start + qgap) / (crate + qgap))));
    while (shown > 0 && shown < queued.length && start + shown * (crate + qgap) + chipW > end) shown--;
    const hidden = queued.length - shown;
    const chipX = start + shown * (crate + qgap);

    live.forEach((i, k) => {
      const el = crates[i];
      if (!el) return;
      let x: number;
      let role: string;
      if (k === 0) {
        x = x0;
        role = "front";
      } else if (i === last) {
        x = bossX;
        role = "boss";
      } else if (k - 1 < shown) {
        x = start + (k - 1) * (crate + qgap);
        role = "queue";
      } else {
        x = chipX;
        role = "hidden";
      }
      const size = artOf(i).length * u;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      if (el.dataset.role !== role) el.dataset.role = role;
      const from = crateX[i];
      crateX[i] = x;
      el.style.transform = `translate(${x}px, 0px)`;
      if (animate && !resized && from !== x && role !== "hidden" && ctx.motionOn()) ctx.anim(el, loaderGlide(from, 0, x, 0, BASE), { duration: BASE });
    });

    if (hidden > 0) {
      moreEl.textContent = `+${hidden}`;
      moreEl.style.left = `${chipX}px`;
      moreEl.dataset.on = "true";
    } else {
      moreEl.textContent = "";
      moreEl.dataset.on = "false";
    }

    // The nameplate floats above the front crate, right of the adventurer and clear of the last crate.
    const px = critX + heroW + 3 * u;
    const pw = narrow ? W - pad - px : Math.min(340, W - pad - px);
    const pb = floor + Math.max(frontSize, bossQueued ? boss : 0) + 4 * u;
    plateEl.style.left = `${px}px`;
    plateEl.style.width = `${Math.max(120, pw)}px`;
    plateEl.style.bottom = `${pb}px`;
  }

  /* -------- effects -------- */

  function wobble(i: number) {
    const art = crates[i]?.firstElementChild;
    if (art) ctx.anim(art, loaderStepped([[0, 0, 0], [0.1, g.u, 0], [0.45, -g.u, 0], [0.8, 0, 0], [1, 0, 0]]), { duration: BASE });
  }

  function sparks(i: number) {
    const x = crateX[i];
    const top = crateTop(i);
    for (const [dx, dy] of [[-5, -4], [-2, -7]]) {
      const sp = document.createElement("div");
      sp.className = "bz-enc-spark";
      sp.style.cssText = `left:${x - 2 * g.u}px;top:${top + 2 * g.u}px;width:${5 * g.u}px;height:${5 * g.u}px`;
      sp.innerHTML = loaderPixelSvg(ENC_SPARK, ENC_SPARK_ROLES);
      fxEl.appendChild(sp);
      const a = ctx.anim(sp, loaderStepped([[0, 0, 0, 1], [0.34, (dx * g.u) / 2, (dy * g.u) / 2, 1], [0.67, dx * g.u, dy * g.u, 0.6], [1, dx * g.u, dy * g.u, 0]]), { duration: BASE, fill: "forwards" });
      const rm = () => sp.remove();
      if (a) a.finished.then(rm, rm);
      else rm();
    }
  }

  function glint(i: number) {
    const art = crates[i]?.firstElementChild;
    if (!art) return;
    const el = document.createElement("div");
    el.className = "bz-enc-glint";
    el.innerHTML = loaderPixelSvg(artOf(i).map((r) => r.replace(/[^.]/g, "w")), rolesOf(i));
    art.appendChild(el);
    ctx.later(() => el.remove(), FAST);
  }

  /** The crate splits into six pieces that hop out in whole art pixels. Nothing rotates. */
  function shatter(i: number) {
    const el = crates[i];
    if (!el) return;
    const art = encCracked(artOf(i), cracksOf(i), 12);
    const roles = rolesOf(i);
    const size = art.length;
    const u = g.u;
    const x = crateX[i];
    const top = crateTop(i);
    const hw = Math.ceil(size / 2);
    const h1 = Math.round(size / 3);
    const h2 = Math.round((2 * size) / 3);
    const pieces: Array<[number, number, number, number, number, number]> = [
      [0, 0, hw, h1, -0.6, 0.5],
      [hw, 0, size - hw, h1, 0.6, 0.45],
      [0, h1, hw, h2 - h1, -0.85, 0.2],
      [hw, h1, size - hw, h2 - h1, 0.85, 0.25],
      [0, h2, hw, size - h2, -0.45, 0.05],
      [hw, h2, size - hw, size - h2, 0.5, 0.05],
    ];
    const big = isBoss(i);
    for (const [cx, cy, cw, ch, fx, fy] of pieces) {
      const p = document.createElement("div");
      p.className = "bz-enc-shard";
      p.style.cssText = `left:${x + cx * u}px;top:${top + cy * u}px;width:${cw * u}px;height:${ch * u}px`;
      p.innerHTML = loaderPixelSvg(art, roles, [cx, cy, cw, ch]);
      fxEl.appendChild(p);
      const dx = fx * size * (big ? 1.3 : 1);
      const dy = fy * size;
      const up = size * 0.3 * (big ? 1.3 : 1);
      const pts: Array<[number, number, number, number]> = [];
      for (let j = 0; j <= 6; j++) {
        const t = j / 6;
        pts.push([t, Math.round(dx * t) * u, Math.round(-4 * up * t * (1 - t) + dy * t * t) * u, t < 0.5 ? 1 : Math.max(0, 1 - (t - 0.5) * 2)]);
      }
      const a = ctx.anim(p, loaderStepped(pts), { duration: big ? SLOW : BASE, fill: "forwards" });
      const rm = () => p.remove();
      if (a) a.finished.then(rm, rm);
      else rm();
    }
    el.remove();
    crates[i] = null;
  }

  /** A skipped crate rises out of the way and leaves a dashed outline that is gone after 300ms. */
  function stepAside(i: number) {
    const el = crates[i];
    if (!el) return;
    const x = crateX[i];
    const top = crateTop(i);
    const size = sizeOf(i);
    const ghost = document.createElement("div");
    ghost.className = "bz-enc-ghost";
    ghost.style.cssText = `left:${x}px;top:${top}px;width:${size}px;height:${size}px`;
    fxEl.appendChild(ghost);
    ctx.later(() => {
      const a = ctx.anim(ghost, [{ opacity: 1 }, { opacity: 0 }], { duration: FAST, easing: "linear", fill: "forwards" });
      const rm = () => ghost.remove();
      if (a) a.finished.then(rm, rm);
      else rm();
    }, BASE - FAST);
    crates[i] = null;
    const a = ctx.anim(el, [0, 1, 2, 3].map((j) => ({ offset: j / 3, easing: "step-end", transform: `translate(${x}px, ${-2 * g.u * j}px)`, opacity: 1 - j / 3 })), { duration: BASE, fill: "forwards" });
    const rm = () => el.remove();
    if (a) a.finished.then(rm, rm);
    else rm();
  }

  function fadeOut(i: number) {
    const el = crates[i];
    if (!el) return;
    crates[i] = null;
    if (!ctx.running()) {
      el.remove();
      return;
    }
    const a = ctx.anim(el, [{ opacity: 1 }, { opacity: 0 }], { duration: FAST, easing: "linear", fill: "forwards" });
    const rm = () => el.remove();
    if (a) a.finished.then(rm, rm);
    else rm();
  }

  return {
    rebuild,
    layout,
    hit() {
      play([["swing1", IMPACT], ["swing2", 200]]);
      lunge(2 * g.u);
      return IMPACT;
    },
    progress(i, showy) {
      drawCracks();
      if (showy) {
        wobble(i);
        sparks(i);
      }
    },
    finish() {
      play([["swing1", 50], ["swing2", 250]]);
      lunge(3 * g.u);
      return IMPACT;
    },
    resolve(entries, showy) {
      let hold = 0;
      for (const e of entries) {
        if (!showy) fadeOut(e.i);
        else if (e.kind === "done") shatter(e.i);
        else {
          stepAside(e.i);
          hold = BASE;
        }
      }
      renderTrail(true);
      return hold;
    },
    advance(changed) {
      renderTrail(true);
      layout(ctx.motionOn());
      drawCracks();
      const el = crates[ctx.front()];
      if (changed && el && !ctx.motionOn() && ctx.running()) ctx.anim(el, [{ opacity: 0 }, { opacity: 1 }], { duration: FAST, easing: "linear" });
    },
    error(i, showy) {
      const el = crates[i];
      if (el) el.dataset.error = "true";
      if (showy) {
        glint(i);
        play([["hurt", FAST + 100]]);
        ctx.anim(moverEl, loaderStepped([[0, 0, 0], [0.15, -3 * g.u, 0], [0.7, -3 * g.u, 0], [1, 0, 0]]), { duration: BASE });
      } else {
        poseTimers.forEach(ctx.clear);
        transientUntil = 0;
      }
    },
    recover() {
      crates.forEach((el) => {
        if (el) delete el.dataset.error;
      });
      drawCracks();
    },
    stop() {
      poseTimers.forEach(ctx.clear);
      transientUntil = 0;
    },
    finale(showy) {
      renderTrail(true);
      poseTimers.forEach(ctx.clear);
      transientUntil = 0;
      if (showy) {
        celebrateUntil = loaderNow() + BEAT * 3;
        poseTimers.push(ctx.later(pose, BEAT * 3 + 20));
      } else celebrateUntil = 0;
    },
    pose,
    motion() {
      if (!ctx.motionAllowed()) {
        poseTimers.forEach(ctx.clear);
        poseTimers = [];
        transientUntil = 0;
        celebrateUntil = 0;
      }
    },
    destroy() {
      poseTimers.forEach(ctx.clear);
      cratesEl.textContent = "";
      trailEl.textContent = "";
      fxEl.textContent = "";
      tuftsEl.textContent = "";
      moreEl.textContent = "";
    },
  };
}

const ENCOUNTER_GAME: LoaderGame = { unit: "Stage", clear: "Stage clear", arena: createEncounterArena };

const CSS = `${LOADER_CSS}
.bz-enc-stage{margin:0}
.bz-enc-arena{height:216px;overflow:hidden;background:var(--bz-enc-sky)}
.bz-enc-art{position:absolute;inset:0;--bz-enc-floor:calc(8 * var(--bz-enc-u))}
.bz-enc-ground{position:absolute;left:0;right:0;bottom:0;height:var(--bz-enc-floor);border-top:var(--bz-enc-u) solid var(--bz-enc-ground-edge);background:var(--bz-enc-ground)}
.bz-enc-tuft,.bz-enc-rub,.bz-enc-crate,.bz-enc-hero{position:absolute;left:0;bottom:var(--bz-enc-floor)}
.bz-enc-tuft svg,.bz-enc-rub svg,.bz-enc-crate svg,.bz-enc-shard svg,.bz-enc-spark svg,.bz-enc-glint svg{position:absolute;inset:0;display:block;width:100%;height:100%}
.bz-enc-crate{z-index:1}
.bz-enc-crate[data-role="hidden"]{display:none}
.bz-enc-crate[data-error="true"]{z-index:3;outline:2px solid var(--bz-enc-danger-mark);outline-offset:2px}
.bz-enc-crate-art,.bz-enc-cracks,.bz-enc-glint{position:absolute;inset:0}
.bz-enc-glint{opacity:0.85}
.bz-enc-hero{z-index:2;width:calc(16 * var(--bz-enc-u));height:calc(24 * var(--bz-enc-u))}
.bz-enc[data-phase="error"] .bz-enc-hero{z-index:3}
.bz-enc-mover{width:100%;height:100%}
.bz-enc-sprite{display:block;width:100%;height:100%;overflow:visible}
.bz-enc-fx{position:absolute;inset:0;z-index:3;pointer-events:none}
.bz-enc-shard,.bz-enc-spark{position:absolute}
.bz-enc-ghost{position:absolute;border:2px dashed var(--bz-enc-slot)}
.bz-enc-more{position:absolute;bottom:calc(var(--bz-enc-floor) + 4 * var(--bz-enc-u));z-index:1;padding:2px 5px;border:2px solid var(--bz-enc-ink);background:var(--bz-enc-panel);color:var(--bz-enc-ink);font:700 12px/1.2 var(--bz-enc-mono);visibility:hidden}
.bz-enc-more[data-on="true"]{visibility:visible}
/* The art is not its own stacking layer, so the veil can sit between the scenery (sky, floor,
   rubble, the queue) and what the error is about: the failed crate and the adventurer stay
   at full colour above it. */
.bz-enc-veil{position:absolute;inset:0;z-index:2;background:var(--bz-enc-panel);opacity:0;visibility:hidden;transition:opacity var(--bz-enc-base) var(--bz-enc-ease),visibility 0s linear var(--bz-enc-base)}
.bz-enc[data-phase="error"] .bz-enc-veil,.bz-enc[data-phase="stopped"] .bz-enc-veil{opacity:0.35;visibility:visible;transition:opacity var(--bz-enc-base) var(--bz-enc-ease)}
.bz-enc[data-motion="off"] .bz-enc-veil{transition:none}
.bz-enc-banner{position:absolute;top:calc(5 * var(--bz-enc-u));left:var(--bz-enc-bx,50%);z-index:3;padding:8px 18px 6px;border:2px solid var(--bz-enc-ink);background:var(--bz-enc-panel);color:var(--bz-enc-ink);font:700 15px/1 var(--bz-enc-mono);letter-spacing:0.14em;text-transform:uppercase;white-space:nowrap;transform:translateX(-50%);visibility:hidden}
.bz-enc-banner::after{content:"";display:block;height:4px;margin-top:6px;background:var(--bz-enc-accent)}
.bz-enc-banner[data-on="true"]{visibility:visible;animation:bz-enc-fade var(--bz-enc-fast) linear}
.bz-enc-arena .bz-enc-plate{position:absolute;z-index:4;left:0;bottom:90px;width:300px}
.bz-enc-k-crate{fill:var(--bz-enc-crate)}
.bz-enc-k-crate-shade{fill:var(--bz-enc-crate-shade)}
.bz-enc-k-crate-line{fill:var(--bz-enc-crate-line)}
.bz-enc-k-crate-band{fill:var(--bz-enc-crate-band)}
.bz-enc-k-boss{fill:var(--bz-enc-boss)}
.bz-enc-k-boss-shade{fill:var(--bz-enc-boss-shade)}
.bz-enc-k-boss-line{fill:var(--bz-enc-boss-line)}
.bz-enc-k-rubble{fill:var(--bz-enc-rubble)}
.bz-enc-k-spark{fill:var(--bz-enc-spark)}
.bz-enc-k-outline{fill:var(--bz-enc-sprite-outline)}
.bz-enc-k-ground-edge{fill:var(--bz-enc-ground-edge)}
.bz-enc-k-slot{fill:var(--bz-enc-slot)}
.bz-enc-k-glint{fill:#ffffff}
.bz-enc-crate[data-error="true"] .bz-enc-k-crate-line,.bz-enc-crate[data-error="true"] .bz-enc-k-boss-line{fill:var(--bz-enc-danger-mark)}
.bz-enc-c-wood{fill:#e0a96d}
.bz-enc-c-wood-shade{fill:#a8693a}
@container (max-width:559px){.bz-enc-arena{height:168px}}
`;

/* ---------------- the component ---------------- */

function encounterPalette(p: EncounterLoaderProps["palette"]): EncounterLoaderPalette {
  if (!p) return ENCOUNTER_LOADER_PALETTES.meadow;
  return typeof p === "string" ? ENCOUNTER_LOADER_PALETTES[p] ?? ENCOUNTER_LOADER_PALETTES.meadow : p;
}

export function EncounterLoader(props: EncounterLoaderProps) {
  const { title, headingLevel = 2, palette, character, colorScheme, className, style } = props;
  const api = useLoader(props, ENCOUNTER_GAME);
  const hero = loaderCharacter(character);
  const pal = encounterPalette(palette);
  const rootStyle = useMemo(
    () =>
      ({
        ...loaderPaletteVars(pal.light, pal.dark),
        "--bz-enc-slot": `light-dark(${pal.light.crateLine}, ${pal.dark.crateBand})`,
        "--bz-enc-portrait": `light-dark(${pal.light.sky}, ${pal.dark.sky})`,
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
      className={`bz-enc${className ? ` ${className}` : ""}`}
      aria-labelledby={api.titleId}
      data-phase={view.phase}
      data-motion={api.motionAllowed ? "on" : "off"}
      data-running={api.running ? "true" : "false"}
      style={rootStyle}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="bz-enc-in">
        <Heading id={api.titleId} className="bz-enc-title" tabIndex={-1}>
          {title}
        </Heading>
        <LoaderStepList api={api} />
        <div className="bz-enc-frame bz-enc-stage">
          <div className="bz-enc-frame-in bz-enc-arena">
            <div className="bz-enc-art" aria-hidden="true">
              <div className="bz-enc-ground" />
              <div className="bz-enc-tufts" />
              <div className="bz-enc-trail" />
              <div className="bz-enc-crates" />
              <div className="bz-enc-hero" data-frame="idle1">
                <div className="bz-enc-mover">
                  <LoaderHeroSprite hairStyle={hero.hairStyle} accessory={ENC_SWORD} frames={ENC_FRAMES} />
                </div>
              </div>
              <div className="bz-enc-fx" />
              <span className="bz-enc-more" />
            </div>
            <div className="bz-enc-veil" aria-hidden="true" />
            <div className="bz-enc-banner" aria-hidden="true" data-on={view.banner ? "true" : "false"}>
              {labels.clear}
            </div>
            <LoaderPlate api={api} />
          </div>
        </div>
        <LoaderBox api={api} hairStyle={hero.hairStyle} />
        <LoaderDetails api={api} />
      </div>
    </section>
  );
}
