import type { CSSProperties } from "react";

type Step = {
  number: string;
  title: string;
  description: string;
};

type Props = {
  steps: Step[];
};

/**
 * Both halves of every pair come from tokens.css and are picked with
 * light-dark(), so the list reads on paper and on a dark ground with no prop:
 * a host that declares `color-scheme: dark` gets the void half. Override any
 * of these four variables to retheme without touching the file.
 */
const theme = {
  "--nsl-ink": "light-dark(var(--bz-ink, #0a0a0a), var(--bz-void-ink, #ffffff))",
  "--nsl-muted": "light-dark(var(--bz-ink-muted, #4a4a4c), rgba(255, 255, 255, 0.78))",
  "--nsl-accent": "light-dark(var(--bz-emerald, #047857), var(--bz-emerald-on-void, #34d399))",
  "--nsl-line": "light-dark(rgba(10, 10, 10, 0.1), rgba(255, 255, 255, 0.13))",
} as CSSProperties;

export function NumberedStepsList({ steps }: Props) {
  return (
    <ol className="m-0 flex list-none flex-col p-0" style={theme}>
      {steps.map((step, i) => (
        <li
          key={step.number}
          className="grid items-start"
          style={{
            gridTemplateColumns: "3rem minmax(0, 1fr)",
            columnGap: "clamp(0.875rem, 4%, 1.75rem)",
            // The first step opens the list, so it carries no rule above it.
            borderTop: i === 0 ? undefined : "1px solid var(--nsl-line)",
            paddingTop: i === 0 ? 0 : "1.5rem",
            paddingBottom: "1.5rem",
          }}
        >
          <div>
            <div
              className="font-mono tabular-nums"
              style={{
                color: "var(--nsl-accent)",
                fontSize: "0.8125rem",
                letterSpacing: "0.2em",
                lineHeight: 1,
                // Sits the digits on the serif title's cap line.
                paddingTop: "0.45rem",
              }}
            >
              {step.number}
            </div>
            <div
              aria-hidden
              style={{ background: "var(--nsl-accent)", height: "1px", marginTop: "0.65rem", width: "1.75rem" }}
            />
          </div>

          <div className="min-w-0">
            <h3
              className="m-0 font-serif"
              style={{
                color: "var(--nsl-ink)",
                fontSize: "clamp(1.25rem, 1.05rem + 0.95vw, 1.6rem)",
                fontWeight: "var(--bz-weight-medium, 500)",
                letterSpacing: "-0.012em",
                lineHeight: "var(--bz-leading-tight, 1.15)",
              }}
            >
              {step.title}
            </h3>
            <p
              className="mb-0"
              style={{
                color: "var(--nsl-muted)",
                fontSize: "0.9375rem",
                lineHeight: "var(--bz-leading-normal, 1.55)",
                marginTop: "0.6rem",
                maxWidth: "46ch",
              }}
            >
              {step.description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
