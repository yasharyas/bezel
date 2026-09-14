"use client";

import { useEffect } from "react";
import { SidewaysScroll } from "bezel-ui/sections/SidewaysScroll";
import { usePreviewEnv } from "../kit";

const WORK = [
  { title: "Field notes", kind: "Editorial app", year: "2026", tint: "#f7f3ee", ink: "#912c22" },
  { title: "Tide tables", kind: "Data site", year: "2025", tint: "#e8eef5", ink: "#1f3b5a" },
  { title: "Kiln", kind: "Studio identity", year: "2025", tint: "#f3ece4", ink: "#6b3f17" },
  { title: "Northbound", kind: "Travel guide", year: "2024", tint: "#e9f1ec", ink: "#1f5a3c" },
  { title: "Loom", kind: "Pattern library", year: "2024", tint: "#efeaf4", ink: "#4a2f63" },
  { title: "Harbour", kind: "Booking flow", year: "2023", tint: "#f4efe6", ink: "#5a4515" },
];

const ring =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]";

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Scroll the frame down through the pan and back while nobody is using it. */
function useIdleScroll() {
  const { engaged, reducedMotion } = usePreviewEnv();
  useEffect(() => {
    if (engaged || reducedMotion) return;
    let raf = 0;
    const began = performance.now();
    const cycle = 11000;
    const step = (now: number) => {
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const t = ((now - began) % cycle) / 1000;
      let y = 0;
      if (t < 1) y = 0;
      else if (t < 8) y = max * ease((t - 1) / 7);
      else if (t < 9.5) y = max;
      else y = max * (1 - ease((t - 9.5) / 1.5));
      if (document.visibilityState === "visible") window.scrollTo(0, y);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [engaged, reducedMotion]);
}

export default function SidewaysScrollPreview() {
  useIdleScroll();
  return (
    <main className="bg-[#fafafa] text-[#0a0a0a]">
      <div className="px-6 pb-10 pt-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#4a4a4c]">Studio</p>
        <p className="mt-2 max-w-md font-serif text-3xl leading-tight">Scroll down, and the row below moves across.</p>
      </div>

      <SidewaysScroll
        label="Selected projects"
        heading={
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#4a4a4c]">Selected work</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Six projects, one row</h2>
          </div>
        }
      >
        {WORK.map((project, i) => (
          <article
            key={project.title}
            className="flex h-[250px] w-[220px] flex-col justify-between rounded-2xl border border-black/[0.06] p-4"
            style={{ background: project.tint, color: project.ink }}
          >
            <span className="font-mono text-xs">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h3 className="text-xl font-semibold tracking-tight">{project.title}</h3>
              <p className="mt-1 text-sm">
                {project.kind} · {project.year}
              </p>
              <a href="#project" className={`mt-3 inline-flex h-12 items-center rounded-full border border-current px-4 text-sm font-semibold ${ring}`}>
                View project
              </a>
            </div>
          </article>
        ))}
      </SidewaysScroll>

      <div className="px-6 pb-24 pt-10">
        <p className="max-w-md text-[15px] leading-relaxed text-[#4a4a4c]">
          After the last card the row lets go, and the page carries on as normal.
        </p>
      </div>
    </main>
  );
}
