/** @type {import('tailwindcss').Config} */

/**
 * Colour channels for a CSS variable, so opacity modifiers keep working
 * (`bg-primary/10`, `text-muted-foreground/40`).
 */
const channel = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  // `dark:` variants only apply inside an element that opts in with `.dark`.
  // The default (`media`) made a few components render differently depending
  // on the viewer's OS theme, independent of the stage they sit on.
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Gallery chrome, read straight from bezel-ui/tokens.css.
        void: {
          DEFAULT: "var(--bz-void)",
          raised: "var(--bz-void-raised)",
          ink: "var(--bz-void-ink)",
          muted: "var(--bz-void-ink-muted)",
          line: "var(--bz-void-line)",
          fill: "var(--bz-void-fill)",
        },
        paper: {
          DEFAULT: "var(--bz-paper)",
          sunken: "var(--bz-paper-sunken)",
          raised: "var(--bz-paper-raised)",
        },
        brick: "var(--bz-accent)",

        // Semantic names that 17 components are written against (the shadcn
        // convention). Without them `bg-primary` and friends generate nothing
        // and those components render colourless. Each preview stage tone sets
        // the channels in globals.css, mapped onto Bezel tokens.
        background: channel("background"),
        foreground: channel("foreground"),
        card: { DEFAULT: channel("card"), foreground: channel("card-foreground") },
        popover: { DEFAULT: channel("popover"), foreground: channel("popover-foreground") },
        primary: { DEFAULT: channel("primary"), foreground: channel("primary-foreground") },
        secondary: { DEFAULT: channel("secondary"), foreground: channel("secondary-foreground") },
        muted: { DEFAULT: channel("muted"), foreground: channel("muted-foreground") },
        accent: { DEFAULT: channel("accent"), foreground: channel("accent-foreground") },
        destructive: { DEFAULT: channel("destructive"), foreground: channel("destructive-foreground") },
        border: channel("border"),
        input: channel("input"),
        ring: channel("ring"),
      },
      fontFamily: {
        sans: ["var(--bz-font-sans)"],
        serif: ["var(--bz-font-serif)"],
        mono: ["var(--bz-font-mono)"],
      },
      transitionTimingFunction: {
        "bz-out": "var(--bz-ease-out)",
      },
    },
  },
  plugins: [],
};
