import { CopyButton } from "./CopyButton";

export function InstallCommand({ command, label }: { command: string; label: string }) {
  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-xl border border-void-line bg-void-raised py-1 pl-4 pr-1">
      <span aria-hidden className="select-none font-mono text-sm text-void-muted">
        $
      </span>
      {/* Wraps rather than truncates: on a phone the longest slug does not fit
          on one line, and an ellipsis would hide the command someone is here
          to read. It breaks at the spaces and hyphens it already has. */}
      <code className="min-w-0 break-words font-mono text-sm text-void-ink">{command}</code>
      <CopyButton value={command} label={label} />
    </div>
  );
}
