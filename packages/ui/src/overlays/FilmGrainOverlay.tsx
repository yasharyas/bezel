"use client";

import { useEffect, useRef } from "react";

type FilmGrainOverlayProps = {
  /** Opacity of the stretched grain layer (visual intensity) */
  opacity?: number;
  /** Logical canvas resolution before CSS stretch */
  resolution?: number;
  className?: string;
};

/**
 * Fixed low-res canvas film grain (~20fps via frame%3) with overlay blend
 * so dark surfaces never read as flat digital black.
 */
export function FilmGrainOverlay({
  opacity = 0.05,
  resolution = 220,
  className = "pointer-events-none fixed inset-0 z-[9999] h-full w-full mix-blend-overlay",
}: FilmGrainOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = resolution;
    const H = resolution;
    canvas.width = W;
    canvas.height = H;

    let raf = 0;
    let frame = 0;
    const draw = () => {
      frame++;
      if (frame % 3 === 0) {
        const img = ctx.createImageData(W, H);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          const v = (Math.random() * 255) | 0;
          d[i] = v;
          d[i + 1] = v;
          d[i + 2] = v;
          d[i + 3] = 11;
        }
        ctx.putImageData(img, 0, 0);
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [resolution]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
      style={{ opacity }}
    />
  );
}
