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
