"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { StickyCartBar } from "bezel-ui/panels/StickyCartBar";

const ITEMS = [
  { name: "Brown bread", price: 55 },
  { name: "Paneer, 200 g", price: 99 },
  { name: "Cold coffee", price: 145 },
];

export default function StickyCartBarPreview() {
  const [count, setCount] = useState(2);
  const [total, setTotal] = useState(244);

  return (
    <main className="min-h-screen bg-white pb-40 text-[#0a0a0a]">
      <ul className="divide-y divide-black/[0.06] px-4">
        {ITEMS.map((item) => (
          <li key={item.name} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-xs text-[#4a4a4c]">₹{item.price}</p>
            </div>
            <button
              type="button"
              aria-label={`Add ${item.name}`}
              onClick={() => {
                setCount((c) => c + 1);
                setTotal((t) => t + item.price);
              }}
              className="grid h-8 w-8 place-items-center rounded-lg border border-black/10"
            >
              <Plus size={16} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      {/* The bar sits 64px up, above an app's bottom navigation. */}
      <div aria-hidden className="fixed inset-x-0 bottom-0 flex h-16 items-center justify-around border-t border-black/[0.06] bg-white">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="h-5 w-5 rounded-md bg-neutral-200" />
        ))}
      </div>
      <StickyCartBar
        itemCount={count}
        totalPrice={total}
        onViewCart={() => {}}
        primaryAction={{ label: "Order on WhatsApp", onClick: () => {} }}
      />
    </main>
  );
}
