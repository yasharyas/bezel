"use client";
import { ShoppingCart, MessageCircle, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  itemCount: number;
  totalPrice: number;
  onViewCart: () => void;
  /** Optional second action button (e.g. WhatsApp order) */
  primaryAction?: {
    label: string;
    onClick: () => void;
    /** Tailwind bg class, default "bg-[#25D366] hover:bg-[#22c35e]" */
    colorClass?: string;
  };
};

export function StickyCartBar({ itemCount, totalPrice, onViewCart, primaryAction }: Props) {
  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.div
          initial={{ y: 120 }}
          animate={{ y: 0 }}
          exit={{ y: 120 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="md:hidden fixed bottom-16 left-0 right-0 z-40 px-3 pb-1"
        >
          <div className="bg-foreground text-background rounded-2xl shadow-2xl overflow-hidden">
            {/* Summary row */}
            <button
              onClick={onViewCart}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="relative">
                  <ShoppingCart className="w-4 h-4" />
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {itemCount}
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {itemCount} item{itemCount !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold">
                ₹{totalPrice}
                <ChevronUp className="w-4 h-4 opacity-60" />
              </div>
            </button>

            {/* Action buttons */}
            <div className="flex border-t border-white/10">
              <button
                onClick={onViewCart}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium hover:bg-white/5 transition-colors border-r border-white/10"
              >
                <ShoppingCart className="w-4 h-4" />
                View Cart
              </button>
              {primaryAction && (
                <button
                  onClick={primaryAction.onClick}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold transition-colors ${
                    primaryAction.colorClass ?? "bg-[#25D366] hover:bg-[#22c35e]"
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  {primaryAction.label}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
