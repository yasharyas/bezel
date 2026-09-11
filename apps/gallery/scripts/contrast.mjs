/**
 * Colour pairs the gallery actually paints, measured against WCAG 2.2.
 *
 * Colours are never restated here. A pair names a Tailwind colour key from
 * tailwind.config.js (which points at a --bz-* token) or a --bz-* token
 * directly, and both are resolved from bezel-ui's tokens.css at run time. The
 * stage tone channels are read from src/app/globals.css. Change a token and
 * this re-measures; change a class to a colour that is not declared here and
 * check-contrast.mjs refuses it.
 *
 * Shared by scripts/check-contrast.mjs (the build gate) and the Principles
 * page, which renders these results.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

/* ---------------------------------------------------------------- colours */

function parseColor(value) {
  const v = value.trim();
  let m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v);
  if (m) {
    const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).concat(1);
  }
  m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?\s*\)$/i.exec(v);
  if (m) return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
  m = /^(\d+)\s+(\d+)\s+(\d+)$/.exec(v);
  if (m) return [+m[1], +m[2], +m[3], 1];
  throw new Error(`Cannot parse colour "${value}"`);
}

const over = (fg, bg) => {
  const a = fg[3];
  return [0, 1, 2].map((i) => Math.round(fg[i] * a + bg[i] * (1 - a))).concat(1);
};

const luminance = ([r, g, b]) => {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

export const ratio = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

export const hex = ([r, g, b]) => `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;

/* ---------------------------------------------------------------- sources */

export function loadTokens() {
  const css = readFileSync(join(root, "..", "..", "packages", "ui", "src", "tokens", "tokens.css"), "utf8");
  const tokens = {};
  for (const m of css.matchAll(/--(bz-[a-z0-9-]+):\s*([^;]+);/g)) tokens[m[1]] = m[2].trim();
  return tokens;
}

export function loadConfigColors() {
  const config = require(join(root, "tailwind.config.js"));
  const flat = {};
  const walk = (obj, prefix) => {
    for (const [key, value] of Object.entries(obj)) {
      const name = key === "DEFAULT" ? prefix : prefix ? `${prefix}-${key}` : key;
      if (typeof value === "string") flat[name] = value;
      else walk(value, name);
    }
  };
  walk(config.theme.extend.colors, "");
  return flat;
}

export function loadToneChannels() {
  const css = readFileSync(join(root, "src", "app", "globals.css"), "utf8");
  const tones = {};
  for (const m of css.matchAll(/((?:\.tone-[a-z]+,?\s*)+)\{([^}]*)\}/g)) {
    const names = [...m[1].matchAll(/\.tone-([a-z]+)/g)].map((n) => n[1]);
    for (const decl of m[2].matchAll(/--([a-z-]+):\s*([^;]+);/g)) {
      for (const n of names) (tones[n] ??= {})[decl[1]] = decl[2].replace(/\/\*.*?\*\//g, "").trim();
    }
  }
  return tones;
}

/* ----------------------------------------------------------------- pairs */

/**
 * `fg` and `bg` accept: a Tailwind colour key ("void-muted"), a token
 * ("--bz-void"), a tone channel ("tone:paper:muted-foreground"), or a literal
 * used for a translucent layer ("rgba(255,255,255,0.10)"). A translucent
 * `bg` is flattened over the `on` layers (nearest first). A translucent `fg`
 * is flattened over `fgOn` when given (a border over its own field), otherwise
 * over the flattened background.
 */
export const PAIRS = [
  // Text on the page and on raised surfaces.
  { group: "Text", where: "Headings, names, body copy", fg: "void-ink", bg: "void", min: 4.5 },
  { group: "Text", where: "Descriptions, counts, footer, inactive nav", fg: "void-muted", bg: "void", min: 4.5 },
  { group: "Text", where: "Install command, code block, search field", fg: "void-ink", bg: "void-raised", min: 4.5 },
  { group: "Text", where: "Search placeholder, prompt symbol", fg: "void-muted", bg: "void-raised", min: 4.5 },
  { group: "Text", where: "Active category chip", fg: "ink", bg: "paper-raised", min: 4.5 },
  { group: "Text", where: "Active category chip count", fg: "ink-muted", bg: "paper-raised", min: 4.5 },
  { group: "Text", where: "Skip link", fg: "ink", bg: "paper", min: 4.5 },
  { group: "Text", where: "Stage hint on a void stage", fg: "void-muted", bg: "rgba(255,255,255,0.10)", on: ["void-raised"], min: 4.5 },
  { group: "Text", where: "Stage hint on a paper stage", fg: "ink-muted", bg: "rgba(255,255,255,0.85)", on: ["paper-sunken"], min: 4.5 },
  { group: "Text", where: "Stage hint on a cream stage", fg: "ink-muted", bg: "rgba(255,255,255,0.85)", on: ["paper-raised"], min: 4.5 },

  // Non-text: focus, control boundaries and icons (WCAG 1.4.11, 3:1).
  { group: "Controls", where: "Focus outline on the page", fg: "--bz-focus-ring-void", bg: "void", min: 3 },
  { group: "Controls", where: "Focus outline on raised surfaces", fg: "--bz-focus-ring-void", bg: "void-raised", min: 3 },
  { group: "Controls", where: "Icon buttons (expand, copy, close, clear)", fg: "void-ink", bg: "void", min: 3 },
  { group: "Controls", where: "Search field border against the page", fg: "rgba(255,255,255,0.36)", fgOn: "void-raised", bg: "void", min: 3 },

  // The semantic colours stages give to components.
  ...["paper", "cream"].flatMap((tone) => [
    { group: `Stage: ${tone}`, where: "Muted text on the stage", fg: `tone:${tone}:muted-foreground`, bg: tone === "paper" ? "paper-sunken" : "paper-raised", min: 4.5 },
    { group: `Stage: ${tone}`, where: "Muted text on a muted surface", fg: `tone:${tone}:muted-foreground`, bg: `tone:${tone}:muted`, min: 4.5 },
    { group: `Stage: ${tone}`, where: "Primary button label", fg: `tone:${tone}:primary-foreground`, bg: `tone:${tone}:primary`, min: 4.5 },
    { group: `Stage: ${tone}`, where: "Destructive button label", fg: `tone:${tone}:destructive-foreground`, bg: `tone:${tone}:destructive`, min: 4.5 },
    { group: `Stage: ${tone}`, where: "Primary as text", fg: `tone:${tone}:primary`, bg: `tone:${tone}:background`, min: 4.5 },
  ]),
  { group: "Stage: void", where: "Muted text on the stage", fg: "tone:void:muted-foreground", bg: "void-raised", min: 4.5 },
  { group: "Stage: void", where: "Muted text on a muted surface", fg: "tone:void:muted-foreground", bg: "tone:void:muted", min: 4.5 },
  { group: "Stage: void", where: "Primary button label", fg: "tone:void:primary-foreground", bg: "tone:void:primary", min: 4.5 },
  { group: "Stage: void", where: "Primary as text", fg: "tone:void:primary", bg: "void-raised", min: 4.5 },
];

/** Every Tailwind text colour key the gallery chrome is allowed to use. */
export const TEXT_COLOURS = ["void-ink", "void-muted", "ink", "ink-muted"];

export function measure() {
  const tokens = loadTokens();
  const config = loadConfigColors();
  const tones = loadToneChannels();

  const resolve = (ref, depth = 0) => {
    if (depth > 8) throw new Error(`Colour reference loop at ${ref}`);
    const token = /^var\(--(bz-[a-z0-9-]+)\)$/.exec(ref) ?? /^--(bz-[a-z0-9-]+)$/.exec(ref);
    if (token) {
      const value = tokens[token[1]];
      if (!value) throw new Error(`Unknown token --${token[1]}`);
      return resolve(value, depth + 1);
    }
    const tone = /^tone:([a-z]+):([a-z-]+)$/.exec(ref);
    if (tone) {
      const value = tones[tone[1]]?.[tone[2]];
      if (!value) throw new Error(`Unknown tone channel ${ref}`);
      return parseColor(value);
    }
    if (config[ref]) return resolve(config[ref], depth + 1);
    return parseColor(ref);
  };

  const flatten = (ref, layers) =>
    layers.reduce((colour, layer) => (colour[3] < 1 ? over(colour, resolve(layer)) : colour), resolve(ref));

  return PAIRS.map((pair) => {
    const bg = flatten(pair.bg, pair.on ?? []);
    let fg = resolve(pair.fg);
    if (fg[3] < 1) fg = over(fg, pair.fgOn ? resolve(pair.fgOn) : bg);
    const value = ratio(fg, bg);
    return { ...pair, fgHex: hex(fg), bgHex: hex(bg), ratio: Math.round(value * 100) / 100, pass: value >= pair.min };
  });
}
