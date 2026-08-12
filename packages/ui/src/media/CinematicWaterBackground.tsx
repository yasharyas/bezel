"use client";

import { useId, useMemo, type CSSProperties } from "react";

type Bubble = {
  x: string;
  s: string;
  dur: string;
  dly: string;
  drift: string;
};

type CinematicWaterBackgroundProps = {
  scene?: 1 | 2 | 3 | 4; // scroll-depth tier — lowers water opacity as scene rises
  className?: string;
  bubbleCount?: number;
};

function makeBubbles(count: number, seed: number): Bubble[] {
  const out: Bubble[] = [];
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = 0; i < count; i++) {
    out.push({
      x: `${(rand() * 100).toFixed(1)}%`,
      s: `${(3.2 + rand() * 6).toFixed(1)}px`,
      dur: `${(14 + rand() * 14).toFixed(1)}s`,
      dly: `${(rand() * 20).toFixed(1)}s`,
      drift: `${(rand() * 80 - 40).toFixed(0)}px`,
    });
  }
  return out;
}

function WaveLayer({
  uid,
  suffix,
  filterScale,
  baseFrequency,
  paths,
  opacity,
  className,
}: {
  uid: string;
  suffix: string;
  filterScale: number;
  baseFrequency: string;
  paths: Array<{ d: string; w: number; o: number }>;
  opacity: number;
  className: string;
}) {
  const gid = `${uid}-cg-${suffix}`;
  const fid = `${uid}-wf-${suffix}`;
  return (
    <div className={className} style={{ opacity }}>
      <svg className="cw__sv" viewBox="0 0 1800 1100" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#eafff4" stopOpacity="0" />
            <stop offset="0.18" stopColor="#f2fff8" stopOpacity="0.95" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="0.82" stopColor="#e6fbef" stopOpacity="0.9" />
            <stop offset="1" stopColor="#eafff4" stopOpacity="0" />
          </linearGradient>
          <filter id={fid} x="-12%" y="-12%" width="124%" height="124%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency={baseFrequency} numOctaves="3" seed="21" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={filterScale} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g filter={`url(#${fid})`}>
          {paths.map((p, i) => (
            <path
              key={i}
              d={p.d}
              stroke={`url(#${gid})`}
              strokeWidth={p.w}
              fill="none"
              opacity={p.o}
              strokeLinecap="round"
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

const WAVE_A: Array<{ d: string; w: number; o: number }> = [
  { d: "M100 220 Q400 280 700 240 Q1000 200 1300 250 Q1600 300 1900 240", w: 4.2, o: 0.4 },
  { d: "M-50 480 Q250 520 550 490 Q850 450 1150 500 Q1450 560 1750 510 Q2050 460 2350 500", w: 5.5, o: 0.32 },
  { d: "M80 720 Q380 760 680 730 Q980 690 1280 740 Q1580 800 1880 750", w: 3.8, o: 0.28 },
  { d: "M40 960 Q340 1000 640 970 Q940 930 1240 980 Q1540 1030 1840 990", w: 6.1, o: 0.35 },
  { d: "M200 340 Q500 300 800 350 Q1100 400 1400 360 Q1700 310 2000 350", w: 2.4, o: 0.45 },
  { d: "M-100 600 Q200 640 500 610 Q800 570 1100 620 Q1400 680 1700 630", w: 5.0, o: 0.22 },
];

const WAVE_B: Array<{ d: string; w: number; o: number }> = [
  { d: "M60 180 Q320 210 580 190 Q840 160 1100 200 Q1360 240 1620 200", w: 2.2, o: 0.22 },
  { d: "M-80 560 Q180 540 440 570 Q700 610 960 580 Q1220 540 1480 570", w: 1.6, o: 0.28 },
  { d: "M120 860 Q380 840 640 870 Q900 910 1160 880 Q1420 840 1680 870", w: 2.8, o: 0.2 },
  { d: "M40 400 Q300 430 560 410 Q820 380 1080 420 Q1340 460 1600 430", w: 1.4, o: 0.18 },
  { d: "M200 1040 Q460 1020 720 1050 Q980 1090 1240 1060 Q1500 1020 1760 1050", w: 2.0, o: 0.16 },
];

export function CinematicWaterBackground({
  scene = 1,
  className = "",
  bubbleCount = 16,
}: CinematicWaterBackgroundProps) {
  const uid = useId().replace(/:/g, "");
  const bubbles = useMemo(() => makeBubbles(bubbleCount, 42), [bubbleCount]);
  const sg = `${uid}-sg`;
  const sf = `${uid}-sf`;
  const sfw = `${uid}-sfw`;

  return (
    <>
      <style>{`
        .cw {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          isolation: isolate;
        }
        .cw__scene {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 1.5s ease;
        }
        .cw__scene--on { opacity: 1; }
        .cw__s1 { background: linear-gradient(178deg, #1ea38d 0%, #0b8578 22%, #017069 48%, #4b3a8f 74%, #01524e 100%); }
        .cw__s2 { background: linear-gradient(178deg, #12907f 0%, #04756e 26%, #4b3a8f 58%, #01514d 100%); }
        .cw__s3 { background: linear-gradient(178deg, #067c71 0%, #00625d 30%, #014e4a 64%, #023c39 100%); }
        .cw__s4 { background: linear-gradient(178deg, #036359 0%, #014b46 32%, #013431 66%, #012422 100%); }
        .cw__water {
          position: absolute;
          inset: -14% -10%;
          transition: opacity 1.2s ease;
        }
        .cw[data-d="1"] .cw__water { opacity: 1; }
        .cw[data-d="2"] .cw__water { opacity: 0.8; }
        .cw[data-d="3"] .cw__water { opacity: 0.58; }
        .cw[data-d="4"] .cw__water { opacity: 0.34; }
        .cw[data-d="1"] .cw__surface { opacity: 0.7; }
        .cw[data-d="2"] .cw__surface,
        .cw[data-d="3"] .cw__surface,
        .cw[data-d="4"] .cw__surface { opacity: 0; }
        .cw__layer {
          position: absolute;
          inset: 0;
          mix-blend-mode: screen;
          will-change: transform;
        }
        .cw__sv { width: 100%; height: 100%; display: block; }
        .cw__a { animation: cw-drift-a 34s linear infinite; }
        .cw__b { animation: cw-drift-b 23s linear infinite; }
        .cw__shafts {
          position: absolute;
          inset: 0;
          mix-blend-mode: screen;
          animation: cw-shaft 19s ease-in-out infinite;
        }
        .cw__surface {
          position: absolute;
          inset: 0;
          mix-blend-mode: screen;
          transform-origin: 50% 0;
          animation: cw-surface 11s ease-in-out infinite;
        }
        .cw__bub { position: absolute; inset: 0; overflow: hidden; }
        .cw__bub span {
          position: absolute;
          bottom: -6%;
          left: var(--x);
          width: var(--s);
          height: var(--s);
          border-radius: 50%;
          border: 1px solid rgba(230, 255, 242, 0.5);
          background: radial-gradient(circle at 34% 30%, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0) 62%);
          animation: cw-rise var(--dur) linear infinite;
          animation-delay: var(--dly);
          opacity: 0;
        }
        .cw__vig {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(126% 86% at 50% 28%, transparent 38%, rgba(1, 50, 46, 0.2) 78%, rgba(1, 34, 32, 0.44) 100%),
            linear-gradient(180deg, rgba(1, 38, 36, 0.3) 0%, transparent 18%, transparent 66%, rgba(1, 32, 30, 0.4) 100%);
        }
        @keyframes cw-drift-a {
          0% { transform: translate3d(-3%, 0, 0) scale(1.06); }
          50% { transform: translate3d(3%, -1.6%, 0) scale(1.13); }
          100% { transform: translate3d(-3%, 0, 0) scale(1.06); }
        }
        @keyframes cw-drift-b {
          0% { transform: translate3d(4%, 1%, 0) scale(1.1); }
          50% { transform: translate3d(-4%, -1%, 0) scale(1.04); }
          100% { transform: translate3d(4%, 1%, 0) scale(1.1); }
        }
        @keyframes cw-shaft {
          0% { transform: translate3d(-2%, 0, 0) skewX(0deg); opacity: 0.34; }
          50% { transform: translate3d(2%, 0, 0) skewX(2.4deg); opacity: 0.6; }
          100% { transform: translate3d(-2%, 0, 0) skewX(0deg); opacity: 0.34; }
        }
        @keyframes cw-surface {
          0% { transform: translateY(0) scaleY(1); opacity: 0.55; }
          50% { transform: translateY(-1.4%) scaleY(1.14); opacity: 0.82; }
          100% { transform: translateY(0) scaleY(1); opacity: 0.55; }
        }
        @keyframes cw-rise {
          0% { transform: translate3d(0, 0, 0); opacity: 0; }
          12% { opacity: 0.7; }
          88% { opacity: 0.5; }
          100% { transform: translate3d(var(--drift), -116vh, 0); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cw__a, .cw__b, .cw__shafts, .cw__surface, .cw__bub span { animation: none !important; }
          .cw__bub { display: none; }
        }
      `}</style>
      <div className={`cw ${className}`.trim()} data-d={String(scene)} aria-hidden>
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`cw__scene cw__s${n}${scene === n ? " cw__scene--on" : ""}`}
          />
        ))}
        <div className="cw__water">
          <WaveLayer
            uid={uid}
            suffix="a"
            filterScale={72}
            baseFrequency="0.0022 0.019"
            paths={WAVE_A}
            opacity={0.8}
            className="cw__layer cw__a"
          />
          <WaveLayer
            uid={uid}
            suffix="b"
            filterScale={46}
            baseFrequency="0.005 0.031"
            paths={WAVE_B}
            opacity={0.54}
            className="cw__layer cw__b"
          />
          <div className="cw__shafts">
            <svg className="cw__sv" viewBox="0 0 1800 1100" preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id={sg} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#f4fff9" stopOpacity="0.85" />
                  <stop offset="0.38" stopColor="#dcf6e7" stopOpacity="0.28" />
                  <stop offset="1" stopColor="#d4f2e2" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points="95,-80 152,-80 517,1180 439,1180" fill={`url(#${sg})`} opacity="0.26" />
              <polygon points="433,-80 491,-80 885,1180 807,1180" fill={`url(#${sg})`} opacity="0.41" />
              <polygon points="751,-80 919,-80 1180,1180 953,1180" fill={`url(#${sg})`} opacity="0.31" />
              <polygon points="1048,-80 1135,-80 1400,1180 1282,1180" fill={`url(#${sg})`} opacity="0.28" />
              <polygon points="1366,-80 1520,-80 1898,1180 1690,1180" fill={`url(#${sg})`} opacity="0.28" />
            </svg>
          </div>
          <div className="cw__surface">
            <svg className="cw__sv" viewBox="0 0 1800 1100" preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id={sf} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
                  <stop offset="0.55" stopColor="#e8fff2" stopOpacity="0.16" />
                  <stop offset="1" stopColor="#e8fff2" stopOpacity="0" />
                </linearGradient>
                <filter id={sfw} x="-10%" y="-40%" width="120%" height="180%" colorInterpolationFilters="sRGB">
                  <feTurbulence type="fractalNoise" baseFrequency="0.004 0.05" numOctaves="2" seed="9" result="n" />
                  <feDisplacementMap in="SourceGraphic" in2="n" scale="30" xChannelSelector="R" yChannelSelector="G" />
                </filter>
              </defs>
              <g filter={`url(#${sfw})`}>
                <rect x="-100" y="-40" width="2000" height="150" fill={`url(#${sf})`} />
                <rect x="-100" y="60" width="2000" height="60" fill={`url(#${sf})`} opacity="0.5" />
              </g>
            </svg>
          </div>
          <div className="cw__bub">
            {bubbles.map((b, i) => (
              <span
                key={i}
                style={
                  {
                    "--x": b.x,
                    "--s": b.s,
                    "--dur": b.dur,
                    "--dly": b.dly,
                    "--drift": b.drift,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        </div>
        <div className="cw__vig" />
      </div>
    </>
  );
}
