"use client";

import {
  useEffect,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";

type MagnetProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Pull radius measured outward from the element box, in px. */
  padding?: number;
  disabled?: boolean;
  /** Divisor on the pointer offset: lower numbers pull harder. */
  magnetStrength?: number;
  /** Ceiling on the offset in px, so the element stays near its layout box. */
  maxOffset?: number;
  wrapperClassName?: string;
  innerClassName?: string;
};

// A spring just shy of critically damped: it catches the pointer quickly and
// settles without a visible wobble.
const STIFFNESS = 170;
const DAMPING = 26;
// Integration step, small enough that a long frame cannot make the spring blow up.
const MAX_STEP = 1 / 120;

export function Magnet({
  children,
  padding = 140,
  disabled = false,
  magnetStrength = 1.8,
  maxOffset = 44,
  wrapperClassName = "",
  innerClassName = "",
  ...props
}: MagnetProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const inner = innerRef.current;
    if (!root || !inner || disabled) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const strength = Math.max(1, magnetStrength);
    const cap = Math.max(0, maxOffset);
    const reach = Math.max(0, padding);

    let pointerX = 0;
    let pointerY = 0;
    let tracking = false;
    let painted = false;
    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let vx = 0;
    let vy = 0;
    let frame = 0;
    let last = 0;

    const rest = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      tracking = false;
      targetX = 0;
      targetY = 0;
      x = 0;
      y = 0;
      vx = 0;
      vy = 0;
      if (painted) {
        inner.style.transform = "";
        inner.style.willChange = "";
        painted = false;
      }
    };

    const aim = () => {
      // One layout read per frame, never one per event, and it happens before
      // the write at the end of the tick.
      const rect = root.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        targetX = 0;
        targetY = 0;
        return;
      }
      const halfWidth = rect.width / 2;
      const halfHeight = rect.height / 2;
      // The wrapper is never transformed, so the centre it reports is the
      // layout centre and the pull cannot chase its own output.
      const dx = pointerX - (rect.left + halfWidth);
      const dy = pointerY - (rect.top + halfHeight);
      const reachX = halfWidth + reach;
      const reachY = halfHeight + reach;
      const spread =
        (dx * dx) / (reachX * reachX) + (dy * dy) / (reachY * reachY);
      if (spread >= 1) {
        targetX = 0;
        targetY = 0;
        return;
      }
      // Fading the pull to nothing at the rim of the field means a cursor
      // crossing the edge is eased in, not snapped.
      const pull = (1 - spread) / strength;
      let nextX = dx * pull;
      let nextY = dy * pull;
      const length = Math.hypot(nextX, nextY);
      if (length > cap) {
        nextX = (nextX / length) * cap;
        nextY = (nextY / length) * cap;
      }
      targetX = nextX;
      targetY = nextY;
    };

    const tick = (now: number) => {
      frame = window.requestAnimationFrame(tick);
      const elapsed = last ? Math.min((now - last) / 1000, 0.05) : MAX_STEP;
      last = now;
      if (tracking) aim();

      let remaining = elapsed;
      while (remaining > 0) {
        const step = Math.min(remaining, MAX_STEP);
        remaining -= step;
        vx += (-STIFFNESS * (x - targetX) - DAMPING * vx) * step;
        vy += (-STIFFNESS * (y - targetY) - DAMPING * vy) * step;
        x += vx * step;
        y += vy * step;
      }

      // Back home and still: drop the loop and the inline styles so an idle
      // Magnet costs nothing.
      if (
        targetX === 0 &&
        targetY === 0 &&
        Math.hypot(x, y) < 0.05 &&
        Math.hypot(vx, vy) < 2
      ) {
        rest();
        return;
      }
      if (!painted) {
        inner.style.willChange = "transform";
        painted = true;
      }
      inner.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    };

    const start = () => {
      if (frame) return;
      last = 0;
      frame = window.requestAnimationFrame(tick);
    };

    const move = (event: PointerEvent) => {
      // Only a hovering mouse drives the pull. A finger has no hover to leave
      // with, so it would park the element off centre with nothing to
      // bring it back.
      if (event.pointerType !== "mouse" || reduce.matches) return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      tracking = true;
      start();
    };

    const release = () => {
      tracking = false;
      targetX = 0;
      targetY = 0;
      if (frame || x !== 0 || y !== 0) start();
    };

    const drop = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") rest();
    };

    const visibility = () => {
      // A hidden tab throttles frames, so stop rather than resume mid flight.
      if (document.hidden) rest();
    };

    const preference = () => {
      if (reduce.matches) rest();
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", drop, { passive: true });
    window.addEventListener("blur", release);
    document.documentElement.addEventListener("pointerleave", release);
    document.addEventListener("visibilitychange", visibility);
    reduce.addEventListener("change", preference);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", drop);
      window.removeEventListener("blur", release);
      document.documentElement.removeEventListener("pointerleave", release);
      document.removeEventListener("visibilitychange", visibility);
      reduce.removeEventListener("change", preference);
      rest();
    };
  }, [disabled, magnetStrength, maxOffset, padding]);

  return (
    <div ref={rootRef} className={wrapperClassName} {...props}>
      <div ref={innerRef} className={innerClassName}>
        {children}
      </div>
    </div>
  );
}
