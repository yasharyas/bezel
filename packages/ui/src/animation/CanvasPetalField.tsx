"use client";

import { useEffect, useRef } from "react";

type CanvasPetalFieldProps = {
  count?: number;
  className?: string;
  /** Restrict drawing to bottom fraction of the canvas (0–1). Default 1 = full. */
  heightFraction?: number;
};

type Petal = {
  x: number;
  y: number;
  r: number;
  rot: number;
  vr: number;
  speed: number;
  sway: number;
  swaySpeed: number;
  alpha: number;
  kind: 0 | 1;
};

/**
 * Ambient marigold / jasmine petals drawn as canvas shapes with a faint
 * mouse "gust" that nudges them sideways. No image assets.
 */
export function CanvasPetalField({
  count = 16,
  className = "pointer-events-none absolute inset-0 z-30 h-full w-full",
  heightFraction = 1,
}: CanvasPetalFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width;
      H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const petals: Petal[] = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H - H,
      r: 6 + Math.random() * 9,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.02,
      speed: 0.25 + Math.random() * 0.5,
      sway: Math.random() * 26,
      swaySpeed: 0.01 + Math.random() * 0.02,
      alpha: 0.12 + Math.random() * 0.22,
      kind: Math.random() > 0.5 ? 0 : 1,
    }));

    let gust = 0;
    const onMove = (e: MouseEvent) => {
      gust = (e.clientX / window.innerWidth - 0.5) * 0.8;
    };
    window.addEventListener("mousemove", onMove);

    const drawMarigold = (r: number) => {
      ctx.fillStyle = "#d98c1f";
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45, r * 0.4, r * 0.26, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#b8731a";
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    };
    const drawJasmine = (r: number) => {
      ctx.fillStyle = "#f3ead9";
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4, r * 0.34, r * 0.22, a, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    let t = 0;
    let raf = 0;
    const loop = () => {
      ctx.clearRect(0, 0, W, H);
      t++;
      const y0 = H * (1 - heightFraction);
      for (const p of petals) {
        p.y += p.speed;
        p.x += Math.sin(t * p.swaySpeed) * 0.3 + gust;
        p.rot += p.vr;
        if (p.y > H + 30) {
          p.y = y0 - 30;
          p.x = Math.random() * W;
        }
        if (p.y < y0 - 40) continue;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        if (p.kind === 0) drawMarigold(p.r);
        else drawJasmine(p.r);
        ctx.restore();
      }
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, [count, heightFraction]);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
