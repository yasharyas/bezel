import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import { InstallCommand } from "@/components/InstallCommand";
import { PreviewStage } from "@/components/preview/PreviewStage";
import { catalog, categoryLabel, getEntry } from "@/lib/catalog";

export const dynamicParams = false;

export function generateStaticParams() {
  return catalog.map((entry) => ({ slug: entry.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const entry = catalog.find((e) => e.slug === params.slug);
  if (!entry) return {};
  const title = entry.name;
  return {
    title,
    description: entry.description,
    alternates: { canonical: `/component/${entry.slug}` },
    openGraph: { title: `${title} · Bezel`, description: entry.description, url: `/component/${entry.slug}` },
    twitter: { title: `${title} · Bezel`, description: entry.description },
  };
}

export default function ComponentPage({ params }: { params: { slug: string } }) {
  const source = getEntry(params.slug);
  const entry = catalog.find((e) => e.slug === params.slug);
  if (!source || !entry) notFound();

  const index = catalog.findIndex((e) => e.slug === entry.slug);
  const previous = catalog[index - 1];
  const next = catalog[index + 1];

  return (
    <main id="main" className="mx-auto max-w-6xl px-4 pb-8 pt-8 sm:px-6">
      <Link
        href={`/?category=${entry.category}#components`}
        className="focus-ring -ml-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-void-muted hover:text-void-ink"
      >
        <ArrowLeft aria-hidden size={15} />
        {categoryLabel(entry.category)}
      </Link>

      <header className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-void-muted">{categoryLabel(entry.category)}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-void-ink sm:text-5xl">{entry.name}</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-void-muted">{entry.description}</p>
        </div>
        {/* The package is `bezel-add`, never bare `bezel`: that name belongs to an
            unrelated package on npm, so `npx bezel` would fetch and run a
            stranger's code. `npx bezel-add` resolves to this project. */}
        <InstallCommand command={`npx bezel-add add ${entry.slug}`} label={`Copy the command that adds ${entry.name}`} />
      </header>

      <section aria-label={`${entry.name} live preview`} className="mt-8">
        <PreviewStage slug={entry.slug} name={entry.name} size="large" eager className="rounded-2xl border border-void-line" />
      </section>

      <div className="mt-8">
        <CodeBlock code={source.code} filename={`packages/ui/src/${entry.path}`} />
      </div>

      <nav aria-label="Other components" className="mt-10 grid gap-3 sm:grid-cols-2">
        {previous ? (
          <Link
            href={`/component/${previous.slug}`}
            className="focus-ring group rounded-xl border border-void-line px-4 py-3 hover:border-[rgba(255,255,255,0.22)]"
          >
            <span className="flex items-center gap-1.5 text-xs text-void-muted">
              <ArrowLeft aria-hidden size={13} /> Previous
            </span>
            <span className="mt-1 block text-[15px] font-medium text-void-ink">{previous.name}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/component/${next.slug}`}
            className="focus-ring group rounded-xl border border-void-line px-4 py-3 text-right hover:border-[rgba(255,255,255,0.22)]"
          >
            <span className="flex items-center justify-end gap-1.5 text-xs text-void-muted">
              Next <ArrowRight aria-hidden size={13} />
            </span>
            <span className="mt-1 block text-[15px] font-medium text-void-ink">{next.name}</span>
          </Link>
        ) : null}
      </nav>
    </main>
  );
}
