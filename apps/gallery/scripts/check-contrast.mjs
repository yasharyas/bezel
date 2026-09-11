/**
 * The gallery's contrast gate. bezel-ui gates its tokens; this gates the page
 * people actually look at.
 *
 * 1. Measures every pair in scripts/contrast.mjs against its WCAG minimum.
 * 2. Scans the gallery chrome (src/app, src/components, src/lib) for text
 *    colours that are not one of the measured token colours, so a new class
 *    cannot bypass the measurement. Preview modules are exempt: they
 *    demonstrate components, which carry their own colours.
 *
 *   npm run check:contrast -w gallery
 *
 * Exits non-zero on any failure.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { TEXT_COLOURS, measure } from "./contrast.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let failures = 0;

console.log("\n== Gallery contrast (WCAG 2.2 AA) ==\n");
const results = measure();
let group = "";
for (const r of results) {
  if (r.group !== group) {
    group = r.group;
    console.log(`  ${group}`);
  }
  if (!r.pass) failures++;
  console.log(
    `  ${r.pass ? "  pass" : "  FAIL"}  ${r.where.padEnd(46)} ${r.fgHex} on ${r.bgHex}  ${r.ratio.toFixed(2).padStart(5)}  (min ${r.min})`,
  );
}

/* ------------------------------------------------ unmeasured text colours */

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(tsx?|jsx?)$/.test(name)) files.push(full);
  }
};
for (const dir of ["src/app", "src/components", "src/lib"]) walk(join(root, dir));

const allowed = new Set(TEXT_COLOURS);
const stray = [];
for (const file of files) {
  const rel = relative(root, file).split(sep).join("/");
  if (rel.includes("/(frame)/")) continue;
  const source = readFileSync(file, "utf8");
  for (const m of source.matchAll(/(?<![\w-])(?:[a-z-]+:)*(?:text|placeholder:text)-([a-z]+(?:-[a-z0-9]+)*(?:\/\d+)?|\[[^\]]+\])/g)) {
    const value = m[1];
    // Size, alignment and wrapping utilities share the text- prefix.
    if (/^(xs|sm|base|lg|xl|\d?xl|left|right|center|justify|start|end|wrap|nowrap|balance|pretty|ellipsis|clip)$/.test(value)) continue;
    if (/^\[\d/.test(value) || /^\[\d*\.?\d+(px|rem|em)\]$/.test(value)) continue;
    if (allowed.has(value)) continue;
    stray.push(`${rel}: ${m[0]}`);
  }
}

console.log("\n-- text colours outside the measured set --");
if (stray.length) {
  failures += stray.length;
  for (const s of stray) console.log(`  FAIL  ${s}`);
  console.log(`  Use one of: ${TEXT_COLOURS.map((c) => `text-${c}`).join(", ")}`);
} else {
  console.log(`  pass  chrome uses only ${TEXT_COLOURS.map((c) => `text-${c}`).join(", ")}`);
}

/* ------------------------------------------------------------- the record */

// The Principles page renders this file, so the site shows the numbers the
// build checked. Written only when a value changed.
const record = `${JSON.stringify(
  results.map(({ group, where, fgHex, bgHex, ratio, min, pass }) => ({ group, where, fg: fgHex, bg: bgHex, ratio, min, pass })),
  null,
  2,
)}\n`;
const recordPath = join(root, "src", "lib", "contrast-results.json");
let previous = "";
try {
  previous = readFileSync(recordPath, "utf8").replace(/\r\n/g, "\n");
} catch {
  /* first run */
}
if (previous !== record) writeFileSync(recordPath, record);

console.log(failures ? `\n${failures} problem(s).` : "\nAll gallery pairs pass.");
process.exit(failures ? 1 : 0);
