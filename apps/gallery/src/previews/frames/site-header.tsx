"use client";

import { SiteHeader } from "bezel-ui/navigation/SiteHeader";
import { IMAGES } from "../kit";

export default function SiteHeaderPreview() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <img src={IMAGES.city} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
      <SiteHeader
        logo="Bezel"
        navLinks={[
          { label: "Work", href: "#work" },
          { label: "Studio", href: "#studio" },
          { label: "Journal", href: "#journal" },
        ]}
        ctaLabel="Get in touch"
      />
      <div className="absolute bottom-16 left-20 right-20">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/80">Selected work, 2021 to 2026</p>
        <h1 className="mt-4 text-6xl font-medium leading-[0.95] tracking-tight">Buildings that hold light</h1>
      </div>
    </main>
  );
}
