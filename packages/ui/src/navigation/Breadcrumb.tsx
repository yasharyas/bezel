"use client";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  /** Display text */
  label: string;
  /** Renders as an anchor/link if provided */
  href?: string;
  /** Renders as a button if provided (and no href) */
  onClick?: () => void;
}

type Props = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumb({ items, className = "" }: Props) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-0.5 flex-wrap text-xs text-muted-foreground">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          const isFirst = i === 0;
          return (
            <li key={i} className="flex items-center gap-0.5 min-w-0">
              {i > 0 && (
                <ChevronRight className="w-3 h-3 mx-0.5 shrink-0 opacity-40" />
              )}
              {isLast ? (
                <span
                  className="font-medium text-foreground truncate max-w-[160px]"
                  aria-current="page"
                  title={item.label}
                >
                  {item.label}
                </span>
              ) : item.href ? (
                <a
                  href={item.href}
                  className="flex items-center gap-1 hover:text-primary transition-colors whitespace-nowrap underline-offset-2 hover:underline"
                >
                  {isFirst && <Home className="w-3 h-3 shrink-0" />}
                  {item.label}
                </a>
              ) : item.onClick ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="hover:text-primary transition-colors whitespace-nowrap underline-offset-2 hover:underline cursor-pointer bg-transparent border-0 p-0 text-xs text-muted-foreground"
                >
                  {isFirst && <Home className="w-3 h-3 shrink-0 inline mr-1" />}
                  {item.label}
                </button>
              ) : (
                <span className="whitespace-nowrap">{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
