import type { ComponentType } from "react";

/**
 * The surface a preview sits on. Components designed for paper get paper;
 * the House of Saverah set gets its cream; dark glass and WebGL get void.
 */
export type Tone = "paper" | "cream" | "void";

/** Inline previews are bundled in groups by their heaviest dependency. */
export type InlineGroup = "basic" | "motion" | "gsap" | "three";

type BaseSpec = {
  tone: Tone;
  /** A short verb shown on the card when the component needs a pointer. */
  hint?: string;
  /** Offer a replay control, for entrances that only play once. */
  replay?: boolean;
};

export type InlineSpec = BaseSpec & {
  kind: "inline";
  group: InlineGroup;
  /**
   * Lay the preview out at this width, then scale it down to fit the stage.
   * For components that are only legible as themselves at a real width.
   */
  fit?: number;
};

export type FrameSpec = BaseSpec & {
  kind: "frame";
  /**
   * The virtual viewport, in CSS pixels. Used for components that position
   * against the viewport, use viewport breakpoints or units, or change
   * document-level state (cursor, theme, scroll lock). The frame is scaled
   * down to fit its stage and never scaled up.
   */
  viewport: { width: number; height: number };
};

export type PreviewSpec = InlineSpec | FrameSpec;

export type PreviewComponent = ComponentType;
export type PreviewModule = Record<string, PreviewComponent>;

export type StageSize = "card" | "feature" | "large";
