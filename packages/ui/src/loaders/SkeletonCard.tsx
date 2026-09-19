"use client";

import { useEffect, useRef, useState } from "react";

/*
 * SkeletonCard and SkeletonRow: loading placeholders in the theme's own colours.
 *
 * The bones sit a clear step darker than their surface (muted-foreground at
 * 15-20%), and a band of the surface colour sweeps across them. Over the
 * surface the band is invisible, so only the bones change, on light and dark
 * themes alike. The sweep is linear and rests between passes, so it reads as
 * work in progress rather than a flash.
 *
 * The sweep pauses when the skeleton is off screen or the tab is hidden, and
 * reduced motion removes it: the bones stay, still and clearly a placeholder.
 * Each skeleton is a polite status region with `aria-busy` and a text label, so
 * the loading state is announced, not just drawn.
 */

const CSS = `
.bz-sk{position:relative;overflow:hidden;isolation:isolate}
.bz-sk-sheen{position:absolute;inset:0;z-index:1;overflow:hidden;pointer-events:none}
.bz-sk-sheen::before{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 20%,currentColor 50%,transparent 80%);opacity:0.9;transform:translateX(-100%);animation:bz-sk-sweep 2.4s linear infinite;will-change:transform}
@keyframes bz-sk-sweep{0%{transform:translateX(-100%)}70%,100%{transform:translateX(100%)}}
.bz-sk[data-running="false"] .bz-sk-sheen::before{animation-play-state:paused}
.bz-sk-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
@media (prefers-reduced-motion:reduce){.bz-sk-sheen{display:none}}
`;

/** Runs the sweep only while the skeleton is on screen and the tab is visible. */
function useSweepRunning() {
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

  return [ref, onscreen && visible] as const;
}

export type SkeletonProps = {
  /** Announced to assistive tech while the skeleton is shown. */
  label?: string;
};

export function SkeletonCard({ label = "Loading" }: SkeletonProps = {}) {
  const [ref, running] = useSweepRunning();
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        ref={ref}
        role="status"
        aria-busy="true"
        data-running={running ? "true" : "false"}
        className="bz-sk bg-card rounded-xl border border-border"
      >
        <span className="bz-sk-sr">{label}</span>
        <div className="aspect-square bg-muted-foreground/15" />
        <div className="p-3 space-y-2">
          <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
          <div className="h-3 bg-muted-foreground/20 rounded w-1/2" />
          <div className="flex items-center justify-between mt-3">
            <div className="h-5 bg-muted-foreground/20 rounded w-12" />
            <div className="h-8 w-8 bg-muted-foreground/20 rounded-lg" />
          </div>
        </div>
        <span aria-hidden="true" className="bz-sk-sheen text-card" />
      </div>
    </>
  );
}

export function SkeletonRow({ label = "Loading" }: SkeletonProps = {}) {
  const [ref, running] = useSweepRunning();
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        ref={ref}
        role="status"
        aria-busy="true"
        data-running={running ? "true" : "false"}
        className="bz-sk flex gap-3 p-3 bg-muted rounded-lg"
      >
        <span className="bz-sk-sr">{label}</span>
        <div className="w-16 h-16 rounded-lg bg-muted-foreground/20 shrink-0" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 bg-muted-foreground/20 rounded w-2/3" />
          <div className="h-3 bg-muted-foreground/20 rounded w-1/3" />
          <div className="h-4 bg-muted-foreground/20 rounded w-1/4" />
        </div>
        <span aria-hidden="true" className="bz-sk-sheen text-muted" />
      </div>
    </>
  );
}
