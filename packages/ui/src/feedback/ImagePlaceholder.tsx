"use client";

import { useEffect, useRef, useState } from "react";

/*
 * ImagePlaceholder: a box that holds an image's aspect ratio while it loads.
 *
 * Every colour is drawn from the surrounding text colour, so the placeholder
 * reads on light and dark grounds without a theme: the fill is currentColor at
 * 12%, and a slow band thins it to 2% as it sweeps across. The icon and label
 * sit at 55% and 72% of currentColor, which keeps the label above 4.5:1 and the
 * icon above 3:1 against the fill on white and on near-black.
 *
 * The sweep pauses off screen and in hidden tabs. Reduced motion shows the
 * plain fill, still and clearly a placeholder. `aria-busy` marks it as loading.
 */

const CSS = `
.bz-ip{position:relative;overflow:hidden;isolation:isolate;background:linear-gradient(100deg,rgba(10,10,10,0.12) 40%,rgba(10,10,10,0.02) 50%,rgba(10,10,10,0.12) 60%) 100% 0/300% 100%;animation:bz-ip-sweep 2.4s linear infinite}
@supports (color:color-mix(in srgb,red 50%,blue)){.bz-ip{background-image:linear-gradient(100deg,color-mix(in srgb,currentColor 12%,transparent) 40%,color-mix(in srgb,currentColor 2%,transparent) 50%,color-mix(in srgb,currentColor 12%,transparent) 60%)}}
@keyframes bz-ip-sweep{0%{background-position:100% 0}70%,100%{background-position:0 0}}
.bz-ip[data-running="false"]{animation-play-state:paused}
.bz-ip-icon{opacity:0.55}
.bz-ip-label{opacity:0.72}
@media (prefers-reduced-motion:reduce){.bz-ip{animation:none}}
`;

type Props = {
  aspectRatio?: string;
  label?: string;
  rounded?: string;
  className?: string;
};

export function ImagePlaceholder({ aspectRatio = "4/3", label = "", rounded = "rounded-xl", className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
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
      <div
        ref={ref}
        className={`bz-ip ${rounded} ${className}`.trim()}
        style={{ aspectRatio }}
        role="img"
        aria-label={label || "Loading image"}
        aria-busy="true"
        data-running={onscreen && visible ? "true" : "false"}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <svg className="bz-ip-icon w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {label && <span className="bz-ip-label text-xs font-medium">{label}</span>}
        </div>
      </div>
    </>
  );
}
