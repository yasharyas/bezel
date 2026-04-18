"use client";
import { useEffect } from "react";

type Props = {
  isDark: boolean;
  onToggle: (nextDark: boolean) => void;
  storageKey?: string;
};

export function useThemeRipple({ isDark, onToggle, storageKey = "theme" }: Props) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(storageKey);
    if (stored === "dark") onToggle(true);
    else if (stored === "light") onToggle(false);
  }, []);

  function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    const nextDark = !isDark;
    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    const oldBg = nextDark ? "#f5f5f7" : "#0a0a0a";

    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, nextDark ? "dark" : "light");
    }
    onToggle(nextDark);

    const overlay = document.createElement("div");
    overlay.style.cssText = `position:fixed;inset:0;z-index:2147483647;background:${oldBg};pointer-events:none;will-change:clip-path;`;
    document.body.appendChild(overlay);

    const anim = overlay.animate(
      [
        { clipPath: `circle(${endRadius}px at ${x}px ${y}px)` },
        { clipPath: `circle(0px at ${x}px ${y}px)` },
      ],
      { duration: 650, easing: "cubic-bezier(.2,.7,.2,1)" }
    );
    anim.onfinish = () => overlay.remove();
  }

  return { toggle };
}
