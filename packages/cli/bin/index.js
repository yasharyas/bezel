#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const COMPONENTS_DIR = path.join(__dirname, "../../ui/src");

const args = process.argv.slice(2);
const command = args[0];
const componentName = args[1];

const COMPONENT_MAP = {
  "glass-button": "GlassButton.tsx",
  card: "Card.tsx",
  input: "Input.tsx",
  "text-input": "forms/TextInput.tsx",
  "radio-group": "forms/RadioGroup.tsx",
  checkbox: "forms/Checkbox.tsx",
  "dob-picker": "forms/DOBPicker.tsx",
  "select-input": "forms/SelectInput.tsx",
  "file-upload": "forms/FileUpload.tsx",
  stepper: "navigation/Stepper.tsx",
  "stepper-navigation": "navigation/StepperNavigation.tsx",
  "submission-loader": "feedback/SubmissionLoader.tsx",
  "screen-layout": "layout/ScreenLayout.tsx",
  "typewriter-loader": "feedback/TypewriterLoader.tsx",
  "toast-container": "feedback/ToastContainer.tsx",
  "toolbar-button": "buttons/ToolbarButton.tsx",
  "collapsible-sidebar": "navigation/CollapsibleSidebar.tsx",
  "side-panel": "panels/SidePanel.tsx",
  "node-card": "cards/NodeCard.tsx",
  "tubelight-navbar": "navigation/TubelightNavBar.tsx",
  "md3-switch": "forms/MD3Switch.tsx",
  "dual-confirm-dialog": "dialogs/DualConfirmDialog.tsx",
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
  "ecom-empty-state": "feedback/EcomEmptyState.tsx",
  breadcrumb: "navigation/Breadcrumb.tsx",
  "category-chips": "navigation/CategoryChips.tsx",
  "category-grid": "navigation/CategoryGrid.tsx",
  "search-overlay": "overlays/SearchOverlay.tsx",
  "mobile-bottom-nav": "navigation/MobileBottomNav.tsx",
  "product-card": "cards/ProductCard.tsx",
  "sticky-cart-bar": "panels/StickyCartBar.tsx",
  "app-header": "layout/AppHeader.tsx",
  "bakery-product-card": "cards/BakeryProductCard.tsx",
  "testimonial-card": "cards/TestimonialCard.tsx",
  "faq-accordion": "sections/FAQAccordion.tsx",
  "whatsapp-fab": "buttons/WhatsAppFAB.tsx",
  "image-placeholder": "feedback/ImagePlaceholder.tsx",
  "sticky-navbar": "navigation/StickyNavbar.tsx",
  "error-boundary": "feedback/ErrorBoundary.tsx",
  "sticky-nav": "navigation/StickyNav.tsx",
  "use-theme-ripple": "hooks/useThemeRipple.tsx",
  "shiny-badge": "badges/ShinyBadge.tsx",
  "border-beam-button": "buttons/BorderBeamButton.tsx",
  "typing-hero": "sections/TypingHero.tsx",
  "feature-card-grid": "cards/FeatureCardGrid.tsx",
  "numbered-steps-list": "lists/NumberedStepsList.tsx",
  "formula-block": "display/FormulaBlock.tsx",
  "signal-card-grid": "cards/SignalCardGrid.tsx",
  "principle-card-grid": "cards/PrincipleCardGrid.tsx",
  "diagnostic-grid": "cards/DiagnosticGrid.tsx",
  "callout-box": "callouts/CalloutBox.tsx",
  checklist: "lists/Checklist.tsx",
  "scroll-reveal": "animation/ScrollReveal.tsx",
  "site-footer": "layout/SiteFooter.tsx",
  "depth-text": "display/DepthText.tsx",
  magnet: "interaction/Magnet.tsx",
  "glare-hover": "interaction/GlareHover.tsx",
  "cinematic-water-background": "media/CinematicWaterBackground.tsx",
  "conic-border-button": "buttons/ConicBorderButton.tsx",
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
  "foil-specular-card": "cards/FoilSpecularCard.tsx",
  "wax-seal-button": "buttons/WaxSealButton.tsx",
  "canvas-petal-field": "animation/CanvasPetalField.tsx",
  "film-grain-overlay": "overlays/FilmGrainOverlay.tsx",
  "scratch-foil-reveal": "interaction/ScratchFoilReveal.tsx",
  "pixel-demorph-image": "media/PixelDemorphImage.tsx",
  "scroll-parallax-layer": "animation/ScrollParallaxLayer.tsx",
  "till-receipt-print": "feedback/TillReceiptPrint.tsx",
  "magic-rings": "animation/MagicRings.tsx",
  "star-border": "buttons/StarBorder.tsx",
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
};

function showHelp() {
  console.log(`
  yash-ui - Add UI components to your project

  Usage:
    yash-ui add <component>

  Components:
    glass-button         Glassmorphism button
    card                 Translucent card
    input                Styled input field
    text-input           Pill-shaped text input with validation
    radio-group          Pill chip radio selector
    checkbox             Circular custom checkbox
    dob-picker           DD/MM/YYYY date input
    select-input         Radix UI select dropdown
    file-upload          File upload with preview
    stepper              Multi-step progress indicator
    stepper-navigation   Previous/Next/Submit buttons
    submission-loader    Full-screen loading overlay
    screen-layout        Form layout shell with header
    typewriter-loader    Pure CSS typewriter animation
    toast-container      Toast notifications with useToast hook
    toolbar-button       Icon-only toolbar button
    collapsible-sidebar  Draggable categorised sidebar
    side-panel           Right-side sliding form panel
    node-card            Workflow node card with accent colour
    tubelight-navbar     Floating nav bar with lamp glow (framer-motion)
    md3-switch           Material Design 3 toggle switch with haptics
    dual-confirm-dialog  Two-step destructive confirmation dialog
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
    ecom-empty-state     Cart/search/category/network empty states
    breadcrumb           Accessible breadcrumb trail with Home icon
    category-chips       Scrollable category filter chips (framer-motion)
    category-grid        Responsive category grid with staggered entrance
    search-overlay       Fullscreen search overlay with recent/popular searches
    mobile-bottom-nav    Mobile bottom nav with animated active indicator
    product-card         E-commerce product card with cart stepper animation
    sticky-cart-bar      Sticky mobile cart summary bar (framer-motion)
    app-header           Sticky app header with search bar and cart badge
    bakery-product-card  Product card with shimmer placeholder and hover lift
    testimonial-card     Testimonial card with star rating and avatar
    faq-accordion        Accessible FAQ accordion, one item open at a time
    whatsapp-fab         Floating WhatsApp chat button
    image-placeholder    Image skeleton placeholder with shimmer overlay
    sticky-navbar        Sticky navbar with frosted-glass scroll effect
    error-boundary       Class-based error boundary with fallback UI
    sticky-nav           Glassmorphism sticky nav with theme toggle
    use-theme-ripple     Dark/light toggle hook with ripple reveal animation
    shiny-badge          Pill badge with shimmering gradient-sweep text
    border-beam-button   Button with animated gradient border beam
    typing-hero          Hero section with typewriter-animated subtitle
    feature-card-grid    Responsive 3-column feature card grid
    numbered-steps-list  Ordered list with monospace step numbers
    formula-block        Monospace formula display in accent-bordered box
    signal-card-grid     5-column card grid with serif display letters
    principle-card-grid  4-column principle card grid
    diagnostic-grid      2-column diagnostic card grid with warning pills
    callout-box          Amber warning-style callout box
    checklist            Card-row checklist with circular accent badges
    scroll-reveal        IntersectionObserver reveal wrapper, 4 variants
    site-footer          4-column responsive footer with copyright bar
    depth-text           Extruded 3D text with pointer-tilt and auto-orbit
    magnet               Magnetic pointer-attraction wrapper for CTAs
    glare-hover          Pointer-following specular glare overlay
    cinematic-water-background  Layered SVG underwater parallax background
    conic-border-button  Pill button with a spinning conic-gradient border
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
    foil-specular-card    Invitation card with pointer-tracked foil sheen
    wax-seal-button       Press-in CTA with a radiating SVG ring on hover
    canvas-petal-field    Ambient falling marigold/jasmine canvas particles
    film-grain-overlay    Fixed full-viewport animated film-grain noise
    scratch-foil-reveal   Canvas scratch-off foil revealing content beneath
    pixel-demorph-image   Scroll-triggered pixel-block to sharp image reveal
    scroll-parallax-layer GSAP ScrollTrigger depth/rotate parallax wrapper
    till-receipt-print    Clip-path receipt print-out with PAID stamp
    magic-rings           Three.js shader backdrop of expanding rings
    star-border            Button with sliding radial-gradient border beams
    shiny-text             Motion-driven gradient text shine sweep
    circular-text          Characters orbiting a ring, hover speed control
    pinched-button         Asymmetric-radius editorial CTA with hover lift
    metallic-logo-shimmer  Masked metallic sweep + glow over a logo image
    highlighter             Rough-notation hand-drawn highlight/underline
    text-type               Typewriter with GSAP blinking cursor
    celebration-overlay     Confetti burst overlay with GSAP card entrance
    damask-tile-backdrop    Fixed repeating ornamental pattern backdrop

  Example:
    npx yash-ui add glass-button
  `);
}

function addComponent(slug) {
  const fileName = COMPONENT_MAP[slug];
  if (!fileName) {
    console.error(`Unknown component: "${slug}"`);
    console.error(`Available: ${Object.keys(COMPONENT_MAP).join(", ")}`);
    process.exit(1);
  }

  const srcFile = path.join(COMPONENTS_DIR, fileName);
  if (!fs.existsSync(srcFile)) {
    console.error(`Source file not found: ${srcFile}`);
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
