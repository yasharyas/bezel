"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type ScrollParallaxLayerProps = {
  /** Depth of travel; 1 ≈ 100px total drift across the viewport */
  speed?: number;
  /** Total degrees swept across the viewport */
  rotate?: number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

type FallingPetalFieldProps = {
  colors: string[];
  count?: number;
  className?: string;
};

/** Scroll-scrubbed depth / rotate parallax wrapper (GSAP ScrollTrigger). */
export function ScrollParallaxLayer({
  speed = 0.25,
  rotate = 0,
  className,
  style,
  children,
}: ScrollParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const depth = speed * 100;
      const tween = gsap.fromTo(
        el,
        { y: depth, rotation: -rotate / 2 },
        {
          y: -depth,
          rotation: rotate / 2,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
          },
        },
      );
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });

    return () => mm.revert();
  }, [speed, rotate]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}

function PetalShape({ variant, color }: { variant: number; color: string }) {
  const paths = [
    "M12 2 C17 6 19 12 16 18 C14 21 10 21 8 18 C5 12 7 6 12 2 Z",
    "M12 3 C18 5 20 12 15 19 Q12 22 9 19 C4 12 6 5 12 3 Z",
    "M12 1 C15 7 18 10 16 17 C14 22 9 22 8 16 C7 9 9 6 12 1 Z",
  ];
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
      <path d={paths[variant % paths.length]} fill={color} />
    </svg>
  );
}

const PETALS = [
  { left: 6, size: 13, delay: 0.0, dur: 11, drift: 46, spin: 300, o: 0.8 },
  { left: 14, size: 9, delay: 3.2, dur: 14, drift: -34, spin: -260, o: 0.55 },
  { left: 24, size: 12, delay: 6.4, dur: 12, drift: 42, spin: 340, o: 0.7 },
  { left: 34, size: 8, delay: 1.6, dur: 15, drift: -28, spin: 220, o: 0.5 },
  { left: 45, size: 14, delay: 4.8, dur: 10.5, drift: 36, spin: -300, o: 0.85 },
  { left: 55, size: 9, delay: 8.2, dur: 13.5, drift: -44, spin: 280, o: 0.55 },
  { left: 64, size: 12, delay: 2.4, dur: 11.5, drift: 30, spin: -240, o: 0.75 },
  { left: 74, size: 8, delay: 5.6, dur: 14.5, drift: -38, spin: 320, o: 0.5 },
  { left: 84, size: 13, delay: 0.8, dur: 12.5, drift: 40, spin: -280, o: 0.8 },
  { left: 92, size: 10, delay: 7.0, dur: 13, drift: -30, spin: 260, o: 0.6 },
];

/**
 * Deterministic CSS falling petal field (no Math.random → no hydration drift).
 * Ships with ScrollParallaxLayer as the ambient companion.
 */
export function FallingPetalField({
  colors,
  count = 10,
  className = "inset-x-0 top-0 h-[110vh]",
}: FallingPetalFieldProps) {
  return (
    <div className={`pointer-events-none absolute select-none overflow-hidden ${className}`} aria-hidden>
      <style>{`
        @keyframes petal-fall {
          0% { transform: translate3d(0, 0, 0) rotate(0deg); opacity: 0; }
          6% { opacity: var(--petal-o, 0.7); }
          85% { opacity: var(--petal-o, 0.7); }
          100% {
            transform: translate3d(var(--petal-drift, 40px), 112vh, 0)
              rotate(var(--petal-spin, 300deg));
            opacity: 0;
          }
        }
        .fall-petal {
          animation-name: petal-fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform, opacity;
        }
        @media (prefers-reduced-motion: reduce) {
          .fall-petal { animation: none !important; opacity: 0 !important; }
        }
      `}</style>
      {PETALS.slice(0, count).map((p, i) => (
        <span
          key={i}
          className="fall-petal absolute"
          style={
            {
              left: `${p.left}%`,
              top: -24,
              width: p.size,
              height: p.size,
              "--petal-drift": `${p.drift}px`,
              "--petal-spin": `${p.spin}deg`,
              "--petal-o": p.o,
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.delay}s`,
            } as React.CSSProperties
          }
        >
          <PetalShape variant={i} color={colors[i % colors.length]} />
        </span>
      ))}
    </div>
  );
}
