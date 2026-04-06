"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

type Props = {
  name?: string;
  onComplete: () => void;
};

export function Preloader({ name = "LOADING", onComplete }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const preloader = rootRef.current;
    const counterEl = counterRef.current;
    if (!preloader || !counterEl) return;

    const chars = Array.from(preloader.querySelectorAll<HTMLElement>(".yui-pl-char"));
    const obj = { value: 0 };

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.delayedCall(0.1, onComplete);
      },
    });

    // Count 0 → 100
    tl.to(obj, {
      value: 100,
      duration: 1.6,
      ease: "power2.inOut",
      onUpdate: () => {
        counterEl.textContent = Math.round(obj.value) + "%";
      },
    });

    // Reveal letters
    tl.to(chars, { y: 0, duration: 1, stagger: 0.035, ease: "power3.out" }, 0.2);

    // Fade non-key chars then slide preloader up
    tl.to(chars.slice(1, -1), { opacity: 0, y: "-20%", duration: 0.5, stagger: 0.02, ease: "power2.in" }, "+=0.3");
    tl.to(preloader, { yPercent: -100, duration: 0.9, ease: "power3.inOut" }, "-=0.2");

    return () => { tl.kill(); };
  }, [onComplete]);

  const letters = name.split("").map((ch, i) => (
    <span key={i} className="yui-pl-char" style={{ display: "inline-block", transform: "translateY(110%)" }}>
      {ch === " " ? "\u00A0" : ch}
    </span>
  ));

  return (
    <>
      <style>{`
        .yui-pl-root {
          position: fixed; top: 0; left: 0;
          width: 100%; height: 100%;
          z-index: 10000; background: #fff;
          display: flex; justify-content: center; align-items: center;
        }
        .yui-pl-name {
          display: flex; overflow: hidden;
          color: #000;
          font-size: clamp(3rem, 8vw, 12rem);
          font-weight: 500; letter-spacing: -0.05em;
        }
        .yui-pl-counter {
          position: fixed; right: 5rem; bottom: 5rem;
          font-size: clamp(4rem, 6vw, 10rem);
          font-weight: 500; color: #000; overflow: hidden;
        }
      `}</style>
      <div className="yui-pl-root" ref={rootRef}>
        <div className="yui-pl-name">{letters}</div>
        <div className="yui-pl-counter">
          <span ref={counterRef}>0%</span>
        </div>
      </div>
    </>
  );
}
