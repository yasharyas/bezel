"use client";

import { useEffect } from "react";
import { ToastContainer, useToast } from "bezel-ui/feedback/ToastContainer";
import { useIdleInterval } from "../kit";

const MESSAGES = ["Changes saved", "Link copied", "Invite sent to Priya"];

export default function ToastContainerPreview() {
  const { toasts, show } = useToast();

  useEffect(() => {
    const t = window.setTimeout(() => show(MESSAGES[0]), 500);
    return () => window.clearTimeout(t);
  }, [show]);

  useIdleInterval(() => show(MESSAGES[Math.floor(Date.now() / 1000) % MESSAGES.length]), 3200);

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-[280px] rounded-2xl border border-black/[0.06] bg-white p-5 text-left">
        <p className="text-sm font-semibold text-[#0a0a0a]">Profile</p>
        <p className="mt-1 text-sm text-[#4a4a4c]">Your display name is visible to your team.</p>
        <button
          type="button"
          onClick={() => show("Changes saved")}
          className="mt-4 rounded-full bg-[#0a0a0a] px-4 py-2 text-sm font-medium text-white"
        >
          Save changes
        </button>
      </div>
      <ToastContainer toasts={toasts} />
    </main>
  );
}
