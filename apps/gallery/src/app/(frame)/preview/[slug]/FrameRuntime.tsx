"use client";

import { useEffect, useState } from "react";
import { loadPreview } from "@/previews/load";
import { PreviewEnvContext, useReducedMotion } from "@/previews/kit";
import type { PreviewComponent, Tone } from "@/previews/types";
import { FRAME_READY, FRAME_REPLAY } from "@/previews/messages";

/**
 * The document inside a frame preview. It renders one component, client-only,
 * and keeps that component from affecting the gallery around it:
 *
 * - `focus()` is ignored until someone actually interacts with the frame, so a
 *   component that autofocuses on mount cannot steal focus from, or scroll,
 *   the page that embeds it.
 * - Links do not navigate.
 */
export function FrameRuntime({ slug, tone }: { slug: string; tone: Tone }) {
  const [Preview, setPreview] = useState<PreviewComponent | null>(null);
  const [runKey, setRunKey] = useState(0);
  const [engaged, setEngaged] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("frame-doc", `tone-${tone}`);

    // Focus guard.
    const originalFocus = HTMLElement.prototype.focus;
    let activated = false;
    const activate = () => {
      activated = true;
    };
    window.addEventListener("pointerdown", activate, { capture: true, once: true });
    window.addEventListener("keydown", activate, { capture: true, once: true });
    HTMLElement.prototype.focus = function guardedFocus(this: HTMLElement, options?: FocusOptions) {
      if (!activated) return;
      originalFocus.call(this, { ...options, preventScroll: true });
    };

    // Link guard.
    const onClick = (event: MouseEvent) => {
      if ((event.target as Element | null)?.closest?.("a[href]")) event.preventDefault();
    };
    document.addEventListener("click", onClick, true);

    // Engagement: a pointer inside the frame, or focus within it.
    const onOver = () => setEngaged(true);
    const onOut = (event: PointerEvent) => {
      if (!event.relatedTarget) setEngaged(false);
    };
    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === FRAME_REPLAY) setRunKey((k) => k + 1);
    };
    window.addEventListener("message", onMessage);

    return () => {
      HTMLElement.prototype.focus = originalFocus;
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      window.removeEventListener("message", onMessage);
    };
  }, [tone]);

  useEffect(() => {
    let live = true;
    loadPreview(slug).then((component) => live && setPreview(() => component));
    return () => {
      live = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!Preview) return;
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        window.parent?.postMessage({ type: FRAME_READY, slug }, window.location.origin);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [Preview, slug]);

  if (!Preview) return null;
  return (
    <PreviewEnvContext.Provider value={{ engaged, reducedMotion, size: "frame" }}>
      <Preview key={runKey} />
    </PreviewEnvContext.Provider>
  );
}
