"use client";
import { useEffect, useRef, useState, ReactNode } from "react";

type Props = {
  title: string;
  titleHighlight?: string;
  subtitle: string;
  typingDelay?: number;
  typingSpeed?: number;
  children?: ReactNode;
};

const typingStyle = `
  @keyframes typing-cursor { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
  .typing-sub::after {
    content: '|'; display: inline-block; margin-left: 1px;
    color: #059669; font-weight: 300;
    animation: typing-cursor .85s step-end infinite; opacity: 0;
  }
  .typing-sub.is-typing::after { opacity: 1; }
  .typing-sub.is-done::after   { opacity: 1; }
`;

export function TypingHero({
  title,
  titleHighlight,
  subtitle,
  typingDelay = 480,
  typingSpeed = 28,
  children,
}: Props) {
  const subRef = useRef<HTMLParagraphElement>(null);
  const [ctaVisible, setCtaVisible] = useState(false);

  useEffect(() => {
    const el = subRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = subtitle;
      el.classList.add("is-done");
      setCtaVisible(true);
      return;
    }
    let i = 0;
    const timer = setTimeout(() => {
      el.classList.add("is-typing");
      const tick = setInterval(() => {
        el.textContent = subtitle.slice(0, ++i);
        if (i >= subtitle.length) {
          clearInterval(tick);
          el.classList.remove("is-typing");
          el.classList.add("is-done");
          setCtaVisible(true);
        }
      }, typingSpeed);
    }, typingDelay);
    return () => clearTimeout(timer);
  }, [subtitle, typingDelay, typingSpeed]);

  return (
    <>
      <style>{typingStyle}</style>
      <section className="max-w-[1200px] mx-auto px-6 pt-[72px] pb-12 text-center flex flex-col items-center">
        <h1
          className="font-serif font-medium leading-none mb-[18px] text-[#0a0a0a] tracking-[-0.02em]"
          style={{ fontSize: "clamp(48px, 9vw, 112px)" }}
        >
          {title}{" "}
          {titleHighlight && (
            <span className="font-serif italic font-medium text-[#0a0a0a]">
              {titleHighlight}
            </span>
          )}
        </h1>
        <p
          ref={subRef}
          className="typing-sub max-w-[640px] text-lg text-[#4a4a4c] mb-7 min-h-[1.6em]"
        />
        <div
          className="flex flex-wrap gap-3 justify-center"
          style={{
            opacity: ctaVisible ? 1 : 0,
            transform: ctaVisible ? "translateY(0)" : "translateY(10px)",
            transition: "opacity .5s ease, transform .5s ease",
            pointerEvents: ctaVisible ? "auto" : "none",
          }}
        >
          {children}
        </div>
      </section>
    </>
  );
}
