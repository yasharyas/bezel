"use client";

import {
  useCallback,
  useRef,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";

type GlareHoverProps = {
  children: ReactNode;
  className?: string;
  glareSize?: number;
  glareColor?: string;
};

export function GlareHover({
  children,
  className = "",
  glareSize = 90,
  glareColor = "rgba(255, 255, 255, 0.72)",
}: GlareHoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    el.style.setProperty("--glare-x", `${x}%`);
    el.style.setProperty("--glare-y", `${y}%`);
  }, []);

  const onLeave = useCallback(() => {
    ref.current?.style.setProperty("--glare-opacity", "0");
  }, []);

  const onEnter = useCallback(() => {
    ref.current?.style.setProperty("--glare-opacity", "1");
  }, []);

  return (
    <>
      <style>{`
        .pl-glare {
          position: relative;
          isolation: isolate;
          border-radius: inherit;
        }
        .pl-glare__shine {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          z-index: 2;
          opacity: var(--glare-opacity, 0);
          transition: opacity 220ms cubic-bezier(0.22, 1, 0.36, 1);
          background: radial-gradient(
            circle var(--glare-size, 90px) at var(--glare-x, 50%) var(--glare-y, 40%),
            var(--glare-color, rgba(255, 255, 255, 0.72)) 0%,
            rgba(255, 255, 255, 0.22) 28%,
            transparent 62%
          );
          mix-blend-mode: soft-light;
        }
        @media (prefers-reduced-motion: reduce) {
          .pl-glare__shine { display: none; }
        }
      `}</style>
      <div
        ref={ref}
        className={`pl-glare ${className}`.trim()}
        style={
          {
            "--glare-x": "50%",
            "--glare-y": "40%",
            "--glare-opacity": "0",
            "--glare-size": `${glareSize}px`,
            "--glare-color": glareColor,
          } as CSSProperties
        }
        onPointerMove={onMove}
        onPointerEnter={onEnter}
        onPointerLeave={onLeave}
      >
        {children}
        <span className="pl-glare__shine" aria-hidden />
      </div>
    </>
  );
}
