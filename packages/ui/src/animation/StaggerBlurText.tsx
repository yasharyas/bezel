"use client";

import { useEffect, useRef, type HTMLAttributes } from "react";

type StaggerBlurTextProps = HTMLAttributes<HTMLParagraphElement> & {
  text: string;
  /** ms before the cascade begins */
  startDelay?: number;
};

export function StaggerBlurText({
  text,
  className = "",
  startDelay = 280,
  ...rest
}: StaggerBlurTextProps) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      el.classList.add("sbt--on");
      return;
    }
    const t = window.setTimeout(() => el.classList.add("sbt--on"), startDelay);
    return () => window.clearTimeout(t);
  }, [startDelay]);

  const words = text.trim().split(/\s+/);

  return (
    <>
      <style>{`
        .sbt span {
          display: inline;
          opacity: 0;
          filter: blur(6px);
          transition: opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1), filter 0.55s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .sbt--on span { opacity: 1; filter: none; }
        .sbt--on span:nth-child(1) { transition-delay: 0.04s; }
        .sbt--on span:nth-child(2) { transition-delay: 0.1s; }
        .sbt--on span:nth-child(3) { transition-delay: 0.16s; }
        .sbt--on span:nth-child(4) { transition-delay: 0.22s; }
        .sbt--on span:nth-child(5) { transition-delay: 0.28s; }
        .sbt--on span:nth-child(6) { transition-delay: 0.34s; }
        .sbt--on span:nth-child(7) { transition-delay: 0.4s; }
        .sbt--on span:nth-child(8) { transition-delay: 0.46s; }
        .sbt--on span:nth-child(9) { transition-delay: 0.52s; }
        .sbt--on span:nth-child(10) { transition-delay: 0.58s; }
        .sbt--on span:nth-child(11) { transition-delay: 0.64s; }
        .sbt--on span:nth-child(12) { transition-delay: 0.7s; }
        .sbt--on span:nth-child(13) { transition-delay: 0.76s; }
        .sbt--on span:nth-child(14) { transition-delay: 0.82s; }
        .sbt--on span:nth-child(15) { transition-delay: 0.88s; }
        .sbt--on span:nth-child(16) { transition-delay: 0.94s; }
        .sbt--on span:nth-child(n + 17) { transition-delay: 1s; }
        @media (prefers-reduced-motion: reduce) {
          .sbt span {
            opacity: 1;
            filter: none;
            transition: none;
          }
        }
      `}</style>
      <p ref={ref} className={`sbt ${className}`.trim()} {...rest}>
        {words.map((word, i) => (
          <span key={`${word}-${i}`}>
            {word}
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </p>
    </>
  );
}
