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
];

export function getComponent(slug: string): ComponentEntry | undefined {
  return registry.find((c) => c.slug === slug);
}

export function getAllComponents(): ComponentEntry[] {
  return registry;
}
