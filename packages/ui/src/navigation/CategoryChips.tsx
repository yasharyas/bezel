"use client";
import { useRef } from "react";
import { motion } from "framer-motion";
import type { ElementType } from "react";

export interface ChipCategory {
  id: string;
  name: string;
  icon: ElementType;
  /** Tailwind color class for the icon when inactive, e.g. "text-green-700" */
  color: string;
  bg?: string;
}

type Props = {
  categories: ChipCategory[];
  activeCategory: string;
  onCategoryChange: (id: string) => void;
};

export function CategoryChips({ categories, activeCategory, onCategoryChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-1"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
    >
      {categories.map((cat) => {
        const Icon = cat.icon;
        const isActive = activeCategory === cat.id;
        return (
          <motion.button
            key={cat.id}
            whileTap={{ scale: 0.94 }}
            onClick={() => onCategoryChange(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all shrink-0 border ${
              isActive
                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                : "bg-white text-foreground border-border hover:border-primary/40 hover:bg-primary/5"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? "text-primary-foreground" : cat.color}`} />
            {cat.name}
          </motion.button>
        );
      })}
    </div>
  );
}
