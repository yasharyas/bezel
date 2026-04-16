"use client";
import { useState, useEffect } from "react";
import { Menu, X, Search, ShoppingBag, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

export interface NavLink {
  label: string;
  href: string;
}

type Props = {
  brand: string | ReactNode;
  links?: NavLink[];
  cartCount?: number;
  announcementText?: string;
  onSearchClick?: () => void;
  onAccountClick?: () => void;
  onCartClick?: () => void;
};

export function StickyNavbar({
  brand,
  links = [],
  cartCount = 0,
  announcementText = "",
  onSearchClick,
  onAccountClick,
  onCartClick,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activePath, setActivePath] = useState("/");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setActivePath(window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {announcementText && (
        <div className="bg-neutral-900 text-white text-center py-2 text-xs tracking-wide">
          <p>{announcementText}</p>
        </div>
      )}
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-md shadow-md" : "bg-white"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-16">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Brand */}
            <a href="/" className="flex items-center">
              {typeof brand === "string" ? (
                <span className="text-xl font-bold text-neutral-900">{brand}</span>
              ) : brand}
            </a>

            {/* Desktop links */}
            <div className="hidden lg:flex items-center gap-8">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors duration-200 hover:text-neutral-900 ${
                    activePath === link.href
                      ? "text-neutral-900 border-b-2 border-neutral-900 pb-0.5"
                      : "text-neutral-500"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop actions */}
            <div className="hidden lg:flex items-center gap-4">
              {onSearchClick && (
                <button onClick={onSearchClick} className="p-2 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer" aria-label="Search">
                  <Search size={20} />
                </button>
              )}
              {onAccountClick && (
                <button onClick={onAccountClick} className="p-2 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer" aria-label="Account">
                  <User size={20} />
                </button>
              )}
              {onCartClick && (
                <button onClick={onCartClick} className="relative p-2 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer" aria-label={`Cart, ${cartCount} items`}>
                  <ShoppingBag size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                      {cartCount}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              className="lg:hidden p-2 text-neutral-900 cursor-pointer"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="lg:hidden bg-white border-t border-neutral-100 overflow-hidden"
            >
              <div className="px-4 sm:px-6 py-4 space-y-1">
                {links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`block py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                      activePath === link.href
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
