"use client";

import type { CSSProperties } from "react";

export type MetallicLogoShimmerProps = {
  /** Logo image used both as visible mark and CSS mask for glare/shimmer. */
  src: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  maxWidth?: string;
};

/**
 * Soft plate + champagne bloom + logo-masked glare + slow metallic sweep.
 * Consumer supplies `src` (no bundled brand asset).
 */
export function MetallicLogoShimmer({
  src,
  alt = "YASH logo",
  className,
  style,
  maxWidth = "min(100%, 28rem)",
}: MetallicLogoShimmerProps) {
  const mask: CSSProperties = {
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
    maskSize: "contain",
    maskRepeat: "no-repeat",
    maskPosition: "center",
  };

  return (
    <>
      <style>{`
        @keyframes mls-ambient-glow {
          0%, 48% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.97); }
          56%, 76% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
          88%, 100% { opacity: 0.55; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes mls-shimmer {
          0%, 52% { transform: translateX(-38%) rotate(-2deg); opacity: 0; }
          58% { transform: translateX(-14%); opacity: 0.42; }
          64%, 80% { transform: translateX(6%); opacity: 0.68; }
          86% { transform: translateX(18%); opacity: 0.48; }
          94%, 100% { transform: translateX(36%); opacity: 0; }
        }
        .mls-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          max-width: 100%;
          isolation: isolate;
        }
        .mls-logo {
          position: relative;
          z-index: 1;
          width: var(--mls-max, min(100%, 28rem));
          height: auto;
          object-fit: contain;
          filter: drop-shadow(0 18px 36px hsl(60 4% 8% / 0.09));
        }
        .mls-plate,
        .mls-glow {
          position: absolute;
          left: 50%;
          top: 52%;
          z-index: 0;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .mls-plate {
          width: 74%;
          height: 74%;
          background: radial-gradient(
            circle at center,
            hsl(0 0% 100% / 0.96) 0%,
            hsl(0 0% 100% / 0.9) 34%,
            hsl(40 33% 97% / 0.62) 58%,
            hsl(40 33% 97% / 0.22) 74%,
            transparent 88%
          );
          filter: blur(18px);
        }
        .mls-glow {
          width: 62%;
          height: 62%;
          background: radial-gradient(
            circle at center,
            hsl(44 72% 90% / 0.28) 0%,
            hsl(40 52% 78% / 0.14) 38%,
            hsl(38 38% 68% / 0.05) 58%,
            transparent 76%
          );
          filter: blur(28px);
          animation: mls-ambient-glow 22s ease-in-out infinite;
        }
        .mls-glare {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          background:
            radial-gradient(ellipse 34% 26% at 30% 18%, hsl(46 92% 94% / 0.32), transparent 72%),
            radial-gradient(ellipse 48% 38% at 52% 58%, hsl(38 48% 52% / 0.1), transparent 76%);
          mix-blend-mode: soft-light;
        }
        .mls-shimmer {
          position: absolute;
          inset: 0;
          z-index: 3;
          overflow: hidden;
          pointer-events: none;
        }
        .mls-shimmer::before {
          content: "";
          position: absolute;
          top: -18%;
          left: -18%;
          width: 136%;
          height: 136%;
          background: linear-gradient(
            118deg,
            transparent 0%,
            hsl(38 38% 48% / 0.04) 28%,
            hsl(40 55% 62% / 0.14) 42%,
            hsl(44 78% 84% / 0.28) 48%,
            hsl(46 92% 95% / 0.38) 50%,
            hsl(42 68% 72% / 0.22) 52%,
            hsl(38 45% 52% / 0.1) 62%,
            transparent 78%
          );
          animation: mls-shimmer 24s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .mls-glow,
          .mls-shimmer::before { animation: none; }
          .mls-glow { opacity: 0.65; }
          .mls-shimmer::before { opacity: 0; }
        }
      `}</style>
      <div
        className={["mls-wrap", className].filter(Boolean).join(" ")}
        style={{ ...style, ["--mls-max" as string]: maxWidth }}
      >
        <div className="mls-plate" aria-hidden />
        <div className="mls-glow" aria-hidden />
        <div className="mls-glare" style={mask} aria-hidden />
        <div className="mls-shimmer" style={mask} aria-hidden />
        <img src={src} alt={alt} className="mls-logo" />
      </div>
    </>
  );
}
