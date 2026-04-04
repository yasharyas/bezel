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
};

function showHelp() {
  console.log(`
  yash-ui - Add UI components to your project

  Usage:
    yash-ui add <component>

  Components:
    glass-button    Glassmorphism button
    card            Translucent card
    input           Styled input field

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

  const destDir = path.join(process.cwd(), "components", "ui");
  fs.mkdirSync(destDir, { recursive: true });

  const destFile = path.join(destDir, fileName);
  fs.copyFileSync(srcFile, destFile);
  console.log(`✓ Added ${fileName} → components/ui/${fileName}`);
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
