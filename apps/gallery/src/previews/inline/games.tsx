"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";

import {
  EncounterLoader,
  ENCOUNTER_LOADER_PALETTES,
  type EncounterLoaderPaletteName,
  type LoaderCharacterName,
  type LoaderStat,
  type LoaderStep,
} from "bezel-ui/loaders/EncounterLoader";
import { BlockRunLoader, BLOCK_RUN_LOADER_PALETTES, type BlockRunLoaderPaletteName } from "bezel-ui/loaders/BlockRunLoader";
import { FlapGateLoader, FLAP_GATE_LOADER_PALETTES, type FlapGateLoaderPaletteName } from "bezel-ui/loaders/FlapGateLoader";
import { BrickWallLoader, BRICK_WALL_LOADER_PALETTES, type BrickWallLoaderPaletteName } from "bezel-ui/loaders/BrickWallLoader";
import { SnakeLineLoader, SNAKE_LINE_LOADER_PALETTES, type SnakeLineLoaderPaletteName } from "bezel-ui/loaders/SnakeLineLoader";
import { LedgerStampLoader, LEDGER_STAMP_LOADER_PALETTES, type LedgerStampLoaderPaletteName } from "bezel-ui/loaders/LedgerStampLoader";
import { RadarSweepLoader, RADAR_SWEEP_LOADER_PALETTES, type RadarSweepLoaderPaletteName } from "bezel-ui/loaders/RadarSweepLoader";
import { Caption, usePreviewEnv } from "../kit";
import type { PreviewModule, Tone } from "../types";

/*
 * The game loaders' gallery demo. The component is controlled, so the demo
 * plays the host: a small simulated process that reports uneven progress
 * events, finishes every step by default and loops politely. "Simulate a
 * failure" fails whatever step is running; the loader's own menu then calls
 * back to retry, skip or cancel it. None of this is part of the component.
 *
 * The run keeps going while someone points at the card (only the wait on the
 * results screen pauses then), so the failure button always has something to
 * fail. Under reduced motion nothing autoplays: the preview holds a still
 * mid-run snapshot and offers "Play a run".
 */

type DemoDef = {
  id: string;
  label: string;
  doneText: string;
  ms: number;
  count?: number;
  unit?: string;
  indeterminate?: boolean;
};

const DEMO_STEPS: DemoDef[] = [
  { id: "workspace", label: "Create the workspace", doneText: "Created the workspace", ms: 1400 },
  { id: "contacts", label: "Import 1,240 contacts", doneText: "Imported 1,240 contacts", ms: 3600, count: 1240, unit: "contacts" },
  { id: "calendar", label: "Sync your calendar", doneText: "Synced your calendar", ms: 2600, indeterminate: true },
  { id: "folders", label: "Index 12 folders", doneText: "Indexed 12 folders", ms: 3200, count: 12, unit: "folders" },
  { id: "welcome", label: "Send the welcome email", doneText: "Sent the welcome email", ms: 1200 },
];

const DEMO_TITLE = "Setting up your workspace";
const DEMO_COMPLETE = "Your workspace is ready.";
const DEMO_STATS: LoaderStat[] = [{ label: "Contacts", value: "1,240", sub: "imported" }];
const DEMO_ERROR = "The server stopped responding.";
const DEMO_ERROR_DETAIL = "Simulated from the gallery. Retry resumes from where it stopped.";

const TICK = 100;
const MAX_DT = 250;
const RESULTS_HOLD = 4000;
const RESTART_GAP = 600;
const COURTESY_RETRY = 10000;

/* ------------------------------------------------------------- the sim */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(...parts: Array<string | number>) {
  let h = 2166136261;
  for (const part of parts) {
    const s = String(part);
    for (let j = 0; j < s.length; j++) {
      h ^= s.charCodeAt(j);
      h = Math.imul(h, 16777619);
    }
    h ^= 0x9e37;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type Knot = { t: number; p: number };

type SimStep = {
  def: DemoDef;
  status: LoaderStep["status"];
  /** Time into the current progress curve, kept across a retry so it resumes. */
  t: number;
  /** Wall-clock time spent running, across attempts. */
  active: number;
  dur: number;
  knots: Knot[];
  rnd: () => number;
  nextAt: number;
  progress: number | null;
  detail?: string;
  attempt: number;
  reported: number;
  durationMs?: number;
  failAt: number | null;
  error?: string;
  errorDetail?: string;
};

type SimMode = "gap" | "running" | "error" | "complete" | "stopped" | "still";

type Sim = { run: number; mode: SimMode; idx: number; wait: number; errorFor: number; armed: number | null; once: boolean; steps: SimStep[] };

const fmt = (n: number) => n.toLocaleString("en-US");

/** Uneven, deterministic per run: the sim's progress curve has bursts and stalls, like a real process. */
function rollStep(def: DemoDef, run: number, index: number): SimStep {
  const rnd = mulberry32(hash(run, def.id, index));
  const dur = Math.round(def.ms * (0.8 + rnd() * 0.4));
  const k = 3 + Math.floor(rnd() * 3);
  const tw: number[] = [];
  const pw: number[] = [];
  for (let i = 0; i < k; i++) {
    tw.push(0.4 + rnd());
    pw.push(rnd() < 0.2 ? 0.05 : 0.3 + rnd() * 1.4);
  }
  const tSum = tw.reduce((a, b) => a + b, 0);
  const pSum = pw.reduce((a, b) => a + b, 0);
  const knots: Knot[] = [{ t: 0, p: 0 }];
  let at = 0;
  let ap = 0;
  for (let i = 0; i < k; i++) {
    at += tw[i] / tSum;
    ap += pw[i] / pSum;
    knots.push({ t: i === k - 1 ? 1 : at, p: i === k - 1 ? 1 : ap });
  }
  return { def, status: "pending", t: 0, active: 0, dur, knots, rnd, nextAt: 0, progress: null, attempt: 1, reported: 0, failAt: null };
}

function curve(knots: Knot[], f: number) {
  if (f <= 0) return 0;
  if (f >= 1) return 1;
  for (let i = 1; i < knots.length; i++) {
    if (f <= knots[i].t) {
      const a = knots[i - 1];
      const b = knots[i];
      return a.p + ((f - a.t) / (b.t - a.t)) * (b.p - a.p);
    }
  }
  return 1;
}

const nextGap = (s: SimStep) => (s.def.indeterminate ? 1000 : 250 + Math.round(s.rnd() * 450));

function freshSim(run: number, once: boolean): Sim {
  return { run, mode: "gap", idx: 0, wait: RESTART_GAP, errorFor: 0, armed: null, once, steps: DEMO_STEPS.map((d, i) => rollStep(d, run, i)) };
}

/** The reduced-motion still: step 1 done, step 2 half way, the rest waiting. Nothing ticks, so it measures the same twice. */
function stillSim(run: number): Sim {
  const sim = freshSim(run, true);
  sim.mode = "still";
  sim.idx = 1;
  const [first, second] = sim.steps;
  first.status = "done";
  first.progress = 1;
  first.durationMs = 1200;
  second.status = "active";
  second.progress = 0.5;
  second.t = second.dur * 0.5;
  second.active = 1800;
  second.reported = 1800;
  second.detail = "620 of 1,240 contacts";
  return sim;
}

function report(s: SimStep, raw: number) {
  s.reported = Math.round(s.active);
  if (s.def.indeterminate) return;
  const count = s.def.count;
  if (count) {
    const k = Math.min(count - 1, Math.floor(raw * count));
    s.progress = k / count;
    s.detail = `${fmt(k)} of ${fmt(count)} ${s.def.unit ?? ""}`.trim();
  } else s.progress = Math.min(0.99, Math.round(raw * 100) / 100);
}

function startStep(sim: Sim, i: number) {
  const s = sim.steps[i];
  sim.idx = i;
  s.status = "active";
  s.t = 0;
  s.active = 0;
  s.reported = 0;
  s.progress = s.def.indeterminate ? null : 0;
  s.detail = s.def.count ? `0 of ${fmt(s.def.count)} ${s.def.unit ?? ""}`.trim() : undefined;
  s.nextAt = nextGap(s);
  s.failAt = sim.armed === i ? 0.4 : null;
  if (sim.armed === i) sim.armed = null;
}

function moveOn(sim: Sim) {
  const next = sim.idx + 1;
  if (next >= sim.steps.length) {
    sim.mode = "complete";
    sim.wait = RESULTS_HOLD;
  } else {
    startStep(sim, next);
    sim.mode = "running";
  }
}

function failStep(sim: Sim) {
  const s = sim.steps[sim.idx];
  s.status = "error";
  s.error = DEMO_ERROR;
  s.errorDetail = DEMO_ERROR_DETAIL;
  s.reported = Math.round(s.active);
  s.failAt = null;
  sim.mode = "error";
  sim.errorFor = 0;
}

function retryStep(sim: Sim) {
  const s = sim.steps[sim.idx];
  if (s.status !== "error") return;
  s.status = "active";
  s.attempt += 1;
  s.error = undefined;
  s.errorDetail = undefined;
  s.nextAt = s.t + nextGap(s);
  sim.mode = "running";
}

/** Advances the sim by dt of real time. Returns whether the host's steps changed. */
function tickSim(sim: Sim, dt: number, engaged: boolean): boolean {
  switch (sim.mode) {
    case "gap":
      sim.wait -= dt;
      if (sim.wait > 0) return false;
      startStep(sim, 0);
      sim.mode = "running";
      return true;
    case "complete":
      if (sim.once || engaged) return false;
      sim.wait -= dt;
      if (sim.wait > 0) return false;
      Object.assign(sim, freshSim(sim.run + 1, false));
      return true;
    case "error":
      if (engaged) {
        sim.errorFor = 0;
        return false;
      }
      sim.errorFor += dt;
      if (sim.errorFor < COURTESY_RETRY) return false;
      retryStep(sim);
      return true;
    case "running": {
      const s = sim.steps[sim.idx];
      s.t += dt;
      s.active += dt;
      const raw = s.t >= s.dur ? 1 : curve(s.knots, s.t / s.dur);
      if (s.failAt != null && (s.def.indeterminate ? s.t / s.dur : raw) >= s.failAt) {
        report(s, raw);
        failStep(sim);
        return true;
      }
      if (s.t >= s.dur) {
        s.status = "done";
        s.progress = 1;
        if (s.def.count) s.detail = `${fmt(s.def.count)} of ${fmt(s.def.count)} ${s.def.unit ?? ""}`.trim();
        s.durationMs = Math.round(s.active);
        moveOn(sim);
        return true;
      }
      if (s.t >= s.nextAt) {
        report(s, raw);
        s.nextAt = s.t + nextGap(s);
        return true;
      }
      return false;
    }
    default:
      return false;
  }
}

const toLoaderStep = (s: SimStep): LoaderStep => ({
  id: s.def.id,
  label: s.def.label,
  status: s.status,
  doneText: s.def.doneText,
  count: s.def.count,
  progress: s.def.indeterminate || s.status === "pending" ? null : s.progress,
  detail: s.status === "pending" ? undefined : s.detail,
  attempt: s.attempt > 1 ? s.attempt : undefined,
  elapsedMs: s.status === "active" || s.status === "error" ? s.reported : undefined,
  durationMs: s.durationMs,
  error: s.error,
  errorDetail: s.errorDetail,
});

/* ----------------------------------------------------------- the host hook */

type DemoRun = {
  steps: LoaderStep[];
  mode: SimMode;
  /** Changes when the still snapshot replaces a run, so the loader mounts mid-run instead of narrating it. */
  epoch: number;
  reduced: boolean;
  failNow: () => void;
  playRun: () => void;
  onRetry: (id: string) => void;
  onSkip: (id: string) => void;
  onCancel: () => void;
  onContinue: () => void;
};

/**
 * The demo host shared by the five game loaders. Its clock is its own 100ms
 * interval with real elapsed time (capped, and skipped in a hidden tab). It
 * does not stop when someone engages the preview; only the pause on the
 * results screen waits for them to leave.
 */
function useDemoRun(): DemoRun {
  const { engaged, reducedMotion } = usePreviewEnv();
  const engagedRef = useRef(engaged);
  engagedRef.current = engaged;
  const simRef = useRef<Sim>(freshSim(1, false));
  const [steps, setSteps] = useState<LoaderStep[]>(() => simRef.current.steps.map(toLoaderStep));
  const [mode, setMode] = useState<SimMode>("gap");
  const [epoch, setEpoch] = useState(0);

  const publish = useCallback(() => {
    const sim = simRef.current;
    setSteps(sim.steps.map(toLoaderStep));
    setMode(sim.mode);
  }, []);

  useEffect(() => {
    simRef.current = reducedMotion ? stillSim(simRef.current.run + 1) : freshSim(simRef.current.run + 1, false);
    setEpoch((e) => e + 1);
    publish();
  }, [reducedMotion, publish]);

  useEffect(() => {
    let last = performance.now();
    const id = window.setInterval(() => {
      const t = performance.now();
      const dt = Math.min(MAX_DT, t - last);
      last = t;
      if (document.visibilityState === "hidden") return;
      if (tickSim(simRef.current, dt, engagedRef.current)) publish();
    }, TICK);
    return () => window.clearInterval(id);
  }, [publish]);

  const restart = useCallback(
    (wait: number) => {
      const sim = freshSim(simRef.current.run + 1, reducedMotion);
      sim.wait = wait;
      simRef.current = sim;
      publish();
    },
    [publish, reducedMotion],
  );

  const failNow = useCallback(() => {
    const sim = simRef.current;
    if (sim.mode === "running" || sim.mode === "still") {
      const s = sim.steps[sim.idx];
      if (s.status !== "active") return;
      failStep(sim);
    } else if (sim.mode === "gap") {
      sim.armed = 0;
    } else if (sim.mode === "complete") {
      const next = freshSim(sim.run + 1, sim.once);
      next.armed = 1;
      next.wait = 300;
      simRef.current = next;
    } else return;
    publish();
  }, [publish]);

  const onRetry = useCallback(
    (id: string) => {
      const sim = simRef.current;
      if (sim.steps[sim.idx]?.def.id !== id) return;
      retryStep(sim);
      publish();
    },
    [publish],
  );

  const onSkip = useCallback(
    (id: string) => {
      const sim = simRef.current;
      const s = sim.steps[sim.idx];
      if (!s || s.def.id !== id) return;
      s.status = "skipped";
      s.error = undefined;
      s.errorDetail = undefined;
      moveOn(sim);
      publish();
    },
    [publish],
  );

  const onCancel = useCallback(() => {
    simRef.current.mode = "stopped";
    setMode("stopped");
  }, []);

  return {
    steps,
    mode,
    epoch,
    reduced: reducedMotion,
    failNow,
    playRun: () => restart(200),
    onRetry,
    onSkip,
    onCancel,
    onContinue: () => restart(300),
  };
}

/* --------------------------------------------------------------- controls */

const cardRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]";
const voidRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffffff]";

const CHARACTER_NAMES: LoaderCharacterName[] = ["ember", "tide", "moss", "plum"];
const capital = (s: string) => s[0].toUpperCase() + s.slice(1);

function DemoButton({
  tone,
  children,
  pressed,
  disabled,
  expanded,
  controls,
  onClick,
}: {
  tone: Tone;
  children: ReactNode;
  pressed?: boolean;
  disabled?: boolean;
  expanded?: boolean;
  controls?: string;
  onClick: () => void;
}) {
  const look =
    tone === "void"
      ? `border-white/50 bg-white/5 text-white hover:bg-white/10 aria-pressed:border-white aria-pressed:bg-white aria-pressed:text-[#0a0a0a] ${voidRing}`
      : `border-[#8a8a8e] bg-white text-[#0a0a0a] hover:bg-[#f0f0f0] aria-pressed:border-[#0a0a0a] aria-pressed:bg-[#0a0a0a] aria-pressed:text-white ${cardRing}`;
  /* aria-disabled rather than disabled: a disabled button drops keyboard focus to the page. */
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-expanded={expanded}
      aria-controls={controls}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onClick}
      className={`inline-flex min-h-[48px] items-center rounded-full border px-5 text-sm font-medium transition-colors duration-150 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 ${look}`}
    >
      {children}
    </button>
  );
}

function Segmented<T extends string>({ tone, label, options, value, onChange, name }: { tone: Tone; label: string; options: T[]; value: T; onChange: (v: T) => void; name?: (v: T) => string }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      <Caption className="mr-1">{label}</Caption>
      {options.map((o) => (
        <DemoButton key={o} tone={tone} pressed={o === value} onClick={() => onChange(o)}>
          {name ? name(o) : capital(o)}
        </DemoButton>
      ))}
    </div>
  );
}

type GameRenderProps = {
  steps: LoaderStep[];
  title: string;
  headingLevel: 3;
  palette: string;
  character: LoaderCharacterName;
  colorScheme?: "light" | "dark";
  completeText: string;
  stats: LoaderStat[];
  onRetry: (id: string) => void;
  onSkip: (id: string) => void;
  onCancel: () => void;
  onContinue: () => void;
};

/* ------------------------------------------------------------ fitting */

/* The self-fitting arrangement (opt in with `fit` on GameDemo, and give the
   spec no `fit` of its own): the loader at its real width, demo controls
   beside it or under it, scaled to the stage the way the stage's FitBox
   scales, but arranged for the stage first. */
const LOADER_W = 600;
const SIDE_GAP = 24;
const SIDE_W = 232;
/** The side column's height before it is measured, so the choice of arrangement never flips on its own result. */
const SIDE_ESTIMATE = 400;
/** The one row of demo controls under a stacked loader. */
const STACK_EXTRA = 64;
const HAIRLINE: Record<Tone, string> = { void: "rgba(255,255,255,0.16)", paper: "rgba(10,10,10,0.13)", cream: "rgba(10,10,10,0.13)" };

type GameFitOptions = {
  /** In a card, show the loader down to the bottom of this element (its arena) and crop the rest. */
  cropTo: string;
  /** The loader's own bordered box, whose border the crop redraws so the cut edge is finished. */
  frame: string;
};

type Arrangement = "crop" | "side" | "stack";

/**
 * - card: the title and the arena only, laid out at the card's own width, so
 *   the game reads at a glance instead of the whole dialogue box at a third of
 *   its size. The card is inert until pointed at, and the full demo is on the
 *   component page.
 * - wide stage: the loader at 600px with the demo controls in a column beside it.
 * - narrow or tall stage: the loader at the stage's width, which is its own
 *   narrow layout, with one row of controls under it and the rest behind Options.
 * Whichever of side and stack shows the loader larger wins.
 */
function useGameFit(size: string) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const loader = useRef<HTMLDivElement>(null);
  const [m, setM] = useState({ w: 0, h: 0, innerH: 0, loaderH: 0 });
  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const measure = () => {
      const next = { w: o.clientWidth, h: o.clientHeight, innerH: i.offsetHeight, loaderH: loader.current?.offsetHeight ?? 0 };
      setM((p) => (p.w === next.w && p.h === next.h && p.innerH === next.innerH && p.loaderH === next.loaderH ? p : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(o);
    ro.observe(i);
    if (loader.current) ro.observe(loader.current);
    return () => ro.disconnect();
  }, []);
  const pad = Math.max(16, Math.min(32, m.w * 0.05));
  const aw = m.w - pad * 2;
  const ah = m.h - pad * 2;
  let arrangement: Arrangement = size === "card" ? "crop" : "stack";
  let width = Math.round(Math.max(300, Math.min(LOADER_W, aw)));
  // A crop taller than the card scales down anyway, so lay it out wider by the same factor: the
  // nameplate gets room for its count at no cost in size. It stays under 560px, the narrow layout.
  if (arrangement === "crop" && m.innerH > ah && ah > 0) width = Math.round(Math.min(559, Math.max(width, (aw * m.innerH) / ah)));
  if (arrangement === "stack" && aw >= LOADER_W && m.loaderH) {
    const side = Math.min(1, aw / (LOADER_W + SIDE_GAP + SIDE_W), ah / Math.max(m.loaderH, SIDE_ESTIMATE));
    const stack = Math.min(1, ah / (m.loaderH + STACK_EXTRA));
    if (side > stack) {
      arrangement = "side";
      width = LOADER_W + SIDE_GAP + SIDE_W;
    }
  }
  const scale = m.w && m.innerH ? Math.min(1, aw / width, ah / m.innerH) : 0;
  return { outer, inner, loader, arrangement, width, scale };
}

/** The card's crop: the loader's top down to the bottom of its arena, with the loader's border redrawn round the cut. */
function useCrop(on: boolean, opts: GameFitOptions | undefined, box: RefObject<HTMLDivElement>) {
  const [h, setH] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = box.current;
    if (!on || !opts || !el) return;
    const measure = () => {
      const to = el.querySelector<HTMLElement>(opts.cropTo);
      const frame = el.querySelector<HTMLElement>(opts.frame);
      if (!to || !frame) return;
      const cs = getComputedStyle(frame);
      // Layout offsets, not client rects, so the stage's scale does not leak in. The box and the frame are both positioned.
      const bottom = frame.offsetTop + to.offsetTop + to.offsetHeight;
      // The frame's bottom padding closes the crop, but never so far that the next element's edge shows.
      const next = to.nextElementSibling as HTMLElement | null;
      const room = next && next.offsetParent === to.offsetParent ? next.offsetTop - (to.offsetTop + to.offsetHeight) - 2 : Infinity;
      const pad = Math.max(0, Math.min(parseFloat(cs.paddingBottom) || 0, room));
      const h = Math.ceil(bottom + pad + (parseFloat(cs.borderBottomWidth) || 0));
      if (Number.isFinite(h) && h > 0) setH(h);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [on, opts, box]);
  return on ? h : null;
}

/** One game's preview: the loader, then the demo controls under it, outside its frame. */
function GameDemo({
  tone,
  character: firstCharacter,
  palettes,
  render,
  fit,
  sound: hasSound,
}: {
  tone: Tone;
  /** The game loaders' adventurer. Leave it out for a loader without one, and the Character picker goes. */
  character?: LoaderCharacterName;
  palettes: string[];
  render: (p: GameRenderProps, extra: { sound: boolean }) => ReactNode;
  /** The loader can play sound: show a Sound toggle, on by default in the demo. */
  sound?: boolean;
  /** Arrange and scale for the stage here, instead of the spec's fixed `fit` width. */
  fit?: GameFitOptions;
}) {
  const { size } = usePreviewEnv();
  const demo = useDemoRun();
  const [palette, setPalette] = useState(palettes[0]);
  const [character, setCharacter] = useState<LoaderCharacterName>(firstCharacter ?? "ember");
  const [soundOn, setSoundOn] = useState(true);
  const [scheme, setScheme] = useState<"light" | "dark">(tone === "void" ? "dark" : "light");
  const large = size === "large";
  const stopped = demo.mode === "stopped";
  const textTone = tone === "void" ? "text-white" : "text-[#0a0a0a]";
  const loaderBox = useRef<HTMLDivElement>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsId = useId();
  const stage = useGameFit(size);
  const cropH = useCrop(!!fit && stage.arrangement === "crop", fit, loaderBox);

  /* The visitor asked for the failure, so focus follows it to the loader's
     error menu once it opens, unless they have moved on in the meantime. */
  const failAndFollow = () => {
    const from = document.activeElement;
    const t0 = performance.now();
    demo.failNow();
    const seek = () => {
      if (document.activeElement !== from) return;
      const first = loaderBox.current?.querySelector<HTMLElement>('[role="group"] button[tabindex="0"]');
      if (first && getComputedStyle(first).visibility === "visible") first.focus();
      else if (performance.now() - t0 < 10000) requestAnimationFrame(seek);
    };
    requestAnimationFrame(seek);
  };

  const loader = render({
    steps: demo.steps,
    title: DEMO_TITLE,
    headingLevel: 3,
    palette,
    character,
    colorScheme: large ? scheme : undefined,
    completeText: DEMO_COMPLETE,
    stats: DEMO_STATS,
    onRetry: demo.onRetry,
    onSkip: demo.onSkip,
    onCancel: demo.onCancel,
    onContinue: demo.onContinue,
  }, { sound: !!hasSound && soundOn });

  /* On the results screen a failure can only come in the next run, so the button says so. */
  const mainLabel = stopped ? "Start a new run" : demo.mode === "complete" ? "Replay with a failure" : "Simulate a failure";
  const mainButtons = (
    <>
      {demo.reduced && !stopped ? (
        <DemoButton key="play" tone={tone} onClick={demo.playRun}>
          Play a run
        </DemoButton>
      ) : null}
      {/* One button that changes job, so focus stays on it when a stopped run starts again. */}
      <DemoButton key="main" tone={tone} disabled={!stopped && demo.mode === "error"} onClick={stopped ? demo.playRun : failAndFollow}>
        {mainLabel}
      </DemoButton>
      {hasSound ? (
        <DemoButton key="sound" tone={tone} pressed={soundOn} onClick={() => setSoundOn((v) => !v)}>
          Sound
        </DemoButton>
      ) : null}
    </>
  );
  const pickers = (
    <>
      <Segmented tone={tone} label="Palette" options={palettes} value={palette} onChange={setPalette} />
      {firstCharacter ? <Segmented tone={tone} label="Character" options={CHARACTER_NAMES} value={character} onChange={setCharacter} /> : null}
      <Segmented tone={tone} label="Theme" options={["light", "dark"] as Array<"light" | "dark">} value={scheme} onChange={setScheme} />
    </>
  );

  if (!fit) {
    return (
      <div className={`flex w-full flex-col gap-4 ${textTone}`}>
        <div key={demo.epoch} ref={loaderBox}>
          {loader}
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Caption>Gallery demo, not part of the component</Caption>
            {mainButtons}
          </div>
          {large ? <div className="flex flex-wrap items-center gap-x-6 gap-y-3">{pickers}</div> : null}
        </div>
      </div>
    );
  }

  const { arrangement } = stage;
  const crop = arrangement === "crop";
  return (
    <div ref={stage.outer} className={`absolute inset-0 flex items-center justify-center overflow-hidden ${textTone}`}>
      {crop ? <style>{`[data-game-crop] ${fit.frame}{border-color:transparent}`}</style> : null}
      <div
        ref={stage.inner}
        className={arrangement === "side" ? "flex items-start" : "flex flex-col gap-4"}
        style={{
          width: stage.width,
          flex: "none",
          gap: arrangement === "side" ? SIDE_GAP : undefined,
          transform: `scale(${stage.scale})`,
          transformOrigin: "center center",
          visibility: stage.scale ? "visible" : "hidden",
        }}
      >
        <div ref={stage.loader} className="min-w-0" style={{ width: arrangement === "side" ? LOADER_W : "100%", flex: "none" }}>
          <div
            key={demo.epoch}
            ref={loaderBox}
            className="relative"
            data-game-crop={crop || undefined}
            style={crop ? { height: cropH ?? undefined, overflow: "hidden", borderRadius: 16 } : undefined}
          >
            {loader}
            {crop ? (
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[16px]" style={{ boxShadow: `inset 0 0 0 1px ${HAIRLINE[tone]}` }} />
            ) : null}
          </div>
        </div>
        {crop ? null : arrangement === "side" ? (
          <div className="flex min-w-0 flex-col items-start gap-5 pt-1" style={{ width: SIDE_W, flex: "none" }}>
            <Caption>Gallery demo, not part of the component</Caption>
            <div className="flex flex-wrap gap-2">{mainButtons}</div>
            {pickers}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <Caption>Gallery demo, not part of the component</Caption>
              {mainButtons}
              <DemoButton tone={tone} expanded={optionsOpen} controls={optionsId} onClick={() => setOptionsOpen((o) => !o)}>
                Options
              </DemoButton>
            </div>
            <div id={optionsId} className={`${optionsOpen ? "flex" : "hidden"} flex-wrap items-center gap-x-6 gap-y-3`}>
              {pickers}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- previews */

function EncounterLoaderPreview() {
  return (
    <GameDemo
      tone="void"
      character="ember"
      palettes={Object.keys(ENCOUNTER_LOADER_PALETTES)}
      fit={ENCOUNTER_FIT}
      render={(p) => <EncounterLoader {...p} palette={p.palette as EncounterLoaderPaletteName} />}
    />
  );
}

const ENCOUNTER_FIT: GameFitOptions = { cropTo: ".bz-enc-stage", frame: ".bz-enc-in" };

function BlockRunLoaderPreview() {
  return (
    <GameDemo
      tone="paper"
      character="tide"
      palettes={Object.keys(BLOCK_RUN_LOADER_PALETTES)}
      fit={BLOCK_RUN_FIT}
      render={(p) => <BlockRunLoader {...p} palette={p.palette as BlockRunLoaderPaletteName} />}
    />
  );
}

const BLOCK_RUN_FIT: GameFitOptions = { cropTo: ".bz-brl-stage", frame: ".bz-brl-in" };

function FlapGateLoaderPreview() {
  return (
    <GameDemo
      tone="paper"
      character="moss"
      palettes={Object.keys(FLAP_GATE_LOADER_PALETTES)}
      fit={FLAP_GATE_FIT}
      render={(p) => <FlapGateLoader {...p} palette={p.palette as FlapGateLoaderPaletteName} />}
    />
  );
}

const FLAP_GATE_FIT: GameFitOptions = { cropTo: ".bz-fgl-arena", frame: ".bz-fgl-frame" };

function BrickWallLoaderPreview() {
  return (
    <GameDemo
      tone="void"
      character="plum"
      palettes={Object.keys(BRICK_WALL_LOADER_PALETTES)}
      fit={BRICK_WALL_FIT}
      render={(p) => <BrickWallLoader {...p} palette={p.palette as BrickWallLoaderPaletteName} />}
    />
  );
}

const BRICK_WALL_FIT: GameFitOptions = { cropTo: ".bz-bwl-arena", frame: ".bz-bwl-in" };

function SnakeLineLoaderPreview() {
  return (
    <GameDemo
      tone="paper"
      character="tide"
      palettes={Object.keys(SNAKE_LINE_LOADER_PALETTES)}
      fit={SNAKE_LINE_FIT}
      render={(p) => <SnakeLineLoader {...p} palette={p.palette as SnakeLineLoaderPaletteName} />}
    />
  );
}

const SNAKE_LINE_FIT: GameFitOptions = { cropTo: ".bz-snl-stage", frame: ".bz-snl-in" };

/* The concept loaders share the demo host but have no adventurer, so `character` is dropped. */

function LedgerStampLoaderPreview() {
  return (
    <GameDemo
      tone="cream"
      palettes={Object.keys(LEDGER_STAMP_LOADER_PALETTES)}
      fit={LEDGER_STAMP_FIT}
      sound
      render={({ character: _c, ...p }, x) => <LedgerStampLoader {...p} sound={x.sound} palette={p.palette as LedgerStampLoaderPaletteName} />}
    />
  );
}

const LEDGER_STAMP_FIT: GameFitOptions = { cropTo: ".bz-lsl-stage", frame: ".bz-lsl-in" };

function RadarSweepLoaderPreview() {
  return (
    <GameDemo
      tone="void"
      palettes={Object.keys(RADAR_SWEEP_LOADER_PALETTES)}
      fit={RADAR_SWEEP_FIT}
      sound
      render={({ character: _c, ...p }, x) => <RadarSweepLoader {...p} sound={x.sound} palette={p.palette as RadarSweepLoaderPaletteName} />}
    />
  );
}

const RADAR_SWEEP_FIT: GameFitOptions = { cropTo: ".bz-rsl-stage", frame: ".bz-rsl-in" };

export const previews: PreviewModule = {
  "encounter-loader": EncounterLoaderPreview,
  "block-run-loader": BlockRunLoaderPreview,
  "flap-gate-loader": FlapGateLoaderPreview,
  "brick-wall-loader": BrickWallLoaderPreview,
  "snake-line-loader": SnakeLineLoaderPreview,
  "ledger-stamp-loader": LedgerStampLoaderPreview,
  "radar-sweep-loader": RadarSweepLoaderPreview,
};
