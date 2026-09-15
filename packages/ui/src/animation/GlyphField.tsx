"use client";

import { useEffect, useRef, useSyncExternalStore, type CSSProperties } from "react";

/*
 * GlyphField: a word built as a solid object out of glyphs, that turns toward
 * the cursor and parts around it.
 *
 * The text is set on an offscreen canvas and its mask becomes a height map: an
 * exact distance transform gives every point inside a letter its distance from
 * the edge, and that distance is bent into a rounded bevel. The letters are then
 * a slab with a front face, bevelled edges and side walls running back into the
 * page.
 *
 * Each frame the slab is turned in 3D and a ray is cast from a perspective
 * camera through the centre of every cell of a fixed grid, the way a terminal
 * draws a solid. A ray that meets the front face is shaded from the bevel's
 * normal under a fixed light from the upper left, with a small highlight; a ray
 * that misses the face is marched back through the depth of the slab, and one
 * that meets a side wall is shaded from the wall's normal and darkened toward
 * the back. The shade picks one glyph from a pre-drawn ramp that grows in size
 * and ink, so lit bevels thin out and walls in shadow print heavy.
 *
 * Under the pointer a raised-cosine torch lifts cells a few steps and into the
 * accent, and pushes them aside; its dithered edge comes from a fixed random
 * threshold per cell. The word tilts to face the pointer. With nobody pointing
 * it sways slowly and the torch wanders; that loop stops off screen and in
 * hidden tabs. The shaded object is cached, so a frame without a change of
 * angle is one blit plus the cells within the torch's reach. Reduced motion
 * holds one fixed three-quarter angle with no tilt or sway, and the torch still
 * recolours under a real pointer but does not push.
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
/** Glyph steps in each ramp, from barely there to full ink. */
const LEVELS = 14;
/** Mask samples per cell along each axis. */
const SUPERSAMPLE = 2;
const DEG = Math.PI / 180;
/** The angle the word rests at, and holds under reduced motion: turned left and up, so its right and lower walls show. */
const REST_YAW = -18 * DEG;
const REST_PITCH = 14 * DEG;
/**
 * Light from the upper right and in front, and the half vector for the highlight. Against the resting angle
 * this gives three planes three tones, the way a lit cube reads: a mid face, a lit right wall, a dark lower one.
 */
const LIGHT = normalize3(0.55, -0.75, 0.5);
const HALF = normalize3(LIGHT[0], LIGHT[1], LIGHT[2] + 1);

function normalize3(x: number, y: number, z: number): [number, number, number] {
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l];
}

type Options = {
  text: string;
  glyph: string;
  cell: number;
  radius: number;
  wander: boolean;
  reduced: boolean;
  depth: number;
  tilt: number;
};

type Field = { refresh: () => void; wake: () => void; destroy: () => void };

/** Squared distance transform of one row or column (Felzenszwalb and Huttenlocher). */
function transform1d(f: Float64Array, n: number, out: Float64Array, v: Int32Array, z: Float64Array) {
  let k = 0;
  v[0] = 0;
  z[0] = -1e20;
  z[1] = 1e20;
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = 1e20;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    out[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
}

/** Euclidean distance from every sample to the nearest sample where `seed` is true. */
function distanceTo(seed: Uint8Array, w: number, h: number) {
  const n = Math.max(w, h);
  const f = new Float64Array(n);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  const grid = new Float64Array(w * h);
  for (let i = 0; i < grid.length; i++) grid[i] = seed[i] ? 0 : 1e10;
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = grid[y * w + x];
    transform1d(f, h, d, v, z);
    for (let y = 0; y < h; y++) grid[y * w + x] = d[y];
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = grid[y * w + x];
    transform1d(f, w, d, v, z);
    for (let x = 0; x < w; x++) grid[y * w + x] = d[x];
  }
  const out = new Float32Array(w * h);
  for (let i = 0; i < out.length; i++) out[i] = Math.sqrt(grid[i]);
  return out;
}

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
  let jitter = new Float32Array(0);
  /** Glyph step per cell for the current angle, or -1 for bare paper. */
  let levels = new Int8Array(0);
  /** Cells whose step moved since the cache was last painted, and how many. */
  let changed = new Int32Array(0);
  let changes = 0;

  // The height map, one entry per mask sample.
  let mw = 0;
  let mh = 0;
  let solid = new Uint8Array(0);
  let faceX = new Float32Array(0);
  let faceY = new Float32Array(0);
  let faceZ = new Float32Array(0);
  let wallX = new Float32Array(0);
  let wallY = new Float32Array(0);
  let box = { x0: 0, y0: 0, x1: 0, y1: 0 };
  let slab = 20;

  let shapeDirty = true;
  let cacheDirty = true;
  let dirty = true;
  const pointer = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, real: false, lastReal: -1e9 };
  const turn = { yaw: REST_YAW, pitch: REST_PITCH };

  const running = () => inView && document.visibilityState === "visible";

  function buildSheet() {
    const style = getComputedStyle(root);
    const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
    const rgb = (color: string) => {
      hctx!.fillStyle = "#000000";
      hctx!.fillStyle = color;
      const s = String(hctx!.fillStyle);
      if (s.startsWith("#")) return [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
      const m = s.match(/[\d.]+/g);
      return m ? m.slice(0, 3).map(Number) : [0, 0, 0];
    };
    const ground = rgb(read("--bz-gf-ground", "#ffffff"));
    const t1 = rgb(read("--bz-gf-t1", "#cfcfd3"));
    const t2 = rgb(read("--bz-gf-t2", "#6b6b70"));
    const t3 = rgb(read("--bz-gf-t3", "#0a0a0a"));
    const a1 = rgb(read("--bz-gf-a1", "#e3a79d"));
    const a2 = rgb(read("--bz-gf-a2", "#c0513f"));
    const a3 = rgb(read("--bz-gf-a3", "#912c22"));
    const mix = (a: number[], b: number[], k: number) => a.map((v, i) => v + (b[i] - v) * k);
    const ramps = [
      [mix(ground, t1, 0.55), t1, t2, t3],
      [mix(ground, a1, 0.6), a1, a2, a3, mix(a3, t3, 0.45)],
    ];
    const at = (stops: number[][], q: number) => {
      const p = q * (stops.length - 1);
      const i = Math.min(stops.length - 2, Math.floor(p));
      const c = mix(stops[i], stops[i + 1], p - i);
      return `rgb(${c.map((v) => Math.round(v)).join(",")})`;
    };

    sheet.width = sprite * LEVELS * ramps.length;
    sheet.height = sprite;
    hctx!.clearRect(0, 0, sheet.width, sheet.height);
    hctx!.textAlign = "center";
    hctx!.textBaseline = "middle";
    hctx!.lineJoin = "round";
    const glyph = options().glyph;
    ramps.forEach((stops, r) => {
      for (let l = 0; l < LEVELS; l++) {
        const q = l / (LEVELS - 1);
        const ink = at(stops, q);
        const px = Math.max(2, Math.round(sprite * (0.62 + 0.8 * q)));
        const left = (r * LEVELS + l) * sprite;
        // Each glyph stays inside its own square, so a cell can be redrawn on its own.
        hctx!.save();
        hctx!.beginPath();
        hctx!.rect(left, 0, sprite, sprite);
        hctx!.clip();
        hctx!.font = `700 ${px}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
        hctx!.fillStyle = ink;
        const x = left + sprite / 2;
        const y = sprite / 2 + sprite * 0.04;
        hctx!.fillText(glyph, x, y);
        if (q > 0.55) {
          hctx!.strokeStyle = ink;
          hctx!.lineWidth = (q - 0.55) * sprite * 0.22;
          hctx!.strokeText(glyph, x, y);
        }
        hctx!.restore();
      }
    });
  }

  function sample() {
    const { text, depth } = options();
    mw = Math.max(1, cols * SUPERSAMPLE);
    mh = Math.max(1, rows * SUPERSAMPLE);
    source.width = mw * 2;
    source.height = mh * 2;
    sctx!.fillStyle = "#ffffff";
    sctx!.fillRect(0, 0, source.width, source.height);
    const family = getComputedStyle(root).fontFamily || "system-ui, sans-serif";
    sctx!.font = `800 100px ${family}`;
    const width = Math.max(1, sctx!.measureText(text).width);
    // Room to turn: the word is set smaller than the flat version would be.
    const fontPx = Math.min(((source.width * 0.74) / width) * 100, source.height * 0.56);
    sctx!.font = `800 ${fontPx}px ${family}`;
    sctx!.textAlign = "center";
    sctx!.textBaseline = "middle";
    sctx!.fillStyle = "#000000";
    sctx!.fillText(text, source.width / 2, source.height / 2 + fontPx * 0.04);

    sampler.width = mw;
    sampler.height = mh;
    pctx!.imageSmoothingEnabled = true;
    pctx!.imageSmoothingQuality = "high";
    pctx!.drawImage(source, 0, 0, mw, mh);
    const data = pctx!.getImageData(0, 0, mw, mh).data;

    const count = mw * mh;
    solid = new Uint8Array(count);
    const empty = new Uint8Array(count);
    let x0 = mw;
    let y0 = mh;
    let x1 = -1;
    let y1 = -1;
    for (let i = 0, p = 0; i < count; i++, p += 4) {
      const luma = (0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2]) / 255;
      if (luma < 0.5) {
        solid[i] = 1;
        const x = i % mw;
        const y = (i - x) / mw;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      } else {
        empty[i] = 1;
      }
    }

    const inside = distanceTo(empty, mw, mh);
    const outside = distanceTo(solid, mw, mh);
    let deepest = 1;
    for (let i = 0; i < count; i++) if (inside[i] > deepest) deepest = inside[i];
    // A narrow bevel leaves a flat top to every stroke, so light and shadow sit on the edges.
    const cssFont = fontPx * (W / source.width);
    const spacing = W / mw;
    const bevel = Math.max(1.5, Math.min(deepest * 0.6, (cssFont * 0.055) / spacing));

    faceX = new Float32Array(count);
    faceY = new Float32Array(count);
    faceZ = new Float32Array(count);
    wallX = new Float32Array(count);
    wallY = new Float32Array(count);
    const sdf = (x: number, y: number) => {
      const cx = Math.max(0, Math.min(mw - 1, x));
      const cy = Math.max(0, Math.min(mh - 1, y));
      const i = cy * mw + cx;
      return inside[i] - outside[i];
    };
    for (let y = 0; y < mh; y++) {
      for (let x = 0; x < mw; x++) {
        const i = y * mw + x;
        faceZ[i] = 1;
        if (!solid[i]) continue;
        // The signed distance rises inward; its gradient points into the letter.
        let gx = sdf(x + 1, y) - sdf(x - 1, y);
        let gy = sdf(x, y + 1) - sdf(x, y - 1);
        const g = Math.hypot(gx, gy);
        if (g < 1e-3) continue;
        gx /= g;
        gy /= g;
        wallX[i] = -gx;
        wallY[i] = -gy;
        // A quarter-round bevel: steep at the edge, flat once `bevel` in.
        const t = Math.min(1, Math.max(0, (inside[i] - 0.5) / bevel));
        const slope = t >= 1 ? 0 : Math.min(2.4, (1 - t) / Math.sqrt(Math.max(1e-3, 1 - (1 - t) * (1 - t))));
        const n = normalize3(-gx * slope, -gy * slope, 1);
        faceX[i] = n[0];
        faceY[i] = n[1];
        faceZ[i] = n[2];
      }
    }

    const sx = W / mw;
    const sy = H / mh;
    box = x1 < 0 ? { x0: 0, y0: 0, x1: -1, y1: -1 } : { x0: x0 * sx - W / 2, y0: y0 * sy - H / 2, x1: (x1 + 1) * sx - W / 2, y1: (y1 + 1) * sy - H / 2 };
    slab = Math.max(cell, cssFont * Math.max(0, depth));
    shapeDirty = true;
    cacheDirty = true;
    dirty = true;
  }

  function layout() {
    const rect = root.getBoundingClientRect();
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    // Small fields use finer cells, so a letter is still wide enough in cells to show its bevel.
    cell = Math.max(4, Math.min(Math.round(options().cell), Math.round(Math.min(W, H * 2.2) / 70)));
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
      levels = new Int8Array(cols * rows).fill(-1);
      changed = new Int32Array(cols * rows);
      jitter = new Float32Array(cols * rows);
      for (let i = 0; i < jitter.length; i++) jitter[i] = Math.random();
    }
    sprite = Math.max(2, Math.round(cell * dpr));
    buildSheet();
    sample();
  }

  /** Cast one ray per cell through the slab at the current angle, and keep the glyph step each one lands on. */
  function shade() {
    const ca = Math.cos(turn.yaw);
    const sa = Math.sin(turn.yaw);
    const cb = Math.cos(turn.pitch);
    const sb = Math.sin(turn.pitch);
    // R = yaw about the vertical axis, after pitch about the horizontal one.
    const r00 = ca;
    const r01 = sa * sb;
    const r02 = sa * cb;
    const r11 = cb;
    const r12 = -sb;
    const r20 = -sa;
    const r21 = ca * sb;
    const r22 = ca * cb;
    const focal = Math.max(W, H) * 1.35;
    // The camera, in the slab's own frame.
    const ox = r20 * focal;
    const oy = r21 * focal;
    const oz = r22 * focal;
    const half = slab / 2;
    const steps = Math.max(3, Math.min(10, Math.ceil(slab / (cell * 0.75))));
    const sx = mw / W;
    const sy = mh / H;
    const hw = W / 2;
    const hh = H / 2;
    const top = LEVELS - 1;
    const [lx, ly, lz] = LIGHT;
    const [hx, hy, hz] = HALF;
    const bx0 = box.x0 - cell;
    const bx1 = box.x1 + cell;
    const by0 = box.y0 - cell;
    const by1 = box.y1 + cell;

    for (let r = 0; r < rows; r++) {
      const Y = (r + 0.5) * cell - hh;
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        let next = -1;
        const X = (c + 0.5) * cell - hw;
        const dx = r00 * X - r20 * focal;
        const dy = r01 * X + r11 * Y - r21 * focal;
        const dz = r02 * X + r12 * Y - r22 * focal;
        const tf = (half - oz) / dz;
        const tb = (-half - oz) / dz;
        const fu = ox + tf * dx;
        const fv = oy + tf * dy;
        const bu = ox + tb * dx;
        const bv = oy + tb * dy;
        if (dz < -1e-6 && Math.max(fu, bu) >= bx0 && Math.min(fu, bu) <= bx1 && Math.max(fv, bv) >= by0 && Math.min(fv, bv) <= by1) {
          let mx = Math.floor((fu + hw) * sx);
          let my = Math.floor((fv + hh) * sy);
          if (mx >= 0 && my >= 0 && mx < mw && my < mh && solid[my * mw + mx]) {
            const j = my * mw + mx;
            const nx = faceX[j];
            const ny = faceY[j];
            const nz = faceZ[j];
            const wx = r00 * nx + r01 * ny + r02 * nz;
            const wy = r11 * ny + r12 * nz;
            const wz = r20 * nx + r21 * ny + r22 * nz;
            const diffuse = Math.max(0, wx * lx + wy * ly + wz * lz);
            const spec = Math.max(0, wx * hx + wy * hy + wz * hz);
            const s2 = spec * spec;
            const s8 = s2 * s2 * s2 * s2;
            const light = 0.08 + 0.9 * diffuse + 0.6 * s8 * s8;
            // The face keeps to a band lighter than any wall, so letters stay apart from their own sides at every angle.
            const ink = 0.34 + 0.4 * Math.max(0, 1 - light);
            next = Math.round(ink * top);
          } else {
            for (let k = 1; k <= steps; k++) {
              const f = k / steps;
              mx = Math.floor((fu + (bu - fu) * f + hw) * sx);
              my = Math.floor((fv + (bv - fv) * f + hh) * sy);
              if (mx < 0 || my < 0 || mx >= mw || my >= mh || !solid[my * mw + mx]) continue;
              const j = my * mw + mx;
              const nx = wallX[j];
              const ny = wallY[j];
              const wx = r00 * nx + r01 * ny;
              const wy = r11 * ny;
              const wz = r20 * nx + r21 * ny;
              const diffuse = Math.max(0, wx * lx + wy * ly + wz * lz);
              // Walls darken toward the back, so depth reads even where the light is flat.
              const light = (0.06 + 0.9 * diffuse) * (1 - 0.55 * f);
              const ink = 0.78 + 0.22 * Math.max(0, 1 - light);
              next = Math.round(ink * top);
              break;
            }
          }
        }
        if (next > top) next = top;
        if (levels[i] !== next) {
          levels[i] = next;
          changed[changes++] = i;
        }
      }
    }
    shapeDirty = false;
  }

  /** Paint one cell of the cache on whole device pixels, so a cell can be repainted without seams. */
  function paintCell(i: number) {
    const c = i % cols;
    const r = (i - c) / cols;
    const x0 = Math.round(c * cell * dpr);
    const y0 = Math.round(r * cell * dpr);
    const w = Math.round((c + 1) * cell * dpr) - x0;
    const h = Math.round((r + 1) * cell * dpr) - y0;
    cctx!.clearRect(x0, y0, w, h);
    const l = levels[i];
    if (l >= 0) cctx!.drawImage(sheet, l * sprite, 0, sprite, sprite, x0, y0, w, h);
  }

  function drawCache() {
    cctx!.setTransform(1, 0, 0, 1, 0, 0);
    if (cacheDirty) {
      cctx!.clearRect(0, 0, cache.width, cache.height);
      for (let i = 0; i < levels.length; i++) if (levels[i] >= 0) paintCell(i);
    } else {
      for (let k = 0; k < changes; k++) paintCell(changed[k]);
    }
    changes = 0;
    cacheDirty = false;
  }

  function draw() {
    if (shapeDirty) shade();
    if (cacheDirty || changes) drawCache();
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
    const top = LEVELS - 1;
    for (let r = r0; r <= r1; r++) {
      const y = r * cell + half;
      const dy = py - y;
      for (let c = c0; c <= c1; c++) {
        const i = r * cols + c;
        let l = levels[i];
        if (l < 0) continue;
        const x = c * cell + half;
        const dx = px - x;
        const d2 = dx * dx + dy * dy;
        let ox = 0;
        let oy = 0;
        let ramp = 0;
        if (d2 < R2) {
          const d = Math.sqrt(d2);
          const w = 0.5 + 0.5 * Math.cos((Math.PI * d) / R);
          if (w > jitter[i]) {
            l = Math.min(top, l + 3);
            ramp = LEVELS;
          }
          const k = d > 0.001 ? (w * push) / d : 0;
          ox = -dx * k;
          oy = -dy * k;
        }
        ctx!.drawImage(
          sheet,
          (ramp + l) * sprite,
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

    // Where the word wants to face.
    const tilt = Math.max(0, o.tilt) * DEG;
    let yaw = REST_YAW;
    let pitch = REST_PITCH;
    if (!o.reduced) {
      if (pointer.real || (!idle && pointer.tx > -1e3)) {
        const nx = Math.max(-1, Math.min(1, (pointer.tx - W / 2) / (W / 2)));
        const ny = Math.max(-1, Math.min(1, (pointer.ty - H / 2) / (H / 2)));
        yaw = REST_YAW * 0.6 + nx * tilt;
        pitch = REST_PITCH * 0.6 - ny * tilt * 0.6;
      } else if (wandering) {
        yaw = REST_YAW * 0.75 + tilt * 0.6 * Math.sin(now * 0.00041);
        pitch = REST_PITCH * 0.75 + tilt * 0.3 * Math.sin(now * 0.00029 + 0.8);
      }
    }
    let turning = false;
    if (o.reduced) {
      if (turn.yaw !== REST_YAW || turn.pitch !== REST_PITCH) shapeDirty = true;
      turn.yaw = REST_YAW;
      turn.pitch = REST_PITCH;
    } else {
      const k = 1 - Math.exp(-dt / 240);
      const ny = turn.yaw + (yaw - turn.yaw) * k;
      const np = turn.pitch + (pitch - turn.pitch) * k;
      turning = Math.abs(yaw - ny) > 0.0004 || Math.abs(pitch - np) > 0.0004;
      if (Math.abs(ny - turn.yaw) > 0.00005 || Math.abs(np - turn.pitch) > 0.00005) shapeDirty = true;
      turn.yaw = turning ? ny : yaw;
      turn.pitch = turning ? np : pitch;
    }

    if (dirty || cacheDirty || shapeDirty || !settled) {
      draw();
      dirty = false;
    }
    // Keep going while moving, turning, wandering, or waiting for the idle wander to begin.
    if (!settled || turning || wandering || (!pointer.real && !idle && o.wander && !o.reduced)) schedule();
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
    wake() {
      shapeDirty = true;
      wake();
    },
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
  /** Largest cell size in CSS pixels. Small fields use finer cells so the bevels still resolve. */
  cellSize?: number;
  /** Radius of the pointer's reach in CSS pixels. */
  radius?: number;
  /** How far the letters run back into the page, as a fraction of the type size. */
  depth?: number;
  /** How far the word turns toward the pointer, in degrees. */
  tilt?: number;
  /** Sway, and let the torch drift, while nobody is pointing. */
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
  depth = 0.22,
  tilt = 18,
  wander = true,
  className = "",
  style,
}: GlyphFieldProps) {
  const reduced = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, serverReducedMotion);
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<Field | null>(null);
  const optionsRef = useRef<Options>({ text, glyph, cell: cellSize, radius, wander, reduced, depth, tilt });
  optionsRef.current = { text, glyph, cell: cellSize, radius, wander, reduced, depth, tilt };

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
  }, [text, glyph, cellSize, depth]);

  useEffect(() => {
    fieldRef.current?.wake();
  }, [reduced, wander, radius, tilt]);

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
