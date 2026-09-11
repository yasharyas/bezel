import { CopyButton } from "./CopyButton";

export function CodeBlock({ code, filename }: { code: string; filename: string }) {
  const lines = code.split("\n").length;
  return (
    <section aria-label={`Source of ${filename}`} className="overflow-hidden rounded-2xl border border-void-line bg-[#0a0a0c]">
      <div className="flex items-center justify-between gap-4 border-b border-void-line py-1.5 pl-4 pr-1.5">
        <p className="min-w-0 truncate font-mono text-xs text-void-muted">
          {filename} · {lines} lines
        </p>
        <CopyButton value={code} label={`Copy ${filename} source`} showText />
      </div>
      <pre
        tabIndex={0}
        aria-label={`${filename} source code`}
        className="focus-ring max-h-[640px] overflow-auto px-5 py-4 font-mono text-[13px] leading-relaxed text-void-ink outline-offset-[-4px]"
      >
        <code>{code}</code>
      </pre>
    </section>
  );
}
