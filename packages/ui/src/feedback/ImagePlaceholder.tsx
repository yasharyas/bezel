type Props = {
  aspectRatio?: string;
  label?: string;
  rounded?: string;
  className?: string;
};

export function ImagePlaceholder({ aspectRatio = "4/3", label = "", rounded = "rounded-xl", className = "" }: Props) {
  return (
    <div
      className={`relative overflow-hidden bg-neutral-100 ${rounded} ${className}`}
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
