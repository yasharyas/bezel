"use client";
import { useEffect, useRef, ReactNode } from "react";

type Variant = "up" | "left" | "right" | "scale";

type Props = {
  children: ReactNode;
  variant?: Variant;
  delay?: 0 | 100 | 200 | 300 | 400 | 500;
  className?: string;
};

const revealStyle = `
  .sr-up    { opacity:0; transform:translateY(32px) scale(.97); transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1); will-change:opacity,transform; }
  .sr-up.in { opacity:1; transform:translateY(0) scale(1); }
  .sr-left    { opacity:0; transform:translateX(-40px) scale(.97); transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1); will-change:opacity,transform; }
  .sr-left.in { opacity:1; transform:translateX(0) scale(1); }
  .sr-right    { opacity:0; transform:translateX(40px) scale(.97); transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1); will-change:opacity,transform; }
  .sr-right.in { opacity:1; transform:translateX(0) scale(1); }
  .sr-scale    { opacity:0; transform:scale(.88); transition:opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1); will-change:opacity,transform; }
  .sr-scale.in { opacity:1; transform:scale(1); }
  .sr-d1 { transition-delay:.1s; }
  .sr-d2 { transition-delay:.2s; }
  .sr-d3 { transition-delay:.3s; }
  .sr-d4 { transition-delay:.4s; }
  .sr-d5 { transition-delay:.5s; }
  @media (prefers-reduced-motion:reduce) {
    .sr-up,.sr-left,.sr-right,.sr-scale { opacity:1; transform:none; transition:none; }
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
    if (!("IntersectionObserver" in window)) {
      el.classList.add("in");
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("in");
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
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
