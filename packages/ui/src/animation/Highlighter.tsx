"use client";

import { useLayoutEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { useInView } from "motion/react";
import { annotate } from "rough-notation";

type AnnotationAction =
  | "highlight"
  | "underline"
  | "box"
  | "circle"
  | "strike-through"
  | "crossed-off"
  | "bracket";

export type HighlighterProps = {
  children: ReactNode;
  action?: AnnotationAction;
  color?: string;
  strokeWidth?: number;
  animationDuration?: number;
  iterations?: number;
  padding?: number;
  multiline?: boolean;
  /** When true, only draw once the span scrolls into view. */
  isView?: boolean;
  /**
   * Change this value to draw the mark again from the start, for a replay
   * button or a step that returns. Under reduced motion the finished mark
   * simply stays in place.
   */
  replayKey?: string | number;
};

const RM_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(RM_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const readReducedMotion = () => window.matchMedia(RM_QUERY).matches;
const serverReducedMotion = () => false;

/** Where the words sit relative to the box the mark is drawn in. */
function placement(element: HTMLElement) {
  const frame = (element.offsetParent ?? document.body).getBoundingClientRect();
  return Array.from(element.getClientRects(), (r) =>
    [r.left - frame.left, r.top - frame.top, r.width, r.height].map(Math.round).join(","),
  ).join("|");
}

/**
 * Hand-drawn rough-notation mark that draws on mount (or on scroll into view),
 * and again whenever `replayKey` changes.
 *
 * Each draw is a fresh annotation: the previous one is removed and a new one
 * animates in. When layout moves the words afterwards, the finished mark is
 * redrawn in place without animating, so a resize never replays it. Reduced
 * motion draws the same finished mark with no animation, and follows changes
 * to the setting live.
 */
export function Highlighter({
  children,
  action = "highlight",
  color = "#ffd1dc",
  strokeWidth = 1.5,
  animationDuration = 600,
  iterations = 2,
  padding = 2,
  multiline = true,
  isView = false,
  replayKey,
}: HighlighterProps) {
  const elementRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(elementRef, { once: true, margin: "-10%" });
  const shouldShow = !isView || isInView;
  const reduced = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, serverReducedMotion);
  // Under reduced motion the mark is already final, so a replay has nothing to redraw.
  const drawKey = reduced ? null : replayKey;

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!shouldShow || !element) return;

    const annotation = annotate(element, {
      type: action,
      color,
      strokeWidth,
      animate: !reduced,
      animationDuration,
      iterations,
      padding,
      multiline,
    });
    annotation.show();

    // Showing an annotation that is already showing redraws it without
    // animation, which is what a layout change needs.
    let last = placement(element);
    const resizeObserver = new ResizeObserver(() => {
      const next = placement(element);
      if (next === last) return;
      last = next;
      if (annotation.isShowing()) annotation.show();
    });
    resizeObserver.observe(element);
    resizeObserver.observe(document.body);

    return () => {
      resizeObserver.disconnect();
      annotation.remove();
    };
  }, [shouldShow, reduced, drawKey, action, color, strokeWidth, animationDuration, iterations, padding, multiline]);

  return (
    <span ref={elementRef} className="relative inline bg-transparent">
      {children}
    </span>
  );
}
