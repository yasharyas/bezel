"use client";

import { useEffect, useRef, useState } from "react";
import { FRAME_READY, FRAME_REPLAY } from "@/previews/messages";
import type { FrameSpec, StageSize } from "@/previews/types";

type Props = {
  slug: string;
  name: string;
  spec: FrameSpec;
  size: StageSize;
  replayToken: number;
};

/**
 * Renders a preview inside its own document at a fixed virtual viewport, then
 * scales that viewport down to fit the stage. Inside, `position: fixed`,
 * `100vh`, `md:` breakpoints, cursor changes and scroll locks all behave as
 * they would on a real page, and none of it can reach the gallery.
 */
export function PreviewFrame({ slug, name, spec, size, replayToken }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [ready, setReady] = useState(false);
  const { width: vw, height: vh } = spec.viewport;

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type === FRAME_READY) setReady(true);
    };
    window.addEventListener("message", onMessage);
    // Never leave a stage blank if the ready message is missed.
    const fallback = window.setTimeout(() => setReady(true), 8000);
    return () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    if (!replayToken) return;
    frameRef.current?.contentWindow?.postMessage({ type: FRAME_REPLAY }, window.location.origin);
  }, [replayToken]);

  const pad = size === "card" ? 0 : 20;
  const scale = box ? Math.min(1, (box.w - pad * 2) / vw, (box.h - pad * 2) / vh) : 0;

  return (
    <div ref={boxRef} className="absolute inset-0">
      {box && scale > 0 ? (
        <iframe
          ref={frameRef}
          src={`/preview/${slug}`}
          title={`${name} preview`}
          tabIndex={size === "card" ? -1 : 0}
          aria-hidden={size === "card" ? true : undefined}
          className="absolute border-0 transition-opacity duration-300 ease-bz-out motion-safe-transition"
          style={{
            left: (box.w - vw * scale) / 2,
            top: (box.h - vh * scale) / 2,
            width: vw,
            height: vh,
            transform: `scale(${scale})`,
            transformOrigin: "0 0",
            opacity: ready ? 1 : 0,
          }}
        />
      ) : null}
    </div>
  );
}
