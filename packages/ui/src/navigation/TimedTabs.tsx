"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";

/*
 * TimedTabs: tabs that move on by themselves, where the timer is the progress
 * bar.
 *
 * The bar under the active tab is a CSS animation, and its `animationend` is
 * what selects the next tab. Pausing therefore needs no timer bookkeeping: any
 * rule that sets `animation-play-state: paused` stops the countdown and the
 * switch together. It holds when the reader pauses it, when the tabs are out
 * of view, when the browser tab is hidden, and while keyboard focus is inside.
 *
 * The active tab is a paper "tongue" joined to the panel below. It is a second,
 * inert copy of the whole row clipped to one column, and moving the clip slides
 * the tongue across while the colours change exactly at its edge.
 *
 * Reduced motion starts paused and drops the slides; the pause button still
 * turns the timer on.
 */

const CSS = `
.bz-tt{container-type:inline-size;box-sizing:border-box;border:1px solid var(--bz-line-strong,rgba(10,10,10,0.13));border-radius:24px;background:var(--bz-paper,#ffffff);color:var(--bz-ink,#0a0a0a);font-family:var(--bz-font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif)}
.bz-tt *,.bz-tt *::before,.bz-tt *::after{box-sizing:border-box}
.bz-tt-rail{display:flex;align-items:stretch;gap:4px;padding:6px 6px 0;border-radius:23px 23px 0 0;background:var(--bz-void,#0c0c0f)}
.bz-tt-track{position:relative;flex:1;min-width:0}
.bz-tt-tabs,.bz-tt-tongue{display:grid;grid-template-columns:repeat(var(--bz-tt-n),minmax(0,1fr))}
.bz-tt-tongue{position:absolute;inset:0;pointer-events:none;clip-path:inset(0 calc((var(--bz-tt-n) - 1 - var(--bz-tt-active)) * 100% / var(--bz-tt-n)) 0 calc(var(--bz-tt-active) * 100% / var(--bz-tt-n)) round 16px 16px 0 0);transition:clip-path 300ms var(--bz-ease-in-out,cubic-bezier(0.77,0,0.175,1))}
.bz-tt-tab{position:relative;display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:56px;margin:0;padding:12px 12px 15px;border:0;border-radius:16px 16px 0 0;background:transparent;color:rgba(255,255,255,0.74);font:inherit;font-size:0.9375rem;font-weight:600;line-height:1.25;letter-spacing:-0.01em;text-align:center;cursor:pointer;transition:color 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)),background-color 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-tt-tongue .bz-tt-tab{background:var(--bz-paper,#ffffff);color:var(--bz-ink,#0a0a0a);cursor:default}
.bz-tt-tabs .bz-tt-tab:focus-visible{outline:2px solid #ffffff;outline-offset:-6px}
.bz-tt:has(.bz-tt-tabs .bz-tt-tab:focus-visible) .bz-tt-tongue .bz-tt-tab[data-lit]{outline:2px solid var(--bz-focus-ring,#912c22);outline-offset:-6px}
@media (hover:hover) and (pointer:fine){.bz-tt-tabs .bz-tt-tab:hover{color:#ffffff;background:rgba(255,255,255,0.08)}}
.bz-tt-icon{display:grid;flex:none;place-items:center;width:28px;height:28px;border-radius:9px;background:rgba(255,255,255,0.12)}
.bz-tt-icon svg{width:16px;height:16px}
.bz-tt-tongue .bz-tt-icon{background:var(--bz-paper-raised,#f7f3ee);color:var(--bz-accent,#912c22)}
.bz-tt-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bz-tt-groove{position:absolute;left:0;bottom:0;width:calc(100% / var(--bz-tt-n));height:3px;overflow:hidden;pointer-events:none;background:rgba(10,10,10,0.1);transform:translateX(calc(var(--bz-tt-active) * 100%));transition:transform 300ms var(--bz-ease-in-out,cubic-bezier(0.77,0,0.175,1))}
.bz-tt-fill{display:block;width:100%;height:100%;background:var(--bz-accent,#912c22);transform:scaleX(0);transform-origin:left center;animation:bz-tt-countdown var(--bz-tt-time,6000ms) linear forwards}
@keyframes bz-tt-countdown{to{transform:scaleX(1)}}
.bz-tt[data-timer="off"] .bz-tt-fill,.bz-tt[data-onscreen="false"] .bz-tt-fill,.bz-tt[data-backgrounded="true"] .bz-tt-fill,.bz-tt:has(:focus-visible) .bz-tt-fill{animation-play-state:paused}
.bz-tt[data-timer="off"] .bz-tt-fill{opacity:0.4}
.bz-tt-toggle{display:grid;flex:none;align-self:center;place-items:center;width:48px;height:48px;margin:0 2px 6px;padding:0;border:1px solid rgba(255,255,255,0.3);border-radius:999px;background:rgba(255,255,255,0.08);color:#ffffff;cursor:pointer;transition:background-color 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)),border-color 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)),transform 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-tt-toggle svg{width:14px;height:14px}
.bz-tt-toggle:focus-visible{outline:2px solid #ffffff;outline-offset:2px}
.bz-tt-toggle:active{transform:scale(0.97)}
@media (hover:hover){.bz-tt-toggle:hover{background:rgba(255,255,255,0.18);border-color:rgba(255,255,255,0.55)}}
.bz-tt-panel{padding:24px;border-radius:0 0 23px 23px;outline:none}
.bz-tt-panel:focus-visible{outline:2px solid var(--bz-focus-ring,#912c22);outline-offset:2px}
.bz-tt-swap{animation:bz-tt-in 300ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)) both}
@keyframes bz-tt-in{from{opacity:0;transform:translateY(8px);filter:blur(4px)}to{opacity:1;transform:none;filter:none}}
@keyframes bz-tt-fade{from{opacity:0}to{opacity:1}}
@container (max-width:560px){.bz-tt-tab{flex-direction:column;gap:6px;min-height:64px;padding:10px 4px 13px;font-size:0.75rem}.bz-tt-name{white-space:normal}.bz-tt-panel{padding:18px}}
@media (prefers-reduced-motion:reduce){.bz-tt-tongue,.bz-tt-groove,.bz-tt-tab,.bz-tt-toggle{transition:none}.bz-tt-swap{animation:bz-tt-fade 150ms ease both}.bz-tt-toggle:active{transform:none}}
`;

const RM_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(RM_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const readReducedMotion = () => window.matchMedia(RM_QUERY).matches;
const serverReducedMotion = () => false;

export type TimedTab = {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
};

export type TimedTabsProps = {
  items: TimedTab[];
  /** Names the tab list for assistive tech. */
  label: string;
  /** How long each tab stays before the next, in milliseconds. */
  interval?: number;
  defaultIndex?: number;
  onChange?: (index: number) => void;
  /** Accessible name of the pause button, which reports its state with `aria-pressed`. */
  pauseLabel?: string;
  className?: string;
};

export function TimedTabs({
  items,
  label,
  interval = 6000,
  defaultIndex = 0,
  onChange,
  pauseLabel = "Pause automatic switching",
  className = "",
}: TimedTabsProps) {
  const reduced = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, serverReducedMotion);
  const count = items.length;
  const [active, setActive] = useState(() => Math.max(0, Math.min(defaultIndex, count - 1)));
  const [autoPref, setAutoPref] = useState<boolean | null>(null);
  const [inView, setInView] = useState(false);
  const [hidden, setHidden] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const tongueRef = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/:/g, "");

  const auto = autoPref ?? !reduced;
  const current = Math.max(0, Math.min(active, count - 1));

  // React 18 does not pass `inert` through, so it is set on the node.
  useEffect(() => {
    tongueRef.current?.setAttribute("inert", "");
  }, [count]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const sync = () => setHidden(document.visibilityState === "hidden");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  const select = useCallback(
    (next: number, focus = false) => {
      if (!count) return;
      const index = ((next % count) + count) % count;
      setActive(index);
      onChange?.(index);
      if (focus) tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[index]?.focus();
    },
    [count, onChange],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: count - 1 };
    if (!(event.key in moves)) return;
    event.preventDefault();
    select(moves[event.key], true);
  };

  if (!count) return null;

  const style = {
    ["--bz-tt-n" as string]: count,
    ["--bz-tt-active" as string]: current,
    ["--bz-tt-time" as string]: `${interval}ms`,
  } as CSSProperties;

  const tabInner = (item: TimedTab) => (
    <>
      {item.icon ? (
        <span className="bz-tt-icon" aria-hidden="true">
          {item.icon}
        </span>
      ) : null}
      <span className="bz-tt-name">{item.label}</span>
    </>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        ref={rootRef}
        className={`bz-tt ${className}`.trim()}
        style={style}
        data-timer={auto ? "on" : "off"}
        data-onscreen={inView ? "true" : "false"}
        data-backgrounded={hidden ? "true" : "false"}
      >
        <div className="bz-tt-rail">
          <div className="bz-tt-track">
            <div ref={tabsRef} role="tablist" aria-label={label} className="bz-tt-tabs" onKeyDown={onKeyDown}>
              {items.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`${uid}-tab-${index}`}
                  aria-selected={index === current}
                  aria-controls={`${uid}-panel`}
                  tabIndex={index === current ? 0 : -1}
                  className="bz-tt-tab"
                  onClick={() => select(index)}
                >
                  {tabInner(item)}
                </button>
              ))}
            </div>
            <div ref={tongueRef} className="bz-tt-tongue" aria-hidden="true">
              {items.map((item, index) => (
                <span key={item.id} className="bz-tt-tab" data-lit={index === current ? "true" : undefined}>
                  {tabInner(item)}
                </span>
              ))}
            </div>
            <div className="bz-tt-groove" aria-hidden="true">
              <span
                key={`${current}-${items[current].id}`}
                className="bz-tt-fill"
                onAnimationEnd={() => select(current + 1)}
              />
            </div>
          </div>
          <button
            type="button"
            className="bz-tt-toggle"
            aria-label={pauseLabel}
            aria-pressed={!auto}
            onClick={() => setAutoPref(!auto)}
          >
            {auto ? (
              <svg viewBox="0 0 14 14" aria-hidden="true">
                <rect x="2.5" y="1.5" width="3" height="11" rx="1" fill="currentColor" />
                <rect x="8.5" y="1.5" width="3" height="11" rx="1" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 14 14" aria-hidden="true">
                <path d="M3.5 2.2v9.6c0 .6.7 1 1.2.6l7.2-4.8a.7.7 0 0 0 0-1.2L4.7 1.6c-.5-.4-1.2 0-1.2.6z" fill="currentColor" />
              </svg>
            )}
          </button>
        </div>
        <div
          role="tabpanel"
          id={`${uid}-panel`}
          aria-labelledby={`${uid}-tab-${current}`}
          tabIndex={0}
          className="bz-tt-panel"
        >
          <div key={items[current].id} className="bz-tt-swap">
            {items[current].content}
          </div>
        </div>
      </div>
    </>
  );
}
