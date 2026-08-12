"use client";

import { useEffect, useState } from "react";

type ReceiptRow = {
  label: string;
  value: string;
  mono?: boolean;
};

type TillReceiptPrintProps = {
  brand?: string;
  eyebrow?: string;
  amountLabel?: string;
  amount: string;
  currency?: string;
  rows: ReceiptRow[];
  stamp?: string;
  footer?: string;
  /** Called when the continue control is pressed */
  onContinue?: () => void;
  continueLabel?: string;
  className?: string;
};

/**
 * Till-style receipt: clip-path prints out of a slot, line items stagger in,
 * PAID stamp thumps with a noise mask. Pure CSS choreography + one printed flag.
 */
export function TillReceiptPrint({
  brand = "Paigam",
  eyebrow = "Payment receipt",
  amountLabel = "Amount paid",
  amount,
  currency = "INR",
  rows,
  stamp = "Paid",
  footer = "Thank you for celebrating with us.",
  onContinue,
  continueLabel = "Continue",
  className,
}: TillReceiptPrintProps) {
  const [printed, setPrinted] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setPrinted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      className={`flex w-full max-w-sm flex-col items-center ${className ?? ""}`}
      role="dialog"
      aria-label={eyebrow}
    >
      <style>{`
        .till-receipt {
          clip-path: inset(0 0 100% 0);
          transition: clip-path 1.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .till-receipt--printed {
          clip-path: inset(0 0 -8% 0);
        }
        .till-perf {
          height: 10px;
          background: oklch(0.99 0.004 85);
        }
        .till-perf--top {
          clip-path: polygon(0 100%, 0 40%, 2.5% 0, 5% 40%, 7.5% 0, 10% 40%, 12.5% 0, 15% 40%, 17.5% 0, 20% 40%, 22.5% 0, 25% 40%, 27.5% 0, 30% 40%, 32.5% 0, 35% 40%, 37.5% 0, 40% 40%, 42.5% 0, 45% 40%, 47.5% 0, 50% 40%, 52.5% 0, 55% 40%, 57.5% 0, 60% 40%, 62.5% 0, 65% 40%, 67.5% 0, 70% 40%, 72.5% 0, 75% 40%, 77.5% 0, 80% 40%, 82.5% 0, 85% 40%, 87.5% 0, 90% 40%, 92.5% 0, 95% 40%, 97.5% 0, 100% 40%, 100% 100%);
        }
        .till-perf--bottom {
          clip-path: polygon(0 0, 100% 0, 100% 60%, 97.5% 100%, 95% 60%, 92.5% 100%, 90% 60%, 87.5% 100%, 85% 60%, 82.5% 100%, 80% 60%, 77.5% 100%, 75% 60%, 72.5% 100%, 70% 60%, 67.5% 100%, 65% 60%, 62.5% 100%, 60% 60%, 57.5% 100%, 55% 60%, 52.5% 100%, 50% 60%, 47.5% 100%, 45% 60%, 42.5% 100%, 40% 60%, 37.5% 100%, 35% 60%, 32.5% 100%, 30% 60%, 27.5% 100%, 25% 60%, 22.5% 100%, 20% 60%, 17.5% 100%, 15% 60%, 12.5% 100%, 10% 60%, 7.5% 100%, 5% 60%, 2.5% 100%, 0 60%);
        }
        .till-rule {
          height: 0;
          border-top: 1.5px dashed oklch(0.82 0.01 330);
        }
        @keyframes till-item-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .till-item {
          animation: till-item-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: calc(0.55s + var(--i, 0) * 90ms);
        }
        @keyframes till-stamp-in {
          0% { opacity: 0; transform: rotate(-14deg) scale(2.2); }
          60% { opacity: 1; transform: rotate(-14deg) scale(0.92); }
          100% { opacity: 0.9; transform: rotate(-14deg) scale(1); }
        }
        .till-stamp {
          animation: till-stamp-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          animation-delay: 1.9s;
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='60'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.9 0.1'/%3E%3C/filter%3E%3Crect width='120' height='60' filter='url(%23n)'/%3E%3C/svg%3E");
          mask-size: cover;
        }
        @media (prefers-reduced-motion: reduce) {
          .till-receipt { transition: none; clip-path: inset(0 0 -8% 0); }
          .till-item, .till-stamp { animation: none; opacity: 1; transform: none; }
          .till-stamp { transform: rotate(-14deg); opacity: 0.9; }
        }
      `}</style>

      <div className="mx-auto h-3 w-[88%] rounded-full bg-[oklch(0.3_0.03_330)] shadow-inner" aria-hidden />

      <div
        className={`till-receipt ${printed ? "till-receipt--printed" : ""} relative mx-auto -mt-1 w-[92%] bg-[oklch(0.99_0.004_85)] text-[oklch(0.25_0.02_330)] shadow-2xl`}
      >
        <div className="till-perf till-perf--top" aria-hidden />

        <div className="px-6 pb-7 pt-6 font-mono text-[13px] leading-relaxed">
          <header className="text-center">
            <p className="font-serif text-2xl font-medium tracking-tight text-[oklch(0.23_0.035_330)]">
              {brand}
            </p>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.2em] text-[oklch(0.5_0.02_330)]">
              {eyebrow}
            </p>
          </header>

          <div className="till-rule my-4" aria-hidden />

          <div className="till-item text-center" style={{ ["--i" as string]: 0 }}>
            <p className="text-[11px] uppercase tracking-widest text-[oklch(0.5_0.02_330)]">
              {amountLabel}
            </p>
            <p className="mt-1 font-serif text-4xl font-medium text-[oklch(0.23_0.035_330)]">
              {amount}
            </p>
            <p className="mt-1 text-[11px] text-[oklch(0.55_0.02_330)]">{currency}</p>
          </div>

          <div className="till-rule my-4" aria-hidden />

          <dl>
            {rows.map((row, i) => (
              <div
                key={row.label}
                className="till-item flex items-baseline justify-between gap-4 py-1"
                style={{ ["--i" as string]: i + 1 }}
              >
                <dt className="shrink-0 text-[11px] uppercase tracking-wider text-[oklch(0.52_0.02_330)]">
                  {row.label}
                </dt>
                <dd
                  className={`min-w-0 text-right ${row.mono ? "break-all text-[11px]" : "break-words"} text-[oklch(0.28_0.02_330)]`}
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="till-rule my-4" aria-hidden />

          <div className="pointer-events-none absolute right-5 top-24" aria-hidden>
            <span className="till-stamp inline-block rounded border-[3px] border-[oklch(0.55_0.16_145)] px-3 py-1 font-mono text-lg font-bold uppercase tracking-[0.25em] text-[oklch(0.55_0.16_145)]">
              {stamp}
            </span>
          </div>

          <p
            className="till-item mt-4 text-center text-[10px] tracking-wide text-[oklch(0.6_0.015_330)]"
            style={{ ["--i" as string]: rows.length + 2 }}
          >
            {footer}
          </p>
        </div>

        <div className="till-perf till-perf--bottom" aria-hidden />
      </div>

      {onContinue && (
        <div
          className="till-item mt-6 flex justify-center"
          style={{ ["--i" as string]: rows.length + 3 }}
        >
          <button
            type="button"
            onClick={onContinue}
            className="rounded-md bg-[oklch(0.28_0.04_330)] px-6 py-3 text-sm font-medium text-[oklch(0.98_0.01_85)]"
          >
            {continueLabel}
          </button>
        </div>
      )}
    </div>
  );
}
