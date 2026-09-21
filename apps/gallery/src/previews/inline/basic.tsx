"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  Bold,
  Clock,
  FolderOpen,
  Italic,
  Link2,
  Mail,
  MessageSquare,
  Redo2,
  Send,
  Underline,
  Undo2,
  Zap,
  ClipboardList,
  Hammer,
  Rocket,
} from "lucide-react";

import { GlassButton } from "bezel-ui/GlassButton";
import { Card } from "bezel-ui/Card";
import { TextInput } from "bezel-ui/forms/TextInput";
import { MD3Switch } from "bezel-ui/forms/MD3Switch";
import { BlenderUpload } from "bezel-ui/forms/BlenderUpload";
import {
  AnimatedCheckbox,
  CustomCheckbox,
  GradientCheckbox,
  TransformerCheckbox,
} from "bezel-ui/forms/CheckboxVariants";
import { Stepper } from "bezel-ui/navigation/Stepper";
import { TypewriterLoader } from "bezel-ui/feedback/TypewriterLoader";
import { ToolbarButton } from "bezel-ui/buttons/ToolbarButton";
import { CollapsibleSidebar } from "bezel-ui/navigation/CollapsibleSidebar";
import { PanelDeleteButton, PanelField, PanelInput, SidePanel } from "bezel-ui/panels/SidePanel";
import { NodeCard } from "bezel-ui/cards/NodeCard";
import { EmptyState } from "bezel-ui/feedback/EmptyState";
import { LoadingSpinner } from "bezel-ui/feedback/LoadingSpinner";
import { PriceBreakdown } from "bezel-ui/cards/PriceBreakdown";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "bezel-ui/navigation/Pagination";
import { ElasticLineDivider } from "bezel-ui/dividers/ElasticLineDivider";
import { ProjectCard } from "bezel-ui/cards/ProjectCard";
import { ImageWithFallback } from "bezel-ui/media/ImageWithFallback";
import { SkeletonCard } from "bezel-ui/loaders/SkeletonCard";
import { TestimonialCard } from "bezel-ui/cards/TestimonialCard";
import { ImagePlaceholder } from "bezel-ui/feedback/ImagePlaceholder";
import { ShinyBadge } from "bezel-ui/badges/ShinyBadge";
import { BorderBeamButton } from "bezel-ui/buttons/BorderBeamButton";
import { CardGrid } from "bezel-ui/cards/CardGrid";
import { NumberedStepsList } from "bezel-ui/lists/NumberedStepsList";
import { FormulaBlock } from "bezel-ui/display/FormulaBlock";
import { CalloutBox } from "bezel-ui/callouts/CalloutBox";
import { Checklist } from "bezel-ui/lists/Checklist";
import { ScrollReveal } from "bezel-ui/animation/ScrollReveal";
import { SiteFooter } from "bezel-ui/layout/SiteFooter";
import { DepthText } from "bezel-ui/display/DepthText";
import { Magnet } from "bezel-ui/interaction/Magnet";
import { GlareHover } from "bezel-ui/interaction/GlareHover";
import { CinematicWaterBackground } from "bezel-ui/media/CinematicWaterBackground";
import { PointerGlowCard } from "bezel-ui/cards/PointerGlowCard";
import { ShinyGradientText } from "bezel-ui/display/ShinyGradientText";
import { BlurInReveal } from "bezel-ui/animation/BlurInReveal";
import { SectionProgressRail } from "bezel-ui/navigation/SectionProgressRail";
import { EdgeFadeMarquee } from "bezel-ui/animation/EdgeFadeMarquee";
import { StaggerBlurText } from "bezel-ui/animation/StaggerBlurText";
import { AnimatedGradientRule } from "bezel-ui/dividers/AnimatedGradientRule";
import { CanvasPetalField } from "bezel-ui/animation/CanvasPetalField";
import { FilmGrainOverlay } from "bezel-ui/overlays/FilmGrainOverlay";
import { ScratchFoilReveal } from "bezel-ui/interaction/ScratchFoilReveal";
import { PixelDemorphImage } from "bezel-ui/media/PixelDemorphImage";
import { TillReceiptPrint } from "bezel-ui/feedback/TillReceiptPrint";
import { PinchedButton } from "bezel-ui/buttons/PinchedButton";
import { MetallicLogoShimmer } from "bezel-ui/media/MetallicLogoShimmer";
import { ParticleQrCode } from "bezel-ui/display/ParticleQrCode";
import { TimedTabs } from "bezel-ui/navigation/TimedTabs";
import { GlyphField } from "bezel-ui/animation/GlyphField";
import { DockingCard } from "bezel-ui/cards/DockingCard";
import { AutoplayCarousel } from "bezel-ui/media/AutoplayCarousel";
import { SketchHighlight } from "bezel-ui/animation/SketchHighlight";
import { SketchArrow } from "bezel-ui/callouts/SketchArrow";

import {
  Caption,
  Center,
  IMAGES,
  WORDMARK,
  sweep,
  useIdleInterval,
  useLoopKey,
} from "../kit";
import type { PreviewModule } from "../types";

const noop = () => {};

/** Two soft colour fields, so glass components have something to blur. */
function GlassBackdrop({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div aria-hidden className="absolute -left-10 top-6 h-40 w-40 rounded-full bg-[#912c22] opacity-60 blur-3xl" />
      <div aria-hidden className="absolute -right-6 bottom-2 h-44 w-44 rounded-full bg-[#c9a227] opacity-40 blur-3xl" />
      <div className="relative">{children}</div>
    </div>
  );
}

/** A dotted canvas, for components that live on a workflow editor. */
const canvasStyle: CSSProperties = {
  backgroundImage: "radial-gradient(rgba(10,10,10,0.12) 1px, transparent 1px)",
  backgroundSize: "16px 16px",
};

/* ------------------------------------------------------------------ root */

function GlassButtonPreview() {
  return (
    <GlassBackdrop>
      <div className="flex items-center gap-3">
        <GlassButton>Continue</GlassButton>
        <GlassButton disabled>Disabled</GlassButton>
      </div>
    </GlassBackdrop>
  );
}

function CardPreview() {
  return (
    <GlassBackdrop>
      <Card title="Weekly digest" className="w-64">
        <p className="text-sm leading-relaxed">Twelve components shipped this week. Three are waiting on review.</p>
      </Card>
    </GlassBackdrop>
  );
}

/* ----------------------------------------------------------------- forms */

function TextInputPreview() {
  const [name, setName] = useState("Aarav Mehta");
  const [email, setEmail] = useState("aarav@");
  const id = useId();
  return (
    <Center>
      <div className="flex w-[280px] flex-col gap-4">
        <TextInput name={`${id}-name`} label="Full name" value={name} onChange={setName} mandatory />
        <TextInput
          name={`${id}-email`}
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          error={/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? undefined : "Enter a valid email address"}
        />
      </div>
    </Center>
  );
}

function MD3SwitchPreview() {
  const [wifi, setWifi] = useState(true);
  const [bluetooth, setBluetooth] = useState(false);
  const [erase, setErase] = useState(true);
  const row = "flex items-center justify-between gap-6 py-1";
  return (
    <Center>
      <div className="w-[260px] divide-y divide-black/[0.06] text-sm text-[#0a0a0a]">
        <div className={row}>
          <span>Wi-Fi</span>
          <MD3Switch aria-label="Wi-Fi" checked={wifi} onCheckedChange={setWifi} showIcons />
        </div>
        <div className={row}>
          <span>Bluetooth</span>
          <MD3Switch aria-label="Bluetooth" checked={bluetooth} onCheckedChange={setBluetooth} showIcons />
        </div>
        <div className={row}>
          <span>Erase data on exit</span>
          <MD3Switch aria-label="Erase data on exit" variant="destructive" size="sm" checked={erase} onCheckedChange={setErase} />
        </div>
      </div>
    </Center>
  );
}

function BlenderUploadPreview() {
  return <BlenderUpload onFileSelect={noop} maxSizeMB={5} />;
}

const CHECKBOX_VARIANTS = [
  { label: "Pop", Field: CustomCheckbox },
  { label: "Glow", Field: GradientCheckbox },
  { label: "Morph", Field: TransformerCheckbox },
  { label: "Pulse", Field: AnimatedCheckbox },
] as const;

function CheckboxVariantsPreview() {
  // Each treatment only exists in the change between states, so while nobody is
  // pointing at or focused inside the card the four boxes tick themselves in
  // turn. useIdleInterval stops the loop on engagement and reduced motion.
  const [checked, setChecked] = useState([true, false, true, false]);
  const [turn, setTurn] = useState(0);
  useIdleInterval(() => {
    const at = turn % CHECKBOX_VARIANTS.length;
    setChecked((prev) => prev.map((value, i) => (i === at ? !value : value)));
    setTurn((t) => t + 1);
  }, 800);
  const set = (index: number, value: boolean) =>
    setChecked((prev) => prev.map((was, i) => (i === index ? value : was)));
  return (
    <Center>
      <div className="flex items-end gap-9 text-[#4a4a4c]">
        {CHECKBOX_VARIANTS.map((item, index) => (
          <div key={item.label} className="flex flex-col items-center gap-4">
            <div className="grid h-10 place-items-center">
              <item.Field
                aria-label={item.label}
                checked={checked[index]}
                onChange={(event) => set(index, event.target.checked)}
              />
            </div>
            <Caption>{item.label}</Caption>
          </div>
        ))}
      </div>
    </Center>
  );
}

/* -------------------------------------------------------------- feedback */

function TypewriterLoaderPreview() {
  return (
    <Center>
      <div className="flex flex-col items-center gap-8">
        <TypewriterLoader />
        <p className="text-sm text-[#4a4a4c]">Drafting your contract</p>
      </div>
    </Center>
  );
}

function EmptyStatePreview() {
  return (
    <div className="text-[#0a0a0a]">
      <EmptyState
        icon={
          <span className="preview-float block">
            <FolderOpen size={44} strokeWidth={1.25} />
          </span>
        }
        title="No projects yet"
        description="Projects you create, or are invited to, will show up here."
        actionLabel="New project"
        onAction={noop}
      />
    </div>
  );
}

function LoadingSpinnerPreview() {
  return (
    <Center>
      <div className="flex items-end gap-10 text-[#4a4a4c]">
        {(["sm", "md", "lg"] as const).map((size) => (
          <div key={size} className="flex flex-col items-center gap-4">
            <div className="grid h-12 place-items-center">
              <LoadingSpinner size={size} />
            </div>
            <Caption>{size}</Caption>
          </div>
        ))}
      </div>
    </Center>
  );
}

function ImagePlaceholderPreview() {
  return (
    <Center>
      <div className="flex items-stretch gap-3">
        <ImagePlaceholder aspectRatio="4/3" className="w-44" label="Cover photo" />
        <div className="flex flex-col gap-3">
          <ImagePlaceholder aspectRatio="1/1" className="w-[58px]" rounded="rounded-lg" />
          <ImagePlaceholder aspectRatio="1/1" className="w-[58px]" rounded="rounded-lg" />
        </div>
      </div>
    </Center>
  );
}

function TillReceiptPrintPreview() {
  return (
    <div className="flex justify-center">
      <TillReceiptPrint
        brand="Bezel"
        amount="₹2,499"
        rows={[
          { label: "Order", value: "BZ-1042", mono: true },
          { label: "Plan", value: "Studio, yearly" },
          { label: "Paid with", value: "UPI" },
        ]}
        footer="Thank you for your order."
      />
    </div>
  );
}

/* ------------------------------------------------------------ navigation */

const WIZARD_STEPS = [
  { id: "account", title: "Account" },
  { id: "address", title: "Address" },
  { id: "payment", title: "Payment" },
  { id: "review", title: "Review" },
];

function StepperPreview() {
  // Walks the wizard forward while the card is idle, so the completed, current
  // and pending states are all visible without touching it.
  const [index, setIndex] = useState(2);
  useIdleInterval(() => setIndex((i) => (i + 1) % WIZARD_STEPS.length), 1600);
  const completed = new Set(WIZARD_STEPS.slice(0, index).map((step) => step.id));
  return (
    <Center>
      <div className="w-[340px]">
        <Stepper steps={WIZARD_STEPS} currentStepIndex={index} completedStepIds={completed} />
      </div>
    </Center>
  );
}

function CollapsibleSidebarPreview() {
  const icon = (node: ReactNode) => node;
  return (
    <div className="flex h-full w-full text-left">
      <CollapsibleSidebar
        title="Nodes"
        searchPlaceholder="Search nodes"
        categories={[
          {
            label: "Triggers",
            items: [
              { id: "webhook", label: "Webhook", description: "On an HTTP request", color: "#2563eb", icon: icon(<Zap size={14} />) },
              { id: "schedule", label: "Schedule", description: "Every weekday at 9", color: "#7c3aed", icon: icon(<Clock size={14} />) },
            ],
          },
          {
            label: "Actions",
            items: [
              { id: "email", label: "Send email", description: "Templated message", color: "#047857", icon: icon(<Mail size={14} />) },
              { id: "slack", label: "Post to Slack", description: "Channel message", color: "#b45309", icon: icon(<MessageSquare size={14} />) },
            ],
          },
        ]}
      />
      <div className="flex flex-1 items-center justify-center p-4 text-center text-xs text-[#6b6b70]" style={canvasStyle}>
        Drag a node onto the canvas
      </div>
    </div>
  );
}

function SidePanelPreview() {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex h-full w-full text-left">
      <div className="flex flex-1 items-center justify-center p-4" style={canvasStyle}>
        {open ? (
          <div className="rounded-xl border-2 border-[#047857] bg-white px-3 py-2 text-xs font-semibold text-[#0a0a0a] shadow-sm">
            Send email
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full bg-[#0a0a0a] px-3 py-1.5 text-xs font-medium text-white"
          >
            Open panel
          </button>
        )}
      </div>
      {open ? (
        <SidePanel
          title="Send email"
          onClose={() => setOpen(false)}
          headerLeft={<Send size={14} className="text-[#047857]" />}
          footer={<PanelDeleteButton onClick={() => setOpen(false)} label="Delete node" />}
        >
          <PanelField label="Recipient">
            <PanelInput aria-label="Recipient" defaultValue="team@bezel.dev" />
          </PanelField>
          <PanelField label="Subject">
            <PanelInput aria-label="Subject" defaultValue="Weekly report" />
          </PanelField>
        </SidePanel>
      ) : null}
    </div>
  );
}

function NodeCardPreview() {
  const [selected, setSelected] = useState("email");
  return (
    <div className="flex h-full w-full items-center justify-center" style={canvasStyle}>
      <div className="flex flex-col items-center">
        <NodeCard
          label="Webhook received"
          description="POST /orders"
          icon={<Zap size={14} />}
          accentColor="#2563eb"
          selected={selected === "webhook"}
          onClick={() => setSelected("webhook")}
        />
        <div aria-hidden className="h-7 w-px bg-[#0a0a0a]/25" />
        <NodeCard
          label="Send email"
          description="Order confirmation"
          icon={<Mail size={14} />}
          accentColor="#047857"
          selected={selected === "email"}
          onClick={() => setSelected("email")}
        />
      </div>
    </div>
  );
}

function PaginationPreview() {
  const total = 10;
  const [page, setPage] = useState(5);
  const go = (p: number) => (event: React.MouseEvent) => {
    event.preventDefault();
    setPage(Math.min(total, Math.max(1, p)));
  };
  const pages = [page - 1, page, page + 1].filter((p) => p > 1 && p < total);
  return (
    <div className="flex flex-col items-center gap-3 text-[#0a0a0a]">
      <p className="text-sm text-[#4a4a4c]">
        Page {page} of {total}
      </p>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" onClick={go(page - 1)} />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" isActive={page === 1} onClick={go(1)}>
              1
            </PaginationLink>
          </PaginationItem>
          {pages[0] > 2 ? (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          ) : null}
          {pages.map((p) => (
            <PaginationItem key={p}>
              <PaginationLink href="#" isActive={page === p} onClick={go(p)}>
                {p}
              </PaginationLink>
            </PaginationItem>
          ))}
          {pages[pages.length - 1] < total - 1 ? (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          ) : null}
          <PaginationItem>
            <PaginationLink href="#" isActive={page === total} onClick={go(total)}>
              {total}
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" onClick={go(page + 1)} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

/* --------------------------------------------------------------- surfaces */

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#047857]">{eyebrow}</p>
      <h3 className="mt-2 font-serif text-3xl font-medium text-[#0a0a0a]">{title}</h3>
    </div>
  );
}

function PriceBreakdownPreview() {
  return (
    <Center>
      <div className="w-[300px] text-[#0a0a0a]">
        <PriceBreakdown price={1499} gstPercent={18} priceLabel="Workshop ticket" />
      </div>
    </Center>
  );
}

function ProjectCardPreview() {
  return (
    <div className="grid grid-cols-2 gap-5 text-white">
      <ProjectCard title="Tideline" subtitle="Identity · 2026" imageSrc={IMAGES.lake} imageAlt="Mountain lake" />
      <ProjectCard title="Canopy" subtitle="Campaign · 2025" imageSrc={IMAGES.forest} imageAlt="Forest canopy" />
    </div>
  );
}

function ImageWithFallbackPreview() {
  const figure = "flex flex-col items-center gap-2";
  return (
    <Center>
      <div className="flex items-start gap-6 text-[#4a4a4c]">
        <div className={figure}>
          <ImageWithFallback
            src={IMAGES.lake}
            alt="Mountain lake"
            className="h-28 w-28 rounded-xl object-cover"
          />
          <Caption>Loaded</Caption>
        </div>
        <div className={figure}>
          {/* A syntactically valid but undecodable image: fails without a network request. */}
          <ImageWithFallback
            src="data:image/png;base64,AAAA"
            alt="Product photo"
            className="h-28 w-28 rounded-xl"
          />
          <Caption>Fallback</Caption>
        </div>
      </div>
    </Center>
  );
}

function SkeletonCardPreview() {
  return (
    <Center>
      <div className="grid w-[270px] grid-cols-2 gap-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </Center>
  );
}

function TestimonialCardPreview() {
  return (
    <Center>
      <div className="w-[300px]">
        <TestimonialCard
          testimonial={{
            rating: 5,
            text: "Delivered on time, and the packaging kept every tier of the cake intact.",
            name: "Priya Sharma",
            role: "Verified buyer",
          }}
        />
      </div>
    </Center>
  );
}

function ShinyBadgePreview() {
  return (
    <Center>
      <div className="flex flex-col items-center gap-4 text-center">
        <ShinyBadge spark="✦" text="Keyboard focus on every control" />
        <h3 className="max-w-[260px] font-serif text-2xl font-medium leading-tight text-[#0a0a0a]">
          Components with a point of view
        </h3>
      </div>
    </Center>
  );
}

const BORDER_BEAM_VARIANTS = [
  { fill: "ink", label: "Get started", caption: "Ink, beam" },
  { fill: "ghost", label: "Read the docs", caption: "Ghost, beam" },
  { fill: "jade", label: "Shop the box", caption: "Jade, conic" },
  { fill: "cream", label: "Save draft", caption: "Cream, star" },
  { fill: "crimson", label: "Continue", caption: "Crimson, star" },
  { fill: "gold", label: "Upgrade", caption: "Gold, star" },
] as const;

function BorderBeamButtonPreview() {
  return (
    <Center>
      <div className="grid grid-cols-3 items-end justify-items-center gap-x-6 gap-y-6">
        {BORDER_BEAM_VARIANTS.map((item) => (
          <div key={item.fill} className="flex flex-col items-center gap-2">
            <BorderBeamButton fill={item.fill} label={item.label} />
            <Caption className="text-ink-muted">{item.caption}</Caption>
          </div>
        ))}
      </div>
    </Center>
  );
}

function CardGridPreview() {
  return (
    <div className="bg-white p-8 flex flex-col gap-8">
      <div>
        <SectionHeading eyebrow="What you get" title="Built for teams that ship" />
        <CardGrid
          items={[
            { eyebrow: "Platform", title: "One workspace for every signal" },
            { eyebrow: "Agent", title: "Automations that explain themselves" },
            { eyebrow: "API", title: "Typed endpoints for your stack" },
          ]}
        />
      </div>
      <div>
        <SectionHeading eyebrow="Framework" title="Four questions, one signal" />
        <CardGrid
          columns="fit"
          eyebrow="letter"
          items={[
            { eyebrow: "M", title: "Mode", subtitle: "How is it perceived?", description: "Text, image, audio" },
            { eyebrow: "G", title: "Genre", subtitle: "What form is it?", description: "Brief, spec, report" },
            { eyebrow: "T", title: "Type", subtitle: "What does it do?", description: "Inform, direct, commit" },
            { eyebrow: "F", title: "Format", subtitle: "What holds it?", description: "Doc, message, video" },
          ]}
        />
      </div>
      <div>
        <SectionHeading eyebrow="Diagnosis" title="Where the process breaks" />
        <CardGrid
          columns={2}
          eyebrow="tag"
          serifTitles
          items={[
            { eyebrow: "Overload", title: "Too many channels", description: "Messages arrive faster than anyone can read them." },
            { eyebrow: "Gap", title: "No feedback loop", description: "Errors repeat because outcomes never return." },
          ]}
        />
      </div>
    </div>
  );
}

function NumberedStepsListPreview() {
  return (
    <div className="px-8 py-7">
      <NumberedStepsList
        steps={[
          { number: "01", title: "Discovery", description: "Map goals and constraints before writing code." },
          { number: "02", title: "Design", description: "Agree the system and its boundaries." },
          { number: "03", title: "Build", description: "Ship weekly, review every Friday." },
        ]}
      />
    </div>
  );
}

function FormulaBlockPreview() {
  return (
    <div className="px-8 py-2">
      <FormulaBlock formula="conversion = signups ÷ visitors" caption="Weekly conversion rate" />
    </div>
  );
}

function CalloutBoxPreview() {
  return (
    <div className="px-8 pb-7">
      <CalloutBox
        title="Why launches slip"
        intro="Teams optimise for speed and quietly drop review."
        label="Diagnosis"
        items={[
          { symbol: "!", content: <><b>Scope</b> grows after the estimate.</> },
          { symbol: "!", content: <><b>Review</b> happens once, at the end.</> },
          { symbol: "!", content: <><b>Ownership</b> is shared, so it is nobody&rsquo;s.</> },
        ]}
        footer="Better tooling is not the fix. A smaller loop is."
      />
    </div>
  );
}

function ChecklistPreview() {
  return (
    <div className="px-8 py-2">
      <Checklist
        items={[
          { symbol: "✓", text: "Every control shows keyboard focus" },
          { symbol: "✓", text: "Text clears 4.5:1 on its surface" },
          { symbol: "✓", text: "Ambient motion stops when asked" },
          { symbol: "✓", text: "Errors are announced, not only shown" },
        ]}
      />
    </div>
  );
}

function SiteFooterPreview() {
  return (
    <div>
      <SiteFooter
        brandName="Bezel"
        tagline="Motion, craft and a contrast gate."
        columns={[
          { heading: "Product", links: [{ label: "Components", href: "#c" }, { label: "Principles", href: "#p" }] },
          { heading: "Company", links: [{ label: "About", href: "#a" }, { label: "Journal", href: "#j" }] },
          { heading: "Contact", links: [{ label: "hello@bezel.dev", href: "#m" }, { label: "GitHub", href: "#g" }] },
        ]}
        copyright="© 2026 Bezel"
        publishedBy={{ label: "Yash Arya", href: "#y" }}
      />
    </div>
  );
}

function PointerGlowCardPreview() {
  // While idle, a slow synthetic pointer crosses the card so the index shows
  // the spotlight; a real pointer or reduced motion stops it.
  const ref = useRef<HTMLDivElement>(null);
  useIdleInterval(() => {
    sweep(ref.current?.querySelector(".pgc") ?? null, { duration: 2400 });
  }, 4200);
  return (
    <Center>
      <div ref={ref}>
        <PointerGlowCard className="w-64 p-5 text-left">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#912c22]">Notebook</p>
          <h4 className="mt-2 text-lg font-semibold text-[#0a0a0a]">Field notes</h4>
          <p className="mt-1 text-sm text-[#4a4a4c]">Sketches and measurements from a week of drawing old buildings.</p>
          <a
            href="#notes"
            className={`-mb-2 mt-1 inline-flex min-h-[48px] items-center rounded text-sm font-medium text-[#912c22] underline-offset-4 hover:underline ${cardRing}`}
          >
            Open the notebook
          </a>
        </PointerGlowCard>
      </div>
    </Center>
  );
}

/* ----------------------------------------------------------------- motion */

function ElasticLineDividerPreview() {
  const ref = useRef<HTMLDivElement>(null);
  useIdleInterval(() => {
    const svg = ref.current?.querySelector("svg") ?? null;
    sweep(svg, { duration: 900, path: (t) => [0.25 + 0.5 * t, 0.5 + 0.9 * Math.sin(t * Math.PI)] });
  }, 3200);
  return (
    <div ref={ref} className="flex h-full w-full flex-col justify-center px-8 text-white">
      <ElasticLineDivider index="01/" label="Selected work" total="/04" />
    </div>
  );
}

function ScrollRevealPreview() {
  // The entrance plays once per mount, so the card replays it while idle.
  const loop = useLoopKey(4200);
  // The stage is void, and the gallery's own chrome vocabulary is the void
  // tokens, so the panel is written in those rather than in the shadcn
  // semantics the stage defines for components that need them.
  const panel = "rounded-xl border border-void-line bg-void-raised px-4 py-3 text-void-ink";
  return (
    <Center>
      <div key={loop} className="flex w-[248px] flex-col gap-2.5">
        {[
          { variant: "up", label: "Fades up", note: "on entry" },
          { variant: "left", label: "Slides in", note: "from the left" },
          { variant: "scale", label: "Scales up", note: "into place" },
        ].map((row, i) => (
          <ScrollReveal key={row.variant} variant={row.variant as "up" | "left" | "scale"} delay={(i * 100) as 0 | 100 | 200}>
            <div className={panel}>
              <Caption>{row.variant}</Caption>
              <p className="mt-1 text-sm">
                {row.label} <span className="opacity-70">{row.note}</span>
              </p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </Center>
  );
}

function DepthTextPreview() {
  return (
    <Center>
      <DepthText text="Bezel" fontSize="5rem" faceColor="#f7f3ee" depthColor="#912c22" layers={30} depth={2} />
    </Center>
  );
}

function MagnetPreview() {
  return (
    <Center>
      <Magnet>
        <button
          type="button"
          className={`grid h-28 w-28 place-items-center rounded-full bg-[#f7f3ee] text-sm font-semibold text-[#912c22] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.8)] ${voidRing}`}
        >
          Say hello
        </button>
      </Magnet>
    </Center>
  );
}

function GlareHoverPreview() {
  const ref = useRef<HTMLDivElement>(null);
  useIdleInterval(() => {
    const target = ref.current?.querySelector(".pl-glare") ?? null;
    sweep(target, { duration: 1500 });
  }, 3000);
  return (
    <Center>
      <div ref={ref} className="w-60 overflow-hidden rounded-2xl ring-1 ring-white/10">
        <GlareHover glareSize={150}>
          <div className="relative aspect-[4/3]">
            <img src={IMAGES.mountains} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-left">
              <p className="text-sm font-semibold text-white">Ridge line</p>
              <p className="text-xs text-white/80">Print, A3</p>
            </div>
          </div>
        </GlareHover>
      </div>
    </Center>
  );
}

function CinematicWaterBackgroundPreview() {
  return (
    <div className="relative h-full w-full">
      <CinematicWaterBackground scene={1} bubbleCount={14} />
      <div className="relative flex h-full flex-col items-center justify-center p-6 text-center text-white">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/80">Plant-based</p>
        <h3 className="mt-2 font-serif text-3xl font-medium">Clean, from the source</h3>
      </div>
    </div>
  );
}

function ShinyGradientTextPreview() {
  return (
    <Center>
      <div className="flex w-full max-w-[300px] flex-col items-center gap-3">
        <div className="flex flex-col items-center gap-1">
          <p className="font-serif text-[34px] font-semibold leading-tight tracking-tight">
            <ShinyGradientText tone="void">Limited run</ShinyGradientText>
          </p>
          <Caption className="text-white">On void</Caption>
        </div>
        <div className="flex w-full flex-col items-center gap-1 rounded-xl bg-paper px-4 py-3">
          <p className="font-serif text-[34px] font-semibold leading-tight tracking-tight">
            <ShinyGradientText tone="paper">Limited run</ShinyGradientText>
          </p>
          <Caption className="text-ink-muted">On paper</Caption>
        </div>
      </div>
    </Center>
  );
}

function BlurInRevealPreview() {
  return (
    <Center>
      <div className="max-w-[280px] text-center">
        <BlurInReveal as="p" className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#047857]">
          New range
        </BlurInReveal>
        <BlurInReveal as="h3" delay={1} className="mt-2 font-serif text-3xl font-medium leading-tight text-[#0a0a0a]">
          Plant-based cleaners
        </BlurInReveal>
        <BlurInReveal as="p" delay={2} className="mt-2 text-sm text-[#4a4a4c]">
          For kitchen grease, hard water and floors.
        </BlurInReveal>
      </div>
    </Center>
  );
}

const RAIL_SECTIONS = ["Intro", "Craft", "Proof", "Pricing", "Contact"];

function SectionProgressRailPreview() {
  const [active, setActive] = useState(1);
  useIdleInterval(() => setActive((i) => (i + 1) % RAIL_SECTIONS.length), 1700);
  return (
    <div
      className="relative h-full w-full [&_.spr]:!flex"
      onClick={(event) => {
        const link = (event.target as HTMLElement).closest("a");
        if (!link) return;
        const index = RAIL_SECTIONS.findIndex((s) => link.getAttribute("href") === `#${s.toLowerCase()}`);
        if (index >= 0) setActive(index);
      }}
    >
      <div className="flex h-full flex-col justify-center px-8 text-white">
        <Caption>
          Section {active + 1} of {RAIL_SECTIONS.length}
        </Caption>
        <p className="mt-2 font-serif text-4xl font-medium">{RAIL_SECTIONS[active]}</p>
      </div>
      <SectionProgressRail
        activeIndex={active}
        links={RAIL_SECTIONS.map((s) => ({ href: `#${s.toLowerCase()}`, label: s }))}
      />
    </div>
  );
}

function EdgeFadeMarqueePreview() {
  const chip = "whitespace-nowrap rounded-full border border-white/15 px-4 py-2 text-sm text-white";
  return (
    <div className="flex h-full w-full flex-col justify-center gap-5">
      <p className="px-8 font-serif text-2xl font-medium text-white">Why people reorder</p>
      <EdgeFadeMarquee duration={24} fadeColor="var(--bz-void-raised)" gap={12}>
        {["Free shipping over ₹499", "Any 3 for ₹999", "Cash on delivery", "Plastic-free refills", "Made in small batches"].map(
          (text) => (
            <span key={text} className={chip}>
              {text}
            </span>
          ),
        )}
      </EdgeFadeMarquee>
    </div>
  );
}

function StaggerBlurTextPreview() {
  return (
    <Center>
      <StaggerBlurText
        className="max-w-[300px] text-center font-serif text-2xl leading-snug text-[#0a0a0a]"
        text="Good interfaces explain themselves before anyone has to."
      />
    </Center>
  );
}

function AnimatedGradientRulePreview() {
  return (
    <Center>
      <div className="w-[280px] text-left text-white">
        <p className="font-serif text-xl">Chapter one</p>
        <p className="mt-1 text-sm text-white/80">Where the idea came from.</p>
        <AnimatedGradientRule className="my-5" />
        <p className="font-serif text-xl">Chapter two</p>
        <p className="mt-1 text-sm text-white/80">What it became.</p>
      </div>
    </Center>
  );
}

function CanvasPetalFieldPreview() {
  // Petals only, on white: the field is the component, and anything set over it
  // reads as art direction borrowed from one project. The count is high because
  // the petals spawn above the canvas and the pale ones are faint on white.
  return (
    <div className="relative h-full w-full bg-white [&_canvas]:saturate-[1.25]">
      <CanvasPetalField count={54} />
    </div>
  );
}

function FilmGrainOverlayPreview() {
  // The grain is deliberately faint (4% alpha). The right half lays the same
  // canvas over mid-grey and raises contrast, so the texture can be seen.
  const grain = (
    <FilmGrainOverlay opacity={1} resolution={140} className="pointer-events-none absolute inset-0 h-full w-full mix-blend-overlay" />
  );
  return (
    <div className="relative grid h-full w-full grid-cols-2 text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#4a3a30,#15110f)]" />
        {grain}
        <Caption className="absolute bottom-4 left-4">As shipped</Caption>
      </div>
      <div className="relative overflow-hidden bg-[#15110f]">
        <div className="absolute inset-0" style={{ filter: "contrast(9) brightness(0.55)" }}>
          <div className="absolute inset-0 bg-[#808080]" />
          {grain}
        </div>
        <Caption className="absolute bottom-4 right-4">Grain, magnified</Caption>
      </div>
      <div aria-hidden className="absolute inset-y-0 left-1/2 w-px bg-white/25" />
    </div>
  );
}

function ScratchFoilRevealPreview() {
  const [run, setRun] = useState(0);
  const [scratched, setScratched] = useState(false);
  // Paint the foil back on once the visitor has moved away, so the next person
  // to arrive gets a card to scratch. Repainting an untouched card would only
  // reshuffle its sparkle, so the loop waits for a reveal to undo.
  useIdleInterval(
    () => {
      setRun((r) => r + 1);
      setScratched(false);
    },
    2800,
    scratched,
  );
  return (
    <Center>
      <ScratchFoilReveal
        key={run}
        onReveal={() => setScratched(true)}
        className="h-40 w-64 overflow-hidden rounded-xl"
        label="Scratch to reveal"
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f5f0e8] text-center text-[#3a2a1a]">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#7a6015]">You&rsquo;re invited</p>
          <p className="mt-2 font-serif text-2xl">Dinner at eight</p>
          <p className="mt-1 text-xs text-[#4a4a4c]">Saturday, 6 December</p>
        </div>
      </ScratchFoilReveal>
    </Center>
  );
}

function PixelDemorphImagePreview() {
  return (
    <Center>
      <div className="w-60">
        <PixelDemorphImage src={IMAGES.lake} alt="A mountain lake at dusk" className="aspect-[4/3] w-full rounded-xl" durationMs={1500} startBlocks={5} />
      </div>
    </Center>
  );
}

function PinchedButtonPreview() {
  return (
    <Center>
      <div className="portal-cta-pair flex flex-wrap items-center justify-center gap-3">
        <PinchedButton className="portal-admin">Admin</PinchedButton>
        <PinchedButton className="portal-vendor" tone="ghost">
          Vendor
        </PinchedButton>
      </div>
    </Center>
  );
}

function MetallicLogoShimmerPreview() {
  return (
    <Center>
      <MetallicLogoShimmer src={WORDMARK} alt="Bezel" maxWidth="15rem" />
    </Center>
  );
}

const QR_LINKS = [
  { value: "https://bezel-ui.vercel.app", title: "Browse the gallery", label: "QR code that opens the Bezel gallery" },
  { value: "https://github.com/yasharyas/bezel", title: "Read the source", label: "QR code that opens the Bezel repository on GitHub" },
  { value: "https://www.npmjs.com/package/bezel-ui", title: "Install from npm", label: "QR code that opens the bezel-ui package on npm" },
  { value: "https://yash-arya.com", title: "Meet the maker", label: "QR code that opens yash-arya.com" },
];

const QR_ITEMS = QR_LINKS.map((link) => ({
  value: link.value,
  label: link.label,
  caption: (
    <>
      <span className="text-void-ink">{link.title}</span>
      <span className="mt-0.5 block font-mono text-[11px] font-medium tracking-normal text-void-muted">
        {link.value.replace("https://", "").replace("www.", "")}
      </span>
    </>
  ),
}));

/**
 * The component is built for paper and the code itself has to stay there: a
 * scanner wants a light quiet zone and dark modules. The showcase stage is
 * void, so the caption column is relit and the code reads as a white tile on
 * the dark ground, the way a dark site would print one.
 */
function ParticleQrCodePreview() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);
  // The code takes the width the 12rem caption column leaves, so the pair sits
  // side by side at every stage size. The ceiling is high enough that the
  // expanded view and the component page do not leave it adrift in the middle.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const room = Math.min(el.clientWidth - 192 - 20 - 12, el.clientHeight);
      setSize(Math.max(104, Math.min(260, Math.floor(room))));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div
      className="h-full w-full px-3 py-4 [&_.bz-qr-count]:text-void-muted [&_.bz-qr-fill]:bg-white [&_.bz-qr-groove]:bg-white/15"
      style={{ "--bz-focus-ring": "var(--bz-focus-ring-void)" } as CSSProperties}
    >
      <div ref={ref} className="flex h-full w-full items-center justify-center">
        {size ? <ParticleQrCode value={QR_ITEMS} size={size} hold={4500} /> : null}
      </div>
    </div>
  );
}

const PROJECT_STAGES = [
  {
    id: "plan",
    label: "Plan",
    icon: <ClipboardList />,
    title: "Agree on the brief",
    body: "Scope, owners and a date that everyone has seen.",
    points: ["Goals written down", "Risks named early", "One place for decisions"],
  },
  {
    id: "build",
    label: "Build",
    icon: <Hammer />,
    title: "Work in small slices",
    body: "Every change reviewed, previewed and merged the same day.",
    points: ["A preview for every change", "Tests beside the code", "No long-lived branches"],
  },
  {
    id: "ship",
    label: "Ship",
    icon: <Rocket />,
    title: "Release with a way back",
    body: "A staged rollout, a watched dashboard and one clear owner.",
    points: ["Roll out in stages", "Alerts on the key paths", "Notes ready for support"],
  },
];

function TimedTabsPreview() {
  return (
    <TimedTabs
      label="Project stages"
      interval={4200}
      items={PROJECT_STAGES.map((stage) => ({
        id: stage.id,
        label: stage.label,
        icon: stage.icon,
        content: (
          <div className="text-left">
            <h3 className="text-xl font-semibold tracking-tight text-[#0a0a0a]">{stage.title}</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-[#4a4a4c]">{stage.body}</p>
            <ul className="mt-4 grid gap-2 text-sm text-[#0a0a0a]">
              {stage.points.map((point) => (
                <li key={point} className="flex items-center gap-2.5">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#912c22]" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ),
      }))}
    />
  );
}

function GlyphFieldPreview() {
  return (
    <div className="h-full w-full">
      <GlyphField text="Bezel" style={{ height: "100%" }} />
    </div>
  );
}

const cardRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]";

/** The same ring for a control standing on a void stage, where the brick would
    measure about 2:1. Same geometry, the white the token set names for dark
    surfaces. Demo controls need it spelled out: they are preview furniture, so
    no library focus rule reaches them and the browser default would win. */
const voidRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffffff]";

function RetentionChart() {
  const bars = [62, 70, 66, 84, 96, 108, 122];
  return (
    <svg viewBox="0 0 300 200" aria-hidden preserveAspectRatio="xMidYMid slice">
      <rect width="300" height="200" fill="#f7f3ee" />
      {[50, 90, 130].map((y) => (
        <line key={y} x1="24" x2="276" y1={y} y2={y} stroke="rgba(10,10,10,0.08)" />
      ))}
      {bars.map((h, i) => (
        <rect key={i} x={36 + i * 34} y={170 - h} width="20" height={h} rx="4" fill={i >= 4 ? "#912c22" : "rgba(10,10,10,0.2)"} />
      ))}
    </svg>
  );
}

function TileGrid() {
  const accent = new Set([2, 7, 9, 14]);
  return (
    <svg viewBox="0 0 300 200" aria-hidden preserveAspectRatio="xMidYMid slice">
      <rect width="300" height="200" fill="#eef1f4" />
      {Array.from({ length: 18 }, (_, i) => (
        <rect
          key={i}
          x={30 + (i % 6) * 42}
          y={36 + Math.floor(i / 6) * 44}
          width="32"
          height="32"
          rx="8"
          fill={accent.has(i) ? "#1f3b5a" : "rgba(10,10,10,0.14)"}
        />
      ))}
    </svg>
  );
}

function CaseDetail({ stats, note }: { stats: Array<[string, string]>; note: string }) {
  return (
    <div className="flex h-full flex-col text-left">
      <dl className="grid grid-cols-2 gap-3">
        {stats.map(([term, value]) => (
          <div key={term} className="rounded-xl bg-[#fafafa] p-3">
            <dt className="text-xs text-[#4a4a4c]">{term}</dt>
            <dd className="mt-1 text-lg font-semibold text-[#0a0a0a]">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-sm leading-relaxed text-[#4a4a4c]">{note}</p>
      <a
        href="#case"
        className={`mt-auto inline-flex h-12 items-center self-start rounded-full border border-black/15 px-5 text-sm font-semibold text-[#0a0a0a] ${cardRing}`}
      >
        Read the case study
      </a>
    </div>
  );
}

function DockingCardPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const turn = useRef(0);
  // Dock one card, then the other, while nobody is pointing at the preview.
  useIdleInterval(() => {
    const cards = ref.current?.querySelectorAll("article");
    const card = cards?.[turn.current++ % 2] ?? null;
    if (!card) return;
    card.dispatchEvent(new PointerEvent("pointerenter", { bubbles: false }));
    window.setTimeout(() => card.dispatchEvent(new PointerEvent("pointerleave", { bubbles: false })), 2200);
  }, 3400);
  return (
    <div ref={ref} className="grid grid-cols-2 gap-5 p-2">
      <DockingCard
        eyebrow="Case study"
        title="Onboarding rework"
        href="#onboarding"
        meta="6 weeks"
        media={<RetentionChart />}
        summary="A shorter first run took week-one retention from 41% to 58%."
        detail={
          <CaseDetail
            stats={[
              ["Screens removed", "3"],
              ["Setup time", "2 min faster"],
            ]}
            note="Interviews with twelve new teams showed where the first run lost people."
          />
        }
      />
      <DockingCard
        eyebrow="Audit"
        title="Design system review"
        href="#audit"
        meta="4 weeks"
        media={<TileGrid />}
        summary="Every component was checked for states, contrast and duplicates."
        detail={
          <CaseDetail
            stats={[
              ["Reviewed", "180"],
              ["Duplicates merged", "24"],
            ]}
            note="The merged set shipped with one token file and a contrast gate in CI."
          />
        }
      />
    </div>
  );
}

const unsplashCrop = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=70`;

const CAROUSEL_SLIDES = [
  { src: unsplashCrop("photo-1506905925346-21bda4d32df4", 1200, 800), width: 1200, height: 800, alt: "A mountain ridge above low cloud at dawn", caption: "Ridge line at dawn" },
  { src: unsplashCrop("photo-1441974231531-c6227db76b6e", 800, 1067), width: 800, height: 1067, alt: "Sunlight falling through tall forest trees", caption: "Old forest, portrait" },
  { src: unsplashCrop("photo-1493246507139-91e8fad9978e", 1200, 800), width: 1200, height: 800, alt: "A still lake between mountains", caption: "Still water" },
  { src: unsplashCrop("photo-1486406146926-c627a92ad1ab", 900, 900), width: 900, height: 900, alt: "Glass office towers seen from below", caption: "City blocks, square" },
];

function AutoplayCarouselPreview() {
  return <AutoplayCarousel label="Landscape photographs" slides={CAROUSEL_SLIDES} interval={3500} />;
}

export const previews: PreviewModule = {
  "sketch-highlight": SketchHighlightPreview,
  "sketch-arrow": SketchArrowPreview,
  "docking-card": DockingCardPreview,
  "autoplay-carousel": AutoplayCarouselPreview,
  "particle-qr-code": ParticleQrCodePreview,
  "timed-tabs": TimedTabsPreview,
  "glyph-field": GlyphFieldPreview,
  "glass-button": GlassButtonPreview,
  card: CardPreview,
  "text-input": TextInputPreview,
  stepper: StepperPreview,
  "typewriter-loader": TypewriterLoaderPreview,
  "toolbar-button": ToolbarButtonPreview,
  "collapsible-sidebar": CollapsibleSidebarPreview,
  "side-panel": SidePanelPreview,
  "node-card": NodeCardPreview,
  "md3-switch": MD3SwitchPreview,
  "blender-upload": BlenderUploadPreview,
  "empty-state": EmptyStatePreview,
  "checkbox-variants": CheckboxVariantsPreview,
  "loading-spinner": LoadingSpinnerPreview,
  "price-breakdown": PriceBreakdownPreview,
  pagination: PaginationPreview,
  "elastic-line-divider": ElasticLineDividerPreview,
  "project-card": ProjectCardPreview,
  "image-with-fallback": ImageWithFallbackPreview,
  "skeleton-card": SkeletonCardPreview,
  "testimonial-card": TestimonialCardPreview,
  "image-placeholder": ImagePlaceholderPreview,
  "shiny-badge": ShinyBadgePreview,
  "border-beam-button": BorderBeamButtonPreview,
  "card-grid": CardGridPreview,
  "numbered-steps-list": NumberedStepsListPreview,
  "formula-block": FormulaBlockPreview,
  "callout-box": CalloutBoxPreview,
  checklist: ChecklistPreview,
  "scroll-reveal": ScrollRevealPreview,
  "site-footer": SiteFooterPreview,
  "depth-text": DepthTextPreview,
  magnet: MagnetPreview,
  "glare-hover": GlareHoverPreview,
  "cinematic-water-background": CinematicWaterBackgroundPreview,
  "pointer-glow-card": PointerGlowCardPreview,
  "shiny-gradient-text": ShinyGradientTextPreview,
  "blur-in-reveal": BlurInRevealPreview,
  "section-progress-rail": SectionProgressRailPreview,
  "edge-fade-marquee": EdgeFadeMarqueePreview,
  "stagger-blur-text": StaggerBlurTextPreview,
  "animated-gradient-rule": AnimatedGradientRulePreview,
  "canvas-petal-field": CanvasPetalFieldPreview,
  "film-grain-overlay": FilmGrainOverlayPreview,
  "scratch-foil-reveal": ScratchFoilRevealPreview,
  "pixel-demorph-image": PixelDemorphImagePreview,
  "till-receipt-print": TillReceiptPrintPreview,
  "pinched-button": PinchedButtonPreview,
  "metallic-logo-shimmer": MetallicLogoShimmerPreview,
};

function ToolbarButtonPreview() {
  const [bold, setBold] = useState(true);
  const sep = <span aria-hidden className="mx-1 h-5 w-px bg-black/10" />;
  return (
    <Center>
      <div className="flex items-center gap-0.5 rounded-2xl border border-black/[0.06] bg-white p-1.5 shadow-sm">
        <span className={bold ? "rounded-xl bg-black/[0.05] text-[#0a0a0a]" : ""}>
          <ToolbarButton icon={<Bold size={16} />} onClick={() => setBold((b) => !b)} title="Bold" />
        </span>
        <ToolbarButton icon={<Italic size={16} />} onClick={noop} title="Italic" />
        <ToolbarButton icon={<Underline size={16} />} onClick={noop} title="Underline" />
        {sep}
        <ToolbarButton icon={<Link2 size={16} />} onClick={noop} title="Insert link" />
        {sep}
        <ToolbarButton icon={<Undo2 size={16} />} onClick={noop} title="Undo" />
        <ToolbarButton icon={<Redo2 size={16} />} onClick={noop} disabled title="Redo (nothing to redo)" />
      </div>
    </Center>
  );
}

function SketchHighlightPreview() {
  return (
    <Center>
      <p className="max-w-[330px] text-center font-serif text-[26px] leading-[1.75] text-ink">
        A mark that is{" "}
        <SketchHighlight color="yellow" resketchOnHover>
          still moving
        </SketchHighlight>{" "}
        reads as{" "}
        <SketchHighlight mark="underline" color="lime">
          drawn
        </SketchHighlight>
        , not{" "}
        <SketchHighlight mark="strike" color="violet">
          printed
        </SketchHighlight>
        , in{" "}
        <SketchHighlight color="purple" resketchOnHover>
          any ink
        </SketchHighlight>
        .
      </p>
    </Center>
  );
}

function SketchArrowPreview() {
  const noteRef = useRef<HTMLSpanElement>(null);
  const targetRef = useRef<HTMLButtonElement>(null);
  return (
    <Center>
      <div className="relative h-[230px] w-[400px] rounded-2xl border border-black/[0.06] bg-paper p-5 text-ink shadow-sm">
        <Caption className="text-ink-muted">Draft</Caption>
        <p className="mt-2 max-w-[210px] font-serif text-lg leading-snug">
          Three photographs and a paragraph of notes.
        </p>
        <button
          ref={targetRef}
          type="button"
          onClick={noop}
          className={`${cardRing} absolute right-5 top-5 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper`}
        >
          Publish
        </button>
        <span
          ref={noteRef}
          className="absolute bottom-5 left-5 rounded-full border border-black/[0.13] bg-paper-sunken px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted"
        >
          Everything is in
        </span>
        <SketchArrow
          from={noteRef}
          to={targetRef}
          bend={0.24}
          color="#912c22"
          label="Points from the note up to the publish button"
        />
      </div>
    </Center>
  );
}
