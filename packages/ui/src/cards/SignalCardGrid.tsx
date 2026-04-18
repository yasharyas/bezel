type SignalCard = {
  letter: string;
  title: string;
  subtitle: string;
  description: string;
};

type Props = {
  cards: SignalCard[];
};

export function SignalCardGrid({ cards }: Props) {
  return (
    <div
      className="grid gap-3 mt-6"
      style={{
        gridTemplateColumns: `repeat(${Math.min(cards.length, 5)}, minmax(0, 1fr))`,
      }}
    >
      {cards.map((card) => (
        <div
          key={card.letter}
          className="p-[22px] border border-black/[0.06] rounded-xl bg-black/[0.02]"
        >
          <div className="font-serif italic text-[44px] text-[#059669] leading-none">
            {card.letter}
          </div>
          <h4 className="mt-2 mb-1 text-base text-[#0a0a0a] font-medium">{card.title}</h4>
          <p className="m-0 mb-1 text-sm text-[#8a8a8e]">{card.subtitle}</p>
          <p className="m-0 text-sm text-[#4a4a4c]">{card.description}</p>
        </div>
      ))}
    </div>
  );
}
