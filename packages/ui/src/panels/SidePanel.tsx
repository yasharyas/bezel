import type { ReactNode } from 'react';
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
}
