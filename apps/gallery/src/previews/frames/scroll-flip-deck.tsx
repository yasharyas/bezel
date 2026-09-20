"use client";

import { useEffect } from "react";
import { ScrollFlipDeck } from "bezel-ui/sections/ScrollFlipDeck";
import { usePreviewEnv } from "../kit";

/*
 * The deck reads window scroll, so the preview gives it a real document to
 * scroll and drives that document while nobody is touching it. Local SVG
 * artwork rather than photographs, so the frame never waits on a network image.
 */

const PLATES = [
  { tint: "#f4efe6", ink: "#6b3f17", label: "Kiln", detail: "Studio identity" },
  { tint: "#e8eef5", ink: "#1f3b5a", label: "Tide", detail: "Data site" },
  { tint: "#e9f1ec", ink: "#1f5a3c", label: "Northbound", detail: "Travel guide" },
  { tint: "#efeaf4", ink: "#4a2f63", label: "Loom", detail: "Pattern library" },
];

const plate = ({ tint, ink, label, detail }: (typeof PLATES)[number]) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
      <rect width="800" height="500" fill="${tint}"/>
      <circle cx="640" cy="120" r="78" fill="${ink}" opacity="0.14"/>
      <rect x="64" y="300" width="360" height="14" rx="7" fill="${ink}" opacity="0.22"/>
      <rect x="64" y="332" width="220" height="14" rx="7" fill="${ink}" opacity="0.14"/>
      <text x="64" y="220" font-family="Georgia, serif" font-size="64" fill="${ink}">${label}</text>
      <text x="66" y="262" font-family="ui-monospace, monospace" font-size="18" letter-spacing="4" fill="${ink}" opacity="0.7">${detail.toUpperCase()}</text>
    </svg>`,
  );

const ITEMS = PLATES.map((p) => ({
  src: plate(p),
  alt: `${p.label}, ${p.detail.toLowerCase()}`,
  caption: `${p.label} · ${p.detail}`,
}));

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Run the frame down through the deck and back while nobody is using it. */
function useIdleScroll() {
  const { engaged, reducedMotion } = usePreviewEnv();
  useEffect(() => {
    if (engaged || reducedMotion) return;
    let raf = 0;
    const began = performance.now();
    const cycle = 13000;
    const step = (now: number) => {
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const t = ((now - began) % cycle) / 1000;
      let y = 0;
      if (t < 1) y = 0;
      else if (t < 9) y = max * ease((t - 1) / 8);
      else if (t < 10.5) y = max;
      else y = max * (1 - ease((t - 10.5) / 2.5));
      if (document.visibilityState === "visible") window.scrollTo(0, y);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [engaged, reducedMotion]);
}

export default function ScrollFlipDeckPreview() {
  useIdleScroll();
  return (
    <main className="bg-[#fafafa] text-[#0a0a0a]">
      <div className="px-8 pb-2 pt-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#4a4a4c]">Selected work</p>
        <p className="mt-2 max-w-xs font-serif text-2xl leading-tight">Keep scrolling. The deck turns one card at a time.</p>
      </div>

      <ScrollFlipDeck items={ITEMS} label="Selected work" mode="alternate" width={420} />

      <div className="px-8 pb-16 pt-6">
        <p className="max-w-xs text-sm text-[#4a4a4c]">The deck lets go of the viewport once the last card has turned.</p>
      </div>
    </main>
  );
}
