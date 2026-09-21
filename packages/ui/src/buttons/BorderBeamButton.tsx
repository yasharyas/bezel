"use client";

import { useEffect, useState } from "react";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  CSSProperties,
  ReactNode,
} from "react";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * The surface under the label: its colour, radius and label case. This is the
 * variant axis, so a new surface is one entry in the union and one CSS block.
 */
export type BorderBeamFill = "ink" | "ghost" | "jade" | "cream" | "crimson" | "gold";

/**
 * How the border is drawn. All three treatments share one ring layer, so a new
 * treatment only has to fill that layer differently: a beam travelling an
 * offset path, a spinning conic ring, or glints sweeping the long edges.
 */
export type BorderBeamRing = "beam" | "conic" | "star";

/** Each fill keeps the ring it shipped with. Pass `ring` to mix them. */
const FILL_RING: Record<BorderBeamFill, BorderBeamRing> = {
  ink: "beam",
  ghost: "beam",
  jade: "conic",
  cream: "star",
  crimson: "star",
  gold: "star",
};

type Shared = {
  children?: ReactNode;
  /** Label text. `children` wins when both are given. */
  label?: string;
  fill?: BorderBeamFill;
  /** The earlier name for the two flat fills: primary is `ink`. */
  variant?: "primary" | "ghost";
  ring?: BorderBeamRing;
  /** Three ring stops. The beam takes the first two, the glints the first. */
  colors?: [string, string, string];
  /** Seconds for one pass of the ring. */
  spinDuration?: number;
  /** Pixels of bare surface the star glints sweep through, top and bottom. */
  thickness?: number;
  /** Grain over the surface. On under the jade fill, off under the others. */
  textured?: boolean;
  className?: string;
  style?: CSSProperties;
};

type AsButton = Shared &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "style" | "children"> & {
    href?: undefined;
  };

type AsLink = Shared &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "style" | "children" | "href"> & {
    href: string;
  };

export type BorderBeamButtonProps = AsButton | AsLink;

const GRAIN =
  "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E";

export function BorderBeamButton(props: BorderBeamButtonProps) {
  const {
    children,
    label,
    fill,
    variant,
    ring,
    colors,
    spinDuration,
    thickness,
    textured,
    className,
    style,
    href,
    ...rest
  } = props;

  const resolvedFill: BorderBeamFill = fill ?? (variant === "ghost" ? "ghost" : "ink");
  const resolvedRing: BorderBeamRing = ring ?? FILL_RING[resolvedFill];
  const grain = textured ?? resolvedFill === "jade";
  const [c0, c1, c2] = colors ?? [];

  // A backgrounded tab paints nothing, but the ring keeps its place in the
  // timeline, so it would jump on return. Park it instead.
  const [running, setRunning] = useState(true);
  useEffect(() => {
    const sync = () => setRunning(document.visibilityState !== "hidden");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  const mergedStyle = {
    ...style,
    ...(colors
      ? {
          ["--border-btn-0" as string]: c0,
          ["--border-btn-1" as string]: c1,
          ["--border-btn-2" as string]: c2,
          ["--border-btn-beam-a" as string]: c0,
          ["--border-btn-beam-b" as string]: c1,
          ["--border-btn-glint" as string]: c0,
        }
      : null),
    ...(spinDuration ? { ["--border-btn-dur" as string]: `${spinDuration}s` } : null),
    ...(thickness ? { ["--border-btn-star-thickness" as string]: `${thickness}px` } : null),
  } as CSSProperties;

  const classes = cn(
    "border-btn",
    `border-btn--${resolvedFill}`,
    `border-btn--ring-${resolvedRing}`,
    grain && "border-btn--textured",
    className,
  );

  const body = (
    <>
      <span
        className={cn("border-btn__ring", `border-btn__ring--${resolvedRing}`)}
        aria-hidden="true"
      >
        {resolvedRing === "beam" ? <span className="border-btn__beam" /> : null}
        {resolvedRing === "star" ? (
          <>
            <span className="border-btn__glint border-btn__glint--top" />
            <span className="border-btn__glint border-btn__glint--bottom" />
          </>
        ) : null}
      </span>
      {/* The star ring shows through a surface that pulls back from the long
       * edges, so only that ring needs one. */}
      {resolvedRing === "star" ? <span className="border-btn__surface" aria-hidden="true" /> : null}
      <span className="border-btn__label">{children ?? label}</span>
    </>
  );

  return (
    <>
      <style>{`
        @property --border-btn-ang {
          syntax: "<angle>";
          inherits: false;
          initial-value: 0deg;
        }
        .border-btn {
          --border-btn-radius: var(--bz-radius-md, 10px);
          --border-btn-ring-width: 1px;
          --border-btn-0: #b8701c;
          --border-btn-1: #4b3a8f;
          --border-btn-2: #4f7d10;
          --border-btn-glint: hsl(38 45% 52%);
          /* One curve and one state-flip duration for every treatment, taken
           * from the tokens: the library collapsed its five near-identical
           * editorial ease-outs to this one. */
          --border-btn-ease: var(--bz-ease-out, cubic-bezier(0.23, 1, 0.32, 1));
          --border-btn-flip: var(--bz-duration-fast, 150ms);
          position: relative;
          isolation: isolate;
          overflow: hidden;
          box-sizing: border-box;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          min-height: 2.75rem;
          padding: 0 1.25rem;
          border: 0;
          border-radius: var(--border-btn-radius);
          /* The fill is a variable so the star ring can hand it to its inset
           * surface instead, and one hover rule serves both. */
          background: var(--border-btn-fill, transparent);
          font: inherit;
          font-size: 0.875rem;
          font-weight: 500;
          letter-spacing: 0.01em;
          text-decoration: none;
          cursor: pointer;
          transition: transform var(--border-btn-flip) var(--border-btn-ease),
            background-color var(--border-btn-flip) var(--border-btn-ease);
        }
        .border-btn--ink {
          --border-btn-fill: var(--bz-ink, #0a0a0a);
          color: var(--bz-paper-sunken, #fafafa);
        }
        .border-btn--ghost {
          --border-btn-fill: transparent;
          color: var(--bz-ink, #0a0a0a);
        }
        .border-btn--jade {
          --border-btn-radius: var(--bz-radius-full, 999px);
          --border-btn-ring-width: 2px;
          --border-btn-fill: linear-gradient(135deg, #00706a, #004b46);
          color: #f5fff9;
          font-size: 0.78125rem;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }
        .border-btn--cream,
        .border-btn--crimson,
        .border-btn--gold { letter-spacing: 0.02em; }
        .border-btn--cream {
          --border-btn-fill: var(--bz-paper-raised, #f7f3ee);
          --border-btn-edge: hsl(40 12% 82%);
          color: hsl(20 8% 18%);
        }
        .border-btn--crimson {
          --border-btn-fill: hsl(5 62% 35%);
          --border-btn-edge: hsl(5 62% 35% / 0.3);
          --border-btn-glint: hsl(5 62% 35%);
          color: var(--bz-paper-raised, #f7f3ee);
        }
        .border-btn--gold {
          --border-btn-fill: hsl(38 45% 52%);
          --border-btn-edge: hsl(38 45% 52% / 0.35);
          color: #1c1917;
        }
        .border-btn__ring {
          position: absolute;
          inset: 0;
          z-index: 1;
          border-radius: inherit;
          pointer-events: none;
        }
        .border-btn__ring--beam,
        .border-btn__ring--conic {
          padding: var(--border-btn-ring-width);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
                  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
                  mask-composite: exclude;
        }
        .border-btn__ring--beam { background: rgba(255, 255, 255, 0.09); }
        /* Ghost has no surface and cream barely separates from paper, so for
         * both the ring carries the control boundary and has to be seen:
         * 3.4:1 on paper. */
        .border-btn--ghost .border-btn__ring--beam,
        .border-btn--cream .border-btn__ring--beam {
          background: var(--bz-line-control, #8a8a8e);
        }
        .border-btn__ring--conic {
          opacity: 0.9;
          background: conic-gradient(
            from var(--border-btn-ang, 0deg),
            var(--border-btn-0),
            var(--border-btn-1),
            var(--border-btn-2),
            var(--border-btn-0)
          );
          animation: border-btn-spin var(--border-btn-dur, 3.2s) linear infinite;
        }
        .border-btn__beam {
          position: absolute;
          width: 80px;
          aspect-ratio: 1;
          background: linear-gradient(
            to left,
            var(--border-btn-beam-a, #ffaa40),
            var(--border-btn-beam-b, #9c40ff),
            transparent
          );
          offset-path: rect(0 100% 100% 0 round var(--border-btn-radius));
          offset-distance: 0%;
          animation: border-btn-travel var(--border-btn-dur, 4s) linear infinite;
        }
        /* The star ring reads as light escaping past the surface, so the ring
         * and the surface both sit behind, glints first. */
        .border-btn--ring-star {
          --border-btn-radius: 0.625rem;
          background: transparent;
          min-height: calc(2.75rem + 2 * var(--border-btn-star-thickness, 2px));
          padding: 0 calc(1.25rem + 1px);
          transition: transform var(--border-btn-flip) var(--border-btn-ease);
        }
        .border-btn__ring--star { z-index: -1; }
        .border-btn__surface {
          position: absolute;
          inset: var(--border-btn-star-thickness, 2px) 0;
          z-index: -1;
          box-sizing: border-box;
          border: 1px solid var(--border-btn-edge, transparent);
          /* Inset from the button box by the ring thickness, so the surface
           * keeps the box's radius off the scale rather than picking its own. */
          border-radius: calc(var(--border-btn-radius) - var(--border-btn-star-thickness, 2px));
          background: var(--border-btn-fill, transparent);
          box-shadow: 0 4px 14px -10px hsl(5 62% 22% / 0.2);
          pointer-events: none;
          transition: background-color var(--border-btn-flip) var(--border-btn-ease),
            border-color var(--border-btn-flip) var(--border-btn-ease),
            box-shadow var(--border-btn-flip) var(--border-btn-ease);
        }
        .border-btn__glint {
          position: absolute;
          width: 300%;
          height: 50%;
          opacity: 0.65;
          border-radius: 50%;
          pointer-events: none;
          background: radial-gradient(circle, var(--border-btn-glint), transparent 10%);
        }
        .border-btn__glint--top {
          top: -12px;
          left: -250%;
          animation: border-btn-glint-top var(--border-btn-dur, 5s) linear infinite alternate;
        }
        .border-btn__glint--bottom {
          bottom: -12px;
          right: -250%;
          animation: border-btn-glint-bottom var(--border-btn-dur, 5s) linear infinite alternate;
        }
        .border-btn--textured::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 0;
          border-radius: inherit;
          pointer-events: none;
          opacity: 0.22;
          mix-blend-mode: soft-light;
          background-image: url("${GRAIN}");
        }
        .border-btn--ring-star.border-btn--textured::before {
          inset: var(--border-btn-star-thickness, 2px) 0;
          border-radius: 0.5rem;
        }
        .border-btn__label {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
        }
        .border-btn__label svg {
          transition: transform var(--border-btn-flip) var(--border-btn-ease);
        }
        /* The button clips its own ring, so the focus indicator is drawn as two
         * shadows rather than an outline. The gap and the ring still come off
         * the focus tokens, so it is the system's 2px at 2px offset. */
        .border-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 var(--bz-focus-offset, 2px) var(--bz-paper, #ffffff),
            0 0 0 calc(var(--bz-focus-offset, 2px) + var(--bz-focus-width, 2px))
              var(--bz-focus-ring, #912c22);
        }
        .border-btn:disabled { cursor: not-allowed; opacity: 0.5; }
        .border-btn:disabled .border-btn__beam,
        .border-btn:disabled .border-btn__ring--conic { animation-play-state: paused; }
        .border-btn:disabled .border-btn__glint {
          animation-play-state: paused;
          opacity: 0.25;
        }
        .border-btn[data-running="false"] .border-btn__beam,
        .border-btn[data-running="false"] .border-btn__ring--conic,
        .border-btn[data-running="false"] .border-btn__glint {
          animation-play-state: paused;
        }
        .border-btn:active:not(:disabled) { transform: scale(0.97); }
        @media (hover: hover) and (pointer: fine) {
          .border-btn:hover:not(:disabled) { transform: translateY(-2px); }
          .border-btn--ring-star:hover:not(:disabled) { transform: translateY(-3px); }
          .border-btn--ink:hover:not(:disabled) {
            --border-btn-fill: var(--bz-void-raised, #1a1a1a);
          }
          .border-btn--ghost:hover:not(:disabled) {
            --border-btn-fill: var(--bz-paper-sunken, #fafafa);
          }
          .border-btn--cream:hover:not(:disabled) {
            --border-btn-fill: #efe9e1;
            --border-btn-edge: hsl(38 45% 52% / 0.4);
          }
          .border-btn--crimson:hover:not(:disabled) .border-btn__surface,
          .border-btn--gold:hover:not(:disabled) .border-btn__surface {
            filter: brightness(1.03);
          }
          .border-btn--ring-star:hover:not(:disabled) .border-btn__surface {
            box-shadow: 0 14px 28px -12px hsl(5 62% 22% / 0.38);
          }
          .border-btn--ring-star:hover:not(:disabled) .border-btn__label svg:last-child {
            transform: translateX(3px);
          }
          .border-btn:active:not(:disabled) { transform: translateY(-1px) scale(0.97); }
        }
        @media (prefers-reduced-motion: reduce) {
          .border-btn,
          .border-btn__surface,
          .border-btn__label svg { transition: none; }
          .border-btn:hover:not(:disabled),
          .border-btn:active:not(:disabled) { transform: none; }
          .border-btn__beam,
          .border-btn__ring--conic { animation: none; }
          .border-btn__glint { animation: none; opacity: 0.35; }
        }
        @keyframes border-btn-travel { to { offset-distance: 100%; } }
        @keyframes border-btn-spin { to { --border-btn-ang: 360deg; } }
        @keyframes border-btn-glint-top {
          0% { transform: translate(0%, 0%); opacity: 1; }
          100% { transform: translate(100%, 0%); opacity: 0; }
        }
        @keyframes border-btn-glint-bottom {
          0% { transform: translate(0%, 0%); opacity: 1; }
          100% { transform: translate(-100%, 0%); opacity: 0; }
        }
      `}</style>
      {typeof href === "string" ? (
        <a
          className={classes}
          style={mergedStyle}
          data-running={running ? "true" : "false"}
          {...(rest as AsLink)}
          href={href}
        >
          {body}
        </a>
      ) : (
        <button
          type={(rest as AsButton).type ?? "button"}
          className={classes}
          style={mergedStyle}
          data-running={running ? "true" : "false"}
          {...(rest as AsButton)}
        >
          {body}
        </button>
      )}
    </>
  );
}
