# Principles

How Bezel decides things. These are read off the components, not aspired to, so
each one says where it currently holds and where it does not. A principle with a
known violation list is a standard; a principle without one is decoration.

---

## 1. The file is the interface

A component is distributed as readable source and copied into your project one
file at a time (`npx bezel-add add <slug>`). The package `main` points at
`src/index.ts`, not a bundle. Once you take a file, you own it.

Three things follow, and the library already obeys all three:

- **No component imports another component.** The single file that broke this
  rule (`loaders/MultiStepLoader.tsx`, which reaches for `MagicRings` and
  `ShinyText` by relative path) had to be excluded from the CLI, because a flat
  single-file copy cannot carry its dependencies. That exclusion is the rule
  proving itself.
- **Shared helpers are duplicated on purpose.** The three-line `cn()` is
  redefined in seven files rather than imported from one. A shared util would be
  a fourth file the consumer did not ask for.
- **Tokens are a theming surface, not a required import.** Every component
  carries its own literal values and works standalone. `tokens.css` lets you
  re-theme what you have taken; it is never a prerequisite for taking it.

The cost is real: a fix to one copy of a helper does not reach the other six.
That is the price of the copy model, and it is paid deliberately.

## 2. Motion is the point, and it must be refusable

Most of this library exists because of a motion idea. That earns it no exemption.
Anything that moves without the user asking honours `prefers-reduced-motion`, and
an ambient loop that ignores it is a defect.

The good implementations are the standard: `sections/ParallaxProductStage.tsx`
subscribes to `matchMedia` and re-runs its whole GSAP context on `change`;
`loaders/ScrollUnfurlPreloader.tsx` uses `gsap.matchMedia` for a real reduced
branch; `display/DepthText.tsx` bails out of its rAF loop entirely.

**Where it holds:** 36 of the 90 files that animate.
**Where it does not:** the other 54. `animation/Marquee.tsx`,
`badges/ShinyBadge.tsx` and `sections/ContactSection.tsx` run infinite loops with
no guard at all. Those are the worst of them, because an ambient loop is exactly
what the media query exists to stop.

## 3. Keyboard focus is not a style choice

Every interactive element shows a visible focus indicator: a 2px outline at 2px
offset, clearing 3:1 against its own ground. `outline-none` without a replacement
is a defect, not a preference. `:focus-visible` is used rather than `:focus`, so
the ring appears for keyboard users and not on mouse click.

`buttons/PinchedButton.tsx` and `buttons/StarBorder.tsx` are the reference: both
were written with `:focus-visible` outlines from the start.

**Where it did not hold:** at the start of this pass, 15 of 43 interactive files
had any focus handling, and three of those had removed the default with
`outline-none` and put nothing back. The base `GlassButton`, the first component
in the library, had no focus ring at all.

Two related rules the forms already keep and the rest of the library does not:
controls are at least 48px on their smallest axis (`min-h-[48px]` appears in four
form components), and a control that only responds to a pointer is unfinished. A
hover effect with no focus equivalent is half a component.

## 4. Contrast is a gate, not a preference

`npm run check:contrast` fails on any violation and is expected to stay green.
Text clears 4.5:1; marks, borders and focus rings clear 3:1; disabled text is
exempt under WCAG 1.4.3 and is reported rather than gated.

A colour that cannot meet the bar is renamed, not excused. Three did:

- `#059669` is 3.77:1 on white and was being used as body text in three
  components. It survives as `--bz-emerald-decor` for rules and dots; text uses
  `--bz-emerald: #047857`.
- `#c9a227` is 2.42:1 against white. It is a fill that carries dark ink, never a
  text colour, and never a fill under white.
- `red-500` is 3.76:1. It stays as the error *mark*; error *text* is `#b91c1c`.

The script parses `tokens.css` directly and cross-checks `tokens.ts` against it,
so the two token surfaces cannot drift apart without the gate noticing.

## 5. One curve, one ladder

The library shipped five near-identical editorial ease-out curves
(`(.23,1,.32,1)`, `(.22,1,.36,1)`, `(.16,1,.3,1)`, `(.25,1,.5,1)`) plus four
separate spring tunings for the same class of motion. Nobody can tell them apart
in a side-by-side. A system that ships all five has not made a decision.

There is one ease-out (`--bz-ease-out`), one in-out, one overshoot, and `linear`
for loops. Durations are a four-rung ladder (150 / 300 / 500 / 800ms) with 300
as the default, because it was already the most common single duration in the
library. Ambient loops are a separate set and are always reduced-motion gated.

## 6. Pills on paper

The shape language is not up for negotiation per component. `rounded-full` is the
most common shape in the library by a wide margin (32 uses counting both
spellings), so controls are pills. Surfaces are paper: near-white, separated by a
`rgba(10,10,10,0.06)` hairline rather than a shadow, the pattern in every card
grid in the library.

The one deliberate exception is `PinchedButton`'s asymmetric `0 40px 0 40px`.
It is kept as a token (`--bz-radius-pinched`) because it is the single piece of
form language this system owns outright rather than inherits.

Where the library breaks its own rule it is visible and should be closed: six
different radii are currently in use for the same card role, and three different
radii for the same primary CTA.

---

## The standing audit

| Principle | Holds | Does not yet |
|---|---|---|
| 1. The file is the interface | 99 of 100 files are standalone | `MultiStepLoader` (excluded from the CLI) |
| 2. Motion is refusable | 36 of 90 animated files | 54 files, 3 of them infinite loops |
| 3. Focus is visible | every interactive file, after this pass | maintain it; `:focus` should become `:focus-visible` in 6 older files |
| 4. Contrast is a gate | all tokens | components still carry pre-token literals |
| 5. One curve, one ladder | the token set | components carry 5 curves and 4 springs |
| 6. Pills on paper | the token set | 6 card radii, 3 CTA radii in components |

The motion and radius counts were measured before seven components were removed
in September 2026 and have not been re-measured since.
