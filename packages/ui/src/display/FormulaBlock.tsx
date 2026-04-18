type Props = {
  formula: string;
  caption?: string;
};

export function FormulaBlock({ formula, caption }: Props) {
  return (
    <div className="my-8 p-6 text-center bg-[rgba(5,150,105,0.1)] border border-[#059669] rounded-xl font-mono text-[#0a0a0a] overflow-x-auto break-words"
      style={{ fontSize: "clamp(14px, 4vw, 20px)" }}
    >
      <code className="font-[inherit] bg-transparent p-0">{formula}</code>
      {caption && (
        <div className="mt-2.5 text-xs text-[#4a4a4c] tracking-[0.1em]">{caption}</div>
      )}
    </div>
  );
}
