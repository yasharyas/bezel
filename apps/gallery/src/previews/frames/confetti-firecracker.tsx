"use client";

import { useEffect, useRef, useState } from "react";
import {
  ConfettiFirecracker,
  type FirecrackerHandle,
} from "bezel-ui/feedback/ConfettiFirecracker";
import { usePreviewEnv } from "../kit";

const GROUND = "#fafafa";
const field =
  "h-9 rounded-lg border border-[#6b6b70] bg-white px-3 text-sm text-ink outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]";

export default function ConfettiFirecrackerPreview() {
  const { engaged, reducedMotion } = usePreviewEnv();
  const cracker = useRef<FirecrackerHandle>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("Bezel");
  const [taps, setTaps] = useState(9);
  const [windowMs, setWindowMs] = useState(4000);
  const [density, setDensity] = useState<"low" | "normal" | "dense">("normal");
  const [still, setStill] = useState(false);
  const [count, setCount] = useState(0);

  // Fire on its own while nobody is here, so the card shows the thing itself.
  useEffect(() => {
    if (engaged) return;
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      cracker.current?.fire(window.innerWidth / 2, window.innerHeight * 0.88);
    }, 5200);
    return () => window.clearInterval(id);
  }, [engaged]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fafafa] p-8">
      <div className="w-full max-w-xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">Confetti firecracker</p>
        <h1 className="mt-2 font-serif text-3xl text-ink">Type a word, then set it off.</h1>

        <div className="mt-5 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">Text</span>
            <input className={`${field} w-48`} value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">Taps</span>
            <input
              type="number"
              min={2}
              max={20}
              className={`${field} w-20`}
              value={taps}
              onChange={(e) => setTaps(Math.max(2, Number(e.target.value) || 2))}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">Window</span>
            <input
              type="number"
              min={500}
              step={500}
              className={`${field} w-24`}
              value={windowMs}
              onChange={(e) => setWindowMs(Math.max(500, Number(e.target.value) || 500))}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">Density</span>
            <select
              className={`${field} w-28`}
              value={density}
              onChange={(e) => setDensity(e.target.value as "low" | "normal" | "dense")}
            >
              <option value="low">low</option>
              <option value="normal">normal</option>
              <option value="dense">dense</option>
            </select>
          </label>
          <button
            type="button"
            onClick={(e) => cracker.current?.fire(e.clientX, e.clientY)}
            className="h-9 rounded-lg bg-[#912c22] px-4 text-sm font-semibold text-[#f7f3ee] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
          >
            Fire
          </button>
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
          <input type="checkbox" checked={still} onChange={(e) => setStill(e.target.checked)} />
          Reduced motion preview
        </label>

        <div
          ref={panel}
          className="mt-5 select-none rounded-2xl border border-dashed border-black/15 bg-white px-6 py-7 text-center"
        >
          <p className="text-sm text-ink">
            Tap this panel {taps} times inside {(windowMs / 1000).toFixed(1)}s
          </p>
          <p className="mt-2 font-mono text-2xl text-ink">
            {count} / {taps}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Taps spread wider than the window never add up. Taps on the{" "}
            <a href="#top" className="underline">
              link
            </a>{" "}
            do not count.
          </p>
        </div>

        <ConfettiFirecracker
          ref={cracker}
          text={text}
          ground={GROUND}
          density={density}
          triggerRef={panel}
          taps={taps}
          windowMs={windowMs}
          reducedMotion={still || reducedMotion ? true : undefined}
          onTapProgress={setCount}
        />
      </div>
    </main>
  );
}
