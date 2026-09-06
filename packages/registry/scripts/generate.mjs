/**
 * Generates `src/index.ts` from the real component sources.
 *
 * The registry ships each component's source as a `code:` string so the gallery
 * can offer a copy-paste panel. Those strings used to be maintained by hand,
 * which meant every edit under `packages/ui/src` had to be mirrored here — and
 * eventually was not: a focus-visible pass landed in the components while the
 * registry kept serving the pre-focus-ring copies.
 *
 * So the source files are the single source of truth for `code` and `path`.
 * Everything a file cannot tell us — the prose `prompt`, the `tags`, the
 * `category`, and the exact `slug` spelling — lives in `metadata.json`, keyed
 * by slug. Slugs are deliberately not derived from names: `TubelightNavBar` is
 * published at `tubelight-navbar`, not `tubelight-nav-bar`, and those URLs must
 * not move. Entry order follows `metadata.json` key order, which is the order
 * the gallery lists components in.
 *
 * A component is matched to its metadata by file name, so adding a component
 * means adding a `metadata.json` entry whose `name` is the file's base name.
 * Anything unmatched in either direction is a hard error rather than a silent
 * omission.
 *
 *   npm run generate -w @bezel/registry        rewrite src/index.ts
 *   npm run check:registry -w @bezel/registry  fail if src/index.ts is stale
 *
 * Exits non-zero on any failure.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, sep } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const uiSrc = join(root, "..", "ui", "src");
const outFile = join(root, "src", "index.ts");
const metaFile = join(root, "metadata.json");

const check = process.argv.includes("--check");

/* ---------------------------------------------------------------- sources */

/** Every `.tsx` under `packages/ui/src`, as a posix path relative to that dir. */
function componentFiles(dir = uiSrc) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...componentFiles(full));
    else if (entry.name.endsWith(".tsx")) {
      out.push(relative(uiSrc, full).split(sep).join("/"));
    }
  }
  return out.sort();
}

const baseName = (path) => path.slice(path.lastIndexOf("/") + 1, -".tsx".length);

const files = componentFiles();
const fileByName = new Map();
const duplicateNames = [];
for (const path of files) {
  const name = baseName(path);
  if (fileByName.has(name)) duplicateNames.push(`${name}: ${fileByName.get(name)} and ${path}`);
  else fileByName.set(name, path);
}

/* --------------------------------------------------------------- metadata */

const metadata = JSON.parse(readFileSync(metaFile, "utf8"));

const problems = [...duplicateNames.map((d) => `Two components share a file name — ${d}`)];
const claimed = new Set();
const entries = [];

for (const [slug, meta] of Object.entries(metadata)) {
  if (!meta.name) {
    problems.push(`metadata.json entry "${slug}" has no name.`);
    continue;
  }
  const path = fileByName.get(meta.name);
  if (!path) {
    problems.push(`metadata.json lists "${slug}" (${meta.name}) but no ${meta.name}.tsx exists under packages/ui/src.`);
    continue;
  }
  claimed.add(path);
  entries.push({ slug, meta, path });
}

for (const path of files) {
  if (!claimed.has(path)) {
    problems.push(`${path} has no metadata.json entry — add one keyed by slug with "name": "${baseName(path)}".`);
  }
}

if (problems.length) {
  console.error("Registry metadata is out of sync with packages/ui/src:\n");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(2);
}

/* ---------------------------------------------------------------- emitting */

/** Escape a source file so it survives being embedded in a template literal. */
function templateLiteral(code) {
  return code
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");
}

/** Read a component, normalised to LF so output does not depend on checkout style. */
function readComponent(path) {
  return readFileSync(join(uiSrc, path), "utf8").replace(/\r\n/g, "\n").trimEnd();
}

const str = (value) => JSON.stringify(value);

function renderEntry({ slug, meta, path }) {
  const lines = [
    "  {",
    `    name: ${str(meta.name)},`,
    `    slug: ${str(slug)},`,
    `    path: ${str(path)},`,
  ];
  if (meta.category) lines.push(`    category: ${str(meta.category)},`);
  lines.push(`    code: \`${templateLiteral(readComponent(path))}\`,`);
  lines.push(`    prompt: ${str(meta.prompt ?? "")},`);
  lines.push(`    tags: [${(meta.tags ?? []).map(str).join(", ")}],`);
  lines.push("  },");
  return lines.join("\n");
}

const output = `// GENERATED FILE — do not edit by hand.
// Run \`npm run generate -w @bezel/registry\` after changing a component.
// Source of truth: packages/ui/src for code, metadata.json for everything else.

export interface ComponentEntry {
  name: string;
  slug: string;
  path: string;
  code: string;
  prompt: string;
  tags: string[];
  category?: string;
}

export const registry: ComponentEntry[] = [
${entries.map(renderEntry).join("\n")}
];

export function getComponent(slug: string): ComponentEntry | undefined {
  return registry.find((c) => c.slug === slug);
}

export function getAllComponents(): ComponentEntry[] {
  return registry;
}
`;

/* ----------------------------------------------------------------- output */

const current = (() => {
  try {
    return readFileSync(outFile, "utf8").replace(/\r\n/g, "\n");
  } catch {
    return null;
  }
})();

if (check) {
  if (current === output) {
    console.log(`src/index.ts is up to date (${entries.length} components).`);
    process.exit(0);
  }
  console.error(
    "src/index.ts does not match a fresh generation.\n" +
      "Run `npm run generate -w @bezel/registry` and commit the result.",
  );
  process.exit(1);
}

if (current === output) {
  console.log(`src/index.ts already up to date (${entries.length} components).`);
} else {
  writeFileSync(outFile, output, "utf8");
  console.log(`Wrote src/index.ts (${entries.length} components).`);
}
