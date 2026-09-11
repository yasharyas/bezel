import Link from "next/link";
import { GITHUB_URL, NPM_URL, PORTFOLIO_URL } from "@/lib/site";

export function GalleryFooter() {
  const link = "focus-ring rounded text-void-muted transition-colors hover:text-void-ink";
  return (
    <footer className="mt-24 border-t border-void-line">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-[1fr_auto] sm:items-end sm:px-6">
        <div>
          <p className="font-serif text-xl text-void-ink">Bezel</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-void-muted">
            Every text and control colour on this page is measured by the same WCAG AA gate as the
            components it shows.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link href="/principles" className={link}>
            Principles
          </Link>
          <Link href="/states" className={link}>
            States
          </Link>
          <a href={NPM_URL} className={link}>
            npm
          </a>
          <a href={GITHUB_URL} className={link}>
            GitHub
          </a>
          <a href={PORTFOLIO_URL} className={link}>
            Built by Yash Arya
          </a>
        </nav>
      </div>
    </footer>
  );
}
