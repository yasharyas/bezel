type NavLink = { label: string; href: string };

type Props = {
  brandName?: string;
  links?: NavLink[];
  onThemeToggle?: () => void;
  isDark?: boolean;
};

export function StickyNav({
  brandName = "BRAND",
  links = [],
  onThemeToggle,
  isDark = false,
}: Props) {
  return (
    <header className="sticky top-0 z-50 bg-[rgba(245,245,247,0.8)] backdrop-saturate-[180%] backdrop-blur-[12px] border-b border-black/[0.06]">
      <div className="max-w-[1200px] mx-auto px-6 py-[14px] flex items-center gap-6">
        <a
          className="flex items-center gap-2.5 font-semibold tracking-[0.08em] text-[#0a0a0a] no-underline"
          href="#"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#059669] shadow-[0_0_12px_#059669] shrink-0" />
          <span className="text-[13px]">{brandName}</span>
        </a>

        <nav className="ml-auto flex gap-[22px]">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13px] text-[#4a4a4c] hover:text-[#0a0a0a] transition-colors no-underline"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <button
          className="flex items-center justify-center w-9 h-9 rounded-full border border-black/[0.13] cursor-pointer bg-black/[0.02] text-[#4a4a4c] hover:text-[#0a0a0a] hover:bg-black/[0.04] transition-all shrink-0 p-0"
          aria-label="Toggle theme"
          onClick={onThemeToggle}
        >
          {/* Moon – shown in light mode */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 pointer-events-none"
            style={{ display: isDark ? "none" : "block" }}
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          {/* Sun – shown in dark mode */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 pointer-events-none"
            style={{ display: isDark ? "block" : "none" }}
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        </button>
      </div>
    </header>
  );
}
