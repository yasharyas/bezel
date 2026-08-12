"use client";

import { useRef } from "react";
import { gsap } from "gsap";

type WaxSealButtonProps = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  className?: string;
  foil?: string;
  ink?: string;
};

/**
 * Press-in CTA with a radiating SVG ring on hover (wax-seal personality).
 * Ghost variant is a hairline link with an animated underline.
 */
export function WaxSealButton({
  label,
  href,
  onClick,
  variant = "primary",
  className,
  foil = "#c9a227",
  ink = "#1a1208",
}: WaxSealButtonProps) {
  const ref = useRef<HTMLElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);

  const onEnter = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.to(ref.current, { scale: 0.96, duration: 0.3, ease: "power2.out" });
    if (ringRef.current && variant === "primary") {
      gsap.fromTo(
        ringRef.current,
        { attr: { r: 18 }, opacity: 0.6 },
        { attr: { r: 58 }, opacity: 0, duration: 0.8, ease: "power2.out" },
      );
    }
  };
  const onLeave = () => {
    gsap.to(ref.current, { scale: 1, duration: 0.4, ease: "power2.out" });
  };

  const shared = {
    ref: ref as React.RefObject<HTMLAnchorElement & HTMLButtonElement>,
    onMouseEnter: onEnter,
    onMouseLeave: onLeave,
    "data-cursor-hover": true,
  };

  if (variant === "ghost") {
    const ghostClass = `group relative inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] ${className ?? ""}`;
    const ghostStyle = { color: "#f5f0e8" };
    const underline = (
      <span
        aria-hidden
        className="absolute -bottom-1 left-0 h-px w-full origin-center scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"
        style={{ background: foil }}
      />
    );
    if (href) {
      return (
        <a {...shared} href={href} className={ghostClass} style={ghostStyle}>
          {label}
          {underline}
        </a>
      );
    }
    return (
      <button type="button" {...shared} onClick={onClick} className={ghostClass} style={ghostStyle}>
        {label}
        {underline}
      </button>
    );
  }

  const primaryClass = `relative inline-flex items-center justify-center rounded-[2px] px-8 py-4 text-sm uppercase tracking-[0.18em] ${className ?? ""}`;
  const primaryStyle = {
    background: foil,
    color: ink,
    boxShadow: `0 4px 24px color-mix(in oklab, ${foil} 22%, transparent)`,
  };
  const body = (
    <>
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 120 120"
        preserveAspectRatio="none"
        aria-hidden
      >
        <circle ref={ringRef} cx="60" cy="60" r="18" fill="none" stroke={foil} strokeWidth="1" opacity="0" />
      </svg>
      <span style={{ textShadow: "0 1px 0 rgba(255,255,255,0.3)" }}>{label}</span>
    </>
  );

  if (href) {
    return (
      <a {...shared} href={href} className={primaryClass} style={primaryStyle}>
        {body}
      </a>
    );
  }
  return (
    <button type="button" {...shared} onClick={onClick} className={primaryClass} style={primaryStyle}>
      {body}
    </button>
  );
}
