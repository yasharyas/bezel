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

export function SiteFooter({
  brandName = "BRAND",
  tagline = "",
  columns = [],
  copyright = `© ${new Date().getFullYear()} Brand. All rights reserved.`,
  publishedBy,
}: Props) {
  return (
    <footer className="border-t border-black/[0.06] px-6 pt-16 pb-7 mt-10">
      <div
        className="max-w-[1200px] mx-auto grid gap-8"
        style={{ gridTemplateColumns: `2fr ${columns.map(() => "1fr").join(" ")}` }}
      >
        {/* Brand column */}
        <div>
          <div className="flex items-center gap-2.5 font-semibold tracking-[0.08em] text-[#0a0a0a] text-[13px]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669] shadow-[0_0_12px_#059669] shrink-0" />
            {brandName}
          </div>
          {tagline && (
            <p className="text-sm text-[#8a8a8e] mt-2.5 max-w-[360px]">{tagline}</p>
          )}
        </div>

        {/* Link columns */}
        {columns.map((col) => (
          <div key={col.heading}>
            <h4 className="font-mono text-[11px] tracking-[0.3em] text-[#059669] mt-0 mb-3.5 uppercase">
              {col.heading}
            </h4>
            <ul className="list-none p-0 m-0">
              {col.links.map((l) => (
                <li key={l.href} className="mb-2">
                  <a
                    href={l.href}
                    className="text-[#4a4a4c] text-sm hover:text-[#0a0a0a] transition-colors no-underline"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="max-w-[1200px] mx-auto flex justify-between flex-wrap gap-3 mt-12 pt-[22px] border-t border-black/[0.06] text-[#8a8a8e] text-xs">
        <span>{copyright}</span>
        {publishedBy && (
          <span>
            Published by{" "}
            <a
              href={publishedBy.href}
              className="text-[#4a4a4c] hover:text-[#0a0a0a] no-underline"
            >
              {publishedBy.label}
            </a>
          </span>
        )}
      </div>
    </footer>
  );
}
