import type { CSSProperties, ReactNode } from "react";

type CheckItem = {
  symbol: string;
  text: ReactNode;
};

type Props = {
  items: CheckItem[];
};

/**
 * The marker is a solid disc rather than a tint, because a 10% emerald wash
 * disappears on a dark ground and the glyph on it drops under AA. Solid takes
 * the ink each fill declares in tokens.css, which holds either way. Pairs are
 * picked with light-dark(), so a host that declares `color-scheme: dark` needs
 * no prop.
 */
const theme = {
  "--cl-ink": "light-dark(var(--bz-ink, #0a0a0a), var(--bz-void-ink, #ffffff))",
  "--cl-surface": "light-dark(rgba(10, 10, 10, 0.025), rgba(255, 255, 255, 0.05))",
  "--cl-line": "light-dark(rgba(10, 10, 10, 0.09), rgba(255, 255, 255, 0.12))",
  "--cl-marker": "light-dark(var(--bz-emerald-fill, #047857), var(--bz-emerald-on-void, #34d399))",
  "--cl-on-marker": "light-dark(var(--bz-emerald-on-fill, #ffffff), var(--bz-on-void-fill, #0a0a0a))",
} as CSSProperties;

export function Checklist({ items }: Props) {
  return (
    <ul
      className="list-none p-0"
      style={{ ...theme, display: "flex", flexDirection: "column", gap: "0.5rem", margin: "1.5rem 0" }}
    >
      {items.map((item, i) => (
        <li
          key={i}
          className="flex items-start"
          style={{
            background: "var(--cl-surface)",
            border: "1px solid var(--cl-line)",
            borderRadius: "var(--bz-radius-md, 10px)",
            color: "var(--cl-ink)",
            fontSize: "0.9375rem",
            gap: "0.75rem",
            lineHeight: "var(--bz-leading-snug, 1.35)",
            padding: "0.8125rem 1rem",
          }}
        >
          <span
            aria-hidden
            className="inline-flex shrink-0 items-center justify-center rounded-full font-mono"
            style={{
              background: "var(--cl-marker)",
              color: "var(--cl-on-marker)",
              fontSize: "var(--bz-text-2xs, 0.6875rem)",
              fontWeight: "var(--bz-weight-semibold, 600)",
              height: "1.375rem",
              lineHeight: 1,
              // Optically centres the disc on the first line of the label.
              marginTop: "0.0625rem",
              width: "1.375rem",
            }}
          >
            {item.symbol}
          </span>
          <span style={{ minWidth: 0 }}>{item.text}</span>
        </li>
      ))}
    </ul>
  );
}
