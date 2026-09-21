import type { CSSProperties } from "react";

type Props = {
  formula: string;
  caption?: string;
};

/**
 * Picked with light-dark() from tokens.css: the paper emerald is too dark to
 * carry a tint on a dark ground, so the void half uses --bz-emerald-on-void.
 * A host that declares `color-scheme: dark` gets it with no prop.
 */
const theme = {
  "--fb-ink": "light-dark(var(--bz-ink, #0a0a0a), var(--bz-void-ink, #ffffff))",
  "--fb-muted": "light-dark(var(--bz-ink-muted, #4a4a4c), rgba(255, 255, 255, 0.78))",
  "--fb-tint": "light-dark(rgba(4, 120, 87, 0.07), rgba(52, 211, 153, 0.1))",
  "--fb-edge": "light-dark(rgba(4, 120, 87, 0.28), rgba(52, 211, 153, 0.3))",
  "--fb-rule": "light-dark(rgba(4, 120, 87, 0.22), rgba(52, 211, 153, 0.24))",
} as CSSProperties;

export function FormulaBlock({ formula, caption }: Props) {
  return (
    <figure
      style={{
        ...theme,
        background: "var(--fb-tint)",
        border: "1px solid var(--fb-edge)",
        borderRadius: "var(--bz-radius-lg, 12px)",
        margin: "2rem 0",
        padding: "1.5rem 1.25rem",
      }}
    >
      <div className="overflow-x-auto text-center">
        <code
          className="font-mono"
          style={{
            background: "transparent",
            color: "var(--fb-ink)",
            display: "inline-block",
            fontSize: "clamp(0.9375rem, 0.78rem + 1.1vw, 1.375rem)",
            letterSpacing: "-0.01em",
            lineHeight: 1.45,
            padding: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {formula}
        </code>
      </div>

      {caption && (
        <figcaption
          className="font-mono text-center uppercase"
          style={{
            borderTop: "1px solid var(--fb-rule)",
            color: "var(--fb-muted)",
            fontSize: "var(--bz-text-2xs, 0.6875rem)",
            letterSpacing: "0.24em",
            lineHeight: 1.5,
            marginTop: "1.25rem",
            paddingTop: "0.875rem",
          }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
