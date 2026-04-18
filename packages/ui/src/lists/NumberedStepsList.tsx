type Step = {
  number: string;
  title: string;
  description: string;
};

type Props = {
  steps: Step[];
};

export function NumberedStepsList({ steps }: Props) {
  return (
    <ol className="mt-12 flex flex-col gap-2 list-none p-0">
      {steps.map((step) => (
        <li
          key={step.number}
          className="grid gap-8 py-8 border-t border-black/[0.06]"
          style={{ gridTemplateColumns: "90px 1fr" }}
        >
          <div className="font-mono text-sm text-[#059669] tracking-[0.2em]">
            {step.number}
          </div>
          <div>
            <h3 className="font-serif font-medium text-[28px] text-[#0a0a0a] mt-0 mb-2.5">
              {step.title}
            </h3>
            <p className="text-[#4a4a4c] m-0 text-base">{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
