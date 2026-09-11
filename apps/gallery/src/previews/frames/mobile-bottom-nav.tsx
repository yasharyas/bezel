"use client";

import { useState } from "react";
import { Grid3X3, Home, Search, ShoppingCart } from "lucide-react";
import { MobileBottomNav } from "bezel-ui/navigation/MobileBottomNav";
import { useIdleInterval } from "../kit";

const TABS = [
  { id: "home", icon: Home, label: "Home" },
  { id: "categories", icon: Grid3X3, label: "Categories" },
  { id: "search", icon: Search, label: "Search" },
  { id: "cart", icon: ShoppingCart, label: "Cart", badge: 3 },
];

export default function MobileBottomNavPreview() {
  const [tab, setTab] = useState("home");
  useIdleInterval(() => {
    setTab((current) => TABS[(TABS.findIndex((t) => t.id === current) + 1) % TABS.length].id);
  }, 2200);
  const title = TABS.find((t) => t.id === tab)?.label ?? "";

  return (
    <main className="min-h-screen bg-neutral-50 px-4 pt-5 text-[#0a0a0a]">
      <p className="text-xs text-[#4a4a4c]">Good evening</p>
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="mt-4 grid grid-cols-2 gap-3" aria-hidden>
        {[0, 1].map((i) => (
          <div key={i} className="rounded-xl border border-black/[0.06] bg-white p-2">
            <div className="aspect-[4/3] rounded-lg bg-neutral-100" />
            <div className="mt-2 h-2.5 w-2/3 rounded bg-neutral-100" />
          </div>
        ))}
      </div>
      <MobileBottomNav tabs={TABS} activeTab={tab} onTabChange={setTab} />
    </main>
  );
}
