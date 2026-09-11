"use client";

import { useEffect, useRef } from "react";
import { MobileMenu } from "bezel-ui/navigation/MobileMenu";
import { IMAGES, usePreviewEnv } from "../kit";

/** Opens and closes the menu on a loop while idle, to show the overlay. */
export default function MobileMenuPreview() {
  const { engaged, reducedMotion } = usePreviewEnv();
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (engaged || reducedMotion) return;
    const burger = () => root.current?.querySelector<HTMLButtonElement>(".yui-burger");
    const isOpen = () => burger()?.classList.contains("open") ?? false;
    const timers: number[] = [];
    const cycle = () => {
      timers.push(window.setTimeout(() => !isOpen() && burger()?.click(), 1200));
      timers.push(window.setTimeout(() => isOpen() && burger()?.click(), 3600));
    };
    cycle();
    const id = window.setInterval(cycle, 5600);
    return () => {
      window.clearInterval(id);
      timers.forEach(window.clearTimeout);
    };
  }, [engaged, reducedMotion]);

  return (
    <main ref={root} className="relative min-h-screen bg-[#f5f0e8]">
      <img src={IMAGES.city} alt="" className="absolute inset-x-0 top-0 h-[55%] w-full object-cover" />
      <div className="absolute inset-x-6 bottom-6 text-[#0a0a0a]">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#4a4a4c]">Studio</p>
        <p className="mt-1 text-2xl font-medium tracking-tight">Buildings that hold light</p>
      </div>
      <MobileMenu
        logo="Bezel"
        links={[
          { label: "Work", href: "#work" },
          { label: "About", href: "#about" },
          { label: "Contact", href: "#contact" },
        ]}
      />
    </main>
  );
}
