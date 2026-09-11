"use client";

import { MagicRings } from "bezel-ui/animation/MagicRings";

import type { PreviewModule } from "../types";

function MagicRingsPreview() {
  return (
    <div className="relative h-full w-full bg-[radial-gradient(ellipse_at_50%_50%,#1f1512_0%,#0c0c0f_70%)]">
      <MagicRings color="#912c22" colorTwo="#c9a04a" ringCount={6} baseRadius={0.22} radiusStep={0.09} followMouse clickBurst />
    </div>
  );
}

export const previews: PreviewModule = {
  "magic-rings": MagicRingsPreview,
};
