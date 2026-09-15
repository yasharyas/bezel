/**
 * The first previews a visitor sees: the five components rated Showcase in
 * GALLERY-AUDIT.md, plus ParallaxProductStage. Each is a complete idea,
 * renders well at card size, and does something a screenshot cannot.
 */
export const FEATURED = [
  "magic-rings",
  "scratch-foil-reveal",
  "depth-text",
  "cinematic-water-background",
  "parallax-product-stage",
  "scroll-unfurl-preloader",
];

/**
 * Components that lead the "All components" grid, in this order, ahead of
 * registry order. Everything else keeps its place.
 */
export const PINNED = ["particle-qr-code", "glyph-field"];

/** `entries` with the pinned slugs moved to the front, otherwise unchanged. */
export function pinFirst<T extends { slug: string }>(entries: T[], pinned: string[] = PINNED): T[] {
  const rank = (slug: string) => {
    const i = pinned.indexOf(slug);
    return i < 0 ? pinned.length : i;
  };
  return entries
    .map((entry, order) => ({ entry, order }))
    .sort((a, b) => rank(a.entry.slug) - rank(b.entry.slug) || a.order - b.order)
    .map(({ entry }) => entry);
}
