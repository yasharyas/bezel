#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Component source lives in the `bezel-ui` package, not in this one. Resolve it
// the way Node would from two vantage points:
//
//   process.cwd()  the project the user is running `bezel add` in, where
//                  `bezel-ui` is a normal dependency. This is the only path
//                  that matters for an installed CLI.
//   __dirname      alongside the CLI itself. Covers a global install that
//                  carries `bezel-ui` with it, and this repo, where npm
//                  workspaces symlink `bezel-ui` into the root node_modules.
//
// Both are plain Node resolution, so there is no in-repo special case to keep
// in sync — the monorepo just happens to satisfy the second lookup.
function resolveComponentsDir() {
  for (const from of [process.cwd(), __dirname]) {
    let pkgJsonPath;
    try {
      pkgJsonPath = require.resolve("bezel-ui/package.json", { paths: [from] });
    } catch {
      continue;
    }
    const srcDir = path.join(path.dirname(pkgJsonPath), "src");
    if (fs.existsSync(srcDir)) return srcDir;
  }
  return null;
}

function missingLibraryError() {
  console.error("Cannot find the bezel-ui component source.");
  console.error("");
  console.error("The CLI copies files out of the bezel-ui package, so it has to");
  console.error("be installed in this project first:");
  console.error("");
  console.error("  npm install bezel-ui");
  console.error("");
  console.error(`Looked in: ${process.cwd()} and ${__dirname}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const command = args[0];
const componentName = args[1];

const COMPONENT_MAP = {
  "glass-button": "GlassButton.tsx",
  card: "Card.tsx",
  "text-input": "forms/TextInput.tsx",
  stepper: "navigation/Stepper.tsx",
  "submission-loader": "feedback/SubmissionLoader.tsx",
  "typewriter-loader": "feedback/TypewriterLoader.tsx",
  "toast-container": "feedback/ToastContainer.tsx",
  "toolbar-button": "buttons/ToolbarButton.tsx",
  "collapsible-sidebar": "navigation/CollapsibleSidebar.tsx",
  "side-panel": "panels/SidePanel.tsx",
  "node-card": "cards/NodeCard.tsx",
  "tubelight-navbar": "navigation/TubelightNavBar.tsx",
  "md3-switch": "forms/MD3Switch.tsx",
  "blender-upload": "forms/BlenderUpload.tsx",
  "empty-state": "feedback/EmptyState.tsx",
  "checkbox-variants": "forms/CheckboxVariants.tsx",
  "loading-spinner": "feedback/LoadingSpinner.tsx",
  "price-breakdown": "cards/PriceBreakdown.tsx",
  pagination: "navigation/Pagination.tsx",
  "custom-cursor": "interaction/CustomCursor.tsx",
  preloader: "loaders/Preloader.tsx",
  "site-header": "navigation/SiteHeader.tsx",
  "mobile-menu": "navigation/MobileMenu.tsx",
  "elastic-line-divider": "dividers/ElasticLineDivider.tsx",
  "circle-cta": "buttons/CircleCTA.tsx",
  "image-reveal": "media/ImageReveal.tsx",
  "featured-project-card": "cards/FeaturedProjectCard.tsx",
  "project-card": "cards/ProjectCard.tsx",
  marquee: "animation/Marquee.tsx",
  "contact-section": "sections/ContactSection.tsx",
  "text-disperse-link": "buttons/TextDisperseLink.tsx",
  "image-with-fallback": "media/ImageWithFallback.tsx",
  "skeleton-card": "loaders/SkeletonCard.tsx",
  "testimonial-card": "cards/TestimonialCard.tsx",
  "image-placeholder": "feedback/ImagePlaceholder.tsx",
  "sticky-navbar": "navigation/StickyNavbar.tsx",
  "error-boundary": "feedback/ErrorBoundary.tsx",
  "sticky-nav": "navigation/StickyNav.tsx",
  "use-theme-ripple": "hooks/useThemeRipple.tsx",
  "shiny-badge": "badges/ShinyBadge.tsx",
  "border-beam-button": "buttons/BorderBeamButton.tsx",
  "typing-hero": "sections/TypingHero.tsx",
  "card-grid": "cards/CardGrid.tsx",
  "numbered-steps-list": "lists/NumberedStepsList.tsx",
  "formula-block": "display/FormulaBlock.tsx",
  "callout-box": "callouts/CalloutBox.tsx",
  checklist: "lists/Checklist.tsx",
  "scroll-reveal": "animation/ScrollReveal.tsx",
  "site-footer": "layout/SiteFooter.tsx",
  "depth-text": "display/DepthText.tsx",
  magnet: "interaction/Magnet.tsx",
  "glare-hover": "interaction/GlareHover.tsx",
  "cinematic-water-background": "media/CinematicWaterBackground.tsx",
  "pointer-glow-card": "cards/PointerGlowCard.tsx",
  "shiny-gradient-text": "display/ShinyGradientText.tsx",
  "blur-in-reveal": "animation/BlurInReveal.tsx",
  "section-progress-rail": "navigation/SectionProgressRail.tsx",
  "edge-fade-marquee": "animation/EdgeFadeMarquee.tsx",
  "parallax-product-stage": "sections/ParallaxProductStage.tsx",
  "stagger-blur-text": "animation/StaggerBlurText.tsx",
  "animated-gradient-rule": "dividers/AnimatedGradientRule.tsx",
  "jewelry-cursor": "interaction/JewelryCursor.tsx",
  "scroll-unfurl-preloader": "loaders/ScrollUnfurlPreloader.tsx",
  "canvas-petal-field": "animation/CanvasPetalField.tsx",
  "film-grain-overlay": "overlays/FilmGrainOverlay.tsx",
  "scratch-foil-reveal": "interaction/ScratchFoilReveal.tsx",
  "pixel-demorph-image": "media/PixelDemorphImage.tsx",
  "scroll-parallax-layer": "animation/ScrollParallaxLayer.tsx",
  "till-receipt-print": "feedback/TillReceiptPrint.tsx",
  "magic-rings": "animation/MagicRings.tsx",
  "shiny-text": "animation/ShinyText.tsx",
  "circular-text": "display/CircularText.tsx",
  "pinched-button": "buttons/PinchedButton.tsx",
  // multi-step-loader is intentionally omitted: it imports MagicRings and
  // ShinyText via relative paths, which the CLI's flat single-file copy
  // can't preserve. Browse it in the gallery and copy all three by hand.
  "metallic-logo-shimmer": "media/MetallicLogoShimmer.tsx",
  highlighter: "animation/Highlighter.tsx",
  "text-type": "animation/TextType.tsx",
  "celebration-overlay": "feedback/CelebrationOverlay.tsx",
  "damask-tile-backdrop": "layout/DamaskTileBackdrop.tsx",
  "morph-dialog": "dialogs/MorphDialog.tsx",
  "particle-qr-code": "display/ParticleQrCode.tsx",
  "timed-tabs": "navigation/TimedTabs.tsx",
  "glyph-field": "animation/GlyphField.tsx",
  "docking-card": "cards/DockingCard.tsx",
  "sideways-scroll": "sections/SidewaysScroll.tsx",
  "scroll-flip-deck": "sections/ScrollFlipDeck.tsx",
  "sketch-highlight": "animation/SketchHighlight.tsx",
  "sketch-arrow": "callouts/SketchArrow.tsx",
  "pixel-avatar": "display/PixelAvatar.tsx",
  "autoplay-carousel": "media/AutoplayCarousel.tsx",
};

function showHelp() {
  console.log(`
  bezel - Add UI components to your project

  Usage:
    bezel add <component>

  Requires bezel-ui to be installed in the project:
    npm install bezel-ui

  Components:
    glass-button         Glassmorphism button
    card                 Translucent card
    text-input           Pill-shaped text input with validation
    stepper              Multi-step progress indicator
    submission-loader    Full-screen loading overlay
    typewriter-loader    Pure CSS typewriter animation
    toast-container      Toast notifications with useToast hook
    toolbar-button       Icon-only toolbar button
    collapsible-sidebar  Draggable categorised sidebar
    side-panel           Right-side sliding form panel
    node-card            Workflow node card with accent colour
    tubelight-navbar     Floating nav bar with lamp glow (framer-motion)
    md3-switch           Material Design 3 toggle switch with haptics
    blender-upload       Drag-and-drop upload with blender animation
    empty-state          Centered empty state with icon slot and CTA
    checkbox-variants    4 animated checkbox variants (ripple/glow/morph/pulse)
    loading-spinner      3-size border-spin loading spinner
    price-breakdown      Tax/GST price breakdown card
    pagination           Accessible composable pagination
    custom-cursor        GSAP crosshair cursor with mix-blend-mode
    preloader            Fullscreen letter-reveal preloader with counter
    site-header          Fixed portfolio nav with hover-fill CTA
    mobile-menu          Hamburger overlay fullscreen menu
    elastic-line-divider Interactive SVG spring-physics divider
    circle-cta           GSAP SVG stroke-draw circle button
    image-reveal         Scroll-triggered GSAP clip-path image reveal
    featured-project-card Full-width portfolio project card
    project-card         Masonry-style project card with hover-zoom
    marquee              Infinite GSAP scrolling text marquee
    contact-section      Dark contact card with animated border & spotlight
    text-disperse-link   GSAP per-character scatter hover link
    image-with-fallback  Image that falls back to a placeholder SVG on error
    skeleton-card        Pulse-animated skeleton card and row placeholders
    testimonial-card     Testimonial card with star rating and avatar
    image-placeholder    Image skeleton placeholder with shimmer overlay
    sticky-navbar        Sticky navbar with frosted-glass scroll effect
    error-boundary       Class error boundary with a layered, retryable fallback
    sticky-nav           Glassmorphism sticky nav with theme toggle
    use-theme-ripple     Dark/light toggle hook with ripple reveal animation
    shiny-badge          Pill badge with shimmering gradient-sweep text
    border-beam-button   Button with a beam, conic or star ring, in six fills
    typing-hero          Hero section with typewriter-animated subtitle
    card-grid            Card grid with label, number, letter or tag eyebrows
    numbered-steps-list  Ordered list, mono number column, serif titles
    formula-block        Monospace formula on a tinted plate, with caption
    callout-box          Amber-spined callout with a labelled symbol list
    checklist            Card-row checklist with solid round markers
    scroll-reveal        IntersectionObserver reveal wrapper, 4 variants
    site-footer          Footer that wraps from four columns down to one
    depth-text           Extruded 3D text with pointer-tilt and auto-orbit
    magnet               Magnetic pointer-attraction wrapper for CTAs
    glare-hover          Pointer-following specular glare overlay
    cinematic-water-background  Layered SVG underwater parallax background
    pointer-glow-card    Card with a pointer-following glowing border ring
    shiny-gradient-text  Animated shimmering gradient text sweep
    blur-in-reveal       Scroll-triggered blur + fade + slide-up reveal
    section-progress-rail  Fixed dot-to-pill section scroll indicator
    edge-fade-marquee    Infinite marquee with soft-faded edges
    parallax-product-stage  GSAP hero product theatre with pointer parallax
    stagger-blur-text    Word-by-word blur-in text generate effect
    animated-gradient-rule  Sliding gradient divider line
    jewelry-cursor        GSAP gold dot + lagging ring custom cursor
    scroll-unfurl-preloader  Parchment scroll-unfurl fullscreen preloader
    canvas-petal-field    Ambient falling marigold/jasmine canvas particles
    film-grain-overlay    Fixed full-viewport animated film-grain noise
    scratch-foil-reveal   Canvas scratch-off foil revealing content beneath
    pixel-demorph-image   Scroll-triggered pixel-block to sharp image reveal
    scroll-parallax-layer GSAP ScrollTrigger depth plane: drift, scale, blur
    till-receipt-print    Clip-path receipt print-out with PAID stamp
    magic-rings           Three.js shader backdrop of expanding rings
    shiny-text             Motion-driven gradient text shine sweep
    circular-text          Characters orbiting a ring, hover speed control
    pinched-button         Asymmetric-radius editorial CTA with hover lift
    metallic-logo-shimmer  Masked metallic sweep + glow over a logo image
    highlighter             Rough-notation hand-drawn highlight/underline
    text-type               Typewriter with GSAP blinking cursor
    celebration-overlay     Confetti burst overlay with GSAP card entrance
    damask-tile-backdrop    Fixed repeating ornamental pattern backdrop
    morph-dialog            Modal that grows out of its trigger, with a focus trap
    particle-qr-code        Scannable QR codes that assemble from grains and cycle, with a pause button
    timed-tabs              Self-advancing tabs with a pause button
    glyph-field             Word built as a 3D solid of glyphs that tilts toward the cursor
    docking-card            Card whose picture flies into a header dock on hover
    sideways-scroll         Row of cards that pins and pans sideways on scroll
    scroll-flip-deck     Pinned image deck that tips card by card on scroll
    autoplay-carousel       Never-cropping photo carousel with a pause button
    sketch-highlight        Marker wash on a phrase, drawn stroke by stroke
    sketch-arrow            Drawn arrow that stays attached to two elements
    pixel-avatar            Seeded 8x8 pixel creatures and cute species that hop

  Not in the CLI (copy by hand from the gallery):
    multi-step-loader       Imports MagicRings and ShinyText

  Example:
    npx bezel-add add glass-button
  `);
}

// Components the single-file copy can't carry, and what to do instead. Kept
// out of COMPONENT_MAP so they don't fall through to "Unknown component".
const HAND_COPY = {
  "multi-step-loader":
    'multi-step-loader isn\'t in the CLI: it imports MagicRings and ShinyText by relative path.\n' +
    "Copy all three files from the gallery instead:\n" +
    "  https://bezel-ui.vercel.app/component/multi-step-loader",
};

function addComponent(slug) {
  if (HAND_COPY[slug]) {
    console.error(HAND_COPY[slug]);
    process.exit(1);
  }

  const fileName = COMPONENT_MAP[slug];
  if (!fileName) {
    console.error(`Unknown component: "${slug}"`);
    console.error(`Available: ${Object.keys(COMPONENT_MAP).join(", ")}`);
    process.exit(1);
  }

  const componentsDir = resolveComponentsDir();
  if (!componentsDir) missingLibraryError();

  const srcFile = path.join(componentsDir, fileName);
  if (!fs.existsSync(srcFile)) {
    console.error(`Source file not found: ${srcFile}`);
    console.error("The installed bezel-ui version may not contain this component.");
    process.exit(1);
  }

  const baseName = path.basename(fileName);
  const destDir = path.join(process.cwd(), "components", "ui");
  fs.mkdirSync(destDir, { recursive: true });

  const destFile = path.join(destDir, baseName);
  fs.copyFileSync(srcFile, destFile);
  console.log(`✓ Added ${baseName} → components/ui/${baseName}`);
}

if (!command || command === "help" || command === "--help") {
  showHelp();
} else if (command === "add") {
  if (!componentName) {
    console.error("Please specify a component name.");
    showHelp();
    process.exit(1);
  }
  addComponent(componentName);
} else {
  console.error(`Unknown command: "${command}"`);
  showHelp();
  process.exit(1);
}
