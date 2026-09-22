"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

/**
 * One cell of a creature. Also the alphabet of its text map:
 * . empty, O outline, B body, L highlight, E eye, M mouth.
 */
export type PixelCell = "." | "O" | "B" | "L" | "E" | "M";

export type PixelCreature = {
  /** 8 rows of 8 cells, row 0 at the top. */
  cells: PixelCell[][];
  hasMouth: boolean;
};

export type PixelAvatarPalette = {
  background: string;
  outline: string;
  body: string;
  highlight: string;
  eye: string;
};

/**
 * Six 3-tone ramps, each with a pale frame and a near-black face. Outline on
 * frame clears 3:1 and the face clears 3:1 on the body in every one, so the
 * silhouette and the eyes hold at 24px. None of them puts white on colour.
 * "dmg" is the four-green Game Boy screen.
 */
export const PIXEL_AVATAR_PALETTES = {
  marigold: { background: "#FDF1DD", outline: "#B45309", body: "#F4A522", highlight: "#FBBF24", eye: "#0F172A" },
  jade: { background: "#E3F5EC", outline: "#047857", body: "#34D399", highlight: "#6EE7B7", eye: "#0F172A" },
  lilac: { background: "#F1EAFE", outline: "#6D28D9", body: "#A78BFA", highlight: "#C4B5FD", eye: "#0F172A" },
  rose: { background: "#FDE8EC", outline: "#BE123C", body: "#FB7185", highlight: "#FDA4AF", eye: "#0F172A" },
  sky: { background: "#E3F1FD", outline: "#1D4ED8", body: "#60A5FA", highlight: "#93C5FD", eye: "#0F172A" },
  dmg: { background: "#E2F0C4", outline: "#306230", body: "#8BAC0F", highlight: "#9BBC0F", eye: "#0F380F" },
} as const satisfies Record<string, PixelAvatarPalette>;

export type PixelAvatarPaletteName = keyof typeof PIXEL_AVATAR_PALETTES;

const GRID = 8;
const EYES: ReadonlyArray<readonly [number, number]> = [[3, 2], [3, 5]];
const MOUTH: ReadonlyArray<readonly [number, number]> = [[5, 3], [5, 4]];
const BLINK_MS = 140;

/** xmur3: folds a string into a 32-bit seed. */
function hashSeed(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

/** mulberry32: small, fast, and the same sequence on server and client. */
function mulberry32(a: number) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A cell may fill only if its centre sits within 4 cells of the grid centre,
// which empties the corners and keeps the creature inside a round frame.
const inCircle = (r: number, c: number) => Math.hypot(c + 0.5 - 4, r + 0.5 - 4) <= 4;
const inCore = (r: number, c: number) => r >= 2 && r <= 5 && c >= 1 && c <= 6;
const NEIGHBOURS: ReadonlyArray<readonly [number, number]> = [[-1, 0], [1, 0], [0, -1], [0, 1]];

/** The same seed always builds the same creature. */
export function buildCreature(seed: string): PixelCreature {
  const rand = mulberry32(hashSeed(seed));
  const filled = Array.from({ length: GRID }, () => Array<boolean>(GRID).fill(false));

  // Decide the left half and mirror it, so the creature is symmetric.
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID / 2; c++) {
      if (!inCircle(r, c)) continue;
      const on = inCore(r, c) || rand() < 0.5;
      filled[r][c] = on;
      filled[r][GRID - 1 - c] = on;
    }
  }

  // Keep only cells joined to the core through an edge: no floating dust.
  const joined = Array.from({ length: GRID }, () => Array<boolean>(GRID).fill(false));
  const queue: Array<[number, number]> = [];
  for (let r = 2; r <= 5; r++) {
    for (let c = 1; c <= 6; c++) {
      joined[r][c] = true;
      queue.push([r, c]);
    }
  }
  while (queue.length) {
    const [r, c] = queue.pop()!;
    for (const [dr, dc] of NEIGHBOURS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= GRID || nc < 0 || nc >= GRID) continue;
      if (filled[nr][nc] && !joined[nr][nc]) {
        joined[nr][nc] = true;
        queue.push([nr, nc]);
      }
    }
  }

  const hasMouth = rand() < 0.5;

  const cells = joined.map((row, r) =>
    row.map((on, c): PixelCell => {
      if (!on) return ".";
      const edge = NEIGHBOURS.some(([dr, dc]) => {
        const nr = r + dr;
        const nc = c + dc;
        return nr < 0 || nr >= GRID || nc < 0 || nc >= GRID || !joined[nr][nc];
      });
      return edge ? "O" : "B";
    }),
  );

  for (const [r, c] of EYES) cells[r][c] = "E";
  if (hasMouth) for (const [r, c] of MOUTH) cells[r][c] = "M";

  // Light from the top left: the first body cell in the left half, reading down.
  highlight: for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID / 2; c++) {
      if (cells[r][c] === "B") {
        cells[r][c] = "L";
        break highlight;
      }
    }
  }

  return { cells, hasMouth };
}

/** The creature as eight lines of `.OBLEM`, for tests, logs and docs. */
export function creatureMap(creature: PixelCreature) {
  return creature.cells.map((row) => row.join("")).join("\n");
}

type Pose = "rest" | "blink" | "hop" | "bob" | "look-left" | "look-right";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

export type PixelAvatarProps = {
  /** Any string: an email, a name, a user id. Same seed, same creature. */
  seed: string;
  /**
   * Rendered size in px, rounded down to a multiple of 8 so every cell lands
   * on whole pixels. 24, 32, 48, 96 and 128 all stay crisp.
   */
  size?: number;
  /** A named ramp, "seed" to pick one from the seed, or your own five colours. */
  palette?: PixelAvatarPaletteName | "seed" | PixelAvatarPalette;
  /** The pale shape behind the sprite. */
  frame?: "circle" | "square" | "none";
  /** On pointer enter: "hop" blinks and jumps one cell, "blink" only blinks. */
  hover?: "hop" | "blink" | "none";
  /** A loop while nobody is pointing at it. Off under reduced motion. */
  idle?: "none" | "blink" | "bob" | "glance";
  /** Change this number to play the hover animation from outside, e.g. from a parent row's hover. */
  playKey?: number;
  /** Accessible name. Leave it out when a visible name sits next to the avatar. */
  label?: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * A seeded 8×8 pixel creature. Mirrored, round, drawn as one 1×1 rect per cell
 * with crisp edges, and animated in whole frames: nothing is tweened, so the
 * sprite only ever sits on the pixel grid.
 */
export function PixelAvatar({
  seed,
  size = 48,
  palette = "marigold",
  frame = "circle",
  hover = "hop",
  idle = "none",
  playKey,
  label,
  className,
  style,
}: PixelAvatarProps) {
  const creature = useMemo(() => buildCreature(seed), [seed]);
  const colours = useMemo<PixelAvatarPalette>(() => {
    if (typeof palette === "object") return palette;
    if (palette === "seed") {
      const names = Object.keys(PIXEL_AVATAR_PALETTES) as PixelAvatarPaletteName[];
      return PIXEL_AVATAR_PALETTES[names[hashSeed(`${seed}:palette`) % names.length]];
    }
    return PIXEL_AVATAR_PALETTES[palette];
  }, [palette, seed]);

  const px = Math.max(GRID, Math.floor(size / GRID) * GRID);
  const reduced = useReducedMotion();
  const [pose, setPose] = useState<Pose>("rest");
  const pointerInside = useRef(false);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };
  const later = (ms: number, next: Pose) => {
    timers.current.push(window.setTimeout(() => setPose(next), ms));
  };

  const play = () => {
    if (hover === "none") return;
    clearTimers();
    // Reduced motion keeps the blink and drops the jump.
    setPose(hover === "hop" && !reduced ? "hop" : "blink");
    later(BLINK_MS, "rest");
  };

  useEffect(() => clearTimers, []);

  const firstKey = useRef(playKey);
  useEffect(() => {
    if (playKey === undefined || playKey === firstKey.current) return;
    play();
    // play reads the latest props; only a new key should trigger it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playKey]);

  useEffect(() => {
    if (idle === "none" || reduced) return;
    const offset = hashSeed(`${seed}:idle`) % 900;
    const period = idle === "bob" ? 1200 : idle === "glance" ? 4200 + offset : 2800 + offset;
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible" || pointerInside.current) return;
      clearTimers();
      if (idle === "blink") {
        setPose("blink");
        later(BLINK_MS, "rest");
      } else if (idle === "bob") {
        setPose("bob");
        later(400, "rest");
      } else {
        setPose("look-left");
        later(520, "look-right");
        later(1040, "rest");
      }
    }, period);
    return () => {
      window.clearInterval(id);
      clearTimers();
      setPose("rest");
    };
  }, [idle, reduced, seed]);

  const lifted = pose === "hop" || pose === "bob";
  const eyesShut = pose === "blink" || pose === "hop";
  const look = pose === "look-left" ? -1 : pose === "look-right" ? 1 : 0;

  const tone = (cell: PixelCell) =>
    cell === "O" ? colours.outline
      : cell === "B" ? colours.body
        : cell === "L" ? colours.highlight
          : colours.eye;

  const rects: JSX.Element[] = [];
  creature.cells.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (cell === ".") return;
      // A glancing eye leaves body behind it and lands on the next cell over.
      let fill = tone(cell);
      if (cell === "E" && (eyesShut || look !== 0)) fill = eyesShut ? colours.outline : colours.body;
      rects.push(<rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill={fill} />);
    }),
  );
  if (look !== 0) {
    for (const [r, c] of EYES) {
      rects.push(<rect key={`look-${c}`} x={c + look} y={r} width={1} height={1} fill={colours.eye} />);
    }
  }

  const radius = frame === "circle" ? "50%" : frame === "square" ? `${px / 4}px` : undefined;

  return (
    <span
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      onPointerEnter={() => {
        pointerInside.current = true;
        play();
      }}
      onPointerLeave={() => {
        pointerInside.current = false;
      }}
      style={{
        position: "relative",
        display: "inline-block",
        flexShrink: 0,
        width: px,
        height: px,
        verticalAlign: "middle",
        ...style,
      }}
    >
      {frame !== "none" ? (
        <span
          aria-hidden
          style={{ position: "absolute", inset: 0, borderRadius: radius, background: colours.background }}
        />
      ) : null}
      {/* overflow is visible so the one-cell hop clears the frame instead of being cut by it */}
      <svg
        width={px}
        height={px}
        viewBox="0 0 8 8"
        shapeRendering="crispEdges"
        aria-hidden
        style={{ position: "relative", display: "block", overflow: "visible" }}
      >
        <g transform={lifted ? "translate(0 -1)" : undefined}>{rects}</g>
      </svg>
    </span>
  );
}
