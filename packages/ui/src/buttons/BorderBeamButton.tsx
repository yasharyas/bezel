import { useEffect, useRef } from "react";

type Props = {
  label: string;
  variant?: "primary" | "ghost";
  onClick?: () => void;
  href?: string;
};

const beamStyle = `
  @keyframes border-beam-travel { to { offset-distance: 100%; } }
  .beam-btn { position: relative; isolation: isolate; overflow: hidden; }
  .beam-border {
    position: absolute; inset: 0; border-radius: inherit;
    pointer-events: none; z-index: 1; padding: 1px;
    background: rgba(255,255,255,0.09);
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
            mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor; mask-composite: exclude;
  }
  .beam-dot {
    position: absolute; width: 80px; aspect-ratio: 1;
    background: linear-gradient(to left, #ffaa40, #9c40ff, transparent);
    offset-path: rect(0 100% 100% 0 round 10px);
    offset-distance: 0%;
    animation: border-beam-travel 4s linear infinite;
  }
  @media (prefers-reduced-motion: reduce) { .beam-dot { animation: none; } }
`;

export function BorderBeamButton({ label, variant = "primary", onClick, href }: Props) {
  const ref = useRef<HTMLButtonElement & HTMLAnchorElement>(null);

  useEffect(() => {
    const btn = ref.current;
    if (!btn) return;
    const border = document.createElement("span");
    border.className = "beam-border";
    border.setAttribute("aria-hidden", "true");
    const dot = document.createElement("span");
    dot.className = "beam-dot";
    border.appendChild(dot);
    btn.appendChild(border);
    return () => border.remove();
  }, []);

  const base =
    "beam-btn inline-flex items-center justify-center px-5 py-[11px] rounded-[10px] text-sm font-medium tracking-[0.01em] border cursor-pointer transition-all duration-200 relative overflow-hidden no-underline";
  const primary = "bg-[#0a0a0a] text-[#fafafa] border-[#0a0a0a] hover:-translate-y-px hover:brightness-105";
  const ghost = "bg-transparent text-[#1a1a1a] border-black/[0.13] hover:bg-transparent";

  const cls = `${base} ${variant === "primary" ? primary : ghost}`;

  return (
    <>
      <style>{beamStyle}</style>
      {href ? (
        <a href={href} className={cls} ref={ref as React.Ref<HTMLAnchorElement>}>
          {label}
        </a>
      ) : (
        <button className={cls} onClick={onClick} ref={ref as React.Ref<HTMLButtonElement>}>
          {label}
        </button>
      )}
    </>
  );
}
