/*
 * One grid, four looks. This replaces FeatureCardGrid, PrincipleCardGrid,
 * SignalCardGrid and DiagnosticGrid, which were the same card with a different
 * line above the title: a mono label, a number, a drop letter or a pill tag.
 *
 * Cards are a list, so this renders <ul>/<li>. Colours come from the tokens
 * rather than the hard-coded hexes the four grids each carried.
 */

export type CardGridItem = {
  /** The line above the title: a label, a number, a single letter or a tag. */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  description?: string;
};

type Props = {
  items: CardGridItem[];
  /** Columns at the widest breakpoint. "fit" gives each item its own column, up to five. */
  columns?: 1 | 2 | 3 | 4 | "fit";
  /** How the eyebrow reads. "label" is mono caps, "letter" a serif drop letter, "tag" a pill. */
  eyebrow?: "label" | "letter" | "tag";
  /** Serif titles, as the principle and diagnostic grids had them. */
  serifTitles?: boolean;
  className?: string;
};

const COLUMNS: Record<Exclude<Props["columns"] & {}, "fit">, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export function CardGrid({
  items,
  columns = 3,
  eyebrow = "label",
  serifTitles = false,
  className = "",
}: Props) {
  const fit = columns === "fit";

  return (
    <ul
      role="list"
      className={`grid gap-3 m-0 p-0 list-none ${fit ? "" : COLUMNS[columns]} ${className}`}
      style={
        fit
          ? { gridTemplateColumns: `repeat(${Math.min(items.length, 5)}, minmax(0, 1fr))` }
          : undefined
      }
    >
      {items.map((item, i) => (
        <li
          key={item.eyebrow ?? item.title ?? i}
          /* No hover state: these cards are content, not controls. The grid it
             replaces lifted on hover and read as clickable when it was not. */
          className="flex flex-col gap-1.5 p-[22px] rounded-xl bg-[color:var(--bz-paper-sunken,#fafafa)] border border-[color:var(--bz-line,rgba(10,10,10,0.06))]"
        >
          {item.eyebrow && eyebrow === "label" && (
            <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-[color:var(--bz-emerald,#047857)]">
              {item.eyebrow}
            </div>
          )}
          {/* The drop letter is decoration: it repeats the title's first idea,
              so it stays out of the accessibility tree. */}
          {item.eyebrow && eyebrow === "letter" && (
            <div
              aria-hidden
              className="font-serif italic text-[44px] leading-none text-[color:var(--bz-emerald-decor,#059669)]"
            >
              {item.eyebrow}
            </div>
          )}
          {item.eyebrow && eyebrow === "tag" && (
            /* Amber on white, not on an amber tint: the tinted pill the
               diagnostic grid used measured 4.2:1 and missed AA. */
            <span className="self-start px-2.5 py-1 mb-1 rounded-full font-mono text-[10px] tracking-[0.15em] bg-[color:var(--bz-paper,#ffffff)] border border-[color:var(--bz-amber,#b45309)] text-[color:var(--bz-amber,#b45309)]">
              {item.eyebrow}
            </span>
          )}

          <h3
            className={`m-0 font-medium text-[color:var(--bz-ink,#0a0a0a)] ${
              serifTitles ? "font-serif text-[22px]" : "text-[17px]"
            }`}
          >
            {item.title}
          </h3>

          {item.subtitle && (
            <div className="text-[13px] text-[color:var(--bz-ink-subtle,#6b6b70)]">
              {item.subtitle}
            </div>
          )}

          {item.description && (
            <p className="m-0 text-sm text-[color:var(--bz-ink-muted,#4a4a4c)]">
              {item.description}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
