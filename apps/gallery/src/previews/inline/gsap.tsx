"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { CircleCTA } from "bezel-ui/buttons/CircleCTA";
import { ImageReveal } from "bezel-ui/media/ImageReveal";
import { Marquee } from "bezel-ui/animation/Marquee";
import { TextDisperseLink } from "bezel-ui/buttons/TextDisperseLink";
import { ParallaxProductStage } from "bezel-ui/sections/ParallaxProductStage";
import { FallingPetalField, ScrollParallaxLayer } from "bezel-ui/animation/ScrollParallaxLayer";
import { TextType } from "bezel-ui/animation/TextType";

import { Center, IMAGES, simulateHover, useIdleInterval, usePreviewEnv } from "../kit";
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
      {/* The echo row stays fainter than the first, but clears 3:1 for large text. */}
      <Marquee text="Craft" fontSize="4.25rem" speed={40} opacity={0.4} separator={" · "} />
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

/* ---------------------------------------------- scroll-parallax-layer scene */

/** Deterministic dust: left %, top %, px, opacity. */
const DUST: [number, number, number, number][] = [
  [7, 3, 2.5, 0.5], [18, 9, 1.5, 0.34], [29, 5, 2, 0.44], [41, 13, 1.5, 0.3],
  [53, 7, 2.5, 0.52], [66, 4, 1.5, 0.34], [78, 11, 2, 0.44], [89, 6, 1.5, 0.3],
  [12, 24, 2, 0.4], [26, 31, 1.5, 0.28], [38, 21, 2.5, 0.46], [52, 28, 1.5, 0.3],
  [64, 19, 2, 0.4], [75, 30, 1.5, 0.26], [86, 23, 2.5, 0.44], [96, 17, 1.5, 0.3],
  [9, 45, 2, 0.36], [22, 52, 1.5, 0.26], [35, 42, 2.5, 0.42], [48, 50, 1.5, 0.26],
  [61, 41, 2, 0.36], [73, 48, 1.5, 0.24], [85, 44, 2.5, 0.4], [96, 53, 1.5, 0.26],
  [14, 62, 2, 0.32], [31, 68, 1.5, 0.22], [44, 59, 2.5, 0.38], [58, 66, 1.5, 0.24],
  [70, 61, 2, 0.32], [83, 69, 1.5, 0.22], [93, 63, 2.5, 0.36], [5, 71, 1.5, 0.24],
];

const RIDGE_FILL = "M0 20 V13 L11 6 L21 11 L33 2 L45 10 L57 3 L69 11 L81 4 L92 12 L100 8 V20 Z";
const RIDGE_EDGE = "M0 13 L11 6 L21 11 L33 2 L45 10 L57 3 L69 11 L81 4 L92 12 L100 8";

/**
 * A horizon: peaks at a fixed share of the box, then a body that carries the
 * silhouette past the bottom of the frame. `body` takes a gradient so a
 * distant ridge can dissolve into the dark instead of ending on a hard line.
 */
function Ridge({ fill, edge, peak, body }: { fill: string; edge: string; peak: string; body: string }) {
  return (
    <div className="flex h-full w-full flex-col">
      <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full shrink-0" style={{ height: peak }}>
        <path d={RIDGE_FILL} fill={fill} />
        <path d={RIDGE_EDGE} fill="none" stroke={edge} strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
      {/* Pulled up a pixel so the stretched path and the body never show a seam. */}
      <div className="w-full flex-1" style={{ background: body, marginTop: -1 }} />
    </div>
  );
}

function Beat({
  eyebrow,
  title,
  note,
  compact,
}: {
  eyebrow: string;
  title: string;
  note: string;
  compact: boolean;
}) {
  return (
    <div className="max-w-[74%]">
      <p
        className={`font-mono uppercase text-[#e8d5a3] ${
          compact ? "text-[9px] tracking-[0.3em]" : "text-[12px] tracking-[0.34em]"
        }`}
      >
        {eyebrow}
      </p>
      <p
        className={`mt-1.5 font-serif leading-[1.08] text-[#f5f0e8] ${
          compact ? "text-[20px]" : "text-[40px]"
        }`}
      >
        {title}
      </p>
      <p className={`mt-1.5 text-[#e8d5a3] ${compact ? "text-[10px]" : "text-[14px]"}`}>{note}</p>
    </div>
  );
}

function ScrollParallaxLayerPreview() {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { engaged, reducedMotion } = usePreviewEnv();
  const [width, setWidth] = useState(0);
  // The stage is a card on the index, a dialog on the page and a phone-width
  // box at 375, so the tier comes from the measured box, not the stage name.
  const compact = width > 0 && width < 560;

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // While nobody is driving it, walk the scene down and back up so the depth
  // is visible without a pointer. Hovering or focusing hands it over.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || engaged || reducedMotion) return;
    const period = 13000;
    const span = () => Math.max(1, el.scrollHeight - el.clientHeight);
    // Pick the loop up wherever the scene already sits.
    let t =
      (Math.acos(Math.min(1, Math.max(-1, 1 - (2 * el.scrollTop) / span()))) / (Math.PI * 2)) * period;
    let last = performance.now();
    let raf = 0;
    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      const elapsed = now - last;
      last = now;
      if (document.visibilityState !== "visible") return;
      t = (t + elapsed) % period;
      el.scrollTop = (0.5 - 0.5 * Math.cos((2 * Math.PI * t) / period)) * span();
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [engaged, reducedMotion]);

  return (
    <div
      ref={rootRef}
      className="relative h-full w-full overflow-hidden bg-[linear-gradient(180deg,#241a11_0%,#150e09_58%,#0b0806_100%)]"
    >
      {/* The focus ring is pulled inside the box: the stage clips anything outside it. */}
      <div
        ref={scrollerRef}
        tabIndex={0}
        role="group"
        aria-label="Parallax scene"
        className="focus-ring no-scrollbar h-full w-full overflow-y-auto overflow-x-hidden focus-visible:[outline-offset:-4px]"
      >
        <div className="relative h-[265%] w-full">
          <div aria-hidden className="absolute inset-0 overflow-hidden">
            {/* Furthest back: the glow barely registers the scroll. */}
            <ScrollParallaxLayer speed={0.18} fade={0.5} className="absolute left-[-24%] top-[-6%] h-[30%] w-[148%]">
              <div className="h-full w-full rounded-[50%] bg-[radial-gradient(closest-side,rgba(201,162,39,0.22),rgba(201,162,39,0.07)_52%,transparent_100%)]" />
            </ScrollParallaxLayer>

            <ScrollParallaxLayer speed={0.55} className="absolute inset-0">
              {DUST.map(([left, top, dot, alpha], i) => (
                <span
                  key={i}
                  className="absolute rounded-full bg-[#e8d5a3]"
                  style={{ left: `${left}%`, top: `${top}%`, width: dot, height: dot, opacity: alpha }}
                />
              ))}
            </ScrollParallaxLayer>

            <ScrollParallaxLayer speed={0.9} fade={0.75} className="absolute inset-x-[-4%] top-[40%] h-[40%]">
              <Ridge
                fill="#31241a"
                edge="rgba(201,162,39,0.35)"
                peak="34%"
                body="linear-gradient(180deg,#31241a,rgba(49,36,26,0))"
              />
            </ScrollParallaxLayer>

            {/* The one that arrives: it swells and pulls into focus at centre. */}
            <ScrollParallaxLayer
              speed={2.3}
              rotate={22}
              scale={0.45}
              blur={compact ? 1.5 : 3}
              className="absolute right-[-9%] top-[13%] w-[46%]"
            >
              <div className="relative aspect-square w-full rounded-full border border-[#c9a227]/70">
                <span className="absolute inset-[16%] rounded-full border border-[#e8d5a3]/30" />
                <span className="absolute left-1/2 top-0 h-[7%] w-[7%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e8d5a3]" />
              </div>
            </ScrollParallaxLayer>

            <ScrollParallaxLayer speed={1.5} rotate={-18} scale={0.22} className="absolute right-[13%] top-[47%] w-[15%]">
              <div className="aspect-square w-full rotate-45 border border-[#e8d5a3]/45" />
            </ScrollParallaxLayer>

            {/* The warmth the scene settles onto. */}
            <ScrollParallaxLayer speed={0.3} fade={0.35} className="absolute left-[-15%] top-[70%] h-[22%] w-[130%]">
              <div className="h-full w-full rounded-[50%] bg-[radial-gradient(closest-side,rgba(217,140,31,0.30),rgba(217,140,31,0.08)_52%,transparent_100%)]" />
            </ScrollParallaxLayer>

            {/* Nearest: it rushes past and is never quite in focus. */}
            <ScrollParallaxLayer
              speed={3.1}
              fade={0.6}
              blur={compact ? 2 : 4}
              className="absolute inset-x-[-6%] top-[78%] h-[34%]"
            >
              <Ridge fill="#080503" edge="rgba(201,162,39,0.18)" peak="46%" body="#080503" />
            </ScrollParallaxLayer>
          </div>

          <div className="relative z-10 flex h-full w-full flex-col">
            <section className="flex h-1/3 items-center px-[8%]">
              <ScrollParallaxLayer speed={-0.3}>
                <Beat
                  compact={compact}
                  eyebrow="Parallax"
                  title="Depth is not speed"
                  note="Each plane at its own rate."
                />
              </ScrollParallaxLayer>
            </section>
            <section className="flex h-1/3 items-center px-[8%]">
              <ScrollParallaxLayer speed={-0.22}>
                <Beat
                  compact={compact}
                  eyebrow="Middle"
                  title="Near planes swell and sharpen"
                  note="The far ones only drift."
                />
              </ScrollParallaxLayer>
            </section>
            <section className="flex h-1/3 items-center px-[8%]">
              <ScrollParallaxLayer speed={-0.14}>
                <Beat
                  compact={compact}
                  eyebrow="Rest"
                  title="Then it settles"
                  note="Scroll back up and watch it come apart."
                />
              </ScrollParallaxLayer>
            </section>
          </div>
        </div>
      </div>

      <FallingPetalField colors={["#c9a227", "#d98c1f", "#8b1a1a"]} count={8} className="inset-0 h-full" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[12%] bg-[linear-gradient(180deg,rgba(11,8,6,0.55),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[14%] bg-[linear-gradient(0deg,rgba(11,8,6,0.7),transparent)]"
      />
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
  "scroll-parallax-layer": ScrollParallaxLayerPreview,
  "text-type": TextTypePreview,
};
