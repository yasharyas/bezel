// GENERATED FILE — do not edit by hand.
// Run `npm run generate -w @bezel/registry` after changing a component.
// Source of truth: packages/ui/src for code, metadata.json for everything else.

export interface ComponentEntry {
  name: string;
  slug: string;
  path: string;
  code: string;
  /** One sentence, 8 to 14 words: what the component is and what sets it apart. */
  description: string;
  tags: string[];
  category?: string;
}

export const registry: ComponentEntry[] = [
  {
    name: "GlassButton",
    slug: "glass-button",
    path: "GlassButton.tsx",
    code: `import React from "react";

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function GlassButton({ children, className = "", ...props }: GlassButtonProps) {
  return (
    <button
      className={\`px-6 py-2 rounded-xl font-medium text-white backdrop-blur-md bg-white/10 border border-white/20 shadow-lg hover:bg-white/20 transition-[background-color,transform] duration-150 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 \${className}\`}
      {...props}
    >
      {children}
    </button>
  );
}`,
    description: "Frosted translucent button for dark surfaces, with press scale and a focus ring.",
    tags: ["button", "glass", "ui"],
  },
  {
    name: "Card",
    slug: "card",
    path: "Card.tsx",
    code: `import React from "react";

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, children, className = "" }: CardProps) {
  return (
    <div
      className={\`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-md \${className}\`}
    >
      {title && <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>}
      <div className="text-white/80">{children}</div>
    </div>
  );
}`,
    description: "Translucent dark panel with an optional title, blurred over whatever sits behind it.",
    tags: ["card", "layout", "glass"],
  },
  {
    name: "TextInput",
    slug: "text-input",
    path: "forms/TextInput.tsx",
    category: "forms",
    code: `import React from 'react';

type TextInputProps = {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  type?: 'text' | 'number' | 'email';
  mandatory?: boolean;
  uppercase?: boolean;
  maxLength?: number;
};

export function TextInput({
  name,
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  type = 'text',
  mandatory,
  uppercase,
  maxLength,
}: TextInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(uppercase ? v.toUpperCase() : v);
  };

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-neutral-700">
        {label}
        {mandatory && <span className="text-[color:var(--bz-danger,#b91c1c)] ml-1">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        className={[
          'h-11 px-4 rounded-full border bg-white text-neutral-900 placeholder:text-[color:var(--bz-ink-subtle,#6b6b70)]',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-[border-color,box-shadow] duration-200',
          uppercase ? 'uppercase' : '',
          error ? 'border-red-500 focus:border-red-500' : 'border-[color:var(--bz-line-control,#8a8a8e)]',
          disabled ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed' : '',
        ].join(' ')}
        autoComplete="off"
      />
      {error && <p className="text-xs text-[color:var(--bz-danger,#b91c1c)] mt-0.5">{error}</p>}
    </div>
  );
}`,
    description: "Pill text field with label, required marker, error message and uppercase mode.",
    tags: ["input", "text", "pill", "accessible", "controlled", "validation"],
  },
  {
    name: "Stepper",
    slug: "stepper",
    path: "navigation/Stepper.tsx",
    category: "navigation",
    code: `import React from 'react';

type Step = {
  id: string;
  title: string;
};

type StepperProps = {
  steps: Step[];
  currentStepIndex: number;
  completedStepIds: Set<string>;
};

export function Stepper({ steps, currentStepIndex, completedStepIds }: StepperProps) {
  const totalSteps = steps.length;
  const currentStep = currentStepIndex + 1;

  return (
    <div className="w-full">
      {/* Mobile: progress bar */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-neutral-500">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-xs font-semibold text-indigo-600">
            {steps[currentStepIndex]?.title}
          </span>
        </div>
        <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-[width] duration-500 ease-out"
            style={{ width: \`\${(currentStep / totalSteps) * 100}%\` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          {steps.map((step, i) => {
            const isCompleted = completedStepIds.has(step.id);
            const isCurrent = i === currentStepIndex;
            return (
              <div
                key={step.id}
                className={[
                  'w-2 h-2 rounded-full transition-[background-color,transform] duration-300',
                  isCompleted ? 'bg-[color:var(--bz-emerald-decor,#059669)]' : isCurrent ? 'bg-indigo-600 scale-125' : 'bg-neutral-300',
                ].join(' ')}
              />
            );
          })}
        </div>
      </div>

      {/* Desktop: labelled step indicators */}
      <div className="hidden sm:block w-full pb-2">
        <div className="flex items-start w-full px-4">
          {steps.map((step, index) => {
            const isCompleted = completedStepIds.has(step.id);
            const isCurrent = index === currentStepIndex;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center flex-shrink-0 w-16">
                  <div
                    className={[
                      'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-[background-color,color,box-shadow] duration-300',
                      isCompleted
                        ? 'bg-[color:var(--bz-emerald-decor,#059669)] text-white'
                        : isCurrent
                          ? 'bg-indigo-600 text-white shadow-[0_0_0_3px_rgba(99,102,241,0.3)]'
                          : 'bg-neutral-200 text-[color:var(--bz-ink-muted,#4a4a4c)]',
                    ].join(' ')}
                  >
                    {isCompleted ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={[
                      'text-xs text-center w-full leading-tight mt-1.5',
                      isCurrent ? 'text-indigo-600 font-semibold' : isCompleted ? 'text-[color:var(--bz-emerald,#047857)] font-medium' : 'text-[color:var(--bz-ink-subtle,#6b6b70)]',
                    ].join(' ')}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={[
                      'flex-1 h-0.5 mt-[18px] transition-[background-color] duration-300',
                      isCompleted ? 'bg-[color:var(--bz-emerald-decor,#059669)]' : 'bg-neutral-200',
                    ].join(' ')}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}`,
    description: "Wizard progress: numbered steps on desktop, a progress bar with dots on mobile.",
    tags: ["stepper", "progress", "wizard", "multi-step", "responsive", "accessible"],
  },
  {
    name: "SubmissionLoader",
    slug: "submission-loader",
    path: "feedback/SubmissionLoader.tsx",
    category: "feedback",
    code: `import React from 'react';

type Phase = 'verifying' | 'validating' | 'submitting' | 'complete';

type PhaseConfig = {
  text: string;
  subtitle: string;
};

const DEFAULT_PHASES: Phase[] = ['verifying', 'validating', 'submitting', 'complete'];

const DEFAULT_CONFIG: Record<Phase, PhaseConfig> = {
  verifying:  { text: 'Verifying Details',     subtitle: 'Checking your information...' },
  validating: { text: 'Validating Documents',  subtitle: 'Reviewing uploaded files...' },
  submitting: { text: 'Submitting',            subtitle: 'Saving your submission...' },
  complete:   { text: 'All Done!',             subtitle: 'Your submission was successful.' },
};

type SubmissionLoaderProps = {
  phase: Phase | null;
  phases?: Phase[];
  phaseConfig?: Record<Phase, PhaseConfig>;
};

export function SubmissionLoader({ phase, phases = DEFAULT_PHASES, phaseConfig = DEFAULT_CONFIG }: SubmissionLoaderProps) {
  if (!phase) return null;

  const config = phaseConfig[phase];
  const isComplete = phase === 'complete';
  const currentIndex = phases.indexOf(phase);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 max-w-sm w-full mx-4 text-center">

        {/* Icon */}
        <div className="flex justify-center mb-6">
          {isComplete ? (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[color:var(--bz-emerald,#047857)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
        </div>

        {/* Text */}
        <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-2">{config.text}</h3>
        <p className="text-sm text-neutral-500 mb-6">{config.subtitle}</p>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {phases.map((p, i) => (
            <div
              key={p}
              className={[
                'w-2.5 h-2.5 rounded-full transition-[background-color] duration-300',
                i <= currentIndex
                  ? isComplete ? 'bg-green-500' : 'bg-indigo-500'
                  : 'bg-neutral-200',
              ].join(' ')}
            />
          ))}
        </div>
        <p className="text-xs text-[color:var(--bz-ink-subtle,#6b6b70)] mt-3">
          Step {currentIndex + 1} of {phases.length}
        </p>
      </div>
    </div>
  );
}`,
    description: "Blocking overlay that walks through verifying, validating, submitting and done.",
    tags: ["loader", "overlay", "spinner", "success", "modal", "multi-phase", "progress"],
  },
  {
    name: "TypewriterLoader",
    slug: "typewriter-loader",
    path: "feedback/TypewriterLoader.tsx",
    category: "feedback",
    code: `import React from 'react';
import './TypewriterLoader.css';

type Props = {
  size?: number;
};

export function TypewriterLoader({ size = 1 }: Props) {
  return (
    <div
      className="typewriter"
      style={size !== 1 ? { transform: \`scale(\${size})\`, transformOrigin: 'center bottom' } : undefined}
    >
      <div className="slide"><i /></div>
      <div className="paper" />
      <div className="keyboard" />
    </div>
  );
}`,
    description: "Pure CSS loader of a little typewriter whose carriage slides as keys press.",
    tags: ["loader", "spinner", "animation", "typewriter", "css", "pure-css", "decorative"],
  },
  {
    name: "ToastContainer",
    slug: "toast-container",
    path: "feedback/ToastContainer.tsx",
    category: "feedback",
    code: `import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface Toast {
  id: number;
  message: string;
}

let _toastId = 0;
const EXIT_MS = 200;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, duration = 2500) => {
    const id = ++_toastId;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return { toasts, show };
}

// @starting-style drives the entrance — it's paint-driven, not a mount
// effect + requestAnimationFrame, so it still animates even if the tab was
// backgrounded when the toast was queued (rAF is paused on hidden tabs).
// Exit uses the [data-leaving] attribute, toggled by plain React state.
const toastStyle = \`
  .yui-toast {
    transform: translateY(0);
    opacity: 1;
    transition: transform 200ms cubic-bezier(0.23,1,0.32,1), opacity 200ms cubic-bezier(0.23,1,0.32,1);
  }
  @starting-style {
    .yui-toast { transform: translateY(100%); opacity: 0; }
  }
  .yui-toast[data-leaving="true"] { transform: translateY(100%); opacity: 0; }
\`;

/**
 * Toasts fire in bursts, so exit uses an interruptible CSS transition (not
 * @keyframes) — the same approach Sonner uses. When a toast drops out of the
 * \`toasts\` prop it isn't unmounted immediately; it's kept around just long
 * enough to play its exit transition, matching how it slid in.
 */
export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  const [rendered, setRendered] = useState<(Toast & { leaving?: boolean })[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const incomingIds = new Set(toasts.map((t) => t.id));
    setRendered((prev) => {
      const stillLeaving = prev.filter((t) => !incomingIds.has(t.id) && t.leaving);
      const newlyLeaving = prev.filter((t) => !incomingIds.has(t.id) && !t.leaving);

      newlyLeaving.forEach((t) => {
        const timer = setTimeout(() => {
          setRendered((curr) => curr.filter((c) => c.id !== t.id));
          timers.current.delete(t.id);
        }, EXIT_MS);
        timers.current.set(t.id, timer);
      });

      return [...toasts, ...stillLeaving, ...newlyLeaving.map((t) => ({ ...t, leaving: true }))];
    });
  }, [toasts]);

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach(clearTimeout);
  }, []);

  if (rendered.length === 0) return null;

  return createPortal(
    <>
      <style>{toastStyle}</style>
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
        {rendered.map((t) => (
          <div
            key={t.id}
            data-leaving={t.leaving ? 'true' : undefined}
            className="yui-toast bg-neutral-800 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg"
          >
            {t.message}
          </div>
        ))}
      </div>
    </>,
    document.body
  );
}`,
    description: "Toast stack with a useToast hook, portalled to the body, sliding in and out.",
    tags: ["toast", "notification", "portal", "hook", "auto-dismiss", "animated"],
  },
  {
    name: "ToolbarButton",
    slug: "toolbar-button",
    path: "buttons/ToolbarButton.tsx",
    category: "buttons",
    code: `import type { ReactNode } from 'react';

type ToolbarButtonProps = {
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
};

export function ToolbarButton({ icon, onClick, disabled, title }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
    >
      {icon}
    </button>
  );
}`,
    description: "Compact icon button for toolbars, with hover, disabled and keyboard focus states.",
    tags: ["icon-button", "toolbar", "disabled-state", "tooltip", "neutral"],
  },
  {
    name: "CollapsibleSidebar",
    slug: "collapsible-sidebar",
    path: "navigation/CollapsibleSidebar.tsx",
    category: "navigation",
    code: `import { useState, type DragEvent, type ReactNode } from 'react';
import { Search, PanelLeftClose, PanelLeft } from 'lucide-react';

export type SidebarItem = {
  id: string;
  label: string;
  description?: string;
  color: string;
  icon: ReactNode;
  dragData?: string;
  dragKey?: string;
};

export type SidebarCategory = {
  label: string;
  items: SidebarItem[];
};

type CollapsibleSidebarProps = {
  title?: string;
  categories: SidebarCategory[];
  searchPlaceholder?: string;
  dragTransferKey?: string;
};

export function CollapsibleSidebar({
  title = 'Items',
  categories,
  searchPlaceholder = 'Search...',
  dragTransferKey = 'application/sidebar-item',
}: CollapsibleSidebarProps) {
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  const onDragStart = (e: DragEvent, item: SidebarItem) => {
    e.dataTransfer.setData(item.dragKey ?? dragTransferKey, item.dragData ?? item.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const filterItem = (item: SidebarItem) =>
    item.label.toLowerCase().includes(search.toLowerCase());

  if (collapsed) {
    return (
      <div className="w-12 bg-white border-r border-neutral-200 flex flex-col items-center pt-3">
        <button
          onClick={() => setCollapsed(false)}
          aria-label="Expand sidebar"
          className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
        >
          <PanelLeft size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-60 bg-white border-r border-neutral-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-xs font-semibold text-[color:var(--bz-ink-subtle,#6b6b70)] uppercase tracking-wider">{title}</h2>
        <button
          onClick={() => setCollapsed(true)}
          aria-label="Collapse sidebar"
          className="p-1.5 rounded-lg hover:bg-neutral-100 text-[color:var(--bz-ink-subtle,#6b6b70)] transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[color:var(--bz-ink-subtle,#6b6b70)]" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-neutral-50 border border-[color:var(--bz-line-control,#8a8a8e)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[color:var(--bz-focus-ring,#912c22)] placeholder:text-[color:var(--bz-ink-subtle,#6b6b70)] transition"
          />
        </div>
      </div>

      {/* Item list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-4">
        {categories.map((cat) => {
          const filtered = cat.items.filter(filterItem);
          if (filtered.length === 0) return null;
          return (
            <div key={cat.label}>
              <h3 className="text-[10px] font-semibold text-[color:var(--bz-ink-subtle,#6b6b70)] uppercase tracking-widest mb-2 px-1">
                {cat.label}
              </h3>
              <div className="space-y-1.5">
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, item)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-100 hover:border-neutral-300 hover:shadow-sm cursor-grab active:cursor-grabbing transition-[border-color,box-shadow] duration-150 group"
                  >
                    <div
                      className="flex items-center justify-center w-7 h-7 rounded-lg transition-transform group-hover:scale-110"
                      style={{ backgroundColor: \`\${item.color}18\` }}
                    >
                      <span style={{ color: item.color, display: 'flex' }}>{item.icon}</span>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-neutral-700">{item.label}</div>
                      {item.description && (
                        <div className="text-[10px] text-[color:var(--bz-ink-subtle,#6b6b70)]">{item.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}`,
    description: "Collapsible node palette with search and categorised items you can drag out.",
    tags: ["sidebar", "collapsible", "draggable", "searchable", "categorised", "panel"],
  },
  {
    name: "SidePanel",
    slug: "side-panel",
    path: "panels/SidePanel.tsx",
    category: "panels",
    code: `import type { ReactNode } from 'react';
import { X } from 'lucide-react';

// @starting-style is paint-driven (not a mount effect + requestAnimationFrame),
// so the entrance still plays even if the tab was backgrounded when this
// panel mounted — rAF is paused on hidden tabs, @starting-style isn't.
const sidePanelStyle = \`
  .yui-side-panel {
    transform: translateX(0);
    opacity: 1;
    transition: transform 200ms cubic-bezier(0.23,1,0.32,1), opacity 200ms cubic-bezier(0.23,1,0.32,1);
  }
  @starting-style {
    .yui-side-panel { transform: translateX(4%); opacity: 0; }
  }
\`;

type SidePanelProps = {
  title: string;
  headerLeft?: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
};

export function SidePanel({ title, headerLeft, onClose, footer, children }: SidePanelProps) {
  return (
    <div className="yui-side-panel w-72 bg-white border-l border-neutral-200 flex flex-col h-full">
      <style>{sidePanelStyle}</style>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          {headerLeft}
          <span className="text-[10px] font-semibold text-[color:var(--bz-ink-subtle,#6b6b70)] uppercase tracking-wider">
            {title}
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="p-1.5 rounded-lg hover:bg-neutral-100 text-[color:var(--bz-ink-subtle,#6b6b70)] transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="p-4 border-t border-neutral-100">
          {footer}
        </div>
      )}
    </div>
  );
}

type FieldProps = {
  label: string;
  children: ReactNode;
};

export function PanelField({ label, children }: FieldProps) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-[color:var(--bz-ink-subtle,#6b6b70)] uppercase tracking-wider">
        {label}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function PanelInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        'w-full px-3 py-2 text-sm bg-neutral-50 border border-[color:var(--bz-line-control,#8a8a8e)] rounded-xl ' +
        'focus:outline-none focus:ring-2 focus:ring-[color:var(--bz-focus-ring,#912c22)] placeholder:text-[color:var(--bz-ink-subtle,#6b6b70)] transition ' +
        (props.className ?? '')
      }
    />
  );
}

export function PanelTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={
        'w-full px-3 py-2 text-sm bg-neutral-50 border border-[color:var(--bz-line-control,#8a8a8e)] rounded-xl ' +
        'focus:outline-none focus:ring-2 focus:ring-[color:var(--bz-focus-ring,#912c22)] resize-none transition ' +
        (props.className ?? '')
      }
    />
  );
}

export function PanelDeleteButton({ onClick, label = 'Delete' }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 py-2 text-sm text-[color:var(--bz-danger,#b91c1c)] hover:bg-red-50 rounded-xl transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
    >
      {label}
    </button>
  );
}`,
    description: "Inspector side panel with header, scrolling body, footer slot and field helpers.",
    tags: ["side-panel", "drawer", "form", "editor", "slide-in", "animated"],
  },
  {
    name: "NodeCard",
    slug: "node-card",
    path: "cards/NodeCard.tsx",
    category: "cards",
    code: `import type { ReactNode, CSSProperties } from 'react';

type NodeCardProps = {
  label: string;
  description?: string;
  icon: ReactNode;
  accentColor: string;
  selected?: boolean;
  onClick?: () => void;
  topHandle?: ReactNode;
  bottomHandle?: ReactNode;
};

export function NodeCard({
  label,
  description,
  icon,
  accentColor,
  selected = false,
  onClick,
  topHandle,
  bottomHandle,
}: NodeCardProps) {
  return (
    <div
      className={[
        'relative min-w-[180px] max-w-[240px] rounded-2xl bg-white',
        'border-2 transition-shadow duration-150 cursor-pointer',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]',
        selected ? 'ring-2 ring-offset-2 shadow-md' : 'shadow-sm hover:shadow-md',
      ].join(' ')}
      style={{
        borderColor: selected ? accentColor : '#e2e8f0',
        ...(selected
          ? ({ '--tw-ring-color': accentColor } as CSSProperties)
          : {}),
      }}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        // Space would otherwise scroll the canvas
        if (event.key === ' ') event.preventDefault();
        onClick?.();
      }}
    >
      {/* Left colour accent bar */}
      <div
        className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
        style={{ backgroundColor: accentColor }}
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <div
          className="flex items-center justify-center w-7 h-7 rounded-lg"
          style={{ backgroundColor: \`\${accentColor}18\` }}
        >
          <span style={{ color: accentColor, display: 'flex' }}>{icon}</span>
        </div>
        <span className="text-sm font-semibold text-neutral-800 truncate">{label}</span>
      </div>

      {/* Description */}
      {description && (
        <div className="px-4 pb-3">
          <p className="text-xs text-[color:var(--bz-ink-subtle,#6b6b70)] truncate">{description}</p>
        </div>
      )}

      {/* Handle slots */}
      {topHandle}
      {bottomHandle}
    </div>
  );
}`,
    description: "Workflow editor node with a coloured accent bar, icon, label and selected ring.",
    tags: ["node", "card", "workflow", "react-flow", "accent-color", "selectable", "draggable"],
  },
  {
    name: "TubelightNavBar",
    slug: "tubelight-navbar",
    path: "navigation/TubelightNavBar.tsx",
    category: "navigation",
    code: `"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"

export interface NavItem {
  name: string
  url: string
  icon: LucideIcon
  onClick?: () => void
}

interface NavBarProps {
  items: NavItem[]
  activeItem?: string
  className?: string
  onNavigate?: (url: string) => void
}

export function TubelightNavBar({ items, activeItem, className, onNavigate }: NavBarProps) {
  const [isMobile, setIsMobile] = useState(false)

  const currentActive = activeItem ?? items[0]?.name ?? ""

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div
      className={\`fixed bottom-0 sm:top-0 left-1/2 -translate-x-1/2 z-50 mb-3 sm:mb-0 sm:pt-3 pointer-events-none\${className ? \` \${className}\` : ""}\`}
    >
      <div className="flex items-center gap-1 bg-background/5 border border-border backdrop-blur-lg py-0.5 px-0.5 rounded-full shadow-lg pointer-events-auto">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = currentActive === item.name
          const baseClasses =
            "relative cursor-pointer text-xs font-semibold px-3 py-1.5 rounded-full transition-colors text-center text-foreground/80 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]" +
            (isActive ? " bg-muted text-primary" : "")

          const content = (
            <>
              <span className={isMobile ? "hidden" : "hidden md:inline"}>{item.name}</span>
              <span className={isMobile ? "inline" : "md:hidden"}>
                <Icon size={14} strokeWidth={2.5} />
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-t-full">
                    <div className="absolute w-8 h-4 bg-primary/20 rounded-full blur-md -top-1.5 -left-1" />
                    <div className="absolute w-6 h-4 bg-primary/20 rounded-full blur-md -top-0.5" />
                    <div className="absolute w-3 h-3 bg-primary/20 rounded-full blur-sm top-0 left-1.5" />
                  </div>
                </motion.div>
              )}
            </>
          )

          if (item.onClick) {
            return (
              <button key={item.name} onClick={item.onClick} className={baseClasses}>
                {content}
              </button>
            )
          }

          return (
            <a
              key={item.name}
              href={item.url}
              onClick={(e) => {
                if (onNavigate) {
                  e.preventDefault()
                  onNavigate(item.url)
                }
              }}
              className={baseClasses}
            >
              {content}
            </a>
          )
        })}
      </div>
    </div>
  )
}`,
    description: "Floating pill navigation with a spring-animated lamp glow above the active item.",
    tags: ["navbar", "floating", "animated", "tubelight", "pill", "framer-motion", "responsive"],
  },
  {
    name: "MD3Switch",
    slug: "md3-switch",
    path: "forms/MD3Switch.tsx",
    category: "forms",
    code: `import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, X } from "lucide-react"

// ── Spring easing ──────────────────────────────────────────────────
const SWITCH_THEME = {
  "--ease-spring": "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
} as React.CSSProperties

const switchVariants = cva(
  "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-300 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "peer-checked:bg-primary peer-checked:border-primary",
        destructive: "peer-checked:bg-destructive peer-checked:border-destructive",
      },
      size: {
        default: "h-8 w-[52px]",
        sm: "h-6 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

// ── Web Audio haptic feedback ──────────────────────────────────────
const playHapticFeedback = (type: "heavy" | "light" | "none") => {
  if (type === "none" || typeof window === "undefined") return
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    const now = ctx.currentTime
    if (type === "heavy") {
      oscillator.type = "triangle"
      oscillator.frequency.setValueAtTime(180, now)
      oscillator.frequency.exponentialRampToValueAtTime(40, now + 0.15)
      gainNode.gain.setValueAtTime(0.4, now)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12)
      oscillator.start(now)
      oscillator.stop(now + 0.15)
    } else {
      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(800, now)
      gainNode.gain.setValueAtTime(0.15, now)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08)
      oscillator.start(now)
      oscillator.stop(now + 0.08)
    }
  } catch { /* silent fail */ }
}

export interface MD3SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof switchVariants> {
  onCheckedChange?: (checked: boolean) => void
  showIcons?: boolean
  checkedIcon?: React.ReactNode
  uncheckedIcon?: React.ReactNode
  haptic?: "heavy" | "light" | "none"
}

export const MD3Switch = React.forwardRef<HTMLInputElement, MD3SwitchProps>(
  ({
    className,
    size,
    variant,
    checked,
    defaultChecked,
    onCheckedChange,
    showIcons = false,
    checkedIcon,
    uncheckedIcon,
    haptic = "none",
    style,
    disabled,
    ...props
  }, ref) => {
    const [isChecked, setIsChecked] = React.useState(defaultChecked ?? false)
    const [isPressed, setIsPressed] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)

    React.useEffect(() => {
      if (checked !== undefined) setIsChecked(checked)
    }, [checked])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return
      const newValue = e.target.checked
      playHapticFeedback(haptic ?? "none")
      if (checked === undefined) setIsChecked(newValue)
      onCheckedChange?.(newValue)
    }

    const isSmall = size === "sm"
    const translateDist = isSmall ? "translate-x-[16px]" : "translate-x-[20px]"
    const handleSizeUnchecked = isSmall ? "w-3 h-3 ml-[2px]" : "w-4 h-4 ml-[2px]"
    const handleSizeChecked = isSmall ? "w-4 h-4" : "w-6 h-6"
    const handleSizePressed = isSmall ? "w-5 h-5 -ml-[2px]" : "w-7 h-7 -ml-[2px]"
    const iconClasses = isSmall ? "w-2.5 h-2.5" : "w-3.5 h-3.5"
    const shouldRenderIcons = showIcons || checkedIcon || uncheckedIcon

    const haloLeft = isChecked
      ? (isSmall ? "left-[10px]" : "left-[14px]")
      : shouldRenderIcons && !isSmall
        ? "left-[14px]"
        : isSmall
          ? "left-[8px]"
          : "left-[10px]"

    return (
      <label
        className={[
          "group relative inline-flex items-center justify-center",
          disabled ? "cursor-not-allowed opacity-50" : "",
          "min-w-[48px] min-h-[48px]",
        ].join(" ")}
        style={{ ...SWITCH_THEME, ...style }}
        onPointerDown={() => !disabled && setIsPressed(true)}
        onPointerUp={() => setIsPressed(false)}
        onPointerLeave={() => { setIsPressed(false); setIsHovered(false) }}
        onPointerEnter={() => !disabled && setIsHovered(true)}
      >
        <input
          type="checkbox"
          className="peer sr-only"
          ref={ref}
          checked={isChecked}
          onChange={handleChange}
          disabled={disabled}
          {...props}
        />

        {/* Track */}
        <div
          className={[
            switchVariants({ variant, size }),
            // The unchecked outline shows where the handle can travel, so it
            // takes the muted text colour, which clears 3:1, not the hairline.
            "bg-muted border-muted-foreground",
            "peer-checked:bg-primary peer-checked:border-primary",
            className ?? "",
          ].join(" ")}
        >
          {/* Handle container */}
          <div
            className={[
              "pointer-events-none block h-full w-full transition-transform duration-300 ease-[var(--ease-spring)]",
              isChecked ? translateDist : "translate-x-0",
            ].join(" ")}
          >
            {/* Handle */}
            <div
              className={[
                "absolute top-1/2 -translate-y-1/2 shadow-sm transition-[width,height,margin-left,background-color,color] duration-300 flex items-center justify-center rounded-full left-[2px]",
                isChecked ? "bg-primary-foreground" : "bg-foreground text-muted",
                isChecked && variant === "primary" ? "text-primary" : "",
                isChecked && variant === "destructive" ? "text-destructive" : "",
                isPressed
                  ? handleSizePressed
                  : isChecked || (shouldRenderIcons && !isSmall)
                    ? handleSizeChecked
                    : handleSizeUnchecked,
              ].join(" ")}
            >
              {shouldRenderIcons && (
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                  {/* Checked icon */}
                  <div
                    className={[
                      "absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-300",
                      isChecked ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-45",
                    ].join(" ")}
                  >
                    {checkedIcon ?? <Check className={iconClasses} strokeWidth={4} />}
                  </div>
                  {/* Unchecked icon */}
                  <div
                    className={[
                      "absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-300 text-muted-foreground",
                      !isChecked ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 rotate-45",
                    ].join(" ")}
                  >
                    {uncheckedIcon ?? <X className={iconClasses} strokeWidth={4} />}
                  </div>
                </div>
              )}
            </div>

            {/* Halo */}
            <div
              className={[
                "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full pointer-events-none transition-[opacity,transform] duration-200",
                isSmall ? "w-8 h-8" : "w-10 h-10",
                isChecked
                  ? variant === "destructive" ? "bg-destructive" : "bg-primary"
                  : "bg-foreground",
                isPressed ? "opacity-10 scale-100" : isHovered ? "opacity-5 scale-100" : "opacity-0 scale-50",
                haloLeft,
              ].join(" ")}
            />
          </div>
        </div>
      </label>
    )
  }
)
MD3Switch.displayName = "MD3Switch"`,
    description: "Material 3 style switch whose handle grows when pressed, with optional icons.",
    tags: ["switch", "toggle", "material-design", "md3", "animated", "haptic", "physics"],
  },
  {
    name: "DualConfirmDialog",
    slug: "dual-confirm-dialog",
    path: "dialogs/DualConfirmDialog.tsx",
    category: "dialogs",
    code: `import { useEffect, useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"

const EXIT_MS = 160

// @starting-style drives the entrance (paint-driven, not a mount effect +
// requestAnimationFrame, so it isn't silently skipped if the tab was
// backgrounded when the dialog opened). Exit still needs JS: the dialog has
// to stay mounted for one transition after \`open\` goes false, which
// [data-closing] below drives, kept in sync with the delayed unmount.
const dialogStyle = \`
  .yui-dialog-backdrop {
    opacity: 1;
    transition: opacity 200ms cubic-bezier(0.23,1,0.32,1);
  }
  @starting-style { .yui-dialog-backdrop { opacity: 0; } }
  .yui-dialog-backdrop[data-closing="true"] { opacity: 0; }

  .yui-dialog {
    opacity: 1;
    transform: scale(1);
    transition: transform 200ms cubic-bezier(0.23,1,0.32,1), opacity 200ms cubic-bezier(0.23,1,0.32,1);
  }
  @starting-style { .yui-dialog { opacity: 0; transform: scale(0.96); } }
  .yui-dialog[data-closing="true"] { opacity: 0; transform: scale(0.96); }
\`;

export interface DeleteProgress {
  current: number
  total: number
  strategy?: "frontend" | "backend"
}

export interface DualConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
  itemCount: number
  itemType: string
  confirmationPhrase?: string
  isLoading?: boolean
  progress?: DeleteProgress | null
}

export function DualConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemCount,
  itemType,
  confirmationPhrase = "DELETE",
  isLoading = false,
  progress = null,
}: DualConfirmDialogProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [inputValue, setInputValue] = useState("")

  // Keep the dialog mounted for one exit transition after \`open\` flips to
  // false — interruptible if \`open\` flips back true before the timer fires.
  const [rendered, setRendered] = useState(open)

  useEffect(() => {
    if (open) {
      setRendered(true)
      return
    }
    const timer = setTimeout(() => setRendered(false), EXIT_MS)
    return () => clearTimeout(timer)
  }, [open])

  const handleFirstConfirm = () => setStep(2)
  const handleFinalConfirm = () => { if (inputValue === confirmationPhrase) onConfirm() }
  const handleClose = () => {
    if (isLoading) return
    setStep(1)
    setInputValue("")
    onOpenChange(false)
  }

  const progressPercentage = progress
    ? Math.round((progress.current / progress.total) * 100)
    : 0

  if (!rendered) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <style>{dialogStyle}</style>

      {/* Backdrop */}
      <div
        className="yui-dialog-backdrop absolute inset-0 bg-black/50"
        data-closing={!open ? "true" : undefined}
        onClick={handleClose}
      />

      {/* Dialog — transform-origin stays centered; it isn't anchored to a trigger */}
      <div
        className="yui-dialog relative z-10 w-full max-w-md mx-4 bg-background border border-border rounded-lg shadow-xl"
        data-closing={!open ? "true" : undefined}
      >
        {/* Header */}
        <div className="p-6 pb-0">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            {title}
          </h2>
        </div>

        {/* Body */}
        <div className="p-6">
          {isLoading && progress ? (
            /* Progress view */
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-sm">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Deleting items...</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full transition-[width] duration-300 ease-[cubic-bezier(0.77,0,0.175,1)]"
                  style={{ width: \`\${progressPercentage}%\` }}
                />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {progress.current} of {progress.total}
                {progress.strategy === "frontend" && " (sequential mode)"}
                {progress.strategy === "backend" && " (batch mode)"}
              </p>
            </div>
          ) : step === 1 ? (
            /* Step 1: warning */
            <div className="space-y-4">
              <p className="text-muted-foreground">{description}</p>
              <div className="p-3 bg-destructive/10 rounded-md border border-destructive/20">
                <p className="font-semibold text-destructive">
                  You are about to delete {itemCount} {itemType}{itemCount > 1 ? "s" : ""}.
                </p>
                <p className="text-sm text-foreground/60 mt-1">This action cannot be undone.</p>
              </div>
            </div>
          ) : (
            /* Step 2: type to confirm */
            <div className="space-y-4">
              <p className="font-medium text-destructive">⚠️ Final Confirmation Required</p>
              <p className="text-sm text-muted-foreground">
                Type{" "}
                <code className="bg-muted px-2 py-0.5 rounded font-mono text-foreground">
                  {confirmationPhrase}
                </code>{" "}
                to confirm deletion of {itemCount} {itemType}{itemCount > 1 ? "s" : ""}.
              </p>
              <input
                className="w-full px-3 py-2 text-sm font-mono uppercase border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-50"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={\`Type \${confirmationPhrase} to confirm\`}
                autoFocus
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inputValue === confirmationPhrase) handleFinalConfirm()
                }}
              />
              <p className="text-xs text-muted-foreground">Note: Type in UPPERCASE letters</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!(isLoading && progress) && (
          <div className="flex justify-end gap-2 px-6 pb-6">
            {step === 1 ? (
              <>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm rounded-md border border-border bg-background hover:bg-muted transition-[background-color,transform] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFirstConfirm}
                  className="px-4 py-2 text-sm rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-[background-color,transform] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
                >
                  Continue to Final Confirmation
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm rounded-md border border-border bg-background hover:bg-muted transition-[background-color,transform] active:scale-[0.97] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
                >
                  Go Back
                </button>
                <button
                  onClick={handleFinalConfirm}
                  disabled={inputValue !== confirmationPhrase || isLoading}
                  className="px-4 py-2 text-sm rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-[background-color,transform] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
                >
                  Delete Permanently
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}`,
    description: "Two-step delete dialog that asks you to type a phrase before it confirms.",
    tags: ["confirmation", "destructive", "two-step", "modal", "bulk-delete", "loading", "progress"],
  },
  {
    name: "BlenderUpload",
    slug: "blender-upload",
    path: "forms/BlenderUpload.tsx",
    category: "forms",
    code: `import { useCallback, useState, useRef } from "react"

interface BlenderUploadProps {
  onFileSelect: (file: File, dataUrl: string) => void
  onError?: (message: string) => void
  accept?: string
  maxSizeMB?: number
  disabled?: boolean
}

export function BlenderUpload({
  onFileSelect,
  onError,
  accept = ".jpg,.jpeg,.png",
  maxSizeMB = 1,
  disabled = false,
}: BlenderUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isBlending, setIsBlending] = useState(false)
  const [blendComplete, setBlendComplete] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>("")

  const processFile = useCallback(
    async (file: File) => {
      if (disabled) return

      const validTypes = ["image/jpeg", "image/jpg", "image/png"]
      if (!validTypes.includes(file.type)) {
        const errorMsg = "Only .jpg, .jpeg, .png files are allowed"
        onError?.(errorMsg)
        return
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
        const errorMsg = \`Image must be less than \${maxSizeMB} MB (selected: \${fileSizeMB} MB)\`
        onError?.(errorMsg)
        return
      }

      setIsBlending(true)
      setBlendComplete(false)
      setPreviewUrl("")

      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        setTimeout(() => {
          setIsBlending(false)
          setBlendComplete(true)
          setPreviewUrl(dataUrl)
          onFileSelect(file, dataUrl)
        }, 2000)
      }
      reader.onerror = () => {
        setIsBlending(false)
        onError?.("Failed to read file")
      }
      reader.readAsDataURL(file)
    },
    [disabled, maxSizeMB, onError, onFileSelect]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (disabled || isBlending || blendComplete) return
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [disabled, isBlending, blendComplete, processFile]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled && !isBlending && !blendComplete) setIsDragging(true)
    },
    [disabled, isBlending, blendComplete]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleClick = useCallback(() => {
    if (!disabled && !isBlending && !blendComplete) fileInputRef.current?.click()
  }, [disabled, isBlending, blendComplete])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return
      // Space would scroll the page if it reached the document.
      if (e.key === " ") e.preventDefault()
      handleClick()
    },
    [handleClick]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
      e.target.value = ""
    },
    [processFile]
  )

  const resetUpload = useCallback(() => {
    setBlendComplete(false)
    setPreviewUrl("")
  }, [])

  return (
    <div
      className={\`relative overflow-hidden rounded-xl transition-transform duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22] \${isDragging ? "scale-[1.02]" : ""} \${disabled ? "opacity-50 cursor-not-allowed" : blendComplete ? "cursor-default" : "cursor-pointer"}\`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      style={{ background: "#FFFFFF" }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      <div
        className={\`relative p-6 m-3 border-2 border-dashed rounded-lg transition-colors \${
          isDragging ? "border-[#92A086] bg-[#92A086]/5" : blendComplete ? "border-[#92A086]" : "border-gray-300"
        }\`}
        style={{ background: "#FFFFFF" }}
      >
        <div className="flex flex-col items-center justify-center">

          {/* Blender SVG (hidden when complete) */}
          {!blendComplete && (
            <svg viewBox="0 0 200 260" className="w-44 h-56">
              {!isBlending && (
                <>
                  {/* Left fruits */}
                  <g>
                    <g className={isDragging ? "animate-bounce" : ""} style={{ animationDelay: "0s" }}>
                      <circle cx="25" cy="35" r="14" fill="#F97316" />
                      <ellipse cx="21" cy="31" rx="4" ry="5" fill="#FDBA74" opacity="0.5" />
                      <circle cx="25" cy="24" r="3" fill="#92A086" />
                    </g>
                    <g className={isDragging ? "animate-bounce" : ""} style={{ animationDelay: "0.1s" }}>
                      <circle cx="18" cy="58" r="11" fill="#FB923C" />
                      <ellipse cx="15" cy="55" rx="3" ry="4" fill="#FED7AA" opacity="0.5" />
                    </g>
                    <g className={isDragging ? "animate-bounce" : ""} style={{ animationDelay: "0.2s" }}>
                      <circle cx="35" cy="70" r="9" fill="#F97316" />
                      <ellipse cx="32" cy="67" rx="2.5" ry="3" fill="#FDBA74" opacity="0.4" />
                    </g>
                  </g>
                  {/* Right fruits */}
                  <g>
                    <g className={isDragging ? "animate-bounce" : ""} style={{ animationDelay: "0.15s" }}>
                      <path d="M160 28 Q173 32, 177 48 Q179 64, 169 72 Q160 76, 151 72 Q141 64, 143 48 Q147 32, 160 28" fill="#DC2626" />
                      <ellipse cx="151" cy="49" rx="5" ry="8" fill="#FCA5A5" opacity="0.4" />
                      <ellipse cx="150" cy="46" rx="1.5" ry="2.5" fill="#FDE047" />
                      <ellipse cx="157" cy="54" rx="1.5" ry="2.5" fill="#FDE047" />
                      <ellipse cx="167" cy="52" rx="1.5" ry="2.5" fill="#FDE047" />
                      <ellipse cx="161" cy="64" rx="1.5" ry="2.5" fill="#FDE047" />
                      <ellipse cx="151" cy="59" rx="1.5" ry="2.5" fill="#FDE047" />
                      <path d="M160 28 Q160 18, 168 14 Q165 22, 160 28" fill="#92A086" />
                    </g>
                    <g className={isDragging ? "animate-bounce" : ""} style={{ animationDelay: "0.3s" }}>
                      <circle cx="175" cy="45" r="8" fill="#3B82F6" />
                      <circle cx="172" cy="42" r="2" fill="#93C5FD" opacity="0.6" />
                      <circle cx="167" cy="56" r="6" fill="#2563EB" />
                      <circle cx="165" cy="54" r="1.5" fill="#93C5FD" opacity="0.5" />
                      <circle cx="180" cy="58" r="5" fill="#3B82F6" />
                    </g>
                  </g>
                </>
              )}

              {/* Blender jar */}
              <g>
                <path d="M55 85 L50 195 Q50 210, 70 210 L130 210 Q150 210, 150 195 L145 85 Z" fill="#FFFFFF" stroke="#92A086" strokeWidth="2" />
                <path d="M60 90 L57 190" stroke="rgba(146,160,134,0.2)" strokeWidth="3" strokeLinecap="round" />
                {isBlending && (
                  <g>
                    <path d="M54 130 L52 195 Q52 205, 70 205 L130 205 Q148 205, 148 195 L146 130 Z" fill="#92A086" opacity="0.7" />
                    <circle cx="75" cy="155" r="4" fill="#B8C4AC" opacity="0.8" style={{ animation: "blender-bubble1 1s ease-in-out infinite" }} />
                    <circle cx="100" cy="170" r="5" fill="#A8B89C" opacity="0.7" style={{ animation: "blender-bubble2 1.3s ease-in-out infinite" }} />
                    <circle cx="125" cy="150" r="3" fill="#C8D4BC" opacity="0.8" style={{ animation: "blender-bubble3 0.9s ease-in-out infinite" }} />
                    <circle cx="85" cy="180" r="3.5" fill="#B8C4AC" opacity="0.6" style={{ animation: "blender-bubble1 1.1s ease-in-out infinite" }} />
                    <circle cx="115" cy="163" r="4" fill="#A8B89C" opacity="0.7" style={{ animation: "blender-bubble2 1.4s ease-in-out infinite" }} />
                  </g>
                )}
                <path d="M50 105 Q20 105, 20 135 L20 165 Q20 185, 40 185 L50 185" fill="none" stroke="#92A086" strokeWidth="10" strokeLinecap="round" />
                <path d="M50 105 Q25 105, 25 135 L25 165 Q25 180, 40 180 L50 180" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
                <rect x="60" y="210" width="80" height="20" rx="4" fill="#92A086" />
                <rect x="65" y="214" width="70" height="12" rx="3" fill="#7A8A70" />
              </g>
            </svg>
          )}

          {/* Smoothie glass (shown when complete) */}
          {blendComplete && (
            <svg viewBox="0 0 160 200" className="w-40 h-52" style={{ animation: "glass-appear 0.5s ease-out forwards" }}>
              <rect x="95" y="10" width="6" height="120" rx="3" fill="#92A086" />
              <rect x="96.5" y="10" width="2" height="120" fill="#A8B89C" opacity="0.5" />
              <path d="M35 50 L30 160 Q30 175, 50 175 L110 175 Q130 175, 130 160 L125 50 Z" fill="url(#smoothieGradient)" stroke="#92A086" strokeWidth="2" />
              <path d="M40 55 L37 155" stroke="rgba(255,255,255,0.6)" strokeWidth="4" strokeLinecap="round" />
              <ellipse cx="80" cy="55" rx="45" ry="8" fill="#A8B89C" />
              <circle cx="65" cy="53" r="4" fill="#F97316" />
              <circle cx="85" cy="55" r="3" fill="#3B82F6" />
              <circle cx="95" cy="52" r="3.5" fill="#DC2626" />
              <ellipse cx="80" cy="45" rx="30" ry="12" fill="white" />
              <ellipse cx="70" cy="42" rx="15" ry="8" fill="#FAFAFA" />
              <ellipse cx="90" cy="43" rx="12" ry="7" fill="#F5F5F5" />
              <circle cx="80" cy="32" r="10" fill="#DC2626" />
              <ellipse cx="76" cy="28" rx="3" ry="4" fill="#FCA5A5" opacity="0.6" />
              <path d="M80 22 Q82 15, 88 12" stroke="#92A086" strokeWidth="2" fill="none" />
              <ellipse cx="89" cy="11" rx="4" ry="2" fill="#92A086" />
              <defs>
                <linearGradient id="smoothieGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#B8C4AC" />
                  <stop offset="50%" stopColor="#92A086" />
                  <stop offset="100%" stopColor="#7A8A70" />
                </linearGradient>
              </defs>
            </svg>
          )}

          {/* Text */}
          <div className="mt-4 text-center">
            <h3 className={\`text-xl font-bold transition-colors \${isBlending ? "text-[#7A8A70]" : blendComplete ? "text-[#5f6e55]" : "text-gray-800"}\`}>
              {isBlending ? "Uploading..." : blendComplete ? "🍹 Smoothie Served!" : "Drop files to upload"}
            </h3>
            <p className="mt-2 text-gray-500">
              {isBlending ? (
                "Wait a moment, it's almost ready"
              ) : blendComplete ? (
                "Your image is ready to use!"
              ) : (
                <>or <span className="text-[#5f6e55] font-semibold hover:underline">browse</span> to choose a file</>
              )}
            </p>
          </div>

          {/* Preview */}
          {blendComplete && previewUrl && (
            <div className="mt-5 p-3 bg-white rounded-lg shadow-md border border-[#92A086]/30">
              <p className="text-xs text-[#5f6e55] font-medium mb-2 text-center">📸 Your Image</p>
              <img src={previewUrl} alt="Uploaded preview" className="max-w-40 max-h-[100px] rounded-md object-cover mx-auto" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); resetUpload() }}
                className="mt-2 w-full py-1.5 px-3 text-xs font-medium text-[#5f6e55] bg-[#92A086]/10 hover:bg-[#92A086]/20 rounded-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
              >
                Change image
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{\`
        @keyframes blender-bubble1 {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.8; }
          50% { transform: translateY(-6px) scale(1.1); opacity: 0.5; }
        }
        @keyframes blender-bubble2 {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.7; }
          50% { transform: translateY(-10px) scale(0.9); opacity: 0.4; }
        }
        @keyframes blender-bubble3 {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.8; }
          50% { transform: translateY(-5px) scale(1.15); opacity: 0.5; }
        }
        @keyframes glass-appear {
          0% { opacity: 0; transform: scale(0.9) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      \`}</style>
    </div>
  )
}`,
    description: "Image drop zone illustrated as a blender, with fruit that bounces while dragging.",
    tags: ["upload", "drag-drop", "animated", "file-input", "svg", "playful", "image-preview"],
  },
  {
    name: "EmptyState",
    slug: "empty-state",
    path: "feedback/EmptyState.tsx",
    category: "feedback",
    code: `import { Plus } from "lucide-react"

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  actionLabel?: string
  onAction?: () => void
  showAction?: boolean
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel = "Create",
  onAction,
  showAction = true,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      {icon && (
        <div className="mb-4 text-muted-foreground/40">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
      {showAction && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
        >
          <Plus className="h-4 w-4" />
          {actionLabel}
        </button>
      )}
    </div>
  )
}`,
    description: "Centred empty state with an optional icon, a short explanation and one action.",
    tags: ["empty", "placeholder", "no-data", "cta", "illustration-slot"],
  },
  {
    name: "CheckboxVariants",
    slug: "checkbox-variants",
    path: "forms/CheckboxVariants.tsx",
    category: "forms",
    code: `"use client"

import * as React from "react"

const CustomCheckbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      type="checkbox"
      ref={ref}
      className={[
        "relative box-border block h-[1.5rem] w-[1.5rem] cursor-pointer appearance-none rounded-md border border-[color:var(--bz-line-control,#8a8a8e)] bg-slate-200 transition-[background-color,border-color] duration-300",
        "before:absolute before:left-2/4 before:top-[42%] before:h-[10px] before:w-[6px]",
        "before:-translate-x-2/4 before:-translate-y-2/4 before:rotate-45 before:scale-75",
        "before:border-b-2 before:border-r-2 before:border-solid before:border-b-white before:border-r-white",
        "before:opacity-0 before:transition-[transform,opacity] before:delay-100 before:duration-100 before:ease-[cubic-bezier(0.77,0,0.175,1)] before:content-['']",
        "after:absolute after:inset-0 after:rounded-[7px] after:opacity-0",
        "after:shadow-[0_0_0_calc(30px_/_2.5)_#1677ff] after:transition-[opacity,box-shadow] after:duration-500 after:ease-out after:content-['']",
        "checked:border-transparent checked:bg-[#1677ff]",
        "checked:before:-translate-x-2/4 checked:before:-translate-y-2/4",
        "checked:before:rotate-45 checked:before:scale-x-[1.4] checked:before:scale-y-[1.4]",
        "checked:before:opacity-100 checked:before:transition-[transform,opacity] checked:before:delay-100 checked:before:duration-200",
        "hover:border-[#1677ff] outline-2 outline-offset-1 outline-[#1677ff] focus-visible:outline",
        "[&:active:not(:checked)]:after:opacity-100 [&:active:not(:checked)]:after:shadow-none [&:active:not(:checked)]:after:transition-none",
        className,
      ].filter(Boolean).join(" ")}
      {...props}
    />
  )
)
CustomCheckbox.displayName = "CustomCheckbox"

const GradientCheckbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <label className="relative block cursor-pointer select-none rounded-md text-3xl outline-2 outline-offset-1 outline-gray-700 has-[:focus-visible]:outline">
      <input ref={ref} type="checkbox" className="peer absolute opacity-0" {...props} />
      <div className={[
        "relative left-0 top-0 h-[1.6rem] w-[1.6rem] rounded-[0.3em] bg-white transition-[background-color,box-shadow] duration-300",
        "after:absolute after:left-0 after:top-0 after:h-[1.6rem] after:w-[1.6rem]",
        "after:rotate-0 after:rounded-[0.3em] after:border-[2px] after:border-[rgba(0,0,0,0.863)]",
        "after:transition-[left,top,height,width,border-radius,border-color,transform] after:delay-100 after:duration-300 after:content-['']",
        "peer-checked:bg-black",
        "peer-checked:shadow-[-13px_-13px_40px_0px_rgb(17,0,248),13px_-0_40px_0px_rgb(243,11,243),13px_-13px_40px_0px_rgb(253,228,0),13px_0_40px_0px_rgb(107,255,21),13px_13px_40px_0px_rgb(76,0,255),13px_13px_40px_0px_rgb(255,196,0),-13px_13px_40px_0px_rgb(90,105,240)]",
        "peer-checked:after:left-2 peer-checked:after:top-[1px] peer-checked:after:h-[0.6em]",
        "peer-checked:after:w-[0.35em] peer-checked:after:rotate-45 peer-checked:after:rounded-[0em]",
        "peer-checked:after:border-b-[0.1em] peer-checked:after:border-r-[0.1em]",
        "peer-checked:after:border-[rgba(238,238,238,0)_white_white_#fff0]",
        "dark:bg-black dark:after:border-[rgba(255,255,255,0.863)]",
        "dark:peer-checked:bg-white dark:peer-checked:after:border-[rgba(238,238,238,0)_black_black_#fff0]",
        className,
      ].filter(Boolean).join(" ")} />
    </label>
  )
)
GradientCheckbox.displayName = "GradientCheckbox"

const TransformerCheckbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <label className="relative block h-[1.5rem] w-[1.5rem] cursor-pointer rounded-sm outline-2 outline-offset-1 outline-gray-700 has-[:focus-visible]:outline">
      <input ref={ref} type="checkbox" className="peer absolute h-0 w-0 opacity-0" {...props} />
      <span className={[
        "block h-[inherit] w-[inherit] rounded-md border-[2px] border-black transition-[margin,height,width,transform,border-radius,border-color] duration-300",
        "peer-checked:ml-1 peer-checked:h-5 peer-checked:w-3",
        "peer-checked:translate-x-[2px] peer-checked:translate-y-[-1px]",
        "peer-checked:rotate-45 peer-checked:rounded-none",
        "peer-checked:border-b-[2px] peer-checked:border-l-transparent peer-checked:border-t-transparent",
        "dark:border-white",
        className,
      ].filter(Boolean).join(" ")} />
    </label>
  )
)
TransformerCheckbox.displayName = "TransformerCheckbox"

const AnimatedCheckbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <label className="relative block cursor-pointer select-none rounded-full text-2xl outline-2 outline-offset-1 outline-[#0b6e4f] has-[:checked]:rounded-md has-[:focus-visible]:outline">
      <input ref={ref} type="checkbox" className="peer absolute h-0 w-0 opacity-0" {...props} />
      <div className={[
        "relative left-0 top-0 h-[1.5rem] w-[1.5rem] rounded-[50%] border border-[color:var(--bz-line-control,#8a8a8e)] bg-slate-200 transition duration-300",
        "after:absolute after:left-[0.5rem] after:top-1 after:hidden after:h-[0.8rem] after:w-[0.5rem]",
        "after:rotate-45 after:border-b-[0.2rem] after:border-r-[0.2rem] after:content-['']",
        "focus:outline-[#0b6e4f]",
        "peer-checked:animate-pulse peer-checked:rounded-lg peer-checked:border-[#0b6e4f] peer-checked:bg-[#0b6e4f] peer-checked:after:block",
        className,
      ].filter(Boolean).join(" ")} />
    </label>
  )
)
AnimatedCheckbox.displayName = "AnimatedCheckbox"

export { CustomCheckbox, GradientCheckbox, TransformerCheckbox, AnimatedCheckbox }`,
    description: "Four decorative checkbox styles: tick pop, gradient glow, morph and pulse.",
    tags: ["checkbox", "animated", "variants", "gradient", "morphing", "tailwind", "custom"],
  },
  {
    name: "LoadingSpinner",
    slug: "loading-spinner",
    path: "feedback/LoadingSpinner.tsx",
    category: "feedback",
    code: `const sizes = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-[3px]",
  lg: "h-12 w-12 border-4",
}

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export const LoadingSpinner = ({ size = "md", className }: LoadingSpinnerProps) => (
  <div className={\`flex items-center justify-center\${className ? \` \${className}\` : ""}\`}>
    <div className={\`animate-spin rounded-full border-primary border-t-transparent \${sizes[size]}\`} />
  </div>
)`,
    description: "Border spinner in three sizes that takes its colour from the primary token.",
    tags: ["loading", "spinner", "animation", "minimal"],
  },
  {
    name: "PriceBreakdown",
    slug: "price-breakdown",
    path: "cards/PriceBreakdown.tsx",
    category: "cards",
    code: `import { IndianRupee, Receipt, Percent } from "lucide-react"

interface PriceBreakdownProps {
  price: number
  gstPercent: number
  priceLabel?: string
}

export function PriceBreakdown({
  price,
  gstPercent,
  priceLabel = "Base Price",
}: PriceBreakdownProps) {
  const validPrice = Number.isFinite(price) && price > 0 ? price : 0
  const validGst = Number.isFinite(gstPercent) && gstPercent >= 0 ? gstPercent : 0

  if (validPrice === 0) return null

  const gstAmount = validPrice * (validGst / 100)
  const totalPrice = validPrice + gstAmount

  return (
    <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        <Receipt className="h-4 w-4" />
        Price Breakdown
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <IndianRupee className="h-3.5 w-3.5" />
            {priceLabel}
          </span>
          <span className="font-medium">
            ₹{validPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Percent className="h-3.5 w-3.5" />
            GST ({validGst}%)
          </span>
          <span className="font-medium">
            {gstAmount > 0
              ? \`₹\${gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`
              : "—"}
          </span>
        </div>

        <div className="border-t" />

        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Total Price</span>
          <span className="text-lg font-bold text-primary">
            ₹{totalPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  )
}`,
    description: "Read-only price card that adds GST to a base price in rupees.",
    tags: ["pricing", "tax", "breakdown", "receipt", "finance", "display"],
  },
  {
    name: "Pagination",
    slug: "pagination",
    path: "navigation/Pagination.tsx",
    category: "navigation",
    code: `import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

function paginationLinkClass(isActive?: boolean, extra?: string) {
  const base =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 w-10"
  const variant = isActive
    ? "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
    : "hover:bg-accent hover:text-accent-foreground"
  return [base, variant, extra ?? ""].filter(Boolean).join(" ")
}

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={\`mx-auto flex w-full justify-center\${className ? \` \${className}\` : ""}\`}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      className={\`flex flex-row items-center gap-1\${className ? \` \${className}\` : ""}\`}
      {...props}
    />
  )
)
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
  ({ className, ...props }, ref) => <li ref={ref} className={className} {...props} />
)
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & React.ComponentProps<"a">

const PaginationLink = ({ className, isActive, ...props }: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={paginationLinkClass(isActive, className)}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({ className, ...props }: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    className={\`gap-1 pl-2.5 w-auto px-4\${className ? \` \${className}\` : ""}\`}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({ className, ...props }: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    className={\`gap-1 pr-2.5 w-auto px-4\${className ? \` \${className}\` : ""}\`}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={\`flex h-10 w-10 items-center justify-center\${className ? \` \${className}\` : ""}\`}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
}`,
    description: "Composable pagination with labelled previous and next links and a current page marker.",
    tags: ["pagination", "composable", "accessible", "aria"],
  },
  {
    name: "CustomCursor",
    slug: "custom-cursor",
    path: "interaction/CustomCursor.tsx",
    category: "interaction",
    code: `"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    let currentX = window.innerWidth / 2;
    let currentY = window.innerHeight / 2;

    const onMove = (e: MouseEvent) => {
      currentX = e.clientX;
      currentY = e.clientY;
      cursor.classList.add("active");
      gsap.to(cursor, {
        x: currentX - cursor.offsetWidth / 2,
        y: currentY - cursor.offsetHeight / 2,
        duration: 0.55,
        ease: "power3.out",
      });
    };

    const onEnterGrow = () => gsap.to(cursor, { scale: 2.5, duration: 0.3, ease: "power2.out" });
    const onLeaveGrow = () => gsap.to(cursor, { scale: 1, duration: 0.3, ease: "power2.out" });

    const onHide = () => gsap.to(cursor, { opacity: 0, duration: 0.3 });
    const onShow = () => cursor.classList.contains("active") && gsap.to(cursor, { opacity: 1, duration: 0.3 });

    const setupGrow = () => {
      document.querySelectorAll("[data-cursor-grow]").forEach((el) => {
        el.addEventListener("mouseenter", onEnterGrow);
        el.addEventListener("mouseleave", onLeaveGrow);
      });
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onHide);
    document.addEventListener("mouseenter", onShow);
    setupGrow();

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onHide);
      document.removeEventListener("mouseenter", onShow);
      document.querySelectorAll("[data-cursor-grow]").forEach((el) => {
        el.removeEventListener("mouseenter", onEnterGrow);
        el.removeEventListener("mouseleave", onLeaveGrow);
      });
    };
  }, []);

  return (
    <>
      <style>{\`
        .yui-cursor {
          width: 1.7rem; height: 1.7rem;
          position: fixed; top: 0; left: 0;
          pointer-events: none;
          mix-blend-mode: difference;
          z-index: 100000; opacity: 0;
          transition: opacity 0.3s;
        }
        .yui-cursor.active { opacity: 1; }
        .yui-cursor-bar {
          position: absolute;
          background-color: #fff;
        }
        .yui-cursor-left, .yui-cursor-right {
          width: 0.5rem; height: 0.2rem;
          top: 50%; transform: translateY(-50%);
        }
        .yui-cursor-top, .yui-cursor-bottom {
          height: 0.5rem; width: 0.2rem;
          left: 50%; transform: translateX(-50%);
        }
        .yui-cursor-right { right: 0; }
        .yui-cursor-left { left: 0; }
        .yui-cursor-top { top: 0; }
        .yui-cursor-bottom { bottom: 0; }
        @media (max-width: 768px) { .yui-cursor { display: none; } }
      \`}</style>
      <div className="yui-cursor" ref={cursorRef}>
        <span className="yui-cursor-bar yui-cursor-top" />
        <span className="yui-cursor-bar yui-cursor-bottom" />
        <span className="yui-cursor-bar yui-cursor-left" />
        <span className="yui-cursor-bar yui-cursor-right" />
      </div>
    </>
  );
}`,
    description: "Crosshair cursor that eases after the pointer and grows over marked targets.",
    tags: ["cursor", "gsap", "crosshair", "mix-blend-mode", "interactive"],
  },
  {
    name: "Preloader",
    slug: "preloader",
    path: "loaders/Preloader.tsx",
    category: "loaders",
    code: `"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

type Props = {
  name?: string;
  onComplete: () => void;
};

export function Preloader({ name = "LOADING", onComplete }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const preloader = rootRef.current;
    const counterEl = counterRef.current;
    if (!preloader || !counterEl) return;

    const chars = Array.from(preloader.querySelectorAll<HTMLElement>(".yui-pl-char"));
    const obj = { value: 0 };

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.delayedCall(0.1, onComplete);
      },
    });

    // Count 0 → 100
    tl.to(obj, {
      value: 100,
      duration: 1.6,
      ease: "power2.inOut",
      onUpdate: () => {
        counterEl.textContent = Math.round(obj.value) + "%";
      },
    });

    // Reveal letters
    tl.to(chars, { y: 0, duration: 1, stagger: 0.035, ease: "power3.out" }, 0.2);

    // Fade non-key chars then slide preloader up
    tl.to(chars.slice(1, -1), { opacity: 0, y: "-20%", duration: 0.5, stagger: 0.02, ease: "power2.in" }, "+=0.3");
    tl.to(preloader, { yPercent: -100, duration: 0.9, ease: "power3.inOut" }, "-=0.2");

    return () => { tl.kill(); };
  }, [onComplete]);

  const letters = name.split("").map((ch, i) => (
    <span key={i} className="yui-pl-char" style={{ display: "inline-block", transform: "translateY(110%)" }}>
      {ch === " " ? "\\u00A0" : ch}
    </span>
  ));

  return (
    <>
      <style>{\`
        .yui-pl-root {
          position: fixed; top: 0; left: 0;
          width: 100%; height: 100%;
          z-index: 10000; background: #fff;
          display: flex; justify-content: center; align-items: center;
        }
        .yui-pl-name {
          display: flex; overflow: hidden;
          color: #000;
          font-size: clamp(3rem, 8vw, 12rem);
          font-weight: 500; letter-spacing: -0.05em;
        }
        .yui-pl-counter {
          position: fixed; right: 5rem; bottom: 5rem;
          font-size: clamp(4rem, 6vw, 10rem);
          font-weight: 500; color: #000; overflow: hidden;
        }
      \`}</style>
      <div className="yui-pl-root" ref={rootRef}>
        <div className="yui-pl-name">{letters}</div>
        <div className="yui-pl-counter">
          <span ref={counterRef}>0%</span>
        </div>
      </div>
    </>
  );
}`,
    description: "Full-screen intro that counts to 100 while the name rises, then wipes upward.",
    tags: ["preloader", "gsap", "letter-reveal", "counter", "entrance"],
  },
  {
    name: "SiteHeader",
    slug: "site-header",
    path: "navigation/SiteHeader.tsx",
    category: "navigation",
    code: `"use client";

type NavLink = { label: string; href: string };

type Props = {
  logo?: string;
  logoHref?: string;
  navLinks?: NavLink[];
  ctaLabel?: string;
  ctaHref?: string;
  visible?: boolean;
};

export function SiteHeader({
  logo = "YASH",
  logoHref = "/",
  navLinks = [],
  ctaLabel = "GET IN TOUCH",
  ctaHref = "#contact",
  visible = true,
}: Props) {
  return (
    <>
      <style>{\`
        .yui-site-header {
          display: flex; align-items: center; justify-content: space-between;
          position: fixed; top: 0; left: 0; width: 100%;
          padding: 2rem 5rem; z-index: 1000;
          transform: translateY(-100%);
          transition: transform 0.8s cubic-bezier(0.25,1,0.5,1);
        }
        .yui-site-header.visible { transform: translateY(0); }
        .yui-site-header-logo { font-size: 2rem; letter-spacing: -0.1rem; font-weight: 500; color: #fff; text-decoration: none; }
        .yui-site-header-nav { display: flex; list-style: none; gap: 1.5rem; margin: 0; padding: 0; }
        .yui-nav-item {
          position: relative; overflow: hidden;
          font-size: 1rem; font-weight: 500;
          border-radius: 999px; cursor: pointer;
        }
        .yui-nav-link {
          position: relative; display: inline-flex; flex-direction: column;
          overflow: hidden; line-height: 1; padding: 0.5rem 1.2rem;
          text-decoration: none;
        }
        .yui-nav-link .link-outer { display: block; color: #fff; transition: transform 0.5s cubic-bezier(0.25,1,0.5,1); }
        .yui-nav-link .link-inner {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          color: #000; transform: translateY(100%);
          transition: transform 0.5s cubic-bezier(0.25,1,0.5,1);
        }
        .yui-nav-item:hover .link-outer { transform: translateY(-100%); }
        .yui-nav-item:hover .link-inner { transform: translateY(0); }
        /* Outline goes on the item, not the link: the item clips its children */
        .yui-nav-item:has(:focus-visible) { outline: 2px solid #fff; outline-offset: 2px; }
        .yui-nav-bubble {
          position: absolute; inset: 0; overflow: hidden; border-radius: 999px; pointer-events: none;
        }
        .yui-nav-bubble::before {
          content: ''; position: absolute; width: 150%; height: 150%;
          background: #fff; border-radius: 50%;
          top: 100%; left: -25%; transform: translateY(0);
          transition: top 0.4s cubic-bezier(0.25,1,0.5,1);
        }
        .yui-nav-item:hover .yui-nav-bubble::before { top: -25%; }
        .yui-site-cta {
          position: relative; overflow: hidden;
          display: inline-flex; align-items: center;
          padding: 0.5rem 1.4rem; border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.3);
          font-size: 0.9rem; font-weight: 500; color: #fff;
          text-decoration: none; cursor: pointer;
        }
        .yui-site-cta .link-outer { position: relative; z-index: 1; transition: color 0.3s; }
        .yui-site-cta-bubble {
          position: absolute; inset: 0; overflow: hidden; border-radius: 999px;
        }
        .yui-site-cta-bubble::before {
          content: ''; position: absolute; width: 150%; height: 150%;
          background: #fff; border-radius: 50%;
          top: 100%; left: -25%;
          transition: top 0.4s cubic-bezier(0.25,1,0.5,1);
        }
        .yui-site-cta:hover .yui-site-cta-bubble::before { top: -25%; }
        .yui-site-cta:hover .link-outer { color: #000; }
        .yui-site-cta:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
      \`}</style>
      <header className={\`yui-site-header\${visible ? " visible" : ""}\`}>
        <a href={logoHref} className="yui-site-header-logo">{logo}</a>
        {navLinks.length > 0 && (
          <ul className="yui-site-header-nav">
            {navLinks.map((link) => (
              <li key={link.href} className="yui-nav-item">
                <div className="yui-nav-bubble" />
                <a href={link.href} className="yui-nav-link">
                  <span className="link-outer">{link.label}</span>
                  <span className="link-inner">{link.label}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
        <a href={ctaHref} className="yui-site-cta">
          <div className="yui-site-cta-bubble" />
          <span className="link-outer">{ctaLabel}</span>
        </a>
      </header>
    </>
  );
}`,
    description: "Fixed portfolio header with rolling link text and a bubble fill on hover.",
    tags: ["header", "navbar", "hover-fill", "slide-reveal", "fixed"],
  },
  {
    name: "MobileMenu",
    slug: "mobile-menu",
    path: "navigation/MobileMenu.tsx",
    category: "navigation",
    code: `"use client";
import { useState } from "react";

type NavLink = { label: string; href: string };

type Props = {
  logo?: string;
  logoHref?: string;
  links?: NavLink[];
};

export function MobileMenu({ logo = "YASH", logoHref = "/", links = [] }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <style>{\`
        .yui-mnav {
          display: flex; align-items: center; justify-content: space-between;
          position: fixed; top: 0; left: 0; width: 100%;
          padding: 2rem; z-index: 2000;
          mix-blend-mode: difference;
        }
        .yui-mnav-logo { font-size: 2.5rem; font-weight: 500; color: #fff; text-decoration: none; }
        .yui-burger {
          width: 2.4rem; height: 1.8rem;
          display: flex; flex-direction: column; justify-content: space-between;
          background: none; border: none; cursor: pointer; padding: 0;
        }
        .yui-burger span {
          width: 100%; height: 0.2rem; background: #fff; border-radius: 999px;
          transition: transform 0.4s cubic-bezier(0.25,1,0.5,1), opacity 0.3s;
          transform-origin: center;
        }
        .yui-burger:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
        .yui-burger.open span:nth-child(1) { transform: translateY(0.8rem) rotate(45deg); }
        .yui-burger.open span:nth-child(2) { opacity: 0; }
        .yui-burger.open span:nth-child(3) { transform: translateY(-0.8rem) rotate(-45deg); }
        .yui-moverlay {
          position: fixed; inset: 0; z-index: 1999;
          background: #000;
          display: flex; align-items: center; justify-content: center;
          opacity: 0; visibility: hidden;
          transition: opacity 0.5s, visibility 0.5s;
        }
        .yui-moverlay.open { opacity: 1; visibility: visible; }
        .yui-moverlay ul { display: flex; flex-direction: column; gap: 2.5rem; list-style: none; margin: 0; padding: 0; text-align: center; }
        .yui-moverlay li a {
          display: inline-block;
          font-size: 3rem; font-weight: 500; color: #fff;
          text-decoration: none; text-transform: uppercase; letter-spacing: -0.05em;
          padding: 0.3rem 1.5rem; border: 1px solid rgba(255,255,255,0.2); border-radius: 999px;
          transition: background 0.3s, color 0.3s;
        }
        .yui-moverlay li a:hover { background: #fff; color: #000; }
        .yui-moverlay li a:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
      \`}</style>
      <nav className="yui-mnav">
        <a href={logoHref} className="yui-mnav-logo">{logo}</a>
        <button
          className={\`yui-burger\${open ? " open" : ""}\`}
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <span /><span /><span />
        </button>
      </nav>
      <div className={\`yui-moverlay\${open ? " open" : ""}\`} onClick={() => setOpen(false)}>
        <ul onClick={(e) => e.stopPropagation()}>
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} onClick={() => setOpen(false)}>{link.label}</a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}`,
    description: "Blend-mode mobile header with an animated burger and a full-screen link overlay.",
    tags: ["mobile", "hamburger", "overlay", "fullscreen-menu", "responsive"],
  },
  {
    name: "ElasticLineDivider",
    slug: "elastic-line-divider",
    path: "dividers/ElasticLineDivider.tsx",
    category: "dividers",
    code: `"use client";
import { useEffect, useRef } from "react";

type Props = {
  label?: string;
  index?: string;
  total?: string;
};

export function ElasticLineDivider({ label = "", index = "01/", total = "/04" }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const NUM = 80;
    const points: { x: number; y: number; vy: number; ay: number }[] = [];
    let W = 0, H = 0;

    const resize = () => {
      const rect = svg.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      for (let i = 0; i < NUM; i++) {
        points[i] = { x: (i / (NUM - 1)) * W, y: H / 2, vy: 0, ay: 0 };
      }
    };

    const getPath = () => {
      if (!points.length) return "";
      let d = \`M \${points[0].x} \${points[0].y}\`;
      for (let i = 1; i < NUM - 1; i++) {
        const mx = (points[i].x + points[i + 1].x) / 2;
        const my = (points[i].y + points[i + 1].y) / 2;
        d += \` Q \${points[i].x} \${points[i].y} \${mx} \${my}\`;
      }
      d += \` L \${points[NUM - 1].x} \${points[NUM - 1].y}\`;
      return d;
    };

    const pathEl = svg.querySelector<SVGPathElement>(".yui-elastic-path");
    let mouseY = 0, mouseX = 0, hovering = false;

    const onMove = (e: MouseEvent) => {
      const rect = svg.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const SPRING = 0.12, DAMPING = 0.7, SPREAD = 80;

    const tick = () => {
      const cy = H / 2;
      for (let i = 0; i < NUM; i++) {
        const p = points[i];
        const dist = Math.abs(p.x - mouseX);
        const influence = hovering ? Math.max(0, 1 - dist / SPREAD) : 0;
        const target = hovering ? cy + (mouseY - cy) * influence : cy;
        p.ay = (target - p.y) * SPRING;
        p.vy = p.vy * DAMPING + p.ay;
        p.y += p.vy;
      }
      if (pathEl) pathEl.setAttribute("d", getPath());
      raf.current = requestAnimationFrame(tick);
    };

    const onEnter = () => { hovering = true; };
    const onLeave = () => { hovering = false; };

    resize();
    window.addEventListener("resize", resize);
    svg.addEventListener("mousemove", onMove);
    svg.addEventListener("mouseenter", onEnter);
    svg.addEventListener("mouseleave", onLeave);
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      svg.removeEventListener("mousemove", onMove);
      svg.removeEventListener("mouseenter", onEnter);
      svg.removeEventListener("mouseleave", onLeave);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <>
      <style>{\`
        .yui-elastic-wrap { width: 100%; padding: 0 0; margin: 2rem 0; position: relative; }
        .yui-elastic-svg { display: block; width: 100%; height: 60px; cursor: crosshair; }
        .yui-elastic-path { fill: none; stroke: currentColor; stroke-width: 1.5; opacity: 0.6; }
        .yui-elastic-meta {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 0.8rem; opacity: 0.5; margin-top: 0.25rem; text-transform: uppercase; letter-spacing: 0.05em;
        }
      \`}</style>
      <div className="yui-elastic-wrap">
        <svg ref={svgRef} className="yui-elastic-svg">
          <path className="yui-elastic-path" d="" />
        </svg>
        <div className="yui-elastic-meta">
          <span>{index}</span>
          {label && <span>{label}</span>}
          <span>{total}</span>
        </div>
      </div>
    </>
  );
}`,
    description: "Section divider whose SVG line bends toward the cursor and springs back.",
    tags: ["svg", "physics", "spring", "interactive", "wave", "divider"],
  },
  {
    name: "CircleCTA",
    slug: "circle-cta",
    path: "buttons/CircleCTA.tsx",
    category: "buttons",
    code: `"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

type Props = {
  href: string;
  label?: string;
  size?: number;
  strokeColor?: string;
};

export function CircleCTA({ href, label = "view\\nmore", size = 10, strokeColor = "#fff" }: Props) {
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const circle = el.querySelector<SVGCircleElement>(".yui-circle-draw");
    if (!circle) return;

    const r = parseFloat(circle.getAttribute("r") || "48");
    const circumference = 2 * Math.PI * r;

    gsap.set(circle, {
      strokeDasharray: circumference,
      strokeDashoffset: circumference,
    });

    const onEnter = () =>
      gsap.to(circle, { strokeDashoffset: 0, duration: 0.6, ease: "power3.out" });
    const onLeave = () =>
      gsap.to(circle, { strokeDashoffset: circumference, duration: 0.5, ease: "power3.in" });

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  const lines = label.split("\\n");

  return (
    <>
      <style>{\`
        .yui-circle-cta { position: relative; display: inline-block; }
        .yui-circle-cta a { display: flex; align-items: center; justify-content: center; position: relative; width: 100%; height: 100%; }
        .yui-circle-cta a:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
        .yui-circle-cta svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; transform: rotate(-90deg); }
        .yui-circle-draw { fill: none; stroke-width: 1; }
        .yui-circle-label {
          position: relative; z-index: 1; text-align: center; line-height: 1.2;
          font-size: 0.85rem; font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase;
          transition: opacity 0.3s;
        }
        .yui-circle-cta:hover .yui-circle-label { opacity: 0.7; }
      \`}</style>
      <div
        ref={ctaRef}
        className="yui-circle-cta"
        style={{ width: \`\${size}rem\`, height: \`\${size}rem\` }}
      >
        <a href={href}>
          <svg viewBox="0 0 100 100">
            <circle className="yui-circle-draw" cx="50" cy="50" r="48" stroke={strokeColor} />
          </svg>
          <div className="yui-circle-label">
            {lines.map((line, i) => (
              <span key={i} style={{ display: "block" }}>{line}</span>
            ))}
          </div>
        </a>
      </div>
    </>
  );
}`,
    description: "Circular link whose outline draws itself around the label on hover.",
    tags: ["cta", "svg", "stroke-draw", "hover", "circular", "gsap", "animated"],
  },
  {
    name: "ImageReveal",
    slug: "image-reveal",
    path: "media/ImageReveal.tsx",
    category: "media",
    code: `"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  src: string;
  alt?: string;
  className?: string;
  borderRadius?: string;
  aspectRatio?: string;
};

export function ImageReveal({
  src,
  alt = "",
  className = "",
  borderRadius = "4rem",
  aspectRatio = "3/2",
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const img = wrap.querySelector<HTMLImageElement>("img");
    if (!img) return;

    gsap.set(wrap, { clipPath: "inset(100% 0 0 0)", borderRadius });
    gsap.set(img, { scale: 1.4 });

    const trig = ScrollTrigger.create({
      trigger: wrap,
      start: "top 85%",
      end: "bottom 15%",
      onEnter: () =>
        gsap.to([wrap, img], {
          clipPath: "inset(0% 0 0 0)",
          scale: 1,
          duration: 1.2,
          ease: "power3.out",
          stagger: 0,
        }),
      onLeaveBack: () =>
        gsap.to([wrap, img], {
          clipPath: "inset(100% 0 0 0)",
          scale: 1.4,
          duration: 0.8,
          ease: "power3.in",
        }),
    });

    return () => { trig.kill(); };
  }, [borderRadius]);

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{ overflow: "hidden", aspectRatio, borderRadius, width: "100%" }}
    >
      <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    </div>
  );
}`,
    description: "Image that unmasks upward on scroll while settling from a 1.4x zoom.",
    tags: ["image", "scroll-reveal", "gsap", "clip-path", "parallax", "cinema"],
  },
  {
    name: "FeaturedProjectCard",
    slug: "featured-project-card",
    path: "cards/FeaturedProjectCard.tsx",
    category: "cards",
    code: `"use client";

type Props = {
  title: string;
  eyebrow?: string;
  imageSrc: string;
  imageAlt?: string;
  href?: string;
  tags?: string[];
  alignRight?: boolean;
};

export function FeaturedProjectCard({
  title,
  eyebrow = "",
  imageSrc,
  imageAlt = "",
  href = "#",
  tags = [],
  alignRight = false,
}: Props) {
  return (
    <>
      <style>{\`
        .yui-feat-card { position: relative; }
        .yui-feat-card a { display: block; text-decoration: none; color: inherit; }
        .yui-feat-card a:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
        .yui-feat-img {
          width: 100%; overflow: hidden; border-radius: 2rem;
          aspect-ratio: 4/3; isolation: isolate;
        }
        .yui-feat-card--right .yui-feat-img { width: 70%; margin-left: auto; }
        .yui-feat-img img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          transition: transform 0.9s cubic-bezier(0.25,1,0.5,1);
        }
        .yui-feat-card:hover .yui-feat-img img { transform: scale(1.05); }
        .yui-feat-info { margin-top: 2rem; }
        .yui-feat-info--right { text-align: right; }
        .yui-feat-eyebrow {
          display: block; font-size: 0.8rem; letter-spacing: 0.15em; text-transform: uppercase;
          opacity: 0.5; margin-bottom: 0.5rem;
        }
        .yui-feat-title {
          font-size: clamp(3.5rem, 6vw, 8rem); font-weight: 600; line-height: 0.9;
          letter-spacing: -0.04em; text-transform: uppercase; margin: 0 0 1.5rem;
        }
        .yui-feat-meta { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .yui-feat-info--right .yui-feat-meta { justify-content: flex-end; }
        .yui-feat-tag {
          font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase;
          padding: 0.25rem 0.75rem; border: 1px solid currentColor; border-radius: 999px; opacity: 0.5;
        }
      \`}</style>
      <article className={\`yui-feat-card\${alignRight ? " yui-feat-card--right" : ""}\`}>
        <a href={href}>
          <div className="yui-feat-img">
            <img src={imageSrc} alt={imageAlt} />
          </div>
          <div className={\`yui-feat-info\${alignRight ? " yui-feat-info--right" : ""}\`}>
            {eyebrow && <span className="yui-feat-eyebrow">{eyebrow}</span>}
            <h2 className="yui-feat-title">{title}</h2>
            {tags.length > 0 && (
              <div className="yui-feat-meta">
                {tags.map((t) => <span key={t} className="yui-feat-tag">{t}</span>)}
              </div>
            )}
          </div>
        </a>
      </article>
    </>
  );
}`,
    description: "Large portfolio card with a slow image zoom, eyebrow, oversized title and tags.",
    tags: ["project-card", "portfolio", "editorial", "dark", "alternating-layout"],
  },
  {
    name: "ProjectCard",
    slug: "project-card",
    path: "cards/ProjectCard.tsx",
    category: "cards",
    code: `"use client";

type Props = {
  title: string;
  subtitle?: string;
  imageSrc: string;
  imageAlt?: string;
  href?: string;
  large?: boolean;
};

export function ProjectCard({ title, subtitle = "", imageSrc, imageAlt = "", href = "#", large = false }: Props) {
  return (
    <>
      <style>{\`
        .yui-proj-card { position: relative; break-inside: avoid; margin-bottom: 3rem; }
        .yui-proj-card a { display: block; text-decoration: none; color: inherit; }
        .yui-proj-card a:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
        .yui-proj-card-img {
          overflow: hidden; border-radius: 1.5rem; isolation: isolate;
          aspect-ratio: 4/3;
        }
        .yui-proj-card-img img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          transition: transform 0.8s cubic-bezier(0.25,1,0.5,1);
        }
        .yui-proj-card:hover .yui-proj-card-img img { transform: scale(1.05); }
        .yui-proj-card-info { margin-top: 1.5rem; }
        .yui-proj-card-info h3 {
          font-size: 2.5rem; font-weight: 600; line-height: 1;
          letter-spacing: -0.05em; text-transform: uppercase; margin: 0 0 0.4rem;
        }
        .yui-proj-card--large .yui-proj-card-info h3 {
          font-size: 4rem; letter-spacing: -0.08em;
        }
        .yui-proj-card-info span {
          font-size: 0.75rem; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.5;
        }
      \`}</style>
      <article className={\`yui-proj-card\${large ? " yui-proj-card--large" : ""}\`}>
        <a href={href}>
          <div className="yui-proj-card-img">
            <img src={imageSrc} alt={imageAlt} />
          </div>
          <div className="yui-proj-card-info">
            <h3>{title}</h3>
            {subtitle && <span>{subtitle}</span>}
          </div>
        </a>
      </article>
    </>
  );
}`,
    description: "Portfolio grid card with a rounded image that zooms slowly on hover.",
    tags: ["masonry", "project-card", "grid", "hover-zoom", "portfolio"],
  },
  {
    name: "Marquee",
    slug: "marquee",
    path: "animation/Marquee.tsx",
    category: "animation",
    code: `"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

type Props = {
  text: string;
  speed?: number;
  fontSize?: string;
  opacity?: number;
  separator?: string;
};

export function Marquee({ text, speed = 20, fontSize = "21rem", opacity = 0.08, separator = " \\u2014\\u00A0" }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Duplicate items until they fill > 2x the viewport width
    const fill = () => {
      const items = Array.from(track.children) as HTMLElement[];
      if (!items.length) return;
      const totalW = items.reduce((sum, el) => sum + el.offsetWidth, 0);
      const needed = Math.ceil((window.innerWidth * 3) / totalW) + 1;
      const template = items[0].cloneNode(true) as HTMLElement;
      while (track.children.length < needed * items.length) {
        track.appendChild(template.cloneNode(true));
      }
    };

    fill();

    const firstItem = track.children[0] as HTMLElement;
    const itemW = firstItem?.offsetWidth || 200;
    const duration = itemW / speed;

    const tween = gsap.to(track, {
      x: \`-=\${itemW}\`,
      duration,
      ease: "none",
      repeat: -1,
      modifiers: {
        x: gsap.utils.unitize((x: string) => parseFloat(x) % itemW),
      },
    });

    return () => { tween.kill(); };
  }, [text, speed]);

  return (
    <>
      <style>{\`
        .yui-marquee-root { overflow: hidden; pointer-events: none; margin: 3rem 0; width: 100%; }
        .yui-marquee-track { display: flex; white-space: nowrap; will-change: transform; }
        .yui-marquee-item {
          font-weight: 600; letter-spacing: -0.04em; text-transform: uppercase;
          flex-shrink: 0;
        }
      \`}</style>
      <div className="yui-marquee-root">
        <div ref={trackRef} className="yui-marquee-track">
          <span className="yui-marquee-item" style={{ fontSize, opacity }}>
            {text}{separator}
          </span>
        </div>
      </div>
    </>
  );
}`,
    description: "Infinite GSAP text marquee that clones itself to cover three screen widths.",
    tags: ["marquee", "scroll", "gsap", "infinite", "text", "watermark"],
  },
  {
    name: "ContactSection",
    slug: "contact-section",
    path: "sections/ContactSection.tsx",
    category: "sections",
    code: `"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

type Props = {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  ctaHref?: string;
  /** Optional image URL to mask through the heading text via background-clip */
  headingImageSrc?: string;
};

export function ContactSection({
  eyebrow = "GOT A PROJECT IN MIND?",
  heading = "LET'S",
  subheading = "TALK.",
  ctaHref = "mailto:hello@example.com",
  headingImageSrc,
}: Props) {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const spotlight = spotlightRef.current;
    if (!section || !spotlight) return;

    const onMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      gsap.to(spotlight, {
        x: e.clientX - rect.left - spotlight.offsetWidth / 2,
        y: e.clientY - rect.top - spotlight.offsetHeight / 2,
        duration: 0.6,
        ease: "power3.out",
      });
    };

    section.addEventListener("mousemove", onMove);
    return () => section.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <>
      <style>{\`
        @property --yui-border-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        .yui-contact {
          position: relative; overflow: hidden;
          min-height: 60vh; padding: 6rem 5rem;
          background: radial-gradient(ellipse at 60% 40%, #1a1a2e 0%, #000 70%);
          border-radius: 2rem;
          display: flex; flex-direction: column; justify-content: center;
        }
        .yui-contact::before {
          content: ''; position: absolute; inset: -2px; border-radius: inherit; z-index: 0;
          background: conic-gradient(
            from var(--yui-border-angle),
            transparent 70%,
            rgba(99,102,241,0.6) 80%,
            rgba(139,92,246,0.8) 85%,
            rgba(99,102,241,0.6) 90%,
            transparent 100%
          );
          animation: yui-border-spin 4s linear infinite;
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          padding: 2px;
        }
        @keyframes yui-border-spin { to { --yui-border-angle: 360deg; } }
        .yui-contact-spotlight {
          position: absolute; width: 30rem; height: 30rem; border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%);
          pointer-events: none; will-change: transform; z-index: 1;
        }
        .yui-contact-content { position: relative; z-index: 2; }
        .yui-contact-eyebrow {
          font-size: 0.8rem; letter-spacing: 0.15em; text-transform: uppercase;
          opacity: 0.5; margin-bottom: 1.5rem;
        }
        .yui-contact-heading {
          font-size: clamp(5rem, 10vw, 14rem); font-weight: 700; line-height: 0.85;
          letter-spacing: -0.05em; text-transform: uppercase; margin: 0 0 3rem;
        }
        .yui-contact-circle {
          position: relative; width: 10rem; height: 10rem;
        }
        .yui-contact-circle a {
          display: flex; align-items: center; justify-content: center;
          width: 100%; height: 100%; text-decoration: none; position: relative;
        }
        .yui-contact-circle a:focus-visible {
          outline: 2px solid #fff;
          outline-offset: 2px;
        }
        .yui-contact-circle svg {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%; transform: rotate(-90deg);
        }
        .yui-contact-circle-label {
          position: relative; z-index: 1; text-align: center; line-height: 1.3;
          font-size: 0.75rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.8;
        }
        @media (max-width: 768px) {
          .yui-contact { padding: 5rem 2rem; min-height: auto; }
          .yui-contact-heading { font-size: 5rem; }
        }
      \`}</style>
      <div ref={sectionRef} className="yui-contact">
        <div ref={spotlightRef} className="yui-contact-spotlight" />
        <div className="yui-contact-content">
          <p className="yui-contact-eyebrow">{eyebrow}</p>
          <h2
            className="yui-contact-heading"
            style={headingImageSrc ? {
              backgroundImage: \`url(\${headingImageSrc})\`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
            } : undefined}
          >
            <span style={{ display: "block" }}>{heading}</span>
            <span style={{ display: "block" }}>{subheading}</span>
          </h2>
          <div className="yui-contact-circle">
            <a href={ctaHref}>
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" className="yui-contact-circle-draw" />
              </svg>
              <div className="yui-contact-circle-label">
                <span style={{ display: "block" }}>write a</span>
                <span style={{ display: "block" }}>message</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}`,
    description: "Dark contact panel with a spinning conic border, cursor spotlight and image-filled type.",
    tags: ["contact", "conic-gradient", "animated-border", "spotlight", "dark-card"],
  },
  {
    name: "TextDisperseLink",
    slug: "text-disperse-link",
    path: "buttons/TextDisperseLink.tsx",
    category: "buttons",
    code: `"use client";
import { useRef } from "react";
import gsap from "gsap";

const SCATTER = [
  { x: -0.8, y: -0.6, rz: -29 }, { x: -0.2, y: -0.4, rz: -6 },
  { x: -0.5, y: 0.3, rz: -14 }, { x: 0.3, y: -0.5, rz: 10 },
  { x: 0.6, y: 0.4, rz: 18 }, { x: -0.4, y: 0.7, rz: -22 },
  { x: 0.1, y: -0.8, rz: 5 }, { x: 0.8, y: 0.6, rz: 20 },
];

type Props = {
  label: string;
  href: string;
  target?: string;
  rel?: string;
  className?: string;
};

export function TextDisperseLink({ label, href, target, rel, className = "" }: Props) {
  const linkRef = useRef<HTMLAnchorElement>(null);

  const scatter = () => {
    const chars = linkRef.current?.querySelectorAll<HTMLElement>(".yui-dchar");
    if (!chars) return;
    chars.forEach((ch, i) => {
      const s = SCATTER[i % SCATTER.length];
      const em = parseFloat(getComputedStyle(ch).fontSize) || 16;
      gsap.to(ch, {
        x: s.x * em,
        y: s.y * em,
        rotateZ: s.rz,
        duration: 0.4,
        ease: "power3.out",
      });
    });
  };

  const gather = () => {
    const chars = linkRef.current?.querySelectorAll<HTMLElement>(".yui-dchar");
    if (!chars) return;
    gsap.to(Array.from(chars), {
      x: 0, y: 0, rotateZ: 0,
      duration: 0.5, ease: "power3.out", stagger: 0.015,
    });
  };

  return (
    <>
      <style>{\`
        .yui-disperse-link {
          display: inline-flex; gap: 0; cursor: pointer;
          text-decoration: none; font-weight: 500; text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .yui-disperse-link:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
        .yui-dchar { display: inline-block; will-change: transform; }
      \`}</style>
      <a
        ref={linkRef}
        href={href}
        target={target}
        rel={rel}
        className={["yui-disperse-link", className].filter(Boolean).join(" ")}
        onMouseEnter={scatter}
        onMouseLeave={gather}
      >
        {label.split("").map((ch, i) => (
          <span key={i} className="yui-dchar">{ch === " " ? "\\u00A0" : ch}</span>
        ))}
      </a>
    </>
  );
}`,
    description: "Link whose letters scatter to preset offsets on hover and regroup in sequence.",
    tags: ["text", "hover", "scatter", "gsap", "character-animation", "social", "link"],
  },
  {
    name: "ImageWithFallback",
    slug: "image-with-fallback",
    path: "media/ImageWithFallback.tsx",
    category: "media",
    code: `"use client";
import { useState } from "react";

const ERROR_IMG_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false);
  const { src, alt, style, className, ...rest } = props;

  return didError ? (
    <div
      className={\`inline-block bg-gray-100 text-center align-middle \${className ?? ""}\`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
      </div>
    </div>
  ) : (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      {...rest}
      onError={() => setDidError(true)}
    />
  );
}`,
    description: "Image element that swaps in a neutral placeholder graphic when the source fails.",
    tags: ["image", "fallback", "graceful-degradation", "utility", "media"],
  },
  {
    name: "SkeletonCard",
    slug: "skeleton-card",
    path: "loaders/SkeletonCard.tsx",
    category: "loading",
    code: `"use client";

import { useEffect, useRef, useState } from "react";

/*
 * SkeletonCard and SkeletonRow: loading placeholders in the theme's own colours.
 *
 * The bones sit a clear step darker than their surface (muted-foreground at
 * 15-20%), and a band of the surface colour sweeps across them. Over the
 * surface the band is invisible, so only the bones change, on light and dark
 * themes alike. The sweep is linear and rests between passes, so it reads as
 * work in progress rather than a flash.
 *
 * The sweep pauses when the skeleton is off screen or the tab is hidden, and
 * reduced motion removes it: the bones stay, still and clearly a placeholder.
 * Each skeleton is a polite status region with \`aria-busy\` and a text label, so
 * the loading state is announced, not just drawn.
 */

const CSS = \`
.bz-sk{position:relative;overflow:hidden;isolation:isolate}
.bz-sk-sheen{position:absolute;inset:0;z-index:1;overflow:hidden;pointer-events:none}
.bz-sk-sheen::before{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 20%,currentColor 50%,transparent 80%);opacity:0.9;transform:translateX(-100%);animation:bz-sk-sweep 2.4s linear infinite;will-change:transform}
@keyframes bz-sk-sweep{0%{transform:translateX(-100%)}70%,100%{transform:translateX(100%)}}
.bz-sk[data-running="false"] .bz-sk-sheen::before{animation-play-state:paused}
.bz-sk-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
@media (prefers-reduced-motion:reduce){.bz-sk-sheen{display:none}}
\`;

/** Runs the sweep only while the skeleton is on screen and the tab is visible. */
function useSweepRunning() {
  const ref = useRef<HTMLDivElement>(null);
  const [onscreen, setOnscreen] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setOnscreen(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setOnscreen(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const sync = () => setVisible(document.visibilityState !== "hidden");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  return [ref, onscreen && visible] as const;
}

export type SkeletonProps = {
  /** Announced to assistive tech while the skeleton is shown. */
  label?: string;
};

export function SkeletonCard({ label = "Loading" }: SkeletonProps = {}) {
  const [ref, running] = useSweepRunning();
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        ref={ref}
        role="status"
        aria-busy="true"
        data-running={running ? "true" : "false"}
        className="bz-sk bg-card rounded-xl border border-border"
      >
        <span className="bz-sk-sr">{label}</span>
        <div className="aspect-square bg-muted-foreground/15" />
        <div className="p-3 space-y-2">
          <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
          <div className="h-3 bg-muted-foreground/20 rounded w-1/2" />
          <div className="flex items-center justify-between mt-3">
            <div className="h-5 bg-muted-foreground/20 rounded w-12" />
            <div className="h-8 w-8 bg-muted-foreground/20 rounded-lg" />
          </div>
        </div>
        <span aria-hidden="true" className="bz-sk-sheen text-card" />
      </div>
    </>
  );
}

export function SkeletonRow({ label = "Loading" }: SkeletonProps = {}) {
  const [ref, running] = useSweepRunning();
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        ref={ref}
        role="status"
        aria-busy="true"
        data-running={running ? "true" : "false"}
        className="bz-sk flex gap-3 p-3 bg-muted rounded-lg"
      >
        <span className="bz-sk-sr">{label}</span>
        <div className="w-16 h-16 rounded-lg bg-muted-foreground/20 shrink-0" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 bg-muted-foreground/20 rounded w-2/3" />
          <div className="h-3 bg-muted-foreground/20 rounded w-1/3" />
          <div className="h-4 bg-muted-foreground/20 rounded w-1/4" />
        </div>
        <span aria-hidden="true" className="bz-sk-sheen text-muted" />
      </div>
    </>
  );
}`,
    description: "Product card and list row skeletons with a slow sheen, announced as loading.",
    tags: ["skeleton", "loading", "placeholder", "shimmer", "aria-busy"],
  },
  {
    name: "EcomEmptyState",
    slug: "ecom-empty-state",
    path: "feedback/EcomEmptyState.tsx",
    category: "feedback",
    code: `"use client";
import { ShoppingBag, Search, Wifi, LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

type EmptyType = "cart" | "search" | "category" | "network";

type Props = {
  /** Preset type that determines icon, title, description and CTA label */
  type: EmptyType;
  /** Search query string — only shown when type === "search" */
  query?: string;
  /** CTA button click handler. Button is hidden when omitted. */
  onCTA?: () => void;
};

const config: Record<EmptyType, { icon: LucideIcon; title: string; desc: string; cta: string; color: string }> = {
  cart: {
    icon: ShoppingBag,
    title: "Your cart is empty",
    desc: "Add items from the store to get started",
    cta: "Start Shopping",
    color: "text-primary",
  },
  search: {
    icon: Search,
    title: "No results found",
    desc: "Try different keywords or browse categories",
    cta: "Clear Search",
    color: "text-muted-foreground",
  },
  category: {
    icon: ShoppingBag,
    title: "Nothing here yet",
    desc: "Try a different category",
    cta: "View All",
    color: "text-muted-foreground",
  },
  network: {
    icon: Wifi,
    title: "Couldn't load items",
    desc: "Check your connection and try again",
    cta: "Retry",
    color: "text-destructive",
  },
};

export function EcomEmptyState({ type, query, onCTA }: Props) {
  const c = config[type];
  const Icon = c.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className={\`w-9 h-9 \${c.color}\`} />
      </div>
      <h3 className="m-0 mb-2 text-lg font-semibold">{c.title}</h3>
      <p className="text-muted-foreground m-0 mb-1 max-w-xs">
        {type === "search" && query ? \`No items matching "\${query}"\` : c.desc}
      </p>
      {type === "search" && (
        <p className="text-muted-foreground m-0 mb-5 text-sm">
          Try: atta, rice, milk, vegetables…
        </p>
      )}
      {onCTA && (
        <button
          onClick={onCTA}
          className="mt-4 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 active:scale-[0.97] transition-[opacity,transform] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
        >
          {c.cta}
        </button>
      )}
    </motion.div>
  );
}`,
    description: "Shop empty states with presets for cart, search, category and network errors.",
    tags: ["empty", "placeholder", "no-results", "animated", "preset", "ecommerce"],
  },
  {
    name: "Breadcrumb",
    slug: "breadcrumb",
    path: "navigation/Breadcrumb.tsx",
    category: "navigation",
    code: `"use client";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  /** Display text */
  label: string;
  /** Renders as an anchor/link if provided */
  href?: string;
  /** Renders as a button if provided (and no href) */
  onClick?: () => void;
}

type Props = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumb({ items, className = "" }: Props) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-0.5 flex-wrap text-xs text-muted-foreground">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          const isFirst = i === 0;
          return (
            <li key={i} className="flex items-center gap-0.5 min-w-0">
              {i > 0 && (
                <ChevronRight className="w-3 h-3 mx-0.5 shrink-0 opacity-40" />
              )}
              {isLast ? (
                <span
                  className="font-medium text-foreground truncate max-w-[160px]"
                  aria-current="page"
                  title={item.label}
                >
                  {item.label}
                </span>
              ) : item.href ? (
                <a
                  href={item.href}
                  className="flex items-center gap-1 hover:text-primary transition-colors whitespace-nowrap underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
                >
                  {isFirst && <Home className="w-3 h-3 shrink-0" />}
                  {item.label}
                </a>
              ) : item.onClick ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="hover:text-primary transition-colors whitespace-nowrap underline-offset-2 hover:underline cursor-pointer bg-transparent border-0 p-0 text-xs text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
                >
                  {isFirst && <Home className="w-3 h-3 shrink-0 inline mr-1" />}
                  {item.label}
                </button>
              ) : (
                <span className="whitespace-nowrap">{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}`,
    description: "Breadcrumb trail with a home icon, truncated current page and aria-current.",
    tags: ["breadcrumb", "navigation", "accessible", "semantic"],
  },
  {
    name: "CategoryChips",
    slug: "category-chips",
    path: "navigation/CategoryChips.tsx",
    category: "navigation",
    code: `"use client";
import { useRef } from "react";
import { motion } from "framer-motion";
import type { ElementType } from "react";

export interface ChipCategory {
  id: string;
  name: string;
  icon: ElementType;
  /** Tailwind color class for the icon when inactive, e.g. "text-green-700" */
  color: string;
  bg?: string;
}

type Props = {
  categories: ChipCategory[];
  activeCategory: string;
  onCategoryChange: (id: string) => void;
};

export function CategoryChips({ categories, activeCategory, onCategoryChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-1"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
    >
      {categories.map((cat) => {
        const Icon = cat.icon;
        const isActive = activeCategory === cat.id;
        return (
          <motion.button
            key={cat.id}
            whileTap={{ scale: 0.94 }}
            onClick={() => onCategoryChange(cat.id)}
            className={\`flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-[background-color,border-color,color] duration-150 shrink-0 border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22] \${
              isActive
                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                : "bg-white text-neutral-900 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }\`}
          >
            <Icon className={\`w-3.5 h-3.5 \${isActive ? "text-primary-foreground" : cat.color}\`} />
            {cat.name}
          </motion.button>
        );
      })}
    </div>
  );
}`,
    description: "Horizontally scrolling category chips with icons and a filled active state.",
    tags: ["filter", "chips", "pills", "horizontal-scroll", "tabs", "categories"],
  },
  {
    name: "CategoryGrid",
    slug: "category-grid",
    path: "navigation/CategoryGrid.tsx",
    category: "navigation",
    code: `"use client";
import { motion } from "framer-motion";
import type { ElementType } from "react";

export interface GridCategory {
  id: string;
  name: string;
  icon: ElementType;
  /** Combined Tailwind bg+text classes, e.g. "bg-green-100 text-green-700" */
  color: string;
}

type Props = {
  categories: GridCategory[];
  onCategoryClick?: (categoryId: string) => void;
};

export function CategoryGrid({ categories, onCategoryClick }: Props) {
  return (
    <div className="grid grid-cols-4 md:grid-cols-8 gap-3 md:gap-4">
      {categories.map((category, index) => {
        const Icon = category.icon;
        return (
          <motion.button
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onCategoryClick?.(category.id)}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-neutral-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
          >
            <div
              className={\`w-14 h-14 md:w-16 md:h-16 rounded-full \${category.color} flex items-center justify-center\`}
            >
              <Icon className="w-7 h-7 md:w-8 md:h-8" />
            </div>
            <span className="text-center leading-tight text-xs text-neutral-900">{category.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
}`,
    description: "Grid of round category icons that staggers in, four columns wide on phones.",
    tags: ["grid", "categories", "icon-grid", "animated", "responsive"],
  },
  {
    name: "SearchOverlay",
    slug: "search-overlay",
    path: "overlays/SearchOverlay.tsx",
    category: "overlays",
    code: `"use client";
import { useState, useEffect, useRef } from "react";
import { Search, X, Clock, TrendingUp, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  currentQuery?: string;
  /** Shown in the "Popular" section */
  popularSearches?: string[];
  /** localStorage key for persisting recent searches */
  storageKey?: string;
};

export function SearchOverlay({
  isOpen,
  onClose,
  onSearch,
  currentQuery = "",
  popularSearches = [],
  storageKey = "app_recent_searches",
}: Props) {
  const [value, setValue] = useState(currentQuery);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function getRecent(): string[] {
    try { return JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch { return []; }
  }

  function saveRecent(term: string) {
    try {
      const prev = getRecent().filter((s) => s !== term);
      localStorage.setItem(storageKey, JSON.stringify([term, ...prev].slice(0, 8)));
    } catch { /* ignore */ }
  }

  function clearRecent() {
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
  }

  useEffect(() => {
    if (isOpen) {
      setValue(currentQuery);
      setRecent(getRecent());
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentQuery]);

  const commit = (term: string) => {
    if (!term.trim()) return;
    saveRecent(term.trim());
    onSearch(term.trim());
    onClose();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commit(value);
    if (e.key === "Escape") onClose();
  };

  const handleClearRecent = () => { clearRecent(); setRecent([]); };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="fixed top-0 left-0 right-0 z-[61] bg-white shadow-2xl rounded-b-2xl max-h-[80vh] flex flex-col"
          >
            {/* Input row */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Search…"
                className="flex-1 text-base outline-none bg-transparent placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
              />
              {value && (
                <button onClick={() => setValue("")} className="p-1 hover:bg-muted rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
              <button
                onClick={onClose}
                className="text-primary font-medium text-sm shrink-0 hover:opacity-70 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
              >
                Cancel
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-5">
              {/* Recent */}
              {recent.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Recent
                    </span>
                    <button onClick={handleClearRecent} className="text-xs text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]">
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recent.map((r) => (
                      <button
                        key={r}
                        onClick={() => commit(r)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full text-sm hover:bg-primary/10 hover:text-primary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
                      >
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular */}
              {popularSearches.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Popular
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((s) => (
                      <button
                        key={s}
                        onClick={() => commit(s)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium hover:bg-primary/20 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
                      >
                        {s}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CTA */}
            {value.trim() && (
              <div className="p-4 border-t border-border">
                <button
                  onClick={() => commit(value)}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-xl flex items-center justify-center gap-2 font-medium hover:opacity-90 transition-opacity active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
                >
                  <Search className="w-4 h-4" />
                  Search for &ldquo;{value}&rdquo;
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}`,
    description: "Search sheet that drops from the top with recent and popular searches.",
    tags: ["search", "overlay", "modal", "animated", "recent-searches", "popular"],
  },
  {
    name: "MobileBottomNav",
    slug: "mobile-bottom-nav",
    path: "navigation/MobileBottomNav.tsx",
    category: "navigation",
    code: `"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { ElementType } from "react";

export interface NavTab {
  id: string;
  icon: ElementType;
  label: string;
  badge?: number;
  /** Override onTabChange with a custom action */
  action?: () => void;
  /** CSS color string for special accent tabs (e.g. WhatsApp green) */
  accentColor?: string;
}

type Props = {
  tabs: NavTab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export function MobileBottomNav({ tabs, activeTab, onTabChange }: Props) {
  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div
        className="grid px-1"
        style={{ gridTemplateColumns: \`repeat(\${tabs.length}, minmax(0, 1fr))\` }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const hasAccent = !!tab.accentColor;

          return (
            <button
              key={tab.id}
              onClick={() => (tab.action ? tab.action() : onTabChange(tab.id))}
              style={hasAccent ? { color: tab.accentColor } : undefined}
              className={\`flex flex-col items-center gap-0.5 py-2.5 px-1 relative transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22] \${
                hasAccent
                  ? ""
                  : isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }\`}
            >
              {isActive && !hasAccent && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full"
                  transition={{ type: "spring", damping: 20, stiffness: 400 }}
                />
              )}

              <div className="relative">
                <Icon className="w-5 h-5" />
                <AnimatePresence>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <motion.span
                      key={tab.badge}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full min-w-[16px] h-4 flex items-center justify-center text-[9px] font-bold px-0.5 leading-none"
                    >
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <span className="text-[10px]">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}`,
    description: "Phone tab bar with a sliding active indicator, count badges and accent tabs.",
    tags: ["mobile", "bottom-nav", "tabs", "badge", "animated", "ios-safe-area"],
  },
  {
    name: "ProductCard",
    slug: "product-card",
    path: "cards/ProductCard.tsx",
    category: "cards",
    code: `"use client";
import { Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export interface EcomProduct {
  id: string;
  name: string;
  /** Current selling price */
  price: number;
  /** Unit/weight label, e.g. "500g", "1 litre" */
  unit: string;
  image: string;
  inStock: boolean;
  /** Discount percentage 0–100 */
  discount?: number;
}

type Props = {
  product: EcomProduct;
  quantity: number;
  onAdd: () => void;
  onDecrease: () => void;
  /** Called when "Notify me" is tapped on out-of-stock items */
  onNotify?: () => void;
  /** Navigate to product detail */
  onCardClick?: () => void;
};

export function ProductCard({ product, quantity, onAdd, onDecrease, onNotify, onCardClick }: Props) {
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = () => {
    onAdd();
    if (quantity === 0) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 600);
    }
  };

  const discountedFromPrice = product.discount
    ? Math.round(product.price / (1 - product.discount / 100))
    : null;

  return (
    <motion.div
      layout
      whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}
      className="bg-card rounded-xl border border-border overflow-hidden transition-shadow relative"
    >
      {/* Image */}
      <button
        onClick={onCardClick}
        className="block w-full relative aspect-square bg-muted overflow-hidden focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
        aria-label={\`View details for \${product.name}\`}
        tabIndex={onCardClick ? 0 : -1}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
        />

        {/* Discount badge */}
        {product.discount && product.inStock && (
          <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground px-2 py-0.5 rounded-md text-xs font-bold">
            {product.discount}% OFF
          </div>
        )}

        {/* Out of stock overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-2 p-2">
            <span className="bg-white text-foreground px-3 py-1 rounded-md text-sm font-semibold">
              Out of Stock
            </span>
            {onNotify && (
              <button
                onClick={(e) => { e.stopPropagation(); onNotify(); }}
                className="flex items-center gap-1 bg-[#25D366] text-white px-2.5 py-1 rounded-md text-xs font-medium hover:bg-[#22c35e] active:scale-[0.95] transition-[background-color,transform] duration-150"
              >
                Notify me
              </button>
            )}
          </div>
        )}

        {/* "Added" flash overlay */}
        <AnimatePresence>
          {justAdded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-primary/15 flex items-center justify-center pointer-events-none"
            >
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                className="w-10 h-10 bg-primary rounded-full flex items-center justify-center"
              >
                <Plus className="w-5 h-5 text-primary-foreground" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quantity bubble */}
        <AnimatePresence>
          {quantity > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute top-2 right-2 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-[10px] font-bold shadow"
            >
              {quantity}
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Content */}
      <div className="p-3">
        <button
          onClick={onCardClick}
          className="text-left w-full no-underline text-inherit hover:text-primary transition-colors focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
        >
          <h3 className="line-clamp-2 m-0 mb-0.5 text-sm font-semibold leading-tight">{product.name}</h3>
        </button>
        <p className="text-muted-foreground text-xs m-0 mb-2">{product.unit}</p>

        <div className="flex items-center justify-between gap-2 min-h-[36px]">
          {/* Price */}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="font-bold text-sm">₹{product.price}</span>
            {discountedFromPrice && (
              <span className="line-through text-muted-foreground text-xs">₹{discountedFromPrice}</span>
            )}
          </div>

          {/* ADD button / stepper */}
          {product.inStock && (
            <AnimatePresence mode="wait" initial={false}>
              {quantity === 0 ? (
                <motion.button
                  key="add"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={handleAdd}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 active:scale-[0.95] transition-[opacity,transform] duration-150"
                >
                  ADD
                </motion.button>
              ) : (
                <motion.div
                  key="stepper"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex items-center gap-1 bg-primary text-primary-foreground rounded-lg px-1.5 py-1"
                >
                  <button
                    onClick={onDecrease}
                    className="w-6 h-6 flex items-center justify-center hover:opacity-75 transition-opacity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-5 text-center text-sm font-semibold">{quantity}</span>
                  <button
                    onClick={handleAdd}
                    className="w-6 h-6 flex items-center justify-center hover:opacity-75 transition-opacity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  );
}`,
    description: "Grocery product card with discount badge, quantity stepper and out-of-stock overlay.",
    tags: ["product", "ecommerce", "add-to-cart", "stepper", "animated", "discount", "out-of-stock"],
  },
  {
    name: "StickyCartBar",
    slug: "sticky-cart-bar",
    path: "panels/StickyCartBar.tsx",
    category: "ecommerce",
    code: `"use client";
import { ShoppingCart, MessageCircle, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  itemCount: number;
  totalPrice: number;
  onViewCart: () => void;
  /** Optional second action button (e.g. WhatsApp order) */
  primaryAction?: {
    label: string;
    onClick: () => void;
    /** Tailwind bg class, default "bg-[#25D366] hover:bg-[#22c35e]" */
    colorClass?: string;
  };
};

export function StickyCartBar({ itemCount, totalPrice, onViewCart, primaryAction }: Props) {
  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.div
          initial={{ y: 120 }}
          animate={{ y: 0 }}
          exit={{ y: 120 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="md:hidden fixed bottom-16 left-0 right-0 z-40 px-3 pb-1"
        >
          <div className="bg-foreground text-background rounded-2xl shadow-2xl overflow-hidden">
            {/* Summary row */}
            <button
              onClick={onViewCart}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <div className="flex items-center gap-2">
                <div className="relative">
                  <ShoppingCart className="w-4 h-4" />
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {itemCount}
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {itemCount} item{itemCount !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold">
                ₹{totalPrice}
                <ChevronUp className="w-4 h-4 opacity-60" />
              </div>
            </button>

            {/* Action buttons */}
            <div className="flex border-t border-white/10">
              <button
                onClick={onViewCart}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium hover:bg-white/5 transition-colors border-r border-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <ShoppingCart className="w-4 h-4" />
                View Cart
              </button>
              {primaryAction && (
                <button
                  onClick={primaryAction.onClick}
                  className={\`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white \${
                    primaryAction.colorClass ?? "bg-[#25D366] hover:bg-[#22c35e]"
                  }\`}
                >
                  <MessageCircle className="w-4 h-4" />
                  {primaryAction.label}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}`,
    description: "Mobile cart summary that springs up above the tab bar once items are added.",
    tags: ["cart", "sticky", "mobile", "animated", "summary-bar", "cta", "ecommerce"],
  },
  {
    name: "AppHeader",
    slug: "app-header",
    path: "layout/AppHeader.tsx",
    category: "layout",
    code: `"use client";
import { Search, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  /** Store/app name */
  storeName: string;
  /** Tagline shown below name on sm+ screens */
  tagline?: string;
  /** Number shown in cart badge */
  cartItemCount: number;
  /** Show a live "Open/Closed" status dot */
  isOpen?: boolean;
  /** Info bar text */
  infoBanner?: string;
  onCartClick: () => void;
  onSearchClick: () => void;
  /** Optional extra CTA (e.g. WhatsApp, phone) */
  ctaButton?: {
    label: string;
    icon: ReactNode;
    onClick: () => void;
    colorClass?: string;
  };
};

export function AppHeader({
  storeName,
  tagline,
  cartItemCount,
  isOpen,
  infoBanner,
  onCartClick,
  onSearchClick,
  ctaButton,
}: Props) {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 bg-white border-b border-border shadow-sm"
    >
      {/* Top info bar */}
      {(infoBanner || isOpen !== undefined) && (
        <div className="bg-primary text-primary-foreground px-4 py-1.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              {isOpen !== undefined && (
                <span className="flex items-center gap-1.5 font-medium">
                  <span
                    className={\`w-1.5 h-1.5 rounded-full \${
                      isOpen ? "bg-green-300 animate-pulse" : "bg-red-300"
                    }\`}
                  />
                  {isOpen ? "Open Now" : "Closed"}
                </span>
              )}
              {infoBanner && (
                <span className="hidden sm:inline opacity-80">{infoBanner}</span>
              )}
            </div>
            {ctaButton && (
              <button
                onClick={ctaButton.onClick}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity shrink-0 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {ctaButton.icon}
                <span>{ctaButton.label}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main header row */}
      <div className="px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          {/* Logo / wordmark */}
          <div className="shrink-0">
            <h1 className="text-neutral-900 m-0 leading-none text-xl font-extrabold tracking-tight">
              {storeName}
            </h1>
            {tagline && (
              <p className="text-[10px] text-neutral-500 m-0 hidden sm:block">{tagline}</p>
            )}
          </div>

          {/* Desktop inline search bar */}
          <div className="flex-1 max-w-2xl hidden md:block">
            <button
              onClick={onSearchClick}
              className="w-full flex items-center gap-2 pl-3 pr-4 py-2.5 bg-gray-100 rounded-xl text-[color:var(--bz-ink-muted,#4a4a4c)] text-sm hover:bg-gray-200 transition-colors duration-150 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
            >
              <Search className="w-4 h-4 shrink-0" />
              <span>Search…</span>
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto md:ml-0">
            {/* Mobile search icon */}
            <button
              onClick={onSearchClick}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-gray-500" />
            </button>

            {/* CTA button (desktop) */}
            {ctaButton && (
              <button
                onClick={ctaButton.onClick}
                className={\`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg hover:opacity-90 active:scale-[0.97] transition-[opacity,transform] duration-150 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22] \${
                  ctaButton.colorClass ?? "bg-primary"
                }\`}
              >
                {ctaButton.icon}
                <span className="hidden lg:inline">{ctaButton.label}</span>
              </button>
            )}

            {/* Cart button */}
            <button
              onClick={onCartClick}
              className="relative flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 active:scale-[0.97] transition-[opacity,transform] duration-150 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
              aria-label={\`Cart, \${cartItemCount} items\`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden md:inline">Cart</span>
              <AnimatePresence>
                {cartItemCount > 0 && (
                  <motion.span
                    key={cartItemCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none"
                  >
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}`,
    description: "Sticky shop header with an open-now bar, inline search and animated cart badge.",
    tags: ["header", "navbar", "sticky", "responsive", "cart-badge", "animated", "ecommerce"],
  },
  {
    name: "BakeryProductCard",
    slug: "bakery-product-card",
    path: "cards/BakeryProductCard.tsx",
    category: "cards",
    code: `"use client";
import type { ReactNode } from "react";

interface PlaceholderProps {
  aspectRatio?: string;
  label?: string;
  rounded?: string;
  className?: string;
}

function ImagePlaceholder({ aspectRatio = "1/1", label = "", rounded = "rounded-xl", className = "" }: PlaceholderProps) {
  return (
    <div
      className={\`relative overflow-hidden bg-neutral-100 \${rounded} \${className}\`}
      style={{ aspectRatio }}
      role="img"
      aria-label={label || "Image placeholder"}
    >
      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400">
        <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {label && <span className="text-xs font-medium opacity-60">{label}</span>}
      </div>
    </div>
  );
}

export interface BakeryProduct {
  name: string;
  image?: string;
  price: number | string;
  originalPrice?: number | string;
  badge?: string;
  tag?: string;
  description?: string;
}

type Props = {
  product: BakeryProduct;
  href: string;
  currencySymbol?: string;
  unitLabel?: string;
  ctaLabel?: ReactNode | string;
};

export function BakeryProductCard({ product, href, currencySymbol = "₹", unitLabel = "/kg", ctaLabel = "View & Customize" }: Props) {
  return (
    <a
      href={href}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-neutral-100 block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
    >
      <div className="relative overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <ImagePlaceholder
            aspectRatio="1/1"
            label={product.name}
            rounded="rounded-none"
            className="group-hover:scale-105 transition-transform duration-500"
          />
        )}
        {product.badge && (
          <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {product.badge}
          </span>
        )}
        {product.tag && (
          <span className="absolute top-3 right-3 bg-[color:var(--bz-emerald-fill,#047857)] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            {product.tag}
          </span>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <h3 className="font-semibold text-sm sm:text-base text-neutral-900 mb-1 line-clamp-1 group-hover:text-neutral-700 transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-neutral-500 text-xs mb-2 line-clamp-2 hidden sm:block">{product.description}</p>
        )}
        <div className="flex items-baseline gap-1 sm:gap-2 mb-2 sm:mb-3">
          <span className="text-neutral-900 font-bold text-base sm:text-lg">{currencySymbol}{product.price}</span>
          {product.originalPrice && (
            <span className="text-[color:var(--bz-ink-subtle,#6b6b70)] text-xs line-through">{currencySymbol}{product.originalPrice}</span>
          )}
          <span className="text-[color:var(--bz-ink-subtle,#6b6b70)] text-[10px] sm:text-xs">{unitLabel}</span>
        </div>
        <span className="w-full bg-neutral-900 text-white text-[10px] sm:text-xs font-medium py-2 sm:py-2.5 rounded-full group-hover:bg-neutral-700 transition-colors flex items-center justify-center gap-1.5 min-h-[40px]">
          {ctaLabel}
        </span>
      </div>
    </a>
  );
}`,
    description: "Product card with corner badges, struck-through price, hover zoom and image placeholder.",
    tags: ["ecommerce", "product", "hover-zoom", "skeleton", "badge", "responsive", "bakery"],
  },
  {
    name: "TestimonialCard",
    slug: "testimonial-card",
    path: "cards/TestimonialCard.tsx",
    category: "cards",
    code: `import { Star } from "lucide-react";

export interface Testimonial {
  rating: number;
  text: string;
  name: string;
  role?: string;
}

type Props = {
  testimonial: Testimonial;
};

export function TestimonialCard({ testimonial }: Props) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
      {/* The stars are one image with a spoken rating. Gold fill keeps the look;
          the darker gold outline is what clears 3:1 on white. */}
      <div
        role="img"
        aria-label={\`Rated \${testimonial.rating} out of 5\`}
        className="flex items-center gap-0.5 mb-4"
      >
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star
            key={i}
            size={14}
            aria-hidden
            className="fill-[color:var(--bz-gold-fill,#c9a227)] text-[color:var(--bz-gold,#7a6015)]"
          />
        ))}
      </div>
      <p className="text-neutral-600 text-sm leading-relaxed mb-5 italic">
        &ldquo;{testimonial.text}&rdquo;
      </p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center">
          <span className="text-neutral-600 font-bold text-sm">
            {testimonial.name.charAt(0)}
          </span>
        </div>
        <div>
          <p className="text-neutral-900 font-semibold text-sm">{testimonial.name}</p>
          {testimonial.role && (
            <p className="text-[color:var(--bz-ink-subtle,#6b6b70)] text-xs">{testimonial.role}</p>
          )}
        </div>
      </div>
    </div>
  );
}`,
    description: "Review card with star rating, quoted text and an initial-letter avatar.",
    tags: ["testimonial", "review", "stars", "avatar", "social-proof"],
  },
  {
    name: "AccordionList",
    slug: "accordion-list",
    path: "sections/AccordionList.tsx",
    category: "sections",
    code: `"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";

/*
 * AccordionList: questions and answers, or any titled rows, that open in place.
 *
 * Opening measures the answer and animates the panel's height to it, then hands
 * the height back to \`auto\` so the content can reflow. Closing pins the current
 * height and animates it to zero, and only then hides the panel and makes it
 * inert, so a closed answer leaves both the tab order and the accessibility
 * tree. A token per row lets a close interrupt an open cleanly.
 *
 * The whole row is the button. Its arrow disc tumbles and turns with a small
 * overshoot, a hairline under the row fills on hover, keyboard focus and while
 * open, and a plain-text answer rises into place line by line.
 */

const CSS = \`
.bz-al{color:var(--bz-ink,#0a0a0a);font-family:var(--bz-font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif)}
.bz-al *,.bz-al *::before,.bz-al *::after{box-sizing:border-box}
.bz-al-head{margin:0 0 24px}
.bz-al-title{margin:0;font-size:clamp(1.75rem,3.2vw,2.25rem);line-height:1.15;font-weight:600;letter-spacing:-0.02em}
.bz-al-subtitle{margin:8px 0 0;font-size:1rem;line-height:1.55;color:var(--bz-ink-muted,#4a4a4c)}
.bz-al-list{margin:0;padding:0;list-style:none;border-top:1px solid var(--bz-line-strong,rgba(10,10,10,0.13))}
.bz-al-item{position:relative}
.bz-al-heading{margin:0;font:inherit}
.bz-al-trigger{display:grid;grid-template-columns:2.5rem minmax(0,1fr) auto 48px;align-items:center;gap:12px;width:100%;min-height:72px;margin:0;padding:12px 0;border:0;border-radius:8px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
.bz-al-trigger:focus-visible{outline:2px solid var(--bz-focus-ring,#912c22);outline-offset:2px}
.bz-al-index{font:500 0.75rem/1 var(--bz-font-mono,ui-monospace,SFMono-Regular,Menlo,monospace);letter-spacing:0.08em;color:var(--bz-ink-subtle,#6b6b70)}
.bz-al-name{font-size:1.125rem;line-height:1.35;font-weight:600;letter-spacing:-0.01em}
.bz-al-meta{font-size:0.875rem;white-space:nowrap;color:var(--bz-ink-muted,#4a4a4c)}
.bz-al-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
.bz-al-disc{position:relative;display:grid;justify-self:end;place-items:center;width:40px;height:40px;margin-right:4px;border-radius:999px;background:var(--bz-ink,#0a0a0a);color:#ffffff;transition:rotate 420ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-al-disc::after{content:"";position:absolute;inset:0;border:1.5px solid var(--bz-ink,#0a0a0a);border-radius:999px;opacity:0;pointer-events:none}
.bz-al-clip{display:block;width:20px;height:20px;overflow:hidden}
.bz-al-strip{display:block;transition:transform 280ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)) 200ms}
.bz-al-strip svg{display:block;width:20px;height:20px}
.bz-al-item[data-expanded="true"] .bz-al-disc{rotate:180deg;transition:rotate 500ms var(--bz-ease-spring,cubic-bezier(0.34,1.56,0.64,1)) 180ms}
.bz-al-item[data-expanded="true"] .bz-al-strip{transform:translateY(-50%);transition-delay:0ms}
.bz-al-item[data-expanded="true"] .bz-al-disc::after{animation:bz-al-pulse 700ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)) 140ms}
@keyframes bz-al-pulse{from{opacity:0.45;transform:scale(1)}to{opacity:0;transform:scale(1.9)}}
.bz-al-rule{position:relative;height:1px;background:var(--bz-line-strong,rgba(10,10,10,0.13))}
.bz-al-fill{position:absolute;top:0;bottom:0;left:0;width:0;background:var(--bz-accent,#912c22);transition:width 500ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-al-item[data-expanded="true"] .bz-al-fill,.bz-al-item:has(.bz-al-trigger:focus-visible) .bz-al-fill{width:100%}
@media (hover:hover){.bz-al-item:hover .bz-al-fill{width:100%}}
.bz-al-panel{overflow:hidden}
.bz-al-body{padding:0 64px 28px calc(2.5rem + 12px);font-size:1rem;line-height:1.6;color:var(--bz-ink-muted,#4a4a4c)}
.bz-al-text{max-width:40rem;margin:0}
.bz-al-line{display:block;overflow:hidden}
.bz-al-line>span{display:block;transform:translateY(105%);transition:transform 450ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-al-item[data-expanded="true"] .bz-al-line>span{transform:none;transition-delay:var(--bz-al-delay,0ms)}
.bz-al-empty{margin:0;padding:24px 0;font-size:0.9375rem;color:var(--bz-ink-muted,#4a4a4c)}
@media (max-width:560px){.bz-al-trigger{grid-template-columns:2rem minmax(0,1fr) 48px}.bz-al-meta{display:none}.bz-al-body{padding:0 8px 24px 0}}
@media (prefers-reduced-motion:reduce){.bz-al-disc,.bz-al-item[data-expanded="true"] .bz-al-disc,.bz-al-strip,.bz-al-item[data-expanded="true"] .bz-al-strip,.bz-al-fill,.bz-al-line>span,.bz-al-item[data-expanded="true"] .bz-al-line>span{transition:none}.bz-al-item[data-expanded="true"] .bz-al-disc::after{animation:none}}
\`;

const RM_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(RM_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const readReducedMotion = () => window.matchMedia(RM_QUERY).matches;
const serverReducedMotion = () => false;

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const OPEN_MS = 500;

export type AccordionItem = {
  id?: string;
  title: ReactNode;
  /** Plain text rises line by line; anything else appears as a block. */
  content: ReactNode;
  /** A short second column, such as a date or a category. Hidden on narrow screens. */
  meta?: ReactNode;
};

export type AccordionListProps = {
  items: AccordionItem[];
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Allow more than one row open at a time. */
  multiple?: boolean;
  /** Index or indexes open at first. \`null\` starts with everything closed. */
  defaultOpen?: number | number[] | null;
  /** Heading level for each row's title. The list title is always an h2. */
  headingLevel?: 2 | 3 | 4;
  emptyMessage?: string;
  className?: string;
};

/** Splits plain text into its rendered lines, so each can rise on its own. */
function Lines({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = useMemo(() => text.split(/\\s+/).filter(Boolean), [text]);
  const [lines, setLines] = useState<string[] | null>(null);
  const measuredWidth = useRef(0);

  useIsoLayoutEffect(() => {
    setLines(null);
  }, [text]);

  useIsoLayoutEffect(() => {
    if (lines !== null) return;
    const el = ref.current;
    if (!el) return;
    const spans = Array.from(el.querySelectorAll<HTMLElement>(".bz-al-word"));
    const groups: string[] = [];
    let top = Number.NaN;
    for (const span of spans) {
      const word = span.textContent?.trim() ?? "";
      if (!groups.length || Math.abs(span.offsetTop - top) > 2) {
        groups.push(word);
        top = span.offsetTop;
      } else {
        groups[groups.length - 1] += \` \${word}\`;
      }
    }
    measuredWidth.current = el.clientWidth;
    setLines(groups);
  }, [lines, words]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth && Math.abs(el.clientWidth - measuredWidth.current) > 1) setLines(null);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!lines) {
    return (
      <p ref={ref} className="bz-al-text">
        {words.map((word, i) => (
          <span key={i} className="bz-al-word">
            {word}{" "}
          </span>
        ))}
      </p>
    );
  }
  const count = lines.length;
  return (
    <p ref={ref} className="bz-al-text">
      {lines.map((line, i) => (
        <span key={i} className="bz-al-line">
          <span style={{ ["--bz-al-delay" as string]: \`\${(count > 1 ? Math.round((i * 300) / (count - 1)) : 0) + 120}ms\` } as CSSProperties}>
            {line}
          </span>
        </span>
      ))}
    </p>
  );
}

function Row({
  item,
  index,
  open,
  onToggle,
  headingLevel,
  reduced,
  baseId,
}: {
  item: AccordionItem;
  index: number;
  open: boolean;
  onToggle: (index: number) => void;
  headingLevel: 2 | 3 | 4;
  reduced: boolean;
  baseId: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const token = useRef(0);
  const firstRun = useRef(true);
  // Set once, so React never fights the height the effect animates.
  const [initialStyle] = useState<CSSProperties | undefined>(() => (open ? undefined : { height: 0, visibility: "hidden" }));

  useIsoLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (firstRun.current) {
      firstRun.current = false;
      if (!open) panel.setAttribute("inert", "");
      return;
    }
    const run = ++token.current;
    const duration = reduced ? 0 : OPEN_MS;
    panel.style.transition = duration ? \`height \${duration}ms var(--bz-ease-out, cubic-bezier(0.23, 1, 0.32, 1))\` : "none";
    let raf = 0;
    let timer = 0;
    if (open) {
      panel.removeAttribute("inert");
      panel.style.visibility = "visible";
      panel.style.height = \`\${panel.getBoundingClientRect().height}px\`;
      const target = panel.scrollHeight;
      if (!duration) {
        panel.style.height = "auto";
      } else {
        raf = requestAnimationFrame(() => {
          if (token.current === run) panel.style.height = \`\${target}px\`;
        });
        timer = window.setTimeout(() => {
          if (token.current === run) panel.style.height = "auto";
        }, duration + 30);
      }
    } else {
      panel.style.height = \`\${panel.getBoundingClientRect().height}px\`;
      void panel.offsetHeight;
      panel.style.height = "0px";
      const finish = () => {
        if (token.current !== run) return;
        panel.style.visibility = "hidden";
        panel.setAttribute("inert", "");
      };
      if (!duration) finish();
      else timer = window.setTimeout(finish, duration + 30);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [open]);

  const Heading = \`h\${headingLevel}\` as "h2" | "h3" | "h4";
  const triggerId = \`\${baseId}-trigger-\${index}\`;
  const panelId = \`\${baseId}-panel-\${index}\`;

  return (
    <li className="bz-al-item" data-expanded={open ? "true" : "false"}>
      <Heading className="bz-al-heading">
        <button
          type="button"
          id={triggerId}
          className="bz-al-trigger"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => onToggle(index)}
        >
          <span className="bz-al-index" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="bz-al-name">{item.title}</span>
          <span className="bz-al-meta">
            {item.meta ? (
              <>
                <span className="bz-al-sr">, </span>
                {item.meta}
              </>
            ) : null}
          </span>
          <span className="bz-al-disc" aria-hidden="true">
            <span className="bz-al-clip">
              <span className="bz-al-strip">
                <svg viewBox="0 0 20 20" fill="none">
                  <path d="M10 4.5v11m0 0 4.5-4.5M10 15.5 5.5 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <svg viewBox="0 0 20 20" fill="none">
                  <path d="M10 4.5v11m0 0 4.5-4.5M10 15.5 5.5 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </span>
          </span>
        </button>
      </Heading>
      <div ref={panelRef} id={panelId} role="region" aria-labelledby={triggerId} className="bz-al-panel" style={initialStyle}>
        <div className="bz-al-body">{typeof item.content === "string" ? <Lines text={item.content} /> : item.content}</div>
      </div>
      <div className="bz-al-rule" aria-hidden="true">
        <span className="bz-al-fill" />
      </div>
    </li>
  );
}

export function AccordionList({
  items,
  title,
  subtitle,
  multiple = false,
  defaultOpen = 0,
  headingLevel = 3,
  emptyMessage = "Nothing here yet.",
  className = "",
}: AccordionListProps) {
  const reduced = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, serverReducedMotion);
  const baseId = useId().replace(/:/g, "");
  const [open, setOpen] = useState<Set<number>>(
    () => new Set(defaultOpen === null ? [] : Array.isArray(defaultOpen) ? defaultOpen : [defaultOpen]),
  );

  const toggle = useCallback(
    (index: number) => {
      setOpen((prev) => {
        const next = multiple ? new Set(prev) : new Set<number>();
        if (prev.has(index)) next.delete(index);
        else next.add(index);
        return next;
      });
    },
    [multiple],
  );

  const titleId = \`\${baseId}-title\`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <section className={\`bz-al \${className}\`.trim()} aria-labelledby={title ? titleId : undefined}>
        {title || subtitle ? (
          <div className="bz-al-head">
            {title ? (
              <h2 id={titleId} className="bz-al-title">
                {title}
              </h2>
            ) : null}
            {subtitle ? <p className="bz-al-subtitle">{subtitle}</p> : null}
          </div>
        ) : null}
        {items.length ? (
          <ul className="bz-al-list">
            {items.map((item, index) => (
              <Row
                key={item.id ?? index}
                item={item}
                index={index}
                open={open.has(index)}
                onToggle={toggle}
                headingLevel={headingLevel}
                reduced={reduced}
                baseId={baseId}
              />
            ))}
          </ul>
        ) : (
          <p className="bz-al-empty" role="status">
            {emptyMessage}
          </p>
        )}
      </section>
    </>
  );
}`,
    description: "Accordion whose arrow tumbles open and whose answers rise into place line by line.",
    tags: ["accordion", "faq", "disclosure", "accessible", "inert", "reduced-motion"],
  },
  {
    name: "WhatsAppFAB",
    slug: "whatsapp-fab",
    path: "buttons/WhatsAppFAB.tsx",
    category: "buttons",
    code: `import { MessageCircle } from "lucide-react";

type Props = {
  phoneNumber: string;
  message?: string;
  tooltipText?: string;
};

export function WhatsAppFAB({ phoneNumber, message = "Hello! I have a question.", tooltipText = "Chat with us!" }: Props) {
  const encodedMsg = encodeURIComponent(message);
  const href = \`https://wa.me/\${phoneNumber}?text=\${encodedMsg}\`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-[background-color,box-shadow,transform] duration-300 hover:scale-110 active:scale-105 group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
      aria-label="Chat on WhatsApp"
      title="Chat on WhatsApp"
    >
      <MessageCircle size={26} fill="white" />
      {tooltipText && (
        <span className="absolute right-full mr-3 bg-white text-gray-800 text-xs font-medium px-3 py-1.5 rounded-full shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          {tooltipText}
        </span>
      )}
    </a>
  );
}`,
    description: "Floating WhatsApp chat button with a prefilled message and hover tooltip.",
    tags: ["whatsapp", "fab", "floating", "chat", "fixed", "tooltip"],
  },
  {
    name: "ImagePlaceholder",
    slug: "image-placeholder",
    path: "feedback/ImagePlaceholder.tsx",
    category: "feedback",
    code: `"use client";

import { useEffect, useRef, useState } from "react";

/*
 * ImagePlaceholder: a box that holds an image's aspect ratio while it loads.
 *
 * Every colour is drawn from the surrounding text colour, so the placeholder
 * reads on light and dark grounds without a theme: the fill is currentColor at
 * 12%, and a slow band thins it to 2% as it sweeps across. The icon and label
 * sit at 55% and 72% of currentColor, which keeps the label above 4.5:1 and the
 * icon above 3:1 against the fill on white and on near-black.
 *
 * The sweep pauses off screen and in hidden tabs. Reduced motion shows the
 * plain fill, still and clearly a placeholder. \`aria-busy\` marks it as loading.
 */

const CSS = \`
.bz-ip{position:relative;overflow:hidden;isolation:isolate;background:linear-gradient(100deg,rgba(10,10,10,0.12) 40%,rgba(10,10,10,0.02) 50%,rgba(10,10,10,0.12) 60%) 100% 0/300% 100%;animation:bz-ip-sweep 2.4s linear infinite}
@supports (color:color-mix(in srgb,red 50%,blue)){.bz-ip{background-image:linear-gradient(100deg,color-mix(in srgb,currentColor 12%,transparent) 40%,color-mix(in srgb,currentColor 2%,transparent) 50%,color-mix(in srgb,currentColor 12%,transparent) 60%)}}
@keyframes bz-ip-sweep{0%{background-position:100% 0}70%,100%{background-position:0 0}}
.bz-ip[data-running="false"]{animation-play-state:paused}
.bz-ip-icon{opacity:0.55}
.bz-ip-label{opacity:0.72}
@media (prefers-reduced-motion:reduce){.bz-ip{animation:none}}
\`;

type Props = {
  aspectRatio?: string;
  label?: string;
  rounded?: string;
  className?: string;
};

export function ImagePlaceholder({ aspectRatio = "4/3", label = "", rounded = "rounded-xl", className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [onscreen, setOnscreen] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setOnscreen(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setOnscreen(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const sync = () => setVisible(document.visibilityState !== "hidden");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        ref={ref}
        className={\`bz-ip \${rounded} \${className}\`.trim()}
        style={{ aspectRatio }}
        role="img"
        aria-label={label || "Loading image"}
        aria-busy="true"
        data-running={onscreen && visible ? "true" : "false"}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <svg className="bz-ip-icon w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {label && <span className="bz-ip-label text-xs font-medium">{label}</span>}
        </div>
      </div>
    </>
  );
}`,
    description: "Image placeholder that holds an aspect ratio, with a slow sheen and optional label.",
    tags: ["skeleton", "shimmer", "placeholder", "loading", "image", "accessible"],
  },
  {
    name: "StickyNavbar",
    slug: "sticky-navbar",
    path: "navigation/StickyNavbar.tsx",
    category: "navigation",
    code: `"use client";
import { useState, useEffect } from "react";
import { Menu, X, Search, ShoppingBag, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

export interface NavLink {
  label: string;
  href: string;
}

type Props = {
  brand: string | ReactNode;
  links?: NavLink[];
  cartCount?: number;
  announcementText?: string;
  onSearchClick?: () => void;
  onAccountClick?: () => void;
  onCartClick?: () => void;
};

export function StickyNavbar({
  brand,
  links = [],
  cartCount = 0,
  announcementText = "",
  onSearchClick,
  onAccountClick,
  onCartClick,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activePath, setActivePath] = useState("/");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setActivePath(window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {announcementText && (
        <div className="bg-neutral-900 text-white text-center py-2 text-xs tracking-wide">
          <p>{announcementText}</p>
        </div>
      )}
      <nav
        className={\`sticky top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300 \${
          scrolled ? "bg-white/95 backdrop-blur-md shadow-md" : "bg-white"
        }\`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-16">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Brand */}
            <a href="/" className="flex items-center">
              {typeof brand === "string" ? (
                <span className="text-xl font-bold text-neutral-900">{brand}</span>
              ) : brand}
            </a>

            {/* Desktop links */}
            <div className="hidden lg:flex items-center gap-8">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={\`text-sm font-medium transition-colors duration-200 hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22] \${
                    activePath === link.href
                      ? "text-neutral-900 border-b-2 border-neutral-900 pb-0.5"
                      : "text-neutral-500"
                  }\`}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop actions */}
            <div className="hidden lg:flex items-center gap-4">
              {onSearchClick && (
                <button onClick={onSearchClick} className="p-2 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]" aria-label="Search">
                  <Search size={20} />
                </button>
              )}
              {onAccountClick && (
                <button onClick={onAccountClick} className="p-2 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]" aria-label="Account">
                  <User size={20} />
                </button>
              )}
              {onCartClick && (
                <button onClick={onCartClick} className="relative p-2 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]" aria-label={\`Cart, \${cartCount} items\`}>
                  <ShoppingBag size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                      {cartCount}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              className="lg:hidden p-2 text-neutral-900 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="lg:hidden bg-white border-t border-neutral-100 overflow-hidden"
            >
              <div className="px-4 sm:px-6 py-4 space-y-1">
                {links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={\`block py-3 px-4 rounded-lg text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22] \${
                      activePath === link.href
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-700 hover:bg-neutral-50"
                    }\`}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}`,
    description: "Shop navbar that frosts on scroll, with icon actions and a mobile drawer.",
    tags: ["navbar", "sticky", "responsive", "mobile-drawer", "blur", "announcement-bar", "cart-badge"],
  },
  {
    name: "ErrorBoundary",
    slug: "error-boundary",
    path: "feedback/ErrorBoundary.tsx",
    category: "feedback",
    code: `import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  icon?: string;
  title?: string;
  description?: string;
  buttonLabel?: string;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-6">
          <div className="text-center max-w-md">
            <span className="text-6xl block mb-4">{this.props.icon ?? "⚠️"}</span>
            <h1 className="text-2xl font-bold text-neutral-900 mb-3">
              {this.props.title ?? "Something went wrong"}
            </h1>
            <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
              {this.props.description ?? "An unexpected error occurred. Please try refreshing the page."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-neutral-900 text-white px-8 py-3 rounded-full font-medium text-sm hover:bg-neutral-700 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
            >
              {this.props.buttonLabel ?? "Refresh Page"}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}`,
    description: "Class error boundary that swaps a crashed tree for a full-page refresh screen.",
    tags: ["error-boundary", "fallback", "crash", "full-screen", "class-component"],
  },
  {
    name: "StickyNav",
    slug: "sticky-nav",
    path: "navigation/StickyNav.tsx",
    category: "navigation",
    code: `type NavLink = { label: string; href: string };

type Props = {
  brandName?: string;
  links?: NavLink[];
  onThemeToggle?: () => void;
  isDark?: boolean;
};

export function StickyNav({
  brandName = "YASH",
  links = [],
  onThemeToggle,
  isDark = false,
}: Props) {
  return (
    <header className="sticky top-0 z-50 bg-[rgba(245,245,247,0.8)] backdrop-saturate-[180%] backdrop-blur-[12px] border-b border-black/[0.06]">
      <div className="max-w-[1200px] mx-auto px-6 py-[14px] flex items-center gap-6">
        <a
          className="flex items-center gap-2.5 font-semibold tracking-[0.08em] text-[#0a0a0a] no-underline"
          href="#"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#059669] shadow-[0_0_12px_#059669] shrink-0" />
          <span className="text-[13px]">{brandName}</span>
        </a>

        <nav className="ml-auto flex gap-[22px]">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13px] text-[#4a4a4c] hover:text-[#0a0a0a] transition-colors no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <button
          className="flex items-center justify-center w-9 h-9 rounded-full border border-black/[0.13] cursor-pointer bg-black/[0.02] text-[#4a4a4c] hover:text-[#0a0a0a] hover:bg-black/[0.04] transition-[color,background-color,transform] duration-150 active:scale-[0.93] shrink-0 p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
          aria-label="Toggle theme"
          onClick={onThemeToggle}
        >
          {/* Moon – shown in light mode */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 pointer-events-none"
            style={{ display: isDark ? "none" : "block" }}
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          {/* Sun – shown in dark mode */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 pointer-events-none"
            style={{ display: isDark ? "block" : "none" }}
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        </button>
      </div>
    </header>
  );
}`,
    description: "Frosted sticky header with a glowing brand dot, text links and a theme button.",
    tags: ["navbar", "glassmorphism", "sticky", "dark-mode", "responsive"],
  },
  {
    name: "useThemeRipple",
    slug: "use-theme-ripple",
    path: "hooks/useThemeRipple.tsx",
    category: "hooks",
    code: `"use client";
import { useEffect } from "react";

type Props = {
  isDark: boolean;
  onToggle: (nextDark: boolean) => void;
  storageKey?: string;
};

export function useThemeRipple({ isDark, onToggle, storageKey = "theme" }: Props) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(storageKey);
    if (stored === "dark") onToggle(true);
    else if (stored === "light") onToggle(false);
  }, []);

  function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    const nextDark = !isDark;
    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    const oldBg = nextDark ? "#f5f5f7" : "#0a0a0a";

    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, nextDark ? "dark" : "light");
    }
    onToggle(nextDark);

    const overlay = document.createElement("div");
    overlay.style.cssText = \`position:fixed;inset:0;z-index:2147483647;background:\${oldBg};pointer-events:none;will-change:clip-path;\`;
    document.body.appendChild(overlay);

    const anim = overlay.animate(
      [
        { clipPath: \`circle(\${endRadius}px at \${x}px \${y}px)\` },
        { clipPath: \`circle(0px at \${x}px \${y}px)\` },
      ],
      { duration: 650, easing: "cubic-bezier(.2,.7,.2,1)" }
    );
    anim.onfinish = () => overlay.remove();
  }

  return { toggle };
}`,
    description: "Hook that switches light and dark themes behind a circular wipe from the click.",
    tags: ["dark-mode", "theme", "ripple", "animation", "clip-path", "hook"],
  },
  {
    name: "ShinyBadge",
    slug: "shiny-badge",
    path: "badges/ShinyBadge.tsx",
    category: "badges",
    code: `type Props = {
  spark?: string;
  text: string;
};

export function ShinyBadge({ spark = "✦", text }: Props) {
  return (
    <>
      <style>{\`
        @keyframes shiny-sweep {
          from { background-position: 200% 0; }
          to   { background-position: -200% 0; }
        }
        .shiny-badge-text {
          background: linear-gradient(110deg, #4a4a4c 40%, #0a0a0a 50%, #4a4a4c 60%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          animation: shiny-sweep 3s linear infinite;
        }
      \`}</style>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/[0.02] border border-black/[0.13] text-[13px] text-[#0a0a0a]">
        <span className="text-[#b45309]">{spark}</span>
        <span className="shiny-badge-text">{text}</span>
      </div>
    </>
  );
}`,
    description: "Pill badge with a spark glyph and a light that sweeps across its text.",
    tags: ["badge", "pill", "shiny", "animated", "gradient", "text-effect"],
  },
  {
    name: "BorderBeamButton",
    slug: "border-beam-button",
    path: "buttons/BorderBeamButton.tsx",
    category: "buttons",
    code: `import { useEffect, useRef } from "react";

type Props = {
  label: string;
  variant?: "primary" | "ghost";
  onClick?: () => void;
  href?: string;
};

const beamStyle = \`
  @keyframes border-beam-travel { to { offset-distance: 100%; } }
  .beam-btn { position: relative; isolation: isolate; overflow: hidden; }
  .beam-btn:focus-visible { outline: 2px solid #912c22; outline-offset: 2px; }
  .beam-border {
    position: absolute; inset: 0; border-radius: inherit;
    pointer-events: none; z-index: 1; padding: 1px;
    background: rgba(255,255,255,0.09);
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
            mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor; mask-composite: exclude;
  }
  .beam-dot {
    position: absolute; width: 80px; aspect-ratio: 1;
    background: linear-gradient(to left, #ffaa40, #9c40ff, transparent);
    offset-path: rect(0 100% 100% 0 round 10px);
    offset-distance: 0%;
    animation: border-beam-travel 4s linear infinite;
  }
  @media (prefers-reduced-motion: reduce) { .beam-dot { animation: none; } }
\`;

export function BorderBeamButton({ label, variant = "primary", onClick, href }: Props) {
  const ref = useRef<HTMLButtonElement & HTMLAnchorElement>(null);

  useEffect(() => {
    const btn = ref.current;
    if (!btn) return;
    const border = document.createElement("span");
    border.className = "beam-border";
    border.setAttribute("aria-hidden", "true");
    const dot = document.createElement("span");
    dot.className = "beam-dot";
    border.appendChild(dot);
    btn.appendChild(border);
    return () => border.remove();
  }, []);

  const base =
    "beam-btn inline-flex items-center justify-center px-5 py-[11px] rounded-[10px] text-sm font-medium tracking-[0.01em] border cursor-pointer transition-[transform,filter] duration-200 relative overflow-hidden no-underline active:scale-[0.97]";
  const primary = "bg-[#0a0a0a] text-[#fafafa] border-[#0a0a0a] hover:-translate-y-px hover:brightness-105";
  const ghost = "bg-transparent text-[#1a1a1a] border-black/[0.13] hover:bg-transparent";

  const cls = \`\${base} \${variant === "primary" ? primary : ghost}\`;

  return (
    <>
      <style>{beamStyle}</style>
      {href ? (
        <a href={href} className={cls} ref={ref as React.Ref<HTMLAnchorElement>}>
          {label}
        </a>
      ) : (
        <button className={cls} onClick={onClick} ref={ref as React.Ref<HTMLButtonElement>}>
          {label}
        </button>
      )}
    </>
  );
}`,
    description: "Button with a gradient beam that circles its border along a CSS offset path.",
    tags: ["button", "border-beam", "animated", "gradient", "offset-path"],
  },
  {
    name: "TypingHero",
    slug: "typing-hero",
    path: "sections/TypingHero.tsx",
    category: "sections",
    code: `"use client";
import { useEffect, useRef, useState, ReactNode } from "react";

type Props = {
  title: string;
  titleHighlight?: string;
  subtitle: string;
  typingDelay?: number;
  typingSpeed?: number;
  children?: ReactNode;
};

const typingStyle = \`
  @keyframes typing-cursor { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
  .typing-sub::after {
    content: '|'; display: inline-block; margin-left: 1px;
    color: #059669; font-weight: 300;
    animation: typing-cursor .85s step-end infinite; opacity: 0;
  }
  .typing-sub.is-typing::after { opacity: 1; }
  .typing-sub.is-done::after   { opacity: 1; }
\`;

export function TypingHero({
  title,
  titleHighlight,
  subtitle,
  typingDelay = 480,
  typingSpeed = 28,
  children,
}: Props) {
  const subRef = useRef<HTMLParagraphElement>(null);
  const [ctaVisible, setCtaVisible] = useState(false);

  useEffect(() => {
    const el = subRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = subtitle;
      el.classList.add("is-done");
      setCtaVisible(true);
      return;
    }
    let i = 0;
    const timer = setTimeout(() => {
      el.classList.add("is-typing");
      const tick = setInterval(() => {
        el.textContent = subtitle.slice(0, ++i);
        if (i >= subtitle.length) {
          clearInterval(tick);
          el.classList.remove("is-typing");
          el.classList.add("is-done");
          setCtaVisible(true);
        }
      }, typingSpeed);
    }, typingDelay);
    return () => clearTimeout(timer);
  }, [subtitle, typingDelay, typingSpeed]);

  return (
    <>
      <style>{typingStyle}</style>
      <section className="max-w-[1200px] mx-auto px-6 pt-[72px] pb-12 text-center flex flex-col items-center">
        <h1
          className="font-serif font-medium leading-none mb-[18px] text-[#0a0a0a] tracking-[-0.02em]"
          style={{ fontSize: "clamp(48px, 9vw, 112px)" }}
        >
          {title}{" "}
          {titleHighlight && (
            <span className="font-serif italic font-medium text-[#0a0a0a]">
              {titleHighlight}
            </span>
          )}
        </h1>
        <p
          ref={subRef}
          className="typing-sub max-w-[640px] text-lg text-[#4a4a4c] mb-7 min-h-[1.6em]"
        />
        <div
          className="flex flex-wrap gap-3 justify-center"
          style={{
            opacity: ctaVisible ? 1 : 0,
            transform: ctaVisible ? "translateY(0)" : "translateY(10px)",
            transition: "opacity .5s ease, transform .5s ease",
            pointerEvents: ctaVisible ? "auto" : "none",
          }}
        >
          {children}
        </div>
      </section>
    </>
  );
}`,
    description: "Serif hero whose subtitle types itself out before the call-to-action buttons fade in.",
    tags: ["hero", "typewriter", "animation", "typing", "serif", "headline"],
  },
  {
    name: "FeatureCardGrid",
    slug: "feature-card-grid",
    path: "cards/FeatureCardGrid.tsx",
    category: "cards",
    code: `type FeatureCard = {
  label: string;
  title: string;
};

type Props = {
  cards: FeatureCard[];
};

export function FeatureCardGrid({ cards }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
      {cards.map((card, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 p-[22px] rounded-xl bg-black/[0.02] border border-black/[0.06] transition-[background-color,border-color,transform] duration-[250ms] hover:bg-black/[0.04] hover:border-[#059669] hover:-translate-y-0.5"
        >
          <div className="font-mono text-[11px] tracking-[0.2em] text-[color:var(--bz-emerald,#047857)] uppercase">
            {card.label}
          </div>
          <div className="text-[17px] text-[#0a0a0a] font-medium">{card.title}</div>
        </div>
      ))}
    </div>
  );
}`,
    description: "Three-column grid of feature cards with mono labels and an emerald hover border.",
    tags: ["cards", "grid", "feature", "hover", "responsive", "3-col"],
  },
  {
    name: "NumberedStepsList",
    slug: "numbered-steps-list",
    path: "lists/NumberedStepsList.tsx",
    category: "lists",
    code: `type Step = {
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
          <div className="font-mono text-sm text-[color:var(--bz-emerald,#047857)] tracking-[0.2em]">
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
}`,
    description: "Ordered list of process steps with a mono number column and serif titles.",
    tags: ["steps", "process", "numbered", "serif", "mono", "timeline"],
  },
  {
    name: "FormulaBlock",
    slug: "formula-block",
    path: "display/FormulaBlock.tsx",
    category: "display",
    code: `type Props = {
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
}`,
    description: "Centred monospace formula on an emerald tint, with an optional spaced caption.",
    tags: ["formula", "code", "equation", "monospace", "accent", "callout"],
  },
  {
    name: "SignalCardGrid",
    slug: "signal-card-grid",
    path: "cards/SignalCardGrid.tsx",
    category: "cards",
    code: `type SignalCard = {
  letter: string;
  title: string;
  subtitle: string;
  description: string;
};

type Props = {
  cards: SignalCard[];
};

export function SignalCardGrid({ cards }: Props) {
  return (
    <div
      className="grid gap-3 mt-6"
      style={{
        gridTemplateColumns: \`repeat(\${Math.min(cards.length, 5)}, minmax(0, 1fr))\`,
      }}
    >
      {cards.map((card) => (
        <div
          key={card.letter}
          className="p-[22px] border border-black/[0.06] rounded-xl bg-black/[0.02]"
        >
          <div className="font-serif italic text-[44px] text-[#059669] leading-none">
            {card.letter}
          </div>
          <h4 className="mt-2 mb-1 text-base text-[#0a0a0a] font-medium">{card.title}</h4>
          <p className="m-0 mb-1 text-sm text-[color:var(--bz-ink-subtle,#6b6b70)]">{card.subtitle}</p>
          <p className="m-0 text-sm text-[#4a4a4c]">{card.description}</p>
        </div>
      ))}
    </div>
  );
}`,
    description: "Up to five definition cards, each headed by a large italic serif letter.",
    tags: ["cards", "grid", "letter", "serif", "5-col", "responsive", "acronym"],
  },
  {
    name: "PrincipleCardGrid",
    slug: "principle-card-grid",
    path: "cards/PrincipleCardGrid.tsx",
    category: "cards",
    code: `type Principle = {
  number: string;
  title: string;
  subtitle: string;
  description: string;
};

type Props = {
  principles: Principle[];
};

export function PrincipleCardGrid({ principles }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
      {principles.map((p) => (
        <article
          key={p.number}
          className="p-[22px] border border-black/[0.06] rounded-xl bg-black/[0.02]"
        >
          <div className="font-mono text-[color:var(--bz-emerald,#047857)] text-xs tracking-[0.2em]">{p.number}</div>
          <h3 className="font-serif font-medium mt-2.5 mb-1 text-[22px] text-[#0a0a0a]">
            {p.title}
          </h3>
          <div className="text-[13px] text-[color:var(--bz-emerald,#047857)] mb-2">{p.subtitle}</div>
          <p className="text-[#4a4a4c] text-sm m-0">{p.description}</p>
        </article>
      ))}
    </div>
  );
}`,
    description: "Four-column principle cards with mono numbers, serif titles and emerald subtitles.",
    tags: ["cards", "grid", "4-col", "numbered", "serif", "principles", "pillars"],
  },
  {
    name: "DiagnosticGrid",
    slug: "diagnostic-grid",
    path: "cards/DiagnosticGrid.tsx",
    category: "cards",
    code: `type DiagItem = {
  tag: string;
  title: string;
  description: string;
};

type Props = {
  items: DiagItem[];
};

export function DiagnosticGrid({ items }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
      {items.map((item) => (
        <div
          key={item.tag}
          className="p-6 border border-black/[0.06] rounded-xl bg-black/[0.02]"
        >
          <span className="inline-block px-2.5 py-1 rounded-full bg-[rgba(234,179,8,0.2)] text-[#92400e] font-mono text-[10px] tracking-[0.15em] mb-3">
            {item.tag}
          </span>
          <h3 className="font-serif font-medium text-[#0a0a0a] mt-0 mb-1.5 text-[22px]">
            {item.title}
          </h3>
          <p className="text-[#4a4a4c] m-0 text-[15px]">{item.description}</p>
        </div>
      ))}
    </div>
  );
}`,
    description: "Two-column diagnosis cards, each tagged with a small amber monospace pill.",
    tags: ["cards", "grid", "diagnostic", "warning", "2-col", "tag", "status"],
  },
  {
    name: "CalloutBox",
    slug: "callout-box",
    path: "callouts/CalloutBox.tsx",
    category: "callouts",
    code: `import { ReactNode } from "react";

type CheckItem = {
  symbol: string;
  content: ReactNode;
};

type Props = {
  title: string;
  intro?: string;
  label?: string;
  items?: CheckItem[];
  footer?: string;
};

export function CalloutBox({ title, intro, label, items = [], footer }: Props) {
  return (
    <div
      className="mt-8 p-8 border border-[#b45309] rounded-[14px]"
      style={{
        background: "linear-gradient(180deg, rgba(234,179,8,0.2), rgba(0,0,0,0.02))",
      }}
    >
      <h3 className="font-serif font-medium text-[#0a0a0a] text-2xl mt-0 mb-2.5">
        {title}
      </h3>
      {intro && <p className="text-[#4a4a4c] mt-0 mb-4">{intro}</p>}
      {label && (
        <div className="font-mono text-[11px] tracking-[0.3em] text-[#b45309] mt-5 mb-2 uppercase">
          {label}
        </div>
      )}
      {items.length > 0 && (
        <ul className="list-none p-0 m-0 flex flex-col gap-2">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2.5 items-start text-[15px] text-[#1a1a1a]">
              <span className="inline-flex w-[22px] h-[22px] items-center justify-center rounded-full bg-[rgba(234,179,8,0.2)] text-[#b45309] text-xs shrink-0">
                {item.symbol}
              </span>
              <span>{item.content}</span>
            </li>
          ))}
        </ul>
      )}
      {footer && (
        <p className="text-[#4a4a4c] mt-4 mb-0 font-medium">{footer}</p>
      )}
    </div>
  );
}`,
    description: "Amber callout with a serif title, labelled symbol list and closing line.",
    tags: ["callout", "warning", "alert", "checklist", "amber", "gradient", "diagnosis"],
  },
  {
    name: "Checklist",
    slug: "checklist",
    path: "lists/Checklist.tsx",
    category: "lists",
    code: `import { ReactNode } from "react";

type CheckItem = {
  symbol: string;
  text: ReactNode;
};

type Props = {
  items: CheckItem[];
};

export function Checklist({ items }: Props) {
  return (
    <ul className="list-none p-0 my-6 flex flex-col gap-2.5">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex gap-3 items-start px-4 py-[14px] bg-black/[0.02] border border-black/[0.06] rounded-[10px] text-[#1a1a1a] text-[15px]"
        >
          <span className="inline-flex w-[22px] h-[22px] items-center justify-center rounded-full bg-[rgba(5,150,105,0.1)] text-[color:var(--bz-emerald,#047857)] text-xs shrink-0">
            {item.symbol}
          </span>
          <span>{item.text}</span>
        </li>
      ))}
    </ul>
  );
}`,
    description: "Checklist of hairline cards, each led by a round emerald marker.",
    tags: ["checklist", "list", "badge", "check", "accent", "card-row"],
  },
  {
    name: "ScrollReveal",
    slug: "scroll-reveal",
    path: "animation/ScrollReveal.tsx",
    category: "animation",
    code: `"use client";
import { useEffect, useRef, ReactNode } from "react";

type Variant = "up" | "left" | "right" | "scale";

type Props = {
  children: ReactNode;
  variant?: Variant;
  delay?: 0 | 100 | 200 | 300 | 400 | 500;
  className?: string;
};

const revealStyle = \`
  .sr-up    { opacity:0; transform:translateY(32px) scale(.97); transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1); will-change:opacity,transform; }
  .sr-up.in { opacity:1; transform:translateY(0) scale(1); }
  .sr-left    { opacity:0; transform:translateX(-40px) scale(.97); transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1); will-change:opacity,transform; }
  .sr-left.in { opacity:1; transform:translateX(0) scale(1); }
  .sr-right    { opacity:0; transform:translateX(40px) scale(.97); transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1); will-change:opacity,transform; }
  .sr-right.in { opacity:1; transform:translateX(0) scale(1); }
  .sr-scale    { opacity:0; transform:scale(.88); transition:opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1); will-change:opacity,transform; }
  .sr-scale.in { opacity:1; transform:scale(1); }
  .sr-d1 { transition-delay:.1s; }
  .sr-d2 { transition-delay:.2s; }
  .sr-d3 { transition-delay:.3s; }
  .sr-d4 { transition-delay:.4s; }
  .sr-d5 { transition-delay:.5s; }
  @media (prefers-reduced-motion:reduce) {
    .sr-up,.sr-left,.sr-right,.sr-scale { opacity:1; transform:none; transition:none; }
  }
\`;

const variantClass: Record<Variant, string> = {
  up: "sr-up",
  left: "sr-left",
  right: "sr-right",
  scale: "sr-scale",
};

export function ScrollReveal({ children, variant = "up", delay = 0, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      el.classList.add("in");
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("in");
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const delayClass = delay ? \`sr-d\${delay / 100}\` : "";
  const cls = [variantClass[variant], delayClass, className].filter(Boolean).join(" ");

  return (
    <>
      <style>{revealStyle}</style>
      <div ref={ref} className={cls}>
        {children}
      </div>
    </>
  );
}`,
    description: "Wrapper that fades children up, in from a side, or scales them on entry.",
    tags: ["scroll", "reveal", "animation", "intersection-observer", "fade", "wrapper", "motion"],
  },
  {
    name: "SiteFooter",
    slug: "site-footer",
    path: "layout/SiteFooter.tsx",
    category: "layout",
    code: `type FooterColumn = {
  heading: string;
  links: { label: string; href: string }[];
};

type Props = {
  brandName?: string;
  tagline?: string;
  columns?: FooterColumn[];
  copyright?: string;
  publishedBy?: { label: string; href: string };
};

export function SiteFooter({
  brandName = "YASH",
  tagline = "",
  columns = [],
  copyright = \`© \${new Date().getFullYear()} YASH. All rights reserved.\`,
  publishedBy,
}: Props) {
  return (
    <footer className="border-t border-black/[0.06] px-6 pt-16 pb-7 mt-10">
      <div
        className="max-w-[1200px] mx-auto grid gap-8"
        style={{ gridTemplateColumns: \`2fr \${columns.map(() => "1fr").join(" ")}\` }}
      >
        {/* Brand column */}
        <div>
          <div className="flex items-center gap-2.5 font-semibold tracking-[0.08em] text-[#0a0a0a] text-[13px]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669] shadow-[0_0_12px_#059669] shrink-0" />
            {brandName}
          </div>
          {tagline && (
            <p className="text-sm text-[color:var(--bz-ink-subtle,#6b6b70)] mt-2.5 max-w-[360px]">{tagline}</p>
          )}
        </div>

        {/* Link columns */}
        {columns.map((col) => (
          <div key={col.heading}>
            <h4 className="font-mono text-[11px] tracking-[0.3em] text-[color:var(--bz-emerald,#047857)] mt-0 mb-3.5 uppercase">
              {col.heading}
            </h4>
            <ul className="list-none p-0 m-0">
              {col.links.map((l) => (
                <li key={l.href} className="mb-2">
                  <a
                    href={l.href}
                    className="text-[#4a4a4c] text-sm hover:text-[#0a0a0a] transition-colors no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="max-w-[1200px] mx-auto flex justify-between flex-wrap gap-3 mt-12 pt-[22px] border-t border-black/[0.06] text-[color:var(--bz-ink-subtle,#6b6b70)] text-xs">
        <span>{copyright}</span>
        {publishedBy && (
          <span>
            Published by{" "}
            <a
              href={publishedBy.href}
              className="text-[#4a4a4c] hover:text-[#0a0a0a] no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
            >
              {publishedBy.label}
            </a>
          </span>
        )}
      </div>
    </footer>
  );
}`,
    description: "Site footer with a glowing brand dot, mono column headings and a legal row.",
    tags: ["footer", "grid", "links", "responsive", "brand", "copyright"],
  },
  {
    name: "DepthText",
    slug: "depth-text",
    path: "display/DepthText.tsx",
    category: "display",
    code: `"use client";

import {
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
} from "react";

const MAX_LAYERS = 64;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getLayerColor = (
  faceColor: string,
  depthColor: string,
  index: number,
  total: number,
) => {
  const progress = total <= 1 ? 1 : index / total;
  const eased = progress * progress;
  const faceMix = Math.round((1 - eased) * 72 + 4);
  return \`color-mix(in srgb, \${faceColor} \${faceMix}%, \${depthColor})\`;
};

const getTransform = (rotateX: number, rotateY: number) =>
  \`rotateX(\${rotateX.toFixed(3)}deg) rotateY(\${rotateY.toFixed(3)}deg)\`;

export type DepthTextProps = {
  text?: string;
  layers?: number;
  depth?: number;
  faceColor?: string;
  depthColor?: string;
  tilt?: number;
  pointerTracking?: boolean;
  smoothing?: number;
  perspective?: number;
  autoOrbit?: boolean;
  orbitSpeed?: number;
  fontSize?: string;
  fontWeight?: number | string;
  shadow?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function DepthText({
  text = "YASH",
  layers = 34,
  depth = 2.4,
  faceColor = "#f8fafc",
  depthColor = "#7c3aed",
  tilt = 7.5,
  pointerTracking = true,
  smoothing = 0.14,
  perspective = 900,
  autoOrbit = true,
  orbitSpeed = 0.35,
  fontSize = "clamp(3rem, 12vw, 7rem)",
  fontWeight = 900,
  shadow = true,
  className = "",
  style = {},
}: DepthTextProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const stageRef = useRef<HTMLSpanElement>(null);

  const safeLayers = clamp(Math.round(Number(layers) || 1), 2, MAX_LAYERS);
  const safeDepth = clamp(Number(depth) || 0, 0, 12);
  const safeTilt = clamp(Number(tilt) || 0, 0, 12);
  const safeSmoothing = clamp(Number(smoothing) || 0.14, 0.02, 0.35);
  const safePerspective = clamp(Number(perspective) || 900, 300, 2000);
  const safeOrbitSpeed = clamp(Number(orbitSpeed) || 0, 0, 2);

  const baseRotation = useMemo(
    () => ({ x: -safeTilt * 0.32, y: safeTilt * 0.42 }),
    [safeTilt],
  );

  const depthLayers = useMemo(
    () =>
      Array.from({ length: safeLayers }, (_, layerIndex) => {
        const index = safeLayers - layerIndex;
        return {
          index,
          color: getLayerColor(faceColor, depthColor, index, safeLayers),
          transform: \`translateZ(\${-index * safeDepth}px)\`,
        };
      }),
    [safeLayers, safeDepth, faceColor, depthColor],
  );

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage || typeof window === "undefined") return undefined;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const finePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    const canTrackPointer = pointerTracking && finePointer && !reducedMotion;

    let frameId = 0;
    let activePointer = false;
    let startTime = performance.now();
    const current = { ...baseRotation };
    const target = { ...baseRotation };

    const applyTransform = () => {
      stage.style.transform = getTransform(current.x, current.y);
    };

    if (reducedMotion) {
      stage.style.transform = getTransform(baseRotation.x, baseRotation.y);
      return undefined;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      activePointer = true;
      const x = clamp(
        (event.clientX - (rect.left + rect.width / 2)) / (rect.width * 0.8),
        -1,
        1,
      );
      const y = clamp(
        (event.clientY - (rect.top + rect.height / 2)) / (rect.height * 0.8),
        -1,
        1,
      );
      target.x = baseRotation.x - y * safeTilt;
      target.y = baseRotation.y + x * safeTilt;
    };

    const handlePointerLeave = () => {
      activePointer = false;
      target.x = baseRotation.x;
      target.y = baseRotation.y;
    };

    if (canTrackPointer) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerleave", handlePointerLeave);
      window.addEventListener("blur", handlePointerLeave);
    }

    const tick = (now: number) => {
      if ((!canTrackPointer || !activePointer) && autoOrbit) {
        const elapsed = (now - startTime) / 1000;
        const orbit = elapsed * safeOrbitSpeed * Math.PI * 2;
        const fallbackAmount = canTrackPointer ? 0.18 : 0.55;
        target.x =
          baseRotation.x + Math.sin(orbit) * safeTilt * fallbackAmount;
        target.y =
          baseRotation.y + Math.cos(orbit * 0.85) * safeTilt * fallbackAmount;
      }
      current.x += (target.x - current.x) * safeSmoothing;
      current.y += (target.y - current.y) * safeSmoothing;
      applyTransform();
      frameId = requestAnimationFrame(tick);
    };

    applyTransform();
    frameId = requestAnimationFrame(tick);

    return () => {
      if (canTrackPointer) {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerleave", handlePointerLeave);
        window.removeEventListener("blur", handlePointerLeave);
      }
      cancelAnimationFrame(frameId);
    };
  }, [
    autoOrbit,
    baseRotation,
    pointerTracking,
    safeOrbitSpeed,
    safeSmoothing,
    safeTilt,
  ]);

  const rootStyle = {
    ...style,
    "--depth-text-perspective": \`\${safePerspective}px\`,
    "--depth-text-font-size": fontSize,
    "--depth-text-font-weight": fontWeight,
    "--depth-text-face-color": faceColor,
    "--depth-text-depth-color": depthColor,
    "--depth-text-shadow": shadow
      ? \`0 22px 34px color-mix(in srgb, \${depthColor} 36%, transparent), 0 4px 8px rgba(0, 0, 0, 0.28)\`
      : "none",
  } as CSSProperties;

  return (
    <>
      <style>{\`
        .depth-text {
          display: inline-block;
          perspective: var(--depth-text-perspective);
          perspective-origin: 50% 48%;
          isolation: isolate;
        }
        .depth-text__stage {
          position: relative;
          display: inline-grid;
          place-items: center;
          transform-style: preserve-3d;
          transform: rotateX(-2.4deg) rotateY(3.15deg);
          transform-origin: 50% 50%;
          will-change: transform;
        }
        .depth-text__layer,
        .depth-text__face {
          grid-area: 1 / 1;
          display: inline-block;
          font-family: inherit;
          font-size: var(--depth-text-font-size);
          font-weight: var(--depth-text-font-weight);
          line-height: 0.86;
          letter-spacing: -0.065em;
          white-space: nowrap;
          user-select: none;
          transform-style: preserve-3d;
          backface-visibility: hidden;
          text-rendering: geometricPrecision;
        }
        .depth-text__layer {
          position: absolute;
          inset: 0;
          z-index: 0;
          filter: saturate(0.95) brightness(0.92);
          pointer-events: none;
        }
        .depth-text__face {
          position: relative;
          z-index: 1;
          color: var(--depth-text-face-color);
          text-shadow: var(--depth-text-shadow);
          transform: translateZ(0.6px);
        }
        @media (prefers-reduced-motion: reduce) {
          .depth-text__stage { will-change: auto; }
        }
      \`}</style>
      <span
        ref={rootRef}
        className={\`depth-text \${className}\`.trim()}
        style={rootStyle}
      >
        <span ref={stageRef} className="depth-text__stage">
          {depthLayers.map((layer) => (
            <span
              aria-hidden="true"
              className="depth-text__layer"
              key={layer.index}
              style={{ color: layer.color, transform: layer.transform }}
            >
              {text}
            </span>
          ))}
          <span className="depth-text__face">{text}</span>
        </span>
      </span>
    </>
  );
}`,
    description: "Extruded 3D type made of stacked layers that tilts to follow the pointer.",
    tags: ["3d-text", "extruded", "pointer-tilt", "auto-orbit", "preserve-3d", "typography"],
  },
  {
    name: "Magnet",
    slug: "magnet",
    path: "interaction/Magnet.tsx",
    category: "interaction",
    code: `"use client";

import {
  useEffect,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";

type MagnetProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  padding?: number;
  disabled?: boolean;
  magnetStrength?: number;
  wrapperClassName?: string;
  innerClassName?: string;
};

export function Magnet({
  children,
  padding = 72,
  disabled = false,
  magnetStrength = 5,
  wrapperClassName = "",
  innerClassName = "",
  ...props
}: MagnetProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const inner = innerRef.current;
    if (!root || !inner || disabled) return;
    if (
      window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)")
        .matches
    ) {
      return;
    }

    let frame = 0;
    const settle = () => {
      inner.style.transition = "transform 420ms cubic-bezier(.23,1,.32,1)";
      inner.style.transform = "translate3d(0, 0, 0)";
    };
    const move = (event: PointerEvent) => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const rect = root.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distanceX = Math.abs(event.clientX - centerX);
        const distanceY = Math.abs(event.clientY - centerY);
        const active =
          distanceX < rect.width / 2 + padding &&
          distanceY < rect.height / 2 + padding;

        inner.style.transition = active
          ? "transform 140ms cubic-bezier(.23,1,.32,1)"
          : "transform 420ms cubic-bezier(.23,1,.32,1)";
        inner.style.transform = active
          ? \`translate3d(\${(event.clientX - centerX) / magnetStrength}px, \${(event.clientY - centerY) / magnetStrength}px, 0)\`
          : "translate3d(0, 0, 0)";
      });
    };

    window.addEventListener("pointermove", move, { passive: true });
    root.addEventListener("pointerleave", settle);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", settle);
    };
  }, [disabled, magnetStrength, padding]);

  return (
    <div ref={rootRef} className={wrapperClassName} {...props}>
      <div ref={innerRef} className={innerClassName}>
        {children}
      </div>
    </div>
  );
}`,
    description: "Wrapper that pulls its child toward a nearby pointer, then springs back.",
    tags: ["magnetic", "pointer", "hover", "physics", "cta", "raf"],
  },
  {
    name: "GlareHover",
    slug: "glare-hover",
    path: "interaction/GlareHover.tsx",
    category: "interaction",
    code: `"use client";

import {
  useCallback,
  useRef,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";

type GlareHoverProps = {
  children: ReactNode;
  className?: string;
  glareSize?: number;
  glareColor?: string;
};

export function GlareHover({
  children,
  className = "",
  glareSize = 90,
  glareColor = "rgba(255, 255, 255, 0.72)",
}: GlareHoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    el.style.setProperty("--glare-x", \`\${x}%\`);
    el.style.setProperty("--glare-y", \`\${y}%\`);
  }, []);

  const onLeave = useCallback(() => {
    ref.current?.style.setProperty("--glare-opacity", "0");
  }, []);

  const onEnter = useCallback(() => {
    ref.current?.style.setProperty("--glare-opacity", "1");
  }, []);

  return (
    <>
      <style>{\`
        .pl-glare {
          position: relative;
          isolation: isolate;
          border-radius: inherit;
        }
        .pl-glare__shine {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          z-index: 2;
          opacity: var(--glare-opacity, 0);
          transition: opacity 220ms cubic-bezier(0.22, 1, 0.36, 1);
          background: radial-gradient(
            circle var(--glare-size, 90px) at var(--glare-x, 50%) var(--glare-y, 40%),
            var(--glare-color, rgba(255, 255, 255, 0.72)) 0%,
            rgba(255, 255, 255, 0.22) 28%,
            transparent 62%
          );
          mix-blend-mode: soft-light;
        }
        @media (prefers-reduced-motion: reduce) {
          .pl-glare__shine { display: none; }
        }
      \`}</style>
      <div
        ref={ref}
        className={\`pl-glare \${className}\`.trim()}
        style={
          {
            "--glare-x": "50%",
            "--glare-y": "40%",
            "--glare-opacity": "0",
            "--glare-size": \`\${glareSize}px\`,
            "--glare-color": glareColor,
          } as CSSProperties
        }
        onPointerMove={onMove}
        onPointerEnter={onEnter}
        onPointerLeave={onLeave}
      >
        {children}
        <span className="pl-glare__shine" aria-hidden />
      </div>
    </>
  );
}`,
    description: "Soft-light glare that follows the pointer across any surface it wraps.",
    tags: ["glare", "specular", "pointer", "soft-light", "card", "shine"],
  },
  {
    name: "CinematicWaterBackground",
    slug: "cinematic-water-background",
    path: "media/CinematicWaterBackground.tsx",
    category: "media",
    code: `"use client";

import { useId, useMemo, type CSSProperties } from "react";

type Bubble = {
  x: string;
  s: string;
  dur: string;
  dly: string;
  drift: string;
};

type CinematicWaterBackgroundProps = {
  scene?: 1 | 2 | 3 | 4; // scroll-depth tier — lowers water opacity as scene rises
  className?: string;
  bubbleCount?: number;
};

function makeBubbles(count: number, seed: number): Bubble[] {
  const out: Bubble[] = [];
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = 0; i < count; i++) {
    out.push({
      x: \`\${(rand() * 100).toFixed(1)}%\`,
      s: \`\${(3.2 + rand() * 6).toFixed(1)}px\`,
      dur: \`\${(14 + rand() * 14).toFixed(1)}s\`,
      dly: \`\${(rand() * 20).toFixed(1)}s\`,
      drift: \`\${(rand() * 80 - 40).toFixed(0)}px\`,
    });
  }
  return out;
}

function WaveLayer({
  uid,
  suffix,
  filterScale,
  baseFrequency,
  paths,
  opacity,
  className,
}: {
  uid: string;
  suffix: string;
  filterScale: number;
  baseFrequency: string;
  paths: Array<{ d: string; w: number; o: number }>;
  opacity: number;
  className: string;
}) {
  const gid = \`\${uid}-cg-\${suffix}\`;
  const fid = \`\${uid}-wf-\${suffix}\`;
  return (
    <div className={className} style={{ opacity }}>
      <svg className="cw__sv" viewBox="0 0 1800 1100" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#eafff4" stopOpacity="0" />
            <stop offset="0.18" stopColor="#f2fff8" stopOpacity="0.95" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="0.82" stopColor="#e6fbef" stopOpacity="0.9" />
            <stop offset="1" stopColor="#eafff4" stopOpacity="0" />
          </linearGradient>
          <filter id={fid} x="-12%" y="-12%" width="124%" height="124%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency={baseFrequency} numOctaves="3" seed="21" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={filterScale} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g filter={\`url(#\${fid})\`}>
          {paths.map((p, i) => (
            <path
              key={i}
              d={p.d}
              stroke={\`url(#\${gid})\`}
              strokeWidth={p.w}
              fill="none"
              opacity={p.o}
              strokeLinecap="round"
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

const WAVE_A: Array<{ d: string; w: number; o: number }> = [
  { d: "M100 220 Q400 280 700 240 Q1000 200 1300 250 Q1600 300 1900 240", w: 4.2, o: 0.4 },
  { d: "M-50 480 Q250 520 550 490 Q850 450 1150 500 Q1450 560 1750 510 Q2050 460 2350 500", w: 5.5, o: 0.32 },
  { d: "M80 720 Q380 760 680 730 Q980 690 1280 740 Q1580 800 1880 750", w: 3.8, o: 0.28 },
  { d: "M40 960 Q340 1000 640 970 Q940 930 1240 980 Q1540 1030 1840 990", w: 6.1, o: 0.35 },
  { d: "M200 340 Q500 300 800 350 Q1100 400 1400 360 Q1700 310 2000 350", w: 2.4, o: 0.45 },
  { d: "M-100 600 Q200 640 500 610 Q800 570 1100 620 Q1400 680 1700 630", w: 5.0, o: 0.22 },
];

const WAVE_B: Array<{ d: string; w: number; o: number }> = [
  { d: "M60 180 Q320 210 580 190 Q840 160 1100 200 Q1360 240 1620 200", w: 2.2, o: 0.22 },
  { d: "M-80 560 Q180 540 440 570 Q700 610 960 580 Q1220 540 1480 570", w: 1.6, o: 0.28 },
  { d: "M120 860 Q380 840 640 870 Q900 910 1160 880 Q1420 840 1680 870", w: 2.8, o: 0.2 },
  { d: "M40 400 Q300 430 560 410 Q820 380 1080 420 Q1340 460 1600 430", w: 1.4, o: 0.18 },
  { d: "M200 1040 Q460 1020 720 1050 Q980 1090 1240 1060 Q1500 1020 1760 1050", w: 2.0, o: 0.16 },
];

export function CinematicWaterBackground({
  scene = 1,
  className = "",
  bubbleCount = 16,
}: CinematicWaterBackgroundProps) {
  const uid = useId().replace(/:/g, "");
  const bubbles = useMemo(() => makeBubbles(bubbleCount, 42), [bubbleCount]);
  const sg = \`\${uid}-sg\`;
  const sf = \`\${uid}-sf\`;
  const sfw = \`\${uid}-sfw\`;

  return (
    <>
      <style>{\`
        .cw {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          isolation: isolate;
        }
        .cw__scene {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 1.5s ease;
        }
        .cw__scene--on { opacity: 1; }
        .cw__s1 { background: linear-gradient(178deg, #1ea38d 0%, #0b8578 22%, #017069 48%, #4b3a8f 74%, #01524e 100%); }
        .cw__s2 { background: linear-gradient(178deg, #12907f 0%, #04756e 26%, #4b3a8f 58%, #01514d 100%); }
        .cw__s3 { background: linear-gradient(178deg, #067c71 0%, #00625d 30%, #014e4a 64%, #023c39 100%); }
        .cw__s4 { background: linear-gradient(178deg, #036359 0%, #014b46 32%, #013431 66%, #012422 100%); }
        .cw__water {
          position: absolute;
          inset: -14% -10%;
          transition: opacity 1.2s ease;
        }
        .cw[data-d="1"] .cw__water { opacity: 1; }
        .cw[data-d="2"] .cw__water { opacity: 0.8; }
        .cw[data-d="3"] .cw__water { opacity: 0.58; }
        .cw[data-d="4"] .cw__water { opacity: 0.34; }
        .cw[data-d="1"] .cw__surface { opacity: 0.7; }
        .cw[data-d="2"] .cw__surface,
        .cw[data-d="3"] .cw__surface,
        .cw[data-d="4"] .cw__surface { opacity: 0; }
        .cw__layer {
          position: absolute;
          inset: 0;
          mix-blend-mode: screen;
          will-change: transform;
        }
        .cw__sv { width: 100%; height: 100%; display: block; }
        .cw__a { animation: cw-drift-a 34s linear infinite; }
        .cw__b { animation: cw-drift-b 23s linear infinite; }
        .cw__shafts {
          position: absolute;
          inset: 0;
          mix-blend-mode: screen;
          animation: cw-shaft 19s ease-in-out infinite;
        }
        .cw__surface {
          position: absolute;
          inset: 0;
          mix-blend-mode: screen;
          transform-origin: 50% 0;
          animation: cw-surface 11s ease-in-out infinite;
        }
        .cw__bub { position: absolute; inset: 0; overflow: hidden; }
        .cw__bub span {
          position: absolute;
          bottom: -6%;
          left: var(--x);
          width: var(--s);
          height: var(--s);
          border-radius: 50%;
          border: 1px solid rgba(230, 255, 242, 0.5);
          background: radial-gradient(circle at 34% 30%, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0) 62%);
          animation: cw-rise var(--dur) linear infinite;
          animation-delay: var(--dly);
          opacity: 0;
        }
        .cw__vig {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(126% 86% at 50% 28%, transparent 38%, rgba(1, 50, 46, 0.2) 78%, rgba(1, 34, 32, 0.44) 100%),
            linear-gradient(180deg, rgba(1, 38, 36, 0.3) 0%, transparent 18%, transparent 66%, rgba(1, 32, 30, 0.4) 100%);
        }
        @keyframes cw-drift-a {
          0% { transform: translate3d(-3%, 0, 0) scale(1.06); }
          50% { transform: translate3d(3%, -1.6%, 0) scale(1.13); }
          100% { transform: translate3d(-3%, 0, 0) scale(1.06); }
        }
        @keyframes cw-drift-b {
          0% { transform: translate3d(4%, 1%, 0) scale(1.1); }
          50% { transform: translate3d(-4%, -1%, 0) scale(1.04); }
          100% { transform: translate3d(4%, 1%, 0) scale(1.1); }
        }
        @keyframes cw-shaft {
          0% { transform: translate3d(-2%, 0, 0) skewX(0deg); opacity: 0.34; }
          50% { transform: translate3d(2%, 0, 0) skewX(2.4deg); opacity: 0.6; }
          100% { transform: translate3d(-2%, 0, 0) skewX(0deg); opacity: 0.34; }
        }
        @keyframes cw-surface {
          0% { transform: translateY(0) scaleY(1); opacity: 0.55; }
          50% { transform: translateY(-1.4%) scaleY(1.14); opacity: 0.82; }
          100% { transform: translateY(0) scaleY(1); opacity: 0.55; }
        }
        @keyframes cw-rise {
          0% { transform: translate3d(0, 0, 0); opacity: 0; }
          12% { opacity: 0.7; }
          88% { opacity: 0.5; }
          100% { transform: translate3d(var(--drift), -116vh, 0); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cw__a, .cw__b, .cw__shafts, .cw__surface, .cw__bub span { animation: none !important; }
          .cw__bub { display: none; }
        }
      \`}</style>
      <div className={\`cw \${className}\`.trim()} data-d={String(scene)} aria-hidden>
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={\`cw__scene cw__s\${n}\${scene === n ? " cw__scene--on" : ""}\`}
          />
        ))}
        <div className="cw__water">
          <WaveLayer
            uid={uid}
            suffix="a"
            filterScale={72}
            baseFrequency="0.0022 0.019"
            paths={WAVE_A}
            opacity={0.8}
            className="cw__layer cw__a"
          />
          <WaveLayer
            uid={uid}
            suffix="b"
            filterScale={46}
            baseFrequency="0.005 0.031"
            paths={WAVE_B}
            opacity={0.54}
            className="cw__layer cw__b"
          />
          <div className="cw__shafts">
            <svg className="cw__sv" viewBox="0 0 1800 1100" preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id={sg} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#f4fff9" stopOpacity="0.85" />
                  <stop offset="0.38" stopColor="#dcf6e7" stopOpacity="0.28" />
                  <stop offset="1" stopColor="#d4f2e2" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points="95,-80 152,-80 517,1180 439,1180" fill={\`url(#\${sg})\`} opacity="0.26" />
              <polygon points="433,-80 491,-80 885,1180 807,1180" fill={\`url(#\${sg})\`} opacity="0.41" />
              <polygon points="751,-80 919,-80 1180,1180 953,1180" fill={\`url(#\${sg})\`} opacity="0.31" />
              <polygon points="1048,-80 1135,-80 1400,1180 1282,1180" fill={\`url(#\${sg})\`} opacity="0.28" />
              <polygon points="1366,-80 1520,-80 1898,1180 1690,1180" fill={\`url(#\${sg})\`} opacity="0.28" />
            </svg>
          </div>
          <div className="cw__surface">
            <svg className="cw__sv" viewBox="0 0 1800 1100" preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id={sf} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
                  <stop offset="0.55" stopColor="#e8fff2" stopOpacity="0.16" />
                  <stop offset="1" stopColor="#e8fff2" stopOpacity="0" />
                </linearGradient>
                <filter id={sfw} x="-10%" y="-40%" width="120%" height="180%" colorInterpolationFilters="sRGB">
                  <feTurbulence type="fractalNoise" baseFrequency="0.004 0.05" numOctaves="2" seed="9" result="n" />
                  <feDisplacementMap in="SourceGraphic" in2="n" scale="30" xChannelSelector="R" yChannelSelector="G" />
                </filter>
              </defs>
              <g filter={\`url(#\${sfw})\`}>
                <rect x="-100" y="-40" width="2000" height="150" fill={\`url(#\${sf})\`} />
                <rect x="-100" y="60" width="2000" height="60" fill={\`url(#\${sf})\`} opacity="0.5" />
              </g>
            </svg>
          </div>
          <div className="cw__bub">
            {bubbles.map((b, i) => (
              <span
                key={i}
                style={
                  {
                    "--x": b.x,
                    "--s": b.s,
                    "--dur": b.dur,
                    "--dly": b.dly,
                    "--drift": b.drift,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        </div>
        <div className="cw__vig" />
      </div>
    </>
  );
}`,
    description: "Underwater backdrop of turbulent waves, drifting light shafts and rising bubbles.",
    tags: ["svg-filters", "turbulence", "displacement", "parallax-bg", "bubbles", "cinematic"],
  },
  {
    name: "ConicBorderButton",
    slug: "conic-border-button",
    path: "buttons/ConicBorderButton.tsx",
    category: "buttons",
    code: `"use client";

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

type ConicBorderButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  colors?: [string, string, string];
  spinDuration?: number;
  textured?: boolean;
};

export function ConicBorderButton({
  children,
  className = "",
  colors = ["#b8701c", "#4b3a8f", "#4f7d10"],
  spinDuration = 3.2,
  textured = true,
  type = "button",
  ...rest
}: ConicBorderButtonProps) {
  const [c0, c1, c2] = colors;
  return (
    <>
      <style>{\`
        @property --btn-ang {
          syntax: "<angle>";
          inherits: false;
          initial-value: 0deg;
        }
        .cbb {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          isolation: isolate;
          overflow: hidden;
          border: 0;
          border-radius: 999px;
          padding: 0 1.35rem;
          height: 46px;
          cursor: pointer;
          color: #f5fff9;
          font: inherit;
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          background: linear-gradient(135deg, #00706a, #004b46);
          transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .cbb:hover { transform: translateY(-2px); }
        .cbb:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
        .cbb::after {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          padding: 2px;
          background: conic-gradient(
            from var(--btn-ang, 0deg),
            var(--cbb-0),
            var(--cbb-1),
            var(--cbb-2),
            var(--cbb-0)
          );
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: cbb-spin var(--cbb-dur, 3.2s) linear infinite;
          z-index: -1;
          opacity: 0.9;
        }
        .cbb--textured::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          opacity: 0.22;
          mix-blend-mode: soft-light;
          z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E");
        }
        .cbb__label { position: relative; z-index: 1; }
        @keyframes cbb-spin { to { --btn-ang: 360deg; } }
        @media (prefers-reduced-motion: reduce) {
          .cbb::after { animation: none; }
          .cbb:hover { transform: none; }
        }
      \`}</style>
      <button
        type={type}
        className={\`cbb\${textured ? " cbb--textured" : ""} \${className}\`.trim()}
        style={
          {
            ["--cbb-0" as string]: c0,
            ["--cbb-1" as string]: c1,
            ["--cbb-2" as string]: c2,
            ["--cbb-dur" as string]: \`\${spinDuration}s\`,
          } as CSSProperties
        }
        {...rest}
      >
        <span className="cbb__label">{children}</span>
      </button>
    </>
  );
}`,
    description: "Uppercase pill button ringed by a spinning conic-gradient border over grain.",
    tags: ["conic-gradient", "spinning-border", "mask-composite", "noise-texture", "cta"],
  },
  {
    name: "PointerGlowCard",
    slug: "pointer-glow-card",
    path: "cards/PointerGlowCard.tsx",
    category: "cards",
    code: `"use client";

import {
  useCallback,
  useRef,
  type CSSProperties,
  type FocusEvent,
  type HTMLAttributes,
  type PointerEvent,
  type ReactNode,
} from "react";

/*
 * PointerGlowCard: a card lit by a spotlight that follows the pointer.
 *
 * Two layers share one radial gradient centred on the pointer: a 1px ring just
 * inside the border, and a soft wash across the surface beneath the content.
 * Both sit inside the padding box, because the card clips its overflow and a
 * ring laid over the border itself would be clipped away. The wash is the glow
 * colour at 14%, so text over it keeps its contrast.
 *
 * Keyboard focus lights the card the same way: when focus lands on something
 * inside it, the spotlight moves to that element; a focusable card lights
 * around its centre. Tracking is for fine pointers only, so a tap never leaves
 * a glow behind. Nothing moves on its own, and reduced motion drops the fade.
 */

const CSS = \`
.pgc{position:relative;isolation:isolate;border-radius:1.25rem;background:rgba(255,255,255,0.55);border:1px solid var(--bz-line-strong,rgba(10,10,10,0.13));overflow:hidden}
.pgc::before,.pgc::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity 300ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.pgc::before{z-index:2;padding:1px;background:radial-gradient(var(--pgc-r,220px) circle at var(--gx,50%) var(--gy,50%),var(--pgc-a),var(--pgc-b) 34%,transparent 62%);-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
.pgc::after{z-index:0;background:radial-gradient(var(--pgc-r,220px) circle at var(--gx,50%) var(--gy,50%),rgba(145,44,34,0.12),transparent 70%)}
@supports (color:color-mix(in srgb,red 50%,blue)){.pgc::after{background:radial-gradient(var(--pgc-r,220px) circle at var(--gx,50%) var(--gy,50%),color-mix(in srgb,var(--pgc-a) 14%,transparent),transparent 70%)}}
.pgc[data-lit]::before,.pgc[data-lit]::after,.pgc:focus-visible::before,.pgc:focus-visible::after{opacity:1}
.pgc:has(:focus-visible)::before,.pgc:has(:focus-visible)::after{opacity:1}
.pgc:focus-visible{outline:2px solid var(--bz-focus-ring,#912c22);outline-offset:2px}
.pgc__body{position:relative;z-index:1}
@media (prefers-reduced-motion:reduce){.pgc::before,.pgc::after{transition:none}}
\`;

type PointerGlowCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** The ring's colour under the pointer. The surface wash is this colour at 14%. */
  glowColor?: string;
  /** The ring's colour where it fades out. */
  glowSecondary?: string;
  /** Radius of the spotlight, in pixels. */
  radius?: number;
};

export function PointerGlowCard({
  children,
  className = "",
  glowColor = "rgba(145, 44, 34, 0.9)",
  glowSecondary = "rgba(145, 44, 34, 0.28)",
  radius = 220,
  style,
  onPointerMove,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  ...rest
}: PointerGlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const place = useCallback((x: number, y: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    el.style.setProperty("--gx", \`\${((x - r.left) / r.width) * 100}%\`);
    el.style.setProperty("--gy", \`\${((y - r.top) / r.height) * 100}%\`);
  }, []);

  const handleMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "touch") place(e.clientX, e.clientY);
    onPointerMove?.(e);
  };

  const handleEnter = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "touch") {
      place(e.clientX, e.clientY);
      ref.current?.setAttribute("data-lit", "");
    }
    onPointerEnter?.(e);
  };

  const handleLeave = (e: PointerEvent<HTMLDivElement>) => {
    ref.current?.removeAttribute("data-lit");
    onPointerLeave?.(e);
  };

  // Keyboard equivalent: the spotlight moves to whatever took focus, which is
  // the card's own centre when the card itself is focusable.
  const handleFocus = (e: FocusEvent<HTMLDivElement>) => {
    const r = (e.target as HTMLElement).getBoundingClientRect();
    place(r.left + r.width / 2, r.top + r.height / 2);
    onFocus?.(e);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        ref={ref}
        className={\`pgc \${className}\`.trim()}
        style={
          {
            ...style,
            "--gx": "50%",
            "--gy": "50%",
            "--pgc-a": glowColor,
            "--pgc-b": glowSecondary,
            "--pgc-r": \`\${radius}px\`,
          } as CSSProperties
        }
        onPointerMove={handleMove}
        onPointerEnter={handleEnter}
        onPointerLeave={handleLeave}
        onFocus={handleFocus}
        {...rest}
      >
        <div className="pgc__body">{children}</div>
      </div>
    </>
  );
}`,
    description: "Card whose border and surface light up under the pointer or keyboard focus.",
    tags: ["glow-border", "pointer", "mask-composite", "radial-gradient", "hover"],
  },
  {
    name: "ShinyGradientText",
    slug: "shiny-gradient-text",
    path: "display/ShinyGradientText.tsx",
    category: "display",
    code: `"use client";

import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

type ShinyGradientTextProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  colors?: string[];
  duration?: number;
};

export function ShinyGradientText({
  children,
  className = "",
  colors = ["#b8701c", "#f0c27a", "#4f7d10", "#b8701c", "#f0c27a"],
  duration = 4.5,
  style,
  ...rest
}: ShinyGradientTextProps) {
  const gradient = \`linear-gradient(110deg, \${colors.join(", ")})\`;
  return (
    <>
      <style>{\`
        .sgt {
          display: inline-block;
          background-size: 220% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent !important;
          animation: sgt-shine var(--sgt-dur, 4.5s) linear infinite;
        }
        @keyframes sgt-shine {
          to { background-position: 220% center; }
        }
        @media (prefers-reduced-motion: reduce) {
          .sgt {
            animation: none;
            background-position: 40% center;
          }
        }
      \`}</style>
      <span
        className={\`sgt \${className}\`.trim()}
        style={
          {
            ...style,
            backgroundImage: gradient,
            ["--sgt-dur" as string]: \`\${duration}s\`,
          } as CSSProperties
        }
        {...rest}
      >
        {children}
      </span>
    </>
  );
}`,
    description: "Inline text filled with a sliding gradient that holds still under reduced motion.",
    tags: ["shiny-text", "gradient", "background-clip", "kinetic", "typography"],
  },
  {
    name: "BlurInReveal",
    slug: "blur-in-reveal",
    path: "animation/BlurInReveal.tsx",
    category: "animation",
    code: `"use client";

import {
  useEffect,
  useRef,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from "react";

type BlurInRevealProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  as?: ElementType;
  delay?: 0 | 1 | 2 | 3 | 4;
};

export function BlurInReveal({
  children,
  className = "",
  as: Tag = "div",
  delay = 0,
  ...rest
}: BlurInRevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      el.classList.add("bir--in");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("bir--in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <style>{\`
        .bir {
          opacity: 0;
          transform: translateY(30px);
          filter: blur(7px);
          transition:
            opacity 0.95s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.95s cubic-bezier(0.22, 1, 0.36, 1),
            filter 0.95s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .bir--d1 { transition-delay: 0.09s; }
        .bir--d2 { transition-delay: 0.18s; }
        .bir--d3 { transition-delay: 0.27s; }
        .bir--d4 { transition-delay: 0.36s; }
        .bir--in {
          opacity: 1;
          transform: none;
          filter: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .bir {
            opacity: 1;
            transform: none;
            filter: none;
            transition: none;
          }
        }
      \`}</style>
      <Tag
        ref={ref as never}
        className={\`bir\${delay ? \` bir--d\${delay}\` : ""} \${className}\`.trim()}
        {...rest}
      >
        {children}
      </Tag>
    </>
  );
}`,
    description: "Scroll reveal that lifts content into place out of a 7px blur.",
    tags: ["scroll-reveal", "blur", "intersection-observer", "stagger", "entrance"],
  },
  {
    name: "SectionProgressRail",
    slug: "section-progress-rail",
    path: "navigation/SectionProgressRail.tsx",
    category: "navigation",
    code: `"use client";

type RailLink = {
  href: string;
  label: string;
};

type SectionProgressRailProps = {
  links: RailLink[];
  activeIndex: number;
  activeColor?: string;
  className?: string;
};

export function SectionProgressRail({
  links,
  activeIndex,
  activeColor = "#f0a03c",
  className = "",
}: SectionProgressRailProps) {
  return (
    <>
      <style>{\`
        .spr {
          position: fixed;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 44;
          display: none;
          flex-direction: column;
          gap: 12px;
        }
        @media (min-width: 1180px) {
          .spr { display: flex; }
        }
        .spr a {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(236, 230, 247, 0.26);
          transition: 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          position: relative;
        }
        /* 8px dot targets, so the outline sits further out to stay legible */
        .spr a:focus-visible {
          outline: 2px solid #fff;
          outline-offset: 4px;
        }
        .spr a.spr--on {
          background: var(--spr-active, #f0a03c);
          box-shadow: 0 0 0 5px color-mix(in srgb, var(--spr-active, #f0a03c) 18%, transparent);
          height: 22px;
          border-radius: 999px;
        }
        @media (prefers-reduced-motion: reduce) {
          .spr a { transition: none; }
        }
      \`}</style>
      <nav
        className={\`spr \${className}\`.trim()}
        aria-label="Section progress"
        style={{ ["--spr-active" as string]: activeColor }}
      >
        {links.map((link, i) => (
          <a
            key={link.href}
            href={link.href}
            className={i === activeIndex ? "spr--on" : undefined}
            aria-label={link.label}
            aria-current={i === activeIndex ? "true" : undefined}
          />
        ))}
      </nav>
    </>
  );
}`,
    description: "Fixed rail of section dots where the current dot stretches into a pill.",
    tags: ["progress-dots", "pill-morph", "section-nav", "fixed", "scroll-indicator"],
  },
  {
    name: "EdgeFadeMarquee",
    slug: "edge-fade-marquee",
    path: "animation/EdgeFadeMarquee.tsx",
    category: "animation",
    code: `"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type EdgeFadeMarqueeProps = {
  children: ReactNode;
  className?: string;
  trackClassName?: string;
  duration?: number;
  pauseOnHover?: boolean;
  fade?: boolean;
  fadeColor?: string;
  gap?: number;
};

export function EdgeFadeMarquee({
  children,
  className = "",
  trackClassName = "",
  duration = 40,
  pauseOnHover = true,
  fade = true,
  fadeColor = "rgba(238, 231, 251, 0.95)",
  gap = 16,
}: EdgeFadeMarqueeProps) {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduce(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <>
      <style>{\`
        .efm {
          overflow: hidden;
          position: relative;
        }
        .efm__fade {
          pointer-events: none;
          position: absolute;
          inset-block: 0;
          width: 48px;
          z-index: 2;
        }
        .efm__fade--l {
          left: 0;
          background: linear-gradient(90deg, var(--efm-fade), transparent);
        }
        .efm__fade--r {
          right: 0;
          background: linear-gradient(270deg, var(--efm-fade), transparent);
        }
        .efm__track {
          display: flex;
          width: max-content;
          animation: efm-marq var(--efm-dur, 40s) linear infinite;
        }
        .efm[data-pause="true"]:hover .efm__track {
          animation-play-state: paused;
        }
        .efm[data-static="true"] .efm__track {
          animation: none;
        }
        @keyframes efm-marq {
          to { transform: translate3d(-50%, 0, 0); }
        }
      \`}</style>
      <div
        className={\`efm \${className}\`.trim()}
        data-pause={pauseOnHover ? "true" : "false"}
        data-static={reduce ? "true" : undefined}
        style={{ ["--efm-fade" as string]: fadeColor } as CSSProperties}
      >
        {fade && !reduce && (
          <>
            <span className="efm__fade efm__fade--l" aria-hidden />
            <span className="efm__fade efm__fade--r" aria-hidden />
          </>
        )}
        <div
          className={\`efm__track \${trackClassName}\`.trim()}
          style={
            {
              gap,
              ["--efm-dur" as string]: \`\${duration}s\`,
              ...(reduce ? { animation: "none" } : null),
            } as CSSProperties
          }
        >
          {children}
          {!reduce && children}
        </div>
      </div>
    </>
  );
}`,
    description: "CSS marquee with faded edges that pauses on hover and stops for reduced motion.",
    tags: ["marquee", "ticker", "edge-fade", "infinite-loop", "pause-on-hover"],
  },
  {
    name: "ParallaxProductStage",
    slug: "parallax-product-stage",
    path: "sections/ParallaxProductStage.tsx",
    category: "sections",
    code: `"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef, useState, type ReactNode } from "react";

type StageItem = {
  id: string;
  label: string;
  /** Consumer-supplied media; use a gradient placeholder if omitted */
  media?: ReactNode;
  rotate?: number;
};

type ParallaxProductStageProps = {
  items: StageItem[]; // ideally 3
  note?: string;
  jobs?: string[];
  tagLabel?: string;
  tagValue?: string;
  tagMeta?: string;
  className?: string;
};

export function ParallaxProductStage({
  items,
  note = "Three jobs. One flat-price box.",
  jobs = ["Hard water", "Kitchen grease", "Everyday floors"],
  tagLabel = "Any 3 box",
  tagValue = "₹499",
  tagMeta = "save ₹398",
  className = "",
}: ParallaxProductStageProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduce(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useGSAP(
    () => {
      if (reduce || !rootRef.current) return;

      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      timeline
        .from(".pps__bottle", {
          y: 46,
          opacity: 0,
          rotate: (index: number) => items[index]?.rotate ?? [-7, 3, 8][index] ?? 0,
          duration: 0.85,
          stagger: 0.09,
        })
        .from(
          ".pps__path",
          { scaleX: 0, transformOrigin: "left center", duration: 0.7 },
          "-=0.55",
        );

      const stage = rootRef.current.querySelector<HTMLElement>(".pps__stage");
      const products = [
        ...(stage?.querySelectorAll<HTMLElement>(".pps__media") ?? []),
      ];
      if (
        !stage ||
        !products.length ||
        !window.matchMedia("(hover: hover) and (pointer: fine)").matches
      ) {
        return;
      }

      const xSetters = products.map((product) =>
        gsap.quickTo(product, "x", { duration: 0.45, ease: "power3.out" }),
      );
      const ySetters = products.map((product) =>
        gsap.quickTo(product, "y", { duration: 0.45, ease: "power3.out" }),
      );
      const depths = [9, 15, 7];
      const move = (event: PointerEvent) => {
        const rect = stage.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        products.forEach((_, index) => {
          const depth = depths[index] ?? 8;
          xSetters[index](x * depth);
          ySetters[index](y * depth * 0.55);
        });
      };
      const settle = () => {
        xSetters.forEach((set) => set(0));
        ySetters.forEach((set) => set(0));
      };
      stage.addEventListener("pointermove", move, { passive: true });
      stage.addEventListener("pointerleave", settle);
      return () => {
        stage.removeEventListener("pointermove", move);
        stage.removeEventListener("pointerleave", settle);
      };
    },
    { scope: rootRef, dependencies: [reduce, items] },
  );

  return (
    <>
      <style>{\`
        .pps {
          position: relative;
          min-height: 420px;
          border-radius: 1.5rem;
          overflow: hidden;
          background: linear-gradient(160deg, #0d4f43, #073b34 55%, #4b3a8f);
          color: #effaf4;
        }
        .pps__glow {
          position: absolute;
          inset: 8% 10% 28%;
          border: 1px solid rgba(239, 250, 244, 0.14);
          border-radius: 50%;
          pointer-events: none;
        }
        .pps__stage {
          position: relative;
          height: 100%;
          min-height: 420px;
          padding: 2rem 1.25rem 5rem;
        }
        .pps__note {
          position: absolute;
          top: 7%;
          right: 6%;
          max-width: 13ch;
          margin: 0;
          font-size: 1.15rem;
          font-style: italic;
          line-height: 1.2;
        }
        .pps__group {
          position: absolute;
          left: 12%;
          right: 12%;
          top: 16%;
          bottom: 28%;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          align-items: end;
          gap: 0.5rem;
        }
        .pps__bottle {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          height: 100%;
        }
        .pps__bottle:nth-child(1) { transform: rotate(-6deg); }
        .pps__bottle:nth-child(2) { z-index: 2; height: 108%; }
        .pps__bottle:nth-child(3) { transform: rotate(5deg); }
        .pps__media {
          width: 100%;
          aspect-ratio: 3 / 5;
          border-radius: 1rem 1rem 0.75rem 0.75rem;
          background: linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.06));
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow: 0 18px 40px rgba(0, 18, 16, 0.35);
          overflow: hidden;
        }
        .pps__media > * { width: 100%; height: 100%; object-fit: cover; display: block; }
        .pps__shelf {
          position: absolute;
          left: 10%;
          right: 10%;
          bottom: 18%;
          height: 18px;
          pointer-events: none;
        }
        .pps__shelf-plate {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: linear-gradient(180deg, #d8c4a0 0%, #b89563 48%, #8f6d3d 100%);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.35), 0 10px 18px rgba(0,18,16,0.28);
        }
        .pps__shelf-shadow {
          position: absolute;
          left: 4%;
          right: 4%;
          bottom: -16px;
          height: 22px;
          border-radius: 50%;
          background: rgba(0, 18, 16, 0.38);
          filter: blur(10px);
        }
        .pps__jobs {
          position: absolute;
          left: 11%;
          right: 11%;
          bottom: 8.5%;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .pps__jobs span {
          border-top: 1px solid rgba(239, 250, 244, 0.35);
          padding-top: 7px;
          font-size: 0.68rem;
          font-weight: 720;
          letter-spacing: 0.08em;
          text-align: center;
          opacity: 0.86;
        }
        .pps__path {
          position: absolute;
          left: 14%;
          right: 14%;
          bottom: 7.2%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #c9761d 12%, #c9761d 88%, transparent);
          transform-origin: left center;
        }
        .pps__path::after {
          content: "";
          position: absolute;
          right: 0;
          top: -5px;
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: #c9761d;
        }
        .pps__tag {
          position: absolute;
          left: 5%;
          bottom: 22%;
          display: grid;
          gap: 2px;
          min-width: 118px;
          padding: 10px 12px;
          border: 1px solid rgba(239, 250, 244, 0.22);
          border-radius: 14px;
          background: rgba(7, 59, 52, 0.55);
          backdrop-filter: blur(10px);
        }
        .pps__tag span {
          color: #c9761d;
          font-size: 0.68rem;
          font-weight: 780;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .pps__tag strong {
          font-size: 1.55rem;
          font-weight: 780;
          letter-spacing: -0.02em;
        }
        .pps__tag small { opacity: 0.7; font-size: 0.75rem; }
      \`}</style>
      <div ref={rootRef} className={\`pps \${className}\`.trim()}>
        <div className="pps__stage" aria-label="Product stage">
          <div className="pps__glow" aria-hidden />
          <p className="pps__note">{note}</p>
          <div className="pps__group">
            {items.slice(0, 3).map((item) => (
              <div className="pps__bottle" key={item.id}>
                <div className="pps__media" aria-label={item.label}>
                  {item.media ?? null}
                </div>
              </div>
            ))}
          </div>
          <div className="pps__shelf" aria-hidden>
            <span className="pps__shelf-plate" />
            <span className="pps__shelf-shadow" />
          </div>
          <div className="pps__jobs" aria-hidden>
            {jobs.slice(0, 3).map((job) => (
              <span key={job}>{job}</span>
            ))}
          </div>
          <div className="pps__path" aria-hidden />
          <div className="pps__tag">
            <span>{tagLabel}</span>
            <strong>{tagValue}</strong>
            {tagMeta ? <small>{tagMeta}</small> : null}
          </div>
        </div>
      </div>
    </>
  );
}`,
    description: "Lit product shelf where three items settle in and drift at different depths.",
    tags: ["gsap", "parallax", "product-theatre", "hero", "quickto", "entrance"],
  },
  {
    name: "StaggerBlurText",
    slug: "stagger-blur-text",
    path: "animation/StaggerBlurText.tsx",
    category: "animation",
    code: `"use client";

import { useEffect, useRef, type HTMLAttributes } from "react";

type StaggerBlurTextProps = HTMLAttributes<HTMLParagraphElement> & {
  text: string;
  /** ms before the cascade begins */
  startDelay?: number;
};

export function StaggerBlurText({
  text,
  className = "",
  startDelay = 280,
  ...rest
}: StaggerBlurTextProps) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      el.classList.add("sbt--on");
      return;
    }
    const t = window.setTimeout(() => el.classList.add("sbt--on"), startDelay);
    return () => window.clearTimeout(t);
  }, [startDelay]);

  const words = text.trim().split(/\\s+/);

  return (
    <>
      <style>{\`
        .sbt span {
          display: inline;
          opacity: 0;
          filter: blur(6px);
          transition: opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1), filter 0.55s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .sbt--on span { opacity: 1; filter: none; }
        .sbt--on span:nth-child(1) { transition-delay: 0.04s; }
        .sbt--on span:nth-child(2) { transition-delay: 0.1s; }
        .sbt--on span:nth-child(3) { transition-delay: 0.16s; }
        .sbt--on span:nth-child(4) { transition-delay: 0.22s; }
        .sbt--on span:nth-child(5) { transition-delay: 0.28s; }
        .sbt--on span:nth-child(6) { transition-delay: 0.34s; }
        .sbt--on span:nth-child(7) { transition-delay: 0.4s; }
        .sbt--on span:nth-child(8) { transition-delay: 0.46s; }
        .sbt--on span:nth-child(9) { transition-delay: 0.52s; }
        .sbt--on span:nth-child(10) { transition-delay: 0.58s; }
        .sbt--on span:nth-child(11) { transition-delay: 0.64s; }
        .sbt--on span:nth-child(12) { transition-delay: 0.7s; }
        .sbt--on span:nth-child(13) { transition-delay: 0.76s; }
        .sbt--on span:nth-child(14) { transition-delay: 0.82s; }
        .sbt--on span:nth-child(15) { transition-delay: 0.88s; }
        .sbt--on span:nth-child(16) { transition-delay: 0.94s; }
        .sbt--on span:nth-child(n + 17) { transition-delay: 1s; }
        @media (prefers-reduced-motion: reduce) {
          .sbt span {
            opacity: 1;
            filter: none;
            transition: none;
          }
        }
      \`}</style>
      <p ref={ref} className={\`sbt \${className}\`.trim()} {...rest}>
        {words.map((word, i) => (
          <span key={\`\${word}-\${i}\`}>
            {word}
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </p>
    </>
  );
}`,
    description: "Paragraph that resolves word by word out of a soft blur.",
    tags: ["text-generate", "stagger", "blur", "kinetic-type", "entrance"],
  },
  {
    name: "AnimatedGradientRule",
    slug: "animated-gradient-rule",
    path: "dividers/AnimatedGradientRule.tsx",
    category: "dividers",
    code: `"use client";

import type { CSSProperties } from "react";

type AnimatedGradientRuleProps = {
  className?: string;
  colors?: [string, string, string];
  duration?: number;
};

export function AnimatedGradientRule({
  className = "",
  colors = ["#f0a03c", "#6b55b8", "#5d8d1c"],
  duration = 8,
}: AnimatedGradientRuleProps) {
  const [a, b, c] = colors;
  return (
    <>
      <style>{\`
        .agr {
          height: 2px;
          width: 100%;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            transparent,
            var(--agr-a) 18%,
            var(--agr-b) 50%,
            var(--agr-c) 82%,
            transparent
          );
          background-size: 200% 100%;
          animation: agr-slide var(--agr-dur, 8s) linear infinite;
        }
        @keyframes agr-slide {
          to { background-position: -200% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .agr { animation: none; background-position: 0 0; }
        }
      \`}</style>
      <div
        className={\`agr \${className}\`.trim()}
        role="separator"
        style={
          {
            ["--agr-a" as string]: a,
            ["--agr-b" as string]: b,
            ["--agr-c" as string]: c,
            ["--agr-dur" as string]: \`\${duration}s\`,
          } as CSSProperties
        }
      />
    </>
  );
}`,
    description: "Two-pixel divider with a slow three-colour gradient sliding along it.",
    tags: ["gradient", "divider", "marquee-line", "accent", "separator"],
  },
  {
    name: "JewelryCursor",
    slug: "jewelry-cursor",
    path: "interaction/JewelryCursor.tsx",
    category: "interaction",
    code: `"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

type JewelryCursorProps = {
  /** CSS selector for the scope that hides the native cursor once ready */
  scopeSelector?: string;
  /** Dot + ring color */
  color?: string;
  /** Extra selectors (beyond a/button/[data-cursor-hover]) that expand the ring */
  hoverSelector?: string;
};

/**
 * Instant gold-dot cursor + lagged ring that expands over interactive targets.
 * Mounts only on fine-pointer devices with motion enabled.
 */
export function JewelryCursor({
  scopeSelector = "body",
  color = "#c9a227",
  hoverSelector = "a, button, [data-cursor-hover]",
}: JewelryCursorProps) {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const scope = document.querySelector(scopeSelector);
    if (!dot || !ring || !scope) return;

    scope.classList.add("jewelry-cursor-ready");
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, opacity: 1 });

    const xRing = gsap.quickTo(ring, "x", { duration: 0.12, ease: "power2.out" });
    const yRing = gsap.quickTo(ring, "y", { duration: 0.12, ease: "power2.out" });
    const xDot = gsap.quickSetter(dot, "x", "px");
    const yDot = gsap.quickSetter(dot, "y", "px");

    const move = (e: MouseEvent) => {
      xDot(e.clientX);
      yDot(e.clientY);
      xRing(e.clientX);
      yRing(e.clientY);
    };
    const enter = () =>
      gsap.to(ring, { scale: 1.9, opacity: 1, duration: 0.3, ease: "power2.out" });
    const leave = () =>
      gsap.to(ring, { scale: 1, opacity: 0.6, duration: 0.3, ease: "power2.out" });

    window.addEventListener("mousemove", move);
    const targets = Array.from(scope.querySelectorAll(hoverSelector));
    targets.forEach((t) => {
      t.addEventListener("mouseenter", enter);
      t.addEventListener("mouseleave", leave);
    });

    return () => {
      scope.classList.remove("jewelry-cursor-ready");
      window.removeEventListener("mousemove", move);
      targets.forEach((t) => {
        t.removeEventListener("mouseenter", enter);
        t.removeEventListener("mouseleave", leave);
      });
    };
  }, [scopeSelector, hoverSelector]);

  return (
    <>
      <style>{\`
        .jewelry-cursor-ready, .jewelry-cursor-ready * { cursor: none !important; }
        @media (prefers-reduced-motion: reduce) {
          .jewelry-cursor-ready, .jewelry-cursor-ready * { cursor: auto !important; }
        }
      \`}</style>
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[10000] h-[3px] w-[3px] rounded-full opacity-0"
        style={{ background: color }}
      />
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[10000] h-6 w-6 rounded-full opacity-0"
        style={{ border: \`1.5px solid \${color}\` }}
      />
    </>
  );
}`,
    description: "Gold dot cursor with a lagging ring that swells over links and buttons.",
    tags: ["custom-cursor", "gsap", "magnetic-hover", "gold", "pointer"],
  },
  {
    name: "ScrollUnfurlPreloader",
    slug: "scroll-unfurl-preloader",
    path: "loaders/ScrollUnfurlPreloader.tsx",
    category: "loaders",
    code: `"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";

type ScrollUnfurlPreloaderProps = {
  brand?: string;
  /** Fires when the overlay finishes and should hand off to the page */
  onComplete?: () => void;
  /** Play once per tab session (sessionStorage key) */
  onceKey?: string | null;
  durationMs?: number;
};

const useIsoLayout = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function LotusMark({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 44" fill="none" className={className} style={style} aria-hidden>
      <g stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none">
        <path d="M32 8 C28 18 28 28 32 36 C36 28 36 18 32 8 Z" fill="currentColor" fillOpacity="0.14" />
        <path d="M32 36 C24 30 20 22 20 14 C26 18 30 26 32 36 Z" fill="currentColor" fillOpacity="0.08" />
        <path d="M32 36 C40 30 44 22 44 14 C38 18 34 26 32 36 Z" fill="currentColor" fillOpacity="0.08" />
        <path d="M32 36 C20 36 12 30 8 22 C18 24 26 30 32 36 Z" />
        <path d="M32 36 C44 36 52 30 56 22 C46 24 38 30 32 36 Z" />
        <path d="M14 38 H50" opacity="0.6" />
      </g>
    </svg>
  );
}

function FiligreeDivider({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 24" fill="none" className={className} style={style} aria-hidden>
      <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none">
        <line x1="6" y1="12" x2="74" y2="12" />
        <line x1="126" y1="12" x2="194" y2="12" />
        <circle cx="80" cy="12" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="120" cy="12" r="1.6" fill="currentColor" stroke="none" />
        <path d="M100 3 L108 12 L100 21 L92 12 Z" fill="currentColor" fillOpacity="0.12" />
        <path d="M100 6.5 L104.5 12 L100 17.5 L95.5 12 Z" />
      </g>
    </svg>
  );
}

function BrassRod() {
  return (
    <div className="relative h-full w-full">
      <div
        className="absolute left-0 right-0"
        style={{
          top: 10,
          bottom: 10,
          borderRadius: 999,
          background:
            "linear-gradient(90deg, #5e4310 0%, #9c7720 26%, #e8d5a3 50%, #9c7720 74%, #4d370c 100%)",
          boxShadow: "0 0 14px rgba(201,162,39,0.4)",
        }}
      />
      {[true, false].map((isTop) => (
        <div
          key={isTop ? "t" : "b"}
          className="absolute left-1/2"
          style={{
            [isTop ? "top" : "bottom"]: -2,
            transform: "translateX(-50%)",
            width: 16,
            height: 16,
            borderRadius: "50% 50% 45% 45% / 55% 55% 45% 45%",
            background: "radial-gradient(circle at 36% 30%, #e8d5a3, #c9a227 52%, #5e4310 100%)",
            boxShadow: "0 0 12px rgba(201,162,39,0.45)",
          }}
        />
      ))}
    </div>
  );
}

/**
 * Full-screen parchment scroll preloader: brass rods travel outward while
 * clip-path unfurls the parchment from the centre, then content staggers in
 * and the stage lifts/blurs away.
 */
export function ScrollUnfurlPreloader({
  brand = "YASH",
  onComplete,
  onceKey = "scroll-unfurl-seen",
  durationMs = 2200,
}: ScrollUnfurlPreloaderProps) {
  const [visible, setVisible] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const parchmentRef = useRef<HTMLDivElement>(null);
  const leftRodRef = useRef<HTMLDivElement>(null);
  const rightRodRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useIsoLayout(() => {
    if (!onceKey) return;
    try {
      if (window.sessionStorage.getItem(onceKey)) setVisible(false);
      else window.sessionStorage.setItem(onceKey, "1");
    } catch {
      /* private mode — always play */
    }
  }, [onceKey]);

  useEffect(() => {
    if (!visible) return;
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      document.body.style.overflow = prevOverflow;
      onComplete?.();
      setVisible(false);
    };

    const safety = window.setTimeout(finish, durationMs + 1500);
    const mm = gsap.matchMedia();

    mm.add(
      {
        full: "(prefers-reduced-motion: no-preference)",
        reduced: "(prefers-reduced-motion: reduce)",
      },
      (ctx) => {
        const { reduced } = ctx.conditions as { reduced: boolean };
        const travel = stage.offsetWidth / 2;
        const reveals = contentRef.current ? Array.from(contentRef.current.children) : [];

        if (reduced) {
          gsap.set(parchmentRef.current, { "--reveal": "0%" });
          gsap.set(leftRodRef.current, { x: -travel });
          gsap.set(rightRodRef.current, { x: travel });
          gsap.set([glowRef.current, ...reveals], { autoAlpha: 1 });
          gsap.to(root, { autoAlpha: 0, duration: 0.5, delay: 0.7, onComplete: finish });
          return;
        }

        const tl = gsap.timeline({ defaults: { ease: "power3.out" }, onComplete: finish });
        tl.from(root, { autoAlpha: 0, duration: 0.3 })
          .to(glowRef.current, { autoAlpha: 1, duration: 0.55 }, 0)
          .to(parchmentRef.current, { "--reveal": "0%", duration: 0.86, ease: "expo.out" }, 0.26)
          .to(leftRodRef.current, { x: -travel, duration: 0.86, ease: "expo.out" }, 0.26)
          .to(rightRodRef.current, { x: travel, duration: 0.86, ease: "expo.out" }, 0.26)
          .to(reveals, { autoAlpha: 1, y: 0, duration: 0.53, stagger: 0.1, ease: "power2.out" }, 0.86)
          .to(
            stageRef.current,
            { y: -26, scale: 1.03, autoAlpha: 0, filter: "blur(7px)", duration: 0.53, ease: "power3.in" },
            1.65,
          )
          .to(root, { autoAlpha: 0, duration: 0.41, ease: "power2.in" }, 1.76);
      },
    );

    return () => {
      window.clearTimeout(safety);
      mm.revert();
      document.body.style.overflow = prevOverflow;
    };
  }, [visible, onComplete, durationMs]);

  if (!visible) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      aria-hidden
      style={{
        background: "radial-gradient(ellipse at 50% 45%, #1a1310 0%, #0d0a09 62%)",
        color: "#f5f0e8",
      }}
    >
      <style>{\`
        @keyframes unfurl-dust {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.2; }
          50% { transform: translateY(-14px) translateX(6px); opacity: 0.7; }
        }
        @keyframes unfurl-glow-pulse {
          0%, 100% { opacity: 0.32; transform: scale(0.96); }
          50% { opacity: 0.55; transform: scale(1.04); }
        }
        @media (prefers-reduced-motion: reduce) {
          .unfurl-dust, .unfurl-glow { animation: none !important; }
        }
      \`}</style>

      <div
        ref={glowRef}
        className="unfurl-glow pointer-events-none absolute left-1/2 top-1/2"
        style={{
          opacity: 0,
          width: "min(120vw, 1100px)",
          height: "min(120vw, 1100px)",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(201,162,39,0.18) 0%, rgba(201,162,39,0.05) 32%, transparent 62%)",
          animation: "unfurl-glow-pulse 4s ease-in-out infinite",
        }}
      />

      {[
        { left: "8%", top: "16%", size: 4, delay: 0, dur: 7 },
        { left: "44%", top: "30%", size: 5, delay: 0.7, dur: 8 },
        { left: "78%", top: "22%", size: 4, delay: 1.1, dur: 7.5 },
        { left: "90%", top: "54%", size: 3, delay: 0.4, dur: 8.5 },
      ].map((s, i) => (
        <span
          key={i}
          className="unfurl-dust pointer-events-none absolute rounded-full"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            background: "#c9a227",
            opacity: 0.4,
            animation: \`unfurl-dust \${s.dur}s ease-in-out \${s.delay}s infinite\`,
          }}
        />
      ))}

      <div
        ref={stageRef}
        className="relative"
        style={{
          width: "min(90vw, 640px)",
          height: "clamp(300px, 50vh, 440px)",
          willChange: "transform, filter, opacity",
        }}
      >
        <div
          ref={parchmentRef}
          className="absolute inset-0 flex items-center justify-center"
          style={
            {
              ["--reveal" as string]: "50%",
              clipPath: "inset(0 var(--reveal) 0 var(--reveal) round 7px)",
              background: "linear-gradient(177deg, #faf6ee 0%, #f5f0e8 46%, #e9dfcc 100%)",
              boxShadow:
                "inset 0 0 70px rgba(120,86,30,0.16), inset 22px 0 26px -20px rgba(70,44,12,0.5), inset -22px 0 26px -20px rgba(70,44,12,0.5), 0 30px 70px rgba(0,0,0,0.55)",
            } as React.CSSProperties
          }
        >
          <div
            className="pointer-events-none absolute"
            style={{
              inset: "clamp(16px, 3.2vw, 30px)",
              border: "1px solid color-mix(in oklab, #c9a227 48%, transparent)",
              borderRadius: 3,
            }}
          />
          <div
            ref={contentRef}
            className="relative flex flex-col items-center justify-center gap-4 px-8 text-center"
            style={{ color: "#c9a227" }}
          >
            <LotusMark style={{ opacity: 0, transform: "translateY(14px)" }} className="h-9 w-auto" />
            <span
              style={{
                opacity: 0,
                transform: "translateY(14px)",
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "clamp(2.6rem, 8.5vw, 4.75rem)",
                lineHeight: 1,
                letterSpacing: "0.015em",
                color: "#e8d5a3",
                textShadow:
                  "0 1px 0 #6f5316, 0 2px 1px rgba(60,38,8,0.55), 0 0 22px rgba(201,162,39,0.28)",
              }}
            >
              {brand}
            </span>
            <FiligreeDivider
              style={{ opacity: 0, transform: "translateY(14px)" }}
              className="h-5 w-[min(60%,240px)]"
            />
          </div>
        </div>

        <div
          ref={leftRodRef}
          className="absolute top-[-4%] h-[108%]"
          style={{ left: "50%", marginLeft: -5, width: 10 }}
        >
          <BrassRod />
        </div>
        <div
          ref={rightRodRef}
          className="absolute top-[-4%] h-[108%]"
          style={{ left: "50%", marginLeft: -5, width: 10 }}
        >
          <BrassRod />
        </div>
      </div>
    </div>
  );
}`,
    description: "Parchment preloader where brass rods roll apart to unfurl the brand, then lift away.",
    tags: ["preloader", "clip-path", "gsap", "parchment", "scroll-unfurl"],
  },
  {
    name: "CanvasPetalField",
    slug: "canvas-petal-field",
    path: "animation/CanvasPetalField.tsx",
    category: "animation",
    code: `"use client";

import { useEffect, useRef } from "react";

type CanvasPetalFieldProps = {
  count?: number;
  className?: string;
  /** Restrict drawing to bottom fraction of the canvas (0–1). Default 1 = full. */
  heightFraction?: number;
};

type Petal = {
  x: number;
  y: number;
  r: number;
  rot: number;
  vr: number;
  speed: number;
  sway: number;
  swaySpeed: number;
  alpha: number;
  kind: 0 | 1;
};

/**
 * Ambient marigold / jasmine petals drawn as canvas shapes with a faint
 * mouse "gust" that nudges them sideways. No image assets.
 */
export function CanvasPetalField({
  count = 16,
  className = "pointer-events-none absolute inset-0 z-30 h-full w-full",
  heightFraction = 1,
}: CanvasPetalFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width;
      H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const petals: Petal[] = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H - H,
      r: 6 + Math.random() * 9,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.02,
      speed: 0.25 + Math.random() * 0.5,
      sway: Math.random() * 26,
      swaySpeed: 0.01 + Math.random() * 0.02,
      alpha: 0.12 + Math.random() * 0.22,
      kind: Math.random() > 0.5 ? 0 : 1,
    }));

    let gust = 0;
    const onMove = (e: MouseEvent) => {
      gust = (e.clientX / window.innerWidth - 0.5) * 0.8;
    };
    window.addEventListener("mousemove", onMove);

    const drawMarigold = (r: number) => {
      ctx.fillStyle = "#d98c1f";
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45, r * 0.4, r * 0.26, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#b8731a";
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    };
    const drawJasmine = (r: number) => {
      ctx.fillStyle = "#f3ead9";
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4, r * 0.34, r * 0.22, a, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    let t = 0;
    let raf = 0;
    const loop = () => {
      ctx.clearRect(0, 0, W, H);
      t++;
      const y0 = H * (1 - heightFraction);
      for (const p of petals) {
        p.y += p.speed;
        p.x += Math.sin(t * p.swaySpeed) * 0.3 + gust;
        p.rot += p.vr;
        if (p.y > H + 30) {
          p.y = y0 - 30;
          p.x = Math.random() * W;
        }
        if (p.y < y0 - 40) continue;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        if (p.kind === 0) drawMarigold(p.r);
        else drawJasmine(p.r);
        ctx.restore();
      }
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, [count, heightFraction]);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}`,
    description: "Canvas of marigold and jasmine petals drifting down, nudged by the cursor.",
    tags: ["canvas", "particles", "petals", "ambient", "mouse-gust"],
  },
  {
    name: "FilmGrainOverlay",
    slug: "film-grain-overlay",
    path: "overlays/FilmGrainOverlay.tsx",
    category: "overlays",
    code: `"use client";

import { useEffect, useRef } from "react";

type FilmGrainOverlayProps = {
  /** Opacity of the stretched grain layer (visual intensity) */
  opacity?: number;
  /** Logical canvas resolution before CSS stretch */
  resolution?: number;
  className?: string;
};

/**
 * Fixed low-res canvas film grain (~20fps via frame%3) with overlay blend
 * so dark surfaces never read as flat digital black.
 */
export function FilmGrainOverlay({
  opacity = 0.05,
  resolution = 220,
  className = "pointer-events-none fixed inset-0 z-[9999] h-full w-full mix-blend-overlay",
}: FilmGrainOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = resolution;
    const H = resolution;
    canvas.width = W;
    canvas.height = H;

    let raf = 0;
    let frame = 0;
    const draw = () => {
      frame++;
      if (frame % 3 === 0) {
        const img = ctx.createImageData(W, H);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          const v = (Math.random() * 255) | 0;
          d[i] = v;
          d[i + 1] = v;
          d[i + 2] = v;
          d[i + 3] = 11;
        }
        ctx.putImageData(img, 0, 0);
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [resolution]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
      style={{ opacity }}
    />
  );
}`,
    description: "Faint animated film grain drawn on a low-resolution canvas and blended over surfaces.",
    tags: ["film-grain", "canvas", "noise", "overlay-blend", "atmosphere"],
  },
  {
    name: "ScratchFoilReveal",
    slug: "scratch-foil-reveal",
    path: "interaction/ScratchFoilReveal.tsx",
    category: "interaction",
    code: `"use client";

import { useEffect, useRef } from "react";

type ScratchFoilRevealProps = {
  children: React.ReactNode;
  foil?: string;
  foilSoft?: string;
  ink?: string;
  label?: string;
  /** Fraction of coverage grid that must clear before auto-dissolve (0–1) */
  threshold?: number;
  className?: string;
  style?: React.CSSProperties;
  onReveal?: () => void;
};

/**
 * Scratch through painted gold foil to reveal children. Progress uses a
 * logical coverage grid (no getImageData thrash). ~threshold auto-dissolves.
 */
export function ScratchFoilReveal({
  children,
  foil = "#c9a227",
  foilSoft = "#e8d5a3",
  ink = "#5a3a12",
  label = "Scratch to reveal",
  threshold = 0.55,
  className,
  style,
  onReveal,
}: ScratchFoilRevealProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hintRef = useRef<HTMLSpanElement>(null);
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const reveal = () => {
      canvas.style.opacity = "0";
      canvas.style.pointerEvents = "none";
      if (hintRef.current) hintRef.current.style.opacity = "0";
      onRevealRef.current?.();
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = reduce ? null : canvas.getContext("2d");
    if (reduce || !ctx) {
      reveal();
      return;
    }

    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, isCoarsePointer ? 1.25 : 2);

    const paintFoil = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.globalCompositeOperation = "source-over";
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, foil);
      grad.addColorStop(0.5, foilSoft);
      grad.addColorStop(1, foil);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < (w * h) / 2400; i++) {
        ctx.fillStyle = \`rgba(255,255,255,\${Math.random() * 0.12})\`;
        ctx.fillRect(Math.random() * w, Math.random() * h, dpr, dpr);
      }
      ctx.fillStyle = ink;
      ctx.font = \`\${12 * dpr}px ui-sans-serif, system-ui, sans-serif\`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = 0.7;
      ctx.fillText(label.toUpperCase(), w / 2, h / 2);
      ctx.globalAlpha = 1;
    };

    const GRID_COLS = 22;
    const GRID_ROWS = 28;
    let grid = new Uint8Array(GRID_COLS * GRID_ROWS);
    let clearedCells = 0;
    let cellW = 1;
    let cellH = 1;

    const fit = () => {
      const r = wrap.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      canvas.style.width = \`\${r.width}px\`;
      canvas.style.height = \`\${r.height}px\`;
      paintFoil();
      grid = new Uint8Array(GRID_COLS * GRID_ROWS);
      clearedCells = 0;
      cellW = canvas.width / GRID_COLS;
      cellH = canvas.height / GRID_ROWS;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);

    let drawing = false;
    const SCRATCH_RADIUS_UNSCALED = 26;

    const localPoint = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr };
    };
    const scratch = (x: number, y: number) => {
      const radius = SCRATCH_RADIUS_UNSCALED * dpr;
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      const minCol = Math.max(0, Math.floor((x - radius) / cellW));
      const maxCol = Math.min(GRID_COLS - 1, Math.floor((x + radius) / cellW));
      const minRow = Math.max(0, Math.floor((y - radius) / cellH));
      const maxRow = Math.min(GRID_ROWS - 1, Math.floor((y + radius) / cellH));
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          const idx = row * GRID_COLS + col;
          if (grid[idx]) continue;
          const dx = (col + 0.5) * cellW - x;
          const dy = (row + 0.5) * cellH - y;
          if (dx * dx + dy * dy <= radius * radius) {
            grid[idx] = 1;
            clearedCells++;
          }
        }
      }
    };
    const clearedFraction = () => clearedCells / (GRID_COLS * GRID_ROWS);

    const onDown = (e: PointerEvent) => {
      drawing = true;
      if (hintRef.current) hintRef.current.style.opacity = "0";
      canvas.setPointerCapture(e.pointerId);
      const p = localPoint(e);
      scratch(p.x, p.y);
    };
    const onMove = (e: PointerEvent) => {
      if (!drawing) return;
      const coalesced = e.getCoalescedEvents?.();
      const points = coalesced && coalesced.length > 0 ? coalesced : [e];
      for (const pe of points) {
        const p = localPoint(pe);
        scratch(p.x, p.y);
      }
      if (clearedFraction() > threshold) reveal();
    };
    const onUp = () => {
      drawing = false;
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [foil, foilSoft, ink, label, threshold]);

  return (
    <div ref={wrapRef} className={\`relative \${className ?? ""}\`} style={style}>
      {children}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 h-full w-full cursor-grab touch-none opacity-100 transition-opacity duration-700"
      />
      <span
        ref={hintRef}
        className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 animate-pulse text-[0.6rem] uppercase tracking-[0.3em] text-white/80 mix-blend-difference transition-opacity duration-300"
      >
        Scratch
      </span>
    </div>
  );
}`,
    description: "Gold foil you scratch away with the pointer, clearing itself past a threshold.",
    tags: ["scratch-off", "canvas", "foil", "pointer", "reveal"],
  },
  {
    name: "PixelDemorphImage",
    slug: "pixel-demorph-image",
    path: "media/PixelDemorphImage.tsx",
    category: "media",
    code: `"use client";

import { useEffect, useRef } from "react";

type PixelDemorphImageProps = {
  src: string;
  alt?: string;
  className?: string;
  durationMs?: number;
  /** Starting coarse block count across width */
  startBlocks?: number;
};

/**
 * Scroll-into-view pixel demorph: coarse nearest-neighbour blocks resolve
 * into a sharp photo via offscreen downsample (no getImageData / CORS thrash).
 */
export function PixelDemorphImage({
  src,
  alt = "",
  className,
  durationMs = 1100,
  startBlocks = 6,
}: PixelDemorphImageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const off = document.createElement("canvas");
    const offCtx = off.getContext("2d");
    if (!offCtx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    let loaded = false;
    let raf = 0;
    let ioRef: IntersectionObserver | null = null;

    const fit = () => {
      const r = wrap.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      canvas.style.width = \`\${r.width}px\`;
      canvas.style.height = \`\${r.height}px\`;
    };

    const drawCover = (target: CanvasRenderingContext2D, tw: number, th: number) => {
      const ir = img.width / img.height;
      const cr = tw / th;
      let dw = tw;
      let dh = th;
      let dx = 0;
      let dy = 0;
      if (ir > cr) {
        dh = th;
        dw = th * ir;
        dx = (tw - dw) / 2;
      } else {
        dw = tw;
        dh = tw / ir;
        dy = (th - dh) / 2;
      }
      target.drawImage(img, dx, dy, dw, dh);
    };

    const renderBlocks = (blocks: number) => {
      const w = canvas.width;
      const h = canvas.height;
      if (blocks >= w) {
        ctx.imageSmoothingEnabled = true;
        ctx.clearRect(0, 0, w, h);
        drawCover(ctx, w, h);
        return;
      }
      const cols = Math.max(2, Math.round(blocks));
      const rows = Math.max(2, Math.round(cols * (h / w)));
      off.width = cols;
      off.height = rows;
      offCtx.imageSmoothingEnabled = true;
      offCtx.clearRect(0, 0, cols, rows);
      drawCover(offCtx, cols, rows);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(off, 0, 0, cols, rows, 0, 0, w, h);
    };

    const animate = () => {
      fit();
      if (reduce) {
        renderBlocks(canvas.width);
        return;
      }
      const start = performance.now();
      const minBlocks = startBlocks;
      const maxBlocks = canvas.width;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        const eased = 1 - Math.pow(1 - t, 3);
        const blocks = Math.round(minBlocks + (maxBlocks - minBlocks) * eased);
        renderBlocks(blocks);
        if (t < 1) raf = requestAnimationFrame(tick);
        else renderBlocks(maxBlocks);
      };
      raf = requestAnimationFrame(tick);
    };

    img.onload = () => {
      loaded = true;
      fit();
      renderBlocks(startBlocks);
      ioRef = new IntersectionObserver(
        (entries, obs) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              animate();
              obs.disconnect();
            }
          }
        },
        { threshold: 0.25 },
      );
      ioRef.observe(wrap);
    };
    img.src = src;

    const onResize = () => {
      if (loaded) renderBlocks(canvas.width);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      ioRef?.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [src, durationMs, startBlocks]);

  return (
    <div ref={wrapRef} className={\`relative overflow-hidden \${className ?? ""}\`}>
      <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />
    </div>
  );
}`,
    description: "Image that resolves from coarse pixel blocks to sharp as it scrolls into view.",
    tags: ["pixelate", "demorph", "canvas", "scroll-reveal", "image"],
  },
  {
    name: "ScrollParallaxLayer",
    slug: "scroll-parallax-layer",
    path: "animation/ScrollParallaxLayer.tsx",
    category: "animation",
    code: `"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type ScrollParallaxLayerProps = {
  /** Depth of travel; 1 ≈ 100px total drift across the viewport */
  speed?: number;
  /** Total degrees swept across the viewport */
  rotate?: number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

type FallingPetalFieldProps = {
  colors: string[];
  count?: number;
  className?: string;
};

/** Scroll-scrubbed depth / rotate parallax wrapper (GSAP ScrollTrigger). */
export function ScrollParallaxLayer({
  speed = 0.25,
  rotate = 0,
  className,
  style,
  children,
}: ScrollParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const depth = speed * 100;
      const tween = gsap.fromTo(
        el,
        { y: depth, rotation: -rotate / 2 },
        {
          y: -depth,
          rotation: rotate / 2,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
          },
        },
      );
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });

    return () => mm.revert();
  }, [speed, rotate]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}

function PetalShape({ variant, color }: { variant: number; color: string }) {
  const paths = [
    "M12 2 C17 6 19 12 16 18 C14 21 10 21 8 18 C5 12 7 6 12 2 Z",
    "M12 3 C18 5 20 12 15 19 Q12 22 9 19 C4 12 6 5 12 3 Z",
    "M12 1 C15 7 18 10 16 17 C14 22 9 22 8 16 C7 9 9 6 12 1 Z",
  ];
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
      <path d={paths[variant % paths.length]} fill={color} />
    </svg>
  );
}

const PETALS = [
  { left: 6, size: 13, delay: 0.0, dur: 11, drift: 46, spin: 300, o: 0.8 },
  { left: 14, size: 9, delay: 3.2, dur: 14, drift: -34, spin: -260, o: 0.55 },
  { left: 24, size: 12, delay: 6.4, dur: 12, drift: 42, spin: 340, o: 0.7 },
  { left: 34, size: 8, delay: 1.6, dur: 15, drift: -28, spin: 220, o: 0.5 },
  { left: 45, size: 14, delay: 4.8, dur: 10.5, drift: 36, spin: -300, o: 0.85 },
  { left: 55, size: 9, delay: 8.2, dur: 13.5, drift: -44, spin: 280, o: 0.55 },
  { left: 64, size: 12, delay: 2.4, dur: 11.5, drift: 30, spin: -240, o: 0.75 },
  { left: 74, size: 8, delay: 5.6, dur: 14.5, drift: -38, spin: 320, o: 0.5 },
  { left: 84, size: 13, delay: 0.8, dur: 12.5, drift: 40, spin: -280, o: 0.8 },
  { left: 92, size: 10, delay: 7.0, dur: 13, drift: -30, spin: 260, o: 0.6 },
];

/**
 * Deterministic CSS falling petal field (no Math.random → no hydration drift).
 * Ships with ScrollParallaxLayer as the ambient companion.
 */
export function FallingPetalField({
  colors,
  count = 10,
  className = "inset-x-0 top-0 h-[110vh]",
}: FallingPetalFieldProps) {
  return (
    <div className={\`pointer-events-none absolute select-none overflow-hidden \${className}\`} aria-hidden>
      <style>{\`
        @keyframes petal-fall {
          0% { transform: translate3d(0, 0, 0) rotate(0deg); opacity: 0; }
          6% { opacity: var(--petal-o, 0.7); }
          85% { opacity: var(--petal-o, 0.7); }
          100% {
            transform: translate3d(var(--petal-drift, 40px), 112vh, 0)
              rotate(var(--petal-spin, 300deg));
            opacity: 0;
          }
        }
        .fall-petal {
          animation-name: petal-fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform, opacity;
        }
        @media (prefers-reduced-motion: reduce) {
          .fall-petal { animation: none !important; opacity: 0 !important; }
        }
      \`}</style>
      {PETALS.slice(0, count).map((p, i) => (
        <span
          key={i}
          className="fall-petal absolute"
          style={
            {
              left: \`\${p.left}%\`,
              top: -24,
              width: p.size,
              height: p.size,
              "--petal-drift": \`\${p.drift}px\`,
              "--petal-spin": \`\${p.spin}deg\`,
              "--petal-o": p.o,
              animationDuration: \`\${p.dur}s\`,
              animationDelay: \`\${p.delay}s\`,
            } as React.CSSProperties
          }
        >
          <PetalShape variant={i} color={colors[i % colors.length]} />
        </span>
      ))}
    </div>
  );
}`,
    description: "Scroll-scrubbed parallax wrapper that drifts and rotates children, with a petal field.",
    tags: ["parallax", "scrolltrigger", "petals", "gsap", "ambient"],
  },
  {
    name: "TillReceiptPrint",
    slug: "till-receipt-print",
    path: "feedback/TillReceiptPrint.tsx",
    category: "feedback",
    code: `"use client";

import { useEffect, useState } from "react";

type ReceiptRow = {
  label: string;
  value: string;
  mono?: boolean;
};

type TillReceiptPrintProps = {
  brand?: string;
  eyebrow?: string;
  amountLabel?: string;
  amount: string;
  currency?: string;
  rows: ReceiptRow[];
  stamp?: string;
  footer?: string;
  /** Called when the continue control is pressed */
  onContinue?: () => void;
  continueLabel?: string;
  className?: string;
};

/**
 * Till-style receipt: clip-path prints out of a slot, line items stagger in,
 * PAID stamp thumps with a noise mask. Pure CSS choreography + one printed flag.
 */
export function TillReceiptPrint({
  brand = "YASH",
  eyebrow = "Payment receipt",
  amountLabel = "Amount paid",
  amount,
  currency = "INR",
  rows,
  stamp = "Paid",
  footer = "Thank you for celebrating with us.",
  onContinue,
  continueLabel = "Continue",
  className,
}: TillReceiptPrintProps) {
  const [printed, setPrinted] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setPrinted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      className={\`flex w-full max-w-sm flex-col items-center \${className ?? ""}\`}
      role="dialog"
      aria-label={eyebrow}
    >
      <style>{\`
        .till-receipt {
          clip-path: inset(0 0 100% 0);
          transition: clip-path 1.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .till-receipt--printed {
          clip-path: inset(0 0 -8% 0);
        }
        .till-perf {
          height: 10px;
          background: oklch(0.99 0.004 85);
        }
        .till-perf--top {
          clip-path: polygon(0 100%, 0 40%, 2.5% 0, 5% 40%, 7.5% 0, 10% 40%, 12.5% 0, 15% 40%, 17.5% 0, 20% 40%, 22.5% 0, 25% 40%, 27.5% 0, 30% 40%, 32.5% 0, 35% 40%, 37.5% 0, 40% 40%, 42.5% 0, 45% 40%, 47.5% 0, 50% 40%, 52.5% 0, 55% 40%, 57.5% 0, 60% 40%, 62.5% 0, 65% 40%, 67.5% 0, 70% 40%, 72.5% 0, 75% 40%, 77.5% 0, 80% 40%, 82.5% 0, 85% 40%, 87.5% 0, 90% 40%, 92.5% 0, 95% 40%, 97.5% 0, 100% 40%, 100% 100%);
        }
        .till-perf--bottom {
          clip-path: polygon(0 0, 100% 0, 100% 60%, 97.5% 100%, 95% 60%, 92.5% 100%, 90% 60%, 87.5% 100%, 85% 60%, 82.5% 100%, 80% 60%, 77.5% 100%, 75% 60%, 72.5% 100%, 70% 60%, 67.5% 100%, 65% 60%, 62.5% 100%, 60% 60%, 57.5% 100%, 55% 60%, 52.5% 100%, 50% 60%, 47.5% 100%, 45% 60%, 42.5% 100%, 40% 60%, 37.5% 100%, 35% 60%, 32.5% 100%, 30% 60%, 27.5% 100%, 25% 60%, 22.5% 100%, 20% 60%, 17.5% 100%, 15% 60%, 12.5% 100%, 10% 60%, 7.5% 100%, 5% 60%, 2.5% 100%, 0 60%);
        }
        .till-rule {
          height: 0;
          border-top: 1.5px dashed oklch(0.82 0.01 330);
        }
        @keyframes till-item-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .till-item {
          animation: till-item-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: calc(0.55s + var(--i, 0) * 90ms);
        }
        @keyframes till-stamp-in {
          0% { opacity: 0; transform: rotate(-14deg) scale(2.2); }
          60% { opacity: 1; transform: rotate(-14deg) scale(0.92); }
          100% { opacity: 0.9; transform: rotate(-14deg) scale(1); }
        }
        .till-stamp {
          animation: till-stamp-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          animation-delay: 1.9s;
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='60'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.9 0.1'/%3E%3C/filter%3E%3Crect width='120' height='60' filter='url(%23n)'/%3E%3C/svg%3E");
          mask-size: cover;
        }
        @media (prefers-reduced-motion: reduce) {
          .till-receipt { transition: none; clip-path: inset(0 0 -8% 0); }
          .till-item, .till-stamp { animation: none; opacity: 1; transform: none; }
          .till-stamp { transform: rotate(-14deg); opacity: 0.9; }
        }
      \`}</style>

      <div className="mx-auto h-3 w-[88%] rounded-full bg-[oklch(0.3_0.03_330)] shadow-inner" aria-hidden />

      <div
        className={\`till-receipt \${printed ? "till-receipt--printed" : ""} relative mx-auto -mt-1 w-[92%] bg-[oklch(0.99_0.004_85)] text-[oklch(0.25_0.02_330)] shadow-2xl\`}
      >
        <div className="till-perf till-perf--top" aria-hidden />

        <div className="px-6 pb-7 pt-6 font-mono text-[13px] leading-relaxed">
          <header className="text-center">
            <p className="font-serif text-2xl font-medium tracking-tight text-[oklch(0.23_0.035_330)]">
              {brand}
            </p>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.2em] text-[oklch(0.5_0.02_330)]">
              {eyebrow}
            </p>
          </header>

          <div className="till-rule my-4" aria-hidden />

          <div className="till-item text-center" style={{ ["--i" as string]: 0 }}>
            <p className="text-[11px] uppercase tracking-widest text-[oklch(0.5_0.02_330)]">
              {amountLabel}
            </p>
            <p className="mt-1 font-serif text-4xl font-medium text-[oklch(0.23_0.035_330)]">
              {amount}
            </p>
            <p className="mt-1 text-[11px] text-[oklch(0.55_0.02_330)]">{currency}</p>
          </div>

          <div className="till-rule my-4" aria-hidden />

          <dl>
            {rows.map((row, i) => (
              <div
                key={row.label}
                className="till-item flex items-baseline justify-between gap-4 py-1"
                style={{ ["--i" as string]: i + 1 }}
              >
                <dt className="shrink-0 text-[11px] uppercase tracking-wider text-[oklch(0.52_0.02_330)]">
                  {row.label}
                </dt>
                <dd
                  className={\`min-w-0 text-right \${row.mono ? "break-all text-[11px]" : "break-words"} text-[oklch(0.28_0.02_330)]\`}
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="till-rule my-4" aria-hidden />

          <div className="pointer-events-none absolute right-5 top-24" aria-hidden>
            <span className="till-stamp inline-block rounded border-[3px] border-[oklch(0.55_0.16_145)] px-3 py-1 font-mono text-lg font-bold uppercase tracking-[0.25em] text-[oklch(0.55_0.16_145)]">
              {stamp}
            </span>
          </div>

          <p
            className="till-item mt-4 text-center text-[10px] tracking-wide text-[oklch(0.52_0.015_330)]"
            style={{ ["--i" as string]: rows.length + 2 }}
          >
            {footer}
          </p>
        </div>

        <div className="till-perf till-perf--bottom" aria-hidden />
      </div>

      {onContinue && (
        <div
          className="till-item mt-6 flex justify-center"
          style={{ ["--i" as string]: rows.length + 3 }}
        >
          <button
            type="button"
            onClick={onContinue}
            className="rounded-md bg-[oklch(0.28_0.04_330)] px-6 py-3 text-sm font-medium text-[oklch(0.98_0.01_85)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
          >
            {continueLabel}
          </button>
        </div>
      )}
    </div>
  );
}`,
    description: "Payment receipt that prints out of a till slot and stamps itself PAID.",
    tags: ["receipt", "clip-path", "stamp", "print-out", "checkout"],
  },
  {
    name: "MagicRings",
    slug: "magic-rings",
    path: "animation/MagicRings.tsx",
    category: "animation",
    code: `"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const vertexShader = \`
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
\`;

const fragmentShader = \`
precision highp float;

uniform float uTime, uAttenuation, uLineThickness;
uniform float uBaseRadius, uRadiusStep, uScaleRate;
uniform float uOpacity, uNoiseAmount, uRotation, uRingGap;
uniform float uFadeIn, uFadeOut;
uniform float uMouseInfluence, uHoverAmount, uHoverScale, uParallax, uBurst;
uniform vec2 uResolution, uMouse;
uniform vec3 uColor, uColorTwo;
uniform int uRingCount;

const float HP = 1.5707963;
const float CYCLE = 3.45;

float fade(float t) {
  return t < uFadeIn ? smoothstep(0.0, uFadeIn, t) : 1.0 - smoothstep(uFadeOut, CYCLE - 0.2, t);
}

float ring(vec2 p, float ri, float cut, float t0, float px) {
  float t = mod(uTime + t0, CYCLE);
  float r = ri + t / CYCLE * uScaleRate;
  float d = abs(length(p) - r);
  float a = atan(abs(p.y), abs(p.x)) / HP;
  float th = max(1.0 - a, 0.5) * px * uLineThickness;
  float h = (1.0 - smoothstep(th, th * 1.5, d)) + 1.0;
  d += pow(cut * a, 3.0) * r;
  return h * exp(-uAttenuation * d) * fade(t);
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
  float px = 1.0 / uResolution.y;
  float cr = cos(uRotation), sr = sin(uRotation);
  p = mat2(cr, -sr, sr, cr) * p;
  p -= uMouse * uMouseInfluence;
  float sc = mix(1.0, uHoverScale, uHoverAmount) + uBurst * 0.3;
  p /= sc;
  vec3 c = vec3(0.0);
  float rcf = max(float(uRingCount) - 1.0, 1.0);
  for (int i = 0; i < 10; i++) {
    if (i >= uRingCount) break;
    float fi = float(i);
    vec2 pr = p - fi * uParallax * uMouse;
    vec3 rc = mix(uColor, uColorTwo, fi / rcf);
    c = mix(c, rc, vec3(ring(pr, uBaseRadius + fi * uRadiusStep, pow(uRingGap, fi), i == 0 ? 0.0 : 2.95 * fi, px)));
  }
  c *= 1.0 + uBurst * 2.0;
  float n = fract(sin(dot(gl_FragCoord.xy + uTime * 100.0, vec2(12.9898, 78.233))) * 43758.5453);
  c += (n - 0.5) * uNoiseAmount;
  gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)) * uOpacity);
}
\`;

export type MagicRingsProps = {
  color?: string;
  colorTwo?: string;
  speed?: number;
  ringCount?: number;
  attenuation?: number;
  lineThickness?: number;
  baseRadius?: number;
  radiusStep?: number;
  scaleRate?: number;
  opacity?: number;
  blur?: number;
  noiseAmount?: number;
  rotation?: number;
  ringGap?: number;
  fadeIn?: number;
  fadeOut?: number;
  followMouse?: boolean;
  mouseInfluence?: number;
  hoverScale?: number;
  parallax?: number;
  clickBurst?: boolean;
  className?: string;
};

type Runtime = Required<
  Pick<
    MagicRingsProps,
    | "color"
    | "colorTwo"
    | "speed"
    | "ringCount"
    | "attenuation"
    | "lineThickness"
    | "baseRadius"
    | "radiusStep"
    | "scaleRate"
    | "opacity"
    | "noiseAmount"
    | "rotation"
    | "ringGap"
    | "fadeIn"
    | "fadeOut"
    | "followMouse"
    | "mouseInfluence"
    | "hoverScale"
    | "parallax"
    | "clickBurst"
  >
>;

/** Soft expanding dual-color WebGL rings — optional mouse parallax + click burst. */
export function MagicRings({
  color = "#912c22",
  colorTwo = "#c9a04a",
  speed = 1,
  ringCount = 6,
  attenuation = 10,
  lineThickness = 2,
  baseRadius = 0.35,
  radiusStep = 0.1,
  scaleRate = 0.1,
  opacity = 1,
  blur = 0,
  noiseAmount = 0.1,
  rotation = 0,
  ringGap = 1.5,
  fadeIn = 0.7,
  fadeOut = 0.5,
  followMouse = false,
  mouseInfluence = 0.2,
  hoverScale = 1.2,
  parallax = 0.05,
  clickBurst = false,
  className,
}: MagicRingsProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef<Runtime | null>(null);
  const mouseRef = useRef([0, 0]);
  const smoothMouseRef = useRef([0, 0]);
  const hoverAmountRef = useRef(0);
  const isHoveredRef = useRef(false);
  const burstRef = useRef(0);

  propsRef.current = {
    color,
    colorTwo,
    speed,
    ringCount,
    attenuation,
    lineThickness,
    baseRadius,
    radiusStep,
    scaleRate,
    opacity,
    noiseAmount,
    rotation,
    ringGap,
    fadeIn,
    fadeOut,
    followMouse,
    mouseInfluence,
    hoverScale,
    parallax,
    clickBurst,
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return;
    }

    if (!renderer.capabilities.isWebGL2) {
      renderer.dispose();
      return;
    }

    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    camera.position.z = 1;

    const uniforms = {
      uTime: { value: 0 },
      uAttenuation: { value: 0 },
      uResolution: { value: new THREE.Vector2() },
      uColor: { value: new THREE.Color() },
      uColorTwo: { value: new THREE.Color() },
      uLineThickness: { value: 0 },
      uBaseRadius: { value: 0 },
      uRadiusStep: { value: 0 },
      uScaleRate: { value: 0 },
      uRingCount: { value: 0 },
      uOpacity: { value: 1 },
      uNoiseAmount: { value: 0 },
      uRotation: { value: 0 },
      uRingGap: { value: 1.6 },
      uFadeIn: { value: 0.5 },
      uFadeOut: { value: 0.75 },
      uMouse: { value: new THREE.Vector2() },
      uMouseInfluence: { value: 0 },
      uHoverAmount: { value: 0 },
      uHoverScale: { value: 1 },
      uParallax: { value: 0 },
      uBurst: { value: 0 },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    scene.add(quad);

    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w <= 0 || h <= 0) return;
      const dpr = Math.min(window.devicePixelRatio, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      const buffer = new THREE.Vector2();
      renderer.getDrawingBufferSize(buffer);
      uniforms.uResolution.value.copy(buffer);
    };
    resize();
    window.addEventListener("resize", resize);
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const onMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      mouseRef.current[0] = (e.clientX - rect.left) / rect.width - 0.5;
      mouseRef.current[1] = -((e.clientY - rect.top) / rect.height - 0.5);
    };
    const onMouseEnter = () => {
      isHoveredRef.current = true;
    };
    const onMouseLeave = () => {
      isHoveredRef.current = false;
      mouseRef.current[0] = 0;
      mouseRef.current[1] = 0;
    };
    const onClick = () => {
      burstRef.current = 1;
    };

    mount.addEventListener("mousemove", onMouseMove);
    mount.addEventListener("mouseenter", onMouseEnter);
    mount.addEventListener("mouseleave", onMouseLeave);
    mount.addEventListener("click", onClick);

    let frameId = 0;
    const animate = (t: number) => {
      frameId = requestAnimationFrame(animate);
      const p = propsRef.current;
      if (!p) return;

      smoothMouseRef.current[0] += (mouseRef.current[0] - smoothMouseRef.current[0]) * 0.08;
      smoothMouseRef.current[1] += (mouseRef.current[1] - smoothMouseRef.current[1]) * 0.08;
      hoverAmountRef.current += ((isHoveredRef.current ? 1 : 0) - hoverAmountRef.current) * 0.08;
      burstRef.current *= 0.95;
      if (burstRef.current < 0.001) burstRef.current = 0;

      uniforms.uTime.value = t * 0.001 * p.speed;
      uniforms.uAttenuation.value = p.attenuation;
      uniforms.uColor.value.set(p.color);
      uniforms.uColorTwo.value.set(p.colorTwo);
      uniforms.uLineThickness.value = p.lineThickness;
      uniforms.uBaseRadius.value = p.baseRadius;
      uniforms.uRadiusStep.value = p.radiusStep;
      uniforms.uScaleRate.value = p.scaleRate;
      uniforms.uRingCount.value = p.ringCount;
      uniforms.uOpacity.value = p.opacity;
      uniforms.uNoiseAmount.value = p.noiseAmount;
      uniforms.uRotation.value = (p.rotation * Math.PI) / 180;
      uniforms.uRingGap.value = p.ringGap;
      uniforms.uFadeIn.value = p.fadeIn;
      uniforms.uFadeOut.value = p.fadeOut;
      uniforms.uMouse.value.set(smoothMouseRef.current[0], smoothMouseRef.current[1]);
      uniforms.uMouseInfluence.value = p.followMouse ? p.mouseInfluence : 0;
      uniforms.uHoverAmount.value = hoverAmountRef.current;
      uniforms.uHoverScale.value = p.hoverScale;
      uniforms.uParallax.value = p.parallax;
      uniforms.uBurst.value = p.clickBurst ? burstRef.current : 0;

      renderer.render(scene, camera);
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      ro.disconnect();
      mount.removeEventListener("mousemove", onMouseMove);
      mount.removeEventListener("mouseenter", onMouseEnter);
      mount.removeEventListener("mouseleave", onMouseLeave);
      mount.removeEventListener("click", onClick);
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      renderer.dispose();
      material.dispose();
      quad.geometry.dispose();
    };
  }, []);

  return (
    <>
      <style>{\`
        .magic-rings-container {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
        }
        .magic-rings-container--interactive { pointer-events: auto; }
        .magic-rings-container canvas {
          display: block;
          position: absolute;
          top: 0; left: 0;
          width: 100% !important;
          height: 100% !important;
        }
      \`}</style>
      <div
        ref={mountRef}
        className={cn(
          "magic-rings-container",
          (followMouse || clickBurst) && "magic-rings-container--interactive",
          className,
        )}
        style={blur > 0 ? { filter: \`blur(\${blur}px)\` } : undefined}
        aria-hidden
      />
    </>
  );
}

/** Soft gold preset tuned for full-screen loaders. */
export const LOADER_MAGIC_RINGS = {
  color: "#c9a04a",
  colorTwo: "#e8d5a3",
  ringCount: 8,
  speed: 0.72,
  attenuation: 7.4,
  lineThickness: 1.2,
  baseRadius: 0.06,
  radiusStep: 0.11,
  scaleRate: 0.3,
  opacity: 0.22,
  blur: 0.4,
  noiseAmount: 0.015,
  rotation: 0,
  ringGap: 1.28,
  fadeIn: 0.5,
  fadeOut: 0.48,
  followMouse: false,
  mouseInfluence: 0,
  parallax: 0,
  hoverScale: 1,
  clickBurst: false,
} as const;`,
    description: "WebGL rings that expand in two colours, with optional mouse parallax and click burst.",
    tags: ["webgl", "three", "shader", "rings", "parallax", "loader-backdrop"],
  },
  {
    name: "StarBorder",
    slug: "star-border",
    path: "buttons/StarBorder.tsx",
    category: "buttons",
    code: `"use client";

import {
  createElement,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type StarBorderTone = "outline" | "primary" | "gold";

export type StarBorderProps<T extends ElementType = "button"> = {
  as?: T;
  className?: string;
  innerClassName?: string;
  tone?: StarBorderTone;
  color?: string;
  speed?: string;
  thickness?: number;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className" | "color">;

const TONE_COLOR: Record<StarBorderTone, string> = {
  outline: "hsl(38 45% 52%)",
  primary: "hsl(5 62% 35%)",
  gold: "hsl(38 45% 52%)",
};

export function StarBorder<T extends ElementType = "button">({
  as,
  className = "",
  innerClassName,
  tone = "outline",
  color,
  speed = "5s",
  thickness = 2,
  children,
  style,
  ...rest
}: StarBorderProps<T>) {
  const Component = (as ?? "button") as ElementType;
  const glow = color ?? TONE_COLOR[tone];

  return (
    <>
      <style>{\`
        .star-border-container {
          display: inline-block;
          position: relative;
          border-radius: 0.625rem;
          overflow: hidden;
          border: none;
          background: transparent;
          padding: 0;
          cursor: pointer;
          font: inherit;
          text-align: inherit;
          transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        .star-border-container:disabled { cursor: not-allowed; opacity: 0.5; }
        .star-border-container:focus-visible { outline: none; }
        .star-border-container:focus-visible .star-border-inner {
          outline: none;
          box-shadow: 0 0 0 2px #fff, 0 0 0 4px hsl(5 62% 35% / 0.55);
        }
        .star-border-container:disabled .border-gradient-bottom,
        .star-border-container:disabled .border-gradient-top {
          animation-play-state: paused;
          opacity: 0.25;
        }
        .star-border-container:active:not(:disabled) { transform: scale(0.97); }
        .border-gradient-bottom,
        .border-gradient-top {
          position: absolute;
          width: 300%;
          height: 50%;
          opacity: 0.65;
          border-radius: 50%;
          z-index: 0;
          pointer-events: none;
        }
        .border-gradient-bottom {
          bottom: -12px;
          right: -250%;
          animation: star-movement-bottom linear infinite alternate;
        }
        .border-gradient-top {
          top: -12px;
          left: -250%;
          animation: star-movement-top linear infinite alternate;
        }
        .star-border-inner {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border-radius: 0.5rem;
          border: 1px solid hsl(40 12% 82%);
          background: #f7f3ee;
          color: hsl(20 8% 18%);
          font-size: 0.875rem;
          font-weight: 500;
          letter-spacing: 0.02em;
          padding: 0.625rem 1.25rem;
          min-height: 2.75rem;
          box-shadow: 0 4px 14px -10px hsl(5 62% 22% / 0.2);
          transition: background-color 150ms ease, border-color 150ms ease,
            color 150ms ease, box-shadow 160ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        .star-border-inner svg {
          transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        .star-border-inner--outline:hover {
          border-color: hsl(38 45% 52% / 0.4);
          background: #efe9e1;
        }
        .star-border-inner--primary {
          border-color: hsl(5 62% 35% / 0.3);
          background: hsl(5 62% 35%);
          color: #f7f3ee;
        }
        .star-border-inner--primary:hover { filter: brightness(1.03); }
        .star-border-inner--gold {
          border-color: hsl(38 45% 52% / 0.35);
          background: hsl(38 45% 52%);
          color: #1c1917;
        }
        .star-border-inner--gold:hover { filter: brightness(1.03); }
        @media (hover: hover) and (pointer: fine) {
          .star-border-container:hover:not(:disabled) { transform: translateY(-3px); }
          .star-border-container:hover:not(:disabled) .star-border-inner {
            box-shadow: 0 14px 28px -12px hsl(5 62% 22% / 0.38);
          }
          .star-border-container:hover:not(:disabled) .star-border-inner svg:last-child {
            transform: translateX(3px);
          }
          .star-border-container:active:not(:disabled) {
            transform: translateY(-1px) scale(0.97);
          }
        }
        @keyframes star-movement-bottom {
          0% { transform: translate(0%, 0%); opacity: 1; }
          100% { transform: translate(-100%, 0%); opacity: 0; }
        }
        @keyframes star-movement-top {
          0% { transform: translate(0%, 0%); opacity: 1; }
          100% { transform: translate(100%, 0%); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .star-border-container,
          .star-border-inner,
          .star-border-inner svg { transition: none; }
          .star-border-container:hover:not(:disabled),
          .star-border-container:active:not(:disabled) { transform: none; }
          .border-gradient-bottom,
          .border-gradient-top { animation: none !important; opacity: 0.35; }
        }
      \`}</style>
      {createElement(
        Component,
        {
          className: cn("star-border-container", className),
          style: {
            padding: \`\${thickness}px 0\`,
            ...(style as CSSProperties | undefined),
          },
          ...rest,
        },
        <>
          <div
            className="border-gradient-bottom"
            style={{
              background: \`radial-gradient(circle, \${glow}, transparent 10%)\`,
              animationDuration: speed,
            }}
            aria-hidden
          />
          <div
            className="border-gradient-top"
            style={{
              background: \`radial-gradient(circle, \${glow}, transparent 10%)\`,
              animationDuration: speed,
            }}
            aria-hidden
          />
          <div
            className={cn(
              "star-border-inner",
              tone === "outline" && "star-border-inner--outline",
              tone === "primary" && "star-border-inner--primary",
              tone === "gold" && "star-border-inner--gold",
              innerClassName,
            )}
          >
            {children}
          </div>
        </>,
      )}
    </>
  );
}`,
    description: "Button with light glints sweeping its top and bottom edges, in three tones.",
    tags: ["border-beam", "radial-gradient", "cta", "hover-lift", "css-keyframes"],
  },
  {
    name: "ShinyText",
    slug: "shiny-text",
    path: "animation/ShinyText.tsx",
    category: "animation",
    code: `"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, useMotionValue, useAnimationFrame, useTransform } from "motion/react";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type ShinyTextProps = {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  color?: string;
  shineColor?: string;
  spread?: number;
  yoyo?: boolean;
  pauseOnHover?: boolean;
  direction?: "left" | "right";
  delay?: number;
};

/** Gradient-clipped text with a sweeping editorial shine. */
export function ShinyText({
  text,
  disabled = false,
  speed = 2,
  className = "",
  color = "hsl(45 4% 41% / 0.72)",
  shineColor = "hsl(5 62% 35%)",
  spread = 120,
  yoyo = false,
  pauseOnHover = false,
  direction = "left",
  delay = 0,
}: ShinyTextProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const progress = useMotionValue(0);
  const elapsedRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const directionRef = useRef(direction === "left" ? 1 : -1);

  const animationDuration = speed * 1000;
  const delayDuration = delay * 1000;
  const isDisabled = disabled || prefersReducedMotion;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useAnimationFrame((time) => {
    if (isDisabled || isPaused) {
      lastTimeRef.current = null;
      return;
    }
    if (lastTimeRef.current === null) {
      lastTimeRef.current = time;
      return;
    }
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    elapsedRef.current += deltaTime;

    if (yoyo) {
      const cycleDuration = animationDuration + delayDuration;
      const fullCycle = cycleDuration * 2;
      const cycleTime = elapsedRef.current % fullCycle;
      if (cycleTime < animationDuration) {
        const p = (cycleTime / animationDuration) * 100;
        progress.set(directionRef.current === 1 ? p : 100 - p);
      } else if (cycleTime < cycleDuration) {
        progress.set(directionRef.current === 1 ? 100 : 0);
      } else if (cycleTime < cycleDuration + animationDuration) {
        const reverseTime = cycleTime - cycleDuration;
        const p = 100 - (reverseTime / animationDuration) * 100;
        progress.set(directionRef.current === 1 ? p : 100 - p);
      } else {
        progress.set(directionRef.current === 1 ? 0 : 100);
      }
    } else {
      const cycleDuration = animationDuration + delayDuration;
      const cycleTime = elapsedRef.current % cycleDuration;
      if (cycleTime < animationDuration) {
        const p = (cycleTime / animationDuration) * 100;
        progress.set(directionRef.current === 1 ? p : 100 - p);
      } else {
        progress.set(directionRef.current === 1 ? 100 : 0);
      }
    }
  });

  useEffect(() => {
    directionRef.current = direction === "left" ? 1 : -1;
    elapsedRef.current = 0;
    progress.set(0);
  }, [direction, progress]);

  const backgroundPosition = useTransform(progress, (p) => \`\${150 - p * 2}% center\`);

  const handleMouseEnter = useCallback(() => {
    if (pauseOnHover) setIsPaused(true);
  }, [pauseOnHover]);
  const handleMouseLeave = useCallback(() => {
    if (pauseOnHover) setIsPaused(false);
  }, [pauseOnHover]);

  if (isDisabled) {
    return <span className={cn("inline-block", className)}>{text}</span>;
  }

  const gradientStyle = {
    backgroundImage: \`linear-gradient(\${spread}deg, \${color} 0%, \${color} 35%, \${shineColor} 50%, \${color} 65%, \${color} 100%)\`,
    backgroundSize: "200% auto",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
  } as const;

  return (
    <motion.span
      className={cn("inline-block", className)}
      style={{ ...gradientStyle, backgroundPosition }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {text}
    </motion.span>
  );
}`,
    description: "Text with a sweeping gradient shine that renders plain when motion is reduced.",
    tags: ["text-shine", "gradient-clip", "motion", "yoyo", "editorial"],
  },
  {
    name: "CircularText",
    slug: "circular-text",
    path: "display/CircularText.tsx",
    category: "display",
    code: `"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { motion, useAnimation, useReducedMotion } from "motion/react";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type CircularTextHover = "slowDown" | "speedUp" | "pause" | "goBonkers";

export type CircularTextProps = {
  text: string;
  spinDuration?: number;
  onHover?: CircularTextHover;
  className?: string;
  size?: "sm" | "md" | "lg";
  children?: ReactNode; // optional center content (logo, icon)
};

const FALLBACK_RADIUS: Record<NonNullable<CircularTextProps["size"]>, number> = {
  sm: 36,
  md: 50,
  lg: 132,
};

const getRotationTransition = (duration: number, from: number, loop = true) => ({
  from,
  to: from + 360,
  ease: "linear" as const,
  duration,
  type: "tween" as const,
  repeat: loop ? Infinity : 0,
});

const getTransition = (duration: number, from: number) => ({
  rotate: getRotationTransition(duration, from),
  scale: { type: "spring" as const, damping: 20, stiffness: 300 },
});

/** Letters orbit a ring; hover can speed up, slow, pause, or go wild. */
export function CircularText({
  text,
  spinDuration = 20,
  onHover = "speedUp",
  className = "",
  size = "md",
  children,
}: CircularTextProps) {
  const letters = Array.from(text);
  const controls = useAnimation();
  const hostRef = useRef<HTMLDivElement>(null);
  const [letterRadius, setLetterRadius] = useState(FALLBACK_RADIUS[size]);
  const prefersReducedMotion = useReducedMotion();
  const activeDuration = prefersReducedMotion ? spinDuration * 4 : spinDuration;

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const measure = () => {
      const min = Math.min(host.clientWidth, host.clientHeight);
      if (min <= 0) return;
      const inset = size === "sm" ? 0.4 : 0.44;
      setLetterRadius(min * inset);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    return () => ro.disconnect();
  }, [size]);

  useEffect(() => {
    void controls.start({
      rotate: 360,
      scale: 1,
      transition: getTransition(activeDuration, 0),
    });
  }, [activeDuration, text, onHover, controls]);

  const handleHoverStart = () => {
    if (prefersReducedMotion || !onHover) return;
    let transitionConfig;
    let scaleVal = 1;
    switch (onHover) {
      case "slowDown":
        transitionConfig = getTransition(activeDuration * 2, 0);
        break;
      case "speedUp":
        transitionConfig = getTransition(activeDuration / 4, 0);
        break;
      case "pause":
        transitionConfig = {
          rotate: { type: "spring" as const, damping: 20, stiffness: 300 },
          scale: { type: "spring" as const, damping: 20, stiffness: 300 },
        };
        break;
      case "goBonkers":
        transitionConfig = getTransition(activeDuration / 20, 0);
        scaleVal = 0.8;
        break;
      default:
        transitionConfig = getTransition(activeDuration, 0);
    }
    void controls.start({ rotate: 360, scale: scaleVal, transition: transitionConfig });
  };

  const handleHoverEnd = () => {
    if (prefersReducedMotion) return;
    void controls.start({
      rotate: 360,
      scale: 1,
      transition: getTransition(activeDuration, 0),
    });
  };

  return (
    <>
      <style>{\`
        .circ-text-host {
          position: relative;
          display: grid;
          place-items: center;
          aspect-ratio: 1 / 1;
          width: 7.5rem;
          pointer-events: none;
        }
        .circ-text-host--sm { width: 5.5rem; }
        .circ-text-host--md { width: 7.5rem; }
        .circ-text-host--lg { width: 22rem; }
        @media (min-width: 640px) {
          .circ-text-host--lg { width: 26rem; }
        }
        .circ-text-anchor {
          position: absolute;
          inset: 0;
          transform: translate(0, 0);
        }
        .circ-text-ring {
          position: relative;
          width: 100%;
          height: 100%;
          transform-origin: center center;
          pointer-events: auto;
        }
        .circ-text-ring span {
          position: absolute;
          left: 50%;
          top: 50%;
          display: inline-block;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--bz-gold, #7a6015);
          transform-origin: center center;
          white-space: pre;
          font-size: 0.5625rem;
        }
        .circ-text-host--sm .circ-text-ring span { font-size: 0.4375rem; }
        .circ-text-host--lg .circ-text-ring span {
          font-size: 0.72rem;
          letter-spacing: 0.14em;
        }
        .circ-text-center {
          position: relative;
          z-index: 2;
          width: 70%;
          height: 70%;
          display: grid;
          place-items: center;
        }
        @media (prefers-reduced-motion: reduce) {
          .circ-text-ring { transform: none !important; }
        }
      \`}</style>
      <div
        ref={hostRef}
        className={cn("circ-text-host", \`circ-text-host--\${size}\`, className)}
        aria-hidden
      >
        {children ? <div className="circ-text-center">{children}</div> : null}
        <div className="circ-text-anchor">
          <motion.div
            className="circ-text-ring"
            initial={{ rotate: 0 }}
            animate={controls}
            onMouseEnter={handleHoverStart}
            onMouseLeave={handleHoverEnd}
          >
            {letters.map((letter, i) => {
              const rotationDeg = (360 / letters.length) * i;
              const transform = \`translate(-50%, -50%) rotate(\${rotationDeg}deg) translateY(-\${letterRadius}px) rotate(\${-rotationDeg}deg)\`;
              return (
                <span key={\`\${letter}-\${i}\`} style={{ transform, WebkitTransform: transform }}>
                  {letter}
                </span>
              );
            })}
          </motion.div>
        </div>
      </div>
    </>
  );
}`,
    description: "Letters set around a spinning ring that speeds up, slows or pauses on hover.",
    tags: ["circular-text", "orbit", "motion", "hover-speed", "brand-lockup"],
  },
  {
    name: "PinchedButton",
    slug: "pinched-button",
    path: "buttons/PinchedButton.tsx",
    category: "buttons",
    code: `"use client";

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type PinchedTone = "solid" | "ghost" | "soft";

type Shared = {
  tone?: PinchedTone;
  arrow?: boolean;
  spread?: boolean;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  brick?: string;
  cream?: string;
};

type AsButton = Shared &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "style" | "children"> & {
    href?: undefined;
  };

type AsLink = Shared &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "style" | "children" | "href"> & {
    href: string;
  };

export type PinchedButtonProps = AsButton | AsLink;

const Arrow = () => (
  <svg className="pinched-btn__arrow" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M5 12h14M13 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Asymmetric brick CTA — radius 0 40px 0 40px, hover lift, arrow nudge.
 * Pair two with \`.portal-cta-pair\` + \`.portal-admin\` / \`.portal-vendor\` for :has() cross-fill.
 */
export function PinchedButton(props: PinchedButtonProps) {
  const {
    tone = "solid",
    arrow = true,
    spread = false,
    className,
    style,
    children,
    brick = "#912c22",
    cream = "#f7f3ee",
    ...rest
  } = props;

  const classes = cn(
    "pinched-btn",
    tone === "solid" && "pinched-btn--solid",
    tone === "ghost" && "pinched-btn--ghost",
    tone === "soft" && "pinched-btn--soft",
    (spread || arrow) && "pinched-btn--spread",
    className,
  );

  const mergedStyle = {
    ...style,
    ["--pb-brick" as string]: brick,
    ["--pb-cream" as string]: cream,
  } as CSSProperties;

  const label = (
    <span className="pinched-btn__label">
      <span className="pinched-btn__text">{children}</span>
      {arrow ? <Arrow /> : null}
    </span>
  );

  return (
    <>
      <style>{\`
        .pinched-btn {
          --pb-brick: #912c22;
          --pb-cream: #f7f3ee;
          --pb-ease: cubic-bezier(0.23, 1, 0.32, 1);
          position: relative;
          display: inline-grid;
          place-items: center;
          box-sizing: border-box;
          min-width: 8.5rem;
          height: 3.125rem;
          padding: 0 1.35rem 0 1.5rem;
          border: 5px solid var(--pb-brick);
          border-radius: 0 40px 0 40px;
          background: var(--pb-brick);
          color: var(--pb-cream);
          cursor: pointer;
          font-size: 0.8125rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          isolation: isolate;
          text-decoration: none;
          box-shadow: 0 6px 18px -10px hsl(5 62% 22% / 0.45);
          transition: transform 160ms var(--pb-ease), background-color 160ms var(--pb-ease),
            color 160ms var(--pb-ease), border-color 160ms var(--pb-ease),
            box-shadow 160ms var(--pb-ease);
        }
        .pinched-btn.w-full { display: grid; width: 100%; min-width: 100%; }
        .pinched-btn--solid { background: var(--pb-brick); border-color: var(--pb-brick); color: var(--pb-cream); }
        .pinched-btn--ghost,
        .pinched-btn--soft {
          background: var(--pb-cream);
          border-color: var(--pb-brick);
          color: var(--pb-brick);
          box-shadow: 0 4px 14px -10px hsl(5 62% 22% / 0.28);
        }
        .pinched-btn__label {
          position: relative; z-index: 1;
          display: inline-flex; align-items: center; justify-content: center;
          gap: 0.65rem; width: 100%; white-space: nowrap; pointer-events: none; color: inherit;
        }
        .pinched-btn--spread .pinched-btn__label { justify-content: space-between; }
        .pinched-btn__arrow {
          width: 1.05rem; height: 1.05rem; flex-shrink: 0;
          transition: transform 160ms var(--pb-ease);
        }
        .pinched-btn:focus-visible { outline: 2px solid var(--pb-brick); outline-offset: 3px; }
        .pinched-btn:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
        .pinched-btn:active:not(:disabled) {
          transform: scale(0.97);
          box-shadow: 0 2px 8px -6px hsl(5 62% 22% / 0.35);
        }
        @media (hover: hover) and (pointer: fine) {
          .pinched-btn:hover:not(:disabled) {
            transform: translateY(-3px);
            box-shadow: 0 14px 28px -12px hsl(5 62% 22% / 0.5);
          }
          .pinched-btn:hover:not(:disabled) .pinched-btn__arrow { transform: translateX(3px); }
          .pinched-btn--solid:hover:not(:disabled) {
            background: color-mix(in srgb, var(--pb-brick) 88%, #000);
            border-color: color-mix(in srgb, var(--pb-brick) 88%, #000);
          }
          .pinched-btn--ghost:hover:not(:disabled),
          .pinched-btn--soft:hover:not(:disabled) {
            background: color-mix(in srgb, var(--pb-cream) 92%, #000);
          }
          .pinched-btn:active:not(:disabled) { transform: translateY(-1px) scale(0.97); }

          .portal-cta-pair .portal-admin.pinched-btn:hover:not(:disabled) {
            background: color-mix(in srgb, var(--pb-brick) 88%, #000);
            border-color: color-mix(in srgb, var(--pb-brick) 88%, #000);
            color: var(--pb-cream);
          }
          .portal-cta-pair:has(.portal-admin:hover) .portal-vendor.pinched-btn:not(:disabled) {
            background: var(--pb-cream);
            border-color: var(--pb-brick);
            color: var(--pb-brick);
            box-shadow: 0 4px 14px -10px hsl(5 62% 22% / 0.28);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .pinched-btn, .pinched-btn__arrow { transition: none; }
          .pinched-btn:hover:not(:disabled),
          .pinched-btn:active:not(:disabled) { transform: none; }
          .pinched-btn:hover:not(:disabled) .pinched-btn__arrow { transform: none; }
        }
      \`}</style>
      {"href" in props && typeof props.href === "string" ? (
        <a
          className={classes}
          style={mergedStyle}
          {...(rest as AsLink)}
        >
          {label}
        </a>
      ) : (
        <button
          type={(rest as AsButton).type ?? "button"}
          className={classes}
          style={mergedStyle}
          {...(rest as AsButton)}
        >
          {label}
        </button>
      )}
    </>
  );
}`,
    description: "Asymmetric brick button with a pinched corner radius, hover lift and arrow nudge.",
    tags: ["asymmetric-radius", "cta", "hover-lift", "has-selector", "editorial"],
  },
  {
    name: "MultiStepLoader",
    slug: "multi-step-loader",
    path: "loaders/MultiStepLoader.tsx",
    category: "loaders",
    code: `"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MagicRings, LOADER_MAGIC_RINGS } from "../animation/MagicRings";
import { ShinyText } from "../animation/ShinyText";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type LoadingState = { text: string };

const SHINY_ITEM = {
  color: "hsl(45 4% 41% / 0.55)",
  shineColor: "hsl(5 62% 35%)",
} as const;

const PendingIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={cn("h-6 w-6", className)}>
    <circle cx="12" cy="12" r="9" />
  </svg>
);

const CheckFilled = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("h-6 w-6", className)}>
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
  </svg>
);

const LoaderCore = ({
  loadingStates,
  value = 0,
  shinyActive = true,
}: {
  loadingStates: LoadingState[];
  value?: number;
  shinyActive?: boolean;
}) => {
  const rowHeight = 40;
  const viewportHeight = Math.min(loadingStates.length, 5) * rowHeight;

  return (
    <div className="relative mx-auto w-full max-w-xl overflow-hidden" style={{ height: \`\${viewportHeight}px\` }}>
      <motion.div
        className="flex flex-col"
        animate={{ y: -(value * rowHeight) }}
        transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      >
        {loadingStates.map((loadingState, index) => {
          const distance = Math.abs(index - value);
          const isActive = value === index;
          const isDone = index < value;
          const isPending = index > value;
          // Pending rows fade with distance, but never below the point where ink
          // on white still clears 4.5:1 (0.6 gives 5.4:1).
          const opacity = isActive ? 1 : isDone ? 0.9 : Math.max(0.68 - distance * 0.06, 0.6);

          return (
            <div key={index} className="flex h-10 items-center gap-2.5 text-left" style={{ opacity }}>
              <div className="shrink-0">
                {isDone ? <CheckFilled className="text-amber-700/80" /> : null}
                {isActive ? <CheckFilled className="text-amber-700" /> : null}
                {isPending ? <PendingIcon className="text-[color:var(--bz-ink,#0a0a0a)]" /> : null}
              </div>
              {isActive && shinyActive ? (
                <ShinyText text={loadingState.text} className="text-base font-medium sm:text-lg" speed={2.2} spread={110} {...SHINY_ITEM} />
              ) : (
                <span
                  className={cn(
                    "text-base sm:text-lg",
                    isActive && "font-medium text-neutral-900",
                    isDone && "text-neutral-800/80",
                    isPending && "text-[color:var(--bz-ink,#0a0a0a)]",
                  )}
                >
                  {loadingState.text}
                </span>
              )}
            </div>
          );
        })}
      </motion.div>
    </div>
  );
};

export type MultiStepLoaderProps = {
  loadingStates: LoadingState[];
  loading?: boolean;
  duration?: number;
  loop?: boolean;
  title?: string;
  subtitle?: string;
  shinyActive?: boolean;
  magicRings?: boolean;
  onComplete?: () => void;
};

export function MultiStepLoader({
  loadingStates,
  loading,
  duration = 2000,
  loop = true,
  title,
  subtitle,
  shinyActive = true,
  magicRings = true,
  onComplete,
}: MultiStepLoaderProps) {
  const [currentState, setCurrentState] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const completedRef = useRef(false);

  useEffect(() => {
    if (!loading) {
      setCurrentState(0);
      completedRef.current = false;
      return;
    }
    if (!loop && currentState === loadingStates.length - 1) {
      if (completedRef.current) return;
      completedRef.current = true;
      const done = window.setTimeout(() => onCompleteRef.current?.(), Math.min(duration, 800));
      return () => window.clearTimeout(done);
    }
    const timeout = window.setTimeout(() => {
      setCurrentState((prev) =>
        loop
          ? prev === loadingStates.length - 1
            ? 0
            : prev + 1
          : Math.min(prev + 1, loadingStates.length - 1),
      );
    }, duration);
    return () => window.clearTimeout(timeout);
  }, [currentState, loading, loop, loadingStates.length, duration]);

  return (
    <>
      <style>{\`
        .loader-magic-rings-layer {
          position: absolute;
          inset: 0;
          z-index: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
        }
        .loader-magic-rings-layer .magic-rings-container {
          position: absolute;
          left: 50%;
          top: 50%;
          width: max(100vw, 100dvh);
          height: max(100vw, 100dvh);
          transform: translate(-50%, -50%);
        }
      \`}</style>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex h-dvh w-full items-center justify-center overflow-hidden"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            {magicRings ? (
              <div className="loader-magic-rings-layer" aria-hidden>
                <MagicRings className="h-full w-full" {...LOADER_MAGIC_RINGS} />
              </div>
            ) : null}
            <div className="absolute inset-0 z-[1] bg-white/60 backdrop-blur-[2px]" />
            <div className="relative z-10 flex w-full max-w-xl flex-col items-center px-6">
              {(title || subtitle) && (
                <div className="w-full rounded-2xl border border-neutral-200/80 bg-white/92 px-5 py-5 text-center shadow-sm backdrop-blur-sm sm:px-6">
                  {title ? <h2 className="text-2xl font-light tracking-tight text-neutral-900 sm:text-3xl">{title}</h2> : null}
                  {subtitle ? <p className="mt-2 text-sm leading-relaxed text-neutral-600 sm:text-base">{subtitle}</p> : null}
                </div>
              )}
              <div className="mt-6 w-full rounded-2xl border border-neutral-200/80 bg-white/90 px-5 py-4 shadow-sm backdrop-blur-sm sm:px-6">
                <LoaderCore value={currentState} loadingStates={loadingStates} shinyActive={shinyActive} />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}`,
    description: "Full-screen step loader with ticked stages, a shining active label and WebGL rings.",
    tags: ["multi-step", "overlay", "webgl", "shiny-text", "checklist", "fullscreen"],
  },
  {
    name: "MetallicLogoShimmer",
    slug: "metallic-logo-shimmer",
    path: "media/MetallicLogoShimmer.tsx",
    category: "media",
    code: `"use client";

import type { CSSProperties } from "react";

export type MetallicLogoShimmerProps = {
  /** Logo image used both as visible mark and CSS mask for glare/shimmer. */
  src: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  maxWidth?: string;
};

/**
 * Soft plate + champagne bloom + logo-masked glare + slow metallic sweep.
 * Consumer supplies \`src\` (no bundled brand asset).
 */
export function MetallicLogoShimmer({
  src,
  alt = "YASH logo",
  className,
  style,
  maxWidth = "min(100%, 28rem)",
}: MetallicLogoShimmerProps) {
  const mask: CSSProperties = {
    WebkitMaskImage: \`url(\${src})\`,
    maskImage: \`url(\${src})\`,
    maskSize: "contain",
    maskRepeat: "no-repeat",
    maskPosition: "center",
  };

  return (
    <>
      <style>{\`
        @keyframes mls-ambient-glow {
          0%, 48% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.97); }
          56%, 76% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
          88%, 100% { opacity: 0.55; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes mls-shimmer {
          0%, 52% { transform: translateX(-38%) rotate(-2deg); opacity: 0; }
          58% { transform: translateX(-14%); opacity: 0.42; }
          64%, 80% { transform: translateX(6%); opacity: 0.68; }
          86% { transform: translateX(18%); opacity: 0.48; }
          94%, 100% { transform: translateX(36%); opacity: 0; }
        }
        .mls-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          max-width: 100%;
          isolation: isolate;
        }
        .mls-logo {
          position: relative;
          z-index: 1;
          width: var(--mls-max, min(100%, 28rem));
          height: auto;
          object-fit: contain;
          filter: drop-shadow(0 18px 36px hsl(60 4% 8% / 0.09));
        }
        .mls-plate,
        .mls-glow {
          position: absolute;
          left: 50%;
          top: 52%;
          z-index: 0;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .mls-plate {
          width: 74%;
          height: 74%;
          background: radial-gradient(
            circle at center,
            hsl(0 0% 100% / 0.96) 0%,
            hsl(0 0% 100% / 0.9) 34%,
            hsl(40 33% 97% / 0.62) 58%,
            hsl(40 33% 97% / 0.22) 74%,
            transparent 88%
          );
          filter: blur(18px);
        }
        .mls-glow {
          width: 62%;
          height: 62%;
          background: radial-gradient(
            circle at center,
            hsl(44 72% 90% / 0.28) 0%,
            hsl(40 52% 78% / 0.14) 38%,
            hsl(38 38% 68% / 0.05) 58%,
            transparent 76%
          );
          filter: blur(28px);
          animation: mls-ambient-glow 22s ease-in-out infinite;
        }
        .mls-glare {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          background:
            radial-gradient(ellipse 34% 26% at 30% 18%, hsl(46 92% 94% / 0.32), transparent 72%),
            radial-gradient(ellipse 48% 38% at 52% 58%, hsl(38 48% 52% / 0.1), transparent 76%);
          mix-blend-mode: soft-light;
        }
        .mls-shimmer {
          position: absolute;
          inset: 0;
          z-index: 3;
          overflow: hidden;
          pointer-events: none;
        }
        .mls-shimmer::before {
          content: "";
          position: absolute;
          top: -18%;
          left: -18%;
          width: 136%;
          height: 136%;
          background: linear-gradient(
            118deg,
            transparent 0%,
            hsl(38 38% 48% / 0.04) 28%,
            hsl(40 55% 62% / 0.14) 42%,
            hsl(44 78% 84% / 0.28) 48%,
            hsl(46 92% 95% / 0.38) 50%,
            hsl(42 68% 72% / 0.22) 52%,
            hsl(38 45% 52% / 0.1) 62%,
            transparent 78%
          );
          animation: mls-shimmer 24s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .mls-glow,
          .mls-shimmer::before { animation: none; }
          .mls-glow { opacity: 0.65; }
          .mls-shimmer::before { opacity: 0; }
        }
      \`}</style>
      <div
        className={["mls-wrap", className].filter(Boolean).join(" ")}
        style={{ ...style, ["--mls-max" as string]: maxWidth }}
      >
        <div className="mls-plate" aria-hidden />
        <div className="mls-glow" aria-hidden />
        <div className="mls-glare" style={mask} aria-hidden />
        <div className="mls-shimmer" style={mask} aria-hidden />
        <img src={src} alt={alt} className="mls-logo" />
      </div>
    </>
  );
}`,
    description: "Logo on a soft plate with a champagne bloom and a slow metallic sweep.",
    tags: ["logo", "mask-image", "metallic-shimmer", "ambient-glow", "brand"],
  },
  {
    name: "Highlighter",
    slug: "highlighter",
    path: "animation/Highlighter.tsx",
    category: "animation",
    code: `"use client";

import { useLayoutEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { useInView } from "motion/react";
import { annotate } from "rough-notation";

type AnnotationAction =
  | "highlight"
  | "underline"
  | "box"
  | "circle"
  | "strike-through"
  | "crossed-off"
  | "bracket";

export type HighlighterProps = {
  children: ReactNode;
  action?: AnnotationAction;
  color?: string;
  strokeWidth?: number;
  animationDuration?: number;
  iterations?: number;
  padding?: number;
  multiline?: boolean;
  /** When true, only draw once the span scrolls into view. */
  isView?: boolean;
  /**
   * Change this value to draw the mark again from the start, for a replay
   * button or a step that returns. Under reduced motion the finished mark
   * simply stays in place.
   */
  replayKey?: string | number;
};

const RM_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(RM_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const readReducedMotion = () => window.matchMedia(RM_QUERY).matches;
const serverReducedMotion = () => false;

/** Where the words sit relative to the box the mark is drawn in. */
function placement(element: HTMLElement) {
  const frame = (element.offsetParent ?? document.body).getBoundingClientRect();
  return Array.from(element.getClientRects(), (r) =>
    [r.left - frame.left, r.top - frame.top, r.width, r.height].map(Math.round).join(","),
  ).join("|");
}

/**
 * Hand-drawn rough-notation mark that draws on mount (or on scroll into view),
 * and again whenever \`replayKey\` changes.
 *
 * Each draw is a fresh annotation: the previous one is removed and a new one
 * animates in. When layout moves the words afterwards, the finished mark is
 * redrawn in place without animating, so a resize never replays it. Reduced
 * motion draws the same finished mark with no animation, and follows changes
 * to the setting live.
 */
export function Highlighter({
  children,
  action = "highlight",
  color = "#ffd1dc",
  strokeWidth = 1.5,
  animationDuration = 600,
  iterations = 2,
  padding = 2,
  multiline = true,
  isView = false,
  replayKey,
}: HighlighterProps) {
  const elementRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(elementRef, { once: true, margin: "-10%" });
  const shouldShow = !isView || isInView;
  const reduced = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, serverReducedMotion);
  // Under reduced motion the mark is already final, so a replay has nothing to redraw.
  const drawKey = reduced ? null : replayKey;

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!shouldShow || !element) return;

    const annotation = annotate(element, {
      type: action,
      color,
      strokeWidth,
      animate: !reduced,
      animationDuration,
      iterations,
      padding,
      multiline,
    });
    annotation.show();

    // Showing an annotation that is already showing redraws it without
    // animation, which is what a layout change needs.
    let last = placement(element);
    const resizeObserver = new ResizeObserver(() => {
      const next = placement(element);
      if (next === last) return;
      last = next;
      if (annotation.isShowing()) annotation.show();
    });
    resizeObserver.observe(element);
    resizeObserver.observe(document.body);

    return () => {
      resizeObserver.disconnect();
      annotation.remove();
    };
  }, [shouldShow, reduced, drawKey, action, color, strokeWidth, animationDuration, iterations, padding, multiline]);

  return (
    <span ref={elementRef} className="relative inline bg-transparent">
      {children}
    </span>
  );
}`,
    description: "Hand-drawn highlight, underline, box or circle marks that draw on mount or scroll.",
    tags: ["rough-notation", "underline", "scroll-reveal", "hand-drawn", "annotation"],
  },
  {
    name: "TextType",
    slug: "text-type",
    path: "animation/TextType.tsx",
    category: "animation",
    code: `"use client";

import {
  useEffect,
  useRef,
  useState,
  createElement,
  useMemo,
  useCallback,
  type ElementType,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import gsap from "gsap";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type TextTypeProps = {
  text: string | string[];
  as?: ElementType;
  typingSpeed?: number;
  initialDelay?: number;
  pauseDuration?: number;
  deletingSpeed?: number;
  loop?: boolean;
  className?: string;
  showCursor?: boolean;
  hideCursorWhileTyping?: boolean;
  cursorCharacter?: ReactNode;
  cursorClassName?: string;
  cursorBlinkDuration?: number;
  textColors?: string[];
  variableSpeed?: { min: number; max: number };
  onSentenceComplete?: (sentence: string, index: number) => void;
  startOnVisible?: boolean;
  reverseMode?: boolean;
} & Omit<HTMLAttributes<HTMLElement>, "children">;

/** Typewriter with GSAP-blinking cursor, optional delete/loop, and IntersectionObserver start. */
export function TextType({
  text,
  as: Component = "div",
  typingSpeed = 50,
  initialDelay = 0,
  pauseDuration = 2000,
  deletingSpeed = 30,
  loop = true,
  className = "",
  showCursor = true,
  hideCursorWhileTyping = false,
  cursorCharacter = "|",
  cursorClassName = "",
  cursorBlinkDuration = 0.5,
  textColors = [],
  variableSpeed,
  onSentenceComplete,
  startOnVisible = false,
  reverseMode = false,
  ...props
}: TextTypeProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(!startOnVisible);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const textArray = useMemo(() => (Array.isArray(text) ? text : [text]), [text]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const getRandomSpeed = useCallback(() => {
    if (!variableSpeed) return typingSpeed;
    const { min, max } = variableSpeed;
    return Math.random() * (max - min) + min;
  }, [variableSpeed, typingSpeed]);

  const getCurrentTextColor = () => {
    if (textColors.length === 0) return "inherit";
    return textColors[currentTextIndex % textColors.length];
  };

  useEffect(() => {
    if (!startOnVisible || !containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setIsVisible(true);
        });
      },
      { threshold: 0.1 },
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [startOnVisible]);

  useEffect(() => {
    if (!showCursor || !cursorRef.current || prefersReducedMotion) return;
    gsap.set(cursorRef.current, { opacity: 1 });
    const tween = gsap.to(cursorRef.current, {
      opacity: 0,
      duration: cursorBlinkDuration,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut",
    });
    return () => {
      tween.kill();
    };
  }, [showCursor, cursorBlinkDuration, prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayedText(textArray[0] ?? "");
      return;
    }
    if (!isVisible) return;

    let timeout: ReturnType<typeof setTimeout> | undefined;
    const currentText = textArray[currentTextIndex];
    const processedText = reverseMode ? currentText.split("").reverse().join("") : currentText;

    const executeTypingAnimation = () => {
      if (isDeleting) {
        if (displayedText === "") {
          setIsDeleting(false);
          if (currentTextIndex === textArray.length - 1 && !loop) return;
          onSentenceComplete?.(textArray[currentTextIndex], currentTextIndex);
          setCurrentTextIndex((prev) => (prev + 1) % textArray.length);
          setCurrentCharIndex(0);
          timeout = setTimeout(() => {}, pauseDuration);
        } else {
          timeout = setTimeout(() => {
            setDisplayedText((prev) => prev.slice(0, -1));
          }, deletingSpeed);
        }
      } else if (currentCharIndex < processedText.length) {
        timeout = setTimeout(
          () => {
            setDisplayedText((prev) => prev + processedText[currentCharIndex]);
            setCurrentCharIndex((prev) => prev + 1);
          },
          variableSpeed ? getRandomSpeed() : typingSpeed,
        );
      } else if (textArray.length >= 1) {
        if (!loop && currentTextIndex === textArray.length - 1) return;
        timeout = setTimeout(() => setIsDeleting(true), pauseDuration);
      }
    };

    if (currentCharIndex === 0 && !isDeleting && displayedText === "") {
      timeout = setTimeout(executeTypingAnimation, initialDelay);
    } else {
      executeTypingAnimation();
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [
    currentCharIndex,
    displayedText,
    isDeleting,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    textArray,
    currentTextIndex,
    loop,
    initialDelay,
    isVisible,
    reverseMode,
    variableSpeed,
    onSentenceComplete,
    getRandomSpeed,
    prefersReducedMotion,
  ]);

  const shouldHideCursor =
    hideCursorWhileTyping &&
    (currentCharIndex < textArray[currentTextIndex].length || isDeleting);

  return (
    <>
      <style>{\`
        .hos-text-type { display: block; width: 100%; max-width: 36rem; }
        .hos-text-type__content { text-wrap: pretty; }
        .hos-text-type__cursor {
          margin-left: 0.2rem;
          display: inline-block;
          opacity: 1;
          color: hsl(38 45% 42%);
          font-weight: 300;
        }
        .hos-text-type__cursor--hidden { display: none; }
      \`}</style>
      {createElement(
        Component,
        { ref: containerRef, className: cn("hos-text-type", className), ...props },
        <span className="hos-text-type__content" style={{ color: getCurrentTextColor() || "inherit" }}>
          {displayedText}
        </span>,
        showCursor && !prefersReducedMotion ? (
          <span
            ref={cursorRef}
            className={cn(
              "hos-text-type__cursor",
              cursorClassName,
              shouldHideCursor && "hos-text-type__cursor--hidden",
            )}
          >
            {cursorCharacter}
          </span>
        ) : null,
      )}
    </>
  );
}`,
    description: "Typewriter that types, pauses and deletes a list of lines with a blinking cursor.",
    tags: ["typewriter", "gsap", "cursor-blink", "intersection-observer", "kinetic-text"],
  },
  {
    name: "CelebrationOverlay",
    slug: "celebration-overlay",
    path: "feedback/CelebrationOverlay.tsx",
    category: "feedback",
    code: `"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import confetti from "canvas-confetti";
import type {
  CreateTypes as ConfettiInstance,
  Options as ConfettiOptions,
  GlobalOptions as ConfettiGlobalOptions,
} from "canvas-confetti";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export type ConfettiApi = { fire: (options?: ConfettiOptions) => void };
export type ConfettiCanvasRef = ConfettiApi | null;

type ConfettiCanvasProps = React.ComponentPropsWithRef<"canvas"> & {
  options?: ConfettiOptions;
  globalOptions?: ConfettiGlobalOptions;
  manualstart?: boolean;
  children?: ReactNode;
};

const ConfettiCanvas = forwardRef<ConfettiCanvasRef, ConfettiCanvasProps>(
  ({ options, globalOptions = { resize: true, useWorker: true }, manualstart = false, children, ...rest }, ref) => {
    const instanceRef = useRef<ConfettiInstance | null>(null);

    const canvasRef = useCallback(
      (node: HTMLCanvasElement | null) => {
        if (node !== null) {
          if (instanceRef.current) return;
          instanceRef.current = confetti.create(node, { ...globalOptions, resize: true });
        } else if (instanceRef.current) {
          instanceRef.current.reset();
          instanceRef.current = null;
        }
      },
      [globalOptions],
    );

    const fire = useCallback(
      async (opts: ConfettiOptions = {}) => {
        await instanceRef.current?.({ ...options, ...opts });
      },
      [options],
    );

    const api = useMemo(() => ({ fire }), [fire]);
    useImperativeHandle(ref, () => api, [api]);

    useEffect(() => {
      if (!manualstart) void fire();
    }, [manualstart, fire]);

    return (
      <>
        <canvas ref={canvasRef} {...rest} />
        {children}
      </>
    );
  },
);
ConfettiCanvas.displayName = "ConfettiCanvas";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function burst(api: ConfettiCanvasRef, colors: string[]) {
  if (!api || prefersReducedMotion()) return;
  void api.fire({
    particleCount: 90,
    spread: 68,
    startVelocity: 44,
    origin: { x: 0.5, y: 0.58 },
    colors,
    disableForReducedMotion: true,
  });
  window.setTimeout(() => {
    void api.fire({
      particleCount: 55,
      angle: 62,
      spread: 54,
      origin: { x: 0.08, y: 0.68 },
      colors,
      disableForReducedMotion: true,
    });
  }, 160);
  window.setTimeout(() => {
    void api.fire({
      particleCount: 55,
      angle: 118,
      spread: 54,
      origin: { x: 0.92, y: 0.68 },
      colors,
      disableForReducedMotion: true,
    });
  }, 300);
}

export type CelebrationOverlayProps = {
  open?: boolean;
  title?: string;
  description?: string;
  ctaLabel?: string;
  colors?: string[];
  onContinue?: () => void;
  replayMs?: number; // 0 to disable interval replay
};

/** Full-screen blur overlay with choreographed triple confetti bursts + GSAP card pop. */
export function CelebrationOverlay({
  open = true,
  title = "You're all set",
  description = "Everything is submitted. We'll email you when there's an update.",
  ctaLabel = "Continue",
  colors = ["#912c22", "#b8483a", "#f5f0e8", "#6d2219", "#d4847a"],
  onContinue,
  replayMs = 3000,
}: CelebrationOverlayProps) {
  const confettiRef = useRef<ConfettiCanvasRef>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!open) return;
    burst(confettiRef.current, colors);
    if (!replayMs) return;
    const replay = window.setInterval(() => burst(confettiRef.current, colors), replayMs);
    return () => window.clearInterval(replay);
  }, [open, colors, replayMs]);

  useGSAP(
    () => {
      const card = cardRef.current;
      if (!card || !open) return;
      if (prefersReducedMotion()) {
        gsap.set(card, { autoAlpha: 1, y: 0, scale: 1 });
        return;
      }
      gsap.from(card, { autoAlpha: 0, y: 12, scale: 0.96, duration: 0.4, ease: "power3.out" });
      gsap.from(card.querySelector("[data-celebrate-check]"), {
        scale: 0.9,
        autoAlpha: 0,
        duration: 0.28,
        delay: 0.12,
        ease: "power3.out",
      });
    },
    { scope: rootRef, dependencies: [open] },
  );

  function handleContinue() {
    if (exiting) return;
    setExiting(true);
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) {
      onContinue?.();
      return;
    }
    gsap.to(root, {
      autoAlpha: 0,
      duration: 0.25,
      ease: "power2.out",
      onComplete: () => onContinue?.(),
    });
  }

  if (!open) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[110] flex h-dvh max-h-dvh items-center justify-center overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-overlay-title"
    >
      <div className="absolute inset-0 bg-neutral-50/90 backdrop-blur-md" />
      <ConfettiCanvas
        ref={confettiRef}
        manualstart
        className="pointer-events-none fixed inset-0 z-[1] h-full w-full"
        options={{ colors, disableForReducedMotion: true }}
      />
      <div className="relative z-10 mx-auto w-full max-w-md px-5 sm:px-6">
        <div
          ref={cardRef}
          className="rounded-2xl border border-neutral-200/90 bg-white/95 p-6 text-center shadow-lg backdrop-blur-sm sm:p-8"
        >
          <svg
            data-celebrate-check
            className="mx-auto h-12 w-12 text-amber-700 sm:h-14 sm:w-14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 12.5l2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h1 id="celebration-overlay-title" className="mt-4 text-2xl font-light tracking-tight text-neutral-900 sm:mt-5 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600 sm:text-base">{description}</p>
          <button
            type="button"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#912c22] px-5 py-2.5 text-sm font-semibold text-[#f7f3ee] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22] sm:mt-8 sm:w-auto"
            disabled={exiting}
            onClick={handleContinue}
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}`,
    description: "Blurred success dialog with three timed confetti bursts and a card that pops in.",
    tags: ["confetti", "gsap", "success", "overlay", "celebration", "canvas"],
  },
  {
    name: "DamaskTileBackdrop",
    slug: "damask-tile-backdrop",
    path: "layout/DamaskTileBackdrop.tsx",
    category: "layout",
    code: `"use client";

import type { CSSProperties, ReactNode } from "react";

export type DamaskTileBackdropProps = {
  /** Optional repeating tile image. If omitted, a CSS damask-like radial lattice is used. */
  tileSrc?: string;
  opacity?: number; // 0–1 pattern strength
  tileSize?: string; // CSS length, default 280px
  background?: string; // base wash color
  className?: string;
  style?: CSSProperties;
};

/** Fixed repeating ornamental tile under the whole viewport. */
export function DamaskTileBackdrop({
  tileSrc,
  opacity = 0.14,
  tileSize = "280px",
  background = "hsl(40 33% 97%)",
  className,
  style,
}: DamaskTileBackdropProps) {
  return (
    <>
      <style>{\`
        .damask-tile-backdrop {
          pointer-events: none;
          position: fixed;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          background-color: var(--dtb-bg);
        }
        .damask-tile-backdrop__pattern {
          position: absolute;
          inset: 0;
          opacity: var(--dtb-opacity);
          background-repeat: repeat;
          background-size: var(--dtb-size) var(--dtb-size);
          background-position: center;
        }
        .damask-tile-backdrop__pattern--css {
          background-image:
            radial-gradient(circle at 20% 20%, hsl(38 30% 55% / 0.22) 0 1px, transparent 1.5px),
            radial-gradient(circle at 80% 30%, hsl(5 35% 40% / 0.14) 0 1.2px, transparent 1.8px),
            radial-gradient(circle at 50% 70%, hsl(38 40% 50% / 0.18) 0 1.4px, transparent 2px),
            radial-gradient(hsl(38 20% 60% / 0.08) 1px, transparent 1px);
          background-size:
            calc(var(--dtb-size) * 0.5) calc(var(--dtb-size) * 0.5),
            calc(var(--dtb-size) * 0.66) calc(var(--dtb-size) * 0.66),
            var(--dtb-size) var(--dtb-size),
            calc(var(--dtb-size) * 0.22) calc(var(--dtb-size) * 0.22);
        }
        .damask-tile-backdrop__veil {
          position: absolute;
          inset: 0;
          background: color-mix(in srgb, var(--dtb-bg) 94%, transparent);
        }
      \`}</style>
      <div
        className={["damask-tile-backdrop", className].filter(Boolean).join(" ")}
        style={
          {
            ...style,
            ["--dtb-bg" as string]: background,
            ["--dtb-opacity" as string]: String(opacity),
            ["--dtb-size" as string]: tileSize,
          } as CSSProperties
        }
        aria-hidden
      >
        <div
          className={
            tileSrc
              ? "damask-tile-backdrop__pattern"
              : "damask-tile-backdrop__pattern damask-tile-backdrop__pattern--css"
          }
          style={tileSrc ? { backgroundImage: \`url(\${tileSrc})\` } : undefined}
        />
        <div className="damask-tile-backdrop__veil" />
      </div>
    </>
  );
}

export type TiledGlassSurfaceProps = {
  children: ReactNode;
  tileSrc?: string;
  opacity?: number;
  className?: string;
  style?: CSSProperties;
};

/** Local card/pane with the same tile + glass blur treatment. */
export function TiledGlassSurface({
  children,
  tileSrc,
  opacity = 0.12,
  className,
  style,
}: TiledGlassSurfaceProps) {
  return (
    <>
      <style>{\`
        .tiled-glass-surface {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          border-radius: 1rem;
          border: 1px solid hsl(40 12% 82% / 0.88);
          background: hsl(0 0% 100% / 0.55);
          backdrop-filter: blur(14px) saturate(1.05);
          -webkit-backdrop-filter: blur(14px) saturate(1.05);
          box-shadow:
            inset 0 1px 0 hsl(0 0% 100% / 0.42),
            0 10px 32px -14px hsl(60 4% 8% / 0.12);
        }
        .tiled-glass-surface__tile {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: var(--tgs-opacity, 0.12);
          background-repeat: repeat;
          background-size: 180px 180px;
        }
        .tiled-glass-surface__tile--css {
          background-image:
            radial-gradient(circle at 30% 30%, hsl(38 30% 55% / 0.2) 0 1px, transparent 1.5px),
            radial-gradient(hsl(38 20% 60% / 0.07) 1px, transparent 1px);
          background-size: 90px 90px, 28px 28px;
        }
        .tiled-glass-surface__content {
          position: relative;
          z-index: 1;
        }
      \`}</style>
      <div
        className={["tiled-glass-surface", className].filter(Boolean).join(" ")}
        style={{ ...style, ["--tgs-opacity" as string]: String(opacity) } as CSSProperties}
      >
        <div
          className={
            tileSrc
              ? "tiled-glass-surface__tile"
              : "tiled-glass-surface__tile tiled-glass-surface__tile--css"
          }
          style={tileSrc ? { backgroundImage: \`url(\${tileSrc})\` } : undefined}
          aria-hidden
        />
        <div className="tiled-glass-surface__content">{children}</div>
      </div>
    </>
  );
}`,
    description: "Fixed ornamental tile lattice behind the page, plus a matching tiled glass pane.",
    tags: ["pattern", "damask", "atmosphere", "glassmorphism", "backdrop"],
  },
  {
    name: "MorphDialog",
    slug: "morph-dialog",
    path: "dialogs/MorphDialog.tsx",
    category: "dialogs",
    code: `"use client";

import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type MutableRefObject,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

/*
 * MorphDialog: a modal that grows out of the control that opened it.
 *
 * The trigger's box is measured at the moment it is pressed. A fixed plate
 * covering the viewport is clipped to that box, then its clip-path is
 * transitioned to the panel's box, so the surface visibly travels from the
 * button to the dialog and back. Clip-path, unlike a scale, never distorts the
 * radius. The dialog content fades in over the plate once it is most of the
 * way there.
 *
 * Around the motion it is a complete modal: every other child of <body> is made
 * inert and hidden from assistive tech (and restored exactly as it was), focus
 * moves into the dialog and Tab / Shift+Tab wrap inside it, Escape closes unless
 * something inside owns that key, the page cannot scroll behind it, and focus
 * returns to the trigger.
 */

const CSS = \`
.bz-md{position:fixed;inset:0;z-index:90}
.bz-md-backdrop{position:absolute;inset:0;background:rgba(12,12,15,0.44);opacity:0;transition:opacity var(--bz-md-dur,500ms) var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-md[data-phase="open"] .bz-md-backdrop{opacity:1}
.bz-md[data-phase="closing"] .bz-md-backdrop{pointer-events:none;transition-duration:calc(var(--bz-md-dur,500ms) * 0.6)}
.bz-md-plate{position:fixed;inset:0;pointer-events:none;background-color:var(--bz-paper,#ffffff);transition:clip-path var(--bz-md-dur,500ms) var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)),background-color var(--bz-md-dur,500ms) var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1));will-change:clip-path}
.bz-md-panel{position:fixed;left:50%;top:50%;box-sizing:border-box;display:flex;flex-direction:column;width:min(var(--bz-md-width,520px),calc(100vw - 32px));max-height:calc(100vh - 32px);max-height:calc(100dvh - 32px);transform:translate(-50%,-50%);border:1px solid var(--bz-line-strong,rgba(10,10,10,0.13));border-radius:24px;color:var(--bz-ink,#0a0a0a);font-family:var(--bz-font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);opacity:0;pointer-events:none;outline:none;transition:opacity calc(var(--bz-md-dur,500ms) * 0.5) var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)) calc(var(--bz-md-dur,500ms) * 0.45)}
.bz-md-panel *,.bz-md-panel *::before,.bz-md-panel *::after{box-sizing:border-box}
.bz-md[data-phase="open"] .bz-md-panel{opacity:1;pointer-events:auto}
.bz-md[data-phase="closing"] .bz-md-panel{transition-duration:calc(var(--bz-md-dur,500ms) * 0.3);transition-delay:0s}
.bz-md-head{position:relative;padding:24px 72px 4px 24px}
.bz-md-title{margin:0;font-size:1.25rem;line-height:1.3;font-weight:600;letter-spacing:-0.01em}
.bz-md-desc{margin:6px 0 0;font-size:0.9375rem;line-height:1.55;color:var(--bz-ink-muted,#4a4a4c)}
.bz-md-body{padding:16px 24px 24px;overflow:auto;overscroll-behavior:contain}
.bz-md-close{position:absolute;top:12px;right:12px;display:grid;place-items:center;width:48px;height:48px;padding:0;border:0;border-radius:999px;background:transparent;color:var(--bz-ink,#0a0a0a);cursor:pointer;transition:background-color 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)),transform 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-md-close svg{width:20px;height:20px}
.bz-md-close:focus-visible{outline:2px solid var(--bz-focus-ring,#912c22);outline-offset:2px}
.bz-md-close:active{transform:scale(0.97)}
@media (hover:hover){.bz-md-close:hover{background:rgba(10,10,10,0.06)}}
@media (prefers-reduced-motion:reduce){
.bz-md-plate{transition:opacity 150ms ease}
.bz-md[data-phase="closing"] .bz-md-plate{opacity:0}
.bz-md-panel,.bz-md[data-phase="closing"] .bz-md-panel{transition:opacity 150ms ease;transition-delay:0s}
.bz-md-backdrop,.bz-md[data-phase="closing"] .bz-md-backdrop{transition-duration:150ms}
.bz-md-close{transition:none}
.bz-md-close:active{transform:none}
}
\`;

type Box = { top: number; left: number; width: number; height: number };
type Phase = "closed" | "opening" | "open" | "closing";
type Origin = { box: Box; radius: number; paint: string | null };

const PANEL_RADIUS = 24;

const RM_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(RM_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const readReducedMotion = () => window.matchMedia(RM_QUERY).matches;
const serverReducedMotion = () => false;

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const FOCUSABLE = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "audio[controls]",
  "video[controls]",
  "summary",
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex^="-"])',
].join(",");

const PICKER_TYPES = new Set(["date", "datetime-local", "month", "week", "time", "color", "file"]);

function boxOf(el: Element): Box {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function visibleBox(box: Box | null, vw: number, vh: number) {
  if (!box || box.width <= 0 || box.height <= 0) return null;
  if (box.top > vh || box.left > vw || box.top + box.height < 0 || box.left + box.width < 0) return null;
  return box;
}

function radiusOf(el: Element, box: Box) {
  const r = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
  return Math.min(r, box.width / 2, box.height / 2);
}

/** The trigger's own fill, so the plate leaves in the colour of the button. */
function paintOf(el: Element) {
  const bg = getComputedStyle(el).backgroundColor;
  const match = bg.match(/rgba?\\(([^)]+)\\)/);
  if (!match) return null;
  const parts = match[1].split(/[\\s,/]+/).filter(Boolean);
  const alpha = parts.length > 3 ? parseFloat(parts[3]) : 1;
  return alpha > 0.05 ? bg : null;
}

function reachable(el: HTMLElement) {
  if (el.closest("[inert]") || el.closest("fieldset[disabled]")) return false;
  return el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
}

/** Escape belongs to the dialog unless something inside already claimed it. */
function escapeIsOurs(event: KeyboardEvent) {
  if (event.defaultPrevented || event.isComposing || event.keyCode === 229) return false;
  const target = event.target;
  if (target instanceof HTMLSelectElement) return false;
  if (target instanceof HTMLInputElement && PICKER_TYPES.has(target.type)) return false;
  return true;
}

function insetFor(box: Box, vw: number, vh: number, radius: number) {
  const right = vw - box.left - box.width;
  const bottom = vh - box.top - box.height;
  return \`inset(\${box.top}px \${right}px \${bottom}px \${box.left}px round \${radius}px)\`;
}

function assignRef<T>(ref: Ref<T> | undefined, value: T) {
  if (typeof ref === "function") ref(value);
  else if (ref && typeof ref === "object") (ref as MutableRefObject<T>).current = value;
}

export type MorphDialogProps = {
  /** The control that opens the dialog. It keeps its own click handler and gets \`aria-haspopup\` and \`aria-expanded\`. */
  trigger: ReactElement;
  title: ReactNode;
  description?: ReactNode;
  /** Dialog content, or a function that receives \`close\`. */
  children?: ReactNode | ((close: () => void) => ReactNode);
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Where focus lands when the dialog opens. Defaults to the dialog itself, so its title is read first. */
  initialFocus?: RefObject<HTMLElement>;
  /** Panel width in CSS pixels. */
  maxWidth?: number;
  /** Morph duration in milliseconds. */
  duration?: number;
  closeLabel?: string;
  className?: string;
};

export function MorphDialog({
  trigger,
  title,
  description,
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  initialFocus,
  maxWidth = 520,
  duration = 500,
  closeLabel = "Close",
  className = "",
}: MorphDialogProps) {
  const reduced = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, serverReducedMotion);
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const isOpen = open ?? innerOpen;
  const [phase, setPhase] = useState<Phase>("closed");
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [target, setTarget] = useState<Box | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [host, setHost] = useState<HTMLElement | null>(null);

  const triggerRef = useRef<HTMLElement | null>(null);
  const pressedRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropPress = useRef(false);

  const uid = useId().replace(/:/g, "");
  const dialogId = \`\${uid}-dialog\`;
  const titleId = \`\${uid}-title\`;
  const descId = \`\${uid}-desc\`;

  const setOpen = useCallback(
    (next: boolean) => {
      if (open === undefined) setInnerOpen(next);
      onOpenChange?.(next);
    },
    [open, onOpenChange],
  );
  const close = useCallback(() => setOpen(false), [setOpen]);
  const closeRef = useRef(close);
  closeRef.current = close;
  const focusRef = useRef(initialFocus);
  focusRef.current = initialFocus;

  // Derive the phase during render, so no frame paints in the wrong one.
  if (isOpen && (phase === "closed" || phase === "closing")) setPhase("opening");
  if (!isOpen && (phase === "opening" || phase === "open")) setPhase("closing");

  const mounted = phase !== "closed";

  useIsoLayoutEffect(() => {
    if (!mounted) return;
    const el = document.createElement("div");
    document.body.appendChild(el);
    setHost(el);
    return () => {
      el.remove();
      setHost(null);
    };
  }, [mounted]);

  // Measure where the surface leaves from: the pressed control, else the trigger.
  useIsoLayoutEffect(() => {
    if (phase !== "opening" && phase !== "closing") return;
    const el = pressedRef.current ?? triggerRef.current;
    if (!el || !el.isConnected) {
      if (phase === "opening") setOrigin(null);
      return;
    }
    const box = boxOf(el);
    setOrigin((prev) => ({ box, radius: radiusOf(el, box), paint: phase === "closing" ? prev?.paint ?? paintOf(el) : paintOf(el) }));
  }, [phase]);

  // Measure where it lands: the panel, kept current while it is open.
  useIsoLayoutEffect(() => {
    const panel = panelRef.current;
    if (!host || !panel) return;
    const measure = () => {
      setViewport({ w: document.documentElement.clientWidth, h: window.innerHeight });
      setTarget(boxOf(panel));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(panel);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [host]);

  useEffect(() => {
    if (phase !== "opening" || !target) return;
    if (reduced) {
      setPhase("open");
      return;
    }
    // One committed frame at the trigger, so the clip has somewhere to travel from.
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => setPhase("open"));
    });
    return () => cancelAnimationFrame(raf);
  }, [phase, target, reduced]);

  useEffect(() => {
    if (phase !== "closing") return;
    const timer = window.setTimeout(() => {
      setPhase("closed");
      setTarget(null);
    }, reduced ? 160 : duration);
    return () => window.clearTimeout(timer);
  }, [phase, reduced, duration]);

  const active = host !== null && (phase === "opening" || phase === "open");

  useEffect(() => {
    if (!active || !host) return;
    const html = document.documentElement;
    const body = document.body;
    const saved = {
      overflow: html.style.overflow,
      gutter: html.style.scrollbarGutter,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };
    const scrollY = window.scrollY;
    const hasScrollbar = window.innerWidth - html.clientWidth > 0;
    const pinBody = window.matchMedia("(pointer: coarse)").matches;
    if (hasScrollbar) html.style.scrollbarGutter = "stable";
    html.style.overflow = "hidden";
    if (pinBody) {
      body.style.position = "fixed";
      body.style.top = \`\${-scrollY}px\`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
    }

    const touched: Array<{ el: Element; ariaHidden: string | null }> = [];
    for (const el of Array.from(body.children)) {
      if (el === host || el.hasAttribute("inert") || el.tagName === "SCRIPT" || el.tagName === "STYLE") continue;
      touched.push({ el, ariaHidden: el.getAttribute("aria-hidden") });
      el.setAttribute("inert", "");
      el.setAttribute("aria-hidden", "true");
    }

    const returnTo = triggerRef.current ?? (document.activeElement as HTMLElement | null);
    (focusRef.current?.current ?? panelRef.current)?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      const panel = panelRef.current;
      if (!panel) return;
      if (event.key === "Escape") {
        if (escapeIsOurs(event)) {
          event.preventDefault();
          closeRef.current();
        }
        return;
      }
      if (event.key !== "Tab") return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(reachable);
      if (!items.length) {
        event.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (!current || !panel.contains(current)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && (current === first || current === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Inert first: focus inside an inert tree is ignored.
      for (const { el, ariaHidden } of touched) {
        el.removeAttribute("inert");
        if (ariaHidden === null) el.removeAttribute("aria-hidden");
        else el.setAttribute("aria-hidden", ariaHidden);
      }
      html.style.overflow = saved.overflow;
      html.style.scrollbarGutter = saved.gutter;
      if (pinBody) {
        body.style.position = saved.position;
        body.style.top = saved.top;
        body.style.left = saved.left;
        body.style.right = saved.right;
        body.style.width = saved.width;
        window.scrollTo({ top: scrollY, left: 0, behavior: "instant" as ScrollBehavior });
      }
      if (returnTo && returnTo.isConnected) returnTo.focus({ preventScroll: true });
    };
  }, [active, host]);

  const triggerElement = trigger as ReactElement<Record<string, unknown>> & { ref?: Ref<HTMLElement> };
  const ownClick = isValidElement(trigger)
    ? (triggerElement.props.onClick as ((event: ReactMouseEvent<HTMLElement>) => void) | undefined)
    : undefined;

  const renderedTrigger = isValidElement(trigger)
    ? cloneElement(triggerElement, {
        ref: (node: HTMLElement | null) => {
          triggerRef.current = node;
          assignRef(triggerElement.ref, node);
        },
        onClick: (event: ReactMouseEvent<HTMLElement>) => {
          ownClick?.(event);
          if (event.defaultPrevented) return;
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          pressedRef.current = event.currentTarget;
          setOpen(true);
        },
        "aria-haspopup": "dialog",
        "aria-expanded": isOpen,
        "aria-controls": isOpen ? dialogId : undefined,
      })
    : trigger;

  const { w: vw, h: vh } = viewport;
  const settled = phase === "open" || reduced;
  const from = visibleBox(origin?.box ?? null, vw, vh);
  const centre = target
    ? { top: target.top + target.height / 2, left: target.left + target.width / 2, width: 0, height: 0 }
    : null;
  const shown = settled ? target : from ?? centre;
  const radius = settled || !from ? PANEL_RADIUS : origin?.radius ?? PANEL_RADIUS;
  const plateStyle: CSSProperties =
    shown && vw
      ? {
          clipPath: insetFor(shown, vw, vh, radius),
          backgroundColor: settled ? undefined : origin?.paint ?? undefined,
        }
      : { visibility: "hidden" };

  const content = typeof children === "function" ? (children as (close: () => void) => ReactNode)(close) : children;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {renderedTrigger}
      {host && mounted
        ? createPortal(
            <div
              className="bz-md"
              data-phase={phase}
              style={{ ["--bz-md-dur" as string]: \`\${duration}ms\` } as CSSProperties}
            >
              <div
                className="bz-md-backdrop"
                aria-hidden="true"
                onPointerDown={(event) => {
                  backdropPress.current = event.target === event.currentTarget;
                }}
                onClick={(event) => {
                  if (backdropPress.current && event.target === event.currentTarget) close();
                  backdropPress.current = false;
                }}
              />
              <div className="bz-md-plate" aria-hidden="true" style={plateStyle} />
              <div
                ref={panelRef}
                id={dialogId}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={description ? descId : undefined}
                tabIndex={-1}
                className={\`bz-md-panel \${className}\`.trim()}
                style={{ ["--bz-md-width" as string]: \`\${maxWidth}px\` } as CSSProperties}
              >
                <div className="bz-md-head">
                  <h2 id={titleId} className="bz-md-title">
                    {title}
                  </h2>
                  {description ? (
                    <p id={descId} className="bz-md-desc">
                      {description}
                    </p>
                  ) : null}
                  <button type="button" className="bz-md-close" aria-label={closeLabel} onClick={close}>
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <div className="bz-md-body">{content}</div>
              </div>
            </div>,
            host,
          )
        : null}
    </>
  );
}`,
    description: "Modal that grows out of its trigger and traps focus until it closes.",
    tags: ["dialog", "modal", "focus-trap", "morph", "accessible", "clip-path"],
  },
  {
    name: "ParticleQrCode",
    slug: "particle-qr-code",
    path: "display/ParticleQrCode.tsx",
    category: "display",
    code: `"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";

/*
 * ParticleQrCode: a real, scannable QR code that assembles itself.
 *
 * The symbol is encoded here, with no dependency, so the code on screen always
 * decodes to \`value\`. When it scrolls into view each dark module flies in from a
 * point under the code as a small cloud of grains that tighten onto the grid as
 * they land. Change \`value\` and the code dissolves back the way it came, swaps
 * while nothing is on screen, and assembles again.
 *
 * The whole animation is one clock running forwards or backwards, so leaving is
 * the arrival reversed and a change mid-flight retargets rather than restarts.
 * A still SVG of the same code sits underneath for no-JS and for the moment
 * before the canvas takes over. Reduced motion gets a short fade instead.
 *
 * Give it a list and it takes turns: each code holds, fully assembled, for
 * \`hold\` milliseconds, then scatters and re-forms as the next, forever. A
 * visible Pause and Next sit beside it, with a hairline that fills while the
 * code holds; that fill is the timer, so one paused animation stops both. It
 * holds while the pointer is over it, while focus is inside, off screen and in
 * a hidden tab. All codes in a list share the largest version among them, so
 * the square keeps its footprint from one to the next. Automatic changes are
 * not announced; the image's name and the caption change with the code, and a
 * press of Next is announced once. Reduced motion starts paused and fades
 * between codes; Next still works, and Play opts back in to taking turns.
 */

const CSS = \`
.bz-qr{position:relative;display:inline-block;flex:none;vertical-align:middle;width:var(--bz-qr-size,240px);height:var(--bz-qr-size,240px);border-radius:var(--bz-radius-xl,16px);background:var(--bz-paper,#ffffff);color:var(--bz-ink,#0a0a0a)}
.bz-qr-set{display:inline-flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:16px 20px;max-width:100%;vertical-align:middle;color:var(--bz-ink,#0a0a0a);font-family:var(--bz-font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif)}
.bz-qr-side{display:flex;flex-direction:column;align-items:flex-start;gap:10px;min-width:0;width:12rem;max-width:100%}
.bz-qr-caption{margin:0;font-size:0.9375rem;font-weight:600;line-height:1.35;letter-spacing:-0.01em;color:var(--bz-ink,#0a0a0a);overflow-wrap:anywhere}
.bz-qr-count{margin:0;font:500 0.75rem/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:var(--bz-ink-muted,#4a4a4c);font-variant-numeric:tabular-nums}
.bz-qr-groove{position:relative;width:100%;height:3px;overflow:hidden;border-radius:999px;background:rgba(10,10,10,0.1)}
.bz-qr-fill{display:block;width:100%;height:100%;background:var(--bz-accent,#912c22);transform:scaleX(0);transform-origin:left center;animation:bz-qr-hold var(--bz-qr-hold,4500ms) linear forwards}
@keyframes bz-qr-hold{to{transform:scaleX(1)}}
.bz-qr-set[data-running="false"] .bz-qr-fill{animation-play-state:paused}
.bz-qr-set[data-playing="false"] .bz-qr-fill{opacity:0.4}
.bz-qr-controls{display:flex;flex-wrap:wrap;gap:8px}
.bz-qr-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-width:48px;min-height:48px;margin:0;padding:0 16px 0 14px;border:1px solid #8a8a8f;border-radius:999px;background:var(--bz-paper,#ffffff);color:var(--bz-ink,#0a0a0a);font:inherit;font-size:0.875rem;font-weight:600;line-height:1;cursor:pointer;transition:background-color 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)),border-color 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)),transform 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-qr-button svg{flex:none;width:14px;height:14px}
.bz-qr-button:focus-visible{outline:2px solid var(--bz-focus-ring,#912c22);outline-offset:2px}
.bz-qr-button:active{transform:scale(0.97)}
@media (hover:hover){.bz-qr-button:hover{background:var(--bz-paper-raised,#f7f3ee);border-color:var(--bz-ink,#0a0a0a)}}
@media (prefers-reduced-motion:reduce){.bz-qr-button{transition:none}.bz-qr-button:active{transform:none}}
.bz-qr-still,.bz-qr-canvas{position:absolute;inset:0;display:block;width:100%;height:100%}
.bz-qr[data-canvas] .bz-qr-still{visibility:hidden}
.bz-qr-canvas{pointer-events:none}
.bz-qr-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
.bz-qr-error{margin:8px 0 0;font:500 0.875rem/1.5 var(--bz-font-sans,ui-sans-serif,system-ui,sans-serif);color:var(--bz-danger,#b91c1c)}
\`;

/* ---------------------------------------------------------- encoding */

export type QrLevel = "L" | "M" | "Q" | "H";

type QrMatrix = { modules: Uint8Array[]; size: number; version: number };

const ALPHANUMERIC = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

/** [error-correction codewords per block, blocks, data codewords per block] for versions 1 to 4. */
const BLOCKS: Record<QrLevel, ReadonlyArray<readonly [number, number, number]>> = {
  L: [[7, 1, 19], [10, 1, 34], [15, 1, 55], [20, 1, 80]],
  M: [[10, 1, 16], [16, 1, 28], [26, 1, 44], [18, 2, 32]],
  Q: [[13, 1, 13], [22, 1, 22], [18, 2, 17], [26, 2, 24]],
  H: [[17, 1, 9], [28, 1, 16], [22, 2, 13], [16, 4, 9]],
};

const LEVEL_BITS: Record<QrLevel, number> = { L: 1, M: 0, Q: 3, H: 2 };

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
}

const gfMultiply = (a: number, b: number) => (a && b ? GF_EXP[GF_LOG[a] + GF_LOG[b]] : 0);

function errorCorrection(data: number[], degree: number) {
  let generator = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array<number>(generator.length + 1).fill(0);
    for (let j = 0; j < generator.length; j++) {
      next[j] ^= generator[j];
      next[j + 1] ^= gfMultiply(generator[j], GF_EXP[i]);
    }
    generator = next;
  }
  const out = new Array<number>(degree).fill(0);
  for (const byte of data) {
    const factor = byte ^ (out.shift() as number);
    out.push(0);
    for (let i = 0; i < degree; i++) out[i] ^= gfMultiply(generator[i + 1], factor);
  }
  return out;
}

const pushBits = (bits: number[], value: number, length: number) => {
  for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
};

const MASKS: Array<(row: number, col: number) => boolean> = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function formatBits(level: QrLevel, mask: number) {
  const data = (LEVEL_BITS[level] << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  return ((data << 10) | rem) ^ 0x5412;
}

function penalty(m: Uint8Array[]) {
  const n = m.length;
  let score = 0;
  for (let i = 0; i < n; i++) {
    let row = 1;
    let col = 1;
    for (let j = 1; j < n; j++) {
      if (m[i][j] === m[i][j - 1]) row++;
      else {
        if (row >= 5) score += row - 2;
        row = 1;
      }
      if (m[j][i] === m[j - 1][i]) col++;
      else {
        if (col >= 5) score += col - 2;
        col = 1;
      }
    }
    if (row >= 5) score += row - 2;
    if (col >= 5) score += col - 2;
  }
  for (let r = 0; r + 1 < n; r++) {
    for (let c = 0; c + 1 < n; c++) {
      const v = m[r][c];
      if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) score += 3;
    }
  }
  const finderA = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const finderB = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j + 11 <= n; j++) {
      let ra = true;
      let rb = true;
      let ca = true;
      let cb = true;
      for (let k = 0; k < 11; k++) {
        if (m[i][j + k] !== finderA[k]) ra = false;
        if (m[i][j + k] !== finderB[k]) rb = false;
        if (m[j + k][i] !== finderA[k]) ca = false;
        if (m[j + k][i] !== finderB[k]) cb = false;
      }
      score += 40 * (Number(ra) + Number(rb) + Number(ca) + Number(cb));
    }
  }
  let dark = 0;
  for (const row of m) for (const v of row) dark += v;
  score += Math.floor(Math.abs((dark * 100) / (n * n) - 50) / 5) * 10;
  return score;
}

/**
 * Encode \`text\` as a version 1 to 4 symbol. Throws when it does not fit.
 * \`minVersion\` pads a short value up to a larger grid, so codes shown in turn can share one footprint.
 */
export function buildQrSymbol(text: string, level: QrLevel = "M", minVersion = 1): QrMatrix {
  const alphanumeric = [...text].every((ch) => ALPHANUMERIC.includes(ch));
  const bytes = alphanumeric ? null : new TextEncoder().encode(text);
  const payload = bytes ? bytes.length * 8 : 11 * Math.floor(text.length / 2) + 6 * (text.length % 2);
  const needed = 4 + (bytes ? 8 : 9) + payload;
  let version = 0;
  for (let v = Math.max(1, Math.min(4, Math.floor(minVersion))); v <= 4; v++) {
    const [, blocks, perBlock] = BLOCKS[level][v - 1];
    if (needed <= blocks * perBlock * 8) {
      version = v;
      break;
    }
  }
  if (!version) throw new Error(\`ParticleQrCode: the value does not fit a version 4 code at level \${level}.\`);

  const [ecPerBlock, blockCount, dataPerBlock] = BLOCKS[level][version - 1];
  const capacity = blockCount * dataPerBlock * 8;
  const bits: number[] = [];
  if (bytes) {
    pushBits(bits, 0b0100, 4);
    pushBits(bits, bytes.length, 8);
    for (const b of bytes) pushBits(bits, b, 8);
  } else {
    pushBits(bits, 0b0010, 4);
    pushBits(bits, text.length, 9);
    for (let i = 0; i + 1 < text.length; i += 2) {
      pushBits(bits, ALPHANUMERIC.indexOf(text[i]) * 45 + ALPHANUMERIC.indexOf(text[i + 1]), 11);
    }
    if (text.length % 2) pushBits(bits, ALPHANUMERIC.indexOf(text[text.length - 1]), 6);
  }
  pushBits(bits, 0, Math.min(4, capacity - bits.length));
  while (bits.length % 8) bits.push(0);
  for (let i = 0; bits.length < capacity; i++) pushBits(bits, i % 2 ? 0x11 : 0xec, 8);

  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    codewords.push(byte);
  }
  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];
  for (let b = 0; b < blockCount; b++) {
    const block = codewords.slice(b * dataPerBlock, (b + 1) * dataPerBlock);
    dataBlocks.push(block);
    ecBlocks.push(errorCorrection(block, ecPerBlock));
  }
  const stream: number[] = [];
  for (let i = 0; i < dataPerBlock; i++) for (const block of dataBlocks) pushBits(stream, block[i], 8);
  for (let i = 0; i < ecPerBlock; i++) for (const block of ecBlocks) pushBits(stream, block[i], 8);
  if (version > 1) for (let i = 0; i < 7; i++) stream.push(0);

  const n = 17 + 4 * version;
  let best: Uint8Array[] | null = null;
  let bestScore = Infinity;

  for (let mask = 0; mask < 8; mask++) {
    const m = Array.from({ length: n }, () => new Uint8Array(n));
    const fixed = Array.from({ length: n }, () => new Uint8Array(n));
    const put = (r: number, c: number, dark: boolean) => {
      if (r < 0 || c < 0 || r >= n || c >= n) return;
      m[r][c] = dark ? 1 : 0;
      fixed[r][c] = 1;
    };
    for (let i = 0; i < n; i++) {
      put(6, i, i % 2 === 0);
      put(i, 6, i % 2 === 0);
    }
    for (const [r0, c0] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
      for (let dy = -1; dy <= 7; dy++) {
        for (let dx = -1; dx <= 7; dx++) {
          const inside = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6;
          const ring = dx === 0 || dx === 6 || dy === 0 || dy === 6;
          const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
          put(r0 + dy, c0 + dx, inside && (ring || core));
        }
      }
    }
    if (version > 1) {
      const centre = 4 * version + 10;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) put(centre + dy, centre + dx, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
    // Reserve the format cells, leaving the two timing modules they cross alone.
    for (let i = 0; i <= 8; i++) {
      if (i !== 6) {
        put(8, i, false);
        put(i, 8, false);
      }
    }
    for (let i = 0; i < 8; i++) {
      put(8, n - 1 - i, false);
      put(n - 1 - i, 8, false);
    }
    put(n - 8, 8, true);

    let index = 0;
    for (let right = n - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      const upward = ((right + 1) & 2) === 0;
      for (let step = 0; step < n; step++) {
        const row = upward ? n - 1 - step : step;
        for (let side = 0; side < 2; side++) {
          const col = right - side;
          if (fixed[row][col]) continue;
          const bit = index < stream.length ? stream[index] : 0;
          index++;
          m[row][col] = bit ^ (MASKS[mask](row, col) ? 1 : 0);
        }
      }
    }

    const format = formatBits(level, mask);
    const bit = (i: number) => (format >>> i) & 1;
    for (let i = 0; i <= 5; i++) m[i][8] = bit(i);
    m[7][8] = bit(6);
    m[8][8] = bit(7);
    m[8][7] = bit(8);
    for (let i = 9; i < 15; i++) m[8][14 - i] = bit(i);
    for (let i = 0; i < 8; i++) m[8][n - 1 - i] = bit(i);
    for (let i = 8; i < 15; i++) m[n - 15 + i][8] = bit(i);
    m[n - 8][8] = 1;

    const score = penalty(m);
    if (score < bestScore) {
      bestScore = score;
      best = m;
    }
  }

  return { modules: best as Uint8Array[], size: n, version };
}

/* ------------------------------------------------------------ drawing */

const FLIGHT = 800;
const SPREAD = 600;
const TOTAL = SPREAD + FLIGHT;
const EXIT_RATE = 1.7;
const FADE = 150;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 5);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Where the code sits in its square, in CSS pixels. Shared by the still and the canvas. */
function geometry(size: number, n: number) {
  const module = Math.max(2, Math.floor((size * 0.74) / n));
  const code = module * n;
  return { module, left: Math.round((size - code) / 2), top: Math.round((size - code) * 0.32) };
}

type Mark = { tx: number; ty: number; dx: number; dy: number; angle: number; start: number; grains: Float32Array; reach: number };

type EngineConfig = {
  size: number;
  mode: "dust" | "beam";
  reduced: boolean;
  modules: Uint8Array[] | null;
  /** Called with the grid once it is fully assembled and nothing else is queued. */
  onSettled: (grid: Uint8Array[]) => void;
};

type Engine = {
  start: () => void;
  swap: () => void;
  rebuild: () => void;
  motionChanged: () => void;
  destroy: () => void;
};

function createEngine(root: HTMLElement, canvas: HTMLCanvasElement, config: () => EngineConfig): Engine | null {
  const context = canvas.getContext("2d");
  if (!context) return null;
  const ctx = context;

  let grid = config().modules;
  let pending: Uint8Array[] | null | undefined;
  let clock = 0;
  let open = false;
  let started = false;
  let dead = false;
  let raf = 0;
  let prev = 0;
  let wasReduced = config().reduced;
  let marks: Mark[] = [];
  let cell = 4;
  let grain = 1;
  let lx = 0;
  let ly = 0;
  let ink = "#0a0a0a";
  let dpr = 1;

  const span = () => (config().reduced ? FADE : TOTAL);

  function paint() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = ink;
    const half = cell / 2;
    if (config().reduced) {
      const a = clamp01(clock / FADE);
      if (a <= 0) return;
      ctx.globalAlpha = a;
      for (const m of marks) ctx.fillRect(m.tx - half, m.ty - half, cell, cell);
      ctx.globalAlpha = 1;
      return;
    }
    const mode = config().mode;
    for (const m of marks) {
      const t = clamp01((clock - m.start) / FLIGHT);
      if (t <= 0) continue;
      if (t >= 1) {
        ctx.globalAlpha = 1;
        ctx.fillRect(m.tx - half, m.ty - half, cell, cell);
        continue;
      }
      const e = easeOut(t);
      const k = Math.pow(1 - t, 4);
      const x = lx + m.dx * e;
      const y = ly + m.dy * e;
      ctx.globalAlpha = t < 0.2 ? t / 0.2 : 1;
      if (mode === "beam") {
        const stretch = 1 + 7 * k;
        const squash = 1 - 0.55 * k;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(m.angle * Math.min(1, k * 5));
        ctx.fillRect((-cell * stretch) / 2, (-cell * squash) / 2, cell * stretch, cell * squash);
        ctx.restore();
        continue;
      }
      const scatter = 1 - e;
      if (scatter * m.reach < 0.6) {
        ctx.fillRect(x - half, y - half, cell, cell);
        continue;
      }
      const g = m.grains;
      for (let i = 0; i < g.length; i += 4) ctx.fillRect(x + g[i] + g[i + 2] * scatter, y + g[i + 1] + g[i + 3] * scatter, grain, grain);
    }
    ctx.globalAlpha = 1;
  }

  function rebuild() {
    if (dead) return;
    const { size, mode } = config();
    dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const px = Math.round(size * dpr);
    if (canvas.width !== px || canvas.height !== px) {
      canvas.width = px;
      canvas.height = px;
    }
    ink = getComputedStyle(root).color || ink;
    marks = [];
    if (!grid) {
      paint();
      return;
    }
    const n = grid.length;
    const g = geometry(size, n);
    cell = Math.max(2, Math.round(g.module * dpr));
    const ox = Math.round(g.left * dpr);
    const oy = Math.round(g.top * dpr);
    // The largest grain that tiles a module exactly, at five grains a side at most.
    const smallest = Math.max(Math.round(dpr), Math.ceil(cell / 5));
    grain = cell;
    for (let s = smallest; s <= cell; s++) {
      if (cell % s === 0) {
        grain = s;
        break;
      }
    }
    const perSide = cell / grain;
    lx = Math.round(px / 2);
    ly = px - Math.round(2 * dpr);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (!grid[y][x]) continue;
        const tx = ox + x * cell + cell / 2;
        const ty = oy + y * cell + cell / 2;
        marks.push({ tx, ty, dx: tx - lx, dy: ty - ly, angle: Math.atan2(ty - ly, tx - lx), start: 0, grains: new Float32Array(0), reach: 0 });
      }
    }
    // Nearest modules land first, so the code grows up out of the launch point.
    marks.sort((a, b) => Math.hypot(a.dx, a.dy) - Math.hypot(b.dx, b.dy));
    const last = Math.max(1, marks.length - 1);
    marks.forEach((m, i) => {
      m.start = (SPREAD * i) / last;
    });
    if (mode === "dust") {
      const rand = seeded(0x2f6b1d ^ n);
      const reach = cell * 4;
      for (const m of marks) {
        const grains = new Float32Array(perSide * perSide * 4);
        let k = 0;
        let far = 0;
        for (let gy = 0; gy < perSide; gy++) {
          for (let gx = 0; gx < perSide; gx++) {
            grains[k++] = -cell / 2 + gx * grain;
            grains[k++] = -cell / 2 + gy * grain;
            const spread = reach * (0.4 + rand() * 0.6);
            const theta = rand() * Math.PI * 2;
            const along = rand() * reach - reach * 0.25;
            const sx = Math.cos(theta) * spread + Math.cos(m.angle) * along;
            const sy = Math.sin(theta) * spread + Math.sin(m.angle) * along;
            grains[k++] = sx;
            grains[k++] = sy;
            far = Math.max(far, Math.hypot(sx, sy));
          }
        }
        m.grains = grains;
        m.reach = far;
      }
    }
    paint();
  }

  function onPark(atOpen: boolean) {
    if (atOpen) {
      if (pending !== undefined) {
        open = false;
        run();
      } else if (grid) {
        config().onSettled(grid);
      }
      return;
    }
    if (pending !== undefined) {
      grid = pending;
      pending = undefined;
      rebuild();
    }
    if (grid) {
      open = true;
      run();
    }
  }

  // Park on the signed step, never on the flag, so a change mid-run retargets.
  function frame(now: number) {
    if (dead) return;
    const dt = Math.max(0, Math.min(64, now - prev));
    prev = now;
    const s = span();
    const step = dt * (open ? 1 : -EXIT_RATE);
    clock = Math.max(0, Math.min(s, clock + step));
    const parked = (step > 0 && clock >= s) || (step < 0 && clock <= 0);
    paint();
    if (parked) {
      raf = 0;
      onPark(open);
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function run() {
    if (dead || raf) return;
    prev = performance.now();
    raf = requestAnimationFrame(frame);
  }

  const onResize = () => {
    if (Math.max(1, Math.min(3, window.devicePixelRatio || 1)) !== dpr) rebuild();
  };
  window.addEventListener("resize", onResize);

  rebuild();

  return {
    start() {
      if (started || dead) return;
      started = true;
      root.dataset.canvas = "on";
      if (grid) {
        open = true;
        run();
      }
    },
    swap() {
      const next = config().modules;
      if (!started) {
        grid = next;
        rebuild();
        return;
      }
      pending = next;
      if (open) {
        open = false;
        run();
      } else if (!raf) {
        onPark(false);
      }
    },
    rebuild,
    motionChanged() {
      const was = wasReduced ? FADE : TOTAL;
      const reduced = config().reduced;
      clock = (clock / was) * (reduced ? FADE : TOTAL);
      wasReduced = reduced;
      paint();
      if (started) run();
    },
    destroy() {
      dead = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      window.removeEventListener("resize", onResize);
    },
  };
}

/* ---------------------------------------------------------- component */

const RM_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(RM_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const readReducedMotion = () => window.matchMedia(RM_QUERY).matches;
const serverReducedMotion = () => false;

/** One code in a list: what it decodes to, its accessible name and a visible caption. */
export type ParticleQrItem = {
  value: string;
  /** Accessible name. Say where scanning goes. Defaults to the caption when it is a string, else the value. */
  label?: string;
  /** Shown beside the code and changed with it. */
  caption?: ReactNode;
};

export type ParticleQrCodeProps = {
  /**
   * What the code decodes to. A list takes turns, one code at a time. Each value fits up to 62 bytes of
   * text, or 90 characters from the QR alphanumeric set, at level M.
   */
  value: string | ReadonlyArray<string | ParticleQrItem>;
  /** Width and height of the code in CSS pixels. */
  size?: number;
  /** Accessible name of a single code. Say what scanning the code does. List entries carry their own. */
  label?: string;
  /** Error correction: L, M, Q or H. */
  level?: QrLevel;
  /** A cloud of grains per module, or a streak. */
  mode?: "dust" | "beam";
  /** Assemble when a quarter of it is in view, or as soon as it mounts. */
  play?: "view" | "mount";
  /** With a list: how long each code rests, fully assembled, before the next, in milliseconds. */
  hold?: number;
  /** With a list: take turns on their own. Reduced motion starts paused either way. */
  autoPlay?: boolean;
  /** With a list: called with the index of the code now showing. */
  onChange?: (index: number) => void;
  /** Applied to the outermost element. */
  className?: string;
};

const toItem = (entry: string | ParticleQrItem): ParticleQrItem => (typeof entry === "string" ? { value: entry } : entry);

export function ParticleQrCode({
  value,
  size = 240,
  label,
  level = "M",
  mode = "dust",
  play = "view",
  hold = 4500,
  autoPlay = true,
  onChange,
  className = "",
}: ParticleQrCodeProps) {
  const reduced = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, serverReducedMotion);
  const listed = typeof value !== "string";
  const items = listed ? (value as ReadonlyArray<string | ParticleQrItem>).map(toItem) : [{ value: value as string }];
  const count = items.length;
  const valuesKey = items.map((item) => item.value).join("\\n");

  const [active, setActive] = useState(0);
  const index = count ? Math.min(active, count - 1) : 0;
  const item: ParticleQrItem = items[index] ?? { value: "" };

  // Every code in a list is drawn at the largest version any of them needs.
  const minVersion = useMemo(() => {
    if (!listed) return 1;
    let version = 1;
    for (const v of valuesKey.split("\\n")) {
      try {
        version = Math.max(version, buildQrSymbol(v, level).version);
      } catch {
        // A value that does not fit is reported when it comes round.
      }
    }
    return version;
  }, [listed, valuesKey, level]);

  const symbol = useMemo(() => {
    try {
      return buildQrSymbol(item.value, level, minVersion);
    } catch {
      return null;
    }
  }, [item.value, level, minVersion]);

  const [settledGrid, setSettledGrid] = useState<Uint8Array[] | null>(null);
  const settled = Boolean(symbol) && settledGrid === symbol?.modules;

  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const configRef = useRef<EngineConfig>({ size, mode, reduced, modules: symbol?.modules ?? null, onSettled: setSettledGrid });
  configRef.current = { size, mode, reduced, modules: symbol?.modules ?? null, onSettled: setSettledGrid };
  const playRef = useRef(play);
  playRef.current = play;
  const [announcement, setAnnouncement] = useState("");
  const firstValue = useRef(true);
  const manualChange = useRef(false);

  const [playPref, setPlayPref] = useState<boolean | null>(null);
  const [inView, setInView] = useState(true);
  const [backgrounded, setBackgrounded] = useState(false);
  const [pointerOver, setPointerOver] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const cycling = listed && count > 1;
  const playing = cycling && (playPref ?? (autoPlay && !reduced));
  const running = playing && inView && !backgrounded && !pointerOver && !focusInside;

  const fallbackName = item.caption && typeof item.caption === "string" ? \`QR code: \${item.caption}\` : \`QR code for \${item.value}\`;
  const name = item.label ?? (listed ? undefined : label) ?? fallbackName;

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const engine = createEngine(root, canvas, () => configRef.current);
    if (!engine) return;
    engineRef.current = engine;
    let io: IntersectionObserver | null = null;
    if (!("IntersectionObserver" in window)) {
      engine.start();
    } else {
      if (playRef.current === "mount") engine.start();
      io = new IntersectionObserver(
        (entries) => {
          const entry = entries[entries.length - 1];
          setInView(entry.isIntersecting);
          if (entry.isIntersecting && entry.intersectionRatio >= 0.25) engine.start();
        },
        { threshold: [0, 0.25] },
      );
      io.observe(root);
    }
    return () => {
      io?.disconnect();
      engine.destroy();
      engineRef.current = null;
      delete root.dataset.canvas;
    };
  }, []);

  useEffect(() => {
    const sync = () => setBackgrounded(document.visibilityState === "hidden");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  useEffect(() => {
    engineRef.current?.swap();
    if (firstValue.current) {
      firstValue.current = false;
      return;
    }
    // A list changing on its own stays quiet; the name and caption carry it.
    if (listed) {
      if (manualChange.current && symbol) setAnnouncement(\`Code \${index + 1} of \${count}. \${name}.\`);
      manualChange.current = false;
      return;
    }
    setAnnouncement(symbol ? \`QR code updated. \${name}.\` : "");
  }, [symbol, index]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    engineRef.current?.rebuild();
  }, [size, mode]);

  useEffect(() => {
    engineRef.current?.motionChanged();
  }, [reduced]);

  const go = (next: number, manual: boolean) => {
    if (!count) return;
    const target = ((next % count) + count) % count;
    manualChange.current = manual;
    setActive(target);
    onChange?.(target);
  };

  const still = useMemo(() => {
    if (!symbol) return "";
    const g = geometry(size, symbol.size);
    let d = "";
    symbol.modules.forEach((row, y) => {
      row.forEach((dark, x) => {
        if (dark) d += \`M\${g.left + x * g.module} \${g.top + y * g.module}h\${g.module}v\${g.module}h-\${g.module}z\`;
      });
    });
    return d;
  }, [symbol, size]);

  const code = (
    <div
      ref={rootRef}
      className={listed || item.caption ? "bz-qr" : \`bz-qr \${className}\`.trim()}
      role="img"
      aria-label={name}
      style={{ ["--bz-qr-size" as string]: \`\${size}px\` } as CSSProperties}
    >
      <svg className="bz-qr-still" viewBox={\`0 0 \${size} \${size}\`} aria-hidden="true" focusable="false">
        <path d={still} fill="currentColor" shapeRendering="crispEdges" />
      </svg>
      <canvas ref={canvasRef} className="bz-qr-canvas" aria-hidden="true" />
    </div>
  );

  const tail = (
    <>
      <span className="bz-qr-sr" aria-live="polite">
        {announcement}
      </span>
      {symbol ? null : (
        <p className="bz-qr-error" role="alert">
          This value is too long for a QR code.
        </p>
      )}
    </>
  );

  if (!listed && !item.caption) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        {code}
        {tail}
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        className={\`bz-qr-set \${className}\`.trim()}
        data-playing={playing ? "true" : "false"}
        data-running={running ? "true" : "false"}
        style={{ ["--bz-qr-hold" as string]: \`\${Math.max(1000, hold)}ms\` } as CSSProperties}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setPointerOver(true);
        }}
        onPointerLeave={() => setPointerOver(false)}
        onFocus={() => setFocusInside(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusInside(false);
        }}
      >
        {code}
        <div className="bz-qr-side">
          {item.caption ? <p className="bz-qr-caption">{item.caption}</p> : null}
          {cycling ? (
            <>
              <p className="bz-qr-count">
                Code {index + 1} of {count}
              </p>
              <div className="bz-qr-groove" aria-hidden="true">
                {settled ? (
                  <span key={\`\${index}-\${item.value}\`} className="bz-qr-fill" onAnimationEnd={() => go(index + 1, false)} />
                ) : null}
              </div>
              <div className="bz-qr-controls">
                <button
                  type="button"
                  className="bz-qr-button"
                  aria-label={playing ? "Pause code rotation" : "Play code rotation"}
                  onClick={() => setPlayPref(!playing)}
                >
                  {playing ? (
                    <svg viewBox="0 0 14 14" aria-hidden="true">
                      <rect x="2.5" y="1.5" width="3" height="11" rx="1" fill="currentColor" />
                      <rect x="8.5" y="1.5" width="3" height="11" rx="1" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 14 14" aria-hidden="true">
                      <path d="M3.5 2.2v9.6c0 .6.7 1 1.2.6l7.2-4.8a.7.7 0 0 0 0-1.2L4.7 1.6c-.5-.4-1.2 0-1.2.6z" fill="currentColor" />
                    </svg>
                  )}
                  {playing ? "Pause" : "Play"}
                </button>
                <button type="button" className="bz-qr-button" aria-label="Next code" onClick={() => go(index + 1, true)}>
                  <svg viewBox="0 0 14 14" aria-hidden="true">
                    <path d="M5 2.5 9.5 7 5 11.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Next
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
      {tail}
    </>
  );
}`,
    description: "Scannable QR codes that assemble from grains and cycle, with a pause button.",
    tags: ["qr", "canvas", "particles", "scannable", "autoplay", "pause", "reduced-motion"],
  },
  {
    name: "TimedTabs",
    slug: "timed-tabs",
    path: "navigation/TimedTabs.tsx",
    category: "navigation",
    code: `"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";

/*
 * TimedTabs: tabs that move on by themselves, where the timer is the progress
 * bar.
 *
 * The bar under the active tab is a CSS animation, and its \`animationend\` is
 * what selects the next tab. Pausing therefore needs no timer bookkeeping: any
 * rule that sets \`animation-play-state: paused\` stops the countdown and the
 * switch together. It holds when the reader pauses it, when the tabs are out
 * of view, when the browser tab is hidden, and while keyboard focus is inside.
 *
 * The active tab is a paper "tongue" joined to the panel below. It is a second,
 * inert copy of the whole row clipped to one column, and moving the clip slides
 * the tongue across while the colours change exactly at its edge.
 *
 * Reduced motion starts paused and drops the slides; the pause button still
 * turns the timer on.
 */

const CSS = \`
.bz-tt{container-type:inline-size;box-sizing:border-box;border:1px solid var(--bz-line-strong,rgba(10,10,10,0.13));border-radius:24px;background:var(--bz-paper,#ffffff);color:var(--bz-ink,#0a0a0a);font-family:var(--bz-font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif)}
.bz-tt *,.bz-tt *::before,.bz-tt *::after{box-sizing:border-box}
.bz-tt-rail{display:flex;align-items:stretch;gap:4px;padding:6px 6px 0;border-radius:23px 23px 0 0;background:var(--bz-void,#0c0c0f)}
.bz-tt-track{position:relative;flex:1;min-width:0}
.bz-tt-tabs,.bz-tt-tongue{display:grid;grid-template-columns:repeat(var(--bz-tt-n),minmax(0,1fr))}
.bz-tt-tongue{position:absolute;inset:0;pointer-events:none;clip-path:inset(0 calc((var(--bz-tt-n) - 1 - var(--bz-tt-active)) * 100% / var(--bz-tt-n)) 0 calc(var(--bz-tt-active) * 100% / var(--bz-tt-n)) round 16px 16px 0 0);transition:clip-path 300ms var(--bz-ease-in-out,cubic-bezier(0.77,0,0.175,1))}
.bz-tt-tab{position:relative;display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:56px;margin:0;padding:12px 12px 15px;border:0;border-radius:16px 16px 0 0;background:transparent;color:rgba(255,255,255,0.74);font:inherit;font-size:0.9375rem;font-weight:600;line-height:1.25;letter-spacing:-0.01em;text-align:center;cursor:pointer;transition:color 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)),background-color 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-tt-tongue .bz-tt-tab{background:var(--bz-paper,#ffffff);color:var(--bz-ink,#0a0a0a);cursor:default}
.bz-tt-tabs .bz-tt-tab:focus-visible{outline:2px solid #ffffff;outline-offset:-6px}
.bz-tt:has(.bz-tt-tabs .bz-tt-tab:focus-visible) .bz-tt-tongue .bz-tt-tab[data-lit]{outline:2px solid var(--bz-focus-ring,#912c22);outline-offset:-6px}
@media (hover:hover) and (pointer:fine){.bz-tt-tabs .bz-tt-tab:hover{color:#ffffff;background:rgba(255,255,255,0.08)}}
.bz-tt-icon{display:grid;flex:none;place-items:center;width:28px;height:28px;border-radius:9px;background:rgba(255,255,255,0.12)}
.bz-tt-icon svg{width:16px;height:16px}
.bz-tt-tongue .bz-tt-icon{background:var(--bz-paper-raised,#f7f3ee);color:var(--bz-accent,#912c22)}
.bz-tt-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bz-tt-groove{position:absolute;left:0;bottom:0;width:calc(100% / var(--bz-tt-n));height:3px;overflow:hidden;pointer-events:none;background:rgba(10,10,10,0.1);transform:translateX(calc(var(--bz-tt-active) * 100%));transition:transform 300ms var(--bz-ease-in-out,cubic-bezier(0.77,0,0.175,1))}
.bz-tt-fill{display:block;width:100%;height:100%;background:var(--bz-accent,#912c22);transform:scaleX(0);transform-origin:left center;animation:bz-tt-countdown var(--bz-tt-time,6000ms) linear forwards}
@keyframes bz-tt-countdown{to{transform:scaleX(1)}}
.bz-tt[data-timer="off"] .bz-tt-fill,.bz-tt[data-onscreen="false"] .bz-tt-fill,.bz-tt[data-backgrounded="true"] .bz-tt-fill,.bz-tt:has(:focus-visible) .bz-tt-fill{animation-play-state:paused}
.bz-tt[data-timer="off"] .bz-tt-fill{opacity:0.4}
.bz-tt-toggle{display:grid;flex:none;align-self:center;place-items:center;width:48px;height:48px;margin:0 2px 6px;padding:0;border:1px solid rgba(255,255,255,0.3);border-radius:999px;background:rgba(255,255,255,0.08);color:#ffffff;cursor:pointer;transition:background-color 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)),border-color 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)),transform 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-tt-toggle svg{width:14px;height:14px}
.bz-tt-toggle:focus-visible{outline:2px solid #ffffff;outline-offset:2px}
.bz-tt-toggle:active{transform:scale(0.97)}
@media (hover:hover){.bz-tt-toggle:hover{background:rgba(255,255,255,0.18);border-color:rgba(255,255,255,0.55)}}
.bz-tt-panel{padding:24px;border-radius:0 0 23px 23px;outline:none}
.bz-tt-panel:focus-visible{outline:2px solid var(--bz-focus-ring,#912c22);outline-offset:2px}
.bz-tt-swap{animation:bz-tt-in 300ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)) both}
@keyframes bz-tt-in{from{opacity:0;transform:translateY(8px);filter:blur(4px)}to{opacity:1;transform:none;filter:none}}
@keyframes bz-tt-fade{from{opacity:0}to{opacity:1}}
@container (max-width:560px){.bz-tt-tab{flex-direction:column;gap:6px;min-height:64px;padding:10px 4px 13px;font-size:0.75rem}.bz-tt-name{white-space:normal}.bz-tt-panel{padding:18px}}
@media (prefers-reduced-motion:reduce){.bz-tt-tongue,.bz-tt-groove,.bz-tt-tab,.bz-tt-toggle{transition:none}.bz-tt-swap{animation:bz-tt-fade 150ms ease both}.bz-tt-toggle:active{transform:none}}
\`;

const RM_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(RM_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const readReducedMotion = () => window.matchMedia(RM_QUERY).matches;
const serverReducedMotion = () => false;

export type TimedTab = {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
};

export type TimedTabsProps = {
  items: TimedTab[];
  /** Names the tab list for assistive tech. */
  label: string;
  /** How long each tab stays before the next, in milliseconds. */
  interval?: number;
  defaultIndex?: number;
  onChange?: (index: number) => void;
  /** Accessible name of the pause button, which reports its state with \`aria-pressed\`. */
  pauseLabel?: string;
  className?: string;
};

export function TimedTabs({
  items,
  label,
  interval = 6000,
  defaultIndex = 0,
  onChange,
  pauseLabel = "Pause automatic switching",
  className = "",
}: TimedTabsProps) {
  const reduced = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, serverReducedMotion);
  const count = items.length;
  const [active, setActive] = useState(() => Math.max(0, Math.min(defaultIndex, count - 1)));
  const [autoPref, setAutoPref] = useState<boolean | null>(null);
  const [inView, setInView] = useState(false);
  const [hidden, setHidden] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const tongueRef = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/:/g, "");

  const auto = autoPref ?? !reduced;
  const current = Math.max(0, Math.min(active, count - 1));

  // React 18 does not pass \`inert\` through, so it is set on the node.
  useEffect(() => {
    tongueRef.current?.setAttribute("inert", "");
  }, [count]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const sync = () => setHidden(document.visibilityState === "hidden");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  const select = useCallback(
    (next: number, focus = false) => {
      if (!count) return;
      const index = ((next % count) + count) % count;
      setActive(index);
      onChange?.(index);
      if (focus) tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[index]?.focus();
    },
    [count, onChange],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: count - 1 };
    if (!(event.key in moves)) return;
    event.preventDefault();
    select(moves[event.key], true);
  };

  if (!count) return null;

  const style = {
    ["--bz-tt-n" as string]: count,
    ["--bz-tt-active" as string]: current,
    ["--bz-tt-time" as string]: \`\${interval}ms\`,
  } as CSSProperties;

  const tabInner = (item: TimedTab) => (
    <>
      {item.icon ? (
        <span className="bz-tt-icon" aria-hidden="true">
          {item.icon}
        </span>
      ) : null}
      <span className="bz-tt-name">{item.label}</span>
    </>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        ref={rootRef}
        className={\`bz-tt \${className}\`.trim()}
        style={style}
        data-timer={auto ? "on" : "off"}
        data-onscreen={inView ? "true" : "false"}
        data-backgrounded={hidden ? "true" : "false"}
      >
        <div className="bz-tt-rail">
          <div className="bz-tt-track">
            <div ref={tabsRef} role="tablist" aria-label={label} className="bz-tt-tabs" onKeyDown={onKeyDown}>
              {items.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={\`\${uid}-tab-\${index}\`}
                  aria-selected={index === current}
                  aria-controls={\`\${uid}-panel\`}
                  tabIndex={index === current ? 0 : -1}
                  className="bz-tt-tab"
                  onClick={() => select(index)}
                >
                  {tabInner(item)}
                </button>
              ))}
            </div>
            <div ref={tongueRef} className="bz-tt-tongue" aria-hidden="true">
              {items.map((item, index) => (
                <span key={item.id} className="bz-tt-tab" data-lit={index === current ? "true" : undefined}>
                  {tabInner(item)}
                </span>
              ))}
            </div>
            <div className="bz-tt-groove" aria-hidden="true">
              <span
                key={\`\${current}-\${items[current].id}\`}
                className="bz-tt-fill"
                onAnimationEnd={() => select(current + 1)}
              />
            </div>
          </div>
          <button
            type="button"
            className="bz-tt-toggle"
            aria-label={pauseLabel}
            aria-pressed={!auto}
            onClick={() => setAutoPref(!auto)}
          >
            {auto ? (
              <svg viewBox="0 0 14 14" aria-hidden="true">
                <rect x="2.5" y="1.5" width="3" height="11" rx="1" fill="currentColor" />
                <rect x="8.5" y="1.5" width="3" height="11" rx="1" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 14 14" aria-hidden="true">
                <path d="M3.5 2.2v9.6c0 .6.7 1 1.2.6l7.2-4.8a.7.7 0 0 0 0-1.2L4.7 1.6c-.5-.4-1.2 0-1.2.6z" fill="currentColor" />
              </svg>
            )}
          </button>
        </div>
        <div
          role="tabpanel"
          id={\`\${uid}-panel\`}
          aria-labelledby={\`\${uid}-tab-\${current}\`}
          tabIndex={0}
          className="bz-tt-panel"
        >
          <div key={items[current].id} className="bz-tt-swap">
            {items[current].content}
          </div>
        </div>
      </div>
    </>
  );
}`,
    description: "Self-advancing tabs whose progress bar is the timer, with a sliding paper tab.",
    tags: ["tabs", "autoplay", "progress", "accessible", "keyboard", "pause"],
  },
  {
    name: "GlyphField",
    slug: "glyph-field",
    path: "animation/GlyphField.tsx",
    category: "animation",
    code: `"use client";

import { useEffect, useRef, useSyncExternalStore, type CSSProperties } from "react";

/*
 * GlyphField: a word built as a solid object out of glyphs, that turns toward
 * the cursor and parts around it.
 *
 * The text is set on an offscreen canvas and its mask becomes a height map: an
 * exact distance transform gives every point inside a letter its distance from
 * the edge, and that distance is bent into a rounded bevel. The letters are then
 * a slab with a front face, bevelled edges and side walls running back into the
 * page.
 *
 * Each frame the slab is turned in 3D and a ray is cast from a perspective
 * camera through the centre of every cell of a fixed grid, the way a terminal
 * draws a solid. A ray that meets the front face is shaded from the bevel's
 * normal under a fixed light from the upper left, with a small highlight; a ray
 * that misses the face is marched back through the depth of the slab, and one
 * that meets a side wall is shaded from the wall's normal and darkened toward
 * the back. The shade picks one glyph from a pre-drawn ramp that grows in size
 * and ink, so lit bevels thin out and walls in shadow print heavy.
 *
 * Under the pointer a raised-cosine torch lifts cells a few steps and into the
 * accent, and pushes them aside; its dithered edge comes from a fixed random
 * threshold per cell. The word tilts to face the pointer. With nobody pointing
 * it sways slowly and the torch wanders; that loop stops off screen and in
 * hidden tabs. The shaded object is cached, so a frame without a change of
 * angle is one blit plus the cells within the torch's reach. Reduced motion
 * holds one fixed three-quarter angle with no tilt or sway, and the torch still
 * recolours under a real pointer but does not push.
 */

const CSS = \`
.bz-gf{--bz-gf-ground:var(--bz-paper,#ffffff);--bz-gf-t1:#cfcfd3;--bz-gf-t2:var(--bz-ink-subtle,#6b6b70);--bz-gf-t3:var(--bz-ink,#0a0a0a);--bz-gf-a1:#e3a79d;--bz-gf-a2:#c0513f;--bz-gf-a3:var(--bz-accent,#912c22);position:relative;display:block;width:100%;min-height:200px;overflow:hidden;background:var(--bz-gf-ground);font-family:var(--bz-font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);touch-action:pan-y pinch-zoom;-webkit-user-select:none;user-select:none}
.bz-gf-canvas{position:absolute;inset:0;display:block;width:100%;height:100%}
\`;

const RM_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(RM_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const readReducedMotion = () => window.matchMedia(RM_QUERY).matches;
const serverReducedMotion = () => false;

const IDLE_MS = 2500;
/** Glyph steps in each ramp, from barely there to full ink. */
const LEVELS = 14;
/** Mask samples per cell along each axis. */
const SUPERSAMPLE = 2;
const DEG = Math.PI / 180;
/** The angle the word rests at, and holds under reduced motion: turned left and up, so its right and lower walls show. */
const REST_YAW = -18 * DEG;
const REST_PITCH = 14 * DEG;
/**
 * Light from the upper right and in front, and the half vector for the highlight. Against the resting angle
 * this gives three planes three tones, the way a lit cube reads: a mid face, a lit right wall, a dark lower one.
 */
const LIGHT = normalize3(0.55, -0.75, 0.5);
const HALF = normalize3(LIGHT[0], LIGHT[1], LIGHT[2] + 1);

function normalize3(x: number, y: number, z: number): [number, number, number] {
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l];
}

type Options = {
  text: string;
  glyph: string;
  cell: number;
  radius: number;
  wander: boolean;
  reduced: boolean;
  depth: number;
  tilt: number;
};

type Field = { refresh: () => void; wake: () => void; destroy: () => void };

/** Squared distance transform of one row or column (Felzenszwalb and Huttenlocher). */
function transform1d(f: Float64Array, n: number, out: Float64Array, v: Int32Array, z: Float64Array) {
  let k = 0;
  v[0] = 0;
  z[0] = -1e20;
  z[1] = 1e20;
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = 1e20;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    out[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
}

/** Euclidean distance from every sample to the nearest sample where \`seed\` is true. */
function distanceTo(seed: Uint8Array, w: number, h: number) {
  const n = Math.max(w, h);
  const f = new Float64Array(n);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  const grid = new Float64Array(w * h);
  for (let i = 0; i < grid.length; i++) grid[i] = seed[i] ? 0 : 1e10;
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = grid[y * w + x];
    transform1d(f, h, d, v, z);
    for (let y = 0; y < h; y++) grid[y * w + x] = d[y];
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = grid[y * w + x];
    transform1d(f, w, d, v, z);
    for (let x = 0; x < w; x++) grid[y * w + x] = d[x];
  }
  const out = new Float32Array(w * h);
  for (let i = 0; i < out.length; i++) out[i] = Math.sqrt(grid[i]);
  return out;
}

function createField(root: HTMLElement, canvas: HTMLCanvasElement, options: () => Options): Field | null {
  const ctx = canvas.getContext("2d");
  const source = document.createElement("canvas");
  const sctx = source.getContext("2d");
  const sampler = document.createElement("canvas");
  const pctx = sampler.getContext("2d", { willReadFrequently: true });
  const sheet = document.createElement("canvas");
  const hctx = sheet.getContext("2d");
  const cache = document.createElement("canvas");
  const cctx = cache.getContext("2d");
  if (!ctx || !sctx || !pctx || !hctx || !cctx) return null;

  let dead = false;
  let raf = 0;
  let last = 0;
  let inView = true;
  let W = 0;
  let H = 0;
  let dpr = 1;
  let cols = 0;
  let rows = 0;
  let cell = 8;
  let sprite = 0;
  let jitter = new Float32Array(0);
  /** Glyph step per cell for the current angle, or -1 for bare paper. */
  let levels = new Int8Array(0);
  /** Cells whose step moved since the cache was last painted, and how many. */
  let changed = new Int32Array(0);
  let changes = 0;

  // The height map, one entry per mask sample.
  let mw = 0;
  let mh = 0;
  let solid = new Uint8Array(0);
  let faceX = new Float32Array(0);
  let faceY = new Float32Array(0);
  let faceZ = new Float32Array(0);
  let wallX = new Float32Array(0);
  let wallY = new Float32Array(0);
  let box = { x0: 0, y0: 0, x1: 0, y1: 0 };
  let slab = 20;

  let shapeDirty = true;
  let cacheDirty = true;
  let dirty = true;
  const pointer = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, real: false, lastReal: -1e9 };
  const turn = { yaw: REST_YAW, pitch: REST_PITCH };

  const running = () => inView && document.visibilityState === "visible";

  function buildSheet() {
    const style = getComputedStyle(root);
    const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
    const rgb = (color: string) => {
      hctx!.fillStyle = "#000000";
      hctx!.fillStyle = color;
      const s = String(hctx!.fillStyle);
      if (s.startsWith("#")) return [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
      const m = s.match(/[\\d.]+/g);
      return m ? m.slice(0, 3).map(Number) : [0, 0, 0];
    };
    const ground = rgb(read("--bz-gf-ground", "#ffffff"));
    const t1 = rgb(read("--bz-gf-t1", "#cfcfd3"));
    const t2 = rgb(read("--bz-gf-t2", "#6b6b70"));
    const t3 = rgb(read("--bz-gf-t3", "#0a0a0a"));
    const a1 = rgb(read("--bz-gf-a1", "#e3a79d"));
    const a2 = rgb(read("--bz-gf-a2", "#c0513f"));
    const a3 = rgb(read("--bz-gf-a3", "#912c22"));
    const mix = (a: number[], b: number[], k: number) => a.map((v, i) => v + (b[i] - v) * k);
    const ramps = [
      [mix(ground, t1, 0.55), t1, t2, t3],
      [mix(ground, a1, 0.6), a1, a2, a3, mix(a3, t3, 0.45)],
    ];
    const at = (stops: number[][], q: number) => {
      const p = q * (stops.length - 1);
      const i = Math.min(stops.length - 2, Math.floor(p));
      const c = mix(stops[i], stops[i + 1], p - i);
      return \`rgb(\${c.map((v) => Math.round(v)).join(",")})\`;
    };

    sheet.width = sprite * LEVELS * ramps.length;
    sheet.height = sprite;
    hctx!.clearRect(0, 0, sheet.width, sheet.height);
    hctx!.textAlign = "center";
    hctx!.textBaseline = "middle";
    hctx!.lineJoin = "round";
    const glyph = options().glyph;
    ramps.forEach((stops, r) => {
      for (let l = 0; l < LEVELS; l++) {
        const q = l / (LEVELS - 1);
        const ink = at(stops, q);
        const px = Math.max(2, Math.round(sprite * (0.62 + 0.8 * q)));
        const left = (r * LEVELS + l) * sprite;
        // Each glyph stays inside its own square, so a cell can be redrawn on its own.
        hctx!.save();
        hctx!.beginPath();
        hctx!.rect(left, 0, sprite, sprite);
        hctx!.clip();
        hctx!.font = \`700 \${px}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace\`;
        hctx!.fillStyle = ink;
        const x = left + sprite / 2;
        const y = sprite / 2 + sprite * 0.04;
        hctx!.fillText(glyph, x, y);
        if (q > 0.55) {
          hctx!.strokeStyle = ink;
          hctx!.lineWidth = (q - 0.55) * sprite * 0.22;
          hctx!.strokeText(glyph, x, y);
        }
        hctx!.restore();
      }
    });
  }

  function sample() {
    const { text, depth } = options();
    mw = Math.max(1, cols * SUPERSAMPLE);
    mh = Math.max(1, rows * SUPERSAMPLE);
    source.width = mw * 2;
    source.height = mh * 2;
    sctx!.fillStyle = "#ffffff";
    sctx!.fillRect(0, 0, source.width, source.height);
    const family = getComputedStyle(root).fontFamily || "system-ui, sans-serif";
    sctx!.font = \`800 100px \${family}\`;
    const width = Math.max(1, sctx!.measureText(text).width);
    // Room to turn: the word is set smaller than the flat version would be.
    const fontPx = Math.min(((source.width * 0.74) / width) * 100, source.height * 0.56);
    sctx!.font = \`800 \${fontPx}px \${family}\`;
    sctx!.textAlign = "center";
    sctx!.textBaseline = "middle";
    sctx!.fillStyle = "#000000";
    sctx!.fillText(text, source.width / 2, source.height / 2 + fontPx * 0.04);

    sampler.width = mw;
    sampler.height = mh;
    pctx!.imageSmoothingEnabled = true;
    pctx!.imageSmoothingQuality = "high";
    pctx!.drawImage(source, 0, 0, mw, mh);
    const data = pctx!.getImageData(0, 0, mw, mh).data;

    const count = mw * mh;
    solid = new Uint8Array(count);
    const empty = new Uint8Array(count);
    let x0 = mw;
    let y0 = mh;
    let x1 = -1;
    let y1 = -1;
    for (let i = 0, p = 0; i < count; i++, p += 4) {
      const luma = (0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2]) / 255;
      if (luma < 0.5) {
        solid[i] = 1;
        const x = i % mw;
        const y = (i - x) / mw;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      } else {
        empty[i] = 1;
      }
    }

    const inside = distanceTo(empty, mw, mh);
    const outside = distanceTo(solid, mw, mh);
    let deepest = 1;
    for (let i = 0; i < count; i++) if (inside[i] > deepest) deepest = inside[i];
    // A narrow bevel leaves a flat top to every stroke, so light and shadow sit on the edges.
    const cssFont = fontPx * (W / source.width);
    const spacing = W / mw;
    const bevel = Math.max(1.5, Math.min(deepest * 0.6, (cssFont * 0.055) / spacing));

    faceX = new Float32Array(count);
    faceY = new Float32Array(count);
    faceZ = new Float32Array(count);
    wallX = new Float32Array(count);
    wallY = new Float32Array(count);
    const sdf = (x: number, y: number) => {
      const cx = Math.max(0, Math.min(mw - 1, x));
      const cy = Math.max(0, Math.min(mh - 1, y));
      const i = cy * mw + cx;
      return inside[i] - outside[i];
    };
    for (let y = 0; y < mh; y++) {
      for (let x = 0; x < mw; x++) {
        const i = y * mw + x;
        faceZ[i] = 1;
        if (!solid[i]) continue;
        // The signed distance rises inward; its gradient points into the letter.
        let gx = sdf(x + 1, y) - sdf(x - 1, y);
        let gy = sdf(x, y + 1) - sdf(x, y - 1);
        const g = Math.hypot(gx, gy);
        if (g < 1e-3) continue;
        gx /= g;
        gy /= g;
        wallX[i] = -gx;
        wallY[i] = -gy;
        // A quarter-round bevel: steep at the edge, flat once \`bevel\` in.
        const t = Math.min(1, Math.max(0, (inside[i] - 0.5) / bevel));
        const slope = t >= 1 ? 0 : Math.min(2.4, (1 - t) / Math.sqrt(Math.max(1e-3, 1 - (1 - t) * (1 - t))));
        const n = normalize3(-gx * slope, -gy * slope, 1);
        faceX[i] = n[0];
        faceY[i] = n[1];
        faceZ[i] = n[2];
      }
    }

    const sx = W / mw;
    const sy = H / mh;
    box = x1 < 0 ? { x0: 0, y0: 0, x1: -1, y1: -1 } : { x0: x0 * sx - W / 2, y0: y0 * sy - H / 2, x1: (x1 + 1) * sx - W / 2, y1: (y1 + 1) * sy - H / 2 };
    slab = Math.max(cell, cssFont * Math.max(0, depth));
    shapeDirty = true;
    cacheDirty = true;
    dirty = true;
  }

  function layout() {
    const rect = root.getBoundingClientRect();
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    // Small fields use finer cells, so a letter is still wide enough in cells to show its bevel.
    cell = Math.max(4, Math.min(Math.round(options().cell), Math.round(Math.min(W, H * 2.2) / 70)));
    const cw = Math.round(W * dpr);
    const ch = Math.round(H * dpr);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    if (cache.width !== cw || cache.height !== ch) {
      cache.width = cw;
      cache.height = ch;
    }
    const nextCols = Math.ceil(W / cell);
    const nextRows = Math.ceil(H / cell);
    if (nextCols !== cols || nextRows !== rows) {
      cols = nextCols;
      rows = nextRows;
      levels = new Int8Array(cols * rows).fill(-1);
      changed = new Int32Array(cols * rows);
      jitter = new Float32Array(cols * rows);
      for (let i = 0; i < jitter.length; i++) jitter[i] = Math.random();
    }
    sprite = Math.max(2, Math.round(cell * dpr));
    buildSheet();
    sample();
  }

  /** Cast one ray per cell through the slab at the current angle, and keep the glyph step each one lands on. */
  function shade() {
    const ca = Math.cos(turn.yaw);
    const sa = Math.sin(turn.yaw);
    const cb = Math.cos(turn.pitch);
    const sb = Math.sin(turn.pitch);
    // R = yaw about the vertical axis, after pitch about the horizontal one.
    const r00 = ca;
    const r01 = sa * sb;
    const r02 = sa * cb;
    const r11 = cb;
    const r12 = -sb;
    const r20 = -sa;
    const r21 = ca * sb;
    const r22 = ca * cb;
    const focal = Math.max(W, H) * 1.35;
    // The camera, in the slab's own frame.
    const ox = r20 * focal;
    const oy = r21 * focal;
    const oz = r22 * focal;
    const half = slab / 2;
    const steps = Math.max(3, Math.min(10, Math.ceil(slab / (cell * 0.75))));
    const sx = mw / W;
    const sy = mh / H;
    const hw = W / 2;
    const hh = H / 2;
    const top = LEVELS - 1;
    const [lx, ly, lz] = LIGHT;
    const [hx, hy, hz] = HALF;
    const bx0 = box.x0 - cell;
    const bx1 = box.x1 + cell;
    const by0 = box.y0 - cell;
    const by1 = box.y1 + cell;

    for (let r = 0; r < rows; r++) {
      const Y = (r + 0.5) * cell - hh;
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        let next = -1;
        const X = (c + 0.5) * cell - hw;
        const dx = r00 * X - r20 * focal;
        const dy = r01 * X + r11 * Y - r21 * focal;
        const dz = r02 * X + r12 * Y - r22 * focal;
        const tf = (half - oz) / dz;
        const tb = (-half - oz) / dz;
        const fu = ox + tf * dx;
        const fv = oy + tf * dy;
        const bu = ox + tb * dx;
        const bv = oy + tb * dy;
        if (dz < -1e-6 && Math.max(fu, bu) >= bx0 && Math.min(fu, bu) <= bx1 && Math.max(fv, bv) >= by0 && Math.min(fv, bv) <= by1) {
          let mx = Math.floor((fu + hw) * sx);
          let my = Math.floor((fv + hh) * sy);
          if (mx >= 0 && my >= 0 && mx < mw && my < mh && solid[my * mw + mx]) {
            const j = my * mw + mx;
            const nx = faceX[j];
            const ny = faceY[j];
            const nz = faceZ[j];
            const wx = r00 * nx + r01 * ny + r02 * nz;
            const wy = r11 * ny + r12 * nz;
            const wz = r20 * nx + r21 * ny + r22 * nz;
            const diffuse = Math.max(0, wx * lx + wy * ly + wz * lz);
            const spec = Math.max(0, wx * hx + wy * hy + wz * hz);
            const s2 = spec * spec;
            const s8 = s2 * s2 * s2 * s2;
            const light = 0.08 + 0.9 * diffuse + 0.6 * s8 * s8;
            // The face keeps to a band lighter than any wall, so letters stay apart from their own sides at every angle.
            const ink = 0.34 + 0.4 * Math.max(0, 1 - light);
            next = Math.round(ink * top);
          } else {
            for (let k = 1; k <= steps; k++) {
              const f = k / steps;
              mx = Math.floor((fu + (bu - fu) * f + hw) * sx);
              my = Math.floor((fv + (bv - fv) * f + hh) * sy);
              if (mx < 0 || my < 0 || mx >= mw || my >= mh || !solid[my * mw + mx]) continue;
              const j = my * mw + mx;
              const nx = wallX[j];
              const ny = wallY[j];
              const wx = r00 * nx + r01 * ny;
              const wy = r11 * ny;
              const wz = r20 * nx + r21 * ny;
              const diffuse = Math.max(0, wx * lx + wy * ly + wz * lz);
              // Walls darken toward the back, so depth reads even where the light is flat.
              const light = (0.06 + 0.9 * diffuse) * (1 - 0.55 * f);
              const ink = 0.78 + 0.22 * Math.max(0, 1 - light);
              next = Math.round(ink * top);
              break;
            }
          }
        }
        if (next > top) next = top;
        if (levels[i] !== next) {
          levels[i] = next;
          changed[changes++] = i;
        }
      }
    }
    shapeDirty = false;
  }

  /** Paint one cell of the cache on whole device pixels, so a cell can be repainted without seams. */
  function paintCell(i: number) {
    const c = i % cols;
    const r = (i - c) / cols;
    const x0 = Math.round(c * cell * dpr);
    const y0 = Math.round(r * cell * dpr);
    const w = Math.round((c + 1) * cell * dpr) - x0;
    const h = Math.round((r + 1) * cell * dpr) - y0;
    cctx!.clearRect(x0, y0, w, h);
    const l = levels[i];
    if (l >= 0) cctx!.drawImage(sheet, l * sprite, 0, sprite, sprite, x0, y0, w, h);
  }

  function drawCache() {
    cctx!.setTransform(1, 0, 0, 1, 0, 0);
    if (cacheDirty) {
      cctx!.clearRect(0, 0, cache.width, cache.height);
      for (let i = 0; i < levels.length; i++) if (levels[i] >= 0) paintCell(i);
    } else {
      for (let k = 0; k < changes; k++) paintCell(changed[k]);
    }
    changes = 0;
    cacheDirty = false;
  }

  function draw() {
    if (shapeDirty) shade();
    if (cacheDirty || changes) drawCache();
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.clearRect(0, 0, W, H);
    ctx!.drawImage(cache, 0, 0, W, H);
    const px = pointer.x;
    const py = pointer.y;
    if (px < -1e3) return;
    const o = options();
    const R = W <= 420 ? o.radius * 0.7 : o.radius;
    const R2 = R * R;
    const push = o.reduced ? 0 : cell * 1.6;
    const reach = R + push + cell;
    const c0 = Math.max(0, Math.floor((px - reach) / cell));
    const c1 = Math.min(cols - 1, Math.ceil((px + reach) / cell));
    const r0 = Math.max(0, Math.floor((py - reach) / cell));
    const r1 = Math.min(rows - 1, Math.ceil((py + reach) / cell));
    if (c1 < c0 || r1 < r0) return;
    ctx!.clearRect(c0 * cell, r0 * cell, (c1 - c0 + 1) * cell, (r1 - r0 + 1) * cell);
    const half = cell / 2;
    const top = LEVELS - 1;
    for (let r = r0; r <= r1; r++) {
      const y = r * cell + half;
      const dy = py - y;
      for (let c = c0; c <= c1; c++) {
        const i = r * cols + c;
        let l = levels[i];
        if (l < 0) continue;
        const x = c * cell + half;
        const dx = px - x;
        const d2 = dx * dx + dy * dy;
        let ox = 0;
        let oy = 0;
        let ramp = 0;
        if (d2 < R2) {
          const d = Math.sqrt(d2);
          const w = 0.5 + 0.5 * Math.cos((Math.PI * d) / R);
          if (w > jitter[i]) {
            l = Math.min(top, l + 3);
            ramp = LEVELS;
          }
          const k = d > 0.001 ? (w * push) / d : 0;
          ox = -dx * k;
          oy = -dy * k;
        }
        ctx!.drawImage(
          sheet,
          (ramp + l) * sprite,
          0,
          sprite,
          sprite,
          Math.round((x - half + ox) * dpr) / dpr,
          Math.round((y - half + oy) * dpr) / dpr,
          cell,
          cell,
        );
      }
    }
  }

  function schedule() {
    if (!raf && !dead && running()) raf = requestAnimationFrame(frame);
  }

  function frame(now: number) {
    raf = 0;
    if (dead || !running()) return;
    const dt = last ? Math.min(64, now - last) : 16;
    last = now;
    const o = options();
    const idle = !pointer.real && now - pointer.lastReal > IDLE_MS;
    const wandering = idle && o.wander && !o.reduced;
    if (wandering) {
      pointer.tx = W * (0.5 + 0.4 * Math.sin(now * 0.00037));
      pointer.ty = H * (0.5 + 0.3 * Math.sin(now * 0.00053 + 1.3));
    } else if (idle && pointer.tx > -1e3) {
      pointer.tx = -1e4;
      pointer.ty = -1e4;
    }
    if (pointer.x < -1e3 || pointer.tx < -1e3) {
      if (pointer.x !== pointer.tx || pointer.y !== pointer.ty) dirty = true;
      pointer.x = pointer.tx;
      pointer.y = pointer.ty;
    } else {
      const k = 1 - Math.exp(-dt / 70);
      pointer.x += (pointer.tx - pointer.x) * k;
      pointer.y += (pointer.ty - pointer.y) * k;
    }
    const settled = Math.abs(pointer.tx - pointer.x) < 0.1 && Math.abs(pointer.ty - pointer.y) < 0.1;
    if (settled) {
      pointer.x = pointer.tx;
      pointer.y = pointer.ty;
    }

    // Where the word wants to face.
    const tilt = Math.max(0, o.tilt) * DEG;
    let yaw = REST_YAW;
    let pitch = REST_PITCH;
    if (!o.reduced) {
      if (pointer.real || (!idle && pointer.tx > -1e3)) {
        const nx = Math.max(-1, Math.min(1, (pointer.tx - W / 2) / (W / 2)));
        const ny = Math.max(-1, Math.min(1, (pointer.ty - H / 2) / (H / 2)));
        yaw = REST_YAW * 0.6 + nx * tilt;
        pitch = REST_PITCH * 0.6 - ny * tilt * 0.6;
      } else if (wandering) {
        yaw = REST_YAW * 0.75 + tilt * 0.6 * Math.sin(now * 0.00041);
        pitch = REST_PITCH * 0.75 + tilt * 0.3 * Math.sin(now * 0.00029 + 0.8);
      }
    }
    let turning = false;
    if (o.reduced) {
      if (turn.yaw !== REST_YAW || turn.pitch !== REST_PITCH) shapeDirty = true;
      turn.yaw = REST_YAW;
      turn.pitch = REST_PITCH;
    } else {
      const k = 1 - Math.exp(-dt / 240);
      const ny = turn.yaw + (yaw - turn.yaw) * k;
      const np = turn.pitch + (pitch - turn.pitch) * k;
      turning = Math.abs(yaw - ny) > 0.0004 || Math.abs(pitch - np) > 0.0004;
      if (Math.abs(ny - turn.yaw) > 0.00005 || Math.abs(np - turn.pitch) > 0.00005) shapeDirty = true;
      turn.yaw = turning ? ny : yaw;
      turn.pitch = turning ? np : pitch;
    }

    if (dirty || cacheDirty || shapeDirty || !settled) {
      draw();
      dirty = false;
    }
    // Keep going while moving, turning, wandering, or waiting for the idle wander to begin.
    if (!settled || turning || wandering || (!pointer.real && !idle && o.wander && !o.reduced)) schedule();
  }

  function wake() {
    dirty = true;
    last = 0;
    schedule();
  }

  const toLocal = (event: PointerEvent) => {
    const rect = root.getBoundingClientRect();
    pointer.tx = event.clientX - rect.left;
    pointer.ty = event.clientY - rect.top;
    pointer.real = true;
    pointer.lastReal = performance.now();
    wake();
  };
  const release = () => {
    pointer.real = false;
    pointer.lastReal = performance.now();
    wake();
  };
  const noHover = window.matchMedia("(hover: none)");
  const onUp = () => {
    if (noHover.matches) release();
  };
  root.addEventListener("pointermove", toLocal, { passive: true });
  root.addEventListener("pointerdown", toLocal, { passive: true });
  root.addEventListener("pointerleave", release);
  root.addEventListener("pointercancel", release);
  root.addEventListener("pointerup", onUp);

  const onVisibility = () => wake();
  document.addEventListener("visibilitychange", onVisibility);

  const ro = new ResizeObserver(() => {
    layout();
    draw();
    schedule();
  });
  ro.observe(root);

  let io: IntersectionObserver | null = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) wake();
      },
      { rootMargin: "10%" },
    );
    io.observe(root);
  }

  let dprQuery = window.matchMedia(\`(resolution: \${window.devicePixelRatio || 1}dppx)\`);
  const onDpr = () => {
    dprQuery.removeEventListener("change", onDpr);
    dprQuery = window.matchMedia(\`(resolution: \${window.devicePixelRatio || 1}dppx)\`);
    dprQuery.addEventListener("change", onDpr);
    layout();
    wake();
  };
  dprQuery.addEventListener("change", onDpr);

  layout();
  draw();
  schedule();

  document.fonts?.ready
    .then(() => {
      if (dead) return;
      sample();
      wake();
    })
    .catch(() => {});

  return {
    refresh() {
      layout();
      wake();
    },
    wake() {
      shapeDirty = true;
      wake();
    },
    destroy() {
      dead = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      ro.disconnect();
      io?.disconnect();
      dprQuery.removeEventListener("change", onDpr);
      document.removeEventListener("visibilitychange", onVisibility);
      root.removeEventListener("pointermove", toLocal);
      root.removeEventListener("pointerdown", toLocal);
      root.removeEventListener("pointerleave", release);
      root.removeEventListener("pointercancel", release);
      root.removeEventListener("pointerup", onUp);
    },
  };
}

export type GlyphFieldProps = {
  /** The word or short phrase the field draws. */
  text: string;
  /** Accessible name. Defaults to \`text\`. */
  label?: string;
  /** Hide it from assistive tech entirely, when the text is repeated elsewhere. */
  decorative?: boolean;
  /** The character every cell is drawn with. */
  glyph?: string;
  /** Largest cell size in CSS pixels. Small fields use finer cells so the bevels still resolve. */
  cellSize?: number;
  /** Radius of the pointer's reach in CSS pixels. */
  radius?: number;
  /** How far the letters run back into the page, as a fraction of the type size. */
  depth?: number;
  /** How far the word turns toward the pointer, in degrees. */
  tilt?: number;
  /** Sway, and let the torch drift, while nobody is pointing. */
  wander?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function GlyphField({
  text,
  label,
  decorative = false,
  glyph = "+",
  cellSize = 8,
  radius = 110,
  depth = 0.22,
  tilt = 18,
  wander = true,
  className = "",
  style,
}: GlyphFieldProps) {
  const reduced = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, serverReducedMotion);
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<Field | null>(null);
  const optionsRef = useRef<Options>({ text, glyph, cell: cellSize, radius, wander, reduced, depth, tilt });
  optionsRef.current = { text, glyph, cell: cellSize, radius, wander, reduced, depth, tilt };

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const field = createField(root, canvas, () => optionsRef.current);
    fieldRef.current = field;
    return () => {
      field?.destroy();
      fieldRef.current = null;
    };
  }, []);

  useEffect(() => {
    fieldRef.current?.refresh();
  }, [text, glyph, cellSize, depth]);

  useEffect(() => {
    fieldRef.current?.wake();
  }, [reduced, wander, radius, tilt]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        ref={rootRef}
        className={\`bz-gf \${className}\`.trim()}
        style={style}
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : label ?? text}
        aria-hidden={decorative ? true : undefined}
      >
        <canvas ref={canvasRef} className="bz-gf-canvas" aria-hidden="true" />
      </div>
    </>
  );
}`,
    description: "Word built as a bevelled 3D solid of glyphs that tilts toward the cursor.",
    tags: ["canvas", "pointer", "3d", "halftone", "typography", "interactive", "reduced-motion"],
  },
  {
    name: "DockingCard",
    slug: "docking-card",
    path: "cards/DockingCard.tsx",
    category: "cards",
    code: `"use client";

import { useEffect, useRef, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";

/*
 * DockingCard: on hover or keyboard focus, the card's picture flies up into a
 * small dock in its header while a detail panel rises into the space it left.
 *
 * The move is a measured FLIP: the media's box and the dock's box are read at
 * the moment of intent, and the media gets a translate plus a uniform scale, so
 * it lands in the dock without being stretched. Leaving hands the transform
 * back to none, which interrupts cleanly mid-flight.
 *
 * The heading lives in the header strip, above the rising panel, so a focused
 * title link is never covered. On touch screens, under reduced motion and
 * without JavaScript the card is a plain column that shows everything.
 */

const CSS = \`
.bz-dc{position:relative;display:flex;flex-direction:column;overflow:hidden;box-sizing:border-box;border:1px solid var(--bz-line-strong,rgba(10,10,10,0.13));border-radius:20px;background:var(--bz-paper,#ffffff);color:var(--bz-ink,#0a0a0a);font-family:var(--bz-font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);transition:border-color 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-dc *,.bz-dc *::before,.bz-dc *::after{box-sizing:border-box}
.bz-dc:focus-within{border-color:rgba(10,10,10,0.32)}
@media (hover:hover){.bz-dc:hover{border-color:rgba(10,10,10,0.32)}}
.bz-dc-head{display:flex;align-items:center;gap:16px;min-height:88px;padding:14px 16px 14px 20px;border-bottom:1px solid var(--bz-line,rgba(10,10,10,0.06));background:var(--bz-paper-sunken,#fafafa)}
.bz-dc-headings{flex:1;min-width:0}
.bz-dc-eyebrow{margin:0 0 4px;font:500 0.6875rem/1.4 var(--bz-font-mono,ui-monospace,SFMono-Regular,Menlo,monospace);letter-spacing:0.12em;text-transform:uppercase;color:var(--bz-ink-muted,#4a4a4c)}
.bz-dc-title{margin:0;font-size:1.125rem;line-height:1.3;font-weight:600;letter-spacing:-0.01em}
.bz-dc-title a{color:inherit;text-decoration:none;border-radius:4px}
.bz-dc-title a:focus-visible{outline:2px solid var(--bz-focus-ring,#912c22);outline-offset:2px}
@media (hover:hover){.bz-dc-title a:hover{text-decoration:underline;text-underline-offset:3px}}
.bz-dc-dock{position:relative;display:grid;flex:none;place-items:center;width:var(--bz-dc-dock,88px);aspect-ratio:var(--bz-dc-ratio,1.5)}
.bz-dc-dock::after{content:"";position:absolute;inset:0;border:1px dashed rgba(10,10,10,0.34);border-radius:8px;opacity:0;transform:scale(0.9);transition:opacity 300ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)),transform 300ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-dc-meta{font-size:0.8125rem;font-weight:600;line-height:1.25;text-align:right;color:var(--bz-ink-muted,#4a4a4c);transition:opacity 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-dc-stage{padding:20px 20px 0}
.bz-dc-media{position:relative;z-index:3;width:100%;aspect-ratio:var(--bz-dc-ratio,1.5);overflow:hidden;border-radius:12px;background:var(--bz-paper-raised,#f7f3ee);transform-origin:center center;transition:transform 450ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-dc-media>*{display:block;width:100%;height:100%}
.bz-dc-body{padding:16px 20px 20px}
.bz-dc-summary{margin:0;font-size:0.9375rem;line-height:1.55;color:var(--bz-ink-muted,#4a4a4c)}
.bz-dc-panel{padding:0 20px 20px}
.bz-dc[data-dockable="true"] .bz-dc-panel{position:absolute;right:0;bottom:0;left:0;top:var(--bz-dc-head,88px);z-index:2;overflow:auto;padding:20px;background:var(--bz-paper,#ffffff);transform:translateY(calc(100% + 1px));transition:transform 500ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-dc[data-pose="dock"] .bz-dc-panel{transform:translateY(0)}
.bz-dc[data-pose="dock"] .bz-dc-media{transition-duration:500ms}
.bz-dc[data-pose="dock"] .bz-dc-dock::after{opacity:1;transform:none}
.bz-dc[data-pose="dock"] .bz-dc-meta{opacity:0}
@media (prefers-reduced-motion:reduce){.bz-dc,.bz-dc-media,.bz-dc-panel,.bz-dc-dock::after,.bz-dc-meta{transition:none}}
\`;

const DOCK_QUERY = "(hover: hover) and (pointer: fine)";
const RM_QUERY = "(prefers-reduced-motion: reduce)";

const subscribeDockable = (onChange: () => void) => {
  const queries = [window.matchMedia(DOCK_QUERY), window.matchMedia(RM_QUERY)];
  queries.forEach((q) => q.addEventListener("change", onChange));
  return () => queries.forEach((q) => q.removeEventListener("change", onChange));
};
const readDockable = () => window.matchMedia(DOCK_QUERY).matches && !window.matchMedia(RM_QUERY).matches;
const serverDockable = () => false;

/** Offset of \`el\` inside \`root\`, in layout pixels, ignoring any transforms. */
function offsetWithin(el: HTMLElement, root: HTMLElement) {
  let left = 0;
  let top = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    left += node.offsetLeft;
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { left, top };
}

export type DockingCardProps = {
  title: ReactNode;
  /** Makes the title a link. */
  href?: string;
  eyebrow?: ReactNode;
  /** The picture that travels to the dock: an image, an SVG, anything that fills its box. */
  media: ReactNode;
  /** Width divided by height of the media box and the dock. */
  mediaRatio?: number;
  /** Sits in the dock at rest and fades out as the media arrives. */
  meta?: ReactNode;
  summary: ReactNode;
  /** Rises into the card while it is docked, and sits below the summary everywhere else. */
  detail: ReactNode;
  headingLevel?: 2 | 3;
  className?: string;
  style?: CSSProperties;
};

export function DockingCard({
  title,
  href,
  eyebrow,
  media,
  mediaRatio = 1.5,
  meta,
  summary,
  detail,
  headingLevel = 3,
  className = "",
  style,
}: DockingCardProps) {
  const dockable = useSyncExternalStore(subscribeDockable, readDockable, serverDockable);
  const rootRef = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const dockableRef = useRef(dockable);
  dockableRef.current = dockable;
  const settleRef = useRef<() => void>(() => {});

  useEffect(() => {
    const root = rootRef.current;
    const head = headRef.current;
    const dock = dockRef.current;
    const mediaEl = mediaRef.current;
    if (!root || !head || !dock || !mediaEl) return;

    let hovering = false;
    let focusing = false;
    let docked = false;

    const place = () => {
      if (!docked) {
        mediaEl.style.transform = "";
        return;
      }
      const mw = mediaEl.offsetWidth;
      const mh = mediaEl.offsetHeight;
      if (!mw || !mh) return;
      const scale = Math.min(dock.offsetWidth / mw, dock.offsetHeight / mh);
      const from = offsetWithin(mediaEl, root);
      const to = offsetWithin(dock, root);
      const tx = to.left + dock.offsetWidth / 2 - (from.left + mw / 2);
      const ty = to.top + dock.offsetHeight / 2 - (from.top + mh / 2);
      mediaEl.style.transform = \`translate(\${tx}px, \${ty}px) scale(\${scale})\`;
    };

    const settle = () => {
      const next = dockableRef.current && (hovering || focusing);
      if (next === docked) return;
      docked = next;
      root.dataset.pose = next ? "dock" : "rest";
      place();
    };
    settleRef.current = settle;

    const onEnter = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      hovering = true;
      settle();
    };
    const onLeave = () => {
      hovering = false;
      settle();
    };
    const onFocusIn = () => {
      focusing = true;
      settle();
    };
    const onFocusOut = (event: FocusEvent) => {
      if (event.relatedTarget instanceof Node && root.contains(event.relatedTarget)) return;
      focusing = false;
      settle();
    };

    root.addEventListener("pointerenter", onEnter);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("focusout", onFocusOut);

    const ro = new ResizeObserver(() => {
      root.style.setProperty("--bz-dc-head", \`\${head.offsetHeight}px\`);
      place();
    });
    ro.observe(root);
    ro.observe(head);

    return () => {
      ro.disconnect();
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
      mediaEl.style.transform = "";
    };
  }, []);

  // A preference change mid-hover undocks or re-docks straight away.
  useEffect(() => {
    settleRef.current();
  }, [dockable]);

  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <article
        ref={rootRef}
        className={\`bz-dc \${className}\`.trim()}
        data-dockable={dockable ? "true" : "false"}
        data-pose="rest"
        style={{ ["--bz-dc-ratio" as string]: mediaRatio, ...style } as CSSProperties}
      >
        <div ref={headRef} className="bz-dc-head">
          <div className="bz-dc-headings">
            {eyebrow ? <p className="bz-dc-eyebrow">{eyebrow}</p> : null}
            <Heading className="bz-dc-title">{href ? <a href={href}>{title}</a> : title}</Heading>
          </div>
          <div ref={dockRef} className="bz-dc-dock">
            {meta ? <span className="bz-dc-meta">{meta}</span> : null}
          </div>
        </div>
        <div className="bz-dc-stage">
          <div ref={mediaRef} className="bz-dc-media">
            {media}
          </div>
        </div>
        <div className="bz-dc-body">
          <p className="bz-dc-summary">{summary}</p>
        </div>
        <div className="bz-dc-panel">{detail}</div>
      </article>
    </>
  );
}`,
    description: "Card whose picture flies into a header dock as its detail panel rises.",
    tags: ["card", "hover", "flip", "dock", "focus", "reduced-motion"],
  },
  {
    name: "SidewaysScroll",
    slug: "sideways-scroll",
    path: "sections/SidewaysScroll.tsx",
    category: "sections",
    code: `"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";

/*
 * SidewaysScroll: a row of cards that pins to the viewport and pans one pixel
 * sideways for every pixel scrolled down, then holds on the last card for a
 * moment before the page moves on.
 *
 * It needs no scroll library. The section is made as tall as the pan, an inner
 * block sticks to the top, and a single passive scroll listener maps the page's
 * scroll position to the row's translate. Tabbing to a card that is out of view
 * scrolls the page to the point where that card is in view, so the keyboard
 * never lands on something hidden.
 *
 * Narrow or short viewports, reduced motion and rows that already fit get a
 * plain snap scroller instead.
 */

const CSS = \`
.bz-ss{position:relative;color:var(--bz-ink,#0a0a0a);font-family:var(--bz-font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif)}
.bz-ss *,.bz-ss *::before,.bz-ss *::after{box-sizing:border-box}
.bz-ss-sticky{display:flex;flex-direction:column;justify-content:center;gap:20px;padding-block:24px}
.bz-ss[data-layout="pinned"] .bz-ss-sticky{position:sticky;top:var(--bz-ss-top,0px);height:calc(100vh - var(--bz-ss-top,0px));overflow:hidden}
.bz-ss-head{padding-inline:var(--bz-ss-pad,24px)}
.bz-ss-row{position:relative;-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - min(12%,96px)),transparent);mask-image:linear-gradient(90deg,#000 calc(100% - min(12%,96px)),transparent)}
.bz-ss[data-end="true"] .bz-ss-row{-webkit-mask-image:none;mask-image:none}
.bz-ss-track{position:relative;display:flex;gap:16px;padding:4px var(--bz-ss-pad,24px) 16px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-padding-inline:var(--bz-ss-pad,24px);overscroll-behavior-x:contain;outline:none}
.bz-ss-track:focus-visible{outline:2px solid var(--bz-focus-ring,#912c22);outline-offset:-2px;border-radius:12px}
.bz-ss[data-layout="pinned"] .bz-ss-track{overflow:visible;scroll-snap-type:none;will-change:transform}
.bz-ss-item{flex:none;scroll-snap-align:start}
.bz-ss-hint{display:none;align-self:flex-start;align-items:center;gap:10px;margin-inline:var(--bz-ss-pad,24px);font-size:0.8125rem;font-weight:500;line-height:1;color:var(--bz-ink-muted,#4a4a4c);transition:opacity 300ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-ss[data-layout="pinned"] .bz-ss-hint{display:inline-flex}
.bz-ss-mouse{position:relative;width:18px;height:28px;border:1.5px solid currentColor;border-radius:10px}
.bz-ss-mouse::after{content:"";position:absolute;top:6px;left:50%;width:3px;height:6px;margin-left:-1.5px;border-radius:2px;background:currentColor;animation:bz-ss-wheel 1.6s var(--bz-ease-in-out,cubic-bezier(0.77,0,0.175,1)) infinite}
.bz-ss[data-onscreen="false"] .bz-ss-mouse::after,.bz-ss[data-hint="off"] .bz-ss-mouse::after{animation-play-state:paused}
@keyframes bz-ss-wheel{0%{transform:translateY(0);opacity:1}70%{transform:translateY(8px);opacity:0}100%{transform:translateY(0);opacity:0}}
@media (prefers-reduced-motion:reduce){.bz-ss-mouse::after{animation:none}.bz-ss-hint{transition:none}}
\`;

const RM_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(RM_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const readReducedMotion = () => window.matchMedia(RM_QUERY).matches;
const serverReducedMotion = () => false;

/** Extra scroll, as a share of the pan, spent holding on the last card. */
const HOLD = 0.18;

export type SidewaysScrollProps = {
  /** One card per child. */
  children: ReactNode;
  /** Names the list of cards for assistive tech. */
  label: string;
  /** Pinned above the row, and panned with it out of the way of nothing. */
  heading?: ReactNode;
  /** Distance from the top of the viewport to pin at, for a sticky header. */
  pinOffset?: number;
  /** Below this viewport width the row is a snap scroller. */
  minWidth?: number;
  /** Below this viewport height the row is a snap scroller. */
  minHeight?: number;
  /** Text beside the scroll cue while pinned. */
  hint?: string;
  className?: string;
};

export function SidewaysScroll({
  children,
  label,
  heading,
  pinOffset = 0,
  minWidth = 640,
  minHeight = 420,
  hint = "Scroll",
  className = "",
}: SidewaysScrollProps) {
  const reduced = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, serverReducedMotion);
  const [mode, setMode] = useState<"scroller" | "pinned">("scroller");
  const sectionRef = useRef<HTMLElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    const section = sectionRef.current;
    const row = rowRef.current;
    const track = trackRef.current;
    if (!section || !row || !track) return;

    let distance = 0;
    let start = 0;
    let raf = 0;

    const measure = () => {
      const items = track.children;
      const lastItem = items[items.length - 1] as HTMLElement | undefined;
      const padRight = parseFloat(getComputedStyle(track).paddingRight) || 0;
      const contentRight = lastItem ? lastItem.offsetLeft + lastItem.offsetWidth + padRight : 0;
      distance = Math.max(0, Math.round(contentRight - row.clientWidth));
      const allowPan =
        !readReducedMotion() && window.innerWidth >= minWidth && window.innerHeight >= minHeight && distance > 0;
      const nextMode = allowPan ? "pinned" : "scroller";
      if (nextMode !== modeRef.current) {
        modeRef.current = nextMode;
        setMode(nextMode);
      }
      if (nextMode === "pinned") {
        const stickyHeight = window.innerHeight - pinOffset;
        section.style.height = \`\${Math.round(stickyHeight + distance * (1 + HOLD))}px\`;
        start = section.getBoundingClientRect().top + window.scrollY - pinOffset;
      } else {
        section.style.height = "";
        track.style.transform = "";
      }
      update();
    };

    const update = () => {
      raf = 0;
      if (modeRef.current !== "pinned") {
        section.dataset.end = String(track.scrollLeft + track.clientWidth >= track.scrollWidth - 4);
        return;
      }
      const travel = Math.max(0, Math.min(window.scrollY - start, distance * (1 + HOLD)));
      const x = Math.min(travel, distance);
      track.style.transform = \`translate3d(\${-x}px, 0, 0)\`;
      section.dataset.end = String(x >= distance - 1);
      const showHint = travel < 24;
      section.dataset.hint = showHint ? "on" : "off";
      if (hintRef.current) hintRef.current.style.opacity = showHint ? "1" : "0";
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    const onFocusIn = (event: FocusEvent) => {
      if (modeRef.current !== "pinned") return;
      const item = (event.target as Element | null)?.closest?.(".bz-ss-item") as HTMLElement | null;
      if (!item || !track.contains(item)) return;
      const current = Math.max(0, Math.min(window.scrollY - start, distance));
      const left = item.offsetLeft - current;
      const right = left + item.offsetWidth;
      if (left >= 0 && right <= row.clientWidth) return;
      const padLeft = parseFloat(getComputedStyle(track).paddingLeft) || 0;
      const wanted = Math.max(0, Math.min(item.offsetLeft - padLeft, distance));
      // After the browser's own scroll-into-view has run.
      requestAnimationFrame(() => window.scrollTo({ top: start + wanted, behavior: "auto" }));
    };

    const ro = new ResizeObserver(() => measure());
    ro.observe(row);
    ro.observe(track);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", onScroll, { passive: true });
    track.addEventListener("scroll", onScroll, { passive: true });
    track.addEventListener("focusin", onFocusIn);

    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(([entry]) => {
        section.dataset.onscreen = String(entry.isIntersecting);
      });
      io.observe(section);
    }

    measure();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io?.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll);
      track.removeEventListener("scroll", onScroll);
      track.removeEventListener("focusin", onFocusIn);
      section.style.height = "";
      track.style.transform = "";
    };
  }, [reduced, pinOffset, minWidth, minHeight, mode]);

  const items = Children.toArray(children);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <section
        ref={sectionRef}
        className={\`bz-ss \${className}\`.trim()}
        data-layout={mode}
        aria-label={heading ? undefined : label}
        style={{ ["--bz-ss-top" as string]: \`\${pinOffset}px\` } as CSSProperties}
      >
        <div className="bz-ss-sticky">
          {heading ? <div className="bz-ss-head">{heading}</div> : null}
          <div ref={rowRef} className="bz-ss-row">
            <div
              ref={trackRef}
              className="bz-ss-track"
              role="list"
              aria-label={label}
              tabIndex={mode === "scroller" ? 0 : undefined}
            >
              {items.map((child, index) => (
                <div key={isValidElement(child) && child.key != null ? child.key : index} className="bz-ss-item" role="listitem">
                  {child}
                </div>
              ))}
            </div>
          </div>
          <div ref={hintRef} className="bz-ss-hint" aria-hidden="true">
            <span className="bz-ss-mouse" />
            {hint}
          </div>
        </div>
      </section>
    </>
  );
}`,
    description: "Row of cards that pins in place and pans sideways as the page scrolls.",
    tags: ["scroll", "horizontal", "sticky", "pin", "keyboard", "snap"],
  },
  {
    name: "AutoplayCarousel",
    slug: "autoplay-carousel",
    path: "media/AutoplayCarousel.tsx",
    category: "media",
    code: `"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

/*
 * AutoplayCarousel: a photo carousel that moves on by itself and never crops.
 *
 * Every photo sits on a plate sized to its own proportions inside the stage,
 * over a blurred, darkened copy of itself, so portraits and landscapes share one
 * stage without losing an edge. The progress bar under the photo is the timer:
 * its \`animationend\` advances the slide, so the bar and the change can never
 * drift apart, and anything that pauses the bar pauses the carousel.
 *
 * It holds while the pointer is over it, while keyboard focus is inside, while a
 * finger is down, when it is out of view and when the tab is hidden. The pause
 * button stops it outright, and reduced motion starts it paused. Changes made by
 * the reader are announced; the automatic ones are not, so nothing talks over
 * the page every few seconds.
 */

const CSS = \`
.bz-ac{container-type:inline-size;position:relative;color:var(--bz-ink,#0a0a0a);font-family:var(--bz-font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif)}
.bz-ac *,.bz-ac *::before,.bz-ac *::after{box-sizing:border-box}
.bz-ac:focus-visible{outline:2px solid var(--bz-focus-ring,#912c22);outline-offset:4px;border-radius:20px}
.bz-ac-viewport{position:relative;overflow:hidden;border-radius:20px;background:var(--bz-void,#0c0c0f);touch-action:pan-y}
.bz-ac-track{display:flex;transition:transform 600ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-ac-slide{--bz-ac-stage:var(--bz-ac-wide,1.5);position:relative;flex:0 0 100%;margin:0;aspect-ratio:var(--bz-ac-stage);overflow:hidden;isolation:isolate}
@container (max-width:560px){.bz-ac-slide{--bz-ac-stage:var(--bz-ac-narrow,1)}}
.bz-ac-backdrop{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:blur(32px) saturate(1.1) brightness(0.45);transform:scale(1.25)}
.bz-ac-plate{position:absolute;inset:0;margin:auto;width:min(100%,calc(100% * var(--bz-ac-photo,1.5) / var(--bz-ac-stage)));height:min(100%,calc(100% * var(--bz-ac-stage) / var(--bz-ac-photo,1.5)));overflow:hidden;box-shadow:0 0 0 1px rgba(255,255,255,0.14)}
.bz-ac-img{display:block;width:100%;height:100%;object-fit:cover}
.bz-ac-caption{position:absolute;left:12px;bottom:14px;z-index:1;max-width:calc(100% - 24px);margin:0;padding:6px 12px;border-radius:999px;background:rgba(12,12,15,0.66);color:#ffffff;font-size:0.8125rem;font-weight:500;line-height:1.3}
.bz-ac-nav{position:absolute;top:50%;z-index:2;display:grid;place-items:center;width:48px;height:48px;margin-top:-24px;padding:0;border:1px solid rgba(255,255,255,0.35);border-radius:999px;background:rgba(12,12,15,0.55);color:#ffffff;cursor:pointer;transition:background-color 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)),transform 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-ac-nav[data-side="start"]{left:12px}
.bz-ac-nav[data-side="end"]{right:12px}
.bz-ac-nav svg{width:18px;height:18px}
.bz-ac-nav:focus-visible{outline:2px solid #ffffff;outline-offset:2px;box-shadow:0 0 0 6px rgba(12,12,15,0.6)}
.bz-ac-nav:active{transform:scale(0.97)}
@media (hover:hover){.bz-ac-nav:hover{background:rgba(12,12,15,0.82)}}
.bz-ac-progress{position:absolute;right:0;bottom:0;left:0;z-index:2;height:3px;background:rgba(255,255,255,0.25)}
.bz-ac-bar{display:block;height:100%;background:#ffffff;transform:scaleX(0);transform-origin:left center;animation:bz-ac-fill 5000ms linear forwards}
@keyframes bz-ac-fill{to{transform:scaleX(1)}}
.bz-ac:not([data-playing="true"]) .bz-ac-bar{animation-play-state:paused}
.bz-ac-controls{display:flex;align-items:center;justify-content:center;gap:4px;margin-top:10px}
.bz-ac-toggle{display:grid;flex:none;place-items:center;width:48px;height:48px;margin-right:4px;padding:0;border:1px solid var(--bz-line-strong,rgba(10,10,10,0.13));border-radius:999px;background:var(--bz-paper,#ffffff);color:var(--bz-ink,#0a0a0a);cursor:pointer;transition:background-color 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)),transform 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-ac-toggle svg{width:14px;height:14px}
.bz-ac-toggle:active{transform:scale(0.97)}
@media (hover:hover){.bz-ac-toggle:hover{background:var(--bz-paper-sunken,#fafafa)}}
.bz-ac-toggle:focus-visible,.bz-ac-dot:focus-visible{outline:2px solid var(--bz-focus-ring,#912c22);outline-offset:2px}
.bz-ac-dots{display:flex;align-items:center}
.bz-ac-dot{display:grid;place-items:center;width:48px;height:48px;padding:0;border:0;border-radius:999px;background:transparent;cursor:pointer}
.bz-ac-dot::before{content:"";width:8px;height:8px;border-radius:999px;background:rgba(10,10,10,0.45);transition:width 300ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)),background-color 300ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-ac-dot[aria-current="true"]::before{width:24px;background:var(--bz-ink,#0a0a0a)}
.bz-ac-counter{min-width:64px;font:500 0.8125rem/1 var(--bz-font-mono,ui-monospace,SFMono-Regular,Menlo,monospace);font-variant-numeric:tabular-nums;text-align:center;color:var(--bz-ink-muted,#4a4a4c)}
.bz-ac-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
@media (prefers-reduced-motion:reduce){.bz-ac-track,.bz-ac-nav,.bz-ac-toggle,.bz-ac-dot::before{transition:none}.bz-ac-nav:active,.bz-ac-toggle:active{transform:none}}
\`;

const RM_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(RM_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const readReducedMotion = () => window.matchMedia(RM_QUERY).matches;
const serverReducedMotion = () => false;

export type CarouselSlide = {
  src: string;
  alt: string;
  caption?: string;
  /** Intrinsic size, so the plate is right before the image loads. */
  width?: number;
  height?: number;
};

export type AutoplayCarouselProps = {
  slides: CarouselSlide[];
  /** Names the carousel for assistive tech. */
  label: string;
  /** Time on each slide, in milliseconds. */
  interval?: number;
  /** Stage width divided by height. */
  aspect?: number;
  /** Stage proportions when the carousel is 560px wide or less. */
  narrowAspect?: number;
  /** More slides than this show a counter instead of dots. */
  maxDots?: number;
  pauseLabel?: string;
  className?: string;
};

export function AutoplayCarousel({
  slides,
  label,
  interval = 5000,
  aspect = 1.5,
  narrowAspect = 1,
  maxDots = 6,
  pauseLabel = "Pause slideshow",
  className = "",
}: AutoplayCarouselProps) {
  const reduced = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, serverReducedMotion);
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [autoPref, setAutoPref] = useState<boolean | null>(null);
  const [held, setHeld] = useState(false);
  const [ratios, setRatios] = useState<Record<number, number>>({});
  const [announcement, setAnnouncement] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const holds = useRef(new Set<string>());
  const swipe = useRef<{ x: number; y: number } | null>(null);

  const current = count ? Math.max(0, Math.min(index, count - 1)) : 0;
  const auto = autoPref ?? !reduced;
  const playing = auto && !held && count > 1;

  const hold = useCallback((reason: string, on: boolean) => {
    const set = holds.current;
    if (on) set.add(reason);
    else set.delete(reason);
    setHeld(set.size > 0);
  }, []);

  const go = useCallback(
    (next: number, announce: boolean) => {
      if (!count) return;
      const i = ((next % count) + count) % count;
      setIndex(i);
      if (announce) {
        const caption = slides[i]?.caption;
        setAnnouncement(\`Photo \${i + 1} of \${count}\${caption ? \`: \${caption}\` : ""}\`);
      }
    },
    [count, slides],
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([entry]) => hold("offscreen", !entry.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [hold]);

  useEffect(() => {
    const sync = () => hold("hidden", document.visibilityState === "hidden");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [hold]);

  if (!count) return null;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(current + 1, true);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(current - 1, true);
    }
  };

  const onFocus = (event: ReactFocusEvent<HTMLDivElement>) => {
    let visible = true;
    try {
      visible = (event.target as Element).matches(":focus-visible");
    } catch {
      visible = true;
    }
    if (visible) hold("focus", true);
  };
  const onBlur = (event: ReactFocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    if (next && rootRef.current?.contains(next)) return;
    hold("focus", false);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") return;
    swipe.current = { x: event.clientX, y: event.clientY };
    hold("press", true);
  };
  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = swipe.current;
    swipe.current = null;
    hold("press", false);
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 44 || Math.abs(dx) <= Math.abs(dy)) return;
    go(current + (dx < 0 ? 1 : -1), true);
  };

  const rootStyle = {
    ["--bz-ac-wide" as string]: aspect,
    ["--bz-ac-narrow" as string]: narrowAspect,
  } as CSSProperties;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        ref={rootRef}
        className={\`bz-ac \${className}\`.trim()}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        tabIndex={0}
        data-playing={playing ? "true" : "false"}
        style={rootStyle}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") hold("hover", true);
        }}
        onPointerLeave={() => hold("hover", false)}
      >
        <div
          className="bz-ac-viewport"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            swipe.current = null;
            hold("press", false);
          }}
        >
          <div className="bz-ac-track" style={{ transform: \`translate3d(\${-current * 100}%, 0, 0)\` }}>
            {slides.map((slide, i) => {
              const ratio = slide.width && slide.height ? slide.width / slide.height : ratios[i];
              return (
                <figure
                  key={\`\${slide.src}-\${i}\`}
                  className="bz-ac-slide"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={\`\${i + 1} of \${count}\${slide.caption ? \`: \${slide.caption}\` : ""}\`}
                  aria-hidden={i === current ? undefined : true}
                  style={ratio ? ({ ["--bz-ac-photo" as string]: ratio } as CSSProperties) : undefined}
                >
                  <img className="bz-ac-backdrop" src={slide.src} alt="" aria-hidden="true" decoding="async" loading={i === 0 ? "eager" : "lazy"} />
                  <div className="bz-ac-plate">
                    <img
                      className="bz-ac-img"
                      src={slide.src}
                      alt={slide.alt}
                      decoding="async"
                      loading={i === 0 ? "eager" : "lazy"}
                      draggable={false}
                      onLoad={(event) => {
                        if (slide.width && slide.height) return;
                        const img = event.currentTarget;
                        if (img.naturalWidth && img.naturalHeight) {
                          setRatios((prev) => ({ ...prev, [i]: img.naturalWidth / img.naturalHeight }));
                        }
                      }}
                    />
                  </div>
                  {slide.caption ? <figcaption className="bz-ac-caption">{slide.caption}</figcaption> : null}
                </figure>
              );
            })}
          </div>
          {count > 1 ? (
            <>
              <button type="button" className="bz-ac-nav" data-side="start" aria-label="Previous photo" onClick={() => go(current - 1, true)}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button type="button" className="bz-ac-nav" data-side="end" aria-label="Next photo" onClick={() => go(current + 1, true)}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="bz-ac-progress" aria-hidden="true">
                <span
                  key={current}
                  className="bz-ac-bar"
                  style={{ animationDuration: \`\${interval}ms\`, opacity: auto ? 1 : 0 }}
                  onAnimationEnd={() => go(current + 1, false)}
                />
              </div>
            </>
          ) : null}
        </div>

        {count > 1 ? (
          <div className="bz-ac-controls">
            <button
              type="button"
              className="bz-ac-toggle"
              aria-label={pauseLabel}
              aria-pressed={!auto}
              onClick={() => setAutoPref(!auto)}
            >
              {auto ? (
                <svg viewBox="0 0 14 14" aria-hidden="true">
                  <rect x="2.5" y="1.5" width="3" height="11" rx="1" fill="currentColor" />
                  <rect x="8.5" y="1.5" width="3" height="11" rx="1" fill="currentColor" />
                </svg>
              ) : (
                <svg viewBox="0 0 14 14" aria-hidden="true">
                  <path d="M3.5 2.2v9.6c0 .6.7 1 1.2.6l7.2-4.8a.7.7 0 0 0 0-1.2L4.7 1.6c-.5-.4-1.2 0-1.2.6z" fill="currentColor" />
                </svg>
              )}
            </button>
            {count <= maxDots ? (
              <div className="bz-ac-dots">
                {slides.map((slide, i) => (
                  <button
                    key={\`\${slide.src}-dot-\${i}\`}
                    type="button"
                    className="bz-ac-dot"
                    aria-label={\`Show photo \${i + 1}\${slide.caption ? \`: \${slide.caption}\` : ""}\`}
                    aria-current={i === current ? "true" : undefined}
                    onClick={() => go(i, true)}
                  />
                ))}
              </div>
            ) : (
              <p className="bz-ac-counter" aria-hidden="true">
                {String(current + 1).padStart(String(count).length, "0")} / {count}
              </p>
            )}
          </div>
        ) : null}

        <p className="bz-ac-sr" aria-live="polite">
          {announcement}
        </p>
      </div>
    </>
  );
}`,
    description: "Photo carousel that never crops, with a progress-bar timer and a pause button.",
    tags: ["carousel", "autoplay", "images", "swipe", "accessible", "pause"],
  },
  {
    name: "MessageForm",
    slug: "message-form",
    path: "forms/MessageForm.tsx",
    category: "forms",
    code: `"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";

/*
 * MessageForm: a complete form pattern, not just fields.
 *
 * - Validation runs on submit. Every invalid field gets \`aria-invalid\` and an
 *   error message tied to it with \`aria-describedby\`, and focus moves to the
 *   first one after the errors have rendered, so it is read out with its message.
 * - One polite live region, always mounted, says what happened: how many fields
 *   need attention, that details are being checked, that the message is being
 *   sent, that it was sent, or that it was not.
 * - A field can carry an asynchronous \`check\`, such as whether a link opens.
 *   Checks are cancelled if the form is submitted again or unmounted, time out,
 *   and let the message through when they cannot run at all.
 * - Sending is honest: the form only says "sent" when \`onSend\` resolved. A
 *   failure or a timeout keeps what was typed and can offer another way to reach
 *   you. The submit button keeps its width while its label changes.
 */

const CSS = \`
.bz-mf{container-type:inline-size;color:var(--bz-ink,#0a0a0a);font-family:var(--bz-font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif)}
.bz-mf *,.bz-mf *::before,.bz-mf *::after{box-sizing:border-box}
.bz-mf-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:18px}
@container (min-width:520px){.bz-mf-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.bz-mf-field[data-span="half"]{grid-column:span 1}}
.bz-mf-field{grid-column:1/-1;display:flex;flex-direction:column;gap:6px}
.bz-mf-label{font-size:0.875rem;font-weight:600;line-height:1.4}
.bz-mf-req{margin-left:3px;color:var(--bz-danger,#b91c1c)}
.bz-mf-control{width:100%;min-height:48px;margin:0;padding:11px 14px;border:1px solid var(--bz-ink-disabled,#8a8a8e);border-radius:12px;background:var(--bz-paper,#ffffff);color:inherit;font:inherit;font-size:1rem;line-height:1.5;transition:border-color 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)),box-shadow 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
textarea.bz-mf-control{min-height:120px;resize:vertical}
.bz-mf-control::placeholder{color:var(--bz-ink-subtle,#6b6b70)}
@media (hover:hover){.bz-mf-control:hover{border-color:var(--bz-ink-muted,#4a4a4c)}}
.bz-mf-control:focus-visible{outline:2px solid var(--bz-focus-ring,#912c22);outline-offset:2px;border-color:var(--bz-ink,#0a0a0a)}
.bz-mf-control[aria-invalid="true"]{border-color:var(--bz-danger-decor,#ef4444);box-shadow:inset 0 0 0 1px var(--bz-danger-decor,#ef4444)}
.bz-mf-hint{margin:0;font-size:0.8125rem;line-height:1.45;color:var(--bz-ink-subtle,#6b6b70)}
.bz-mf-error{display:flex;align-items:flex-start;gap:6px;margin:0;font-size:0.8125rem;font-weight:500;line-height:1.45;color:var(--bz-danger,#b91c1c)}
.bz-mf-error svg{flex:none;width:14px;height:14px;margin-top:2px}
.bz-mf-check{display:flex;align-items:center;gap:6px;min-height:1.2em;margin:0;font-size:0.8125rem;font-weight:500;line-height:1.45;color:var(--bz-ink-muted,#4a4a4c)}
.bz-mf-check:empty{display:none}
.bz-mf-check[data-result="ok"]{color:var(--bz-emerald,#047857)}
.bz-mf-check[data-result="blocked"]{color:var(--bz-danger,#b91c1c)}
.bz-mf-check svg{flex:none;width:14px;height:14px}
.bz-mf-spin{animation:bz-mf-turn 900ms linear infinite}
@keyframes bz-mf-turn{to{transform:rotate(360deg)}}
.bz-mf-skip{position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden}
.bz-mf-alert{display:flex;gap:10px;margin:18px 0 0;padding:12px 14px;border:1px solid var(--bz-danger-decor,#ef4444);border-radius:12px;background:#fef2f2;color:var(--bz-danger,#b91c1c);font-size:0.875rem;line-height:1.5}
.bz-mf-alert a{color:inherit;font-weight:600;text-underline-offset:3px}
.bz-mf-alert a:focus-visible{outline:2px solid var(--bz-focus-ring,#912c22);outline-offset:2px;border-radius:2px}
.bz-mf-alert svg{flex:none;width:16px;height:16px;margin-top:2px}
.bz-mf-actions{display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px;margin-top:22px}
.bz-mf-submit{display:inline-grid;align-items:center;min-height:48px;padding:0 22px;border:0;border-radius:999px;background:var(--bz-ink,#0a0a0a);color:#ffffff;font:inherit;font-size:0.9375rem;font-weight:600;cursor:pointer;transition:background-color 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)),transform 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-mf-submit>span{display:flex;grid-area:1/1;align-items:center;justify-content:center;gap:8px}
.bz-mf-submit>span[aria-hidden="true"]{visibility:hidden}
@media (hover:hover){.bz-mf-submit:hover{background:#2b2b2e}}
.bz-mf-submit:focus-visible,.bz-mf-secondary:focus-visible{outline:2px solid var(--bz-focus-ring,#912c22);outline-offset:2px}
.bz-mf-submit:active{transform:scale(0.97)}
.bz-mf-submit[aria-disabled="true"]{cursor:progress;background:#3a3a3e}
.bz-mf-submit svg{width:16px;height:16px}
.bz-mf-note{margin:0;font-size:0.8125rem;line-height:1.45;color:var(--bz-ink-subtle,#6b6b70)}
.bz-mf-done{display:flex;flex-direction:column;align-items:flex-start;gap:10px}
.bz-mf-mark{display:grid;place-items:center;width:44px;height:44px;border-radius:999px;background:#ecfdf5;color:var(--bz-emerald,#047857)}
.bz-mf-mark svg{width:20px;height:20px}
.bz-mf-done-title{margin:4px 0 0;font-size:1.25rem;font-weight:600;letter-spacing:-0.01em;outline:none}
.bz-mf-done-body{margin:0;max-width:30rem;font-size:0.9375rem;line-height:1.55;color:var(--bz-ink-muted,#4a4a4c)}
.bz-mf-secondary{min-height:48px;margin-top:6px;padding:0 18px;border:1px solid var(--bz-ink-disabled,#8a8a8e);border-radius:999px;background:transparent;color:inherit;font:inherit;font-size:0.9375rem;font-weight:600;cursor:pointer}
@media (hover:hover){.bz-mf-secondary:hover{background:rgba(10,10,10,0.05)}}
.bz-mf-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
@media (prefers-reduced-motion:reduce){.bz-mf-spin{animation:none}.bz-mf-control,.bz-mf-submit{transition:none}.bz-mf-submit:active{transform:none}}
\`;

export type MessageFormField = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "url" | "textarea";
  required?: boolean;
  placeholder?: string;
  hint?: string;
  autoComplete?: string;
  minLength?: number;
  maxLength?: number;
  /** Half width beside another half-width field when the form is wide enough. */
  span?: "half" | "full";
  /** Extra rule. Return a message to show, or null. */
  validate?: (value: string, values: Record<string, string>) => string | null;
  /**
   * Asynchronous check run before sending, only when the field has a value.
   * Resolve \`{ ok: false, message }\` to stop the send, \`{ ok: true, message }\`
   * to confirm, or null when the check could not run.
   */
  check?: (value: string, signal: AbortSignal) => Promise<{ ok: boolean; message: string } | null>;
};

export type MessageFormResult = void | { fieldErrors?: Record<string, string>; error?: string };

export type MessageFormProps = {
  /** Send the message. Resolve when it arrived; reject or return \`error\` when it did not. */
  onSend: (values: Record<string, string>, signal: AbortSignal) => Promise<MessageFormResult>;
  fields?: MessageFormField[];
  defaultValues?: Record<string, string>;
  submitLabel?: string;
  sendingLabel?: string;
  checkingLabel?: string;
  note?: ReactNode;
  successTitle?: ReactNode;
  successBody?: ReactNode | ((values: Record<string, string>) => ReactNode);
  /** Another way to get in touch, offered when sending fails. */
  fallback?: { href: string; label: string };
  timeoutMs?: number;
  checkTimeoutMs?: number;
  /** Name of a hidden field that people leave empty and bots fill in. \`false\` turns it off. */
  trapName?: string | false;
  className?: string;
};

const DEFAULT_FIELDS: MessageFormField[] = [
  { name: "name", label: "Name", required: true, autoComplete: "name", span: "half", minLength: 2 },
  { name: "email", label: "Email", type: "email", required: true, autoComplete: "email", span: "half" },
  { name: "message", label: "Message", type: "textarea", required: true, minLength: 20, hint: "A few sentences is plenty." },
];

const EMAIL = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/;
const PHONE = /^\\+?[\\d\\s().-]{7,20}$/;
const LINK = /^https?:\\/\\/[^\\s/.]+\\.[^\\s]{2,}/i;

type Status = "idle" | "checking" | "sending" | "sent" | "failed";
type CheckView = { result: "checking" | "ok" | "blocked" | "unavailable"; message: string };

function validateField(field: MessageFormField, value: string, values: Record<string, string>) {
  const trimmed = value.trim();
  if (field.required && !trimmed) return \`\${field.label} is required.\`;
  if (!trimmed) return null;
  if (field.type === "email" && !EMAIL.test(trimmed)) return "Enter an email address like name@example.com.";
  if (field.type === "tel" && !PHONE.test(trimmed)) return "Enter a phone number of 7 to 20 digits.";
  if (field.type === "url" && !LINK.test(trimmed)) return "Enter a link that starts with https://";
  if (field.minLength && trimmed.length < field.minLength) return \`Use at least \${field.minLength} characters.\`;
  if (field.maxLength && value.length > field.maxLength) return \`Use \${field.maxLength} characters or fewer.\`;
  return field.validate?.(value, values) ?? null;
}

function withTimeout<T>(promise: Promise<T>, ms: number, controller: AbortController) {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      controller.abort();
      reject(new Error("timeout"));
    }, ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

const Spinner = () => (
  <svg className="bz-mf-spin" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
    <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const Alert = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 1.8 15 14H1L8 1.8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M8 6.2v3.4M8 11.8v.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const Tick = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function MessageForm({
  onSend,
  fields = DEFAULT_FIELDS,
  defaultValues = {},
  submitLabel = "Send message",
  sendingLabel = "Sending",
  checkingLabel = "Checking",
  note,
  successTitle = "Message sent",
  successBody = "Thanks for writing. You will hear back soon.",
  fallback,
  timeoutMs = 15000,
  checkTimeoutMs = 6000,
  trapName = "leave_this_empty",
  className = "",
}: MessageFormProps) {
  const uid = useId().replace(/:/g, "");
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checks, setChecks] = useState<Record<string, CheckView>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [sentValues, setSentValues] = useState<Record<string, string>>({});
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const busy = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);
  const pendingFocus = useRef<string | null>(null);
  const flip = useRef(false);

  const announce = (message: string) => {
    // A trailing zero-width space forces a repeat of the same words to be read again.
    flip.current = !flip.current;
    setAnnouncement(flip.current ? message : \`\${message}​\`);
  };

  useEffect(() => () => controllerRef.current?.abort(), []);

  // Focus after the errors are in the DOM, so the field is read with its message.
  useEffect(() => {
    const name = pendingFocus.current;
    if (!name) return;
    pendingFocus.current = null;
    const el = formRef.current?.elements.namedItem(name);
    if (el instanceof HTMLElement) el.focus();
  }, [errors]);

  useEffect(() => {
    if (status === "sent") doneRef.current?.focus();
  }, [status]);

  const report = (found: Record<string, string>) => {
    const names = fields.map((f) => f.name).filter((name) => found[name]);
    pendingFocus.current = names[0] ?? null;
    setErrors(found);
    setStatus("idle");
    const labels = names.map((name) => fields.find((f) => f.name === name)?.label ?? name);
    announce(\`\${names.length} \${names.length === 1 ? "field needs" : "fields need"} attention: \${labels.join(", ")}.\`);
  };

  const onFieldChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = event.currentTarget;
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (checks[name]) {
      setChecks((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy.current) return;
    const data = new FormData(event.currentTarget);

    if (trapName && String(data.get(trapName) ?? "")) {
      setSentValues({});
      setStatus("sent");
      return;
    }

    const values = Object.fromEntries(fields.map((f) => [f.name, String(data.get(f.name) ?? "")]));
    const found: Record<string, string> = {};
    for (const field of fields) {
      const message = validateField(field, values[field.name], values);
      if (message) found[field.name] = message;
    }
    if (Object.keys(found).length) {
      report(found);
      return;
    }

    busy.current = true;
    setErrors({});
    setFailure(null);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const toCheck = fields.filter((f) => f.check && values[f.name].trim());
      if (toCheck.length) {
        setStatus("checking");
        announce(\`\${checkingLabel} your details.\`);
        const blocked: Record<string, string> = {};
        await Promise.all(
          toCheck.map(async (field) => {
            setChecks((prev) => ({ ...prev, [field.name]: { result: "checking", message: \`\${checkingLabel}…\` } }));
            const own = new AbortController();
            const relay = () => own.abort();
            controller.signal.addEventListener("abort", relay);
            try {
              const result = await withTimeout(field.check!(values[field.name], own.signal), checkTimeoutMs, own);
              if (controller.signal.aborted) return;
              if (!result) throw new Error("unavailable");
              setChecks((prev) => ({ ...prev, [field.name]: { result: result.ok ? "ok" : "blocked", message: result.message } }));
              if (!result.ok) blocked[field.name] = result.message;
            } catch {
              if (controller.signal.aborted) return;
              setChecks((prev) => ({
                ...prev,
                [field.name]: { result: "unavailable", message: "This could not be checked, so it will be sent as it is." },
              }));
            } finally {
              controller.signal.removeEventListener("abort", relay);
            }
          }),
        );
        if (controller.signal.aborted) return;
        if (Object.keys(blocked).length) {
          report(blocked);
          return;
        }
      }

      setStatus("sending");
      announce(\`\${sendingLabel} your message.\`);
      const result = await withTimeout(onSend(values, controller.signal), timeoutMs, controller);
      if (result && result.fieldErrors && Object.keys(result.fieldErrors).length) {
        report(result.fieldErrors);
        return;
      }
      if (result && result.error) throw new Error(result.error);
      setSentValues(values);
      setStatus("sent");
      announce(typeof successTitle === "string" ? successTitle : "Message sent.");
    } catch (error) {
      const message =
        error instanceof Error && error.message === "timeout"
          ? "Sending took too long, so it was stopped. Nothing you typed was lost."
          : error instanceof Error && error.message
            ? error.message
            : "The message could not be sent.";
      setFailure(message);
      setStatus("failed");
      announce(\`Not sent. \${message}\`);
    } finally {
      busy.current = false;
    }
  };

  const reset = () => {
    setErrors({});
    setChecks({});
    setFailure(null);
    setStatus("idle");
    setFormKey((k) => k + 1);
    announce("Form cleared.");
  };

  const working = status === "checking" || status === "sending";
  const liveRegion = (
    <p className="bz-mf-sr" aria-live="polite">
      {announcement}
    </p>
  );

  if (status === "sent") {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className={\`bz-mf \${className}\`.trim()}>
          <div className="bz-mf-done">
            <span className="bz-mf-mark" aria-hidden="true">
              <Tick />
            </span>
            <h3 ref={doneRef} tabIndex={-1} className="bz-mf-done-title">
              {successTitle}
            </h3>
            <p className="bz-mf-done-body">{typeof successBody === "function" ? successBody(sentValues) : successBody}</p>
            <button type="button" className="bz-mf-secondary" onClick={reset}>
              Write another
            </button>
          </div>
          {liveRegion}
        </div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <form key={formKey} ref={formRef} className={\`bz-mf \${className}\`.trim()} noValidate onSubmit={onSubmit} aria-busy={working || undefined}>
        <div className="bz-mf-grid">
          {fields.map((field) => {
            const id = \`\${uid}-\${field.name}\`;
            const error = errors[field.name];
            const check = checks[field.name];
            const describedBy = [field.hint ? \`\${id}-hint\` : null, error ? \`\${id}-error\` : null, field.check ? \`\${id}-check\` : null]
              .filter(Boolean)
              .join(" ");
            const common = {
              id,
              name: field.name,
              className: "bz-mf-control",
              placeholder: field.placeholder,
              autoComplete: field.autoComplete,
              defaultValue: defaultValues[field.name],
              "aria-invalid": error ? true : undefined,
              "aria-required": field.required || undefined,
              "aria-describedby": describedBy || undefined,
              onChange: onFieldChange,
            };
            return (
              <div key={field.name} className="bz-mf-field" data-span={field.span ?? "full"}>
                <label htmlFor={id} className="bz-mf-label">
                  {field.label}
                  {field.required ? (
                    <span className="bz-mf-req" aria-hidden="true">
                      *
                    </span>
                  ) : null}
                </label>
                {field.type === "textarea" ? (
                  <textarea {...common} rows={5} />
                ) : (
                  <input {...common} type={field.type ?? "text"} inputMode={field.type === "url" ? "url" : undefined} />
                )}
                {field.hint ? (
                  <p id={\`\${id}-hint\`} className="bz-mf-hint">
                    {field.hint}
                  </p>
                ) : null}
                {error ? (
                  <p id={\`\${id}-error\`} className="bz-mf-error">
                    <Alert />
                    {error}
                  </p>
                ) : null}
                {field.check ? (
                  <p id={\`\${id}-check\`} className="bz-mf-check" role="status" data-result={check?.result}>
                    {check ? (
                      <>
                        {check.result === "checking" ? <Spinner /> : check.result === "ok" ? <Tick /> : check.result === "blocked" ? <Alert /> : null}
                        {check.message}
                      </>
                    ) : null}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        {trapName ? (
          <div className="bz-mf-skip" aria-hidden="true">
            <label htmlFor={\`\${uid}-skip\`}>Leave this field empty</label>
            <input id={\`\${uid}-skip\`} name={trapName} tabIndex={-1} autoComplete="off" defaultValue="" />
          </div>
        ) : null}

        {status === "failed" && failure ? (
          <div className="bz-mf-alert" role="alert">
            <Alert />
            <p style={{ margin: 0 }}>
              {failure}
              {fallback ? (
                <>
                  {" "}
                  <a href={fallback.href}>{fallback.label}</a>
                </>
              ) : null}
            </p>
          </div>
        ) : null}

        <div className="bz-mf-actions">
          <button type="submit" className="bz-mf-submit" aria-disabled={working || undefined}>
            <span aria-hidden={working || undefined}>{submitLabel}</span>
            <span aria-hidden={working ? undefined : true}>
              <Spinner />
              {status === "checking" ? checkingLabel : sendingLabel}
            </span>
          </button>
          {note ? <p className="bz-mf-note">{note}</p> : null}
        </div>
        {liveRegion}
      </form>
    </>
  );
}`,
    description: "Form with announced errors, focus to the first one and honest sending states.",
    tags: ["form", "validation", "aria-invalid", "live-region", "async", "accessible"],
  },
];

export function getComponent(slug: string): ComponentEntry | undefined {
  return registry.find((c) => c.slug === slug);
}

export function getAllComponents(): ComponentEntry[] {
  return registry;
}
