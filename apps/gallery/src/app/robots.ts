import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Frame previews are isolated render targets for the index, not pages.
    rules: [{ userAgent: "*", allow: "/", disallow: "/preview/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
