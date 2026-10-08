import { catalog } from "@/lib/catalog";
import { ogSize, siteCard } from "@/lib/og";

export const runtime = "nodejs";
export const alt = "Bezel, a React component library for interfaces that need motion and craft";
export const size = ogSize;
export const contentType = "image/png";

export default function TwitterImage() {
  return siteCard({ count: catalog.length });
}
