"use client";

import {
  createElement,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type StarBorderTone = "outline" | "primary" | "gold";

export type StarBorderProps<T extends ElementType = "button"> = {
  as?: T;
  className?: string;
  innerClassName?: string;
  tone?: StarBorderTone;
  color?: string;
  speed?: string;
  thickness?: number;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className" | "color">;

const TONE_COLOR: Record<StarBorderTone, string> = {
  outline: "hsl(38 45% 52%)",
  primary: "hsl(5 62% 35%)",
  gold: "hsl(38 45% 52%)",
};

export function StarBorder<T extends ElementType = "button">({
  as,
  className = "",
  innerClassName,
  tone = "outline",
  color,
  speed = "5s",
  thickness = 2,
  children,
  style,
  ...rest
}: StarBorderProps<T>) {
  const Component = (as ?? "button") as ElementType;
  const glow = color ?? TONE_COLOR[tone];

  return (
    <>
      <style>{`
        .star-border-container {
          display: inline-block;
          position: relative;
          border-radius: 0.625rem;
          overflow: hidden;
          border: none;
          background: transparent;
          padding: 0;
          cursor: pointer;
          font: inherit;
          text-align: inherit;
          transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        .star-border-container:disabled { cursor: not-allowed; opacity: 0.5; }
        .star-border-container:focus-visible { outline: none; }
        .star-border-container:focus-visible .star-border-inner {
          outline: none;
          box-shadow: 0 0 0 2px #fff, 0 0 0 4px hsl(5 62% 35% / 0.55);
        }
        .star-border-container:disabled .border-gradient-bottom,
        .star-border-container:disabled .border-gradient-top {
          animation-play-state: paused;
          opacity: 0.25;
        }
        .star-border-container:active:not(:disabled) { transform: scale(0.97); }
        .border-gradient-bottom,
        .border-gradient-top {
          position: absolute;
          width: 300%;
          height: 50%;
          opacity: 0.65;
          border-radius: 50%;
          z-index: 0;
          pointer-events: none;
        }
        .border-gradient-bottom {
          bottom: -12px;
          right: -250%;
          animation: star-movement-bottom linear infinite alternate;
        }
        .border-gradient-top {
          top: -12px;
          left: -250%;
          animation: star-movement-top linear infinite alternate;
        }
        .star-border-inner {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border-radius: 0.5rem;
          border: 1px solid hsl(40 12% 82%);
          background: #f7f3ee;
          color: hsl(20 8% 18%);
          font-size: 0.875rem;
          font-weight: 500;
          letter-spacing: 0.02em;
          padding: 0.625rem 1.25rem;
          min-height: 2.75rem;
          box-shadow: 0 4px 14px -10px hsl(5 62% 22% / 0.2);
          transition: background-color 150ms ease, border-color 150ms ease,
            color 150ms ease, box-shadow 160ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        .star-border-inner svg {
          transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        .star-border-inner--outline:hover {
          border-color: hsl(38 45% 52% / 0.4);
          background: #efe9e1;
        }
        .star-border-inner--primary {
          border-color: hsl(5 62% 35% / 0.3);
          background: hsl(5 62% 35%);
          color: #f7f3ee;
        }
        .star-border-inner--primary:hover { filter: brightness(1.03); }
        .star-border-inner--gold {
          border-color: hsl(38 45% 52% / 0.35);
          background: hsl(38 45% 52%);
          color: #1c1917;
        }
        .star-border-inner--gold:hover { filter: brightness(1.03); }
        @media (hover: hover) and (pointer: fine) {
          .star-border-container:hover:not(:disabled) { transform: translateY(-3px); }
          .star-border-container:hover:not(:disabled) .star-border-inner {
            box-shadow: 0 14px 28px -12px hsl(5 62% 22% / 0.38);
          }
          .star-border-container:hover:not(:disabled) .star-border-inner svg:last-child {
            transform: translateX(3px);
          }
          .star-border-container:active:not(:disabled) {
            transform: translateY(-1px) scale(0.97);
          }
        }
        @keyframes star-movement-bottom {
          0% { transform: translate(0%, 0%); opacity: 1; }
          100% { transform: translate(-100%, 0%); opacity: 0; }
        }
        @keyframes star-movement-top {
          0% { transform: translate(0%, 0%); opacity: 1; }
          100% { transform: translate(100%, 0%); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .star-border-container,
          .star-border-inner,
          .star-border-inner svg { transition: none; }
          .star-border-container:hover:not(:disabled),
          .star-border-container:active:not(:disabled) { transform: none; }
          .border-gradient-bottom,
          .border-gradient-top { animation: none !important; opacity: 0.35; }
        }
      `}</style>
      {createElement(
        Component,
        {
          className: cn("star-border-container", className),
          style: {
            padding: `${thickness}px 0`,
            ...(style as CSSProperties | undefined),
          },
          ...rest,
        },
        <>
          <div
            className="border-gradient-bottom"
            style={{
              background: `radial-gradient(circle, ${glow}, transparent 10%)`,
              animationDuration: speed,
            }}
            aria-hidden
          />
          <div
            className="border-gradient-top"
            style={{
              background: `radial-gradient(circle, ${glow}, transparent 10%)`,
              animationDuration: speed,
            }}
            aria-hidden
          />
          <div
            className={cn(
              "star-border-inner",
              tone === "outline" && "star-border-inner--outline",
              tone === "primary" && "star-border-inner--primary",
              tone === "gold" && "star-border-inner--gold",
              innerClassName,
            )}
          >
            {children}
          </div>
        </>,
      )}
    </>
  );
}
