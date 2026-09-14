"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

/*
 * AutoplayCarousel: a photo carousel that moves on by itself and never crops.
 *
 * Every photo sits on a plate sized to its own proportions inside the stage,
 * over a blurred, darkened copy of itself, so portraits and landscapes share one
 * stage without losing an edge. The progress bar under the photo is the timer:
 * its `animationend` advances the slide, so the bar and the change can never
 * drift apart, and anything that pauses the bar pauses the carousel.
 *
 * It holds while the pointer is over it, while keyboard focus is inside, while a
 * finger is down, when it is out of view and when the tab is hidden. The pause
 * button stops it outright, and reduced motion starts it paused. Changes made by
 * the reader are announced; the automatic ones are not, so nothing talks over
 * the page every few seconds.
 */

const CSS = `
.bz-ac{container-type:inline-size;position:relative;color:var(--bz-ink,#0a0a0a);font-family:var(--bz-font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif)}
.bz-ac *,.bz-ac *::before,.bz-ac *::after{box-sizing:border-box}
.bz-ac:focus-visible{outline:2px solid var(--bz-focus-ring,#912c22);outline-offset:4px;border-radius:20px}
.bz-ac-viewport{position:relative;overflow:hidden;border-radius:20px;background:var(--bz-void,#0c0c0f);touch-action:pan-y}
.bz-ac-track{display:flex;transition:transform 600ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-ac-slide{--bz-ac-stage:var(--bz-ac-wide,1.5);position:relative;flex:0 0 100%;margin:0;aspect-ratio:var(--bz-ac-stage);overflow:hidden;isolation:isolate}
@container (max-width:560px){.bz-ac-slide{--bz-ac-stage:var(--bz-ac-narrow,1)}}
.bz-ac-backdrop{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:blur(32px) saturate(1.1) brightness(0.45);transform:scale(1.25)}
.bz-ac-plate{position:absolute;inset:0;margin:auto;width:min(100%,calc(100% * var(--bz-ac-photo,1.5) / var(--bz-ac-stage)));height:min(100%,calc(100% * var(--bz-ac-stage) / var(--bz-ac-photo,1.5)));overflow:hidden;box-shadow:0 0 0 1px rgba(255,255,255,0.14)}
.bz-ac-img{display:block;width:100%;height:100%;object-fit:cover}
.bz-ac-caption{position:absolute;left:12px;bottom:14px;z-index:1;max-width:calc(100% - 24px);margin:0;padding:6px 12px;border-radius:999px;background:rgba(12,12,15,0.66);color:#ffffff;font-size:0.8125rem;font-weight:500;line-height:1.3}
.bz-ac-nav{position:absolute;top:50%;z-index:2;display:grid;place-items:center;width:48px;height:48px;margin-top:-24px;padding:0;border:1px solid rgba(255,255,255,0.35);border-radius:999px;background:rgba(12,12,15,0.55);color:#ffffff;cursor:pointer;transition:background-color 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)),transform 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-ac-nav[data-side="start"]{left:12px}
.bz-ac-nav[data-side="end"]{right:12px}
.bz-ac-nav svg{width:18px;height:18px}
.bz-ac-nav:focus-visible{outline:2px solid #ffffff;outline-offset:2px;box-shadow:0 0 0 6px rgba(12,12,15,0.6)}
.bz-ac-nav:active{transform:scale(0.97)}
@media (hover:hover){.bz-ac-nav:hover{background:rgba(12,12,15,0.82)}}
.bz-ac-progress{position:absolute;right:0;bottom:0;left:0;z-index:2;height:3px;background:rgba(255,255,255,0.25)}
.bz-ac-bar{display:block;height:100%;background:#ffffff;transform:scaleX(0);transform-origin:left center;animation:bz-ac-fill 5000ms linear forwards}
@keyframes bz-ac-fill{to{transform:scaleX(1)}}
.bz-ac:not([data-playing="true"]) .bz-ac-bar{animation-play-state:paused}
.bz-ac-controls{display:flex;align-items:center;justify-content:center;gap:4px;margin-top:10px}
.bz-ac-toggle{display:grid;flex:none;place-items:center;width:48px;height:48px;margin-right:4px;padding:0;border:1px solid var(--bz-line-strong,rgba(10,10,10,0.13));border-radius:999px;background:var(--bz-paper,#ffffff);color:var(--bz-ink,#0a0a0a);cursor:pointer;transition:background-color 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)),transform 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-ac-toggle svg{width:14px;height:14px}
.bz-ac-toggle:active{transform:scale(0.97)}
@media (hover:hover){.bz-ac-toggle:hover{background:var(--bz-paper-sunken,#fafafa)}}
.bz-ac-toggle:focus-visible,.bz-ac-dot:focus-visible{outline:2px solid var(--bz-focus-ring,#912c22);outline-offset:2px}
.bz-ac-dots{display:flex;align-items:center}
.bz-ac-dot{display:grid;place-items:center;width:48px;height:48px;padding:0;border:0;border-radius:999px;background:transparent;cursor:pointer}
.bz-ac-dot::before{content:"";width:8px;height:8px;border-radius:999px;background:rgba(10,10,10,0.45);transition:width 300ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)),background-color 300ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-ac-dot[aria-current="true"]::before{width:24px;background:var(--bz-ink,#0a0a0a)}
.bz-ac-counter{min-width:64px;font:500 0.8125rem/1 var(--bz-font-mono,ui-monospace,SFMono-Regular,Menlo,monospace);font-variant-numeric:tabular-nums;text-align:center;color:var(--bz-ink-muted,#4a4a4c)}
.bz-ac-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
@media (prefers-reduced-motion:reduce){.bz-ac-track,.bz-ac-nav,.bz-ac-toggle,.bz-ac-dot::before{transition:none}.bz-ac-nav:active,.bz-ac-toggle:active{transform:none}}
`;

const RM_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(RM_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const readReducedMotion = () => window.matchMedia(RM_QUERY).matches;
const serverReducedMotion = () => false;

export type CarouselSlide = {
  src: string;
  alt: string;
  caption?: string;
  /** Intrinsic size, so the plate is right before the image loads. */
  width?: number;
  height?: number;
};

export type AutoplayCarouselProps = {
  slides: CarouselSlide[];
  /** Names the carousel for assistive tech. */
  label: string;
  /** Time on each slide, in milliseconds. */
  interval?: number;
  /** Stage width divided by height. */
  aspect?: number;
  /** Stage proportions when the carousel is 560px wide or less. */
  narrowAspect?: number;
  /** More slides than this show a counter instead of dots. */
  maxDots?: number;
  pauseLabel?: string;
  className?: string;
};

export function AutoplayCarousel({
  slides,
  label,
  interval = 5000,
  aspect = 1.5,
  narrowAspect = 1,
  maxDots = 6,
  pauseLabel = "Pause slideshow",
  className = "",
}: AutoplayCarouselProps) {
  const reduced = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, serverReducedMotion);
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [autoPref, setAutoPref] = useState<boolean | null>(null);
  const [held, setHeld] = useState(false);
  const [ratios, setRatios] = useState<Record<number, number>>({});
  const [announcement, setAnnouncement] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const holds = useRef(new Set<string>());
  const swipe = useRef<{ x: number; y: number } | null>(null);

  const current = count ? Math.max(0, Math.min(index, count - 1)) : 0;
  const auto = autoPref ?? !reduced;
  const playing = auto && !held && count > 1;

  const hold = useCallback((reason: string, on: boolean) => {
    const set = holds.current;
    if (on) set.add(reason);
    else set.delete(reason);
    setHeld(set.size > 0);
  }, []);

  const go = useCallback(
    (next: number, announce: boolean) => {
      if (!count) return;
      const i = ((next % count) + count) % count;
      setIndex(i);
      if (announce) {
        const caption = slides[i]?.caption;
        setAnnouncement(`Photo ${i + 1} of ${count}${caption ? `: ${caption}` : ""}`);
      }
    },
    [count, slides],
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([entry]) => hold("offscreen", !entry.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [hold]);

  useEffect(() => {
    const sync = () => hold("hidden", document.visibilityState === "hidden");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [hold]);

  if (!count) return null;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(current + 1, true);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(current - 1, true);
    }
  };

  const onFocus = (event: ReactFocusEvent<HTMLDivElement>) => {
    let visible = true;
    try {
      visible = (event.target as Element).matches(":focus-visible");
    } catch {
      visible = true;
    }
    if (visible) hold("focus", true);
  };
  const onBlur = (event: ReactFocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    if (next && rootRef.current?.contains(next)) return;
    hold("focus", false);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") return;
    swipe.current = { x: event.clientX, y: event.clientY };
    hold("press", true);
  };
  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = swipe.current;
    swipe.current = null;
    hold("press", false);
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 44 || Math.abs(dx) <= Math.abs(dy)) return;
    go(current + (dx < 0 ? 1 : -1), true);
  };

  const rootStyle = {
    ["--bz-ac-wide" as string]: aspect,
    ["--bz-ac-narrow" as string]: narrowAspect,
  } as CSSProperties;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        ref={rootRef}
        className={`bz-ac ${className}`.trim()}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        tabIndex={0}
        data-playing={playing ? "true" : "false"}
        style={rootStyle}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") hold("hover", true);
        }}
        onPointerLeave={() => hold("hover", false)}
      >
        <div
          className="bz-ac-viewport"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            swipe.current = null;
            hold("press", false);
          }}
        >
          <div className="bz-ac-track" style={{ transform: `translate3d(${-current * 100}%, 0, 0)` }}>
            {slides.map((slide, i) => {
              const ratio = slide.width && slide.height ? slide.width / slide.height : ratios[i];
              return (
                <figure
                  key={`${slide.src}-${i}`}
                  className="bz-ac-slide"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${count}${slide.caption ? `: ${slide.caption}` : ""}`}
                  aria-hidden={i === current ? undefined : true}
                  style={ratio ? ({ ["--bz-ac-photo" as string]: ratio } as CSSProperties) : undefined}
                >
                  <img className="bz-ac-backdrop" src={slide.src} alt="" aria-hidden="true" decoding="async" loading={i === 0 ? "eager" : "lazy"} />
                  <div className="bz-ac-plate">
                    <img
                      className="bz-ac-img"
                      src={slide.src}
                      alt={slide.alt}
                      decoding="async"
                      loading={i === 0 ? "eager" : "lazy"}
                      draggable={false}
                      onLoad={(event) => {
                        if (slide.width && slide.height) return;
                        const img = event.currentTarget;
                        if (img.naturalWidth && img.naturalHeight) {
                          setRatios((prev) => ({ ...prev, [i]: img.naturalWidth / img.naturalHeight }));
                        }
                      }}
                    />
                  </div>
                  {slide.caption ? <figcaption className="bz-ac-caption">{slide.caption}</figcaption> : null}
                </figure>
              );
            })}
          </div>
          {count > 1 ? (
            <>
              <button type="button" className="bz-ac-nav" data-side="start" aria-label="Previous photo" onClick={() => go(current - 1, true)}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button type="button" className="bz-ac-nav" data-side="end" aria-label="Next photo" onClick={() => go(current + 1, true)}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="bz-ac-progress" aria-hidden="true">
                <span
                  key={current}
                  className="bz-ac-bar"
                  style={{ animationDuration: `${interval}ms`, opacity: auto ? 1 : 0 }}
                  onAnimationEnd={() => go(current + 1, false)}
                />
              </div>
            </>
          ) : null}
        </div>

        {count > 1 ? (
          <div className="bz-ac-controls">
            <button
              type="button"
              className="bz-ac-toggle"
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
            {count <= maxDots ? (
              <div className="bz-ac-dots">
                {slides.map((slide, i) => (
                  <button
                    key={`${slide.src}-dot-${i}`}
                    type="button"
                    className="bz-ac-dot"
                    aria-label={`Show photo ${i + 1}${slide.caption ? `: ${slide.caption}` : ""}`}
                    aria-current={i === current ? "true" : undefined}
                    onClick={() => go(i, true)}
                  />
                ))}
              </div>
            ) : (
              <p className="bz-ac-counter" aria-hidden="true">
                {String(current + 1).padStart(String(count).length, "0")} / {count}
              </p>
            )}
          </div>
        ) : null}

        <p className="bz-ac-sr" aria-live="polite">
          {announcement}
        </p>
      </div>
    </>
  );
}
