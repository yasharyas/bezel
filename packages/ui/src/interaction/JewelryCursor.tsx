"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

type JewelryCursorProps = {
  /** CSS selector for the scope that hides the native cursor once ready */
  scopeSelector?: string;
  /** Dot + ring color */
  color?: string;
  /** Extra selectors (beyond a/button/[data-cursor-hover]) that expand the ring */
  hoverSelector?: string;
};

/**
 * Instant gold-dot cursor + lagged ring that expands over interactive targets.
 * Mounts only on fine-pointer devices with motion enabled.
 */
export function JewelryCursor({
  scopeSelector = "body",
  color = "#c9a227",
  hoverSelector = "a, button, [data-cursor-hover]",
}: JewelryCursorProps) {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const scope = document.querySelector(scopeSelector);
    if (!dot || !ring || !scope) return;

    scope.classList.add("jewelry-cursor-ready");
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, opacity: 1 });

    const xRing = gsap.quickTo(ring, "x", { duration: 0.12, ease: "power2.out" });
    const yRing = gsap.quickTo(ring, "y", { duration: 0.12, ease: "power2.out" });
    const xDot = gsap.quickSetter(dot, "x", "px");
    const yDot = gsap.quickSetter(dot, "y", "px");

    const move = (e: MouseEvent) => {
      xDot(e.clientX);
      yDot(e.clientY);
      xRing(e.clientX);
      yRing(e.clientY);
    };
    const enter = () =>
      gsap.to(ring, { scale: 1.9, opacity: 1, duration: 0.3, ease: "power2.out" });
    const leave = () =>
      gsap.to(ring, { scale: 1, opacity: 0.6, duration: 0.3, ease: "power2.out" });

    window.addEventListener("mousemove", move);
    const targets = Array.from(scope.querySelectorAll(hoverSelector));
    targets.forEach((t) => {
      t.addEventListener("mouseenter", enter);
      t.addEventListener("mouseleave", leave);
    });

    return () => {
      scope.classList.remove("jewelry-cursor-ready");
      window.removeEventListener("mousemove", move);
      targets.forEach((t) => {
        t.removeEventListener("mouseenter", enter);
        t.removeEventListener("mouseleave", leave);
      });
    };
  }, [scopeSelector, hoverSelector]);

  return (
    <>
      <style>{`
        .jewelry-cursor-ready, .jewelry-cursor-ready * { cursor: none !important; }
        @media (prefers-reduced-motion: reduce) {
          .jewelry-cursor-ready, .jewelry-cursor-ready * { cursor: auto !important; }
        }
      `}</style>
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[10000] h-[3px] w-[3px] rounded-full opacity-0"
        style={{ background: color }}
      />
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[10000] h-6 w-6 rounded-full opacity-0"
        style={{ border: `1.5px solid ${color}` }}
      />
    </>
  );
}
