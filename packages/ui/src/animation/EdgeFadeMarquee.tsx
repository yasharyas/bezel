"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type EdgeFadeMarqueeProps = {
  children: ReactNode;
  className?: string;
  trackClassName?: string;
  duration?: number;
  pauseOnHover?: boolean;
  fade?: boolean;
  fadeColor?: string;
  gap?: number;
};

export function EdgeFadeMarquee({
  children,
  className = "",
  trackClassName = "",
  duration = 40,
  pauseOnHover = true,
  fade = true,
  fadeColor = "rgba(238, 231, 251, 0.95)",
  gap = 16,
}: EdgeFadeMarqueeProps) {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduce(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <>
      <style>{`
        .efm {
          overflow: hidden;
          position: relative;
        }
        .efm__fade {
          pointer-events: none;
          position: absolute;
          inset-block: 0;
          width: 48px;
          z-index: 2;
        }
        .efm__fade--l {
          left: 0;
          background: linear-gradient(90deg, var(--efm-fade), transparent);
        }
        .efm__fade--r {
          right: 0;
          background: linear-gradient(270deg, var(--efm-fade), transparent);
        }
        .efm__track {
          display: flex;
          width: max-content;
          animation: efm-marq var(--efm-dur, 40s) linear infinite;
        }
        .efm[data-pause="true"]:hover .efm__track {
          animation-play-state: paused;
        }
        .efm[data-static="true"] .efm__track {
          animation: none;
        }
        @keyframes efm-marq {
          to { transform: translate3d(-50%, 0, 0); }
        }
      `}</style>
      <div
        className={`efm ${className}`.trim()}
        data-pause={pauseOnHover ? "true" : "false"}
        data-static={reduce ? "true" : undefined}
        style={{ ["--efm-fade" as string]: fadeColor } as CSSProperties}
      >
        {fade && !reduce && (
          <>
            <span className="efm__fade efm__fade--l" aria-hidden />
            <span className="efm__fade efm__fade--r" aria-hidden />
          </>
        )}
        <div
          className={`efm__track ${trackClassName}`.trim()}
          style={
            {
              gap,
              ["--efm-dur" as string]: `${duration}s`,
              ...(reduce ? { animation: "none" } : null),
            } as CSSProperties
          }
        >
          {children}
          {!reduce && children}
        </div>
      </div>
    </>
  );
}
