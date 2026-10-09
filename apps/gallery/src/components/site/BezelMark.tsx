/*
 * The Bezel mark: a squircle frame around a red squircle screen with a B on it.
 * G2 squircles (continuous curvature, 60% corner smoothing, the iOS app icon corner), precomputed so
 * nothing runs at render. Outer: 21px square at 1.5, radius 6.5. Inner: 14px square at 5, radius 3.8.
 * The B is drawn as one stroked path, so it looks the same on every device, with or without fonts.
 * The same three paths are used by app/icon.svg and the share cards in lib/og.tsx.
 */
export const MARK_OUTER =
  "M12.1 1.5c3.64 0 5.461 0 6.851 0.708a6.5 6.5 0 0 1 2.841 2.841c0.708 1.39 0.708 3.211 0.708 6.851L22.5 12.1c0 3.64 0 5.461 -0.708 6.851a6.5 6.5 0 0 1 -2.841 2.841c-1.39 0.708 -3.211 0.708 -6.851 0.708L11.9 22.5c-3.64 0 -5.461 0 -6.851 -0.708a6.5 6.5 0 0 1 -2.841 -2.841c-0.708 -1.39 -0.708 -3.211 -0.708 -6.851L1.5 11.9c0 -3.64 0 -5.461 0.708 -6.851a6.5 6.5 0 0 1 2.841 -2.841c1.39 -0.708 3.211 -0.708 6.851 -0.708Z";
export const MARK_INNER =
  "M12.92 5c2.128 0 3.192 0 4.005 0.414a3.8 3.8 0 0 1 1.661 1.661c0.414 0.813 0.414 1.877 0.414 4.005L19 12.92c0 2.128 0 3.192 -0.414 4.005a3.8 3.8 0 0 1 -1.661 1.661c-0.813 0.414 -1.877 0.414 -4.005 0.414L11.08 19c-2.128 0 -3.192 0 -4.005 -0.414a3.8 3.8 0 0 1 -1.661 -1.661c-0.414 -0.813 -0.414 -1.877 -0.414 -4.005L5 11.08c0 -2.128 0 -3.192 0.414 -4.005a3.8 3.8 0 0 1 1.661 -1.661c0.813 -0.414 1.877 -0.414 4.005 -0.414Z";
export const MARK_B = "M9.45 11.85V8.4h2.75a1.725 1.725 0 0 1 0 3.45H9.45h3.25a1.875 1.875 0 0 1 0 3.75H9.45z";

export function BezelMark({ size = 26 }: { size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d={MARK_OUTER} stroke="var(--bz-paper-raised)" strokeWidth="1.5" />
      <path d={MARK_INNER} fill="var(--bz-accent)" />
      <path d={MARK_B} stroke="var(--bz-paper-raised)" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
