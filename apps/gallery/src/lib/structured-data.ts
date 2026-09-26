import type { CatalogEntry } from "@/lib/catalog";
import { categoryLabel } from "@/lib/catalog";
import { GITHUB_URL, NPM_URL, PORTFOLIO_URL, SITE_DESCRIPTION, SITE_URL } from "@/lib/site";

/**
 * JSON-LD for search engines. Kept to types that describe what the site is:
 * the gallery as a WebSite, the library and each component as source code,
 * and a breadcrumb back to the index.
 */

const author = { "@type": "Person", name: "Yash Arya", url: PORTFOLIO_URL } as const;

export function siteSchema() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Bezel",
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      author,
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareSourceCode",
      name: "Bezel",
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      codeRepository: GITHUB_URL,
      programmingLanguage: ["TypeScript", "React"],
      runtimePlatform: "React",
      license: "https://opensource.org/licenses/MIT",
      sameAs: [NPM_URL, GITHUB_URL],
      author,
    },
  ];
}

export function componentSchema(entry: CatalogEntry) {
  const url = `${SITE_URL}/component/${entry.slug}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareSourceCode",
      name: entry.name,
      description: entry.description,
      url,
      codeRepository: GITHUB_URL,
      programmingLanguage: ["TypeScript", "React"],
      runtimePlatform: "React",
      license: "https://opensource.org/licenses/MIT",
      keywords: [categoryLabel(entry.category), ...entry.tags].join(", "),
      isPartOf: { "@type": "SoftwareSourceCode", name: "Bezel", url: SITE_URL },
      author,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Bezel", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: entry.name, item: url },
      ],
    },
  ];
}

/** Serialise for a script tag. `<` is escaped so no string can close the tag early. */
export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
