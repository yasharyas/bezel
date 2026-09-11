"use client";

import { DamaskTileBackdrop, TiledGlassSurface } from "bezel-ui/layout/DamaskTileBackdrop";

export default function DamaskTileBackdropPreview() {
  return (
    <main className="relative flex min-h-screen items-center justify-center p-10">
      <DamaskTileBackdrop opacity={1} tileSize="200px" />
      <TiledGlassSurface className="relative z-10 w-[340px] p-8 text-center" opacity={0.5}>
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#7a6015]">The archive</p>
        <h1 className="mt-3 font-serif text-3xl text-[#2b2320]">Heirlooms, catalogued</h1>
        <p className="mt-3 text-sm text-[#4a4a4c]">Glass pane over a repeating ornamental lattice.</p>
      </TiledGlassSurface>
    </main>
  );
}
