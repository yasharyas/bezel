import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight } from "lucide-react";
import { ComponentIndex, ComponentIndexView } from "@/components/index/ComponentIndex";
import { InstallCommand } from "@/components/InstallCommand";
import { catalog, categories } from "@/lib/catalog";
import { FEATURED } from "@/lib/featured";
import { GITHUB_URL, NPM_URL } from "@/lib/site";

const RIGOUR = [
  {
    href: "/principles#4-contrast-is-a-gate-not-a-preference",
    title: "Contrast is a gate",
    body: "Every token pair is measured against WCAG AA before release. This page is measured too.",
  },
  {
    href: "/states",
    title: "Eight states, audited",
    body: "Default to empty, specified once and checked component by component, gaps included.",
  },
  {
    href: "/principles",
    title: "Principles with receipts",
    body: "Six rules read off the code, each with a list of where it does not hold yet.",
  },
];

export default function GalleryPage() {
  const indexProps = { entries: catalog, categories, featured: FEATURED };
  return (
    <main id="main">
      <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-14 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-void-muted">
            React component library · {catalog.length} components
          </p>
          <h1 className="mt-4 font-serif text-6xl font-normal leading-[0.95] tracking-[-0.02em] text-void-ink sm:text-7xl">
            Bezel
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-void-muted sm:text-xl">
            Components for interfaces that need motion and craft, shipped as readable TypeScript
            you copy into your project and own.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <InstallCommand command="npm i bezel-ui" label="Copy install command" />
            <a
              href={NPM_URL}
              className="focus-ring inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-void-ink hover:bg-[rgba(255,255,255,0.08)]"
            >
              npm
              <ArrowUpRight aria-hidden size={15} />
            </a>
            <a
              href={GITHUB_URL}
              className="focus-ring inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-void-ink hover:bg-[rgba(255,255,255,0.08)]"
            >
              GitHub
              <ArrowUpRight aria-hidden size={15} />
            </a>
          </div>
        </div>

        <ul className="grid gap-px overflow-hidden rounded-2xl border border-void-line bg-void-line">
          {RIGOUR.map((item) => (
            <li key={item.title} className="bg-void">
              <Link href={item.href} className="focus-ring group block px-5 py-4 outline-offset-[-4px]">
                <span className="flex items-center justify-between gap-3 text-[15px] font-medium text-void-ink">
                  {item.title}
                  <ArrowUpRight
                    aria-hidden
                    size={15}
                    className="text-void-muted transition-transform duration-200 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5"
                  />
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-void-muted">{item.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Suspense fallback={<ComponentIndexView {...indexProps} initialQuery="" initialCategory="all" />}>
        <ComponentIndex {...indexProps} />
      </Suspense>
    </main>
  );
}
