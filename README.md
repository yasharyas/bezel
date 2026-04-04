# yash-ui-system

A production-ready UI Component Library + Gallery + CLI system in a monorepo.

## Structure

```
root/
  apps/gallery        → Next.js component gallery (preview + code + copy)
  packages/ui         → Reusable UI components (GlassButton, Card, Input)
  packages/registry   → Component metadata registry
  packages/cli        → CLI to import components into projects
```

## Components

| Component | Description |
|-----------|-------------|
| GlassButton | Glassmorphism button with blur and transparency |
| Card | Translucent card with optional title |
| Input | Styled input field with optional label |

## Quick Start

```bash
# Install dependencies
npm install

# Run gallery
cd apps/gallery && npm run dev

# Add a component to your project
npx yash-ui add glass-button
```

## CLI Usage

```bash
yash-ui add <component>
```

Available components: `glass-button`, `card`, `input`

## Tech Stack

- TypeScript, React, Tailwind CSS
- Next.js (gallery app)
- Turborepo (monorepo management)
- Node.js fs (CLI)
Production-ready UI Component Library + Gallery + CLI system
