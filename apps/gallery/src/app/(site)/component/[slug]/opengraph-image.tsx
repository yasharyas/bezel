import { componentCard, ogSize } from "@/lib/og";
import { catalog, categoryLabel } from "@/lib/catalog";

export const runtime = "edge";
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return catalog.map((entry) => ({ slug: entry.slug }));
}

export function generateImageMetadata({ params }: { params: { slug: string } }) {
  const entry = catalog.find((e) => e.slug === params.slug);
  return [{ id: "card", size: ogSize, contentType, alt: entry ? `${entry.name}, a Bezel component` : "A Bezel component" }];
}

export default function ComponentOpenGraphImage({ params }: { params: { slug: string } }) {
  const entry = catalog.find((e) => e.slug === params.slug);
  if (!entry) return componentCard({ slug: params.slug, name: "Bezel", description: "", category: "" });
  return componentCard({
    slug: entry.slug,
    name: entry.name,
    description: entry.description,
    category: categoryLabel(entry.category),
  });
}
