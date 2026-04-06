"use client";
import { useRef } from "react";
import gsap from "gsap";

const SCATTER = [
  { x: -0.8, y: -0.6, rz: -29 }, { x: -0.2, y: -0.4, rz: -6 },
  { x: -0.5, y: 0.3, rz: -14 }, { x: 0.3, y: -0.5, rz: 10 },
  { x: 0.6, y: 0.4, rz: 18 }, { x: -0.4, y: 0.7, rz: -22 },
  { x: 0.1, y: -0.8, rz: 5 }, { x: 0.8, y: 0.6, rz: 20 },
];

type Props = {
  label: string;
  href: string;
  target?: string;
  rel?: string;
  className?: string;
};

export function TextDisperseLink({ label, href, target, rel, className = "" }: Props) {
  const linkRef = useRef<HTMLAnchorElement>(null);

  const scatter = () => {
    const chars = linkRef.current?.querySelectorAll<HTMLElement>(".yui-dchar");
    if (!chars) return;
    chars.forEach((ch, i) => {
      const s = SCATTER[i % SCATTER.length];
      const em = parseFloat(getComputedStyle(ch).fontSize) || 16;
      gsap.to(ch, {
        x: s.x * em,
        y: s.y * em,
        rotateZ: s.rz,
        duration: 0.4,
        ease: "power3.out",
      });
    });
  };

  const gather = () => {
    const chars = linkRef.current?.querySelectorAll<HTMLElement>(".yui-dchar");
    if (!chars) return;
    gsap.to(Array.from(chars), {
      x: 0, y: 0, rotateZ: 0,
      duration: 0.5, ease: "power3.out", stagger: 0.015,
    });
  };

  return (
    <>
      <style>{`
        .yui-disperse-link {
          display: inline-flex; gap: 0; cursor: pointer;
          text-decoration: none; font-weight: 500; text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .yui-dchar { display: inline-block; will-change: transform; }
      `}</style>
      <a
        ref={linkRef}
        href={href}
        target={target}
        rel={rel}
        className={["yui-disperse-link", className].filter(Boolean).join(" ")}
        onMouseEnter={scatter}
        onMouseLeave={gather}
      >
        {label.split("").map((ch, i) => (
          <span key={i} className="yui-dchar">{ch === " " ? "\u00A0" : ch}</span>
        ))}
      </a>
    </>
  );
}
