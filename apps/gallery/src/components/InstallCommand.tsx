import { CopyButton } from "./CopyButton";

export function InstallCommand({ command, label }: { command: string; label: string }) {
  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-xl border border-void-line bg-void-raised py-1 pl-4 pr-1">
      <span aria-hidden className="select-none font-mono text-sm text-void-muted">
        $
      </span>
      <code className="min-w-0 truncate font-mono text-sm text-void-ink">{command}</code>
      <CopyButton value={command} label={label} />
    </div>
  );
}
