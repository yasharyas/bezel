type FeatureCard = {
  label: string;
  title: string;
};

type Props = {
  cards: FeatureCard[];
};

export function FeatureCardGrid({ cards }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
      {cards.map((card, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 p-[22px] rounded-xl bg-black/[0.02] border border-black/[0.06] transition-all duration-[250ms] hover:bg-black/[0.04] hover:border-[#059669] hover:-translate-y-0.5"
        >
          <div className="font-mono text-[11px] tracking-[0.2em] text-[#059669] uppercase">
            {card.label}
          </div>
          <div className="text-[17px] text-[#0a0a0a] font-medium">{card.title}</div>
        </div>
      ))}
    </div>
  );
}
