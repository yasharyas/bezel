"use client";

import { useState } from "react";
import { DualConfirmDialog } from "bezel-ui/dialogs/DualConfirmDialog";

const EVENTS = ["Design review", "Quarterly planning", "Launch retro"];

export default function DualConfirmDialogPreview() {
  const [open, setOpen] = useState(true);
  const [deleted, setDeleted] = useState(false);
  return (
    <main className="min-h-screen p-8 text-[#0a0a0a]">
      <div className="mx-auto max-w-md rounded-2xl border border-black/[0.06] bg-white">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3">
          <p className="text-sm font-semibold">{deleted ? "No events selected" : "3 events selected"}</p>
          <button
            type="button"
            onClick={() => {
              setDeleted(false);
              setOpen(true);
            }}
            className="rounded-md bg-[#b91c1c] px-3 py-1.5 text-xs font-medium text-white"
          >
            Delete
          </button>
        </div>
        <ul className="divide-y divide-black/[0.06] text-sm">
          {EVENTS.map((e) => (
            <li key={e} className="flex items-center gap-3 px-4 py-3">
              <span className={`h-4 w-4 rounded border ${deleted ? "border-black/20" : "border-[#b91c1c] bg-[#b91c1c]"}`} />
              <span className={deleted ? "text-[#6b6b70] line-through" : ""}>{e}</span>
            </li>
          ))}
        </ul>
      </div>
      <DualConfirmDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={() => {
          setDeleted(true);
          setOpen(false);
        }}
        title="Delete events"
        description="These events will be removed for everyone invited."
        itemCount={3}
        itemType="event"
      />
    </main>
  );
}
