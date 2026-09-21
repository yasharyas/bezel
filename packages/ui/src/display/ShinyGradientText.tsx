"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

/*
 * ShinyGradientText: a line of text filled with a slow metal sweep.
 *
 * The ramp is deliberately narrow. Each tone is one warm family moving through
 * value with a single specular band: "paper" is ink warming into the brick
 * accent, "void" is champagne over gold peaking at white. Wide multi-hue
 * gradients read cheap and, worse, go pale mid-sweep and lose the text.
 *
 * Legibility is the constraint, because this is type before it is ornament.
 * Every stop clears 4.5:1 on its own ground, so no moment of the loop is
 * harder to read than the still frame: the weakest paper stop is the brick at
 * 8.1:1 on white, the weakest void stop the gold at 6.7:1 on --bz-void-raised.
 *
 * Colours resolve from the --bz-* tokens, so a themed app carries the sweep
 * with it. For anything else, set --bz-sgt-base, --bz-sgt-halo or
 * --bz-sgt-shine on the element.
 *
 * The image is twice the box wide and travels exactly one image width per
 * cycle, so the loop closes without a seam. It pauses off screen and in hidden
 * tabs. Reduced motion parks the specular mid-line instead of dropping the
 * fill, which leaves a still line that still looks finished.
 */

const CSS = `
.bz-sgt{display:inline-block;color:var(--bz-sgt-base);background-image:linear-gradient(100deg,var(--bz-sgt-base) 0%,var(--bz-sgt-base) 12%,var(--bz-sgt-halo) 32%,var(--bz-sgt-shine) 50%,var(--bz-sgt-halo) 68%,var(--bz-sgt-base) 88%,var(--bz-sgt-base) 100%);background-size:200% 100%;background-position:0% center;animation:bz-sgt-sweep var(--bz-sgt-dur,6s) linear infinite}
.bz-sgt[data-tone="paper"]{--bz-sgt-base:var(--bz-ink,#0a0a0a);--bz-sgt-halo:#541d17;--bz-sgt-shine:var(--bz-accent,#912c22)}
.bz-sgt[data-tone="void"]{--bz-sgt-base:#ecdeb3;--bz-sgt-halo:var(--bz-gold-fill,#c9a227);--bz-sgt-shine:var(--bz-void-ink,#ffffff)}
@supports (color:color-mix(in srgb,red 50%,blue)){.bz-sgt[data-tone="paper"]{--bz-sgt-halo:color-mix(in srgb,var(--bz-ink,#0a0a0a) 45%,var(--bz-accent,#912c22))}.bz-sgt[data-tone="void"]{--bz-sgt-base:color-mix(in srgb,var(--bz-gold-fill,#c9a227) 35%,var(--bz-void-ink,#ffffff))}}
@supports ((-webkit-background-clip:text) or (background-clip:text)){.bz-sgt{-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}}
@keyframes bz-sgt-sweep{from{background-position:200% center}to{background-position:0% center}}
.bz-sgt[data-running="false"]{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.bz-sgt{animation:none;background-position:50% center}}
`;

export type ShinyGradientTextProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  /** The ground the line sits on. Paper is the library default surface. */
  tone?: "paper" | "void";
  /** Seconds for one pass of the specular. Slow reads considered, fast reads restless. */
  duration?: number;
};

export function ShinyGradientText({
  children,
  className = "",
  tone = "paper",
  duration = 6,
  style,
  ...rest
}: ShinyGradientTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [onscreen, setOnscreen] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setOnscreen(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setOnscreen(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const sync = () => setVisible(document.visibilityState !== "hidden");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <span
        ref={ref}
        className={`bz-sgt ${className}`.trim()}
        data-tone={tone}
        data-running={onscreen && visible ? "true" : "false"}
        style={{ ...style, ["--bz-sgt-dur" as string]: `${duration}s` } as CSSProperties}
        {...rest}
      >
        {children}
      </span>
    </>
  );
}
