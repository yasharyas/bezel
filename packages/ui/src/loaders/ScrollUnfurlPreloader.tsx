"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";

type ScrollUnfurlPreloaderProps = {
  brand?: string;
  /** Fires when the overlay finishes and should hand off to the page */
  onComplete?: () => void;
  /** Play once per tab session (sessionStorage key) */
  onceKey?: string | null;
  durationMs?: number;
};

const useIsoLayout = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function LotusMark({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 44" fill="none" className={className} style={style} aria-hidden>
      <g stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none">
        <path d="M32 8 C28 18 28 28 32 36 C36 28 36 18 32 8 Z" fill="currentColor" fillOpacity="0.14" />
        <path d="M32 36 C24 30 20 22 20 14 C26 18 30 26 32 36 Z" fill="currentColor" fillOpacity="0.08" />
        <path d="M32 36 C40 30 44 22 44 14 C38 18 34 26 32 36 Z" fill="currentColor" fillOpacity="0.08" />
        <path d="M32 36 C20 36 12 30 8 22 C18 24 26 30 32 36 Z" />
        <path d="M32 36 C44 36 52 30 56 22 C46 24 38 30 32 36 Z" />
        <path d="M14 38 H50" opacity="0.6" />
      </g>
    </svg>
  );
}

function FiligreeDivider({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 24" fill="none" className={className} style={style} aria-hidden>
      <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none">
        <line x1="6" y1="12" x2="74" y2="12" />
        <line x1="126" y1="12" x2="194" y2="12" />
        <circle cx="80" cy="12" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="120" cy="12" r="1.6" fill="currentColor" stroke="none" />
        <path d="M100 3 L108 12 L100 21 L92 12 Z" fill="currentColor" fillOpacity="0.12" />
        <path d="M100 6.5 L104.5 12 L100 17.5 L95.5 12 Z" />
      </g>
    </svg>
  );
}

function BrassRod() {
  return (
    <div className="relative h-full w-full">
      <div
        className="absolute left-0 right-0"
        style={{
          top: 10,
          bottom: 10,
          borderRadius: 999,
          background:
            "linear-gradient(90deg, #5e4310 0%, #9c7720 26%, #e8d5a3 50%, #9c7720 74%, #4d370c 100%)",
          boxShadow: "0 0 14px rgba(201,162,39,0.4)",
        }}
      />
      {[true, false].map((isTop) => (
        <div
          key={isTop ? "t" : "b"}
          className="absolute left-1/2"
          style={{
            [isTop ? "top" : "bottom"]: -2,
            transform: "translateX(-50%)",
            width: 16,
            height: 16,
            borderRadius: "50% 50% 45% 45% / 55% 55% 45% 45%",
            background: "radial-gradient(circle at 36% 30%, #e8d5a3, #c9a227 52%, #5e4310 100%)",
            boxShadow: "0 0 12px rgba(201,162,39,0.45)",
          }}
        />
      ))}
    </div>
  );
}

/**
 * Full-screen parchment scroll preloader: brass rods travel outward while
 * clip-path unfurls the parchment from the centre, then content staggers in
 * and the stage lifts/blurs away.
 */
export function ScrollUnfurlPreloader({
  brand = "Paigam",
  onComplete,
  onceKey = "scroll-unfurl-seen",
  durationMs = 2200,
}: ScrollUnfurlPreloaderProps) {
  const [visible, setVisible] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const parchmentRef = useRef<HTMLDivElement>(null);
  const leftRodRef = useRef<HTMLDivElement>(null);
  const rightRodRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useIsoLayout(() => {
    if (!onceKey) return;
    try {
      if (window.sessionStorage.getItem(onceKey)) setVisible(false);
      else window.sessionStorage.setItem(onceKey, "1");
    } catch {
      /* private mode — always play */
    }
  }, [onceKey]);

  useEffect(() => {
    if (!visible) return;
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      document.body.style.overflow = prevOverflow;
      onComplete?.();
      setVisible(false);
    };

    const safety = window.setTimeout(finish, durationMs + 1500);
    const mm = gsap.matchMedia();

    mm.add(
      {
        full: "(prefers-reduced-motion: no-preference)",
        reduced: "(prefers-reduced-motion: reduce)",
      },
      (ctx) => {
        const { reduced } = ctx.conditions as { reduced: boolean };
        const travel = stage.offsetWidth / 2;
        const reveals = contentRef.current ? Array.from(contentRef.current.children) : [];

        if (reduced) {
          gsap.set(parchmentRef.current, { "--reveal": "0%" });
          gsap.set(leftRodRef.current, { x: -travel });
          gsap.set(rightRodRef.current, { x: travel });
          gsap.set([glowRef.current, ...reveals], { autoAlpha: 1 });
          gsap.to(root, { autoAlpha: 0, duration: 0.5, delay: 0.7, onComplete: finish });
          return;
        }

        const tl = gsap.timeline({ defaults: { ease: "power3.out" }, onComplete: finish });
        tl.from(root, { autoAlpha: 0, duration: 0.3 })
          .to(glowRef.current, { autoAlpha: 1, duration: 0.55 }, 0)
          .to(parchmentRef.current, { "--reveal": "0%", duration: 0.86, ease: "expo.out" }, 0.26)
          .to(leftRodRef.current, { x: -travel, duration: 0.86, ease: "expo.out" }, 0.26)
          .to(rightRodRef.current, { x: travel, duration: 0.86, ease: "expo.out" }, 0.26)
          .to(reveals, { autoAlpha: 1, y: 0, duration: 0.53, stagger: 0.1, ease: "power2.out" }, 0.86)
          .to(
            stageRef.current,
            { y: -26, scale: 1.03, autoAlpha: 0, filter: "blur(7px)", duration: 0.53, ease: "power3.in" },
            1.65,
          )
          .to(root, { autoAlpha: 0, duration: 0.41, ease: "power2.in" }, 1.76);
      },
    );

    return () => {
      window.clearTimeout(safety);
      mm.revert();
      document.body.style.overflow = prevOverflow;
    };
  }, [visible, onComplete, durationMs]);

  if (!visible) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      aria-hidden
      style={{
        background: "radial-gradient(ellipse at 50% 45%, #1a1310 0%, #0d0a09 62%)",
        color: "#f5f0e8",
      }}
    >
      <style>{`
        @keyframes unfurl-dust {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.2; }
          50% { transform: translateY(-14px) translateX(6px); opacity: 0.7; }
        }
        @keyframes unfurl-glow-pulse {
          0%, 100% { opacity: 0.32; transform: scale(0.96); }
          50% { opacity: 0.55; transform: scale(1.04); }
        }
        @media (prefers-reduced-motion: reduce) {
          .unfurl-dust, .unfurl-glow { animation: none !important; }
        }
      `}</style>

      <div
        ref={glowRef}
        className="unfurl-glow pointer-events-none absolute left-1/2 top-1/2"
        style={{
          opacity: 0,
          width: "min(120vw, 1100px)",
          height: "min(120vw, 1100px)",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(201,162,39,0.18) 0%, rgba(201,162,39,0.05) 32%, transparent 62%)",
          animation: "unfurl-glow-pulse 4s ease-in-out infinite",
        }}
      />

      {[
        { left: "8%", top: "16%", size: 4, delay: 0, dur: 7 },
        { left: "44%", top: "30%", size: 5, delay: 0.7, dur: 8 },
        { left: "78%", top: "22%", size: 4, delay: 1.1, dur: 7.5 },
        { left: "90%", top: "54%", size: 3, delay: 0.4, dur: 8.5 },
      ].map((s, i) => (
        <span
          key={i}
          className="unfurl-dust pointer-events-none absolute rounded-full"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            background: "#c9a227",
            opacity: 0.4,
            animation: `unfurl-dust ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}

      <div
        ref={stageRef}
        className="relative"
        style={{
          width: "min(90vw, 640px)",
          height: "clamp(300px, 50vh, 440px)",
          willChange: "transform, filter, opacity",
        }}
      >
        <div
          ref={parchmentRef}
          className="absolute inset-0 flex items-center justify-center"
          style={
            {
              ["--reveal" as string]: "50%",
              clipPath: "inset(0 var(--reveal) 0 var(--reveal) round 7px)",
              background: "linear-gradient(177deg, #faf6ee 0%, #f5f0e8 46%, #e9dfcc 100%)",
              boxShadow:
                "inset 0 0 70px rgba(120,86,30,0.16), inset 22px 0 26px -20px rgba(70,44,12,0.5), inset -22px 0 26px -20px rgba(70,44,12,0.5), 0 30px 70px rgba(0,0,0,0.55)",
            } as React.CSSProperties
          }
        >
          <div
            className="pointer-events-none absolute"
            style={{
              inset: "clamp(16px, 3.2vw, 30px)",
              border: "1px solid color-mix(in oklab, #c9a227 48%, transparent)",
              borderRadius: 3,
            }}
          />
          <div
            ref={contentRef}
            className="relative flex flex-col items-center justify-center gap-4 px-8 text-center"
            style={{ color: "#c9a227" }}
          >
            <LotusMark style={{ opacity: 0, transform: "translateY(14px)" }} className="h-9 w-auto" />
            <span
              style={{
                opacity: 0,
                transform: "translateY(14px)",
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "clamp(2.6rem, 8.5vw, 4.75rem)",
                lineHeight: 1,
                letterSpacing: "0.015em",
                color: "#e8d5a3",
                textShadow:
                  "0 1px 0 #6f5316, 0 2px 1px rgba(60,38,8,0.55), 0 0 22px rgba(201,162,39,0.28)",
              }}
            >
              {brand}
            </span>
            <FiligreeDivider
              style={{ opacity: 0, transform: "translateY(14px)" }}
              className="h-5 w-[min(60%,240px)]"
            />
          </div>
        </div>

        <div
          ref={leftRodRef}
          className="absolute top-[-4%] h-[108%]"
          style={{ left: "50%", marginLeft: -5, width: 10 }}
        >
          <BrassRod />
        </div>
        <div
          ref={rightRodRef}
          className="absolute top-[-4%] h-[108%]"
          style={{ left: "50%", marginLeft: -5, width: 10 }}
        >
          <BrassRod />
        </div>
      </div>
    </div>
  );
}
