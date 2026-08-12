"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MagicRings, LOADER_MAGIC_RINGS } from "../animation/MagicRings";
import { ShinyText } from "../animation/ShinyText";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type LoadingState = { text: string };

const SHINY_ITEM = {
  color: "hsl(45 4% 41% / 0.55)",
  shineColor: "hsl(5 62% 35%)",
} as const;

const PendingIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={cn("h-6 w-6", className)}>
    <circle cx="12" cy="12" r="9" />
  </svg>
);

const CheckFilled = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("h-6 w-6", className)}>
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
  </svg>
);

const LoaderCore = ({
  loadingStates,
  value = 0,
  shinyActive = true,
}: {
  loadingStates: LoadingState[];
  value?: number;
  shinyActive?: boolean;
}) => {
  const rowHeight = 40;
  const viewportHeight = Math.min(loadingStates.length, 5) * rowHeight;

  return (
    <div className="relative mx-auto w-full max-w-xl overflow-hidden" style={{ height: `${viewportHeight}px` }}>
      <motion.div
        className="flex flex-col"
        animate={{ y: -(value * rowHeight) }}
        transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      >
        {loadingStates.map((loadingState, index) => {
          const distance = Math.abs(index - value);
          const isActive = value === index;
          const isDone = index < value;
          const isPending = index > value;
          const opacity = isActive ? 1 : isDone ? 0.9 : Math.max(0.68 - distance * 0.06, 0.56);

          return (
            <div key={index} className="flex h-10 items-center gap-2.5 text-left" style={{ opacity }}>
              <div className="shrink-0">
                {isDone ? <CheckFilled className="text-amber-700/80" /> : null}
                {isActive ? <CheckFilled className="text-amber-700" /> : null}
                {isPending ? <PendingIcon className="text-neutral-500/50" /> : null}
              </div>
              {isActive && shinyActive ? (
                <ShinyText text={loadingState.text} className="text-base font-medium sm:text-lg" speed={2.2} spread={110} {...SHINY_ITEM} />
              ) : (
                <span
                  className={cn(
                    "text-base sm:text-lg",
                    isActive && "font-medium text-neutral-900",
                    isDone && "text-neutral-800/80",
                    isPending && "text-neutral-600/60",
                  )}
                >
                  {loadingState.text}
                </span>
              )}
            </div>
          );
        })}
      </motion.div>
    </div>
  );
};

export type MultiStepLoaderProps = {
  loadingStates: LoadingState[];
  loading?: boolean;
  duration?: number;
  loop?: boolean;
  title?: string;
  subtitle?: string;
  shinyActive?: boolean;
  magicRings?: boolean;
  onComplete?: () => void;
};

export function MultiStepLoader({
  loadingStates,
  loading,
  duration = 2000,
  loop = true,
  title,
  subtitle,
  shinyActive = true,
  magicRings = true,
  onComplete,
}: MultiStepLoaderProps) {
  const [currentState, setCurrentState] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const completedRef = useRef(false);

  useEffect(() => {
    if (!loading) {
      setCurrentState(0);
      completedRef.current = false;
      return;
    }
    if (!loop && currentState === loadingStates.length - 1) {
      if (completedRef.current) return;
      completedRef.current = true;
      const done = window.setTimeout(() => onCompleteRef.current?.(), Math.min(duration, 800));
      return () => window.clearTimeout(done);
    }
    const timeout = window.setTimeout(() => {
      setCurrentState((prev) =>
        loop
          ? prev === loadingStates.length - 1
            ? 0
            : prev + 1
          : Math.min(prev + 1, loadingStates.length - 1),
      );
    }, duration);
    return () => window.clearTimeout(timeout);
  }, [currentState, loading, loop, loadingStates.length, duration]);

  return (
    <>
      <style>{`
        .loader-magic-rings-layer {
          position: absolute;
          inset: 0;
          z-index: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
        }
        .loader-magic-rings-layer .magic-rings-container {
          position: absolute;
          left: 50%;
          top: 50%;
          width: max(100vw, 100dvh);
          height: max(100vw, 100dvh);
          transform: translate(-50%, -50%);
        }
      `}</style>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex h-dvh w-full items-center justify-center overflow-hidden"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            {magicRings ? (
              <div className="loader-magic-rings-layer" aria-hidden>
                <MagicRings className="h-full w-full" {...LOADER_MAGIC_RINGS} />
              </div>
            ) : null}
            <div className="absolute inset-0 z-[1] bg-white/60 backdrop-blur-[2px]" />
            <div className="relative z-10 flex w-full max-w-xl flex-col items-center px-6">
              {(title || subtitle) && (
                <div className="w-full rounded-2xl border border-neutral-200/80 bg-white/92 px-5 py-5 text-center shadow-sm backdrop-blur-sm sm:px-6">
                  {title ? <h2 className="text-2xl font-light tracking-tight text-neutral-900 sm:text-3xl">{title}</h2> : null}
                  {subtitle ? <p className="mt-2 text-sm leading-relaxed text-neutral-600 sm:text-base">{subtitle}</p> : null}
                </div>
              )}
              <div className="mt-6 w-full rounded-2xl border border-neutral-200/80 bg-white/90 px-5 py-4 shadow-sm backdrop-blur-sm sm:px-6">
                <LoaderCore value={currentState} loadingStates={loadingStates} shinyActive={shinyActive} />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
