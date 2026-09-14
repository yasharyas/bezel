"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

/*
 * ParticleQrCode: a real, scannable QR code that assembles itself.
 *
 * The symbol is encoded here, with no dependency, so the code on screen always
 * decodes to `value`. When it scrolls into view each dark module flies in from a
 * point under the code as a small cloud of grains that tighten onto the grid as
 * they land. Change `value` and the code dissolves back the way it came, swaps
 * while nothing is on screen, and assembles again.
 *
 * The whole animation is one clock running forwards or backwards, so leaving is
 * the arrival reversed and a change mid-flight retargets rather than restarts.
 * A still SVG of the same code sits underneath for no-JS and for the moment
 * before the canvas takes over. Reduced motion gets a short fade instead.
 */

const CSS = `
.bz-qr{position:relative;display:inline-block;vertical-align:middle;width:var(--bz-qr-size,240px);height:var(--bz-qr-size,240px);border-radius:var(--bz-radius-xl,16px);background:var(--bz-paper,#ffffff);color:var(--bz-ink,#0a0a0a)}
.bz-qr-still,.bz-qr-canvas{position:absolute;inset:0;display:block;width:100%;height:100%}
.bz-qr[data-live] .bz-qr-still{visibility:hidden}
.bz-qr-canvas{pointer-events:none}
.bz-qr-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
.bz-qr-error{margin:8px 0 0;font:500 0.875rem/1.5 var(--bz-font-sans,ui-sans-serif,system-ui,sans-serif);color:var(--bz-danger,#b91c1c)}
`;

/* ---------------------------------------------------------- encoding */

export type QrLevel = "L" | "M" | "Q" | "H";

type QrMatrix = { modules: Uint8Array[]; size: number; version: number };

const ALPHANUMERIC = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

/** [error-correction codewords per block, blocks, data codewords per block] for versions 1 to 4. */
const BLOCKS: Record<QrLevel, ReadonlyArray<readonly [number, number, number]>> = {
  L: [[7, 1, 19], [10, 1, 34], [15, 1, 55], [20, 1, 80]],
  M: [[10, 1, 16], [16, 1, 28], [26, 1, 44], [18, 2, 32]],
  Q: [[13, 1, 13], [22, 1, 22], [18, 2, 17], [26, 2, 24]],
  H: [[17, 1, 9], [28, 1, 16], [22, 2, 13], [16, 4, 9]],
};

const LEVEL_BITS: Record<QrLevel, number> = { L: 1, M: 0, Q: 3, H: 2 };

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
}

const gfMultiply = (a: number, b: number) => (a && b ? GF_EXP[GF_LOG[a] + GF_LOG[b]] : 0);

function errorCorrection(data: number[], degree: number) {
  let generator = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array<number>(generator.length + 1).fill(0);
    for (let j = 0; j < generator.length; j++) {
      next[j] ^= generator[j];
      next[j + 1] ^= gfMultiply(generator[j], GF_EXP[i]);
    }
    generator = next;
  }
  const out = new Array<number>(degree).fill(0);
  for (const byte of data) {
    const factor = byte ^ (out.shift() as number);
    out.push(0);
    for (let i = 0; i < degree; i++) out[i] ^= gfMultiply(generator[i + 1], factor);
  }
  return out;
}

const pushBits = (bits: number[], value: number, length: number) => {
  for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
};

const MASKS: Array<(row: number, col: number) => boolean> = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function formatBits(level: QrLevel, mask: number) {
  const data = (LEVEL_BITS[level] << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  return ((data << 10) | rem) ^ 0x5412;
}

function penalty(m: Uint8Array[]) {
  const n = m.length;
  let score = 0;
  for (let i = 0; i < n; i++) {
    let row = 1;
    let col = 1;
    for (let j = 1; j < n; j++) {
      if (m[i][j] === m[i][j - 1]) row++;
      else {
        if (row >= 5) score += row - 2;
        row = 1;
      }
      if (m[j][i] === m[j - 1][i]) col++;
      else {
        if (col >= 5) score += col - 2;
        col = 1;
      }
    }
    if (row >= 5) score += row - 2;
    if (col >= 5) score += col - 2;
  }
  for (let r = 0; r + 1 < n; r++) {
    for (let c = 0; c + 1 < n; c++) {
      const v = m[r][c];
      if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) score += 3;
    }
  }
  const finderA = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const finderB = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j + 11 <= n; j++) {
      let ra = true;
      let rb = true;
      let ca = true;
      let cb = true;
      for (let k = 0; k < 11; k++) {
        if (m[i][j + k] !== finderA[k]) ra = false;
        if (m[i][j + k] !== finderB[k]) rb = false;
        if (m[j + k][i] !== finderA[k]) ca = false;
        if (m[j + k][i] !== finderB[k]) cb = false;
      }
      score += 40 * (Number(ra) + Number(rb) + Number(ca) + Number(cb));
    }
  }
  let dark = 0;
  for (const row of m) for (const v of row) dark += v;
  score += Math.floor(Math.abs((dark * 100) / (n * n) - 50) / 5) * 10;
  return score;
}

/** Encode `text` as a version 1 to 4 symbol. Throws when it does not fit. */
export function buildQrSymbol(text: string, level: QrLevel = "M"): QrMatrix {
  const alphanumeric = [...text].every((ch) => ALPHANUMERIC.includes(ch));
  const bytes = alphanumeric ? null : new TextEncoder().encode(text);
  const payload = bytes ? bytes.length * 8 : 11 * Math.floor(text.length / 2) + 6 * (text.length % 2);
  const needed = 4 + (bytes ? 8 : 9) + payload;
  let version = 0;
  for (let v = 1; v <= 4; v++) {
    const [, blocks, perBlock] = BLOCKS[level][v - 1];
    if (needed <= blocks * perBlock * 8) {
      version = v;
      break;
    }
  }
  if (!version) throw new Error(`ParticleQrCode: the value does not fit a version 4 code at level ${level}.`);

  const [ecPerBlock, blockCount, dataPerBlock] = BLOCKS[level][version - 1];
  const capacity = blockCount * dataPerBlock * 8;
  const bits: number[] = [];
  if (bytes) {
    pushBits(bits, 0b0100, 4);
    pushBits(bits, bytes.length, 8);
    for (const b of bytes) pushBits(bits, b, 8);
  } else {
    pushBits(bits, 0b0010, 4);
    pushBits(bits, text.length, 9);
    for (let i = 0; i + 1 < text.length; i += 2) {
      pushBits(bits, ALPHANUMERIC.indexOf(text[i]) * 45 + ALPHANUMERIC.indexOf(text[i + 1]), 11);
    }
    if (text.length % 2) pushBits(bits, ALPHANUMERIC.indexOf(text[text.length - 1]), 6);
  }
  pushBits(bits, 0, Math.min(4, capacity - bits.length));
  while (bits.length % 8) bits.push(0);
  for (let i = 0; bits.length < capacity; i++) pushBits(bits, i % 2 ? 0x11 : 0xec, 8);

  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    codewords.push(byte);
  }
  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];
  for (let b = 0; b < blockCount; b++) {
    const block = codewords.slice(b * dataPerBlock, (b + 1) * dataPerBlock);
    dataBlocks.push(block);
    ecBlocks.push(errorCorrection(block, ecPerBlock));
  }
  const stream: number[] = [];
  for (let i = 0; i < dataPerBlock; i++) for (const block of dataBlocks) pushBits(stream, block[i], 8);
  for (let i = 0; i < ecPerBlock; i++) for (const block of ecBlocks) pushBits(stream, block[i], 8);
  if (version > 1) for (let i = 0; i < 7; i++) stream.push(0);

  const n = 17 + 4 * version;
  let best: Uint8Array[] | null = null;
  let bestScore = Infinity;

  for (let mask = 0; mask < 8; mask++) {
    const m = Array.from({ length: n }, () => new Uint8Array(n));
    const fixed = Array.from({ length: n }, () => new Uint8Array(n));
    const put = (r: number, c: number, dark: boolean) => {
      if (r < 0 || c < 0 || r >= n || c >= n) return;
      m[r][c] = dark ? 1 : 0;
      fixed[r][c] = 1;
    };
    for (let i = 0; i < n; i++) {
      put(6, i, i % 2 === 0);
      put(i, 6, i % 2 === 0);
    }
    for (const [r0, c0] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
      for (let dy = -1; dy <= 7; dy++) {
        for (let dx = -1; dx <= 7; dx++) {
          const inside = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6;
          const ring = dx === 0 || dx === 6 || dy === 0 || dy === 6;
          const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
          put(r0 + dy, c0 + dx, inside && (ring || core));
        }
      }
    }
    if (version > 1) {
      const centre = 4 * version + 10;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) put(centre + dy, centre + dx, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
    // Reserve the format cells, leaving the two timing modules they cross alone.
    for (let i = 0; i <= 8; i++) {
      if (i !== 6) {
        put(8, i, false);
        put(i, 8, false);
      }
    }
    for (let i = 0; i < 8; i++) {
      put(8, n - 1 - i, false);
      put(n - 1 - i, 8, false);
    }
    put(n - 8, 8, true);

    let index = 0;
    for (let right = n - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      const upward = ((right + 1) & 2) === 0;
      for (let step = 0; step < n; step++) {
        const row = upward ? n - 1 - step : step;
        for (let side = 0; side < 2; side++) {
          const col = right - side;
          if (fixed[row][col]) continue;
          const bit = index < stream.length ? stream[index] : 0;
          index++;
          m[row][col] = bit ^ (MASKS[mask](row, col) ? 1 : 0);
        }
      }
    }

    const format = formatBits(level, mask);
    const bit = (i: number) => (format >>> i) & 1;
    for (let i = 0; i <= 5; i++) m[i][8] = bit(i);
    m[7][8] = bit(6);
    m[8][8] = bit(7);
    m[8][7] = bit(8);
    for (let i = 9; i < 15; i++) m[8][14 - i] = bit(i);
    for (let i = 0; i < 8; i++) m[8][n - 1 - i] = bit(i);
    for (let i = 8; i < 15; i++) m[n - 15 + i][8] = bit(i);
    m[n - 8][8] = 1;

    const score = penalty(m);
    if (score < bestScore) {
      bestScore = score;
      best = m;
    }
  }

  return { modules: best as Uint8Array[], size: n, version };
}

/* ------------------------------------------------------------ drawing */

const FLIGHT = 800;
const SPREAD = 600;
const TOTAL = SPREAD + FLIGHT;
const EXIT_RATE = 1.7;
const FADE = 150;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 5);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Where the code sits in its square, in CSS pixels. Shared by the still and the canvas. */
function geometry(size: number, n: number) {
  const module = Math.max(2, Math.floor((size * 0.74) / n));
  const code = module * n;
  return { module, left: Math.round((size - code) / 2), top: Math.round((size - code) * 0.32) };
}

type Mark = { tx: number; ty: number; dx: number; dy: number; angle: number; start: number; grains: Float32Array; reach: number };

type EngineConfig = {
  size: number;
  mode: "dust" | "beam";
  reduced: boolean;
  modules: Uint8Array[] | null;
};

type Engine = {
  start: () => void;
  swap: () => void;
  rebuild: () => void;
  motionChanged: () => void;
  destroy: () => void;
};

function createEngine(root: HTMLElement, canvas: HTMLCanvasElement, config: () => EngineConfig): Engine | null {
  const context = canvas.getContext("2d");
  if (!context) return null;
  const ctx = context;

  let grid = config().modules;
  let pending: Uint8Array[] | null | undefined;
  let clock = 0;
  let open = false;
  let started = false;
  let dead = false;
  let raf = 0;
  let prev = 0;
  let wasReduced = config().reduced;
  let marks: Mark[] = [];
  let cell = 4;
  let grain = 1;
  let lx = 0;
  let ly = 0;
  let ink = "#0a0a0a";
  let dpr = 1;

  const span = () => (config().reduced ? FADE : TOTAL);

  function paint() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = ink;
    const half = cell / 2;
    if (config().reduced) {
      const a = clamp01(clock / FADE);
      if (a <= 0) return;
      ctx.globalAlpha = a;
      for (const m of marks) ctx.fillRect(m.tx - half, m.ty - half, cell, cell);
      ctx.globalAlpha = 1;
      return;
    }
    const mode = config().mode;
    for (const m of marks) {
      const t = clamp01((clock - m.start) / FLIGHT);
      if (t <= 0) continue;
      if (t >= 1) {
        ctx.globalAlpha = 1;
        ctx.fillRect(m.tx - half, m.ty - half, cell, cell);
        continue;
      }
      const e = easeOut(t);
      const k = Math.pow(1 - t, 4);
      const x = lx + m.dx * e;
      const y = ly + m.dy * e;
      ctx.globalAlpha = t < 0.2 ? t / 0.2 : 1;
      if (mode === "beam") {
        const stretch = 1 + 7 * k;
        const squash = 1 - 0.55 * k;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(m.angle * Math.min(1, k * 5));
        ctx.fillRect((-cell * stretch) / 2, (-cell * squash) / 2, cell * stretch, cell * squash);
        ctx.restore();
        continue;
      }
      const scatter = 1 - e;
      if (scatter * m.reach < 0.6) {
        ctx.fillRect(x - half, y - half, cell, cell);
        continue;
      }
      const g = m.grains;
      for (let i = 0; i < g.length; i += 4) ctx.fillRect(x + g[i] + g[i + 2] * scatter, y + g[i + 1] + g[i + 3] * scatter, grain, grain);
    }
    ctx.globalAlpha = 1;
  }

  function rebuild() {
    if (dead) return;
    const { size, mode } = config();
    dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const px = Math.round(size * dpr);
    if (canvas.width !== px || canvas.height !== px) {
      canvas.width = px;
      canvas.height = px;
    }
    ink = getComputedStyle(root).color || ink;
    marks = [];
    if (!grid) {
      paint();
      return;
    }
    const n = grid.length;
    const g = geometry(size, n);
    cell = Math.max(2, Math.round(g.module * dpr));
    const ox = Math.round(g.left * dpr);
    const oy = Math.round(g.top * dpr);
    // The largest grain that tiles a module exactly, at five grains a side at most.
    const smallest = Math.max(Math.round(dpr), Math.ceil(cell / 5));
    grain = cell;
    for (let s = smallest; s <= cell; s++) {
      if (cell % s === 0) {
        grain = s;
        break;
      }
    }
    const perSide = cell / grain;
    lx = Math.round(px / 2);
    ly = px - Math.round(2 * dpr);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (!grid[y][x]) continue;
        const tx = ox + x * cell + cell / 2;
        const ty = oy + y * cell + cell / 2;
        marks.push({ tx, ty, dx: tx - lx, dy: ty - ly, angle: Math.atan2(ty - ly, tx - lx), start: 0, grains: new Float32Array(0), reach: 0 });
      }
    }
    // Nearest modules land first, so the code grows up out of the launch point.
    marks.sort((a, b) => Math.hypot(a.dx, a.dy) - Math.hypot(b.dx, b.dy));
    const last = Math.max(1, marks.length - 1);
    marks.forEach((m, i) => {
      m.start = (SPREAD * i) / last;
    });
    if (mode === "dust") {
      const rand = seeded(0x2f6b1d ^ n);
      const reach = cell * 4;
      for (const m of marks) {
        const grains = new Float32Array(perSide * perSide * 4);
        let k = 0;
        let far = 0;
        for (let gy = 0; gy < perSide; gy++) {
          for (let gx = 0; gx < perSide; gx++) {
            grains[k++] = -cell / 2 + gx * grain;
            grains[k++] = -cell / 2 + gy * grain;
            const spread = reach * (0.4 + rand() * 0.6);
            const theta = rand() * Math.PI * 2;
            const along = rand() * reach - reach * 0.25;
            const sx = Math.cos(theta) * spread + Math.cos(m.angle) * along;
            const sy = Math.sin(theta) * spread + Math.sin(m.angle) * along;
            grains[k++] = sx;
            grains[k++] = sy;
            far = Math.max(far, Math.hypot(sx, sy));
          }
        }
        m.grains = grains;
        m.reach = far;
      }
    }
    paint();
  }

  function onPark(atOpen: boolean) {
    if (atOpen) {
      if (pending !== undefined) {
        open = false;
        run();
      }
      return;
    }
    if (pending !== undefined) {
      grid = pending;
      pending = undefined;
      rebuild();
    }
    if (grid) {
      open = true;
      run();
    }
  }

  // Park on the signed step, never on the flag, so a change mid-run retargets.
  function frame(now: number) {
    if (dead) return;
    const dt = Math.max(0, Math.min(64, now - prev));
    prev = now;
    const s = span();
    const step = dt * (open ? 1 : -EXIT_RATE);
    clock = Math.max(0, Math.min(s, clock + step));
    const parked = (step > 0 && clock >= s) || (step < 0 && clock <= 0);
    paint();
    if (parked) {
      raf = 0;
      onPark(open);
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function run() {
    if (dead || raf) return;
    prev = performance.now();
    raf = requestAnimationFrame(frame);
  }

  const onResize = () => {
    if (Math.max(1, Math.min(3, window.devicePixelRatio || 1)) !== dpr) rebuild();
  };
  window.addEventListener("resize", onResize);

  rebuild();

  return {
    start() {
      if (started || dead) return;
      started = true;
      root.dataset.live = "true";
      if (grid) {
        open = true;
        run();
      }
    },
    swap() {
      const next = config().modules;
      if (!started) {
        grid = next;
        rebuild();
        return;
      }
      pending = next;
      if (open) {
        open = false;
        run();
      } else if (!raf) {
        onPark(false);
      }
    },
    rebuild,
    motionChanged() {
      const was = wasReduced ? FADE : TOTAL;
      const reduced = config().reduced;
      clock = (clock / was) * (reduced ? FADE : TOTAL);
      wasReduced = reduced;
      paint();
      if (started) run();
    },
    destroy() {
      dead = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      window.removeEventListener("resize", onResize);
    },
  };
}

/* ---------------------------------------------------------- component */

const RM_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(RM_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const readReducedMotion = () => window.matchMedia(RM_QUERY).matches;
const serverReducedMotion = () => false;

export type ParticleQrCodeProps = {
  /** What the code decodes to. Up to 62 bytes of text, or 90 characters from the QR alphanumeric set, at level M. */
  value: string;
  /** Width and height in CSS pixels. */
  size?: number;
  /** Accessible name. Say what scanning the code does. */
  label?: string;
  /** Error correction: L, M, Q or H. */
  level?: QrLevel;
  /** A cloud of grains per module, or a streak. */
  mode?: "dust" | "beam";
  /** Assemble when a quarter of it is in view, or as soon as it mounts. */
  play?: "view" | "mount";
  className?: string;
};

export function ParticleQrCode({
  value,
  size = 240,
  label,
  level = "M",
  mode = "dust",
  play = "view",
  className = "",
}: ParticleQrCodeProps) {
  const reduced = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, serverReducedMotion);
  const symbol = useMemo(() => {
    try {
      return buildQrSymbol(value, level);
    } catch {
      return null;
    }
  }, [value, level]);

  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const configRef = useRef<EngineConfig>({ size, mode, reduced, modules: symbol?.modules ?? null });
  configRef.current = { size, mode, reduced, modules: symbol?.modules ?? null };
  const playRef = useRef(play);
  playRef.current = play;
  const [announcement, setAnnouncement] = useState("");
  const firstValue = useRef(true);
  const name = label ?? `QR code for ${value}`;

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const engine = createEngine(root, canvas, () => configRef.current);
    if (!engine) return;
    engineRef.current = engine;
    let io: IntersectionObserver | null = null;
    if (playRef.current === "mount" || !("IntersectionObserver" in window)) {
      engine.start();
    } else {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.25)) {
            engine.start();
            io?.disconnect();
          }
        },
        { threshold: [0, 0.25] },
      );
      io.observe(root);
    }
    return () => {
      io?.disconnect();
      engine.destroy();
      engineRef.current = null;
      delete root.dataset.live;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.swap();
    if (firstValue.current) {
      firstValue.current = false;
      return;
    }
    setAnnouncement(symbol ? `QR code updated. ${name}.` : "");
  }, [symbol]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    engineRef.current?.rebuild();
  }, [size, mode]);

  useEffect(() => {
    engineRef.current?.motionChanged();
  }, [reduced]);

  const still = useMemo(() => {
    if (!symbol) return "";
    const g = geometry(size, symbol.size);
    let d = "";
    symbol.modules.forEach((row, y) => {
      row.forEach((dark, x) => {
        if (dark) d += `M${g.left + x * g.module} ${g.top + y * g.module}h${g.module}v${g.module}h-${g.module}z`;
      });
    });
    return d;
  }, [symbol, size]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        ref={rootRef}
        className={`bz-qr ${className}`.trim()}
        role="img"
        aria-label={name}
        style={{ ["--bz-qr-size" as string]: `${size}px` } as CSSProperties}
      >
        <svg className="bz-qr-still" viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false">
          <path d={still} fill="currentColor" shapeRendering="crispEdges" />
        </svg>
        <canvas ref={canvasRef} className="bz-qr-canvas" aria-hidden="true" />
      </div>
      <span className="bz-qr-sr" aria-live="polite">
        {announcement}
      </span>
      {symbol ? null : (
        <p className="bz-qr-error" role="alert">
          This value is too long for a QR code.
        </p>
      )}
    </>
  );
}
