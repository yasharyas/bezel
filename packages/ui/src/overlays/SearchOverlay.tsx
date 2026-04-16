"use client";
import { useState, useEffect, useRef } from "react";
import { Search, X, Clock, TrendingUp, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  currentQuery?: string;
  /** Shown in the "Popular" section */
  popularSearches?: string[];
  /** localStorage key for persisting recent searches */
  storageKey?: string;
};

export function SearchOverlay({
  isOpen,
  onClose,
  onSearch,
  currentQuery = "",
  popularSearches = [],
  storageKey = "app_recent_searches",
}: Props) {
  const [value, setValue] = useState(currentQuery);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function getRecent(): string[] {
    try { return JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch { return []; }
  }

  function saveRecent(term: string) {
    try {
      const prev = getRecent().filter((s) => s !== term);
      localStorage.setItem(storageKey, JSON.stringify([term, ...prev].slice(0, 8)));
    } catch { /* ignore */ }
  }

  function clearRecent() {
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
  }

  useEffect(() => {
    if (isOpen) {
      setValue(currentQuery);
      setRecent(getRecent());
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentQuery]);

  const commit = (term: string) => {
    if (!term.trim()) return;
    saveRecent(term.trim());
    onSearch(term.trim());
    onClose();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commit(value);
    if (e.key === "Escape") onClose();
  };

  const handleClearRecent = () => { clearRecent(); setRecent([]); };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="fixed top-0 left-0 right-0 z-[61] bg-white shadow-2xl rounded-b-2xl max-h-[80vh] flex flex-col"
          >
            {/* Input row */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Search…"
                className="flex-1 text-base outline-none bg-transparent placeholder:text-muted-foreground"
              />
              {value && (
                <button onClick={() => setValue("")} className="p-1 hover:bg-muted rounded-full transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
              <button
                onClick={onClose}
                className="text-primary font-medium text-sm shrink-0 hover:opacity-70 transition-opacity"
              >
                Cancel
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-5">
              {/* Recent */}
              {recent.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Recent
                    </span>
                    <button onClick={handleClearRecent} className="text-xs text-primary hover:underline">
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recent.map((r) => (
                      <button
                        key={r}
                        onClick={() => commit(r)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full text-sm hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular */}
              {popularSearches.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Popular
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((s) => (
                      <button
                        key={s}
                        onClick={() => commit(s)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium hover:bg-primary/20 transition-colors"
                      >
                        {s}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CTA */}
            {value.trim() && (
              <div className="p-4 border-t border-border">
                <button
                  onClick={() => commit(value)}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-xl flex items-center justify-center gap-2 font-medium hover:opacity-90 transition-opacity active:scale-[0.98]"
                >
                  <Search className="w-4 h-4" />
                  Search for &ldquo;{value}&rdquo;
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
