import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Frame previews are isolated render targets for the index, not pages.
    // Everyone else, AI crawlers included, may read the site; llms.txt and llms-full.txt summarise it.
    rules: [{ userAgent: "*", allow: "/", disallow: "/preview/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
