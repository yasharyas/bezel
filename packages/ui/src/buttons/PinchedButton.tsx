"use client";

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type PinchedTone = "solid" | "ghost" | "soft";

type Shared = {
  tone?: PinchedTone;
  arrow?: boolean;
  spread?: boolean;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  brick?: string;
  cream?: string;
};

type AsButton = Shared &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "style" | "children"> & {
    href?: undefined;
  };

type AsLink = Shared &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "style" | "children" | "href"> & {
    href: string;
  };

export type PinchedButtonProps = AsButton | AsLink;

const Arrow = () => (
  <svg className="pinched-btn__arrow" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M5 12h14M13 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Asymmetric brick CTA — radius 0 40px 0 40px, hover lift, arrow nudge.
 * Pair two with `.portal-cta-pair` + `.portal-admin` / `.portal-vendor` for :has() cross-fill.
 */
export function PinchedButton(props: PinchedButtonProps) {
  const {
    tone = "solid",
    arrow = true,
    spread = false,
    className,
    style,
    children,
    brick = "#912c22",
    cream = "#f7f3ee",
    ...rest
  } = props;

  const classes = cn(
    "pinched-btn",
    tone === "solid" && "pinched-btn--solid",
    tone === "ghost" && "pinched-btn--ghost",
    tone === "soft" && "pinched-btn--soft",
    (spread || arrow) && "pinched-btn--spread",
    className,
  );

  const mergedStyle = {
    ...style,
    ["--pb-brick" as string]: brick,
    ["--pb-cream" as string]: cream,
  } as CSSProperties;

  const label = (
    <span className="pinched-btn__label">
      <span className="pinched-btn__text">{children}</span>
      {arrow ? <Arrow /> : null}
    </span>
  );

  return (
    <>
      <style>{`
        .pinched-btn {
          --pb-brick: #912c22;
          --pb-cream: #f7f3ee;
          --pb-ease: cubic-bezier(0.23, 1, 0.32, 1);
          position: relative;
          display: inline-grid;
          place-items: center;
          box-sizing: border-box;
          min-width: 8.5rem;
          height: 3.125rem;
          padding: 0 1.35rem 0 1.5rem;
          border: 5px solid var(--pb-brick);
          border-radius: 0 40px 0 40px;
          background: var(--pb-brick);
          color: var(--pb-cream);
          cursor: pointer;
          font-size: 0.8125rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          isolation: isolate;
          text-decoration: none;
          box-shadow: 0 6px 18px -10px hsl(5 62% 22% / 0.45);
          transition: transform 160ms var(--pb-ease), background-color 160ms var(--pb-ease),
            color 160ms var(--pb-ease), border-color 160ms var(--pb-ease),
            box-shadow 160ms var(--pb-ease);
        }
        .pinched-btn.w-full { display: grid; width: 100%; min-width: 100%; }
        .pinched-btn--solid { background: var(--pb-brick); border-color: var(--pb-brick); color: var(--pb-cream); }
        .pinched-btn--ghost,
        .pinched-btn--soft {
          background: var(--pb-cream);
          border-color: var(--pb-brick);
          color: var(--pb-brick);
          box-shadow: 0 4px 14px -10px hsl(5 62% 22% / 0.28);
        }
        .pinched-btn__label {
          position: relative; z-index: 1;
          display: inline-flex; align-items: center; justify-content: center;
          gap: 0.65rem; width: 100%; white-space: nowrap; pointer-events: none; color: inherit;
        }
        .pinched-btn--spread .pinched-btn__label { justify-content: space-between; }
        .pinched-btn__arrow {
          width: 1.05rem; height: 1.05rem; flex-shrink: 0;
          transition: transform 160ms var(--pb-ease);
        }
        .pinched-btn:focus-visible { outline: 2px solid var(--pb-brick); outline-offset: 3px; }
        .pinched-btn:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
        .pinched-btn:active:not(:disabled) {
          transform: scale(0.97);
          box-shadow: 0 2px 8px -6px hsl(5 62% 22% / 0.35);
        }
        @media (hover: hover) and (pointer: fine) {
          .pinched-btn:hover:not(:disabled) {
            transform: translateY(-3px);
            box-shadow: 0 14px 28px -12px hsl(5 62% 22% / 0.5);
          }
          .pinched-btn:hover:not(:disabled) .pinched-btn__arrow { transform: translateX(3px); }
          .pinched-btn--solid:hover:not(:disabled) {
            background: color-mix(in srgb, var(--pb-brick) 88%, #000);
            border-color: color-mix(in srgb, var(--pb-brick) 88%, #000);
          }
          .pinched-btn--ghost:hover:not(:disabled),
          .pinched-btn--soft:hover:not(:disabled) {
            background: color-mix(in srgb, var(--pb-cream) 92%, #000);
          }
          .pinched-btn:active:not(:disabled) { transform: translateY(-1px) scale(0.97); }

          .portal-cta-pair .portal-admin.pinched-btn:hover:not(:disabled) {
            background: color-mix(in srgb, var(--pb-brick) 88%, #000);
            border-color: color-mix(in srgb, var(--pb-brick) 88%, #000);
            color: var(--pb-cream);
          }
          .portal-cta-pair:has(.portal-admin:hover) .portal-vendor.pinched-btn:not(:disabled) {
            background: var(--pb-cream);
            border-color: var(--pb-brick);
            color: var(--pb-brick);
            box-shadow: 0 4px 14px -10px hsl(5 62% 22% / 0.28);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .pinched-btn, .pinched-btn__arrow { transition: none; }
          .pinched-btn:hover:not(:disabled),
          .pinched-btn:active:not(:disabled) { transform: none; }
          .pinched-btn:hover:not(:disabled) .pinched-btn__arrow { transform: none; }
        }
      `}</style>
      {"href" in props && typeof props.href === "string" ? (
        <a
          className={classes}
          style={mergedStyle}
          {...(rest as AsLink)}
        >
          {label}
        </a>
      ) : (
        <button
          type={(rest as AsButton).type ?? "button"}
          className={classes}
          style={mergedStyle}
          {...(rest as AsButton)}
        >
          {label}
        </button>
      )}
    </>
  );
}
