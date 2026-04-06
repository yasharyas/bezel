"use client";
import { useEffect, useRef } from "react";

type Props = {
  label?: string;
  index?: string;
  total?: string;
};

export function ElasticLineDivider({ label = "", index = "01/", total = "/04" }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const NUM = 80;
    const points: { x: number; y: number; vy: number; ay: number }[] = [];
    let W = 0, H = 0;

    const resize = () => {
      const rect = svg.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      for (let i = 0; i < NUM; i++) {
        points[i] = { x: (i / (NUM - 1)) * W, y: H / 2, vy: 0, ay: 0 };
      }
    };

    const getPath = () => {
      if (!points.length) return "";
      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < NUM - 1; i++) {
        const mx = (points[i].x + points[i + 1].x) / 2;
        const my = (points[i].y + points[i + 1].y) / 2;
        d += ` Q ${points[i].x} ${points[i].y} ${mx} ${my}`;
      }
      d += ` L ${points[NUM - 1].x} ${points[NUM - 1].y}`;
      return d;
    };

    const pathEl = svg.querySelector<SVGPathElement>(".yui-elastic-path");
    let mouseY = 0, mouseX = 0, hovering = false;

    const onMove = (e: MouseEvent) => {
      const rect = svg.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const SPRING = 0.12, DAMPING = 0.7, SPREAD = 80;

    const tick = () => {
      const cy = H / 2;
      for (let i = 0; i < NUM; i++) {
        const p = points[i];
        const dist = Math.abs(p.x - mouseX);
        const influence = hovering ? Math.max(0, 1 - dist / SPREAD) : 0;
        const target = hovering ? cy + (mouseY - cy) * influence : cy;
        p.ay = (target - p.y) * SPRING;
        p.vy = p.vy * DAMPING + p.ay;
        p.y += p.vy;
      }
      if (pathEl) pathEl.setAttribute("d", getPath());
      raf.current = requestAnimationFrame(tick);
    };

    const onEnter = () => { hovering = true; };
    const onLeave = () => { hovering = false; };

    resize();
    window.addEventListener("resize", resize);
    svg.addEventListener("mousemove", onMove);
    svg.addEventListener("mouseenter", onEnter);
    svg.addEventListener("mouseleave", onLeave);
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      svg.removeEventListener("mousemove", onMove);
      svg.removeEventListener("mouseenter", onEnter);
      svg.removeEventListener("mouseleave", onLeave);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <>
      <style>{`
        .yui-elastic-wrap { width: 100%; padding: 0 0; margin: 2rem 0; position: relative; }
        .yui-elastic-svg { display: block; width: 100%; height: 60px; cursor: crosshair; }
        .yui-elastic-path { fill: none; stroke: currentColor; stroke-width: 1.5; opacity: 0.6; }
        .yui-elastic-meta {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 0.8rem; opacity: 0.5; margin-top: 0.25rem; text-transform: uppercase; letter-spacing: 0.05em;
        }
      `}</style>
      <div className="yui-elastic-wrap">
        <svg ref={svgRef} className="yui-elastic-svg">
          <path className="yui-elastic-path" d="" />
        </svg>
        <div className="yui-elastic-meta">
          <span>{index}</span>
          {label && <span>{label}</span>}
          <span>{total}</span>
        </div>
      </div>
    </>
  );
}
