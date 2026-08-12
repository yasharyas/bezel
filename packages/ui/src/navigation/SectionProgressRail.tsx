"use client";

type RailLink = {
  href: string;
  label: string;
};

type SectionProgressRailProps = {
  links: RailLink[];
  activeIndex: number;
  activeColor?: string;
  className?: string;
};

export function SectionProgressRail({
  links,
  activeIndex,
  activeColor = "#f0a03c",
  className = "",
}: SectionProgressRailProps) {
  return (
    <>
      <style>{`
        .spr {
          position: fixed;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 44;
          display: none;
          flex-direction: column;
          gap: 12px;
        }
        @media (min-width: 1180px) {
          .spr { display: flex; }
        }
        .spr a {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(236, 230, 247, 0.26);
          transition: 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          position: relative;
        }
        .spr a.spr--on {
          background: var(--spr-active, #f0a03c);
          box-shadow: 0 0 0 5px color-mix(in srgb, var(--spr-active, #f0a03c) 18%, transparent);
          height: 22px;
          border-radius: 999px;
        }
        @media (prefers-reduced-motion: reduce) {
          .spr a { transition: none; }
        }
      `}</style>
      <nav
        className={`spr ${className}`.trim()}
        aria-label="Section progress"
        style={{ ["--spr-active" as string]: activeColor }}
      >
        {links.map((link, i) => (
          <a
            key={link.href}
            href={link.href}
            className={i === activeIndex ? "spr--on" : undefined}
            aria-label={link.label}
            aria-current={i === activeIndex ? "true" : undefined}
          />
        ))}
      </nav>
    </>
  );
}
