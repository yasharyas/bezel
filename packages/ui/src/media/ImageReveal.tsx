"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  src: string;
  alt?: string;
  className?: string;
  borderRadius?: string;
  aspectRatio?: string;
};

export function ImageReveal({
  src,
  alt = "",
  className = "",
  borderRadius = "4rem",
  aspectRatio = "3/2",
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const img = wrap.querySelector<HTMLImageElement>("img");
    if (!img) return;

    gsap.set(wrap, { clipPath: "inset(100% 0 0 0)", borderRadius });
    gsap.set(img, { scale: 1.4 });

    const trig = ScrollTrigger.create({
      trigger: wrap,
      start: "top 85%",
      end: "bottom 15%",
      onEnter: () =>
        gsap.to([wrap, img], {
          clipPath: "inset(0% 0 0 0)",
          scale: 1,
          duration: 1.2,
          ease: "power3.out",
          stagger: 0,
        }),
      onLeaveBack: () =>
        gsap.to([wrap, img], {
          clipPath: "inset(100% 0 0 0)",
          scale: 1.4,
          duration: 0.8,
          ease: "power3.in",
        }),
    });

    return () => { trig.kill(); };
  }, [borderRadius]);

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{ overflow: "hidden", aspectRatio, borderRadius, width: "100%" }}
    >
      <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    </div>
  );
}
