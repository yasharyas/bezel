"use client";

import { useState } from "react";
import { ErrorBoundary } from "bezel-ui/feedback/ErrorBoundary";
import { useIdleInterval } from "../kit";

const BARS = [38, 54, 33, 71, 60, 88, 74];

/**
 * The child really throws, on its first render, so the preview shows the
 * boundary doing its job rather than a drawing of it. Pressing Try again
 * clears the error, remounts this subtree with `broken` false, and the chart
 * comes back: the recovery is the same code path a real app would take.
 */
function RevenueChart({ broken, onBreak }: { broken: boolean; onBreak: () => void }) {
  if (broken) throw new TypeError("Cannot read properties of undefined (reading 'points')");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fafafa] p-10 text-[#0a0a0a]">
      {/* Same radius and shadow as the boundary's own panel, so the recovered
          card reads as the thing that was behind the fallback. */}
      <div className="w-full max-w-[420px] rounded-3xl border border-black/[0.13] bg-white p-8 shadow-[0_28px_54px_-30px_rgba(10,10,10,0.6)]">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#6b6b70]">
          Recovered in place
        </p>
        <p className="mt-2 font-serif text-[1.75rem] leading-tight">Revenue, last 7 days</p>
        <p className="mt-1 text-sm text-[#4a4a4c]">The chart mounted again with fresh data.</p>
        <div className="mt-6 flex h-28 items-end gap-2" aria-hidden>
          {BARS.map((height, i) => (
            <span
              key={i}
              className="flex-1 rounded-t-sm bg-[#912c22]"
              style={{ height: `${height}%`, opacity: 0.55 + i * 0.06 }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onBreak}
          className="mt-7 inline-flex min-h-[48px] items-center justify-center rounded-full border border-black/[0.13] px-6 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#fafafa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
        >
          Break it again
        </button>
      </div>
    </main>
  );
}

export default function ErrorBoundaryPreview() {
  const [broken, setBroken] = useState(true);

  // Once it has been recovered and nobody is pointing at it, break it again so
  // the card in the index settles back on the state worth looking at.
  useIdleInterval(() => setBroken(true), 5200, !broken);

  return (
    <>
      {/*
        This preview crashes on purpose, so the dev server's error counter would
        otherwise sit over the demo. The frame is its own document, so hiding it
        here leaves the rest of the gallery's dev tooling alone.
      */}
      <style>{`nextjs-portal { display: none; }`}</style>
      <ErrorBoundary
        code="Error 500"
        title="This chart stopped drawing"
        description="The boundary caught it here, so the rest of the page kept running. Try again remounts just this panel."
        buttonLabel="Try again"
        onReset={() => setBroken(false)}
      >
        <RevenueChart broken={broken} onBreak={() => setBroken(true)} />
      </ErrorBoundary>
    </>
  );
}
