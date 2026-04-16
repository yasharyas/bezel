"use client";
import type { ReactNode } from "react";

interface PlaceholderProps {
  aspectRatio?: string;
  label?: string;
  rounded?: string;
  className?: string;
}

function ImagePlaceholder({ aspectRatio = "1/1", label = "", rounded = "rounded-xl", className = "" }: PlaceholderProps) {
  return (
    <div
      className={`relative overflow-hidden bg-neutral-100 ${rounded} ${className}`}
      style={{ aspectRatio }}
      role="img"
      aria-label={label || "Image placeholder"}
    >
      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400">
        <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {label && <span className="text-xs font-medium opacity-60">{label}</span>}
      </div>
    </div>
  );
}

export interface BakeryProduct {
  name: string;
  image?: string;
  price: number | string;
  originalPrice?: number | string;
  badge?: string;
  tag?: string;
  description?: string;
}

type Props = {
  product: BakeryProduct;
  href: string;
  currencySymbol?: string;
  unitLabel?: string;
  ctaLabel?: ReactNode | string;
};

export function BakeryProductCard({ product, href, currencySymbol = "₹", unitLabel = "/kg", ctaLabel = "View & Customize" }: Props) {
  return (
    <a
      href={href}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-neutral-100 block"
    >
      <div className="relative overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <ImagePlaceholder
            aspectRatio="1/1"
            label={product.name}
            rounded="rounded-none"
            className="group-hover:scale-105 transition-transform duration-500"
          />
        )}
        {product.badge && (
          <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {product.badge}
          </span>
        )}
        {product.tag && (
          <span className="absolute top-3 right-3 bg-green-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            {product.tag}
          </span>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <h3 className="font-semibold text-sm sm:text-base text-neutral-900 mb-1 line-clamp-1 group-hover:text-neutral-700 transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-neutral-500 text-xs mb-2 line-clamp-2 hidden sm:block">{product.description}</p>
        )}
        <div className="flex items-baseline gap-1 sm:gap-2 mb-2 sm:mb-3">
          <span className="text-neutral-900 font-bold text-base sm:text-lg">{currencySymbol}{product.price}</span>
          {product.originalPrice && (
            <span className="text-neutral-400 text-xs line-through">{currencySymbol}{product.originalPrice}</span>
          )}
          <span className="text-neutral-400 text-[10px] sm:text-xs">{unitLabel}</span>
        </div>
        <span className="w-full bg-neutral-900 text-white text-[10px] sm:text-xs font-medium py-2 sm:py-2.5 rounded-full group-hover:bg-neutral-700 transition-colors flex items-center justify-center gap-1.5 min-h-[40px]">
          {ctaLabel}
        </span>
      </div>
    </a>
  );
}
