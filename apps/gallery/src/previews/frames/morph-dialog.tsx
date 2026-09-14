"use client";

import { useState } from "react";
import { MorphDialog } from "bezel-ui/dialogs/MorphDialog";
import { useIdleInterval } from "../kit";

const PEOPLE = [
  { name: "Maya Chen", role: "Can edit", initials: "MC" },
  { name: "Tomás Reyes", role: "Can view", initials: "TR" },
];

const ring =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]";

export default function MorphDialogPreview() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Open and close on a loop while nobody is using the frame.
  useIdleInterval(() => setOpen((current) => !current), 2600);

  return (
    <main className="min-h-screen p-8 text-[#0a0a0a]">
      <div className="mx-auto max-w-[560px]">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#4a4a4c]">Board</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Spring launch plan</h1>
          </div>
          <MorphDialog
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              if (!next) setCopied(false);
            }}
            title="Share this board"
            description="Anyone with the link can view it. Only members can make changes."
            maxWidth={440}
            trigger={
              <button
                type="button"
                className={`inline-flex h-12 items-center rounded-full bg-[#912c22] px-6 text-sm font-semibold text-white ${ring}`}
              >
                Share
              </button>
            }
          >
            {(close) => (
              <div className="space-y-5">
                <div className="flex gap-2">
                  <label className="sr-only" htmlFor="morph-dialog-link">
                    Board link
                  </label>
                  <input
                    id="morph-dialog-link"
                    readOnly
                    value="bezel.app/b/spring-launch"
                    className={`h-12 min-w-0 flex-1 rounded-full border border-black/15 bg-[#fafafa] px-4 text-sm ${ring}`}
                  />
                  <button
                    type="button"
                    onClick={() => setCopied(true)}
                    className={`h-12 shrink-0 rounded-full border border-black/15 px-4 text-sm font-medium hover:bg-black/[0.04] ${ring}`}
                  >
                    {copied ? "Copied" : "Copy link"}
                  </button>
                </div>
                <ul className="divide-y divide-black/[0.06] border-y border-black/[0.06]">
                  {PEOPLE.map((person) => (
                    <li key={person.name} className="flex items-center gap-3 py-3">
                      <span
                        aria-hidden
                        className="grid h-9 w-9 place-items-center rounded-full bg-[#f7f3ee] text-xs font-semibold text-[#912c22]"
                      >
                        {person.initials}
                      </span>
                      <span className="flex-1 text-sm font-medium">{person.name}</span>
                      <span className="text-sm text-[#4a4a4c]">{person.role}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={close}
                    className={`h-12 rounded-full bg-[#0a0a0a] px-6 text-sm font-semibold text-white ${ring}`}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </MorphDialog>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {["Brief", "Design", "Launch"].map((column) => (
            <div key={column} className="rounded-2xl border border-black/[0.06] bg-white p-3">
              <p className="text-xs font-semibold">{column}</p>
              <div className="mt-3 space-y-2">
                <div className="h-10 rounded-xl bg-black/[0.04]" />
                <div className="h-10 rounded-xl bg-black/[0.04]" />
                <div className="h-10 w-2/3 rounded-xl bg-black/[0.04]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
