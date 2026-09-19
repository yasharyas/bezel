/**
 * The browser half of the rendered contrast gate.
 *
 * Opens every component page (/component/<slug>) in headless Chromium, waits
 * for the live preview to settle, and measures what it paints: every visible
 * text node against its effective background (4.5:1, or 3:1 for large text),
 * and every icon, focus ring and form-control boundary (3:1). The stage's own
 * background is part of the measurement, because it is part of the stack.
 *
 * Writes the record (src/lib/rendered-contrast.json) with a fingerprint of the
 * sources that decide those colours. The build gate
 * (scripts/check-rendered-record.mjs) refuses a record that fails or that no
 * longer matches the sources, so a component cannot change colour without
 * this being run again.
 *
 *   npm run check:rendered -w gallery        reuses `npm run dev` on 3333, or
 *                                            starts its own dev server
 *   npm run check:rendered -w gallery -- --url http://localhost:4000
 *   npm run check:rendered -w gallery -- --only testimonial-card,md3-switch
 *
 * --only measures a subset and --width a single width; neither writes the
 * record. --json <file> also writes the result there.
 *
 * Needs Playwright, which is not a dependency of this repo: install it
 * anywhere and point PLAYWRIGHT_PATH at its package directory, or add
 * `playwright` as a devDependency. Exits non-zero on any failure.
 */
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  RECORD_PATH,
  fingerprint,
  galleryRoot,
  measureInPage,
  repoRoot,
} from "./rendered.mjs";
import { printRecord, summarise } from "./check-rendered-record.mjs";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const only = flag("--only")?.split(",").filter(Boolean);
const write = !args.includes("--no-write") && !only && !flag("--width");
const concurrency = Number(flag("--workers") ?? 4);

/* -------------------------------------------------------------- playwright */

async function loadPlaywright() {
  const tries = [];
  if (process.env.PLAYWRIGHT_PATH) tries.push(pathToFileURL(join(process.env.PLAYWRIGHT_PATH, "index.mjs")).href);
  tries.push("playwright", "playwright-core");
  for (const spec of tries) {
    try {
      const mod = await import(spec);
      return mod.chromium ?? mod.default?.chromium;
    } catch {
      /* next */
    }
  }
  console.error(
    "Playwright was not found. Set PLAYWRIGHT_PATH to an installed playwright package directory,\n" +
      "or add it as a devDependency of the gallery. It is never a dependency of bezel-ui.",
  );
  process.exit(2);
}

/* ------------------------------------------------------------------ server */

const freePort = () =>
  new Promise((resolve, reject) => {
    const s = createServer();
    s.unref();
    s.on("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });

/** The gallery's own dev server (`npm run dev`), if it is already up. */
async function runningDevServer() {
  const url = "http://localhost:3333";
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
    if (res.ok && (await res.text()).includes("Bezel")) return url;
  } catch {
    /* not running */
  }
  return null;
}

async function startServer() {
  // Two `next dev` processes on one .next directory corrupt each other, so a
  // running gallery dev server is reused rather than started alongside.
  const existing = await runningDevServer();
  if (existing) {
    console.log(`Using the dev server already running at ${existing}.`);
    return { url: existing, stop: async () => {} };
  }
  const port = await freePort();
  const nextBin = join(repoRoot, "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextBin, "dev", "--port", String(port)], {
    cwd: galleryRoot,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let log = "";
  child.stdout.on("data", (d) => (log += d));
  child.stderr.on("data", (d) => (log += d));
  const url = `http://localhost:${port}`;
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`next dev exited:\n${log}`);
    if (/Ready in|ready started|Local:/.test(log)) break;
    await new Promise((r) => setTimeout(r, 250));
  }
  return {
    url,
    stop: () =>
      new Promise((resolve) => {
        if (child.exitCode !== null) return resolve();
        child.once("exit", resolve);
        if (process.platform === "win32") spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"]);
        else child.kill("SIGTERM");
      }),
  };
}

/* ------------------------------------------------------------------- specs */

function readSpecs() {
  const source = readFileSync(join(galleryRoot, "src", "previews", "specs.ts"), "utf8");
  const specs = new Map();
  for (const m of source.matchAll(/^\s+"?([a-z0-9-]+)"?:\s+(inline|frame)\(\s*"?(\w+)"?,?\s*"?(\w+)?"?/gm)) {
    specs.set(m[1], { kind: m[2], tone: m[2] === "inline" ? m[4] : m[3] });
  }
  return specs;
}

const slugs = Object.keys(JSON.parse(readFileSync(join(repoRoot, "packages", "registry", "metadata.json"), "utf8")));
const specs = readSpecs();
const targets = only ? slugs.filter((s) => only.includes(s)) : slugs;
if (only && targets.length !== only.length) {
  console.error(`Unknown slug(s): ${only.filter((s) => !slugs.includes(s)).join(", ")}`);
  process.exit(2);
}

/* ----------------------------------------------------------------- measure */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Let entrances finish: fonts, finite CSS/WAAPI animations, then a beat for JS tweens. */
async function settle(target) {
  await target.evaluate(async () => {
    await document.fonts?.ready;
    const finite = document
      .getAnimations()
      .filter((a) => a.playState === "running" && a.effect?.getComputedTiming?.().endTime !== Infinity);
    await Promise.race([Promise.allSettled(finite.map((a) => a.finished)), new Promise((r) => setTimeout(r, 2500))]);
  });
  await sleep(900);
}

const key = (item) => `${item.kind}|${item.element}|${item.text}`;

/** Two samples, so a pair caught mid-transition is recognised as moving. */
function merge(first, second) {
  const later = new Map(second.map((i) => [key(i), i]));
  return first.map((a) => {
    const b = later.get(key(a));
    if (!b || a.ratio === null || b.ratio === null) return a;
    if (Math.abs(a.ratio - b.ratio) < 0.05) return a;
    // Moving: keep the resting state, which is the later one, and say so.
    return { ...b, moving: [Math.min(a.ratio, b.ratio), Math.max(a.ratio, b.ratio)] };
  });
}

async function measureSlug(context, base, slug) {
  const spec = specs.get(slug);
  const page = await context.newPage();
  try {
    await page.goto(`${base}/component/${slug}`, { waitUntil: "load", timeout: 120_000 });
    let target = page;
    let root = 'section[aria-label$="live preview"] .stage-content';
    if (spec.kind === "frame") {
      const handle = await page.waitForSelector('section[aria-label$="live preview"] iframe', { timeout: 60_000 });
      await page.waitForFunction((el) => el.style.opacity === "1", handle, { timeout: 30_000 });
      target = await handle.contentFrame();
      root = "body";
    } else {
      await page.waitForFunction(
        (sel) => {
          const el = document.querySelector(sel);
          if (!el || !el.firstElementChild) return false;
          const box = el.firstElementChild;
          return getComputedStyle(box).visibility !== "hidden" && el.querySelectorAll("*").length > 1;
        },
        root,
        { timeout: 60_000 },
      );
    }
    // The mouse rests off the stage so nothing is hovered.
    await page.mouse.move(2, 2);
    await settle(target);
    const a = await target.evaluate(measureInPage, { root });
    if (a.error) throw new Error(a.error);
    await sleep(700);
    // Keyboard modality, so programmatic focus shows :focus-visible. A frame
    // also ignores focus() until it has seen a key (FrameRuntime's guard).
    await page.keyboard.press("Shift");
    if (spec.kind === "frame") {
      await target.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift" })));
    }
    const b = await target.evaluate(measureInPage, { root, focus: true });
    const focus = b.items.filter((i) => i.kind === "focus");
    const paint = b.items.filter((i) => i.kind !== "focus");
    return {
      slug,
      kind: spec.kind,
      tone: spec.tone,
      counts: a.counts,
      items: [...merge(a.items, paint), ...focus],
    };
  } finally {
    await page.close();
  }
}

/* -------------------------------------------------------------------- main */

// Desktop, then a phone. Frame previews render at their own virtual viewport
// whatever the page width, so the phone pass only revisits inline previews,
// where viewport breakpoints can change what is painted.
const widths = flag("--width") ? [Number(flag("--width"))] : [1440, 390];

async function measureAll(browser, base, width, slugs) {
  const context = await browser.newContext({
    viewport: { width, height: 1400 },
    reducedMotion: "reduce",
    deviceScaleFactor: 1,
  });
  const out = [];
  const queue = [...slugs];
  const one = async (slug) => {
    for (let attempt = 1; ; attempt++) {
      try {
        return await measureSlug(context, base, slug);
      } catch (error) {
        const spec = specs.get(slug);
        if (attempt === 2) return { slug, kind: spec.kind, tone: spec.tone, items: [], failed: String(error.message || error).split("\n")[0] };
      }
    }
  };
  try {
    // One page first, so a cold dev server compiles the route once.
    if (queue.length) out.push(await one(queue.shift()));
    await Promise.all(
      Array.from({ length: concurrency }, async () => {
        while (queue.length) out.push(await one(queue.shift()));
      }),
    );
  } finally {
    await context.close();
  }
  process.stdout.write(`measured ${out.length} previews at ${width}px\n`);
  return out;
}

/**
 * One entry per component. Identical pairs on one page (a row of chips, the
 * letters of a word) are listed once with a count, and a pair seen at several
 * widths is listed once; `at` names the widths only when some width missed it.
 */
function combine(passes) {
  const bySlug = new Map();
  const key = (i) => [i.kind, i.element, i.status, i.fg, i.bg, i.min, i.why, i.bound].join("|");
  for (const { width, results } of passes) {
    for (const r of results) {
      let c = bySlug.get(r.slug);
      if (!c) bySlug.set(r.slug, (c = { slug: r.slug, kind: r.kind, tone: r.tone, keys: new Map() }));
      // Text nodes found, and how many were not showing (hidden, faded out,
      // clipped or off the stage), from the first width.
      if (width === widths[0] && r.counts) c.textNodes = r.counts;
      if (r.failed) c.failed = `${width}px: ${r.failed}`;
      const here = new Map();
      for (const item of r.items) {
        const k = key(item);
        const seen = here.get(k);
        if (seen) seen.n++;
        else here.set(k, { item, n: 1 });
      }
      for (const [k, { item, n }] of here) {
        const entry = c.keys.get(k);
        if (entry) {
          entry.at.push(width);
          entry.n = Math.max(entry.n ?? 1, n);
        } else {
          c.keys.set(k, { ...item, ...(n > 1 ? { n } : {}), at: [width] });
        }
      }
    }
  }
  return targets.filter((s) => bySlug.has(s)).map((s) => {
    const { keys, ...c } = bySlug.get(s);
    const expected = c.kind === "inline" ? widths.length : 1;
    c.items = [...keys.values()].map((item) => {
      if (item.n === 1) delete item.n;
      if (item.at.length === expected) delete item.at;
      return item;
    });
    return c;
  });
}

/** Readable diffs: one line per measured pair. */
function serialise(record) {
  const lines = [
    "{",
    `  "fingerprint": ${JSON.stringify(record.fingerprint)},`,
    `  "measuredWith": ${JSON.stringify(record.measuredWith)},`,
    '  "components": [',
  ];
  record.components.forEach((c, i) => {
    const { items, ...head } = c;
    lines.push(`    ${JSON.stringify(head).slice(0, -1)}, "items": [`);
    items.forEach((item, j) => lines.push(`      ${JSON.stringify(item)}${j < items.length - 1 ? "," : ""}`));
    lines.push(`    ]}${i < record.components.length - 1 ? "," : ""}`);
  });
  lines.push("  ]", "}", "");
  return lines.join("\n");
}

const started = Date.now();
const chromium = await loadPlaywright();
const server = flag("--url") ? { url: flag("--url").replace(/\/$/, ""), stop: async () => {} } : await startServer();
const browser = await chromium.launch();
const passes = [];
try {
  for (const width of widths) {
    const slugs = width === widths[0] ? targets : targets.filter((s) => specs.get(s).kind === "inline");
    passes.push({ width, results: await measureAll(browser, server.url, width, slugs) });
  }
} finally {
  await browser.close();
  await server.stop();
}

const seconds = Math.round((Date.now() - started) / 1000);
const record = {
  fingerprint: fingerprint().hash,
  measuredWith: `Chromium at ${widths.map((w) => `${w}px`).join(" and ")} wide (inline previews at each; frames once), prefers-reduced-motion: reduce`,
  components: combine(passes),
};

if (flag("--json")) writeFileSync(flag("--json"), serialise(record));
if (write) writeFileSync(RECORD_PATH, serialise(record));

const failures = printRecord(record);
console.log(`\n${summarise(record)}. Measured in ${seconds}s.`);
if (write) console.log(`Record written to ${RECORD_PATH.slice(repoRoot.length + 1).split("\\").join("/")}.`);
process.exit(failures ? 1 : 0);
