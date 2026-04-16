"use client";
import { ShoppingBag, Search, Wifi, LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

type EmptyType = "cart" | "search" | "category" | "network";

type Props = {
  /** Preset type that determines icon, title, description and CTA label */
  type: EmptyType;
  /** Search query string — only shown when type === "search" */
  query?: string;
  /** CTA button click handler. Button is hidden when omitted. */
  onCTA?: () => void;
};

const config: Record<EmptyType, { icon: LucideIcon; title: string; desc: string; cta: string; color: string }> = {
  cart: {
    icon: ShoppingBag,
    title: "Your cart is empty",
    desc: "Add items from the store to get started",
    cta: "Start Shopping",
    color: "text-primary",
  },
  search: {
    icon: Search,
    title: "No results found",
    desc: "Try different keywords or browse categories",
    cta: "Clear Search",
    color: "text-muted-foreground",
  },
  category: {
    icon: ShoppingBag,
    title: "Nothing here yet",
    desc: "Try a different category",
    cta: "View All",
    color: "text-muted-foreground",
  },
  network: {
    icon: Wifi,
    title: "Couldn't load items",
    desc: "Check your connection and try again",
    cta: "Retry",
    color: "text-destructive",
  },
};

export function EcomEmptyState({ type, query, onCTA }: Props) {
  const c = config[type];
  const Icon = c.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className={`w-9 h-9 ${c.color}`} />
      </div>
      <h3 className="m-0 mb-2 text-lg font-semibold">{c.title}</h3>
      <p className="text-muted-foreground m-0 mb-1 max-w-xs">
        {type === "search" && query ? `No items matching "${query}"` : c.desc}
      </p>
      {type === "search" && (
        <p className="text-muted-foreground m-0 mb-5 text-sm">
          Try: atta, rice, milk, vegetables…
        </p>
      )}
      {onCTA && (
        <button
          onClick={onCTA}
          className="mt-4 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 active:scale-95 transition-all"
        >
          {c.cta}
        </button>
      )}
    </motion.div>
  );
}
