import React from 'react';

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
            'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200',
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
}
