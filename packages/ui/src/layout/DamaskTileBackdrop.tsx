"use client";

import type { CSSProperties, ReactNode } from "react";

export type DamaskTileBackdropProps = {
  /** Optional repeating tile image. If omitted, a CSS damask-like radial lattice is used. */
  tileSrc?: string;
  opacity?: number; // 0–1 pattern strength
  tileSize?: string; // CSS length, default 280px
  background?: string; // base wash color
  className?: string;
  style?: CSSProperties;
};

/** Fixed repeating ornamental tile under the whole viewport. */
export function DamaskTileBackdrop({
  tileSrc,
  opacity = 0.14,
  tileSize = "280px",
  background = "hsl(40 33% 97%)",
  className,
  style,
}: DamaskTileBackdropProps) {
  return (
    <>
      <style>{`
        .damask-tile-backdrop {
          pointer-events: none;
          position: fixed;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          background-color: var(--dtb-bg);
        }
        .damask-tile-backdrop__pattern {
          position: absolute;
          inset: 0;
          opacity: var(--dtb-opacity);
          background-repeat: repeat;
          background-size: var(--dtb-size) var(--dtb-size);
          background-position: center;
        }
        .damask-tile-backdrop__pattern--css {
          background-image:
            radial-gradient(circle at 20% 20%, hsl(38 30% 55% / 0.22) 0 1px, transparent 1.5px),
            radial-gradient(circle at 80% 30%, hsl(5 35% 40% / 0.14) 0 1.2px, transparent 1.8px),
            radial-gradient(circle at 50% 70%, hsl(38 40% 50% / 0.18) 0 1.4px, transparent 2px),
            radial-gradient(hsl(38 20% 60% / 0.08) 1px, transparent 1px);
          background-size:
            calc(var(--dtb-size) * 0.5) calc(var(--dtb-size) * 0.5),
            calc(var(--dtb-size) * 0.66) calc(var(--dtb-size) * 0.66),
            var(--dtb-size) var(--dtb-size),
            calc(var(--dtb-size) * 0.22) calc(var(--dtb-size) * 0.22);
        }
        .damask-tile-backdrop__veil {
          position: absolute;
          inset: 0;
          background: color-mix(in srgb, var(--dtb-bg) 94%, transparent);
        }
      `}</style>
      <div
        className={["damask-tile-backdrop", className].filter(Boolean).join(" ")}
        style={
          {
            ...style,
            ["--dtb-bg" as string]: background,
            ["--dtb-opacity" as string]: String(opacity),
            ["--dtb-size" as string]: tileSize,
          } as CSSProperties
        }
        aria-hidden
      >
        <div
          className={
            tileSrc
              ? "damask-tile-backdrop__pattern"
              : "damask-tile-backdrop__pattern damask-tile-backdrop__pattern--css"
          }
          style={tileSrc ? { backgroundImage: `url(${tileSrc})` } : undefined}
        />
        <div className="damask-tile-backdrop__veil" />
      </div>
    </>
  );
}

export type TiledGlassSurfaceProps = {
  children: ReactNode;
  tileSrc?: string;
  opacity?: number;
  className?: string;
  style?: CSSProperties;
};

/** Local card/pane with the same tile + glass blur treatment. */
export function TiledGlassSurface({
  children,
  tileSrc,
  opacity = 0.12,
  className,
  style,
}: TiledGlassSurfaceProps) {
  return (
    <>
      <style>{`
        .tiled-glass-surface {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          border-radius: 1rem;
          border: 1px solid hsl(40 12% 82% / 0.88);
          background: hsl(0 0% 100% / 0.55);
          backdrop-filter: blur(14px) saturate(1.05);
          -webkit-backdrop-filter: blur(14px) saturate(1.05);
          box-shadow:
            inset 0 1px 0 hsl(0 0% 100% / 0.42),
            0 10px 32px -14px hsl(60 4% 8% / 0.12);
        }
        .tiled-glass-surface__tile {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: var(--tgs-opacity, 0.12);
          background-repeat: repeat;
          background-size: 180px 180px;
        }
        .tiled-glass-surface__tile--css {
          background-image:
            radial-gradient(circle at 30% 30%, hsl(38 30% 55% / 0.2) 0 1px, transparent 1.5px),
            radial-gradient(hsl(38 20% 60% / 0.07) 1px, transparent 1px);
          background-size: 90px 90px, 28px 28px;
        }
        .tiled-glass-surface__content {
          position: relative;
          z-index: 1;
        }
      `}</style>
      <div
        className={["tiled-glass-surface", className].filter(Boolean).join(" ")}
        style={{ ...style, ["--tgs-opacity" as string]: String(opacity) } as CSSProperties}
      >
        <div
          className={
            tileSrc
              ? "tiled-glass-surface__tile"
              : "tiled-glass-surface__tile tiled-glass-surface__tile--css"
          }
          style={tileSrc ? { backgroundImage: `url(${tileSrc})` } : undefined}
          aria-hidden
        />
        <div className="tiled-glass-surface__content">{children}</div>
      </div>
    </>
  );
}
