"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { AppHeader } from "bezel-ui/layout/AppHeader";

export default function AppHeaderPreview() {
  const [cart, setCart] = useState(3);
  return (
    <main className="min-h-screen bg-neutral-50 text-[#0a0a0a]">
      <AppHeader
        storeName="FreshCart"
        tagline="Groceries in 20 minutes"
        cartItemCount={cart}
        isOpen
        infoBanner="Free delivery on orders over ₹299"
        onCartClick={() => setCart((c) => c + 1)}
        onSearchClick={() => {}}
        ctaButton={{ label: "Call the store", icon: <Phone size={14} aria-hidden />, onClick: () => {} }}
      />
      <div className="mx-auto max-w-7xl px-4 py-6" aria-hidden>
        <div className="mb-5 flex gap-2">
          {["Fruits", "Dairy", "Bakery", "Snacks", "Drinks"].map((c) => (
            <span key={c} className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs text-[#4a4a4c]">
              {c}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-black/[0.06] bg-white p-3">
              <div className="aspect-square rounded-lg bg-neutral-100" />
              <div className="mt-3 h-3 w-3/4 rounded bg-neutral-100" />
              <div className="mt-2 h-3 w-1/3 rounded bg-neutral-100" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
