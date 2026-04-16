"use client";
import { Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export interface EcomProduct {
  id: string;
  name: string;
  /** Current selling price */
  price: number;
  /** Unit/weight label, e.g. "500g", "1 litre" */
  unit: string;
  image: string;
  inStock: boolean;
  /** Discount percentage 0–100 */
  discount?: number;
}

type Props = {
  product: EcomProduct;
  quantity: number;
  onAdd: () => void;
  onDecrease: () => void;
  /** Called when "Notify me" is tapped on out-of-stock items */
  onNotify?: () => void;
  /** Navigate to product detail */
  onCardClick?: () => void;
};

export function ProductCard({ product, quantity, onAdd, onDecrease, onNotify, onCardClick }: Props) {
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = () => {
    onAdd();
    if (quantity === 0) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 600);
    }
  };

  const discountedFromPrice = product.discount
    ? Math.round(product.price / (1 - product.discount / 100))
    : null;

  return (
    <motion.div
      layout
      whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}
      className="bg-card rounded-xl border border-border overflow-hidden transition-shadow relative"
    >
      {/* Image */}
      <button
        onClick={onCardClick}
        className="block w-full relative aspect-square bg-muted overflow-hidden focus:outline-none"
        aria-label={`View details for ${product.name}`}
        tabIndex={onCardClick ? 0 : -1}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
        />

        {/* Discount badge */}
        {product.discount && product.inStock && (
          <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground px-2 py-0.5 rounded-md text-xs font-bold">
            {product.discount}% OFF
          </div>
        )}

        {/* Out of stock overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-2 p-2">
            <span className="bg-white text-foreground px-3 py-1 rounded-md text-sm font-semibold">
              Out of Stock
            </span>
            {onNotify && (
              <button
                onClick={(e) => { e.stopPropagation(); onNotify(); }}
                className="flex items-center gap-1 bg-[#25D366] text-white px-2.5 py-1 rounded-md text-xs font-medium hover:bg-[#22c35e] active:scale-95 transition-all"
              >
                Notify me
              </button>
            )}
          </div>
        )}

        {/* "Added" flash overlay */}
        <AnimatePresence>
          {justAdded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-primary/15 flex items-center justify-center pointer-events-none"
            >
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                className="w-10 h-10 bg-primary rounded-full flex items-center justify-center"
              >
                <Plus className="w-5 h-5 text-primary-foreground" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quantity bubble */}
        <AnimatePresence>
          {quantity > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute top-2 right-2 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-[10px] font-bold shadow"
            >
              {quantity}
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Content */}
      <div className="p-3">
        <button
          onClick={onCardClick}
          className="text-left w-full no-underline text-inherit hover:text-primary transition-colors focus:outline-none"
        >
          <h3 className="line-clamp-2 m-0 mb-0.5 text-sm font-semibold leading-tight">{product.name}</h3>
        </button>
        <p className="text-muted-foreground text-xs m-0 mb-2">{product.unit}</p>

        <div className="flex items-center justify-between gap-2 min-h-[36px]">
          {/* Price */}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="font-bold text-sm">₹{product.price}</span>
            {discountedFromPrice && (
              <span className="line-through text-muted-foreground text-xs">₹{discountedFromPrice}</span>
            )}
          </div>

          {/* ADD button / stepper */}
          {product.inStock && (
            <AnimatePresence mode="wait" initial={false}>
              {quantity === 0 ? (
                <motion.button
                  key="add"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={handleAdd}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
                >
                  ADD
                </motion.button>
              ) : (
                <motion.div
                  key="stepper"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex items-center gap-1 bg-primary text-primary-foreground rounded-lg px-1.5 py-1"
                >
                  <button
                    onClick={onDecrease}
                    className="w-6 h-6 flex items-center justify-center hover:opacity-75 transition-opacity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-5 text-center text-sm font-semibold">{quantity}</span>
                  <button
                    onClick={handleAdd}
                    className="w-6 h-6 flex items-center justify-center hover:opacity-75 transition-opacity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  );
}
