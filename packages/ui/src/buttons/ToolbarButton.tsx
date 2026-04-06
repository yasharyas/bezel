import type { ReactNode } from 'react';

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
}
