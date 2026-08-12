# yash-ui-system

A production-ready UI component library, gallery, and CLI — built as a Turborepo monorepo. 73 components across 23 categories, each with copy-paste-ready code, a live preview, and the original generation prompt.

## Structure

```
root/
  apps/gallery        → Next.js gallery app (browse, preview, and copy component code)
  packages/ui          → The component source (packages/ui/src/<category>/Component.tsx)
  packages/registry    → Metadata registry (name, slug, code, prompt, tags) consumed by the gallery + CLI
  packages/cli         → `yash-ui` CLI that copies a component's source into a target project
```

## Tech Stack

- **React 18/19** + **TypeScript**
- **Tailwind CSS** for styling
- **Next.js 14** (gallery app, `apps/gallery`)
- **Turborepo** + npm workspaces for the monorepo
- **GSAP** and **Framer Motion** for animation-heavy components
- **Radix UI** (`react-select`) for accessible primitives
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
| Input | `input` | A styled input field with optional label. |

### Forms & Inputs

| Component | Slug | Description |
|---|---|---|
| TextInput | `text-input` | A reusable pill-shaped text input with label, validation error, mandatory asterisk, uppercase mode, and disabled state. |
| RadioGroup | `radio-group` | Pill-shaped radio chip group with indigo selected state, custom dot indicator, and visually hidden native inputs. |
| Checkbox | `checkbox` | Custom circular checkbox with indigo fill, SVG checkmark, sr-only native input, and error support. |
| DOBPicker | `dob-picker` | Date of birth picker with DD/MM/YYYY masked input, auto-slashes, ISO conversion, numeric mobile keyboard. |
| SelectInput | `select-input` | Radix UI Select with pill-shaped trigger, portal dropdown, keyboard navigation, chevron and check icons. |
| FileUpload | `file-upload` | File upload with dashed drop zone, filename display, image preview modal with backdrop blur, and remove button. |
| MD3Switch | `md3-switch` | Material Design 3 toggle switch with spring-easing physics, a hover/press halo, rotating check/X icons, two sizes, and optional haptic click sound. |
| BlenderUpload | `blender-upload` | Drag-and-drop upload with a playful blender animation — fruits fall in, liquid blends while uploading, then it becomes a smoothie glass. |
| CheckboxVariants | `checkbox-variants` | Four stylized Tailwind-only checkbox variants: ripple, rainbow glow, morphing border, and pulsing circle. |

### Navigation

| Component | Slug | Description |
|---|---|---|
| Stepper | `stepper` | Responsive stepper with mobile progress bar and desktop numbered bubbles. |
| StepperNavigation | `stepper-navigation` | Multi-step form navigation with Previous/Next/Submit buttons, loading spinner, pill shape, flex-1 equal width. |
| CollapsibleSidebar | `collapsible-sidebar` | Collapsible left sidebar with search, categorised draggable items, coloured icon badges, and toggle to icon-only mode. |
| TubelightNavBar | `tubelight-navbar` | Floating pill-shaped nav bar with a glowing "tubelight" active-item indicator, animated with Framer Motion spring. |
| Pagination | `pagination` | Accessible, composable pagination (`Pagination`, `PaginationItem`, `PaginationLink`, `PaginationEllipsis`, etc). |
| SiteHeader | `site-header` | Fixed top nav for a dark portfolio site with dual-text hover links and an expanding-circle CTA button. |
| MobileMenu | `mobile-menu` | Hamburger-to-X animated icon that opens a fullscreen overlay menu with pill-bordered links. |
| Breadcrumb | `breadcrumb` | Generic breadcrumb with Home icon, chevron separators, and link/button item support. |
| CategoryChips | `category-chips` | Horizontally scrollable category filter chips with Framer Motion active/tap states. |
| CategoryGrid | `category-grid` | Responsive category grid (4 cols mobile / 8 desktop) with staggered fade-in icons. |
| MobileBottomNav | `mobile-bottom-nav` | Mobile bottom nav bar with animated active indicator, badge counts, and slide-up entrance. |
| StickyNavbar | `sticky-navbar` | Sticky navbar with frosted-glass scroll effect, announcement bar, and animated mobile drawer. |
| StickyNav | `sticky-nav` | Sticky glassmorphism nav with brand logo, center links, and a moon/sun theme-toggle button. |

### Buttons & CTAs

| Component | Slug | Description |
|---|---|---|
| ToolbarButton | `toolbar-button` | Compact icon-only toolbar button with hover/disabled states, optional tooltip, neutral colour scheme. |
| CircleCTA | `circle-cta` | Circular CTA button with a GSAP-animated SVG stroke that draws around it on hover. |
| TextDisperseLink | `text-disperse-link` | Text link whose characters scatter to preset offsets on hover and snap back on mouse leave (GSAP). |
| WhatsAppFAB | `whatsapp-fab` | Floating WhatsApp chat button that opens a pre-filled `wa.me` link, with hover tooltip. |
| BorderBeamButton | `border-beam-button` | Button with an animated gradient "beam" that continuously travels around its border. |

### Cards

| Component | Slug | Description |
|---|---|---|
| NodeCard | `node-card` | Node card for visual workflow builders — accent bar, icon badge, selected ring, React Flow handle slots. |
| PriceBreakdown | `price-breakdown` | Read-only price breakdown: base price, tax, divider, total. |
| FeaturedProjectCard | `featured-project-card` | Large full-width portfolio project card with alternating image/text layout. |
| ProjectCard | `project-card` | Masonry-style portfolio project card with hover-zoom image. |
| ProductCard | `product-card` | E-commerce product card with discount badge, quantity stepper, out-of-stock overlay, and add-to-cart animation. |
| BakeryProductCard | `bakery-product-card` | Product card with shimmer image placeholder, badge/tag pills, strikethrough pricing, and hover lift. |
| TestimonialCard | `testimonial-card` | Testimonial card with star rating, quoted review, and auto-generated author avatar. |
| FeatureCardGrid | `feature-card-grid` | Responsive 3-column feature card grid with accent-border hover lift. |
| SignalCardGrid | `signal-card-grid` | 5-column card grid with large serif display letters, responsive down to 1 column. |
| PrincipleCardGrid | `principle-card-grid` | 4-column principle card grid with monospace numbering, responsive down to 1 column. |
| DiagnosticGrid | `diagnostic-grid` | 2-column diagnostic card grid with amber/warning-tagged pills. |

### Feedback & States

| Component | Slug | Description |
|---|---|---|
| SubmissionLoader | `submission-loader` | Full-screen overlay with phased loading states (verifying, validating, submitting, complete) and success checkmark. |
| TypewriterLoader | `typewriter-loader` | Pure CSS animated typewriter loader with sliding carriage and scrolling paper. |
| ToastContainer | `toast-container` | Toast notification system with a `useToast` hook, auto-dismiss, and portal-based bottom-right stacking. |
| EmptyState | `empty-state` | Centered empty state with icon slot, heading, description, and optional CTA. |
| LoadingSpinner | `loading-spinner` | Minimal centered spinner in three sizes using `animate-spin`. |
| EcomEmptyState | `ecom-empty-state` | Four preset empty states (cart, search, category, network) with Framer Motion fade-in. |
| ImagePlaceholder | `image-placeholder` | Image skeleton/placeholder with shimmer overlay and centered icon. |
| ErrorBoundary | `error-boundary` | Class-based error boundary with a full-screen fallback UI and reload button. |

### Layout

| Component | Slug | Description |
|---|---|---|
| ScreenLayout | `screen-layout` | Multi-step form shell with brand header, optional stepper slot, and content card. |
| AppHeader | `app-header` | Sticky app header with info banner, logo, search bar, and animated cart badge. |
| SiteFooter | `site-footer` | 4-column responsive footer with brand column and bottom copyright bar. |

### Panels

| Component | Slug | Description |
|---|---|---|
| SidePanel | `side-panel` | Right-side sliding panel with header, scrollable body, footer, plus `PanelField`/`PanelInput` helpers. |

### Dialogs

| Component | Slug | Description |
|---|---|---|
| DualConfirmDialog | `dual-confirm-dialog` | Two-step destructive confirmation dialog requiring a typed phrase, with a loading progress bar. |

### Interaction

| Component | Slug | Description |
|---|---|---|
| CustomCursor | `custom-cursor` | GSAP-driven crosshair custom cursor with `mix-blend-mode: difference` and hover-grow targets. |

### Loaders

| Component | Slug | Description |
|---|---|---|
| Preloader | `preloader` | Fullscreen letter-reveal preloader with a 0–100% counter and slide-away exit. |

### Loading

| Component | Slug | Description |
|---|---|---|
| SkeletonCard | `skeleton-card` | `SkeletonCard` and `SkeletonRow` pulse-animated loading placeholders. |

### Dividers

| Component | Slug | Description |
|---|---|---|
| ElasticLineDivider | `elastic-line-divider` | Interactive SVG divider that deflects like a spring-physics elastic thread on mouse movement. |

### Media

| Component | Slug | Description |
|---|---|---|
| ImageReveal | `image-reveal` | Scroll-triggered GSAP `clip-path` image reveal with cinematic scale-down. |
| ImageWithFallback | `image-with-fallback` | `<img>` wrapper that gracefully falls back to an SVG placeholder on load failure. |

### Animation

| Component | Slug | Description |
|---|---|---|
| Marquee | `marquee` | Infinite GSAP horizontal scrolling text marquee, oversized and low-opacity for a watermark effect. |
| ScrollReveal | `scroll-reveal` | `IntersectionObserver`-based reveal wrapper with four variants and `prefers-reduced-motion` support. |

### Sections

| Component | Slug | Description |
|---|---|---|
| ContactSection | `contact-section` | Dark contact card with a rotating conic-gradient border and cursor-following spotlight. |
| FAQAccordion | `faq-accordion` | Accessible FAQ accordion, one item open at a time, animated max-height transitions. |
| TypingHero | `typing-hero` | Hero section with a typewriter-animated subtitle and CTA that fades in after typing completes. |

### Overlays

| Component | Slug | Description |
|---|---|---|
| SearchOverlay | `search-overlay` | Full-screen search overlay with spring slide-down, recent/popular searches, and blurred backdrop. |

### E-commerce

| Component | Slug | Description |
|---|---|---|
| StickyCartBar | `sticky-cart-bar` | Sticky mobile cart summary bar that spring-animates in/out based on cart contents. |

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
| CalloutBox | `callout-box` | Amber warning-style callout box with title, intro text, and a symbol checklist. |

### Lists

| Component | Slug | Description |
|---|---|---|
| NumberedStepsList | `numbered-steps-list` | Ordered list with monospace step numbers and serif titles, single-column on mobile. |
| Checklist | `checklist` | Card-row checklist with a circular accent badge per item; supports rich JSX content. |

### Display

| Component | Slug | Description |
|---|---|---|
| FormulaBlock | `formula-block` | Monospace formula display in an accent-bordered, horizontally scrollable box. |

## Gallery App

`apps/gallery` is a Next.js app that renders every registry entry with a live preview, a popup/fullscreen view, and a copy-to-clipboard code panel. Each component also has its own detail page at `/component/<slug>`.

```bash
cd apps/gallery
npm run dev
# → http://localhost:3333
```

## CLI Usage

The `yash-ui` CLI copies a component's source file straight into `<your-project>/components/ui/`.

```bash
npx yash-ui add <component>
npx yash-ui help   # list all available components
```

```bash
npx yash-ui add glass-button
npx yash-ui add stepper
npx yash-ui add tubelight-navbar
```

> **Note:** the CLI's `COMPONENT_MAP` (`packages/cli/bin/index.js`) currently covers the earlier subset of components (`glass-button` → `text-disperse-link`). For newer components (e.g. the e-commerce, LanceMart, and layout additions), copy the source directly from `packages/ui/src/<category>/` or use the gallery's copy-code button until the CLI map is extended.

## Adding a New Component

1. Add the component source under `packages/ui/src/<category>/YourComponent.tsx` and export it from `packages/ui/src/index.ts`.
2. Add an entry to the `registry` array in `packages/registry/src/index.ts` with `name`, `slug`, `path`, `category`, the raw `code` string, a `prompt` description, and `tags`.
3. Import and register a preview for it in `apps/gallery/src/app/page.tsx` (and `component/[slug]/page.tsx` if it needs a custom interactive preview).
4. (Optional) Add it to `COMPONENT_MAP` in `packages/cli/bin/index.js` so it's installable via the CLI.

## Monorepo Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run all workspaces in dev mode (Turborepo) |
| `npm run build` | Build all workspaces |
| `npm run lint` | Type-check/lint all workspaces |
