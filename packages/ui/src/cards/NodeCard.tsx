import type { ReactNode, CSSProperties } from 'react';

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
        'border-2 transition-all duration-150 cursor-pointer',
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
          style={{ backgroundColor: `${accentColor}18` }}
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
}
