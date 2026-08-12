"use client";

import {
  useEffect,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";

type MagnetProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  padding?: number;
  disabled?: boolean;
  magnetStrength?: number;
  wrapperClassName?: string;
  innerClassName?: string;
};

export function Magnet({
  children,
  padding = 72,
  disabled = false,
  magnetStrength = 5,
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
    if (
      window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)")
        .matches
    ) {
      return;
    }

    let frame = 0;
    const settle = () => {
      inner.style.transition = "transform 420ms cubic-bezier(.23,1,.32,1)";
      inner.style.transform = "translate3d(0, 0, 0)";
    };
    const move = (event: PointerEvent) => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const rect = root.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distanceX = Math.abs(event.clientX - centerX);
        const distanceY = Math.abs(event.clientY - centerY);
        const active =
          distanceX < rect.width / 2 + padding &&
          distanceY < rect.height / 2 + padding;

        inner.style.transition = active
          ? "transform 140ms cubic-bezier(.23,1,.32,1)"
          : "transform 420ms cubic-bezier(.23,1,.32,1)";
        inner.style.transform = active
          ? `translate3d(${(event.clientX - centerX) / magnetStrength}px, ${(event.clientY - centerY) / magnetStrength}px, 0)`
          : "translate3d(0, 0, 0)";
      });
    };

    window.addEventListener("pointermove", move, { passive: true });
    root.addEventListener("pointerleave", settle);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", settle);
    };
  }, [disabled, magnetStrength, padding]);

  return (
    <div ref={rootRef} className={wrapperClassName} {...props}>
      <div ref={innerRef} className={innerClassName}>
        {children}
      </div>
    </div>
  );
}
