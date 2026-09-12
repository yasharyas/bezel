import { specs } from "./specs";
import type { PreviewComponent, PreviewModule } from "./types";

/*
 * Previews are code-split. Inline previews load in four groups keyed by their
 * heaviest dependency, so opening a form preview never pulls in three.js.
 * Frame previews load one module each, because each runs in its own document.
 */

const inlineGroups: Record<string, () => Promise<{ previews: PreviewModule }>> = {
  basic: () => import("./inline/basic"),
  motion: () => import("./inline/motion"),
  gsap: () => import("./inline/gsap"),
  three: () => import("./inline/three"),
};

const frames: Record<string, () => Promise<{ default: PreviewComponent }>> = {
  "submission-loader": () => import("./frames/submission-loader"),
  "toast-container": () => import("./frames/toast-container"),
  "dual-confirm-dialog": () => import("./frames/dual-confirm-dialog"),
  "custom-cursor": () => import("./frames/custom-cursor"),
  preloader: () => import("./frames/preloader"),
  "site-header": () => import("./frames/site-header"),
  "mobile-menu": () => import("./frames/mobile-menu"),
  "featured-project-card": () => import("./frames/featured-project-card"),
  "contact-section": () => import("./frames/contact-section"),
  "category-grid": () => import("./frames/category-grid"),
  "search-overlay": () => import("./frames/search-overlay"),
  "mobile-bottom-nav": () => import("./frames/mobile-bottom-nav"),
  "sticky-cart-bar": () => import("./frames/sticky-cart-bar"),
  "app-header": () => import("./frames/app-header"),
  "whatsapp-fab": () => import("./frames/whatsapp-fab"),
  "sticky-navbar": () => import("./frames/sticky-navbar"),
  "error-boundary": () => import("./frames/error-boundary"),
  "sticky-nav": () => import("./frames/sticky-nav"),
  "use-theme-ripple": () => import("./frames/use-theme-ripple"),
  "typing-hero": () => import("./frames/typing-hero"),
  "jewelry-cursor": () => import("./frames/jewelry-cursor"),
  "scroll-unfurl-preloader": () => import("./frames/scroll-unfurl-preloader"),
  "multi-step-loader": () => import("./frames/multi-step-loader"),
  "celebration-overlay": () => import("./frames/celebration-overlay"),
  "damask-tile-backdrop": () => import("./frames/damask-tile-backdrop"),
};

const cache = new Map<string, Promise<PreviewComponent>>();

export function loadPreview(slug: string): Promise<PreviewComponent> {
  const cached = cache.get(slug);
  if (cached) return cached;

  const spec = specs[slug];
  if (!spec) return Promise.reject(new Error(`No preview spec for "${slug}".`));

  const pending =
    spec.kind === "inline"
      ? inlineGroups[spec.group]().then((mod) => {
          const component = mod.previews[slug];
          if (!component) throw new Error(`The ${spec.group} group has no preview for "${slug}".`);
          return component;
        })
      : (frames[slug]?.() ?? Promise.reject(new Error(`No frame module for "${slug}".`))).then(
          (mod) => mod.default,
        );

  // A failed chunk load should be retryable on the next mount.
  pending.catch(() => cache.delete(slug));
  cache.set(slug, pending);
  return pending;
}

/** For scripts/check-previews.mjs and the dev-time completeness assertion. */
export const frameModuleSlugs = Object.keys(frames);
