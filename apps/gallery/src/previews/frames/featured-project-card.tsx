"use client";

import { FeaturedProjectCard } from "bezel-ui/cards/FeaturedProjectCard";
import { IMAGES } from "../kit";

export default function FeaturedProjectCardPreview() {
  return (
    <main className="grid min-h-screen grid-cols-[1.1fr_0.9fr] items-center gap-14 bg-[#0a0a0a] px-14 text-white">
      <FeaturedProjectCard
        title="Golden hour"
        eyebrow="Photography"
        imageSrc={IMAGES.mountains}
        imageAlt="A mountain ridge in evening light"
        tags={["Editorial", "2026"]}
      />
      <div className="self-start pt-24">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/70">Selected work · 01 / 04</p>
        <p className="mt-6 max-w-sm text-xl leading-relaxed text-white/80">
          A season of ridge lines shot in the last twenty minutes of light, printed large.
        </p>
      </div>
    </main>
  );
}
