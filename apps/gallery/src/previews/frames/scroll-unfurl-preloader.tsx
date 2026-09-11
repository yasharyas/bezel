"use client";

import { useCallback, useEffect, useState } from "react";
import { ScrollUnfurlPreloader } from "bezel-ui/loaders/ScrollUnfurlPreloader";
import { usePreviewEnv } from "../kit";

/** Plays the preloader, rests briefly on the empty ground it hands off to, then replays. */
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
    }, reducedMotion ? 4000 : 1200);
    return () => window.clearTimeout(t);
  }, [playing, engaged, reducedMotion]);

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_50%_40%,#1a1310_0%,#0d0a09_70%)]">
      {playing ? <ScrollUnfurlPreloader key={run} brand="Bezel" onceKey={null} onComplete={done} /> : null}
    </main>
  );
}
