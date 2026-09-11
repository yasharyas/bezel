import type { ReactNode } from "react";
import { Markdown } from "@/lib/markdown";
import { GITHUB_URL } from "@/lib/site";

type Props = {
  source: string;
  file: string;
  children?: ReactNode;
};

/** A document from packages/ui, rendered as a page. */
export function DocPage({ source, file, children }: Props) {
  return (
    <main id="main" className="mx-auto max-w-3xl px-4 pb-8 pt-14 sm:px-6">
      <p className="mb-6 font-mono text-xs uppercase tracking-[0.18em] text-void-muted">
        packages/ui/{file}
      </p>
      <article>
        <Markdown source={source} />
      </article>
      {children}
      <p className="mt-16 border-t border-void-line pt-6 text-sm text-void-muted">
        This page is rendered from{" "}
        <a
          href={`${GITHUB_URL}/blob/main/packages/ui/${file}`}
          className="focus-ring rounded text-void-ink underline underline-offset-4"
        >
          {file}
        </a>{" "}
        at build time, so it always matches the document that ships with the package.
      </p>
    </main>
  );
}
