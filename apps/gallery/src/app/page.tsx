"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Maximize2, ExternalLink } from "lucide-react";
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
  CustomCursor,
  Preloader,
  SiteHeader,
  MobileMenu,
  ElasticLineDivider,
  CircleCTA,
  ImageReveal,
  FeaturedProjectCard,
  ProjectCard,
  Marquee,
  ContactSection,
  TextDisperseLink,
} from "@repo/ui";
import { registry } from "@repo/registry";

/* ── Stateful preview wrappers ── */
function TextInputPreview() {
  const [v, setV] = useState("");
  return <TextInput name="g-email" label="Email" value={v} onChange={setV} placeholder="you@example.com" type="email" mandatory />;
}
function RadioGroupPreview() {
  const [v, setV] = useState("");
  return <RadioGroup name="g-gender" label="Gender" value={v} onChange={setV} options={["Male", "Female", "Other"]} mandatory />;
}
function CheckboxPreview() {
  const [c, setC] = useState(false);
  return <Checkbox name="g-terms" label="I agree to T&C" checked={c} onChange={setC} mandatory />;
}
function DOBPickerPreview() {
  const [v, setV] = useState("");
  return <DOBPicker name="g-dob" label="Date of Birth" value={v} onChange={setV} mandatory />;
}
function FileUploadPreview() {
  const [v, setV] = useState("");
  return <FileUpload name="g-file" label="Upload" value={v} onChange={setV} />;
}
function StepperPreview() {
  return (
    <Stepper
      steps={[
        { id: "personal", title: "Personal" },
        { id: "address", title: "Address" },
        { id: "review", title: "Review" },
      ]}
      currentStepIndex={1}
      completedStepIds={new Set(["personal"])}
    />
  );
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
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-1.5">
        <button onClick={() => setPhase("verifying")} className="px-2 py-0.5 text-[10px] rounded bg-indigo-500 text-white">Loader</button>
        <button onClick={() => setPhase("complete")} className="px-2 py-0.5 text-[10px] rounded bg-green-500 text-white">Done</button>
        <button onClick={() => setPhase(null)} className="px-2 py-0.5 text-[10px] rounded bg-neutral-600 text-white">Hide</button>
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

function CustomCursorPreview() {
  return (
    <div className="flex flex-col items-center gap-2 text-xs text-neutral-400 text-center px-4">
      <div className="flex gap-2 items-center">
        <div className="w-5 h-5 relative">
          <span className="absolute top-1/2 left-0 w-2 h-0.5 bg-current -translate-y-1/2" />
          <span className="absolute top-1/2 right-0 w-2 h-0.5 bg-current -translate-y-1/2" />
          <span className="absolute left-1/2 top-0 h-2 w-0.5 bg-current -translate-x-1/2" />
          <span className="absolute left-1/2 bottom-0 h-2 w-0.5 bg-current -translate-x-1/2" />
        </div>
        <span>Crosshair cursor</span>
      </div>
      <span className="opacity-50">mix-blend-mode: difference</span>
    </div>
  );
}

function PreloaderPreview() {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col items-center gap-2">
      <button onClick={() => setShow(true)} className="px-3 py-1.5 text-xs rounded-lg bg-neutral-800 text-white">Show Preloader</button>
      {show && <Preloader name="YASH UI." onComplete={() => setShow(false)} />}
    </div>
  );
}

function SiteHeaderPreview() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-black relative" style={{ height: "60px" }}>
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-sm font-semibold text-white">BRAND.</span>
        <div className="flex gap-3 text-xs text-neutral-400">
          <span>Work</span><span>Studio</span><span>Contact</span>
        </div>
        <span className="text-xs border border-white/30 rounded-full px-3 py-1 text-white">GET IN TOUCH</span>
      </div>
    </div>
  );
}

function MobileMenuPreview() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-black border border-white/10">
        <span className="text-sm font-semibold text-white">MK.</span>
        <button onClick={() => setOpen((o) => !o)} className="flex flex-col gap-1 w-6" aria-label="menu">
          <span className={`block h-0.5 bg-white rounded transition-transform ${open ? "translate-y-1.5 rotate-45" : ""}`} />
          <span className={`block h-0.5 bg-white rounded transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 bg-white rounded transition-transform ${open ? "-translate-y-1.5 -rotate-45" : ""}`} />
        </button>
      </div>
      {open && (
        <div className="flex flex-col gap-2 w-full items-center">
          {["Work", "About", "Contact"].map((l) => (
            <span key={l} className="text-sm font-medium uppercase border border-white/20 rounded-full px-4 py-1 text-white">{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function ElasticLineDividerPreview() {
  return (
    <div className="w-full" style={{ color: "white" }}>
      <ElasticLineDivider index="01/" label="works" total="/04" />
    </div>
  );
}

function CircleCTAPreview() {
  return (
    <div style={{ color: "white" }}>
      <CircleCTA href="#" label={"view\nall"} size={8} strokeColor="#fff" />
    </div>
  );
}

function ImageRevealPreview() {
  return (
    <div className="text-neutral-500 text-xs italic text-center px-4">
      ImageReveal — scroll-triggered GSAP clip-path reveal
    </div>
  );
}

function FeaturedProjectCardPreview() {
  return (
    <div className="w-full opacity-80" style={{ color: "white" }}>
      <div className="rounded-xl overflow-hidden aspect-video bg-neutral-800 flex items-center justify-center text-xs text-neutral-500">Image</div>
      <div className="mt-2">
        <div className="text-[10px] uppercase tracking-widest opacity-50">Photography — 2024</div>
        <div className="text-xl font-bold uppercase tracking-tight">Golden Hour</div>
      </div>
    </div>
  );
}

function ProjectCardPreview() {
  return (
    <div className="w-full opacity-80" style={{ color: "white" }}>
      <div className="rounded-xl overflow-hidden aspect-video bg-neutral-800 flex items-center justify-center text-xs text-neutral-500">Image</div>
      <div className="mt-2">
        <div className="text-lg font-bold uppercase tracking-tight">Project Name</div>
        <div className="text-[10px] uppercase tracking-wider opacity-50">Branding</div>
      </div>
    </div>
  );
}

function MarqueePreview() {
  return (
    <div className="w-full overflow-hidden" style={{ color: "white" }}>
      <Marquee text="yash ui" fontSize="4rem" speed={15} opacity={0.6} />
    </div>
  );
}

function ContactSectionPreview() {
  return (
    <div className="w-full scale-75 origin-top">
      <ContactSection
        eyebrow="GOT A PROJECT?"
        heading="LET'S"
        subheading="TALK."
        ctaHref="#"
        headingImageSrc="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop"
      />
    </div>
  );
}

function TextDisperseLinkPreview() {
  return (
    <div style={{ color: "white", fontSize: "1.2rem" }}>
      <TextDisperseLink label="PORTFOLIO" href="#" />
    </div>
  );
}

/* ── Popup-eligible slugs & their larger preview renderers ── */
const popupPreviews: Record<string, () => React.ReactNode> = {
  marquee: () => (
    <div className="w-full overflow-hidden" style={{ color: "white" }}>
      <Marquee text="yash ui" fontSize="7rem" speed={12} opacity={0.9} />
      <Marquee text="components" fontSize="4rem" speed={8} opacity={0.5} separator=" ★ " />
    </div>
  ),
  "contact-section": () => (
    <div className="w-full">
      <ContactSection
        eyebrow="GOT A PROJECT IN MIND?"
        heading="LET'S"
        subheading="TALK."
        ctaHref="#"
        headingImageSrc="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop"
      />
    </div>
  ),
  "project-card": () => (
    <div style={{ color: "white", maxWidth: "280px" }}>
      <ProjectCard
        title="Golden Hour"
        subtitle="Photography · 2024"
        imageSrc="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop"
      />
    </div>
  ),
  "featured-project-card": () => (
    <div style={{ color: "white", width: "100%" }}>
      <FeaturedProjectCard
        title="Golden Hour"
        eyebrow="Photography"
        imageSrc="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop"
        tags={["Photography", "2024"]}
      />
    </div>
  ),
  "elastic-line-divider": () => (
    <div className="w-full" style={{ color: "white" }}>
      <ElasticLineDivider index="01/" label="works" total="/04" />
      <ElasticLineDivider index="02/" label="about" total="/04" />
      <ElasticLineDivider index="03/" label="contact" total="/04" />
    </div>
  ),
  "empty-state": () => (
    <EmptyState title="No events yet" description="Create your first event to get started." onAction={() => {}} />
  ),
  "mobile-menu": () => <MobileMenuPreview />,
  preloader: () => <PreloaderPreview />,
  "site-header": () => <SiteHeaderPreview />,
  "blender-upload": () => (
    <div style={{ width: "320px" }}>
      <BlenderUpload onFileSelect={() => {}} maxSizeMB={10} />
    </div>
  ),
  "circle-cta": () => (
    <div style={{ color: "white" }}>
      <CircleCTA href="#" label={"view\nall"} size={14} strokeColor="#fff" />
    </div>
  ),
  "text-disperse-link": () => (
    <div style={{ color: "white", fontSize: "2.5rem" }}>
      <TextDisperseLink label="PORTFOLIO" href="#" />
    </div>
  ),
  "custom-cursor": () => (
    <div className="text-center" style={{ color: "white" }}>
      <div style={{ display: "inline-flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem", opacity: 0.7 }}>
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
          {["default", "grow"].map((mode) => (
            <div key={mode} style={{ position: "relative", width: "2rem", height: "2rem", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ position: "absolute", top: "50%", left: 0, width: "40%", height: "2px", background: "#fff", transform: "translateY(-50%)" }} />
              <span style={{ position: "absolute", top: "50%", right: 0, width: "40%", height: "2px", background: "#fff", transform: "translateY(-50%)" }} />
              <span style={{ position: "absolute", left: "50%", top: 0, height: "40%", width: "2px", background: "#fff", transform: "translateX(-50%)" }} />
              <span style={{ position: "absolute", left: "50%", bottom: 0, height: "40%", width: "2px", background: "#fff", transform: "translateX(-50%)" }} />
            </div>
          ))}
        </div>
        <p>Crosshair cursor replaces the system cursor</p>
        <p style={{ opacity: 0.5 }}>Uses mix-blend-mode: difference · Grows on [data-cursor-grow]</p>
      </div>
    </div>
  ),
};

const previews: Record<string, React.ReactNode> = {
  "glass-button": <GlassButton>Click Me</GlassButton>,
  card: (
    <Card title="Example Card">
      <p className="text-sm">A reusable glassmorphism card.</p>
    </Card>
  ),
  input: <Input label="Email" placeholder="you@example.com" />,
  "text-input": <TextInputPreview />,
  "radio-group": <RadioGroupPreview />,
  checkbox: <CheckboxPreview />,
  "dob-picker": <DOBPickerPreview />,
  "select-input": (
    <div className="text-neutral-500 text-xs italic text-center px-4">
      SelectInput — Radix UI Select dropdown
    </div>
  ),
  "file-upload": <FileUploadPreview />,
  stepper: <StepperPreview />,
  "stepper-navigation": <StepperNavPreview />,
  "submission-loader": <SubmissionLoaderPreview />,
  "screen-layout": (
    <div className="text-neutral-500 text-xs italic text-center px-4">
      ScreenLayout — Full-page form wrapper
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
  "custom-cursor": <CustomCursorPreview />,
  preloader: <PreloaderPreview />,
  "site-header": <SiteHeaderPreview />,
  "mobile-menu": <MobileMenuPreview />,
  "elastic-line-divider": <ElasticLineDividerPreview />,
  "circle-cta": <CircleCTAPreview />,
  "image-reveal": <ImageRevealPreview />,
  "featured-project-card": <FeaturedProjectCardPreview />,
  "project-card": <ProjectCardPreview />,
  marquee: <MarqueePreview />,
  "contact-section": <ContactSectionPreview />,
  "text-disperse-link": <TextDisperseLinkPreview />,
};

/* ── Category helpers ── */
const ALL = "All";

function getCategories() {
  const cats = new Set<string>();
  registry.forEach((e) => {
    cats.add(e.category || "general");
  });
  return [ALL, ...Array.from(cats)];
}

export default function GalleryPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(ALL);
  const categories = useMemo(getCategories, []);

  const filtered = useMemo(() => {
    return registry.filter((e) => {
      const matchesSearch =
        !search ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory =
        activeCategory === ALL || (e.category || "general") === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  return (
    <main className="min-h-screen">
      {/* ── Hero / Header ── */}
      <header className="border-b border-white/10 bg-white/[0.02] backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">Y</span>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">Yash UI</span>
          </Link>

          {/* Search */}
          <div className="relative max-w-md w-full">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search components..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
            />
          </div>

          <span className="text-neutral-500 text-sm shrink-0">{registry.length} components</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ── Category tabs ── */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 text-sm rounded-full border transition-colors capitalize ${
                activeCategory === cat
                  ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                  : "bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── Component grid — iframe gallery style ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((entry) => (
            <Link
              key={entry.slug}
              href={`/component/${entry.slug}`}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-indigo-500/40 hover:bg-white/[0.05] transition-all duration-200"
            >
              {/* Preview window */}
              <div className="relative">
                {/* Dots bar */}
                <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-1.5 bg-white/[0.02]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                </div>

                {/* Live component preview */}
                <div className="px-6 py-10 flex items-center justify-center min-h-[180px] bg-gradient-to-b from-transparent to-white/[0.01]">
                  <div onClick={(e) => e.preventDefault()} className="pointer-events-auto">
                    {previews[entry.slug] ?? (
                      <span className="text-neutral-600 text-sm">Preview</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card footer */}
              <div className="px-4 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-white truncate group-hover:text-indigo-300 transition-colors">
                    {entry.name}
                  </h3>
                  <p className="text-[11px] text-neutral-500 truncate mt-0.5">{entry.prompt}</p>
                </div>
                <div className="flex gap-1 shrink-0 ml-2">
                  {entry.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 text-[10px] rounded bg-white/10 text-neutral-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-neutral-500">No components match your search.</p>
          </div>
        )}
      </div>
    </main>
  );
}
