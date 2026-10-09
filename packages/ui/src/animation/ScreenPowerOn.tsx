"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

/**
 * Whatever it wraps switches on like an old CRT set. The tube warms in the
 * dark for a beat, a bright phosphor dot appears at the centre and holds,
 * then the deflection opens the picture: a square grows to full height,
 * widens to the full width with a small overshoot, a burst of static passes,
 * and the phosphor tint, glow, scanlines and vignette fade into the normal
 * content.
 *
 * The picture is the real content, squeezed with a transform, never a copy.
 * Only transform and opacity animate (Web Animations API), so the whole run
 * stays on the compositor: no per-frame script, no animated filter, clip-path
 * or border-radius. The squeeze is sized from the wrapper's own box, so it
 * works in a card as well as a full page. Once the run ends every effect
 * layer is removed and the content is exactly what it was.
 *
 * Beats, as fractions of `duration` (3000ms by default):
 *   0 to 0.175  dark: the set is on, the tube warms up
 *   0.175 to 0.31  the dot appears, flickers and holds
 *   0.31 to 0.535  a square opens out to full height
 *   0.535 to 0.685  it widens to the full width, overshooting a touch
 *   0.685 to 0.825  it settles; the glass clears by 0.95
 *
 * Reduced motion gets a 200ms fade and nothing else. Without scripting the
 * content is simply shown.
 */

export type ScreenPowerOnTint = "green" | "amber" | "white" | (string & {});

export type ScreenPowerOnProps = {
  children?: ReactNode;
  /**
   * Plays on mount when true (the default). Changing it to true plays again;
   * changing it to false stops a run and shows the content.
   */
  play?: boolean;
  /** Length of the whole run in ms. Default 3000; the beats keep their proportions. */
  duration?: number;
  /** Phosphor colour: "green" (default), "amber", "white", or any CSS colour. */
  tint?: ScreenPowerOnTint;
  /**
   * A synthesized thump, a faint whine and a burst of static. Off by default,
   * and heard only once the visitor has pressed something on the page.
   */
  sound?: boolean;
  /** Called when a run finishes (not when it is stopped or replaced). */
  onComplete?: () => void;
  className?: string;
  style?: CSSProperties;
};

export type ScreenPowerOnHandle = {
  /** Switch the screen off and play the power-on again. */
  replay: () => void;
};

/* ------------------------------------------------------------- phosphors */

type Phosphor = {
  /** Multiplied over the picture: light, so content keeps its tones. */
  tint: string;
  glow: string;
  vignette: string;
  dot: string;
  halo: string;
  /** Channel weights for the static, 0 to 1. Computed from `base` when absent. */
  noise?: [number, number, number];
  base: string;
};

const GREEN: Phosphor = {
  tint: "#8dffb6",
  glow: "radial-gradient(ellipse 65% 60% at 50% 50%,rgba(215,255,228,.9) 0%,rgba(120,240,165,.45) 45%,rgba(30,90,50,0) 80%)",
  vignette:
    "radial-gradient(ellipse 72% 68% at 50% 50%,transparent 52%,rgba(0,10,3,.9) 100%),radial-gradient(ellipse 42% 26% at 30% 15%,rgba(225,255,235,.12),transparent 70%)",
  dot: "#eefff4",
  halo: "0 0 14px 5px rgba(150,255,190,.85),0 0 60px 22px rgba(60,220,120,.35)",
  noise: [0.75, 1, 0.8],
  base: "#3cdc78",
};

/** The same recipe as the green, worked out from one colour with color-mix. */
function phosphorFrom(base: string): Phosphor {
  const mix = (pct: number, other: string) => `color-mix(in srgb,${base} ${pct}%,${other})`;
  const fade = (color: string, pct: number) => `color-mix(in srgb,${color} ${pct}%,transparent)`;
  return {
    tint: mix(65, "#fff"),
    glow: `radial-gradient(ellipse 65% 60% at 50% 50%,${fade(mix(18, "#fff"), 90)} 0%,${fade(mix(68, "#fff"), 45)} 45%,transparent 80%)`,
    vignette: `radial-gradient(ellipse 72% 68% at 50% 50%,transparent 52%,${fade(mix(5, "#000"), 90)} 100%),radial-gradient(ellipse 42% 26% at 30% 15%,${fade(mix(14, "#fff"), 12)},transparent 70%)`,
    dot: mix(7, "#fff"),
    halo: `0 0 14px 5px ${fade(mix(45, "#fff"), 85)},0 0 60px 22px ${fade(base, 35)}`,
    base,
  };
}

const PHOSPHORS: Record<string, Phosphor> = {
  green: GREEN,
  amber: phosphorFrom("#ff9c26"),
  white: phosphorFrom("#d4e0ff"),
};

const phosphor = (tint: string) => PHOSPHORS[tint] ?? phosphorFrom(tint);

/** Channel weights for the static, read from any CSS colour the canvas understands. */
function noiseWeights(p: Phosphor): [number, number, number] {
  if (p.noise) return p.noise;
  try {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 1;
    const x = cv.getContext("2d");
    if (!x) return [1, 1, 1];
    x.fillStyle = "#808080";
    x.fillStyle = p.base;
    x.fillRect(0, 0, 1, 1);
    const [r, g, b] = x.getImageData(0, 0, 1, 1).data;
    const top = Math.max(r, g, b, 1);
    return [0.6 + (0.4 * r) / top, 0.6 + (0.4 * g) / top, 0.6 + (0.4 * b) / top];
  } catch {
    return [1, 1, 1];
  }
}

const noiseCache = new Map<string, string>();

/** A 128px tile of coloured static, drawn once per colour and kept as a data URL. */
function noiseTile(w: [number, number, number]): string {
  const key = w.map((n) => n.toFixed(3)).join(",");
  const hit = noiseCache.get(key);
  if (hit) return hit;
  let url = "none";
  try {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const x = cv.getContext("2d");
    if (x) {
      const im = x.createImageData(128, 128);
      for (let i = 0; i < im.data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        im.data[i] = v * w[0];
        im.data[i + 1] = v * w[1];
        im.data[i + 2] = v * w[2];
        im.data[i + 3] = 255;
      }
      x.putImageData(im, 0, 0);
      url = `url(${cv.toDataURL()})`;
    }
  } catch {
    /* no canvas: the run simply has no static */
  }
  noiseCache.set(key, url);
  return url;
}

/**
 * The colour behind the wrapper, composited up through translucent
 * ancestors. The tube is filled with it while it plays, so the multiply tint
 * darkens real pixels instead of turning transparent areas bright.
 */
function groundBehind(el: HTMLElement): string {
  const stack: Array<[number, number, number, number]> = [];
  for (let n: HTMLElement | null = el; n; n = n.parentElement) {
    const c = getComputedStyle(n).backgroundColor;
    const m = c.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+)(%?))?\s*\)$/);
    if (!m) {
      if (c && c !== "transparent") return c;
      continue;
    }
    const a = m[4] === undefined ? 1 : parseFloat(m[4]) / (m[5] ? 100 : 1);
    if (a <= 0) continue;
    stack.push([+m[1], +m[2], +m[3], a]);
    if (a >= 1) break;
  }
  let rgb = [255, 255, 255];
  if (!stack.length || stack[stack.length - 1][3] < 1) {
    const scheme = getComputedStyle(document.documentElement).colorScheme || "";
    if (scheme.includes("dark") && window.matchMedia?.("(prefers-color-scheme: dark)").matches) rgb = [18, 18, 18];
  }
  for (let i = stack.length - 1; i >= 0; i--) {
    const [r, g, b, a] = stack[i];
    rgb = [r * a + rgb[0] * (1 - a), g * a + rgb[1] * (1 - a), b * a + rgb[2] * (1 - a)];
  }
  return `rgb(${rgb.map(Math.round).join(",")})`;
}

/* ----------------------------------------------------------------- sound */

let audio: AudioContext | null = null;
let acted = false;

/** Whether the visitor has pressed anything yet. Browsers keep audio silent until then. */
function visitorHasActed() {
  const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
  return acted || !!ua?.hasBeenActive;
}

function audioContext(): AudioContext | null {
  if (!audio) {
    const AC =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try {
      audio = new AC();
    } catch {
      return null;
    }
  }
  if (audio.state === "suspended") audio.resume().catch(() => {});
  return audio;
}

/**
 * A set coming on: the thump of the switch, a faint line whine from the
 * moment the dot lights, and a burst of static as the picture opens. `k`
 * stretches the beats with `duration`. Returns a function that fades it out.
 */
function crtSound(a: AudioContext, k: number): () => void {
  const out = a.createGain();
  out.connect(a.destination);
  try {
    const t = a.currentTime + 0.01;

    const o = a.createOscillator();
    const g = a.createGain();
    o.frequency.setValueAtTime(70, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.35);
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    o.connect(g);
    g.connect(out);
    o.start(t);
    o.stop(t + 0.42);

    const n = Math.floor(a.sampleRate * 0.5);
    const buf = a.createBuffer(1, n, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 4) * (Math.random() < 0.08 ? 1 : 0.25);
    const s = a.createBufferSource();
    const hp = a.createBiquadFilter();
    const ng = a.createGain();
    s.buffer = buf;
    hp.type = "highpass";
    hp.frequency.value = 2500;
    ng.gain.value = 0.09;
    s.connect(hp);
    hp.connect(ng);
    ng.connect(out);
    s.start(t + 0.93 * k);

    const w = a.createOscillator();
    const wg = a.createGain();
    w.frequency.value = 11800;
    wg.gain.setValueAtTime(0.0001, t + 0.52 * k);
    wg.gain.exponentialRampToValueAtTime(0.014, t + 0.65 * k);
    wg.gain.exponentialRampToValueAtTime(0.0001, t + 3 * k);
    w.connect(wg);
    wg.connect(out);
    w.start(t + 0.52 * k);
    w.stop(t + 3.05 * k);
  } catch {
    /* an audio failure never stops the picture */
  }
  return () => {
    try {
      out.gain.setTargetAtTime(0, a.currentTime, 0.015);
    } catch {
      /* closed context */
    }
    window.setTimeout(() => out.disconnect(), 150);
  };
}

/* ---------------------------------------------------------------- styles */

const css = `
:where(.bz-spo){position:relative;display:flex;flex-direction:column}
.bz-spo-tube{position:relative;flex:1 1 auto;min-width:0;min-height:0;transform-origin:50% 50%}
.bz-spo[data-spo-active]{overflow:hidden;overflow:clip}
.bz-spo[data-spo-active]>.bz-spo-tube{opacity:0;overflow:hidden;overflow:clip;isolation:isolate;will-change:transform,opacity}
.bz-spo-glass{position:absolute;inset:0;background:var(--bz-spo-glass,#000);pointer-events:none}
.bz-spo-fx{position:absolute;inset:0;z-index:2147483000;pointer-events:none;opacity:0;will-change:opacity}
.bz-spo-noise{inset:-60px;background-size:128px 128px;will-change:transform,opacity}
.bz-spo-scan{background:repeating-linear-gradient(to bottom,transparent 0 2px,rgba(0,0,0,.3) 2px 4px)}
.bz-spo-dot{position:absolute;left:50%;top:50%;z-index:1;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:2px;opacity:0;pointer-events:none;will-change:transform,opacity}
@media (prefers-reduced-motion:reduce){.bz-spo-glass,.bz-spo-fx,.bz-spo-dot{display:none}}
@media (scripting:none){.bz-spo[data-spo-active]{overflow:visible}.bz-spo[data-spo-active]>.bz-spo-tube{opacity:1}.bz-spo-glass,.bz-spo-fx,.bz-spo-dot{display:none}}
`;

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* ------------------------------------------------------------- component */

export const ScreenPowerOn = forwardRef<ScreenPowerOnHandle, ScreenPowerOnProps>(function ScreenPowerOn(
  { children, play = true, duration = 3000, tint = "green", sound = false, onComplete, className = "", style },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tubeRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const glowRef = useRef<HTMLSpanElement>(null);
  const tintRef = useRef<HTMLSpanElement>(null);
  const noiseRef = useRef<HTMLSpanElement>(null);
  const scanRef = useRef<HTMLSpanElement>(null);
  const vigRef = useRef<HTMLSpanElement>(null);

  const ph = useMemo(() => phosphor(tint), [tint]);

  // Read when a run starts, so changing them mid-run never restarts it.
  const latest = useRef({ duration, sound, ph, onComplete });
  latest.current = { duration, sound, ph, onComplete };

  // 0 is at rest; every run gets a new number, so a replay restarts cleanly.
  const runs = useRef(play ? 1 : 0);
  const [run, setRun] = useState(runs.current);
  const replay = useCallback(() => setRun(++runs.current), []);
  useImperativeHandle(ref, () => ({ replay }), [replay]);

  const lastPlay = useRef(play);
  useEffect(() => {
    if (lastPlay.current === play) return;
    lastPlay.current = play;
    if (play) replay();
    else setRun(0);
  }, [play, replay]);

  // Unlock audio inside the visitor's own press, so a later run can be heard.
  useEffect(() => {
    if (!sound) return;
    const unlock = (e: Event) => {
      if (e.type !== "pointerdown" || (e as PointerEvent).pointerType === "mouse") acted = true;
      if (visitorHasActed()) audioContext();
    };
    const types = ["pointerdown", "pointerup", "touchend", "keydown", "click"];
    types.forEach((t) => window.addEventListener(t, unlock, true));
    return () => types.forEach((t) => window.removeEventListener(t, unlock, true));
  }, [sound]);

  useIsoLayoutEffect(() => {
    if (!run) return;
    const root = rootRef.current;
    const tube = tubeRef.current;
    if (!root || !tube) return;

    const { duration: ms, sound: audible, ph: p } = latest.current;
    const anims: Animation[] = [];
    let silence: (() => void) | null = null;
    let ended = false;
    const end = () => {
      if (ended) return;
      ended = true;
      setRun(0);
      latest.current.onComplete?.();
    };

    const W = tube.offsetWidth;
    const H = tube.offsetHeight;
    if (typeof tube.animate !== "function" || !W || !H) {
      end();
      return;
    }

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      const fade = tube.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "linear", fill: "both" });
      fade.onfinish = end;
      anims.push(fade);
    } else {
      const glass = glassRef.current;
      const dot = dotRef.current;
      const glow = glowRef.current;
      const tintLayer = tintRef.current;
      const noise = noiseRef.current;
      const scan = scanRef.current;
      const vig = vigRef.current;
      if (!glass || !dot || !glow || !tintLayer || !noise || !scan || !vig) {
        end();
        return;
      }

      // One-time writes before the first frame; nothing is written per frame.
      tube.style.backgroundColor = groundBehind(root);
      dot.style.left = `${tube.offsetLeft + W / 2}px`;
      dot.style.top = `${tube.offsetTop + H / 2}px`;
      noise.style.backgroundImage = noiseTile(noiseWeights(p));

      const D = Math.max(600, Number.isFinite(ms) ? ms : 3000);
      const o: KeyframeAnimationOptions = { duration: D, fill: "both" };
      const S = (x: number, y: number) => `scale(${x.toFixed(5)},${y.toFixed(5)})`;
      // The picture is squeezed into a 12px square that matches the dot, then
      // opened into the largest square the box holds, then to the full box.
      const sx0 = 12 / W;
      const sy0 = 12 / H;
      const sxq = H < W ? H / W : 1;
      const syq = H < W ? 1 : W / H;

      const main = tube.animate(
        [
          { transform: S(sx0, sy0), opacity: 0, offset: 0 },
          { transform: S(sx0, sy0), opacity: 0, offset: 0.305 },
          { transform: S(sx0, sy0), opacity: 1, offset: 0.31, easing: "cubic-bezier(.55,0,.25,1)" },
          { transform: S(sxq, syq), opacity: 1, offset: 0.535, easing: "cubic-bezier(.16,1,.3,1)" },
          { transform: S(1.012, 1.02), opacity: 1, offset: 0.685, easing: "cubic-bezier(.33,0,.25,1)" },
          { transform: S(1, 1), opacity: 1, offset: 0.825 },
          { transform: S(1, 1), opacity: 1, offset: 1 },
        ],
        o,
      );
      anims.push(
        main,
        glass.animate([{ opacity: 1, offset: 0 }, { opacity: 1, offset: 0.825 }, { opacity: 0, offset: 0.96 }, { opacity: 0, offset: 1 }], o),
        glow.animate(
          [
            { opacity: 0.85, offset: 0 },
            { opacity: 0.85, offset: 0.31 },
            { opacity: 0.5, offset: 0.535 },
            { opacity: 0.2, offset: 0.685 },
            { opacity: 0.26, offset: 0.7 },
            { opacity: 0.12, offset: 0.73 },
            { opacity: 0, offset: 0.88 },
            { opacity: 0, offset: 1 },
          ],
          o,
        ),
        tintLayer.animate(
          [
            { opacity: 0.6, offset: 0 },
            { opacity: 0.6, offset: 0.31 },
            { opacity: 0.5, offset: 0.535 },
            { opacity: 0.25, offset: 0.72 },
            { opacity: 0, offset: 0.93 },
            { opacity: 0, offset: 1 },
          ],
          o,
        ),
        noise.animate(
          [
            { opacity: 0, offset: 0 },
            { opacity: 0, offset: 0.42 },
            { opacity: 0.09, offset: 0.5 },
            { opacity: 0.06, offset: 0.66 },
            { opacity: 0, offset: 0.8 },
            { opacity: 0, offset: 1 },
          ],
          o,
        ),
        // The static jitters in whole steps, so it reads as noise rather than a drift.
        noise.animate(
          [
            { transform: "translate(0,0)" },
            { transform: "translate(-37px,21px)" },
            { transform: "translate(18px,-44px)" },
            { transform: "translate(-52px,-9px)" },
            { transform: "translate(29px,33px)" },
            { transform: "translate(-11px,-27px)" },
          ],
          { duration: 180, iterations: Math.ceil(D / 180), easing: "steps(5,jump-none)" },
        ),
        scan.animate(
          [
            { opacity: 0.9, offset: 0 },
            { opacity: 0.9, offset: 0.31 },
            { opacity: 0.8, offset: 0.66 },
            { opacity: 0, offset: 0.93 },
            { opacity: 0, offset: 1 },
          ],
          o,
        ),
        vig.animate(
          [
            { opacity: 1, offset: 0 },
            { opacity: 1, offset: 0.31 },
            { opacity: 0.9, offset: 0.7 },
            { opacity: 0, offset: 0.96 },
            { opacity: 0, offset: 1 },
          ],
          o,
        ),
        dot.animate(
          [
            { opacity: 0, transform: "scale(.4)", offset: 0 },
            { opacity: 0, transform: "scale(.4)", offset: 0.175 },
            { opacity: 1, transform: "scale(1)", offset: 0.19 },
            { opacity: 0.55, offset: 0.21 },
            { opacity: 1, offset: 0.235 },
            { opacity: 0.75, offset: 0.26 },
            { opacity: 1, offset: 0.29 },
            { opacity: 1, transform: "scale(1)", offset: 0.31 },
            { opacity: 0, transform: "scale(2.2)", offset: 0.38 },
            { opacity: 0, transform: "scale(2.2)", offset: 1 },
          ],
          o,
        ),
      );
      main.onfinish = end;

      if (audible && visitorHasActed()) {
        const a = audioContext();
        if (a) silence = crtSound(a, D / 3000);
      }
    }

    return () => {
      ended = true;
      anims.forEach((a) => {
        a.onfinish = null;
        a.cancel();
      });
      silence?.();
      tube.style.backgroundColor = "";
    };
  }, [run]);

  const active = run > 0;

  return (
    <div
      ref={rootRef}
      className={`bz-spo ${className}`.trim()}
      style={style}
      data-spo-active={active ? "" : undefined}
    >
      <style>{css}</style>
      {active ? <span ref={glassRef} aria-hidden className="bz-spo-glass" /> : null}
      <div ref={tubeRef} className="bz-spo-tube">
        {children}
        {active ? (
          <>
            <span ref={glowRef} aria-hidden className="bz-spo-fx" style={{ background: ph.glow }} />
            <span ref={tintRef} aria-hidden className="bz-spo-fx" style={{ background: ph.tint, mixBlendMode: "multiply" }} />
            <span ref={noiseRef} aria-hidden className="bz-spo-fx bz-spo-noise" />
            <span ref={scanRef} aria-hidden className="bz-spo-fx bz-spo-scan" />
            <span ref={vigRef} aria-hidden className="bz-spo-fx" style={{ background: ph.vignette }} />
          </>
        ) : null}
      </div>
      {active ? <span ref={dotRef} aria-hidden className="bz-spo-dot" style={{ background: ph.dot, boxShadow: ph.halo }} /> : null}
    </div>
  );
});
