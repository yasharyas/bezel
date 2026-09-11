# Gallery audit

A component-by-component review of the Bezel gallery, done first-hand in
headless Chromium at 1440px desktop and 390px mobile, before and after the
`gallery-overhaul` work. The gallery started with 107 components. During the
audit the owner removed seven of them (recorded under
[Owner decisions](#owner-decisions)), so the table covers the 100 that remain.

- [Summary](#summary)
- [Owner decisions](#owner-decisions)
- [Where this disagrees with CURATION.md](#where-this-disagrees-with-curationmd)
- [Component by component](#component-by-component)
- [Library bugs found along the way](#library-bugs-found-along-the-way)

---

## Summary

### Ratings

| Rating | Count | Components |
|---|---:|---|
| **Showcase** | 5 | DepthText, CinematicWaterBackground, ScrollUnfurlPreloader, ScratchFoilReveal, MagicRings |
| **Solid** | 27 | ToastContainer, TubelightNavBar, MD3Switch, DualConfirmDialog, SiteHeader, ElasticLineDivider, TextDisperseLink, SearchOverlay, MobileBottomNav, ProductCard, useThemeRipple, ScrollReveal, Magnet, ConicBorderButton, PointerGlowCard, EdgeFadeMarquee, ParallaxProductStage, JewelryCursor, WaxSealButton, CanvasPetalField, PixelDemorphImage, TillReceiptPrint, StarBorder, ShinyText, PinchedButton, MultiStepLoader, CelebrationOverlay |
| **Ordinary** | 68 | Everything else. Each row says what would make it worth keeping. |

- **Showcase**: genuinely strong, the kind of thing that makes a reviewer stop.
- **Solid**: well made, earns its place.
- **Ordinary**: works, but a reviewer would not remember it.

The owner's instinct holds: two thirds of the library is ordinary. Most of the
ordinary pieces are either a second or third copy of an idea done better
elsewhere (four card grids, three shimmer texts, three animated-border
buttons, two cursors, two marquees, two preloaders) or project furniture from
one client site (grocery headers, bakery cards, a WhatsApp button). The five
Showcase pieces and most of the Solid ones share a trait: each has one
physical idea (foil you scratch, parchment that unrolls, type with depth,
water with light in it) and commits to it.

### What was fixed

Measured on the landing page and every component page, dev server at the start
and production build at the end. Before figures are for 107 components, after
figures for the final 100.

| Measure | Before | After |
|---|---|---|
| Component pages with a preview | 40 of 107 | 100 of 100 |
| Index cards showing the real component | 89 of 107 (mocks, placeholder text, empty stages) | 100 of 100 |
| Errors and warnings on the landing page | 6 uncaught hydration errors, 5 React warnings, 1 failed request | 0 |
| `h1` on the landing page | 2, both inside previews | 1, "Bezel" |
| Invalid component URL | HTTP 200, "Component not found" | HTTP 404 |
| DOM nodes at load | 3,739 | 2,053 (2,270 at peak while scrolling the whole index) |
| Running animations at load | 60 | 19 (48 at peak; 1 with reduced motion) |
| Tab stops on the landing page | 372 | 254 (last card reached in 248 presses) |
| `div role="button"` cards | 110 | 0 (real links and buttons) |
| Card description contrast | 3.74:1 | 12.47:1 |
| Search placeholder contrast | 3.98:1 | 11.42:1 |
| Footer, counts, inactive nav | 4.12:1 | 12.42:1 |
| Icon buttons | 2.27:1 at 19×19px | 19.53:1 at 36×36px |
| Search focus indicator | 1px ring at 1.42:1 | 2px outline at 19.53:1 |
| Mobile search width | 108px | 358px |
| Mobile category chips | 8 rows, most of the first screen | 1 scrolling row, 44px tall |
| Card copy | 88 imperative generation prompts, 104 over 90 characters, 274 characters on average | 100 one-sentence descriptions, 10 to 14 words, 88 characters at most, 76 on average |

**P1, previews.** One preview map (`apps/gallery/src/previews/specs.ts`) now
drives the index card, the expand dialog, the component page and the iframe
route, so a component cannot have a preview in one place and not another, and
`scripts/check-previews.mjs` fails the build if any registry slug lacks one.
74 components render inline inside a stage that contains fixed and sticky
descendants (`transform`, `contain: layout paint`, `overflow: hidden`,
`isolation`). 26 that are full-viewport by nature (overlays, headers, cursors,
preloaders, floating buttons) render in an iframe at a virtual viewport scaled
to fit the stage. Wide sections are laid out at their natural width and scaled
down rather than cropped. Previews mount lazily as they approach the viewport,
stay inert at card size until the pointer enters, and mount client-side only,
which removed the hydration errors caused by 45 components injecting
`<style>` tags. Hover-only effects get a slow synthetic pointer while idle,
which pauses when a real pointer arrives or reduced motion is set. Effects
that play once get a replay button.

**P1, visual consistency.** Every stage uses one of three tones (void, paper,
cream) drawn from the Bezel tokens. The shadcn semantic colours that 17
components depend on but the gallery never defined (`primary`, `muted`,
`border` and friends) are now defined per tone, which is what made MD3Switch,
LoadingSpinner, SkeletonCard, CategoryChips, EmptyState and others look broken.
Dark mode is class-based, so CheckboxVariants no longer follows the viewer's OS
theme. One library fix: LoadingSpinner's medium size used `border-3`, which is
not a Tailwind class, so it drew nothing; it is now `border-[3px]`.

**P2, copy and routes.** The `prompt` field is renamed `description` across the
metadata, generator, registry and gallery, every description was rewritten
after reading the component source, and the generator rejects descriptions
outside 8 to 14 words or 90 characters, unknown keys and em dashes. The first
screen has a real `h1`, a positioning line, a copyable `npm i bezel-ui`, npm
and GitHub links and three links into `/principles` and `/states`, which now
render `PRINCIPLES.md` and `STATES.md`. Component, Principles and States pages
have their own titles and canonical URLs; there are share images for the site
and each component, a sitemap and robots rules. The component page install hint is
`npx bezel-add add <slug>`.

**P2, accessibility.** The gallery chrome consumes the `--bz-*` tokens. Cards
are an article with a real link on the title and a 36px expand button, with a
visible focus outline on the whole card. The expand view is a native modal
`dialog` with a label, a Tab loop, Escape, scroll lock and focus return. Search
has a label, `type="search"`, a clear button, URL state (`?q=` and
`?category=`), a result count and a polite live announcement. Chips expose
`aria-pressed`. Gallery chrome respects reduced motion. A second contrast gate
measures the gallery's own colour pairs and fails `npm run build` alongside the
token gate; its results are published on `/principles`.

**P3, mobile.** The header keeps the brand, Principles, States and GitHub on
one line, search spans the width, and the 24 chips became one horizontally
scrolling row.

### What could not be fixed, and why

- **Component bugs stay in the components.** This was a gallery overhaul, so
  library behaviour was left alone apart from the one-class LoadingSpinner fix.
  Everything found is listed under
  [Library bugs](#library-bugs-found-along-the-way); several of them cap a
  rating.
- **Removed components are still on npm.** The seven removed components remain
  in the published `bezel-ui@0.0.2` tarball until the next release.
- **Two tab stops per card.** The title link and the expand button are separate
  controls by design; merging them would hide the dialog from keyboard users.
- **Frame previews are heavier.** Each of the 26 frame previews boots its own
  document, noticeably slower under `next dev` than in production. At most
  seven are mounted at once while scrolling.
- **Hover effects are demonstrated, not felt, at card size.** The idle pointer
  shows what an effect does; the real interaction is on the component page and
  in the expand dialog.
- **Photos load from images.unsplash.com.** The demos depend on that host.
- **Share images use the edge runtime.** `@vercel/og`'s Node entry fails to
  resolve its bundled files on Windows, so both image routes run on the edge, which
  opts those two routes out of static generation.
- **DamaskTileBackdrop barely shows its pattern** because the component lays a
  94% veil over it. That needs a component change.
- **Headless WebGL warnings.** MagicRings logs GPU driver performance warnings
  under headless software rendering. They are not application errors and do
  not appear in a normal browser.

---

## Owner decisions

After reviewing the fixed gallery, the owner asked for three changes. They are
recorded here because they changed the component count and the ratings.

1. **ScrollUnfurlPreloader preview.** The preview used to reveal a sample
   wedding invitation once the parchment lifted. That text is gone; the preview
   now plays, rests on the empty ground for a moment and replays.
2. **FoilSpecularCard removed.** It was rated Showcase in the draft of this
   audit (a pointer-tracked foil sheen on an invitation card, previously scaled
   to 55% and cropped). Removed from the library at the owner's call.
3. **Form fields without a design edge removed.** The owner asked to keep only
   the inputs whose design is distinctive.

| Component | Draft rating | Decision | Reason |
|---|---|---|---|
| `Input` | Ordinary | Removed | A plain dark text field, a less complete duplicate of TextInput. |
| `Checkbox` | Ordinary | Removed | A round tick checkbox; CheckboxVariants carries the design idea for checkboxes. |
| `RadioGroup` | Solid | Removed | Well built, but indigo pill chips in the same pill family as TextInput, with nothing distinct in the design. |
| `DOBPicker` | Solid | Removed | Visually identical to TextInput; the date mask is behaviour, not design. |
| `SelectInput` | Solid | Removed | The same pill trigger as TextInput; the Radix menu is behaviour, not design. Its removal also drops `@radix-ui/react-select`. |
| `FileUpload` | Ordinary | Removed | A plain dashed box; BlenderUpload carries the design idea for uploads. |
| `TextInput` | Ordinary | Kept | The one representative text field, with required, error and uppercase states. |
| `CheckboxVariants` | Ordinary | Kept | Four stylised treatments, the only checkbox with a visual idea. |
| `MD3Switch` | Solid | Kept | Pressed-handle growth, icons and a destructive variant. |
| `BlenderUpload` | Ordinary | Kept | An illustrated drop zone, the only uploader with a visual idea. |

"Kept for its design edge" and "rated Ordinary" are not in conflict: the
kept inputs are the most distinctive of their kind, but only MD3Switch is
distinctive enough to earn a place on its own merit.

---

## Where this disagrees with CURATION.md

`CURATION.md` judges components as parts of a design system (is this the best
implementation of a job the system needs?). This audit judges what a reviewer
sees and remembers. The two readings agree on most of the library and part
ways in four places.

**CURATION cuts four of the five Showcase pieces.**

| Component | CURATION | Audit | Where the readings differ |
|---|---|---|---|
| MagicRings | CUT | Showcase | CURATION cuts it for pulling in `three` (29 MB) for one background and rendering nothing under reduced motion. Both are true, and the fix is a lighter renderer and a static frame, not deletion: it is the strongest first impression in the gallery. |
| ScratchFoilReveal | CUT | Showcase | CURATION calls its missing keyboard path the worst accessibility case in the library. Agreed that it cannot ship like this. The idea is too good to cut; add a keyboard reveal. |
| ScrollUnfurlPreloader | CUT | Showcase | CURATION wants its logic harvested into `Preloader`. The audit would invert that: keep the unfurl, the better idea and the better implementation, and fold `Preloader`'s count-up in as a simpler variant. The wedding-specific copy is gone from the preview. |
| CinematicWaterBackground | CUT | Showcase | CURATION cuts it as a performance liability (two always-on turbulence filters). The cost is real; pausing offscreen and under reduced motion would keep one of the few truly atmospheric pieces. |

**CURATION cuts seven components rated Solid.** ElasticLineDivider (endless
animation loop), TextDisperseLink (per-letter spans, mouse-only), WaxSealButton
(wedding art direction, reduced motion checked on enter only), CanvasPetalField
(one project's petals), TillReceiptPrint (2.4 s of choreography with no skip),
CelebrationOverlay (the only `canvas-confetti` consumer) and useThemeRipple
(no reduced-motion check, keyboard wipe starts at the corner). Each reason is
accurate, and each is a fixable defect in a component with a real idea. The
audit would fix them, not cut them.

**CURATION merges two components rated Solid.** ConicBorderButton and
MobileBottomNav are proposed as variants of BorderBeamButton and
TubelightNavBar. Merging is fine, but in both pairs the component being merged
away is the better-looking one, so the merged result should keep its look.

**CURATION keeps 19 components rated Ordinary.** TextInput, Stepper,
ToolbarButton, SidePanel, EmptyState, LoadingSpinner, Pagination, Preloader,
ProjectCard, ImageWithFallback, SkeletonCard, Breadcrumb, CategoryChips,
FAQAccordion, StickyNavbar, ErrorBoundary, NumberedStepsList, SiteFooter and
ScrollParallaxLayer. Mostly this is not a disagreement: a system needs
primitives that nobody remembers. The exception is `Preloader`, covered above.

CURATION cuts BlenderUpload and CheckboxVariants; the owner kept both as the
inputs with a design edge, and the audit rates both Ordinary.

---

## Component by component

**Preview worked before?**
**Yes**: the real component rendered legibly on the index and on its page.
**Index only**: it rendered on the index, but its page said "No preview
available" (true of every component after `text-disperse-link` in gallery
order). **Broken**: the real component mounted but was unreadable, clipped,
colourless or escaped its stage. **No**: a mock, a placeholder sentence, a
lone trigger button with nothing to see, or nothing at all.

**What was fixed** lists the work specific to each component. On top of it,
every component got the shared fixes above: one preview used everywhere, a
contained stage, lazy mounting, a tone from the tokens, the semantic colours it
needs, and a rewritten description.

| slug | preview worked before? | visual state before | what was fixed | rating | why |
|---|---|---|---|---|---|
| `glass-button` | Yes | Legible, but a flat dark stage gave the glass nothing to blur | Two blurred colour fields behind it; enabled and disabled side by side | Ordinary | A frosted pill; every glass kit has one.<br>**Worth keeping if** it had a tactile idea of its own, such as an edge highlight that follows the pointer. |
| `card` | Yes | Legible, on the same flat stage, so the blur did nothing | The same colour-field backdrop and real content | Ordinary | The glass base container: correct and forgettable.<br>**Worth keeping if** it became the documented surface the glass pieces are built from, rather than a standalone component. |
| `text-input` | Broken: label near invisible | White pill on the dark stage with a `neutral-700` label on near-black | Paper stage; two fields showing the required marker and a live email error | Ordinary | A clean pill field with its states done right, which is the job of a primitive, but nothing a reviewer recalls. Kept by the owner as the one text field.<br>**Worth keeping if** it gained one signature detail, such as an animated error entrance, shared across the forms family. |
| `stepper` | Yes | Legible | A mid-flow state: two steps complete, the current one ringed | Ordinary | Standard wizard progress in hard-coded indigo.<br>**Worth keeping if** the connectors animated between steps and the accent came from the tokens. |
| `stepper-navigation` | Yes | Oversized, with a stray rule across the card | Sized as a 320px form footer with a step counter; Submit runs the loading state and resets | Ordinary | Previous and Next buttons with a spinner.<br>**Worth keeping if** merged into `Stepper`, as CURATION proposes; alone it has no reason to exist. |
| `submission-loader` | Broken: escaped the stage | Three tiny trigger buttons; the overlay covered the whole gallery | Frame preview over a sketched form, cycling verify, validate, submit and done on its own | Ordinary | A blocking modal with four labelled phases, generic in look.<br>**Worth keeping if** folded into `MultiStepLoader`, which shows stepped status better and already has live-region wiring. |
| `screen-layout` | Broken: cropped | A cropped white bar with a logo and no visible layout | A 720px frame composing it with the real Stepper, StepperNavigation and TextInput | Ordinary | A page shell for one onboarding flow.<br>**Worth keeping if** generalised into a layout with named slots, not tied to a stepper form. |
| `typewriter-loader` | Yes | Legible, but a lone illustration with no context | Paired with a status line so it reads as a loader in use | Ordinary | A charming pure-CSS typewriter that is remembered for about a second.<br>**Worth keeping if** its hard-coded blues came from the tokens and it held a still frame under reduced motion. |
| `toast-container` | Broken: escaped the stage | A lone "Show Toast" button; toasts portalled onto the gallery | Contained frame with a Save button and an idle loop of three messages, so stacking and the interruptible slide are visible | Solid | The `useToast` hook and interruptible transitions are well built and hold up under rapid fire. Needs a live region to be complete. |
| `toolbar-button` | Yes | A white slab with one icon | A real editor toolbar: a bold toggle, separators and a disabled redo | Ordinary | A correct icon button and nothing more.<br>**Worth keeping if** it shipped as a toolbar with roving focus and pressed state, which is where the real difficulty is. |
| `collapsible-sidebar` | Broken: cropped | A white slab cut off mid-list | The left half of a workflow editor, with a dotted canvas beside it | Ordinary | A node palette for one workflow product.<br>**Worth keeping if** it became a general collapsible side navigation rather than a node picker. |
| `side-panel` | Broken: escaped the stage | A lone "Open Panel" button; the panel was `fixed inset-0` over the gallery | An inspector docked beside a selected node; close and delete fall back to an "Open panel" state | Ordinary | A tidy inspector.<br>**Worth keeping if** it trapped focus, closed on Escape and tied `PanelField` labels to their inputs. |
| `node-card` | Yes | A white card on the dark stage | Two nodes joined by a connector on a dotted canvas; clicking moves the selection ring | Ordinary | A workflow node for one editor.<br>**Worth keeping if** it grew ports and connection states and anchored a real flow-editor kit. |
| `tubelight-navbar` | No: a gallery-made copy | A hand-built lookalike, not the component | The real component; an idle loop walks the lamp across items, and a layout group stops two copies on one page animating into each other | Solid | The spring lamp over the active item is the nicest navigation motion in the library. |
| `md3-switch` | Broken: colourless | Track and handle colours undefined, so it read as two outlines | Tone colours defined; a settings list with icons, on and off states and a small destructive switch | Solid | Pressed-handle growth and the icon swap are faithful Material 3 motion and feel physical. Its per-toggle `AudioContext` is never closed. |
| `dual-confirm-dialog` | No: a lone trigger | A lone red button and no dialog | Frame with three selected events; confirming strikes them through and Delete reopens it | Solid | Type-the-phrase confirmation is a real safety pattern, staged well in two steps. Needs dialog semantics, Escape and a focus trap. |
| `blender-upload` | Broken: clipped | A white slab with its copy cut off at the bottom | Laid out at 340px and scaled to fit, so the whole illustration and copy show | Ordinary | The only uploader with a design idea, which is why the owner kept it, but at rest it is a static drawing; the fruit only bounces mid-drag.<br>**Worth keeping if** it responded to hover and focus and its progress were real rather than a fixed 2000 ms. |
| `empty-state` | Broken: colourless | Scaled to 75%, top-aligned, with a colourless primary button | Centred on paper at a 420px layout with an icon, copy and a working action | Ordinary | A correct empty state: a heading and a button.<br>**Worth keeping if** it offered illustrated or animated variants. |
| `checkbox-variants` | Yes | Legible, but its `dark:` styles followed the viewer's OS theme instead of the stage | Class-based dark mode; four variants labelled and spaced | Ordinary | The only checkbox with a visual idea, which is why the owner kept it, but none of the four has an accessible name of its own.<br>**Worth keeping if** it became one checkbox with a `variant` prop and a real label. |
| `loading-spinner` | Broken: medium size invisible | `border-3` is not a Tailwind class and `border-primary` was undefined, so md drew nothing and the others were grey | Fixed the class in the component (`border-[3px]`); tone colours; three sizes labelled | Ordinary | A border spinner.<br>**Worth keeping if** it had `role="status"` and a label; it is silent to assistive tech today. |
| `price-breakdown` | Yes | Legible, with a stray white outline | Tone colours; a ticket price with 18% GST | Ordinary | A three-row receipt for one tax.<br>**Worth keeping if** it handled any list of line items and taxes, not one price plus GST. |
| `pagination` | Yes | Legible | Working pages from 5 of 10 with ellipses, laid out at 460px | Ordinary | The shadcn pagination pattern, faithfully copied.<br>**Worth keeping if** it gained a compact mode for phones. |
| `custom-cursor` | No: static mock | A static mock, not the component | An 840px frame (the cursor hides below 769px) with an idle pointer drifting over grow targets | Ordinary | A crosshair that grows over targets; the weaker of two cursors.<br>**Worth keeping if** merged into `JewelryCursor` as a crosshair variant with its pointer-type and reduced-motion gates. |
| `preloader` | Broken: escaped the stage | A lone button; the full-screen overlay covered the gallery | Contained frame over a studio hero; replays after the page underneath has shown | Ordinary | Count to 100, wipe up: the most common portfolio intro there is.<br>**Worth keeping if** it took ScrollUnfurlPreloader's session-once, scroll-lock and reduced-motion handling and found an art direction of its own. |
| `site-header` | No: mock markup | Hand-written markup imitating it | The real component over a photo hero at 800px, so the rolling links and bubble CTA show on hover | Solid | Rolling link text and the bubble fill on the CTA are crisp and hold up over imagery. Screen readers hear every label twice. |
| `mobile-menu` | No: mock markup | A mock, with the logo colliding with the burger | A 390px frame that opens and closes the menu on a loop while idle | Ordinary | A pleasant blend-mode overlay, but half of `SiteHeader`.<br>**Worth keeping if** merged into `SiteHeader` as its mobile mode. |
| `elastic-line-divider` | Yes | Legible but inert until a pointer found the line | An idle pointer bends the line every few seconds; one divider instead of a stack | Solid | The rubber-band line is the most distinctive divider here and makes a section break feel alive. Its animation loop never stops, on screen or off. |
| `circle-cta` | Broken: ring invisible until hover | "VIEW ALL" with no circle | An idle hover draws the ring on a loop | Ordinary | A ring that draws around a label, common on agency sites.<br>**Worth keeping if** the ring also drew on keyboard focus. |
| `image-reveal` | No: placeholder text | A sentence instead of the component | The real unmask, with replay | Ordinary | Scroll unmask plus zoom, a GSAP staple.<br>**Worth keeping if** merged with `PixelDemorphImage` into one reveal with modes. |
| `featured-project-card` | No: mock, clipped | A mock with its title cut off | A 1000px frame placing it beside project copy | Ordinary | A large portfolio tile with a slow zoom.<br>**Worth keeping if** merged into `ProjectCard` as its featured size. |
| `project-card` | No: mock, clipped | A clipped mock | Two real cards with photos in a grid | Ordinary | A rounded image, a hover zoom and a title.<br>**Worth keeping if** its hover said something about the work, such as a caption reveal or a media swap. |
| `marquee` | Yes | Legible but oversized | Two rows at different speeds and weights, for depth | Ordinary | A text marquee that clones itself.<br>**Worth keeping if** merged into `EdgeFadeMarquee`, which pauses on hover and respects reduced motion. |
| `contact-section` | Broken: cropped, crashed hydration | Scaled and cropped; its injected `<style>` caused the landing page's hydration error | A 960px frame, mounted client-side, with an idle pointer driving the spotlight | Ordinary | Image-filled type, a conic border and a spotlight: three effects on one panel, none leading.<br>**Worth keeping if** it committed to one of them, probably the image-filled type. |
| `text-disperse-link` | Yes | Legible, but just a word on a stage | An idle hover scatters and regroups the letters on a loop | Solid | The scatter and sequenced regroup are playful and precise. Per-letter spans hurt screen-reader pronunciation, and it is mouse-only. |
| `image-with-fallback` | Index only | Legible, but its demo image pointed at a host that does not exist and logged a failed request | The fallback is shown with an undecodable data URI, no network request, beside a loaded image | Ordinary | A utility, done correctly.<br>**Worth keeping if** the fallback matched the image's frame and brand rather than one grey icon. |
| `skeleton-card` | Broken: empty outline, index only | Bar colours undefined, so only an outline drew | Tone colours give the bars their fill; two cards pulsing | Ordinary | A skeleton.<br>**Worth keeping if** it came with text and list variants and stopped pulsing under reduced motion. |
| `ecom-empty-state` | Broken: colourless, index only | Oversized text and a colourless icon | Tone colours; the cart, search and network presets switchable in the preview | Ordinary | Preset copy for shop empty states.<br>**Worth keeping if** merged into `EmptyState` as presets. |
| `breadcrumb` | Index only | Legible but tiny | Shown above a product title, so the truncated last crumb has context | Ordinary | A breadcrumb with `aria-current`: correct and plain.<br>**Worth keeping if** it collapsed middle crumbs on narrow screens. |
| `category-chips` | Broken: blank active chip, index only | A white slab; the active "All" chip rendered blank | Tone colours; six categories with a live item count | Ordinary | A filter chip row whose active state is colour only.<br>**Worth keeping if** it exposed `aria-pressed` and animated the selection. |
| `category-grid` | Broken: overlapping, index only | A white slab with overlapping icon circles | A phone-width frame with eight categories in four columns | Ordinary | Round category icons, the grocery-app default.<br>**Worth keeping if** merged into `CategoryChips` as a grid layout. |
| `search-overlay` | No: mock input | A mock search field | A frame opening the real sheet with recent and popular searches seeded | Solid | The drop-down sheet with recent and popular rows is a complete, well-paced mobile search. CURATION rightly flags it as needing dialog semantics, a focus trap and Escape. |
| `mobile-bottom-nav` | Broken: empty stage | An empty stage; on mobile the bar pinned itself to the bottom of the gallery | A 390px frame whose active tab and page title cycle while idle | Solid | The sliding indicator and count badge feel native and well proportioned. It is `md:hidden`, so it disappears on wider screens. |
| `product-card` | Broken: clipped, index only | Price and add button cut off | Two cards laid out at 380px: in stock with a working quantity stepper, and out of stock | Solid | Discount badge, stepper and out-of-stock overlay are each handled with care. Its notify button nests inside another button. |
| `sticky-cart-bar` | Broken: empty stage | An empty stage | A 390px frame above a sketched tab bar; the add buttons update count and total | Ordinary | A cart summary bar whose summary row and primary button fire the same handler.<br>**Worth keeping if** it animated the total and had one tab stop per action. |
| `app-header` | Broken: cropped, covered the gallery header | A cropped white slab whose sticky `z-50` painted over the site header | An 800px frame with a store grid under it; the cart badge increments | Ordinary | A shop header with a banner, search and cart. It renders its own `h1`.<br>**Worth keeping if** merged into `StickyNavbar` without the heading. |
| `bakery-product-card` | Broken: clipped, index only | Cut off | Two cards at 440px: a photo with badges, and the no-photo placeholder | Ordinary | A second product card.<br>**Worth keeping if** merged into `ProductCard`. |
| `testimonial-card` | Index only | A legible white card | Paper stage with a real quote and rating | Ordinary | Stars, quote and an initial.<br>**Worth keeping if** it did something testimonials rarely do, such as showing what was bought. |
| `faq-accordion` | Broken: cropped and inert, index only | Scaled to 72%, cropped, with `pointer-events: none` | Laid out at 600px and fully interactive | Ordinary | An accordion with an eased height transition.<br>**Worth keeping if** closed answers left the tab order; today they are hidden with `max-height: 0` only. |
| `whatsapp-fab` | No: mock | A mock of the button | A 390px frame over a product page; an idle hover shows the tooltip | Ordinary | A floating chat button for one messaging app.<br>**Worth keeping if** it became a general contact button with the channel as a prop. |
| `image-placeholder` | Index only | Legible | A cover and two thumbnails, one labelled | Ordinary | A pulsing grey box.<br>**Worth keeping if** merged into `SkeletonCard`. |
| `sticky-navbar` | Broken: collisions, covered the gallery header, index only | Scaled, with the brand colliding with the links and the bar sticky over the site header | A phone-width frame whose drawer opens on a loop, with an active link | Ordinary | A shop navbar with an announcement bar and a drawer.<br>**Worth keeping if** the drawer trapped focus and closed on Escape, and it absorbed `AppHeader`. |
| `error-boundary` | No: mock, unreadable | A mock scaled to 50% | A frame with a Healthy and Caught toggle; the caught state starts inside the boundary without throwing, so no real error is logged | Ordinary | A class boundary with a refresh screen.<br>**Worth keeping if** it reported errors through `componentDidCatch` and offered an inline fallback for part of a page. |
| `sticky-nav` | Broken: covered the gallery header, index only | A grey slab, sticky over the site header | A frame with a scrolling page under the frosted bar | Ordinary | Its theme button swaps only its own icon; the bar never changes palette.<br>**Worth keeping if** the toggle actually themed the bar. |
| `use-theme-ripple` | No: no preview | The word "Preview" | A frame where an idle loop presses the toggle from its own centre, so the circular wipe is visible | Solid | A clip-path wipe from the click point is a memorable theme switch. No reduced-motion check, and keyboard presses start the wipe from the corner. |
| `shiny-badge` | Broken: near invisible, index only | A light badge on the dark stage | Paper stage with a headline under the badge | Ordinary | A badge with a light sweep.<br>**Worth keeping if** merged with `ShinyText` into one shimmer. |
| `border-beam-button` | Broken: white slab, index only | A white slab | Primary and ghost buttons on paper | Ordinary | A beam circling the border, the third animated-border button.<br>**Worth keeping if** merged with `ConicBorderButton`. |
| `typing-hero` | Broken: cropped, index only | A giant cropped "Build" | A 900px frame replaying every nine seconds | Ordinary | A serif hero whose subtitle types itself.<br>**Worth keeping if** it fixed its interval leak and became an example built on `TextType`. |
| `feature-card-grid` | Broken: cropped, index only | A cropped fragment, one word per line | Laid out at 640px under a section heading | Ordinary | Three bordered cards.<br>**Worth keeping if** merged into one `CardGrid`. |
| `numbered-steps-list` | Broken: cropped, index only | A cropped fragment | Laid out at 560px under a section heading | Ordinary | An ordered list, well set.<br>**Worth keeping if** it revealed step by step on scroll. |
| `formula-block` | Broken: overflowing, index only | A white slab overflowing its card | Laid out at 460px | Ordinary | A monospace formula on a tint.<br>**Worth keeping if** it typeset real maths. |
| `signal-card-grid` | Broken: cropped, index only | A tiny cropped fragment | Laid out at 640px under a section heading | Ordinary | Four definition cards for one framework.<br>**Worth keeping if** merged into `CardGrid`. |
| `principle-card-grid` | Broken: overlapping, index only | Overlapping titles | Laid out at 760px under a section heading | Ordinary | Four principle cards.<br>**Worth keeping if** merged into `CardGrid`. |
| `diagnostic-grid` | Broken: cropped, index only | A cropped fragment | Laid out at 600px under a section heading | Ordinary | Tagged diagnosis cards.<br>**Worth keeping if** merged into `CardGrid`. |
| `callout-box` | Broken: cropped, index only | A cropped fragment | Laid out at 480px with real content | Ordinary | An amber callout with a symbol list.<br>**Worth keeping if** it absorbed `Checklist` as one callout with list styles. |
| `checklist` | Broken: overflowing, index only | A white slab overflowing its card | Laid out at 440px | Ordinary | Hairline rows with check marks.<br>**Worth keeping if** merged into `CalloutBox`. |
| `scroll-reveal` | Index only | Tiny chips that had finished revealing before anyone looked | Three cards showing the up, left and scale variants, with replay | Solid | The reveal wrapper most pages need, with zero dependencies and a real reduced-motion fallback. |
| `site-footer` | Broken: unreadable, index only | Scaled to 55% | Laid out at 900px with columns and a legal row | Ordinary | A well-set footer.<br>**Worth keeping if** it carried the brand further than a glowing dot. |
| `depth-text` | Index only | Legible and strong | Brand colours and a "Move" hint | Showcase | Extruded type that tilts with the pointer, and still behaves: layers hidden from assistive tech, pointer-gated, with a full reduced-motion path. It stops people. |
| `magnet` | Index only | Legible | A real button inside, with a generous pull radius | Solid | The pull and spring-back feel right and reduced motion is respected. Small, and exactly what it should be. |
| `glare-hover` | Broken: a green block, index only | A flat green block with no hint | A photo print with a caption; an idle sweep shows the glare | Ordinary | A glare that follows the pointer.<br>**Worth keeping if** merged into `PointerGlowCard` as a glare mode. |
| `cinematic-water-background` | Index only | Legible and strong | Hero copy over it | Showcase | Turbulent water, light shafts and rising bubbles in SVG and CSS set a mood no stock background does. Two always-on turbulence filters make it expensive. |
| `conic-border-button` | Index only | Legible | Textured and plain variants side by side | Solid | The spinning conic ring over grain has real material presence; of the animated-border buttons, this is the one to keep. |
| `pointer-glow-card` | Broken: white slab, index only | A white slab | A product card on paper; the glow follows the pointer or keyboard focus | Solid | A subtle gradient border under the pointer that also works on focus. |
| `shiny-gradient-text` | Index only | Legible but small | A large display line with a subline | Ordinary | Gradient-filled text.<br>**Worth keeping if** merged with `ShinyText`. |
| `blur-in-reveal` | Broken: near invisible, index only | `neutral-700` text on the dark stage | Paper stage; eyebrow, headline and body blur in, with replay | Ordinary | ScrollReveal with a blur.<br>**Worth keeping if** it became a `blur` variant of `ScrollReveal`. |
| `section-progress-rail` | No: mock dots | A drawing of dots | The real rail stepping through five sections while idle; clicking a dot selects it | Ordinary | Dots with a pill for the current section. It hides below 1180px and its targets are 8px.<br>**Worth keeping if** it worked on smaller screens with 24px targets. |
| `edge-fade-marquee` | Broken: visible edges, index only | The fade colour did not match the stage, so boxes showed at both ends | Fade set to the stage token; chips under a heading | Solid | A marquee done properly: pure CSS, pauses on hover, stops for reduced motion. |
| `parallax-product-stage` | Broken: a sliver, index only | Scaled to 42%, a green sliver | Laid out at 600px with illustrated bottles, replay and a "Move" hint | Solid | The best-engineered file in the library, re-running its GSAP context when the reduced-motion setting changes. A scene more than a component. |
| `stagger-blur-text` | Broken: near invisible, index only | Dark text on the dark stage | Paper stage; one sentence resolving word by word | Ordinary | A word stagger.<br>**Worth keeping if** merged into `BlurInReveal`. |
| `animated-gradient-rule` | Index only | A lone thin line | Placed between two chapter headings, where a rule belongs | Ordinary | A two-pixel gradient line on a loop.<br>**Worth keeping if** it tracked scroll progress instead of looping. |
| `jewelry-cursor` | No: text mock | A sentence describing it | A cream frame where an idle pointer traces the links; a note appears when no fine pointer is present | Solid | The lagging ring that swells over links is refined, and it is gated on pointer type and reduced motion. |
| `scroll-unfurl-preloader` | No: a lone trigger, index only | A lone button and no preloader | A contained frame that plays, rests and replays. The invitation text shown after it was removed at the owner's request | Showcase | Brass rods rolling apart to unfurl parchment is real art direction, with session-once, scroll-lock and reduced-motion handling built in. |
| `wax-seal-button` | Broken: cramped, index only | Labels wrapped onto two lines | No-wrap layout on a warm ground; an idle hover presses the seal | Solid | The press and radiating ring feel tactile and specific. Reduced motion is checked on enter but not on leave. |
| `canvas-petal-field` | Index only | Legible | A save-the-date card for context | Solid | Marigold petals drifting and nudged by the cursor, with zero dependencies and a reduced-motion check. Project-specific, but beautifully made. |
| `film-grain-overlay` | Broken: a black rectangle, index only | Grain at 4% alpha was invisible, leaving a black box | A split view: the grain as shipped, and the same canvas over mid-grey with contrast raised so the texture shows | Ordinary | Grain so faint it is invisible unless you know it is there.<br>**Worth keeping if** it shipped presets strong enough to see. |
| `scratch-foil-reveal` | Index only | Legible and strong | A card underneath, replay and a "Scratch" hint | Showcase | Scratching gold foil away with the pointer is delightful and instantly understood. It has no keyboard path, which must be fixed before it ships. |
| `pixel-demorph-image` | Broken: effect already played, index only | A flat orange rectangle | Replay on demand, resolving over 1.5 s from five blocks | Solid | A distinctive pixel-to-sharp reveal, built right: the canvas sits over a real `img` with alt text and reduced motion is respected. |
| `scroll-parallax-layer` | Broken: mostly empty, index only | Only the bundled petal field showed, as a single petal | Three layers at different speeds and rotations over the petal field, with a "Scroll" hint | Ordinary | A ScrollTrigger depth primitive; a card gives it very little to scroll.<br>**Worth keeping if** `FallingPetalField` were split out and the primitive shown in a scrolling page. |
| `till-receipt-print` | Broken: cropped, index only | Scaled to 50% and cropped | Laid out at 380px on cream, with replay | Solid | A receipt printing from a slot and stamping PAID is specific and fun. 2.4 s of choreography with no way to skip. |
| `magic-rings` | Index only | Legible, but the rings were cut to two arcs | Centred, with pointer parallax, click burst and a "Move" hint | Showcase | Two-colour WebGL rings that answer the pointer and a click: the strongest first impression in the gallery. It pulls in `three` for one background. |
| `star-border` | Index only | A legible cream slab | Outline, primary and gold tones side by side | Solid | Light glints along the edges read as quality, in three well-judged tones. |
| `shiny-text` | Index only | Legible | A status line over a short checklist | Solid | The best of the shimmer implementations, falling back to plain text under reduced motion. |
| `circular-text` | Broken: illegible, index only | Tiny and unreadable | A larger ring around a serif initial that speeds up on hover | Ordinary | Text on a spinning ring, a common agency flourish.<br>**Worth keeping if** the ring answered scroll or pointer direction. |
| `pinched-button` | Index only | A legible cream slab | Filled and ghost buttons side by side | Solid | The asymmetric pinched corner is an original shape and the hover lift is well tuned. |
| `multi-step-loader` | No: a lone trigger, index only | A lone button and no loader | A frame looping five stages | Solid | Ticked stages, a shining active label and correct status wiring. It imports two components by relative path, so the CLI cannot ship it yet. |
| `metallic-logo-shimmer` | Index only | A legible cream slab | A Bezel wordmark as the logo | Ordinary | A metallic sweep across a logo whose alt text is hard-coded to "YASH logo".<br>**Worth keeping if** the alt came from props and the sweep could follow the pointer. |
| `highlighter` | Index only | The old demo ran two words together ("feelunforgettable") | Highlight, underline and circle marks in one sentence, with replay | Ordinary | Hand-drawn marks through `rough-notation`.<br>**Worth keeping if** it drew its own SVG strokes and dropped the dependency. |
| `text-type` | Index only | Legible, but a source of hydration warnings | Client-side mount; three lines typing and deleting | Ordinary | A typewriter effect.<br>**Worth keeping if** it absorbed `TypingHero` and announced the finished line to screen readers once. |
| `celebration-overlay` | No: a lone trigger, index only | A lone button and no overlay | A frame that opens it, lets it close and reopens it after a pause | Solid | Confetti, blur and a card pop, with the best dialog semantics in the library. |
| `damask-tile-backdrop` | Broken: pattern missing, index only | Only the glass pane showed | A frame at full opacity with the glass pane over it | Ordinary | The component veils its own pattern at 94%, so the damask barely shows even now.<br>**Worth keeping if** the veil were a prop with a default that lets the pattern read. |

---

## Library bugs found along the way

Not fixed, because they change component behaviour rather than the gallery.

- **45 components inject `<style>{css}</style>`.** React escapes the quotes and
  angle brackets inside during server rendering, so the client text differs and
  hydration fails. The gallery avoids it by mounting previews client-side; a
  consumer rendering these on the server will hit it.
- **17 components depend on shadcn colour tokens** (`primary`, `muted`,
  `border` and others) that Bezel does not define: PriceBreakdown, ProductCard,
  DualConfirmDialog, CircularText, EcomEmptyState, EmptyState, LoadingSpinner,
  MD3Switch, AppHeader, SkeletonCard, Breadcrumb, CategoryChips,
  MobileBottomNav, Pagination, TubelightNavBar, SearchOverlay, StickyCartBar.
- **ProductCard** nests its notify button inside another button.
- **DamaskTileBackdrop** covers its pattern with a 94% veil.
- **MetallicLogoShimmer** hard-codes `alt="YASH logo"`.
- **TypingHero** leaks an interval.
- **MD3Switch** creates an `AudioContext` per toggle and never closes it.
- **CustomCursor** hides below 769px and is not hidden from assistive tech.
- **SectionProgressRail** hides below 1180px and has 8px targets.
- **MobileBottomNav** and **StickyCartBar** are `md:hidden`.
- **FAQAccordion** leaves closed answers in the tab order.
- **ToastContainer** and **LoadingSpinner** have no live region or status role.
- **AppHeader** renders an `h1`.
- **SidePanel**'s `PanelField` label is not associated with its input.
- **TextInput** shows its error visually only.
- **ErrorBoundary** has no `componentDidCatch`.
- **Highlighter**, **MagicRings** and **CelebrationOverlay** each pull in a
  dependency (`rough-notation`, `three`, `canvas-confetti`) that nothing else
  uses.
