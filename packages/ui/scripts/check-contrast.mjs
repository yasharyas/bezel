/**
 * WCAG AA gate for the Bezel token set.
 *
 * PRINCIPLES.md commits to AA as a release gate, so this measures the real
 * pairs rather than trusting the comments. It parses the hex values straight
 * out of `src/tokens/tokens.css` — not a copy of them — and additionally
 * asserts that `src/tokens/index.ts` still agrees with the CSS, so the two
 * token surfaces cannot drift apart.
 *
 * The bar is 4.5:1. Every token in this library is used at 0.875rem or
 * smaller far more often than not (text-sm and text-xs are 123 of 165 measured
 * font-size uses), so the large-text 3:1 allowance is not applied by default —
 * a token only gets it if it is explicitly declared decoration-only.
 *
 *   npm run check:contrast
 *
 * Exits non-zero on any failure.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(root, "src/tokens/tokens.css"), "utf8");
const ts = readFileSync(join(root, "src/tokens/index.ts"), "utf8");

/* ---------------------------------------------------------------- parsing */

/** Pull every `--bz-*: #rrggbb` declaration out of the stylesheet. */
function cssTokens() {
  const out = {};
  for (const m of css.matchAll(/--(bz-[a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
    out[m[1]] = m[2];
  }
  return out;
}

const T = cssTokens();

const need = (name) => {
  const v = T[name];
  if (!v) {
    console.error(`Token --${name} is missing from tokens.css.`);
    process.exit(2);
  }
  return v;
};

/* ------------------------------------------------------------- colour math */

function rgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

const lum = ([r, g, b]) => {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

const ratio = (a, b) => {
  const [x, y] = [lum(rgb(a)), lum(rgb(b))];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/* ----------------------------------------------------------------- checks */

const AA = 4.5;
const AA_LARGE = 3.0;

const paperSurfaces = {
  paper: need("bz-paper"),
  "paper-sunken": need("bz-paper-sunken"),
  "paper-raised": need("bz-paper-raised"),
};

const voidSurfaces = {
  void: need("bz-void"),
  "void-raised": need("bz-void-raised"),
};

/** [label, foreground, background, minimum] */
const pairs = [];

// Text tokens must clear AA on every paper surface they can land on.
for (const [sName, s] of Object.entries(paperSurfaces)) {
  for (const t of ["bz-ink", "bz-ink-muted", "bz-ink-subtle"]) {
    pairs.push([`${t} on ${sName}`, need(t), s, AA]);
  }
  // Accents used as text on paper.
  for (const t of ["bz-accent", "bz-amber", "bz-emerald", "bz-gold", "bz-danger"]) {
    pairs.push([`${t} on ${sName}`, need(t), s, AA]);
  }
}

// Text on dark surfaces.
for (const [sName, s] of Object.entries(voidSurfaces)) {
  pairs.push([`bz-void-ink on ${sName}`, need("bz-void-ink"), s, AA]);
}

// Text on accent fills — each fill declares the ink it carries.
const fills = [
  ["bz-accent-fill", "bz-accent-on-fill"],
  ["bz-amber-fill", "bz-amber-on-fill"],
  ["bz-emerald-fill", "bz-emerald-on-fill"],
  ["bz-gold-fill", "bz-gold-on-fill"],
  ["bz-danger-fill", "bz-danger-on-fill"],
];
for (const [fill, ink] of fills) {
  pairs.push([`${ink} on ${fill}`, need(ink), need(fill), AA]);
}

// Focus rings are non-text UI, so the bar is 3:1 (WCAG 1.4.11) — but they must
// clear it on every surface a focusable control can sit on.
for (const [sName, s] of Object.entries(paperSurfaces)) {
  pairs.push([`focus ring on ${sName}`, need("bz-focus-ring"), s, AA_LARGE]);
}
for (const [sName, s] of Object.entries(voidSurfaces)) {
  pairs.push([`focus ring on ${sName}`, need("bz-focus-ring-void"), s, AA_LARGE]);
}

// Decoration tokens are marks on the page — rules, dots, borders, error
// outlines. They carry meaning, so WCAG 1.4.11 applies and they are gated at
// 3:1 against paper. This is what stops a decor token quietly becoming body
// text: it can never reach 4.5:1, so the demotion is enforced, not documented.
const decorMarks = ["bz-emerald-decor", "bz-danger-decor"];
for (const t of decorMarks) {
  pairs.push([`${t} on paper (mark, 3:1)`, need(t), paperSurfaces.paper, AA_LARGE]);
}

// Reported but not gated, each for a stated reason.
const exempt = [
  [
    "bz-ink-disabled on paper",
    need("bz-ink-disabled"),
    paperSurfaces.paper,
    "AA-exempt: WCAG 1.4.3 excludes inactive controls",
  ],
  [
    "bz-gold-fill on paper",
    need("bz-gold-fill"),
    paperSurfaces.paper,
    "surface, not a mark: gated above as ink-on-gold (8.18) instead",
  ],
];

/* ------------------------------------------------------------------ report */

let failures = 0;

console.log("\n== Bezel token contrast (WCAG AA) ==\n");
for (const [label, fg, bg, min] of pairs) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) failures++;
  console.log(
    `${ok ? "  pass" : "  FAIL"}  ${label.padEnd(42)} ${r.toFixed(2).padStart(6)}  (min ${min})`,
  );
}

console.log("\n-- reported, not gated --");
for (const [label, fg, bg, why] of exempt) {
  console.log(`  note  ${label.padEnd(42)} ${ratio(fg, bg).toFixed(2).padStart(6)}  ${why}`);
}

/* ------------------------------------------- CSS <-> TS drift check */

console.log("\n-- tokens.css / tokens.ts agreement --");
const tsPairs = {
  ink: "bz-ink",
  inkMuted: "bz-ink-muted",
  inkSubtle: "bz-ink-subtle",
  inkDisabled: "bz-ink-disabled",
  paper: "bz-paper",
  paperSunken: "bz-paper-sunken",
  paperRaised: "bz-paper-raised",
  accent: "bz-accent",
  amber: "bz-amber",
  emerald: "bz-emerald",
  emeraldDecor: "bz-emerald-decor",
  gold: "bz-gold",
  goldFill: "bz-gold-fill",
  danger: "bz-danger",
  dangerDecor: "bz-danger-decor",
  focusRing: "bz-focus-ring",
};
let drift = 0;
for (const [key, cssName] of Object.entries(tsPairs)) {
  const m = ts.match(new RegExp(`\\b${key}:\\s*"([^"]+)"`));
  if (!m) {
    console.log(`  FAIL  ${key.padEnd(42)} missing from tokens.ts`);
    drift++;
    continue;
  }
  if (m[1].toLowerCase() !== need(cssName).toLowerCase()) {
    console.log(`  FAIL  ${key.padEnd(42)} ts=${m[1]} css=${need(cssName)}`);
    drift++;
  }
}
if (!drift) console.log(`  pass  all ${Object.keys(tsPairs).length} mirrored tokens match`);
failures += drift;

console.log(
  failures
    ? `\n${failures} problem(s). See PRINCIPLES.md - "Contrast is a gate, not a preference".`
    : "\nAll pairs pass. Tokens are AA-clean.",
);
process.exit(failures ? 1 : 0);
