"use client";

import { useEffect, useRef } from "react";
import { ContactSection } from "bezel-ui/sections/ContactSection";
import { IMAGES, usePreviewEnv } from "../kit";

/** Drives the spotlight with a slow synthetic pointer while idle. */
export default function ContactSectionPreview() {
  const { engaged, reducedMotion } = usePreviewEnv();
  const wrap = useRef<HTMLElement>(null);

  useEffect(() => {
    if (engaged || reducedMotion) return;
    const start = performance.now();
    const id = window.setInterval(() => {
      const section = wrap.current?.querySelector(".yui-contact");
      if (!section) return;
      const r = section.getBoundingClientRect();
      const t = (performance.now() - start) / 1000;
      section.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: r.left + r.width * (0.5 + 0.35 * Math.sin(t * 0.8)),
          clientY: r.top + r.height * (0.5 + 0.3 * Math.cos(t * 1.1)),
        }),
      );
    }, 120);
    return () => window.clearInterval(id);
  }, [engaged, reducedMotion]);

  return (
    <main ref={wrap} className="flex min-h-screen items-center bg-[#0a0a0a] p-10 text-white">
      <div className="w-full">
        <ContactSection
          eyebrow="Have a project in mind?"
          heading="Let's"
          subheading="talk."
          ctaHref="#contact"
          headingImageSrc={IMAGES.mountains}
        />
      </div>
    </main>
  );
}
