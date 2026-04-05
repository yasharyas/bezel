"use client";

import { useState } from "react";
import Link from "next/link";
import { registry } from "@repo/registry";
import {
  GlassButton,
  Card,
  Input,
  TextInput,
  RadioGroup,
  Checkbox,
  DOBPicker,
  FileUpload,
  Stepper,
  StepperNavigation,
  SubmissionLoader,
} from "@repo/ui";

/* ── interactive preview wrappers ── */
function TextInputPreview() {
  const [val, setVal] = useState("");
  return (
    <TextInput
      name="demo-email"
      label="Email Address"
      value={val}
      onChange={setVal}
      placeholder="you@example.com"
      type="email"
      mandatory
    />
  );
}
function RadioGroupPreview() {
  const [val, setVal] = useState("");
  return (
    <RadioGroup
      name="demo-gender"
      label="Gender"
      value={val}
      onChange={setVal}
      options={["Male", "Female", "Other"]}
      mandatory
    />
  );
}
function CheckboxPreview() {
  const [c, setC] = useState(false);
  return (
    <Checkbox
      name="demo-terms"
      label="I agree to the Terms and Conditions"
      checked={c}
      onChange={setC}
      mandatory
    />
  );
}
function DOBPickerPreview() {
  const [v, setV] = useState("");
  return (
    <DOBPicker name="demo-dob" label="Date of Birth" value={v} onChange={setV} mandatory />
  );
}
function FileUploadPreview() {
  const [v, setV] = useState("");
  return <FileUpload name="demo-file" label="Upload Document" value={v} onChange={setV} />;
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
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-2">
        <button
          onClick={() => setPhase("verifying")}
          className="px-3 py-1 text-xs rounded-md bg-indigo-500 text-white"
        >
          Show Loader
        </button>
        <button
          onClick={() => setPhase("complete")}
          className="px-3 py-1 text-xs rounded-md bg-green-500 text-white"
        >
          Show Complete
        </button>
        <button
          onClick={() => setPhase(null)}
          className="px-3 py-1 text-xs rounded-md bg-neutral-600 text-white"
        >
          Hide
        </button>
      </div>
      <SubmissionLoader phase={phase} />
      {phase && (
        <button
          onClick={() => setPhase(null)}
          className="fixed top-4 right-4 z-[60] px-4 py-2 rounded-lg bg-white text-neutral-900 text-sm font-medium shadow-lg hover:bg-neutral-100 transition-colors"
        >
          ✕ Close
        </button>
      )}
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
    <div className="text-neutral-400 text-sm italic">
      SelectInput requires @radix-ui/react-select — see code below for full implementation.
    </div>
  ),
  "file-upload": <FileUploadPreview />,
  stepper: <StepperPreview />,
  "stepper-navigation": <StepperNavPreview />,
  "submission-loader": <SubmissionLoaderPreview />,
  "screen-layout": (
    <div className="text-neutral-400 text-sm italic">
      ScreenLayout is a full-page wrapper — see code below for usage.
    </div>
  ),
};

export default function ComponentDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const entry = registry.find((e) => e.slug === params.slug);
  const [copied, setCopied] = useState(false);

  if (!entry) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Component not found</h1>
          <Link href="/" className="text-indigo-400 hover:text-indigo-300 text-sm">
            &larr; Back to gallery
          </Link>
        </div>
      </main>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(entry.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to gallery
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">{entry.name}</h1>
          <p className="text-neutral-400 mt-1">{entry.prompt}</p>
          <div className="flex gap-2 mt-3">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-white/10 text-neutral-300 border border-white/5"
              >
                {tag}
              </span>
            ))}
            {entry.category && (
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/20">
                {entry.category}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Live preview */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] mb-8 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/70" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <span className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <span className="text-xs text-neutral-500 font-mono ml-2">Preview</span>
        </div>
        <div className="px-8 py-12 flex items-center justify-center min-h-[180px]">
          {previews[entry.slug] ?? (
            <span className="text-neutral-500 text-sm">No preview available</span>
          )}
        </div>
      </section>

      {/* Code block */}
      <section className="rounded-2xl border border-white/10 bg-[#0d1117] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/[0.02]">
          <span className="text-xs text-neutral-500 font-mono">{entry.path}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-md bg-white/10 text-neutral-300 hover:bg-white/20 transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy code
              </>
            )}
          </button>
        </div>
        <pre className="px-6 py-5 overflow-x-auto text-sm text-neutral-300 font-mono leading-relaxed max-h-[600px]">
          <code>{entry.code}</code>
        </pre>
      </section>

      {/* Install hint */}
      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4">
        <p className="text-xs text-neutral-500 font-mono">
          npx yash-ui add {entry.slug}
        </p>
      </div>
    </main>
  );
}
