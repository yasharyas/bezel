"use client";

import { useRef, useState, type MouseEvent } from "react";
import { Moon, Sun } from "lucide-react";
import { useThemeRipple } from "bezel-ui/hooks/useThemeRipple";
import { useIdleInterval } from "../kit";

const STORAGE_KEY = "bezel-preview-theme";

export default function UseThemeRipplePreview() {
  const [isDark, setDark] = useState(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }
    return false;
  });
  const { toggle } = useThemeRipple({ isDark, onToggle: setDark, storageKey: STORAGE_KEY });
  const button = useRef<HTMLButtonElement>(null);

  // While idle, press the toggle from its own centre so the wipe is visible.
  useIdleInterval(() => {
    const r = button.current?.getBoundingClientRect();
    if (!r) return;
    toggle({ clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 } as MouseEvent<HTMLButtonElement>);
  }, 3000);

  return (
    <main
      className="flex min-h-screen flex-col justify-center px-14 transition-colors"
      style={{ background: isDark ? "#0a0a0a" : "#f5f5f7", color: isDark ? "#fafafa" : "#0a0a0a" }}
    >
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-[0.3em] opacity-80">{isDark ? "Dark" : "Light"} theme</p>
        <button
          ref={button}
          type="button"
          onClick={toggle}
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          className="grid h-11 w-11 place-items-center rounded-full border"
          style={{ borderColor: isDark ? "rgba(255,255,255,0.25)" : "rgba(10,10,10,0.15)" }}
        >
          {isDark ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
        </button>
      </div>
      <h1 className="mt-8 font-serif text-5xl font-medium leading-tight">The wipe starts where you click</h1>
      <p className="mt-4 max-w-md opacity-80">A circular clip-path reveals the new theme from the pointer outward.</p>
    </main>
  );
}
