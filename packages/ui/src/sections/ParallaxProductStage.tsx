"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef, useState, type ReactNode } from "react";

type StageItem = {
  id: string;
  label: string;
  /** Consumer-supplied media; use a gradient placeholder if omitted */
  media?: ReactNode;
  rotate?: number;
};

type ParallaxProductStageProps = {
  items: StageItem[]; // ideally 3
  note?: string;
  jobs?: string[];
  tagLabel?: string;
  tagValue?: string;
  tagMeta?: string;
  className?: string;
};

export function ParallaxProductStage({
  items,
  note = "Three jobs. One flat-price box.",
  jobs = ["Hard water", "Kitchen grease", "Everyday floors"],
  tagLabel = "Any 3 box",
  tagValue = "₹499",
  tagMeta = "save ₹398",
  className = "",
}: ParallaxProductStageProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduce(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useGSAP(
    () => {
      if (reduce || !rootRef.current) return;

      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      timeline
        .from(".pps__bottle", {
          y: 46,
          opacity: 0,
          rotate: (index: number) => items[index]?.rotate ?? [-7, 3, 8][index] ?? 0,
          duration: 0.85,
          stagger: 0.09,
        })
        .from(
          ".pps__path",
          { scaleX: 0, transformOrigin: "left center", duration: 0.7 },
          "-=0.55",
        );

      const stage = rootRef.current.querySelector<HTMLElement>(".pps__stage");
      const products = [
        ...(stage?.querySelectorAll<HTMLElement>(".pps__media") ?? []),
      ];
      if (
        !stage ||
        !products.length ||
        !window.matchMedia("(hover: hover) and (pointer: fine)").matches
      ) {
        return;
      }

      const xSetters = products.map((product) =>
        gsap.quickTo(product, "x", { duration: 0.45, ease: "power3.out" }),
      );
      const ySetters = products.map((product) =>
        gsap.quickTo(product, "y", { duration: 0.45, ease: "power3.out" }),
      );
      const depths = [9, 15, 7];
      const move = (event: PointerEvent) => {
        const rect = stage.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        products.forEach((_, index) => {
          const depth = depths[index] ?? 8;
          xSetters[index](x * depth);
          ySetters[index](y * depth * 0.55);
        });
      };
      const settle = () => {
        xSetters.forEach((set) => set(0));
        ySetters.forEach((set) => set(0));
      };
      stage.addEventListener("pointermove", move, { passive: true });
      stage.addEventListener("pointerleave", settle);
      return () => {
        stage.removeEventListener("pointermove", move);
        stage.removeEventListener("pointerleave", settle);
      };
    },
    { scope: rootRef, dependencies: [reduce, items] },
  );

  return (
    <>
      <style>{`
        .pps {
          position: relative;
          min-height: 420px;
          border-radius: 1.5rem;
          overflow: hidden;
          background: linear-gradient(160deg, #0d4f43, #073b34 55%, #4b3a8f);
          color: #effaf4;
        }
        .pps__glow {
          position: absolute;
          inset: 8% 10% 28%;
          border: 1px solid rgba(239, 250, 244, 0.14);
          border-radius: 50%;
          pointer-events: none;
        }
        .pps__stage {
          position: relative;
          height: 100%;
          min-height: 420px;
          padding: 2rem 1.25rem 5rem;
        }
        .pps__note {
          position: absolute;
          top: 7%;
          right: 6%;
          max-width: 13ch;
          margin: 0;
          font-size: 1.15rem;
          font-style: italic;
          line-height: 1.2;
        }
        .pps__group {
          position: absolute;
          left: 12%;
          right: 12%;
          top: 16%;
          bottom: 28%;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          align-items: end;
          gap: 0.5rem;
        }
        .pps__bottle {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          height: 100%;
        }
        .pps__bottle:nth-child(1) { transform: rotate(-6deg); }
        .pps__bottle:nth-child(2) { z-index: 2; height: 108%; }
        .pps__bottle:nth-child(3) { transform: rotate(5deg); }
        .pps__media {
          width: 100%;
          aspect-ratio: 3 / 5;
          border-radius: 1rem 1rem 0.75rem 0.75rem;
          background: linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.06));
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow: 0 18px 40px rgba(0, 18, 16, 0.35);
          overflow: hidden;
        }
        .pps__media > * { width: 100%; height: 100%; object-fit: cover; display: block; }
        .pps__shelf {
          position: absolute;
          left: 10%;
          right: 10%;
          bottom: 18%;
          height: 18px;
          pointer-events: none;
        }
        .pps__shelf-plate {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: linear-gradient(180deg, #d8c4a0 0%, #b89563 48%, #8f6d3d 100%);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.35), 0 10px 18px rgba(0,18,16,0.28);
        }
        .pps__shelf-shadow {
          position: absolute;
          left: 4%;
          right: 4%;
          bottom: -16px;
          height: 22px;
          border-radius: 50%;
          background: rgba(0, 18, 16, 0.38);
          filter: blur(10px);
        }
        .pps__jobs {
          position: absolute;
          left: 11%;
          right: 11%;
          bottom: 8.5%;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .pps__jobs span {
          border-top: 1px solid rgba(239, 250, 244, 0.35);
          padding-top: 7px;
          font-size: 0.68rem;
          font-weight: 720;
          letter-spacing: 0.08em;
          text-align: center;
          opacity: 0.86;
        }
        .pps__path {
          position: absolute;
          left: 14%;
          right: 14%;
          bottom: 7.2%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #c9761d 12%, #c9761d 88%, transparent);
          transform-origin: left center;
        }
        .pps__path::after {
          content: "";
          position: absolute;
          right: 0;
          top: -5px;
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: #c9761d;
        }
        .pps__tag {
          position: absolute;
          left: 5%;
          bottom: 22%;
          display: grid;
          gap: 2px;
          min-width: 118px;
          padding: 10px 12px;
          border: 1px solid rgba(239, 250, 244, 0.22);
          border-radius: 14px;
          background: rgba(7, 59, 52, 0.55);
          backdrop-filter: blur(10px);
        }
        .pps__tag span {
          color: #c9761d;
          font-size: 0.68rem;
          font-weight: 780;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .pps__tag strong {
          font-size: 1.55rem;
          font-weight: 780;
          letter-spacing: -0.02em;
        }
        .pps__tag small { opacity: 0.7; font-size: 0.75rem; }
      `}</style>
      <div ref={rootRef} className={`pps ${className}`.trim()}>
        <div className="pps__stage" aria-label="Product stage">
          <div className="pps__glow" aria-hidden />
          <p className="pps__note">{note}</p>
          <div className="pps__group">
            {items.slice(0, 3).map((item) => (
              <div className="pps__bottle" key={item.id}>
                <div className="pps__media" aria-label={item.label}>
                  {item.media ?? null}
                </div>
              </div>
            ))}
          </div>
          <div className="pps__shelf" aria-hidden>
            <span className="pps__shelf-plate" />
            <span className="pps__shelf-shadow" />
          </div>
          <div className="pps__jobs" aria-hidden>
            {jobs.slice(0, 3).map((job) => (
              <span key={job}>{job}</span>
            ))}
          </div>
          <div className="pps__path" aria-hidden />
          <div className="pps__tag">
            <span>{tagLabel}</span>
            <strong>{tagValue}</strong>
            {tagMeta ? <small>{tagMeta}</small> : null}
          </div>
        </div>
      </div>
    </>
  );
}
