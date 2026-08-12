"use client";

import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

type ShinyGradientTextProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  colors?: string[];
  duration?: number;
};

export function ShinyGradientText({
  children,
  className = "",
  colors = ["#b8701c", "#f0c27a", "#4f7d10", "#b8701c", "#f0c27a"],
  duration = 4.5,
  style,
  ...rest
}: ShinyGradientTextProps) {
  const gradient = `linear-gradient(110deg, ${colors.join(", ")})`;
  return (
    <>
      <style>{`
        .sgt {
          display: inline-block;
          background-size: 220% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent !important;
          animation: sgt-shine var(--sgt-dur, 4.5s) linear infinite;
        }
        @keyframes sgt-shine {
          to { background-position: 220% center; }
        }
        @media (prefers-reduced-motion: reduce) {
          .sgt {
            animation: none;
            background-position: 40% center;
          }
        }
      `}</style>
      <span
        className={`sgt ${className}`.trim()}
        style={
          {
            ...style,
            backgroundImage: gradient,
            ["--sgt-dur" as string]: `${duration}s`,
          } as CSSProperties
        }
        {...rest}
      >
        {children}
      </span>
    </>
  );
}
