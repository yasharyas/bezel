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
