import { registry, type ComponentEntry } from "@bezel/registry";

/** A registry entry without its source, safe to send to the client. */
export type CatalogEntry = {
  slug: string;
  name: string;
  path: string;
  category: string;
  description: string;
  tags: string[];
};

export type CategoryOption = { id: string; label: string; count: number };

const LABELS: Record<string, string> = {
  ecommerce: "E-commerce",
  general: "General",
};

export function categoryLabel(id: string) {
  return LABELS[id] ?? id.charAt(0).toUpperCase() + id.slice(1);
}

/**
 * Tags that also show as a chip on the card and the component page. Every
 * other tag stays search-only; add one here only when it tells a visitor
 * where the component belongs, not what it is built with.
 */
const TAG_LABELS: Record<string, string> = {
  hero: "Hero",
};

/** Chip labels for an entry, in its tag order. */
export function tagLabels(entry: { tags: string[] }): string[] {
  return entry.tags.flatMap((tag) => (TAG_LABELS[tag] ? [TAG_LABELS[tag]] : []));
}

function toCatalogEntry(entry: ComponentEntry): CatalogEntry {
  return {
    slug: entry.slug,
    name: entry.name,
    path: entry.path,
    category: entry.category ?? "general",
    description: entry.description,
    tags: entry.tags,
  };
}

const arrivalOrder: CatalogEntry[] = registry.map(toCatalogEntry);

/**
 * Components the index must not show next to each other.
 *
 * The registry is in arrival order, so a batch written in one sitting lands as
 * a run of near-identical cards. These six were drafted together as one
 * editorial set and, six abreast, they read as a single foreign block rather
 * than as six components. Listing a slug here does not change what it is or
 * where it belongs: it only says the index has to space it out.
 */
const SPACED_OUT = new Set([
  "numbered-steps-list",
  "formula-block",
  "callout-box",
  "checklist",
  "scroll-reveal",
  "site-footer",
]);

/**
 * Lift the spaced-out slugs out of the sequence and drop them back at even
 * intervals across it. Everything else keeps its arrival order and its
 * neighbours, and the spacing follows the length of the list, so adding
 * components never collapses the group back together.
 */
function spaceOut(entries: CatalogEntry[]): CatalogEntry[] {
  const group = entries.filter((entry) => SPACED_OUT.has(entry.slug));
  if (group.length < 2 || group.length + 1 >= entries.length) return entries;

  const rest = entries.filter((entry) => !SPACED_OUT.has(entry.slug));
  const step = entries.length / (group.length + 1);
  const slots = new Map<number, CatalogEntry>();
  let last = -1;
  for (const [i, entry] of group.entries()) {
    // Rounding can land two members on one index in a short list; nudge rather
    // than drop, so the output always holds every entry exactly once.
    const at = Math.min(entries.length - 1, Math.max(Math.round((i + 1) * step), last + 1));
    slots.set(at, entry);
    last = at;
  }
  // A nudge that ran off the end would lose an entry; leave the order alone.
  if (slots.size !== group.length) return entries;

  const out: CatalogEntry[] = [];
  let next = 0;
  for (let i = 0; i < entries.length; i++) {
    const held = slots.get(i);
    out.push(held ?? rest[next++]);
  }
  return out;
}

export const catalog: CatalogEntry[] = spaceOut(arrivalOrder);

/**
 * Categories in first-appearance order, each with how many components it
 * holds. Counted off arrival order, not the index order, so spacing a
 * component out cannot reshuffle the filter chips.
 */
export const categories: CategoryOption[] = (() => {
  const counts = new Map<string, number>();
  for (const entry of arrivalOrder) counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1);
  return Array.from(counts, ([id, count]) => ({ id, label: categoryLabel(id), count }));
})();

export function getEntry(slug: string) {
  return registry.find((entry) => entry.slug === slug);
}
