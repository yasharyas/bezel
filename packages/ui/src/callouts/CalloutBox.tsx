import type { CSSProperties, ReactNode } from "react";

type CheckItem = {
  symbol: string;
  content: ReactNode;
};

type Props = {
  title: string;
  intro?: string;
  label?: string;
  items?: CheckItem[];
  footer?: string;
};

/**
 * The amber is structural (the spine, the label, the markers) rather than a
 * wash, because an amber field that reads on white turns to mud on a dark
 * ground. The surface is neutral on both and the pairs are picked with
 * light-dark(), so a host that declares `color-scheme: dark` needs no prop.
 */
const theme = {
  "--cb-ink": "light-dark(var(--bz-ink, #0a0a0a), var(--bz-void-ink, #ffffff))",
  "--cb-muted": "light-dark(var(--bz-ink-muted, #4a4a4c), rgba(255, 255, 255, 0.78))",
  "--cb-surface": "light-dark(rgba(10, 10, 10, 0.02), rgba(255, 255, 255, 0.05))",
  "--cb-line": "light-dark(rgba(10, 10, 10, 0.1), rgba(255, 255, 255, 0.13))",
  "--cb-accent": "light-dark(var(--bz-amber, #b45309), var(--bz-amber-on-void, #fbbf24))",
  "--cb-on-accent": "light-dark(var(--bz-amber-on-fill, #ffffff), var(--bz-on-void-fill, #0a0a0a))",
} as CSSProperties;

export function CalloutBox({ title, intro, label, items = [], footer }: Props) {
  return (
    <div
      style={{
        ...theme,
        background: "var(--cb-surface)",
        border: "1px solid var(--cb-line)",
        // The spine is what makes it read as a callout rather than a card.
        borderLeft: "3px solid var(--cb-accent)",
        borderRadius: "var(--bz-radius-lg, 12px)",
        marginTop: "2rem",
        padding: "clamp(1.25rem, 4%, 1.75rem)",
      }}
    >
      <h3
        className="m-0 font-serif"
        style={{
          color: "var(--cb-ink)",
          fontSize: "clamp(1.125rem, 1rem + 0.6vw, 1.45rem)",
          fontWeight: "var(--bz-weight-medium, 500)",
          letterSpacing: "-0.012em",
          lineHeight: "var(--bz-leading-tight, 1.15)",
        }}
      >
        {title}
      </h3>

      {intro && (
        <p
          className="mb-0"
          style={{
            color: "var(--cb-muted)",
            fontSize: "0.9375rem",
            lineHeight: "var(--bz-leading-normal, 1.55)",
            marginTop: "0.625rem",
            maxWidth: "56ch",
          }}
        >
          {intro}
        </p>
      )}

      {label && (
        <div className="flex items-center" style={{ gap: "0.75rem", marginTop: "1.5rem" }}>
          <span
            className="font-mono uppercase"
            style={{
              color: "var(--cb-accent)",
              fontSize: "var(--bz-text-2xs, 0.6875rem)",
              letterSpacing: "0.28em",
              lineHeight: 1,
            }}
          >
            {label}
          </span>
          <span aria-hidden className="flex-1" style={{ background: "var(--cb-line)", height: "1px" }} />
        </div>
      )}

      {items.length > 0 && (
        <ul
          className="list-none p-0"
          style={{ display: "flex", flexDirection: "column", gap: "0.625rem", margin: label ? "0.875rem 0 0" : "1.25rem 0 0" }}
        >
          {items.map((item, i) => (
            <li
              key={i}
              className="flex items-start"
              style={{ color: "var(--cb-ink)", fontSize: "0.9375rem", gap: "0.75rem", lineHeight: "var(--bz-leading-snug, 1.35)" }}
            >
              <span
                aria-hidden
                className="inline-flex shrink-0 items-center justify-center rounded-full font-mono"
                style={{
                  background: "var(--cb-accent)",
                  color: "var(--cb-on-accent)",
                  fontSize: "var(--bz-text-2xs, 0.6875rem)",
                  fontWeight: "var(--bz-weight-semibold, 600)",
                  height: "1.375rem",
                  lineHeight: 1,
                  marginTop: "0.0625rem",
                  width: "1.375rem",
                }}
              >
                {item.symbol}
              </span>
              <span style={{ minWidth: 0 }}>{item.content}</span>
            </li>
          ))}
        </ul>
      )}

      {footer && (
        <p
          className="mb-0"
          style={{
            borderTop: "1px solid var(--cb-line)",
            color: "var(--cb-ink)",
            fontSize: "0.9375rem",
            fontWeight: "var(--bz-weight-medium, 500)",
            lineHeight: "var(--bz-leading-snug, 1.35)",
            marginTop: "1.125rem",
            paddingTop: "1.125rem",
          }}
        >
          {footer}
        </p>
      )}
    </div>
  );
}
