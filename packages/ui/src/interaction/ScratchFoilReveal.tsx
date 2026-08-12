"use client";

import { useEffect, useRef } from "react";

type ScratchFoilRevealProps = {
  children: React.ReactNode;
  foil?: string;
  foilSoft?: string;
  ink?: string;
  label?: string;
  /** Fraction of coverage grid that must clear before auto-dissolve (0–1) */
  threshold?: number;
  className?: string;
  style?: React.CSSProperties;
  onReveal?: () => void;
};

/**
 * Scratch through painted gold foil to reveal children. Progress uses a
 * logical coverage grid (no getImageData thrash). ~threshold auto-dissolves.
 */
export function ScratchFoilReveal({
  children,
  foil = "#c9a227",
  foilSoft = "#e8d5a3",
  ink = "#5a3a12",
  label = "Scratch to reveal",
  threshold = 0.55,
  className,
  style,
  onReveal,
}: ScratchFoilRevealProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hintRef = useRef<HTMLSpanElement>(null);
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const reveal = () => {
      canvas.style.opacity = "0";
      canvas.style.pointerEvents = "none";
      if (hintRef.current) hintRef.current.style.opacity = "0";
      onRevealRef.current?.();
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = reduce ? null : canvas.getContext("2d");
    if (reduce || !ctx) {
      reveal();
      return;
    }

    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, isCoarsePointer ? 1.25 : 2);

    const paintFoil = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.globalCompositeOperation = "source-over";
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, foil);
      grad.addColorStop(0.5, foilSoft);
      grad.addColorStop(1, foil);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < (w * h) / 2400; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.12})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, dpr, dpr);
      }
      ctx.fillStyle = ink;
      ctx.font = `${12 * dpr}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = 0.7;
      ctx.fillText(label.toUpperCase(), w / 2, h / 2);
      ctx.globalAlpha = 1;
    };

    const GRID_COLS = 22;
    const GRID_ROWS = 28;
    let grid = new Uint8Array(GRID_COLS * GRID_ROWS);
    let clearedCells = 0;
    let cellW = 1;
    let cellH = 1;

    const fit = () => {
      const r = wrap.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      canvas.style.width = `${r.width}px`;
      canvas.style.height = `${r.height}px`;
      paintFoil();
      grid = new Uint8Array(GRID_COLS * GRID_ROWS);
      clearedCells = 0;
      cellW = canvas.width / GRID_COLS;
      cellH = canvas.height / GRID_ROWS;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);

    let drawing = false;
    const SCRATCH_RADIUS_UNSCALED = 26;

    const localPoint = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr };
    };
    const scratch = (x: number, y: number) => {
      const radius = SCRATCH_RADIUS_UNSCALED * dpr;
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      const minCol = Math.max(0, Math.floor((x - radius) / cellW));
      const maxCol = Math.min(GRID_COLS - 1, Math.floor((x + radius) / cellW));
      const minRow = Math.max(0, Math.floor((y - radius) / cellH));
      const maxRow = Math.min(GRID_ROWS - 1, Math.floor((y + radius) / cellH));
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          const idx = row * GRID_COLS + col;
          if (grid[idx]) continue;
          const dx = (col + 0.5) * cellW - x;
          const dy = (row + 0.5) * cellH - y;
          if (dx * dx + dy * dy <= radius * radius) {
            grid[idx] = 1;
            clearedCells++;
          }
        }
      }
    };
    const clearedFraction = () => clearedCells / (GRID_COLS * GRID_ROWS);

    const onDown = (e: PointerEvent) => {
      drawing = true;
      if (hintRef.current) hintRef.current.style.opacity = "0";
      canvas.setPointerCapture(e.pointerId);
      const p = localPoint(e);
      scratch(p.x, p.y);
    };
    const onMove = (e: PointerEvent) => {
      if (!drawing) return;
      const coalesced = e.getCoalescedEvents?.();
      const points = coalesced && coalesced.length > 0 ? coalesced : [e];
      for (const pe of points) {
        const p = localPoint(pe);
        scratch(p.x, p.y);
      }
      if (clearedFraction() > threshold) reveal();
    };
    const onUp = () => {
      drawing = false;
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [foil, foilSoft, ink, label, threshold]);

  return (
    <div ref={wrapRef} className={`relative ${className ?? ""}`} style={style}>
      {children}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 h-full w-full cursor-grab touch-none opacity-100 transition-opacity duration-700"
      />
      <span
        ref={hintRef}
        className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 animate-pulse text-[0.6rem] uppercase tracking-[0.3em] text-white/80 mix-blend-difference transition-opacity duration-300"
      >
        Scratch
      </span>
    </div>
  );
}
