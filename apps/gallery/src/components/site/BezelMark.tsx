/*
 * G2 squircles (continuous curvature, 60% corner smoothing, the iOS app icon corner), precomputed so
 * nothing runs at render. Outer: 21px square at 1.5, radius 6.5. Inner: 11px square at 6.5, radius 3.
 */
const OUTER =
  "M12.1 1.5c3.64 0 5.461 0 6.851 0.708a6.5 6.5 0 0 1 2.841 2.841c0.708 1.39 0.708 3.211 0.708 6.851L22.5 12.1c0 3.64 0 5.461 -0.708 6.851a6.5 6.5 0 0 1 -2.841 2.841c-1.39 0.708 -3.211 0.708 -6.851 0.708L11.9 22.5c-3.64 0 -5.461 0 -6.851 -0.708a6.5 6.5 0 0 1 -2.841 -2.841c-0.708 -1.39 -0.708 -3.211 -0.708 -6.851L1.5 11.9c0 -3.64 0 -5.461 0.708 -6.851a6.5 6.5 0 0 1 2.841 -2.841c1.39 -0.708 3.211 -0.708 6.851 -0.708Z";
const INNER =
  "M12.7 6.5c1.68 0 2.52 0 3.162 0.327a3 3 0 0 1 1.311 1.311c0.327 0.642 0.327 1.482 0.327 3.162L17.5 12.7c0 1.68 0 2.52 -0.327 3.162a3 3 0 0 1 -1.311 1.311c-0.642 0.327 -1.482 0.327 -3.162 0.327L11.3 17.5c-1.68 0 -2.52 0 -3.162 -0.327a3 3 0 0 1 -1.311 -1.311c-0.327 -0.642 -0.327 -1.482 -0.327 -3.162L6.5 11.3c0 -1.68 0 -2.52 0.327 -3.162a3 3 0 0 1 1.311 -1.311c0.642 -0.327 1.482 -0.327 3.162 -0.327Z";

/** The Bezel mark: a frame around a frame. */
export function BezelMark({ size = 22 }: { size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d={OUTER} stroke="var(--bz-paper-raised)" strokeWidth="1.5" />
      <path d={INNER} fill="var(--bz-accent)" />
      <path d={INNER} stroke="var(--bz-paper-raised)" strokeOpacity="0.35" />
    </svg>
  );
}
