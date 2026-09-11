# Bezel

**A React component library for interfaces that move.**

A bezel is the frame that holds a lens, a watch face, a screen: the precise edge around the thing you actually look at. That is what this library is for: the framing, the motion, the transitions and the surface detail around your content, built to a standard you would not get from a generic starter kit.

Bezel is source-distributed. You install it, you import it, and the actual `.tsx` lands in your bundle unminified and readable. Nothing is hidden behind a compiled artifact, so when a component is 90% right you can open it, read it, and fork it into your own codebase without fighting a build.

**[Browse every component with a live preview →](https://bezel-ui.vercel.app/)**

---

## What you get

Bezel is weighted toward the parts of an interface that are tedious to build well and obvious when they are built badly:

- **Motion & reveal**: scroll-triggered reveals, blur-in text, parallax layers, marquees, staggered entrances
- **Navigation**: sticky and floating nav bars, section progress rails, breadcrumbs, mobile menus, pagination
- **Pointer & cursor**: magnetic hover targets, custom cursors, specular glare, pointer-tracked card lighting
- **Loaders & feedback**: full-screen preloaders, skeletons, toasts, empty states, multi-step progress
- **Editorial surfaces**: extruded depth text, foil and shine sweeps, circular text, film-grain overlays
- **Forms & inputs**: a validated text field, a Material 3 switch, checkbox variants, an illustrated image drop zone

Components are written to be individually adoptable. There is no global provider, no theme object to configure, and no context you must wrap your app in.

---

## Install

```bash
npm install bezel-ui
```

Peer dependencies you need in your project:

```bash
npm install react react-dom lucide-react
```

`gsap`, `motion`, `three`, `canvas-confetti` and `rough-notation` come with the package, because the animation-heavy components depend on them directly.

---

## Setup

Bezel ships TypeScript source rather than compiled JavaScript. That is a deliberate trade: you get readable, forkable components, but your bundler has to transpile them.

**1. Transpile the package.** In Next.js, add it to `next.config.js`:

```js
module.exports = {
  transpilePackages: ["bezel-ui"],
};
```

**2. Let Tailwind see the class names.** Components are styled with Tailwind utilities, so the source has to be in your `content` globs or every class gets purged:

```js
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/bezel-ui/src/**/*.{js,ts,jsx,tsx}",
  ],
};
```

Most components use plain Tailwind utilities and work as-is. A handful (notably `TubelightNavBar`, `Pagination`, `Breadcrumb`, `ProductCard` and the other commerce surfaces) reference shadcn-style CSS variable tokens (`--background`, `--foreground`, `--primary`, `--muted`, `--border`). If your project does not define those, either add them to your global stylesheet or pass your own `className`.

---

## Usage

```tsx
"use client";

import { ScrollReveal, ShinyText, Magnet } from "bezel-ui";

export function Hero() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center gap-8">
      <ScrollReveal variant="up">
        <h1 className="text-6xl font-semibold tracking-tight">
          Framing is the work.
        </h1>
      </ScrollReveal>

      <ScrollReveal variant="up" delay={200}>
        <ShinyText text="Now shipping" speed={3} className="text-lg" />
      </ScrollReveal>

      <ScrollReveal variant="scale" delay={400}>
        <Magnet magnetStrength={4}>
          <button className="rounded-full border px-6 py-2.5">
            Get started
          </button>
        </Magnet>
      </ScrollReveal>
    </section>
  );
}
```

`ScrollReveal` uses an `IntersectionObserver` and injects its own keyframes, so it works without extra CSS, and it respects `prefers-reduced-motion`, falling back to no animation at all.

### Importing a single component

Every file is reachable directly, which keeps the dependency graph tight if you only want one thing:

```tsx
import { DepthText } from "bezel-ui/display/DepthText";
import { PointerGlowCard } from "bezel-ui/cards/PointerGlowCard";
```

### Client components

Most of Bezel is interactive and carries the `"use client"` directive. In the Next.js App Router, import these from a client component or a client boundary: dropping an animated component straight into a server component will not work.

---

## Requirements

| | |
|---|---|
| React | 18 or 19 |
| Styling | Tailwind CSS |
| Bundler | Any that transpiles TypeScript/JSX from `node_modules` |

---

## License

MIT © [Yash Arya](https://yash-arya.com)
