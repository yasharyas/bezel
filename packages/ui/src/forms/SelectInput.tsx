import React from 'react';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';

// Real @keyframes (not a transition) so Radix's Presence waits for
// `animationend` before unmounting the content, instead of popping instantly.
const selectPopStyle = `
  @keyframes yui-select-pop-in { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
  @keyframes yui-select-pop-out { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.96); } }
`;

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
}
