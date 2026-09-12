"use client";

import { useId, useState } from "react";
import { LayoutGroup } from "framer-motion";
import {
  Apple,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Cookie,
  CupSoda,
  Home,
  LayoutGrid,
  Mail,
  Milk,
  Wheat,
} from "lucide-react";

import { TubelightNavBar } from "bezel-ui/navigation/TubelightNavBar";
import { EcomEmptyState } from "bezel-ui/feedback/EcomEmptyState";
import { CategoryChips } from "bezel-ui/navigation/CategoryChips";
import { ProductCard } from "bezel-ui/cards/ProductCard";
import { ShinyText } from "bezel-ui/animation/ShinyText";
import { CircularText } from "bezel-ui/display/CircularText";
import { Highlighter } from "bezel-ui/animation/Highlighter";

import { Caption, Center, IMAGES, useIdleInterval } from "../kit";
import type { PreviewModule } from "../types";

const noop = () => {};

const NAV_ITEMS = [
  { name: "Home", url: "#home", icon: Home },
  { name: "Work", url: "#work", icon: Briefcase },
  { name: "Journal", url: "#journal", icon: BookOpen },
  { name: "Contact", url: "#contact", icon: Mail },
];

function TubelightNavBarPreview() {
  const [active, setActive] = useState("Work");
  const groupId = useId();
  useIdleInterval(() => {
    setActive((current) => {
      const index = NAV_ITEMS.findIndex((item) => item.name === current);
      return NAV_ITEMS[(index + 1) % NAV_ITEMS.length].name;
    });
  }, 2400);
  return (
    // The lamp uses a shared layoutId; a group keeps two copies of this
    // preview on one page from animating into each other.
    <LayoutGroup id={groupId}>
      <div className="relative h-full w-full">
        <TubelightNavBar
          items={NAV_ITEMS}
          activeItem={active}
          onNavigate={(url) => setActive(NAV_ITEMS.find((item) => item.url === url)?.name ?? active)}
        />
        <div className="flex h-full flex-col items-center justify-center pt-12 text-center text-white">
          <Caption>You are on</Caption>
          <p className="mt-2 font-serif text-4xl">{active}</p>
        </div>
      </div>
    </LayoutGroup>
  );
}

const EMPTY_TYPES = ["cart", "search", "network"] as const;

function EcomEmptyStatePreview() {
  const [type, setType] = useState<(typeof EMPTY_TYPES)[number]>("cart");
  return (
    <div className="flex flex-col items-center text-[#0a0a0a]">
      <div role="group" aria-label="Empty state preset" className="flex gap-1 rounded-full bg-black/[0.05] p-1">
        {EMPTY_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={type === t}
            onClick={() => setType(t)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
              type === t ? "bg-white text-[#0a0a0a] shadow-sm" : "text-[#4a4a4c]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {/* preview-float-icon breathes the preset icon while motion is allowed. */}
      <div className="preview-float-icon">
        <EcomEmptyState key={type} type={type} query="saffron" onCTA={noop} />
      </div>
    </div>
  );
}

function CategoryChipsPreview() {
  const [active, setActive] = useState("fruits");
  const categories = [
    { id: "all", name: "All", icon: LayoutGrid, color: "text-neutral-700" },
    { id: "fruits", name: "Fruits", icon: Apple, color: "text-green-700" },
    { id: "dairy", name: "Dairy", icon: Milk, color: "text-blue-700" },
    { id: "staples", name: "Staples", icon: Wheat, color: "text-amber-700" },
    { id: "snacks", name: "Snacks", icon: Cookie, color: "text-orange-700" },
    { id: "drinks", name: "Drinks", icon: CupSoda, color: "text-cyan-700" },
  ];
  const current = categories.find((c) => c.id === active);
  return (
    <div className="flex h-full w-full flex-col justify-center gap-4 px-6 text-left">
      <CategoryChips categories={categories} activeCategory={active} onCategoryChange={setActive} />
      <p className="text-sm text-[#4a4a4c]">
        24 items in <span className="font-medium text-[#0a0a0a]">{current?.name}</span>
      </p>
    </div>
  );
}

function ProductCardPreview() {
  const [qty, setQty] = useState(1);
  return (
    <div className="grid grid-cols-2 gap-4 text-[#0a0a0a]">
      <ProductCard
        product={{ id: "rice", name: "Basmati rice, aged", price: 449, unit: "5 kg bag", image: IMAGES.rice, inStock: true, discount: 10 }}
        quantity={qty}
        onAdd={() => setQty((q) => q + 1)}
        onDecrease={() => setQty((q) => Math.max(0, q - 1))}
      />
      <ProductCard
        product={{ id: "cake", name: "Chocolate cake", price: 520, unit: "500 g", image: IMAGES.cake, inStock: false }}
        quantity={0}
        onAdd={noop}
        onDecrease={noop}
      />
    </div>
  );
}

function ShinyTextPreview() {
  return (
    <Center>
      <div className="w-[280px] text-left">
        <ShinyText text="Reviewing your documents" className="text-2xl font-medium" />
        <ul className="mt-5 space-y-2 text-sm text-[#4a4a4c]">
          <li className="flex items-center gap-2">
            <CheckCircle2 aria-hidden size={16} className="text-[#912c22]" />
            Identity verified
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 aria-hidden size={16} className="text-[#912c22]" />
            Address confirmed
          </li>
        </ul>
      </div>
    </Center>
  );
}

function CircularTextPreview() {
  return (
    <Center>
      <CircularText text="BEZEL · COMPONENTS · MOTION · " size="md" onHover="speedUp" className="!w-44">
        <span className="font-serif text-4xl text-[#912c22]">B</span>
      </CircularText>
    </Center>
  );
}

function HighlighterPreview() {
  return (
    <Center>
      <p className="max-w-[300px] text-center text-2xl leading-relaxed text-[#0a0a0a]">
        Good work is{" "}
        <Highlighter action="highlight" color="#f3d9a4">
          specific
        </Highlighter>
        ,{" "}
        <Highlighter action="underline" color="#912c22" animationDuration={700}>
          honest
        </Highlighter>{" "}
        and{" "}
        <Highlighter action="circle" color="#912c22" animationDuration={900}>
          finished
        </Highlighter>
        .
      </p>
    </Center>
  );
}

export const previews: PreviewModule = {
  "tubelight-navbar": TubelightNavBarPreview,
  "ecom-empty-state": EcomEmptyStatePreview,
  "category-chips": CategoryChipsPreview,
  "product-card": ProductCardPreview,
  "shiny-text": ShinyTextPreview,
  "circular-text": CircularTextPreview,
  highlighter: HighlighterPreview,
};
