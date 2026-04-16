"use client";
import { Search, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  /** Store/app name */
  storeName: string;
  /** Tagline shown below name on sm+ screens */
  tagline?: string;
  /** Number shown in cart badge */
  cartItemCount: number;
  /** Show a live "Open/Closed" status dot */
  isOpen?: boolean;
  /** Info bar text */
  infoBanner?: string;
  onCartClick: () => void;
  onSearchClick: () => void;
  /** Optional extra CTA (e.g. WhatsApp, phone) */
  ctaButton?: {
    label: string;
    icon: ReactNode;
    onClick: () => void;
    colorClass?: string;
  };
};

export function AppHeader({
  storeName,
  tagline,
  cartItemCount,
  isOpen,
  infoBanner,
  onCartClick,
  onSearchClick,
  ctaButton,
}: Props) {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 bg-white border-b border-border shadow-sm"
    >
      {/* Top info bar */}
      {(infoBanner || isOpen !== undefined) && (
        <div className="bg-primary text-primary-foreground px-4 py-1.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              {isOpen !== undefined && (
                <span className="flex items-center gap-1.5 font-medium">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isOpen ? "bg-green-300 animate-pulse" : "bg-red-300"
                    }`}
                  />
                  {isOpen ? "Open Now" : "Closed"}
                </span>
              )}
              {infoBanner && (
                <span className="hidden sm:inline opacity-80">{infoBanner}</span>
              )}
            </div>
            {ctaButton && (
              <button
                onClick={ctaButton.onClick}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity shrink-0 font-medium"
              >
                {ctaButton.icon}
                <span>{ctaButton.label}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main header row */}
      <div className="px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          {/* Logo / wordmark */}
          <div className="shrink-0">
            <h1 className="text-primary m-0 leading-none text-xl font-extrabold tracking-tight">
              {storeName}
            </h1>
            {tagline && (
              <p className="text-[10px] text-muted-foreground m-0 hidden sm:block">{tagline}</p>
            )}
          </div>

          {/* Desktop inline search bar */}
          <div className="flex-1 max-w-2xl hidden md:block">
            <button
              onClick={onSearchClick}
              className="w-full flex items-center gap-2 pl-3 pr-4 py-2.5 bg-muted rounded-xl text-muted-foreground text-sm hover:bg-muted/80 hover:ring-2 hover:ring-primary/20 transition-all text-left"
            >
              <Search className="w-4 h-4 shrink-0" />
              <span>Search…</span>
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto md:ml-0">
            {/* Mobile search icon */}
            <button
              onClick={onSearchClick}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* CTA button (desktop) */}
            {ctaButton && (
              <button
                onClick={ctaButton.onClick}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all text-sm font-medium text-white ${
                  ctaButton.colorClass ?? "bg-primary"
                }`}
              >
                {ctaButton.icon}
                <span className="hidden lg:inline">{ctaButton.label}</span>
              </button>
            )}

            {/* Cart button */}
            <button
              onClick={onCartClick}
              className="relative flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 active:scale-95 transition-all text-sm font-medium"
              aria-label={`Cart, ${cartItemCount} items`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden md:inline">Cart</span>
              <AnimatePresence>
                {cartItemCount > 0 && (
                  <motion.span
                    key={cartItemCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none"
                  >
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
