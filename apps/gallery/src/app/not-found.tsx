import Link from "next/link";
import { GalleryFooter } from "@/components/site/GalleryFooter";
import { GalleryHeader } from "@/components/site/GalleryHeader";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <GalleryHeader />
      <main id="main" className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 py-24 sm:px-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-void-muted">404</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">There is no component here</h1>
        <p className="mt-3 max-w-md text-void-muted">
          The link may point at a component that was renamed. Every component in the library is listed on the index.
        </p>
        <Link
          href="/#components"
          className="focus-ring mt-8 inline-flex w-fit items-center rounded-xl bg-paper-raised px-4 py-2.5 text-sm font-medium text-[#0a0a0a]"
        >
          Browse all components
        </Link>
      </main>
      <GalleryFooter />
    </div>
  );
}
