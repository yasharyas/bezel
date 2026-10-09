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
 * RadarSweepLoader: a multi-step loader drawn as a radar display searching
 * for the parts of the work, where every contact locks on only when its real
 * step is done.
 *
 * The display is a phosphor scope in a screwed metal bezel, with bearings
 * round the glass, scanlines, a vignette and domed glass. It runs heading-up
 * in relative motion, like a ship's radar: own ship sits at the centre with
 * its heading line pointing up and a wake astern, and the coast, the buoys
 * and the sea clutter slide down past it at a steady speed. Each step is a
 * contact ahead. The contacts close in only as the run advances: a contact
 * is just ahead when its step is done, then carries on down and settles
 * astern, so all of them stay on the screen at the end. The arm turns once
 * every 1.4s and paints whatever it passes; the phosphor fades between
 * sweeps. The contact being worked on is brighter, with a ring that closes
 * exactly as far as the host's progress. When the host says the step is done,
 * own ship acts on it, but only when the beam next crosses it, the way a real
 * scope shows news: target brackets snap in with a lock tone, an intercept
 * leaves own ship on a curving, fading trail, and on arrival a phosphor
 * flash, a splash ring and a spray of debris collapse the blip into a
 * cleared mark, the data line reads SPLASH and its name types into the list.
 * The whole action takes under 1.2s, and contacts finishing together are
 * engaged as a salvo. A failure is a miss: the contact jinks, the shot runs
 * on past it and the contact turns red. A retry is a second shot. A skipped
 * contact is drawn hollow. The narration stays plain words about the work. Announcements for screen
 * readers never wait for the beam. Now and then the screen misbehaves the
 * way an old scope does: a false echo ahead that one sweep paints and the
 * next one dissolves, a torn streak of interference, a flicker. None of it
 * is ever progress, and neither is the platform's own way: the coast moves
 * at a constant speed whatever the run is doing. When every contact is
 * settled the display reads AREA CLEAR. With `sound` on, a beep for each new
 * contact, a tick each turn over a low hum, the lock tone, the launch, a soft
 * low impact, a miss, a warning and a chime are synthesized in the file, and
 * heard only while the loader is hovered or focused.
 *
 * Nothing that means progress moves on a timer: the sweep is decoration. The
 * ring, the list, the status line and the data line change only when the
 * steps you pass in change: at most one update every 400ms with the
 * increments in between merged. A step of unknown size gets a spinning arc
 * and ACQ --- instead of invented progress.
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
 * visually hidden progressbar carries the current step; on screen a CRT
 * data line gives target, bearing, range and acquisition. The message box
 * is a `role="log"` that narrates milestones in sentences rather than ticks;
 * errors go to a `role="alert"` and a menu with a roving focus. Focus moves only when it is
 * already inside the loader.
 *
 * Reduced motion (followed live, or forced with `reducedMotion`) stops the
 * sweep and every ripple: contacts light up in place with the status line.
 * The Pause motion button does the same on request. Off screen or in a
 * hidden tab nothing animates and finished steps settle without their beats;
 * on return the footer says what finished meanwhile. The loader keeps one
 * height in every state.
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

export type RadarSweepLoaderColors = {
  /** Around the scope. */
  console: string;
  /** The scope face. */
  scope: string;
  /** Range rings and the cross hairs. */
  ring: string;
  /** The sweep arm and its trail. */
  sweep: string;
  /** Locked contacts, their brackets, and the list's locked rows. Keep it 4.5:1 or more on the console and the scope. */
  lock: string;
  /** Contacts still searching. */
  ghost: string;
  /** Text on the console: the status line and the contact list. Keep it 4.5:1 or more on the console. */
  text: string;
  /** Primary buttons. */
  accent: string;
  /** Text on accent: white on light themes, near black on dark ones. */
  onAccent: string;
};

/** One colour set per theme. The loader picks between them with light-dark(), following the host's color-scheme. */
export type RadarSweepLoaderPalette = { light: RadarSweepLoaderColors; dark: RadarSweepLoaderColors };

/**
 * Two presets, both invented displays rather than any real military,
 * air-traffic or product radar. Every text and control pair is AA on both
 * themes. Spread one to customise: `{ ...RADAR_SWEEP_LOADER_PALETTES.phosphor, dark: { ... } }`.
 */
export const RADAR_SWEEP_LOADER_PALETTES = {
  phosphor: {
    light: { console: "#0f1a14", scope: "#07120c", ring: "#24553a", sweep: "#3ddc84", lock: "#7cf5a8", ghost: "#4f8f68", text: "#c9eed7", accent: "#17703f", onAccent: "#ffffff" },
    dark: { console: "#0b130e", scope: "#040b07", ring: "#1f4a32", sweep: "#3ddc84", lock: "#7cf5a8", ghost: "#4a8862", text: "#c4ead2", accent: "#6fe3a0", onAccent: "#0a0a0a" },
  },
  deep: {
    light: { console: "#0e1630", scope: "#060c20", ring: "#263d78", sweep: "#5aa9ff", lock: "#9fd0ff", ghost: "#4d6aa8", text: "#cfdcfb", accent: "#2649b8", onAccent: "#ffffff" },
    dark: { console: "#0a1026", scope: "#040817", ring: "#22386e", sweep: "#5aa9ff", lock: "#a6d4ff", ghost: "#4863a0", text: "#c9d6f8", accent: "#9cc0ff", onAccent: "#0a0a0a" },
  },
} as const satisfies Record<string, RadarSweepLoaderPalette>;

export type RadarSweepLoaderPaletteName = keyof typeof RADAR_SWEEP_LOADER_PALETTES;

export type RadarSweepLoaderProps = {
  /** The run, and the only state. The host replaces the array whenever a step changes. */
  steps: LoaderStep[];
  /** The heading, and the progressbar's accessible name. */
  title: string;
  /** Heading level of the title. Default 2. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** A preset name or your own light and dark colours. Default "phosphor". */
  palette?: RadarSweepLoaderPaletteName | RadarSweepLoaderPalette;
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
  /** The words on the display. Default English. */
  marks?: Partial<RadarSweepMarks>;
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
  /** Play the synthesized console sounds: a beep for a new contact, a tick each turn over a low hum, the lock tone, launch and impact of an intercept, a miss, a warning and a chime. Off by default; audio starts only after a key or pointer press on the page, and is heard only while the loader is hovered, focused or last tapped. */
  sound?: boolean;
  /** Class on the root section. */
  className?: string;
  /** Style on the root section. */
  style?: CSSProperties;
};

/** The words on the display. Decoration only: the log and the hidden step list carry the meaning. */
export type RadarSweepMarks = {
  /** A contact whose step is done and whose intercept has landed. Default "Cleared". */
  locked: string;
  /** While the intercept is in flight. Default "Engaging". */
  engaging: string;
  searching: string;
  lost: string;
  skipped: string;
  waiting: string;
  /** A contact whose step is done, until the beam crosses it. Default "Confirming". */
  confirming: string;
  status: (locked: number, total: number) => string;
  all: string;
};

const RADAR_MARKS: RadarSweepMarks = {
  locked: "Cleared",
  engaging: "Engaging",
  searching: "Searching",
  lost: "Lost",
  skipped: "Skipped",
  waiting: "Waiting",
  confirming: "Confirming",
  status: (l, t) => `${l} of ${t} targets cleared`,
  all: "Area clear",
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

/** A stable 0 to 1 number from a string, so a step's random look survives re-renders and remounts. */
function loaderSeed(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

const loaderKebab = (key: string) => key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/** A palette as custom properties on the root, each one light-dark(<light>, <dark>). */
function loaderPaletteVars(light: Record<string, string>, dark: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(light)) out[`--bz-rsl-${loaderKebab(key)}`] = `light-dark(${light[key]}, ${dark[key] ?? light[key]})`;
  return out;
}

/** Escapes text for the arena's hand-built markup. */
const loaderEsc = (s: string) => s.replace(/[&<>"]/g, (c) => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;"));

const LOADER_SVG_NS = "http://www.w3.org/2000/svg";

/** An SVG element with its attributes, for the arena drivers. */
function loaderSvg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent?: Element): SVGElementTagNameMap[K] {
  const el = document.createElementNS(LOADER_SVG_NS, tag);
  for (const k of Object.keys(attrs)) el.setAttribute(k, String(attrs[k]));
  if (parent) parent.appendChild(el);
  return el;
}

/* 16 x 16 line glyphs in currentColor. */
const LOADER_GLYPHS = {
  done: "M3 8.5l3.2 3.2L13 4.8",
  skipped: "M3.5 8h9",
  retry: "M12.6 6.2A5 5 0 1 0 13 9.6M13 2.8v3.6H9.4",
  finish: "M4 14V2.6M4 3h8l-2 3 2 3H4",
  stop: "M4.5 4.5h7v7h-7z",
  cross: "M4 4l8 8M12 4l-8 8",
  pause: "M5.5 3.5v9M10.5 3.5v9",
  cursor: "M6 3.5L10.5 8 6 12.5",
  clock: "M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM8 5v3.2l2.2 1.4",
} as const;

type LoaderGlyphName = keyof typeof LOADER_GLYPHS;

function LoaderGlyph({ name }: { name: LoaderGlyphName }) {
  return (
    <svg className="bz-rsl-g" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={LOADER_GLYPHS[name]} />
    </svg>
  );
}

/* ---------------- end shared: timing constants and helpers ---------------- */

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
    titleId: `bz-rsl-title-${uid}`,
    detailsId: `bz-rsl-details-${uid}`,
    hatchId: `bz-rsl-hatch-${uid}`,
  };
}

type LoaderApi = ReturnType<typeof useLoader>;

/* ---------------- end shared: engine ---------------- */

/* ---------------- sound ---------------- */

/*
 * Every cue is synthesized with Web Audio, so the file carries no assets.
 * Nothing plays until `sound` is on and the visitor has pressed a key or a
 * pointer somewhere on the page (browsers block audio before a gesture
 * anyway). Even then the loader is heard only while it is in use: while the
 * pointer is over it, while focus is inside it, or, on a touch screen, from a
 * tap inside it until the next tap outside it or focus leaving it. Out of use,
 * cues are skipped rather than queued, and any bed fades out over 150ms. Each cue has a minimum gap so quick bursts never pile into noise,
 * and everything runs through one quiet master gain and a limiter. Each cue
 * that plays also fires a `bz-loader-sound` event on the loader's root, with
 * the cue name as `detail`, for tests.
 */
type LoaderVoice = (a: AudioContext, out: AudioNode, t: number, noise: AudioBuffer) => void;

function loaderTone(a: AudioContext, out: AudioNode, t: number, o: { type?: OscillatorType; f: number; f2?: number; dur: number; gain: number; attack?: number; q?: number; lp?: number }) {
  const osc = a.createOscillator();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.f, t);
  if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + o.dur);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.gain, t + (o.attack ?? 0.005));
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  let node: AudioNode = osc;
  if (o.lp) {
    const f = a.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = o.lp;
    f.Q.value = o.q ?? 0.7;
    osc.connect(f);
    node = f;
  }
  node.connect(g);
  g.connect(out);
  osc.start(t);
  osc.stop(t + o.dur + 0.05);
}

function loaderNoise(a: AudioContext, out: AudioNode, t: number, noise: AudioBuffer, o: { type: BiquadFilterType; f: number; f2?: number; q?: number; dur: number; gain: number; attack?: number }) {
  const src = a.createBufferSource();
  src.buffer = noise;
  const f = a.createBiquadFilter();
  f.type = o.type;
  f.frequency.setValueAtTime(o.f, t);
  if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + o.dur);
  f.Q.value = o.q ?? 0.8;
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.gain, t + (o.attack ?? 0.004));
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  src.connect(f);
  f.connect(g);
  g.connect(out);
  src.start(t, Math.random() * 0.5);
  src.stop(t + o.dur + 0.05);
}

type LoaderSound = {
  play: (cue: string, delayMs?: number) => void;
  /** A continuous bed (the radar's hum). Started and stopped, never stacked. */
  bed: (on: boolean) => void;
  setEnabled: (on: boolean) => void;
  /** Whether the loader is in use (hovered, focused or last tapped). Out of use, nothing is heard. */
  setActive: (on: boolean) => void;
  destroy: () => void;
};

function createLoaderSound(root: () => HTMLElement | null, voices: Record<string, { gap: number; voice: LoaderVoice }>, bedVoice?: (a: AudioContext, out: AudioNode) => () => void): LoaderSound {
  let enabled = false;
  let unlocked = false;
  let active = false;
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  let bedStop: (() => void) | null = null;
  let bedWanted = false;
  const last: Record<string, number> = {};
  const unlock = () => {
    unlocked = true;
    if (enabled) ensure();
    if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
    syncBed();
  };
  const listen = (on: boolean) => {
    if (typeof window === "undefined") return;
    const fn = on ? window.addEventListener : window.removeEventListener;
    fn.call(window, "pointerdown", unlock, true);
    fn.call(window, "keydown", unlock, true);
  };
  function ensure() {
    if (ctx || typeof window === "undefined") return ctx;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -18;
    lim.ratio.value = 8;
    master = ctx.createGain();
    master.gain.value = active ? 0.55 : 0.0001;
    master.connect(lim);
    lim.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }
  function syncBed() {
    const want = bedWanted && enabled && unlocked && !!bedVoice;
    if (want && !bedStop && ensure() && ctx && master) bedStop = bedVoice!(ctx, master);
    if (!want && bedStop) {
      bedStop();
      bedStop = null;
    }
  }
  listen(true);
  return {
    play(cue, delayMs = 0) {
      const v = voices[cue];
      if (!v || !enabled || !unlocked || !active) return;
      const now = loaderNow() + delayMs;
      if (now - (last[cue] ?? -1e9) < v.gap) return;
      last[cue] = now;
      const a = ensure();
      if (!a || !master || !noise || a.state !== "running") return;
      v.voice(a, master, a.currentTime + delayMs / 1000 + 0.01, noise);
      const el = root();
      if (el) window.setTimeout(() => el.dispatchEvent(new CustomEvent("bz-loader-sound", { detail: cue })), delayMs);
    },
    bed(on) {
      bedWanted = on;
      syncBed();
    },
    setActive(on) {
      if (active === on) return;
      active = on;
      if (ctx && master) {
        const t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), t);
        master.gain.linearRampToValueAtTime(on ? 0.55 : 0.0001, t + 0.15);
      }
    },
    setEnabled(on) {
      enabled = on;
      if (on && unlocked) ensure()?.resume().catch(() => {});
      syncBed();
    },
    destroy() {
      listen(false);
      bedWanted = false;
      syncBed();
      ctx?.close().catch(() => {});
      ctx = null;
    },
  };
}

/**
 * Tells the sound whether the loader is in use. A mouse or a pen counts while
 * it is over the loader; focus counts while it is anywhere inside. A touch
 * screen has no hover, so a tap inside counts until the next tap outside, or
 * until focus leaves.
 */
function useLoaderSoundPresence(rootRef: RefObject<HTMLElement>, soundRef: RefObject<LoaderSound | null>) {
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let hover = false;
    let focus = false;
    let touch = false;
    const sync = () => soundRef.current?.setActive(hover || focus || touch);
    const enter = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      hover = true;
      sync();
    };
    const leave = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      hover = false;
      sync();
    };
    const focusIn = () => {
      focus = true;
      sync();
    };
    const focusOut = (e: FocusEvent) => {
      if (e.relatedTarget instanceof Node && el.contains(e.relatedTarget)) return;
      focus = false;
      touch = false;
      sync();
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      touch = e.target instanceof Node && el.contains(e.target);
      sync();
    };
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("focusin", focusIn);
    el.addEventListener("focusout", focusOut);
    document.addEventListener("pointerdown", down, true);
    hover = el.matches(":hover");
    focus = el.matches(":focus-within");
    sync();
    return () => {
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("focusin", focusIn);
      el.removeEventListener("focusout", focusOut);
      document.removeEventListener("pointerdown", down, true);
      soundRef.current?.setActive(false);
    };
  }, [rootRef, soundRef]);
}

/* ---------------- end sound ---------------- */

/* ---------------- shared: chassis ---------------- */

/** The structure for screen readers: every step and its state. */
function LoaderStepList({ api }: { api: LoaderApi }) {
  return (
    <ol className="bz-rsl-sr" aria-busy={api.view.phase === "run" ? "true" : "false"}>
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
      className="bz-rsl-plate"
      role="progressbar"
      aria-labelledby={api.titleId}
      aria-valuemin={0}
      aria-valuemax={Math.max(1, api.n)}
      aria-valuenow={api.settled}
      aria-valuetext={api.valueText}
      data-state={plate.state}
      data-gone={plate.gone ? "true" : "false"}
    >
      <div className="bz-rsl-plate-in" key={api.view.frontKey}>
        <div className="bz-rsl-plate-top">
          <span className="bz-rsl-plate-label">{plate.label}</span>
          <span className="bz-rsl-badges">
            {plate.attempt ? <span className="bz-rsl-tag">{labels.attempt(plate.attempt)}</span> : null}
            {plate.failed ? (
              <span className="bz-rsl-failed">
                <LoaderGlyph name="cross" />
                {labels.failed}
              </span>
            ) : null}
          </span>
        </div>
        <div className="bz-rsl-plate-row">
          <span className="bz-rsl-bar" data-indet={plate.indet ? "true" : "false"}>
            <span className="bz-rsl-fill" style={{ width: `${Math.round(plate.p * 1000) / 10}%` }} />
            <svg className="bz-rsl-hatch" aria-hidden="true" focusable="false">
              <defs>
                <pattern id={api.hatchId} width="8" height="8" patternUnits="userSpaceOnUse">
                  <path d="M-2 2l4-4M0 8l8-8M6 10l4-4" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#${api.hatchId})`} />
            </svg>
          </span>
          <span className="bz-rsl-count" title={plate.count || undefined}>
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
    <div id={api.detailsId} className="bz-rsl-sheet" data-panel="error" hidden={!open}>
      <div
        ref={scrollRef}
        className="bz-rsl-sheet-in"
        role="region"
        aria-label={labels.details}
        tabIndex={open && scroll.over ? 0 : undefined}
        data-more={scroll.more ? "true" : undefined}
      >
        <p className="bz-rsl-sheet-head" aria-hidden="true">
          {labels.details}
        </p>
        <p className="bz-rsl-details">{view.details}</p>
        {view.detailMore ? <p className="bz-rsl-more-detail">{view.detailMore}</p> : null}
      </div>
    </div>
  );
}

const LOADER_LINE_GLYPH: Record<LoaderLineKind, LoaderGlyphName> = { done: "done", skipped: "skipped", retry: "retry", finish: "finish", stop: "stop" };

/** The message box: narration, the error menu and the results share one cell, so it never changes height. */
function LoaderBox({ api }: { api: LoaderApi }) {
  const { view, labels } = api;
  const errorOn = view.phase === "error";
  const resultsOn = view.results;
  const lastLine = view.lines.length ? view.lines[view.lines.length - 1].text : "";
  const errTextRef = useRef<HTMLDivElement>(null);
  const errScroll = useLoaderOverflow(errTextRef, view.alert);
  return (
    <div className="bz-rsl-box">
      <div className="bz-rsl-panels">
        <div className="bz-rsl-panel bz-rsl-talk">
          <div ref={api.logRef} className="bz-rsl-log" role="log" aria-label={labels.narration} tabIndex={errorOn || resultsOn ? -1 : 0}>
            {view.lines.map((line, k) => (
              <p key={line.key} className="bz-rsl-line" data-kind={line.kind} data-last={k === view.lines.length - 1 ? "true" : undefined}>
                <LoaderGlyph name={LOADER_LINE_GLYPH[line.kind]} />
                <span>{line.text}</span>
              </p>
            ))}
          </div>
          {view.lines.length ? null : (
            <p className="bz-rsl-ph" aria-hidden="true">
              {api.placeholder}
            </p>
          )}
        </div>
        <div className="bz-rsl-panel bz-rsl-err" data-panel="error" data-on={errorOn ? "true" : "false"}>
          {/* Only the message lives here; the details open as a card over the arena. A message
              too long for the box scrolls, and only then joins the tab order with a name. */}
          <div
            ref={errTextRef}
            className="bz-rsl-err-text"
            role={errScroll.over ? "region" : undefined}
            aria-label={errScroll.over ? labels.errorMessage : undefined}
            tabIndex={errScroll.over && errorOn ? 0 : undefined}
            data-more={errScroll.more ? "true" : undefined}
          >
            <div className="bz-rsl-alert" role="alert">
              {view.alert ? (
                <>
                  <LoaderGlyph name="cross" />
                  <span>{view.alert}</span>
                </>
              ) : null}
            </div>
          </div>
          <div ref={api.menuRef} className="bz-rsl-menu" role="group" aria-label={labels.menu} onKeyDown={api.onMenuKey}>
            {api.commands.map((c, k) => (
              <button
                key={c.key}
                type="button"
                className={`bz-rsl-btn${c.primary ? " bz-rsl-primary" : ""}`}
                tabIndex={k === api.cursor ? 0 : -1}
                data-cursor={k === api.cursor ? "true" : undefined}
                aria-expanded={c.key === "details" ? c.expanded : undefined}
                aria-controls={c.key === "details" ? api.detailsId : undefined}
                onFocus={() => api.setCursor(k)}
                onClick={c.run}
              >
                {c.label}
                {c.sr ? <span className="bz-rsl-sr">{c.sr}</span> : null}
              </button>
            ))}
          </div>
        </div>
        <div className="bz-rsl-panel bz-rsl-res" data-on={resultsOn ? "true" : "false"}>
          <p className="bz-rsl-res-line" aria-hidden="true">
            {resultsOn ? lastLine : ""}
          </p>
          <dl className="bz-rsl-tiles">
            {view.tiles.map((t) => (
              <div className="bz-rsl-tile" key={t.label}>
                <dt>{t.label}</dt>
                <dd>
                  <span className="bz-rsl-num" aria-hidden="true">
                    {loaderTileText(t, api.countT)}
                  </span>
                  <span className="bz-rsl-sr">{loaderTileText(t, 1)}</span>
                  {t.sub ? (
                    <span className="bz-rsl-sub" title={`${t.sub}${t.more ?? ""}`}>
                      {t.sub}
                      {t.more ? <span className="bz-rsl-sr">{t.more}</span> : null}
                    </span>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="bz-rsl-foot">
        <p className="bz-rsl-meta" aria-hidden="true">
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
        <div className="bz-rsl-tools">
          <button type="button" className="bz-rsl-btn bz-rsl-toy" aria-pressed={api.paused} data-hide={api.reduced ? "true" : undefined} onClick={api.togglePause}>
            <LoaderGlyph name="pause" />
            {labels.pauseMotion}
          </button>
          {api.props.onContinue ? (
            <button
              ref={api.continueRef}
              type="button"
              className="bz-rsl-btn bz-rsl-primary bz-rsl-continue"
              data-on={view.done ? "true" : "false"}
              onClick={() => api.props.onContinue?.()}
            >
              {labels.continue}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* The chassis: the frame, the progress slip, the message box and the footer. The arena styles its own art. */
const LOADER_CSS = `
.bz-rsl{container-type:inline-size;display:block;width:100%;min-width:0;
--bz-rsl-ink:light-dark(var(--bz-ink,#0a0a0a),var(--bz-void-ink,#ffffff));
--bz-rsl-muted:light-dark(var(--bz-ink-muted,#4a4a4c),rgba(255,255,255,0.8));
--bz-rsl-panel:light-dark(var(--bz-paper,#ffffff),var(--bz-void-raised,#1a1a1a));
--bz-rsl-track:light-dark(var(--bz-line-opaque,#f0f0f0),#313131);
--bz-rsl-danger:light-dark(var(--bz-danger,#b91c1c),#fca5a5);
--bz-rsl-danger-mark:light-dark(#dc2626,#f87171);
--bz-rsl-success:light-dark(var(--bz-emerald,#047857),var(--bz-emerald-on-void,#34d399));
--bz-rsl-focus:light-dark(var(--bz-focus-ring,#912c22),var(--bz-focus-ring-void,#ffffff));
--bz-rsl-hairline:light-dark(rgba(10,10,10,0.13),rgba(255,255,255,0.16));
--bz-rsl-edge:light-dark(rgba(10,10,10,0.55),rgba(255,255,255,0.5));
--bz-rsl-idle:light-dark(#8a8a8e,#8c8c8c);
--bz-rsl-fast:var(--bz-duration-fast,150ms);
--bz-rsl-base:var(--bz-duration-base,300ms);
--bz-rsl-ease:var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1));
--bz-rsl-beat:var(--bz-duration-beat,2.4s);
--bz-rsl-sans:var(--bz-font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);
--bz-rsl-mono:var(--bz-font-mono,ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace);
--bz-rsl-serif:ui-serif,Georgia,Cambria,"Times New Roman",serif;
--bz-rsl-accent-ink:var(--bz-rsl-accent);
--bz-rsl-face:var(--bz-rsl-sans)}
.bz-rsl *,.bz-rsl *::before,.bz-rsl *::after{box-sizing:border-box}
.bz-rsl-in{position:relative;display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto auto auto;padding:16px;border:1px solid var(--bz-rsl-hairline);border-radius:16px;background:var(--bz-rsl-panel);color:var(--bz-rsl-ink);font-family:var(--bz-rsl-sans);font-size:15px;line-height:1.5;text-align:left}
.bz-rsl-sr{position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}
.bz-rsl-title{grid-area:1/1;margin:0 0 10px;font-size:15px;font-weight:600;line-height:21px;color:var(--bz-rsl-ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bz-rsl-title:focus{outline:none}
.bz-rsl-title:focus-visible{outline:2px solid var(--bz-rsl-focus);outline-offset:2px}
.bz-rsl-stage{grid-area:2/1;position:relative;margin:0;border-radius:12px;overflow:hidden;border:1px solid var(--bz-rsl-hairline)}
.bz-rsl-arena{position:relative;overflow:hidden}
.bz-rsl-art{position:absolute;inset:0}
.bz-rsl-box{grid-area:3/1}
.bz-rsl-g{display:block;flex:none}

.bz-rsl-plate{position:absolute;z-index:4;padding:7px 12px 9px 16px;border:1px solid var(--bz-rsl-edge);border-radius:10px;background:var(--bz-rsl-panel);color:var(--bz-rsl-ink);overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.08)}
.bz-rsl-plate::before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;background:var(--bz-rsl-accent)}
.bz-rsl-plate[data-state="pending"]::before{background:var(--bz-rsl-idle)}
.bz-rsl-plate[data-state="error"]::before{background:var(--bz-rsl-danger-mark)}
.bz-rsl-plate[data-gone="true"]{position:absolute!important;width:1px!important;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);border:0}
.bz-rsl-plate-in{animation:bz-rsl-fade var(--bz-rsl-fast) linear}
.bz-rsl-plate-top{display:flex;align-items:center;gap:2px 8px;min-height:22px}
.bz-rsl-plate-label{flex:1 1 auto;min-width:0;font-size:14px;font-weight:600;line-height:20px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bz-rsl-badges{display:inline-flex;flex:none;align-items:center;gap:6px}
.bz-rsl-badges:empty{display:none}
.bz-rsl-tag{flex:none;padding:2px 7px;border-radius:999px;background:var(--bz-rsl-accent);color:var(--bz-rsl-on-accent);font:700 11px/1.3 var(--bz-rsl-mono);white-space:nowrap}
.bz-rsl-failed{flex:none;display:inline-flex;align-items:center;gap:4px;color:var(--bz-rsl-danger);font-size:13px;font-weight:700;line-height:1}
.bz-rsl-failed .bz-rsl-g{width:13px;height:13px;color:var(--bz-rsl-danger-mark)}
.bz-rsl-plate-row{display:flex;align-items:center;gap:4px 10px;margin-top:6px}
.bz-rsl-bar{position:relative;flex:1 1 56px;min-width:56px;height:8px;overflow:hidden;border-radius:999px;background:var(--bz-rsl-track);box-shadow:inset 0 0 0 1px var(--bz-rsl-hairline)}
.bz-rsl-fill{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:var(--bz-rsl-accent);transition:width var(--bz-rsl-base) var(--bz-rsl-ease)}
.bz-rsl-hatch{position:absolute;top:0;left:-8px;width:calc(100% + 8px);height:100%;display:none;color:var(--bz-rsl-accent)}
.bz-rsl-hatch path{fill:none;stroke:currentColor;stroke-width:2.5}
.bz-rsl-bar[data-indet="true"] .bz-rsl-fill{display:none}
.bz-rsl-bar[data-indet="true"] .bz-rsl-hatch{display:block;animation:bz-rsl-march 900ms linear infinite}
.bz-rsl-count{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;font:500 12px/16px var(--bz-rsl-mono);color:var(--bz-rsl-muted);white-space:nowrap;font-variant-numeric:tabular-nums}
@keyframes bz-rsl-march{from{transform:translateX(0)}to{transform:translateX(8px)}}
@keyframes bz-rsl-fade{from{opacity:0}to{opacity:1}}

.bz-rsl-box{margin-top:12px;padding:14px 18px 12px;border:1px solid var(--bz-rsl-hairline);border-radius:12px;background:var(--bz-rsl-panel)}
.bz-rsl-panels{display:grid;height:108px}
.bz-rsl-panel{grid-area:1/1;min-width:0;min-height:0;background:var(--bz-rsl-panel)}
.bz-rsl-talk{position:relative}
.bz-rsl-err,.bz-rsl-res{z-index:1;visibility:hidden}
.bz-rsl-err[data-on="true"],.bz-rsl-res[data-on="true"]{visibility:visible}
.bz-rsl-log{position:relative;height:96px;overflow-y:auto;scrollbar-width:none;overscroll-behavior:contain;font-size:15px;line-height:24px}
.bz-rsl-log::-webkit-scrollbar{display:none}
.bz-rsl-log:focus{outline:none}
.bz-rsl-log:focus-visible{outline:2px solid var(--bz-rsl-focus);outline-offset:2px}
.bz-rsl-line{display:flex;gap:8px;margin:0;color:var(--bz-rsl-muted);font-size:14px}
.bz-rsl-line[data-last="true"]{color:var(--bz-rsl-ink);font-size:16px;font-weight:500}
.bz-rsl-line>.bz-rsl-g{width:15px;height:15px;margin-top:4.5px;visibility:hidden}
.bz-rsl-line[data-last="true"]>.bz-rsl-g{visibility:visible}
.bz-rsl-line[data-kind="done"]>.bz-rsl-g{color:var(--bz-rsl-success)}
.bz-rsl-line[data-kind="skipped"]>.bz-rsl-g,.bz-rsl-line[data-kind="stop"]>.bz-rsl-g{color:var(--bz-rsl-muted)}
.bz-rsl-line[data-kind="retry"]>.bz-rsl-g,.bz-rsl-line[data-kind="finish"]>.bz-rsl-g{color:var(--bz-rsl-accent-ink)}
.bz-rsl-ph{position:absolute;left:0;top:0;margin:0;font-size:15px;line-height:24px;color:var(--bz-rsl-muted)}

.bz-rsl-err{display:grid;grid-template-rows:minmax(0,1fr) auto;row-gap:10px}
.bz-rsl-err-text,.bz-rsl-sheet-in{min-height:0;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:var(--bz-rsl-muted) transparent}
.bz-rsl-err-text:focus,.bz-rsl-sheet-in:focus{outline:none}
.bz-rsl-err-text:focus-visible,.bz-rsl-sheet-in:focus-visible{outline:2px solid var(--bz-rsl-focus);outline-offset:-2px}
.bz-rsl-err-text[data-more="true"]::after,.bz-rsl-sheet-in[data-more="true"]::after{content:"";position:sticky;bottom:0;display:block;height:20px;margin-top:-20px;background:linear-gradient(to bottom,transparent,var(--bz-rsl-panel));pointer-events:none}
.bz-rsl-alert{visibility:visible;display:flex;gap:10px;color:var(--bz-rsl-ink);font-size:15px;font-weight:500;line-height:24px}
.bz-rsl-alert>.bz-rsl-g{width:15px;height:15px;margin-top:4.5px;color:var(--bz-rsl-danger-mark)}

.bz-rsl-sheet{position:absolute;grid-area:2/1/3/2;z-index:5;top:10px;left:10px;right:10px;display:flex;max-height:calc(100% - 20px);border:1px solid var(--bz-rsl-edge);border-radius:10px;background:var(--bz-rsl-panel);overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.18)}
.bz-rsl-sheet[hidden]{display:none}
.bz-rsl-sheet-in{flex:1 1 auto;padding:10px 14px 12px}
.bz-rsl-sheet-head{margin:0 0 4px;font:700 11px/14px var(--bz-rsl-mono);letter-spacing:0.08em;text-transform:uppercase;color:var(--bz-rsl-muted)}
.bz-rsl-details{margin:0;font:500 12px/18px var(--bz-rsl-mono);color:var(--bz-rsl-ink);overflow-wrap:anywhere}
.bz-rsl-more-detail{margin:6px 0 0;font-size:13px;line-height:18px;color:var(--bz-rsl-muted)}
.bz-rsl-menu{display:flex;flex-wrap:wrap;gap:8px}

.bz-rsl-res{display:flex;flex-direction:column;gap:8px;overflow:hidden}
.bz-rsl-res-line{flex:none;margin:0;font-size:15px;font-weight:500;line-height:22px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.bz-rsl-tiles{display:flex;flex-wrap:wrap;align-content:flex-start;gap:8px 12px;min-height:0;margin:0;overflow-y:auto}
.bz-rsl-tile{flex:1 1 auto;min-width:0;padding-top:6px;border-top:2px solid var(--bz-rsl-ink)}
.bz-rsl-tile dt{font:700 11px/14px var(--bz-rsl-mono);letter-spacing:0.08em;text-transform:uppercase;color:var(--bz-rsl-muted)}
.bz-rsl-tile dd{margin:2px 0 0}
.bz-rsl-num{display:block;font:700 18px/24px var(--bz-rsl-face);color:var(--bz-rsl-ink);font-variant-numeric:tabular-nums;white-space:nowrap}
.bz-rsl-sub{width:0;min-width:100%;font-size:12px;line-height:16px;color:var(--bz-rsl-muted);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}

.bz-rsl-foot{display:flex;align-items:center;gap:8px 16px;margin-top:12px}
.bz-rsl-meta{flex:1 1 auto;min-width:0;height:40px;margin:0;overflow:hidden;font-size:13px;line-height:20px;color:var(--bz-rsl-muted);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.bz-rsl-meta b{font-weight:600;color:var(--bz-rsl-ink)}
.bz-rsl-meta .bz-rsl-g{display:inline-block;width:13px;height:13px;margin-right:6px;vertical-align:-2px;color:var(--bz-rsl-accent-ink)}
.bz-rsl-tools{display:flex;flex:none;gap:8px}

.bz-rsl-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-width:48px;min-height:48px;margin:0;padding:0 20px;border:1.5px solid var(--bz-rsl-edge);border-radius:999px;background:var(--bz-rsl-panel);color:var(--bz-rsl-ink);font:600 14px/1.2 var(--bz-rsl-sans);text-align:left;cursor:pointer;transition:background-color var(--bz-rsl-fast) var(--bz-rsl-ease),transform var(--bz-rsl-fast) var(--bz-rsl-ease)}
.bz-rsl-btn .bz-rsl-g{width:14px;height:14px}
.bz-rsl-btn:focus{outline:none}
.bz-rsl-btn:focus-visible{outline:2px solid var(--bz-rsl-focus);outline-offset:2px;background:var(--bz-rsl-track)}
@media (hover:hover){.bz-rsl-btn:hover{background:var(--bz-rsl-track)}}
.bz-rsl[data-motion="on"] .bz-rsl-btn:active{transform:scale(0.97)}
.bz-rsl-primary{border-color:var(--bz-rsl-accent);background:var(--bz-rsl-accent);color:var(--bz-rsl-on-accent)}
.bz-rsl-primary:focus-visible{background:var(--bz-rsl-accent);box-shadow:inset 0 0 0 2px var(--bz-rsl-panel)}
@media (hover:hover){.bz-rsl-primary:hover{background:var(--bz-rsl-accent);box-shadow:inset 0 0 0 2px var(--bz-rsl-panel)}}
.bz-rsl-toy{padding:0 16px;font-size:13.5px}
.bz-rsl-toy[aria-pressed="true"]{border-color:var(--bz-rsl-ink);background:var(--bz-rsl-ink);color:var(--bz-rsl-panel)}
.bz-rsl-toy[data-hide="true"]{visibility:hidden}
.bz-rsl-continue{min-width:112px;visibility:hidden}
.bz-rsl-continue[data-on="true"]{visibility:visible}

@container (max-width:559px){
.bz-rsl-in{padding:12px}
.bz-rsl-box{padding:12px 12px 10px}
.bz-rsl-panels{height:204px}
.bz-rsl-log{height:188px}
.bz-rsl-plate-row{flex-wrap:wrap}
.bz-rsl-bar{flex-basis:100%}
.bz-rsl-plate-top{padding-right:0}
.bz-rsl-menu{display:grid;grid-template-columns:1fr 1fr}
.bz-rsl-tile{flex-basis:40%}
.bz-rsl-sub{display:block;white-space:nowrap;text-overflow:ellipsis}
.bz-rsl-res-line{-webkit-line-clamp:2}
.bz-rsl-foot{flex-wrap:wrap}
.bz-rsl-meta{flex:1 1 100%}
.bz-rsl-tools{flex:1 1 100%}
}

.bz-rsl-veil{position:absolute;inset:0;z-index:3;background:var(--bz-rsl-panel);opacity:0;visibility:hidden;pointer-events:none;transition:opacity var(--bz-rsl-base) var(--bz-rsl-ease),visibility 0s linear var(--bz-rsl-base)}
.bz-rsl[data-phase="stopped"] .bz-rsl-veil{opacity:0.45;visibility:visible;transition:opacity var(--bz-rsl-base) var(--bz-rsl-ease)}
.bz-rsl[data-motion="off"] *,.bz-rsl[data-motion="off"] *::before,.bz-rsl[data-motion="off"] *::after{animation:none!important;transition:none!important}
.bz-rsl[data-motion="off"] .bz-rsl-btn{transition:background-color var(--bz-rsl-fast) linear!important}
.bz-rsl[data-running="false"] *,.bz-rsl[data-running="false"] *::before,.bz-rsl[data-running="false"] *::after{animation-play-state:paused!important}
`;

/* ---------------- end shared: chassis ---------------- */

/* ---------------- Radar arena ---------------- */

/*
 * Heading-up, relative motion, the way a ship's or a submarine's radar shows
 * it: own ship sits at the centre with its heading line pointing up, and the
 * world slides down the screen past it. Range rings stay put, because they
 * are measured from own ship; the coast, the buoys and the clutter move.
 */
const RADAR_SPEED = 0.045; // scope radii per second: the platform's own way, decoration only
const RADAR_LEAD = 0.4; // how far ahead a contact still is when its step is done
const RADAR_MIN_R = 0.42; // contacts keep this far from own ship, so the centre stays clear
const RADAR_SCALE = 0.64; // scope radii per unit of run
const RADAR_PERIOD = 2.6; // the world strip repeats after this many radii

type RadarPos = { x: number; y: number; a: number; r: number };

/**
 * Where contact i sits when the run is `p` of the way through (0 to 1). Steps
 * start ahead in order and close in as the run advances, so a contact is
 * alongside exactly when the run has reached it; finished ones carry on down
 * past own ship and settle astern, all five still on the screen at the end.
 */
function radarContact(i: number, n: number, flip: number, lat: number, p: number): RadarPos {
  const ahead = (i + 1) / Math.max(1, n) + RADAR_LEAD - p;
  const y = -ahead * RADAR_SCALE;
  let x = (i % 2 ? 1 : -1) * flip * (0.44 + lat * 0.24);
  let yy = y;
  const lim = 0.86;
  if (Math.hypot(x, yy) > lim) x = Math.sign(x) * Math.sqrt(Math.max(0.0025, lim * lim - yy * yy));
  const r0 = Math.hypot(x, yy);
  if (r0 < RADAR_MIN_R) {
    const k = RADAR_MIN_R / Math.max(0.001, r0);
    x *= k;
    yy *= k;
  }
  return { x, y: yy, a: Math.atan2(yy, x), r: Math.hypot(x, yy) };
}

/** A world point's place on screen once the platform has made `drift` radii of way: it scrolls down and wraps. */
const radarScroll = (wy: number, drift: number) => {
  const h = RADAR_PERIOD / 2;
  return ((((wy + drift + h) % RADAR_PERIOD) + RADAR_PERIOD) % RADAR_PERIOD) - h;
};

type RadarState = "waiting" | "hunt" | "lost" | "locked" | "skipped";
type RadarQuirk = "streak" | "flicker";
type RadarShot = { i: number; t0: number; miss: boolean; side: number };
type RadarGhost = { x: number; wy: number; state: "fresh" | "painted" | "gone"; at: number; cycle: number };

const RADAR_TURN = 1400; // one sweep, in ms: news of a contact waits at most this long for the beam
const RADAR_DECAY = 1000; // phosphor afterglow
const RADAR_LAUNCH = 160; // from the lock tone to the launch
const RADAR_FLIGHT = 620; // the intercept's flight; with the collapse after it, under 1.2s a contact

/* The console sounds: a beep for a new contact, a soft tick each turn over a low hum, the lock tone, an intercept's launch and its soft low impact, a miss, a warning and a chime. */
const RADAR_VOICES: Record<string, { gap: number; voice: LoaderVoice }> = {
  lock: {
    gap: 200,
    voice: (a, o, t) => {
      loaderTone(a, o, t, { f: 1320, f2: 1290, dur: 0.32, gain: 0.07, attack: 0.004 });
      loaderTone(a, o, t + 0.18, { f: 1320, f2: 1290, dur: 0.22, gain: 0.02 });
    },
  },
  launch: {
    gap: 120,
    voice: (a, o, t, n) => {
      loaderNoise(a, o, t, n, { type: "bandpass", f: 500, f2: 2600, q: 1.4, dur: 0.34, gain: 0.06, attack: 0.04 });
      loaderTone(a, o, t, { type: "triangle", f: 180, f2: 420, dur: 0.28, gain: 0.025 });
    },
  },
  impact: {
    gap: 120,
    voice: (a, o, t, n) => {
      loaderTone(a, o, t, { f: 92, f2: 38, dur: 0.5, gain: 0.3 });
      loaderNoise(a, o, t, n, { type: "lowpass", f: 520, f2: 160, dur: 0.4, gain: 0.16, attack: 0.004 });
    },
  },
  miss: {
    gap: 300,
    voice: (a, o, t) => loaderTone(a, o, t, { type: "triangle", f: 640, f2: 360, dur: 0.34, gain: 0.05 }),
  },
  tick: {
    gap: 1000,
    voice: (a, o, t, n) => loaderNoise(a, o, t, n, { type: "bandpass", f: 3200, q: 4, dur: 0.035, gain: 0.03 }),
  },
  contact: {
    gap: 300,
    voice: (a, o, t) => {
      loaderTone(a, o, t, { type: "square", f: 880, dur: 0.06, gain: 0.025, lp: 2400 });
      loaderTone(a, o, t + 0.1, { type: "square", f: 880, dur: 0.06, gain: 0.025, lp: 2400 });
    },
  },
  warning: {
    gap: 800,
    voice: (a, o, t) => {
      for (let k = 0; k < 4; k++) loaderTone(a, o, t + k * 0.16, { type: "triangle", f: k % 2 ? 392 : 523, dur: 0.15, gain: 0.07, attack: 0.01 });
    },
  },
  chime: {
    gap: 1500,
    voice: (a, o, t) => {
      [660, 880, 1320].forEach((f, k) => loaderTone(a, o, t + k * 0.12, { f, dur: 1.1 - k * 0.2, gain: 0.07, attack: 0.008 }));
    },
  },
};

function radarHum(a: AudioContext, out: AudioNode) {
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.014, a.currentTime + 0.6);
  g.connect(out);
  const oscs = [58, 116, 174].map((f, k) => {
    const o = a.createOscillator();
    o.frequency.value = f;
    const og = a.createGain();
    og.gain.value = [1, 0.45, 0.15][k];
    o.connect(og);
    og.connect(g);
    o.start();
    return o;
  });
  return () => {
    const t = a.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    oscs.forEach((o) => o.stop(t + 0.45));
  };
}

function createRadarArena(root: HTMLElement, ctx: LoaderArenaCtx, opts: () => { marks: RadarSweepMarks; sound: LoaderSound | null }): LoaderArena {
  const q = <T extends Element>(sel: string) => root.querySelector(sel) as T;
  const screenEl = q<HTMLDivElement>(".bz-rsl-screen");
  const canvas = q<HTMLCanvasElement>(".bz-rsl-canvas");
  const listEl = q<HTMLOListElement>(".bz-rsl-list");
  const statusEl = q<HTMLParagraphElement>(".bz-rsl-status");
  const allEl = q<HTMLDivElement>(".bz-rsl-all");

  let rows: HTMLLIElement[] = [];
  let typeT: number[] = [];
  let lockAt: number[] = [];
  let raf = 0;
  let t0 = loaderNow();
  let lastTurn = -1;
  let quirk: RadarQuirk = "streak";
  let clutter: Array<{ x: number; y: number; s: number; k: number }> = [];
  let land: Array<{ x: number; wy: number; s: number; k: number }> = [];
  let buoys: Array<{ x: number; wy: number; k: number }> = [];
  let ghosts: RadarGhost[] = [];
  let flip = 1;
  let lats: number[] = [];
  let cpos: RadarPos[] = [];
  let shownP = 0;
  let drift = 0;
  let lastAt = 0;
  let readAt = 0;
  let heading = "000";
  let size = 0;
  let dpr = 1;
  let colors: Record<string, string> = {};
  let lastFront = -1;
  let shown: RadarState[] = [];
  let lostAt: number[] = [];
  let hitAt: number[] = [];
  let shots: RadarShot[] = [];
  let splash: { i: number; until: number; miss: boolean } | null = null;
  let chimed = false;
  let prevArm = -1;
  const dataNav = q<HTMLSpanElement>(".bz-rsl-d0");
  const dataTgt = q<HTMLSpanElement>(".bz-rsl-d1");
  const dataNum = q<HTMLSpanElement>(".bz-rsl-d2");

  const M = () => opts().marks;
  const sfx = (cue: string, delay = 0) => opts().sound?.play(cue, delay);
  /** A cue at a later moment of the action, checked for presence when it is due rather than now. */
  const sfxAt = (cue: string, ms: number) => ctx.later(() => sfx(cue), ms);

  /** What the host says now. The screen catches up with it only when the beam crosses the contact. */
  function truthOf(i: number): RadarState {
    const s = ctx.steps()[i];
    if (ctx.vis()[i] === "gone") return s.status === "skipped" ? "skipped" : "locked";
    if (s.status === "error") return "lost";
    if (i === ctx.front() && s.status !== "pending") return "hunt";
    return "waiting";
  }

  /** What the screen shows: success, failure and skips wait for the beam; the rest is immediate. */
  function stateOf(i: number): RadarState {
    return shown[i] ?? truthOf(i);
  }

  const gated = (st: RadarState) => st === "locked" || st === "lost" || st === "skipped";

  /**
   * The beam has just reached news about a contact, and own ship acts on it.
   * A finished step: the lock tone, an intercept launched from own ship, and
   * on arrival a flash, a splash ring and debris as the blip collapses into a
   * cleared mark. A failed step: the same shot, but the contact jinks and the
   * shot runs on past it; the contact turns red. Still or off screen there is
   * no flight: the mark changes at once.
   */
  function reveal(i: number, st: RadarState, now: number, showy: boolean) {
    shown[i] = st;
    const fly = showy && ctx.motionOn();
    const land = RADAR_LAUNCH + RADAR_FLIGHT;
    if (st === "locked") {
      lockAt[i] = now;
      if (!fly) {
        hitAt[i] = -1e9;
        return;
      }
      hitAt[i] = now + land;
      shots.push({ i, t0: now + RADAR_LAUNCH, miss: false, side: i % 2 ? 1 : -1 });
      sfx("lock");
      sfxAt("launch", RADAR_LAUNCH);
      sfxAt("impact", land);
      ctx.later(() => {
        splash = { i, until: loaderNow() + 1600, miss: false };
        typeIn(i);
        syncList();
      }, land);
    } else if (st === "lost") {
      if (!fly) {
        lostAt[i] = now;
        sfx("warning");
        return;
      }
      lostAt[i] = now + land;
      shots.push({ i, t0: now + RADAR_LAUNCH, miss: true, side: i % 2 ? -1 : 1 });
      sfx("lock");
      sfxAt("launch", RADAR_LAUNCH);
      sfxAt("miss", land);
      sfxAt("warning", land + 260);
      ctx.later(() => {
        splash = { i, until: loaderNow() + 1600, miss: true };
        syncList();
      }, land);
    }
  }

  /** Applies everything that does not wait for the beam, or everything when the screen is still. */
  function settle(immediate: boolean) {
    const now = loaderNow();
    let changed = false;
    ctx.steps().forEach((_, i) => {
      const t = truthOf(i);
      if (shown[i] === t) return;
      if (!gated(t)) {
        shown[i] = t;
        changed = true;
      } else if (immediate) {
        reveal(i, t, now, false);
        changed = true;
      }
    });
    if (changed) syncList();
    finish_();
  }

  /** The beam crossed bearings (from, to]: reveal whatever news is waiting there. */
  function sweepReveal(from: number, to: number, now: number) {
    let changed = false;
    ctx.steps().forEach((_, i) => {
      const t = truthOf(i);
      if (shown[i] === t || !gated(t)) return;
      const pos = cpos[i];
      if (!pos) return;
      const a = ((pos.a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const crossed = from <= to ? a > from && a <= to : a > from || a <= to;
      if (crossed) {
        reveal(i, t, now, true);
        changed = true;
      }
    });
    if (changed) syncList();
    finish_();
  }

  /** The end: once the screen has caught up with every contact, the banner and the chime. */
  function finish_() {
    if (ctx.phase() !== "complete" || chimed) return;
    if (ctx.steps().some((_, i) => shown[i] !== truthOf(i))) return;
    const now = loaderNow();
    if (shots.length || hitAt.some((h) => h + 400 > now)) return;
    chimed = true;
    readout();
    allEl.dataset.on = "true";
    screenEl.dataset.tight = "true";
    sfx("chime", 120);
    if (ctx.motionOn()) ctx.anim(allEl, [{ opacity: 0, letterSpacing: "0.5em" }, { opacity: 1, letterSpacing: "0.16em" }], { duration: 600, easing: "cubic-bezier(0.23,1,0.32,1)" });
  }

  function word(st: RadarState) {
    const m = M();
    return st === "locked" ? m.locked : st === "hunt" ? m.searching : st === "lost" ? m.lost : st === "skipped" ? m.skipped : m.waiting;
  }

  function readColors() {
    const cs = getComputedStyle(root);
    const v = (k: string) => cs.getPropertyValue(`--bz-rsl-${k}`).trim();
    // light-dark() resolves only on a colour property, so each one is read through a probe.
    const probe = document.createElement("i");
    probe.style.display = "none";
    root.appendChild(probe);
    const out: Record<string, string> = {};
    for (const k of ["scope", "ring", "sweep", "lock", "ghost", "text", "danger-mark"]) {
      probe.style.color = v(k) || "#0f0";
      out[k] = getComputedStyle(probe).color;
    }
    probe.remove();
    colors = out;
  }

  const rgba = (c: string, a: number) => {
    const m = c.match(/[\d.]+/g);
    if (!m) return c;
    return `rgba(${m[0]},${m[1]},${m[2]},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
  };

  function syncList() {
    rows.forEach((row, i) => {
      const st = stateOf(i);
      const now = loaderNow();
      const engaging = (st === "locked" && now < hitAt[i]) || (st === "lost" && now < lostAt[i]);
      row.dataset.state = engaging ? "hunt" : st;
      const w = row.querySelector<HTMLElement>(".bz-rsl-w");
      if (w) w.textContent = st !== truthOf(i) && gated(truthOf(i)) ? M().confirming : engaging ? M().engaging : word(st);
      const name = row.querySelector<HTMLElement>(".bz-rsl-nm");
      if (name && !typeT[i]) name.textContent = ctx.steps()[i].label;
    });
    const steps = ctx.steps();
    const locked = steps.filter((_, i) => stateOf(i) === "locked" && loaderNow() >= hitAt[i]).length;
    statusEl.textContent = M().status(locked, steps.length);
    allEl.dataset.on = chimed ? "true" : "false";
    screenEl.dataset.tight = chimed ? "true" : "false";
    readout();
    const h = rows[0]?.offsetHeight || 26;
    const fit = Math.max(1, Math.floor((listEl.parentElement?.clientHeight ?? 0) / h));
    const f = Math.min(ctx.front(), rows.length - 1);
    const off = rows.length > fit ? Math.max(0, Math.min(rows.length - fit, f - fit + 2)) : 0;
    listEl.style.transform = `translateY(${-off * h}px)`;
  }

  /** The run's progress as the contacts show it: settled steps in full, the step in play as far as the host says. */
  function runP() {
    const steps = ctx.steps();
    if (!steps.length) return 0;
    if (ctx.phase() === "complete") return 1;
    const vis = ctx.vis();
    let p = 0;
    steps.forEach((s, i) => {
      if (vis[i] === "gone") p += 1;
      else if (i === ctx.front()) p += s.status === "error" ? Math.max(0, Math.min(1, s.progress ?? 0)) : ctx.frontP();
    });
    return Math.min(1, p / steps.length);
  }

  function place(p: number) {
    const n = ctx.steps().length;
    cpos = ctx.steps().map((_, i) => radarContact(i, n, flip, lats[i] ?? 0.5, p));
  }

  /** The CRT data line: own ship's heading and speed, then target, bearing, range and acquisition, in place of a progress card. */
  function readout() {
    const f = ctx.front();
    const s = ctx.steps()[f];
    const ph = ctx.phase();
    dataNav.textContent = `H-UP  HDG ${heading}°  SPD 12.4 KN`;
    const sp = splash && loaderNow() < splash.until ? splash : null;
    if (!s || ph === "complete") {
      dataTgt.textContent = chimed ? M().all.toUpperCase() : sp ? `SPLASH ${String(sp.i + 1).padStart(2, "0")}  TGT CLEARED` : "ENGAGING";
      dataNum.textContent = `${ctx.steps().filter((_, i) => stateOf(i) === "locked" && loaderNow() >= hitAt[i]).length} TARGETS CLEARED`;
      return;
    }
    if (!cpos.length) place(shownP);
    const p = cpos[f] ?? { x: 0, y: -0.5, a: 0, r: 0.5 };
    const brg = String(Math.round((((Math.atan2(p.x, -p.y) * 180) / Math.PI) % 360 + 360) % 360)).padStart(3, "0");
    dataTgt.textContent = sp ? (sp.miss ? `MISS ${String(sp.i + 1).padStart(2, "0")}  TARGET EVADED` : `SPLASH ${String(sp.i + 1).padStart(2, "0")}  TGT CLEARED`) : `TGT ${String(f + 1).padStart(2, "0")} ${s.label.toUpperCase()}`;
    dataTgt.dataset.flash = sp ? (sp.miss ? "miss" : "hit") : "";
    let acq: string;
    if (ph === "stopped") acq = "HOLD";
    else if (s.status === "error") acq = "SIGNAL LOST";
    else if (s.status === "active" && s.progress == null) acq = "ACQ ---";
    else {
      const v = Math.max(0, Math.min(1, ctx.frontP()));
      acq = s.count && s.count > 1 ? `ACQ ${Math.floor(v * s.count).toLocaleString("en-US")}/${s.count.toLocaleString("en-US")}` : `ACQ ${Math.floor(v * 100)}%`;
    }
    dataNum.textContent = `BRG ${brg}  RNG ${(p.r * 6).toFixed(1)}  ${acq}`;
  }

  /* -------- the screen -------- */

  /** How bright a point at angle `ang` is now: lit as the arm passes, then the phosphor fades. */
  function glow(ang: number, now: number) {
    const arm = (((now - t0) / RADAR_TURN) * Math.PI * 2) % (Math.PI * 2);
    let d = arm - ang;
    d = ((d % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const since = (d / (Math.PI * 2)) * RADAR_TURN;
    return Math.exp(-since / RADAR_DECAY);
  }

  function draw(now: number, live: boolean) {
    const c = canvas.getContext("2d");
    if (!c || !size) return;
    const S = size * dpr;
    const R = S / 2;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, S, S);
    c.translate(R, R);
    const turn = Math.floor((now - t0) / RADAR_TURN);
    const armAng = live ? (((now - t0) / RADAR_TURN) * Math.PI * 2) % (Math.PI * 2) : -1;
    const flick = live && quirk === "flicker" && turn % 6 === 4 && (now - t0) % RADAR_TURN < 90 ? 0.55 : 1;
    c.globalAlpha = flick;
    c.save();
    c.beginPath();
    c.arc(0, 0, R * 0.985, 0, Math.PI * 2);
    c.clip();

    // Own way: the world drifts down at a steady speed, and the contacts close in only as the run advances.
    const dt = Math.min(100, Math.max(0, now - (lastAt || now)));
    lastAt = now;
    if (live) drift += (RADAR_SPEED * dt) / 1000;
    const target = runP();
    shownP = live ? Math.min(target, shownP + (target - shownP) * Math.min(1, dt / 380)) : target;
    if (shownP > target) shownP = target;
    place(shownP);
    const ang = (a: number) => ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const crossed = (a: number) => {
      if (!live || prevArm < 0 || armAng < 0) return false;
      const x = ang(a);
      return prevArm <= armAng ? x > prevArm && x <= armAng : x > prevArm || x <= armAng;
    };

    // Range rings and bearing lines, faint and a little soft, as phosphor draws them.
    c.strokeStyle = rgba(colors.ring, 0.9);
    c.lineWidth = 1 * dpr;
    for (const f of [0.25, 0.5, 0.75, 0.98]) {
      c.beginPath();
      c.arc(0, 0, R * f, 0, Math.PI * 2);
      c.stroke();
    }
    c.setLineDash([2 * dpr, 4 * dpr]);
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      c.beginPath();
      c.moveTo(Math.cos(a) * R * 0.1, Math.sin(a) * R * 0.1);
      c.lineTo(Math.cos(a) * R * 0.98, Math.sin(a) * R * 0.98);
      c.stroke();
    }
    c.setLineDash([]);

    // The trail: the arm leaves a fading wedge of glow behind it.
    if (live) {
      const span = Math.PI * 0.62;
      const steps = 36;
      for (let k = 0; k < steps; k++) {
        const a1 = armAng - (k / steps) * span;
        const a0 = armAng - ((k + 1) / steps) * span;
        c.fillStyle = rgba(colors.sweep, 0.2 * Math.pow(1 - k / steps, 2.2));
        c.beginPath();
        c.moveTo(0, 0);
        c.arc(0, 0, R * 0.98, a0, a1);
        c.closePath();
        c.fill();
      }
      c.strokeStyle = rgba(colors.sweep, 0.95);
      c.lineWidth = 1.6 * dpr;
      c.shadowColor = rgba(colors.sweep, 0.9);
      c.shadowBlur = 8 * dpr;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.cos(armAng) * R * 0.98, Math.sin(armAng) * R * 0.98);
      c.stroke();
      c.shadowBlur = 0;
    }

    // The coast and the buoys: land returns slide down past own ship and come back in at the top.
    for (const p of land) {
      const y = radarScroll(p.wy, drift);
      if (p.x * p.x + y * y > 0.95) continue;
      const b = live ? 0.16 + 0.84 * glow(Math.atan2(y, p.x), now) * (0.6 + 0.4 * loaderSeed(`${p.k}:${turn}`)) : 0.45;
      c.fillStyle = rgba(colors.sweep, b * 0.8);
      c.fillRect(p.x * R - p.s * dpr * 0.5, y * R - p.s * dpr * 0.5, p.s * dpr, p.s * dpr);
    }
    for (const p of buoys) {
      const y = radarScroll(p.wy, drift);
      if (p.x * p.x + y * y > 0.92) continue;
      const b = live ? glow(Math.atan2(y, p.x), now) : 0.5;
      if (b < 0.05) continue;
      c.fillStyle = rgba(colors.sweep, 0.25 + b * 0.6);
      c.beginPath();
      c.arc(p.x * R, y * R, 1.6 * dpr, 0, Math.PI * 2);
      c.fill();
    }

    // Sea clutter round own ship, repainted differently every turn, and the wake spreading astern.
    for (const p of clutter) {
      const b = live ? glow(Math.atan2(p.y, p.x), now) * (0.35 + 0.65 * loaderSeed(`${p.k}:${turn}`)) : 0.35;
      if (b < 0.04) continue;
      c.fillStyle = rgba(colors.sweep, b * 0.6);
      c.fillRect(p.x * R - p.s * dpr * 0.5, p.y * R - p.s * dpr * 0.5, p.s * dpr, p.s * dpr);
    }
    for (let k = 0; k < 28; k++) {
      const side = k % 2 ? 1 : -1;
      const u = (((k >> 1) / 14 + drift * 2.2) % 1 + 1) % 1;
      const x = side * (0.015 + u * 0.12) + (loaderSeed(`w${k}`) - 0.5) * 0.02;
      const y = 0.035 + u * 0.32;
      const b = (1 - u) * (live ? 0.25 + 0.5 * glow(Math.atan2(y, x), now) : 0.35) * (0.6 + 0.4 * loaderSeed(`w${k}:${turn}`));
      c.fillStyle = rgba(colors.sweep, b * 0.7);
      c.fillRect(x * R - dpr, y * R - dpr, 2 * dpr, 1.5 * dpr);
    }

    // False echoes ahead: painted by one sweep, gone on the next, the way a ghost return behaves.
    for (const g of ghosts) {
      const y = radarScroll(g.wy, drift);
      const cycle = Math.floor((g.wy + drift + RADAR_PERIOD / 2) / RADAR_PERIOD);
      if (cycle !== g.cycle) {
        g.cycle = cycle;
        g.state = "fresh";
      }
      if (!live || g.x * g.x + y * y > 0.9) continue;
      const a = Math.atan2(y, g.x);
      if (crossed(a)) {
        if (g.state === "fresh" && y < 0) {
          g.state = "painted";
          g.at = now;
        } else if (g.state === "painted" && now - g.at > RADAR_TURN * 0.6) {
          g.state = "gone";
          g.at = now;
        }
      }
      if (g.state === "painted") {
        const b = 0.75 * Math.exp(-(now - g.at) / RADAR_DECAY);
        c.fillStyle = rgba(colors.sweep, b);
        c.beginPath();
        c.ellipse(g.x * R, y * R, 4 * dpr, 2.2 * dpr, a, 0, Math.PI * 2);
        c.fill();
      } else if (g.state === "gone" && now - g.at < 700) {
        const f = (now - g.at) / 700;
        c.fillStyle = rgba(colors.sweep, 0.5 * (1 - f));
        for (let k = 0; k < 7; k++) {
          const t = (k / 7) * Math.PI * 2 + g.x;
          c.fillRect(g.x * R + Math.cos(t) * f * 9 * dpr, y * R + Math.sin(t) * f * 9 * dpr, 1.5 * dpr, 1.5 * dpr);
        }
      }
    }

    // The heading line and own ship.
    c.strokeStyle = rgba(colors.sweep, 0.55);
    c.lineWidth = 1 * dpr;
    c.beginPath();
    c.moveTo(0, -5 * dpr);
    c.lineTo(0, -R * 0.985);
    c.stroke();
    c.strokeStyle = rgba(colors.lock, 0.95);
    c.lineWidth = 1.4 * dpr;
    c.beginPath();
    c.moveTo(0, -6 * dpr);
    c.lineTo(4 * dpr, 4.5 * dpr);
    c.lineTo(0, 2.5 * dpr);
    c.lineTo(-4 * dpr, 4.5 * dpr);
    c.closePath();
    c.stroke();

    const steps = ctx.steps();
    const mono = `700 ${9 * dpr}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    steps.forEach((s, i) => {
      const st0 = stateOf(i);
      const p = cpos[i];
      // In flight: a finished contact still shows as the target being engaged, a failed one as the target still in play.
      const engaging = live && st0 === "locked" && now < hitAt[i];
      const missing = live && st0 === "lost" && now < lostAt[i];
      const st: RadarState = missing ? "hunt" : st0;
      let x = p.x * R;
      let y = p.y * R;
      // The jink: as the shot arrives the contact slips sideways, and the shot runs on past it.
      if (st0 === "lost" && live) {
        const d = now - (lostAt[i] - 140);
        if (d > 0 && d < 520) x += Math.sin((d / 520) * Math.PI) * 7 * dpr * (i % 2 ? 1 : -1);
      }
      const lit = live ? glow(p.a, now) : 0.6;
      const sinceHit = st === "locked" && live ? now - hitAt[i] : 1e9;
      const cleared = st === "locked" && !engaging;
      const floor = st === "locked" ? 0.6 : st === "hunt" ? 0.55 : st === "lost" ? 0.75 : st === "skipped" ? 0.4 : 0.3;
      const b = floor + (1 - floor) * lit;
      const col = st === "lost" ? colors["danger-mark"] : st === "locked" ? colors.lock : st === "waiting" ? colors.ghost : colors.sweep;
      c.shadowColor = rgba(col, 0.9);
      c.shadowBlur = (st === "waiting" ? 3 : 9) * dpr * b;
      if (st === "skipped") {
        c.strokeStyle = rgba(colors.ghost, b);
        c.lineWidth = 1.2 * dpr;
        c.setLineDash([2 * dpr, 2 * dpr]);
        c.beginPath();
        c.arc(x, y, 4 * dpr, 0, Math.PI * 2);
        c.stroke();
        c.setLineDash([]);
      } else if (cleared) {
        // The blip collapses into a small cleared mark that rides astern with the rest of the field.
        const k = sinceHit < 300 ? 1 - sinceHit / 300 : 0;
        if (k > 0) {
          c.fillStyle = rgba(colors.lock, b);
          c.beginPath();
          c.ellipse(x, y, 3.8 * dpr * k, 3 * dpr * k, p.a, 0, Math.PI * 2);
          c.fill();
        }
        const m = 3.4 * dpr;
        c.strokeStyle = rgba(colors.lock, Math.max(0.7, b) * (sinceHit < 300 ? sinceHit / 300 : 1));
        c.lineWidth = 1.5 * dpr;
        c.beginPath();
        c.moveTo(x - m, y - m);
        c.lineTo(x + m, y + m);
        c.moveTo(x + m, y - m);
        c.lineTo(x - m, y + m);
        c.stroke();
      } else {
        c.fillStyle = rgba(col, b);
        c.beginPath();
        c.ellipse(x, y, (st === "waiting" ? 3 : 3.8) * dpr, (st === "waiting" ? 2.3 : 3) * dpr, p.a, 0, Math.PI * 2);
        c.fill();
      }
      c.shadowBlur = 0;
      // The contact in play: a ring that closes exactly as far as the host's progress.
      if ((st === "hunt" && !missing) || st === "lost") {
        const prog = st === "hunt" ? ctx.frontP() : Math.max(0, Math.min(1, s.progress ?? 0));
        const indet = st === "hunt" && s.status === "active" && s.progress == null;
        c.strokeStyle = rgba(col, 0.35);
        c.lineWidth = 1 * dpr;
        c.beginPath();
        c.arc(x, y, 10 * dpr, 0, Math.PI * 2);
        c.stroke();
        c.strokeStyle = rgba(col, 0.95);
        c.lineWidth = 2 * dpr;
        c.beginPath();
        if (indet) {
          const spin = live ? (now / 600) % (Math.PI * 2) : 0;
          c.arc(x, y, 10 * dpr, spin, spin + 0.9);
        } else c.arc(x, y, 10 * dpr, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2);
        c.stroke();
      }
      // Target brackets snap in when the beam locks on, and hold until the shot lands (or misses).
      if (engaging || missing) {
        const since = now - (lockAt[i] ?? -1e9);
        const k = since < 320 ? 1 + 1.3 * Math.pow(1 - since / 320, 2) : 1;
        const e = 11 * dpr * k;
        const L = 5 * dpr;
        c.strokeStyle = rgba(colors.lock, 0.95);
        c.lineWidth = 1.6 * dpr;
        c.beginPath();
        for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
          c.moveTo(x + sx * e, y + sy * (e - L));
          c.lineTo(x + sx * e, y + sy * e);
          c.lineTo(x + sx * (e - L), y + sy * e);
        }
        c.stroke();
      }
      // The splash: a phosphor flash, a ring and debris thrown clear, all gone in 0.8s.
      if (st === "locked" && sinceHit >= 0 && sinceHit < 800) {
        const f = sinceHit / 800;
        const g = c.createRadialGradient(x, y, 0, x, y, (4 + f * 14) * dpr);
        g.addColorStop(0, rgba(colors.text, 0.95 * (1 - f) * (1 - f)));
        g.addColorStop(1, rgba(colors.sweep, 0));
        c.fillStyle = g;
        c.beginPath();
        c.arc(x, y, (4 + f * 14) * dpr, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = rgba(colors.lock, 0.85 * (1 - f));
        c.lineWidth = 1.6 * dpr;
        c.beginPath();
        c.arc(x, y, (5 + f * 30) * dpr, 0, Math.PI * 2);
        c.stroke();
        c.fillStyle = rgba(colors.sweep, 0.9 * (1 - f));
        for (let k = 0; k < 10; k++) {
          const a = loaderSeed(`${s.id}:d${k}`) * Math.PI * 2;
          const r = Math.pow(f, 0.55) * (10 + loaderSeed(`${s.id}:v${k}`) * 16) * dpr;
          c.fillRect(x + Math.cos(a) * r - 0.8 * dpr, y + Math.sin(a) * r - 0.8 * dpr, 1.6 * dpr, 1.6 * dpr);
        }
      }
      if (st === "lost") {
        const since = live ? now - (lostAt[i] ?? -1e9) : 1e9;
        if (since < 900) {
          const f = since / 900;
          c.strokeStyle = rgba(colors["danger-mark"], 0.9 * (1 - f));
          c.lineWidth = 2 * dpr;
          c.beginPath();
          c.arc(x, y, (5 + f * 22) * dpr, 0, Math.PI * 2);
          c.stroke();
        }
      }
      c.fillStyle = rgba(st === "lost" ? colors["danger-mark"] : colors.text, st === "waiting" ? 0.5 : st === "skipped" ? 0.6 : 0.95);
      c.font = mono;
      c.fillText(String(i + 1).padStart(2, "0"), x + 14 * dpr, y + 3.5 * dpr);
    });

    // Intercepts in flight: a bright point with a fading trail, curving out from own ship to the target.
    if (live && shots.length) {
      shots = shots.filter((sh) => now - sh.t0 < RADAR_FLIGHT * (sh.miss ? 1.6 : 1.02));
      for (const sh of shots) {
        const u = (now - sh.t0) / RADAR_FLIGHT;
        if (u < 0) continue;
        const tp = cpos[sh.i];
        if (!tp) continue;
        const tx = tp.x * R;
        const ty = tp.y * R;
        const len = Math.hypot(tx, ty) || 1;
        const nx = -ty / len;
        const ny = tx / len;
        // A miss is aimed where the contact was about to be, and runs on past it.
        const ex = sh.miss ? tx + (tx / len) * 0.12 * R + nx * 0.07 * R * -sh.side : tx;
        const ey = sh.miss ? ty + (ty / len) * 0.12 * R + ny * 0.07 * R * -sh.side : ty;
        const cx = tx / 2 + nx * len * 0.32 * sh.side;
        const cy = ty / 2 + ny * len * 0.32 * sh.side;
        const sy0 = -0.03 * R;
        const at = (v: number) => {
          const w = Math.min(1, Math.max(0, v));
          const e = w * w * (3 - 2 * w);
          const q = 1 - e;
          let px = q * q * 0 + 2 * q * e * cx + e * e * ex;
          let py = q * q * sy0 + 2 * q * e * cy + e * e * ey;
          if (v > 1) {
            px += (ex - cx) * (v - 1) * 1.6;
            py += (ey - cy) * (v - 1) * 1.6;
          }
          return [px, py];
        };
        const fade = sh.miss && u > 1 ? Math.max(0, 1 - (u - 1) / 0.6) : 1;
        // The trail: a fading line of phosphor along the path already flown.
        c.lineCap = "round";
        let [lx, ly] = at(Math.max(0, u - 0.5));
        for (let k = 1; k <= 18; k++) {
          const v = Math.max(0, u - 0.5) + (Math.min(u, 0.5) * k) / 18;
          const [px, py] = at(v);
          c.strokeStyle = rgba(colors.sweep, 0.75 * (k / 18) * (k / 18) * fade);
          c.lineWidth = (0.6 + 1.4 * (k / 18)) * dpr;
          c.beginPath();
          c.moveTo(lx, ly);
          c.lineTo(px, py);
          c.stroke();
          lx = px;
          ly = py;
        }
        const [hx, hy] = at(u);
        c.shadowColor = rgba(colors.text, 0.95);
        c.shadowBlur = 10 * dpr;
        c.fillStyle = rgba(colors.text, fade);
        c.beginPath();
        c.arc(hx, hy, 2.6 * dpr, 0, Math.PI * 2);
        c.fill();
        c.shadowBlur = 0;
      }
    }

    // Interference: a torn bright streak for a moment, once in a while.
    if (live && quirk === "streak" && turn % 5 === 3) {
      const ph = ((now - t0) % RADAR_TURN) / RADAR_TURN;
      if (ph > 0.42 && ph < 0.47) {
        const yy = (loaderSeed(`streak${turn}`) - 0.5) * R * 1.2;
        c.fillStyle = rgba(colors.sweep, 0.22);
        for (let k = 0; k < 14; k++) c.fillRect(-R + k * (S / 14) + loaderSeed(`s${turn}${k}`) * 10 * dpr, yy + loaderSeed(`t${k}`) * 3 * dpr, (S / 14) * 0.7, 1.5 * dpr);
      }
    }
    c.restore();
    c.globalAlpha = 1;
    if (live && now - readAt > 250) {
      readAt = now;
      readout();
    }

    if (live && turn !== lastTurn) {
      if (lastTurn >= 0) sfx("tick");
      lastTurn = turn;
    }
    if (live && armAng >= 0) {
      if (prevArm >= 0 && prevArm !== armAng) sweepReveal(prevArm, armAng, now);
      prevArm = armAng;
    } else prevArm = -1;
  }

  function frame() {
    raf = 0;
    if (!ctx.motionOn()) {
      settle(true);
      draw(loaderNow(), false);
      return;
    }
    draw(loaderNow(), true);
    raf = requestAnimationFrame(frame);
  }

  function kick() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    frame();
    const humming = ctx.motionOn() && (ctx.phase() === "run" || ctx.phase() === "idle");
    opts().sound?.bed(humming);
  }

  /* -------- building -------- */

  function rebuild() {
    typeT.forEach((t) => ctx.clear(t));
    listEl.textContent = "";
    const steps = ctx.steps();
    typeT = steps.map(() => 0);
    lockAt = steps.map(() => -1e9);
    lostAt = steps.map(() => -1e9);
    hitAt = steps.map(() => -1e9);
    shots = [];
    splash = null;
    lastFront = -1;
    chimed = false;
    prevArm = -1;
    shown = steps.map((_, i) => truthOf(i));
    const seed = steps.map((s) => s.id).join("|");
    quirk = loaderSeed(`${seed}:q`) < 0.5 ? "streak" : "flicker";
    flip = loaderSeed(`${seed}:flip`) < 0.5 ? 1 : -1;
    lats = steps.map((st) => loaderSeed(`${st.id}:lat`));
    heading = String(Math.floor(loaderSeed(`${seed}:hdg`) * 360)).padStart(3, "0");
    drift = 0;
    lastAt = 0;
    shownP = runP();
    place(shownP);
    clutter = Array.from({ length: 60 }, (_, k) => {
      const a = loaderSeed(`c${k}a`) * Math.PI * 2;
      const r = 0.04 + Math.pow(loaderSeed(`c${k}r`), 1.6) * 0.2;
      return { x: Math.cos(a) * r, y: Math.sin(a) * r, s: 1 + loaderSeed(`c${k}s`) * 1.4, k };
    });
    // A coastline down one side of the strip, with a bay or two of open water.
    const coast = -flip;
    const ph1 = loaderSeed(`${seed}:c1`) * 6;
    const ph2 = loaderSeed(`${seed}:c2`) * 6;
    land = [];
    for (let k = 0; land.length < 420 && k < 1400; k++) {
      const wy = loaderSeed(`l${k}y`) * RADAR_PERIOD - RADAR_PERIOD / 2;
      if (Math.sin(wy * 1.4 + ph2) > 0.8) continue;
      const edge = 0.6 + 0.15 * Math.sin(wy * 2.4 + ph1) + 0.06 * Math.sin(wy * 6.3 + ph2);
      const depth = Math.pow(loaderSeed(`l${k}d`), 0.8) * 0.5;
      land.push({ x: coast * (edge + depth), wy, s: 1.8 + loaderSeed(`l${k}s`) * 2, k });
    }
    buoys = Array.from({ length: 6 }, (_, k) => ({ x: (loaderSeed(`${seed}:b${k}x`) - 0.5) * 0.9 - coast * 0.12, wy: loaderSeed(`${seed}:b${k}y`) * RADAR_PERIOD - RADAR_PERIOD / 2, k }));
    // Two false echoes, placed to come in over the top edge a second or two and about seven seconds into a run.
    ghosts = [1.6, 7].map((tIn, k) => {
      const wy = -0.94 - RADAR_SPEED * tIn;
      return { x: flip * (k ? -0.28 : 0.34) + (loaderSeed(`${seed}:g${k}`) - 0.5) * 0.12, wy, state: "fresh" as const, at: 0, cycle: Math.floor((wy + RADAR_PERIOD / 2) / RADAR_PERIOD) };
    });
    rows = steps.map((s, i) => {
      const li = document.createElement("li");
      li.className = "bz-rsl-row";
      li.innerHTML = `<span class="bz-rsl-k">${String(i + 1).padStart(2, "0")}</span><span class="bz-rsl-nm">${loaderEsc(s.label)}</span><span class="bz-rsl-w"></span>`;
      listEl.appendChild(li);
      return li;
    });
    t0 = loaderNow() - loaderSeed(seed) * RADAR_TURN;
    layout();
    syncList();
    kick();
  }

  function layout() {
    const narrow = root.clientWidth < 560;
    if (root.dataset.narrow !== String(narrow)) root.dataset.narrow = String(narrow);
    const w = screenEl.clientWidth;
    if (!w) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    if (w !== size || canvas.width !== Math.round(w * dpr)) {
      size = w;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(w * dpr);
    }
    readColors();
    if (!raf) frame();
  }

  /** The label types in letter by letter, the way a contact is confirmed. */
  function typeIn(i: number) {
    const name = rows[i]?.querySelector<HTMLElement>(".bz-rsl-nm");
    const label = ctx.steps()[i]?.label ?? "";
    if (!name) return;
    typeT[i] = ctx.clear(typeT[i]);
    let k = 0;
    const per = Math.max(12, Math.min(28, 420 / Math.max(1, label.length)));
    const tick = () => {
      k++;
      name.textContent = label.slice(0, k);
      if (k < label.length) typeT[i] = ctx.later(tick, per);
      else typeT[i] = 0;
    };
    name.textContent = "";
    tick();
  }

  function newContact() {
    const f = ctx.front();
    const s = ctx.steps()[f];
    if (f !== lastFront && s && s.status === "active" && ctx.phase() === "run") {
      lastFront = f;
      sfx("contact");
    }
  }

  return {
    rebuild,
    layout,
    hit() {
      return 60;
    },
    progress() {
      readout();
      if (!raf) frame();
      newContact();
    },
    finish() {
      return 140;
    },
    resolve(_entries, showy) {
      settle(!ctx.motionOn());
      syncList();
      if (!raf) frame();
      return showy ? 260 : 0;
    },
    advance() {
      settle(!ctx.motionOn());
      syncList();
      if (!raf) frame();
      newContact();
    },
    error() {
      settle(!ctx.motionOn());
      syncList();
      kick();
    },
    recover() {
      settle(!ctx.motionOn());
      syncList();
      kick();
      lastFront = ctx.front();
    },
    stop() {
      settle(true);
      syncList();
      kick();
    },
    finale() {
      settle(!ctx.motionOn());
      syncList();
      kick();
    },
    pose() {
      settle(!ctx.motionOn());
      syncList();
      newContact();
    },
    motion() {
      if (!ctx.motionOn()) {
        typeT.forEach((t, i) => {
          if (t) typeT[i] = ctx.clear(t);
        });
        syncList();
      }
      kick();
    },
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      opts().sound?.bed(false);
      typeT.forEach((t) => ctx.clear(t));
      listEl.textContent = "";
    },
  };
}

const RADAR_BEARINGS = ["000", "045", "090", "135", "180", "225", "270", "315"];

const RADAR_CSS = `${LOADER_CSS}
.bz-rsl-arena{height:320px;background:var(--bz-rsl-console);--bz-rsl-alarm:#ff8f86}
.bz-rsl-housing{container-type:size;position:absolute;left:12px;top:12px;width:296px;height:296px;border-radius:22px;background:linear-gradient(145deg,#3a3f45,#1d2024 55%,#2b2f34);box-shadow:inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -2px 3px rgba(0,0,0,0.5),0 3px 8px rgba(0,0,0,0.45)}
.bz-rsl-screw{position:absolute;width:11px;height:11px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#b9bec4,#5c6168 70%);box-shadow:0 1px 1px rgba(0,0,0,0.6)}
.bz-rsl-screw::after{content:"";position:absolute;left:1.5px;right:1.5px;top:4.5px;height:1.5px;background:#2a2d31;transform:rotate(var(--bz-rsl-sr,30deg))}
.bz-rsl-brg{position:absolute;left:50%;top:50%;width:0;height:0;font:600 8.5px/1 var(--bz-rsl-mono);color:#b9c0c7;letter-spacing:0.04em}
.bz-rsl-brg span{position:absolute;transform:translate(-50%,-50%)}
.bz-rsl-well{position:absolute;left:16px;top:16px;right:16px;bottom:16px;border-radius:50%;background:#050607;box-shadow:inset 0 6px 10px rgba(0,0,0,0.9),inset 0 -2px 3px rgba(255,255,255,0.12),0 1px 0 rgba(255,255,255,0.14)}
.bz-rsl-screen{position:absolute;left:24px;top:24px;right:24px;bottom:24px;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 50% 46%,color-mix(in srgb,var(--bz-rsl-scope) 80%,var(--bz-rsl-sweep)) 0%,var(--bz-rsl-scope) 58%,#000 100%);box-shadow:0 0 0 2px #0c0d0f,0 10px 18px rgba(0,0,0,0.6)}
.bz-rsl-canvas{position:absolute;inset:0;width:100%;height:100%;border-radius:50%;transform:scale(1.035);transition:transform 600ms cubic-bezier(0.23,1,0.32,1)}
.bz-rsl-screen[data-tight="true"] .bz-rsl-canvas{transform:scale(0.97)}
.bz-rsl-scan{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,0.22) 0 1px,transparent 1px 3px);mix-blend-mode:multiply;pointer-events:none}
.bz-rsl-glass{position:absolute;inset:0;border-radius:50%;pointer-events:none;background:
radial-gradient(ellipse 46% 26% at 34% 20%,rgba(255,255,255,0.32),rgba(255,255,255,0.08) 55%,transparent 72%),
radial-gradient(ellipse 18% 9% at 70% 84%,rgba(255,255,255,0.12),transparent 70%),
radial-gradient(circle at 50% 42%,rgba(255,255,255,0.05),transparent 55%),
radial-gradient(circle at 50% 50%,transparent 56%,rgba(0,0,0,0.35) 80%,rgba(0,0,0,0.85) 100%);
box-shadow:inset 0 0 26px 4px rgba(0,0,0,0.85),inset 0 -8px 16px rgba(0,0,0,0.5),inset 0 3px 2px rgba(255,255,255,0.12)}
.bz-rsl-glass::after{content:"";position:absolute;left:14%;top:7%;width:46%;height:20%;border-radius:50%;border-top:2px solid rgba(255,255,255,0.35);transform:rotate(-22deg);filter:blur(0.6px)}
.bz-rsl[data-motion="on"][data-phase="run"] .bz-rsl-screen{animation:bz-rsl-crt 7s steps(1) infinite}
@keyframes bz-rsl-crt{0%,100%{filter:none}43%{filter:brightness(1.06)}44%{filter:none}}
.bz-rsl-all{position:absolute;left:50%;bottom:9%;z-index:2;transform:translateX(-50%);padding:4px 10px;border-radius:4px;background:var(--bz-rsl-scope);color:var(--bz-rsl-lock);font:800 11px/1.3 var(--bz-rsl-mono);letter-spacing:0.16em;text-transform:uppercase;white-space:nowrap;text-shadow:0 0 6px currentColor;visibility:hidden}
.bz-rsl-all[data-on="true"]{visibility:visible}
.bz-rsl-side{position:absolute;left:326px;right:14px;top:16px;bottom:90px;display:flex;flex-direction:column;gap:8px;color:var(--bz-rsl-text);font-family:var(--bz-rsl-mono)}
.bz-rsl-status{margin:0;padding-bottom:6px;border-bottom:1px solid var(--bz-rsl-ring);font:700 12px/18px var(--bz-rsl-mono);letter-spacing:0.08em;text-transform:uppercase;color:var(--bz-rsl-lock);text-shadow:0 0 6px color-mix(in srgb,var(--bz-rsl-lock) 50%,transparent)}
.bz-rsl-win{position:relative;flex:1 1 auto;min-height:0;overflow:hidden}
.bz-rsl-list{margin:0;padding:0;list-style:none;transition:transform var(--bz-rsl-base) var(--bz-rsl-ease)}
.bz-rsl-row{display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:8px;align-items:center;height:28px;border-bottom:1px dashed var(--bz-rsl-ring);font:500 12.5px/1 var(--bz-rsl-mono)}
.bz-rsl-k{opacity:0.85}
.bz-rsl-nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bz-rsl-w{font-size:10.5px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase}
.bz-rsl-row[data-state="waiting"]{opacity:0.75}
.bz-rsl-row[data-state="locked"] .bz-rsl-w{color:var(--bz-rsl-lock);text-shadow:0 0 5px color-mix(in srgb,var(--bz-rsl-lock) 45%,transparent)}
.bz-rsl-row[data-state="locked"] .bz-rsl-w::before{content:"[ "}
.bz-rsl-row[data-state="locked"] .bz-rsl-w::after{content:" ]"}
.bz-rsl-row[data-state="hunt"] .bz-rsl-w{color:var(--bz-rsl-text)}
.bz-rsl[data-motion="on"] .bz-rsl-row[data-state="hunt"] .bz-rsl-w{animation:bz-rsl-blink 1.1s steps(1) infinite}
@keyframes bz-rsl-blink{50%{opacity:0.45}}
.bz-rsl-row[data-state="lost"] .bz-rsl-w{color:var(--bz-rsl-alarm)}
.bz-rsl-stage{border-color:transparent}
.bz-rsl-plate{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);border:0!important}
.bz-rsl-data{position:absolute;left:326px;right:14px;bottom:14px;padding:8px 10px;border-radius:6px;background:#020504;box-shadow:inset 0 0 0 1px var(--bz-rsl-ring),inset 0 2px 8px rgba(0,0,0,0.9);color:var(--bz-rsl-lock);font:700 11.5px/17px var(--bz-rsl-mono);letter-spacing:0.06em;text-shadow:0 0 6px color-mix(in srgb,var(--bz-rsl-lock) 55%,transparent)}
.bz-rsl-data span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bz-rsl-d0,.bz-rsl-d2{color:var(--bz-rsl-text)}
.bz-rsl[data-phase="error"] .bz-rsl-d2{color:var(--bz-rsl-alarm)}
.bz-rsl-d1[data-flash="hit"]{color:var(--bz-rsl-text)}
.bz-rsl-d1[data-flash="miss"]{color:var(--bz-rsl-alarm)}
@container (max-width:559px){
.bz-rsl-arena{height:316px}
.bz-rsl-housing{left:8px;top:8px;width:222px;height:222px;border-radius:18px}
.bz-rsl-screen{left:20px;top:20px;right:20px;bottom:20px}
.bz-rsl-brg{font-size:7.5px}
.bz-rsl-side{left:240px;right:8px;top:12px;bottom:82px}
.bz-rsl-row{grid-template-columns:auto;gap:2px;height:38px;align-content:center}
.bz-rsl-k{font-size:11px}
.bz-rsl-nm{display:none}
.bz-rsl-w{font-size:8.5px;letter-spacing:0.02em}
.bz-rsl-row[data-state="locked"] .bz-rsl-w::before,.bz-rsl-row[data-state="locked"] .bz-rsl-w::after{content:none}
.bz-rsl-status{font-size:10.5px;line-height:15px;letter-spacing:0.04em}
.bz-rsl-all{font-size:9px;letter-spacing:0.1em}
.bz-rsl-data{left:8px;right:8px;bottom:8px;font-size:11px;line-height:16px}
}
`;

/* ---------------- the component ---------------- */

function radarPalette(p: RadarSweepLoaderProps["palette"]): RadarSweepLoaderPalette {
  if (!p) return RADAR_SWEEP_LOADER_PALETTES.phosphor;
  return typeof p === "string" ? RADAR_SWEEP_LOADER_PALETTES[p] ?? RADAR_SWEEP_LOADER_PALETTES.phosphor : p;
}

export function RadarSweepLoader(props: RadarSweepLoaderProps) {
  const { title, headingLevel = 2, palette, colorScheme, className, style } = props;
  const soundRef = useRef<LoaderSound | null>(null);
  const optsRef = useRef({ marks: RADAR_MARKS, sound: null as LoaderSound | null });
  optsRef.current = { marks: { ...RADAR_MARKS, ...props.marks }, sound: soundRef.current };
  const game = useMemo<LoaderGame>(() => ({ unit: "Contact", clear: "Area clear", arena: (root, ctx) => createRadarArena(root, ctx, () => optsRef.current) }), []);
  const api = useLoader(props, game);

  useEffect(() => {
    const s = createLoaderSound(() => api.rootRef.current, RADAR_VOICES, radarHum);
    soundRef.current = s;
    optsRef.current = { ...optsRef.current, sound: s };
    return () => {
      s.destroy();
      soundRef.current = null;
    };
  }, [api.rootRef]);
  useLoaderSoundPresence(api.rootRef, soundRef);
  useEffect(() => {
    soundRef.current?.setEnabled(!!props.sound);
    if (props.sound) soundRef.current?.bed(api.view.phase === "run" && api.motionAllowed && api.running);
  }, [props.sound, api.view.phase, api.motionAllowed, api.running]);

  const pal = radarPalette(palette);
  const rootStyle = useMemo(
    () =>
      ({
        ...loaderPaletteVars(pal.light, pal.dark),
        ...(colorScheme ? { colorScheme } : {}),
        ...style,
      }) as CSSProperties,
    [pal, colorScheme, style],
  );
  const Heading = `h${headingLevel}` as "h2";

  return (
    <section
      ref={api.rootRef}
      className={`bz-rsl${className ? ` ${className}` : ""}`}
      aria-labelledby={api.titleId}
      data-phase={api.view.phase}
      data-motion={api.motionAllowed ? "on" : "off"}
      data-running={api.running ? "true" : "false"}
      style={rootStyle}
    >
      <style dangerouslySetInnerHTML={{ __html: RADAR_CSS }} />
      <div className="bz-rsl-in">
        <Heading id={api.titleId} className="bz-rsl-title" tabIndex={-1}>
          {title}
        </Heading>
        <LoaderStepList api={api} />
        <div className="bz-rsl-stage">
          <div className="bz-rsl-arena">
            <div className="bz-rsl-art" aria-hidden="true">
              <div className="bz-rsl-housing">
                <div className="bz-rsl-well" />
                {[
                  [7, 7, 20],
                  [278, 7, 75],
                  [7, 278, 130],
                  [278, 278, 160],
                ].map(([x, y, r]) => (
                  <i key={`${x}-${y}`} className="bz-rsl-screw" style={{ left: `calc(${x / 296} * 100%)`, top: `calc(${y / 296} * 100%)`, ["--bz-rsl-sr" as string]: `${r}deg` } as CSSProperties} />
                ))}
                <div className="bz-rsl-brg">
                  {RADAR_BEARINGS.map((b, k) => {
                    const a = (k / 8) * Math.PI * 2 - Math.PI / 2;
                    return (
                      <span key={b} style={{ left: `${(Math.cos(a) * 47.9).toFixed(2)}cqmin`, top: `${(Math.sin(a) * 47.6).toFixed(2)}cqmin` }}>
                        {b}
                      </span>
                    );
                  })}
                </div>
                <div className="bz-rsl-screen">
                  <canvas className="bz-rsl-canvas" />
                  <div className="bz-rsl-scan" />
                  <div className="bz-rsl-glass" />
                  <div className="bz-rsl-all">{api.labels.clear}</div>
                </div>
              </div>
              <div className="bz-rsl-data">
                <span className="bz-rsl-d0" />
                <span className="bz-rsl-d1" />
                <span className="bz-rsl-d2" />
              </div>
              <div className="bz-rsl-side">
                <p className="bz-rsl-status" />
                <div className="bz-rsl-win">
                  <ol className="bz-rsl-list" />
                </div>
              </div>
            </div>
            <div className="bz-rsl-veil" aria-hidden="true" />
            <LoaderPlate api={api} />
          </div>
        </div>
        <LoaderBox api={api} />
        <LoaderDetails api={api} />
      </div>
    </section>
  );
}
