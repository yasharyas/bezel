"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { SearchOverlay } from "bezel-ui/overlays/SearchOverlay";

const STORAGE_KEY = "bezel-preview-recent-searches";

export default function SearchOverlayPreview() {
  const [open, setOpen] = useState(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(["Milk", "Brown bread"]));
    } catch {
      /* storage unavailable: the recent row is simply hidden */
    }
    return true;
  });
  const [query, setQuery] = useState("");

  return (
    <main className="min-h-screen bg-white text-[#0a0a0a]">
      <header className="flex items-center gap-3 border-b border-black/[0.06] px-4 py-3">
        <span className="text-lg font-extrabold tracking-tight">FreshCart</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="ml-auto flex flex-1 items-center gap-2 rounded-xl bg-neutral-100 px-3 py-2 text-sm text-[#4a4a4c]"
        >
          <Search size={15} aria-hidden />
          {query || "Search groceries"}
        </button>
      </header>
      <div className="space-y-3 p-4" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="h-14 w-14 rounded-lg bg-neutral-100" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3 w-2/3 rounded bg-neutral-100" />
              <div className="h-3 w-1/3 rounded bg-neutral-100" />
            </div>
          </div>
        ))}
      </div>
      <SearchOverlay
        isOpen={open}
        onClose={() => setOpen(false)}
        onSearch={setQuery}
        currentQuery={query}
        storageKey={STORAGE_KEY}
        popularSearches={["Atta", "Basmati rice", "Paneer", "Cold coffee"]}
      />
    </main>
  );
}
