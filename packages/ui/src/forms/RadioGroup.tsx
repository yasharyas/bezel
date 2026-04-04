import React from 'react';

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
              'transition-all duration-200 min-h-[48px] select-none',
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
}
