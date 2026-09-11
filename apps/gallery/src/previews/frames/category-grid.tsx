"use client";

import { Apple, Cookie, CupSoda, Home, Milk, Sandwich, Sparkles, Wheat } from "lucide-react";
import { CategoryGrid } from "bezel-ui/navigation/CategoryGrid";

export default function CategoryGridPreview() {
  return (
    <main className="min-h-screen bg-white px-4 pt-5 text-[#0a0a0a]">
      <div className="mb-3 flex items-baseline justify-between px-3">
        <h1 className="text-base font-semibold">Shop by category</h1>
        <span className="text-xs text-[#4a4a4c]">See all</span>
      </div>
      <CategoryGrid
        onCategoryClick={() => {}}
        categories={[
          { id: "fruits", name: "Fruits", icon: Apple, color: "bg-green-100 text-green-700" },
          { id: "dairy", name: "Dairy", icon: Milk, color: "bg-blue-100 text-blue-700" },
          { id: "bakery", name: "Bakery", icon: Sandwich, color: "bg-amber-100 text-amber-700" },
          { id: "snacks", name: "Snacks", icon: Cookie, color: "bg-orange-100 text-orange-700" },
          { id: "drinks", name: "Drinks", icon: CupSoda, color: "bg-cyan-100 text-cyan-700" },
          { id: "staples", name: "Staples", icon: Wheat, color: "bg-yellow-100 text-yellow-700" },
          { id: "home", name: "Home", icon: Home, color: "bg-purple-100 text-purple-700" },
          { id: "care", name: "Care", icon: Sparkles, color: "bg-pink-100 text-pink-700" },
        ]}
      />
    </main>
  );
}
