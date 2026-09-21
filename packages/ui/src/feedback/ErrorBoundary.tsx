"use client";

import { Component, Fragment, type CSSProperties, type ErrorInfo, type ReactNode } from "react";

type FallbackArgs = { error: Error | null; reset: () => void };

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** The mark inside the broken seal. Defaults to a crack that draws itself. */
  icon?: ReactNode;
  /** The eyebrow above the headline. */
  eyebrow?: string;
  title?: string;
  description?: string;
  buttonLabel?: string;
  /** Stamped on the tag that hangs off the corner. */
  code?: string;
  /** The technical line under the message. Defaults to the caught error's own. */
  detail?: string;
  /** Replaces the whole fallback, and is handed the error and the reset. */
  fallback?: ReactNode | ((args: FallbackArgs) => ReactNode);
  /** Runs once the boundary has cleared the error and remounted its children. */
  onReset?: () => void;
  /** Runs on the catch. Without it the error is logged, never swallowed. */
  onError?: (error: Error, info: ErrorInfo) => void;
  /** Fill the viewport. Turn it off to wrap one region of a page. */
  fullScreen?: boolean;
  className?: string;
}

interface State {
  error: Error | null;
  /** Bumped on every reset so the subtree remounts clean instead of resuming. */
  attempt: number;
}

/*
 * The fallback is styled here rather than in a stylesheet so the file stays a
 * single copy-paste unit. Every colour reads a --bz-* token first, so the same
 * markup themes to paper or to dark without a variant prop.
 *
 * Resting styles are the composed, finished state. Motion is added only inside
 * the prefers-reduced-motion: no-preference block, and every animation is
 * one-shot: an error screen that pulses is exhausting to sit in front of.
 */
const STYLES = `
.bz-eb {
  --bz-eb-ease: var(--bz-ease-out, cubic-bezier(0.23, 1, 0.32, 1));
  --bz-eb-spring: var(--bz-ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1));
  /* How far the loose pieces sit outside the panel. Always smaller than the
     ground padding below, so nothing can reach an edge and start a scrollbar. */
  --bz-eb-out: clamp(12px, 4vw, 34px);
  position: relative;
  box-sizing: border-box;
  display: grid;
  place-items: center;
  overflow: hidden;
  padding: clamp(36px, 6.5vw, 72px) clamp(30px, 7vw, 72px);
  background: var(--bz-paper-sunken, #fafafa);
  color: var(--bz-ink, #0a0a0a);
  font-family: var(--bz-font-sans, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
}
.bz-eb--screen { min-height: 100vh; }
.bz-eb::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(118% 80% at 50% 34%, var(--bz-paper, #ffffff) 0%, transparent 62%);
}
.bz-eb *, .bz-eb *::before, .bz-eb *::after { box-sizing: border-box; }

.bz-eb__stage {
  position: relative;
  width: 100%;
  max-width: 420px;
}

/* Offset planes. They read as the pages stacked under the one that failed. */
.bz-eb__plane {
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: var(--bz-radius-2xl, 24px);
  border: 1px solid var(--bz-line, rgba(10, 10, 10, 0.06));
  background: var(--bz-eb-bg, var(--bz-paper, #ffffff));
  box-shadow: 0 12px 26px -20px rgba(10, 10, 10, 0.55);
  transform: translateY(var(--bz-eb-y, 0)) rotate(var(--bz-eb-rot, 0deg));
}

.bz-eb__panel {
  position: relative;
  z-index: 2;
  border-radius: var(--bz-radius-2xl, 24px);
  border: 1px solid var(--bz-line-strong, rgba(10, 10, 10, 0.13));
  background: var(--bz-paper, #ffffff);
  padding: clamp(42px, 8vw, 52px) clamp(22px, 5vw, 34px) clamp(24px, 5vw, 32px);
  box-shadow: 0 1px 1px rgba(10, 10, 10, 0.04), 0 28px 54px -30px rgba(10, 10, 10, 0.6);
}

/* The broken seal, sitting half above the panel's top edge. */
.bz-eb__seal {
  position: absolute;
  z-index: 3;
  top: -28px;
  left: clamp(22px, 5vw, 34px);
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  border: 1px solid var(--bz-line-strong, rgba(10, 10, 10, 0.13));
  background: var(--bz-paper-raised, #f7f3ee);
  box-shadow: 0 10px 22px -14px rgba(10, 10, 10, 0.65);
}
.bz-eb__seal svg { width: 30px; height: 30px; display: block; }
.bz-eb__ring { fill: none; stroke: var(--bz-line-control, #8a8a8e); stroke-width: 1.25; }
.bz-eb__crack { fill: none; stroke: var(--bz-danger, #b91c1c); stroke-width: 2.25; stroke-linecap: round; stroke-linejoin: round; }

/* The tag hanging off the top-right corner. */
.bz-eb__tag {
  position: absolute;
  z-index: 3;
  top: calc(var(--bz-eb-out) * -0.5);
  right: calc(var(--bz-eb-out) * -1);
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 13px;
  border-radius: 999px;
  background: var(--bz-ink, #0a0a0a);
  color: var(--bz-paper, #ffffff);
  font-family: var(--bz-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: var(--bz-text-2xs, 0.6875rem);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  white-space: nowrap;
  box-shadow: 0 12px 24px -14px rgba(10, 10, 10, 0.8);
  transform: rotate(5deg);
}
.bz-eb__tag i {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--bz-danger-decor, #ef4444);
}

/* Fragments thrown clear of the right edge. */
.bz-eb__shard {
  position: absolute;
  z-index: 3;
  /* A negative push straddles the edge, so the piece reads as broken off the
     panel rather than as decoration parked beside it. */
  right: calc(var(--bz-eb-out) * var(--bz-eb-push, -1));
  top: var(--bz-eb-y, 40%);
  width: var(--bz-eb-size, 30px);
  height: var(--bz-eb-size, 30px);
  border-radius: var(--bz-eb-radius, 8px);
  background: var(--bz-eb-fill, var(--bz-paper, #ffffff));
  border: 1px solid var(--bz-eb-edge, var(--bz-line-strong, rgba(10, 10, 10, 0.13)));
  box-shadow: 0 10px 20px -14px rgba(10, 10, 10, 0.7);
  transform: rotate(var(--bz-eb-rot, 0deg));
}

/* The boundary itself, drawn as a dashed arc through the bottom-left corner. */
.bz-eb__arc {
  position: absolute;
  z-index: 1;
  left: calc(var(--bz-eb-out) * -1);
  bottom: calc(var(--bz-eb-out) * -1);
  width: 158px;
  height: 158px;
  border-radius: 999px;
  border: 2px dashed var(--bz-line-strong, rgba(10, 10, 10, 0.13));
}

.bz-eb__eyebrow {
  margin: 0;
  font-family: var(--bz-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: var(--bz-text-2xs, 0.6875rem);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--bz-ink-subtle, #6b6b70);
}
.bz-eb__title {
  margin: 10px 0 0;
  font-family: var(--bz-font-serif, Georgia, "Times New Roman", serif);
  font-size: clamp(1.5rem, 1.1rem + 1.6vw, 1.875rem);
  font-weight: var(--bz-weight-medium, 500);
  line-height: var(--bz-leading-tight, 1.15);
  letter-spacing: -0.01em;
  color: var(--bz-ink, #0a0a0a);
}
.bz-eb__body {
  margin: 12px 0 0;
  font-size: var(--bz-text-sm, 0.875rem);
  line-height: var(--bz-leading-normal, 1.55);
  color: var(--bz-ink-muted, #4a4a4c);
}
.bz-eb__detail {
  margin: 18px 0 0;
  padding: 10px 12px 10px 14px;
  border-radius: var(--bz-radius-md, 10px);
  border: 1px solid var(--bz-line, rgba(10, 10, 10, 0.06));
  border-left: 3px solid var(--bz-danger-decor, #ef4444);
  background: var(--bz-paper-sunken, #fafafa);
  font-family: var(--bz-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: var(--bz-text-xs, 0.75rem);
  line-height: var(--bz-leading-snug, 1.35);
  color: var(--bz-ink-muted, #4a4a4c);
  overflow-wrap: anywhere;
}
.bz-eb__actions { margin: 22px 0 0; }
.bz-eb__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: var(--bz-target-min, 48px);
  padding: 0 24px;
  border: 0;
  border-radius: var(--bz-radius-full, 999px);
  background: var(--bz-accent-fill, #912c22);
  color: var(--bz-accent-on-fill, #ffffff);
  font-family: inherit;
  font-size: var(--bz-text-sm, 0.875rem);
  font-weight: var(--bz-weight-semibold, 600);
  cursor: pointer;
}
.bz-eb__button:hover { filter: saturate(1.08) brightness(0.9); }
.bz-eb__button:focus-visible {
  outline: var(--bz-focus-width, 2px) solid var(--bz-focus-ring, #912c22);
  outline-offset: var(--bz-focus-offset, 2px);
}
.bz-eb__button svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }

@media (prefers-reduced-motion: no-preference) {
  .bz-eb__button { transition: filter var(--bz-duration-fast, 150ms) var(--bz-eb-ease); }
  .bz-eb__button:active { transform: scale(0.97); }

  .bz-eb__plane { animation: bz-eb-plane 620ms var(--bz-eb-ease) both; animation-delay: var(--bz-eb-delay, 0ms); }
  .bz-eb__panel { animation: bz-eb-panel 560ms var(--bz-eb-ease) both 70ms; }
  .bz-eb__arc { animation: bz-eb-arc 700ms var(--bz-eb-ease) both 170ms; }
  .bz-eb__seal { animation: bz-eb-seal 480ms var(--bz-eb-spring) both 170ms; }
  .bz-eb__crack { animation: bz-eb-crack 560ms var(--bz-eb-ease) both 300ms; }
  .bz-eb__tag { animation: bz-eb-tag 520ms var(--bz-eb-spring) both 210ms; }
  .bz-eb__shard { animation: bz-eb-shard 600ms var(--bz-eb-spring) both; animation-delay: var(--bz-eb-delay, 0ms); }
  .bz-eb__line { animation: bz-eb-line 460ms var(--bz-eb-ease) both; animation-delay: var(--bz-eb-delay, 0ms); }

  @keyframes bz-eb-plane {
    from { opacity: 0; transform: translateY(0) rotate(0deg); }
    to { opacity: 1; transform: translateY(var(--bz-eb-y, 0)) rotate(var(--bz-eb-rot, 0deg)); }
  }
  @keyframes bz-eb-panel {
    from { opacity: 0; transform: translateY(20px) scale(0.965); }
    to { opacity: 1; transform: none; }
  }
  @keyframes bz-eb-arc {
    from { opacity: 0; transform: scale(0.72) rotate(-26deg); }
    to { opacity: 1; transform: none; }
  }
  @keyframes bz-eb-seal {
    from { opacity: 0; transform: translateY(8px) scale(0.6); }
    to { opacity: 1; transform: none; }
  }
  @keyframes bz-eb-crack {
    from { stroke-dashoffset: 1; }
    to { stroke-dashoffset: 0; }
  }
  @keyframes bz-eb-tag {
    from { opacity: 0; transform: translate(-22px, 10px) rotate(-10deg) scale(0.8); }
    to { opacity: 1; transform: rotate(5deg); }
  }
  @keyframes bz-eb-shard {
    from { opacity: 0; transform: translate(calc(var(--bz-eb-out) * -1.6), 14px) rotate(0deg) scale(0.4); }
    to { opacity: 1; transform: rotate(var(--bz-eb-rot, 0deg)); }
  }
  @keyframes bz-eb-line {
    from { opacity: 0; transform: translateY(9px); }
    to { opacity: 1; transform: none; }
  }
}
`;

/** Rotation, offset and fill for the three fragments flung past the right edge. */
const SHARDS = [
  { size: "46px", radius: "13px", top: "19%", rot: "14deg", push: "-0.45", delay: "250ms", fill: "var(--bz-paper, #ffffff)" },
  { size: "20px", radius: "6px", top: "45%", rot: "-20deg", push: "-1", delay: "300ms", fill: "var(--bz-danger-decor, #ef4444)", edge: "transparent" },
  { size: "13px", radius: "4px", top: "62%", rot: "28deg", push: "-0.2", delay: "350ms", fill: "var(--bz-ink, #0a0a0a)", edge: "transparent" },
];

function CrackMark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden focusable="false">
      <circle className="bz-eb__ring" cx="16" cy="16" r="13.5" />
      <path className="bz-eb__crack" d="M18.5 5.5 12.6 15h5.6L13 26.5" pathLength={1} strokeDasharray={1} />
    </svg>
  );
}

/**
 * Catches a render error anywhere below it and puts up a composed recovery
 * screen: stacked planes, a cracked seal across the panel's top edge, a code
 * tag and fragments thrown past the boundary. The retry clears the error and
 * remounts the subtree, so recovery happens in place rather than by reload.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  state: State = { error: null, attempt: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (this.props.onError) this.props.onError(error, info);
    else console.error("ErrorBoundary caught an error below it.", error, info.componentStack);
  }

  reset = () => {
    this.setState((prev) => ({ error: null, attempt: prev.attempt + 1 }));
    this.props.onReset?.();
  };

  render() {
    const { error, attempt } = this.state;

    // The key remounts the subtree, so a child that failed half way through
    // starts again rather than resuming from whatever state it died in.
    if (!error) return <Fragment key={attempt}>{this.props.children}</Fragment>;

    const {
      icon,
      eyebrow = "Boundary caught it",
      title = "Something went wrong",
      description = "This part of the page stopped rendering. Everything around it kept working.",
      buttonLabel = "Try again",
      code = "Error 500",
      detail,
      fallback,
      fullScreen = true,
      className,
    } = this.props;

    if (fallback) {
      return <>{typeof fallback === "function" ? fallback({ error, reset: this.reset }) : fallback}</>;
    }

    const line = detail ?? error.message;

    return (
      <div className={`bz-eb${fullScreen ? " bz-eb--screen" : ""}${className ? ` ${className}` : ""}`}>
        <style>{STYLES}</style>

        <div className="bz-eb__stage">
          <div
            className="bz-eb__plane"
            aria-hidden
            style={{ "--bz-eb-y": "24px", "--bz-eb-rot": "-2.6deg", "--bz-eb-bg": "var(--bz-paper-raised, #f7f3ee)", "--bz-eb-delay": "0ms" } as CSSProperties}
          />
          <div
            className="bz-eb__plane"
            aria-hidden
            style={{ "--bz-eb-y": "12px", "--bz-eb-rot": "1.8deg", "--bz-eb-delay": "55ms" } as CSSProperties}
          />
          <div className="bz-eb__arc" aria-hidden />

          <div className="bz-eb__panel" role="alert">
            <span className="bz-eb__seal" aria-hidden>
              {icon ?? <CrackMark />}
            </span>

            <p className="bz-eb__eyebrow bz-eb__line" style={{ "--bz-eb-delay": "190ms" } as CSSProperties}>
              {eyebrow}
            </p>
            <h2 className="bz-eb__title bz-eb__line" style={{ "--bz-eb-delay": "240ms" } as CSSProperties}>
              {title}
            </h2>
            <p className="bz-eb__body bz-eb__line" style={{ "--bz-eb-delay": "290ms" } as CSSProperties}>
              {description}
            </p>
            {line ? (
              <p className="bz-eb__detail bz-eb__line" style={{ "--bz-eb-delay": "340ms" } as CSSProperties}>
                {line}
              </p>
            ) : null}
            <div className="bz-eb__actions bz-eb__line" style={{ "--bz-eb-delay": "390ms" } as CSSProperties}>
              <button type="button" className="bz-eb__button" onClick={this.reset}>
                <svg viewBox="0 0 24 24" aria-hidden focusable="false">
                  <path d="M20 11a8 8 0 1 0-2.3 6.3" />
                  <path d="M20 4.5V11h-6.5" />
                </svg>
                {buttonLabel}
              </button>
            </div>
          </div>

          {code ? (
            <span className="bz-eb__tag" aria-hidden>
              <i />
              {code}
            </span>
          ) : null}

          {SHARDS.map((shard) => (
            <span
              key={shard.top}
              className="bz-eb__shard"
              aria-hidden
              style={
                {
                  "--bz-eb-size": shard.size,
                  "--bz-eb-radius": shard.radius,
                  "--bz-eb-y": shard.top,
                  "--bz-eb-rot": shard.rot,
                  "--bz-eb-push": shard.push,
                  "--bz-eb-fill": shard.fill,
                  "--bz-eb-edge": shard.edge ?? "var(--bz-line-strong, rgba(10, 10, 10, 0.13))",
                  "--bz-eb-delay": shard.delay,
                } as CSSProperties
              }
            />
          ))}
        </div>
      </div>
    );
  }
}
