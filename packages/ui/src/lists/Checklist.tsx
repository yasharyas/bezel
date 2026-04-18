import { ReactNode } from "react";

type CheckItem = {
  symbol: string;
  text: ReactNode;
};

type Props = {
  items: CheckItem[];
};

export function Checklist({ items }: Props) {
  return (
    <ul className="list-none p-0 my-6 flex flex-col gap-2.5">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex gap-3 items-start px-4 py-[14px] bg-black/[0.02] border border-black/[0.06] rounded-[10px] text-[#1a1a1a] text-[15px]"
        >
          <span className="inline-flex w-[22px] h-[22px] items-center justify-center rounded-full bg-[rgba(5,150,105,0.1)] text-[#059669] text-xs shrink-0">
            {item.symbol}
          </span>
          <span>{item.text}</span>
        </li>
      ))}
    </ul>
  );
}
