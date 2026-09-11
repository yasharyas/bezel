"use client";

import { useEffect, useRef } from "react";
import { StickyNavbar } from "bezel-ui/navigation/StickyNavbar";
import { IMAGES, usePreviewEnv } from "../kit";

/**
 * Shown at a phone width, where the drawer is the interesting part. While idle
 * the menu opens and closes on a loop. The "Shop" link points at this page, so
 * its active state is visible.
 */
export default function StickyNavbarPreview() {
  const { engaged, reducedMotion } = usePreviewEnv();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (engaged || reducedMotion) return;
    const toggle = (open: boolean) =>
      root.current?.querySelector<HTMLButtonElement>(`button[aria-label="${open ? "Open menu" : "Close menu"}"]`)?.click();
    const timers: number[] = [];
    const cycle = () => {
      timers.push(window.setTimeout(() => toggle(true), 900));
      timers.push(window.setTimeout(() => toggle(false), 3300));
    };
    cycle();
    const id = window.setInterval(cycle, 5200);
    return () => {
      window.clearInterval(id);
      timers.forEach(window.clearTimeout);
    };
  }, [engaged, reducedMotion]);

  const here = typeof window === "undefined" ? "/" : window.location.pathname;

  return (
    <div ref={root} className="min-h-screen bg-white text-[#0a0a0a]">
      <StickyNavbar
        brand="Maison"
        announcementText="Free shipping on orders over ₹999"
        links={[
          { label: "Home", href: "/" },
          { label: "Shop", href: here },
          { label: "Journal", href: "/journal" },
          { label: "About", href: "/about" },
        ]}
        cartCount={2}
        onSearchClick={() => {}}
        onCartClick={() => {}}
      />
      <img src={IMAGES.watch} alt="" className="h-48 w-full object-cover" />
      <div className="space-y-2 p-4" aria-hidden>
        <div className="h-3 w-2/3 rounded bg-neutral-100" />
        <div className="h-3 w-1/2 rounded bg-neutral-100" />
      </div>
    </div>
  );
}
