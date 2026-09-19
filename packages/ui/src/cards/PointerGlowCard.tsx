"use client";

import {
  useCallback,
  useRef,
  type CSSProperties,
  type FocusEvent,
  type HTMLAttributes,
  type PointerEvent,
  type ReactNode,
} from "react";

/*
 * PointerGlowCard: a card lit by a spotlight that follows the pointer.
 *
 * Two layers share one radial gradient centred on the pointer: a 1px ring just
 * inside the border, and a soft wash across the surface beneath the content.
 * Both sit inside the padding box, because the card clips its overflow and a
 * ring laid over the border itself would be clipped away. The wash is the glow
 * colour at 14%, so text over it keeps its contrast.
 *
 * Keyboard focus lights the card the same way: when focus lands on something
 * inside it, the spotlight moves to that element; a focusable card lights
 * around its centre. Tracking is for fine pointers only, so a tap never leaves
 * a glow behind. Nothing moves on its own, and reduced motion drops the fade.
 */

const CSS = `
.pgc{position:relative;isolation:isolate;border-radius:1.25rem;background:rgba(255,255,255,0.55);border:1px solid var(--bz-line-strong,rgba(10,10,10,0.13));overflow:hidden}
.pgc::before,.pgc::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity 300ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.pgc::before{z-index:2;padding:1px;background:radial-gradient(var(--pgc-r,220px) circle at var(--gx,50%) var(--gy,50%),var(--pgc-a),var(--pgc-b) 34%,transparent 62%);-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
.pgc::after{z-index:0;background:radial-gradient(var(--pgc-r,220px) circle at var(--gx,50%) var(--gy,50%),rgba(145,44,34,0.12),transparent 70%)}
@supports (color:color-mix(in srgb,red 50%,blue)){.pgc::after{background:radial-gradient(var(--pgc-r,220px) circle at var(--gx,50%) var(--gy,50%),color-mix(in srgb,var(--pgc-a) 14%,transparent),transparent 70%)}}
.pgc[data-lit]::before,.pgc[data-lit]::after,.pgc:focus-visible::before,.pgc:focus-visible::after{opacity:1}
.pgc:has(:focus-visible)::before,.pgc:has(:focus-visible)::after{opacity:1}
.pgc:focus-visible{outline:2px solid var(--bz-focus-ring,#912c22);outline-offset:2px}
.pgc__body{position:relative;z-index:1}
@media (prefers-reduced-motion:reduce){.pgc::before,.pgc::after{transition:none}}
`;

type PointerGlowCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** The ring's colour under the pointer. The surface wash is this colour at 14%. */
  glowColor?: string;
  /** The ring's colour where it fades out. */
  glowSecondary?: string;
  /** Radius of the spotlight, in pixels. */
  radius?: number;
};

export function PointerGlowCard({
  children,
  className = "",
  glowColor = "rgba(145, 44, 34, 0.9)",
  glowSecondary = "rgba(145, 44, 34, 0.28)",
  radius = 220,
  style,
  onPointerMove,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  ...rest
}: PointerGlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const place = useCallback((x: number, y: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    el.style.setProperty("--gx", `${((x - r.left) / r.width) * 100}%`);
    el.style.setProperty("--gy", `${((y - r.top) / r.height) * 100}%`);
  }, []);

  const handleMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "touch") place(e.clientX, e.clientY);
    onPointerMove?.(e);
  };

  const handleEnter = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "touch") {
      place(e.clientX, e.clientY);
      ref.current?.setAttribute("data-lit", "");
    }
    onPointerEnter?.(e);
  };

  const handleLeave = (e: PointerEvent<HTMLDivElement>) => {
    ref.current?.removeAttribute("data-lit");
    onPointerLeave?.(e);
  };

  // Keyboard equivalent: the spotlight moves to whatever took focus, which is
  // the card's own centre when the card itself is focusable.
  const handleFocus = (e: FocusEvent<HTMLDivElement>) => {
    const r = (e.target as HTMLElement).getBoundingClientRect();
    place(r.left + r.width / 2, r.top + r.height / 2);
    onFocus?.(e);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        ref={ref}
        className={`pgc ${className}`.trim()}
        style={
          {
            ...style,
            "--gx": "50%",
            "--gy": "50%",
            "--pgc-a": glowColor,
            "--pgc-b": glowSecondary,
            "--pgc-r": `${radius}px`,
          } as CSSProperties
        }
        onPointerMove={handleMove}
        onPointerEnter={handleEnter}
        onPointerLeave={handleLeave}
        onFocus={handleFocus}
        {...rest}
      >
        <div className="pgc__body">{children}</div>
      </div>
    </>
  );
}
