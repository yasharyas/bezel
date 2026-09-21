import type { CSSProperties } from "react";

type FooterColumn = {
  heading: string;
  links: { label: string; href: string }[];
};

type Props = {
  brandName?: string;
  tagline?: string;
  columns?: FooterColumn[];
  copyright?: string;
  publishedBy?: { label: string; href: string };
};

/**
 * Pairs are picked with light-dark() from tokens.css, including the focus
 * ring, which has to change colour with the ground or it stops being visible.
 * A host that declares `color-scheme: dark` needs no prop.
 */
const theme = {
  "--sf-ink": "light-dark(var(--bz-ink, #0a0a0a), var(--bz-void-ink, #ffffff))",
  "--sf-muted": "light-dark(var(--bz-ink-muted, #4a4a4c), rgba(255, 255, 255, 0.78))",
  "--sf-subtle": "light-dark(var(--bz-ink-subtle, #6b6b70), rgba(255, 255, 255, 0.66))",
  "--sf-line": "light-dark(rgba(10, 10, 10, 0.1), rgba(255, 255, 255, 0.13))",
  "--sf-accent": "light-dark(var(--bz-emerald, #047857), var(--bz-emerald-on-void, #34d399))",
  "--sf-halo": "light-dark(rgba(4, 120, 87, 0.16), rgba(52, 211, 153, 0.22))",
  "--sf-ring": "light-dark(var(--bz-focus-ring, #912c22), var(--bz-focus-ring-void, #ffffff))",
} as CSSProperties;

/* Colour stays in classes, not the style attribute, or :hover could never win. */
const linkClass =
  "no-underline transition-colors hover:[color:var(--sf-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--sf-ring)]";

export function SiteFooter({
  brandName = "YASH",
  tagline = "",
  columns = [],
  copyright = `© ${new Date().getFullYear()} YASH. All rights reserved.`,
  publishedBy,
}: Props) {
  return (
    <footer
      style={{
        ...theme,
        borderTop: "1px solid var(--sf-line)",
        marginTop: "2.5rem",
        padding: "clamp(2.5rem, 6vw, 4rem) clamp(1rem, 4vw, 1.5rem) 1.75rem",
      }}
    >
      {/* Two levels of wrapping rather than a fixed track count: the brand and
          the link block break apart first, then the columns break among
          themselves. One column and five both land without a breakpoint.
          The gaps are fixed rather than viewport-relative, so where the
          footer breaks depends on the footer's own width and not on the
          window it is being scaled inside. */}
      <div
        className="mx-auto flex flex-wrap"
        style={{ columnGap: "3rem", maxWidth: "1200px", rowGap: "2.5rem" }}
      >
        <div style={{ flex: "1 1 18rem", minWidth: 0 }}>
          <div
            className="flex items-center"
            style={{
              color: "var(--sf-ink)",
              fontSize: "0.9375rem",
              fontWeight: "var(--bz-weight-semibold, 600)",
              gap: "0.75rem",
              letterSpacing: "0.08em",
            }}
          >
            <span
              aria-hidden
              className="shrink-0 rounded-full"
              style={{
                background: "var(--sf-accent)",
                boxShadow: "0 0 0 4px var(--sf-halo)",
                height: "0.5rem",
                width: "0.5rem",
              }}
            />
            {brandName}
          </div>
          {tagline && (
            <p
              className="mb-0"
              style={{
                color: "var(--sf-muted)",
                fontSize: "var(--bz-text-sm, 0.875rem)",
                lineHeight: "var(--bz-leading-normal, 1.55)",
                marginTop: "0.875rem",
                maxWidth: "34ch",
              }}
            >
              {tagline}
            </p>
          )}
        </div>

        {columns.length > 0 && (
          <div
            className="flex flex-wrap"
            style={{ columnGap: "2rem", flex: "2 1 22rem", rowGap: "2rem" }}
          >
            {columns.map((col) => (
              <div key={col.heading} style={{ flex: "1 1 7.5rem", minWidth: "7rem" }}>
                <h4
                  className="m-0 font-mono uppercase"
                  style={{
                    color: "var(--sf-accent)",
                    fontSize: "var(--bz-text-2xs, 0.6875rem)",
                    fontWeight: "var(--bz-weight-normal, 400)",
                    letterSpacing: "0.24em",
                    lineHeight: 1,
                  }}
                >
                  {col.heading}
                </h4>
                <ul className="m-0 list-none p-0" style={{ marginTop: "0.5rem" }}>
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <a
                        href={l.href}
                        className={`${linkClass} [color:var(--sf-ink)]`}
                        style={{
                          display: "inline-block",
                          fontSize: "var(--bz-text-sm, 0.875rem)",
                          lineHeight: 1.5,
                          padding: "0.4375rem 0",
                        }}
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className="mx-auto flex flex-wrap items-center justify-between"
        style={{
          borderTop: "1px solid var(--sf-line)",
          color: "var(--sf-subtle)",
          fontSize: "var(--bz-text-xs, 0.75rem)",
          gap: "0.75rem",
          marginTop: "2.5rem",
          maxWidth: "1200px",
          paddingTop: "1.375rem",
        }}
      >
        <span>{copyright}</span>
        {publishedBy && (
          <span>
            Published by{" "}
            <a href={publishedBy.href} className={`${linkClass} [color:var(--sf-muted)]`}>
              {publishedBy.label}
            </a>
          </span>
        )}
      </div>
    </footer>
  );
}
