import type { MetadataRoute } from "next";
import { catalog } from "@/lib/catalog";
import { SITE_URL } from "@/lib/site";
import lastmod from "@/lib/lastmod.json";

// lastmod comes from git commit dates (scripts/lastmod.mjs), so it only moves when a page really
// changes. Google ignores priority and changefreq, so they are left out.
const dates = lastmod as Record<string, string>;
const newest = dates["/"];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, lastModified: newest },
    { url: `${SITE_URL}/principles`, lastModified: dates["/principles"] ?? newest },
    { url: `${SITE_URL}/states`, lastModified: dates["/states"] ?? newest },
    ...catalog.map((entry) => ({
      url: `${SITE_URL}/component/${entry.slug}`,
      lastModified: dates[entry.slug] ?? newest,
    })),
  ];
}
