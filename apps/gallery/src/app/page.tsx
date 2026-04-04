"use client";

import { useState } from "react";
import { GlassButton, Card, Input, TextInput, RadioGroup, Checkbox, DOBPicker, FileUpload, Stepper, StepperNavigation, SubmissionLoader, ScreenLayout } from "@repo/ui";
import { registry } from "@repo/registry";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="px-3 py-1 text-xs rounded-md bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function TextInputPreview() {
  const [val, setVal] = useState("");
  return <TextInput name="demo-email" label="Email Address" value={val} onChange={setVal} placeholder="you@example.com" type="email" mandatory />;
}

function RadioGroupPreview() {
  const [val, setVal] = useState("");
  return <RadioGroup name="demo-gender" label="Gender" value={val} onChange={setVal} options={["Male", "Female", "Other"]} mandatory />;
}

function CheckboxPreview() {
  const [checked, setChecked] = useState(false);
  return <Checkbox name="demo-terms" label="I agree to the Terms and Conditions" checked={checked} onChange={setChecked} mandatory />;
}

function DOBPickerPreview() {
  const [val, setVal] = useState("");
  return <DOBPicker name="demo-dob" label="Date of Birth" value={val} onChange={setVal} mandatory />;
}

function FileUploadPreview() {
  const [val, setVal] = useState("");
  return <FileUpload name="demo-file" label="Upload Document" value={val} onChange={setVal} />;
}

function StepperPreview() {
  const steps = [
    { id: "personal", title: "Personal" },
    { id: "address", title: "Address" },
    { id: "review", title: "Review" },
  ];
  return <Stepper steps={steps} currentStepIndex={1} completedStepIds={new Set(["personal"])} />;
}

function StepperNavPreview() {
  return (
    <StepperNavigation
      currentStepIndex={1}
      totalSteps={3}
      isLastStep={false}
      onPrevious={() => {}}
      onNext={() => {}}
      onSubmit={() => {}}
    />
  );
}

function SubmissionLoaderPreview() {
  const [phase, setPhase] = useState<"verifying" | "complete" | null>(null);
  return (
    <div className="flex gap-2">
      <button onClick={() => setPhase("verifying")} className="px-3 py-1 text-xs rounded-md bg-indigo-500 text-white">Show Loader</button>
      <button onClick={() => setPhase("complete")} className="px-3 py-1 text-xs rounded-md bg-green-500 text-white">Show Complete</button>
      <button onClick={() => setPhase(null)} className="px-3 py-1 text-xs rounded-md bg-neutral-500 text-white">Hide</button>
      <SubmissionLoader phase={phase} />
    </div>
  );
}

const previews: Record<string, React.ReactNode> = {
  "glass-button": <GlassButton>Click Me</GlassButton>,
  card: (
    <Card title="Example Card">
      <p>This is a reusable card component with glassmorphism styling.</p>
    </Card>
  ),
  input: <Input label="Email" placeholder="you@example.com" />,
  "text-input": <TextInputPreview />,
  "radio-group": <RadioGroupPreview />,
  checkbox: <CheckboxPreview />,
  "dob-picker": <DOBPickerPreview />,
  "select-input": (
    <div className="text-neutral-500 text-sm italic">
      SelectInput requires @radix-ui/react-select — see code for full implementation.
    </div>
  ),
  "file-upload": <FileUploadPreview />,
  stepper: <StepperPreview />,
  "stepper-navigation": <StepperNavPreview />,
  "submission-loader": <SubmissionLoaderPreview />,
  "screen-layout": (
    <div className="text-neutral-500 text-sm italic">
      ScreenLayout is a full-page wrapper — see code for usage.
    </div>
  ),
};

export default function GalleryPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-white mb-2">Yash UI</h1>
      <p className="text-white/60 mb-10">Component gallery — preview, copy, and use.</p>

      <div className="grid gap-8">
        {registry.map((entry) => (
          <div
            key={entry.slug}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <h2 className="text-lg font-semibold text-white">{entry.name}</h2>
                <p className="text-sm text-white/50">{entry.prompt}</p>
              </div>
              <div className="flex gap-2">
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-white/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="px-6 py-8 flex items-center justify-center bg-white/[0.02]">
              {previews[entry.slug]}
            </div>

            {/* Code */}
            <div className="border-t border-white/10">
              <div className="flex items-center justify-between px-6 py-2 bg-white/[0.03]">
                <span className="text-xs text-white/40 font-mono">{entry.path}</span>
                <CopyButton text={entry.code} />
              </div>
              <pre className="px-6 py-4 overflow-x-auto text-sm text-white/70 font-mono leading-relaxed">
                <code>{entry.code}</code>
              </pre>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
