import type { Metadata } from "next";
import { DocPage } from "@/components/DocPage";
import { readPackageDoc } from "@/lib/docs";
import results from "@/lib/contrast-results.json";

export const metadata: Metadata = {
  title: "Principles",
  description:
    "How Bezel decides things: six principles read off the components, each with a list of where it does not hold yet.",
  alternates: { canonical: "/principles" },
};

type Result = (typeof results)[number];

export default function PrinciplesPage() {
  const groups = results.reduce<Record<string, Result[]>>((acc, r) => {
    (acc[r.group] ??= []).push(r);
    return acc;
  }, {});

  return (
    <DocPage source={readPackageDoc("PRINCIPLES.md")} file="PRINCIPLES.md">
      <section aria-labelledby="gallery-contrast" className="mt-16 border-t border-void-line pt-12">
        <h2 id="gallery-contrast" className="scroll-mt-20 text-2xl font-semibold tracking-tight text-void-ink">
          This site, measured
        </h2>
        <p className="mt-4 text-[15px] leading-[1.7] text-void-muted">
          Principle 4 applies to the gallery too. Every colour pair below is resolved from the same{" "}
          <code className="rounded-md bg-void-raised px-1.5 py-0.5 font-mono text-[0.86em] text-void-ink">tokens.css</code>{" "}
          and measured before each build; a pair under its minimum, or a text colour in the chrome that
          is not on this list, fails the build.
        </p>
        <div className="-mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <caption className="sr-only">Measured contrast of the gallery&rsquo;s colour pairs</caption>
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.18)] text-void-ink">
                <th scope="col" className="py-2 pr-4 font-medium">Where</th>
                <th scope="col" className="py-2 pr-4 font-medium">Pair</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Ratio</th>
                <th scope="col" className="py-2 text-right font-medium">Needs</th>
              </tr>
            </thead>
            {Object.entries(groups).map(([group, rows]) => (
              <tbody key={group}>
                <tr>
                  <th colSpan={4} scope="colgroup" className="pb-1 pt-5 text-left font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-void-muted">
                    {group}
                  </th>
                </tr>
                {rows.map((r) => (
                  <tr key={`${group}-${r.where}`} className="border-b border-void-line">
                    <th scope="row" className="py-2 pr-4 font-normal text-void-ink">
                      {r.where}
                    </th>
                    <td className="py-2 pr-4">
                      <span className="inline-flex items-center gap-2 font-mono text-xs text-void-muted">
                        <span
                          aria-hidden
                          className="grid h-6 w-9 place-items-center rounded border border-void-line text-[11px] font-semibold"
                          style={{ background: r.bg, color: r.fg }}
                        >
                          Aa
                        </span>
                        {r.fg} on {r.bg}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right font-mono tabular-nums text-void-ink">{r.ratio.toFixed(2)}</td>
                    <td className="py-2 text-right font-mono tabular-nums text-void-muted">{r.min}:1</td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </section>
    </DocPage>
  );
}
