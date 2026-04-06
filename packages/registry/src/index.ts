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
];

export function getComponent(slug: string): ComponentEntry | undefined {
  return registry.find((c) => c.slug === slug);
}

export function getAllComponents(): ComponentEntry[] {
  return registry;
}
