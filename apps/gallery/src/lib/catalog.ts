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

function toCatalogEntry(entry: ComponentEntry): CatalogEntry {
  return {
    slug: entry.slug,
    name: entry.name,
    path: entry.path,
    category: entry.category ?? "general",
    description: entry.prompt,
    tags: entry.tags,
  };
}

export const catalog: CatalogEntry[] = registry.map(toCatalogEntry);

/** Categories in first-appearance order, each with how many components it holds. */
export const categories: CategoryOption[] = (() => {
  const counts = new Map<string, number>();
  for (const entry of catalog) counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1);
  return Array.from(counts, ([id, count]) => ({ id, label: categoryLabel(id), count }));
})();

export function getEntry(slug: string) {
  return registry.find((entry) => entry.slug === slug);
}
