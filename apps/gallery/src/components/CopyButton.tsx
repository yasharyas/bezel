"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

type Props = {
  value: string;
  /** What is being copied, for the accessible name: "Copy install command". */
  label: string;
  className?: string;
  showText?: boolean;
};

export function CopyButton({ value, label, className = "", showText = false }: Props) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const t = window.setTimeout(() => setState("idle"), 2000);
    return () => window.clearTimeout(t);
  }, [state]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className={`focus-ring inline-flex h-9 min-w-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2 text-sm text-void-ink transition-colors hover:bg-white/10 ${className}`}
    >
      {state === "copied" ? <Check aria-hidden size={16} /> : <Copy aria-hidden size={16} />}
      {showText ? <span>{state === "copied" ? "Copied" : state === "failed" ? "Press Ctrl+C" : "Copy"}</span> : null}
      <span aria-live="polite" className="sr-only">
        {state === "copied" ? "Copied to clipboard" : state === "failed" ? "Copy failed" : ""}
      </span>
    </button>
  );
}
