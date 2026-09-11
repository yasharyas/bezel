import { siteCard, ogSize } from "@/lib/og";
import { catalog } from "@/lib/catalog";

export const alt = "Bezel, a React component library for interfaces that need motion and craft";
export const runtime = "edge";
export const size = ogSize;
export const contentType = "image/png";

export default function OpenGraphImage() {
  return siteCard({ count: catalog.length });
}
