import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { frameSlugs, specs } from "@/previews/specs";
import { FrameRuntime } from "./FrameRuntime";

export const dynamicParams = false;

export function generateStaticParams() {
  return frameSlugs.map((slug) => ({ slug }));
}

export const metadata: Metadata = {
  title: "Preview",
  robots: { index: false, follow: false },
};

export default function FramePreviewPage({ params }: { params: { slug: string } }) {
  const spec = specs[params.slug];
  if (!spec || spec.kind !== "frame") notFound();
  return <FrameRuntime slug={params.slug} tone={spec.tone} />;
}
