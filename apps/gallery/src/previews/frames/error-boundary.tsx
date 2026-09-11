"use client";

import { useState } from "react";
import { ErrorBoundary } from "bezel-ui/feedback/ErrorBoundary";

/**
 * Starts the boundary in its caught state rather than throwing, so the preview
 * shows the fallback without logging a real error on every load.
 */
class CaughtBoundary extends ErrorBoundary {
  state = { hasError: true };
}

const copy = {
  title: "This chart could not load",
  description: "Something went wrong while drawing it. Refreshing usually fixes it.",
  buttonLabel: "Refresh",
};

export default function ErrorBoundaryPreview() {
  const [crashed, setCrashed] = useState(true);
  return (
    <div className="relative text-[#0a0a0a]">
      <div role="group" aria-label="Boundary state" className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-black/[0.06]">
        {[
          { label: "Healthy", value: false },
          { label: "Caught an error", value: true },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            aria-pressed={crashed === option.value}
            onClick={() => setCrashed(option.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              crashed === option.value ? "bg-[#0a0a0a] text-white" : "text-[#4a4a4c]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {crashed ? (
        <CaughtBoundary {...copy}>
          <span />
        </CaughtBoundary>
      ) : (
        <ErrorBoundary {...copy}>
          <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-10">
            <div className="w-full max-w-sm rounded-2xl border border-black/[0.06] bg-white p-5">
              <p className="text-sm text-[#4a4a4c]">Revenue, last 7 days</p>
              <p className="mt-1 text-3xl font-semibold">₹4,82,000</p>
              <div className="mt-4 flex h-24 items-end gap-2" aria-hidden>
                {[40, 55, 35, 70, 62, 88, 76].map((h, i) => (
                  <span key={i} className="flex-1 rounded-t bg-[#912c22]/80" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </main>
        </ErrorBoundary>
      )}
    </div>
  );
}
