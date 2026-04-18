type Props = {
  spark?: string;
  text: string;
};

export function ShinyBadge({ spark = "✦", text }: Props) {
  return (
    <>
      <style>{`
        @keyframes shiny-sweep {
          from { background-position: 200% 0; }
          to   { background-position: -200% 0; }
        }
        .shiny-badge-text {
          background: linear-gradient(110deg, #4a4a4c 40%, #0a0a0a 50%, #4a4a4c 60%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          animation: shiny-sweep 3s linear infinite;
        }
      `}</style>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/[0.02] border border-black/[0.13] text-[13px] text-[#0a0a0a]">
        <span className="text-[#b45309]">{spark}</span>
        <span className="shiny-badge-text">{text}</span>
      </div>
    </>
  );
}
