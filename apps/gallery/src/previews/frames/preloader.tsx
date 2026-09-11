"use client";

import { useCallback, useEffect, useState } from "react";
import { Preloader } from "bezel-ui/loaders/Preloader";
import { usePreviewEnv } from "../kit";

export default function PreloaderPreview() {
  const { engaged, reducedMotion } = usePreviewEnv();
  const [run, setRun] = useState(0);
  const [loading, setLoading] = useState(true);
  const done = useCallback(() => setLoading(false), []);

  // Replay once the page underneath has been visible for a moment.
  useEffect(() => {
    if (loading || engaged || reducedMotion) return;
    const t = window.setTimeout(() => {
      setRun((r) => r + 1);
      setLoading(true);
    }, 2600);
    return () => window.clearTimeout(t);
  }, [loading, engaged, reducedMotion]);

  return (
    <main className="flex min-h-screen flex-col justify-end bg-[#0a0a0a] p-12 text-white">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/70">Independent studio</p>
      <h1 className="mt-3 text-7xl font-medium tracking-tight">Bezel</h1>
      {loading && !reducedMotion ? <Preloader key={run} name="BEZEL" onComplete={done} /> : null}
    </main>
  );
}
