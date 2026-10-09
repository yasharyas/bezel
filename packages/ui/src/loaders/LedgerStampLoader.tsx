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
 * LedgerStampLoader: a multi-step loader drawn as a passbook page that gets
 * stamped, one entry per real step, so the wait reads as an official process
 * finishing rather than a spinner guessing.
 *
 * The page is a contract document on heavy, grained stock with a guilloche
 * border and a faint watermark, and each step is a numbered clause. The
 * clause being worked on is scribbled under in pencil exactly as far as the
 * host's progress, with the count written in pencil in the margin. The stamp
 * lands only when the host says the step is done: a teller's wooden stamper
 * (turned handle, brass ferrule, labelled mount, inked rubber) comes down
 * into the frame with its shadow sharpening on the paper and presses, the
 * page dips 2px and the ink settles. The stamper shows its age: one run's
 * stamper has a chipped knob, an ink-stained die, a dried drip or a peeling
 * label, and the hand may come down crooked, hesitate or rock the stamp.
 * Rejected is pressed with a different, red-stained stamper. Every impression carries today's date and its own tilt, offset,
 * inking and patchy coverage, and now and then a real accident: a doubled
 * strike, an ink fleck, a crooked clause. A step that needed a retry is
 * stamped Cleared in a second ink, a failed one gets a red Rejected stamp
 * with a reference line, a skipped one is struck through, and the last one
 * says Ready. When every clause is settled one large seal is pressed over
 * the page, off-centre and unevenly inked like a real one. With `sound` on,
 * the stamp, the page and the seal are heard, synthesized in the file, and
 * only while the loader is hovered or focused.
 *
 * Nothing moves on a timer. The pencil line, the margin count and the stamps
 * change only when the steps you pass in change: at most one pencil stroke
 * every 400ms with the increments in between merged, and stamps that arrive
 * together still land 150ms apart, so each one registers. A step of unknown
 * size gets a waiting pencil and no count instead of invented progress.
 *
 * The loader is controlled, the same way Stepper is. `steps` is its only
 * state and the host owns every transition: it starts, advances, fails,
 * retries and skips steps. The error menu calls `onRetry`, `onSkip` and
 * `onCancel`, the results screen calls `onContinue`, and `onComplete` fires
 * once per run after the finale.
 *
 * The section is named by its heading. A visually hidden list carries every
 * step and its state, with `aria-current` on the current one and `aria-busy`
 * only while work runs, so neither live region sits in a busy subtree. One
 * visually hidden progressbar carries the current step; the page shows it.
 * The message box is a `role="log"` that narrates milestones in sentences
 * rather than ticks; errors go to a `role="alert"` and a menu with a roving
 * focus. Focus moves only when it is
 * already inside the loader.
 *
 * Reduced motion (followed live, or forced with `reducedMotion`) removes
 * every drop and tween: each entry shows its stamp, its strike or its pencil
 * line at once. The Pause motion button does the same on request. Off screen
 * or in a hidden tab nothing animates and finished steps settle without
 * their beats; on return the footer says what finished meanwhile. The loader
 * keeps one height in every state.
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

export type LedgerStampLoaderColors = {
  /** The page. */
  paper: string;
  /** The ruled lines and the empty stamp boxes. */
  rule: string;
  /** The red margin line down the left of the page. */
  margin: string;
  /** Printed text on the page: the header, the entry numbers and names. Keep it 7:1 or more on the paper. */
  print: string;
  /** The Verified stamp. Keep it 4.5:1 or more on the paper: its date is small. */
  stamp: string;
  /** The Cleared stamp on a step that needed a retry. 4.5:1 or more on the paper. */
  stampAlt: string;
  /** The round seal that lands when every entry is settled. */
  seal: string;
  /** Primary buttons and the marker on the clause in progress. */
  accent: string;
  /** Text on accent: white on light themes, near black on dark ones. */
  onAccent: string;
};

/** One colour set per theme. The loader picks between them with light-dark(), following the host's color-scheme. */
export type LedgerStampLoaderPalette = { light: LedgerStampLoaderColors; dark: LedgerStampLoaderColors };

/**
 * Two presets, both invented marks rather than any real bank's. Every text
 * and control pair is AA on both themes, and the stamp inks clear 4.5:1 on
 * the paper so the small date inside each stamp stays readable. Spread one to
 * customise: `{ ...LEDGER_STAMP_LOADER_PALETTES.navy, dark: { ... } }`.
 */
export const LEDGER_STAMP_LOADER_PALETTES = {
  navy: {
    light: { paper: "#f7f1e3", rule: "#d6cbb0", margin: "#d9958a", print: "#26221c", stamp: "#233f8f", stampAlt: "#1c6448", seal: "#9a2236", accent: "#233f8f", onAccent: "#ffffff" },
    dark: { paper: "#1d2130", rule: "#3a4157", margin: "#7a3f48", print: "#efe8d8", stamp: "#a9bcff", stampAlt: "#86dcb5", seal: "#d4475e", accent: "#a9bcff", onAccent: "#0a0a0a" },
  },
  legal: {
    light: { paper: "#fbfaf6", rule: "#dcd8ce", margin: "#bdb7aa", print: "#141414", stamp: "#1a1a1a", stampAlt: "#3b3b3b", seal: "#1a1a1a", accent: "#1a1a1a", onAccent: "#ffffff" },
    dark: { paper: "#19191b", rule: "#38383c", margin: "#4a4a4f", print: "#f3f3f3", stamp: "#f3f3f3", stampAlt: "#cfcfcf", seal: "#d8d8d8", accent: "#f3f3f3", onAccent: "#0a0a0a" },
  },
} as const satisfies Record<string, LedgerStampLoaderPalette>;

export type LedgerStampLoaderPaletteName = keyof typeof LEDGER_STAMP_LOADER_PALETTES;

export type LedgerStampLoaderProps = {
  /** The run, and the only state. The host replaces the array whenever a step changes. */
  steps: LoaderStep[];
  /** The heading, and the progressbar's accessible name. */
  title: string;
  /** Heading level of the title. Default 2. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** A preset name or your own light and dark colours. Default "navy". */
  palette?: LedgerStampLoaderPaletteName | LedgerStampLoaderPalette;
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
  /** The words printed on the page: the header, the stamps and the seal. Default English. */
  marks?: Partial<LedgerStampMarks>;
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
  /** Play the synthesized desk sounds: the ink pad, the stamp, the page and the seal. Off by default; audio starts only after a key or pointer press on the page, and is heard only while the loader is hovered, focused or last tapped. */
  sound?: boolean;
  /** Class on the root section. */
  className?: string;
  /** Style on the root section. */
  style?: CSSProperties;
};

/** The words on the page. All of them are decoration: the log and the hidden step list carry the meaning. */
export type LedgerStampMarks = {
  /** The document's heading. Default "Certificate of Completion". */
  book: string;
  /** The line under the heading, before the date. Default "Executed on". */
  executed: string;
  /** Column headings. Default "Clause", "Particulars" and "Stamp". */
  number: string;
  particulars: string;
  stampColumn: string;
  /** A finished step. Default "Verified". */
  verified: string;
  /** A finished step that needed a retry. Default "Cleared". */
  cleared: string;
  /** The last step. Default "Ready". */
  ready: string;
  /** A skipped step. Default "Skipped". */
  skipped: string;
  /** The red stamp on a failed step. Default "Rejected". */
  held: string;
  /** The ring of the seal. Default "All entries verified". */
  seal: string;
  /** The words in the centre of the seal. Default "Verified". */
  sealCentre: string;
  /** The reference line on a red stamp. Default "Ref". */
  reference: string;
};

const LEDGER_MARKS: LedgerStampMarks = {
  book: "Certificate of Completion",
  executed: "Executed on",
  number: "Clause",
  particulars: "Particulars",
  stampColumn: "Stamp",
  verified: "Verified",
  cleared: "Cleared",
  ready: "Ready",
  skipped: "Skipped",
  held: "Rejected",
  seal: "All entries verified",
  sealCentre: "Verified",
  reference: "Ref",
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
  for (const key of Object.keys(light)) out[`--bz-lsl-${loaderKebab(key)}`] = `light-dark(${light[key]}, ${dark[key] ?? light[key]})`;
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
    <svg className="bz-lsl-g" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
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
    titleId: `bz-lsl-title-${uid}`,
    detailsId: `bz-lsl-details-${uid}`,
    hatchId: `bz-lsl-hatch-${uid}`,
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
    <ol className="bz-lsl-sr" aria-busy={api.view.phase === "run" ? "true" : "false"}>
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
      className="bz-lsl-plate"
      role="progressbar"
      aria-labelledby={api.titleId}
      aria-valuemin={0}
      aria-valuemax={Math.max(1, api.n)}
      aria-valuenow={api.settled}
      aria-valuetext={api.valueText}
      data-state={plate.state}
      data-gone={plate.gone ? "true" : "false"}
    >
      <div className="bz-lsl-plate-in" key={api.view.frontKey}>
        <div className="bz-lsl-plate-top">
          <span className="bz-lsl-plate-label">{plate.label}</span>
          <span className="bz-lsl-badges">
            {plate.attempt ? <span className="bz-lsl-tag">{labels.attempt(plate.attempt)}</span> : null}
            {plate.failed ? (
              <span className="bz-lsl-failed">
                <LoaderGlyph name="cross" />
                {labels.failed}
              </span>
            ) : null}
          </span>
        </div>
        <div className="bz-lsl-plate-row">
          <span className="bz-lsl-bar" data-indet={plate.indet ? "true" : "false"}>
            <span className="bz-lsl-fill" style={{ width: `${Math.round(plate.p * 1000) / 10}%` }} />
            <svg className="bz-lsl-hatch" aria-hidden="true" focusable="false">
              <defs>
                <pattern id={api.hatchId} width="8" height="8" patternUnits="userSpaceOnUse">
                  <path d="M-2 2l4-4M0 8l8-8M6 10l4-4" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#${api.hatchId})`} />
            </svg>
          </span>
          <span className="bz-lsl-count" title={plate.count || undefined}>
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
    <div id={api.detailsId} className="bz-lsl-sheet" data-panel="error" hidden={!open}>
      <div
        ref={scrollRef}
        className="bz-lsl-sheet-in"
        role="region"
        aria-label={labels.details}
        tabIndex={open && scroll.over ? 0 : undefined}
        data-more={scroll.more ? "true" : undefined}
      >
        <p className="bz-lsl-sheet-head" aria-hidden="true">
          {labels.details}
        </p>
        <p className="bz-lsl-details">{view.details}</p>
        {view.detailMore ? <p className="bz-lsl-more-detail">{view.detailMore}</p> : null}
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
    <div className="bz-lsl-box">
      <div className="bz-lsl-panels">
        <div className="bz-lsl-panel bz-lsl-talk">
          <div ref={api.logRef} className="bz-lsl-log" role="log" aria-label={labels.narration} tabIndex={errorOn || resultsOn ? -1 : 0}>
            {view.lines.map((line, k) => (
              <p key={line.key} className="bz-lsl-line" data-kind={line.kind} data-last={k === view.lines.length - 1 ? "true" : undefined}>
                <LoaderGlyph name={LOADER_LINE_GLYPH[line.kind]} />
                <span>{line.text}</span>
              </p>
            ))}
          </div>
          {view.lines.length ? null : (
            <p className="bz-lsl-ph" aria-hidden="true">
              {api.placeholder}
            </p>
          )}
        </div>
        <div className="bz-lsl-panel bz-lsl-err" data-panel="error" data-on={errorOn ? "true" : "false"}>
          {/* Only the message lives here; the details open as a card over the arena. A message
              too long for the box scrolls, and only then joins the tab order with a name. */}
          <div
            ref={errTextRef}
            className="bz-lsl-err-text"
            role={errScroll.over ? "region" : undefined}
            aria-label={errScroll.over ? labels.errorMessage : undefined}
            tabIndex={errScroll.over && errorOn ? 0 : undefined}
            data-more={errScroll.more ? "true" : undefined}
          >
            <div className="bz-lsl-alert" role="alert">
              {view.alert ? (
                <>
                  <LoaderGlyph name="cross" />
                  <span>{view.alert}</span>
                </>
              ) : null}
            </div>
          </div>
          <div ref={api.menuRef} className="bz-lsl-menu" role="group" aria-label={labels.menu} onKeyDown={api.onMenuKey}>
            {api.commands.map((c, k) => (
              <button
                key={c.key}
                type="button"
                className={`bz-lsl-btn${c.primary ? " bz-lsl-primary" : ""}`}
                tabIndex={k === api.cursor ? 0 : -1}
                data-cursor={k === api.cursor ? "true" : undefined}
                aria-expanded={c.key === "details" ? c.expanded : undefined}
                aria-controls={c.key === "details" ? api.detailsId : undefined}
                onFocus={() => api.setCursor(k)}
                onClick={c.run}
              >
                {c.label}
                {c.sr ? <span className="bz-lsl-sr">{c.sr}</span> : null}
              </button>
            ))}
          </div>
        </div>
        <div className="bz-lsl-panel bz-lsl-res" data-on={resultsOn ? "true" : "false"}>
          <p className="bz-lsl-res-line" aria-hidden="true">
            {resultsOn ? lastLine : ""}
          </p>
          <dl className="bz-lsl-tiles">
            {view.tiles.map((t) => (
              <div className="bz-lsl-tile" key={t.label}>
                <dt>{t.label}</dt>
                <dd>
                  <span className="bz-lsl-num" aria-hidden="true">
                    {loaderTileText(t, api.countT)}
                  </span>
                  <span className="bz-lsl-sr">{loaderTileText(t, 1)}</span>
                  {t.sub ? (
                    <span className="bz-lsl-sub" title={`${t.sub}${t.more ?? ""}`}>
                      {t.sub}
                      {t.more ? <span className="bz-lsl-sr">{t.more}</span> : null}
                    </span>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="bz-lsl-foot">
        <p className="bz-lsl-meta" aria-hidden="true">
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
        <div className="bz-lsl-tools">
          <button type="button" className="bz-lsl-btn bz-lsl-toy" aria-pressed={api.paused} data-hide={api.reduced ? "true" : undefined} onClick={api.togglePause}>
            <LoaderGlyph name="pause" />
            {labels.pauseMotion}
          </button>
          {api.props.onContinue ? (
            <button
              ref={api.continueRef}
              type="button"
              className="bz-lsl-btn bz-lsl-primary bz-lsl-continue"
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
.bz-lsl{container-type:inline-size;display:block;width:100%;min-width:0;
--bz-lsl-ink:light-dark(var(--bz-ink,#0a0a0a),var(--bz-void-ink,#ffffff));
--bz-lsl-muted:light-dark(var(--bz-ink-muted,#4a4a4c),rgba(255,255,255,0.8));
--bz-lsl-panel:light-dark(var(--bz-paper,#ffffff),var(--bz-void-raised,#1a1a1a));
--bz-lsl-track:light-dark(var(--bz-line-opaque,#f0f0f0),#313131);
--bz-lsl-danger:light-dark(var(--bz-danger,#b91c1c),#fca5a5);
--bz-lsl-danger-mark:light-dark(#dc2626,#f87171);
--bz-lsl-success:light-dark(var(--bz-emerald,#047857),var(--bz-emerald-on-void,#34d399));
--bz-lsl-focus:light-dark(var(--bz-focus-ring,#912c22),var(--bz-focus-ring-void,#ffffff));
--bz-lsl-hairline:light-dark(rgba(10,10,10,0.13),rgba(255,255,255,0.16));
--bz-lsl-edge:light-dark(rgba(10,10,10,0.55),rgba(255,255,255,0.5));
--bz-lsl-idle:light-dark(#8a8a8e,#8c8c8c);
--bz-lsl-fast:var(--bz-duration-fast,150ms);
--bz-lsl-base:var(--bz-duration-base,300ms);
--bz-lsl-ease:var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1));
--bz-lsl-beat:var(--bz-duration-beat,2.4s);
--bz-lsl-sans:var(--bz-font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);
--bz-lsl-mono:var(--bz-font-mono,ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace);
--bz-lsl-serif:ui-serif,Georgia,Cambria,"Times New Roman",serif;
--bz-lsl-accent-ink:var(--bz-lsl-accent);
--bz-lsl-face:var(--bz-lsl-sans)}
.bz-lsl *,.bz-lsl *::before,.bz-lsl *::after{box-sizing:border-box}
.bz-lsl-in{position:relative;display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto auto auto;padding:16px;border:1px solid var(--bz-lsl-hairline);border-radius:16px;background:var(--bz-lsl-panel);color:var(--bz-lsl-ink);font-family:var(--bz-lsl-sans);font-size:15px;line-height:1.5;text-align:left}
.bz-lsl-sr{position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}
.bz-lsl-title{grid-area:1/1;margin:0 0 10px;font-size:15px;font-weight:600;line-height:21px;color:var(--bz-lsl-ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bz-lsl-title:focus{outline:none}
.bz-lsl-title:focus-visible{outline:2px solid var(--bz-lsl-focus);outline-offset:2px}
.bz-lsl-stage{grid-area:2/1;position:relative;margin:0;border-radius:12px;overflow:hidden;border:1px solid var(--bz-lsl-hairline)}
.bz-lsl-arena{position:relative;overflow:hidden}
.bz-lsl-art{position:absolute;inset:0}
.bz-lsl-box{grid-area:3/1}
.bz-lsl-g{display:block;flex:none}

.bz-lsl-plate{position:absolute;z-index:4;padding:7px 12px 9px 16px;border:1px solid var(--bz-lsl-edge);border-radius:10px;background:var(--bz-lsl-panel);color:var(--bz-lsl-ink);overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.08)}
.bz-lsl-plate::before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;background:var(--bz-lsl-accent)}
.bz-lsl-plate[data-state="pending"]::before{background:var(--bz-lsl-idle)}
.bz-lsl-plate[data-state="error"]::before{background:var(--bz-lsl-danger-mark)}
.bz-lsl-plate[data-gone="true"]{position:absolute!important;width:1px!important;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);border:0}
.bz-lsl-plate-in{animation:bz-lsl-fade var(--bz-lsl-fast) linear}
.bz-lsl-plate-top{display:flex;align-items:center;gap:2px 8px;min-height:22px}
.bz-lsl-plate-label{flex:1 1 auto;min-width:0;font-size:14px;font-weight:600;line-height:20px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bz-lsl-badges{display:inline-flex;flex:none;align-items:center;gap:6px}
.bz-lsl-badges:empty{display:none}
.bz-lsl-tag{flex:none;padding:2px 7px;border-radius:999px;background:var(--bz-lsl-accent);color:var(--bz-lsl-on-accent);font:700 11px/1.3 var(--bz-lsl-mono);white-space:nowrap}
.bz-lsl-failed{flex:none;display:inline-flex;align-items:center;gap:4px;color:var(--bz-lsl-danger);font-size:13px;font-weight:700;line-height:1}
.bz-lsl-failed .bz-lsl-g{width:13px;height:13px;color:var(--bz-lsl-danger-mark)}
.bz-lsl-plate-row{display:flex;align-items:center;gap:4px 10px;margin-top:6px}
.bz-lsl-bar{position:relative;flex:1 1 56px;min-width:56px;height:8px;overflow:hidden;border-radius:999px;background:var(--bz-lsl-track);box-shadow:inset 0 0 0 1px var(--bz-lsl-hairline)}
.bz-lsl-fill{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:var(--bz-lsl-accent);transition:width var(--bz-lsl-base) var(--bz-lsl-ease)}
.bz-lsl-hatch{position:absolute;top:0;left:-8px;width:calc(100% + 8px);height:100%;display:none;color:var(--bz-lsl-accent)}
.bz-lsl-hatch path{fill:none;stroke:currentColor;stroke-width:2.5}
.bz-lsl-bar[data-indet="true"] .bz-lsl-fill{display:none}
.bz-lsl-bar[data-indet="true"] .bz-lsl-hatch{display:block;animation:bz-lsl-march 900ms linear infinite}
.bz-lsl-count{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;font:500 12px/16px var(--bz-lsl-mono);color:var(--bz-lsl-muted);white-space:nowrap;font-variant-numeric:tabular-nums}
@keyframes bz-lsl-march{from{transform:translateX(0)}to{transform:translateX(8px)}}
@keyframes bz-lsl-fade{from{opacity:0}to{opacity:1}}

.bz-lsl-box{margin-top:12px;padding:14px 18px 12px;border:1px solid var(--bz-lsl-hairline);border-radius:12px;background:var(--bz-lsl-panel)}
.bz-lsl-panels{display:grid;height:108px}
.bz-lsl-panel{grid-area:1/1;min-width:0;min-height:0;background:var(--bz-lsl-panel)}
.bz-lsl-talk{position:relative}
.bz-lsl-err,.bz-lsl-res{z-index:1;visibility:hidden}
.bz-lsl-err[data-on="true"],.bz-lsl-res[data-on="true"]{visibility:visible}
.bz-lsl-log{position:relative;height:96px;overflow-y:auto;scrollbar-width:none;overscroll-behavior:contain;font-size:15px;line-height:24px}
.bz-lsl-log::-webkit-scrollbar{display:none}
.bz-lsl-log:focus{outline:none}
.bz-lsl-log:focus-visible{outline:2px solid var(--bz-lsl-focus);outline-offset:2px}
.bz-lsl-line{display:flex;gap:8px;margin:0;color:var(--bz-lsl-muted);font-size:14px}
.bz-lsl-line[data-last="true"]{color:var(--bz-lsl-ink);font-size:16px;font-weight:500}
.bz-lsl-line>.bz-lsl-g{width:15px;height:15px;margin-top:4.5px;visibility:hidden}
.bz-lsl-line[data-last="true"]>.bz-lsl-g{visibility:visible}
.bz-lsl-line[data-kind="done"]>.bz-lsl-g{color:var(--bz-lsl-success)}
.bz-lsl-line[data-kind="skipped"]>.bz-lsl-g,.bz-lsl-line[data-kind="stop"]>.bz-lsl-g{color:var(--bz-lsl-muted)}
.bz-lsl-line[data-kind="retry"]>.bz-lsl-g,.bz-lsl-line[data-kind="finish"]>.bz-lsl-g{color:var(--bz-lsl-accent-ink)}
.bz-lsl-ph{position:absolute;left:0;top:0;margin:0;font-size:15px;line-height:24px;color:var(--bz-lsl-muted)}

.bz-lsl-err{display:grid;grid-template-rows:minmax(0,1fr) auto;row-gap:10px}
.bz-lsl-err-text,.bz-lsl-sheet-in{min-height:0;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:var(--bz-lsl-muted) transparent}
.bz-lsl-err-text:focus,.bz-lsl-sheet-in:focus{outline:none}
.bz-lsl-err-text:focus-visible,.bz-lsl-sheet-in:focus-visible{outline:2px solid var(--bz-lsl-focus);outline-offset:-2px}
.bz-lsl-err-text[data-more="true"]::after,.bz-lsl-sheet-in[data-more="true"]::after{content:"";position:sticky;bottom:0;display:block;height:20px;margin-top:-20px;background:linear-gradient(to bottom,transparent,var(--bz-lsl-panel));pointer-events:none}
.bz-lsl-alert{visibility:visible;display:flex;gap:10px;color:var(--bz-lsl-ink);font-size:15px;font-weight:500;line-height:24px}
.bz-lsl-alert>.bz-lsl-g{width:15px;height:15px;margin-top:4.5px;color:var(--bz-lsl-danger-mark)}

.bz-lsl-sheet{position:absolute;grid-area:2/1/3/2;z-index:5;top:10px;left:10px;right:10px;display:flex;max-height:calc(100% - 20px);border:1px solid var(--bz-lsl-edge);border-radius:10px;background:var(--bz-lsl-panel);overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.18)}
.bz-lsl-sheet[hidden]{display:none}
.bz-lsl-sheet-in{flex:1 1 auto;padding:10px 14px 12px}
.bz-lsl-sheet-head{margin:0 0 4px;font:700 11px/14px var(--bz-lsl-mono);letter-spacing:0.08em;text-transform:uppercase;color:var(--bz-lsl-muted)}
.bz-lsl-details{margin:0;font:500 12px/18px var(--bz-lsl-mono);color:var(--bz-lsl-ink);overflow-wrap:anywhere}
.bz-lsl-more-detail{margin:6px 0 0;font-size:13px;line-height:18px;color:var(--bz-lsl-muted)}
.bz-lsl-menu{display:flex;flex-wrap:wrap;gap:8px}

.bz-lsl-res{display:flex;flex-direction:column;gap:8px;overflow:hidden}
.bz-lsl-res-line{flex:none;margin:0;font-size:15px;font-weight:500;line-height:22px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.bz-lsl-tiles{display:flex;flex-wrap:wrap;align-content:flex-start;gap:8px 12px;min-height:0;margin:0;overflow-y:auto}
.bz-lsl-tile{flex:1 1 auto;min-width:0;padding-top:6px;border-top:2px solid var(--bz-lsl-ink)}
.bz-lsl-tile dt{font:700 11px/14px var(--bz-lsl-mono);letter-spacing:0.08em;text-transform:uppercase;color:var(--bz-lsl-muted)}
.bz-lsl-tile dd{margin:2px 0 0}
.bz-lsl-num{display:block;font:700 18px/24px var(--bz-lsl-face);color:var(--bz-lsl-ink);font-variant-numeric:tabular-nums;white-space:nowrap}
.bz-lsl-sub{width:0;min-width:100%;font-size:12px;line-height:16px;color:var(--bz-lsl-muted);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}

.bz-lsl-foot{display:flex;align-items:center;gap:8px 16px;margin-top:12px}
.bz-lsl-meta{flex:1 1 auto;min-width:0;height:40px;margin:0;overflow:hidden;font-size:13px;line-height:20px;color:var(--bz-lsl-muted);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.bz-lsl-meta b{font-weight:600;color:var(--bz-lsl-ink)}
.bz-lsl-meta .bz-lsl-g{display:inline-block;width:13px;height:13px;margin-right:6px;vertical-align:-2px;color:var(--bz-lsl-accent-ink)}
.bz-lsl-tools{display:flex;flex:none;gap:8px}

.bz-lsl-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-width:48px;min-height:48px;margin:0;padding:0 20px;border:1.5px solid var(--bz-lsl-edge);border-radius:999px;background:var(--bz-lsl-panel);color:var(--bz-lsl-ink);font:600 14px/1.2 var(--bz-lsl-sans);text-align:left;cursor:pointer;transition:background-color var(--bz-lsl-fast) var(--bz-lsl-ease),transform var(--bz-lsl-fast) var(--bz-lsl-ease)}
.bz-lsl-btn .bz-lsl-g{width:14px;height:14px}
.bz-lsl-btn:focus{outline:none}
.bz-lsl-btn:focus-visible{outline:2px solid var(--bz-lsl-focus);outline-offset:2px;background:var(--bz-lsl-track)}
@media (hover:hover){.bz-lsl-btn:hover{background:var(--bz-lsl-track)}}
.bz-lsl[data-motion="on"] .bz-lsl-btn:active{transform:scale(0.97)}
.bz-lsl-primary{border-color:var(--bz-lsl-accent);background:var(--bz-lsl-accent);color:var(--bz-lsl-on-accent)}
.bz-lsl-primary:focus-visible{background:var(--bz-lsl-accent);box-shadow:inset 0 0 0 2px var(--bz-lsl-panel)}
@media (hover:hover){.bz-lsl-primary:hover{background:var(--bz-lsl-accent);box-shadow:inset 0 0 0 2px var(--bz-lsl-panel)}}
.bz-lsl-toy{padding:0 16px;font-size:13.5px}
.bz-lsl-toy[aria-pressed="true"]{border-color:var(--bz-lsl-ink);background:var(--bz-lsl-ink);color:var(--bz-lsl-panel)}
.bz-lsl-toy[data-hide="true"]{visibility:hidden}
.bz-lsl-continue{min-width:112px;visibility:hidden}
.bz-lsl-continue[data-on="true"]{visibility:visible}

@container (max-width:559px){
.bz-lsl-in{padding:12px}
.bz-lsl-box{padding:12px 12px 10px}
.bz-lsl-panels{height:204px}
.bz-lsl-log{height:188px}
.bz-lsl-plate-row{flex-wrap:wrap}
.bz-lsl-bar{flex-basis:100%}
.bz-lsl-plate-top{padding-right:0}
.bz-lsl-menu{display:grid;grid-template-columns:1fr 1fr}
.bz-lsl-tile{flex-basis:40%}
.bz-lsl-sub{display:block;white-space:nowrap;text-overflow:ellipsis}
.bz-lsl-res-line{-webkit-line-clamp:2}
.bz-lsl-foot{flex-wrap:wrap}
.bz-lsl-meta{flex:1 1 100%}
.bz-lsl-tools{flex:1 1 100%}
}

.bz-lsl-veil{position:absolute;inset:0;z-index:3;background:var(--bz-lsl-panel);opacity:0;visibility:hidden;pointer-events:none;transition:opacity var(--bz-lsl-base) var(--bz-lsl-ease),visibility 0s linear var(--bz-lsl-base)}
.bz-lsl[data-phase="stopped"] .bz-lsl-veil{opacity:0.45;visibility:visible;transition:opacity var(--bz-lsl-base) var(--bz-lsl-ease)}
.bz-lsl[data-motion="off"] *,.bz-lsl[data-motion="off"] *::before,.bz-lsl[data-motion="off"] *::after{animation:none!important;transition:none!important}
.bz-lsl[data-motion="off"] .bz-lsl-btn{transition:background-color var(--bz-lsl-fast) linear!important}
.bz-lsl[data-running="false"] *,.bz-lsl[data-running="false"] *::before,.bz-lsl[data-running="false"] *::after{animation-play-state:paused!important}
`;

/* ---------------- end shared: chassis ---------------- */

/* ---------------- Ledger arena ---------------- */

/** Today's date as a stamp prints it: "08 OCT 2026". Read on the client only, so server and client never disagree. */
function ledgerToday(): string {
  const d = new Date();
  const m = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][d.getMonth()];
  return `${String(d.getDate()).padStart(2, "0")} ${m} ${d.getFullYear()}`;
}

type LedgerRowState = "pending" | "active" | "error" | "stamped" | "skipped";
type LedgerQuirk = "double" | "fleck" | "crooked" | "";

/** At most two small accidents per run, chosen from the step ids, so the same run always looks the same. */
function ledgerQuirks(steps: LoaderStep[]): LedgerQuirk[] {
  const kinds: LedgerQuirk[] = ["double", "fleck", "crooked"];
  let used = 0;
  let k0 = -1;
  return steps.map((s) => {
    if (used >= 2 || loaderSeed(`${s.id}:quirk`) >= 0.34) return "";
    if (k0 < 0) k0 = Math.floor(loaderSeed(`${s.id}:kind`) * 3);
    // A second accident in the same run is always a different one.
    return kinds[(k0 + used++) % 3];
  });
}

/* The desk sounds: rubber on paper with a knock of the wooden block, a page settling, the seal and a failure. */
const LEDGER_VOICES: Record<string, { gap: number; voice: LoaderVoice }> = {
  thunk: {
    gap: 110,
    voice: (a, o, t, n) => {
      loaderTone(a, o, t, { f: 120, f2: 52, dur: 0.16, gain: 0.42 });
      loaderNoise(a, o, t, n, { type: "lowpass", f: 900, dur: 0.05, gain: 0.22 });
      loaderTone(a, o, t + 0.004, { type: "triangle", f: 640, f2: 520, dur: 0.05, gain: 0.07 });
    },
  },
  rustle: {
    gap: 200,
    voice: (a, o, t, n) => loaderNoise(a, o, t + 0.03, n, { type: "bandpass", f: 2600, f2: 5200, q: 0.6, dur: 0.2, gain: 0.05, attack: 0.03 }),
  },
  seal: {
    gap: 600,
    voice: (a, o, t, n) => {
      for (const d of [0, 0.15]) {
        loaderTone(a, o, t + d, { f: 96, f2: 42, dur: 0.22, gain: d ? 0.4 : 0.5 });
        loaderNoise(a, o, t + d, n, { type: "lowpass", f: 700, dur: 0.07, gain: 0.25 });
      }
    },
  },
  fail: {
    gap: 400,
    voice: (a, o, t) => loaderTone(a, o, t, { type: "sawtooth", f: 116, dur: 0.28, gain: 0.07, lp: 520, attack: 0.02 }),
  },
};

function createLedgerArena(root: HTMLElement, ctx: LoaderArenaCtx, opts: () => { marks: LedgerStampMarks; fid: string; sound: LoaderSound | null }): LoaderArena {
  const q = <T extends Element>(sel: string) => root.querySelector(sel) as T;
  const arenaEl = q<HTMLDivElement>(".bz-lsl-arena");
  const pageEl = q<HTMLDivElement>(".bz-lsl-page");
  const winEl = q<HTMLDivElement>(".bz-lsl-win");
  const rowsEl = q<HTMLDivElement>(".bz-lsl-rows");
  const sealEl = q<HTMLDivElement>(".bz-lsl-seal");
  const dateEl = q<HTMLSpanElement>(".bz-lsl-date");
  const toolEl = q<HTMLDivElement>(".bz-lsl-tool");
  const castEl = q<HTMLDivElement>(".bz-lsl-cast");
  const labelEl = q<SVGTextElement>(".bz-lsl-tl");
  const headEls = Array.from(root.querySelectorAll<HTMLElement>("[data-mark]"));

  let rows: HTMLDivElement[] = [];
  let quirks: LedgerQuirk[] = [];
  let rowH = 30;
  let offset = 0;
  let today = "";
  const queued = new Set<number>();
  let toolTimers: number[] = [];
  let habit: { i: number; kind: "tilt" | "hesitate" | "rock" } | null = null;

  const M = () => opts().marks;
  const sfx = (cue: string, delay = 0) => opts().sound?.play(cue, delay);

  function word(i: number): string {
    const steps = ctx.steps();
    const s = steps[i];
    if ((s.attempt ?? 1) > 1) return M().cleared;
    return i === steps.length - 1 ? M().ready : M().verified;
  }

  function stateOf(i: number): LedgerRowState {
    const s = ctx.steps()[i];
    if (ctx.vis()[i] === "gone") return s.status === "skipped" ? "skipped" : "stamped";
    if (s.status === "error") return "error";
    if (i === ctx.front() && s.status !== "pending") return "active";
    return "pending";
  }

  /** Each press differs a little: tilt, offset, how hard it was inked and which patch of rubber missed. */
  function makeStamp(i: number, reject = false): HTMLDivElement {
    const id = ctx.steps()[i].id + (reject ? `:r${ctx.steps()[i].attempt ?? 1}` : "");
    const r = (k: string) => loaderSeed(`${id}:${k}`);
    const el = document.createElement("div");
    el.className = "bz-lsl-stamp";
    if ((ctx.steps()[i].attempt ?? 1) > 1) el.dataset.alt = "true";
    if (reject) el.dataset.reject = "true";
    const q = reject ? "" : quirks[i];
    el.style.setProperty("--bz-lsl-rot", `${(r("tilt") * 9 - 4.5).toFixed(2)}deg`);
    el.style.setProperty("--bz-lsl-dx", `${Math.round(r("x") * 8 - 4)}px`);
    el.style.setProperty("--bz-lsl-dy", `${Math.round(r("y") * 4 - 2)}px`);
    el.style.setProperty("--bz-lsl-ink", (0.8 + r("ink") * 0.17).toFixed(2));
    el.style.setProperty("--bz-lsl-mix", `${Math.round(78 + r("mix") * 22)}%`);
    el.style.filter = `url(#${opts().fid}-ink${Math.floor(r("pad") * 3)})`;
    const line = reject ? `${M().reference} ${String(i + 1).padStart(2, "0")}-${ctx.steps()[i].attempt ?? 1} · ${today}` : today;
    const face = `<span class="bz-lsl-stamp-w">${loaderEsc(reject ? M().held : word(i))}</span><span class="bz-lsl-stamp-d">${loaderEsc(line)}</span>`;
    el.innerHTML = `<span class="bz-lsl-ink">${face}</span>${q === "double" ? `<span class="bz-lsl-ink bz-lsl-ghost" aria-hidden="true">${face}</span>` : ""}${q === "fleck" ? `<i class="bz-lsl-fleck"></i><i class="bz-lsl-fleck" data-k="2"></i>` : ""}`;
    return el;
  }

  function makeRow(i: number): HTMLDivElement {
    const s = ctx.steps()[i];
    const el = document.createElement("div");
    el.className = "bz-lsl-row";
    if (quirks[i] === "crooked") el.dataset.crooked = "true";
    // A hurried pencil scribble: a zigzag that wanders up and down, with a second pass over part of it.
    const pts: string[] = [];
    for (let k = 0; k <= 22; k++) {
      const x = (k / 22) * 99 + 0.5;
      const y = 3 + (k % 2 ? -1 : 1) * (1.2 + loaderSeed(`${s.id}:pen${k}`) * 1.4) + Math.sin(k * 0.7) * 0.6;
      pts.push(`${k ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(2)}`);
    }
    const back = `M99 ${(3 + loaderSeed(`${s.id}:b0`)).toFixed(2)}C70 ${(2 + loaderSeed(`${s.id}:b1`) * 2).toFixed(2)} 40 ${(4.5 - loaderSeed(`${s.id}:b2`) * 2).toFixed(2)} ${(8 + loaderSeed(`${s.id}:b3`) * 20).toFixed(1)} ${(3 + loaderSeed(`${s.id}:b4`)).toFixed(2)}`;
    el.innerHTML =
      `<span class="bz-lsl-no">${String(i + 1).padStart(2, "0")}</span>` +
      `<span class="bz-lsl-name"><span class="bz-lsl-text">${loaderEsc(s.label)}</span>` +
      `<svg class="bz-lsl-pen" viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true" focusable="false"><g filter="url(#${opts().fid}-lead)"><path d="${pts.join("")}"/><path class="bz-lsl-pen-b" d="${back}"/></g></svg></span>` +
      `<span class="bz-lsl-slot"><span class="bz-lsl-tally"></span></span>`;
    rowsEl.appendChild(el);
    return el;
  }

  /** Draws one entry as its honest state, without motion. */
  function sync(i: number) {
    const el = rows[i];
    if (!el) return;
    const st = stateOf(i);
    if (el.dataset.state !== st) el.dataset.state = st;
    const s = ctx.steps()[i];
    el.dataset.indet = st === "active" && s.status === "active" && s.progress == null ? "true" : "false";
    const pen = el.querySelector<SVGElement>(".bz-lsl-pen");
    if (pen) {
      const p = st === "active" ? ctx.frontP() : st === "error" ? Math.max(0, Math.min(1, s.progress ?? 0)) : 0;
      // The graphite is revealed from the left, so the stroke keeps its grain and its wobble.
      pen.style.clipPath = el.dataset.indet === "true" ? "" : st === "stamped" || st === "skipped" ? "inset(-6px 0 -6px 0)" : `inset(-6px ${(100 - p * 100).toFixed(1)}% -6px 0)`;
    }
    const tally = el.querySelector<HTMLElement>(".bz-lsl-tally");
    if (tally) tally.textContent = st === "active" ? tallyText(i) : st === "skipped" ? M().skipped : "";
    const slot = el.querySelector<HTMLElement>(".bz-lsl-slot");
    const has = slot?.querySelector<HTMLElement>(".bz-lsl-stamp");
    const want = st === "stamped" ? "ok" : st === "error" ? "reject" : "";
    const kind = has ? (has.dataset.reject ? "reject" : "ok") : "";
    if (has && kind !== want) has.remove();
    if (want && kind !== want && slot && !queued.has(i)) slot.appendChild(makeStamp(i, want === "reject"));
  }

  function syncAll() {
    rows.forEach((_, i) => sync(i));
  }

  /** The count pencilled in the margin: real units when the host gives a count, else a percentage, never ahead of the art. */
  function tallyText(i: number) {
    const s = ctx.steps()[i];
    if (s.status === "active" && s.progress == null) return "…";
    const p = Math.max(0, Math.min(1, ctx.frontP()));
    if (s.count && s.count > 1) return `${Math.floor(p * s.count).toLocaleString("en-US")} / ${s.count.toLocaleString("en-US")}`;
    return `${Math.floor(p * 100)}%`;
  }

  /** One large seal. Like a real one it is pressed a little off-centre, inked unevenly, smudged at the middle and short of ink on one side. */
  function sealMarkup() {
    const ring = `${M().seal} · ${M().seal} · `.toUpperCase();
    const uid = `${opts().fid}-ring`;
    let star = "";
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 - Math.PI / 2;
      const r = k % 2 ? 7 : 15;
      star += `${k ? "L" : "M"}${(100 + r * Math.cos(a)).toFixed(2)} ${(92 + r * Math.sin(a)).toFixed(2)}`;
    }
    const centre = loaderEsc(M().sealCentre.toUpperCase());
    const body =
      `<circle cx="100" cy="100" r="94" class="bz-lsl-sl" stroke-width="5"/><circle cx="100" cy="100" r="86" class="bz-lsl-sl" stroke-width="1.6"/>` +
      `<text class="bz-lsl-seal-t"><textPath href="#${uid}" textLength="455" lengthAdjust="spacing">${loaderEsc(ring)}</textPath></text>` +
      `<g transform="translate(2.5 3) rotate(-2 100 100)"><circle cx="100" cy="100" r="56" class="bz-lsl-sl" stroke-width="2.4"/><circle cx="100" cy="100" r="51" class="bz-lsl-sl" stroke-width="1"/>` +
      `<path d="${star}Z" class="bz-lsl-sf"/>` +
      `<text x="100" y="128" class="bz-lsl-seal-c">${centre}</text><text x="100" y="142" class="bz-lsl-seal-d">${loaderEsc(today)}</text></g>`;
    return (
      `<svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">` +
      `<defs><path id="${uid}" d="M100 100m-73 0a73 73 0 1 1 146 0a73 73 0 1 1-146 0"/>` +
      `<linearGradient id="${uid}-dry" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="0.62" stop-color="#fff" stop-opacity="0.92"/><stop offset="1" stop-color="#fff" stop-opacity="0.3"/></linearGradient>` +
      `<mask id="${uid}-m"><rect width="200" height="200" fill="url(#${uid}-dry)"/></mask></defs>` +
      `<g filter="url(#${opts().fid}-ink1)" mask="url(#${uid}-m)">${body}</g>` +
      `<g class="bz-lsl-smudge" filter="url(#${opts().fid}-smear)"><ellipse cx="108" cy="96" rx="26" ry="18" class="bz-lsl-sf"/></g>` +
      `</svg>`
    );
  }

  function rebuild() {
    today = ledgerToday();
    dateEl.textContent = `${M().executed} ${today}`;
    rowsEl.textContent = "";
    queued.clear();
    clearTool();
    const steps = ctx.steps();
    quirks = ledgerQuirks(steps);
    // One stamper is used all run, so its wear is the same on every press: one mark of use, and maybe one habit of the hand.
    const runSeed = steps.map((x) => x.id).join("|");
    toolEl.dataset.wear = (["chip", "inkedge", "drip", "peel"] as const)[Math.floor(loaderSeed(`${runSeed}:wear`) * 4)];
    const mk = loaderSeed(`${runSeed}:hand`);
    habit = steps.length && mk < 0.8 ? { i: Math.floor(loaderSeed(`${runSeed}:hi`) * steps.length), kind: (["tilt", "hesitate", "rock"] as const)[Math.min(2, Math.floor((mk / 0.8) * 3))] } : null;
    pageEl.dataset.curl = steps.length && loaderSeed(`${steps[0].id}:fold`) < 0.6 ? "true" : "false";
    pageEl.style.setProperty("--bz-lsl-seal-rot", `${(loaderSeed(`${steps[0]?.id ?? ""}:seal`) * 16 - 14).toFixed(1)}deg`);
    rows = steps.map((_, i) => makeRow(i));
    sealEl.innerHTML = sealMarkup();
    headEls.forEach((h) => {
      const k = h.dataset.mark as keyof LedgerStampMarks;
      h.textContent = M()[k];
    });
    layout(false);
    syncAll();
    sealEl.dataset.on = ctx.phase() === "complete" ? "true" : "false";
  }

  /** Rows share the room above the slip; a long run scrolls so the entry being worked on stays in view. */
  function layout(animate: boolean) {
    const H = winEl.clientHeight;
    if (!H) return;
    const narrow = root.clientWidth < 560;
    if (root.dataset.narrow !== String(narrow)) root.dataset.narrow = String(narrow);
    const n = Math.max(1, rows.length);
    rowH = Math.max(28, Math.min(38, Math.floor(H / n)));
    arenaEl.style.setProperty("--bz-lsl-row", `${rowH}px`);
    const fit = Math.max(1, Math.floor(H / rowH));
    const f = Math.min(ctx.front(), rows.length - 1);
    let next = 0;
    if (rows.length > fit) next = Math.max(0, Math.min(rows.length - fit, f - Math.max(0, fit - 2)));
    const moved = next !== offset;
    offset = next;
    rows.forEach((el, i) => {
      el.style.top = `${i * rowH}px`;
    });
    rowsEl.style.transform = `translateY(${-offset * rowH}px)`;
    rowsEl.dataset.glide = animate && moved && ctx.motionOn() ? "true" : "false";
  }

  /** The page gives under the stamp: down 2px and back, with a rustle. */
  function dip(px: number) {
    ctx.anim(pageEl, [{ transform: "translateY(0)" }, { transform: `translateY(${px}px)`, offset: 0.25 }, { transform: "translateY(0)" }], { duration: 260, easing: "cubic-bezier(0.23,1,0.32,1)" });
  }

  /** Where an element sits inside the arena, in unscaled pixels, whatever transform the host puts on the page. */
  function within(el: Element) {
    const a = arenaEl.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    const k = a.width / Math.max(1, arenaEl.offsetWidth) || 1;
    return { x: (b.left - a.left) / k, y: (b.top - a.top) / k, w: b.width / k, h: b.height / k };
  }

  function clearTool() {
    toolTimers.forEach((t) => ctx.clear(t));
    toolTimers = [];
    queued.clear();
    toolEl.dataset.on = "false";
    castEl.dataset.on = "false";
  }

  /* The stamper is drawn in a 60 x 73 box; the middle of the rubber's face is at (30, 73). */
  let tk = 1;
  const toolAt = (x: number, y: number, squash = 1, tilt = 0) => `translate(${(x - 30).toFixed(1)}px, ${(y - 73).toFixed(1)}px) rotate(${tilt.toFixed(2)}deg) scale(${tk.toFixed(3)}, ${(tk * squash).toFixed(3)})`;
  type ToolKey = { x: number; y: number; tilt: number; squash?: number; o: number; offset: number; easing?: string };

  /**
   * The stamper and its shadow move together. The shadow is the stamper's on
   * the paper: soft, wide and pale while the stamper is high, sharp, small
   * and dark at the moment of contact, and pushed away from the light (the top
   * left) by the height.
   */
  function animTool(keys: ToolKey[], bx: number, by: number, duration: number, easing?: string) {
    ctx.anim(toolEl, keys.map((k) => ({ transform: toolAt(k.x, k.y, k.squash ?? 1, k.tilt), opacity: k.o, offset: k.offset, ...(k.easing ? { easing: k.easing } : {}) })), { duration, fill: "forwards", ...(easing ? { easing } : {}) });
    ctx.anim(castEl, keys.map((k) => {
      const h = Math.max(0, by - k.y);
      return {
        offset: k.offset,
        ...(k.easing ? { easing: k.easing } : {}),
        opacity: k.o * Math.min(0.45, 0.38 * Math.exp(-h / 45) + 0.03),
        filter: `blur(${(1.2 + h * 0.11).toFixed(1)}px)`,
        transform: `translate(${(k.x - bx + h * 0.28).toFixed(1)}px, ${(h * 0.14).toFixed(1)}px) scale(${(1 + h * 0.005).toFixed(3)}, ${(1 + h * 0.004).toFixed(3)})`,
      };
    }), { duration, fill: "forwards", ...(easing ? { easing } : {}) });
  }

  function slotBox(i: number) {
    const slot = rows[i]?.querySelector(".bz-lsl-slot");
    if (!slot) return null;
    const box = within(slot);
    return { box, bx: box.x + box.w / 2, by: box.y + box.h + 2, tilt: loaderSeed(`${ctx.steps()[i].id}:hand`) * 6 - 3 };
  }

  /**
   * The teller's hand brings the stamper down from above and presses. The
   * stamper is the one for the job: the ink and the label match the word
   * being stamped, and Rejected is a different, red-stained stamper. Returns
   * when the rubber meets the paper.
   */
  function pressTool(i: number, kind: "ok" | "alt" | "reject"): number {
    const at = slotBox(i);
    if (!at || !ctx.motionOn()) return 0;
    clearTool();
    const { box, bx, by, tilt } = at;
    // The rubber is as wide as the box it fills, like a real dated stamp.
    tk = Math.max(1, (box.w + 4) / 51);
    toolEl.dataset.kind = kind;
    labelEl.textContent = (kind === "reject" ? M().held : word(i)).toUpperCase();
    castEl.style.left = `${Math.round(box.x - 2)}px`;
    castEl.style.top = `${Math.round(box.y + 1)}px`;
    castEl.style.width = `${Math.round(box.w + 4)}px`;
    castEl.style.height = `${Math.round(box.h)}px`;
    toolEl.dataset.on = "true";
    castEl.dataset.on = "true";
    const h = kind === "reject" ? null : habit && habit.i === i ? habit.kind : null;
    let keys: ToolKey[];
    if (h === "tilt") {
      // Comes down a few degrees crooked and squares up at the last moment.
      keys = [
        { x: bx + 40, y: -30, tilt: tilt + 14, o: 0, offset: 0 },
        { x: bx + 8, y: by - 46, tilt: tilt + 8, o: 1, offset: 0.55, easing: "cubic-bezier(0.23,1,0.32,1)" },
        { x: bx + 2, y: by - 26, tilt: tilt + 6, o: 1, offset: 0.78 },
        { x: bx + 1, y: by - 7, tilt: tilt + 4.5, o: 1, offset: 0.9, easing: "cubic-bezier(0.55,0,1,0.45)" },
        { x: bx, y: by, tilt, o: 1, offset: 1 },
      ];
    } else if (h === "hesitate") {
      // Stops just short of the paper, as if checking the line, then presses.
      keys = [
        { x: bx + 40, y: -30, tilt: tilt + 12, o: 0, offset: 0 },
        { x: bx + 4, y: by - 40, tilt: tilt + 2, o: 1, offset: 0.45, easing: "cubic-bezier(0.23,1,0.32,1)" },
        { x: bx, y: by - 12, tilt, o: 1, offset: 0.66 },
        { x: bx, y: by - 11, tilt, o: 1, offset: 0.84, easing: "cubic-bezier(0.55,0,1,0.45)" },
        { x: bx, y: by, tilt, o: 1, offset: 1 },
      ];
    } else {
      keys = [
        { x: bx + 40, y: -30, tilt: tilt + 12, o: 0, offset: 0 },
        { x: bx + 6, y: by - 46, tilt: tilt + 3, o: 1, offset: 0.55, easing: "cubic-bezier(0.23,1,0.32,1)" },
        { x: bx, y: by - 30, tilt, o: 1, offset: 0.78, easing: "cubic-bezier(0.55,0,1,0.45)" },
        { x: bx, y: by, tilt, o: 1, offset: 1 },
      ];
    }
    animTool(keys, bx, by, 460);
    return 460;
  }

  /** The press lands: the rubber squashes, sometimes the hand rocks it for a fuller print, then it lifts away. */
  function liftTool(i: number) {
    const at = slotBox(i);
    if (!at || toolEl.dataset.on !== "true") return;
    const { bx, by, tilt } = at;
    const rock = toolEl.dataset.kind !== "reject" && habit?.i === i && habit.kind === "rock";
    const keys: ToolKey[] = rock
      ? [
          { x: bx, y: by, tilt, squash: 0.92, o: 1, offset: 0 },
          { x: bx, y: by, tilt: tilt - 2.6, squash: 0.95, o: 1, offset: 0.12 },
          { x: bx, y: by, tilt: tilt + 2.4, squash: 0.95, o: 1, offset: 0.25 },
          { x: bx, y: by, tilt, squash: 0.93, o: 1, offset: 0.36 },
          { x: bx, y: by, tilt, o: 1, offset: 0.46 },
          { x: bx + 26, y: -40, tilt: tilt + 10, o: 0, offset: 1 },
        ]
      : [
          { x: bx, y: by, tilt, squash: 0.92, o: 1, offset: 0 },
          { x: bx, y: by, tilt, o: 1, offset: 0.2 },
          { x: bx + 26, y: -40, tilt: tilt + 10, o: 0, offset: 1 },
        ];
    const ms = rock ? 560 : 420;
    animTool(keys, bx, by, ms, "cubic-bezier(0.23,1,0.32,1)");
    toolTimers.push(
      ctx.later(() => {
        toolEl.dataset.on = "false";
        castEl.dataset.on = "false";
      }, ms),
    );
  }

  /** The impression appears where the rubber met the paper, ink still settling. */
  function impress(i: number, heavy: boolean) {
    const slot = rows[i]?.querySelector<HTMLElement>(".bz-lsl-slot");
    if (!slot) return;
    slot.querySelector(".bz-lsl-stamp")?.remove();
    const el = makeStamp(i);
    slot.appendChild(el);
    ctx.anim(el, [{ opacity: 0.35, transform: "translate(var(--bz-lsl-dx),var(--bz-lsl-dy)) rotate(var(--bz-lsl-rot)) scale(1.03)" }, { opacity: 1, transform: "translate(var(--bz-lsl-dx),var(--bz-lsl-dy)) rotate(var(--bz-lsl-rot)) scale(1)" }], { duration: 420, easing: "cubic-bezier(0.23,1,0.32,1)" });
    dip(heavy ? 3 : 2);
    sfx("thunk");
    sfx("rustle", 40);
  }

  function strike(i: number, showy: boolean) {
    sync(i);
    const line = rows[i]?.querySelector<HTMLElement>(".bz-lsl-text");
    if (showy && line) ctx.anim(line, [{ backgroundSize: "0% 1.5px" }, { backgroundSize: "100% 1.5px" }], { duration: BASE, easing: "cubic-bezier(0.23,1,0.32,1)" });
  }

  return {
    rebuild,
    layout,
    hit(i) {
      const pen = rows[i]?.querySelector<SVGElement>(".bz-lsl-pen");
      if (pen) ctx.anim(pen, [{ transform: "translateY(0)" }, { transform: "translateY(0.6px)", offset: 0.4 }, { transform: "translateY(0)" }], { duration: 200, easing: "ease-out" });
      return 80;
    },
    progress(i) {
      sync(i);
    },
    finish(i) {
      // The pencil line completes now; the hand brings the stamp down on the beat.
      const pen = rows[i]?.querySelector<SVGElement>(".bz-lsl-pen");
      if (pen) pen.style.clipPath = "inset(-4px 0% -4px 0)";
      const tally = rows[i]?.querySelector<HTMLElement>(".bz-lsl-tally");
      if (tally) tally.textContent = "";
      return Math.max(120, pressTool(i, (ctx.steps()[i].attempt ?? 1) > 1 ? "alt" : "ok"));
    },
    resolve(entries, showy) {
      if (!showy) {
        queued.clear();
        clearTool();
        syncAll();
        return 0;
      }
      let at = 0;
      entries.forEach((e, k) => {
        const run = () => {
          const st = stateOf(e.i);
          if (st === "skipped") strike(e.i, true);
          else if (st === "stamped") {
            const el = rows[e.i];
            if (el) el.dataset.state = "stamped";
            impress(e.i, false);
            if (k === 0) liftTool(e.i);
          }
        };
        if (k === 0) run();
        else {
          queued.add(e.i);
          toolTimers.push(
            ctx.later(() => {
              queued.delete(e.i);
              run();
            }, at),
          );
        }
        at += FAST;
      });
      // A burst holds the next entry until its last stamp has landed, 150ms apart.
      return entries.length > 1 ? at + 120 : entries[0]?.kind === "skipped" ? BASE : 360;
    },
    advance() {
      layout(true);
      syncAll();
    },
    error(i, showy) {
      clearTool();
      sfx("fail");
      const land = () => {
        queued.delete(i);
        sync(i);
        const st = rows[i]?.querySelector<HTMLElement>(".bz-lsl-stamp");
        if (st && ctx.motionOn()) ctx.anim(st, [{ opacity: 0.4 }, { opacity: 1 }], { duration: 360, easing: "cubic-bezier(0.23,1,0.32,1)" });
        sfx("thunk");
        dip(2);
        liftTool(i);
      };
      const t = showy ? pressTool(i, "reject") : 0;
      if (t) {
        queued.add(i);
        sync(i);
        toolTimers.push(
          ctx.later(() => {
            if (stateOf(i) === "error") land();
            else {
              queued.delete(i);
              sync(i);
            }
          }, t),
        );
      } else sync(i);
    },
    recover(i) {
      clearTool();
      sync(i);
    },
    stop() {
      clearTool();
      syncAll();
    },
    finale(showy) {
      syncAll();
      sealEl.dataset.on = "true";
      if (showy) {
        ctx.anim(sealEl, [
          { transform: "translate(-50%,-50%) rotate(calc(var(--bz-lsl-seal-rot) - 14deg)) scale(1.3)", opacity: 0 },
          { transform: "translate(-50%,-50%) rotate(var(--bz-lsl-seal-rot)) scale(1)", opacity: 1, offset: 0.55, easing: "cubic-bezier(0.3,0,0.2,1)" },
          { transform: "translate(-50%,-50%) rotate(var(--bz-lsl-seal-rot)) scale(0.98)", opacity: 1, offset: 0.7 },
          { transform: "translate(-50%,-50%) rotate(var(--bz-lsl-seal-rot)) scale(1.01)", opacity: 1, offset: 0.82 },
          { transform: "translate(-50%,-50%) rotate(var(--bz-lsl-seal-rot)) scale(1)", opacity: 1 },
        ], { duration: 640, easing: "cubic-bezier(0.55,0,1,0.45)" });
        ctx.later(() => {
          sfx("seal");
          dip(3);
          ctx.later(() => dip(2), 150);
        }, 340);
      }
    },
    pose() {
      syncAll();
      if (ctx.phase() !== "complete") sealEl.dataset.on = "false";
    },
    motion() {
      if (!ctx.motionOn()) {
        rowsEl.dataset.glide = "false";
        clearTool();
      }
    },
    destroy() {
      clearTool();
      rowsEl.textContent = "";
      sealEl.textContent = "";
    },
  };
}

/* Paper grain as a tiny tiled noise image, so the page reads as paper rather than a flat fill. */
const LEDGER_GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.42 0 0 0 0 0.3 0 0 0 0 0.12 0 0 0 0.11 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`;

const LEDGER_CSS = `${LOADER_CSS}
.bz-lsl{--bz-lsl-slotw:118px;--bz-lsl-hand:"Segoe Print","Bradley Hand","Comic Neue","Chalkboard SE","Marker Felt",cursive}
.bz-lsl-arena{height:320px;background:var(--bz-lsl-paper)}
.bz-lsl-page{position:absolute;inset:0;padding:0 18px 0 22px;color:var(--bz-lsl-print);font-family:var(--bz-lsl-serif);background:
radial-gradient(circle at 91% 66%,rgba(150,110,50,0.08) 0 2px,transparent 6px),
radial-gradient(circle at 12% 88%,rgba(150,110,50,0.07) 0 1.5px,transparent 5px),
radial-gradient(ellipse 125% 100% at 50% 45%,transparent 66%,rgba(140,110,60,0.13) 100%),
${LEDGER_GRAIN},
linear-gradient(175deg,color-mix(in srgb,var(--bz-lsl-paper) 97%,#fff) 0%,var(--bz-lsl-paper) 50%,color-mix(in srgb,var(--bz-lsl-paper) 95%,#8a6a3a) 100%)}
.bz-lsl-frame{position:absolute;inset:7px;border:1.5px solid color-mix(in srgb,var(--bz-lsl-rule) 80%,transparent);pointer-events:none}
.bz-lsl-frame::before{content:"";position:absolute;inset:3px;border:5px solid transparent;border-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--bz-lsl-rule) 85%,transparent) 0 1px,transparent 1px 3.5px,color-mix(in srgb,var(--bz-lsl-rule) 60%,transparent) 3.5px 4.5px,transparent 4.5px 7px) 5}
.bz-lsl-mark{position:absolute;left:50%;top:56%;width:190px;height:190px;margin:-95px 0 0 -95px;border-radius:50%;border:10px double var(--bz-lsl-rule);opacity:0.28;pointer-events:none}
.bz-lsl-mark::after{content:"";position:absolute;inset:34px;border-radius:50%;border:2px solid var(--bz-lsl-rule)}
.bz-lsl-page[data-curl="true"]::after{content:"";position:absolute;left:0;bottom:0;width:30px;height:30px;background:linear-gradient(45deg,var(--bz-lsl-panel) 0 48%,rgba(0,0,0,0.16) 50%,color-mix(in srgb,var(--bz-lsl-paper) 88%,#000) 54%,var(--bz-lsl-paper) 100%);border-top-right-radius:6px;box-shadow:2px -2px 4px rgba(0,0,0,0.07)}
.bz-lsl-head{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;padding-top:18px;height:62px;text-align:center}
.bz-lsl-book{font:700 15px/18px var(--bz-lsl-serif);letter-spacing:0.2em;text-transform:uppercase;filter:url(#__FID__-print)}
.bz-lsl-date{font:italic 500 12.5px/16px var(--bz-lsl-serif);letter-spacing:0.02em}
.bz-lsl-cols{display:grid;grid-template-columns:52px minmax(0,1fr) var(--bz-lsl-slotw);column-gap:12px;height:22px;margin:0 -18px 0 -22px;padding-right:18px;align-items:center;font:600 10.5px/14px var(--bz-lsl-sans);letter-spacing:0.12em;text-transform:uppercase}
.bz-lsl-cols>[data-mark="number"]{justify-self:end;padding-right:2px}
.bz-lsl-cols>[data-mark="particulars"]{padding-left:8px}
.bz-lsl-cols>[data-mark="stampColumn"]{text-align:center}
.bz-lsl-win{position:absolute;left:0;right:0;top:86px;bottom:20px;overflow:hidden}
.bz-lsl-rows{position:absolute;left:0;right:0;top:0;bottom:0}
.bz-lsl-rows[data-glide="true"]{transition:transform var(--bz-lsl-base) var(--bz-lsl-ease)}
.bz-lsl-row{position:absolute;left:0;right:0;height:var(--bz-lsl-row,30px);display:grid;grid-template-columns:52px minmax(0,1fr) var(--bz-lsl-slotw);align-items:center;column-gap:12px;padding-right:18px}
.bz-lsl-row[data-crooked="true"] .bz-lsl-name{transform:rotate(-0.7deg) translateY(1px)}
.bz-lsl-no{justify-self:end;font:600 13px/1 var(--bz-lsl-serif);font-variant-numeric:oldstyle-nums;filter:url(#__FID__-print)}
.bz-lsl-no::before{content:"§ ";font-weight:400;opacity:0.85}
.bz-lsl-name{position:relative;min-width:0;padding-left:8px}
.bz-lsl-text{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:500 15px/20px var(--bz-lsl-serif);background:linear-gradient(currentColor,currentColor) no-repeat 0 55%/0% 1.5px;filter:url(#__FID__-print)}
.bz-lsl-pen{position:absolute;left:6px;width:calc(100% - 4px);bottom:-6px;height:8px;overflow:visible;clip-path:inset(-6px 100% -6px 0);transition:clip-path var(--bz-lsl-base) var(--bz-lsl-ease)}
.bz-lsl-pen path{fill:none;stroke:var(--bz-lsl-print);stroke-opacity:0.62;stroke-width:1.3;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.bz-lsl-pen .bz-lsl-pen-b{stroke-opacity:0.4;stroke-width:1.1}
.bz-lsl-row[data-state="stamped"] .bz-lsl-pen,.bz-lsl-row[data-state="skipped"] .bz-lsl-pen{clip-path:inset(-6px 0 -6px 0)}
.bz-lsl-row[data-state="stamped"] .bz-lsl-pen path{stroke-opacity:0.38}
.bz-lsl-row[data-indet="true"] .bz-lsl-pen{clip-path:inset(-6px 72% -6px 0)}
.bz-lsl[data-motion="on"] .bz-lsl-row[data-indet="true"] .bz-lsl-pen{animation:bz-lsl-wait 1.6s ease-in-out infinite}
@keyframes bz-lsl-wait{50%{clip-path:inset(-6px 58% -6px 0)}}
.bz-lsl-row[data-state="pending"] .bz-lsl-text{opacity:0.66}
.bz-lsl-row[data-state="active"] .bz-lsl-text{font-weight:650}
.bz-lsl-row[data-state="active"] .bz-lsl-no{color:var(--bz-lsl-accent)}
.bz-lsl-row[data-state="skipped"] .bz-lsl-text{background-size:100% 1.5px;opacity:0.7}
.bz-lsl-slot{position:relative;height:calc(var(--bz-lsl-row,30px) - 6px);display:grid;place-items:center}
.bz-lsl-tally{font:600 14px/1 var(--bz-lsl-hand);color:var(--bz-lsl-print);transform:rotate(-3deg);white-space:nowrap;font-variant-numeric:tabular-nums}
.bz-lsl-row[data-state="skipped"] .bz-lsl-tally{font-size:13px;opacity:0.85}
.bz-lsl-row[data-state="stamped"] .bz-lsl-tally,.bz-lsl-row[data-state="error"] .bz-lsl-tally{visibility:hidden}
.bz-lsl-stamp{position:absolute;inset:-3px -4px;color:color-mix(in srgb,var(--bz-lsl-stamp) var(--bz-lsl-mix,90%),var(--bz-lsl-print));opacity:var(--bz-lsl-ink,0.9);transform:translate(var(--bz-lsl-dx,0),var(--bz-lsl-dy,0)) rotate(var(--bz-lsl-rot,0deg));line-height:1;white-space:nowrap;pointer-events:none}
.bz-lsl-stamp[data-alt="true"]{color:color-mix(in srgb,var(--bz-lsl-stamp-alt) var(--bz-lsl-mix,90%),var(--bz-lsl-print))}
.bz-lsl-stamp[data-reject="true"]{color:var(--bz-lsl-danger);opacity:1;inset:-4px -8px}
.bz-lsl-stamp[data-reject="true"] .bz-lsl-ink{border-width:3.5px;border-style:solid}
.bz-lsl-stamp[data-reject="true"] .bz-lsl-stamp-w{font-family:var(--bz-lsl-sans);font-weight:900;font-size:12px;letter-spacing:0.18em}
.bz-lsl-stamp[data-reject="true"] .bz-lsl-stamp-d{font-size:8.5px}
.bz-lsl-ink{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border:3.5px double currentColor;border-radius:5px}
.bz-lsl-ghost{opacity:0.32;transform:translate(2px,-1.5px) rotate(0.8deg)}
.bz-lsl-fleck{position:absolute;right:-9px;top:-5px;width:3px;height:3px;border-radius:50%;background:currentColor;opacity:0.7}
.bz-lsl-fleck[data-k="2"]{right:-4px;top:-9px;width:2px;height:2px;opacity:0.5}
.bz-lsl-stamp-w{font:800 11px/1 var(--bz-lsl-serif);letter-spacing:0.16em;text-transform:uppercase;padding-left:0.16em}
.bz-lsl-stamp-d{font:700 9px/1 var(--bz-lsl-mono);letter-spacing:0.04em}
.bz-lsl-tool{position:absolute;left:0;top:0;z-index:6;width:60px;height:73px;transform-origin:30px 73px;pointer-events:none;visibility:hidden}
.bz-lsl-tool[data-on="true"]{visibility:visible}
.bz-lsl-stamper{display:block;width:100%;height:100%;overflow:visible}
.bz-lsl-cast{position:absolute;left:0;top:0;z-index:5;border-radius:30%/40%;background:rgba(36,22,8,0.95);opacity:0;visibility:hidden;pointer-events:none}
.bz-lsl-cast[data-on="true"]{visibility:visible}
.bz-lsl-ik{fill:var(--bz-lsl-stamp)}
.bz-lsl-tool[data-kind="alt"] .bz-lsl-ik{fill:var(--bz-lsl-stamp-alt)}
.bz-lsl-tool[data-kind="reject"] .bz-lsl-ik{fill:#c4161c}
.bz-lsl-stamper .bz-lsl-tl{fill:#1f3a8a}
.bz-lsl-tool[data-kind="alt"] .bz-lsl-tl{fill:#17603f}
.bz-lsl-tool[data-kind="reject"] .bz-lsl-tl{fill:#b3141a}
.bz-lsl-stamper .bz-lsl-lbs{stroke:#1f3a8a}
.bz-lsl-tool[data-kind="alt"] .bz-lsl-lbs{stroke:#17603f}
.bz-lsl-tool[data-kind="reject"] .bz-lsl-lbs{stroke:#b3141a}
.bz-lsl-is{stroke:var(--bz-lsl-stamp)}
.bz-lsl-tool[data-kind="alt"] .bz-lsl-is{stroke:var(--bz-lsl-stamp-alt)}
.bz-lsl-tool[data-kind="reject"] .bz-lsl-is{stroke:#c4161c}
.bz-lsl-tool[data-kind="reject"] .bz-lsl-wk{fill:url(#__FID__-skR)}
.bz-lsl-tool[data-kind="reject"] .bz-lsl-wt{fill:url(#__FID__-stR)}
.bz-lsl-tool[data-kind="reject"] .bz-lsl-wf{fill:url(#__FID__-sfR)}
.bz-lsl-tool[data-kind="reject"] .bz-lsl-wp{fill:url(#__FID__-spR)}
.bz-lsl-tool[data-kind="reject"] .bz-lsl-lb{fill:#f1d9cf}
.bz-lsl-x{display:none}
.bz-lsl-tool[data-wear="chip"] .bz-lsl-x-chip,.bz-lsl-tool[data-wear="inkedge"] .bz-lsl-x-inkedge,.bz-lsl-tool[data-wear="drip"] .bz-lsl-x-drip,.bz-lsl-tool[data-wear="peel"] .bz-lsl-x-peel,.bz-lsl-tool[data-kind="reject"] .bz-lsl-x-red{display:inline}
.bz-lsl-tool[data-wear="peel"] .bz-lsl-lbl{transform:rotate(-1.4deg);transform-origin:29px 58px}
.bz-lsl-defs{position:absolute;width:0;height:0;overflow:hidden}
.bz-lsl-seal{position:absolute;left:50%;top:60%;z-index:3;width:212px;height:212px;color:var(--bz-lsl-seal);transform:translate(-50%,-50%) rotate(var(--bz-lsl-seal-rot,-8deg));visibility:hidden;opacity:0.9}
.bz-lsl-seal[data-on="true"]{visibility:visible}
.bz-lsl-seal svg{display:block;width:100%;height:100%;overflow:visible}
.bz-lsl-sl{fill:none;stroke:currentColor}
.bz-lsl-sf{fill:currentColor}
.bz-lsl-smudge{opacity:0.22}
.bz-lsl-seal-t{fill:currentColor;font:800 15px var(--bz-lsl-serif);letter-spacing:0.08em}
.bz-lsl-seal-c{fill:currentColor;font:800 15px var(--bz-lsl-serif);letter-spacing:0.16em;text-anchor:middle}
.bz-lsl-seal-d{fill:currentColor;font:700 10px var(--bz-lsl-mono);letter-spacing:0.06em;text-anchor:middle}
.bz-lsl-plate{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);border:0!important}
@container (max-width:559px){
.bz-lsl{--bz-lsl-slotw:84px}
.bz-lsl-arena{height:356px}
.bz-lsl-page{padding:0 10px 0 12px}
.bz-lsl-head{padding-top:16px;height:60px}
.bz-lsl-book{font-size:13px;letter-spacing:0.12em}
.bz-lsl-row{grid-template-columns:34px minmax(0,1fr) var(--bz-lsl-slotw);column-gap:6px;padding-right:10px}
.bz-lsl-cols{grid-template-columns:34px minmax(0,1fr) var(--bz-lsl-slotw);column-gap:6px;margin:0 -10px 0 -12px;padding-right:10px}
.bz-lsl-cols>[data-mark="number"]{font-size:0}
.bz-lsl-cols>[data-mark="particulars"]{padding-left:6px}
.bz-lsl-name{padding-left:6px}
.bz-lsl-text{font-size:13.5px}
.bz-lsl-tally{font-size:12px}
.bz-lsl-win{top:84px;bottom:16px}
.bz-lsl-stamp-w{font-size:9.5px;letter-spacing:0.08em}
.bz-lsl-stamp-d{font-size:8px}
.bz-lsl-stamp[data-reject="true"] .bz-lsl-stamp-w{font-size:10.5px;letter-spacing:0.1em}
.bz-lsl-stamp[data-reject="true"] .bz-lsl-stamp-d{font-size:7.5px}
.bz-lsl-seal{width:190px;height:190px;top:68%}
.bz-lsl-mark{width:160px;height:160px;margin:-80px 0 0 -80px}
}
`;

/* ---------------- the component ---------------- */

function ledgerPalette(p: LedgerStampLoaderProps["palette"]): LedgerStampLoaderPalette {
  if (!p) return LEDGER_STAMP_LOADER_PALETTES.navy;
  return typeof p === "string" ? LEDGER_STAMP_LOADER_PALETTES[p] ?? LEDGER_STAMP_LOADER_PALETTES.navy : p;
}

/**
 * The stamper: a lathe-turned wooden handle, a brass ferrule, a beech mount
 * with long grain on its face and end grain on its side, a paper index label
 * naming the impression, a foam cushion and an inked rubber die. Seen from
 * slightly above and to the left, so the mount shows its top and one end.
 * The marks of use (a chipped knob, an ink-stained die edge, a dried drip, a
 * peeling label) are drawn here and switched on by the arena, one per run.
 */
function LedgerStamper({ fid }: { fid: string }) {
  const g = (k: string) => `${fid}-${k}`;
  return (
    <svg className="bz-lsl-stamper" viewBox="0 0 60 73" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={g("sk")} cx="36%" cy="30%" r="72%">
          <stop offset="0" stopColor="#e7b884" />
          <stop offset="0.45" stopColor="#b0713e" />
          <stop offset="0.85" stopColor="#6f3f1b" />
          <stop offset="1" stopColor="#4a2810" />
        </radialGradient>
        <radialGradient id={g("skR")} cx="36%" cy="30%" r="72%">
          <stop offset="0" stopColor="#a87856" />
          <stop offset="0.45" stopColor="#6b402a" />
          <stop offset="0.85" stopColor="#3e2416" />
          <stop offset="1" stopColor="#28160c" />
        </radialGradient>
        <linearGradient id={g("st")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#4f2c12" />
          <stop offset="0.3" stopColor="#b77b46" />
          <stop offset="0.48" stopColor="#dca46c" />
          <stop offset="0.75" stopColor="#8d5629" />
          <stop offset="1" stopColor="#45260f" />
        </linearGradient>
        <linearGradient id={g("stR")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#24140b" />
          <stop offset="0.3" stopColor="#6d4430" />
          <stop offset="0.48" stopColor="#93664a" />
          <stop offset="0.75" stopColor="#4d2e1d" />
          <stop offset="1" stopColor="#20110a" />
        </linearGradient>
        <linearGradient id={g("sb")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#5a4210" />
          <stop offset="0.32" stopColor="#efd283" />
          <stop offset="0.55" stopColor="#b88f35" />
          <stop offset="1" stopColor="#4d380c" />
        </linearGradient>
        <linearGradient id={g("sf")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#d39b62" />
          <stop offset="0.55" stopColor="#ae7340" />
          <stop offset="1" stopColor="#7c4c24" />
        </linearGradient>
        <linearGradient id={g("sfR")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#7a4e35" />
          <stop offset="0.55" stopColor="#5a3624" />
          <stop offset="1" stopColor="#3a2216" />
        </linearGradient>
        <linearGradient id={g("sp")} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#ecc08c" />
          <stop offset="1" stopColor="#c48a52" />
        </linearGradient>
        <linearGradient id={g("spR")} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#9a6d50" />
          <stop offset="1" stopColor="#6a4430" />
        </linearGradient>
        <linearGradient id={g("se")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#80532c" />
          <stop offset="1" stopColor="#5c3a1c" />
        </linearGradient>
        <clipPath id={g("kc")}>
          <ellipse cx="30.5" cy="10.5" rx="13" ry="10" />
        </clipPath>
      </defs>
      {/* The mount: end grain on its right end, long grain across the top and the face. */}
      <path d="M55 50L58 47V63L55 66Z" fill={`url(#${g("se")})`} />
      <path d="M55.9 52.4c.9 1.9.9 4.6 0 6.8M56.9 51.2c1 2.6 1 6.2 0 9" fill="none" stroke="rgba(50,26,10,0.45)" strokeWidth="0.35" />
      <path className="bz-lsl-wp" d="M3 50H55L58 47H6Z" fill={`url(#${g("sp")})`} />
      <path d="M8 48.6C20 48 33 49.1 53 48.3M11 49.4C24 48.9 38 49.8 52 49.2" fill="none" stroke="rgba(90,50,20,0.3)" strokeWidth="0.3" />
      <rect className="bz-lsl-wf" x="3" y="50" width="52" height="16" fill={`url(#${g("sf")})`} />
      <path d="M3 52.8C12 52.1 22 53.6 33 52.9S49 52.3 55 53.2M3 56.4C10 55.9 19 57 30 56.5S47 55.8 55 56.6M3 61.6C14 61 25 62.4 36 61.7S50 61.2 55 62M3 64.4C16 64 29 64.9 55 64.3" fill="none" stroke="rgba(70,36,14,0.32)" strokeWidth="0.35" />
      <ellipse cx="47.5" cy="60" rx="1.9" ry="1" fill="none" stroke="rgba(70,36,14,0.45)" strokeWidth="0.35" />
      <path d="M3.4 50.5H54.6" stroke="rgba(255,236,205,0.55)" strokeWidth="0.5" />
      <path d="M3 65.6H55" stroke="rgba(30,15,5,0.45)" strokeWidth="0.8" />
      <circle cx="9.5" cy="63.3" r="0.45" fill="rgba(40,20,8,0.5)" />
      <circle cx="51" cy="54.6" r="0.35" fill="rgba(40,20,8,0.45)" />
      {/* The index label, glued to the face. */}
      <g className="bz-lsl-lbl">
        <rect className="bz-lsl-lb" x="13" y="52.4" width="33" height="11.2" rx="0.6" fill="#efe4c8" stroke="rgba(90,60,30,0.5)" strokeWidth="0.35" />
        <rect className="bz-lsl-lbs" x="14.3" y="53.7" width="30.4" height="8.6" fill="none" strokeWidth="0.4" />
        <text className="bz-lsl-tl" x="29.5" y="59.9" textAnchor="middle" textLength="25" lengthAdjust="spacingAndGlyphs" fontSize="5.4" fontWeight="800" fontFamily="Georgia, serif">
          VERIFIED
        </text>
        <path className="bz-lsl-x bz-lsl-x-peel" d="M46 52.4H42.2L46 56.6Z" fill="#fbf4df" stroke="rgba(90,60,30,0.45)" strokeWidth="0.3" />
        <path className="bz-lsl-x bz-lsl-x-peel" d="M42.2 52.4L46 56.6L46.6 56.2Z" fill="rgba(40,20,8,0.35)" />
      </g>
      <path className="bz-lsl-x bz-lsl-x-drip bz-lsl-ik" d="M44.6 50C44.9 53 44.4 56.2 44.8 58.6C45 59.9 43.5 60.3 43.4 59C43.2 56.5 43.8 53 43.7 50Z" opacity="0.72" />
      <path className="bz-lsl-x bz-lsl-x-red" d="M5 58.5c2.5-1.2 5.5-.8 6.2.6.5 1.2-1.5 2.4-3.6 2.2-2.4-.2-4.3-1.6-2.6-2.8z" fill="#b3141a" opacity="0.45" />
      {/* Foam cushion and the rubber die, inked on its face. */}
      <rect x="4" y="66" width="50" height="2.6" fill="#9a907a" />
      <path d="M4 66.6H54" stroke="rgba(255,255,255,0.25)" strokeWidth="0.3" />
      <rect x="3.5" y="68.4" width="51" height="3.4" rx="0.5" fill="#2e2321" />
      <rect className="bz-lsl-ik" x="3.5" y="71" width="51" height="1.8" rx="0.4" opacity="0.92" />
      <path className="bz-lsl-x bz-lsl-x-inkedge bz-lsl-ik" d="M3.5 68.6C6 67.4 9.5 67.6 12 68.4C14 69 15.4 68.2 17 67.8L17 69H3.5ZM40 68.2C43 67.2 47 67.7 50 67.4C52 67.2 53.6 67.6 54.5 68.2V69.2H40Z" opacity="0.7" />
      <path className="bz-lsl-x bz-lsl-x-inkedge bz-lsl-ik" d="M6 66.1c1.2-.6 3-.4 3.4.4.3.6-.9 1-2 .9-1.3-.1-2.3-.7-1.4-1.3z" opacity="0.5" />
      <path className="bz-lsl-x bz-lsl-x-red" d="M3.5 68.4C8 67.2 14 67.5 20 68.2V69.2H3.5ZM36 68.1C42 67.1 49 67.4 54.5 68.4V69.2H36Z" fill="#b3141a" opacity="0.7" />
      {/* The brass ferrule and the turned handle. */}
      <rect x="21.5" y="41.4" width="18" height="6.4" rx="0.9" fill={`url(#${g("sb")})`} />
      <path d="M21.6 42.4H39.4M21.6 46.8H39.4" stroke="rgba(60,40,8,0.55)" strokeWidth="0.35" />
      <path className="bz-lsl-wt" d="M25.6 20.6H35.4C34.4 24.6 33.4 27 33.6 30C33.8 34.6 36.6 38.6 37.6 41.6H23.4C24.4 38.6 27.2 34.6 27.4 30C27.6 27 26.6 24.6 25.6 20.6Z" fill={`url(#${g("st")})`} />
      <path d="M27 24.6Q30.5 25.6 34 24.6M27.5 32.2Q30.5 33.2 33.5 32.2M25.2 38.2Q30.5 39.6 35.8 38.2" fill="none" stroke="rgba(50,25,8,0.55)" strokeWidth="0.45" />
      <rect className="bz-lsl-wt" x="23.4" y="17.6" width="14.2" height="3.6" rx="1.6" fill={`url(#${g("st")})`} />
      <path d="M23.8 20.8H37.2" stroke="rgba(40,20,6,0.5)" strokeWidth="0.4" />
      <ellipse className="bz-lsl-wk" cx="30.5" cy="10.5" rx="13" ry="10" fill={`url(#${g("sk")})`} />
      <g clipPath={`url(#${g("kc")})`} fill="none" stroke="rgba(60,30,10,0.24)" strokeWidth="0.4">
        <ellipse cx="27" cy="8" rx="4" ry="2.8" />
        <ellipse cx="27.5" cy="8.6" rx="7.4" ry="5.2" />
        <ellipse cx="28" cy="9.2" rx="10.6" ry="7.6" />
        <ellipse cx="28.6" cy="10" rx="14" ry="10" />
      </g>
      <ellipse cx="25.8" cy="5.8" rx="5.2" ry="2.5" transform="rotate(-18 25.8 5.8)" fill="rgba(255,246,228,0.55)" />
      <ellipse cx="34.5" cy="17.6" rx="6" ry="1.4" fill="rgba(30,14,4,0.25)" />
      <path className="bz-lsl-x bz-lsl-x-chip" d="M37.6 8.6C39.3 8.2 40.9 9.2 41.1 10.8C41.3 12.4 40.1 13.8 38.5 14C37.2 14.1 36.8 13.1 37.2 12.1C37.5 11.2 36.6 10.9 36.8 10C36.9 9.4 37.1 8.8 37.6 8.6Z" fill="#c9a37b" stroke="rgba(70,40,20,0.5)" strokeWidth="0.3" />
    </svg>
  );
}

/** Three inkings of the rubber: patchy coverage where the pad missed, and a rough edge where the ink spread. */
function LedgerFilters({ fid }: { fid: string }) {
  return (
    <svg className="bz-lsl-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        {[3, 11, 23].map((seed, k) => (
          <filter key={seed} id={`${fid}-ink${k}`} x="-10%" y="-20%" width="120%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency={0.55 + k * 0.12} numOctaves={2} seed={seed} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3.2 2.55" result="m" />
            <feComposite in="SourceGraphic" in2="m" operator="in" result="p" />
            <feTurbulence type="turbulence" baseFrequency="0.09" numOctaves={1} seed={seed + 5} result="w" />
            <feDisplacementMap in="p" in2="w" scale={1.6} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        ))}
        <filter id={`${fid}-print`} x="-2%" y="-10%" width="104%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves={1} seed={4} result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.3 1.55" result="m" />
          <feComposite in="SourceGraphic" in2="m" operator="in" result="p" />
          <feTurbulence type="turbulence" baseFrequency="0.6" numOctaves={1} seed={9} result="w" />
          <feDisplacementMap in="p" in2="w" scale={0.7} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={`${fid}-smear`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id={`${fid}-lead`} x="-2%" y="-200%" width="104%" height="500%">
          <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves={1} seed={7} result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2 1.7" result="m" />
          <feComposite in="SourceGraphic" in2="m" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}

export function LedgerStampLoader(props: LedgerStampLoaderProps) {
  const { title, headingLevel = 2, palette, colorScheme, className, style } = props;
  const fid = `bz-lsl-f${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const soundRef = useRef<LoaderSound | null>(null);
  const optsRef = useRef({ marks: LEDGER_MARKS, fid, sound: null as LoaderSound | null });
  optsRef.current = { marks: { ...LEDGER_MARKS, ...props.marks }, fid, sound: soundRef.current };
  const game = useMemo<LoaderGame>(() => ({ unit: "Entry", clear: "All entries verified", arena: (root, ctx) => createLedgerArena(root, ctx, () => optsRef.current) }), []);
  const api = useLoader(props, game);

  useEffect(() => {
    const s = createLoaderSound(() => api.rootRef.current, LEDGER_VOICES);
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
  }, [props.sound]);

  const pal = ledgerPalette(palette);
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
      className={`bz-lsl${className ? ` ${className}` : ""}`}
      aria-labelledby={api.titleId}
      data-phase={api.view.phase}
      data-motion={api.motionAllowed ? "on" : "off"}
      data-running={api.running ? "true" : "false"}
      style={rootStyle}
    >
      <style dangerouslySetInnerHTML={{ __html: LEDGER_CSS.split("__FID__").join(fid) }} />
      <LedgerFilters fid={fid} />
      <div className="bz-lsl-in">
        <Heading id={api.titleId} className="bz-lsl-title" tabIndex={-1}>
          {title}
        </Heading>
        <LoaderStepList api={api} />
        <div className="bz-lsl-stage">
          <div className="bz-lsl-arena">
            <div className="bz-lsl-art" aria-hidden="true">
              <div className="bz-lsl-page">
                <div className="bz-lsl-frame" />
                <div className="bz-lsl-mark" />
                <div className="bz-lsl-head">
                  <span className="bz-lsl-book" data-mark="book" />
                  <span className="bz-lsl-date" />
                </div>
                <div className="bz-lsl-cols">
                  <span data-mark="number" />
                  <span data-mark="particulars" />
                  <span data-mark="stampColumn" />
                </div>
                <div className="bz-lsl-win">
                  <div className="bz-lsl-rows" />
                </div>
                <div className="bz-lsl-seal" />
              </div>
              <div className="bz-lsl-cast" />
              <div className="bz-lsl-tool">
                <LedgerStamper fid={fid} />
              </div>
            </div>
            <div className="bz-lsl-veil" aria-hidden="true" />
            <LoaderPlate api={api} />
          </div>
        </div>
        <LoaderBox api={api} />
        <LoaderDetails api={api} />
      </div>
    </section>
  );
}
