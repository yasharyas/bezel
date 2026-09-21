/**
 * The still frame for the MagicRings preview: the same two ring colours drawn
 * in CSS.
 *
 * MagicRings draws nothing under prefers-reduced-motion and nothing without
 * WebGL2, so the preview stage would be empty in both cases. This holds the
 * composition there instead.
 */

/** Seven soft rings on the same radii and the same brick-to-gold ramp the
    shader walks, so the still reads as one frame of it rather than a
    different picture. */
export const RINGS_STILL: React.CSSProperties = {
  backgroundImage: [
    `radial-gradient(circle at 50% 50%,
      rgba(158, 70, 40, 0) 7%, rgba(158, 70, 40, 0.5) 11%, rgba(158, 70, 40, 0) 15%,
      rgba(170, 96, 46, 0.46) 20%, rgba(170, 96, 46, 0) 24%,
      rgba(181, 120, 52, 0.42) 28%, rgba(181, 120, 52, 0) 32.5%,
      rgba(190, 138, 58, 0.38) 37%, rgba(190, 138, 58, 0) 41%,
      rgba(197, 150, 66, 0.32) 45.5%, rgba(197, 150, 66, 0) 50%,
      rgba(201, 160, 74, 0.26) 54%, rgba(201, 160, 74, 0) 59%)`,
    `radial-gradient(circle at 50% 50%, rgba(145, 44, 34, 0.32) 0%, rgba(145, 44, 34, 0) 44%)`,
  ].join(", "),
};

/** Fades the ring layer out before it reaches the edge of its own box, so the
    canvas never shows as a rectangle against the ground. */
export const RINGS_MASK =
  "radial-gradient(circle at 50% 50%, #000 50%, rgba(0, 0, 0, 0.6) 64%, transparent 78%)";
