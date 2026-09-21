"use client";

import { useEffect, useState } from "react";

import { MagicRings } from "bezel-ui/animation/MagicRings";

import { RINGS_MASK, RINGS_STILL } from "../ringsStill";
import type { PreviewModule } from "../types";

function MagicRingsPreview() {
  // MagicRings draws nothing under prefers-reduced-motion and nothing without
  // WebGL2, which left this stage completely empty in both cases. A CSS still
  // of the same rings holds the composition instead, so a visitor
  // who asked for less motion still sees what the component makes.
  const [still, setStill] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const noWebGL2 = (() => {
      try {
        const probe = document.createElement("canvas").getContext("webgl2");
        if (!probe) return true;
        probe.getExtension("WEBGL_lose_context")?.loseContext();
        return false;
      } catch {
        return true;
      }
    })();
    const sync = () => setStill(query.matches || noWebGL2);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return (
    <div className="relative h-full w-full bg-[radial-gradient(ellipse_at_50%_50%,#1f1512_0%,#0c0c0f_70%)]">
      {still ? (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ ...RINGS_STILL, maskImage: RINGS_MASK, WebkitMaskImage: RINGS_MASK }}
        />
      ) : (
        <MagicRings color="#912c22" colorTwo="#c9a04a" ringCount={6} baseRadius={0.22} radiusStep={0.09} followMouse clickBurst />
      )}
    </div>
  );
}

export const previews: PreviewModule = {
  "magic-rings": MagicRingsPreview,
};
