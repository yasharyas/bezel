# Curation proposal

**This is a proposal.** The calls below are a recommendation for the owner to
accept, reject or revise. Since it was written the owner has removed seven
components; their rows are gone, and the counts describe the 100 that remain.

- **KEEP: 38** clear the quality bar
- **MERGE: 27** fold into a component that is kept, as a variant or prop
- **CUT: 35** remove from the library

Of the 38 that clear the bar, **25 are proposed for the shipping core** (with a
merged `CardGrid`, 26) and 13 are held back, named at the end, with why. That last selection is the one place
this document stops being a quality judgement and starts being a taste call, so
it is left visible rather than buried in the table.

The headline: the library is not too big because it has too many ideas. It is
too big because it has the same idea four times. Four card grids, three
animated-border buttons, three text-shimmer implementations, two cursors, two
marquees, two preloaders, two scroll reveals, four navbars. Removing the
repetition accounts for most of the reduction; only the genuinely
project-specific pieces are actually cut.

---

## How the calls were made

A component is **KEEP** if it is the best implementation of a job the system
needs, is not a near-duplicate of something better, and does not drag a heavy
dependency in for one effect.

A component is **MERGE** if something else in the library already does its job
and the difference is a prop.

A component is **CUT** if it is tied to one client project's art direction, is
below the quality of its neighbours, or is the only thing keeping a large
dependency alive.

Three flags recur and are marked inline:
`[dep]` pulls a heavy dependency for a single effect ·
`[a11y]` no keyboard path, or a state that exists only visually ·
`[dup]` a near-duplicate of a named sibling.

Focus handling is deliberately **not** a criterion. Every interactive component
in the library now has a visible focus indicator, so it no longer separates them.

---

## Root

| Component | Call | Reasoning |
|---|---|---|
| `Card.tsx` | MERGE | 18 lines, dark-only, hardcoded `text-white`. Fold into one `Surface` primitive with paper/void variants. |
| `GlassButton.tsx` | MERGE | The system's first button, but trivial and dark-only. Fold into `PinchedButton` as a `glass` variant. |

## animation/

| Component | Call | Reasoning |
|---|---|---|
| `BlurInReveal.tsx` | MERGE | `[dup]` `ScrollReveal` with a blur added — same IntersectionObserver, same 5-step delay ladder. A `blur` variant. |
| `CanvasPetalField.tsx` | CUT | Marigold/jasmine particles for one wedding project. Zero deps and well built, but not a system component. |
| `EdgeFadeMarquee.tsx` | KEEP | The better of the two marquees: pure CSS, reduced-motion aware, edge fades, hover pause. |
| `Highlighter.tsx` | CUT | `[dep]` The only consumer of `rough-notation`. One annotation effect is not worth a dependency. |
| `MagicRings.tsx` | CUT | `[dep]` The only consumer of `three` (29 MB installed) — for a background. Also renders nothing at all under reduced motion. |
| `Marquee.tsx` | MERGE | `[dup]` The GSAP spelling of `EdgeFadeMarquee`, without reduced-motion handling or edge fades. |
| `ScrollParallaxLayer.tsx` | KEEP | Genuine ScrollTrigger depth primitive with a real `matchMedia` gate. Ships `FallingPetalField` in the same file — split that out. |
| `ScrollReveal.tsx` | KEEP | The canonical reveal: IntersectionObserver, four directions, delay ladder, no dependencies. Absorbs three siblings. |
| `ShinyText.tsx` | KEEP | The best of the three gradient-sweep implementations — the only one that degrades to a plain span under reduced motion. |
| `StaggerBlurText.tsx` | MERGE | `[dup]` The same blur-in language at word granularity; the CSS is effectively `BlurInReveal`'s copied. A `stagger` variant. |
| `TextType.tsx` | CUT | `[a11y]` Typewriter with no `aria-live`, so the text is announced character-by-character or not at all. Overlaps `TypingHero`. |

## badges/

| Component | Call | Reasoning |
|---|---|---|
| `ShinyBadge.tsx` | MERGE | `[dup]` `ShinyText`'s `background-clip: text` sweep in a pill, minus the reduced-motion guard. Becomes `<ShinyText as="badge">`. |

## buttons/

| Component | Call | Reasoning |
|---|---|---|
| `BorderBeamButton.tsx` | MERGE | `[dup]` One of three animated-border buttons; shares the exact mask-composite trick with `ConicBorderButton`. |
| `CircleCTA.tsx` | CUT | Distinctive, but a GSAP stroke-draw bound to `mouseenter` on a wrapper div — the ring never draws for keyboard users. |
| `ConicBorderButton.tsx` | MERGE | `[dup]` Same border-ring trick as `BorderBeamButton`, different gradient. A variant. |
| `PinchedButton.tsx` | KEEP | The best-built component in the library: full state set, `:focus-visible`, `@media (hover:hover)`, complete reduced-motion block. The `Button`. |
| `StarBorder.tsx` | KEEP | The animated-border button, and the only one of the three with a proper focus ring. Absorbs the other two. |
| `TextDisperseLink.tsx` | CUT | Lovely effect, but per-character `<span>` splitting wrecks screen-reader pronunciation and the scatter is `mouseenter`-only. |
| `ToolbarButton.tsx` | KEEP | 21 lines and the closest thing the system has to an `IconButton`. Needs a required `aria-label`. |
| `WaxSealButton.tsx` | CUT | Wedding-invitation art direction. Reduced motion is checked on enter but not on leave. |
| `WhatsAppFAB.tsx` | CUT | A single vendor's brand button. `#25D366` is 1.98:1 against white and the tooltip is hover-only. |

## callouts/

| Component | Call | Reasoning |
|---|---|---|
| `CalloutBox.tsx` | MERGE | Useful, but it is a `CardGrid` cell with an amber border. Fold in as a `callout` tone. |

## cards/

| Component | Call | Reasoning |
|---|---|---|
| `BakeryProductCard.tsx` | MERGE | `[dup]` `ProductCard` without the quantity stepper, in a different colour system. |
| `DiagnosticGrid.tsx` | MERGE | `[dup]` One of four identical `p-[22px]` / `border-black/[0.06]` card grids. Differs only in the eyebrow. |
| `FeatureCardGrid.tsx` | MERGE | `[dup]` Same grid. Also applies a hover lift to a non-interactive div, so it reads as clickable and is not. |
| `FeaturedProjectCard.tsx` | MERGE | `[dup]` `ProjectCard` with an eyebrow, tags and an `alignRight` flag. A variant. |
| `NodeCard.tsx` | CUT | Flow-graph node for one app. Was a `div onClick` with no keyboard path at all. |
| `PointerGlowCard.tsx` | KEEP | The pointer-tracking primitive, and the only card in the library that mirrors its hover effect on `:focus-within`. |
| `PriceBreakdown.tsx` | CUT | A tax/GST calculator card. Application logic, not a design system component. |
| `PrincipleCardGrid.tsx` | MERGE | `[dup]` Same grid, numbered eyebrow. |
| `ProductCard.tsx` | KEEP | The most complete card here: stepper, out-of-stock overlay, discount badge, added-flash. The e-commerce reference. |
| `ProjectCard.tsx` | KEEP | The portfolio card. Absorbs `FeaturedProjectCard`. |
| `SignalCardGrid.tsx` | MERGE | `[dup]` Same grid, serif-letter eyebrow. Its inline `gridTemplateColumns` never collapses on mobile. |
| `TestimonialCard.tsx` | CUT | `[a11y]` 38 lines, and the star rating is conveyed purely visually with no accessible value. |

## dialogs/

| Component | Call | Reasoning |
|---|---|---|
| `DualConfirmDialog.tsx` | KEEP | A genuinely good idea — type-the-phrase destructive confirmation. Needs `role="dialog"`, Escape and a focus trap. |

## display/

| Component | Call | Reasoning |
|---|---|---|
| `CircularText.tsx` | CUT | Well built and reduced-motion aware, but its four hover behaviours are unreachable by keyboard or touch. Overlaps `DepthText` as the "type showpiece". |
| `DepthText.tsx` | KEEP | Zero dependencies, 34 layers correctly `aria-hidden`, pointer-gated, full reduced-motion branch. The best-behaved showpiece in the library. |
| `FormulaBlock.tsx` | CUT | 17 lines wrapping a `<code>` element. Not a component. |
| `ShinyGradientText.tsx` | MERGE | `[dup]` The third gradient-sweep implementation. Fold into `ShinyText`. |

## dividers/

| Component | Call | Reasoning |
|---|---|---|
| `AnimatedGradientRule.tsx` | CUT | `[dup]` A 2px rule using the identical gradient technique as `ShinyGradientText`. A styled `<hr>`. |
| `ElasticLineDivider.tsx` | CUT | The most distinctive divider here, but its `requestAnimationFrame` loop runs forever whether hovered or on-screen or not, with no reduced-motion handling. Worth rebuilding rather than keeping. |

## feedback/

| Component | Call | Reasoning |
|---|---|---|
| `CelebrationOverlay.tsx` | CUT | `[dep]` The only consumer of `canvas-confetti`. Best dialog semantics in the library — port those to `DualConfirmDialog`. |
| `EcomEmptyState.tsx` | MERGE | `[dup]` `EmptyState` with four presets. Fold the presets in. |
| `EmptyState.tsx` | KEEP | The empty-state primitive. Absorbs the e-commerce presets. Needs `role="status"`. |
| `ErrorBoundary.tsx` | KEEP | 49 lines, and every system needs one. Needs `componentDidCatch` so errors stop being swallowed silently. |
| `ImagePlaceholder.tsx` | MERGE | `[dup]` A skeleton box. Fold into `SkeletonCard` as a variant. |
| `LoadingSpinner.tsx` | KEEP | The spinner primitive. Needs `role="status"` and a label — it is currently invisible to assistive tech. |
| `SubmissionLoader.tsx` | CUT | `[a11y]` A blocking full-viewport overlay with no dialog role, no focus trap and no dismiss path. Overlaps `MultiStepLoader`. |
| `TillReceiptPrint.tsx` | CUT | A thermal-receipt printout for one retail project. 2.4s of choreography before the CTA appears, with no skip. |
| `ToastContainer.tsx` | KEEP | Toast is a core primitive and the portal/`@starting-style` implementation is sound. Needs a live region; nothing it says is currently announced. |
| `TypewriterLoader.tsx` | CUT | 172 lines of CSS driving four infinite animations for a novelty loader, with no reduced-motion block anywhere. |

## forms/

The strongest category in the library, and the one that most justifies keeping a
system at all.

| Component | Call | Reasoning |
|---|---|---|
| `BlenderUpload.tsx` | CUT | `[a11y]` A novelty uploader whose 2000ms "progress" is fabricated. Had no keyboard path to upload at all. |
| `CheckboxVariants.tsx` | CUT | `[a11y]` Four decorative treatments, none of which has an accessible name. Demos, not components. |
| `MD3Switch.tsx` | KEEP | The switch primitive. Drop the per-toggle `AudioContext` (it is never closed) and the `class-variance-authority` dependency it alone pulls. |
| `TextInput.tsx` | KEEP | The input primitive. |

## hooks/

| Component | Call | Reasoning |
|---|---|---|
| `useThemeRipple.tsx` | CUT | A 650ms full-viewport wipe with no reduced-motion check, at `z-index: 2147483647`, that originates from the top-left corner for keyboard users. Tokens now carry the theming story. |

## interaction/

| Component | Call | Reasoning |
|---|---|---|
| `CustomCursor.tsx` | MERGE | `[dup]` The weaker of the two cursors — no reduced-motion gate, no pointer-type gate, not `aria-hidden`. Its crosshair becomes a variant of `JewelryCursor`. |
| `GlareHover.tsx` | MERGE | `[dup]` A pointer-tracked sheen; `PointerGlowCard` is the same mechanism with a masked border. One pointer-effect primitive, two variants. |
| `JewelryCursor.tsx` | KEEP | The better cursor: `quickSetter` perf, gated on `(hover:hover) and (pointer:fine)` and reduced motion, both layers `aria-hidden`. |
| `Magnet.tsx` | KEEP | The magnetic-CTA primitive. Zero dependencies, reduced-motion and coarse-pointer gated. Move its `pointermove` listener off `window` per instance. |
| `ScratchFoilReveal.tsx` | CUT | `[a11y]` Gates content behind a mouse drag with no keyboard alternative whatsoever. The worst accessibility case in the library. |

## layout/

| Component | Call | Reasoning |
|---|---|---|
| `AppHeader.tsx` | MERGE | `[dup]` ~70% identical to `StickyNavbar`, down to a byte-identical `aria-label={\`Cart, ${n} items\`}`. |
| `DamaskTileBackdrop.tsx` | CUT | An ornamental pattern for one project, emitting duplicate `<style>` blocks per instance. |
| `ScreenLayout.tsx` | CUT | A form-wizard shell for one app. No `<main>` landmark. |
| `SiteFooter.tsx` | KEEP | 77 lines, clean, and every site needs one. |

## lists/

| Component | Call | Reasoning |
|---|---|---|
| `Checklist.tsx` | MERGE | `[dup]` The same list primitive as `NumberedStepsList` with a different marker. A `marker` prop. |
| `NumberedStepsList.tsx` | KEEP | Correct `<ol>` semantics, mono number column. The list primitive; absorbs `Checklist`. |

## loaders/

| Component | Call | Reasoning |
|---|---|---|
| `MultiStepLoader.tsx` | KEEP | The only component in the library with correct `role="status"` / `aria-live` / `aria-busy` wiring. **Conditional:** it imports two other components by relative path, which is why the CLI cannot ship it. Must be made standalone first. |
| `Preloader.tsx` | KEEP | The generic brand preloader. Port `ScrollUnfurlPreloader`'s session-once, scroll-lock and reduced-motion handling into it — it currently has none of the three. |
| `ScrollUnfurlPreloader.tsx` | CUT | The better implementation but wedding-specific art direction. Harvest its logic into `Preloader`, then drop it. |
| `SkeletonCard.tsx` | KEEP | The skeleton primitive. Absorbs `ImagePlaceholder`. Reconcile its two bar colours and add `aria-hidden`. |

## media/

| Component | Call | Reasoning |
|---|---|---|
| `CinematicWaterBackground.tsx` | CUT | 309 lines running two always-on `feTurbulence` filters at 1800×1100 plus six infinite animations. A performance liability for one project's hero. |
| `ImageReveal.tsx` | MERGE | `[dep]` Pulls GSAP **and** ScrollTrigger, and calls `registerPlugin` at module scope, for one clip-path wipe. `PixelDemorphImage` does the equivalent trigger with zero dependencies. Becomes a `ScrollReveal` variant. |
| `ImageWithFallback.tsx` | KEEP | 30 lines, universally useful. Fix the fallback discarding the original `alt`. |
| `MetallicLogoShimmer.tsx` | CUT | Hardcodes `alt="YASH logo"`, which is wrong for every consumer. |
| `PixelDemorphImage.tsx` | KEEP | The image-reveal of choice: IntersectionObserver, zero dependencies, canvas `aria-hidden` over a real `<img alt>`, reduced-motion respected. |

## navigation/

Seven navbar-ish files resolve to four designs, and two of those four are
themselves duplicate pairs.

| Component | Call | Reasoning |
|---|---|---|
| `Breadcrumb.tsx` | KEEP | Correct `aria-label` and `aria-current`. The breadcrumb primitive. |
| `CategoryChips.tsx` | KEEP | The filter-chip row. Needs `aria-pressed` — active state is currently colour-only. Absorbs `CategoryGrid`. |
| `CategoryGrid.tsx` | MERGE | `[dup]` Identical data model and `motion.button` pattern to `CategoryChips`; only the layout differs. |
| `CollapsibleSidebar.tsx` | CUT | `[a11y]` Draggable `div`s with no keyboard alternative, and it is app-furniture rather than a system component. |
| `MobileBottomNav.tsx` | MERGE | `[dup]` The same `layoutId` sliding-indicator nav as `TubelightNavBar`, placed differently. A `variant`. |
| `MobileMenu.tsx` | MERGE | The mobile half of `SiteHeader` — shared style idiom, shared `NavLink` type, shared defaults. They should be one responsive component, not two a consumer must mount and hide manually. |
| `Pagination.tsx` | KEEP | The best accessibility in the library: `aria-current`, per-control labels, `sr-only` text. Fix the dead `disabled:` classes on an `<a>`. |
| `SectionProgressRail.tsx` | CUT | Distinctive and reduced-motion aware, but an 8×8px hit target is a third of the minimum and the design does not survive fixing that. |
| `SiteHeader.tsx` | KEEP | The editorial/portfolio nav. Absorbs `MobileMenu`. Stop rendering each label twice — screen readers announce every item twice today. |
| `Stepper.tsx` | KEEP | The multi-step progress indicator. Absorbs `StepperNavigation`. Needs `role="progressbar"` and `aria-current="step"`. |
| `StepperNavigation.tsx` | MERGE | The Previous/Next/Submit row belongs with `Stepper`. Its two branches are also duplicates of each other. |
| `StickyNav.tsx` | CUT | Ships a dark-mode toggle that only swaps its own icon — the bar hardcodes a light palette and never changes. A broken premise. |
| `StickyNavbar.tsx` | KEEP | The application/e-commerce nav. Absorbs `AppHeader`. Needs Escape and a focus trap on its drawer. |
| `TubelightNavBar.tsx` | KEEP | The floating pill nav. Absorbs `MobileBottomNav`. Needs to become a real `<nav>`, and its mobile labels are `hidden`, leaving icon-only controls unnamed. |

## overlays/

| Component | Call | Reasoning |
|---|---|---|
| `FilmGrainOverlay.tsx` | CUT | Correctly built and reduced-motion aware, but a continuous rAF loop for a texture, and texture is not a component. |
| `SearchOverlay.tsx` | KEEP | The search-overlay primitive. Needs the most work of any KEEP: `role="dialog"`, focus trap, focus restore, Escape from anywhere. |

## panels/

| Component | Call | Reasoning |
|---|---|---|
| `SidePanel.tsx` | KEEP | The inspector panel, plus a small form-primitive set. The `@starting-style` entrance is the right call and is commented as such. Fix `PanelField`, whose `<label>` is associated with nothing. |
| `StickyCartBar.tsx` | CUT | E-commerce furniture, and its summary row and primary button fire the same handler — two tab stops for one action. |

## sections/

| Component | Call | Reasoning |
|---|---|---|
| `ContactSection.tsx` | CUT | An infinite 4s border spin with no reduced-motion guard, a CTA with no states at all, and a `.yui-contact-circle-draw` class that is applied but never defined. |
| `FAQAccordion.tsx` | KEEP | The accordion primitive. Closed answers are hidden with `max-height: 0` only, so they stay in the tab order and the a11y tree — that must be fixed. |
| `ParallaxProductStage.tsx` | KEEP | The best reduced-motion implementation in the library: subscribes to `matchMedia` `change` and re-runs its whole GSAP context. The showpiece. |
| `TypingHero.tsx` | CUT | `[a11y]` Mutates `textContent` outside React with no live region, keeps its CTA focusable while invisible, and leaks a `setInterval` on unmount. |

---

## The proposed core: 26 components

**Controls (5)**
`PinchedButton` (Button, absorbing GlassButton) · `StarBorder` (absorbing
BorderBeamButton, ConicBorderButton) · `ToolbarButton` (IconButton) ·
`TextInput` · `MD3Switch`

**Feedback (6)**
`ToastContainer` · `EmptyState` (absorbing EcomEmptyState) · `LoadingSpinner` ·
`ErrorBoundary` · `SkeletonCard` (absorbing ImagePlaceholder) · `MultiStepLoader`

**Structure (8)**
`Pagination` · `Breadcrumb` · `Stepper` (absorbing StepperNavigation) ·
`StickyNavbar` (absorbing AppHeader) · `SiteHeader` (absorbing MobileMenu) ·
`SidePanel` · `FAQAccordion` · `SiteFooter`

**Surfaces (4)**
`CardGrid` (merged from DiagnosticGrid, FeatureCardGrid, PrincipleCardGrid,
SignalCardGrid, CalloutBox) · `ProductCard` (absorbing BakeryProductCard) ·
`ProjectCard` (absorbing FeaturedProjectCard) · `NumberedStepsList` (absorbing
Checklist)

**Motion (3)**
`ScrollReveal` (absorbing BlurInReveal, StaggerBlurText, ImageReveal) ·
`EdgeFadeMarquee` (absorbing Marquee) · `ShinyText` (absorbing ShinyBadge,
ShinyGradientText)

Bringing the total to 26: 25 existing files plus `CardGrid`, which is new only
in the sense that it is five existing components with one API.

### The 13 held back

These are marked KEEP in the table because they clear the quality bar. They are
outside the 26 because the core is already carrying something that does their
job, or because they are craft pieces rather than system pieces:

| Component | Why it is held back |
|---|---|
| `DepthText` | A showpiece, not a primitive. The strongest single argument for the library's craft — swap it in if the portfolio reading matters more than the systems reading. |
| `ParallaxProductStage` | Same: the best-engineered file here, but it is a scene, not a component. |
| `Magnet` | Excellent and tiny. First on the list if the core stretches to 28. |
| `JewelryCursor` | A site-wide effect rather than a component; most consumers want at most one. |
| `PixelDemorphImage` | Overlaps `ScrollReveal`'s job once `ImageReveal` merges in. |
| `ImageWithFallback` | 30 lines of utility. Useful, but it is a helper, not a system component. |
| `PointerGlowCard` | The pointer-effect primitive, already partly represented by the card set. |
| `DualConfirmDialog` | Genuinely good, but needs dialog semantics, Escape and a focus trap before it can be a reference. |
| `SearchOverlay` | Same reason, more so — it needs the most work of anything marked KEEP. |
| `CategoryChips` | Overlaps the filter/nav story `StickyNavbar` already tells. |
| `TubelightNavBar` | A third navbar, when the core already ships two. |
| `Preloader` | Only worth keeping once `ScrollUnfurlPreloader`'s reduced-motion and session-once logic is ported into it. |
| `ScrollParallaxLayer` | Overlaps `ScrollReveal`; also ships two unrelated components in one file. |

The four to swap in first, if the core stretches: `DepthText`,
`ParallaxProductStage`, `Magnet`, `PointerGlowCard`.

---

## Resulting dependency list

**Dropped entirely**

| Dependency | Installed | Kept alive by |
|---|---|---|
| `three` | **29 MB** | `MagicRings` alone |
| `framer-motion` | 5.4 MB | 10 files, all of which can use `motion` instead |
| `canvas-confetti` | 108 KB | `CelebrationOverlay` alone |
| `rough-notation` | 91 KB | `Highlighter` alone |
| `class-variance-authority` | 35 KB | `MD3Switch` alone |
| `@radix-ui/react-select` | peer | nothing: removed from the manifests along with `SelectInput` |

**The biggest single drop is `three`.** It is 29 MB installed, it is a
`dependencies` entry so every consumer of `bezel-ui` pays for it, and exactly one
component uses it — for a decorative background that renders nothing at all when
the user prefers reduced motion.

**`framer-motion` is the second.** The library currently ships both
`framer-motion` and its successor `motion`, for the same job, in the same
package. Standardising on `motion` removes 5.4 MB and a genuine source of
confusion.

**Retained**

| Dependency | Why it survives |
|---|---|
| `gsap` + `@gsap/react` | `ParallaxProductStage`, and the parallax/preloader work generally. Justified. |
| `motion` | The one animation library, replacing `framer-motion`. |
| `lucide-react` | Icons across 16 components. Already a peer dependency, so consumers control the version. |

So `dependencies` goes from six packages to three (`gsap`, `@gsap/react`,
`motion`), with `lucide-react` remaining a peer.

---

## What the cut does not fix

Worth stating plainly, because curation will not solve these on its own:

- **54 of 90 animated files still ignore `prefers-reduced-motion`**, and three
  of those run infinite loops.
- **No component implements a focus trap.** Five full-screen overlays leave the
  background tabbable.
- **No form component sets `aria-invalid` or `aria-describedby`**, so every
  error state is visual only.
- **Loading is announced in exactly one component** (`MultiStepLoader`).
- **`packages/registry/src/index.ts` holds a second, hand-copied version of
  every component's source**, and it is already out of sync with the source it
  duplicates.
