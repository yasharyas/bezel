type DiagItem = {
  tag: string;
  title: string;
  description: string;
};

type Props = {
  items: DiagItem[];
};

export function DiagnosticGrid({ items }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
      {items.map((item) => (
        <div
          key={item.tag}
          className="p-6 border border-black/[0.06] rounded-xl bg-black/[0.02]"
        >
          <span className="inline-block px-2.5 py-1 rounded-full bg-[rgba(234,179,8,0.2)] text-[#b45309] font-mono text-[10px] tracking-[0.15em] mb-3">
            {item.tag}
          </span>
          <h3 className="font-serif font-medium text-[#0a0a0a] mt-0 mb-1.5 text-[22px]">
            {item.title}
          </h3>
          <p className="text-[#4a4a4c] m-0 text-[15px]">{item.description}</p>
        </div>
      ))}
    </div>
  );
}
