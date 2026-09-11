"use client";

import { TypingHero } from "bezel-ui/sections/TypingHero";
import { useLoopKey } from "../kit";

export default function TypingHeroPreview() {
  const run = useLoopKey(9000);
  return (
    <main className="min-h-screen bg-[#f5f5f7]">
      <TypingHero
        key={run}
        title="Automation you can"
        titleHighlight="audit"
        subtitle="Every agent decision is logged, explained and reversible, so your team can trust what ships."
      >
        <a href="#start" className="rounded-[10px] bg-[#0a0a0a] px-5 py-3 text-sm font-medium text-white">
          Start free
        </a>
        <a href="#docs" className="rounded-[10px] border border-black/15 px-5 py-3 text-sm font-medium text-[#0a0a0a]">
          Read the docs
        </a>
      </TypingHero>
    </main>
  );
}
