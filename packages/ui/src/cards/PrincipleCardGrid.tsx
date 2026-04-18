type Principle = {
  number: string;
  title: string;
  subtitle: string;
  description: string;
};

type Props = {
  principles: Principle[];
};

export function PrincipleCardGrid({ principles }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
      {principles.map((p) => (
        <article
          key={p.number}
          className="p-[22px] border border-black/[0.06] rounded-xl bg-black/[0.02]"
        >
          <div className="font-mono text-[#059669] text-xs tracking-[0.2em]">{p.number}</div>
          <h3 className="font-serif font-medium mt-2.5 mb-1 text-[22px] text-[#0a0a0a]">
            {p.title}
          </h3>
          <div className="text-[13px] text-[#059669] mb-2">{p.subtitle}</div>
          <p className="text-[#4a4a4c] text-sm m-0">{p.description}</p>
        </article>
      ))}
    </div>
  );
}
