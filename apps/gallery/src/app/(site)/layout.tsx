import { GalleryFooter } from "@/components/site/GalleryFooter";
import { GalleryHeader } from "@/components/site/GalleryHeader";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <GalleryHeader />
      <div className="flex-1">{children}</div>
      <GalleryFooter />
    </div>
  );
}
