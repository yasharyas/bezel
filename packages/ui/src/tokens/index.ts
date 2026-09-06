/**
 * Bezel design tokens, as values.
 *
 * This is a mirror of `tokens.css` for code that needs a token outside a
 * stylesheet — a canvas fill, a GSAP tween, an inline style. The CSS file is
 * the source of truth; `scripts/check-contrast.mjs` reads the CSS and fails if
 * these two ever disagree, so neither can drift.
 */

export const color = {
  /** Body and headings. 19.8:1 on paper. */
  ink: "#0a0a0a",
  /** Secondary copy. 8.8:1 on paper. */
  inkMuted: "#4a4a4c",
  /** Tertiary copy. 5.3:1 on paper. */
  inkSubtle: "#6b6b70",
  /** Disabled labels only — 3.4:1, AA-exempt under WCAG 1.4.3. */
  inkDisabled: "#8a8a8e",

  paper: "#ffffff",
  paperSunken: "#fafafa",
  paperRaised: "#f7f3ee",

  line: "rgba(10, 10, 10, 0.06)",
  lineStrong: "rgba(10, 10, 10, 0.13)",
  lineOpaque: "#f0f0f0",
  lineStrongOpaque: "#dedede",

  void: "#0c0c0f",
  voidRaised: "#1a1a1a",
  voidInk: "#ffffff",
  voidInkMuted: "rgba(255, 255, 255, 0.8)",
  voidLine: "rgba(255, 255, 255, 0.1)",
  voidFill: "rgba(255, 255, 255, 0.05)",

  /** The house accent. Safe as text on paper and as a fill under white. */
  accent: "#912c22",
  accentFill: "#912c22",
  accentOnFill: "#ffffff",

  amber: "#b45309",
  amberFill: "#b45309",
  amberOnFill: "#ffffff",

  /** Decoration and text >= 24px only — 3.77:1, below AA for body text. */
  emeraldDecor: "#059669",
  emerald: "#047857",
  emeraldFill: "#047857",
  emeraldOnFill: "#ffffff",

  /** Gold takes ink, never white — white on gold is 2.4:1. */
  goldFill: "#c9a227",
  goldOnFill: "#0a0a0a",
  gold: "#7a6015",

  /** Borders and marks only — 3.76:1, below AA for text. */
  dangerDecor: "#ef4444",
  danger: "#b91c1c",
  dangerFill: "#b91c1c",
  dangerOnFill: "#ffffff",

  focusRing: "#912c22",
  focusRingVoid: "#ffffff",
} as const;

export const font = {
  sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  serif: 'Georgia, "Times New Roman", ui-serif, serif',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
} as const;

/** Tailwind's scale, weighted small-first: `sm` and `xs` are 123 of 165 uses. */
export const fontSize = {
  "2xs": "0.6875rem",
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
  "4xl": "2.25rem",
  "5xl": "3rem",
  "6xl": "3.75rem",
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const lineHeight = {
  tight: 1.15,
  snug: 1.35,
  normal: 1.55,
} as const;

/** 4px base. */
export const space = {
  0: "0",
  1: "0.25rem",
  1.5: "0.375rem",
  2: "0.5rem",
  2.5: "0.625rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
} as const;

/** The smallest comfortable hit target, in px. */
export const targetMin = 48;

export const radius = {
  none: "0",
  xs: "2px",
  sm: "6px",
  md: "10px",
  lg: "12px",
  xl: "16px",
  "2xl": "24px",
  "3xl": "32px",
  full: "999px",
  /** The library's one piece of owned form language. */
  pinched: "0 40px 0 40px",
} as const;

export const duration = {
  instant: 0,
  fast: 150,
  base: 300,
  slow: 500,
  slower: 800,
  entrance: 950,
  loopShort: 3000,
  loop: 5000,
  loopLong: 40000,
} as const;

export const easing = {
  out: "cubic-bezier(0.23, 1, 0.32, 1)",
  inOut: "cubic-bezier(0.77, 0, 0.175, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  linear: "linear",
} as const;

/** GSAP names for the same curves, so timelines and CSS stay in step. */
export const gsapEasing = {
  out: "power3.out",
  inOut: "power2.inOut",
  linear: "none",
} as const;

export const focus = {
  width: "2px",
  offset: "2px",
  ring: color.focusRing,
  ringVoid: color.focusRingVoid,
} as const;

export const tokens = {
  color,
  font,
  fontSize,
  fontWeight,
  lineHeight,
  space,
  targetMin,
  radius,
  duration,
  easing,
  gsapEasing,
  focus,
} as const;

export type Tokens = typeof tokens;
