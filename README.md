# Bezel
A React component library for interfaces that move — motion, navigation, pointer behaviour and editorial surfaces — published to npm as [`bezel-ui`](https://www.npmjs.com/package/bezel-ui) and developed here as a Turborepo monorepo with a live gallery and a component-copying CLI.

A bezel is the frame that holds a lens, a watch face or a screen: the precise edge around the thing you actually look at. That is the scope of the library — the framing around your content.

**Live gallery:** [bezel-ui.vercel.app](https://bezel-ui.vercel.app/) — the source of truth for what currently ships.

## Structure

```
root/
  apps/gallery        → Next.js gallery app (browse, preview, and copy component code)
  packages/ui          → `bezel-ui` — the component source (packages/ui/src/<category>/Component.tsx)
  packages/registry    → `@bezel/registry` — metadata consumed by the gallery + CLI
  packages/cli         → `bezel-add` — copies a component's source into a target project
```

## Tech Stack

- **React 18/19** + **TypeScript**
- **Tailwind CSS** for styling
- **Next.js 14** (gallery app, `apps/gallery`)
- **Turborepo** + npm workspaces for the monorepo
- **GSAP** and **Framer Motion** for animation-heavy components
- **lucide-react** for icons

## Quick Start

```bash
# Install dependencies (from repo root)
npm install

# Run the component gallery
npm run dev
# → gallery available at http://localhost:3333

# Or just the gallery workspace
cd apps/gallery && npm run dev
```

```bash
# Build all workspaces
npm run build

# Lint all workspaces
npm run lint
```

## Component Catalog

Every component lives in `packages/ui/src/<category>/`, is registered in `packages/registry/src/index.ts`, and gets a live preview at `/component/<slug>` in the gallery app.

### Core

| Component | Slug | Description |
|---|---|---|
| GlassButton | `glass-button` | A glassmorphism-styled button with blur and transparency effects. |
| Card | `card` | A translucent card component with optional title. |

### Forms & Inputs

| Component | Slug | Description |
|---|---|---|
| TextInput | `text-input` | A reusable pill-shaped text input with label, validation error, mandatory asterisk, uppercase mode, and disabled state. |
| MD3Switch | `md3-switch` | Material Design 3 toggle switch with spring-easing physics, a hover/press halo, rotating check/X icons, two sizes, and optional haptic click sound. |
| BlenderUpload | `blender-upload` | Drag-and-drop image upload staged as a blender: fruit drops in, the lid goes on, the rig shakes and the blade spins while the chunks swirl and the colours mix, then it pours into a smoothie glass. |
| CheckboxVariants | `checkbox-variants` | Four stylized Tailwind-only checkbox variants: ripple, rainbow glow, morphing border, and pulsing circle. |

### Navigation

| Component | Slug | Description |
|---|---|---|
| Stepper | `stepper` | Responsive stepper with mobile progress bar and desktop numbered bubbles. |
| CollapsibleSidebar | `collapsible-sidebar` | Collapsible left sidebar with search, categorised draggable items, coloured icon badges, and toggle to icon-only mode. |
| TubelightNavBar | `tubelight-navbar` | Floating pill-shaped nav bar with a glowing "tubelight" active-item indicator, animated with Framer Motion spring. |
| Pagination | `pagination` | Accessible, composable pagination (`Pagination`, `PaginationItem`, `PaginationLink`, `PaginationEllipsis`, etc). |
| SiteHeader | `site-header` | Fixed top nav for a dark portfolio site with dual-text hover links and an expanding-circle CTA button. |
| MobileMenu | `mobile-menu` | Hamburger-to-X animated icon that opens a fullscreen overlay menu with pill-bordered links. |
| StickyNavbar | `sticky-navbar` | Sticky navbar with frosted-glass scroll effect, announcement bar, and animated mobile drawer. |
| TimedTabs | `timed-tabs` | Self-advancing tabs whose progress bar is the timer, with a sliding paper tab, a pause button and full keyboard support. |
| StickyNav | `sticky-nav` | Sticky glassmorphism nav with brand logo, center links, and a moon/sun theme-toggle button. |
| SectionProgressRail | `section-progress-rail` | Fixed rail of section dots where the current dot stretches into a pill. |

### Buttons & CTAs

| Component | Slug | Description |
|---|---|---|
| ToolbarButton | `toolbar-button` | Compact icon-only toolbar button with hover/disabled states, optional tooltip, neutral colour scheme. |
| CircleCTA | `circle-cta` | Circular CTA button with a GSAP-animated SVG stroke that draws around it on hover. |
| TextDisperseLink | `text-disperse-link` | Text link whose characters scatter to preset offsets on hover and snap back on mouse leave (GSAP). |
| BorderBeamButton | `border-beam-button` | Button whose border carries a travelling beam, a spinning conic gradient or sweeping edge glints, across six fills. |
| PinchedButton | `pinched-button` | Asymmetric brick button with a pinched corner radius, hover lift and arrow nudge. |

### Cards

| Component | Slug | Description |
|---|---|---|
| NodeCard | `node-card` | Node card for visual workflow builders — accent bar, icon badge, selected ring, React Flow handle slots. |
| PriceBreakdown | `price-breakdown` | Read-only price breakdown: base price, tax, divider, total. |
| FeaturedProjectCard | `featured-project-card` | Large full-width portfolio project card with alternating image/text layout. |
| ProjectCard | `project-card` | Masonry-style portfolio project card with hover-zoom image. |
| TestimonialCard | `testimonial-card` | Testimonial card with star rating, quoted review, and auto-generated author avatar. |
| CardGrid | `card-grid` | One card grid with four eyebrow styles: mono label, number, serif drop letter or amber tag. |
| DockingCard | `docking-card` | Card whose picture flies into a header dock on hover or focus while a detail panel rises into the space it left. |
| PointerGlowCard | `pointer-glow-card` | Card whose border and surface light up under the pointer or keyboard focus. |

### Feedback & States

| Component | Slug | Description |
|---|---|---|
| SubmissionLoader | `submission-loader` | Full-screen overlay with phased loading states (verifying, validating, submitting, complete) and success checkmark. |
| TypewriterLoader | `typewriter-loader` | Pure CSS animated typewriter loader with sliding carriage and scrolling paper. |
| ToastContainer | `toast-container` | Toast notification system with a `useToast` hook, auto-dismiss, and portal-based bottom-right stacking. |
| EmptyState | `empty-state` | Centered empty state with icon slot, heading, description, and optional CTA. |
| LoadingSpinner | `loading-spinner` | Minimal centered spinner in three sizes using `animate-spin`. |
| ImagePlaceholder | `image-placeholder` | Image skeleton/placeholder with shimmer overlay and centered icon. |
| ErrorBoundary | `error-boundary` | Class error boundary whose fallback arrives in layers and retries in place. |
| TillReceiptPrint | `till-receipt-print` | Payment receipt that prints out of a till slot and stamps itself PAID. |
| ConfettiFirecracker | `confetti-firecracker` | Canvas firework whose fragments are sampled from your rendered text, so they fall into place spelling it, hold, then drop out of frame. |
| CelebrationOverlay | `celebration-overlay` | Blurred success dialog with three timed confetti bursts and a card that pops in. |

### Layout

| Component | Slug | Description |
|---|---|---|
| SiteFooter | `site-footer` | Footer that wraps from four columns down to one, with a brand block and a legal row. |
| DamaskTileBackdrop | `damask-tile-backdrop` | Fixed ornamental tile lattice behind the page, plus a matching tiled glass pane. |

### Panels

| Component | Slug | Description |
|---|---|---|
| SidePanel | `side-panel` | Right-side sliding panel with header, scrollable body, footer, plus `PanelField`/`PanelInput` helpers. |

### Dialogs

| Component | Slug | Description |
|---|---|---|
| MorphDialog | `morph-dialog` | Modal that grows out of the control that opened it, with an inert background, a focus trap, Escape handling and focus return. |

### Interaction

| Component | Slug | Description |
|---|---|---|
| CustomCursor | `custom-cursor` | GSAP-driven crosshair custom cursor with `mix-blend-mode: difference` and hover-grow targets. |
| Magnet | `magnet` | Wrapper that pulls its child toward a nearby pointer, then springs back. |
| GlareHover | `glare-hover` | Soft-light glare that follows the pointer across any surface it wraps. |
| JewelryCursor | `jewelry-cursor` | Gold dot cursor with a lagging ring that swells over links and buttons. |
| ScratchFoilReveal | `scratch-foil-reveal` | Gold foil you scratch away with the pointer, clearing itself past a threshold. |

### Loaders

| Component | Slug | Description |
|---|---|---|
| Preloader | `preloader` | Fullscreen letter-reveal preloader with a 0–100% counter and slide-away exit. |
| ScrollUnfurlPreloader | `scroll-unfurl-preloader` | Parchment preloader where brass rods roll apart to unfurl the brand, then lift away. |
| MultiStepLoader | `multi-step-loader` | Full-screen step loader with ticked stages, a shining active label and WebGL rings. Not in the CLI: it imports `MagicRings` and `ShinyText`, so copy it by hand. |

### Loading

| Component | Slug | Description |
|---|---|---|
| SkeletonCard | `skeleton-card` | `SkeletonCard` and `SkeletonRow` loading placeholders with a slow sheen, announced as loading. |

### Dividers

| Component | Slug | Description |
|---|---|---|
| ElasticLineDivider | `elastic-line-divider` | Interactive SVG divider that deflects like a spring-physics elastic thread on mouse movement. |
| AnimatedGradientRule | `animated-gradient-rule` | Two-pixel divider with a slow three-colour gradient sliding along it. |

### Media

| Component | Slug | Description |
|---|---|---|
| ImageReveal | `image-reveal` | Scroll-triggered GSAP `clip-path` image reveal with cinematic scale-down. |
| AutoplayCarousel | `autoplay-carousel` | Photo carousel that never crops, times itself with its progress bar and pauses for hover, focus, touch, off-screen and hidden tabs. |
| ImageWithFallback | `image-with-fallback` | `<img>` wrapper that gracefully falls back to an SVG placeholder on load failure. |
| CinematicWaterBackground | `cinematic-water-background` | Underwater backdrop of turbulent waves, drifting light shafts and rising bubbles. |
| PixelDemorphImage | `pixel-demorph-image` | Image that resolves from coarse pixel blocks to sharp as it scrolls into view. |
| MetallicLogoShimmer | `metallic-logo-shimmer` | Logo on a soft plate with a champagne bloom and a slow metallic sweep. |

### Animation

| Component | Slug | Description |
|---|---|---|
| Marquee | `marquee` | Infinite GSAP horizontal scrolling text marquee, oversized and low-opacity for a watermark effect. |
| GlyphField | `glyph-field` | Canvas halftone of a word in glyphs that part and take the accent colour under the pointer. |
| ScrollReveal | `scroll-reveal` | `IntersectionObserver` reveal wrapper with four variants, token timing and a reduced-motion fallback. |
| SketchHighlight | `sketch-highlight` | Marker wash, underline or strike drawn as its own seeded strokes, cycling three takes so the ink keeps boiling. |
| MagicRings | `magic-rings` | WebGL rings that expand in two colours, with optional mouse parallax and click burst. |
| BlurInReveal | `blur-in-reveal` | Scroll reveal that lifts content into place out of a 7px blur. |
| StaggerBlurText | `stagger-blur-text` | Paragraph that resolves word by word out of a soft blur. |
| EdgeFadeMarquee | `edge-fade-marquee` | CSS marquee with faded edges that pauses on hover and stops for reduced motion. |
| CanvasPetalField | `canvas-petal-field` | Canvas of marigold and jasmine petals drifting down, nudged by the cursor. |
| ScrollParallaxLayer | `scroll-parallax-layer` | Scroll-scrubbed depth plane that drifts, scales, blurs and fades, with a petal field. |
| ShinyText | `shiny-text` | Text with a sweeping gradient shine that renders plain when motion is reduced. |
| Highlighter | `highlighter` | Hand-drawn highlight, underline, box or circle marks that draw on mount or scroll. |
| TextType | `text-type` | Typewriter that types, pauses and deletes a list of lines with a blinking cursor. |

### Sections

| Component | Slug | Description |
|---|---|---|
| ContactSection | `contact-section` | Dark contact card with a rotating conic-gradient border and cursor-following spotlight. |
| SidewaysScroll | `sideways-scroll` | Row of cards that pins to the viewport and pans sideways with vertical scroll, falling back to a snap scroller. |
| ScrollFlipDeck | `scroll-flip-deck` | Pinned deck of images that turn away one at a time as the page scrolls, with a plain-column fallback. |
| TypingHero | `typing-hero` | Hero section with a typewriter-animated subtitle and CTA that fades in after typing completes. |
| ParallaxProductStage | `parallax-product-stage` | Lit product shelf where three items settle in and drift at different depths. |

### Overlays

| Component | Slug | Description |
|---|---|---|
| FilmGrainOverlay | `film-grain-overlay` | Faint animated film grain drawn on a low-resolution canvas and blended over surfaces. |

### Hooks

| Component | Slug | Description |
|---|---|---|
| useThemeRipple | `use-theme-ripple` | Dark/light mode toggle hook with a circular ripple reveal (Web Animations API) and localStorage persistence. |

### Badges

| Component | Slug | Description |
|---|---|---|
| ShinyBadge | `shiny-badge` | Pill-shaped badge with a shimmering gradient-sweep text animation. |

### Callouts

| Component | Slug | Description |
|---|---|---|
| CalloutBox | `callout-box` | Callout with an amber spine, a serif title, a labelled symbol list and a closing line. |
| SketchArrow | `sketch-arrow` | Drawn arrow between two elements that measures both ends and redraws itself whenever either moves. |

### Lists

| Component | Slug | Description |
|---|---|---|
| NumberedStepsList | `numbered-steps-list` | Ordered list with a mono number column, serif titles and a rule between steps. |
| Checklist | `checklist` | Card-row checklist with a solid round accent marker per item; supports rich JSX content. |

### Display

| Component | Slug | Description |
|---|---|---|
| FormulaBlock | `formula-block` | Monospace formula on a tinted plate, with a ruled-off caption beneath it. |
| ParticleQrCode | `particle-qr-code` | Scannable QR code, encoded with no dependency, that assembles from grains and re-forms when its value changes. |
| DepthText | `depth-text` | Extruded 3D type made of stacked layers that tilts to follow the pointer. |
| PixelAvatar | `pixel-avatar` | Seeded 8x8 pixel avatar: a random mirrored creature or one of ten species (ghost, cat, bunny, frog, bear, slime, robot, heart, octopus, chick), ten palettes, whole-frame blink, hop, bob and glance. |
| ShinyGradientText | `shiny-gradient-text` | Text filled with a narrow metal sweep, legible on both light and dark grounds. |
| CircularText | `circular-text` | Letters set around a spinning ring that speeds up, slows or pauses on hover. |

## Gallery App

`apps/gallery` is a Next.js app that renders every registry entry with a live preview, a popup/fullscreen view, and a copy-to-clipboard code panel. Each component also has its own detail page at `/component/<slug>`.

Live at [bezel-ui.vercel.app](https://bezel-ui.vercel.app/), or run it locally:

```bash
cd apps/gallery
npm run dev
# → http://localhost:3333
```

## Using Bezel in your project

Install the component package from npm:

```bash
npm install bezel-ui
```

```tsx
import { ScrollReveal, ShinyText } from "bezel-ui";
```

Bezel ships TypeScript source rather than compiled JavaScript, so your bundler has to transpile it (`transpilePackages: ["bezel-ui"]` in Next.js) and Tailwind needs `./node_modules/bezel-ui/src/**/*.{js,ts,jsx,tsx}` in its `content` globs. Full setup notes live in [`packages/ui/README.md`](packages/ui/README.md).

## CLI

`bezel-add` provides a `bezel` binary that copies a component's source file straight into `<your-project>/components/ui/`:

```bash
npm install -D bezel-add
bezel add glass-button
bezel help   # list all available components
```

It resolves component source from the installed `bezel-ui` package, so `bezel-ui`
has to be installed too. Without it the CLI exits with a message saying so
rather than failing obscurely.

**Do not run `npx bezel`.** The bare name `bezel` belongs to an unrelated
package on npm, so `npx bezel` will download and run someone else's code. The
package here is `bezel-add`; the `bezel` binary only exists once you have
installed it. If you want a one-off invocation, use `npx bezel-add add
glass-button`, which resolves unambiguously.

`COMPONENT_MAP` in `packages/cli/bin/index.js` stays in sync with `packages/registry/src/index.ts`.

## Adding a New Component

1. Add the component source under `packages/ui/src/<category>/YourComponent.tsx` and export it from `packages/ui/src/index.ts`.
2. Add an entry to `packages/registry/metadata.json`, keyed by slug, with `name` (the file's base name), `category`, `tags` and a `description`: one sentence of 8 to 14 words, under 90 characters, saying what the component is and what sets it apart. Then run `npm run generate -w @bezel/registry`; the generator reads the source file for `code` and `path`, and rejects a description that breaks those rules.
3. Add a preview: an entry in `apps/gallery/src/previews/specs.ts`, and a render in the matching `src/previews/inline/<group>.tsx` or `src/previews/frames/<slug>.tsx`. The same preview is used by the index, the expand dialog and the component page, and `npm run check:previews -w gallery` fails if one is missing.
4. Add it to `COMPONENT_MAP` (and the help text) in `packages/cli/bin/index.js` so it's installable via the CLI.

## Monorepo Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run all workspaces in dev mode (Turborepo) |
| `npm run build` | Build all workspaces |
| `npm run lint` | Type-check/lint all workspaces |
