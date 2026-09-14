"use client";

import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type MutableRefObject,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

/*
 * MorphDialog: a modal that grows out of the control that opened it.
 *
 * The trigger's box is measured at the moment it is pressed. A fixed plate
 * covering the viewport is clipped to that box, then its clip-path is
 * transitioned to the panel's box, so the surface visibly travels from the
 * button to the dialog and back. Clip-path, unlike a scale, never distorts the
 * radius. The dialog content fades in over the plate once it is most of the
 * way there.
 *
 * Around the motion it is a complete modal: every other child of <body> is made
 * inert and hidden from assistive tech (and restored exactly as it was), focus
 * moves into the dialog and Tab / Shift+Tab wrap inside it, Escape closes unless
 * something inside owns that key, the page cannot scroll behind it, and focus
 * returns to the trigger.
 */

const CSS = `
.bz-md{position:fixed;inset:0;z-index:90}
.bz-md-backdrop{position:absolute;inset:0;background:rgba(12,12,15,0.44);opacity:0;transition:opacity var(--bz-md-dur,500ms) var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-md[data-phase="open"] .bz-md-backdrop{opacity:1}
.bz-md[data-phase="closing"] .bz-md-backdrop{pointer-events:none;transition-duration:calc(var(--bz-md-dur,500ms) * 0.6)}
.bz-md-plate{position:fixed;inset:0;pointer-events:none;background-color:var(--bz-paper,#ffffff);transition:clip-path var(--bz-md-dur,500ms) var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)),background-color var(--bz-md-dur,500ms) var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1));will-change:clip-path}
.bz-md-panel{position:fixed;left:50%;top:50%;box-sizing:border-box;display:flex;flex-direction:column;width:min(var(--bz-md-width,520px),calc(100vw - 32px));max-height:calc(100vh - 32px);max-height:calc(100dvh - 32px);transform:translate(-50%,-50%);border:1px solid var(--bz-line-strong,rgba(10,10,10,0.13));border-radius:24px;color:var(--bz-ink,#0a0a0a);font-family:var(--bz-font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);opacity:0;pointer-events:none;outline:none;transition:opacity calc(var(--bz-md-dur,500ms) * 0.5) var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)) calc(var(--bz-md-dur,500ms) * 0.45)}
.bz-md-panel *,.bz-md-panel *::before,.bz-md-panel *::after{box-sizing:border-box}
.bz-md[data-phase="open"] .bz-md-panel{opacity:1;pointer-events:auto}
.bz-md[data-phase="closing"] .bz-md-panel{transition-duration:calc(var(--bz-md-dur,500ms) * 0.3);transition-delay:0s}
.bz-md-head{position:relative;padding:24px 72px 4px 24px}
.bz-md-title{margin:0;font-size:1.25rem;line-height:1.3;font-weight:600;letter-spacing:-0.01em}
.bz-md-desc{margin:6px 0 0;font-size:0.9375rem;line-height:1.55;color:var(--bz-ink-muted,#4a4a4c)}
.bz-md-body{padding:16px 24px 24px;overflow:auto;overscroll-behavior:contain}
.bz-md-close{position:absolute;top:12px;right:12px;display:grid;place-items:center;width:48px;height:48px;padding:0;border:0;border-radius:999px;background:transparent;color:var(--bz-ink,#0a0a0a);cursor:pointer;transition:background-color 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)),transform 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-md-close svg{width:20px;height:20px}
.bz-md-close:focus-visible{outline:2px solid var(--bz-focus-ring,#912c22);outline-offset:2px}
.bz-md-close:active{transform:scale(0.97)}
@media (hover:hover){.bz-md-close:hover{background:rgba(10,10,10,0.06)}}
@media (prefers-reduced-motion:reduce){
.bz-md-plate{transition:opacity 150ms ease}
.bz-md[data-phase="closing"] .bz-md-plate{opacity:0}
.bz-md-panel,.bz-md[data-phase="closing"] .bz-md-panel{transition:opacity 150ms ease;transition-delay:0s}
.bz-md-backdrop,.bz-md[data-phase="closing"] .bz-md-backdrop{transition-duration:150ms}
.bz-md-close{transition:none}
.bz-md-close:active{transform:none}
}
`;

type Box = { top: number; left: number; width: number; height: number };
type Phase = "closed" | "opening" | "open" | "closing";
type Origin = { box: Box; radius: number; paint: string | null };

const PANEL_RADIUS = 24;

const RM_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(RM_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const readReducedMotion = () => window.matchMedia(RM_QUERY).matches;
const serverReducedMotion = () => false;

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const FOCUSABLE = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "audio[controls]",
  "video[controls]",
  "summary",
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex^="-"])',
].join(",");

const PICKER_TYPES = new Set(["date", "datetime-local", "month", "week", "time", "color", "file"]);

function boxOf(el: Element): Box {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function visibleBox(box: Box | null, vw: number, vh: number) {
  if (!box || box.width <= 0 || box.height <= 0) return null;
  if (box.top > vh || box.left > vw || box.top + box.height < 0 || box.left + box.width < 0) return null;
  return box;
}

function radiusOf(el: Element, box: Box) {
  const r = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
  return Math.min(r, box.width / 2, box.height / 2);
}

/** The trigger's own fill, so the plate leaves in the colour of the button. */
function paintOf(el: Element) {
  const bg = getComputedStyle(el).backgroundColor;
  const match = bg.match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  const parts = match[1].split(/[\s,/]+/).filter(Boolean);
  const alpha = parts.length > 3 ? parseFloat(parts[3]) : 1;
  return alpha > 0.05 ? bg : null;
}

function reachable(el: HTMLElement) {
  if (el.closest("[inert]") || el.closest("fieldset[disabled]")) return false;
  return el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
}

/** Escape belongs to the dialog unless something inside already claimed it. */
function escapeIsOurs(event: KeyboardEvent) {
  if (event.defaultPrevented || event.isComposing || event.keyCode === 229) return false;
  const target = event.target;
  if (target instanceof HTMLSelectElement) return false;
  if (target instanceof HTMLInputElement && PICKER_TYPES.has(target.type)) return false;
  return true;
}

function insetFor(box: Box, vw: number, vh: number, radius: number) {
  const right = vw - box.left - box.width;
  const bottom = vh - box.top - box.height;
  return `inset(${box.top}px ${right}px ${bottom}px ${box.left}px round ${radius}px)`;
}

function assignRef<T>(ref: Ref<T> | undefined, value: T) {
  if (typeof ref === "function") ref(value);
  else if (ref && typeof ref === "object") (ref as MutableRefObject<T>).current = value;
}

export type MorphDialogProps = {
  /** The control that opens the dialog. It keeps its own click handler and gets `aria-haspopup` and `aria-expanded`. */
  trigger: ReactElement;
  title: ReactNode;
  description?: ReactNode;
  /** Dialog content, or a function that receives `close`. */
  children?: ReactNode | ((close: () => void) => ReactNode);
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Where focus lands when the dialog opens. Defaults to the dialog itself, so its title is read first. */
  initialFocus?: RefObject<HTMLElement>;
  /** Panel width in CSS pixels. */
  maxWidth?: number;
  /** Morph duration in milliseconds. */
  duration?: number;
  closeLabel?: string;
  className?: string;
};

export function MorphDialog({
  trigger,
  title,
  description,
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  initialFocus,
  maxWidth = 520,
  duration = 500,
  closeLabel = "Close",
  className = "",
}: MorphDialogProps) {
  const reduced = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, serverReducedMotion);
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const isOpen = open ?? innerOpen;
  const [phase, setPhase] = useState<Phase>("closed");
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [target, setTarget] = useState<Box | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [host, setHost] = useState<HTMLElement | null>(null);

  const triggerRef = useRef<HTMLElement | null>(null);
  const pressedRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropPress = useRef(false);

  const uid = useId().replace(/:/g, "");
  const dialogId = `${uid}-dialog`;
  const titleId = `${uid}-title`;
  const descId = `${uid}-desc`;

  const setOpen = useCallback(
    (next: boolean) => {
      if (open === undefined) setInnerOpen(next);
      onOpenChange?.(next);
    },
    [open, onOpenChange],
  );
  const close = useCallback(() => setOpen(false), [setOpen]);
  const closeRef = useRef(close);
  closeRef.current = close;
  const focusRef = useRef(initialFocus);
  focusRef.current = initialFocus;

  // Derive the phase during render, so no frame paints in the wrong one.
  if (isOpen && (phase === "closed" || phase === "closing")) setPhase("opening");
  if (!isOpen && (phase === "opening" || phase === "open")) setPhase("closing");

  const mounted = phase !== "closed";

  useIsoLayoutEffect(() => {
    if (!mounted) return;
    const el = document.createElement("div");
    document.body.appendChild(el);
    setHost(el);
    return () => {
      el.remove();
      setHost(null);
    };
  }, [mounted]);

  // Measure where the surface leaves from: the pressed control, else the trigger.
  useIsoLayoutEffect(() => {
    if (phase !== "opening" && phase !== "closing") return;
    const el = pressedRef.current ?? triggerRef.current;
    if (!el || !el.isConnected) {
      if (phase === "opening") setOrigin(null);
      return;
    }
    const box = boxOf(el);
    setOrigin((prev) => ({ box, radius: radiusOf(el, box), paint: phase === "closing" ? prev?.paint ?? paintOf(el) : paintOf(el) }));
  }, [phase]);

  // Measure where it lands: the panel, kept current while it is open.
  useIsoLayoutEffect(() => {
    const panel = panelRef.current;
    if (!host || !panel) return;
    const measure = () => {
      setViewport({ w: document.documentElement.clientWidth, h: window.innerHeight });
      setTarget(boxOf(panel));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(panel);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [host]);

  useEffect(() => {
    if (phase !== "opening" || !target) return;
    if (reduced) {
      setPhase("open");
      return;
    }
    // One committed frame at the trigger, so the clip has somewhere to travel from.
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => setPhase("open"));
    });
    return () => cancelAnimationFrame(raf);
  }, [phase, target, reduced]);

  useEffect(() => {
    if (phase !== "closing") return;
    const timer = window.setTimeout(() => {
      setPhase("closed");
      setTarget(null);
    }, reduced ? 160 : duration);
    return () => window.clearTimeout(timer);
  }, [phase, reduced, duration]);

  const active = host !== null && (phase === "opening" || phase === "open");

  useEffect(() => {
    if (!active || !host) return;
    const html = document.documentElement;
    const body = document.body;
    const saved = {
      overflow: html.style.overflow,
      gutter: html.style.scrollbarGutter,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };
    const scrollY = window.scrollY;
    const hasScrollbar = window.innerWidth - html.clientWidth > 0;
    const pinBody = window.matchMedia("(pointer: coarse)").matches;
    if (hasScrollbar) html.style.scrollbarGutter = "stable";
    html.style.overflow = "hidden";
    if (pinBody) {
      body.style.position = "fixed";
      body.style.top = `${-scrollY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
    }

    const touched: Array<{ el: Element; ariaHidden: string | null }> = [];
    for (const el of Array.from(body.children)) {
      if (el === host || el.hasAttribute("inert") || el.tagName === "SCRIPT" || el.tagName === "STYLE") continue;
      touched.push({ el, ariaHidden: el.getAttribute("aria-hidden") });
      el.setAttribute("inert", "");
      el.setAttribute("aria-hidden", "true");
    }

    const returnTo = triggerRef.current ?? (document.activeElement as HTMLElement | null);
    (focusRef.current?.current ?? panelRef.current)?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      const panel = panelRef.current;
      if (!panel) return;
      if (event.key === "Escape") {
        if (escapeIsOurs(event)) {
          event.preventDefault();
          closeRef.current();
        }
        return;
      }
      if (event.key !== "Tab") return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(reachable);
      if (!items.length) {
        event.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (!current || !panel.contains(current)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && (current === first || current === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Inert first: focus inside an inert tree is ignored.
      for (const { el, ariaHidden } of touched) {
        el.removeAttribute("inert");
        if (ariaHidden === null) el.removeAttribute("aria-hidden");
        else el.setAttribute("aria-hidden", ariaHidden);
      }
      html.style.overflow = saved.overflow;
      html.style.scrollbarGutter = saved.gutter;
      if (pinBody) {
        body.style.position = saved.position;
        body.style.top = saved.top;
        body.style.left = saved.left;
        body.style.right = saved.right;
        body.style.width = saved.width;
        window.scrollTo({ top: scrollY, left: 0, behavior: "instant" as ScrollBehavior });
      }
      if (returnTo && returnTo.isConnected) returnTo.focus({ preventScroll: true });
    };
  }, [active, host]);

  const triggerElement = trigger as ReactElement<Record<string, unknown>> & { ref?: Ref<HTMLElement> };
  const ownClick = isValidElement(trigger)
    ? (triggerElement.props.onClick as ((event: ReactMouseEvent<HTMLElement>) => void) | undefined)
    : undefined;

  const renderedTrigger = isValidElement(trigger)
    ? cloneElement(triggerElement, {
        ref: (node: HTMLElement | null) => {
          triggerRef.current = node;
          assignRef(triggerElement.ref, node);
        },
        onClick: (event: ReactMouseEvent<HTMLElement>) => {
          ownClick?.(event);
          if (event.defaultPrevented) return;
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          pressedRef.current = event.currentTarget;
          setOpen(true);
        },
        "aria-haspopup": "dialog",
        "aria-expanded": isOpen,
        "aria-controls": isOpen ? dialogId : undefined,
      })
    : trigger;

  const { w: vw, h: vh } = viewport;
  const settled = phase === "open" || reduced;
  const from = visibleBox(origin?.box ?? null, vw, vh);
  const centre = target
    ? { top: target.top + target.height / 2, left: target.left + target.width / 2, width: 0, height: 0 }
    : null;
  const shown = settled ? target : from ?? centre;
  const radius = settled || !from ? PANEL_RADIUS : origin?.radius ?? PANEL_RADIUS;
  const plateStyle: CSSProperties =
    shown && vw
      ? {
          clipPath: insetFor(shown, vw, vh, radius),
          backgroundColor: settled ? undefined : origin?.paint ?? undefined,
        }
      : { visibility: "hidden" };

  const content = typeof children === "function" ? (children as (close: () => void) => ReactNode)(close) : children;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {renderedTrigger}
      {host && mounted
        ? createPortal(
            <div
              className="bz-md"
              data-phase={phase}
              style={{ ["--bz-md-dur" as string]: `${duration}ms` } as CSSProperties}
            >
              <div
                className="bz-md-backdrop"
                aria-hidden="true"
                onPointerDown={(event) => {
                  backdropPress.current = event.target === event.currentTarget;
                }}
                onClick={(event) => {
                  if (backdropPress.current && event.target === event.currentTarget) close();
                  backdropPress.current = false;
                }}
              />
              <div className="bz-md-plate" aria-hidden="true" style={plateStyle} />
              <div
                ref={panelRef}
                id={dialogId}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={description ? descId : undefined}
                tabIndex={-1}
                className={`bz-md-panel ${className}`.trim()}
                style={{ ["--bz-md-width" as string]: `${maxWidth}px` } as CSSProperties}
              >
                <div className="bz-md-head">
                  <h2 id={titleId} className="bz-md-title">
                    {title}
                  </h2>
                  {description ? (
                    <p id={descId} className="bz-md-desc">
                      {description}
                    </p>
                  ) : null}
                  <button type="button" className="bz-md-close" aria-label={closeLabel} onClick={close}>
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <div className="bz-md-body">{content}</div>
              </div>
            </div>,
            host,
          )
        : null}
    </>
  );
}
