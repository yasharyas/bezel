"use client";

import { useRef } from "react";

type FoilSpecularCardProps = {
  title?: string;
  subtitle?: string;
  lineA?: string;
  lineB?: string;
  date?: string;
  venue?: string;
  gold?: string;
  goldSoft?: string;
  paper?: string;
  ink?: string;
  accent?: string;
  className?: string;
};

function OrnateCorner({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} style={style} aria-hidden>
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none">
        <path d="M4 4 L4 30 M4 4 L30 4" />
        <path d="M4 30 C26 30 30 26 30 4" opacity="0.5" />
        <path
          d="M14 14 C14 34 34 40 44 30 C36 30 30 24 30 14 C24 22 18 20 14 14 Z"
          fill="currentColor"
          fillOpacity="0.1"
        />
        <circle cx="48" cy="48" r="2.4" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

function FiligreeDivider({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 24" fill="none" className={className} style={style} aria-hidden>
      <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none">
        <line x1="6" y1="12" x2="74" y2="12" />
        <line x1="126" y1="12" x2="194" y2="12" />
        <path d="M100 3 L108 12 L100 21 L92 12 Z" fill="currentColor" fillOpacity="0.12" />
        <path d="M100 6.5 L104.5 12 L100 17.5 L95.5 12 Z" />
      </g>
    </svg>
  );
}

/**
 * Ceremonial invitation card: pointer-tracked specular foil sheen
 * (radial soft-light overlay) + animated foil gradient text (background-clip).
 * No 3D tilt — sheen only.
 */
export function FoilSpecularCard({
  title = "Together with their families",
  subtitle = "weds",
  lineA = "Aarav",
  lineB = "Diya",
  date = "Saturday, the 6th of December",
  venue = "Sri Kalyana Mandapam, Chennai",
  gold = "#b88a1f",
  goldSoft = "#e8d5a3",
  paper = "#f4efe4",
  ink = "#3a2a1a",
  accent = "#8b1a1a",
  className,
}: FoilSpecularCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      data-cursor-hover
      className={`relative mx-auto w-full max-w-[360px] select-none overflow-hidden rounded-[2px] ${className ?? ""}`}
      style={
        {
          "--mx": "50%",
          "--my": "30%",
          "--rg-gold": gold,
          "--rg-gold-soft": goldSoft,
          background: paper,
          color: ink,
          boxShadow: `0 40px 80px -24px rgba(0,0,0,0.65), inset 0 0 0 1px color-mix(in oklab, ${gold} 50%, transparent)`,
        } as React.CSSProperties
      }
    >
      <style>{`
        .foil-name-shimmer {
          display: inline-block;
          padding: 0.22em 0.3em;
          margin: -0.22em -0.3em;
          --_foil: var(--rg-gold, #b7892f);
          --_foil-deep: color-mix(in oklab, var(--rg-gold, #b7892f) 60%, #2c1c06);
          background-image: linear-gradient(
            100deg,
            var(--_foil-deep) 0%,
            var(--_foil) 32%,
            var(--rg-gold-soft, #e8d5a3) 50%,
            var(--_foil) 68%,
            var(--_foil-deep) 100%
          );
          background-size: 220% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: foil-shimmer 6s ease-in-out infinite;
          filter: drop-shadow(0 1px 1.2px rgba(45, 28, 8, 0.28));
          font-family: "Great Vibes", "Brush Script MT", cursive;
          font-size: 3.75rem;
          line-height: 1.02;
        }
        @keyframes foil-shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .foil-name-shimmer { animation: none; background-position: 40% 50%; }
        }
      `}</style>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 mix-blend-soft-light"
        style={{
          background:
            "radial-gradient(220px circle at var(--mx) var(--my), rgba(255,247,214,0.85), rgba(201,162,39,0.15) 40%, transparent 70%)",
        }}
      />

      <div className="relative z-0 px-9 pb-11 pt-10 text-center">
        <OrnateCorner className="absolute left-2 top-2 h-9 w-9" style={{ color: gold }} />
        <OrnateCorner className="absolute right-2 top-2 h-9 w-9 -scale-x-100" style={{ color: gold }} />

        <p
          className="text-[0.6rem] uppercase tracking-[0.4em]"
          style={{ color: accent, fontFamily: "Cinzel, Georgia, serif" }}
        >
          {title}
        </p>

        <div className="mt-6 leading-[1.02]">
          <span className="foil-name-shimmer">{lineA}</span>
          <span
            className="my-0.5 block text-xs uppercase tracking-[0.3em]"
            style={{ color: accent, fontFamily: "Cinzel, Georgia, serif" }}
          >
            {subtitle}
          </span>
          <span className="foil-name-shimmer">{lineB}</span>
        </div>

        <FiligreeDivider className="mx-auto mt-5 h-5 w-44" style={{ color: gold }} />

        <p className="mt-4 font-serif text-lg">{date}</p>
        <p className="mt-1 text-xs" style={{ color: "rgba(58,42,26,0.7)" }}>
          {venue}
        </p>
      </div>
    </div>
  );
}
