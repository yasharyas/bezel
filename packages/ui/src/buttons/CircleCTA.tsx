"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

type Props = {
  href: string;
  label?: string;
  size?: number;
  strokeColor?: string;
};

export function CircleCTA({ href, label = "view\nmore", size = 10, strokeColor = "#fff" }: Props) {
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const circle = el.querySelector<SVGCircleElement>(".yui-circle-draw");
    if (!circle) return;

    const r = parseFloat(circle.getAttribute("r") || "48");
    const circumference = 2 * Math.PI * r;

    gsap.set(circle, {
      strokeDasharray: circumference,
      strokeDashoffset: circumference,
    });

    const onEnter = () =>
      gsap.to(circle, { strokeDashoffset: 0, duration: 0.6, ease: "power3.out" });
    const onLeave = () =>
      gsap.to(circle, { strokeDashoffset: circumference, duration: 0.5, ease: "power3.in" });

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  const lines = label.split("\n");

  return (
    <>
      <style>{`
        .yui-circle-cta { position: relative; display: inline-block; }
        .yui-circle-cta a { display: flex; align-items: center; justify-content: center; position: relative; width: 100%; height: 100%; }
        .yui-circle-cta svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; transform: rotate(-90deg); }
        .yui-circle-draw { fill: none; stroke-width: 1; }
        .yui-circle-label {
          position: relative; z-index: 1; text-align: center; line-height: 1.2;
          font-size: 0.85rem; font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase;
          transition: opacity 0.3s;
        }
        .yui-circle-cta:hover .yui-circle-label { opacity: 0.7; }
      `}</style>
      <div
        ref={ctaRef}
        className="yui-circle-cta"
        style={{ width: `${size}rem`, height: `${size}rem` }}
      >
        <a href={href}>
          <svg viewBox="0 0 100 100">
            <circle className="yui-circle-draw" cx="50" cy="50" r="48" stroke={strokeColor} />
          </svg>
          <div className="yui-circle-label">
            {lines.map((line, i) => (
              <span key={i} style={{ display: "block" }}>{line}</span>
            ))}
          </div>
        </a>
      </div>
    </>
  );
}
