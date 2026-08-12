"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import confetti from "canvas-confetti";
import type {
  CreateTypes as ConfettiInstance,
  Options as ConfettiOptions,
  GlobalOptions as ConfettiGlobalOptions,
} from "canvas-confetti";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export type ConfettiApi = { fire: (options?: ConfettiOptions) => void };
export type ConfettiCanvasRef = ConfettiApi | null;

type ConfettiCanvasProps = React.ComponentPropsWithRef<"canvas"> & {
  options?: ConfettiOptions;
  globalOptions?: ConfettiGlobalOptions;
  manualstart?: boolean;
  children?: ReactNode;
};

const ConfettiCanvas = forwardRef<ConfettiCanvasRef, ConfettiCanvasProps>(
  ({ options, globalOptions = { resize: true, useWorker: true }, manualstart = false, children, ...rest }, ref) => {
    const instanceRef = useRef<ConfettiInstance | null>(null);

    const canvasRef = useCallback(
      (node: HTMLCanvasElement | null) => {
        if (node !== null) {
          if (instanceRef.current) return;
          instanceRef.current = confetti.create(node, { ...globalOptions, resize: true });
        } else if (instanceRef.current) {
          instanceRef.current.reset();
          instanceRef.current = null;
        }
      },
      [globalOptions],
    );

    const fire = useCallback(
      async (opts: ConfettiOptions = {}) => {
        await instanceRef.current?.({ ...options, ...opts });
      },
      [options],
    );

    const api = useMemo(() => ({ fire }), [fire]);
    useImperativeHandle(ref, () => api, [api]);

    useEffect(() => {
      if (!manualstart) void fire();
    }, [manualstart, fire]);

    return (
      <>
        <canvas ref={canvasRef} {...rest} />
        {children}
      </>
    );
  },
);
ConfettiCanvas.displayName = "ConfettiCanvas";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function burst(api: ConfettiCanvasRef, colors: string[]) {
  if (!api || prefersReducedMotion()) return;
  void api.fire({
    particleCount: 90,
    spread: 68,
    startVelocity: 44,
    origin: { x: 0.5, y: 0.58 },
    colors,
    disableForReducedMotion: true,
  });
  window.setTimeout(() => {
    void api.fire({
      particleCount: 55,
      angle: 62,
      spread: 54,
      origin: { x: 0.08, y: 0.68 },
      colors,
      disableForReducedMotion: true,
    });
  }, 160);
  window.setTimeout(() => {
    void api.fire({
      particleCount: 55,
      angle: 118,
      spread: 54,
      origin: { x: 0.92, y: 0.68 },
      colors,
      disableForReducedMotion: true,
    });
  }, 300);
}

export type CelebrationOverlayProps = {
  open?: boolean;
  title?: string;
  description?: string;
  ctaLabel?: string;
  colors?: string[];
  onContinue?: () => void;
  replayMs?: number; // 0 to disable interval replay
};

/** Full-screen blur overlay with choreographed triple confetti bursts + GSAP card pop. */
export function CelebrationOverlay({
  open = true,
  title = "You're all set",
  description = "Everything is submitted. We'll email you when there's an update.",
  ctaLabel = "Continue",
  colors = ["#912c22", "#b8483a", "#f5f0e8", "#6d2219", "#d4847a"],
  onContinue,
  replayMs = 3000,
}: CelebrationOverlayProps) {
  const confettiRef = useRef<ConfettiCanvasRef>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!open) return;
    burst(confettiRef.current, colors);
    if (!replayMs) return;
    const replay = window.setInterval(() => burst(confettiRef.current, colors), replayMs);
    return () => window.clearInterval(replay);
  }, [open, colors, replayMs]);

  useGSAP(
    () => {
      const card = cardRef.current;
      if (!card || !open) return;
      if (prefersReducedMotion()) {
        gsap.set(card, { autoAlpha: 1, y: 0, scale: 1 });
        return;
      }
      gsap.from(card, { autoAlpha: 0, y: 12, scale: 0.96, duration: 0.4, ease: "power3.out" });
      gsap.from(card.querySelector("[data-celebrate-check]"), {
        scale: 0.9,
        autoAlpha: 0,
        duration: 0.28,
        delay: 0.12,
        ease: "power3.out",
      });
    },
    { scope: rootRef, dependencies: [open] },
  );

  function handleContinue() {
    if (exiting) return;
    setExiting(true);
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) {
      onContinue?.();
      return;
    }
    gsap.to(root, {
      autoAlpha: 0,
      duration: 0.25,
      ease: "power2.out",
      onComplete: () => onContinue?.(),
    });
  }

  if (!open) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[110] flex h-dvh max-h-dvh items-center justify-center overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-overlay-title"
    >
      <div className="absolute inset-0 bg-neutral-50/90 backdrop-blur-md" />
      <ConfettiCanvas
        ref={confettiRef}
        manualstart
        className="pointer-events-none fixed inset-0 z-[1] h-full w-full"
        options={{ colors, disableForReducedMotion: true }}
      />
      <div className="relative z-10 mx-auto w-full max-w-md px-5 sm:px-6">
        <div
          ref={cardRef}
          className="rounded-2xl border border-neutral-200/90 bg-white/95 p-6 text-center shadow-lg backdrop-blur-sm sm:p-8"
        >
          <svg
            data-celebrate-check
            className="mx-auto h-12 w-12 text-amber-700 sm:h-14 sm:w-14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 12.5l2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h1 id="celebration-overlay-title" className="mt-4 text-2xl font-light tracking-tight text-neutral-900 sm:mt-5 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600 sm:text-base">{description}</p>
          <button
            type="button"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#912c22] px-5 py-2.5 text-sm font-semibold text-[#f7f3ee] disabled:opacity-50 sm:mt-8 sm:w-auto"
            disabled={exiting}
            onClick={handleContinue}
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
