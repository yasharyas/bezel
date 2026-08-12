"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { motion, useAnimation, useReducedMotion } from "motion/react";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type CircularTextHover = "slowDown" | "speedUp" | "pause" | "goBonkers";

export type CircularTextProps = {
  text: string;
  spinDuration?: number;
  onHover?: CircularTextHover;
  className?: string;
  size?: "sm" | "md" | "lg";
  children?: ReactNode; // optional center content (logo, icon)
};

const FALLBACK_RADIUS: Record<NonNullable<CircularTextProps["size"]>, number> = {
  sm: 36,
  md: 50,
  lg: 132,
};

const getRotationTransition = (duration: number, from: number, loop = true) => ({
  from,
  to: from + 360,
  ease: "linear" as const,
  duration,
  type: "tween" as const,
  repeat: loop ? Infinity : 0,
});

const getTransition = (duration: number, from: number) => ({
  rotate: getRotationTransition(duration, from),
  scale: { type: "spring" as const, damping: 20, stiffness: 300 },
});

/** Letters orbit a ring; hover can speed up, slow, pause, or go wild. */
export function CircularText({
  text,
  spinDuration = 20,
  onHover = "speedUp",
  className = "",
  size = "md",
  children,
}: CircularTextProps) {
  const letters = Array.from(text);
  const controls = useAnimation();
  const hostRef = useRef<HTMLDivElement>(null);
  const [letterRadius, setLetterRadius] = useState(FALLBACK_RADIUS[size]);
  const prefersReducedMotion = useReducedMotion();
  const activeDuration = prefersReducedMotion ? spinDuration * 4 : spinDuration;

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const measure = () => {
      const min = Math.min(host.clientWidth, host.clientHeight);
      if (min <= 0) return;
      const inset = size === "sm" ? 0.4 : 0.44;
      setLetterRadius(min * inset);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    return () => ro.disconnect();
  }, [size]);

  useEffect(() => {
    void controls.start({
      rotate: 360,
      scale: 1,
      transition: getTransition(activeDuration, 0),
    });
  }, [activeDuration, text, onHover, controls]);

  const handleHoverStart = () => {
    if (prefersReducedMotion || !onHover) return;
    let transitionConfig;
    let scaleVal = 1;
    switch (onHover) {
      case "slowDown":
        transitionConfig = getTransition(activeDuration * 2, 0);
        break;
      case "speedUp":
        transitionConfig = getTransition(activeDuration / 4, 0);
        break;
      case "pause":
        transitionConfig = {
          rotate: { type: "spring" as const, damping: 20, stiffness: 300 },
          scale: { type: "spring" as const, damping: 20, stiffness: 300 },
        };
        break;
      case "goBonkers":
        transitionConfig = getTransition(activeDuration / 20, 0);
        scaleVal = 0.8;
        break;
      default:
        transitionConfig = getTransition(activeDuration, 0);
    }
    void controls.start({ rotate: 360, scale: scaleVal, transition: transitionConfig });
  };

  const handleHoverEnd = () => {
    if (prefersReducedMotion) return;
    void controls.start({
      rotate: 360,
      scale: 1,
      transition: getTransition(activeDuration, 0),
    });
  };

  return (
    <>
      <style>{`
        .circ-text-host {
          position: relative;
          display: grid;
          place-items: center;
          aspect-ratio: 1 / 1;
          width: 7.5rem;
          pointer-events: none;
        }
        .circ-text-host--sm { width: 5.5rem; }
        .circ-text-host--md { width: 7.5rem; }
        .circ-text-host--lg { width: 22rem; }
        @media (min-width: 640px) {
          .circ-text-host--lg { width: 26rem; }
        }
        .circ-text-anchor {
          position: absolute;
          inset: 0;
          transform: translate(0, 0);
        }
        .circ-text-ring {
          position: relative;
          width: 100%;
          height: 100%;
          transform-origin: center center;
          pointer-events: auto;
        }
        .circ-text-ring span {
          position: absolute;
          left: 50%;
          top: 50%;
          display: inline-block;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: hsl(38 45% 42% / 0.85);
          transform-origin: center center;
          white-space: pre;
          font-size: 0.5625rem;
        }
        .circ-text-host--sm .circ-text-ring span { font-size: 0.4375rem; }
        .circ-text-host--lg .circ-text-ring span {
          font-size: 0.72rem;
          letter-spacing: 0.14em;
        }
        .circ-text-center {
          position: relative;
          z-index: 2;
          width: 70%;
          height: 70%;
          display: grid;
          place-items: center;
        }
        @media (prefers-reduced-motion: reduce) {
          .circ-text-ring { transform: none !important; }
        }
      `}</style>
      <div
        ref={hostRef}
        className={cn("circ-text-host", `circ-text-host--${size}`, className)}
        aria-hidden
      >
        {children ? <div className="circ-text-center">{children}</div> : null}
        <div className="circ-text-anchor">
          <motion.div
            className="circ-text-ring"
            initial={{ rotate: 0 }}
            animate={controls}
            onMouseEnter={handleHoverStart}
            onMouseLeave={handleHoverEnd}
          >
            {letters.map((letter, i) => {
              const rotationDeg = (360 / letters.length) * i;
              const transform = `translate(-50%, -50%) rotate(${rotationDeg}deg) translateY(-${letterRadius}px) rotate(${-rotationDeg}deg)`;
              return (
                <span key={`${letter}-${i}`} style={{ transform, WebkitTransform: transform }}>
                  {letter}
                </span>
              );
            })}
          </motion.div>
        </div>
      </div>
    </>
  );
}
