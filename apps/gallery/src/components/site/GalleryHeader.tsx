"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GITHUB_URL } from "@/lib/site";
import { BezelMark } from "./BezelMark";

const LINKS = [
  { href: "/", label: "Components", hideOnMobile: true },
  { href: "/principles", label: "Principles" },
  { href: "/states", label: "States" },
];

export function GalleryHeader() {
  const pathname = usePathname();
  return (
    <>
      <a
        href="#main"
        className="focus-ring fixed left-3 top-3 z-50 -translate-y-20 rounded-lg bg-paper px-3 py-2 text-sm font-medium text-ink focus:translate-y-0"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-void-line bg-[rgba(12,12,15,0.86)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="focus-ring -ml-1 flex items-center gap-2 rounded-lg px-1 py-1">
            <BezelMark />
            <span className="text-[15px] font-semibold tracking-tight">Bezel</span>
          </Link>
          <nav aria-label="Primary" className="ml-auto flex items-center gap-0.5 text-sm">
            {LINKS.map((link) => {
              const current = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={current ? "page" : undefined}
                  className={`focus-ring rounded-lg px-2.5 py-2 transition-colors hover:text-void-ink ${
                    link.hideOnMobile ? "hidden sm:block" : ""
                  } ${current ? "text-void-ink" : "text-void-muted"}`}
                >
                  {link.label}
                </Link>
              );
            })}
            <a
              href={GITHUB_URL}
              className="focus-ring ml-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-void-muted transition-colors hover:text-void-ink"
            >
              <svg aria-hidden viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              <span className="hidden sm:inline">GitHub</span>
              <span className="sr-only sm:hidden">Bezel on GitHub</span>
            </a>
          </nav>
        </div>
      </header>
    </>
  );
}
