"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

type Props = {
  text: string;
  speed?: number;
  fontSize?: string;
  opacity?: number;
  separator?: string;
};

export function Marquee({ text, speed = 20, fontSize = "21rem", opacity = 0.08, separator = " \u2014\u00A0" }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Duplicate items until they fill > 2x the viewport width
    const fill = () => {
      const items = Array.from(track.children) as HTMLElement[];
      if (!items.length) return;
      const totalW = items.reduce((sum, el) => sum + el.offsetWidth, 0);
      const needed = Math.ceil((window.innerWidth * 3) / totalW) + 1;
      const template = items[0].cloneNode(true) as HTMLElement;
      while (track.children.length < needed * items.length) {
        track.appendChild(template.cloneNode(true));
      }
    };

    fill();

    const firstItem = track.children[0] as HTMLElement;
    const itemW = firstItem?.offsetWidth || 200;
    const duration = itemW / speed;

    const tween = gsap.to(track, {
      x: `-=${itemW}`,
      duration,
      ease: "none",
      repeat: -1,
      modifiers: {
        x: gsap.utils.unitize((x: string) => parseFloat(x) % itemW),
      },
    });

    return () => { tween.kill(); };
  }, [text, speed]);

  return (
    <>
      <style>{`
        .yui-marquee-root { overflow: hidden; pointer-events: none; margin: 3rem 0; width: 100%; }
        .yui-marquee-track { display: flex; white-space: nowrap; will-change: transform; }
        .yui-marquee-item {
          font-weight: 600; letter-spacing: -0.04em; text-transform: uppercase;
          flex-shrink: 0;
        }
      `}</style>
      <div className="yui-marquee-root">
        <div ref={trackRef} className="yui-marquee-track">
          <span className="yui-marquee-item" style={{ fontSize, opacity }}>
            {text}{separator}
          </span>
        </div>
      </div>
    </>
  );
}
