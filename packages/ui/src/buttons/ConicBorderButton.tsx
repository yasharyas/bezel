"use client";

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

type ConicBorderButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  colors?: [string, string, string];
  spinDuration?: number;
  textured?: boolean;
};

export function ConicBorderButton({
  children,
  className = "",
  colors = ["#b8701c", "#4b3a8f", "#4f7d10"],
  spinDuration = 3.2,
  textured = true,
  type = "button",
  ...rest
}: ConicBorderButtonProps) {
  const [c0, c1, c2] = colors;
  return (
    <>
      <style>{`
        @property --btn-ang {
          syntax: "<angle>";
          inherits: false;
          initial-value: 0deg;
        }
        .cbb {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          isolation: isolate;
          overflow: hidden;
          border: 0;
          border-radius: 999px;
          padding: 0 1.35rem;
          height: 46px;
          cursor: pointer;
          color: #f5fff9;
          font: inherit;
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          background: linear-gradient(135deg, #00706a, #004b46);
          transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .cbb:hover { transform: translateY(-2px); }
        .cbb::after {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          padding: 2px;
          background: conic-gradient(
            from var(--btn-ang, 0deg),
            var(--cbb-0),
            var(--cbb-1),
            var(--cbb-2),
            var(--cbb-0)
          );
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: cbb-spin var(--cbb-dur, 3.2s) linear infinite;
          z-index: -1;
          opacity: 0.9;
        }
        .cbb--textured::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          opacity: 0.22;
          mix-blend-mode: soft-light;
          z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E");
        }
        .cbb__label { position: relative; z-index: 1; }
        @keyframes cbb-spin { to { --btn-ang: 360deg; } }
        @media (prefers-reduced-motion: reduce) {
          .cbb::after { animation: none; }
          .cbb:hover { transform: none; }
        }
      `}</style>
      <button
        type={type}
        className={`cbb${textured ? " cbb--textured" : ""} ${className}`.trim()}
        style={
          {
            ["--cbb-0" as string]: c0,
            ["--cbb-1" as string]: c1,
            ["--cbb-2" as string]: c2,
            ["--cbb-dur" as string]: `${spinDuration}s`,
          } as CSSProperties
        }
        {...rest}
      >
        <span className="cbb__label">{children}</span>
      </button>
    </>
  );
}
