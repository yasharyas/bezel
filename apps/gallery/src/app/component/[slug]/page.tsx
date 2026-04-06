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
  TypewriterLoader,
  ToastContainer,
  useToast,
  ToolbarButton,
  CollapsibleSidebar,
  SidePanel,
  PanelField,
  PanelInput,
  NodeCard,
  TubelightNavBar,
  MD3Switch,
  DualConfirmDialog,
  BlenderUpload,
  EmptyState,
  CustomCheckbox,
  GradientCheckbox,
  TransformerCheckbox,
  AnimatedCheckbox,
  LoadingSpinner,
  PriceBreakdown,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@repo/ui";

/* ── interactive preview wrappers ── */
function ToastPreview() {
  const { toasts, show } = useToast();
  return (
    <div className="flex flex-col items-center gap-2">
      <button onClick={() => show("Component copied!")} className="px-3 py-1.5 text-xs rounded-lg bg-neutral-800 text-white">Show Toast</button>
      <ToastContainer toasts={toasts} />
    </div>
  );
}

function ToolbarButtonPreview() {
  return (
    <div className="flex gap-1 p-2 rounded-xl bg-neutral-50 border border-neutral-100">
      <ToolbarButton icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>} onClick={() => {}} title="Search" />
      <ToolbarButton icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>} onClick={() => {}} title="Add" />
      <ToolbarButton icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M4 7h16"/></svg>} onClick={() => {}} disabled title="Delete (disabled)" />
    </div>
  );
}

function CollapsibleSidebarPreview() {
  const categories = [
    { label: "Triggers", items: [{ id: "webhook", label: "Webhook", description: "HTTP trigger", color: "#3b82f6", icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> }] },
    { label: "Actions", items: [{ id: "email", label: "Send Email", description: "Email action", color: "#22c55e", icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg> }] },
  ];
  return <div className="h-48 overflow-hidden rounded-xl border border-neutral-200"><CollapsibleSidebar title="Nodes" categories={categories} searchPlaceholder="Search nodes..." /></div>;
}

function SidePanelPreview() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-center gap-2">
      <button onClick={() => setOpen(true)} className="px-3 py-1.5 text-xs rounded-lg bg-neutral-800 text-white">Open Panel</button>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="flex-1" onClick={() => setOpen(false)} />
          <SidePanel title="Edit Node" onClose={() => setOpen(false)}>
            <PanelField label="Name"><PanelInput placeholder="Node name..." /></PanelField>
            <PanelField label="Description"><PanelInput placeholder="Description..." /></PanelField>
          </SidePanel>
        </div>
      )}
    </div>
  );
}

function NodeCardPreview() {
  const [selected, setSelected] = useState(false);
  return (
    <NodeCard
      label="Send Email"
      description="Sends a templated email"
      icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>}
      accentColor="#3b82f6"
      selected={selected}
      onClick={() => setSelected((s) => !s)}
    />
  );
}

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

function TubelightNavBarPreview() {
  const [active, setActive] = useState("Events");
  const items = ["Home", "Events", "Settings"];
  return (
    <div className="flex items-center gap-1 bg-white/5 border border-white/10 py-0.5 px-0.5 rounded-full shadow-lg">
      {items.map((name) => {
        const isActive = active === name;
        return (
          <button
            key={name}
            onClick={() => setActive(name)}
            className={`relative cursor-pointer text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${isActive ? "bg-white/10 text-indigo-400" : "text-neutral-400 hover:text-white"}`}
          >
            {name}
            {isActive && (
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-indigo-400 rounded-t-full">
                <div className="absolute w-8 h-4 bg-indigo-400/20 rounded-full blur-md -top-1.5 -left-1" />
                <div className="absolute w-6 h-4 bg-indigo-400/20 rounded-full blur-md -top-0.5" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function MD3SwitchPreview() {
  const [on1, setOn1] = useState(false);
  const [on2, setOn2] = useState(true);
  return (
    <div className="flex flex-col gap-3 items-center">
      <MD3Switch onCheckedChange={setOn1} checked={on1} showIcons />
      <MD3Switch variant="destructive" size="sm" checked={on2} onCheckedChange={setOn2} showIcons />
    </div>
  );
}

function DualConfirmDialogPreview() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
      >
        Delete 3 items
      </button>
      <DualConfirmDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={() => setOpen(false)}
        title="Delete Events"
        description="You are about to delete the selected events."
        itemCount={3}
        itemType="event"
      />
    </div>
  );
}

function BlenderUploadPreview() {
  return (
    <div className="w-full max-w-xs">
      <BlenderUpload onFileSelect={() => {}} maxSizeMB={5} />
    </div>
  );
}

function EmptyStatePreview() {
  return (
    <div className="scale-75 origin-top">
      <EmptyState
        title="No events yet"
        description="Create your first event to get started."
        onAction={() => {}}
      />
    </div>
  );
}

function CheckboxVariantsPreview() {
  return (
    <div className="flex gap-5 items-center">
      <CustomCheckbox defaultChecked />
      <GradientCheckbox defaultChecked />
      <TransformerCheckbox defaultChecked />
      <AnimatedCheckbox defaultChecked />
    </div>
  );
}

function LoadingSpinnerPreview() {
  return (
    <div className="flex gap-6 items-center">
      <LoadingSpinner size="sm" />
      <LoadingSpinner size="md" />
      <LoadingSpinner size="lg" />
    </div>
  );
}

function PriceBreakdownPreview() {
  return (
    <div className="w-full max-w-xs">
      <PriceBreakdown price={999} gstPercent={18} priceLabel="Ticket Price" />
    </div>
  );
}

function PaginationPreview() {
  const [page, setPage] = useState(2);
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }} />
        </PaginationItem>
        {[1, 2, 3].map((p) => (
          <PaginationItem key={p}>
            <PaginationLink href="#" isActive={page === p} onClick={(e) => { e.preventDefault(); setPage(p); }}>
              {p}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem><PaginationEllipsis /></PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage((p) => p + 1); }} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
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
  "typewriter-loader": <TypewriterLoader />,
  "toast-container": <ToastPreview />,
  "toolbar-button": <ToolbarButtonPreview />,
  "collapsible-sidebar": <CollapsibleSidebarPreview />,
  "side-panel": <SidePanelPreview />,
  "node-card": <NodeCardPreview />,
  "tubelight-navbar": <TubelightNavBarPreview />,
  "md3-switch": <MD3SwitchPreview />,
  "dual-confirm-dialog": <DualConfirmDialogPreview />,
  "blender-upload": <BlenderUploadPreview />,
  "empty-state": <EmptyStatePreview />,
  "checkbox-variants": <CheckboxVariantsPreview />,
  "loading-spinner": <LoadingSpinnerPreview />,
  "price-breakdown": <PriceBreakdownPreview />,
  pagination: <PaginationPreview />,
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
