"use client";

import type { CSSProperties } from "react";

type AnimatedGradientRuleProps = {
  className?: string;
  colors?: [string, string, string];
  duration?: number;
};

export function AnimatedGradientRule({
  className = "",
  colors = ["#f0a03c", "#6b55b8", "#5d8d1c"],
  duration = 8,
}: AnimatedGradientRuleProps) {
  const [a, b, c] = colors;
  return (
    <>
      <style>{`
        .agr {
          height: 2px;
          width: 100%;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            transparent,
            var(--agr-a) 18%,
            var(--agr-b) 50%,
            var(--agr-c) 82%,
            transparent
          );
          background-size: 200% 100%;
          animation: agr-slide var(--agr-dur, 8s) linear infinite;
        }
        @keyframes agr-slide {
          to { background-position: -200% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .agr { animation: none; background-position: 0 0; }
        }
      `}</style>
      <div
        className={`agr ${className}`.trim()}
        role="separator"
        style={
          {
            ["--agr-a" as string]: a,
            ["--agr-b" as string]: b,
            ["--agr-c" as string]: c,
            ["--agr-dur" as string]: `${duration}s`,
          } as CSSProperties
        }
      />
    </>
  );
}
