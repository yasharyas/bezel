import type { MetadataRoute } from "next";
import { catalog } from "@/lib/catalog";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/principles`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/states`, changeFrequency: "monthly", priority: 0.6 },
    ...catalog.map((entry) => ({
      url: `${SITE_URL}/component/${entry.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
