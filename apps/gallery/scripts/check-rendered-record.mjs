/**
 * The build half of the rendered contrast gate. No browser needed.
 *
 * scripts/check-rendered.mjs measures every component preview in Chromium and
 * writes src/lib/rendered-contrast.json. This refuses the build when:
 *
 * - any gated pair in that record is under its WCAG AA minimum, or
 * - the record's fingerprint no longer matches the sources that decide what
 *   the previews paint (components, tokens, previews, stage styles and the
 *   measuring code), so the numbers describe a gallery that no longer exists.
 *
 * Every pair is printed with its ratio.
 *
 *   node scripts/check-rendered-record.mjs
 *
 * Exits non-zero on any failure.
 */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { RECORD_PATH, fingerprint } from "./rendered.mjs";

/** Pairs that count towards the gate. Decorative, disabled and unmeasurable ones are reported. */
export const gated = (item) => item.status === "measured";
export const failing = (item) => gated(item) && item.ratio < item.min;

const KIND = { text: "text", icon: "icon", focus: "focus ring", boundary: "boundary" };

/** Collapse identical pairs within a component to one line each. */
function lines(component) {
  const groups = new Map();
  for (const item of component.items) {
    const k = [item.status, item.kind, item.element, item.fg, item.bg, item.min, item.why, item.at, item.bound].join("|");
    const g = groups.get(k);
    if (g) g.count += item.n ?? 1;
    else groups.set(k, { ...item, count: item.n ?? 1 });
  }
  const order = { measured: 0, decorative: 1, disabled: 2, exempt: 3, unmeasurable: 4 };
  return [...groups.values()].sort(
    (a, b) => order[a.status] - order[b.status] || (a.ratio ?? 99) - (b.ratio ?? 99),
  );
}

export function printRecord(record) {
  let failures = 0;
  console.log("\n== Rendered contrast (every component preview, WCAG 2.2 AA) ==");
  for (const component of record.components) {
    console.log(`\n  ${component.slug} (${component.kind}, ${component.tone} stage)`);
    if (component.failed) {
      failures++;
      console.log(`    FAIL  could not be measured at ${component.failed}`);
    }
    for (const line of lines(component)) {
      const n = line.count > 1 ? ` x${line.count}` : "";
      const at = line.at ? ` (${line.at.map((w) => `${w}px`).join(", ")} only)` : "";
      const what = `${KIND[line.kind]} ${line.element}${line.text ? ` "${line.text}"` : ""}${n}${at}`;
      if (line.status === "measured") {
        const fail = line.ratio < line.min;
        if (fail) failures += line.count;
        const moving = line.moving ? `  moving ${line.moving[0]}-${line.moving[1]}` : "";
        const bound = line.bound ? `  [${line.bound}]` : "";
        console.log(
          `    ${fail ? "FAIL" : "pass"}  ${line.fg} on ${line.bg}  ${line.ratio.toFixed(2).padStart(5)}  (min ${line.min})  ${what}${moving}${bound}`,
        );
      } else if (line.status === "unmeasurable") {
        console.log(`    n/m   not measurable (${line.why})  ${what}`);
      } else {
        const ratio = line.ratio === null ? "     " : line.ratio.toFixed(2).padStart(5);
        const colours = line.fg ? `${line.fg} on ${line.bg}` : "                  ";
        const why = line.status === "exempt" ? line.why : line.status;
        console.log(`    note  ${colours}  ${ratio}  ${why}, not gated  ${what}`);
      }
    }
  }
  return failures;
}

export function summarise(record) {
  const items = record.components.flatMap((c) => c.items);
  const count = (f) => items.filter(f).reduce((t, i) => t + (i.n ?? 1), 0);
  const failed = count(failing);
  return [
    `${record.components.length} component${record.components.length === 1 ? "" : "s"}`,
    `${count(gated)} gated pairs, ${failed} failing`,
    `${count((i) => i.status === "decorative")} decorative`,
    `${count((i) => i.status === "disabled")} disabled`,
    `${count((i) => i.status === "exempt")} exempt`,
    `${count((i) => i.status === "unmeasurable")} not measurable`,
  ].join(", ");
}

function main() {
  let record;
  try {
    record = JSON.parse(readFileSync(RECORD_PATH, "utf8"));
  } catch {
    console.error("\nNo rendered contrast record. Run `npm run check:rendered -w gallery` and commit the result.");
    process.exit(1);
  }
  const failures = printRecord(record);
  const now = fingerprint();
  let stale = false;
  console.log("\n-- record freshness --");
  if (record.fingerprint !== now.hash) {
    stale = true;
    console.log(
      `  FAIL  measured against ${record.fingerprint}, sources are now ${now.hash} (${now.files} files).\n` +
        "        A component, preview, token or stage style changed since the browser run.\n" +
        "        Run `npm run check:rendered -w gallery` and commit src/lib/rendered-contrast.json.",
    );
  } else {
    console.log(`  pass  record matches the sources (${now.hash}, ${now.files} files)`);
  }
  console.log(`\n${summarise(record)}.`);
  const problems = failures + (stale ? 1 : 0);
  console.log(problems ? `${problems} problem(s).` : "All rendered pairs pass.");
  process.exit(problems ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
