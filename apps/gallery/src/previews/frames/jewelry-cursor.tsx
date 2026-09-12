"use client";

import { useEffect, useRef, useState } from "react";
import { JewelryCursor } from "bezel-ui/interaction/JewelryCursor";
import { usePreviewEnv } from "../kit";

/**
 * The cursor only mounts on fine pointers with motion allowed. While idle, a
 * synthetic pointer traces a path across the links so the ring can be seen
 * expanding.
 */
export default function JewelryCursorPreview() {
  const { engaged, reducedMotion } = usePreviewEnv();
  const links = useRef<HTMLDivElement>(null);
  const [finePointer, setFinePointer] = useState(true);

  useEffect(() => {
    setFinePointer(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  useEffect(() => {
    if (engaged || reducedMotion) return;
    let hovered: Element | null = null;
    const start = performance.now();
    const id = window.setInterval(() => {
      const t = (performance.now() - start) / 1000;
      const x = window.innerWidth * (0.5 + 0.32 * Math.sin(t * 0.8));
      const y = window.innerHeight * (0.68 + 0.12 * Math.sin(t * 1.6));
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: x, clientY: y }));
      const over =
        Array.from(links.current?.querySelectorAll("a") ?? []).find((el) => {
          const r = el.getBoundingClientRect();
          return x >= r.left - 6 && x <= r.right + 6 && y >= r.top - 6 && y <= r.bottom + 6;
        }) ?? null;
      if (over !== hovered) {
        hovered?.dispatchEvent(new MouseEvent("mouseleave"));
        over?.dispatchEvent(new MouseEvent("mouseenter"));
        hovered = over;
      }
    }, 60);
    return () => {
      window.clearInterval(id);
      hovered?.dispatchEvent(new MouseEvent("mouseleave"));
    };
  }, [engaged, reducedMotion]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f5f0e8] text-center text-[#3a2a1a]">
      <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-[#8b1a1a]">Selected work</p>
      <h1 className="mt-4 font-serif text-6xl">Objects and interfaces</h1>
      <div ref={links} className="mt-10 flex gap-10 text-sm uppercase tracking-[0.25em]">
        <a href="#work">Work</a>
        <a href="#studio">Studio</a>
        <a href="#contact">Contact</a>
      </div>
      {!finePointer ? (
        <p className="mt-8 text-xs text-[#4a4a4c]">This cursor only appears with a mouse or trackpad.</p>
      ) : null}
      <JewelryCursor color="#8a6d1a" />
    </main>
  );
}
