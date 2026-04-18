import { ReactNode } from "react";

type CheckItem = {
  symbol: string;
  content: ReactNode;
};

type Props = {
  title: string;
  intro?: string;
  label?: string;
  items?: CheckItem[];
  footer?: string;
};

export function CalloutBox({ title, intro, label, items = [], footer }: Props) {
  return (
    <div
      className="mt-8 p-8 border border-[#b45309] rounded-[14px]"
      style={{
        background: "linear-gradient(180deg, rgba(234,179,8,0.2), rgba(0,0,0,0.02))",
      }}
    >
      <h3 className="font-serif font-medium text-[#0a0a0a] text-2xl mt-0 mb-2.5">
        {title}
      </h3>
      {intro && <p className="text-[#4a4a4c] mt-0 mb-4">{intro}</p>}
      {label && (
        <div className="font-mono text-[11px] tracking-[0.3em] text-[#b45309] mt-5 mb-2 uppercase">
          {label}
        </div>
      )}
      {items.length > 0 && (
        <ul className="list-none p-0 m-0 flex flex-col gap-2">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2.5 items-start text-[15px] text-[#1a1a1a]">
              <span className="inline-flex w-[22px] h-[22px] items-center justify-center rounded-full bg-[rgba(234,179,8,0.2)] text-[#b45309] text-xs shrink-0">
                {item.symbol}
              </span>
              <span>{item.content}</span>
            </li>
          ))}
        </ul>
      )}
      {footer && (
        <p className="text-[#4a4a4c] mt-4 mb-0 font-medium">{footer}</p>
      )}
    </div>
  );
}
