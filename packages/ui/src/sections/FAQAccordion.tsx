"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface FAQItem {
  q: string;
  a: string;
}

interface FAQItemProps {
  faq: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItemRow({ faq, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="border-b border-neutral-100 last:border-b-0">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-4 py-5 text-left cursor-pointer group"
      >
        <span className="text-neutral-900 text-sm sm:text-base font-medium group-hover:text-neutral-600 transition-colors">
          {faq.q}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-neutral-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: isOpen ? "200px" : "0", opacity: isOpen ? 1 : 0 }}
      >
        <p className="text-neutral-500 text-sm leading-relaxed pb-5">{faq.a}</p>
      </div>
    </div>
  );
}

type Props = {
  items: FAQItem[];
  title?: string;
  subtitle?: string;
};

export function FAQAccordion({ items, title = "Frequently Asked Questions", subtitle = "" }: Props) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-3">{title}</h2>
          {subtitle && <p className="text-neutral-500 text-sm">{subtitle}</p>}
        </div>
        <div className="bg-neutral-50 rounded-2xl px-6 sm:px-8">
          {items.map((faq, i) => (
            <FAQItemRow
              key={i}
              faq={faq}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
