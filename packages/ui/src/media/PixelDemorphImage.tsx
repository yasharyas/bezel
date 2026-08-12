"use client";

import { useEffect, useRef } from "react";

type PixelDemorphImageProps = {
  src: string;
  alt?: string;
  className?: string;
  durationMs?: number;
  /** Starting coarse block count across width */
  startBlocks?: number;
};

/**
 * Scroll-into-view pixel demorph: coarse nearest-neighbour blocks resolve
 * into a sharp photo via offscreen downsample (no getImageData / CORS thrash).
 */
export function PixelDemorphImage({
  src,
  alt = "",
  className,
  durationMs = 1100,
  startBlocks = 6,
}: PixelDemorphImageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const off = document.createElement("canvas");
    const offCtx = off.getContext("2d");
    if (!offCtx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    let loaded = false;
    let raf = 0;
    let ioRef: IntersectionObserver | null = null;

    const fit = () => {
      const r = wrap.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      canvas.style.width = `${r.width}px`;
      canvas.style.height = `${r.height}px`;
    };

    const drawCover = (target: CanvasRenderingContext2D, tw: number, th: number) => {
      const ir = img.width / img.height;
      const cr = tw / th;
      let dw = tw;
      let dh = th;
      let dx = 0;
      let dy = 0;
      if (ir > cr) {
        dh = th;
        dw = th * ir;
        dx = (tw - dw) / 2;
      } else {
        dw = tw;
        dh = tw / ir;
        dy = (th - dh) / 2;
      }
      target.drawImage(img, dx, dy, dw, dh);
    };

    const renderBlocks = (blocks: number) => {
      const w = canvas.width;
      const h = canvas.height;
      if (blocks >= w) {
        ctx.imageSmoothingEnabled = true;
        ctx.clearRect(0, 0, w, h);
        drawCover(ctx, w, h);
        return;
      }
      const cols = Math.max(2, Math.round(blocks));
      const rows = Math.max(2, Math.round(cols * (h / w)));
      off.width = cols;
      off.height = rows;
      offCtx.imageSmoothingEnabled = true;
      offCtx.clearRect(0, 0, cols, rows);
      drawCover(offCtx, cols, rows);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(off, 0, 0, cols, rows, 0, 0, w, h);
    };

    const animate = () => {
      fit();
      if (reduce) {
        renderBlocks(canvas.width);
        return;
      }
      const start = performance.now();
      const minBlocks = startBlocks;
      const maxBlocks = canvas.width;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        const eased = 1 - Math.pow(1 - t, 3);
        const blocks = Math.round(minBlocks + (maxBlocks - minBlocks) * eased);
        renderBlocks(blocks);
        if (t < 1) raf = requestAnimationFrame(tick);
        else renderBlocks(maxBlocks);
      };
      raf = requestAnimationFrame(tick);
    };

    img.onload = () => {
      loaded = true;
      fit();
      renderBlocks(startBlocks);
      ioRef = new IntersectionObserver(
        (entries, obs) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              animate();
              obs.disconnect();
            }
          }
        },
        { threshold: 0.25 },
      );
      ioRef.observe(wrap);
    };
    img.src = src;

    const onResize = () => {
      if (loaded) renderBlocks(canvas.width);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      ioRef?.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [src, durationMs, startBlocks]);

  return (
    <div ref={wrapRef} className={`relative overflow-hidden ${className ?? ""}`}>
      <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />
    </div>
  );
}
