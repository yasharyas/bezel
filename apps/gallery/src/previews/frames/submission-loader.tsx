"use client";

import { useEffect, useState } from "react";
import { SubmissionLoader } from "bezel-ui/feedback/SubmissionLoader";
import { usePreviewEnv } from "../kit";

type Phase = "verifying" | "validating" | "submitting" | "complete";
const SEQUENCE: (Phase | null)[] = ["verifying", "validating", "submitting", "complete", "complete", null];

export default function SubmissionLoaderPreview() {
  const { reducedMotion } = usePreviewEnv();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    const t = window.setTimeout(() => setStep((s) => (s + 1) % SEQUENCE.length), SEQUENCE[step] ? 1300 : 900);
    return () => window.clearTimeout(t);
  }, [step, reducedMotion]);

  return (
    <main className="flex min-h-screen items-center justify-center p-10">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-black/[0.06] bg-white p-6" aria-hidden>
        <div className="h-3 w-24 rounded bg-black/10" />
        <div className="h-10 rounded-full border border-black/10" />
        <div className="h-10 rounded-full border border-black/10" />
        <div className="h-10 w-32 rounded-full bg-[#912c22]/80" />
      </div>
      <SubmissionLoader phase={reducedMotion ? "validating" : SEQUENCE[step]} />
    </main>
  );
}
