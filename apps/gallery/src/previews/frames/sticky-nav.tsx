"use client";

import { useState } from "react";
import { StickyNav } from "bezel-ui/navigation/StickyNav";

export default function StickyNavPreview() {
  const [dark, setDark] = useState(false);
  return (
    <div className="min-h-[160vh] bg-[#f5f5f7] text-[#0a0a0a]">
      <StickyNav
        brandName="SIGNAL"
        isDark={dark}
        onThemeToggle={() => setDark((d) => !d)}
        links={[
          { label: "Features", href: "#features" },
          { label: "Pricing", href: "#pricing" },
          { label: "Docs", href: "#docs" },
        ]}
      />
      <main className="mx-auto max-w-[1200px] px-6 pt-14">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#047857]">Automation you can audit</p>
        <h1 className="mt-3 font-serif text-5xl font-medium leading-[1.02]">Every agent decision, logged and explained</h1>
        <p className="mt-4 max-w-md text-[#4a4a4c]">Scroll the page: the header stays pinned and frosts what passes beneath it.</p>
        <div className="mt-8 grid grid-cols-3 gap-3" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 rounded-xl border border-black/[0.06] bg-white" />
          ))}
        </div>
      </main>
    </div>
  );
}
