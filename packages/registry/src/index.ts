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
      className={\`px-6 py-2 rounded-xl font-medium text-white backdrop-blur-md bg-white/10 border border-white/20 shadow-lg hover:bg-white/20 transition-[background-color,transform] duration-150 active:scale-[0.97] \${className}\`}
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
        className={\`px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-[border-color,box-shadow] duration-200 \${className}\`}
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
        {mandatory && <span className="text-red-500 ml-1">*</span>}
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
          'h-11 px-4 rounded-full border bg-white text-neutral-900 placeholder:text-neutral-400',
          'focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-[border-color,box-shadow] duration-200',
          uppercase ? 'uppercase' : '',
          error ? 'border-red-500 focus:border-red-500' : 'border-neutral-300',
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

export function RadioGroup({
  name,
  label,
  value,
  onChange,
  options,
  error,
  mandatory,
}: RadioGroupProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-neutral-700 mb-1">
        {label}
        {mandatory && <span className="text-red-500 ml-1">*</span>}
      </legend>
      <div className="flex flex-wrap gap-3">
        {options.map(option => (
          <label
            key={option}
            className={[
              'flex items-center gap-2 px-4 py-2.5 rounded-full border cursor-pointer',
              'transition-[border-color,background-color,color] duration-200 min-h-[48px] select-none',
              value === option
                ? 'border-indigo-500 bg-indigo-50 text-indigo-600 font-medium'
                : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400',
            ].join(' ')}
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            <span
              className={[
                'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                value === option ? 'border-indigo-500' : 'border-neutral-400',
              ].join(' ')}
            >
              {value === option && (
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
              )}
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

export function Checkbox({
  name,
  label,
  checked,
  onChange,
  error,
  mandatory,
}: CheckboxProps) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={name}
        className="flex items-center gap-3 cursor-pointer min-h-[48px] select-none"
      >
        <div
          className={[
            'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-[background-color,border-color] duration-200',
            checked ? 'bg-indigo-500 border-indigo-500' : 'border-neutral-400 bg-white',
            error ? 'border-red-500' : '',
          ].join(' ')}
        >
          {checked && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <input
          id={name}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="sr-only"
        />
        <span className="text-sm text-neutral-700">
          {label}
          {mandatory && <span className="text-red-500 ml-1">*</span>}
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

function toDisplay(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return '';
  const [y, m, d] = parts;
  return \`\${d}/\${m}/\${y}\`;
}

function toISO(display: string): string {
  const digits = display.replace(/\\D/g, '');
  if (digits.length !== 8) return '';
  const d = digits.slice(0, 2);
  const m = digits.slice(2, 4);
  const y = digits.slice(4, 8);
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  if (
    date.getFullYear() !== parseInt(y) ||
    date.getMonth() !== parseInt(m) - 1 ||
    date.getDate() !== parseInt(d)
  ) return '';
  return \`\${y}-\${m.padStart(2, '0')}-\${d.padStart(2, '0')}\`;
}

export function DOBPicker({ name, label, value, onChange, error, mandatory }: DOBPickerProps) {
  const [displayValue, setDisplayValue] = useState(() => toDisplay(value));

  useEffect(() => {
    setDisplayValue(toDisplay(value));
  }, [value]);

  const handleChange = (raw: string) => {
    const incoming = raw.replace(/\\D/g, '').slice(0, 8);
    const prev = displayValue.replace(/\\D/g, '');

    if (incoming.length <= prev.length) {
      let formatted = incoming;
      if (incoming.length > 4) formatted = \`\${incoming.slice(0, 2)}/\${incoming.slice(2, 4)}/\${incoming.slice(4)}\`;
      else if (incoming.length > 2) formatted = \`\${incoming.slice(0, 2)}/\${incoming.slice(2)}\`;
      setDisplayValue(formatted);
      onChange(incoming.length === 8 ? (toISO(formatted) || '') : '');
      return;
    }

    let sanitized = '';
    for (let i = 0; i < incoming.length; i++) {
      const d = parseInt(incoming[i], 10);
      if (i === 0) { if (d > 3) return; sanitized += incoming[i]; }
      else if (i === 1) { const day = parseInt(incoming.slice(0, 2), 10); if (day < 1 || day > 31) return; sanitized += incoming[i]; }
      else if (i === 2) { if (d > 1) return; sanitized += incoming[i]; }
      else if (i === 3) { const month = parseInt(incoming.slice(2, 4), 10); if (month < 1 || month > 12) return; sanitized += incoming[i]; }
      else sanitized += incoming[i];
    }

    let formatted = sanitized;
    if (sanitized.length > 4) formatted = \`\${sanitized.slice(0, 2)}/\${sanitized.slice(2, 4)}/\${sanitized.slice(4)}\`;
    else if (sanitized.length > 2) formatted = \`\${sanitized.slice(0, 2)}/\${sanitized.slice(2)}\`;
    setDisplayValue(formatted);
    onChange(sanitized.length === 8 ? (toISO(formatted) || '') : '');
  };

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-neutral-700">
        {label}
        {mandatory && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        inputMode="numeric"
        placeholder="DD/MM/YYYY"
        value={displayValue}
        onChange={e => handleChange(e.target.value)}
        maxLength={10}
        className={[
          'h-11 px-4 rounded-full border bg-white text-neutral-900 placeholder:text-neutral-400',
          'focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-[border-color,box-shadow] duration-200',
          error ? 'border-red-500' : 'border-neutral-300',
        ].join(' ')}
      />
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

// Real @keyframes (not a transition) so Radix's Presence waits for
// \`animationend\` before unmounting the content, instead of popping instantly.
const selectPopStyle = \`
  @keyframes yui-select-pop-in { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
  @keyframes yui-select-pop-out { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.96); } }
\`;

type SelectInputProps = {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  error?: string;
  mandatory?: boolean;
};

export function SelectInput({
  name,
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  mandatory,
}: SelectInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <style>{selectPopStyle}</style>
      <label htmlFor={name} className="text-sm font-medium text-neutral-700">
        {label}
        {mandatory && <span className="text-red-500 ml-1">*</span>}
      </label>
      <Select.Root value={value || undefined} onValueChange={onChange}>
        <Select.Trigger
          id={name}
          className={[
            'h-11 px-4 rounded-full border bg-white flex items-center justify-between gap-2 text-left',
            'focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-[border-color,box-shadow,transform] duration-200 active:scale-[0.99]',
            !value ? 'text-neutral-400' : 'text-neutral-900',
            error ? 'border-red-500' : 'border-neutral-300',
            'data-[state=open]:border-indigo-500 data-[state=open]:ring-2 data-[state=open]:ring-indigo-300',
          ].join(' ')}
        >
          <Select.Value placeholder={placeholder ?? 'Select an option'} />
          <Select.Icon>
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            className={[
              'bg-white border border-neutral-200 rounded-lg shadow-md overflow-hidden z-50 min-w-[var(--radix-select-trigger-width)]',
              '[transform-origin:var(--radix-select-content-transform-origin)]',
              'data-[state=open]:animate-[yui-select-pop-in_160ms_cubic-bezier(0.23,1,0.32,1)]',
              'data-[state=closed]:animate-[yui-select-pop-out_120ms_cubic-bezier(0.23,1,0.32,1)]',
            ].join(' ')}
            position="popper"
            sideOffset={4}
          >
            <Select.Viewport className="p-1">
              {options.map(option => (
                <Select.Item
                  key={option}
                  value={option}
                  className={[
                    'flex items-center gap-2 px-3 py-2.5 text-sm rounded-md cursor-pointer outline-none text-neutral-700',
                    'data-[highlighted]:bg-indigo-50 data-[highlighted]:text-indigo-600',
                    'data-[state=checked]:font-medium data-[state=checked]:text-indigo-600',
                    'transition-colors duration-150',
                  ].join(' ')}
                >
                  <Select.ItemText>{option}</Select.ItemText>
                  <Select.ItemIndicator className="ml-auto">
                    <Check className="w-4 h-4" />
                  </Select.ItemIndicator>
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
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  mandatory?: boolean;
  accept?: string;
};

export function FileUpload({
  name,
  label,
  value,
  onChange,
  error,
  mandatory,
  accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx',
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange(file.name);
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleRemove = () => {
    onChange('');
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setShowPreview(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-neutral-700">
        {label}
        {mandatory && <span className="text-red-500 ml-1">*</span>}
      </label>

      {!value ? (
        <div
          className={[
            'flex items-center gap-3 p-3 rounded-xl border border-dashed cursor-pointer',
            'transition-[border-color] duration-200 min-h-[48px]',
            error ? 'border-red-500' : 'border-neutral-300 hover:border-indigo-400',
          ].join(' ')}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
        >
          <Upload className="w-5 h-5 text-neutral-400 flex-shrink-0" />
          <span className="text-sm text-neutral-500">Click to upload a file</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-neutral-300 bg-neutral-50">
          <FileText className="w-5 h-5 text-indigo-500 flex-shrink-0" />
          <span className="text-sm text-neutral-700 truncate flex-1">{value}</span>
          <div className="flex items-center gap-1">
            {previewUrl && (
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="p-1.5 rounded-full hover:bg-neutral-200 transition-colors"
                title="Preview"
              >
                <Eye className="w-4 h-4 text-neutral-600" />
              </button>
            )}
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded-full hover:bg-neutral-200 transition-colors"
              title="Remove"
            >
              <X className="w-4 h-4 text-neutral-600" />
            </button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        id={name}
        name={name}
        type="file"
        onChange={handleChange}
        className="sr-only"
        accept={accept}
      />

      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}

      {showPreview && previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-white rounded-xl shadow-lg p-4 max-w-lg w-full mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-neutral-800">{value}</span>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="p-1.5 rounded-full hover:bg-neutral-200 transition-colors"
              >
                <X className="w-4 h-4 text-neutral-600" />
              </button>
            </div>
            <img src={previewUrl} alt={value} className="w-full rounded-lg object-contain max-h-[60vh]" />
          </div>
        </div>
      )}
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
                  isCompleted ? 'bg-green-500' : isCurrent ? 'bg-indigo-500 scale-125' : 'bg-neutral-300',
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
                        ? 'bg-green-500 text-white'
                        : isCurrent
                          ? 'bg-indigo-500 text-white shadow-[0_0_0_3px_rgba(99,102,241,0.3)]'
                          : 'bg-neutral-200 text-neutral-500',
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
                      isCurrent ? 'text-indigo-600 font-semibold' : isCompleted ? 'text-green-600 font-medium' : 'text-neutral-400',
                    ].join(' ')}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={[
                      'flex-1 h-0.5 mt-[18px] transition-[background-color] duration-300',
                      isCompleted ? 'bg-green-500' : 'bg-neutral-200',
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
  currentStepIndex: number;
  totalSteps: number;
  isLoading?: boolean;
  loadingLabel?: string;
  isLastStep?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  nextLabel?: string;
  previousLabel?: string;
};

export function StepperNavigation({
  currentStepIndex,
  totalSteps,
  isLoading = false,
  loadingLabel,
  isLastStep = false,
  onPrevious,
  onNext,
  onSubmit,
  submitLabel = 'Submit',
  nextLabel = 'Next',
  previousLabel = 'Previous',
}: StepperNavigationProps) {
  const isFirstStep = currentStepIndex === 0;

  return (
    <div className="flex items-center gap-4 pt-6 mt-6 border-t border-neutral-200 w-full">
      {!isFirstStep && (
        <button
          type="button"
          onClick={onPrevious}
          disabled={isLoading}
          className="flex-1 h-9 px-5 rounded-full font-semibold bg-neutral-100 text-neutral-800
                     hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-300
                     transition-[background-color,transform] duration-150 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100
                     inline-flex items-center justify-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          {previousLabel}
        </button>
      )}

      {isLastStep ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading}
          className="flex-1 h-9 px-5 rounded-full font-semibold bg-indigo-500 text-white
                     hover:bg-indigo-600 active:bg-indigo-700 active:scale-[0.97]
                     focus:outline-none focus:ring-2 focus:ring-indigo-300
                     transition-[background-color,transform] duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
                     inline-flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {loadingLabel ?? 'Submitting...'}
            </>
          ) : (
            <>
              {submitLabel}
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={isLoading}
          className="flex-1 h-9 px-5 rounded-full font-semibold bg-indigo-500 text-white
                     hover:bg-indigo-600 active:bg-indigo-700 active:scale-[0.97]
                     focus:outline-none focus:ring-2 focus:ring-indigo-300
                     transition-[background-color,transform] duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
                     inline-flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {loadingLabel ?? 'Saving...'}
            </>
          ) : (
            <>
              {nextLabel}
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      )}
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
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
        <p className="text-xs text-neutral-400 mt-3">
          Step {currentIndex + 1} of {phases.length}
        </p>
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

export function ScreenLayout({ brandInitials = 'YASH', brandName = 'YASH', title, subtitle, stepper, navigation, children }: ScreenLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col">
      <header className="bg-white border-b border-neutral-200 px-4 py-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-[9px] tracking-tight">{brandInitials}</div>
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
          className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 transition-colors cursor-pointer"
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
        <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{title}</h2>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors cursor-pointer"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-300 placeholder-neutral-400 transition"
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
              <h3 className="text-[10px] font-semibold text-neutral-300 uppercase tracking-widest mb-2 px-1">
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
                        <div className="text-[10px] text-neutral-400">{item.description}</div>
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
          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
            {title}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors cursor-pointer"
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
      <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
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
        'w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-xl ' +
        'focus:outline-none focus:ring-2 focus:ring-neutral-300 placeholder-neutral-300 transition ' +
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
        'w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-xl ' +
        'focus:outline-none focus:ring-2 focus:ring-neutral-300 resize-none transition ' +
        (props.className ?? '')
      }
    />
  );
}

export function PanelDeleteButton({ onClick, label = 'Delete' }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
    >
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
        selected ? 'ring-2 ring-offset-2 shadow-md' : 'shadow-sm hover:shadow-md',
      ].join(' ')}
      style={{
        borderColor: selected ? accentColor : '#e2e8f0',
        ...(selected
          ? ({ '--tw-ring-color': accentColor } as CSSProperties)
          : {}),
      }}
      onClick={onClick}
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
          <p className="text-xs text-neutral-400 truncate">{description}</p>
        </div>
      )}

      {/* Handle slots */}
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

// ── Spring easing ──────────────────────────────────────────────────
const SWITCH_THEME = {
  "--ease-spring": "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
} as React.CSSProperties

const switchVariants = cva(
  "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
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
            "bg-muted border-border",
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
    prompt: "Build a Material Design 3 toggle switch in React with spring-easing physics for the handle, a hover/press halo effect, optional check/X icons that rotate in/out, two sizes (default and sm), primary and destructive color variants, and an optional Web Audio API haptic feedback click sound.",
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
                <p className="text-sm text-muted-foreground mt-1">This action cannot be undone.</p>
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
                  className="px-4 py-2 text-sm rounded-md border border-border bg-background hover:bg-muted transition-[background-color,transform] active:scale-[0.97]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFirstConfirm}
                  className="px-4 py-2 text-sm rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-[background-color,transform] active:scale-[0.97]"
                >
                  Continue to Final Confirmation
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm rounded-md border border-border bg-background hover:bg-muted transition-[background-color,transform] active:scale-[0.97] disabled:opacity-50"
                >
                  Go Back
                </button>
                <button
                  onClick={handleFinalConfirm}
                  disabled={inputValue !== confirmationPhrase || isLoading}
                  className="px-4 py-2 text-sm rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-[background-color,transform] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
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
      className={\`relative overflow-hidden rounded-xl transition-transform duration-300 \${isDragging ? "scale-[1.02]" : ""} \${disabled ? "opacity-50 cursor-not-allowed" : blendComplete ? "cursor-default" : "cursor-pointer"}\`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
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
            <h3 className={\`text-xl font-bold transition-colors \${isBlending ? "text-[#7A8A70]" : blendComplete ? "text-[#92A086]" : "text-gray-800"}\`}>
              {isBlending ? "Uploading..." : blendComplete ? "🍹 Smoothie Served!" : "Drop files to upload"}
            </h3>
            <p className="mt-2 text-gray-500">
              {isBlending ? (
                "Wait a moment, it's almost ready"
              ) : blendComplete ? (
                "Your image is ready to use!"
              ) : (
                <>or <span className="text-[#92A086] font-semibold hover:underline">browse</span> to choose a file</>
              )}
            </p>
          </div>

          {/* Preview */}
          {blendComplete && previewUrl && (
            <div className="mt-5 p-3 bg-white rounded-lg shadow-md border border-[#92A086]/30">
              <p className="text-xs text-[#92A086] font-medium mb-2 text-center">📸 Your Image</p>
              <img src={previewUrl} alt="Uploaded preview" className="max-w-40 max-h-[100px] rounded-md object-cover mx-auto" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); resetUpload() }}
                className="mt-2 w-full py-1.5 px-3 text-xs font-medium text-[#7A8A70] bg-[#92A086]/10 hover:bg-[#92A086]/20 rounded-md transition-colors"
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

const CustomCheckbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      type="checkbox"
      ref={ref}
      className={[
        "border-1 relative box-border block h-[1.5rem] w-[1.5rem] cursor-pointer appearance-none rounded-md border-[#d9d9d9] bg-slate-200 transition-[background-color,border-color] duration-300",
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
        "hover:border-[#1677ff] focus:outline-[#1677ff]",
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
        "relative left-0 top-0 h-[1.5rem] w-[1.5rem] rounded-[50%] bg-slate-200 transition duration-300",
        "after:absolute after:left-[0.5rem] after:top-1 after:hidden after:h-[0.8rem] after:w-[0.5rem]",
        "after:rotate-45 after:border-b-[0.2rem] after:border-r-[0.2rem] after:content-['']",
        "focus:outline-[#0b6e4f]",
        "peer-checked:animate-pulse peer-checked:rounded-lg peer-checked:bg-[#0b6e4f] peer-checked:after:block",
        className,
      ].filter(Boolean).join(" ")} />
    </label>
  )
)
AnimatedCheckbox.displayName = "AnimatedCheckbox"

export { CustomCheckbox, GradientCheckbox, TransformerCheckbox, AnimatedCheckbox }`,
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
export function SiteHeader({ logo="YASH", logoHref="/", navLinks=[], ctaLabel="GET IN TOUCH", ctaHref="#contact", visible=true }: Props) {
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
export function MobileMenu({ logo="YASH", logoHref="/", links=[] }: Props) {
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
  // ── Grocery / ecommerce components ──
  {
    name: "ImageWithFallback",
    slug: "image-with-fallback",
    path: "media/ImageWithFallback.tsx",
    category: "media",
    code: `"use client";
import { useState } from "react";
const ERROR_IMG_SRC = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";
export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false);
  const { src, alt, style, className, ...rest } = props;
  return didError ? (
    <div className={\`inline-block bg-gray-100 text-center align-middle \${className ?? ""}\`} style={style}>
      <div className="flex items-center justify-center w-full h-full">
        <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
      </div>
    </div>
  ) : (
    <img src={src} alt={alt} className={className} style={style} {...rest} onError={() => setDidError(true)} />
  );
}`,
    prompt: "Create a React image component that renders a standard <img> tag but gracefully falls back to a built-in SVG placeholder when the image fails to load. Accept all standard HTML img attributes as props. Show a gray container with a centered broken-image SVG icon as the fallback.",
    tags: ["image", "fallback", "graceful-degradation", "utility", "media"],
  },
  {
    name: "SkeletonCard",
    slug: "skeleton-card",
    path: "loaders/SkeletonCard.tsx",
    category: "loading",
    code: `export function SkeletonCard() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden animate-pulse">
      <div className="aspect-square bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="flex items-center justify-between mt-3">
          <div className="h-5 bg-muted rounded w-12" />
          <div className="h-8 w-8 bg-muted rounded-lg" />
        </div>
      </div>
    </div>
  );
}
export function SkeletonRow() {
  return (
    <div className="flex gap-3 p-3 bg-muted rounded-lg animate-pulse">
      <div className="w-16 h-16 rounded-lg bg-muted-foreground/10 shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 bg-muted-foreground/10 rounded w-2/3" />
        <div className="h-3 bg-muted-foreground/10 rounded w-1/3" />
        <div className="h-4 bg-muted-foreground/10 rounded w-1/4" />
      </div>
    </div>
  );
}`,
    prompt: "Create two React skeleton loading components using Tailwind CSS animate-pulse. SkeletonCard should mimic a product card with a square image placeholder, two text lines and a price+button row. SkeletonRow should mimic a horizontal list item with a square thumbnail and three text lines. Use shadcn/ui Tailwind tokens.",
    tags: ["skeleton", "loading", "placeholder", "pulse", "shimmer"],
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
          className="mt-4 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 active:scale-[0.97] transition-[opacity,transform] duration-150"
        >
          {c.cta}
        </button>
      )}
    </motion.div>
  );
}`,
    prompt: "Build a reusable React EmptyState component with Framer Motion fade-in animation. Support four preset types: cart, search, category, and network — each with a different lucide-react icon, title, description, and CTA label. Accept an optional query string and an optional onCTA callback. Use shadcn/ui Tailwind design tokens.",
    tags: ["empty", "placeholder", "no-results", "animated", "preset", "ecommerce"],
  },
  {
    name: "Breadcrumb",
    slug: "breadcrumb",
    path: "navigation/Breadcrumb.tsx",
    category: "navigation",
    code: `"use client";
import { ChevronRight, Home } from "lucide-react";
export interface BreadcrumbItem { label: string; href?: string; onClick?: () => void; }
type Props = { items: BreadcrumbItem[]; className?: string; };
export function Breadcrumb({ items, className = "" }: Props) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-0.5 flex-wrap text-xs text-muted-foreground">
        {items.map((item, i) => {
          const isLast = i === items.length - 1; const isFirst = i === 0;
          return (
            <li key={i} className="flex items-center gap-0.5 min-w-0">
              {i > 0 && <ChevronRight className="w-3 h-3 mx-0.5 shrink-0 opacity-40" />}
              {isLast ? (
                <span className="font-medium text-foreground truncate max-w-[160px]" aria-current="page" title={item.label}>{item.label}</span>
              ) : item.href ? (
                <a href={item.href} className="flex items-center gap-1 hover:text-primary transition-colors whitespace-nowrap underline-offset-2 hover:underline">
                  {isFirst && <Home className="w-3 h-3 shrink-0" />}{item.label}
                </a>
              ) : item.onClick ? (
                <button type="button" onClick={item.onClick} className="hover:text-primary transition-colors whitespace-nowrap cursor-pointer bg-transparent border-0 p-0 text-xs text-muted-foreground">
                  {isFirst && <Home className="w-3 h-3 shrink-0 inline mr-1" />}{item.label}
                </button>
              ) : <span className="whitespace-nowrap">{item.label}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}`,
    prompt: "Create a generic React breadcrumb navigation component. Each item in the items array should have a label, optional href (renders as link), and optional onClick (renders as button). The first item should display a Home icon from lucide-react. Separate items with a ChevronRight icon. The last item is non-interactive and shown in foreground color. Use Tailwind CSS with shadcn/ui tokens.",
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
            className={\`flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-[background-color,border-color,color] duration-150 shrink-0 border \${
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
    prompt: "Build a horizontally scrollable category filter chip bar in React using Framer Motion. Accept a categories array (each with id, name, icon component, and color), activeCategory string, and onCategoryChange callback. Active chip uses filled primary color; inactive uses white with border. Hide the scrollbar. Add tap scale animation.",
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
export interface GridCategory { id: string; name: string; icon: ElementType; color: string; }
type Props = { categories: GridCategory[]; onCategoryClick?: (categoryId: string) => void; };
export function CategoryGrid({ categories, onCategoryClick }: Props) {
  return (
    <div className="grid grid-cols-4 md:grid-cols-8 gap-3 md:gap-4">
      {categories.map((category, index) => {
        const Icon = category.icon;
        return (
          <motion.button key={category.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
            onClick={() => onCategoryClick?.(category.id)} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors">
            <div className={\`w-14 h-14 md:w-16 md:h-16 rounded-full \${category.color} flex items-center justify-center\`}>
              <Icon className="w-7 h-7 md:w-8 md:h-8" />
            </div>
            <span className="text-center leading-tight text-xs">{category.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
}`,
    prompt: "Create a responsive React category grid component using Framer Motion. Display 4 columns on mobile and 8 on desktop. Each item shows a circular colored icon and a label below. Add staggered fade+slide-up entrance animation. Accept a categories array (id, name, icon, color) and optional onCategoryClick callback.",
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
type Props = { isOpen: boolean; onClose: () => void; onSearch: (query: string) => void; currentQuery?: string; popularSearches?: string[]; storageKey?: string; };
export function SearchOverlay({ isOpen, onClose, onSearch, currentQuery = "", popularSearches = [], storageKey = "app_recent_searches" }: Props) {
  const [value, setValue] = useState(currentQuery);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  function getRecent(): string[] { try { return JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch { return []; } }
  function saveRecent(term: string) { try { const prev = getRecent().filter(s => s !== term); localStorage.setItem(storageKey, JSON.stringify([term, ...prev].slice(0, 8))); } catch {} }
  function clearRecent() { try { localStorage.removeItem(storageKey); } catch {} }
  useEffect(() => { if (isOpen) { setValue(currentQuery); setRecent(getRecent()); setTimeout(() => inputRef.current?.focus(), 100); } }, [isOpen, currentQuery]);
  const commit = (term: string) => { if (!term.trim()) return; saveRecent(term.trim()); onSearch(term.trim()); onClose(); };
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") commit(value); if (e.key === "Escape") onClose(); };
  return (
    <AnimatePresence>
      {isOpen && (<>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ type: "spring", damping: 30, stiffness: 400 }} className="fixed top-0 left-0 right-0 z-[61] bg-white shadow-2xl rounded-b-2xl max-h-[80vh] flex flex-col">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
            <input ref={inputRef} type="text" value={value} onChange={e => setValue(e.target.value)} onKeyDown={handleKey} placeholder="Search…" className="flex-1 text-base outline-none bg-transparent placeholder:text-muted-foreground" />
            {value && <button onClick={() => setValue("")} className="p-1 hover:bg-muted rounded-full transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>}
            <button onClick={onClose} className="text-primary font-medium text-sm shrink-0 hover:opacity-70 transition-opacity">Cancel</button>
          </div>
          <div className="overflow-y-auto flex-1 p-4 space-y-5">
            {recent.length > 0 && <div><div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Recent</span><button onClick={() => { clearRecent(); setRecent([]); }} className="text-xs text-primary hover:underline">Clear</button></div><div className="flex flex-wrap gap-2">{recent.map(r => <button key={r} onClick={() => commit(r)} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full text-sm hover:bg-primary/10 hover:text-primary transition-colors"><Clock className="w-3.5 h-3.5 text-muted-foreground" />{r}</button>)}</div></div>}
            {popularSearches.length > 0 && <div><div className="flex items-center gap-1 mb-2"><TrendingUp className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Popular</span></div><div className="flex flex-wrap gap-2">{popularSearches.map(s => <button key={s} onClick={() => commit(s)} className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium hover:bg-primary/20 transition-colors">{s}<ChevronRight className="w-3 h-3" /></button>)}</div></div>}
          </div>
          {value.trim() && <div className="p-4 border-t border-border"><button onClick={() => commit(value)} className="w-full bg-primary text-primary-foreground py-3 rounded-xl flex items-center justify-center gap-2 font-medium hover:opacity-90 transition-opacity active:scale-[0.98]"><Search className="w-4 h-4" />Search for &ldquo;{value}&rdquo;</button></div>}
        </motion.div>
      </>)}
    </AnimatePresence>
  );
}`,
    prompt: "Build a full-screen search overlay in React with Framer Motion. It slides down from the top with a spring animation and a blurred backdrop. Include an input with clear button and cancel action; a Recent searches section (persisted in localStorage); a Popular searches section with pill buttons. Show a search CTA when there is text.",
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
export interface NavTab { id: string; icon: ElementType; label: string; badge?: number; action?: () => void; accentColor?: string; }
type Props = { tabs: NavTab[]; activeTab: string; onTabChange: (tab: string) => void; };
export function MobileBottomNav({ tabs, activeTab, onTabChange }: Props) {
  return (
    <motion.nav initial={{ y: 100 }} animate={{ y: 0 }} className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="grid px-1" style={{ gridTemplateColumns: \`repeat(\${tabs.length}, minmax(0, 1fr))\` }}>
        {tabs.map((tab) => {
          const Icon = tab.icon; const isActive = activeTab === tab.id; const hasAccent = !!tab.accentColor;
          return (
            <button key={tab.id} onClick={() => tab.action ? tab.action() : onTabChange(tab.id)} style={hasAccent ? { color: tab.accentColor } : undefined}
              className={\`flex flex-col items-center gap-0.5 py-2.5 px-1 relative transition-colors \${hasAccent ? "" : isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}\`}>
              {isActive && !hasAccent && <motion.div layoutId="nav-indicator" className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" transition={{ type: "spring", damping: 20, stiffness: 400 }} />}
              <div className="relative"><Icon className="w-5 h-5" />
                <AnimatePresence>{tab.badge !== undefined && tab.badge > 0 && <motion.span key={tab.badge} initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full min-w-[16px] h-4 flex items-center justify-center text-[9px] font-bold px-0.5 leading-none">{tab.badge > 99 ? "99+" : tab.badge}</motion.span>}</AnimatePresence>
              </div>
              <span className="text-[10px]">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}`,
    prompt: "Build a mobile bottom navigation bar in React with Framer Motion that slides up on mount. Support N tabs from a tabs prop array (id, icon, label, optional badge count, optional custom action, optional accent color). Show an animated active indicator bar using Framer Motion layoutId. Show a red badge count when badge > 0. Hide on md+ screens.",
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
        className="block w-full relative aspect-square bg-muted overflow-hidden focus:outline-none"
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
          className="text-left w-full no-underline text-inherit hover:text-primary transition-colors focus:outline-none"
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
    prompt: "Design a React product card for an e-commerce grocery app using Framer Motion. Show a square product image with discount badge (top-left) and quantity counter bubble (top-right). Show an out-of-stock overlay with Notify me button. Display product name, unit weight, current price, and strikethrough original price when discounted. Toggle between an ADD button and inline stepper with animated transitions. Flash a success overlay when first added.",
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
type Props = { itemCount: number; totalPrice: number; onViewCart: () => void; primaryAction?: { label: string; onClick: () => void; colorClass?: string; }; };
export function StickyCartBar({ itemCount, totalPrice, onViewCart, primaryAction }: Props) {
  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.div initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 120 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="md:hidden fixed bottom-16 left-0 right-0 z-40 px-3 pb-1">
          <div className="bg-foreground text-background rounded-2xl shadow-2xl overflow-hidden">
            <button onClick={onViewCart} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2"><div className="relative"><ShoppingCart className="w-4 h-4" /><span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{itemCount}</span></div><span className="text-sm font-medium">{itemCount} item{itemCount !== 1 ? "s" : ""}</span></div>
              <div className="flex items-center gap-1 text-sm font-semibold">₹{totalPrice}<ChevronUp className="w-4 h-4 opacity-60" /></div>
            </button>
            <div className="flex border-t border-white/10">
              <button onClick={onViewCart} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium hover:bg-white/5 transition-colors border-r border-white/10"><ShoppingCart className="w-4 h-4" />View Cart</button>
              {primaryAction && <button onClick={primaryAction.onClick} className={\`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold transition-colors \${primaryAction.colorClass ?? "bg-[#25D366] hover:bg-[#22c35e]"}\`}><MessageCircle className="w-4 h-4" />{primaryAction.label}</button>}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}`,
    prompt: "Build a sticky cart summary bar for mobile in React with Framer Motion. It should spring-animate up from the bottom when cart has items and disappear when empty. Show item count and total price in a dark rounded card. Include a View Cart button and a customizable primary action button. Position it above a bottom navigation bar (bottom-16).",
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
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity shrink-0 font-medium"
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
              className="w-full flex items-center gap-2 pl-3 pr-4 py-2.5 bg-gray-100 rounded-xl text-gray-400 text-sm hover:bg-gray-200 transition-colors duration-150 text-left"
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
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-gray-500" />
            </button>

            {/* CTA button (desktop) */}
            {ctaButton && (
              <button
                onClick={ctaButton.onClick}
                className={\`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg hover:opacity-90 active:scale-[0.97] transition-[opacity,transform] duration-150 text-sm font-medium text-white \${
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
              className="relative flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 active:scale-[0.97] transition-[opacity,transform] duration-150 text-sm font-medium"
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
    prompt: "Build a sticky responsive app header in React with Framer Motion. Include: a top info banner with a live open/closed indicator dot, optional info text, and optional CTA button. A main row with a logo/wordmark, a desktop inline search bar, a mobile search icon, an optional secondary CTA button, and a cart button with an animated badge count. Slide down from top on mount. Use shadcn/ui Tailwind tokens.",
    tags: ["header", "navbar", "sticky", "responsive", "cart-badge", "animated", "ecommerce"],
  },
  // ── Blissful Bites components ──
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
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-neutral-100 block"
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
          <span className="absolute top-3 right-3 bg-green-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
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
            <span className="text-neutral-400 text-xs line-through">{currencySymbol}{product.originalPrice}</span>
          )}
          <span className="text-neutral-400 text-[10px] sm:text-xs">{unitLabel}</span>
        </div>
        <span className="w-full bg-neutral-900 text-white text-[10px] sm:text-xs font-medium py-2 sm:py-2.5 rounded-full group-hover:bg-neutral-700 transition-colors flex items-center justify-center gap-1.5 min-h-[40px]">
          {ctaLabel}
        </span>
      </div>
    </a>
  );
}`,
    prompt: "Create a React product card component with Tailwind CSS. It should show a product image (with a shimmer skeleton placeholder fallback using animate-pulse), an optional top-left badge and top-right tag as pill labels, product name with line-clamp, optional strikethrough original price, a price display with unit label, and a full-width CTA button at the bottom. On hover the card should lift (shadow increase) and the image should zoom slightly. Make it fully responsive and accept all values as props.",
    tags: ["ecommerce", "product", "hover-zoom", "skeleton", "badge", "responsive", "bakery"],
  },
  {
    name: "TestimonialCard",
    slug: "testimonial-card",
    path: "cards/TestimonialCard.tsx",
    category: "cards",
    code: `import { Star } from "lucide-react";
export interface Testimonial { rating: number; text: string; name: string; role?: string; }
type Props = { testimonial: Testimonial; };
export function TestimonialCard({ testimonial }: Props) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center gap-0.5 mb-4">
        {Array.from({ length: testimonial.rating }).map((_, i) => <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />)}
      </div>
      <p className="text-neutral-600 text-sm leading-relaxed mb-5 italic">&ldquo;{testimonial.text}&rdquo;</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center"><span className="text-neutral-600 font-bold text-sm">{testimonial.name.charAt(0)}</span></div>
        <div>
          <p className="text-neutral-900 font-semibold text-sm">{testimonial.name}</p>
          {testimonial.role && <p className="text-neutral-400 text-xs">{testimonial.role}</p>}
        </div>
      </div>
    </div>
  );
}`,
    prompt: "Build a React testimonial card with Tailwind CSS. Show filled star icons driven by a numeric rating prop, an italic quoted review text, and an author row with an auto-generated avatar (first letter of name on a neutral circle), author name, and role. Subtle box shadow that deepens on hover.",
    tags: ["testimonial", "review", "stars", "avatar", "social-proof"],
  },
  {
    name: "FAQAccordion",
    slug: "faq-accordion",
    path: "sections/FAQAccordion.tsx",
    category: "sections",
    code: `"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface FAQItem {
  q: string;
  a: string;
}

interface FAQItemProps {
  faq: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItemRow({ faq, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="border-b border-neutral-100 last:border-b-0">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-4 py-5 text-left cursor-pointer group"
      >
        <span className="text-neutral-900 text-sm sm:text-base font-medium group-hover:text-neutral-600 transition-colors">
          {faq.q}
        </span>
        <ChevronDown
          size={18}
          className={\`shrink-0 text-neutral-400 transition-transform duration-300 \${isOpen ? "rotate-180" : ""}\`}
        />
      </button>
      <div
        className="overflow-hidden transition-[max-height,opacity] duration-300 ease-[cubic-bezier(0.77,0,0.175,1)]"
        style={{ maxHeight: isOpen ? "200px" : "0", opacity: isOpen ? 1 : 0 }}
      >
        <p className="text-neutral-500 text-sm leading-relaxed pb-5">{faq.a}</p>
      </div>
    </div>
  );
}

type Props = {
  items: FAQItem[];
  title?: string;
  subtitle?: string;
};

export function FAQAccordion({ items, title = "Frequently Asked Questions", subtitle = "" }: Props) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-3">{title}</h2>
          {subtitle && <p className="text-neutral-500 text-sm">{subtitle}</p>}
        </div>
        <div className="bg-neutral-50 rounded-2xl px-6 sm:px-8">
          {items.map((faq, i) => (
            <FAQItemRow
              key={i}
              faq={faq}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}`,
    prompt: "Create a React FAQ accordion section component with Tailwind CSS. It should accept an array of {q, a} items and render them as an accordion — one item open at a time (click to toggle, click again to close all). Animate open/close with a CSS max-height transition. Include a section heading and optional subtitle. Use a ChevronDown icon that rotates 180° when open. Keep it accessible with aria-expanded.",
    tags: ["faq", "accordion", "animated", "accessible", "chevron", "sections"],
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
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-[background-color,box-shadow,transform] duration-300 hover:scale-110 active:scale-105 group"
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
    prompt: "Create a floating WhatsApp chat button (FAB) component in React with Tailwind CSS. It should be fixed to the bottom-right corner of the screen, show a filled MessageCircle icon, and open a wa.me deep link with a pre-encoded message in a new tab. On hover, show a small tooltip to the left and scale up the button. Accept phone number, message, and tooltip text as props.",
    tags: ["whatsapp", "fab", "floating", "chat", "fixed", "tooltip"],
  },
  {
    name: "ImagePlaceholder",
    slug: "image-placeholder",
    path: "feedback/ImagePlaceholder.tsx",
    category: "feedback",
    code: `type Props = { aspectRatio?: string; label?: string; rounded?: string; className?: string; };
export function ImagePlaceholder({ aspectRatio="4/3", label="", rounded="rounded-xl", className="" }: Props) {
  return (
    <div className={\`relative overflow-hidden bg-neutral-100 \${rounded} \${className}\`} style={{ aspectRatio }} role="img" aria-label={label||"Image placeholder"}>
      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400">
        <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        {label && <span className="text-xs font-medium opacity-60">{label}</span>}
      </div>
    </div>
  );
}`,
    prompt: "Build a React image skeleton/placeholder component with Tailwind. It should accept an aspect-ratio prop (CSS string), a label for accessibility, a Tailwind rounded class, and extra className. Show an animate-pulse shimmer overlay and a centered image SVG icon with optional text label inside.",
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
                  className={\`text-sm font-medium transition-colors duration-200 hover:text-neutral-900 \${
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
                <button onClick={onSearchClick} className="p-2 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer" aria-label="Search">
                  <Search size={20} />
                </button>
              )}
              {onAccountClick && (
                <button onClick={onAccountClick} className="p-2 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer" aria-label="Account">
                  <User size={20} />
                </button>
              )}
              {onCartClick && (
                <button onClick={onCartClick} className="relative p-2 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer" aria-label={\`Cart, \${cartCount} items\`}>
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
              className="lg:hidden p-2 text-neutral-900 cursor-pointer"
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
                    className={\`block py-3 px-4 rounded-lg text-sm font-medium transition-colors \${
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
    prompt: "Build a sticky responsive navbar in React with Tailwind CSS and Framer Motion. Include an optional announcement bar above it. On scroll, apply a frosted-glass effect (backdrop-blur + shadow). Desktop: logo left, nav links center, icon actions right (search, account, cart with badge). Mobile: hamburger that toggles an animated slide-down drawer with full-width links. Lock body scroll when drawer is open. Accept all nav links, brand, cart count, and action handlers as props. No router dependency.",
    tags: ["navbar", "sticky", "responsive", "mobile-drawer", "blur", "announcement-bar", "cart-badge"],
  },
  {
    name: "ErrorBoundary",
    slug: "error-boundary",
    path: "feedback/ErrorBoundary.tsx",
    category: "feedback",
    code: `import { Component, type ReactNode } from "react";
interface Props { children: ReactNode; icon?: string; title?: string; description?: string; buttonLabel?: string; }
interface State { hasError: boolean; }
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(): State { return { hasError: true }; }
  render() {
    if (this.state.hasError) return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-6">
        <div className="text-center max-w-md">
          <span className="text-6xl block mb-4">{this.props.icon??"⚠️"}</span>
          <h1 className="text-2xl font-bold text-neutral-900 mb-3">{this.props.title??"Something went wrong"}</h1>
          <p className="text-neutral-500 text-sm mb-6 leading-relaxed">{this.props.description??"An unexpected error occurred. Please try refreshing the page."}</p>
          <button onClick={()=>window.location.reload()} className="bg-neutral-900 text-white px-8 py-3 rounded-full font-medium text-sm hover:bg-neutral-700 transition-colors cursor-pointer">{this.props.buttonLabel??"Refresh Page"}</button>
        </div>
      </div>
    );
    return this.props.children;
  }
}`,
    prompt: "Create a React class-based ErrorBoundary component with Tailwind CSS fallback UI. Show a full-screen centered error state with a large emoji icon, heading, description, and a reload button. Accept icon, title, description, and button label as props with sensible defaults. Wrap children normally when no error.",
    tags: ["error-boundary", "fallback", "crash", "full-screen", "class-component"],
  },

  // ── LanceMart AI – Project A ─────────────────────────────────────────────
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
              className="text-[13px] text-[#4a4a4c] hover:text-[#0a0a0a] transition-colors no-underline"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <button
          className="flex items-center justify-center w-9 h-9 rounded-full border border-black/[0.13] cursor-pointer bg-black/[0.02] text-[#4a4a4c] hover:text-[#0a0a0a] hover:bg-black/[0.04] transition-[color,background-color,transform] duration-150 active:scale-[0.93] shrink-0 p-0"
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
    prompt: "Create a sticky glassmorphism navigation bar in React with a brand logo dot + name on the left, nav links in the center-right, and a circular moon/sun theme-toggle icon button on the far right. Use backdrop blur and a subtle bottom border. Hide nav links on mobile. Support dark mode via a prop.",
    tags: ["navbar", "glassmorphism", "sticky", "dark-mode", "responsive"],
  },
  {
    name: "useThemeRipple",
    slug: "use-theme-ripple",
    path: "hooks/useThemeRipple.tsx",
    category: "hooks",
    code: `"use client";
import { useEffect } from "react";
type Props = { isDark: boolean; onToggle: (nextDark: boolean) => void; storageKey?: string; };
export function useThemeRipple({ isDark, onToggle, storageKey = "theme" }: Props) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(storageKey);
    if (stored === "dark") onToggle(true);
    else if (stored === "light") onToggle(false);
  }, []);
  function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    const nextDark = !isDark;
    const x = e.clientX; const y = e.clientY;
    const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const oldBg = nextDark ? "#f5f5f7" : "#0a0a0a";
    if (typeof window !== "undefined") localStorage.setItem(storageKey, nextDark ? "dark" : "light");
    onToggle(nextDark);
    const overlay = document.createElement("div");
    overlay.style.cssText = \`position:fixed;inset:0;z-index:2147483647;background:\${oldBg};pointer-events:none;will-change:clip-path;\`;
    document.body.appendChild(overlay);
    const anim = overlay.animate([{ clipPath: \`circle(\${endRadius}px at \${x}px \${y}px)\` }, { clipPath: \`circle(0px at \${x}px \${y}px)\` }], { duration: 650, easing: "cubic-bezier(.2,.7,.2,1)" });
    anim.onfinish = () => overlay.remove();
  }
  return { toggle };
}`,
    prompt: "Write a React hook that toggles dark/light mode with a circular ripple/clip-path animation that expands outward from the click point, revealing the new theme. Persist choice to localStorage. Use the Web Animations API with clip-path circle transition.",
    tags: ["dark-mode", "theme", "ripple", "animation", "clip-path", "hook"],
  },
  {
    name: "ShinyBadge",
    slug: "shiny-badge",
    path: "badges/ShinyBadge.tsx",
    category: "badges",
    code: `type Props = { spark?: string; text: string; };
export function ShinyBadge({ spark = "✦", text }: Props) {
  return (
    <>
      <style>{\`
        @keyframes shiny-sweep { from { background-position: 200% 0; } to { background-position: -200% 0; } }
        .shiny-badge-text { background: linear-gradient(110deg, #4a4a4c 40%, #0a0a0a 50%, #4a4a4c 60%); background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; animation: shiny-sweep 3s linear infinite; }
      \`}</style>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/[0.02] border border-black/[0.13] text-[13px] text-[#0a0a0a]">
        <span className="text-[#b45309]">{spark}</span>
        <span className="shiny-badge-text">{text}</span>
      </div>
    </>
  );
}`,
    prompt: "Create a pill-shaped badge component in React with a left icon/spark character and a shiny shimmer text animation using CSS background-clip and an infinite linear gradient sweep animation.",
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
    prompt: "Create a React button component with an animated border-beam effect using CSS offset-path and offset-distance. A gradient dot should travel continuously around the button border. Support primary and ghost variants, and render as either a button or anchor based on an href prop.",
    tags: ["button", "border-beam", "animated", "gradient", "offset-path"],
  },
  {
    name: "TypingHero",
    slug: "typing-hero",
    path: "sections/TypingHero.tsx",
    category: "sections",
    code: `"use client";
import { useEffect, useRef, useState, ReactNode } from "react";
type Props = { title: string; titleHighlight?: string; subtitle: string; typingDelay?: number; typingSpeed?: number; children?: ReactNode; };
const typingStyle = \`
  @keyframes typing-cursor { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
  .typing-sub::after { content: '|'; display: inline-block; margin-left: 1px; color: #059669; font-weight: 300; animation: typing-cursor .85s step-end infinite; opacity: 0; }
  .typing-sub.is-typing::after { opacity: 1; } .typing-sub.is-done::after { opacity: 1; }
\`;
export function TypingHero({ title, titleHighlight, subtitle, typingDelay = 480, typingSpeed = 28, children }: Props) {
  const subRef = useRef<HTMLParagraphElement>(null);
  const [ctaVisible, setCtaVisible] = useState(false);
  useEffect(() => {
    const el = subRef.current; if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = subtitle; el.classList.add("is-done"); setCtaVisible(true); return; }
    let i = 0;
    const timer = setTimeout(() => {
      el.classList.add("is-typing");
      const tick = setInterval(() => { el.textContent = subtitle.slice(0, ++i); if (i >= subtitle.length) { clearInterval(tick); el.classList.remove("is-typing"); el.classList.add("is-done"); setCtaVisible(true); } }, typingSpeed);
    }, typingDelay);
    return () => clearTimeout(timer);
  }, [subtitle, typingDelay, typingSpeed]);
  return (
    <><style>{typingStyle}</style>
    <section className="max-w-[1200px] mx-auto px-6 pt-[72px] pb-12 text-center flex flex-col items-center">
      <h1 className="font-serif font-medium leading-none mb-[18px] text-[#0a0a0a] tracking-[-0.02em]" style={{ fontSize: "clamp(48px, 9vw, 112px)" }}>
        {title}{" "}{titleHighlight && <span className="font-serif italic font-medium text-[#0a0a0a]">{titleHighlight}</span>}
      </h1>
      <p ref={subRef} className="typing-sub max-w-[640px] text-lg text-[#4a4a4c] mb-7 min-h-[1.6em]" />
      <div className="flex flex-wrap gap-3 justify-center" style={{ opacity: ctaVisible ? 1 : 0, transform: ctaVisible ? "translateY(0)" : "translateY(10px)", transition: "opacity .5s ease, transform .5s ease", pointerEvents: ctaVisible ? "auto" : "none" }}>{children}</div>
    </section></>
  );
}`,
    prompt: "Create a React hero section with a large serif/sans-serif headline, a typewriter animated subtitle that types character by character with a blinking cursor, and a CTA slot that fades in only after typing completes. Respect prefers-reduced-motion.",
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
          <div className="font-mono text-[11px] tracking-[0.2em] text-[#059669] uppercase">
            {card.label}
          </div>
          <div className="text-[17px] text-[#0a0a0a] font-medium">{card.title}</div>
        </div>
      ))}
    </div>
  );
}`,
    prompt: "Create a responsive 3-column card grid in React where each card has a small monospace category label and a larger title. Cards should have a hover effect with accent border and slight lift. Collapse to single column on mobile.",
    tags: ["cards", "grid", "feature", "hover", "responsive", "3-col"],
  },
  {
    name: "NumberedStepsList",
    slug: "numbered-steps-list",
    path: "lists/NumberedStepsList.tsx",
    category: "lists",
    code: `type Step = { number: string; title: string; description: string; };
type Props = { steps: Step[]; };
export function NumberedStepsList({ steps }: Props) {
  return (
    <ol className="mt-12 flex flex-col gap-2 list-none p-0">
      {steps.map((step) => (
        <li key={step.number} className="grid gap-8 py-8 border-t border-black/[0.06]" style={{ gridTemplateColumns: "90px 1fr" }}>
          <div className="font-mono text-sm text-[#059669] tracking-[0.2em]">{step.number}</div>
          <div>
            <h3 className="font-serif font-medium text-[28px] text-[#0a0a0a] mt-0 mb-2.5">{step.title}</h3>
            <p className="text-[#4a4a4c] m-0 text-base">{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}`,
    prompt: "Create a React ordered list component where each step has a left-aligned monospace step number and a right-hand side with a serif title and body text. Items are separated by a top border. Collapse the two-column layout to a single column on mobile.",
    tags: ["steps", "process", "numbered", "serif", "mono", "timeline"],
  },
  {
    name: "FormulaBlock",
    slug: "formula-block",
    path: "display/FormulaBlock.tsx",
    category: "display",
    code: `type Props = { formula: string; caption?: string; };
export function FormulaBlock({ formula, caption }: Props) {
  return (
    <div className="my-8 p-6 text-center bg-[rgba(5,150,105,0.1)] border border-[#059669] rounded-xl font-mono text-[#0a0a0a] overflow-x-auto break-words" style={{ fontSize: "clamp(14px, 4vw, 20px)" }}>
      <code className="font-[inherit] bg-transparent p-0">{formula}</code>
      {caption && <div className="mt-2.5 text-xs text-[#4a4a4c] tracking-[0.1em]">{caption}</div>}
    </div>
  );
}`,
    prompt: "Create a React formula display component that renders a monospace code string centered in an accent-colored bordered box with optional caption text below. Should overflow-scroll horizontally on small screens.",
    tags: ["formula", "code", "equation", "monospace", "accent", "callout"],
  },
  {
    name: "SignalCardGrid",
    slug: "signal-card-grid",
    path: "cards/SignalCardGrid.tsx",
    category: "cards",
    code: `type SignalCard = { letter: string; title: string; subtitle: string; description: string; };
type Props = { cards: SignalCard[]; };
export function SignalCardGrid({ cards }: Props) {
  return (
    <div className="grid gap-3 mt-6" style={{ gridTemplateColumns: \`repeat(\${Math.min(cards.length, 5)}, minmax(0, 1fr))\` }}>
      {cards.map((card) => (
        <div key={card.letter} className="p-[22px] border border-black/[0.06] rounded-xl bg-black/[0.02]">
          <div className="font-serif italic text-[44px] text-[#059669] leading-none">{card.letter}</div>
          <h4 className="mt-2 mb-1 text-base text-[#0a0a0a] font-medium">{card.title}</h4>
          <p className="m-0 mb-1 text-sm text-[#8a8a8e]">{card.subtitle}</p>
          <p className="m-0 text-sm text-[#4a4a4c]">{card.description}</p>
        </div>
      ))}
    </div>
  );
}`,
    prompt: "Create a React 5-column card grid component where each card features a large italic serif display letter in accent color, a card title, a muted subtitle, and a description. Should responsively collapse to 2 columns then 1 column on smaller screens.",
    tags: ["cards", "grid", "letter", "serif", "5-col", "responsive", "acronym"],
  },
  {
    name: "PrincipleCardGrid",
    slug: "principle-card-grid",
    path: "cards/PrincipleCardGrid.tsx",
    category: "cards",
    code: `type Principle = { number: string; title: string; subtitle: string; description: string; };
type Props = { principles: Principle[]; };
export function PrincipleCardGrid({ principles }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
      {principles.map((p) => (
        <article key={p.number} className="p-[22px] border border-black/[0.06] rounded-xl bg-black/[0.02]">
          <div className="font-mono text-[#059669] text-xs tracking-[0.2em]">{p.number}</div>
          <h3 className="font-serif font-medium mt-2.5 mb-1 text-[22px] text-[#0a0a0a]">{p.title}</h3>
          <div className="text-[13px] text-[#059669] mb-2">{p.subtitle}</div>
          <p className="text-[#4a4a4c] text-sm m-0">{p.description}</p>
        </article>
      ))}
    </div>
  );
}`,
    prompt: "Create a React 4-column responsive card grid where each card shows a monospace number label, a serif title, an accent-colored sub-label, and a description paragraph. Collapse to 2 columns on tablet and 1 on mobile.",
    tags: ["cards", "grid", "4-col", "numbered", "serif", "principles", "pillars"],
  },
  {
    name: "DiagnosticGrid",
    slug: "diagnostic-grid",
    path: "cards/DiagnosticGrid.tsx",
    category: "cards",
    code: `type DiagItem = { tag: string; title: string; description: string; };
type Props = { items: DiagItem[]; };
export function DiagnosticGrid({ items }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
      {items.map((item) => (
        <div key={item.tag} className="p-6 border border-black/[0.06] rounded-xl bg-black/[0.02]">
          <span className="inline-block px-2.5 py-1 rounded-full bg-[rgba(234,179,8,0.2)] text-[#b45309] font-mono text-[10px] tracking-[0.15em] mb-3">{item.tag}</span>
          <h3 className="font-serif font-medium text-[#0a0a0a] mt-0 mb-1.5 text-[22px]">{item.title}</h3>
          <p className="text-[#4a4a4c] m-0 text-[15px]">{item.description}</p>
        </div>
      ))}
    </div>
  );
}`,
    prompt: "Create a React 2-column diagnostic card grid. Each card has a small warning-colored monospace pill tag at the top, a serif title, and a muted description. Collapse to single column on mobile. Use an amber/warning color palette for the tags.",
    tags: ["cards", "grid", "diagnostic", "warning", "2-col", "tag", "status"],
  },
  {
    name: "CalloutBox",
    slug: "callout-box",
    path: "callouts/CalloutBox.tsx",
    category: "callouts",
    code: `import { ReactNode } from "react";
type CheckItem = { symbol: string; content: ReactNode; };
type Props = { title: string; intro?: string; label?: string; items?: CheckItem[]; footer?: string; };
export function CalloutBox({ title, intro, label, items = [], footer }: Props) {
  return (
    <div className="mt-8 p-8 border border-[#b45309] rounded-[14px]" style={{ background: "linear-gradient(180deg, rgba(234,179,8,0.2), rgba(0,0,0,0.02))" }}>
      <h3 className="font-serif font-medium text-[#0a0a0a] text-2xl mt-0 mb-2.5">{title}</h3>
      {intro && <p className="text-[#4a4a4c] mt-0 mb-4">{intro}</p>}
      {label && <div className="font-mono text-[11px] tracking-[0.3em] text-[#b45309] mt-5 mb-2 uppercase">{label}</div>}
      {items.length > 0 && (
        <ul className="list-none p-0 m-0 flex flex-col gap-2">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2.5 items-start text-[15px] text-[#1a1a1a]">
              <span className="inline-flex w-[22px] h-[22px] items-center justify-center rounded-full bg-[rgba(234,179,8,0.2)] text-[#b45309] text-xs shrink-0">{item.symbol}</span>
              <span>{item.content}</span>
            </li>
          ))}
        </ul>
      )}
      {footer && <p className="text-[#4a4a4c] mt-4 mb-0 font-medium">{footer}</p>}
    </div>
  );
}`,
    prompt: "Create a React callout/alert box component with an amber warning border gradient background, a serif title, optional intro paragraph, a monospace section label, a symbol checklist, and an optional footer.",
    tags: ["callout", "warning", "alert", "checklist", "amber", "gradient", "diagnosis"],
  },
  {
    name: "Checklist",
    slug: "checklist",
    path: "lists/Checklist.tsx",
    category: "lists",
    code: `import { ReactNode } from "react";
type CheckItem = { symbol: string; text: ReactNode; };
type Props = { items: CheckItem[]; };
export function Checklist({ items }: Props) {
  return (
    <ul className="list-none p-0 my-6 flex flex-col gap-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 items-start px-4 py-[14px] bg-black/[0.02] border border-black/[0.06] rounded-[10px] text-[#1a1a1a] text-[15px]">
          <span className="inline-flex w-[22px] h-[22px] items-center justify-center rounded-full bg-[rgba(5,150,105,0.1)] text-[#059669] text-xs shrink-0">{item.symbol}</span>
          <span>{item.text}</span>
        </li>
      ))}
    </ul>
  );
}`,
    prompt: "Create a React checklist component where each item is a card-like row with a circular accent badge showing a symbol on the left and text content on the right. Support JSX content in the text slot for rich formatting.",
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
type Props = { children: ReactNode; variant?: Variant; delay?: 0|100|200|300|400|500; className?: string; };
const revealStyle = \`
  .sr-up{opacity:0;transform:translateY(32px) scale(.97);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1);will-change:opacity,transform} .sr-up.in{opacity:1;transform:translateY(0) scale(1)}
  .sr-left{opacity:0;transform:translateX(-40px) scale(.97);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1);will-change:opacity,transform} .sr-left.in{opacity:1;transform:translateX(0) scale(1)}
  .sr-right{opacity:0;transform:translateX(40px) scale(.97);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1);will-change:opacity,transform} .sr-right.in{opacity:1;transform:translateX(0) scale(1)}
  .sr-scale{opacity:0;transform:scale(.88);transition:opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1);will-change:opacity,transform} .sr-scale.in{opacity:1;transform:scale(1)}
  .sr-d1{transition-delay:.1s} .sr-d2{transition-delay:.2s} .sr-d3{transition-delay:.3s} .sr-d4{transition-delay:.4s} .sr-d5{transition-delay:.5s}
  @media(prefers-reduced-motion:reduce){.sr-up,.sr-left,.sr-right,.sr-scale{opacity:1;transform:none;transition:none}}
\`;
const vc = { up:"sr-up", left:"sr-left", right:"sr-right", scale:"sr-scale" };
export function ScrollReveal({ children, variant = "up", delay = 0, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (!("IntersectionObserver" in window)) { el.classList.add("in"); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add("in"); io.disconnect(); } }, { threshold: 0.1, rootMargin: "0px 0px -60px 0px" });
    io.observe(el); return () => io.disconnect();
  }, []);
  const cls = [vc[variant], delay ? \`sr-d\${delay/100}\` : "", className].filter(Boolean).join(" ");
  return (<><style>{revealStyle}</style><div ref={ref} className={cls}>{children}</div></>);
}`,
    prompt: "Create a React scroll-reveal wrapper component that uses IntersectionObserver to add an .in class when the element enters the viewport, triggering CSS transitions. Support four animation variants: fade-up, slide-from-left, slide-from-right, and scale-up. Include stagger delay support and respect prefers-reduced-motion.",
    tags: ["scroll", "reveal", "animation", "intersection-observer", "fade", "wrapper", "motion"],
  },
  {
    name: "SiteFooter",
    slug: "site-footer",
    path: "layout/SiteFooter.tsx",
    category: "layout",
    code: `type FooterColumn = { heading: string; links: { label: string; href: string }[]; };
type Props = { brandName?: string; tagline?: string; columns?: FooterColumn[]; copyright?: string; publishedBy?: { label: string; href: string }; };
export function SiteFooter({ brandName = "YASH", tagline = "", columns = [], copyright = \`© \${new Date().getFullYear()} YASH. All rights reserved.\`, publishedBy }: Props) {
  return (
    <footer className="border-t border-black/[0.06] px-6 pt-16 pb-7 mt-10">
      <div className="max-w-[1200px] mx-auto grid gap-8" style={{ gridTemplateColumns: \`2fr \${columns.map(() => "1fr").join(" ")}\` }}>
        <div>
          <div className="flex items-center gap-2.5 font-semibold tracking-[0.08em] text-[#0a0a0a] text-[13px]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669] shadow-[0_0_12px_#059669] shrink-0" />{brandName}
          </div>
          {tagline && <p className="text-sm text-[#8a8a8e] mt-2.5 max-w-[360px]">{tagline}</p>}
        </div>
        {columns.map((col) => (
          <div key={col.heading}>
            <h4 className="font-mono text-[11px] tracking-[0.3em] text-[#059669] mt-0 mb-3.5 uppercase">{col.heading}</h4>
            <ul className="list-none p-0 m-0">{col.links.map((l) => (<li key={l.href} className="mb-2"><a href={l.href} className="text-[#4a4a4c] text-sm hover:text-[#0a0a0a] transition-colors no-underline">{l.label}</a></li>))}</ul>
          </div>
        ))}
      </div>
      <div className="max-w-[1200px] mx-auto flex justify-between flex-wrap gap-3 mt-12 pt-[22px] border-t border-black/[0.06] text-[#8a8a8e] text-xs">
        <span>{copyright}</span>
        {publishedBy && <span>Published by <a href={publishedBy.href} className="text-[#4a4a4c] hover:text-[#0a0a0a] no-underline">{publishedBy.label}</a></span>}
      </div>
    </footer>
  );
}`,
    prompt: "Create a React site footer with a 4-column responsive grid: brand column with dot logo + tagline on the left, then 3 link columns with monospace headings. Include a bottom bar with copyright text and a Published by attribution. Collapse to 2 columns on tablet and 1 on mobile.",
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
    prompt: "Build a React TypeScript component that renders extruded 3D display text by stacking dozens of absolute layers along translateZ, each color-mixed between a face color and a depth color with quadratic easing. Wrap layers in a preserve-3d stage under CSS perspective. Drive rotateX/rotateY with requestAnimationFrame lerp toward pointer-relative tilt when a fine pointer is available, and fall back to a gentle auto-orbit sine/cosine idle motion; freeze transforms under prefers-reduced-motion.",
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
    prompt: "Create a magnetic hover wrapper: on fine-pointer mousemove within the element plus a padding radius, translate the inner child toward the cursor by delta/magnetStrength using rAF, with a snappy 140ms ease while active and a 420ms settle on leave; disable on coarse pointers and prefers-reduced-motion.",
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
    prompt: "Build a pointer-following specular glare wrapper: an absolutely positioned soft-light radial-gradient shine whose center is driven by CSS custom properties updated from pointer coordinates as percentages of the element box, fading opacity on enter/leave and disabled under prefers-reduced-motion.",
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
    prompt: "Build a fixed cinematic underwater background: four crossfading teal-to-violet scene gradients, two screen-blended SVG stroke layers warped by fractalNoise displacement filters and slowly drifting via CSS keyframes, vertical light-shaft polygons that skew/sway, a top surface shimmer also displacement-filtered, seeded rising bubble spans, and a vignette — with opacity stepping down by a scene prop and all motion killed under prefers-reduced-motion.",
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
    prompt: "Create a pill CTA whose border is a continuously spinning conic-gradient ring implemented with CSS @property --btn-ang, a masked ::after using mask-composite exclude, optional soft-light fractalNoise texture overlay, and reduced-motion freeze.",
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
  type HTMLAttributes,
  type PointerEvent,
  type ReactNode,
} from "react";

type PointerGlowCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  glowColor?: string;
  glowSecondary?: string;
  radius?: number;
};

export function PointerGlowCard({
  children,
  className = "",
  glowColor = "rgba(184, 112, 28, 0.75)",
  glowSecondary = "rgba(75, 58, 143, 0.35)",
  radius = 220,
  style,
  ...rest
}: PointerGlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--gx", \`\${((e.clientX - r.left) / r.width) * 100}%\`);
    el.style.setProperty("--gy", \`\${((e.clientY - r.top) / r.height) * 100}%\`);
  }, []);

  return (
    <>
      <style>{\`
        .pgc {
          position: relative;
          isolation: isolate;
          border-radius: 1.25rem;
          background: rgba(255, 255, 255, 0.55);
          border: 1px solid rgba(75, 58, 143, 0.14);
          overflow: hidden;
        }
        .pgc::before {
          content: "";
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          padding: 1px;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.35s ease;
          background: radial-gradient(
            var(--pgc-r, 220px) circle at var(--gx, 50%) var(--gy, 50%),
            var(--pgc-a),
            var(--pgc-b) 34%,
            transparent 62%
          );
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          z-index: 2;
        }
        .pgc:hover::before,
        .pgc:focus-within::before { opacity: 1; }
        .pgc__body { position: relative; z-index: 1; }
        @media (prefers-reduced-motion: reduce) {
          .pgc::before { transition: none; }
        }
      \`}</style>
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
        onPointerMove={onMove}
        {...rest}
      >
        <div className="pgc__body">{children}</div>
      </div>
    </>
  );
}`,
    prompt: "Build a card with a pointer-following glowing border: a masked ::before ring using mask-composite exclude, filled by a radial-gradient centered on CSS vars --gx/--gy updated from pointermove, fading in on hover/focus-within.",
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
    prompt: "Make an animated shiny text span using a multi-stop linear gradient clipped to glyphs via background-clip:text, continuously sweeping background-position; pause the sweep under prefers-reduced-motion.",
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
    prompt: "Create a scroll-triggered reveal that starts blurred, offset downward, and transparent, then transitions to clear via IntersectionObserver once, with optional delay steps and full reduced-motion bypass.",
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
    prompt: "Build a fixed right-edge section progress nav of small dots that morph into a taller pill with a soft colored glow ring when active, visible only on wide screens, with accessible labels.",
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
    prompt: "Implement an infinite horizontal marquee that duplicates its children, animates translate3d to -50%, soft-fades both edges with background-matching gradients, pauses on hover, and collapses to a static row under prefers-reduced-motion.",
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
    prompt: "Build a hero product theatre: three bottles on a lit shelf with a copper scaleX wipe path, GSAP staggered entrance (y/opacity/rotate), then per-item depth parallax via gsap.quickTo on pointermove over the stage; respect fine-pointer and prefers-reduced-motion.",
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
    prompt: "Create a word-by-word text generate effect: split a string into spans that start blurred and transparent, then cascade to sharp opacity via staggered transition-delay after a startDelay timeout; skip animation under prefers-reduced-motion.",
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
    prompt: "Make a 2px full-width decorative divider whose multi-stop horizontal gradient continuously slides by animating background-position on a 200% background-size, with prefers-reduced-motion freeze.",
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
    prompt: "Build a jewelry-style custom cursor for fine-pointer desktops: a 3px gold dot that snaps instantly to the pointer via GSAP quickSetter, plus a 24px ring that lags with quickTo (0.12s power2.out) and scales to 1.9 when hovering links/buttons/[data-cursor-hover]. Hide the native cursor only after mount via a scope class. Skip entirely under prefers-reduced-motion or coarse pointers.",
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
    prompt: "Create a full-screen royal-decree preloader: dark ink vignette, warm gold radial glow, drifting dust specks, and a parchment panel that unfurls from the centre by animating a CSS --reveal variable on clip-path inset while two brass gradient rods travel from centre to the parchment edges in sync (GSAP expo.out). Stagger-fade a lotus SVG, brand wordmark, and filigree divider, then lift/scale/blur the stage away. Honour prefers-reduced-motion with a short fade; optional sessionStorage once-per-tab gate; lock body scroll during play.",
    tags: ["preloader", "clip-path", "gsap", "parchment", "scroll-unfurl"],
  },
  {
    name: "FoilSpecularCard",
    slug: "foil-specular-card",
    path: "cards/FoilSpecularCard.tsx",
    category: "cards",
    code: `"use client";

import { useRef } from "react";

type FoilSpecularCardProps = {
  title?: string;
  subtitle?: string;
  lineA?: string;
  lineB?: string;
  date?: string;
  venue?: string;
  gold?: string;
  goldSoft?: string;
  paper?: string;
  ink?: string;
  accent?: string;
  className?: string;
};

function OrnateCorner({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} style={style} aria-hidden>
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none">
        <path d="M4 4 L4 30 M4 4 L30 4" />
        <path d="M4 30 C26 30 30 26 30 4" opacity="0.5" />
        <path
          d="M14 14 C14 34 34 40 44 30 C36 30 30 24 30 14 C24 22 18 20 14 14 Z"
          fill="currentColor"
          fillOpacity="0.1"
        />
        <circle cx="48" cy="48" r="2.4" fill="currentColor" stroke="none" />
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
        <path d="M100 3 L108 12 L100 21 L92 12 Z" fill="currentColor" fillOpacity="0.12" />
        <path d="M100 6.5 L104.5 12 L100 17.5 L95.5 12 Z" />
      </g>
    </svg>
  );
}

/**
 * Ceremonial invitation card: pointer-tracked specular foil sheen
 * (radial soft-light overlay) + animated foil gradient text (background-clip).
 * No 3D tilt — sheen only.
 */
export function FoilSpecularCard({
  title = "Together with their families",
  subtitle = "weds",
  lineA = "Aarav",
  lineB = "Diya",
  date = "Saturday, the 6th of December",
  venue = "Sri Kalyana Mandapam, Chennai",
  gold = "#b88a1f",
  goldSoft = "#e8d5a3",
  paper = "#f4efe4",
  ink = "#3a2a1a",
  accent = "#8b1a1a",
  className,
}: FoilSpecularCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", \`\${((e.clientX - r.left) / r.width) * 100}%\`);
    el.style.setProperty("--my", \`\${((e.clientY - r.top) / r.height) * 100}%\`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      data-cursor-hover
      className={\`relative mx-auto w-full max-w-[360px] select-none overflow-hidden rounded-[2px] \${className ?? ""}\`}
      style={
        {
          "--mx": "50%",
          "--my": "30%",
          "--rg-gold": gold,
          "--rg-gold-soft": goldSoft,
          background: paper,
          color: ink,
          boxShadow: \`0 40px 80px -24px rgba(0,0,0,0.65), inset 0 0 0 1px color-mix(in oklab, \${gold} 50%, transparent)\`,
        } as React.CSSProperties
      }
    >
      <style>{\`
        .foil-name-shimmer {
          display: inline-block;
          padding: 0.22em 0.3em;
          margin: -0.22em -0.3em;
          --_foil: var(--rg-gold, #b7892f);
          --_foil-deep: color-mix(in oklab, var(--rg-gold, #b7892f) 60%, #2c1c06);
          background-image: linear-gradient(
            100deg,
            var(--_foil-deep) 0%,
            var(--_foil) 32%,
            var(--rg-gold-soft, #e8d5a3) 50%,
            var(--_foil) 68%,
            var(--_foil-deep) 100%
          );
          background-size: 220% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: foil-shimmer 6s ease-in-out infinite;
          filter: drop-shadow(0 1px 1.2px rgba(45, 28, 8, 0.28));
          font-family: "Great Vibes", "Brush Script MT", cursive;
          font-size: 3.75rem;
          line-height: 1.02;
        }
        @keyframes foil-shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .foil-name-shimmer { animation: none; background-position: 40% 50%; }
        }
      \`}</style>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 mix-blend-soft-light"
        style={{
          background:
            "radial-gradient(220px circle at var(--mx) var(--my), rgba(255,247,214,0.85), rgba(201,162,39,0.15) 40%, transparent 70%)",
        }}
      />

      <div className="relative z-0 px-9 pb-11 pt-10 text-center">
        <OrnateCorner className="absolute left-2 top-2 h-9 w-9" style={{ color: gold }} />
        <OrnateCorner className="absolute right-2 top-2 h-9 w-9 -scale-x-100" style={{ color: gold }} />

        <p
          className="text-[0.6rem] uppercase tracking-[0.4em]"
          style={{ color: accent, fontFamily: "Cinzel, Georgia, serif" }}
        >
          {title}
        </p>

        <div className="mt-6 leading-[1.02]">
          <span className="foil-name-shimmer">{lineA}</span>
          <span
            className="my-0.5 block text-xs uppercase tracking-[0.3em]"
            style={{ color: accent, fontFamily: "Cinzel, Georgia, serif" }}
          >
            {subtitle}
          </span>
          <span className="foil-name-shimmer">{lineB}</span>
        </div>

        <FiligreeDivider className="mx-auto mt-5 h-5 w-44" style={{ color: gold }} />

        <p className="mt-4 font-serif text-lg">{date}</p>
        <p className="mt-1 text-xs" style={{ color: "rgba(58,42,26,0.7)" }}>
          {venue}
        </p>
      </div>
    </div>
  );
}`,
    prompt: "Build a parchment invitation card with ornate SVG corners and a filigree divider. Track the pointer to update CSS vars --mx/--my driving a soft-light radial specular foil sheen across the paper (no 3D tilt). Render couple names in script type with an animated gold foil gradient via background-clip:text (220% background-size sweeping over 6s), padded so swashes don't clip. Honour prefers-reduced-motion by freezing the shimmer.",
    tags: ["foil", "specular", "shimmer", "invitation", "background-clip"],
  },
  {
    name: "WaxSealButton",
    slug: "wax-seal-button",
    path: "buttons/WaxSealButton.tsx",
    category: "buttons",
    code: `"use client";

import { useRef } from "react";
import { gsap } from "gsap";

type WaxSealButtonProps = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  className?: string;
  foil?: string;
  ink?: string;
};

/**
 * Press-in CTA with a radiating SVG ring on hover (wax-seal personality).
 * Ghost variant is a hairline link with an animated underline.
 */
export function WaxSealButton({
  label,
  href,
  onClick,
  variant = "primary",
  className,
  foil = "#c9a227",
  ink = "#1a1208",
}: WaxSealButtonProps) {
  const ref = useRef<HTMLElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);

  const onEnter = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.to(ref.current, { scale: 0.96, duration: 0.3, ease: "power2.out" });
    if (ringRef.current && variant === "primary") {
      gsap.fromTo(
        ringRef.current,
        { attr: { r: 18 }, opacity: 0.6 },
        { attr: { r: 58 }, opacity: 0, duration: 0.8, ease: "power2.out" },
      );
    }
  };
  const onLeave = () => {
    gsap.to(ref.current, { scale: 1, duration: 0.4, ease: "power2.out" });
  };

  const shared = {
    ref: ref as React.RefObject<HTMLAnchorElement & HTMLButtonElement>,
    onMouseEnter: onEnter,
    onMouseLeave: onLeave,
    "data-cursor-hover": true,
  };

  if (variant === "ghost") {
    const ghostClass = \`group relative inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] \${className ?? ""}\`;
    const ghostStyle = { color: "#f5f0e8" };
    const underline = (
      <span
        aria-hidden
        className="absolute -bottom-1 left-0 h-px w-full origin-center scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"
        style={{ background: foil }}
      />
    );
    if (href) {
      return (
        <a {...shared} href={href} className={ghostClass} style={ghostStyle}>
          {label}
          {underline}
        </a>
      );
    }
    return (
      <button type="button" {...shared} onClick={onClick} className={ghostClass} style={ghostStyle}>
        {label}
        {underline}
      </button>
    );
  }

  const primaryClass = \`relative inline-flex items-center justify-center rounded-[2px] px-8 py-4 text-sm uppercase tracking-[0.18em] \${className ?? ""}\`;
  const primaryStyle = {
    background: foil,
    color: ink,
    boxShadow: \`0 4px 24px color-mix(in oklab, \${foil} 22%, transparent)\`,
  };
  const body = (
    <>
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 120 120"
        preserveAspectRatio="none"
        aria-hidden
      >
        <circle ref={ringRef} cx="60" cy="60" r="18" fill="none" stroke={foil} strokeWidth="1" opacity="0" />
      </svg>
      <span style={{ textShadow: "0 1px 0 rgba(255,255,255,0.3)" }}>{label}</span>
    </>
  );

  if (href) {
    return (
      <a {...shared} href={href} className={primaryClass} style={primaryStyle}>
        {body}
      </a>
    );
  }
  return (
    <button type="button" {...shared} onClick={onClick} className={primaryClass} style={primaryStyle}>
      {body}
    </button>
  );
}`,
    prompt: "Design a wax-seal CTA (not a rounded pill): sharp 2px corners, gold fill, light text shadow. On hover, GSAP scales the control to 0.96 and radiates an SVG circle from r=18 to r=58 while opacity falls to 0. Include a ghost variant with an underline that scales from centre. Honour prefers-reduced-motion by skipping the press/ring.",
    tags: ["wax-seal", "gsap", "radiating-ring", "cta", "hover"],
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
    prompt: "Implement an ambient canvas petal field: ~16 procedurally drawn marigold (8 ellipses + centre) and jasmine (5 ellipses) shapes falling with sway, rotation, and low alpha. Track mouse X as a soft lateral gust. Cap DPR at 2, resize with the element, skip entirely under prefers-reduced-motion. No image assets.",
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
    prompt: "Add a fixed full-viewport film-grain overlay: render random grayscale noise into a ~220x220 canvas at ~20fps (every 3rd rAF), stretch with CSS, blend with mix-blend-overlay at ~5% opacity. Skip under prefers-reduced-motion. Keep pointer-events none and a high z-index.",
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
    prompt: "Build a scratch-to-reveal foil: children sit under a canvas painted with a gold linear gradient, speck noise, and a centred label. Pointer strokes erase via destination-out. Track progress with a 22x28 Uint8 coverage grid marked geometrically (never getImageData). Auto-fade the canvas past ~55% cleared. Use coalesced pointer events, lower DPR on coarse pointers, ResizeObserver to refit, and instant reveal under prefers-reduced-motion.",
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
    prompt: "Create a pixel-demorph image reveal: on IntersectionObserver entry, animate from ~6-block nearest-neighbour upscaling to full resolution over ~1.1s with cubic ease-out. Downsample into an offscreen canvas then drawImage upscale with imageSmoothingEnabled=false (never getImageData). Keep a real img underneath for accessibility. Skip animation under prefers-reduced-motion.",
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
    prompt: "Ship a GSAP ScrollTrigger parallax wrapper: scrub y by speed*100px and optional rotation across top-bottom to bottom-top, gated with gsap.matchMedia for prefers-reduced-motion. Pair it with a deterministic CSS falling-petal field of SVG silhouettes (no Math.random), driven by custom properties for drift/spin/opacity and infinite linear keyframes that travel 112vh. Collapse petals under reduced motion.",
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
            className="till-item mt-4 text-center text-[10px] tracking-wide text-[oklch(0.6_0.015_330)]"
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
            className="rounded-md bg-[oklch(0.28_0.04_330)] px-6 py-3 text-sm font-medium text-[oklch(0.98_0.01_85)]"
          >
            {continueLabel}
          </button>
        </div>
      )}
    </div>
  );
}`,
    prompt: "Build a till-receipt UI that prints from a dark slot via clip-path inset animating from 100% bottom crop to -8% over 1.4s. Add zigzag perforated edges (polygon clip-paths), dashed separators, staggered line-item fades (delay via --i), and a PAID stamp that scales from 2.2 to 1 with a slight overshoot while masked by an inline feTurbulence noise SVG. Drive the print with a single React state flip on mount. Honour prefers-reduced-motion by showing the final state immediately.",
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
    prompt: "Build a React + Three.js fullscreen shader backdrop named MagicRings: an orthographic full-bleed quad with a custom GLSL fragment shader that draws expanding concentric rings with dual-color mix, soft exponential glow attenuation, angular thickness falloff, procedural noise, and a cyclic fade-in/fade-out. Smooth the mouse with lerp for optional center parallax and hover scale, and decay a click burst uniform. Respect prefers-reduced-motion by skipping the renderer. Mount the canvas absolutely inset-0 with pointer-events none unless interactive.",
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
    prompt: "Create a polymorphic React button wrapper called StarBorder: overflow-hidden rounded shell with two absolute 300%-wide radial-gradient ellipses that alternate-slide along the top and bottom edges (CSS keyframes translating +-100% with opacity fade). Inner chip sits above with tone variants (outline/primary/gold), hover translateY(-3px) + deeper shadow, active scale 0.97, and reduced-motion disables both lift and beam animation.",
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
    prompt: "Build ShinyText: a React span that clips a multi-stop linear gradient to text glyphs (background-clip: text) and animates backgroundPosition via Motion's useAnimationFrame + useMotionValue/useTransform, supporting yoyo loops, delay gaps, direction, and pauseOnHover. Disable animation when prefers-reduced-motion matches.",
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
          color: hsl(38 45% 42% / 0.85);
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
    prompt: "Create CircularText: distribute each character around a circle using CSS transforms (rotate N deg, translateY(-radius), counter-rotate), spin the ring infinitely with Motion useAnimation linear tweens, and on hover switch duration (speedUp/slowDown), spring-pause, or goBonkers (very fast + slight scale). Measure radius with ResizeObserver from host size. Respect useReducedMotion.",
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
    prompt: "Design PinchedButton: uppercase editorial CTA with thick brick border and asymmetric radii (0 40px 0 40px), solid/ghost tones via CSS variables, hover translateY(-3px) + arrow nudge, press scale 0.97. Include optional portal pair CSS using :has() so hovering the ghost button fills it dark while the solid sibling flips to outline. Honor prefers-reduced-motion.",
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
          const opacity = isActive ? 1 : isDone ? 0.9 : Math.max(0.68 - distance * 0.06, 0.56);

          return (
            <div key={index} className="flex h-10 items-center gap-2.5 text-left" style={{ opacity }}>
              <div className="shrink-0">
                {isDone ? <CheckFilled className="text-amber-700/80" /> : null}
                {isActive ? <CheckFilled className="text-amber-700" /> : null}
                {isPending ? <PendingIcon className="text-neutral-500/50" /> : null}
              </div>
              {isActive && shinyActive ? (
                <ShinyText text={loadingState.text} className="text-base font-medium sm:text-lg" speed={2.2} spread={110} {...SHINY_ITEM} />
              ) : (
                <span
                  className={cn(
                    "text-base sm:text-lg",
                    isActive && "font-medium text-neutral-900",
                    isDone && "text-neutral-800/80",
                    isPending && "text-neutral-600/60",
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
    prompt: "Compose MultiStepLoader: a fixed fullscreen overlay with soft MagicRings WebGL backdrop, frosted title card, and a scrolling checklist viewport. Advance steps on an interval; animate the list with Motion translateY; render the active row with ShinyText gradient shine and check icons for completed rows. Support loop/onComplete and AnimatePresence fade in/out.",
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
    prompt: "Build MetallicLogoShimmer: wrap a consumer-supplied logo image with a blurred white radial plate, a slowly pulsing champagne bloom, and two layers masked to the logo silhouette - a static soft-light catch-light and a 24s ease-in-out metallic gradient sweep that translates across the mark. Disable animations under prefers-reduced-motion.",
    tags: ["logo", "mask-image", "metallic-shimmer", "ambient-glow", "brand"],
  },
  {
    name: "Highlighter",
    slug: "highlighter",
    path: "animation/Highlighter.tsx",
    category: "animation",
    code: `"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useInView } from "motion/react";
import { annotate } from "rough-notation";
import type { RoughAnnotation } from "rough-notation/lib/model";

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
};

/** Hand-drawn rough-notation mark that draws on mount (or on scroll into view). */
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
}: HighlighterProps) {
  const elementRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(elementRef, { once: true, margin: "-10%" });
  const shouldShow = !isView || isInView;

  useLayoutEffect(() => {
    const element = elementRef.current;
    let annotation: RoughAnnotation | null = null;
    let resizeObserver: ResizeObserver | null = null;

    if (shouldShow && element) {
      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const currentAnnotation = annotate(element, {
        type: action,
        color,
        strokeWidth,
        animationDuration: reduced ? 0 : animationDuration,
        iterations: reduced ? 1 : iterations,
        padding,
        multiline,
      });
      annotation = currentAnnotation;
      currentAnnotation.show();

      resizeObserver = new ResizeObserver(() => {
        currentAnnotation.hide();
        currentAnnotation.show();
      });
      resizeObserver.observe(element);
      resizeObserver.observe(document.body);
    }

    return () => {
      annotation?.remove();
      resizeObserver?.disconnect();
    };
  }, [shouldShow, action, color, strokeWidth, animationDuration, iterations, padding, multiline]);

  return (
    <span ref={elementRef} className="relative inline bg-transparent">
      {children}
    </span>
  );
}`,
    prompt: "Create Highlighter: a React span that wraps children and uses rough-notation's annotate().show() to draw a hand-sketched highlight/underline/box/circle when mounted, optionally deferred until useInView. Re-show on ResizeObserver. Under prefers-reduced-motion, set animationDuration to 0.",
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
    prompt: "Implement TextType: a polymorphic typewriter that types/deletes through a string array with timeouts, optional variable per-character speed, IntersectionObserver startOnVisible, and a GSAP-powered blinking cursor. Under prefers-reduced-motion, dump the first sentence instantly with no cursor animation.",
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
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#912c22] px-5 py-2.5 text-sm font-semibold text-[#f7f3ee] disabled:opacity-50 sm:mt-8 sm:w-auto"
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
    prompt: "Build CelebrationOverlay: a fullscreen dialog with backdrop blur, an imperative canvas-confetti helper that fires a center burst plus delayed left/right angled bursts on a replay interval, and a GSAP card entrance (fade/y/scale) with check-icon pop. Fade the root out on CTA. Honor prefers-reduced-motion by skipping particles and entrance tweens. Keep ConfettiCanvas + overlay in one file.",
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
    prompt: "Create DamaskTileBackdrop: a fixed inset-0 layer with a repeating ornamental tile (consumer tileSrc or multi-layer CSS radial lattice), opacity knob, and a translucent cream veil. Ship a sibling TiledGlassSurface card that reuses the tile under frosted glass (backdrop-filter blur + inset highlight) for form panes.",
    tags: ["pattern", "damask", "atmosphere", "glassmorphism", "backdrop"],
  },
];

export function getComponent(slug: string): ComponentEntry | undefined {
  return registry.find((c) => c.slug === slug);
}

export function getAllComponents(): ComponentEntry[] {
  return registry;
}
