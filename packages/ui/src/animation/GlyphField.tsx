"use client";

import { useEffect, useRef, useSyncExternalStore, type CSSProperties } from "react";

/*
 * GlyphField: a word drawn as a halftone of glyphs that part around the cursor.
 *
 * The text is set large on an offscreen canvas, sampled one pixel per cell and
 * cut into three tones by luminance, so the solid body of the letters and their
 * soft edges come out as three inks. Every cell is one small glyph blitted from
 * a pre-drawn sheet. Under the pointer a raised-cosine torch lifts cells a tone
 * and into the accent, and pushes them aside; its dithered edge comes from a
 * fixed random threshold per cell.
 *
 * The resting field is cached, so a frame is one blit plus the cells within
 * reach of the pointer. With nobody pointing, the torch wanders on a slow
 * Lissajous path; that loop stops off screen and in hidden tabs, and never runs
 * under reduced motion, where the torch still recolours under a real pointer but
 * does not push.
 */

const CSS = `
.bz-gf{--bz-gf-ground:var(--bz-paper,#ffffff);--bz-gf-t1:#cfcfd3;--bz-gf-t2:var(--bz-ink-subtle,#6b6b70);--bz-gf-t3:var(--bz-ink,#0a0a0a);--bz-gf-a1:#e3a79d;--bz-gf-a2:#c0513f;--bz-gf-a3:var(--bz-accent,#912c22);position:relative;display:block;width:100%;min-height:200px;overflow:hidden;background:var(--bz-gf-ground);font-family:var(--bz-font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);touch-action:pan-y pinch-zoom;-webkit-user-select:none;user-select:none}
.bz-gf-canvas{position:absolute;inset:0;display:block;width:100%;height:100%}
`;

const RM_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(RM_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const readReducedMotion = () => window.matchMedia(RM_QUERY).matches;
const serverReducedMotion = () => false;

const IDLE_MS = 2500;
const CUTS = [0.3, 0.62, 0.85];

type Options = {
  text: string;
  glyph: string;
  cell: number;
  radius: number;
  wander: boolean;
  reduced: boolean;
};

type Field = { refresh: () => void; wake: () => void; destroy: () => void };

function createField(root: HTMLElement, canvas: HTMLCanvasElement, options: () => Options): Field | null {
  const ctx = canvas.getContext("2d");
  const source = document.createElement("canvas");
  const sctx = source.getContext("2d");
  const sampler = document.createElement("canvas");
  const pctx = sampler.getContext("2d", { willReadFrequently: true });
  const sheet = document.createElement("canvas");
  const hctx = sheet.getContext("2d");
  const cache = document.createElement("canvas");
  const cctx = cache.getContext("2d");
  if (!ctx || !sctx || !pctx || !hctx || !cctx) return null;

  let dead = false;
  let raf = 0;
  let last = 0;
  let inView = true;
  let W = 0;
  let H = 0;
  let dpr = 1;
  let cols = 0;
  let rows = 0;
  let cell = 8;
  let sprite = 0;
  let tones = new Uint8Array(0);
  let jitter = new Float32Array(0);
  let cacheDirty = true;
  let dirty = true;
  const pointer = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, real: false, lastReal: -1e9 };

  const running = () => inView && document.visibilityState === "visible";

  function buildSheet() {
    const style = getComputedStyle(root);
    const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
    const inks = [
      read("--bz-gf-t1", "#cfcfd3"),
      read("--bz-gf-t2", "#6b6b70"),
      read("--bz-gf-t3", "#0a0a0a"),
      read("--bz-gf-a1", "#e3a79d"),
      read("--bz-gf-a2", "#c0513f"),
      read("--bz-gf-a3", "#912c22"),
    ];
    sheet.width = sprite * inks.length;
    sheet.height = sprite;
    hctx!.clearRect(0, 0, sheet.width, sheet.height);
    hctx!.textAlign = "center";
    hctx!.textBaseline = "middle";
    hctx!.font = `700 ${Math.round(cell * 1.3 * dpr)}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    inks.forEach((ink, i) => {
      hctx!.fillStyle = ink;
      hctx!.fillText(options().glyph, i * sprite + sprite / 2, sprite / 2 + sprite * 0.04);
    });
  }

  function sample() {
    const { text } = options();
    source.width = Math.max(1, cols * 3);
    source.height = Math.max(1, rows * 3);
    sctx!.fillStyle = "#ffffff";
    sctx!.fillRect(0, 0, source.width, source.height);
    const family = getComputedStyle(root).fontFamily || "system-ui, sans-serif";
    sctx!.font = `800 100px ${family}`;
    const width = Math.max(1, sctx!.measureText(text).width);
    const fontPx = Math.min(((source.width * 0.86) / width) * 100, source.height * 0.66);
    sctx!.font = `800 ${fontPx}px ${family}`;
    sctx!.textAlign = "center";
    sctx!.textBaseline = "middle";
    sctx!.fillStyle = "#000000";
    sctx!.fillText(text, source.width / 2, source.height / 2 + fontPx * 0.04);

    sampler.width = Math.max(1, cols);
    sampler.height = Math.max(1, rows);
    pctx!.imageSmoothingEnabled = true;
    pctx!.imageSmoothingQuality = "high";
    pctx!.drawImage(source, 0, 0, sampler.width, sampler.height);
    const data = pctx!.getImageData(0, 0, sampler.width, sampler.height).data;
    for (let i = 0, p = 0; i < tones.length; i++, p += 4) {
      const luma = (0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2]) / 255;
      tones[i] = luma < CUTS[0] ? 3 : luma < CUTS[1] ? 2 : luma < CUTS[2] ? 1 : 0;
    }
    cacheDirty = true;
    dirty = true;
  }

  function layout() {
    const rect = root.getBoundingClientRect();
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cell = Math.max(4, Math.round(options().cell));
    const cw = Math.round(W * dpr);
    const ch = Math.round(H * dpr);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    if (cache.width !== cw || cache.height !== ch) {
      cache.width = cw;
      cache.height = ch;
    }
    const nextCols = Math.ceil(W / cell);
    const nextRows = Math.ceil(H / cell);
    if (nextCols !== cols || nextRows !== rows) {
      cols = nextCols;
      rows = nextRows;
      tones = new Uint8Array(cols * rows);
      jitter = new Float32Array(cols * rows);
      for (let i = 0; i < jitter.length; i++) jitter[i] = Math.random();
    }
    sprite = Math.max(2, Math.round(cell * dpr));
    buildSheet();
    sample();
  }

  function drawCache() {
    cctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    cctx!.clearRect(0, 0, W, H);
    for (let r = 0; r < rows; r++) {
      for (let c = 0, i = r * cols; c < cols; c++, i++) {
        const t = tones[i];
        if (t) cctx!.drawImage(sheet, (t - 1) * sprite, 0, sprite, sprite, c * cell, r * cell, cell, cell);
      }
    }
    cacheDirty = false;
  }

  function draw() {
    if (cacheDirty) drawCache();
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.clearRect(0, 0, W, H);
    ctx!.drawImage(cache, 0, 0, W, H);
    const px = pointer.x;
    const py = pointer.y;
    if (px < -1e3) return;
    const o = options();
    const R = W <= 420 ? o.radius * 0.7 : o.radius;
    const R2 = R * R;
    const push = o.reduced ? 0 : cell * 1.6;
    const reach = R + push + cell;
    const c0 = Math.max(0, Math.floor((px - reach) / cell));
    const c1 = Math.min(cols - 1, Math.ceil((px + reach) / cell));
    const r0 = Math.max(0, Math.floor((py - reach) / cell));
    const r1 = Math.min(rows - 1, Math.ceil((py + reach) / cell));
    if (c1 < c0 || r1 < r0) return;
    ctx!.clearRect(c0 * cell, r0 * cell, (c1 - c0 + 1) * cell, (r1 - r0 + 1) * cell);
    const half = cell / 2;
    for (let r = r0; r <= r1; r++) {
      const y = r * cell + half;
      const dy = py - y;
      for (let c = c0; c <= c1; c++) {
        const i = r * cols + c;
        let t = tones[i];
        if (!t) continue;
        const x = c * cell + half;
        const dx = px - x;
        const d2 = dx * dx + dy * dy;
        let ox = 0;
        let oy = 0;
        let lit = false;
        if (d2 < R2) {
          const d = Math.sqrt(d2);
          const w = 0.5 + 0.5 * Math.cos((Math.PI * d) / R);
          if (w > jitter[i]) {
            t = Math.min(3, t + 1);
            lit = true;
          }
          const k = d > 0.001 ? (w * push) / d : 0;
          ox = -dx * k;
          oy = -dy * k;
        }
        ctx!.drawImage(
          sheet,
          (lit ? t + 2 : t - 1) * sprite,
          0,
          sprite,
          sprite,
          Math.round((x - half + ox) * dpr) / dpr,
          Math.round((y - half + oy) * dpr) / dpr,
          cell,
          cell,
        );
      }
    }
  }

  function schedule() {
    if (!raf && !dead && running()) raf = requestAnimationFrame(frame);
  }

  function frame(now: number) {
    raf = 0;
    if (dead || !running()) return;
    const dt = last ? Math.min(64, now - last) : 16;
    last = now;
    const o = options();
    const idle = !pointer.real && now - pointer.lastReal > IDLE_MS;
    const wandering = idle && o.wander && !o.reduced;
    if (wandering) {
      pointer.tx = W * (0.5 + 0.4 * Math.sin(now * 0.00037));
      pointer.ty = H * (0.5 + 0.3 * Math.sin(now * 0.00053 + 1.3));
    } else if (idle && pointer.tx > -1e3) {
      pointer.tx = -1e4;
      pointer.ty = -1e4;
    }
    if (pointer.x < -1e3 || pointer.tx < -1e3) {
      if (pointer.x !== pointer.tx || pointer.y !== pointer.ty) dirty = true;
      pointer.x = pointer.tx;
      pointer.y = pointer.ty;
    } else {
      const k = 1 - Math.exp(-dt / 70);
      pointer.x += (pointer.tx - pointer.x) * k;
      pointer.y += (pointer.ty - pointer.y) * k;
    }
    const settled = Math.abs(pointer.tx - pointer.x) < 0.1 && Math.abs(pointer.ty - pointer.y) < 0.1;
    if (settled) {
      pointer.x = pointer.tx;
      pointer.y = pointer.ty;
    }
    if (dirty || cacheDirty || !settled) {
      draw();
      dirty = false;
    }
    // Keep going while moving, wandering, or waiting for the idle wander to begin.
    if (!settled || wandering || (!pointer.real && !idle && o.wander && !o.reduced)) schedule();
  }

  function wake() {
    dirty = true;
    last = 0;
    schedule();
  }

  const toLocal = (event: PointerEvent) => {
    const rect = root.getBoundingClientRect();
    pointer.tx = event.clientX - rect.left;
    pointer.ty = event.clientY - rect.top;
    pointer.real = true;
    pointer.lastReal = performance.now();
    wake();
  };
  const release = () => {
    pointer.real = false;
    pointer.lastReal = performance.now();
    wake();
  };
  const noHover = window.matchMedia("(hover: none)");
  const onUp = () => {
    if (noHover.matches) release();
  };
  root.addEventListener("pointermove", toLocal, { passive: true });
  root.addEventListener("pointerdown", toLocal, { passive: true });
  root.addEventListener("pointerleave", release);
  root.addEventListener("pointercancel", release);
  root.addEventListener("pointerup", onUp);

  const onVisibility = () => wake();
  document.addEventListener("visibilitychange", onVisibility);

  const ro = new ResizeObserver(() => {
    layout();
    draw();
    schedule();
  });
  ro.observe(root);

  let io: IntersectionObserver | null = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) wake();
      },
      { rootMargin: "10%" },
    );
    io.observe(root);
  }

  let dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
  const onDpr = () => {
    dprQuery.removeEventListener("change", onDpr);
    dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    dprQuery.addEventListener("change", onDpr);
    layout();
    wake();
  };
  dprQuery.addEventListener("change", onDpr);

  layout();
  draw();
  schedule();

  document.fonts?.ready
    .then(() => {
      if (dead) return;
      sample();
      wake();
    })
    .catch(() => {});

  return {
    refresh() {
      layout();
      wake();
    },
    wake,
    destroy() {
      dead = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      ro.disconnect();
      io?.disconnect();
      dprQuery.removeEventListener("change", onDpr);
      document.removeEventListener("visibilitychange", onVisibility);
      root.removeEventListener("pointermove", toLocal);
      root.removeEventListener("pointerdown", toLocal);
      root.removeEventListener("pointerleave", release);
      root.removeEventListener("pointercancel", release);
      root.removeEventListener("pointerup", onUp);
    },
  };
}

export type GlyphFieldProps = {
  /** The word or short phrase the field draws. */
  text: string;
  /** Accessible name. Defaults to `text`. */
  label?: string;
  /** Hide it from assistive tech entirely, when the text is repeated elsewhere. */
  decorative?: boolean;
  /** The character every cell is drawn with. */
  glyph?: string;
  /** Cell size in CSS pixels. */
  cellSize?: number;
  /** Radius of the pointer's reach in CSS pixels. */
  radius?: number;
  /** Let the torch drift on its own while nobody is pointing. */
  wander?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function GlyphField({
  text,
  label,
  decorative = false,
  glyph = "+",
  cellSize = 8,
  radius = 110,
  wander = true,
  className = "",
  style,
}: GlyphFieldProps) {
  const reduced = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, serverReducedMotion);
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<Field | null>(null);
  const optionsRef = useRef<Options>({ text, glyph, cell: cellSize, radius, wander, reduced });
  optionsRef.current = { text, glyph, cell: cellSize, radius, wander, reduced };

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const field = createField(root, canvas, () => optionsRef.current);
    fieldRef.current = field;
    return () => {
      field?.destroy();
      fieldRef.current = null;
    };
  }, []);

  useEffect(() => {
    fieldRef.current?.refresh();
  }, [text, glyph, cellSize]);

  useEffect(() => {
    fieldRef.current?.wake();
  }, [reduced, wander, radius]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        ref={rootRef}
        className={`bz-gf ${className}`.trim()}
        style={style}
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : label ?? text}
        aria-hidden={decorative ? true : undefined}
      >
        <canvas ref={canvasRef} className="bz-gf-canvas" aria-hidden="true" />
      </div>
    </>
  );
}
