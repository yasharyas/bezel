export interface ComponentEntry {
  name: string;
  slug: string;
  path: string;
  code: string;
  prompt: string;
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
      className={\`px-6 py-2 rounded-xl font-medium text-white backdrop-blur-md bg-white/10 border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-200 \${className}\`}
      {...props}
    >
      {children}
    </button>
  );
}`,
    prompt: "A glassmorphism-styled button with blur and transparency effects.",
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
    prompt: "A translucent card component with optional title.",
    tags: ["card", "layout", "glass"],
  },
  {
    name: "Input",
    slug: "input",
    path: "Input.tsx",
    code: `import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm text-white/70 font-medium">{label}</label>}
      <input
        className={\`px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all \${className}\`}
        {...props}
      />
    </div>
  );
}`,
    prompt: "A styled input field with optional label.",
    tags: ["input", "form", "ui"],
  },
  // === Stepper Form Components ===
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
  name, label, value, onChange, placeholder, error, disabled,
  type = 'text', mandatory, uppercase, maxLength,
}: TextInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(uppercase ? v.toUpperCase() : v);
  };

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-neutral-700">
        {label}
        {mandatory && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={name} name={name} type={type} value={value}
        onChange={handleChange} placeholder={placeholder}
        disabled={disabled} maxLength={maxLength}
        className={[
          'h-11 px-4 rounded-full border bg-white text-neutral-900 placeholder:text-neutral-400',
          'focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-200',
          uppercase ? 'uppercase' : '',
          error ? 'border-red-500' : 'border-neutral-300',
          disabled ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed' : '',
        ].join(' ')}
        autoComplete="off"
      />
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}`,
    prompt: "A reusable pill-shaped text input with label, validation error, mandatory asterisk, uppercase mode, and disabled state.",
    tags: ["input", "text", "pill", "accessible", "controlled", "validation"],
  },
  {
    name: "RadioGroup",
    slug: "radio-group",
    path: "forms/RadioGroup.tsx",
    category: "forms",
    code: `import React from 'react';

type RadioGroupProps = {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  error?: string;
  mandatory?: boolean;
};

export function RadioGroup({ name, label, value, onChange, options, error, mandatory }: RadioGroupProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-neutral-700 mb-1">
        {label}{mandatory && <span className="text-red-500 ml-1">*</span>}
      </legend>
      <div className="flex flex-wrap gap-3">
        {options.map(option => (
          <label key={option} className={[
            'flex items-center gap-2 px-4 py-2.5 rounded-full border cursor-pointer',
            'transition-all duration-200 min-h-[48px] select-none',
            value === option
              ? 'border-indigo-500 bg-indigo-50 text-indigo-600 font-medium'
              : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400',
          ].join(' ')}>
            <input type="radio" name={name} value={option} checked={value === option}
              onChange={() => onChange(option)} className="sr-only" />
            <span className={['w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
              value === option ? 'border-indigo-500' : 'border-neutral-400'].join(' ')}>
              {value === option && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
            </span>
            <span className="text-sm">{option}</span>
          </label>
        ))}
      </div>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </fieldset>
  );
}`,
    prompt: "Pill-shaped radio chip group with indigo selected state, custom dot indicator, and visually hidden native inputs.",
    tags: ["radio", "chip", "pill", "selection", "accessible", "fieldset"],
  },
  {
    name: "Checkbox",
    slug: "checkbox",
    path: "forms/Checkbox.tsx",
    category: "forms",
    code: `import React from 'react';

type CheckboxProps = {
  name: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  mandatory?: boolean;
};

export function Checkbox({ name, label, checked, onChange, error, mandatory }: CheckboxProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="flex items-center gap-3 cursor-pointer min-h-[48px] select-none">
        <div className={[
          'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200',
          checked ? 'bg-indigo-500 border-indigo-500' : 'border-neutral-400 bg-white',
          error ? 'border-red-500' : '',
        ].join(' ')}>
          {checked && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <input id={name} name={name} type="checkbox" checked={checked}
          onChange={e => onChange(e.target.checked)} className="sr-only" />
        <span className="text-sm text-neutral-700">
          {label}{mandatory && <span className="text-red-500 ml-1">*</span>}
        </span>
      </label>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}`,
    prompt: "Custom circular checkbox with indigo fill, SVG checkmark, sr-only native input, and error support.",
    tags: ["checkbox", "toggle", "circular", "accessible", "custom"],
  },
  {
    name: "DOBPicker",
    slug: "dob-picker",
    path: "forms/DOBPicker.tsx",
    category: "forms",
    code: `import React, { useState, useEffect } from 'react';

type DOBPickerProps = {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  mandatory?: boolean;
};

// Converts ISO yyyy-mm-dd to DD/MM/YYYY display
function toDisplay(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return '';
  return parts[2] + '/' + parts[1] + '/' + parts[0];
}

export function DOBPicker({ name, label, value, onChange, error, mandatory }: DOBPickerProps) {
  const [displayValue, setDisplayValue] = useState(() => toDisplay(value));
  useEffect(() => { setDisplayValue(toDisplay(value)); }, [value]);
  // Auto-formats DD/MM/YYYY with validation
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-neutral-700">
        {label}{mandatory && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input id={name} name={name} type="text" inputMode="numeric"
        placeholder="DD/MM/YYYY" value={displayValue}
        onChange={e => { /* masked input logic */ }}
        maxLength={10}
        className={['h-11 px-4 rounded-full border bg-white text-neutral-900 placeholder:text-neutral-400',
          'focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-200',
          error ? 'border-red-500' : 'border-neutral-300'].join(' ')} />
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}`,
    prompt: "Date of birth picker with DD/MM/YYYY masked input, auto-slashes, ISO conversion, numeric mobile keyboard.",
    tags: ["date", "dob", "masked-input", "dd-mm-yyyy", "accessible", "numeric"],
  },
  {
    name: "SelectInput",
    slug: "select-input",
    path: "forms/SelectInput.tsx",
    category: "forms",
    code: `import React from 'react';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';

type SelectInputProps = {
  name: string; label: string; value: string;
  onChange: (value: string) => void;
  options: string[]; placeholder?: string;
  error?: string; mandatory?: boolean;
};

export function SelectInput({ name, label, value, onChange, options, placeholder, error, mandatory }: SelectInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-neutral-700">
        {label}{mandatory && <span className="text-red-500 ml-1">*</span>}
      </label>
      <Select.Root value={value || undefined} onValueChange={onChange}>
        <Select.Trigger id={name} className={[
          'h-11 px-4 rounded-full border bg-white flex items-center justify-between gap-2',
          'focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-200',
          !value ? 'text-neutral-400' : 'text-neutral-900',
          error ? 'border-red-500' : 'border-neutral-300',
        ].join(' ')}>
          <Select.Value placeholder={placeholder ?? 'Select an option'} />
          <Select.Icon><ChevronDown className="w-4 h-4 text-neutral-400" /></Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="bg-white border rounded-lg shadow-md overflow-hidden z-50" position="popper" sideOffset={4}>
            <Select.Viewport className="p-1">
              {options.map(o => (
                <Select.Item key={o} value={o} className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-md cursor-pointer outline-none data-[highlighted]:bg-indigo-50 data-[highlighted]:text-indigo-600">
                  <Select.ItemText>{o}</Select.ItemText>
                  <Select.ItemIndicator className="ml-auto"><Check className="w-4 h-4" /></Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}`,
    prompt: "Radix UI Select with pill-shaped trigger, portal dropdown, keyboard navigation, chevron and check icons.",
    tags: ["select", "dropdown", "radix-ui", "accessible", "pill", "portal"],
  },
  {
    name: "FileUpload",
    slug: "file-upload",
    path: "forms/FileUpload.tsx",
    category: "forms",
    code: `import React, { useRef, useState } from 'react';
import { Upload, Eye, X, FileText } from 'lucide-react';

type FileUploadProps = {
  name: string; label: string; value: string;
  onChange: (value: string) => void;
  error?: string; mandatory?: boolean;
  accept?: string;
};

export function FileUpload({ name, label, value, onChange, error, mandatory, accept = '.pdf,.jpg,.jpeg,.png' }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  // Handles file selection, preview, and removal
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-neutral-700">
        {label}{mandatory && <span className="text-red-500 ml-1">*</span>}
      </label>
      {!value ? (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-neutral-300 hover:border-indigo-400 cursor-pointer"
          onClick={() => inputRef.current?.click()} role="button" tabIndex={0}>
          <Upload className="w-5 h-5 text-neutral-400" />
          <span className="text-sm text-neutral-500">Click to upload a file</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-neutral-300 bg-neutral-50">
          <FileText className="w-5 h-5 text-indigo-500" />
          <span className="text-sm text-neutral-700 truncate flex-1">{value}</span>
        </div>
      )}
      <input ref={inputRef} id={name} type="file" className="sr-only" accept={accept} />
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}`,
    prompt: "File upload with dashed drop zone, filename display, image preview modal with backdrop blur, and remove button.",
    tags: ["file", "upload", "preview", "modal", "drag-drop", "image"],
  },
  {
    name: "Stepper",
    slug: "stepper",
    path: "navigation/Stepper.tsx",
    category: "navigation",
    code: `import React from 'react';

type Step = { id: string; title: string; };
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
          <span className="text-xs font-medium text-neutral-500">Step {currentStep} of {totalSteps}</span>
          <span className="text-xs font-semibold text-indigo-600">{steps[currentStepIndex]?.title}</span>
        </div>
        <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: (currentStep / totalSteps * 100) + '%' }} />
        </div>
      </div>
      {/* Desktop: numbered bubbles with connectors */}
      <div className="hidden sm:flex items-start w-full px-4">
        {steps.map((step, i) => {
          const done = completedStepIds.has(step.id);
          const curr = i === currentStepIndex;
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center w-16">
                <div className={['w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold',
                  done ? 'bg-green-500 text-white' : curr ? 'bg-indigo-500 text-white' : 'bg-neutral-200 text-neutral-500'
                ].join(' ')}>{done ? '✓' : i + 1}</div>
                <span className="text-xs text-center mt-1.5">{step.title}</span>
              </div>
              {i < steps.length - 1 && <div className={'flex-1 h-0.5 mt-[18px] ' + (done ? 'bg-green-500' : 'bg-neutral-200')} />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}`,
    prompt: "Responsive stepper with mobile progress bar and desktop numbered bubbles. Green checkmarks for completed, indigo highlight for current.",
    tags: ["stepper", "progress", "wizard", "multi-step", "responsive", "accessible"],
  },
  {
    name: "StepperNavigation",
    slug: "stepper-navigation",
    path: "navigation/StepperNavigation.tsx",
    category: "navigation",
    code: `import React from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

type StepperNavigationProps = {
  currentStepIndex: number; totalSteps: number;
  isLoading?: boolean; isLastStep?: boolean;
  onPrevious: () => void; onNext: () => void; onSubmit: () => void;
};

export function StepperNavigation({ currentStepIndex, isLoading, isLastStep, onPrevious, onNext, onSubmit }: StepperNavigationProps) {
  return (
    <div className="flex items-center gap-4 pt-6 mt-6 border-t border-neutral-200 w-full">
      {currentStepIndex > 0 && (
        <button type="button" onClick={onPrevious} disabled={isLoading}
          className="flex-1 h-9 rounded-full font-semibold bg-neutral-100 text-neutral-800 hover:bg-neutral-200 inline-flex items-center justify-center gap-2">
          <ChevronLeft className="w-4 h-4" />Previous
        </button>
      )}
      <button type="button" onClick={isLastStep ? onSubmit : onNext} disabled={isLoading}
        className="flex-1 h-9 rounded-full font-semibold bg-indigo-500 text-white hover:bg-indigo-600 inline-flex items-center justify-center gap-2 disabled:opacity-50">
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {isLastStep ? 'Submit' : 'Next'}<ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}`,
    prompt: "Multi-step form navigation with Previous/Next/Submit buttons, loading spinner, pill shape, flex-1 equal width.",
    tags: ["stepper", "navigation", "previous", "next", "submit", "loading", "wizard"],
  },
  {
    name: "SubmissionLoader",
    slug: "submission-loader",
    path: "feedback/SubmissionLoader.tsx",
    category: "feedback",
    code: `import React from 'react';

type Phase = 'verifying' | 'validating' | 'submitting' | 'complete';
type PhaseConfig = { text: string; subtitle: string; };

const DEFAULT_CONFIG: Record<Phase, PhaseConfig> = {
  verifying:  { text: 'Verifying Details',    subtitle: 'Checking your information...' },
  validating: { text: 'Validating Documents', subtitle: 'Reviewing uploaded files...' },
  submitting: { text: 'Submitting',           subtitle: 'Saving your submission...' },
  complete:   { text: 'All Done!',            subtitle: 'Your submission was successful.' },
};

type SubmissionLoaderProps = { phase: Phase | null; };

export function SubmissionLoader({ phase }: SubmissionLoaderProps) {
  if (!phase) return null;
  const config = DEFAULT_CONFIG[phase];
  const isComplete = phase === 'complete';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full mx-4 text-center">
        <div className="flex justify-center mb-6">
          {isComplete ? (
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">{config.text}</h3>
        <p className="text-sm text-neutral-500">{config.subtitle}</p>
      </div>
    </div>
  );
}`,
    prompt: "Full-screen overlay with phased loading states (verifying, validating, submitting, complete), spinner, and success checkmark.",
    tags: ["loader", "overlay", "spinner", "success", "modal", "multi-phase", "progress"],
  },
  {
    name: "ScreenLayout",
    slug: "screen-layout",
    path: "layout/ScreenLayout.tsx",
    category: "layout",
    code: `import React from 'react';

type ScreenLayoutProps = {
  brandInitials?: string; brandName?: string;
  title: string; subtitle?: string;
  stepper?: React.ReactNode; navigation?: React.ReactNode;
  children: React.ReactNode;
};

export function ScreenLayout({ brandInitials = 'YB', brandName = 'Your Brand', title, subtitle, stepper, navigation, children }: ScreenLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col">
      <header className="bg-white border-b border-neutral-200 px-4 py-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">{brandInitials}</div>
          <span className="text-base font-semibold text-neutral-800">{brandName}</span>
        </div>
      </header>
      <div className="flex-1 px-4 py-6 sm:px-6">
        <div className="max-w-3xl mx-auto">
          {stepper && <div className="mb-6">{stepper}</div>}
          <div className="bg-white rounded-xl shadow-lg border border-neutral-200/80 p-5 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-neutral-900 sm:text-2xl">{title}</h2>
              {subtitle && <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>}
            </div>
            {children}
            {navigation && <div>{navigation}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}`,
    prompt: "Multi-step form layout shell with brand header, optional stepper slot, content card with title/subtitle, and navigation slot.",
    tags: ["layout", "shell", "header", "card", "wizard", "container"],
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
    prompt: "Pure CSS animated typewriter loader with sliding carriage, scrolling paper, and keyboard key-press animations.",
    tags: ["loader", "spinner", "animation", "typewriter", "css", "pure-css", "decorative"],
  },
  {
    name: "ToastContainer",
    slug: "toast-container",
    path: "feedback/ToastContainer.tsx",
    category: "feedback",
    code: `import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface Toast {
  id: number;
  message: string;
}

let _toastId = 0;

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

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;
  return createPortal(
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-neutral-800 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg animate-[slideUp_0.2s_ease-out]"
        >
          {t.message}
        </div>
      ))}
    </div>,
    document.body
  );
}`,
    prompt: "React toast notification system with useToast hook. Toasts auto-dismiss, stack in bottom-right via a portal, and animate in with slide-up.",
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
      className="p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
    >
      {icon}
    </button>
  );
}`,
    prompt: "Compact icon-only toolbar button with hover/disabled states, optional tooltip, neutral colour scheme.",
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

export function CollapsibleSidebar({ title = 'Items', categories, searchPlaceholder = 'Search...', dragTransferKey = 'application/sidebar-item' }: CollapsibleSidebarProps) {
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  const onDragStart = (e: DragEvent, item: SidebarItem) => {
    e.dataTransfer.setData(item.dragKey ?? dragTransferKey, item.dragData ?? item.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const filterItem = (item: SidebarItem) => item.label.toLowerCase().includes(search.toLowerCase());

  if (collapsed) {
    return (
      <div className="w-12 bg-white border-r border-neutral-200 flex flex-col items-center pt-3">
        <button onClick={() => setCollapsed(false)} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 transition-colors cursor-pointer">
          <PanelLeft size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-60 bg-white border-r border-neutral-200 flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{title}</h2>
        <button onClick={() => setCollapsed(true)} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors cursor-pointer">
          <PanelLeftClose size={16} />
        </button>
      </div>
      <div className="px-3 pb-3">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input type="text" placeholder={searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-300 placeholder-neutral-400 transition" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-4">
        {categories.map((cat) => {
          const filtered = cat.items.filter(filterItem);
          if (filtered.length === 0) return null;
          return (
            <div key={cat.label}>
              <h3 className="text-[10px] font-semibold text-neutral-300 uppercase tracking-widest mb-2 px-1">{cat.label}</h3>
              <div className="space-y-1.5">
                {filtered.map((item) => (
                  <div key={item.id} draggable onDragStart={(e) => onDragStart(e, item)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-100 hover:border-neutral-300 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all group">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg transition-transform group-hover:scale-110" style={{ backgroundColor: \`\${item.color}18\` }}>
                      <span style={{ color: item.color, display: 'flex' }}>{item.icon}</span>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-neutral-700">{item.label}</div>
                      {item.description && <div className="text-[10px] text-neutral-400">{item.description}</div>}
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
    prompt: "Collapsible left sidebar with search, categorised draggable items, coloured icon badges, and toggle to icon-only mode.",
    tags: ["sidebar", "collapsible", "draggable", "searchable", "categorised", "panel"],
  },
  {
    name: "SidePanel",
    slug: "side-panel",
    path: "panels/SidePanel.tsx",
    category: "panels",
    code: `import type { ReactNode } from 'react';
import { X } from 'lucide-react';

type SidePanelProps = {
  title: string;
  headerLeft?: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
};

export function SidePanel({ title, headerLeft, onClose, footer, children }: SidePanelProps) {
  return (
    <div className="w-72 bg-white border-l border-neutral-200 flex flex-col h-full animate-[slideIn_0.15s_ease-out]">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          {headerLeft}
          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">{title}</span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors cursor-pointer">
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">{children}</div>
      {footer && <div className="p-4 border-t border-neutral-100">{footer}</div>}
    </div>
  );
}

export function PanelField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function PanelInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={'w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-300 placeholder-neutral-300 transition ' + (props.className ?? '')} />;
}

export function PanelTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={'w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-300 resize-none transition ' + (props.className ?? '')} />;
}

export function PanelDeleteButton({ onClick, label = 'Delete' }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer">
      {label}
    </button>
  );
}`,
    prompt: "Right-side sliding panel with header, scrollable body, optional footer, and convenience sub-components: PanelField, PanelInput, PanelTextarea, PanelDeleteButton.",
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

export function NodeCard({ label, description, icon, accentColor, selected = false, onClick, topHandle, bottomHandle }: NodeCardProps) {
  return (
    <div
      className={['relative min-w-[180px] max-w-[240px] rounded-2xl bg-white', 'border-2 transition-all duration-150 cursor-pointer', selected ? 'ring-2 ring-offset-2 shadow-md' : 'shadow-sm hover:shadow-md'].join(' ')}
      style={{ borderColor: selected ? accentColor : '#e2e8f0', ...(selected ? ({ '--tw-ring-color': accentColor } as CSSProperties) : {}) }}
      onClick={onClick}
    >
      <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full" style={{ backgroundColor: accentColor }} />
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ backgroundColor: \`\${accentColor}18\` }}>
          <span style={{ color: accentColor, display: 'flex' }}>{icon}</span>
        </div>
        <span className="text-sm font-semibold text-neutral-800 truncate">{label}</span>
      </div>
      {description && <div className="px-4 pb-3"><p className="text-xs text-neutral-400 truncate">{description}</p></div>}
      {topHandle}
      {bottomHandle}
    </div>
  );
}`,
    prompt: "Node card for visual workflow builders. Coloured accent bar, tinted icon badge, label, optional description, selected ring state, React Flow handle slots.",
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

export interface NavItem { name: string; url: string; icon: LucideIcon; onClick?: () => void }
interface NavBarProps { items: NavItem[]; activeItem?: string; className?: string; onNavigate?: (url: string) => void }

export function TubelightNavBar({ items, activeItem, className, onNavigate }: NavBarProps) {
  const [isMobile, setIsMobile] = useState(false)
  const currentActive = activeItem ?? items[0]?.name ?? ""
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize(); window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])
  return (
    <div className={\`fixed bottom-0 sm:top-0 left-1/2 -translate-x-1/2 z-50 mb-3 sm:mb-0 sm:pt-3 pointer-events-none\${className ? \` \${className}\` : ""}\`}>
      <div className="flex items-center gap-1 bg-background/5 border border-border backdrop-blur-lg py-0.5 px-0.5 rounded-full shadow-lg pointer-events-auto">
        {items.map((item) => {
          const Icon = item.icon; const isActive = currentActive === item.name
          const baseClasses = "relative cursor-pointer text-xs font-semibold px-3 py-1.5 rounded-full transition-colors text-center text-foreground/80 hover:text-primary" + (isActive ? " bg-muted text-primary" : "")
          const content = (<>
            <span className={isMobile ? "hidden" : "hidden md:inline"}>{item.name}</span>
            <span className={isMobile ? "inline" : "md:hidden"}><Icon size={14} strokeWidth={2.5} /></span>
            {isActive && (<motion.div layoutId="lamp" className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10" initial={false} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-t-full">
                <div className="absolute w-8 h-4 bg-primary/20 rounded-full blur-md -top-1.5 -left-1" />
                <div className="absolute w-6 h-4 bg-primary/20 rounded-full blur-md -top-0.5" />
                <div className="absolute w-3 h-3 bg-primary/20 rounded-full blur-sm top-0 left-1.5" />
              </div>
            </motion.div>)}
          </>)
          if (item.onClick) return <button key={item.name} onClick={item.onClick} className={baseClasses}>{content}</button>
          return <a key={item.name} href={item.url} onClick={(e) => { if (onNavigate) { e.preventDefault(); onNavigate(item.url) } }} className={baseClasses}>{content}</a>
        })}
      </div>
    </div>
  )
}`,
    prompt: "Create a floating pill-shaped navigation bar fixed to the bottom on mobile and top on desktop. Each nav item shows the icon on mobile and text label on desktop. The active item has a glowing tubelight/lamp effect above it, animated with framer-motion spring.",
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

const SWITCH_THEME = { "--ease-spring": "cubic-bezier(0.175, 0.885, 0.32, 1.275)" } as React.CSSProperties
const switchVariants = cva(
  "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
  { variants: { variant: { primary: "peer-checked:bg-primary peer-checked:border-primary", destructive: "peer-checked:bg-destructive peer-checked:border-destructive" }, size: { default: "h-8 w-[52px]", sm: "h-6 w-10" } }, defaultVariants: { variant: "primary", size: "default" } }
)
export interface MD3SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">, VariantProps<typeof switchVariants> {
  onCheckedChange?: (checked: boolean) => void; showIcons?: boolean; checkedIcon?: React.ReactNode; uncheckedIcon?: React.ReactNode; haptic?: "heavy" | "light" | "none"
}
export const MD3Switch = React.forwardRef<HTMLInputElement, MD3SwitchProps>(({ className, size, variant, checked, defaultChecked, onCheckedChange, showIcons = false, checkedIcon, uncheckedIcon, haptic = "none", style, disabled, ...props }, ref) => {
  const [isChecked, setIsChecked] = React.useState(defaultChecked ?? false)
  React.useEffect(() => { if (checked !== undefined) setIsChecked(checked) }, [checked])
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (!disabled) { const v = e.target.checked; if (checked === undefined) setIsChecked(v); onCheckedChange?.(v) } }
  const isSmall = size === "sm"
  // ... (see full source for handle/halo logic)
  return <label className="group relative inline-flex items-center justify-center min-w-[48px] min-h-[48px]" style={{ ...SWITCH_THEME, ...style }}><input type="checkbox" className="peer sr-only" ref={ref} checked={isChecked} onChange={handleChange} disabled={disabled} {...props} /></label>
})
MD3Switch.displayName = "MD3Switch"`,
    prompt: "Build a Material Design 3 toggle switch in React with spring-easing physics for the handle, a hover/press halo effect, optional check/X icons that rotate in/out, two sizes (default and sm), primary and destructive color variants, and an optional Web Audio API haptic feedback click sound.",
    tags: ["switch", "toggle", "material-design", "md3", "animated", "haptic", "physics"],
  },
  {
    name: "DualConfirmDialog",
    slug: "dual-confirm-dialog",
    path: "dialogs/DualConfirmDialog.tsx",
    category: "dialogs",
    code: `import { useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"

export interface DeleteProgress { current: number; total: number; strategy?: "frontend" | "backend" }
export interface DualConfirmDialogProps {
  open: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => void
  title: string; description: string; itemCount: number; itemType: string
  confirmationPhrase?: string; isLoading?: boolean; progress?: DeleteProgress | null
}

export function DualConfirmDialog({ open, onOpenChange, onConfirm, title, description, itemCount, itemType, confirmationPhrase = "DELETE", isLoading = false, progress = null }: DualConfirmDialogProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [inputValue, setInputValue] = useState("")
  const handleClose = () => { if (isLoading) return; setStep(1); setInputValue(""); onOpenChange(false) }
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-md mx-4 bg-background border border-border rounded-lg shadow-xl p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-destructive mb-4"><AlertTriangle className="h-5 w-5" />{title}</h2>
        {/* step 1: warning, step 2: type to confirm */}
      </div>
    </div>
  )
}`,
    prompt: "Create a two-step destructive confirmation dialog. Step 1 shows a warning with item count. Step 2 requires the user to type a specific phrase (e.g. DELETE) to enable the final button. Include a loading state with an animated progress bar. Clicking outside is blocked while loading.",
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
  accept?: string; maxSizeMB?: number; disabled?: boolean
}

export function BlenderUpload({ onFileSelect, onError, accept = ".jpg,.jpeg,.png", maxSizeMB = 1, disabled = false }: BlenderUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isBlending, setIsBlending] = useState(false)
  const [blendComplete, setBlendComplete] = useState(false)
  const [previewUrl, setPreviewUrl] = useState("")
  // ... drag/drop handlers, blender SVG, smoothie glass SVG, inline @keyframes
  return <div className="rounded-xl overflow-hidden">...</div>
}`,
    prompt: "Create a drag-and-drop file upload component with a playful blender animation. Show fruits falling in on drag. When uploading, animate liquid blending inside the jar. On completion transform to a smoothie glass with a cherry on top. Show a preview of the uploaded image below with a 'Change image' button. Use inline SVG — no external images.",
    tags: ["upload", "drag-drop", "animated", "file-input", "svg", "playful", "image-preview"],
  },
  {
    name: "EmptyState",
    slug: "empty-state",
    path: "feedback/EmptyState.tsx",
    category: "feedback",
    code: `import { Plus } from "lucide-react"

interface EmptyStateProps {
  title: string; description: string; icon?: React.ReactNode
  actionLabel?: string; onAction?: () => void; showAction?: boolean
}

export function EmptyState({ title, description, icon, actionLabel = "Create", onAction, showAction = true }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      {icon && <div className="mb-4 text-muted-foreground/40">{icon}</div>}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
      {showAction && onAction && (
        <button onClick={onAction} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />{actionLabel}
        </button>
      )}
    </div>
  )
}`,
    prompt: "Create a centered empty state component with an optional icon slot, a heading, description text, and an optional primary CTA button with a plus icon. Use Tailwind CSS with theme tokens.",
    tags: ["empty", "placeholder", "no-data", "cta", "illustration-slot"],
  },
  {
    name: "CheckboxVariants",
    slug: "checkbox-variants",
    path: "forms/CheckboxVariants.tsx",
    category: "forms",
    code: `"use client"
import * as React from "react"

export const CustomCheckbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input type="checkbox" ref={ref} className={"relative box-border block h-[1.5rem] w-[1.5rem] cursor-pointer appearance-none rounded-md bg-slate-200 transition-all duration-300 checked:bg-[#1677ff] hover:border-[#1677ff] " + (className ?? "")} {...props} />
))
CustomCheckbox.displayName = "CustomCheckbox"

export const GradientCheckbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ ...props }, ref) => (
  <label className="relative block cursor-pointer select-none rounded-md text-3xl">
    <input ref={ref} type="checkbox" className="peer absolute opacity-0" {...props} />
    <div className="relative h-[1.6rem] w-[1.6rem] rounded-[0.3em] bg-white peer-checked:bg-black peer-checked:shadow-[0_0_40px_rgba(17,0,248,0.7)]" />
  </label>
))
GradientCheckbox.displayName = "GradientCheckbox"

export { TransformerCheckbox, AnimatedCheckbox } from "./CheckboxVariants"`,
    prompt: "Create four stylized checkbox variants using only Tailwind CSS and pseudo-elements — no SVGs. Include: (1) Ant Design style with blue ripple, (2) rainbow gradient glow, (3) border morphs into a checkmark, (4) circular checkbox that pulses green when checked.",
    tags: ["checkbox", "animated", "variants", "gradient", "morphing", "tailwind", "custom"],
  },
  {
    name: "LoadingSpinner",
    slug: "loading-spinner",
    path: "feedback/LoadingSpinner.tsx",
    category: "feedback",
    code: `const sizes = { sm: "h-4 w-4 border-2", md: "h-8 w-8 border-3", lg: "h-12 w-12 border-4" }

export const LoadingSpinner = ({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) => (
  <div className={"flex items-center justify-center" + (className ? \` \${className}\` : "")}>
    <div className={"animate-spin rounded-full border-primary border-t-transparent " + sizes[size]} />
  </div>
)`,
    prompt: "Create a minimal centered loading spinner with three sizes (sm/md/lg) using Tailwind's animate-spin and a colored border with a transparent top to create the spinning arc effect.",
    tags: ["loading", "spinner", "animation", "minimal"],
  },
  {
    name: "PriceBreakdown",
    slug: "price-breakdown",
    path: "cards/PriceBreakdown.tsx",
    category: "cards",
    code: `import { IndianRupee, Receipt, Percent } from "lucide-react"

export function PriceBreakdown({ price, gstPercent, priceLabel = "Base Price" }: { price: number; gstPercent: number; priceLabel?: string }) {
  const validPrice = Number.isFinite(price) && price > 0 ? price : 0
  if (validPrice === 0) return null
  const gstAmount = validPrice * (gstPercent / 100)
  const totalPrice = validPrice + gstAmount
  return (
    <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide"><Receipt className="h-4 w-4" />Price Breakdown</div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm"><span className="flex items-center gap-2 text-muted-foreground"><IndianRupee className="h-3.5 w-3.5" />{priceLabel}</span><span>₹{validPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
        <div className="flex justify-between text-sm"><span className="flex items-center gap-2 text-muted-foreground"><Percent className="h-3.5 w-3.5" />GST ({gstPercent}%)</span><span>{gstAmount > 0 ? \`₹\${gstAmount.toLocaleString("en-IN")}\` : "—"}</span></div>
        <div className="border-t" />
        <div className="flex justify-between"><span className="text-sm font-semibold">Total Price</span><span className="text-lg font-bold text-primary">₹{totalPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
      </div>
    </div>
  )
}`,
    prompt: "Create a read-only price breakdown card showing base price, tax amount, a divider, and total. Accept base price, tax percentage, and custom labels as props. Render nothing when price is zero or invalid. Use lucide-react icons and Tailwind CSS.",
    tags: ["pricing", "tax", "breakdown", "receipt", "finance", "display"],
  },
  {
    name: "Pagination",
    slug: "pagination",
    path: "navigation/Pagination.tsx",
    category: "navigation",
    code: `import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

export const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav role="navigation" aria-label="pagination" className={"mx-auto flex w-full justify-center" + (className ? \` \${className}\` : "")} {...props} />
)
export const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(({ className, ...props }, ref) => (
  <ul ref={ref} className={"flex flex-row items-center gap-1" + (className ? \` \${className}\` : "")} {...props} />
))
export const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(({ ...props }, ref) => <li ref={ref} {...props} />)
type PaginationLinkProps = { isActive?: boolean } & React.ComponentProps<"a">
export const PaginationLink = ({ className, isActive, ...props }: PaginationLinkProps) => (
  <a aria-current={isActive ? "page" : undefined} className={"inline-flex items-center justify-center h-10 w-10 rounded-md text-sm hover:bg-accent" + (isActive ? " border border-input" : "") + (className ? \` \${className}\` : "")} {...props} />
)
export const PaginationPrevious = ({ ...props }) => <PaginationLink aria-label="Go to previous page" className="w-auto px-4 gap-1" {...props}><ChevronLeft className="h-4 w-4" /><span>Previous</span></PaginationLink>
export const PaginationNext = ({ ...props }) => <PaginationLink aria-label="Go to next page" className="w-auto px-4 gap-1" {...props}><span>Next</span><ChevronRight className="h-4 w-4" /></PaginationLink>
export const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span aria-hidden className={"flex h-10 w-10 items-center justify-center" + (className ? \` \${className}\` : "")} {...props}><MoreHorizontal className="h-4 w-4" /><span className="sr-only">More pages</span></span>
)`,
    prompt: "Create an accessible, composable pagination component. Include Pagination, PaginationContent, PaginationItem, PaginationLink (with isActive), PaginationPrevious, PaginationNext, and PaginationEllipsis. Use lucide-react for chevron and ellipsis icons. Keep it fully keyboard and screen-reader accessible.",
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
    const onMove = (e: MouseEvent) => {
      cursor.classList.add("active");
      gsap.to(cursor, { x: e.clientX - cursor.offsetWidth / 2, y: e.clientY - cursor.offsetHeight / 2, duration: 0.55, ease: "power3.out" });
    };
    const onEnterGrow = () => gsap.to(cursor, { scale: 2.5, duration: 0.3, ease: "power2.out" });
    const onLeaveGrow = () => gsap.to(cursor, { scale: 1, duration: 0.3, ease: "power2.out" });
    document.addEventListener("mousemove", onMove);
    document.querySelectorAll("[data-cursor-grow]").forEach((el) => { el.addEventListener("mouseenter", onEnterGrow); el.addEventListener("mouseleave", onLeaveGrow); });
    return () => { document.removeEventListener("mousemove", onMove); };
  }, []);
  return (
    <div ref={cursorRef} style={{ width:"1.7rem",height:"1.7rem",position:"fixed",top:0,left:0,pointerEvents:"none",mixBlendMode:"difference",zIndex:100000,opacity:0 }}>
      <span style={{ position:"absolute",background:"#fff",width:"0.5rem",height:"0.2rem",top:"50%",transform:"translateY(-50%)",left:0 }} />
      <span style={{ position:"absolute",background:"#fff",width:"0.5rem",height:"0.2rem",top:"50%",transform:"translateY(-50%)",right:0 }} />
      <span style={{ position:"absolute",background:"#fff",height:"0.5rem",width:"0.2rem",left:"50%",transform:"translateX(-50%)",top:0 }} />
      <span style={{ position:"absolute",background:"#fff",height:"0.5rem",width:"0.2rem",left:"50%",transform:"translateX(-50%)",bottom:0 }} />
    </div>
  );
}`,
    prompt: "Create a minimal cross-hair custom cursor using CSS that replaces the browser cursor. The cursor has four short white bars forming a plus/crosshair. It follows the mouse smoothly with GSAP lag. On hover over [data-cursor-grow] elements it scales up to 2.5x. Uses mix-blend-mode: difference.",
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

type Props = { name?: string; onComplete: () => void };
export function Preloader({ name = "LOADING", onComplete }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const preloader = rootRef.current; const counterEl = counterRef.current;
    if (!preloader || !counterEl) return;
    const chars = Array.from(preloader.querySelectorAll<HTMLElement>(".yui-pl-char"));
    const obj = { value: 0 };
    const tl = gsap.timeline({ onComplete: () => gsap.delayedCall(0.1, onComplete) });
    tl.to(obj, { value: 100, duration: 1.6, ease: "power2.inOut", onUpdate: () => { counterEl.textContent = Math.round(obj.value) + "%"; } });
    tl.to(chars, { y: 0, duration: 1, stagger: 0.035, ease: "power3.out" }, 0.2);
    tl.to(chars.slice(1,-1), { opacity: 0, y: "-20%", duration: 0.5, stagger: 0.02 }, "+=0.3");
    tl.to(preloader, { yPercent: -100, duration: 0.9, ease: "power3.inOut" }, "-=0.2");
    return () => { tl.kill(); };
  }, [onComplete]);
  return (
    <div ref={rootRef} style={{ position:"fixed",inset:0,zIndex:10000,background:"#fff",display:"flex",justifyContent:"center",alignItems:"center" }}>
      <div style={{ display:"flex",overflow:"hidden",fontSize:"clamp(3rem,8vw,12rem)",fontWeight:500,color:"#000" }}>
        {name.split("").map((ch,i) => <span key={i} className="yui-pl-char" style={{ display:"inline-block",transform:"translateY(110%)" }}>{ch === " " ? "\u00A0" : ch}</span>)}
      </div>
      <div style={{ position:"fixed",right:"5rem",bottom:"5rem",fontSize:"clamp(4rem,6vw,10rem)",fontWeight:500,color:"#000" }}>
        <span ref={counterRef}>0%</span>
      </div>
    </div>
  );
}`,
    prompt: "Create a fullscreen white preloader that animates each letter of a name into view sliding up from below. A percentage counter in the bottom-right corner counts from 0% to 100%. When complete, non-key letters fade out, then the whole panel slides upward off screen revealing the page.",
    tags: ["preloader", "gsap", "letter-reveal", "counter", "entrance"],
  },
  {
    name: "SiteHeader",
    slug: "site-header",
    path: "navigation/SiteHeader.tsx",
    category: "navigation",
    code: `"use client";
type NavLink = { label: string; href: string };
type Props = { logo?: string; logoHref?: string; navLinks?: NavLink[]; ctaLabel?: string; ctaHref?: string; visible?: boolean };
export function SiteHeader({ logo="BRAND.", logoHref="/", navLinks=[], ctaLabel="GET IN TOUCH", ctaHref="#contact", visible=true }: Props) {
  return (
    <header style={{ display:"flex",alignItems:"center",justifyContent:"space-between",position:"fixed",top:0,left:0,width:"100%",padding:"2rem 5rem",zIndex:1000,transform:visible?"translateY(0)":"translateY(-100%)",transition:"transform 0.8s cubic-bezier(0.25,1,0.5,1)" }}>
      <a href={logoHref} style={{ fontSize:"2rem",fontWeight:500,color:"#fff",textDecoration:"none" }}>{logo}</a>
      <ul style={{ display:"flex",listStyle:"none",gap:"1.5rem",margin:0,padding:0 }}>
        {navLinks.map(link => <li key={link.href}><a href={link.href} style={{ color:"#fff",textDecoration:"none",fontSize:"1rem",fontWeight:500 }}>{link.label}</a></li>)}
      </ul>
      <a href={ctaHref} style={{ padding:"0.5rem 1.4rem",borderRadius:"999px",border:"1px solid rgba(255,255,255,0.3)",color:"#fff",textDecoration:"none",fontSize:"0.9rem",fontWeight:500 }}>{ctaLabel}</a>
    </header>
  );
}`,
    prompt: "Design a fixed top navigation bar for a dark portfolio site. Logo text on the left, navigation links in the center, and a contact CTA button on the right. Each nav link has a dual-text slide-up effect on hover. The CTA button has an expanding white circle bubble that fills from below on hover.",
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
type Props = { logo?: string; logoHref?: string; links?: NavLink[] };
export function MobileMenu({ logo="MK.", logoHref="/", links=[] }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <nav style={{ display:"flex",alignItems:"center",justifyContent:"space-between",position:"fixed",top:0,left:0,width:"100%",padding:"2rem",zIndex:2000,mixBlendMode:"difference" }}>
        <a href={logoHref} style={{ fontSize:"2.5rem",fontWeight:500,color:"#fff",textDecoration:"none" }}>{logo}</a>
        <button onClick={() => setOpen(o=>!o)} aria-label={open?"Close":"Open menu"} style={{ width:"2.4rem",height:"1.8rem",display:"flex",flexDirection:"column",justifyContent:"space-between",background:"none",border:"none",cursor:"pointer",padding:0 }}>
          <span style={{ width:"100%",height:"0.2rem",background:"#fff",borderRadius:"999px",transition:"transform 0.4s",transform:open?"translateY(0.8rem) rotate(45deg)":"none" }} />
          <span style={{ width:"100%",height:"0.2rem",background:"#fff",borderRadius:"999px",transition:"opacity 0.3s",opacity:open?0:1 }} />
          <span style={{ width:"100%",height:"0.2rem",background:"#fff",borderRadius:"999px",transition:"transform 0.4s",transform:open?"translateY(-0.8rem) rotate(-45deg)":"none" }} />
        </button>
      </nav>
      <div onClick={() => setOpen(false)} style={{ position:"fixed",inset:0,zIndex:1999,background:"#000",display:"flex",alignItems:"center",justifyContent:"center",opacity:open?1:0,visibility:open?"visible":"hidden",transition:"opacity 0.5s,visibility 0.5s" }}>
        <ul onClick={e=>e.stopPropagation()} style={{ display:"flex",flexDirection:"column",gap:"2.5rem",listStyle:"none",margin:0,padding:0,textAlign:"center" }}>
          {links.map(link => <li key={link.href}><a href={link.href} onClick={()=>setOpen(false)} style={{ display:"inline-block",fontSize:"3rem",fontWeight:500,color:"#fff",textDecoration:"none",textTransform:"uppercase",padding:"0.3rem 1.5rem",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"999px" }}>{link.label}</a></li>)}
        </ul>
      </div>
    </>
  );
}`,
    prompt: "Build a mobile navigation header with a compact logo on the left and a hamburger icon on the right. Clicking the hamburger animates it into an X. It opens a fullscreen black overlay menu with centered uppercase links in pill-shaped borders.",
    tags: ["mobile", "hamburger", "overlay", "fullscreen-menu", "responsive"],
  },
  {
    name: "ElasticLineDivider",
    slug: "elastic-line-divider",
    path: "dividers/ElasticLineDivider.tsx",
    category: "dividers",
    code: `"use client";
import { useEffect, useRef } from "react";
type Props = { label?: string; index?: string; total?: string };
export function ElasticLineDivider({ label="", index="01/", total="/04" }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const NUM = 80; const points: {x:number;y:number;vy:number;ay:number}[] = [];
    let W=0,H=0,mouseX=0,mouseY=0,hovering=false;
    const resize = () => { const r=svg.getBoundingClientRect(); W=r.width; H=r.height; for(let i=0;i<NUM;i++) points[i]={x:(i/(NUM-1))*W,y:H/2,vy:0,ay:0}; };
    const getPath = () => { let d=\`M \${points[0].x} \${points[0].y}\`; for(let i=1;i<NUM-1;i++){const mx=(points[i].x+points[i+1].x)/2;const my=(points[i].y+points[i+1].y)/2;d+=\` Q \${points[i].x} \${points[i].y} \${mx} \${my}\`;} d+=\` L \${points[NUM-1].x} \${points[NUM-1].y}\`; return d; };
    const pathEl = svg.querySelector<SVGPathElement>(".yui-elastic-path");
    let raf: number;
    const tick = () => { const cy=H/2; for(let i=0;i<NUM;i++){const p=points[i];const dist=Math.abs(p.x-mouseX);const inf=hovering?Math.max(0,1-dist/80):0;const target=hovering?cy+(mouseY-cy)*inf:cy;p.ay=(target-p.y)*0.12;p.vy=p.vy*0.7+p.ay;p.y+=p.vy;} if(pathEl)pathEl.setAttribute("d",getPath()); raf=requestAnimationFrame(tick); };
    resize(); window.addEventListener("resize",resize); svg.addEventListener("mousemove",(e)=>{const r=svg.getBoundingClientRect();mouseX=e.clientX-r.left;mouseY=e.clientY-r.top;}); svg.addEventListener("mouseenter",()=>{hovering=true;}); svg.addEventListener("mouseleave",()=>{hovering=false;}); raf=requestAnimationFrame(tick);
    return () => { window.removeEventListener("resize",resize); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div style={{ width:"100%",margin:"2rem 0" }}>
      <svg ref={svgRef} style={{ display:"block",width:"100%",height:"60px",cursor:"crosshair" }}><path className="yui-elastic-path" d="" style={{ fill:"none",stroke:"currentColor",strokeWidth:1.5,opacity:0.6 }} /></svg>
      <div style={{ display:"flex",justifyContent:"space-between",fontSize:"0.8rem",opacity:0.5,marginTop:"0.25rem",textTransform:"uppercase",letterSpacing:"0.05em" }}><span>{index}</span>{label&&<span>{label}</span>}<span>{total}</span></div>
    </div>
  );
}`,
    prompt: "Create an interactive SVG horizontal divider line that reacts to mouse movement like an elastic thread with spring physics. When the cursor hovers and moves vertically over the line, it deflects the nearest points up or down. A wave propagates outward to neighboring points, damped like a guitar string.",
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
type Props = { href: string; label?: string; size?: number; strokeColor?: string };
export function CircleCTA({ href, label="view\\nmore", size=10, strokeColor="#fff" }: Props) {
  const ctaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ctaRef.current; if (!el) return;
    const circle = el.querySelector<SVGCircleElement>(".yui-circle-draw"); if (!circle) return;
    const r = parseFloat(circle.getAttribute("r")||"48");
    const c = 2 * Math.PI * r;
    gsap.set(circle, { strokeDasharray: c, strokeDashoffset: c });
    const onEnter = () => gsap.to(circle, { strokeDashoffset: 0, duration: 0.6, ease: "power3.out" });
    const onLeave = () => gsap.to(circle, { strokeDashoffset: c, duration: 0.5, ease: "power3.in" });
    el.addEventListener("mouseenter", onEnter); el.addEventListener("mouseleave", onLeave);
    return () => { el.removeEventListener("mouseenter", onEnter); el.removeEventListener("mouseleave", onLeave); };
  }, []);
  return (
    <div ref={ctaRef} style={{ position:"relative",display:"inline-block",width:\`\${size}rem\`,height:\`\${size}rem\` }}>
      <a href={href} style={{ display:"flex",alignItems:"center",justifyContent:"center",width:"100%",height:"100%",position:"relative",textDecoration:"none" }}>
        <svg viewBox="0 0 100 100" style={{ position:"absolute",top:0,left:0,width:"100%",height:"100%",transform:"rotate(-90deg)" }}><circle className="yui-circle-draw" cx="50" cy="50" r="48" fill="none" stroke={strokeColor} strokeWidth="1" /></svg>
        <div style={{ position:"relative",zIndex:1,textAlign:"center",lineHeight:1.2,fontSize:"0.85rem",fontWeight:500,textTransform:"uppercase" }}>
          {label.split("\\n").map((l,i)=><span key={i} style={{display:"block"}}>{l}</span>)}
        </div>
      </a>
    </div>
  );
}`,
    prompt: "Create a circular call-to-action button that draws an SVG circle stroke around itself on hover using GSAP strokeDashoffset animation. The circle starts invisible and animates to fully drawn on mouseenter, then retracts on mouseleave. Centered label text inside the circle.",
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
type Props = { src: string; alt?: string; className?: string; borderRadius?: string; aspectRatio?: string };
export function ImageReveal({ src, alt="", className="", borderRadius="4rem", aspectRatio="3/2" }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const wrap = wrapRef.current; if (!wrap) return;
    const img = wrap.querySelector<HTMLImageElement>("img"); if (!img) return;
    gsap.set(wrap, { clipPath:"inset(100% 0 0 0)", borderRadius });
    gsap.set(img, { scale: 1.4 });
    const trig = ScrollTrigger.create({ trigger: wrap, start: "top 85%", end: "bottom 15%",
      onEnter: () => gsap.to([wrap, img], { clipPath:"inset(0% 0 0 0)", scale:1, duration:1.2, ease:"power3.out" }),
      onLeaveBack: () => gsap.to([wrap, img], { clipPath:"inset(100% 0 0 0)", scale:1.4, duration:0.8, ease:"power3.in" }),
    });
    return () => { trig.kill(); };
  }, [borderRadius]);
  return (
    <div ref={wrapRef} className={className} style={{ overflow:"hidden", aspectRatio, borderRadius, width:"100%" }}>
      <img src={src} alt={alt} style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }} />
    </div>
  );
}`,
    prompt: "Create an image component that reveals itself on scroll using GSAP clipPath animation. The image starts hidden (clipPath inset 100% from top), and on entering the viewport it clips open downward with a power3 ease. Simultaneously the image scales down from 1.4 to 1 for a cinematic parallax feel.",
    tags: ["image", "scroll-reveal", "gsap", "clip-path", "parallax", "cinema"],
  },
  {
    name: "FeaturedProjectCard",
    slug: "featured-project-card",
    path: "cards/FeaturedProjectCard.tsx",
    category: "cards",
    code: `"use client";
type Props = { title: string; eyebrow?: string; imageSrc: string; imageAlt?: string; href?: string; tags?: string[]; alignRight?: boolean };
export function FeaturedProjectCard({ title, eyebrow="", imageSrc, imageAlt="", href="#", tags=[], alignRight=false }: Props) {
  return (
    <article style={{ position:"relative" }}>
      <a href={href} style={{ display:"block",textDecoration:"none",color:"inherit" }}>
        <div style={{ width:alignRight?"70%":"100%",marginLeft:alignRight?"auto":undefined,overflow:"hidden",borderRadius:"2rem",aspectRatio:"4/3" }}>
          <img src={imageSrc} alt={imageAlt} style={{ width:"100%",height:"100%",objectFit:"cover",display:"block",transition:"transform 0.9s cubic-bezier(0.25,1,0.5,1)" }} />
        </div>
        <div style={{ marginTop:"2rem",textAlign:alignRight?"right":undefined }}>
          {eyebrow && <span style={{ display:"block",fontSize:"0.8rem",letterSpacing:"0.15em",textTransform:"uppercase",opacity:0.5,marginBottom:"0.5rem" }}>{eyebrow}</span>}
          <h2 style={{ fontSize:"clamp(3.5rem,6vw,8rem)",fontWeight:600,lineHeight:0.9,letterSpacing:"-0.04em",textTransform:"uppercase",margin:"0 0 1.5rem" }}>{title}</h2>
          {tags.length>0 && <div style={{ display:"flex",gap:"0.75rem",justifyContent:alignRight?"flex-end":undefined }}>{tags.map(t=><span key={t} style={{ fontSize:"0.7rem",letterSpacing:"0.1em",textTransform:"uppercase",padding:"0.25rem 0.75rem",border:"1px solid currentColor",borderRadius:"999px",opacity:0.5 }}>{t}</span>)}</div>}
        </div>
      </a>
    </article>
  );
}`,
    prompt: "Create a large full-width project card for a portfolio showcase. It has a tall rounded image on top, followed by a small eyebrow label, a large bold title in uppercase, and meta tags below. Every other card shifts the image to the right 70% and right-aligns the text for visual rhythm.",
    tags: ["project-card", "portfolio", "editorial", "dark", "alternating-layout"],
  },
  {
    name: "ProjectCard",
    slug: "project-card",
    path: "cards/ProjectCard.tsx",
    category: "cards",
    code: `"use client";
type Props = { title: string; subtitle?: string; imageSrc: string; imageAlt?: string; href?: string; large?: boolean };
export function ProjectCard({ title, subtitle="", imageSrc, imageAlt="", href="#", large=false }: Props) {
  return (
    <article style={{ position:"relative",breakInside:"avoid",marginBottom:"3rem" }}>
      <a href={href} style={{ display:"block",textDecoration:"none",color:"inherit" }}>
        <div style={{ overflow:"hidden",borderRadius:"1.5rem",aspectRatio:"4/3" }}>
          <img src={imageSrc} alt={imageAlt} style={{ width:"100%",height:"100%",objectFit:"cover",display:"block",transition:"transform 0.8s cubic-bezier(0.25,1,0.5,1)" }} />
        </div>
        <div style={{ marginTop:"1.5rem" }}>
          <h3 style={{ fontSize:large?"4rem":"2.5rem",fontWeight:600,lineHeight:1,letterSpacing:"-0.05em",textTransform:"uppercase",margin:"0 0 0.4rem" }}>{title}</h3>
          {subtitle && <span style={{ fontSize:"0.75rem",letterSpacing:"0.08em",textTransform:"uppercase",opacity:0.5 }}>{subtitle}</span>}
        </div>
      </a>
    </article>
  );
}`,
    prompt: "Create a masonry-style project card for a photography portfolio grid. It has a rounded image that scales slightly on hover, a title in large uppercase text, and a small subtitle below. Two-column CSS masonry layout, single column on mobile.",
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
type Props = { text: string; speed?: number; fontSize?: string; opacity?: number; separator?: string };
export function Marquee({ text, speed=20, fontSize="21rem", opacity=0.08, separator=" \u2014\u00A0" }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const track = trackRef.current; if (!track) return;
    const fill = () => { const items=Array.from(track.children) as HTMLElement[]; if(!items.length)return; const total=items.reduce((s,el)=>s+el.offsetWidth,0); const needed=Math.ceil((window.innerWidth*3)/total)+1; const tmpl=items[0].cloneNode(true) as HTMLElement; while(track.children.length<needed*items.length)track.appendChild(tmpl.cloneNode(true)); };
    fill();
    const firstItem=track.children[0] as HTMLElement;
    const itemW=firstItem?.offsetWidth||200;
    const tween=gsap.to(track,{x:\`-=\${itemW}\`,duration:itemW/speed,ease:"none",repeat:-1,modifiers:{x:gsap.utils.unitize((x:number)=>parseFloat(String(x))%itemW)}});
    return () => { tween.kill(); };
  }, [text, speed]);
  return (
    <div style={{ overflow:"hidden",pointerEvents:"none",margin:"3rem 0",width:"100%" }}>
      <div ref={trackRef} style={{ display:"flex",whiteSpace:"nowrap",willChange:"transform" }}>
        <span style={{ fontSize,fontWeight:600,letterSpacing:"-0.04em",textTransform:"uppercase",flexShrink:0,opacity }}>{text}{separator}</span>
      </div>
    </div>
  );
}`,
    prompt: "Create an infinite horizontal scrolling marquee of repeated text using GSAP. The text is oversized (20+ rem), uppercase, white, and semi-transparent (~8% opacity) for a background watermark effect. It scrolls left endlessly at a constant speed.",
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
type Props = { eyebrow?: string; heading?: string; subheading?: string; ctaHref?: string };
export function ContactSection({ eyebrow="GOT A PROJECT IN MIND?", heading="LET'S", subheading="TALK.", ctaHref="mailto:hello@example.com" }: Props) {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const section=sectionRef.current; const spotlight=spotlightRef.current;
    if(!section||!spotlight)return;
    const onMove=(e:MouseEvent)=>{const r=section.getBoundingClientRect();gsap.to(spotlight,{x:e.clientX-r.left-spotlight.offsetWidth/2,y:e.clientY-r.top-spotlight.offsetHeight/2,duration:0.6,ease:"power3.out"});};
    section.addEventListener("mousemove",onMove); return()=>section.removeEventListener("mousemove",onMove);
  },[]);
  return (
    <div ref={sectionRef} style={{ position:"relative",overflow:"hidden",minHeight:"60vh",padding:"6rem 5rem",background:"radial-gradient(ellipse at 60% 40%,#1a1a2e 0%,#000 70%)",borderRadius:"2rem",display:"flex",flexDirection:"column",justifyContent:"center" }}>
      <div ref={spotlightRef} style={{ position:"absolute",width:"30rem",height:"30rem",borderRadius:"50%",background:"radial-gradient(circle,rgba(99,102,241,0.15) 0%,transparent 70%)",pointerEvents:"none" }} />
      <div style={{ position:"relative",zIndex:1 }}>
        <p style={{ fontSize:"0.8rem",letterSpacing:"0.15em",textTransform:"uppercase",opacity:0.5,marginBottom:"1.5rem" }}>{eyebrow}</p>
        <h2 style={{ fontSize:"clamp(5rem,10vw,14rem)",fontWeight:700,lineHeight:0.85,letterSpacing:"-0.05em",textTransform:"uppercase",margin:"0 0 3rem" }}><span style={{display:"block"}}>{heading}</span><span style={{display:"block"}}>{subheading}</span></h2>
        <a href={ctaHref} style={{ display:"flex",alignItems:"center",justifyContent:"center",position:"relative",width:"10rem",height:"10rem",textDecoration:"none" }}>
          <svg viewBox="0 0 100 100" style={{ position:"absolute",top:0,left:0,width:"100%",height:"100%",transform:"rotate(-90deg)" }}><circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" /></svg>
          <div style={{ position:"relative",zIndex:1,textAlign:"center",fontSize:"0.75rem",fontWeight:500,textTransform:"uppercase",opacity:0.8,lineHeight:1.3 }}><span style={{display:"block"}}>write a</span><span style={{display:"block"}}>message</span></div>
        </a>
      </div>
    </div>
  );
}`,
    prompt: "Create a dark contact section card with a rotating conic-gradient border animated via CSS custom property. A large glowing spotlight follows the cursor inside the card. The card contains a small eyebrow label, a massive two-word heading, and a circular CTA button.",
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
const SCATTER=[{x:-0.8,y:-0.6,rz:-29},{x:-0.2,y:-0.4,rz:-6},{x:-0.5,y:0.3,rz:-14},{x:0.3,y:-0.5,rz:10},{x:0.6,y:0.4,rz:18},{x:-0.4,y:0.7,rz:-22},{x:0.1,y:-0.8,rz:5},{x:0.8,y:0.6,rz:20}];
type Props = { label: string; href: string; target?: string; rel?: string; className?: string };
export function TextDisperseLink({ label, href, target, rel, className="" }: Props) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const scatter = () => { const chars=linkRef.current?.querySelectorAll<HTMLElement>(".yui-dchar"); if(!chars)return; chars.forEach((ch,i)=>{const s=SCATTER[i%SCATTER.length];const em=parseFloat(getComputedStyle(ch).fontSize)||16;gsap.to(ch,{x:s.x*em,y:s.y*em,rotateZ:s.rz,duration:0.4,ease:"power3.out"});}); };
  const gather = () => { const chars=linkRef.current?.querySelectorAll<HTMLElement>(".yui-dchar"); if(!chars)return; gsap.to(Array.from(chars),{x:0,y:0,rotateZ:0,duration:0.5,ease:"power3.out",stagger:0.015}); };
  return (
    <a ref={linkRef} href={href} target={target} rel={rel} className={["yui-disperse-link",className].filter(Boolean).join(" ")} onMouseEnter={scatter} onMouseLeave={gather} style={{ display:"inline-flex",cursor:"pointer",textDecoration:"none",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.03em" }}>
      {label.split("").map((ch,i)=><span key={i} className="yui-dchar" style={{ display:"inline-block",willChange:"transform" }}>{ch===" "?"\u00A0":ch}</span>)}
    </a>
  );
}`,
    prompt: "Create a text link where each character scatters to a pre-defined offset (translates + rotates) on hover, then snaps back to their resting positions on mouse leave. Offsets are proportional to the current font-size in em. Animation is handled by GSAP with power3 easing.",
    tags: ["text", "hover", "scatter", "gsap", "character-animation", "social", "link"],
  },
];

export function getComponent(slug: string): ComponentEntry | undefined {
  return registry.find((c) => c.slug === slug);
}

export function getAllComponents(): ComponentEntry[] {
  return registry;
}
