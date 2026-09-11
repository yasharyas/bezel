/**
 * Fails if any component in the registry has no preview, or if a preview
 * points at something that does not exist.
 *
 * The gallery once kept two preview maps, one per route, and 67 of 107
 * component pages rendered "No preview available". There is now one map
 * (src/previews/specs.ts); this check keeps it complete.
 *
 *   npm run check:previews -w gallery
 *
 * Exits non-zero on any failure.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

const slugs = Object.keys(
  JSON.parse(readFileSync(join(root, "..", "..", "packages", "registry", "metadata.json"), "utf8")),
);

const specsSource = read("src/previews/specs.ts");
const specs = new Map();
for (const m of specsSource.matchAll(/^\s+"?([a-z0-9-]+)"?:\s+(inline|frame)\(\s*"?(\w+)"?/gm)) {
  specs.set(m[1], { kind: m[2], group: m[2] === "inline" ? m[3] : null });
}

const groupKeys = (group) => {
  const file = `src/previews/inline/${group}.tsx`;
  if (!existsSync(join(root, file))) return null;
  const source = read(file);
  const start = source.indexOf("export const previews");
  const block = source.slice(start, source.indexOf("};", start));
  return new Set([...block.matchAll(/^\s+"?([a-z0-9-]+)"?:\s+\w+,?$/gm)].map((m) => m[1]));
};

const loadSource = read("src/previews/load.ts");
const frameModules = new Set([...loadSource.matchAll(/"?([a-z0-9-]+)"?:\s+\(\)\s+=>\s+import\("\.\/frames\//g)].map((m) => m[1]));

const problems = [];
const groups = new Map();

for (const slug of slugs) {
  const spec = specs.get(slug);
  if (!spec) {
    problems.push(`${slug} is in the registry but has no entry in src/previews/specs.ts`);
    continue;
  }
  if (spec.kind === "inline") {
    if (!groups.has(spec.group)) groups.set(spec.group, groupKeys(spec.group));
    const keys = groups.get(spec.group);
    if (!keys) problems.push(`${slug} names inline group "${spec.group}", which does not exist`);
    else if (!keys.has(slug)) problems.push(`${slug} is missing from src/previews/inline/${spec.group}.tsx`);
  } else {
    if (!frameModules.has(slug)) problems.push(`${slug} is a frame preview with no loader in src/previews/load.ts`);
    if (!existsSync(join(root, `src/previews/frames/${slug}.tsx`))) {
      problems.push(`${slug} is a frame preview with no src/previews/frames/${slug}.tsx`);
    }
  }
}

for (const slug of specs.keys()) {
  if (!slugs.includes(slug)) problems.push(`src/previews/specs.ts lists ${slug}, which is not in the registry`);
}

if (problems.length) {
  console.error("Preview coverage is incomplete:\n");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

const frames = [...specs.values()].filter((s) => s.kind === "frame").length;
console.log(`Every component has a preview: ${slugs.length} total, ${slugs.length - frames} inline, ${frames} in frames.`);
