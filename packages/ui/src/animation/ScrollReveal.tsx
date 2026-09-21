"use client";
import { useEffect, useRef, ReactNode } from "react";

type Variant = "up" | "left" | "right" | "scale";

type Props = {
  children: ReactNode;
  variant?: Variant;
  delay?: 0 | 100 | 200 | 300 | 400 | 500;
  className?: string;
};

/**
 * Timing comes from tokens.css, so a host that retimes the system retimes the
 * reveal. The hidden state is only ever reached when a script can undo it:
 * `scripting: none` and reduced motion both land the content visible, which is
 * the state anything that cannot animate must end in.
 *
 * The rules ship in the element rather than the head so a server render is
 * already correct and nothing flashes in before the observer attaches.
 */
const revealStyle = `
  .sr-up,.sr-left,.sr-right,.sr-scale {
    opacity:0;
    transition:opacity var(--bz-duration-slower,800ms) var(--bz-ease-out,cubic-bezier(.23,1,.32,1)),
               transform var(--bz-duration-slower,800ms) var(--bz-ease-out,cubic-bezier(.23,1,.32,1));
    will-change:opacity,transform;
  }
  .sr-up    { transform:translateY(24px); }
  .sr-left  { transform:translateX(-28px); }
  .sr-right { transform:translateX(28px); }
  .sr-scale { transform:scale(.94); }
  .sr-up.in,.sr-left.in,.sr-right.in,.sr-scale.in { opacity:1; transform:none; }
  /* Once it has landed the hint costs a layer for nothing. */
  .sr-rest { will-change:auto; }
  .sr-d1 { transition-delay:.1s; }
  .sr-d2 { transition-delay:.2s; }
  .sr-d3 { transition-delay:.3s; }
  .sr-d4 { transition-delay:.4s; }
  .sr-d5 { transition-delay:.5s; }
  @media (prefers-reduced-motion:reduce) {
    .sr-up,.sr-left,.sr-right,.sr-scale { opacity:1; transform:none; transition:none; }
  }
  @media (scripting:none) {
    .sr-up,.sr-left,.sr-right,.sr-scale { opacity:1; transform:none; }
  }
`;

const variantClass: Record<Variant, string> = {
  up: "sr-up",
  left: "sr-left",
  right: "sr-right",
  scale: "sr-scale",
};

export function ScrollReveal({ children, variant = "up", delay = 0, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // will-change is a promise to the compositor; it is withdrawn once the
    // reveal has landed, or straight away when nothing will animate.
    const rest = () => el.classList.add("sr-rest");
    el.addEventListener("transitionend", rest);

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
      el.classList.add("in", "sr-rest");
      return () => el.removeEventListener("transitionend", rest);
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.classList.add("in");
        io.disconnect();
      },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      el.removeEventListener("transitionend", rest);
    };
  }, []);

  const delayClass = delay ? `sr-d${delay / 100}` : "";
  const cls = [variantClass[variant], delayClass, className].filter(Boolean).join(" ");

  return (
    <>
      <style>{revealStyle}</style>
      <div ref={ref} className={cls}>
        {children}
      </div>
    </>
  );
}
