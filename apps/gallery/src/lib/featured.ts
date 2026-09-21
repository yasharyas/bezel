/**
 * Everything the "Start with these" strip can show. Six are on screen at a
 * time and the strip cycles through the rest one card at a time, so a visitor
 * who never scrolls still sees more than six ideas.
 *
 * This is the one list to edit: the strip and FEATURED both read it, in this
 * order, and a slug appears exactly once. To earn a place here a component has
 * to survive a card-sized frame and move on its own, because a still of it
 * would say nothing.
 */
export const SHOWCASE_POOL = [
  // The six the page opens on.
  "magic-rings",
  "depth-text",
  "scroll-flip-deck",
  "sketch-highlight",
  "particle-qr-code",
  "parallax-product-stage",
  // Then the rest of the rotation, in the order they come round.
  "scroll-unfurl-preloader",
  "morph-dialog",
  "glyph-field",
  "edge-fade-marquee",
  "jewelry-cursor",
  "timed-tabs",
  "autoplay-carousel",
  "till-receipt-print",
];

/** How many cards the strip shows at once. */
export const SHOWCASE_SLOTS = 6;

/**
 * The set the strip opens on, and the set it holds still on when motion is
 * not wanted. Anything that needs one fixed answer to "what do we lead with"
 * reads this rather than the pool.
 */
export const FEATURED = SHOWCASE_POOL.slice(0, SHOWCASE_SLOTS);

/**
 * Components that lead the "All components" grid, in this order, ahead of
 * registry order. Everything else keeps its place. Nothing from the opening
 * six goes here: the grid starts in the same column the strip ends in, so a
 * slug in both places shows the same card twice with one heading between them.
 */
export const PINNED = ["glyph-field"];

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
