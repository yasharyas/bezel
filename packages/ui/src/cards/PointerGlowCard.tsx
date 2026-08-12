"use client";

import {
  useCallback,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent,
  type ReactNode,
} from "react";

type PointerGlowCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  glowColor?: string;
  glowSecondary?: string;
  radius?: number;
};

export function PointerGlowCard({
  children,
  className = "",
  glowColor = "rgba(184, 112, 28, 0.75)",
  glowSecondary = "rgba(75, 58, 143, 0.35)",
  radius = 220,
  style,
  ...rest
}: PointerGlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--gx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--gy", `${((e.clientY - r.top) / r.height) * 100}%`);
  }, []);

  return (
    <>
      <style>{`
        .pgc {
          position: relative;
          isolation: isolate;
          border-radius: 1.25rem;
          background: rgba(255, 255, 255, 0.55);
          border: 1px solid rgba(75, 58, 143, 0.14);
          overflow: hidden;
        }
        .pgc::before {
          content: "";
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          padding: 1px;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.35s ease;
          background: radial-gradient(
            var(--pgc-r, 220px) circle at var(--gx, 50%) var(--gy, 50%),
            var(--pgc-a),
            var(--pgc-b) 34%,
            transparent 62%
          );
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          z-index: 2;
        }
        .pgc:hover::before,
        .pgc:focus-within::before { opacity: 1; }
        .pgc__body { position: relative; z-index: 1; }
        @media (prefers-reduced-motion: reduce) {
          .pgc::before { transition: none; }
        }
      `}</style>
      <div
        ref={ref}
        className={`pgc ${className}`.trim()}
        style={
          {
            ...style,
            "--gx": "50%",
            "--gy": "50%",
            "--pgc-a": glowColor,
            "--pgc-b": glowSecondary,
            "--pgc-r": `${radius}px`,
          } as CSSProperties
        }
        onPointerMove={onMove}
        {...rest}
      >
        <div className="pgc__body">{children}</div>
      </div>
    </>
  );
}
