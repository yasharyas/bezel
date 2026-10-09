import { catalog, categories, categoryLabel } from "@/lib/catalog";
import copy from "@/lib/component-copy.json";
import { GITHUB_URL, NPM_URL, SITE_URL } from "@/lib/site";

// The long companion to llms.txt: every component with its full About text, its key props and
// how to install it, so an assistant can answer "which component does X and how do I use it"
// from one file. Built once at deploy time from the same registry as the gallery.
export const dynamic = "force-static";

const about = copy as Record<string, { about: string; keyProps: string }>;

export function GET() {
  const lines: string[] = [
    "# Bezel",
    "",
    "> A React component library for interfaces that need motion and craft. Components ship as readable TypeScript source that you copy into your project and own. Every colour pair is measured against WCAG AA before release, and motion respects prefers-reduced-motion.",
    "",
    "## Using Bezel",
    "",
    "- Install the package: `npm i bezel-ui`, then import a component: `import { GlyphField } from \"bezel-ui\"`.",
    "- Or copy a single component's source into your project: `npx bezel-add add <slug>`. Each component is one .tsx file, and every file except MultiStepLoader works on its own.",
    "- Peer dependencies: react and react-dom 18 or 19, and lucide-react. Some components also use motion, gsap, three, canvas-confetti or rough-notation, and some are styled with Tailwind utility classes; each component's page shows its full source.",
    `- Gallery with a live preview of every component: ${SITE_URL}`,
    `- npm: ${NPM_URL}`,
    `- Source: ${GITHUB_URL}`,
    "",
  ];

  for (const category of categories) {
    const entries = catalog.filter((entry) => entry.category === category.id);
    if (!entries.length) continue;
    lines.push(`## ${category.label}`, "");
    for (const entry of entries) {
      const extra = about[entry.slug];
      lines.push(`### ${entry.name}`, "");
      lines.push(`${entry.description}`, "");
      if (extra?.about) lines.push(extra.about, "");
      if (extra?.keyProps) lines.push(`Key props: ${extra.keyProps}`, "");
      lines.push(
        `- Category: ${categoryLabel(entry.category)}`,
        `- Install: \`npx bezel-add add ${entry.slug}\` or \`import { ${entry.name} } from "bezel-ui"\``,
        `- Live preview: ${SITE_URL}/component/${entry.slug}`,
        "",
      );
    }
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
