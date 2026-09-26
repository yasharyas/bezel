import { catalog, categories } from "@/lib/catalog";
import { GITHUB_URL, NPM_URL, SITE_URL } from "@/lib/site";

// Built once at deploy time from the registry, so it can never list a
// component the gallery does not have.
export const dynamic = "force-static";

export function GET() {
  const lines: string[] = [
    "# Bezel",
    "",
    "> A React component library for interfaces that need motion and craft. Components ship as readable TypeScript source that you copy into your project and own. Every colour pair is measured against WCAG AA before release, and motion respects prefers-reduced-motion.",
    "",
    "## Install",
    "",
    "- Package: `npm i bezel-ui`",
    "- Copy one component's source into your project: `npx bezel-add add <slug>`",
    `- [npm](${NPM_URL})`,
    `- [Source on GitHub](${GITHUB_URL})`,
    "",
    "## Docs",
    "",
    `- [Gallery](${SITE_URL}): live preview of every component`,
    `- [Principles](${SITE_URL}/principles): the rules the library is built to, with where they do not hold yet`,
    `- [States](${SITE_URL}/states): default, hover, focus, active and disabled coverage for each component`,
    "",
  ];

  for (const category of categories) {
    const entries = catalog.filter((entry) => entry.category === category.id);
    if (!entries.length) continue;
    lines.push(`## ${category.label}`, "");
    for (const entry of entries) {
      lines.push(`- [${entry.name}](${SITE_URL}/component/${entry.slug}): ${entry.description} Slug: \`${entry.slug}\``);
    }
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
