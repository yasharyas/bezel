"use client";

import { useRef } from "react";

import { CircleCTA } from "bezel-ui/buttons/CircleCTA";
import { ImageReveal } from "bezel-ui/media/ImageReveal";
import { Marquee } from "bezel-ui/animation/Marquee";
import { TextDisperseLink } from "bezel-ui/buttons/TextDisperseLink";
import { ParallaxProductStage } from "bezel-ui/sections/ParallaxProductStage";
import { WaxSealButton } from "bezel-ui/buttons/WaxSealButton";
import { FallingPetalField, ScrollParallaxLayer } from "bezel-ui/animation/ScrollParallaxLayer";
import { TextType } from "bezel-ui/animation/TextType";

import { Center, IMAGES, simulateHover, useIdleInterval } from "../kit";
import type { PreviewModule } from "../types";

/** Hover `el` for `ms`, so a hover-only effect can be seen without a pointer. */
function pulseHover(el: Element | null, ms: number) {
  if (!el) return;
  simulateHover(el, true);
  window.setTimeout(() => simulateHover(el, false), ms);
}

function CircleCTAPreview() {
  const ref = useRef<HTMLDivElement>(null);
  useIdleInterval(() => pulseHover(ref.current?.querySelector(".yui-circle-cta") ?? null, 1500), 3400);
  return (
    <Center>
      <div ref={ref} className="text-white">
        <CircleCTA href="#work" label={"view all\nwork"} size={9} />
      </div>
    </Center>
  );
}

function ImageRevealPreview() {
  return (
    <Center>
      <div className="w-64">
        <ImageReveal src={IMAGES.mountains} alt="A mountain ridge at dawn" borderRadius="1.25rem" aspectRatio="4/3" />
      </div>
    </Center>
  );
}

function MarqueePreview() {
  return (
    <div className="flex h-full w-full flex-col justify-center text-white [&_.yui-marquee-root]:!my-1">
      <Marquee text="Motion" fontSize="4.25rem" speed={70} opacity={0.95} separator={" · "} />
      <Marquee text="Craft" fontSize="4.25rem" speed={40} opacity={0.3} separator={" · "} />
    </div>
  );
}

function TextDisperseLinkPreview() {
  const ref = useRef<HTMLDivElement>(null);
  useIdleInterval(() => pulseHover(ref.current?.querySelector("a") ?? null, 1100), 3000);
  return (
    <Center>
      <div ref={ref} className="text-4xl text-white">
        <TextDisperseLink label="Say hello" href="#contact" />
      </div>
    </Center>
  );
}

function Bottle({ tint, label }: { tint: string; label: string }) {
  return (
    <div className="relative" style={{ background: `linear-gradient(180deg, ${tint} 0%, rgba(255,255,255,0.06) 100%)` }}>
      <span className="absolute left-1/2 top-[8%] h-[9%] w-[34%] -translate-x-1/2 rounded-sm bg-white/30" />
      <span className="absolute inset-x-[14%] bottom-[18%] rounded bg-white/90 px-1 py-1.5 text-center text-[10px] font-bold uppercase leading-tight tracking-[0.08em] text-[#073b34]">
        {label}
      </span>
    </div>
  );
}

function ParallaxProductStagePreview() {
  return (
    <ParallaxProductStage
      items={[
        { id: "tap", label: "Tap cleaner", media: <Bottle tint="rgba(125,211,252,0.55)" label="Tap" /> },
        { id: "kitchen", label: "Kitchen cleaner", media: <Bottle tint="rgba(201,162,39,0.6)" label="Kitchen" /> },
        { id: "floor", label: "Floor cleaner", media: <Bottle tint="rgba(167,139,250,0.55)" label="Floor" /> },
      ]}
    />
  );
}

function WaxSealButtonPreview() {
  const ref = useRef<HTMLDivElement>(null);
  useIdleInterval(() => pulseHover(ref.current?.querySelector("button") ?? null, 900), 3200);
  return (
    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_50%_45%,#2a1d14_0%,#15100c_75%)]">
      <div ref={ref} className="flex items-center gap-8 whitespace-nowrap">
        <WaxSealButton label="RSVP" />
        <WaxSealButton label="View details" variant="ghost" />
      </div>
    </div>
  );
}

function ScrollParallaxLayerPreview() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[linear-gradient(180deg,#221810,#0f0b08)] text-[#f5f0e8]">
      <FallingPetalField colors={["#c9a227", "#d98c1f", "#8b1a1a"]} className="inset-0 h-full" />
      <ScrollParallaxLayer speed={0.9} rotate={16} className="absolute -right-6 top-6">
        <div className="h-28 w-28 rounded-full border border-[#c9a227]/60" />
      </ScrollParallaxLayer>
      <ScrollParallaxLayer speed={0.45} rotate={-8} className="absolute left-8 top-10">
        <div className="h-16 w-16 rotate-45 border border-[#e8d5a3]/40" />
      </ScrollParallaxLayer>
      <ScrollParallaxLayer speed={-0.35} className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#e8d5a3]">Scroll the page</p>
        <p className="mt-2 font-serif text-3xl">Layers drift apart</p>
      </ScrollParallaxLayer>
    </div>
  );
}

function TextTypePreview() {
  return (
    <Center>
      <TextType
        as="p"
        className="!max-w-[300px] text-center font-serif text-3xl leading-tight text-[#0a0a0a]"
        text={["Ship on Friday.", "Rest on Saturday.", "Iterate on Monday."]}
        typingSpeed={55}
        deletingSpeed={28}
        pauseDuration={1500}
      />
    </Center>
  );
}

export const previews: PreviewModule = {
  "circle-cta": CircleCTAPreview,
  "image-reveal": ImageRevealPreview,
  marquee: MarqueePreview,
  "text-disperse-link": TextDisperseLinkPreview,
  "parallax-product-stage": ParallaxProductStagePreview,
  "wax-seal-button": WaxSealButtonPreview,
  "scroll-parallax-layer": ScrollParallaxLayerPreview,
  "text-type": TextTypePreview,
};
