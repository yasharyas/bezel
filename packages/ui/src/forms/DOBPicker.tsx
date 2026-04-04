import React, { useState, useEffect } from 'react';

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
  return `${d}/${m}/${y}`;
}

function toISO(display: string): string {
  const digits = display.replace(/\D/g, '');
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
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

export function DOBPicker({ name, label, value, onChange, error, mandatory }: DOBPickerProps) {
  const [displayValue, setDisplayValue] = useState(() => toDisplay(value));

  useEffect(() => {
    setDisplayValue(toDisplay(value));
  }, [value]);

  const handleChange = (raw: string) => {
    const incoming = raw.replace(/\D/g, '').slice(0, 8);
    const prev = displayValue.replace(/\D/g, '');

    if (incoming.length <= prev.length) {
      let formatted = incoming;
      if (incoming.length > 4) formatted = `${incoming.slice(0, 2)}/${incoming.slice(2, 4)}/${incoming.slice(4)}`;
      else if (incoming.length > 2) formatted = `${incoming.slice(0, 2)}/${incoming.slice(2)}`;
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
    if (sanitized.length > 4) formatted = `${sanitized.slice(0, 2)}/${sanitized.slice(2, 4)}/${sanitized.slice(4)}`;
    else if (sanitized.length > 2) formatted = `${sanitized.slice(0, 2)}/${sanitized.slice(2)}`;
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
          'focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-200',
          error ? 'border-red-500' : 'border-neutral-300',
        ].join(' ')}
      />
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}
