"use client";
import { motion } from "framer-motion";
import type { ElementType } from "react";

export interface GridCategory {
  id: string;
  name: string;
  icon: ElementType;
  /** Combined Tailwind bg+text classes, e.g. "bg-green-100 text-green-700" */
  color: string;
}

type Props = {
  categories: GridCategory[];
  onCategoryClick?: (categoryId: string) => void;
};

export function CategoryGrid({ categories, onCategoryClick }: Props) {
  return (
    <div className="grid grid-cols-4 md:grid-cols-8 gap-3 md:gap-4">
      {categories.map((category, index) => {
        const Icon = category.icon;
        return (
          <motion.button
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onCategoryClick?.(category.id)}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-neutral-100 transition-colors"
          >
            <div
              className={`w-14 h-14 md:w-16 md:h-16 rounded-full ${category.color} flex items-center justify-center`}
            >
              <Icon className="w-7 h-7 md:w-8 md:h-8" />
            </div>
            <span className="text-center leading-tight text-xs text-neutral-900">{category.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
