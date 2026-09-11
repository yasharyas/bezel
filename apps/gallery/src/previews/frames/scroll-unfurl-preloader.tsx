"use client";

import { useCallback, useEffect, useState } from "react";
import { ScrollUnfurlPreloader } from "bezel-ui/loaders/ScrollUnfurlPreloader";
import { usePreviewEnv } from "../kit";

export default function ScrollUnfurlPreloaderPreview() {
  const { engaged, reducedMotion } = usePreviewEnv();
  const [run, setRun] = useState(0);
  const [playing, setPlaying] = useState(true);
  const done = useCallback(() => setPlaying(false), []);

  useEffect(() => {
    if (playing || engaged) return;
    const t = window.setTimeout(() => {
      setRun((r) => r + 1);
      setPlaying(true);
    }, reducedMotion ? 4000 : 2400);
    return () => window.clearTimeout(t);
  }, [playing, engaged, reducedMotion]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_at_50%_40%,#1a1310_0%,#0d0a09_70%)] text-center text-[#f5f0e8]">
      <p className="font-mono text-xs uppercase tracking-[0.4em] text-[#e8d5a3]">You are invited</p>
      <h1 className="mt-4 font-serif text-5xl">The wedding of Aarav &amp; Diya</h1>
      {playing ? <ScrollUnfurlPreloader key={run} brand="Bezel" onceKey={null} onComplete={done} /> : null}
    </main>
  );
}
