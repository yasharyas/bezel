"use client";

import { useEffect, useRef } from "react";
import { CustomCursor } from "bezel-ui/interaction/CustomCursor";
import { usePreviewEnv } from "../kit";

/**
 * The cursor follows `mousemove` on the document. While nobody is pointing at
 * the frame, a slow synthetic path drives it, including over the grow targets.
 */
export default function CustomCursorPreview() {
  const { engaged, reducedMotion } = usePreviewEnv();
  const targets = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (engaged || reducedMotion) return;
    let hovered: Element | null = null;
    const start = performance.now();
    const id = window.setInterval(() => {
      const t = (performance.now() - start) / 1000;
      const x = window.innerWidth * (0.5 + 0.34 * Math.sin(t * 0.9));
      const y = window.innerHeight * (0.56 + 0.2 * Math.sin(t * 1.7));
      document.dispatchEvent(new MouseEvent("mousemove", { clientX: x, clientY: y, bubbles: true }));
      const over =
        Array.from(targets.current?.querySelectorAll("[data-cursor-grow]") ?? []).find((el) => {
          const r = el.getBoundingClientRect();
          return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
        }) ?? null;
      if (over !== hovered) {
        hovered?.dispatchEvent(new MouseEvent("mouseleave"));
        over?.dispatchEvent(new MouseEvent("mouseenter"));
        hovered = over;
      }
    }, 90);
    return () => {
      window.clearInterval(id);
      hovered?.dispatchEvent(new MouseEvent("mouseleave"));
    };
  }, [engaged, reducedMotion]);

  return (
    <main className="flex min-h-screen flex-col justify-center bg-[#0a0a0a] px-16 text-white">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/70">Portfolio</p>
      <h1 className="mt-4 max-w-xl text-6xl font-medium leading-[0.95] tracking-tight">Move across the page</h1>
      <div ref={targets} className="mt-10 flex gap-4">
        {["Work", "Studio", "Contact"].map((label) => (
          <div key={label} data-cursor-grow className="rounded-full border border-white/30 px-6 py-3 text-lg">
            {label}
          </div>
        ))}
      </div>
      <CustomCursor />
    </main>
  );
}
