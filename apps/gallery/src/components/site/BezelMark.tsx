/** The Bezel mark: a frame around a frame. */
export function BezelMark({ size = 22 }: { size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="1.5" y="1.5" width="21" height="21" rx="6.5" stroke="var(--bz-paper-raised)" strokeWidth="1.5" />
      <rect x="6.5" y="6.5" width="11" height="11" rx="3" fill="var(--bz-accent)" />
      <rect x="6.5" y="6.5" width="11" height="11" rx="3" stroke="var(--bz-paper-raised)" strokeOpacity="0.35" />
    </svg>
  );
}
