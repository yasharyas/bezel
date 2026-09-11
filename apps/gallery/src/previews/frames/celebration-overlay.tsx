"use client";

import { useEffect, useState } from "react";
import { CelebrationOverlay } from "bezel-ui/feedback/CelebrationOverlay";
import { usePreviewEnv } from "../kit";

export default function CelebrationOverlayPreview() {
  const { engaged } = usePreviewEnv();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (open || engaged) return;
    const t = window.setTimeout(() => setOpen(true), 2200);
    return () => window.clearTimeout(t);
  }, [open, engaged]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-10">
      <div className="w-full max-w-sm rounded-2xl border border-black/[0.06] bg-white p-6 text-center">
        <p className="text-sm text-[#4a4a4c]">Application submitted</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 rounded-xl bg-[#912c22] px-4 py-2 text-sm font-semibold text-[#f7f3ee]"
        >
          Celebrate again
        </button>
      </div>
      <CelebrationOverlay
        open={open}
        replayMs={3200}
        title="You're all set"
        description="Your application is in. We'll email you when there's an update."
        onContinue={() => setOpen(false)}
      />
    </main>
  );
}
