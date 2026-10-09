/*
 * Writes src/lib/lastmod.json: the date each component's source file last changed in git, for the
 * sitemap's <lastmod>. Search engines only trust lastmod when it tracks real edits, so this reads
 * commit dates rather than stamping every URL with the build time. Run it from apps/gallery after
 * changing a component (npm run lastmod); a component missing from the file falls back to the
 * newest date in it.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../../..");
const uiSrc = join(root, "packages/ui/src");
const metadata = JSON.parse(readFileSync(join(root, "packages/registry/metadata.json"), "utf8"));

const files = new Map();
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".tsx")) files.set(basename(entry.name, ".tsx"), full);
  }
})(uiSrc);

const gitDate = (path) =>
  execFileSync("git", ["log", "-1", "--format=%cI", "--", relative(root, path)], { cwd: root, encoding: "utf8" }).trim();

const out = {};
for (const [slug, meta] of Object.entries(metadata)) {
  const file = files.get(meta.name);
  const date = file && gitDate(file);
  if (date) out[slug] = date.slice(0, 10);
}
const pages = ["apps/gallery/src/app/(site)/page.tsx", "apps/gallery/src/app/(site)/principles/page.tsx", "apps/gallery/src/app/(site)/states/page.tsx"];
out["/"] = [gitDate(join(root, pages[0])), ...Object.values(out)].map((d) => d.slice(0, 10)).sort().pop();
out["/principles"] = gitDate(join(root, pages[1])).slice(0, 10);
out["/states"] = gitDate(join(root, pages[2])).slice(0, 10);

writeFileSync(join(here, "../src/lib/lastmod.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`lastmod.json: ${Object.keys(out).length} entries, newest ${out["/"]}`);
