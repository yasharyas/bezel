"use client";

import { useEffect, useRef, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";

/*
 * DockingCard: on hover or keyboard focus, the card's picture flies up into a
 * small dock in its header while a detail panel rises into the space it left.
 *
 * The move is a measured FLIP: the media's box and the dock's box are read at
 * the moment of intent, and the media gets a translate plus a uniform scale, so
 * it lands in the dock without being stretched. Leaving hands the transform
 * back to none, which interrupts cleanly mid-flight.
 *
 * The heading lives in the header strip, above the rising panel, so a focused
 * title link is never covered. On touch screens, under reduced motion and
 * without JavaScript the card is a plain column that shows everything.
 */

const CSS = `
.bz-dc{position:relative;display:flex;flex-direction:column;overflow:hidden;box-sizing:border-box;border:1px solid var(--bz-line-strong,rgba(10,10,10,0.13));border-radius:20px;background:var(--bz-paper,#ffffff);color:var(--bz-ink,#0a0a0a);font-family:var(--bz-font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);transition:border-color 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-dc *,.bz-dc *::before,.bz-dc *::after{box-sizing:border-box}
.bz-dc:focus-within{border-color:rgba(10,10,10,0.32)}
@media (hover:hover){.bz-dc:hover{border-color:rgba(10,10,10,0.32)}}
.bz-dc-head{display:flex;align-items:center;gap:16px;min-height:88px;padding:14px 16px 14px 20px;border-bottom:1px solid var(--bz-line,rgba(10,10,10,0.06));background:var(--bz-paper-sunken,#fafafa)}
.bz-dc-headings{flex:1;min-width:0}
.bz-dc-eyebrow{margin:0 0 4px;font:500 0.6875rem/1.4 var(--bz-font-mono,ui-monospace,SFMono-Regular,Menlo,monospace);letter-spacing:0.12em;text-transform:uppercase;color:var(--bz-ink-muted,#4a4a4c)}
.bz-dc-title{margin:0;font-size:1.125rem;line-height:1.3;font-weight:600;letter-spacing:-0.01em}
.bz-dc-title a{color:inherit;text-decoration:none;border-radius:4px}
.bz-dc-title a:focus-visible{outline:2px solid var(--bz-focus-ring,#912c22);outline-offset:2px}
@media (hover:hover){.bz-dc-title a:hover{text-decoration:underline;text-underline-offset:3px}}
.bz-dc-dock{position:relative;display:grid;flex:none;place-items:center;width:var(--bz-dc-dock,88px);aspect-ratio:var(--bz-dc-ratio,1.5)}
.bz-dc-dock::after{content:"";position:absolute;inset:0;border:1px dashed rgba(10,10,10,0.34);border-radius:8px;opacity:0;transform:scale(0.9);transition:opacity 300ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)),transform 300ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-dc-meta{font-size:0.8125rem;font-weight:600;line-height:1.25;text-align:right;color:var(--bz-ink-muted,#4a4a4c);transition:opacity 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-dc-stage{padding:20px 20px 0}
.bz-dc-media{position:relative;z-index:3;width:100%;aspect-ratio:var(--bz-dc-ratio,1.5);overflow:hidden;border-radius:12px;background:var(--bz-paper-raised,#f7f3ee);transform-origin:center center;transition:transform 450ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-dc-media>*{display:block;width:100%;height:100%}
.bz-dc-body{padding:16px 20px 20px}
.bz-dc-summary{margin:0;font-size:0.9375rem;line-height:1.55;color:var(--bz-ink-muted,#4a4a4c)}
.bz-dc-panel{padding:0 20px 20px}
.bz-dc[data-dockable="true"] .bz-dc-panel{position:absolute;right:0;bottom:0;left:0;top:var(--bz-dc-head,88px);z-index:2;overflow:auto;padding:20px;background:var(--bz-paper,#ffffff);transform:translateY(calc(100% + 1px));transition:transform 500ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-dc[data-pose="dock"] .bz-dc-panel{transform:translateY(0)}
.bz-dc[data-pose="dock"] .bz-dc-media{transition-duration:500ms}
.bz-dc[data-pose="dock"] .bz-dc-dock::after{opacity:1;transform:none}
.bz-dc[data-pose="dock"] .bz-dc-meta{opacity:0}
@media (prefers-reduced-motion:reduce){.bz-dc,.bz-dc-media,.bz-dc-panel,.bz-dc-dock::after,.bz-dc-meta{transition:none}}
`;

const DOCK_QUERY = "(hover: hover) and (pointer: fine)";
const RM_QUERY = "(prefers-reduced-motion: reduce)";

const subscribeDockable = (onChange: () => void) => {
  const queries = [window.matchMedia(DOCK_QUERY), window.matchMedia(RM_QUERY)];
  queries.forEach((q) => q.addEventListener("change", onChange));
  return () => queries.forEach((q) => q.removeEventListener("change", onChange));
};
const readDockable = () => window.matchMedia(DOCK_QUERY).matches && !window.matchMedia(RM_QUERY).matches;
const serverDockable = () => false;

/** Offset of `el` inside `root`, in layout pixels, ignoring any transforms. */
function offsetWithin(el: HTMLElement, root: HTMLElement) {
  let left = 0;
  let top = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    left += node.offsetLeft;
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { left, top };
}

export type DockingCardProps = {
  title: ReactNode;
  /** Makes the title a link. */
  href?: string;
  eyebrow?: ReactNode;
  /** The picture that travels to the dock: an image, an SVG, anything that fills its box. */
  media: ReactNode;
  /** Width divided by height of the media box and the dock. */
  mediaRatio?: number;
  /** Sits in the dock at rest and fades out as the media arrives. */
  meta?: ReactNode;
  summary: ReactNode;
  /** Rises into the card while it is docked, and sits below the summary everywhere else. */
  detail: ReactNode;
  headingLevel?: 2 | 3;
  className?: string;
  style?: CSSProperties;
};

export function DockingCard({
  title,
  href,
  eyebrow,
  media,
  mediaRatio = 1.5,
  meta,
  summary,
  detail,
  headingLevel = 3,
  className = "",
  style,
}: DockingCardProps) {
  const dockable = useSyncExternalStore(subscribeDockable, readDockable, serverDockable);
  const rootRef = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const dockableRef = useRef(dockable);
  dockableRef.current = dockable;
  const settleRef = useRef<() => void>(() => {});

  useEffect(() => {
    const root = rootRef.current;
    const head = headRef.current;
    const dock = dockRef.current;
    const mediaEl = mediaRef.current;
    if (!root || !head || !dock || !mediaEl) return;

    let hovering = false;
    let focusing = false;
    let docked = false;

    const place = () => {
      if (!docked) {
        mediaEl.style.transform = "";
        return;
      }
      const mw = mediaEl.offsetWidth;
      const mh = mediaEl.offsetHeight;
      if (!mw || !mh) return;
      const scale = Math.min(dock.offsetWidth / mw, dock.offsetHeight / mh);
      const from = offsetWithin(mediaEl, root);
      const to = offsetWithin(dock, root);
      const tx = to.left + dock.offsetWidth / 2 - (from.left + mw / 2);
      const ty = to.top + dock.offsetHeight / 2 - (from.top + mh / 2);
      mediaEl.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    };

    const settle = () => {
      const next = dockableRef.current && (hovering || focusing);
      if (next === docked) return;
      docked = next;
      root.dataset.pose = next ? "dock" : "rest";
      place();
    };
    settleRef.current = settle;

    const onEnter = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      hovering = true;
      settle();
    };
    const onLeave = () => {
      hovering = false;
      settle();
    };
    const onFocusIn = () => {
      focusing = true;
      settle();
    };
    const onFocusOut = (event: FocusEvent) => {
      if (event.relatedTarget instanceof Node && root.contains(event.relatedTarget)) return;
      focusing = false;
      settle();
    };

    root.addEventListener("pointerenter", onEnter);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("focusout", onFocusOut);

    const ro = new ResizeObserver(() => {
      root.style.setProperty("--bz-dc-head", `${head.offsetHeight}px`);
      place();
    });
    ro.observe(root);
    ro.observe(head);

    return () => {
      ro.disconnect();
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
      mediaEl.style.transform = "";
    };
  }, []);

  // A preference change mid-hover undocks or re-docks straight away.
  useEffect(() => {
    settleRef.current();
  }, [dockable]);

  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <article
        ref={rootRef}
        className={`bz-dc ${className}`.trim()}
        data-dockable={dockable ? "true" : "false"}
        data-pose="rest"
        style={{ ["--bz-dc-ratio" as string]: mediaRatio, ...style } as CSSProperties}
      >
        <div ref={headRef} className="bz-dc-head">
          <div className="bz-dc-headings">
            {eyebrow ? <p className="bz-dc-eyebrow">{eyebrow}</p> : null}
            <Heading className="bz-dc-title">{href ? <a href={href}>{title}</a> : title}</Heading>
          </div>
          <div ref={dockRef} className="bz-dc-dock">
            {meta ? <span className="bz-dc-meta">{meta}</span> : null}
          </div>
        </div>
        <div className="bz-dc-stage">
          <div ref={mediaRef} className="bz-dc-media">
            {media}
          </div>
        </div>
        <div className="bz-dc-body">
          <p className="bz-dc-summary">{summary}</p>
        </div>
        <div className="bz-dc-panel">{detail}</div>
      </article>
    </>
  );
}
