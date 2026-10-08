// @ts-nocheck: the effect engine below is a large canvas program kept close to its reference build; the React API at the end of the file is typed by hand.
"use client";

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type AnchorHTMLAttributes,
  type FocusEvent as ReactFocusEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";

/*
 * ThorLink: a link that opens with a thunder strike.
 *
 * Click a ThorLink and a pixel-art arm resolves out of thin air beside it
 * (no portal, no frame), opens its palm and summons the hammer. The hammer
 * flies in, lightning charges it, the arm swings and slams it onto the link,
 * the link burns glyph by glyph, and the page burns away from the impact
 * point. About five seconds from click to done.
 *
 * The page is never dimmed, tinted or moved apart from two short kicks on an
 * optional [data-thor-shake] wrapper. The impact flash is a local radial bloom
 * around the strike point. A strike has at most three white flashes, each gone
 * within 120ms, never more than two in any 1050ms window (photosensitivity).
 * Reduced motion (followed live, or forced with `reducedMotion`) replaces the
 * whole strike with a 300ms crossfade.
 *
 * Navigation stays yours. In an app with a router, pass `onNavigate`: the
 * strike plays over the current page, `onNavigate(href)` runs at the commit
 * beat (about 4.1s in), and the last embers burn away over the new route.
 * Without `onNavigate` the link navigates the browser itself at that beat.
 * Middle clicks, modifier clicks, `target="_blank"` and `download` links pass
 * straight through. Enter works like a click. A second click during a strike
 * fast-forwards it; Escape does the same. The anchor carries
 * `data-thor-link`, so a global link guard can let it through.
 *
 * Sound is synthesized with Web Audio (no files) and only starts after a user
 * gesture. Wrap the app in ThorLinkProvider to share one audio context and
 * set `sound`, `scale` and `reveal` once. The two overlay canvases are created
 * lazily on the first strike and removed when it ends; unmounting the link or
 * the provider cancels a strike that has not committed yet.
 */

function buildEngine(window: Window): any {
  const ENGINE: any = {};
/*
 * hammer-sprite.js (v3)
 * Pixel-art Mjolnir (Norse, short-handled) for the Thor link opener prototype.
 *
 * engine.Hammer.create(scale) -> {
 *   frames: { idle, raised, windup, swing, smear, impact, glowIdle, glowImpact },  // HTMLCanvasElement, all N*scale square
 *   width, height,                // CSS-scaled frame size (N * scale)
 *   grip: {x, y},                 // hand position (idle frame). Also the rotation pivot: identical in EVERY frame.
 *   strikeFace: {x, y},           // centre of the striking face in the impact frame (outer edge of the outline)
 *   anchors: { <frame>: { grip, strikeFace, backFace, headCenter, headTop } },
 *   spin: [16 canvases], spinAngles: [0, 26.57, 45, 63.43, 90, ...]  // clean-slope orientations, light stays top-left
 *   headW, headH,                 // head box in art px including the outline (30 x 18)
 *   ...extras (angles, pivot, grid sizes)
 * }
 * engine.Hammer.dither(name, p, opts) -> canvas   ordered-dither dissolve of a frame (see ditherGrid below)
 *
 * v3 changes (the hammer is drawn at k=4 on a desktop, k=3 on a phone, so every pose has to read small):
 *   - Every pose angle is a clean pixel slope: 0, 90, or tan = 1/2, 1, 2 (26.57, 45, 63.43 deg). Those are
 *     sampled nearest-neighbour, which puts every source edge on one lattice line, so silhouettes come out as
 *     perfect 1:1 or 1:2 staircases instead of RotSprite wobble. Fine details that alias at an angle (Gebo
 *     knots, the rune glyph, the rune plate walls, the face-band lines) are dropped from the sampled grid and
 *     redrawn in frame space: knots and glyph as Bresenham lines between the rotated end points, plate walls
 *     and head bevels re-derived from the rotated silhouette. Light stays top-left.
 *   - Poses: idle 0, raised 0 (held straight up: the hero pose under the sky bolt), windup -45 (cocked back),
 *     swing 45, smear 63.43 (lead pose), impact 90. raised === idle pixels.
 *   - Spin: 16 clean-slope orientations (4 per quadrant), so the flight spin never shows a wobbly frame.
 *   - Crackle bolts on the glow frames start ON the electric outline and step outward 4-connected, so they
 *     read as sparks leaving the metal, not as loose dust.
 *   - ditherGrid / dither(): Bayer 4x4 ordered-dither dissolve with an electric front and twinkle pixels,
 *     shared with hand-sprite.js for the hand that appears out of nowhere.
 *
 * How it is built:
 *   1. The hammer is hand-authored below as a fill grid (no outer outline) where every character is a
 *      material + surface facet (a normal), not a colour.
 *   2. Facets are shaded per pose against a fixed top-left light, so the light stays top-left in every
 *      frame instead of rotating with the sprite. Each facet quantises to one NES colour: flat clusters,
 *      no pillow shading.
 *   3. A clean 1px black outline is redrawn around every silhouette.
 *   4. Glow frames add a 1px electric outline (outside only), a charged rune and crackle bolts.
 *      The smear frame is the leading pose over a stretched head silhouette plus trailing speed streaks.
 * Frames are pose-only grids built once, then painted per scale and memoised.
 * Only NES hardware palette colours are used. Nearest-neighbour everywhere.
 */
(function () {
  'use strict';

  var NS = ENGINE;

  // ---------------------------------------------------------------------------
  // Palette (NES hardware palette entries only)
  // ---------------------------------------------------------------------------
  var PAL = {
    black: '#000000',
    white: '#fcfcfc', silver: '#d8d8d8', steel: '#bcbcbc', iron: '#7c7c7c', deep: '#004058',
    ice: '#a4e4fc', sky: '#3cbcfc', azure: '#0078f8', cobalt: '#0058f8',
    maroon: '#881400', brick: '#a81000', ochre: '#ac7c00', rust: '#e45c10', amber: '#fca044',
    gold: '#f8b800', paleGold: '#f8d878',
    peach: '#fce0a8', blush: '#f0d0b0', umber: '#503000', salmon: '#f87858'
  };

  // Material ramps, darkest to lightest, with thresholds on (normal . light).
  var RAMPS = {
    steel:   { c: [PAL.deep, PAL.iron, PAL.steel, PAL.silver, PAL.white], t: [0.10, 0.50, 0.66, 0.90] },
    leather: { c: [PAL.maroon, PAL.ochre, PAL.amber],                    t: [0.30, 0.90] },
    gold:    { c: [PAL.ochre, PAL.gold, PAL.paleGold],                    t: [0.30, 0.85] },
    charged: { c: [PAL.sky, PAL.ice, PAL.white],                          t: [0.30, 0.85] }
  };

  // Light direction (towards the light): top-left, in front. Screen coords: +x right, +y down, +z viewer.
  var LIGHT = norm3([-0.35, -0.7, 0.62]);

  // ---------------------------------------------------------------------------
  // Source fill grid (28 x 43; 30 x 45 once the 1px outline is added, so the outline is not drawn here).
  // Each character is a material + surface facet, not a colour:
  //
  //  steel   F front   u upper front (rolls to the light)   n lower front (rolls under)
  //          8 top  2 bottom  4 left  6 right  7 9 1 3 corners   (bevels)
  //          e f   inner edges of the two face bands (dropped in rotated frames, they alias into dots)
  //          P     recessed rune plate, one step darker
  //          L R T t B   walls of the rune plate (left, right, top, top-left corner, bottom)
  //          k     engraved Gebo knot (an X) on each side panel, one step darker than the face
  //  gold    G     Thurisaz rune inlay (turns electric in the glow frames)
  //  leather a b c d   grip cylinder columns, left to right
  //          w x y z   same columns on the upper edge of a wrap strap (catches the light)
  //          s         wrap seam
  //          C V       strap cord, outer and inner half (normals computed around the loop centre)
  var SRC = [
    /*  0 */ '8888....................8888',
    /*  1 */ '4uue88888888888888888888fuu6',
    /*  2 */ '4uueuuuuuutTTTTTTTuuuuuufuu6',
    /*  3 */ '4uuekuuuukLPGPPPPRkuuuukfuu6',
    /*  4 */ '4FFeFkFFkFLPGPPPPRFkFFkFfFF6',
    /*  5 */ '4FFeFFkkFFLPGGPPPRFFkkFFfFF6',
    /*  6 */ '4FFeFFkkFFLPGPGPPRFFkkFFfFF6',
    /*  7 */ '4FFeFkFFkFLPGPPGPRFkFFkFfFF6',
    /*  8 */ '4FFekFFFFkLPGPGPPRkFFFFkfFF6',
    /*  9 */ '4FFeFFFFFFLPGGPPPRFFFFFFfFF6',
    /* 10 */ '4nnennnnnnLPGPPPPRnnnnnnfnn6',
    /* 11 */ '4nnennnnnnLPGPPPPRnnnnnnfnn6',
    /* 12 */ '4nnennnnnnBBBBBBBBnnnnnnfnn6',
    /* 13 */ '4nne22222228888882222222fnn6',
    /* 14 */ '1222.......222223.......2226',
    /* 15 */ '............abss............',
    /* 16 */ '............ssyz............',
    /* 17 */ '............wxcd............',
    /* 18 */ '............abss............',
    /* 19 */ '............ssyz............',
    /* 20 */ '............wxcd............',
    /* 21 */ '............abss............',
    /* 22 */ '............ssyz............',
    /* 23 */ '............wxcd............',
    /* 24 */ '............abss............',
    /* 25 */ '............ssyz............',
    /* 26 */ '............wxcd............',
    /* 27 */ '............abss............',
    /* 28 */ '............ssyz............',
    /* 29 */ '............wxcd............',
    /* 30 */ '............abss............',
    /* 31 */ '............ssyz............',
    /* 32 */ '............wxcd............',
    /* 33 */ '...........788888...........',
    /* 34 */ '...........8FFFF3...........',
    /* 35 */ '............2222............',
    /* 36 */ '............CVVC............',
    /* 37 */ '...........CV..VC...........',
    /* 38 */ '..........CV....VC..........',
    /* 39 */ '.........CV......VC.........',
    /* 40 */ '.........CV......VC.........',
    /* 41 */ '..........CVVVVVVC..........',
    /* 42 */ '...........CCCCCC...........'
  ];
  var SRC_W = 28, SRC_H = SRC.length;

  // Key points in source fill coordinates (pixel-edge coordinates, so 14 is the line between col 13 and 14).
  var GRIP = { x: 14, y: 24 };          // centre of the leather grip: the hand and the rotation pivot
  var FACE_R = { x: 29, y: 7.5 };       // right striking face, outer edge of the outline (becomes the bottom at +90)
  var FACE_L = { x: -1, y: 7.5 };       // left striking face, outer edge of the outline
  var HEAD_RECT = { x0: -1, y0: -1, x1: 29, y1: 16 };  // head bounds including outline
  var LOOP_C = { x: 14, y: 39 };        // strap loop centre (for the cord normals)
  // Thin details redrawn in frame space for angled poses (source pixel centres).
  var GLYPH = [[12.5, 3.5, 12.5, 11.5], [13.5, 5.5, 15.5, 7.5], [15.5, 7.5, 13.5, 9.5]];
  var KNOTS = [[4.5, 3.5, 9.5, 8.5], [9.5, 3.5, 4.5, 8.5], [18.5, 3.5, 23.5, 8.5], [23.5, 3.5, 18.5, 8.5]];

  var TAN2 = Math.atan(2) * 180 / Math.PI, TAN05 = Math.atan(0.5) * 180 / Math.PI;   // 63.43, 26.57
  var ANGLES = { idle: 0, glowIdle: 0, raised: 0, windup: -45, swing: 45, smear: TAN2, impact: 90, glowImpact: 90 };
  var SMEAR_FROM = 0;                   // trailing end of the speed streaks (deg)
  var SMEAR_BODY = 44;                  // the stretched head silhouette spans SMEAR_BODY..smear
  var SPIN_ANGLES = (function () {
    var a = [];
    for (var q = 0; q < 4; q++) [0, TAN05, 45, TAN2].forEach(function (d) { a.push(q * 90 + d); });
    return a;
  })();

  // ---------------------------------------------------------------------------
  // Facet table
  // ---------------------------------------------------------------------------
  var D = 0.7071;
  var FACETS = {
    F: { m: 'steel', n: [0, 0, 1] },
    P: { m: 'steel', n: [0, 0, 1], ao: -1 },
    Q: { m: 'steel', n: [0, 0, 1], ao: -1, plate: true },   // plate floor in the plain (angled) source
    e: { m: 'steel', n: [D, 0, D], line: true },     // inner edge of the left face band (faces right)
    f: { m: 'steel', n: [-D, 0, D], line: true },    // inner edge of the right face band (faces left)
    u: { m: 'steel', n: [0, -0.42, 0.91] },          // upper front, rolling towards the top edge
    n: { m: 'steel', n: [0, 0.5, 0.87] },            // lower front, rolling under
    // walls of the recessed rune plate (each wall faces the plate's centre)
    L: { m: 'steel', n: [D, 0, D], ao: -1 },         // left wall, faces right: in shadow
    R: { m: 'steel', n: [-D, 0, D] },                // right wall, faces left: lit
    T: { m: 'steel', n: [0, D, D] },                 // top wall, faces down: in shadow
    t: { m: 'steel', n: [0.5, 0.5, D] },             // top-left corner of the plate
    B: { m: 'steel', n: [0, -0.42, 0.91] },          // bottom wall, faces up: catches light
    // engraved Gebo knot (X) on each side panel: one step darker than the steel around it
    k: { m: 'steel', n: [0, 0, 1], ao: -1, engrave: true },
    '8': { m: 'steel', n: [0, -D, D] }, '2': { m: 'steel', n: [0, D, D] },
    '4': { m: 'steel', n: [-D, 0, D] }, '6': { m: 'steel', n: [D, 0, D] },
    '7': { m: 'steel', n: [-0.5, -0.5, D] }, '9': { m: 'steel', n: [0.5, -0.5, D] },
    '1': { m: 'steel', n: [-0.5, 0.5, D] }, '3': { m: 'steel', n: [0.5, 0.5, D] },
    G: { m: 'gold', n: [0, 0, 1], rune: true },
    a: { m: 'leather', n: [-0.87, 0, 0.5] }, b: { m: 'leather', n: [-0.34, 0, 0.94] },
    c: { m: 'leather', n: [0.34, 0, 0.94] }, d: { m: 'leather', n: [0.87, 0, 0.5] },
    // upper edge of each wrap strap: same columns, tilted up so it catches the light
    w: { m: 'leather', n: [-0.87, -0.45, 0.5] }, x: { m: 'leather', n: [-0.34, -0.45, 0.94] },
    y: { m: 'leather', n: [0.34, -0.45, 0.94] }, z: { m: 'leather', n: [0.87, -0.45, 0.5] },
    s: { m: 'leather', fixed: 0 }
  };

  function partOf(x, y) {
    if (y <= 14 && (y <= 12 || x < 11 || x > 16)) return 'head';
    if (y <= 14) return 'collar';
    if (y <= 32) return 'handle';
    if (y <= 35) return 'pommel';
    return 'loop';
  }

  // Build the spec list: every source pixel gets an integer id (0 = empty).
  var SPECS = [null];
  var SPEC_CACHE = {};
  function buildIds(rows, plain) {
    var ids = [];
    for (var y = 0; y < SRC_H; y++) {
      if (rows[y].length !== SRC_W) throw new Error('hammer-sprite: row ' + y + ' is ' + rows[y].length + ' wide');
      var row = [];
      for (var x = 0; x < SRC_W; x++) {
        var ch = rows[y].charAt(x);
        if (ch === '.') { row.push(0); continue; }
        if (plain) ch = plainChar(ch, y);
        var part = partOf(x, y);
        var spec, key;
        if (ch === 'C' || ch === 'V') {
          var vx = x + 0.5 - LOOP_C.x, vy = y + 0.5 - LOOP_C.y;
          var l = Math.sqrt(vx * vx + vy * vy) || 1;
          var tilt = ch === 'C' ? 0.8 : 0;       // outer half rolls away, inner half faces the viewer
          spec = { m: 'leather', n: norm3([tilt * vx / l, tilt * vy / l, 0.6]), part: part };
          key = ch + x + ',' + y;
        } else {
          var f = FACETS[ch];
          if (!f) throw new Error('hammer-sprite: unknown char ' + ch);
          // a steel bevel that sits on the silhouette: rotated frames re-derive it from the rotated outline
          var rim = f.m === 'steel' && '78946123'.indexOf(ch) >= 0 && touchesEmpty(x, y);
          spec = { m: f.m, n: f.n ? norm3(f.n) : null, ao: f.ao || 0, fixed: f.fixed, rune: !!f.rune, rim: rim, line: !!f.line,
            engrave: !!f.engrave, plate: !!f.plate, part: part, ch: ch };
          key = ch + '|' + part + (rim ? '|rim' : '');
        }
        if (!SPEC_CACHE[key]) { SPEC_CACHE[key] = SPECS.length; SPECS.push(spec); }
        row.push(SPEC_CACHE[key]);
      }
      ids.push(row);
    }
    return ids;
  }
  // Angled poses sample a plain copy of the source: knots, face-band lines, plate walls and glyph are folded
  // into the surface around them and redrawn afterwards in frame space.
  function plainChar(ch, y) {
    if (ch === 'k' || ch === 'e' || ch === 'f') return y <= 3 ? 'u' : y <= 9 ? 'F' : 'n';
    if ('LRTtBGP'.indexOf(ch) >= 0) return 'Q';
    return ch;
  }
  function touchesEmpty(x, y) {
    for (var j = -1; j <= 1; j++) for (var i = -1; i <= 1; i++) {
      var X = x + i, Y = y + j;
      if (X < 0 || Y < 0 || X >= SRC_W || Y >= SRC_H || SRC[Y].charAt(X) === '.') return true;
    }
    return false;
  }
  var SRC_IDS = buildIds(SRC, false);
  var PLAIN_IDS = buildIds(SRC, true);
  var ID_GLYPH = SRC_IDS[3][12], ID_KNOT = SRC_IDS[3][4];

  // Frame grid: square, pivot (grip) at the exact centre, big enough for any rotation plus effects.
  var FRAME_N = (function () {
    var r = 0;
    for (var y = 0; y <= SRC_H; y++) for (var x = 0; x <= SRC_W; x++) {
      if (!cornerTouchesFill(x, y)) continue;
      var dx = x - GRIP.x, dy = y - GRIP.y;
      r = Math.max(r, Math.sqrt(dx * dx + dy * dy));
    }
    var half = Math.ceil(r + 1 /* outline */ + 1 /* glow */ + 4 /* crackle */);
    return half * 2;
  })();
  var PIV = FRAME_N / 2;

  function cornerTouchesFill(x, y) {
    for (var j = y - 1; j <= y; j++) for (var i = x - 1; i <= x; i++) {
      if (j >= 0 && j < SRC_H && i >= 0 && i < SRC_W && SRC_IDS[j][i]) return true;
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // Maths helpers
  // ---------------------------------------------------------------------------
  function norm3(v) { var l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function rot2(x, y, deg) {
    var a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    return { x: x * c - y * s, y: x * s + y * c };
  }
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // Source point (edge coords) -> frame point for a pose angle.
  function srcToFrame(px, py, deg) {
    var r = rot2(px - GRIP.x, py - GRIP.y, deg);
    return { x: PIV + r.x, y: PIV + r.y };
  }
  function mod360(d) { return ((d % 360) + 360) % 360; }
  function isQuarter(deg) { var q = mod360(deg) % 90; return q < 1e-6 || q > 90 - 1e-6; }
  // clean pixel slope: the pose's tangent is 1/2, 1 or 2 (so every rotated source edge is a lattice line)
  function isCleanSlope(deg) {
    var q = mod360(deg) % 90;
    return [TAN05, 45, TAN2].some(function (a) { return Math.abs(q - a) < 1e-3; });
  }

  // ---------------------------------------------------------------------------
  // Rotation of the id grid
  // ---------------------------------------------------------------------------
  function scale2x(g, w, h) {
    var W = w * 2, out = new Array(h * 2);
    for (var y = 0; y < h * 2; y++) out[y] = new Array(W);
    for (y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var P = g[y][x];
        var A = y > 0 ? g[y - 1][x] : P;
        var B = x < w - 1 ? g[y][x + 1] : P;
        var C = x > 0 ? g[y][x - 1] : P;
        var Dd = y < h - 1 ? g[y + 1][x] : P;
        var e0 = P, e1 = P, e2 = P, e3 = P;
        if (C === A && C !== Dd && A !== B) e0 = A;
        if (A === B && A !== C && B !== Dd) e1 = B;
        if (Dd === C && Dd !== B && C !== A) e2 = C;
        if (B === Dd && B !== A && Dd !== C) e3 = Dd;
        out[2 * y][2 * x] = e0; out[2 * y][2 * x + 1] = e1;
        out[2 * y + 1][2 * x] = e2; out[2 * y + 1][2 * x + 1] = e3;
      }
    }
    return out;
  }

  // RotSprite source (8x Scale2x), only used for the smear sweep at arbitrary angles.
  var RS = null;
  function rotSource() {
    if (RS) return RS;
    var w = SRC_W + 2, h = SRC_H + 2, g = [];
    for (var y = 0; y < h; y++) {
      var row = [];
      for (var x = 0; x < w; x++) row.push(y > 0 && y <= SRC_H && x > 0 && x <= SRC_W ? SRC_IDS[y - 1][x - 1] : 0);
      g.push(row);
    }
    var a = scale2x(g, w, h), b = scale2x(a, w * 2, h * 2), c = scale2x(b, w * 4, h * 4);
    RS = { g8: c, w8: w * 8, h8: h * 8 };
    return RS;
  }

  function emptyGrid(fill) {
    var g = new Array(FRAME_N);
    for (var y = 0; y < FRAME_N; y++) { g[y] = new Array(FRAME_N); for (var x = 0; x < FRAME_N; x++) g[y][x] = fill; }
    return g;
  }

  // Returns a FRAME_N x FRAME_N grid of spec ids for a pose angle.
  //   quarter turns: exact copy of the source.  clean slopes: nearest neighbour on the plain source, then the
  //   silhouette cleanup, bevels, plate walls, glyph and knots rebuilt in frame space.  anything else: RotSprite.
  function idGrid(deg) {
    var out = emptyGrid(0);
    var a = -deg * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    var quarter = isQuarter(deg), slope = !quarter && isCleanSlope(deg);
    var rs = !quarter && !slope ? rotSource() : null;
    for (var y = 0; y < FRAME_N; y++) {
      for (var x = 0; x < FRAME_N; x++) {
        var dx = x + 0.5 - PIV, dy = y + 0.5 - PIV;
        var sx = GRIP.x + dx * ca - dy * sa, sy = GRIP.y + dx * sa + dy * ca;
        if (quarter || slope) {
          var ix = Math.floor(sx + 1e-4), iy = Math.floor(sy + 1e-4);
          if (ix >= 0 && iy >= 0 && ix < SRC_W && iy < SRC_H) out[y][x] = (slope ? PLAIN_IDS : SRC_IDS)[iy][ix];
        } else {
          var jx = Math.floor((sx + 1) * 8), jy = Math.floor((sy + 1) * 8);
          if (jx >= 0 && jy >= 0 && jx < rs.w8 && jy < rs.h8) out[y][x] = rs.g8[jy][jx];
        }
      }
    }
    if (!quarter) { cleanIds(out); autoBevel(out); }
    if (slope) { plateWalls(out); redrawDetails(out, deg); }
    return out;
  }

  // Rotated frames: the bevel ring is rebuilt from the rotated silhouette. Every steel pixel on the new
  // outline gets a normal pointing away from the shape (in frame space, so the light stays top-left); source
  // bevel pixels that ended up inside the shape take the majority interior facet around them.
  var FRAME_IDS = {};
  function frameSpec(key, spec) {
    if (!FRAME_IDS[key]) { SPECS.push(spec); FRAME_IDS[key] = SPECS.length - 1; }
    return FRAME_IDS[key];
  }
  function bevelId(part, ox, oy) {
    var a = Math.round(Math.atan2(oy, ox) / (Math.PI / 8)) & 15, ang = a * Math.PI / 8;
    return frameSpec('bevel' + part + a, { m: 'steel', n: norm3([Math.cos(ang) * D, Math.sin(ang) * D, D]), frame: true, part: part });
  }
  function autoBevel(g) {
    var copy = g.map(function (r) { return r.slice(); });
    for (var y = 1; y < FRAME_N - 1; y++) for (var x = 1; x < FRAME_N - 1; x++) {
      var id = copy[y][x]; if (!id) continue;
      var sp = SPECS[id];
      var ox = 0, oy = 0, open = 0, inner = [];
      for (var j = -1; j <= 1; j++) for (var i = -1; i <= 1; i++) {
        if (!i && !j) continue;
        var n = copy[y + j][x + i];
        if (!n) { var l = Math.sqrt(i * i + j * j); ox += i / l; oy += j / l; open++; }
        else if (!SPECS[n].rim && !SPECS[n].line && !SPECS[n].frame && SPECS[n].m === sp.m) inner.push(n);
      }
      if (open && sp.m === 'steel' && !sp.rune) {
        if (Math.abs(ox) + Math.abs(oy) > 0.01) g[y][x] = bevelId(sp.part, ox, oy);
      } else if (!open && (sp.rim || sp.line)) {
        if (inner.length) g[y][x] = majority(inner);
      }
    }
  }
  // Rune plate walls of an angled pose: plate floor pixels on the plate's own outline become a wall facing
  // the plate centre (shadowed walls one step darker, like the authored plate).
  function plateWalls(g) {
    var copy = g.map(function (r) { return r.slice(); });
    for (var y = 1; y < FRAME_N - 1; y++) for (var x = 1; x < FRAME_N - 1; x++) {
      var id = copy[y][x]; if (!id || !SPECS[id].plate) continue;
      var ox = 0, oy = 0, edge = false;
      for (var j = -1; j <= 1; j++) for (var i = -1; i <= 1; i++) {
        if (!i && !j) continue;
        var n = copy[y + j][x + i];
        if (n && SPECS[n].plate) continue;
        if (!i || !j) edge = true;
        var l = Math.sqrt(i * i + j * j); ox += i / l; oy += j / l;
      }
      if (!edge || Math.abs(ox) + Math.abs(oy) < 0.01) continue;
      var a = Math.round(Math.atan2(-oy, -ox) / (Math.PI / 4)) & 7, ang = a * Math.PI / 4;
      var nrm = norm3([Math.cos(ang) * D, Math.sin(ang) * D, D]);
      var lit = nrm[0] * LIGHT[0] + nrm[1] * LIGHT[1] + nrm[2] * LIGHT[2];
      g[y][x] = frameSpec('wall' + a, { m: 'steel', n: nrm, frame: true, ao: lit < 0.3 ? -1 : 0, part: 'head' });
    }
  }
  // Glyph and knots as clean 1px lines between the rotated end points (only over plain head steel).
  function redrawDetails(g, deg) {
    // at the 1:2 slopes the three-stroke Thurisaz turns into a squiggle at this size, so it is simplified to its
    // stem plus a 2px thorn (still reads as the rune's notch); the 1:1 poses keep the full glyph
    var simple = Math.abs((mod360(deg) % 90) - 45) > 1e-6;
    function line(seg, id, onlyPlate) {
      var p0 = srcToFrame(seg[0], seg[1], deg), p1 = srcToFrame(seg[2], seg[3], deg);
      var x0 = Math.floor(p0.x), y0 = Math.floor(p0.y), x1 = Math.floor(p1.x), y1 = Math.floor(p1.y);
      var dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx + dy;
      for (var guard = 0; guard < 200; guard++) {
        var cur = g[y0] && g[y0][x0], sp = cur && SPECS[cur];
        if (sp && sp.part === 'head' && !sp.frame && !sp.rim && (onlyPlate ? sp.plate : !sp.plate)) g[y0][x0] = id;
        if (x0 === x1 && y0 === y1) break;
        var e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
    }
    (simple ? [GLYPH[0], [13.5, 6.5, 14.5, 7.5]] : GLYPH).forEach(function (s) { line(s, ID_GLYPH, true); });
    KNOTS.forEach(function (s) { line(s, ID_KNOT, false); });
  }

  // Silhouette cleanup after a non-orthogonal resample: drop one-pixel spurs (a pixel with at most one filled
  // 8-neighbour, so 1px diagonal lines survive) and fill one-pixel notches (empty pixel walled in on 3+ sides).
  function cleanIds(g) {
    var copy = g.map(function (r) { return r.slice(); });
    for (var y = 1; y < FRAME_N - 1; y++) for (var x = 1; x < FRAME_N - 1; x++) {
      if (!copy[y][x]) continue;
      var filled = 0;
      for (var j = -1; j <= 1; j++) for (var i = -1; i <= 1; i++) if ((i || j) && copy[y + j][x + i]) filled++;
      if (filled <= 1) g[y][x] = 0;
    }
    var copy2 = g.map(function (r) { return r.slice(); });
    for (y = 1; y < FRAME_N - 1; y++) for (x = 1; x < FRAME_N - 1; x++) {
      if (copy2[y][x]) continue;
      var nb = [copy2[y - 1][x], copy2[y + 1][x], copy2[y][x - 1], copy2[y][x + 1]].filter(Boolean);
      if (nb.length < 3) continue;
      g[y][x] = majority(nb);
    }
  }

  function majority(list) {
    var cnt = {}, best = list[0], bc = 0;
    for (var i = 0; i < list.length; i++) {
      var v = list[i]; cnt[v] = (cnt[v] || 0) + 1;
      if (cnt[v] > bc) { bc = cnt[v]; best = v; }
    }
    return best;
  }

  // Colour-level cleanup for rotated frames: an interior pixel whose colour appears in none of its 8 neighbours
  // is resampling noise, so it takes the majority colour of its 4-neighbours. Rune and detail pixels are kept.
  function cleanColours(g, ids) {
    var copy = g.map(function (r) { return r.slice(); });
    for (var y = 1; y < FRAME_N - 1; y++) for (var x = 1; x < FRAME_N - 1; x++) {
      var c = copy[y][x]; if (!c) continue;
      var sp = SPECS[ids[y][x]];
      if (sp.rune || sp.engrave) continue;
      var n4 = [copy[y - 1][x], copy[y + 1][x], copy[y][x - 1], copy[y][x + 1]];
      if (n4.filter(Boolean).length < 4) continue;
      var lonely = true;
      for (var j = -1; j <= 1 && lonely; j++) for (var i = -1; i <= 1; i++) if ((i || j) && copy[y + j][x + i] === c) { lonely = false; break; }
      if (lonely) g[y][x] = majority(n4);
    }
  }

  // ---------------------------------------------------------------------------
  // Shading
  // ---------------------------------------------------------------------------
  function shadeSpec(spec, deg, charged) {
    if (spec.colour) return spec.colour;
    var ramp = RAMPS[spec.rune && charged ? 'charged' : spec.m];
    if (spec.fixed != null) return ramp.c[spec.fixed];
    var n = spec.n, r = rot2(n[0], n[1], spec.frame ? 0 : deg);
    var d = r.x * LIGHT[0] + r.y * LIGHT[1] + n[2] * LIGHT[2];
    var idx = 0;
    for (var i = 0; i < ramp.t.length; i++) if (d > ramp.t[i]) idx = i + 1;
    idx = Math.max(0, Math.min(ramp.c.length - 1, idx + (spec.ao || 0)));
    return ramp.c[idx];
  }

  // Colour grid (null = transparent) with a redrawn 1px outline.
  function colourGrid(ids, deg, charged) {
    var cache = {};
    var g = emptyGrid(null);
    // 1:1 poses: nearest-neighbour turns the strap loop into a square kite with a spur, so it is left out here
    // and stamped afterwards as a hand-drawn ring (diagonal1())
    var diag = Math.abs((mod360(deg) % 90) - 45) < 1e-6, half = !diag && isCleanSlope(deg);
    for (var y = 0; y < FRAME_N; y++) for (var x = 0; x < FRAME_N; x++) {
      var id = ids[y][x]; if (!id) continue;
      if ((diag || half) && SPECS[id].part === 'loop') continue;
      if (!(id in cache)) cache[id] = shadeSpec(SPECS[id], deg, charged);
      g[y][x] = cache[id];
    }
    if (!isQuarter(deg)) cleanColours(g, ids);
    outline(g, PAL.black);
    if (diag) diagonalLoop(g, deg);
    else if (half) slopeLoop(g, deg);
    return g;
  }
  // The strap loop for the 1:2 poses (26.57, 63.43 and their quarter turns): nearest-neighbour sampling turns the
  // authored teardrop into a lumpy triangle with a ragged hole, so it is rasterised here instead: a teardrop ring
  // (wider at the bottom, like the source) with an even 2px cord round a clean hole, lit on its upper-left outer
  // edge (amber), maroon on the lower right, ochre between, with its own 1px outline inside and out.
  function slopeLoop(g, deg) {
    var c = srcToFrame(LOOP_C.x, LOOP_C.y + 0.5, deg), a = deg * Math.PI / 180;
    var ux = -Math.sin(a), uy = Math.cos(a), vx = Math.cos(a), vy = Math.sin(a);
    var x0 = Math.floor(c.x - 8), x1 = Math.ceil(c.x + 8), y0 = Math.floor(c.y - 8), y1 = Math.ceil(c.y + 8), ring = {};
    var L = norm3([LIGHT[0], LIGHT[1], 0]);
    for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) {
      if (x < 1 || y < 1 || x >= FRAME_N - 1 || y >= FRAME_N - 1) continue;
      var dx = x + 0.5 - c.x, dy = y + 0.5 - c.y, u = dx * ux + dy * uy, v = dx * vx + dy * vy;
      var w = 1 + 0.1 * u / 3.6;                      // the teardrop: narrow where it hangs off the pommel
      var eo = (u / 3.6) * (u / 3.6) + (v / (5.0 * w)) * (v / (5.0 * w)), ei = (u / 1.55) * (u / 1.55) + (v / (2.9 * w)) * (v / (2.9 * w));
      if (eo > 1 || ei <= 1) continue;
      if (u < -2.2 && g[y][x] && g[y][x] !== PAL.black) continue;   // never paint over the pommel
      var l = Math.sqrt(dx * dx + dy * dy) || 1, outer = eo > 0.52 ? 1 : -1;
      var d = outer * (dx / l * L[0] + dy / l * L[1]);
      g[y][x] = d > 0.42 ? PAL.amber : d < -0.42 ? PAL.maroon : PAL.ochre;
      ring[x + ',' + y] = 1;
    }
    for (y = y0 - 1; y <= y1 + 1; y++) for (x = x0 - 1; x <= x1 + 1; x++) {
      if (!g[y] || x < 0 || x >= FRAME_N || ring[x + ',' + y] || (g[y][x] && g[y][x] !== PAL.black)) continue;
      if (ring[(x - 1) + ',' + y] || ring[(x + 1) + ',' + y] || ring[x + ',' + (y - 1)] || ring[x + ',' + (y + 1)]) g[y][x] = PAL.black;
      else if (g[y][x] === PAL.black) {
        // stale outline of the old (skipped) loop pixels: drop it unless it still borders a filled pixel
        var keep = false;
        for (var j = -1; j <= 1 && !keep; j++) for (var i = -1; i <= 1; i++) { var q = g[y + j] && g[y + j][x + i]; if ((i || j) && q && q !== PAL.black) { keep = true; break; } }
        if (!keep) g[y][x] = null;
      }
    }
  }
  // The strap loop for the 1:1 poses: a rounded diamond ring 11px across, an even 2px cord (lit on its upper-left
  // outer edge, maroon on the lower-right, ochre inside) with its own outline, centred where the loop's centre
  // turns to, so it hangs off the pommel as the authored loop does at 0 and 90 degrees.
  function diagonalLoop(g, deg) {
    var c = srcToFrame(LOOP_C.x, LOOP_C.y, deg), cx = Math.round(c.x - 0.5), cy = Math.round(c.y - 0.5), was = {};
    [[-5, 0], [5, 0], [0, -5], [0, 5]].forEach(function (o) { var r = g[cy + o[1]]; was[o[0] + ',' + o[1]] = r ? r[cx + o[0]] : null; });
    for (var dy = -5; dy <= 5; dy++) for (var dx = -5; dx <= 5; dx++) {
      var X = cx + dx, Y = cy + dy, d = Math.abs(dx) + Math.abs(dy);
      if (X < 0 || Y < 0 || X >= FRAME_N || Y >= FRAME_N) continue;
      var tip = (Math.abs(dx) === 4 && dy === 0) || (Math.abs(dy) === 4 && dx === 0);
      var col = null;
      if (d === 2 || d === 5 || (tip && d === 4)) col = g[Y][X] && d === 5 ? g[Y][X] : PAL.black;
      else if (d === 3) col = PAL.ochre;
      else if (d === 4) col = dx + dy < 0 ? PAL.amber : dx + dy > 0 ? PAL.maroon : PAL.ochre;
      else if (d < 2) col = g[Y][X] && g[Y][X] !== PAL.black ? g[Y][X] : null;
      if (d <= 5 && (d >= 2 || col === null)) g[Y][X] = col;
    }
    // corner pixels of the outer outline at the four tips round the ring off
    [[-5, 0], [5, 0], [0, -5], [0, 5]].forEach(function (o) { var X = cx + o[0], Y = cy + o[1]; if (g[Y] && g[Y][X] === PAL.black && !was[o[0] + ',' + o[1]]) g[Y][X] = null; });
  }

  function outline(g, colour, colourFn) {
    var add = [];
    var N = g.length, M = g[0].length;
    for (var y = 0; y < N; y++) for (var x = 0; x < M; x++) {
      if (g[y][x]) continue;
      if ((y > 0 && g[y - 1][x]) || (y < N - 1 && g[y + 1][x]) || (x > 0 && g[y][x - 1]) || (x < M - 1 && g[y][x + 1])) add.push([x, y]);
    }
    for (var i = 0; i < add.length; i++) {
      var c = colourFn ? colourFn(add[i][0], add[i][1]) : colour;
      if (c) g[add[i][1]][add[i][0]] = c;
    }
    return add;
  }

  // ---------------------------------------------------------------------------
  // Glow frames: 1px electric outline (brightest round the head), charged rune, crackle bolts
  // ---------------------------------------------------------------------------
  function glowGrid(deg, seed) {
    var ids = idGrid(deg);
    var g = colourGrid(ids, deg, true);
    var head = srcToFrame((HEAD_RECT.x0 + HEAD_RECT.x1) / 2, (HEAD_RECT.y0 + HEAD_RECT.y1) / 2, deg);
    // 1px electric outline on the outside only (the strap loop's hole stays empty).
    var outside = exterior(g);
    var ring = [];
    outline(g, null, function (x, y) {
      if (!outside[y][x]) return null;
      var near = nearestPart(ids, x, y);
      ring.push([x, y, near]);
      if (near === 'head') return PAL.sky;
      if (near === 'collar' || near === 'handle') return PAL.azure;
      return PAL.cobalt;
    });
    crackle(g, ring.filter(function (p) { return p[2] === 'head'; }), head, seed, 6);
    return g;
  }

  // Crackle: short 4-connected zig-zag bolts that start ON the electric outline (the first bolt pixel shares an
  // edge with a ring pixel) and step outward: out, out, sideways, out (, sideways). Sky where they leave the
  // metal, then azure and cobalt outward, so the whole bolt reads on a white page (a white root would vanish
  // there and leave the rest floating off the outline). A bolt may only touch its own path and its ring.
  var ELECTRIC = {};
  ELECTRIC[PAL.sky] = 1; ELECTRIC[PAL.azure] = 1; ELECTRIC[PAL.cobalt] = 1; ELECTRIC[PAL.ice] = 1; ELECTRIC[PAL.white] = 1;
  function crackle(g, ringPts, centre, seed, count, isRing) {
    var rnd = mulberry32(seed);
    var N = g.length, M = g[0].length;
    var made = 0, tries = 0, used = [];
    var ringAt = isRing || function (x, y) { var c = g[y] && g[y][x]; return !!c && !!ELECTRIC[c]; };
    while (made < count && tries++ < 600 && ringPts.length) {
      var p = ringPts[Math.floor(rnd() * ringPts.length)];
      var ox = p[0] + 0.5 - centre.x, oy = p[1] + 0.5 - centre.y;
      var sx = Math.abs(ox) >= Math.abs(oy) ? Math.sign(ox) : 0;
      var sy = sx ? 0 : Math.sign(oy) || -1;
      var side = rnd() < 0.5 ? -1 : 1, px = -sy * side, py = sx * side;
      var len = rnd() < 0.55 ? 4 : 5;
      var steps = len === 4 ? ['o', 'o', 's', 'o'] : ['o', 'o', 's', 'o', 's'];
      if (rnd() < 0.35) steps[1] = 's', steps[2] = 'o';
      var path = [], cx = p[0], cy = p[1];
      for (var k = 0; k < steps.length; k++) {
        if (steps[k] === 'o') { cx += sx; cy += sy; } else { cx += px; cy += py; }
        path.push([cx, cy]);
      }
      var far = used.every(function (u) { return Math.abs(u[0] - p[0]) + Math.abs(u[1] - p[1]) > 6; });
      var ok = far && path.every(function (q, i) {
        if (q[0] < 1 || q[1] < 1 || q[0] >= M - 1 || q[1] >= N - 1 || g[q[1]][q[0]]) return false;
        for (var j = -1; j <= 1; j++) for (var i2 = -1; i2 <= 1; i2++) {
          var X = q[0] + i2, Y = q[1] + j;
          if (!g[Y][X]) continue;
          var own = path.some(function (r) { return r[0] === X && r[1] === Y; });
          if (own) continue;
          if (i === 0 && ringAt(X, Y)) continue;        // the first pixel may touch the ring it leaves from
          return false;
        }
        return true;
      });
      if (!ok) continue;
      var cols = [PAL.sky, PAL.sky, PAL.azure, PAL.cobalt, PAL.cobalt];
      path.forEach(function (q, i) { g[q[1]][q[0]] = cols[i]; });
      used.push(p);
      made++;
    }
    return made;
  }

  // Transparent pixels reachable from the frame border (4-connected).
  function exterior(g) {
    var N = g.length, M = g[0].length;
    var out = [], stack = [];
    for (var y = 0; y < N; y++) { out.push(new Array(M)); for (var x = 0; x < M; x++) out[y][x] = false; }
    for (var i = 0; i < M; i++) stack.push([i, 0], [i, N - 1]);
    for (i = 0; i < N; i++) stack.push([0, i], [M - 1, i]);
    while (stack.length) {
      var q = stack.pop(), qx = q[0], qy = q[1];
      if (qx < 0 || qy < 0 || qx >= M || qy >= N || out[qy][qx] || g[qy][qx]) continue;
      out[qy][qx] = true;
      stack.push([qx + 1, qy], [qx - 1, qy], [qx, qy + 1], [qx, qy - 1]);
    }
    return out;
  }

  function nearestPart(ids, x, y) {
    var best = null, bd = 1e9;
    for (var j = -2; j <= 2; j++) for (var i = -2; i <= 2; i++) {
      var Y = y + j, X = x + i;
      if (Y < 0 || X < 0 || Y >= FRAME_N || X >= FRAME_N) continue;
      var id = ids[Y][X]; if (!id) continue;
      var d = i * i + j * j;
      if (d < bd) { bd = d; best = SPECS[id].part; }
    }
    return best;
  }

  // ---------------------------------------------------------------------------
  // Smear frame: swept head silhouettes + streaks under the leading pose
  // ---------------------------------------------------------------------------
  function smearGrid() {
    var lead = ANGLES.smear;
    var g = emptyGrid(null);
    var newest = emptyGrid(-1);
    var a, x, y;
    // 1. Stretched head: the head silhouette swept from SMEAR_BODY to the leading pose, flat steel tones.
    for (a = SMEAR_BODY; a < lead; a += 2) {
      var ids = idGrid(a);
      for (y = 0; y < FRAME_N; y++) for (x = 0; x < FRAME_N; x++) {
        if (ids[y][x] && SPECS[ids[y][x]].part === 'head') newest[y][x] = a;
      }
    }
    var rMin = 1e9, rMax = 0;
    for (y = 0; y < FRAME_N; y++) for (x = 0; x < FRAME_N; x++) {
      if (newest[y][x] < 0) continue;
      var t = (newest[y][x] - SMEAR_BODY) / (lead - SMEAR_BODY);
      g[y][x] = t > 0.45 ? PAL.silver : PAL.steel;
      var r0 = Math.hypot(x + 0.5 - PIV, y + 0.5 - PIV);
      rMin = Math.min(rMin, r0); rMax = Math.max(rMax, r0);
    }
    cleanSilhouette(g);
    outline(g, PAL.black);
    // 2. Speed streaks: 1px arcs trailing back from the stretched head towards SMEAR_FROM.
    var streaks = [
      { r: rMax - 1.0, c: [PAL.white, PAL.silver, PAL.steel] },
      { r: rMax - 4.5, c: [PAL.silver, PAL.steel, PAL.iron] },
      { r: rMin + (rMax - rMin) * 0.45, c: [PAL.steel, PAL.iron] }
    ];
    var trail = (SMEAR_BODY - SMEAR_FROM) * Math.PI / 180;
    streaks.forEach(function (st, k) {
      var phiMin = 1e9;
      for (var yy = 0; yy < FRAME_N; yy++) for (var xx = 0; xx < FRAME_N; xx++) {
        if (newest[yy][xx] < 0) continue;
        var dx = xx + 0.5 - PIV, dy = yy + 0.5 - PIV;
        if (Math.abs(Math.hypot(dx, dy) - st.r) > 1) continue;
        phiMin = Math.min(phiMin, Math.atan2(dy, dx));
      }
      var gap = 2 / st.r;                                   // 2px of air between the head and its streaks
      var len = trail * (1 - k * 0.22);
      for (var y2 = 0; y2 < FRAME_N; y2++) for (var x2 = 0; x2 < FRAME_N; x2++) {
        if (g[y2][x2]) continue;
        var ex = x2 + 0.5 - PIV, ey = y2 + 0.5 - PIV;
        if (Math.abs(Math.hypot(ex, ey) - st.r) > 0.5) continue;
        var back = phiMin - Math.atan2(ey, ex);             // radians behind the stretched head
        if (back < gap || back > gap + len) continue;
        var u = (back - gap) / len;
        g[y2][x2] = st.c[Math.min(st.c.length - 1, Math.floor(u * st.c.length))];
      }
    });
    // 3. The leading pose on top, fully shaded, with its own outline.
    var leadIds = idGrid(lead), leadG = colourGrid(leadIds, lead, false);
    for (y = 0; y < FRAME_N; y++) for (x = 0; x < FRAME_N; x++) if (leadG[y][x]) g[y][x] = leadG[y][x];
    return { g: g, ids: leadIds };
  }
  // drop 1px spurs and fill 1px notches of a colour silhouette (smear body)
  function cleanSilhouette(g) {
    var N = g.length, M = g[0].length, copy = g.map(function (r) { return r.slice(); });
    for (var y = 1; y < N - 1; y++) for (var x = 1; x < M - 1; x++) {
      if (copy[y][x]) {
        var f = 0;
        for (var j = -1; j <= 1; j++) for (var i = -1; i <= 1; i++) if ((i || j) && copy[y + j][x + i]) f++;
        if (f <= 2) g[y][x] = null;
      } else {
        var nb = [copy[y - 1][x], copy[y + 1][x], copy[y][x - 1], copy[y][x + 1]].filter(Boolean);
        if (nb.length >= 3) g[y][x] = majority(nb);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Ordered-dither dissolve (shared with hand-sprite.js)
  //   ditherGrid(g, p, opts) -> new colour grid. A pixel is shown when its threshold < p, where the threshold
  //   is the Bayer 4x4 value of its art-pixel position plus a small per-pixel hash jitter (so the last pixels
  //   never form a regular screen-door lattice), optionally blended with its distance from opts.from (so the
  //   sprite resolves outward from that point). Pixels just past the front (threshold in [p, p+edge)) show as
  //   electric pixels (azure next to the shown pixels, sky beyond), so the sprite materialises from (or burns
  //   out into) charged dots, and a few twinkles (a sky pixel, some with a cobalt plus) blink just outside the
  //   silhouette. Saturated colours only, so all of it reads on a white page. p = 1 returns the frame as is.
  //   opts: { from: {x,y} art px, bias 0..1 (0.3), edge (0.14), energy (true), sparks (count, 5), seed }
  // ---------------------------------------------------------------------------
  var BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function bayer(x, y) { return (BAYER4[((y & 3) << 2) | (x & 3)] + 0.5) / 16; }
  function hash2(x, y) { var h = Math.imul(x * 374761393 + y * 668265263, 1274126177); h ^= h >>> 13; return ((h >>> 0) % 1024) / 1024; }
  var JITTER = 0.18;
  function ditherGrid(g, p, opts) {
    opts = opts || {};
    var N = g.length, M = g[0].length, x, y;
    var out = new Array(N);
    for (y = 0; y < N; y++) { out[y] = new Array(M); for (x = 0; x < M; x++) out[y][x] = null; }
    if (p >= 1) { for (y = 0; y < N; y++) for (x = 0; x < M; x++) out[y][x] = g[y][x]; return out; }
    if (p < 0) p = 0;
    var from = opts.from || null, bias = from ? (opts.bias != null ? opts.bias : 0.3) : 0;
    var edge = opts.edge != null ? opts.edge : 0.14, energy = opts.energy !== false;
    var maxD = 1;
    if (from) for (y = 0; y < N; y++) for (x = 0; x < M; x++) if (g[y][x]) maxD = Math.max(maxD, Math.hypot(x + 0.5 - from.x, y + 0.5 - from.y));
    // the visible range is squeezed so p = 0 shows nothing and p = 1 everything, front included
    var P = p * (1 + edge) - edge;
    for (y = 0; y < N; y++) for (x = 0; x < M; x++) {
      var c = g[y][x]; if (!c) continue;
      var thr = (bayer(x, y) * (1 - JITTER) + hash2(x, y) * JITTER) * (1 - bias) + (from ? Math.hypot(x + 0.5 - from.x, y + 0.5 - from.y) / maxD : 0) * bias;
      if (thr < P) out[y][x] = c;
      else if (energy && thr < P + edge) out[y][x] = thr < P + edge * 0.45 ? PAL.azure : PAL.sky;
    }
    var nSpark = opts.sparks == null ? 5 : opts.sparks;
    if (nSpark > 0 && p > 0.02 && p < 0.98) {
      var count = Math.round(nSpark * Math.sin(Math.PI * p) + 0.4);
      var rnd = mulberry32(((opts.seed || 1) * 7919 + Math.floor(p * 12)) | 0);
      var edgePts = [];
      for (y = 2; y < N - 2; y++) for (x = 2; x < M - 2; x++) {
        if (g[y][x]) continue;
        if (g[y - 1][x] || g[y + 1][x] || g[y][x - 1] || g[y][x + 1]) edgePts.push([x, y]);
      }
      for (var s = 0, tries = 0; s < count && tries < 60 && edgePts.length; tries++) {
        var e = edgePts[Math.floor(rnd() * edgePts.length)];
        var dx = (rnd() < 0.5 ? -1 : 1) * Math.floor(1 + rnd() * 3), dy = (rnd() < 0.5 ? -1 : 1) * Math.floor(rnd() * 3);
        var X = e[0] + dx, Y = e[1] + dy;
        if (X < 1 || Y < 1 || X >= M - 1 || Y >= N - 1 || g[Y][X] || out[Y][X]) continue;
        var big = rnd() < 0.5;
        out[Y][X] = PAL.sky;
        if (big) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { if (!g[Y + d[1]][X + d[0]] && !out[Y + d[1]][X + d[0]]) out[Y + d[1]][X + d[0]] = PAL.cobalt; });
        s++;
      }
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // Canvas output
  // ---------------------------------------------------------------------------
  function toCanvas(g, scale) {
    var N = g.length, M = g[0].length;
    var cv = document.createElement('canvas');
    cv.width = M * scale; cv.height = N * scale;
    var ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    for (var y = 0; y < N; y++) {
      for (var x = 0; x < M; x++) {
        var c = g[y][x]; if (!c) continue;
        // run-length along the row for fewer fillRect calls
        var run = 1; while (x + run < M && g[y][x + run] === c) run++;
        ctx.fillStyle = c; ctx.fillRect(x * scale, y * scale, run * scale, scale);
        x += run - 1;
      }
    }
    return cv;
  }

  // Grids are pose-only (scale independent), so build them once.
  var GRIDS = null;
  function grids() {
    if (GRIDS) return GRIDS;
    var idle = colourGrid(idGrid(0), 0, false);
    GRIDS = {
      idle: idle,
      raised: ANGLES.raised === 0 ? idle : colourGrid(idGrid(ANGLES.raised), ANGLES.raised, false),
      windup: colourGrid(idGrid(ANGLES.windup), ANGLES.windup, false),
      swing: colourGrid(idGrid(ANGLES.swing), ANGLES.swing, false),
      smear: smearGrid().g,
      impact: colourGrid(idGrid(ANGLES.impact), ANGLES.impact, false),
      glowIdle: glowGrid(ANGLES.glowIdle, 7),
      glowImpact: glowGrid(ANGLES.glowImpact, 19)
    };
    return GRIDS;
  }
  var SPIN = null;
  function spinGrids() {
    if (SPIN) return SPIN;
    var G = grids();
    SPIN = SPIN_ANGLES.map(function (deg) {
      if (deg === 0) return G.idle;
      if (deg === 90) return G.impact;
      if (Math.abs(deg - ANGLES.swing) < 1e-6) return G.swing;
      if (Math.abs(deg - (360 + ANGLES.windup)) < 1e-6) return G.windup;
      return colourGrid(idGrid(deg), deg, false);
    });
    return SPIN;
  }

  function anchorsFor(deg, scale) {
    function pt(px, py) { var p = srcToFrame(px, py, deg); return { x: p.x * scale, y: p.y * scale }; }
    var corners = [[HEAD_RECT.x0, HEAD_RECT.y0], [HEAD_RECT.x1, HEAD_RECT.y0], [HEAD_RECT.x0, HEAD_RECT.y1], [HEAD_RECT.x1, HEAD_RECT.y1],
      [(HEAD_RECT.x0 + HEAD_RECT.x1) / 2, HEAD_RECT.y0], [FACE_L.x, FACE_L.y], [FACE_R.x, FACE_R.y]];
    // headTop: centre of whatever part of the head is highest in this pose (top edge, back face or a corner)
    var pts = corners.map(function (c) { return pt(c[0], c[1]); });
    var minY = Math.min.apply(null, pts.map(function (p) { return p.y; }));
    var hi = pts.filter(function (p) { return p.y <= minY + 0.5 * scale; });
    var top = { x: hi.reduce(function (a, p) { return a + p.x; }, 0) / hi.length, y: hi.reduce(function (a, p) { return a + p.y; }, 0) / hi.length };
    return {
      grip: pt(GRIP.x, GRIP.y),
      strikeFace: pt(FACE_R.x, FACE_R.y),
      backFace: pt(FACE_L.x, FACE_L.y),
      headCenter: pt((HEAD_RECT.x0 + HEAD_RECT.x1) / 2, (HEAD_RECT.y0 + HEAD_RECT.y1) / 2),
      headTop: top
    };
  }

  var MEMO = {};
  function create(scale) {
    var s = Math.max(1, Math.round(+scale || 1));
    if (MEMO[s]) return MEMO[s];
    var G = grids(), frames = {};
    Object.keys(G).forEach(function (k) {
      var cv = null;
      Object.defineProperty(frames, k, { enumerable: true, get: function () { return cv || (cv = toCanvas(G[k], s)); } });
    });
    var anchors = {};
    Object.keys(ANGLES).forEach(function (k) { anchors[k] = anchorsFor(ANGLES[k], s); });
    var spinCache = null;
    var size = FRAME_N * s;
    var out = {
      frames: frames,
      width: size,
      height: size,
      grip: anchors.idle.grip,
      strikeFace: anchors.impact.strikeFace,
      // extras (not in the contract, safe to ignore)
      scale: s,
      angles: ANGLES,
      pivot: { x: PIV * s, y: PIV * s },
      anchors: anchors,
      // spin (lazy getter, painted on first access): spin[i] is the hammer rotated spinAngles[i] deg clockwise
      // about the grip, light fixed top-left. Clean slopes only: 0, 26.57, 45, 63.43, 90, ...
      spinAngles: SPIN_ANGLES.slice(),     // spin[0] === idle pixels, spin[4] === impact pixels
      headW: HEAD_RECT.x1 - HEAD_RECT.x0,  // art px, including the outline
      headH: HEAD_RECT.y1 - HEAD_RECT.y0 + 1,
      gridSize: FRAME_N,
      sourceGrid: { w: SRC_W + 2, h: SRC_H + 2 },
      hammerLength: (GRIP.y - HEAD_RECT.y0) * s
    };
    Object.defineProperty(out, 'spin', {
      enumerable: true,
      get: function () { return spinCache || (spinCache = spinGrids().map(function (g) { return toCanvas(g, s); })); }
    });
    MEMO[s] = out;
    return out;
  }

  // Solid-colour copy of a frame (ghost tints, silhouettes): source-in fill keeps the pixel edges exact.
  function tint(frame, colour) {
    var cv = document.createElement('canvas');
    cv.width = frame.width; cv.height = frame.height;
    var ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(frame, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = colour;
    ctx.fillRect(0, 0, cv.width, cv.height);
    return cv;
  }

  // Dissolve of a hammer frame ('idle', 'impact', ... or 'spin3'): canvas at opts.scale (default 1).
  // p in [0, 1]: 0 = gone, 1 = whole frame. Memoised per frame, scale and 1/32 step of p.
  var DMEMO = {}, DCOUNT = 0;   // capped: a new seed per strike must not grow it without bound
  function dither(name, p, opts) {
    opts = opts || {};
    var s = Math.max(1, Math.round(+opts.scale || 1));
    var q = Math.max(0, Math.min(32, Math.round((+p || 0) * 32)));
    var key = name + '|' + q + '|' + s + '|' + (opts.seed || 1) + '|' + (opts.energy === false ? 0 : 1) + '|' + (opts.from ? opts.from.x + ',' + opts.from.y : '') + '|' + [opts.bias, opts.edge, opts.sparks].join(',');
    if (DMEMO[key]) return DMEMO[key];
    var m = /^spin(\d+)$/.exec(name);
    var g = m ? spinGrids()[+m[1]] : grids()[name];
    if (!g) throw new Error('hammer-sprite: no frame ' + name);
    var from = opts.from || { x: PIV, y: PIV };
    var cv = toCanvas(ditherGrid(g, q / 32, { from: from, bias: opts.bias, edge: opts.edge, energy: opts.energy, sparks: opts.sparks, seed: opts.seed }), s);
    if (++DCOUNT > 600) { DMEMO = {}; DCOUNT = 1; }
    DMEMO[key] = cv;
    return cv;
  }

  NS.Hammer = {
    create: create,
    tint: tint,
    dither: dither,
    angles: ANGLES,
    spinAngles: SPIN_ANGLES.slice(),
    gridSize: FRAME_N,
    sourceGrid: { w: SRC_W + 2, h: SRC_H + 2 },
    headW: HEAD_RECT.x1 - HEAD_RECT.x0,
    palette: PAL,
    _debug: { ramps: RAMPS, grids: grids, spinGrids: spinGrids, reset: function () { GRIDS = null; SPIN = null; MEMO = {}; DMEMO = {}; DCOUNT = 0; } },
    // Pixel-space toolkit for hand-sprite.js (not part of the engine contract).
    _internal: {
      PAL: PAL, RAMPS: RAMPS, LIGHT: LIGHT, FRAME_N: FRAME_N, PIV: PIV, ANGLES: ANGLES,
      GRIP: GRIP, FACE_R: FACE_R, FACE_L: FACE_L, HEAD_RECT: HEAD_RECT, SRC_W: SRC_W, SRC_H: SRC_H,
      grids: grids,
      plainGrid: function (deg, charged) { var ids = idGrid(deg); return { g: colourGrid(ids, deg, !!charged), ids: ids }; },
      smearGrid: smearGrid,
      partAt: function (id) { return id ? SPECS[id].part : null; },
      specAt: function (id) { return id ? SPECS[id] : null; },
      srcToFrame: srcToFrame,
      anchorsFor: anchorsFor,
      outline: outline,
      exterior: exterior,
      crackle: crackle,
      ditherGrid: ditherGrid,
      bayer: bayer,
      toCanvas: toCanvas,
      rot2: rot2,
      norm3: norm3,
      mulberry32: mulberry32
    }
  };
})();


/*
 * hand-sprite.js (v3)
 * Pixel-art arm of the thunder god for the Thor link opener prototype: a bare forearm that fades out of
 * thin air (ordered dither, no hard cut end), a gold arm ring, a dark leather vambrace with steel cuffs and
 * three rune studs, and a strong bare hand. Same art-pixel scale, palette family and top-left light as
 * hammer-sprite.js (which must load first). Drawn at k=4 on a desktop and k=3 on a phone.
 *
 * engine.Hand.create(scale) -> {
 *   frames: { open, catch, heldRaised, glowHeldRaised, heldWindup, heldSwing, heldSmear, heldImpact,
 *             heldSide, heldSideBack, heldSideSwing, heldSideMid, open0, open1, open2 },        // HTMLCanvasElement, ALL the same size, nearest-neighbour
 *   width, height,                          // canvas size in px (= art size * scale)
 *   anchors: { <frame>: { root, wrist, palm, strikeFace, grip, headCenter, headTop, runes, bbox, handCenter,
 *                          fadeStart, axis, armLength, hammerAngle, hammerFrame, hammerOffset } },
 *   frameNames, art: { w, h, root, fade }, scale
 * }
 * engine.Hand.dither(name, p, opts) -> canvas   the frame materialising (p 0 -> 1) or dissolving (1 -> 0)
 *
 *   root        where the forearm's dither fade fully ends (the arm is fully transparent here). IDENTICAL in
 *               every frame. There is nothing behind it: the arm simply comes out of thin air.
 *   fadeStart   root + axis * fade: from here to the wrist the arm is fully opaque. Between root and fadeStart
 *               the arm thins out in a Bayer 4x4 ordered dither (rounded front, edges go first).
 *   wrist       end of the forearm axis (vambrace cuff): root -> wrist is the arm axis of the frame.
 *   palm        catch target (open, catch, open0..2): the hammer's grip lands exactly here.
 *   grip        hammer grip in the held frames (catch included) = Hammer frame pivot.
 *   strikeFace  heldImpact, heldSide (and heldSmear): centre of the striking face, outer edge of the outline.
 *   headCenter / headTop   hammer head in the held frames (sky bolt target, orbit sparks).
 *   handCenter  centre of the hand (or fist) art: the default point the dither dissolve grows from.
 *   runes       centres of the 3 vambrace rune studs (staged ignition).
 *   hammerAngle / hammerFrame   which Hammer frame (and angle) is composited, e.g. heldRaised: 0 / 'raised'.
 *   hammerOffset   where that Hammer frame's top-left corner sits in this frame (same scale), so the
 *               flying hammer and the held one line up pixel-exactly (catch: grip lands on palm).
 *   axis, armLength   unit root -> wrist vector and its length (px).
 *   bbox        opaque bounds {x, y, w, h} of that frame.
 * Frames are rendered in pixel space (pre-rotated, nothing is rotated in CSS). Canonical side: the arm comes
 * out of the air on the left and reaches right, the hammer arrives from the right. Mirror with scale(-1, 1).
 *
 * Pose sheet (forearm angle from the root, + is down; hammer angle, 0 = head up):
 *   open        -18.4  the summoning palm: palm to the viewer, fingers spread and leaning at the hammer
 *   catch       -18.4  hammer upright (idle pixels) slapped into the palm (grip === open palm), the thumb
 *                      bent over the front of the handle
 *   heldRaised  -45    hammer held straight up (0), fist about 11 art px above the catch grip: the hero pose
 *                      under the sky bolt. glowHeldRaised is the charged version: electric outline on hammer
 *                      and fist, crackle off the head, white-hot rune, the head's steels palette-swapped to
 *                      ice / sky / azure
 *   heldWindup  -63.4  arm up and back, hammer cocked over the shoulder (-45): the anticipation before the
 *                      slam (a different arm angle from the raise, so the coil reads)
 *   heldSwing     0    hammer coming over the top (+45)
 *   heldSmear   +26.6  the smear: lead pose 63.4 over the swept head silhouette and speed streaks
 *   heldImpact  +45    face flat on the link (90); the forearm comes down at 45 deg, so the handle runs out
 *                      of the fist to a fully visible pommel and loop
 *   heldSide      0    the side blow for targets in the top band: forearm level and extended, the hammer tilted
 *                      +26.57 into the blow, its right face (strikeFace) biting into the link, the fist below it
 *   heldSideBack  -26.6 the side blow's swing keys: hammer cocked back (-45), then coming round (-26.57,
 *   heldSideSwing   0   forearm level), upright (0, the arm reaching), into the +26.57 bite of heldSide, so the
 *   heldSideMid     0   striking face travels an arc into the target
 *   Frames stay compact (the engine adds arc with its own pose offsets); within the frames the arm sweeps
 *   108 deg from the windup to the impact while the hammer turns 135 deg. Arm
 *   angles are clean pixel slopes (1:1, 1:2, 1:3, flat) and hammer angles are 0, 90 or 1:1 / 1:2 slopes, so
 *   every edge is a clean staircase. Hands and fists are drawn by hand per pose (not rotated), lit top left.
 *
 * How it is built:
 *   - The forearm is rasterised per pose straight onto the art grid (a tapered cylinder along the pose
 *     angle, shaded per pixel against the fixed top-left light, quantised to NES ramps).
 *   - The hand for each pose is hand-written pixel rows with a colour key, stamped over a short skin stub at
 *     the wrist (so the joint is skin on skin), and drawn over the hammer handle with its own outline.
 *   - One outline is redrawn around the union, then the forearm's cut end is dithered away.
 * Only NES palette colours. Built once (a few ms), canvases memoised per scale.
 */
(function () {
  'use strict';

  var NS = ENGINE;
  var HM = NS.Hammer, HI = HM && HM._internal;
  if (!HI) { if (window.console) console.warn('[hand-sprite] load hammer-sprite.js first'); return; }

  var PAL = HI.PAL;
  var LIGHT = HI.LIGHT;

  // ---------------------------------------------------------------------------
  // Colour key for the hand-written pixel rows (calm skin ramp: rust only as the deepest 1px shadow)
  //   o outline   H highlight   P skin   S skin shade   r deep shade   m crease / web (dark, selective outline)
  //   n soft crease (ochre: a selective inner line between fingers, quieter than the maroon)   W nail glint
  // ---------------------------------------------------------------------------
  var KEY = {
    o: PAL.black, H: PAL.peach, P: PAL.blush, S: PAL.amber, r: PAL.rust, m: PAL.maroon, n: PAL.ochre, W: PAL.white
  };
  // forearm skin (rasterised cylinder): a calm ramp, amber only on the 1px edge turned away from the light
  var SKIN = { c: [PAL.amber, PAL.blush, PAL.peach], t: [0.2, 0.86] };
  var HIDE = { c: [PAL.umber, PAL.maroon, PAL.ochre], t: [0.38, 0.86] };
  var GOLD = { c: [PAL.maroon, PAL.ochre, PAL.gold, PAL.paleGold], t: [0.05, 0.45, 0.85] };
  var STEEL = HI.RAMPS.steel;

  // ---------------------------------------------------------------------------
  // Hand-written art. Every piece: rows, wrist (edge coords: where the forearm axis end, the vambrace cuff,
  // sits under the art), and grip (fists: the hammer pivot) or palm (open hand: where the grip lands).
  // ---------------------------------------------------------------------------
  // OPEN: the summoning palm. Palm to the viewer, the fingers spread toward the incoming hammer. Each finger is
  // 3px (lit, then two calm skin pixels) with ONE shared 1px line where neighbours touch: an ochre crease, never
  // a doubled black outline. The index finger fans out to the left and the little finger to the right in 1px
  // steps from the knuckle line (each split is a small V), the middle and ring fingers stay together and part
  // only at the tips, so four fingertips read; round caps; the middle finger is the longest, the little finger
  // the shortest. The thumb angles out low to the left. Amber is only 1px at each finger base, a short palm
  // crease and the heel shade.
  var OPEN = {
    rows: [
      '...........ooo..............',
      '..........oHHPo..ooo........',
      '..........oHPPo.oHHPo.......',
      '....ooo...oHPPo.oHPPo.......',
      '...oHHPo..oHPPo.oHPPo.......',
      '...oHPPo..oHPPooHPPo..ooo...',
      '...oHPPo..oHPPnHPPo..oHHPo..',
      '....oHPPo.oHPPnHPPo..oHPPo..',
      '....oHPPo.oHPPnHPPo.oHPPo...',
      '....oHPPo.oHPPnHPPo.oHPPo...',
      '.....oHPPooHPPnHPPooHPPo....',
      '......oHPPnHPPnHPPnHPPo.....',
      '.ooo..oHPPPPPPPPPPPPPPo.....',
      'oHPPo.oHPPPPPPPPPPPPPPo.....',
      '.oHPPooHPPPPPPPPPPPPPPo.....',
      '..oHPPoHPPPHPPPPPPPPPPo.....',
      '...oHPPPPPPPHHPPPPPPPPo.....',
      '.oooPPPPPPPPPPHPPPPPPPo.....',
      'oPPPPPPPPPPPPPPPPPPPPo......',
      'oPPPPPPPPPPPPPPPPSSSPo......',
      'oPPPPPPPPPPPPPPPSSSSo.......',
      '.ooooooooooooooooooo........'
    ],
    wrist: { x: 0, y: 19.5 },
    palm: { x: 14, y: 16 }
  };

  // CATCH: the handle has just slapped into the palm (hammer upright). The thumb is a short lobe across the top
  // (an ochre crease sets it off the back of the hand), its nail resting over the index finger with its own
  // shade under it; three finger rolls wrap the handle front, each a lit row and a crease row whose ochre crease
  // runs in from the knuckle edge, where the outline steps in 1px, so the silhouette scallops between lobes.
  // Handle fill columns 10..13, grip edge (12, 6).
  var CATCH = {
    rows: [
      '...oooooo.......',
      '..oHHHHHHoooo...',
      '.oHPPPPPnHHPWo..',
      'oHPPPPPPPnSSoooo',
      'oPPPPPPPPoHHPPPo',
      'oPPPPPPPPoPPnno.',
      'oPPPPPPPPoHPPPPo',
      'oPPPPPPPPoPPnno.',
      'oSPPPPPPPoHPPPo.',
      '.oSSPPPSSoPSSo..',
      '..ooooooooooo...'
    ],
    wrist: { x: -1, y: 6.5 },
    grip: { x: 12, y: 6 }
  };

  // Fists. The same fist turned with the hammer (thumb toward the head, knuckles on the far side, heel
  // toward the wrist), each angle drawn by hand and lit from the top left. Finger rolls are separated by
  // outline notches at the knuckle end only; amber (the skin shade) stays in 1-2px clusters on the shadow edge.
  // FIST_UP (hammer straight up, raised: the hero pose under the sky bolt): finger side to the viewer. The thumb
  // is its own lobe across the top, its nail resting over the index finger and a maroon crease under its tip.
  // Then four finger rolls wrapped round the front of the handle, two rows each: a lit row whose knuckle bumps
  // out 1px at the right edge, then a row with a 3-4px crease running in from the knuckle edge (ochre, maroon
  // at the notch) and an outline notch, so the silhouette steps between the lobes (the same language as FIST_DOWN). The little
  // finger is the shortest; the heel is on the lower left where the wrist comes in, and the handle shows above
  // and below the fist. Handle fill columns 5..8, grip edge (7, 6).
  var FIST_UP = {
    rows: [
      '..oooooo.....',
      '.oHHHHHHoo...',
      'oHPPPPPPPWo..',
      'oHPPPPPPPPSo.',
      'oHPPPPnnnnmPo',
      'oHPPPPnPPPPHo',
      'oPPPPPPPPPPPo',
      'oPPPPPPPnnno.',
      'oHPPPPPnPPPHo',
      'oPPPPPPPPnno.',
      'oHPPPPPPnPHo.',
      'oPPPPPPPPnSo.',
      '.oSPPPPPSSo..',
      '..ooooooooo..'
    ],
    wrist: { x: 1, y: 11 },
    grip: { x: 7, y: 6 }
  };
  // FIST_BACK (hammer cocked back, -45): thumb along the upper left edge, knuckles on the upper right, heel
  // lower left. The handle runs from the upper left (head) to the lower right (pommel) through the grip.
  var FIST_BACK = {
    rows: [
      '......oooo.....',
      '.....oHHPWo....',
      '....oHPPPPoo...',
      '...oHPPPPoHHo..',
      '..oHPPPPoPPnHo.',
      '.oHPPPPoPPnPPHo',
      'oHPPPPoPPnPPnPo',
      'oHPPPPPPnPPnPSo',
      '.oHPPPPPPPnPSo.',
      '..oPPPPPPPPSo..',
      '...oPPPPPPSo...',
      '....oSSSSo.....',
      '.....oooo......'
    ],
    wrist: { x: 2, y: 9 },
    grip: { x: 8, y: 6 }
  };
  // FIST_FWD (hammer coming over the top, +45): the cocked-back fist turned a quarter turn and relit:
  // heel upper left, thumb along the upper right with its nail, knuckle notches lower right.
  var FIST_FWD = {
    rows: [
      '.....oo......',
      '....oHHo.....',
      '...oHPPHo....',
      '..oHPPPPPo...',
      '.oHPPPPPPPo..',
      'oHPPPPPPPPPo.',
      'oHPPPPoPPPPPo',
      'oPPPPPPoPPPPo',
      '.oPPPPPPoPPSo',
      '..oPPPPPPoSWo',
      '...oPPPPPPoo.',
      '....oPPPSo...',
      '.....oSSSo...',
      '......ooo....'
    ],
    wrist: { x: 1, y: 4 },
    grip: { x: 7, y: 8 }
  };
  // FIST_SMEAR: the over-the-top fist again, on the smear lead pose (63.4); it is on screen for one frame.
  var FIST_SMEAR = FIST_FWD;
  // FIST_DOWN (impact, 90): handle level with the head on the right. The heel is one soft highlight band on
  // top where the 45 deg forearm comes in; the thumb is a separate lobe that wraps over the top of the handle on
  // the head side, with its nail, and a shade band under it. The four fingers wrap the front of the handle as one
  // mass that ends 1px below the handle: their 1px creases show only on the lowest two rows, and the bottom
  // outline steps up 1px between the 2px finger lobes. The handle shows on both sides. Handle fill rows 5..8,
  // grip edge (7, 7).
  var FIST_DOWN = {
    rows: [
      '..oooooo......',
      '.oHHHHHHoo....',
      'oHHPPPPPPHoo..',
      'oHPPPPPPPPHHo.',
      'oHPPPPPPPPPPWo',
      'oPPPPPPPPPPPo.',
      'oHPPPPPPPPPPo.',
      'oPPPPPPPPPPPo.',
      'oPPSPPSPPSPPo.',
      'oSSoSSoSSoSSo.',
      '.oo.oo.oo.oo..'
    ],
    wrist: { x: 3, y: 0 },
    grip: { x: 7, y: 7 }
  };

  // Rune studs: 5x5 steel bosses with a 3x3 rune (Algiz, Thurisaz, Ingwaz).
  var STUD = [
    '.LLM.',
    'Lxxxi',
    'Lxxxi',
    'Mxxxi',
    '.iii.'
  ];
  var GLYPHS = [
    ['x.x', '.x.', '.x.'],
    ['x..', 'xx.', 'x..'],
    ['.x.', 'x.x', '.x.']
  ];
  // rune states: [recess, glyph]
  var RUNE = {
    dark: [PAL.iron, PAL.steel],      // dormant: a steel glyph in an iron recess (an engraved boss, unlit)
    lit: [PAL.cobalt, PAL.sky],       // summoned: the engine blooms over the #3cbcfc glyph pixels
    glow: [PAL.sky, PAL.white]        // charged (glowHeldRaised)
  };

  // ---------------------------------------------------------------------------
  // Arm geometry (art px). Angles in degrees from +x, positive = down (screen space).
  // ---------------------------------------------------------------------------
  var FADE = 8;                 // the forearm thins out over this many art px from the root
  var VB_LEN = 19;              // vambrace length (cuff to cuff); shorter arms shorten it, never the ring
  var RING = [FADE, FADE + 2];  // gold arm ring, just past the fade
  var STUB = 4;                 // bare wrist past the cuff, under the hand art (skin on skin joint)
  var DEG = 180 / Math.PI;
  var SLOPE = {                 // clean pixel slopes: 2:1, 1:1, 1:2, 1:3 and flat
    up0: -Math.atan(2) * DEG, up1: -45, up2: -Math.atan(1 / 2) * DEG, up3: -Math.atan(1 / 3) * DEG, flat: 0,
    dn3: Math.atan(1 / 3) * DEG, dn2: Math.atan(1 / 2) * DEG, dn1: 45
  };
  // order: bottom to top. 'ham' = hammer frame, 'arm' = forearm, 'hand' = hand art
  var POSES = {
    open:       { theta: SLOPE.up3, L: 29, hand: OPEN, runes: 'lit' },
    catch:      { theta: SLOPE.up3, L: 29, hand: CATCH, held: 'idle', gripOnPalm: true, runes: 'lit', sparks: true, order: ['ham', 'arm', 'hand'] },
    heldRaised: { theta: SLOPE.up1, L: 28, hand: FIST_UP, held: 'raised', runes: 'lit', order: ['arm', 'ham', 'hand'] },
    heldWindup: { theta: SLOPE.up0, L: 28, hand: FIST_BACK, held: 'windup', runes: 'lit', order: ['ham', 'arm', 'hand'] },
    heldSwing:  { theta: SLOPE.flat, L: 28, hand: FIST_FWD, held: 'swing', runes: 'lit', order: ['arm', 'ham', 'hand'] },
    heldSmear:  { theta: SLOPE.dn2, L: 28, hand: FIST_SMEAR, held: 'smear', runes: 'lit', order: ['arm', 'ham', 'hand'] },
    heldImpact: { theta: SLOPE.dn1, L: 28, hand: FIST_DOWN, held: 'impact', runes: 'lit', order: ['arm', 'ham', 'hand'] },
    // the side blow for targets in the top band (no room above them for the overhead slam): the forearm level
    // and reaching (extended 3 art px further than the other poses), the hammer tilted 26.57 deg INTO the blow (a
    // clean 1:2 slope), so its right face bites into the link at the end of an arc instead of standing upright
    heldSide:   { theta: SLOPE.flat, L: 31, hand: FIST_UP, wrist: { x: 0, y: 7 }, held: 'sideImpact', heldDeg: Math.atan(0.5) * DEG, runes: 'lit', order: ['arm', 'ham', 'hand'] },
    // the side blow's own swing keys: the head cocked back over the fist (-45, forearm raised 1:2), then coming
    // round (-26.57, forearm level) into the upright contact of heldSide, so the right face travels an arc
    heldSideBack:  { theta: SLOPE.up2, L: 28, hand: FIST_BACK, held: 'windup', runes: 'lit', order: ['ham', 'arm', 'hand'] },
    heldSideSwing: { theta: SLOPE.flat, L: 28, hand: FIST_UP, wrist: { x: 0, y: 7 }, held: 'sideSwing', heldDeg: -Math.atan(0.5) * DEG, runes: 'lit', order: ['arm', 'ham', 'hand'] },
    // the last swing key of the side blow: hammer upright (0), the arm reaching out, one beat before the bite
    heldSideMid:   { theta: SLOPE.flat, L: 30, hand: FIST_UP, wrist: { x: 0, y: 7 }, held: 'raised', runes: 'lit', order: ['arm', 'ham', 'hand'] }
  };
  var FRAME_NAMES = ['open', 'catch', 'heldRaised', 'glowHeldRaised', 'heldWindup', 'heldSwing', 'heldSmear', 'heldImpact', 'heldSide', 'heldSideBack', 'heldSideSwing', 'heldSideMid'];

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  var WG = 144, RX = 52, RY = 80;   // working grid and root (integer corner)
  function grid(fill) {
    var g = new Array(WG);
    for (var y = 0; y < WG; y++) { g[y] = new Array(WG); for (var x = 0; x < WG; x++) g[y][x] = fill; }
    return g;
  }
  function layer() { return { c: grid(null), p: grid(null) }; }
  function shade(ramp, nx, ny, nz) {
    var d = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2];
    var i = 0;
    for (var k = 0; k < ramp.t.length; k++) if (d > ramp.t[k]) i = k + 1;
    return i;
  }
  function dir(deg) { var a = deg / DEG; return { x: Math.cos(a), y: Math.sin(a) }; }
  var GROUP = { arm: 'body', ring: 'body', cuff: 'body', vambrace: 'body', stud: 'body', rune: 'body', stub: 'body', hand: 'body', edge: null, ham: 'ham', fx: 'fx' };
  function groupOf(p) { return p ? (GROUP[p] !== undefined ? GROUP[p] : 'ham') : null; }
  // Stamp a layer over the composite. Where the layer's silhouette borders a different group underneath, a
  // 1px black line is drawn on the underlying pixels, so parts in front always read as in front.
  function stamp(comp, L, lineOver) {
    if (lineOver) {
      var add = [];
      for (var y = 1; y < WG - 1; y++) for (var x = 1; x < WG - 1; x++) {
        if (L.c[y][x] || !comp.c[y][x]) continue;
        var nb = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
        for (var k = 0; k < 4; k++) {
          var X = nb[k][0], Y = nb[k][1];
          if (!L.c[Y][X] || L.p[Y][X] === 'edge' || L.p[Y][X] === 'hedge') continue;
          if (groupOf(L.p[Y][X]) !== groupOf(comp.p[y][x])) { add.push([x, y]); break; }
        }
      }
      add.forEach(function (q) { comp.c[q[1]][q[0]] = PAL.black; comp.p[q[1]][q[0]] = 'edge'; });
    }
    for (var y2 = 0; y2 < WG; y2++) for (var x2 = 0; x2 < WG; x2++) {
      var c = L.c[y2][x2]; if (!c) continue;
      // hand outline pixels never cut across the arm (the wrist joint is skin on skin)
      if (L.p[y2][x2] === 'edge' && L.own === 'hand' && groupOf(comp.p[y2][x2]) === 'body') continue;
      comp.c[y2][x2] = c; comp.p[y2][x2] = L.p[y2][x2];
    }
  }
  function stampRows(L, rows, ox, oy, key, part) {
    for (var j = 0; j < rows.length; j++) for (var i = 0; i < rows[j].length; i++) {
      var ch = rows[j].charAt(i); if (ch === '.') continue;
      var col = key[ch]; if (!col) throw new Error('hand-sprite: unknown char ' + ch);
      var X = ox + i, Y = oy + j;
      if (X < 0 || Y < 0 || X >= WG || Y >= WG) continue;
      L.c[Y][X] = col; L.p[Y][X] = ch === 'o' ? 'edge' : part;
    }
  }
  // one outline around the union of everything (outline pixels already drawn do not get a second ring)
  function outlineAll(comp) {
    var add = [];
    // only the arm and hand: the hammer brings its own outline, and smear streaks or sparks have none
    var solid = function (x, y) { return groupOf(comp.p[y][x]) === 'body'; };
    for (var y = 1; y < WG - 1; y++) for (var x = 1; x < WG - 1; x++) {
      if (comp.c[y][x]) continue;
      if (solid(x, y - 1) || solid(x, y + 1) || solid(x - 1, y) || solid(x + 1, y)) add.push([x, y]);
    }
    add.forEach(function (q) { comp.c[q[1]][q[0]] = PAL.black; comp.p[q[1]][q[0]] = 'edge'; });
  }

  // ---------------------------------------------------------------------------
  // Forearm: tapered cylinder from the root (where it comes out of thin air) to a short bare wrist stub.
  // Bare skin, the gold arm ring, then the vambrace (steel cuffs, dark leather body, three rune studs).
  // ---------------------------------------------------------------------------
  function vbStart(L) { return Math.max(L - VB_LEN, RING[1]); }
  function halfWidth(t, L) {
    var vb0 = vbStart(L);
    if (t > L) return 3.9;                                             // wrist stub
    if (t < vb0) {
      var w0 = 5.7 - 0.25 * Math.max(0, t / Math.max(1, vb0));
      if (t >= RING[0] && t < RING[1]) w0 += 0.5;                       // gold arm ring stands proud
      return w0;
    }
    var u = (t - vb0) / (L - vb0);
    var w = 5.6 - 1.35 * u;                                            // tapers hard toward the wrist
    if (t < vb0 + 2 || t > L - 2) w += 0.6;                            // steel cuffs stand proud
    return w;
  }
  function drawForearm(pose, runeState) {
    var A = dir(pose.theta), N = { x: -A.y, y: A.x };
    var L = pose.L, vb0 = vbStart(L), span = L - vb0;
    var lay = layer();
    for (var y = 0; y < WG; y++) for (var x = 0; x < WG; x++) {
      var cx = x + 0.5 - RX, cy = y + 0.5 - RY;
      var t = cx * A.x + cy * A.y; if (t < -1 || t > L + STUB) continue;
      var v = cx * N.x + cy * N.y;
      var hw = halfWidth(t, L); if (Math.abs(v) > hw) continue;
      // rounded-box profile: a flat front (mid tone) that rolls off over the outer 60% to each edge
      var u = v / hw, au = Math.abs(u);
      var tilt = (u < 0 ? -1 : 1) * Math.pow(Math.max(0, (au - 0.3) / 0.7), 1.15) * 0.96;
      var nx = N.x * tilt, ny = N.y * tilt, nz = Math.sqrt(Math.max(0, 1 - tilt * tilt));
      var col, part = 'arm';
      if (t > L) {
        col = SKIN.c[shade(SKIN, nx, ny, nz)]; part = 'stub';
      } else if (t >= RING[0] && t < RING[1]) {
        // baugr: a twisted gold arm ring; the second strand carries a diagonal twist groove
        var gi = shade(GOLD, nx, ny, nz);
        var tr = t - RING[0];
        if (tr >= 1 && ((Math.floor(v + 8) & 1) === 0)) gi = Math.max(0, gi - 1);
        col = GOLD.c[gi]; part = 'ring';
      } else if (t < vb0) {
        col = SKIN.c[shade(SKIN, nx, ny, nz)];
      } else if (t < vb0 + 2 || t > L - 2) {
        // steel cuff: cylinder plus a rolled lip on its outer edge
        var lip = (t < vb0 + 1 || t > L - 1) ? -1 : 0;
        var si = shade(STEEL, nx, ny, nz) + lip;
        col = STEEL.c[Math.max(0, Math.min(STEEL.c.length - 1, si))];
        part = 'cuff';
      } else {
        col = HIDE.c[shade(HIDE, nx, ny, nz)];
        part = 'vambrace';
      }
      lay.c[y][x] = col; lay.p[y][x] = part;
    }
    // rune studs on the axis, a touch toward the light
    var runes = [], centres = [vb0 + span * 0.24, vb0 + span * 0.5, vb0 + span * 0.76];
    centres.forEach(function (tc, k) {
      var px = RX + A.x * tc + N.x * -0.6, py = RY + A.y * tc + N.y * -0.6;
      var sx = Math.round(px - 2.5), sy = Math.round(py - 2.5);
      stampStud(lay, sx, sy, k, runeState);
      runes.push({ x: sx + 2.5 - RX, y: sy + 2.5 - RY });
    });
    return { layer: lay, runes: runes, wrist: { x: A.x * L, y: A.y * L }, A: A, N: N };
  }
  function stampStud(lay, sx, sy, k, state) {
    var rc = RUNE[state] || RUNE.dark, dormant = rc === RUNE.dark;
    var key = { L: PAL.white, M: PAL.steel, i: PAL.iron };
    for (var j = 0; j < 5; j++) for (var i = 0; i < 5; i++) {
      var ch = STUD[j].charAt(i); if (ch === '.') continue;
      var col;
      if (ch === 'x') col = GLYPHS[k][j - 1].charAt(i - 1) === 'x' ? rc[1] : rc[0];
      // a dormant boss keeps a single white glint (top left); its other lit rim pixels are plain steel
      else if (dormant && ch === 'L' && !(i === 1 && j === 0)) col = PAL.steel;
      else col = key[ch];
      lay.c[sy + j][sx + i] = col; lay.p[sy + j][sx + i] = ch === 'x' ? 'rune' : 'stud';
    }
  }

  // The forearm's cut end thins out over FADE art px in a Bayer 4x4 ordered dither. The front is rounded
  // (the edges go first), so there is never a straight cut end, and everything behind the root is empty.
  // Outline pixels fade a step earlier than the fill (so the gradient never ends in black specks), and any
  // outline pixel left with no opaque fill pixel round it is dropped.
  function fadeCut(comp, A, N) {
    var zone = [], densAt = {};
    for (var y = 0; y < WG; y++) for (var x = 0; x < WG; x++) {
      if (!comp.c[y][x]) continue;
      var cx = x + 0.5 - RX, cy = y + 0.5 - RY;
      var t = cx * A.x + cy * A.y; if (t >= FADE + 1) continue;
      var v = cx * N.x + cy * N.y; if (Math.abs(v) > 9) continue;
      zone.push([x, y]);
      // the gradient is peach and blush only: the shade colours turn to blush in the fade zone
      if (comp.p[y][x] !== 'edge' && (comp.c[y][x] === PAL.amber || comp.c[y][x] === PAL.rust)) comp.c[y][x] = PAL.blush;
      if (t >= FADE) continue;
      var dens = (t - 1.6 * Math.pow(Math.abs(v) / 6, 2)) / FADE;
      densAt[x + ',' + y] = dens;
      if (comp.p[y][x] === 'edge') dens -= 0.22;
      if (dens >= 1) continue;
      if (dens <= 0 || HI.bayer(x, y) >= dens) { comp.c[y][x] = null; comp.p[y][x] = null; }
    }
    // orphans: a fill pixel in the fade zone with at most one opaque 8-neighbour is a speck, not a gradient; one
    // on the arm's flank (outside its local half width) with at most one opaque 4-neighbour is a stray tail
    var orphans = [];
    zone.forEach(function (q) {
      var x = q[0], y = q[1];
      if (!comp.c[y][x] || comp.p[y][x] === 'edge') return;
      var n = 0, n4 = 0;
      for (var j = -1; j <= 1; j++) for (var i = -1; i <= 1; i++) {
        if (!(i || j) || !comp.c[y + j] || !comp.c[y + j][x + i]) continue;
        n++;
        if (!i || !j) n4++;
      }
      var cx = x + 0.5 - RX, cy = y + 0.5 - RY, t = cx * A.x + cy * A.y, v = cx * N.x + cy * N.y;
      if (n <= 1 || (n4 <= 1 && Math.abs(v) > halfWidth(Math.max(0, t), 99) - 0.6)) orphans.push(q);
    });
    orphans.forEach(function (q) { comp.c[q[1]][q[0]] = null; comp.p[q[1]][q[0]] = null; });
    // outline pixels in the fade zone go unless they border a fill pixel where the arm is still mostly solid
    var drop = [];
    zone.forEach(function (q) {
      var x = q[0], y = q[1];
      if (comp.p[y][x] !== 'edge') return;
      for (var j = -1; j <= 1; j++) for (var i = -1; i <= 1; i++) {
        var p = comp.p[y + j] && comp.p[y + j][x + i];
        if (!p || p === 'edge' || p === 'hedge') continue;
        var dd = densAt[(x + i) + ',' + (y + j)];
        if (dd === undefined || dd >= 0.7) return;
      }
      drop.push(q);
    });
    drop.forEach(function (q) { comp.c[q[1]][q[0]] = null; comp.p[q[1]][q[0]] = null; });
  }

  // Silhouette tidy after the composite: a 1px body pixel walled in by outline on three sides (a steel lip poking
  // past the thumb, say) becomes outline, and an outline pixel with no filled pixel round it (8-neighbourhood) goes,
  // so no black speck or 1px spike is left on the silhouette.
  function tidy(comp) {
    var fill = function (x, y) { var p = comp.p[y] && comp.p[y][x]; return !!p && p !== 'edge' && p !== 'hedge'; };
    var wall = function (x, y) { var p = comp.p[y] && comp.p[y][x]; return !p || p === 'edge' || p === 'hedge'; };
    var spurs = [];
    for (var y = 1; y < WG - 1; y++) for (var x = 1; x < WG - 1; x++) {
      if (!fill(x, y) || groupOf(comp.p[y][x]) !== 'body') continue;
      var nb = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]], f = nb.filter(function (q) { return fill(q[0], q[1]); });
      if (f.length !== 1) continue;
      var edges = nb.filter(function (q) { return comp.p[q[1]][q[0]] === 'edge'; }).length;
      if (edges === 3) spurs.push([x, y]);
    }
    spurs.forEach(function (q) { comp.c[q[1]][q[0]] = PAL.black; comp.p[q[1]][q[0]] = 'edge'; });
    var lone = [];
    for (y = 1; y < WG - 1; y++) for (x = 1; x < WG - 1; x++) {
      if (comp.p[y][x] !== 'edge') continue;
      var any = false;
      for (var j = -1; j <= 1 && !any; j++) for (var i = -1; i <= 1; i++) if ((i || j) && fill(x + i, y + j)) { any = true; break; }
      if (!any) lone.push([x, y]);
    }
    lone.forEach(function (q) { comp.c[q[1]][q[0]] = null; comp.p[q[1]][q[0]] = null; });
    void wall;
  }

  // ---------------------------------------------------------------------------
  // Frame assembly
  // ---------------------------------------------------------------------------
  function hammerPt(G, deg, sx, sy) {          // a hammer source point (edge coords) -> root-relative coords
    var r = HI.rot2(sx - HI.GRIP.x, sy - HI.GRIP.y, deg);
    return { x: G.x + r.x, y: G.y + r.y };
  }

  function buildPose(name, opts) {
    opts = opts || {};
    var pose = POSES[name];
    var arm = drawForearm(pose, opts.runes || pose.runes);
    var comp = layer();
    var W = arm.wrist, info = { wrist: W, runes: arm.runes, axis: arm.A };
    var art = pose.hand;
    var aw = pose.wrist || art.wrist;
    var hx = Math.round(W.x - aw.x), hy = Math.round(W.y - aw.y);
    // the catch hand is placed by its grip on the open hand's palm point, so the hammer that flew to the
    // palm is caught exactly there (zero pop between open and catch)
    if (pose.gripOnPalm && PALM_OPEN) { hx = PALM_OPEN.x - art.grip.x; hy = PALM_OPEN.y - art.grip.y; }
    var hl = layer(); hl.own = 'hand';
    stampRows(hl, art.rows, RX + hx, RY + hy, KEY, 'hand');
    info.handCenter = { x: hx + art.rows[0].length / 2, y: hy + art.rows.length / 2 };
    if (art.palm) info.palm = { x: hx + art.palm.x, y: hy + art.palm.y };
    var layers = { arm: arm.layer, hand: hl };
    if (pose.held) {
      var hamName = pose.held, deg = pose.heldDeg != null ? pose.heldDeg : HI.ANGLES[hamName] || 0;
      var G = { x: hx + art.grip.x, y: hy + art.grip.y };
      var hg = opts.charged ? chargedGrid(hamName) : pose.heldDeg != null ? HI.plainGrid(deg).g : HI.grids()[hamName];
      var hamL = layer(), N = HI.FRAME_N, ox = RX + G.x - HI.PIV, oy = RY + G.y - HI.PIV;
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
        var c = hg[y][x]; if (!c) continue;
        var X = ox + x, Y = oy + y; if (X < 0 || Y < 0 || X >= WG || Y >= WG) continue;
        hamL.c[Y][X] = c; hamL.p[Y][X] = c === PAL.black ? 'hedge' : 'ham';
      }
      layers.ham = hamL;
      info.grip = G;
      info.hammerOffset = { x: G.x - HI.PIV, y: G.y - HI.PIV };   // where Hammer.frames[hammerFrame] (0,0) sits
      info.hammerAngle = deg; info.hammerFrame = hamName;
      var HR = HI.HEAD_RECT;
      info.headCenter = hammerPt(G, deg, (HR.x0 + HR.x1) / 2, (HR.y0 + HR.y1) / 2);
      var a = HI.anchorsFor(deg, 1);
      info.headTop = { x: G.x + a.headTop.x - HI.PIV, y: G.y + a.headTop.y - HI.PIV };
      if (name === 'heldImpact' || name === 'heldSmear' || name === 'heldSide' || name === 'heldSideMid') info.strikeFace = hammerPt(G, deg, HI.FACE_R.x, HI.FACE_R.y);
      if (name === 'catch') info.palm = G;
    }
    var order = pose.order || ['arm', 'hand'];
    order.forEach(function (k, i) { stamp(comp, layers[k], i > 0); });
    outlineAll(comp);
    if (pose.sparks) catchSparks(comp, info.grip);
    fadeCut(comp, arm.A, arm.N);
    tidy(comp);
    return { comp: comp, info: info };
  }

  // The charged hammer for the glow pose: the rune burns white-hot and the current runs along the metal's edges:
  // the bevels, the rune plate's walls, the face bands and the ring of pixels next to the outline are palette-
  // swapped to the electric ramp (steel -> ice, iron -> sky, deep -> azure), while the head's front faces and its
  // engraved knots keep their steel greys, so it reads as electrified metal rather than a flat cyan block.
  var CHARGE_SWAP = {};
  CHARGE_SWAP[PAL.steel] = PAL.ice; CHARGE_SWAP[PAL.iron] = PAL.sky; CHARGE_SWAP[PAL.deep] = PAL.azure; CHARGE_SWAP[PAL.silver] = PAL.ice;
  var EDGE_CH = '78946123LRTtBef';
  function chargedGrid(name) {
    var deg = HI.ANGLES[name] || 0;
    var r = HI.plainGrid(deg, true), g = r.g, spec = HI.specAt || function () { return null; };
    var src = g.map(function (row) { return row.slice(); });
    var open = function (x, y) { var q = src[y] && src[y][x]; return !q || q === PAL.black; };
    for (var y = 0; y < g.length; y++) for (var x = 0; x < g[y].length; x++) {
      var id = r.ids[y][x], part = HI.partAt(id), c = g[y][x];
      if (part !== 'head' && part !== 'collar') continue;
      // the charged rune is the only ice / sky in a plain hammer (steel has neither): make it white-hot
      if (c === PAL.ice || c === PAL.sky) { g[y][x] = PAL.white; continue; }
      if (!CHARGE_SWAP[c]) continue;
      var sp = spec(id) || {}, edgeFacet = sp.frame || sp.rim || sp.line || (sp.ch && EDGE_CH.indexOf(sp.ch) >= 0);
      if (edgeFacet || open(x - 1, y) || open(x + 1, y) || open(x, y - 1) || open(x, y + 1)) g[y][x] = CHARGE_SWAP[c];
    }
    return g;
  }

  // The catch: up to 5 short rays burst from the contact point. Each starts on the transparent pixel next to the
  // hand's outline nearest the grip along its direction (4-connected to the outline) and runs 3-4px outward in
  // sky, then azure, then cobalt, so it reads as a burst from the contact, not as loose dashes.
  function catchSparks(comp, G) {
    var gx = RX + G.x, gy = RY + G.y;
    var dirs = [[1, -1], [1, 0], [1, 1], [0, -1], [-1, -1]];
    var made = 0;
    dirs.forEach(function (d, n) {
      if (made >= 5) return;
      var x = Math.round(gx), y = Math.round(gy), guard = 0;
      while (comp.c[y] && comp.c[y][x] && guard++ < 8) { x += d[0]; y += d[1]; }
      if (guard > 7 || !comp.c[y] || comp.c[y][x]) return;
      var touches = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(function (o) { var p = comp.p[y + o[1]] && comp.p[y + o[1]][x + o[0]]; return p === 'edge'; });
      if (!touches) return;
      var len = n % 2 ? 3 : 4, cols = [PAL.sky, PAL.sky, PAL.azure, PAL.cobalt];
      for (var i = 0; i < len; i++) {
        var X = x + d[0] * i, Y = y + d[1] * i;
        if (!comp.c[Y] || comp.c[Y][X]) break;
        comp.c[Y][X] = cols[Math.min(3, i + (len === 3 ? 1 : 0))]; comp.p[Y][X] = 'fx';
      }
      made++;
    });
  }

  // Charged pose: 1px electric outline around the hammer and fist (never the arm), crackle bolts that leave
  // that outline from the head.
  function electrify(comp, info, seed) {
    var ring = [];
    var outside = HI.exterior(comp.c);
    for (var y = 1; y < WG - 1; y++) for (var x = 1; x < WG - 1; x++) {
      if (comp.c[y][x] || !outside[y][x]) continue;
      var touch = comp.c[y - 1][x] || comp.c[y + 1][x] || comp.c[y][x - 1] || comp.c[y][x + 1];
      if (!touch) continue;
      // owner: nearest filled non-edge pixel within 2
      var best = null, bd = 99;
      for (var j = -2; j <= 2; j++) for (var i = -2; i <= 2; i++) {
        var p = comp.p[y + j] && comp.p[y + j][x + i];
        if (!p || p === 'edge' || p === 'hedge') continue;
        var dd = i * i + j * j; if (dd < bd) { bd = dd; best = p; }
      }
      if (best !== 'ham' && best !== 'hand') continue;
      var hc = { x: RX + info.headCenter.x, y: RY + info.headCenter.y };
      var nearHead = Math.abs(x + 0.5 - hc.x) < 17 && Math.abs(y + 0.5 - hc.y) < 11;
      ring.push([x, y, nearHead ? 'head' : best]);
    }
    var isRing = {};
    ring.forEach(function (q) {
      comp.c[q[1]][q[0]] = q[2] === 'head' ? PAL.sky : PAL.azure;
      comp.p[q[1]][q[0]] = 'glow';
      isRing[q[0] + ',' + q[1]] = 1;
    });
    var hc2 = { x: RX + info.headCenter.x, y: RY + info.headCenter.y };
    HI.crackle(comp.c, ring.filter(function (q) { return q[2] === 'head'; }), hc2, seed, 7, function (X, Y) { return !!isRing[X + ',' + Y]; });
  }

  // ---------------------------------------------------------------------------
  // Build everything once (art space), crop all frames to one shared box
  // ---------------------------------------------------------------------------
  var BUILT = null;
  var PALM_OPEN = null;
  function build() {
    if (BUILT) return BUILT;
    var raw = {};
    raw.open = buildPose('open');
    PALM_OPEN = raw.open.info.palm;
    raw.open0 = buildPose('open', { runes: 'dark' });
    raw.catch = buildPose('catch');
    raw.heldRaised = buildPose('heldRaised');
    raw.glowHeldRaised = buildPose('heldRaised', { charged: true, runes: 'glow' });
    electrify(raw.glowHeldRaised.comp, raw.glowHeldRaised.info, 11);
    raw.heldWindup = buildPose('heldWindup');
    raw.heldSwing = buildPose('heldSwing');
    raw.heldSmear = buildPose('heldSmear');
    raw.heldImpact = buildPose('heldImpact');
    raw.heldSide = buildPose('heldSide');
    raw.heldSideBack = buildPose('heldSideBack');
    raw.heldSideSwing = buildPose('heldSideSwing');
    raw.heldSideMid = buildPose('heldSideMid');
    // staged rune ignition: open with 1 and 2 studs lit
    raw.open1 = stagedRunes(raw.open, raw.open0, 1);
    raw.open2 = stagedRunes(raw.open, raw.open0, 2);

    // union bounds
    var x0 = WG, y0 = WG, x1 = -1, y1 = -1;
    Object.keys(raw).forEach(function (k) {
      var c = raw[k].comp.c;
      for (var y = 0; y < WG; y++) for (var x = 0; x < WG; x++) if (c[y][x]) {
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    });
    var M = 1;
    x0 = Math.min(x0 - M, RX - 1); y0 -= M; x1 += M; y1 += M;
    var w = x1 - x0 + 1, h = y1 - y0 + 1;
    var root = { x: RX - x0, y: RY - y0 };
    var grids = {}, anchors = {};
    Object.keys(raw).forEach(function (k) {
      var c = raw[k].comp.c, g = [];
      var bx0 = w, by0 = h, bx1 = -1, by1 = -1;
      for (var y = 0; y < h; y++) {
        var row = new Array(w);
        for (var x = 0; x < w; x++) {
          var col = c[y0 + y][x0 + x] || null;
          row[x] = col;
          if (col) { if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; }
        }
        g.push(row);
      }
      grids[k] = g;
      var inf = raw[k].info;
      var P = function (p) { return p ? { x: root.x + p.x, y: root.y + p.y } : null; };
      anchors[k] = {
        root: { x: root.x, y: root.y },
        wrist: P(inf.wrist),
        palm: P(inf.palm),
        grip: P(inf.grip),
        strikeFace: P(inf.strikeFace),
        headCenter: P(inf.headCenter),
        headTop: P(inf.headTop),
        hammerOffset: P(inf.hammerOffset),
        handCenter: P(inf.handCenter),
        fadeStart: { x: root.x + inf.axis.x * FADE, y: root.y + inf.axis.y * FADE },
        runes: (inf.runes || []).map(P),
        hammerAngle: inf.hammerAngle == null ? null : inf.hammerAngle,
        hammerFrame: inf.hammerFrame || null,
        bbox: { x: bx0, y: by0, w: bx1 - bx0 + 1, h: by1 - by0 + 1 }
      };
    });
    BUILT = { grids: grids, anchors: anchors, w: w, h: h, root: root };
    return BUILT;
  }
  function stagedRunes(lit, dark, n) {
    var comp = layer();
    for (var y = 0; y < WG; y++) for (var x = 0; x < WG; x++) { comp.c[y][x] = dark.comp.c[y][x]; comp.p[y][x] = dark.comp.p[y][x]; }
    lit.info.runes.slice(0, n).forEach(function (r) {
      var cx = Math.round(RX + r.x - 2.5), cy = Math.round(RY + r.y - 2.5);
      for (var j = 0; j < 5; j++) for (var i = 0; i < 5; i++) {
        var X = cx + i, Y = cy + j;
        if (lit.comp.p[Y][X] === 'rune') { comp.c[Y][X] = lit.comp.c[Y][X]; comp.p[Y][X] = 'rune'; }
      }
    });
    return { comp: comp, info: lit.info };
  }

  var MEMO = {};
  function scalePt(p, s) { return p ? { x: p.x * s, y: p.y * s } : null; }
  function create(scale) {
    var s = Math.max(1, Math.round(+scale || 1));
    if (MEMO[s]) return MEMO[s];
    var B = build();
    var frames = {}, anchors = {};
    Object.keys(B.grids).forEach(function (k) {
      // canvases are painted on first access, so a large create(k) only pays for the frames it uses
      var cv = null;
      Object.defineProperty(frames, k, { enumerable: true, get: function () { return cv || (cv = HI.toCanvas(B.grids[k], s)); } });
      var a = B.anchors[k];
      var ax = a.wrist.x - a.root.x, ay = a.wrist.y - a.root.y, al = Math.sqrt(ax * ax + ay * ay) || 1;
      anchors[k] = {
        root: scalePt(a.root, s), wrist: scalePt(a.wrist, s), palm: scalePt(a.palm, s), grip: scalePt(a.grip, s),
        strikeFace: scalePt(a.strikeFace, s), headCenter: scalePt(a.headCenter, s), headTop: scalePt(a.headTop, s),
        hammerOffset: scalePt(a.hammerOffset, s), handCenter: scalePt(a.handCenter, s), fadeStart: scalePt(a.fadeStart, s),
        runes: a.runes.map(function (r) { return scalePt(r, s); }),
        hammerAngle: a.hammerAngle, hammerFrame: a.hammerFrame,
        axis: { x: ax / al, y: ay / al },          // unit root -> wrist
        armLength: al * s,                          // root -> wrist distance in px
        bbox: { x: a.bbox.x * s, y: a.bbox.y * s, w: a.bbox.w * s, h: a.bbox.h * s }
      };
    });
    var out = {
      frames: frames,
      width: B.w * s,
      height: B.h * s,
      anchors: anchors,
      frameNames: FRAME_NAMES.concat(['open0', 'open1', 'open2']),
      scale: s,
      art: { w: B.w, h: B.h, root: { x: B.root.x, y: B.root.y }, fade: FADE, armBehind: 0 }
    };
    MEMO[s] = out;
    return out;
  }

  // Materialise / dissolve a frame: ordered dither (Bayer 4x4 in art pixels) growing out of the hand, with
  // an electric front and a few twinkle pixels. p: 0 = nothing, 1 = the whole frame (returned as is).
  //   opts: { scale (1), from ({x,y} art px at scale 1, default the hand centre), bias (0.35), edge (0.14),
  //           energy (true), sparks (5), seed }
  // Memoised per frame, scale and 1/32 step of p, so calling it every animation frame is cheap.
  var DMEMO = {}, DCOUNT = 0;   // capped: a new seed per strike must not grow it without bound
  function dither(name, p, opts) {
    opts = opts || {};
    var s = Math.max(1, Math.round(+opts.scale || 1));
    var q = Math.max(0, Math.min(32, Math.round((+p || 0) * 32)));
    var B = build(), g = B.grids[name];
    if (!g) throw new Error('hand-sprite: no frame ' + name);
    var key = name + '|' + q + '|' + s + '|' + (opts.seed || 1) + '|' + (opts.energy === false ? 0 : 1) + '|' + (opts.from ? opts.from.x + ',' + opts.from.y : '') + '|' + [opts.bias, opts.edge, opts.sparks].join(',');
    if (DMEMO[key]) return DMEMO[key];
    var from = opts.from || B.anchors[name].handCenter || B.root;
    var dg = HI.ditherGrid(g, q / 32, { from: from, bias: opts.bias != null ? opts.bias : 0.35, edge: opts.edge, energy: opts.energy, sparks: opts.sparks, seed: opts.seed });
    var cv = HI.toCanvas(dg, s);
    if (++DCOUNT > 600) { DMEMO = {}; DCOUNT = 1; }
    DMEMO[key] = cv;
    return cv;
  }

  NS.Hand = {
    create: create,
    dither: dither,
    frameNames: FRAME_NAMES,
    poses: POSES,
    fade: FADE,
    _debug: {
      build: build,
      ditherGrid: function (name, p, opts) { var B = build(); opts = opts || {}; return HI.ditherGrid(B.grids[name], p, { from: opts.from || B.anchors[name].handCenter, bias: opts.bias != null ? opts.bias : 0.35, seed: opts.seed }); },
      reset: function () { BUILT = null; MEMO = {}; DMEMO = {}; DCOUNT = 0; }
    }
  };
})();


/*
 * audio.js : engine.Audio (v3)
 * Fully synthesized soundscape for the Mjolnir summoning link opener. WebAudio only, zero
 * audio files, zero network. Every voice is built from cached noise buffers, oscillators,
 * filters and JS-computed envelope curves, then routed:
 *
 *   voice.out ─► duck ─► master (0.5) ─► highpass 30 Hz ─► DynamicsCompressor (limiter) ─► trim ─► safety clip ─► out
 *        └─ send ─► convolver ("open sky" IR) ─► verbOut ─► duck
 *   bigThunder.out, charge.out ─► master   (bypass the duck bus: bigThunder pushes everything else down 6 dB,
 *                                          charge opens the vacuum under itself before its hard cut)
 *
 * The duck bus does two jobs: bigThunder() dips every other cue by 6 dB while it rolls, and
 * charge() opens a 120 ms VACUUM after its hard cut (everything else is sucked to -34 dB, starting 20 ms
 * before the cut so the v3 sky bolt's rolling thunder is already gone) so the impact crack lands on
 * silence. A crack that lands inside the vacuum ends it early; one before it (the sky bolt's) does not.
 * The safety clip is a WaveShaper that is the identity below 0.9 and saturates to 0.968, so
 * no stack of cues can ever reach 1.0 full scale (in practice the limiter keeps peaks ~ -4.5 dB).
 *
 * The same graph builder runs on an OfflineAudioContext (renderOffline), so the beat-sheet cue
 * schedule can be rendered to WAV for the capture video and levels can be checked headless.
 *
 * Contract v1: unlock(), whoosh(), crack(), thunder(), crackle(ms), sizzle(ms), rumble(ms),
 *              setMuted(bool), isMuted().
 * Contract v2: summon(), hammerFly(ms), catchClang(), charge(ms), bigThunder().
 * Contract v3: materialize(ms), dematerialize(ms) (the arm resolving out of / dissolving into thin air;
 *              the v2 portal cues are gone).
 * Every sound takes (ms, options) (ms is ignored by fixed-length sounds; an object passed as the
 * first argument is read as options). Options, all optional:
 *   delayMs  schedule ahead (0..5000)            gainDb   per-cue level trim (-40..+6)
 *   side     +1 / -1, the beat sheet's s: +1 = the arm's cut end on the left, hammer arrives from the right
 *   pan      materialize / dematerialize only: -1..1, where the hand is on screen
 *   vacuumMs charge only: silence after the cut (default 120, 0 disables)
 * Extras: play(name, ms, o), cut(name?, fadeMs?), prewarm(), state(), NAMES, CUES, renderOffline(),
 * toWav(), _seed(). bigThunder's maths is precomputed in idle time after unlock() (prewarm), so
 * the call on the impact frame only wires nodes.
 * Every public call is wrapped: muted / no context / not running => silent no-op, never throws.
 */
(function () {
  'use strict';

  var G = typeof window !== 'undefined' ? window : globalThis;
  var NS = ENGINE;

  var AC = G.AudioContext || G.webkitAudioContext;
  var OAC = G.OfflineAudioContext || G.webkitOfflineAudioContext;

  var MASTER = 0.5;        // master gain
  var TRIM = 0.7;          // cancels the compressor's automatic makeup gain (measured +3.1 dB)
  var LEAD = 0.008;        // seconds of scheduling lead so envelopes start sample-accurate
  var MAX_VOICES = 28;     // hard cap on concurrent voices (engine spam guard)
  var START_GRACE = 220;   // ms after unlock() during which a still-starting context may queue
  var IDLE_SUSPEND = 6000; // ms of silence before the live context is suspended (battery)
  var TAU = Math.PI * 2;

  /* ---------- tiny math kit ---------- */
  var rand = Math.random;
  function seedRng(n) {
    var a = n >>> 0;
    rand = function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rr(a, b) { return a + (b - a) * rand(); }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function smooth(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
  // thunder roll shape: quick gaussian swell, then a natural exponential (reverberant) decay
  function bump(t, c, w) {
    if (t < c) { var d = (t - c) / (w * 0.55); return Math.exp(-d * d); }
    return Math.exp(-(t - c) / (w * 1.5));
  }
  // percussive hit: power-law attack over `a` seconds, exponential decay with time constant tau
  function hit(t, a, tau) { return t < a ? Math.pow(t / a, 1.5) : Math.exp(-(t - a) / tau); }
  // smooth value noise in [0,1] at `rate` Hz over `dur` seconds
  function vnoise(dur, rate) {
    var n = Math.ceil(dur * rate) + 3, p = new Float32Array(n), i;
    for (i = 0; i < n; i++) p[i] = rand();
    return function (t) {
      var x = Math.max(0, t) * rate, k = Math.min(Math.floor(x), n - 2), f = x - k;
      f = f * f * (3 - 2 * f);
      return p[k] + (p[k + 1] - p[k]) * f;
    };
  }
  // running integral of fn over [0, D] (phase of a swept LFO, in cycles)
  function integ(fn, D, N) {
    var dt = D / N, acc = new Float32Array(N + 1), i;
    for (i = 1; i <= N; i++) acc[i] = acc[i - 1] + fn((i - 0.5) * dt) * dt;
    return function (t) {
      var x = clamp(t / dt, 0, N), k = Math.min(N - 1, Math.floor(x));
      return acc[k] + (acc[k + 1] - acc[k]) * (x - k);
    };
  }
  function num(ms, def, lo, hi) {
    ms = +ms;
    if (!isFinite(ms) || ms <= 0) ms = def;
    return clamp(ms, lo, hi) / 1000;
  }
  function optNum(o, k, def, lo, hi) {
    var x = o && typeof o === 'object' ? o[k] : undefined;
    return typeof x === 'number' && isFinite(x) ? clamp(x, lo, hi) : def;
  }
  function sideOf(o) { return o && typeof o === 'object' && o.side < 0 ? -1 : 1; }

  /* ---------- per-context environment (live or offline) ---------- */
  function buildEnv(ctx, raw) {
    var E = { ctx: ctx, live: [], vacUntil: 0, cur: '', kits: {} }; // live: scheduled voices (cap, cut)
    var sr = ctx.sampleRate, i;

    E.master = ctx.createGain();
    E.master.gain.value = MASTER;
    E.duck = ctx.createGain(); // every cue but bigThunder; automated by duckTo()
    E.duck.gain.value = 1;
    E.duck.connect(E.master);
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -6;
    comp.knee.value = 2;
    comp.ratio.value = 20;
    comp.attack.value = 0.001;
    comp.release.value = 0.12;
    // sub-sonic cleanup: nothing below ~30 Hz is audible, but it would eat limiter headroom
    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 30;
    hp.Q.value = 0.7;
    var trim = ctx.createGain();
    trim.gain.value = raw ? 1 : TRIM;
    E.master.connect(hp);
    hp.connect(raw ? trim : comp); // raw: analysis only, bypasses limiter and safety clip
    if (raw) trim.connect(ctx.destination);
    else {
      comp.connect(trim);
      // safety clip: identity below 0.9, tanh knee above, hard ceiling 0.968 (never 1.0)
      var sc0 = new Float32Array(2048), K = 0.9, H = 0.08;
      for (i = 0; i < 2048; i++) {
        var x0 = (i / 2047) * 2 - 1, a0 = Math.abs(x0), y0 = a0 <= K ? a0 : K + H * Math.tanh((a0 - K) / H);
        sc0[i] = x0 < 0 ? -y0 : y0;
      }
      var safety = ctx.createWaveShaper();
      safety.curve = sc0;
      safety.oversample = 'none'; // 'none' keeps the output strictly inside the curve's range
      trim.connect(safety);
      safety.connect(ctx.destination);
    }
    E.comp = comp;

    // white noise, 2 s mono
    var wn = Math.floor(sr * 2), white = ctx.createBuffer(1, wn, sr), w = white.getChannelData(0);
    for (i = 0; i < wn; i++) w[i] = rand() * 2 - 1;
    E.white = white;

    // brown noise, 4 s mono, leaky-integrated and peak normalized
    var bn = Math.floor(sr * 4), brown = ctx.createBuffer(1, bn, sr), b = brown.getChannelData(0);
    var acc = 0, pk = 0;
    for (i = 0; i < bn; i++) {
      acc = (acc + 0.02 * (rand() * 2 - 1)) / 1.02;
      b[i] = acc;
      if (Math.abs(acc) > pk) pk = Math.abs(acc);
    }
    for (i = 0; i < bn; i++) b[i] /= pk || 1;
    E.brown = brown;

    // soft saturation curve (adds audible harmonics to sub layers on laptop speakers)
    var sc = new Float32Array(1024), k = 2.2, th = Math.tanh(k);
    for (i = 0; i < 1024; i++) { var x = (i / 1023) * 2 - 1; sc[i] = Math.tanh(k * x) / th; }
    E.curve = sc;

    // "open sky" impulse response: pre-delay, two mountain slaps, darkening exponential tail
    try {
      var irLen = Math.floor(sr * 1.1), ir = ctx.createBuffer(2, irLen, sr);
      for (var ch = 0; ch < 2; ch++) {
        var d = ir.getChannelData(ch), y = 0, pre = Math.floor(sr * (0.012 + ch * 0.004));
        for (i = pre; i < irLen; i++) {
          var t = (i - pre) / sr, a = 0.7 - 0.55 * Math.min(1, t / 0.9);
          y += a * ((rand() * 2 - 1) - y);
          d[i] = y * Math.exp(-t / 0.2);
        }
        var s1 = Math.floor(sr * rr(0.06, 0.08)), s2 = Math.floor(sr * rr(0.11, 0.15));
        for (i = 0; i < 400; i++) {
          if (s1 + i < irLen) d[s1 + i] += (rand() * 2 - 1) * 0.5 * Math.exp(-i / 90);
          if (s2 + i < irLen) d[s2 + i] += (rand() * 2 - 1) * 0.3 * Math.exp(-i / 120);
        }
      }
      var conv = ctx.createConvolver();
      conv.normalize = true;
      conv.buffer = ir;
      var vOut = ctx.createGain();
      vOut.gain.value = 0.55;
      conv.connect(vOut);
      vOut.connect(E.duck);
      E.verbIn = conv;
    } catch (e) {
      E.verbIn = null;
    }
    return E;
  }

  // Duck-bus automation. Each call cancels later events and always ends with a restore to 1,
  // so overlapping calls can never leave the bus stuck low.
  function duckTo(E, at, level, tauIn, until, tauOut) {
    try {
      var g = E.duck.gain;
      g.cancelScheduledValues(at);
      g.setTargetAtTime(level, at, tauIn);
      g.setTargetAtTime(1, Math.max(at, until), tauOut);
    } catch (e) {}
  }
  // Only a crack that lands inside the vacuum ends it early. A crack before the vacuum opens (the v3 sky
  // bolt's crack lands mid-charge) must leave it scheduled: cancelling from `at` would wipe the vacuum
  // too, and the impact crack would then land on the charge tail and the sky bolt's thunder. (A skip
  // calls cut() first, which already releases the duck bus.)
  function cancelVacuum(E, at) {
    if (!(E.vacUntil > at) || at < (E.vacFrom || 0) - 0.002) return;
    E.vacUntil = 0;
    try {
      var g = E.duck.gain;
      g.cancelScheduledValues(at);
      g.setTargetAtTime(1, at, 0.002);
    } catch (e) {}
  }

  /* ---------- voice + node helpers ---------- */
  function voice(E, t0, dur, send, o, direct) {
    var ctx = E.ctx;
    var v = { E: E, ctx: ctx, name: E.cur, t0: t0, end: t0 + dur, dur: dur, nodes: [], srcs: [] };
    v.out = ctx.createGain();
    v.out.gain.value = Math.pow(10, optNum(o, 'gainDb', 0, -40, 6) / 20);
    v.out.connect(direct ? E.master : E.duck);
    v.nodes.push(v.out);
    if (send && E.verbIn) {
      var s = ctx.createGain();
      s.gain.value = send;
      v.out.connect(s);
      s.connect(E.verbIn);
      v.nodes.push(s);
    }
    E.live.push(v);
    return v;
  }
  function finish(v) {
    var done = false;
    function cleanup() {
      if (done) return;
      done = true;
      for (var i = 0; i < v.nodes.length; i++) { try { v.nodes[i].disconnect(); } catch (e) {} }
      v.nodes.length = 0;
      v.srcs.length = 0;
    }
    // tear down only after EVERY source has ended (short buffers end before the voice does)
    var left = v.srcs.length;
    if (!left) return cleanup();
    v.srcs.forEach(function (s) { s.onended = function () { if (--left <= 0) cleanup(); }; });
  }
  function track(v, n) { v.nodes.push(n); return n; }
  function gainN(v, val) { var g = track(v, v.ctx.createGain()); if (val != null) g.gain.value = val; return g; }
  function filt(v, type, f, q) {
    var b = track(v, v.ctx.createBiquadFilter());
    b.type = type;
    if (f != null) b.frequency.value = f;
    if (q != null) b.Q.value = q;
    return b;
  }
  function pan(v, p) {
    if (!v.ctx.createStereoPanner) return gainN(v, 1);
    var n = track(v, v.ctx.createStereoPanner());
    if (p != null) n.pan.value = clamp(p, -1, 1); // pass null when the pan will be automated
    return n;
  }
  function shaper(v) {
    var s = track(v, v.ctx.createWaveShaper());
    s.curve = v.E.curve;
    s.oversample = '2x';
    return s;
  }
  function noiseSrc(v, buf) {
    var s = track(v, v.ctx.createBufferSource());
    s.buffer = buf;
    var room = buf.duration - v.dur - 0.02;
    if (room > 0) s.start(v.t0, rand() * room);
    else { s.loop = true; s.start(v.t0); }
    s.stop(v.end);
    v.srcs.push(s);
    return s;
  }
  function bufSrc(v, buf) {
    var s = track(v, v.ctx.createBufferSource());
    s.buffer = buf;
    s.start(v.t0);
    s.stop(v.end);
    v.srcs.push(s);
    return s;
  }
  function osc(v, type) {
    var o = track(v, v.ctx.createOscillator());
    o.type = type;
    o.start(v.t0);
    o.stop(v.end);
    v.srcs.push(o);
    return o;
  }
  function chain() {
    for (var i = 0; i < arguments.length - 1; i++) arguments[i].connect(arguments[i + 1]);
    return arguments[arguments.length - 1];
  }
  // Drive an AudioParam with a JS function of local time t (seconds). 1 point per ms for short
  // sounds (sharp attacks), 1 per 4 ms for long ones (keeps thunder's build cost ~1 ms).
  // `fn` may also be a curve precomputed by curve() for the same duration.
  function curve(dur, fn) {
    var pps = dur > 0.5 ? 250 : 1000;
    var n = clamp(Math.ceil(dur * pps) + 1, 2, 4000), c = new Float32Array(n), i;
    for (i = 0; i < n; i++) c[i] = fn((dur * i) / (n - 1));
    return c;
  }
  function env(param, t0, dur, fn) {
    var c = typeof fn === 'function' ? curve(dur, fn) : fn, n = c.length, i;
    try {
      param.setValueCurveAtTime(c, t0, dur);
    } catch (e) {
      try {
        param.setValueAtTime(c[0], t0);
        for (i = 4; i < n; i += 4) param.linearRampToValueAtTime(c[i], t0 + (dur * i) / (n - 1));
        param.linearRampToValueAtTime(c[n - 1], t0 + dur);
      } catch (e2) {}
    }
  }
  // Sample-accurate percussive gain event: 0 -> a over atk seconds, then exponential release.
  function strike(g, at, a, atk, tau) {
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(a, at + atk);
    g.gain.setTargetAtTime(0, at + atk, tau);
  }
  // Glassy inharmonic ping (rune studs igniting): 4 sine partials, highs die first.
  function ping(v, at, f, amp, p) {
    var R = [1, 2.0, 2.76, 4.07], A = [1, 0.35, 0.28, 0.1], T = [0.2, 0.1, 0.06, 0.03];
    var pn = pan(v, p);
    pn.connect(v.out);
    for (var i = 0; i < 4; i++) {
      var o = osc(v, 'sine'), g = gainN(v, 0);
      o.frequency.value = f * R[i];
      strike(g, at, amp * A[i], 0.0015, T[i]);
      chain(o, g, pn);
    }
  }

  /* Procedural crackle buffer: Poisson-spaced clicks and pitched zaps, each panned.
     o.rate (events/s) or o.rateFn(t) for a time-varying density; o.env(t) gates amplitude. */
  function crackleBuf(ctx, dur, o) {
    var sr = ctx.sampleRate, len = Math.max(1, Math.ceil(dur * sr));
    var buf = ctx.createBuffer(2, len, sr), L = buf.getChannelData(0), R = buf.getChannelData(1);
    var rate0 = o.rateFn ? Math.max(1, o.rateFn(0)) : o.rate;
    var t = o.first != null ? o.first : rr(0, 1 / rate0), i;
    function put(s0, n, amp, zap, f) {
      var p = rr(-o.width, o.width), gl = Math.cos(((p + 1) * Math.PI) / 4), gr = Math.sin(((p + 1) * Math.PI) / 4);
      var tau = n / (zap ? 3.2 : 4), ph = 0, f1 = f * rr(0.45, 0.8);
      for (i = 0; i < n && s0 + i < len; i++) {
        var x;
        if (zap) {
          ph += (f + (f1 - f) * (i / n)) / sr;
          x = ((ph % 1) < 0.5 ? 0.65 : -0.65) + (rand() * 2 - 1) * 0.35;
        } else {
          x = i === 0 ? (rand() < 0.5 ? 1 : -1) : rand() * 2 - 1;
        }
        x *= amp * Math.exp(-i / tau);
        L[s0 + i] += x * gl;
        R[s0 + i] += x * gr;
      }
    }
    var guard = 0;
    while (t < dur && guard++ < 20000) {
      var e = o.env ? o.env(t) : 1;
      if (e > 0.02) {
        var s0 = Math.floor(t * sr), amp = rr(o.amin, o.amax) * e;
        if (rand() < o.zap) put(s0, Math.floor(rr(o.zmin, o.zmax) * sr), amp * 0.7, true, rr(o.fmin, o.fmax));
        else {
          put(s0, Math.max(8, Math.floor(rr(o.cmin, o.cmax) * sr)), amp, false, 0);
          if (o.dbl && rand() < o.dbl) put(s0 + Math.floor(rr(0.003, 0.012) * sr), Math.max(8, Math.floor(rr(o.cmin, o.cmax) * sr)), amp * rr(0.3, 0.7), false, 0);
        }
      }
      var rate = o.rateFn ? Math.max(1, o.rateFn(t)) : o.rate;
      t += -Math.log(1 - rand() * 0.999) / rate;
    }
    return buf;
  }

  /* The crackle and sizzle buffers, cached per context in 20ms duration buckets (two takes each, alternated),
     so a cue only wires nodes; the durations the link opener uses are built in idle time after unlock. */
  var CRK = {
    crackle: function (ctx, D) {
      return crackleBuf(ctx, D + 0.03, {
        rate: 30, first: 0.002, amin: 0.35, amax: 1, zap: 0.45, fmin: 1600, fmax: 5200,
        zmin: 0.006, zmax: 0.026, cmin: 0.0008, cmax: 0.004, width: 0.8,
        env: function (t) { return t > D ? 0 : 1 - 0.6 * smooth(D * 0.6, D, t); }
      });
    },
    sizzle: function (ctx, D) {
      var bed = function (t) { return smooth(0, 0.06, t) * (1 - smooth(D * 0.5, D, t)); };
      return crackleBuf(ctx, D, {
        rate: 24, first: rr(0.01, 0.04), amin: 0.25, amax: 1, zap: 0.12, fmin: 700, fmax: 2400,
        zmin: 0.003, zmax: 0.008, cmin: 0.0006, cmax: 0.005, dbl: 0.3, width: 0.9, env: bed
      });
    }
  };
  function crkBuf(E, kind, D) {
    var q = Math.max(1, Math.round(D * 50)), Dq = q / 50, key = kind + q;
    var c = E.crk || (E.crk = {}), e = c[key];
    if (!e) e = c[key] = { b: [], n: 0 };
    if (e.b.length < 2) { var b = CRK[kind](E.ctx, Dq); e.b.push(b); return b; }
    return e.b[(e.n++) & 1];
  }
  var CRK_WARM = [['crackle', 0.08], ['crackle', 0.14], ['crackle', 0.22], ['crackle', 0.25], ['crackle', 0.32], ['crackle', 0.36], ['crackle', 0.4], ['crackle', 0.88], ['sizzle', 1.4]];

  /* bigThunder's precomputed kit: 5 irregular re-swells (alternating sides, 25% flipped) plus 3
     random stutters, and every curve / crackle buffer that depends on them. ~2-3 ms of maths,
     so it runs in idle time (prewarm), never on the impact frame. */
  function prepBigThunder(ctx) {
    var D = 2.6, K = { D: D }, first = rand() < 0.5 ? -1 : 1;
    var R = [
      { c: rr(0.3, 0.38), a: rr(0.55, 0.68), w: rr(0.06, 0.08) },
      { c: rr(0.64, 0.76), a: rr(0.86, 1.0), w: rr(0.09, 0.12) },
      { c: rr(1.02, 1.16), a: rr(0.45, 0.6), w: rr(0.11, 0.15) },
      { c: rr(1.38, 1.52), a: rr(0.3, 0.42), w: rr(0.14, 0.18) },
      { c: rr(1.74, 1.9), a: rr(0.16, 0.24), w: rr(0.18, 0.22) }
    ];
    R.forEach(function (r, i) { r.side = (i % 2 ? -first : first) * (rand() < 0.25 ? -1 : 1); });
    for (var j = 0; j < 3; j++) R.push({ c: rr(0.45, 1.8), a: rr(0.15, 0.3), w: rr(0.04, 0.07), side: rand() < 0.5 ? -1 : 1 });
    var endFade = function (t) { return 1 - smooth(2.0, D - 0.01, t); };
    var rollSum = function (t, side) {
      for (var s = 0, i = 0; i < R.length; i++) {
        s += R[i].a * (side == null || R[i].side === side ? 1 : 0.45) * bump(t, R[i].c, R[i].w);
      }
      return s;
    };
    K.rip = crackleBuf(ctx, 0.36, {
      rate: 240, first: 0, amin: 0.35, amax: 1, zap: 0.3, fmin: 700, fmax: 3600,
      zmin: 0.004, zmax: 0.014, cmin: 0.001, cmax: 0.005, dbl: 0.35, width: 0.85,
      env: function (t) { return Math.exp(-t / 0.09); }
    });
    K.f0 = rr(70, 78);
    K.f1 = rr(42, 46);
    K.boom = curve(D, function (t) { return (1.0 * hit(t, 0.014, 0.26) + 0.42 * rollSum(t)) * endFade(t); });
    K.body = [-1, 1].map(function (side) {
      var m = vnoise(D, rr(15, 22)), m2 = vnoise(D, rr(3, 5));
      return {
        side: side,
        lp: curve(D, function (t) { return 200 + 1500 * Math.exp(-t / 0.22) + 1100 * rollSum(t, side); }),
        g: curve(D, function (t) {
          return 1.3 * (hit(t, 0.03, 0.14) + rollSum(t, side)) * (0.5 + 0.5 * m(t)) * (0.8 + 0.2 * m2(t)) * endFade(t);
        })
      };
    });
    var mg = vnoise(D, 30);
    K.grit = curve(D, function (t) { return 3.6 * (hit(t, 0.02, 0.14) + 0.9 * rollSum(t)) * (0.35 + 0.65 * mg(t)) * endFade(t); });
    K.rat = crackleBuf(ctx, D, {
      rateFn: function (t) { return 10 + 90 * (hit(t, 0.02, 0.3) + rollSum(t)); },
      first: 0.05, amin: 0.2, amax: 0.8, zap: 0.15, fmin: 300, fmax: 900,
      zmin: 0.006, zmax: 0.02, cmin: 0.002, cmax: 0.008, dbl: 0.4, width: 0.9,
      env: function (t) { return Math.min(1, hit(t, 0.02, 0.3) + rollSum(t)) * endFade(t); }
    });
    // echo claps: a dull, distant re-crack on the front of the first three re-swells (the strike
    // slapping back off hills), so the rolls are articulated, not just louder
    var on = [0, 1, 2].map(function (i) { return R[i].c - R[i].w * 0.6; });
    K.clap = curve(D, function (t) {
      for (var s = 0, i = 0; i < 3; i++) {
        var d = t - on[i];
        if (d > 0) s += R[i].a * (1 - Math.exp(-d / 0.004)) * Math.exp(-d / (0.035 + 0.015 * i));
      }
      return 0.55 * s;
    });
    K.clapPan = curve(D, function (t) { return 0.5 * (t < on[1] ? R[0].side : t < on[2] ? R[1].side : R[2].side); });
    K.tail = curve(D, function (t) { return 1.0 * (1 - Math.exp(-t / 0.15)) * Math.exp(-t / 0.85) * endFade(t); });
    return K;
  }

  /* ---------- the sounds. Signature: (E, t0 seconds, durationSeconds|undefined, options) ---------- */
  var SOUNDS = {
    // Air displacement: rising bandpass noise sweep, crest at ~310 ms, brakes by 380 ms.
    whoosh: function (E, t0, _, o) {
      var side = sideOf(o), D = 0.38, PK = 0.31;
      var v = voice(E, t0, D, 0.12, o);
      var shape = function (t) {
        return t < PK ? Math.pow(t / PK, 2.4) : Math.pow(Math.max(0, 1 - (t - PK) / (D - PK - 0.004)), 2);
      };
      var fr = function (t) { return 240 * Math.pow(10, Math.min(1, t / (PK + 0.02))); };
      var n1 = noiseSrc(v, E.white), bp1 = filt(v, 'bandpass', null, 1.3), g1 = gainN(v), p1 = pan(v, null);
      env(bp1.frequency, t0, D, fr);
      env(g1.gain, t0, D, function (t) { return 0.6 * shape(t); });
      if (p1.pan) env(p1.pan, t0, D, function (t) { return -0.3 * side * (1 - Math.min(1, t / PK)); });
      chain(n1, bp1, g1, p1, v.out);
      var n2 = noiseSrc(v, E.white), bp2 = filt(v, 'bandpass', null, 6), g2 = gainN(v);
      env(bp2.frequency, t0, D, function (t) { return 1.7 * fr(t); });
      env(g2.gain, t0, D, function (t) { return 0.44 * shape(t); });
      chain(n2, bp2, g2, v.out);
      var n3 = noiseSrc(v, E.brown), lp3 = filt(v, 'lowpass', null, 0.7), g3 = gainN(v);
      env(lp3.frequency, t0, D, function (t) { return 260 + 520 * shape(t); });
      env(g3.gain, t0, D, function (t) { return 0.26 * shape(t); });
      chain(n3, lp3, g3, v.out);
      finish(v);
    },

    // The strike: bright 1 ms transient, electric fizz, pitched snap, punchy thwack. ~260 ms.
    crack: function (E, t0, _, o) {
      cancelVacuum(E, t0); // a skip-ahead crack must never land inside charge()'s vacuum
      var D = 0.26, v = voice(E, t0, D, 0.42, o);
      var atk = function (t, a) { return t < a ? t / a : 1; };
      var n1 = noiseSrc(v, E.white), hp = filt(v, 'highpass', 1100, 0.7), g1 = gainN(v);
      env(g1.gain, t0, D, function (t) {
        return atk(t, 0.0012) * (1.0 * Math.exp(-Math.max(0, t - 0.0012) / 0.026) + 0.22 * Math.exp(-t / 0.085));
      });
      chain(n1, hp, g1, v.out);
      var fl = vnoise(D, 140);
      var n2 = noiseSrc(v, E.white), bp = filt(v, 'bandpass', 5200, 1.1), g2 = gainN(v);
      env(g2.gain, t0, D, function (t) { return 0.55 * atk(t, 0.002) * Math.exp(-t / 0.07) * (0.3 + 0.7 * fl(t)); });
      chain(n2, bp, g2, v.out);
      var o1 = osc(v, 'square'), lp = filt(v, 'lowpass', 4200, 0.7), g3 = gainN(v);
      o1.frequency.setValueAtTime(2600, t0);
      o1.frequency.exponentialRampToValueAtTime(150, t0 + 0.07);
      env(g3.gain, t0, D, function (t) { return 0.26 * atk(t, 0.0008) * Math.exp(-t / 0.02); });
      chain(o1, lp, g3, v.out);
      var o2 = osc(v, 'sine'), g4 = gainN(v);
      o2.frequency.setValueAtTime(190, t0);
      o2.frequency.exponentialRampToValueAtTime(52, t0 + 0.12);
      env(g4.gain, t0, D, function (t) { return 0.8 * atk(t, 0.002) * Math.exp(-t / 0.06); });
      chain(o2, g4, shaper(v), gainN(v, 0.7), v.out);
      finish(v);
    },

    // v1 thunder (kept for backward compatibility): rip, 40-60 Hz sub thump, rolling stereo
    // body with 3 randomized re-swells, mid grit, sub tail. 1.6 s, silent at the end.
    thunder: function (E, t0, _, o) {
      var D = 1.6, v = voice(E, t0, D + 0.01, 0.3, o);
      var rolls = [
        { c: rr(0.2, 0.28), a: rr(0.4, 0.55), w: rr(0.06, 0.09) },
        { c: rr(0.64, 0.74), a: rr(0.62, 0.8), w: rr(0.1, 0.14) },
        { c: rr(0.92, 1.06), a: rr(0.3, 0.42), w: rr(0.14, 0.18) }
      ];
      rolls.forEach(function (r) { r.side = rand() < 0.5 ? -1 : 1; });
      var endFade = function (t) { return 1 - smooth(1.3, D - 0.01, t); };
      var rollSum = function (t, side) {
        for (var s = 0, i = 0; i < rolls.length; i++) {
          var r = rolls[i];
          s += r.a * (side == null || r.side === side ? 1 : 0.45) * bump(t, r.c, r.w);
        }
        return s;
      };
      var rip = bufSrc(v, crackleBuf(v.ctx, 0.24, {
        rate: 170, first: 0, amin: 0.3, amax: 1, zap: 0.25, fmin: 900, fmax: 3200,
        zmin: 0.004, zmax: 0.012, cmin: 0.001, cmax: 0.004, width: 0.75,
        env: function (t) { return Math.exp(-t / 0.07); }
      }));
      chain(rip, filt(v, 'bandpass', 1500, 0.6), gainN(v, 0.55), v.out);
      var sub = osc(v, 'sine'), sg = gainN(v);
      sub.frequency.setValueAtTime(rr(64, 74), t0);
      sub.frequency.exponentialRampToValueAtTime(rr(41, 46), t0 + 0.45);
      env(sg.gain, t0, D, function (t) { return (0.95 * hit(t, 0.012, 0.26) + 0.35 * rollSum(t)) * endFade(t); });
      chain(sub, sg, shaper(v), filt(v, 'lowpass', 320, 0.7), gainN(v, 0.85), v.out);
      [-1, 1].forEach(function (side) {
        var n = noiseSrc(v, E.brown), lp = filt(v, 'lowpass', null, 0.5), g = gainN(v), m = vnoise(D, rr(14, 20));
        env(lp.frequency, t0, D, function (t) { return 250 + 1000 * Math.exp(-t / 0.3) + 650 * rollSum(t, side); });
        env(g.gain, t0, D, function (t) {
          return 1.5 * (hit(t, 0.04, 0.17) + 1.0 * rollSum(t, side)) * (0.6 + 0.4 * m(t)) * endFade(t);
        });
        chain(n, lp, g, pan(v, side * 0.55), v.out);
      });
      var m2 = vnoise(D, 34), n4 = noiseSrc(v, E.brown), g4 = gainN(v);
      env(g4.gain, t0, D, function (t) {
        return 4.0 * (hit(t, 0.02, 0.16) + 0.9 * rollSum(t)) * (0.35 + 0.65 * m2(t)) * endFade(t);
      });
      chain(n4, filt(v, 'bandpass', 330, 0.75), g4, v.out);
      var n5 = noiseSrc(v, E.brown), g5 = gainN(v);
      env(g5.gain, t0, D, function (t) { return 1.6 * (1 - Math.exp(-t / 0.12)) * Math.exp(-t / 0.45) * endFade(t); });
      chain(n5, filt(v, 'lowpass', 110, 0.7), g5, v.out);
      finish(v);
    },

    // Sparse electrical clicks and zaps. First tick lands 2 ms in (click feedback).
    crackle: function (E, t0, D, o) {
      var v = voice(E, t0, D + 0.04, 0.1, o);
      var b = crkBuf(E, 'crackle', D);
      chain(bufSrc(v, b), filt(v, 'highpass', 700, 0.7), gainN(v, 0.6), v.out);
      finish(v);
    },

    // Burning: fluttering high hiss, wood-pop crackle, low flame roar. Fades out by the end.
    sizzle: function (E, t0, D, o) {
      var v = voice(E, t0, D, 0.08, o);
      var bed = function (t) { return smooth(0, 0.06, t) * (1 - smooth(D * 0.5, D, t)); };
      var f1 = vnoise(D, 26), f2 = vnoise(D, 5);
      var n1 = noiseSrc(v, E.white), g1 = gainN(v);
      env(g1.gain, t0, D, function (t) { return 0.36 * bed(t) * (0.45 + 0.55 * f1(t)); });
      chain(n1, filt(v, 'highpass', 2800, 0.7), filt(v, 'bandpass', 6500, 0.55), g1, v.out);
      var pops = crkBuf(E, 'sizzle', D);
      chain(bufSrc(v, pops), filt(v, 'bandpass', 2600, 0.5), gainN(v, 0.36), v.out);
      var n3 = noiseSrc(v, E.brown), g3 = gainN(v);
      env(g3.gain, t0, D, function (t) { return 0.45 * bed(t) * (0.7 + 0.3 * f2(t)); });
      chain(n3, filt(v, 'lowpass', 380, 0.6), g3, v.out);
      finish(v);
    },

    // Distant tension bed: soft fade-in, swells, and the envelope is fully closed at `ms`.
    rumble: function (E, t0, D, o) {
      var v = voice(E, t0, D, 0.05, o);
      var rel = Math.min(0.09, D * 0.2), m = vnoise(D, 7);
      var shape = function (t) {
        var u = t / D;
        return (0.55 * smooth(0, 0.35, u) + 0.45 * smooth(0.25, 0.85, u)) * (1 - smooth(D - rel, D, t)) * (0.78 + 0.22 * m(t));
      };
      var n1 = noiseSrc(v, E.brown), g1 = gainN(v);
      env(g1.gain, t0, D, function (t) { return 1.0 * shape(t); });
      chain(n1, filt(v, 'lowpass', 170, 0.8), g1, v.out);
      var n2 = noiseSrc(v, E.brown), g2 = gainN(v);
      env(g2.gain, t0, D, function (t) { return 0.46 * shape(t); });
      chain(n2, filt(v, 'bandpass', 240, 1.1), g2, v.out);
      finish(v);
    },

    /* ======================= v2 ======================= */

    // The call (~620 ms). An overtone-singing voice: a low D2 + A2 saw stack sung through an
    // "oh" vowel, with a lip-up glide and a 7 Hz throb, while a razor-narrow resonance climbs
    // 640 -> 2050 Hz and picks its harmonics out one by one (the rising whistle). Deep 55 Hz
    // pulses push out of the open palm (+20, +140 ms), the three rune studs ignite as glassy
    // pings on open fifths (D6 A6 D7 at +20, +70, +120 ms), and an airy ice glitter climbs to
    // 9.6 kHz. No vibrato pads, no major-chord chimes.
    summon: function (E, t0, _, o) {
      var D = 0.62, v = voice(E, t0, D + 0.02, 0.36, o), F0 = 73.42;
      var callEnv = function (t) { return smooth(0, 0.08, t) * (1 - smooth(0.3, D, t)); };
      var throb = function (t) { return 0.8 + 0.2 * Math.cos(TAU * 7 * t); };
      var mix = gainN(v, 0.4);
      [[1, 1], [1.0046, 0.8], [0.9954, 0.8], [1.5, 0.45]].forEach(function (h) {
        var oo = osc(v, 'sawtooth'), gg = gainN(v, h[1]);
        oo.frequency.setValueAtTime(F0 * h[0] * 0.89, t0);
        oo.frequency.exponentialRampToValueAtTime(F0 * h[0], t0 + 0.11);
        chain(oo, gg, mix);
      });
      // vowel body
      var body = gainN(v);
      [[420, 5, 1], [820, 7, 0.6], [2600, 9, 0.18]].forEach(function (fm) {
        var b = filt(v, 'bandpass', fm[0], fm[1]);
        mix.connect(b);
        chain(b, gainN(v, fm[2]), body);
      });
      env(body.gain, t0, D, function (t) { return 0.8 * callEnv(t) * throb(t); });
      body.connect(v.out);
      // overtone whistle
      var fw = filt(v, 'bandpass', null, 30), gw = gainN(v), pw = pan(v, null);
      env(fw.frequency, t0, D, function (t) { return 640 * Math.pow(3.2, smooth(0.05, 0.5, t)); });
      env(gw.gain, t0, D, function (t) { return 6 * callEnv(t); });
      if (pw.pan) env(pw.pan, t0, D, function (t) { return 0.25 * Math.sin(TAU * 1.6 * t); });
      chain(mix, fw, gw, pw, v.out);
      // throb pulses pushed out of the palm, with a fading echo
      var sub = osc(v, 'sine'), gs = gainN(v), P = [[0.02, 1], [0.14, 0.85], [0.26, 0.42], [0.38, 0.2]];
      sub.frequency.value = 55;
      env(gs.gain, t0, D, function (t) {
        for (var s = 0, i = 0; i < P.length; i++) {
          var d = t - P[i][0];
          if (d > 0) s += P[i][1] * (1 - Math.exp(-d / 0.006)) * Math.exp(-d / 0.07);
        }
        return 0.5 * s;
      });
      chain(sub, gainN(v, 0.8), shaper(v), gs, filt(v, 'lowpass', 400, 0.7), gainN(v, 0.7), v.out);
      // rune studs igniting
      ping(v, t0 + 0.02, 1174.7, 0.05, -0.2);
      ping(v, t0 + 0.07, 1760.0, 0.045, 0);
      ping(v, t0 + 0.12, 2349.3, 0.04, 0.2);
      // rising ice glitter
      var nS = noiseSrc(v, E.white), bS = filt(v, 'bandpass', null, 3), gS = gainN(v), fl = vnoise(D, 40);
      env(bS.frequency, t0, D, function (t) { return 3000 * Math.pow(3.2, smooth(0.02, 0.48, t)); });
      env(gS.gain, t0, D, function (t) { return 0.4 * smooth(0.01, 0.22, t) * (1 - smooth(0.34, D, t)) * (0.3 + 0.7 * fl(t)); });
      chain(nS, bS, gS, v.out);
      var ice = crackleBuf(v.ctx, D, {
        rate: 70, first: 0.03, amin: 0.15, amax: 0.6, zap: 0.6, fmin: 5000, fmax: 9000,
        zmin: 0.002, zmax: 0.006, cmin: 0.0004, cmax: 0.0012, width: 0.9,
        env: function (t) { return smooth(0.02, 0.2, t) * (1 - smooth(0.3, 0.56, t)); }
      });
      chain(bufSrc(v, ice), filt(v, 'highpass', 4000, 0.7), gainN(v, 0.5), v.out);
      finish(v);
    },

    // Mjolnir flying in (default 540 ms, peaks AT `ms` then stops dead in 12 ms: the catch).
    // Spinning: 5 "vwom" whums on the half turns of the decelerating 2-turn spin, each one a
    // brighter gust of air plus the heavy head's tonal body. Dopplers in: pitch, level and
    // brightness climb as it closes. A speed whistle, a pressure rush, trail crackle in the
    // last 140 ms. Pans from the far side (side s) across to the arm.
    hammerFly: function (E, t0, D, o) {
      var side = sideOf(o), v = voice(E, t0, D + 0.02, 0.1, o), REL = 0.012;
      var u = function (t) { return clamp(t / D, 0, 1); };
      var near = function (t) { return 0.1 + 0.9 * Math.pow(u(t), 2.2); };
      var cut = function (t) { return t < D - REL ? 1 : Math.max(0, (D - t) / REL); };
      var dop = function (t) { return 0.8 + 0.42 * Math.pow(u(t), 1.8); };
      var W = [0.1, 0.36, 0.58, 0.78, 0.93], SIG = 0.024 / D;
      var whum = function (t) {
        for (var x = u(t), s = 0, i = 0; i < W.length; i++) { var d = (x - W[i]) / SIG; s += Math.exp(-0.5 * d * d); }
        return Math.min(1, s);
      };
      var pn = pan(v, null);
      pn.connect(v.out);
      if (pn.pan) env(pn.pan, t0, D, function (t) { return side * (0.85 - 1.05 * Math.pow(u(t), 1.4)); });
      // 1. air gusts
      var n1 = noiseSrc(v, E.white), b1 = filt(v, 'bandpass', null, 1.4), g1 = gainN(v);
      env(b1.frequency, t0, D, function (t) { return 420 * dop(t) * (1 + 1.4 * whum(t)); });
      env(g1.gain, t0, D, function (t) { return 0.6 * near(t) * (0.3 + 0.7 * whum(t)) * cut(t); });
      chain(n1, b1, g1, pn);
      // 2. heavy head body
      var o2 = osc(v, 'triangle'), l2 = filt(v, 'lowpass', null, 1.5), g2 = gainN(v);
      env(o2.frequency, t0, D, function (t) { return 82 * dop(t); });
      env(l2.frequency, t0, D, function (t) { return 220 + 600 * whum(t); });
      env(g2.gain, t0, D, function (t) { return 0.55 * near(t) * (0.12 + 0.88 * whum(t)) * cut(t); });
      chain(o2, l2, gainN(v, 0.6), shaper(v), g2, pn);
      // 3. speed whistle
      var n3 = noiseSrc(v, E.white), b3 = filt(v, 'bandpass', null, 9), g3 = gainN(v);
      env(b3.frequency, t0, D, function (t) { return 2100 * dop(t); });
      env(g3.gain, t0, D, function (t) { return 0.3 * Math.pow(near(t), 1.5) * cut(t); });
      chain(n3, b3, g3, pn);
      // 4. pressure rush
      var n4 = noiseSrc(v, E.brown), l4 = filt(v, 'lowpass', null, 0.7), g4 = gainN(v);
      env(l4.frequency, t0, D, function (t) { return 200 + 700 * u(t) * u(t); });
      env(g4.gain, t0, D, function (t) { return 0.55 * Math.pow(near(t), 1.4) * cut(t); });
      chain(n4, l4, g4, pn);
      // 5. trail crackle
      var cr = crackleBuf(v.ctx, D, {
        rate: 70, first: Math.max(0, D - 0.14), amin: 0.3, amax: 0.9, zap: 0.5, fmin: 1800, fmax: 4800,
        zmin: 0.003, zmax: 0.01, cmin: 0.0006, cmax: 0.003, width: 0.6,
        env: function (t) { return t < D - 0.14 || t > D - REL ? 0 : 1; }
      });
      chain(bufSrc(v, cr), filt(v, 'highpass', 900, 0.7), gainN(v, 0.4), pn);
      finish(v);
    },

    // Mjolnir slapping into the palm (~900 ms incl. ring-out): a leather/palm slap and a meaty 160 -> 58 Hz
    // thud for the weight, then a short heavy-steel ring (free-bar modal partials of a ~215 Hz
    // head, the low two with beating twins, highs dying first) and two electric ticks as the
    // vambrace runes flare.
    catchClang: function (E, t0, _, o) {
      var D = 0.9, v = voice(E, t0, D, 0.28, o);
      var n1 = noiseSrc(v, E.white), g1 = gainN(v, 0);
      strike(g1, t0, 1.0, 0.0008, 0.014);
      chain(n1, filt(v, 'bandpass', 1800, 0.8), g1, v.out);
      var n1b = noiseSrc(v, E.white), g1b = gainN(v, 0);
      strike(g1b, t0, 0.5, 0.0004, 0.004);
      chain(n1b, filt(v, 'highpass', 3500, 0.7), g1b, v.out);
      var o2 = osc(v, 'sine'), g2 = gainN(v, 0);
      o2.frequency.setValueAtTime(160, t0);
      o2.frequency.exponentialRampToValueAtTime(58, t0 + 0.09);
      strike(g2, t0, 0.95, 0.002, 0.07);
      chain(o2, g2, shaper(v), gainN(v, 0.8), v.out);
      var F = rr(205, 225);
      var M = [[1, 0.36, 0.17], [2.756, 0.3, 0.12], [5.404, 0.2, 0.08], [8.933, 0.12, 0.05], [13.34, 0.07, 0.03]]; // [ratio, amp, decay tau]: the palm damps the ring
      M.forEach(function (m, i) {
        var pn = pan(v, rr(-0.35, 0.35));
        pn.connect(v.out);
        for (var k = 0; k < (i < 2 ? 2 : 1); k++) {
          var oo = osc(v, 'sine'), gg = gainN(v, 0);
          oo.frequency.value = F * m[0] * (k ? 1 + rr(0.004, 0.008) : 1);
          strike(gg, t0 + 0.001, m[1] * (k ? 0.6 : 1), 0.003, m[2]);
          chain(oo, gg, pn);
        }
      });
      var z = crackleBuf(v.ctx, 0.12, {
        rate: 40, first: 0.012, amin: 0.4, amax: 0.8, zap: 0.8, fmin: 2600, fmax: 5200,
        zmin: 0.006, zmax: 0.014, cmin: 0.001, cmax: 0.003, width: 0.6,
        env: function (t) { return t < 0.1 ? 1 : 0; }
      });
      chain(bufSrc(v, z), filt(v, 'highpass', 1200, 0.7), gainN(v, 0.25), v.out);
      finish(v);
    },

    // The storm feeding the raised hammer (default 620 ms; the v3 sheet plays 900 ms, from the raise
    // to the cut before the slam). A beating sine whine climbing 300 -> 2600 Hz with a resonant saw
    // edge, a rising mains buzz chopped by a tremolo accelerating 12 -> 46 Hz, ionising hiss, and
    // crackle that thickens as it builds, with 7 arc bursts spread over `ms`.
    // HARD CUT: everything is at zero exactly at `ms` (4 ms ramp, no reverb send), then the
    // duck bus holds a 120 ms vacuum so the crack lands on silence. The charge itself bypasses the
    // duck, so the bus can start sucking the bed down (the sky bolt's rolling thunder, the storm rumble)
    // 20 ms before the cut without softening the cut: the vacuum is silent from its first sample.
    charge: function (E, t0, D, o) {
      var v = voice(E, t0, D, 0, o, true), REL = 0.004, PRE = 0.02;
      var u = function (t) { return clamp(t / D, 0, 1); };
      var cut = function (t) { return t < D - REL ? 1 : Math.max(0, (D - t) / REL); };
      var build = function (t) { return smooth(0, 0.025, t) * (0.1 + 0.9 * Math.pow(u(t), 1.6)) * cut(t); };
      var ARCS = [0, 0.161, 0.306, 0.435, 0.548, 0.645, 0.726];
      var arcB = function (t) {
        for (var x = u(t), s = 0, i = 0; i < ARCS.length; i++) {
          var d = (x - ARCS[i]) * D;
          if (d >= 0 && d < 0.14) s += Math.exp(-d / 0.045) * (0.6 + 0.4 * i / 6);
        }
        return s;
      };
      var fW = function (t) { return 300 * Math.pow(2, 3.1 * Math.pow(u(t), 1.3)); };
      // 1. whine
      var w1 = osc(v, 'sine'), w2 = osc(v, 'sine'), gw = gainN(v);
      env(w1.frequency, t0, D, fW);
      env(w2.frequency, t0, D, function (t) { return fW(t) * 1.006; });
      env(gw.gain, t0, D, function (t) { return 0.075 * build(t); });
      w1.connect(gw); w2.connect(gw); gw.connect(v.out);
      var e1 = osc(v, 'sawtooth'), le = filt(v, 'lowpass', null, 6), ge = gainN(v);
      env(e1.frequency, t0, D, function (t) { return fW(t) * 0.5; });
      env(le.frequency, t0, D, function (t) { return fW(t) * 1.5; });
      env(ge.gain, t0, D, function (t) { return 0.06 * build(t); });
      chain(e1, le, ge, v.out);
      // 2. chopped buzz
      var b1 = osc(v, 'square'), gt = gainN(v, 0.55), lfo = osc(v, 'triangle'), la = gainN(v, 0.45), gb = gainN(v);
      env(b1.frequency, t0, D, function (t) { return 100 * Math.pow(2, 1.1 * u(t)); });
      lfo.frequency.setValueAtTime(12, t0);
      lfo.frequency.exponentialRampToValueAtTime(46, t0 + D);
      lfo.connect(la);
      la.connect(gt.gain);
      env(gb.gain, t0, D, function (t) { return 0.16 * build(t) * (1 + 0.8 * arcB(t)); });
      chain(b1, filt(v, 'bandpass', 700, 1.2), gt, gb, v.out);
      // 3. ionising hiss
      var nh = noiseSrc(v, E.white), gh = gainN(v);
      env(gh.gain, t0, D, function (t) { return 0.12 * build(t) * (0.6 + 0.6 * arcB(t)); });
      chain(nh, filt(v, 'highpass', 3000, 0.7), gh, v.out);
      // 4. crackle with arc bursts (buffer ends at D: sample-exact cut)
      var cb = crackleBuf(v.ctx, D, {
        rateFn: function (t) { return 18 + 70 * Math.pow(u(t), 1.5) + 220 * arcB(t); },
        first: 0.003, amin: 0.3, amax: 1, zap: 0.5, fmin: 1400, fmax: 5200,
        zmin: 0.004, zmax: 0.02, cmin: 0.0008, cmax: 0.004, width: 0.8,
        env: function (t) { return t < D - REL ? 0.45 + 0.55 * u(t) : 0; }
      });
      chain(bufSrc(v, cb), filt(v, 'highpass', 800, 0.7), gainN(v, 0.5), v.out);
      // 5. the vacuum
      var vac = optNum(o, 'vacuumMs', 120, 0, 400) / 1000;
      if (vac > 0) {
        duckTo(E, t0 + D - PRE, 0.02, 0.0025, t0 + D + vac, 0.003);
        E.vacFrom = t0 + D - PRE;
        E.vacUntil = t0 + D + vac;
      }
      finish(v);
    },

    // The big one (~2.6 s, tail gone by ~2.55 s). A 0.7 ms white-hot crack and the canvas-rip of
    // the channel tearing; a sub thump dropping 74 -> 44 Hz plus a punch chirp; a rolling
    // low-passed body in two decorrelated stereo sides with 5 irregular re-swells (alternating,
    // jittered, plus 3 random stutters) that brighten as they swell and wander L/R; mid grit and
    // a sparse rattle so the rolls read on laptop speakers; a long sub tail. Routed past the
    // duck bus and dips every other cue by 6 dB while it rolls.
    bigThunder: function (E, t0, _, o) {
      // all the maths (rolls, curves, crackle buffers) is precomputed off the impact frame by
      // prepBigThunder() in idle time after unlock; only node wiring happens here
      var K = E.kits.bigThunder || prepBigThunder(E.ctx), D = K.D;
      E.kits.bigThunder = null;
      var v = voice(E, t0, D + 0.01, 0.2, o, true);
      v.out.gain.value *= 1.45; // +3.2 dB: the rolls sit just under the limiter, the first boom rides it
      duckTo(E, t0, 0.5, 0.02, t0 + 0.95, 0.35);
      // 1. crack + rip
      var n1 = noiseSrc(v, E.white), g1 = gainN(v, 0);
      g1.gain.setValueAtTime(0, t0);
      g1.gain.linearRampToValueAtTime(1.0, t0 + 0.0007);
      g1.gain.setTargetAtTime(0.18, t0 + 0.0007, 0.012);
      g1.gain.setTargetAtTime(0, t0 + 0.05, 0.04);
      chain(n1, filt(v, 'highpass', 1400, 0.7), g1, v.out);
      chain(bufSrc(v, K.rip), filt(v, 'bandpass', 1600, 0.55), gainN(v, 0.7), v.out);
      // 2. boom: constant drive into the saturator, contour applied after it so the re-swells stay linear
      var s1 = osc(v, 'sine'), gs1 = gainN(v);
      s1.frequency.setValueAtTime(K.f0, t0);
      s1.frequency.exponentialRampToValueAtTime(K.f1, t0 + 0.55);
      env(gs1.gain, t0, D, K.boom);
      chain(s1, gainN(v, 0.75), shaper(v), gs1, filt(v, 'lowpass', 300, 0.7), gainN(v, 0.62), v.out);
      var s2 = osc(v, 'sine'), gs2 = gainN(v, 0);
      s2.frequency.setValueAtTime(130, t0);
      s2.frequency.exponentialRampToValueAtTime(50, t0 + 0.12);
      strike(gs2, t0, 0.8, 0.003, 0.06);
      chain(s2, gs2, shaper(v), gainN(v, 0.6), v.out);
      // 3. rolling body, two decorrelated sides
      K.body.forEach(function (b) {
        var n = noiseSrc(v, E.brown), lp = filt(v, 'lowpass', null, 0.55), g = gainN(v);
        env(lp.frequency, t0, D, b.lp);
        env(g.gain, t0, D, b.g);
        chain(n, lp, g, pan(v, b.side * 0.6), v.out);
      });
      // 4. mid grit
      var n4 = noiseSrc(v, E.brown), g4 = gainN(v);
      env(g4.gain, t0, D, K.grit);
      chain(n4, filt(v, 'bandpass', 320, 0.75), g4, v.out);
      // 5. rattle
      chain(bufSrc(v, K.rat), filt(v, 'lowpass', 1300, 0.6), gainN(v, 0.6), v.out);
      // 5b. echo claps
      var n5 = noiseSrc(v, E.white), g5 = gainN(v), p5 = pan(v, null);
      env(g5.gain, t0, D, K.clap);
      if (p5.pan) env(p5.pan, t0, D, K.clapPan);
      chain(n5, filt(v, 'bandpass', 900, 0.9), filt(v, 'lowpass', 2200, 0.7), g5, p5, v.out);
      // 6. long tail
      var n6 = noiseSrc(v, E.brown), g6 = gainN(v);
      env(g6.gain, t0, D, K.tail);
      chain(n6, filt(v, 'lowpass', 120, 0.7), g6, v.out);
      finish(v);
    },

    /* ======================= v3 ======================= */

    // The arm materialising out of thin air (default 300 ms, plus a 160 ms tail). A glassy shimmer that
    // resolves as the ordered dither fills in: three high partials (E6 B6 E7) gliding up into tune under
    // a tremolo slowing from 34 to 12 Hz; pixel glitter (clicks and high zaps) that thickens with the
    // reveal; a rising airy sweep; and a soft low knock when the last pixels land at `ms`. o.pan places it.
    materialize: function (E, t0, D, o) {
      var TAIL = 0.16, L = D + TAIL, v = voice(E, t0, L, 0.22, o), pn = pan(v, optNum(o, 'pan', 0, -1, 1) * 0.6);
      pn.connect(v.out);
      var u = function (t) { return clamp(t / D, 0, 1); };
      var bed = function (t) { return t < D ? smooth(0, D * 0.9, t) : Math.exp(-(t - D) / 0.07); };
      // 1. shimmer chord gliding up a quarter tone into tune
      var trem = integ(function (t) { return 34 - 22 * u(t); }, L, 300);
      [[1318.5, 0.11], [1975.5, 0.08], [2637, 0.055]].forEach(function (pp, i) {
        var oo = osc(v, i === 1 ? 'triangle' : 'sine'), g = gainN(v);
        env(oo.frequency, t0, L, function (t) { return pp[0] * (0.97 + 0.03 * smooth(0, D, t)); });
        env(g.gain, t0, L, function (t) { return pp[1] * bed(t) * (0.65 + 0.35 * Math.cos(TAU * trem(t) + i)); });
        chain(oo, g, pn);
      });
      // 2. pixel glitter, density rising with the reveal
      var gl = crackleBuf(v.ctx, L, {
        rateFn: function (t) { return 30 + 260 * Math.pow(u(t), 1.4) * (t < D ? 1 : 0.2); }, first: 0.004,
        amin: 0.15, amax: 0.7, zap: 0.55, fmin: 3800, fmax: 9000, zmin: 0.002, zmax: 0.007, cmin: 0.0004, cmax: 0.0014, width: 0.7,
        env: function (t) { return t < D ? 0.4 + 0.6 * u(t) : Math.exp(-(t - D) / 0.04); }
      });
      chain(bufSrc(v, gl), filt(v, 'highpass', 2600, 0.7), gainN(v, 0.62), pn);
      // 3. rising air
      var n = noiseSrc(v, E.white), bp = filt(v, 'bandpass', null, 2.4), gn = gainN(v);
      env(bp.frequency, t0, L, function (t) { return 1400 * Math.pow(4, u(t)); });
      env(gn.gain, t0, L, function (t) { return 0.26 * bed(t); });
      chain(n, bp, gn, pn);
      // 4. solid: a soft low knock and a tiny click as the last pixels land
      var tk = t0 + D, o4 = osc(v, 'sine'), g4 = gainN(v, 0);
      o4.frequency.setValueAtTime(220, tk);
      o4.frequency.exponentialRampToValueAtTime(95, tk + 0.05);
      strike(g4, tk, 0.42, 0.002, 0.035);
      chain(o4, g4, v.out);
      var n5 = noiseSrc(v, E.white), g5 = gainN(v, 0);
      strike(g5, tk, 0.12, 0.0008, 0.01);
      chain(n5, filt(v, 'bandpass', 2400, 1), g5, v.out);
      finish(v);
    },

    // The arm dissolving back into thin air (default 300 ms, plus a 120 ms tail). An electric fizz
    // (bandpassed noise falling 6 kHz -> 900 Hz with a fast flutter, a high hiss), the pixel glitter
    // running the other way (dense, thinning out), the shimmer chord sinking a fifth, and one bright
    // rising wink at 77% of `ms` as the hammer head goes last. o.pan places it.
    dematerialize: function (E, t0, D, o) {
      var TAIL = 0.12, L = D + TAIL, v = voice(E, t0, L, 0.25, o), pn = pan(v, optNum(o, 'pan', 0, -1, 1) * 0.6);
      pn.connect(v.out);
      var u = function (t) { return clamp(t / D, 0, 1); };
      var fade = function (t) { return smooth(0, 0.02, t) * (t < D ? 1 - 0.85 * Math.pow(u(t), 1.5) : 0.15 * Math.exp(-(t - D) / 0.05)); };
      // 1. fizz
      var fl = vnoise(L, 60);
      var n = noiseSrc(v, E.white), bp = filt(v, 'bandpass', null, 1.6), g = gainN(v);
      env(bp.frequency, t0, L, function (t) { return 900 + 5100 * Math.pow(1 - u(t), 1.6); });
      env(g.gain, t0, L, function (t) { return 0.44 * fade(t) * (0.45 + 0.55 * fl(t)); });
      chain(n, bp, g, pn);
      var n2 = noiseSrc(v, E.white), g2 = gainN(v);
      env(g2.gain, t0, L, function (t) { return 0.14 * fade(t); });
      chain(n2, filt(v, 'highpass', 6000, 0.7), g2, pn);
      // 2. glitter thinning out
      var gl = crackleBuf(v.ctx, L, {
        rateFn: function (t) { return 40 + 240 * Math.pow(1 - u(t), 1.3); }, first: 0.003,
        amin: 0.15, amax: 0.75, zap: 0.6, fmin: 3000, fmax: 8500, zmin: 0.002, zmax: 0.008, cmin: 0.0004, cmax: 0.0015, width: 0.8,
        env: function (t) { return t < D ? 1 - 0.7 * u(t) : Math.exp(-(t - D) / 0.03); }
      });
      chain(bufSrc(v, gl), filt(v, 'highpass', 2200, 0.7), gainN(v, 0.4), pn);
      // 3. the chord sinks a fifth
      [[2637, 0.03], [1975.5, 0.04]].forEach(function (pp) {
        var oo = osc(v, 'sine'), gg = gainN(v);
        env(oo.frequency, t0, L, function (t) { return pp[0] * Math.pow(2 / 3, u(t)); });
        env(gg.gain, t0, L, function (t) { return pp[1] * fade(t); });
        chain(oo, gg, pn);
      });
      // 4. the head's last wink
      var tk = t0 + D * 0.77, o4 = osc(v, 'sine'), g4 = gainN(v, 0);
      o4.frequency.setValueAtTime(3520, tk);
      o4.frequency.exponentialRampToValueAtTime(5200, tk + 0.04);
      strike(g4, tk, 0.06, 0.001, 0.03);
      chain(o4, g4, pn);
      finish(v);
    }
  };

  // duration rules for the ms-taking sounds: [default ms, min, max]
  var DUR = {
    crackle: [200, 30, 4000], sizzle: [600, 60, 4000], rumble: [600, 80, 4000],
    hammerFly: [540, 150, 3000], charge: [620, 120, 4000],
    materialize: [300, 80, 2000], dematerialize: [300, 80, 2000]
  };
  var NAMES = Object.keys(SOUNDS);
  function schedule(E, name, t0, ms, o) {
    var d = DUR[name];
    E.cur = name;
    SOUNDS[name](E, t0, d ? num(ms, d[0], d[1], d[2]) : undefined, o);
  }

  /* ---------- live context management ---------- */
  var E = null, muted = false, unlockAt = -1e9, idleTimer = 0;
  function now() { return G.performance && performance.now ? performance.now() : Date.now(); }

  // Voices are counted by scheduled stop time, not onended, so a context that was
  // interrupted mid-voice can never leave the cap stuck.
  function activeVoices() {
    var t = E.ctx.currentTime, a = E.live, j = 0;
    for (var i = 0; i < a.length; i++) if (a[i].end > t) a[j++] = a[i];
    a.length = j;
    return j;
  }
  function armIdleSuspend() {
    clearTimeout(idleTimer);
    var last = E.ctx.currentTime;
    for (var i = 0; i < E.live.length; i++) if (E.live[i].end > last) last = E.live[i].end;
    idleTimer = setTimeout(function () {
      try { if (E && activeVoices() === 0 && E.ctx.state === 'running') E.ctx.suspend(); } catch (e) {}
    }, (last - E.ctx.currentTime) * 1000 + IDLE_SUSPEND);
  }

  // Precompute bigThunder's kit in idle time (after unlock and after every use), so the call on
  // the impact frame only wires nodes. Falls back to computing inline if no kit is ready.
  var prepPending = false;
  function prewarmSoon() {
    if (!E || E.kits.bigThunder || prepPending) return;
    prepPending = true;
    var run = function (dl) {
      prepPending = false;
      try {
        if (!E || E.kits.bigThunder) return;
        if (dl && !dl.didTimeout && dl.timeRemaining && dl.timeRemaining() < 6) { prewarmSoon(); return; }
        E.kits.bigThunder = prepBigThunder(E.ctx);
        warmCrackles(0);
      } catch (e) {}
    };
    try {
      if (G.requestIdleCallback) G.requestIdleCallback(run, { timeout: 1500 });
      else setTimeout(run, 150);
    } catch (e) { prepPending = false; }
  }
  // the cached crackle takes, one bucket per idle slot
  function warmCrackles(i) {
    if (!E || i >= CRK_WARM.length) return;
    var run = function (dl) {
      try {
        for (; i < CRK_WARM.length; i++) {
          if (dl && dl.timeRemaining && !dl.didTimeout && dl.timeRemaining() < 4) break;
          for (var k = 0; k < 2; k++) crkBuf(E, CRK_WARM[i][0], CRK_WARM[i][1]);
        }
      } catch (e) { return; }
      if (i < CRK_WARM.length) warmCrackles(i);
    };
    try { if (G.requestIdleCallback) G.requestIdleCallback(run, { timeout: 2000 }); else setTimeout(run, 200); } catch (e) {}
  }
  function prewarm() {
    try {
      if (E && !E.kits.bigThunder) E.kits.bigThunder = prepBigThunder(E.ctx);
      return !!(E && E.kits.bigThunder);
    } catch (e) { return false; }
  }

  function unlock() {
    try {
      if (!AC) return false;
      if (!E) {
        var ctx;
        try { ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { ctx = new AC(); }
        E = buildEnv(ctx);
        if (muted) E.master.gain.value = 0;
      }
      clearTimeout(idleTimer);
      if (E.ctx.state !== 'running') {
        unlockAt = now();
        var p = E.ctx.resume && E.ctx.resume();
        if (p && p.catch) p.catch(function () {});
      }
      // iOS/WebKit: a silent 1-sample buffer started inside the gesture unlocks output
      var s = E.ctx.createBufferSource();
      s.buffer = E.ctx.createBuffer(1, 1, E.ctx.sampleRate);
      s.connect(E.ctx.destination);
      s.start(0);
      s.onended = function () { try { s.disconnect(); } catch (e) {} };
      prewarmSoon();
      return true;
    } catch (e) {
      return false;
    }
  }

  function play(name, ms, o) {
    try {
      if (muted || !E || !Object.prototype.hasOwnProperty.call(SOUNDS, name)) return false;
      if (ms && typeof ms === 'object') { o = ms; ms = undefined; } // play(name, options)
      if (o != null && typeof o !== 'object') o = null;
      var st = E.ctx.state;
      // a context that is not running yet may queue only right after unlock(); otherwise skip,
      // because a late cue is worse than a missing one
      if (st !== 'running' && !(st === 'suspended' && now() - unlockAt < START_GRACE)) return false;
      if (activeVoices() >= MAX_VOICES) return false;
      var delay = o && o.delayMs > 0 ? Math.min(o.delayMs, 5000) / 1000 : 0;
      schedule(E, name, E.ctx.currentTime + LEAD + delay, ms, o);
      armIdleSuspend();
      if (name === 'bigThunder') prewarmSoon();
      return true;
    } catch (e) {
      return false;
    }
  }

  // cut(name?, fadeMs = 25): fade out live voices (all, or only those of `name`), for skip /
  // abort / detach. Cutting everything (or 'charge' / 'bigThunder') also releases the duck bus.
  // Returns the number of voices faded.
  function cut(name, fadeMs) {
    try {
      if (!E) return 0;
      var t = E.ctx.currentTime, f = num(fadeMs, 25, 5, 2000), n = 0;
      for (var i = 0; i < E.live.length; i++) {
        var v = E.live[i];
        if (v.end <= t || (name && v.name !== name)) continue;
        var g = v.out.gain;
        g.cancelScheduledValues(t);
        g.setValueAtTime(g.value, t);
        g.linearRampToValueAtTime(0, t + f);
        n++;
      }
      if (!name || name === 'charge' || name === 'bigThunder') {
        E.vacUntil = 0;
        E.duck.gain.cancelScheduledValues(t);
        E.duck.gain.setTargetAtTime(1, t, 0.01);
      }
      return n;
    } catch (e) {
      return 0;
    }
  }

  function setMuted(b) {
    try {
      muted = !!b;
      if (E) {
        var g = E.master.gain, t = E.ctx.currentTime;
        g.cancelScheduledValues(t);
        g.setValueAtTime(g.value, t);
        g.setTargetAtTime(muted ? 0 : MASTER, t, 0.015);
      }
    } catch (e) {}
    return muted;
  }

  /* ---------- offline rendering (tests, capture soundtrack) ---------- */
  // The v3 beat sheet's audio column, in ms from the click. Extra keys are passed as options.
  var CUES = [
    { at: 0, name: 'crackle', ms: 80 },
    { at: 100, name: 'materialize', ms: 320 },
    { at: 300, name: 'rumble', ms: 2200, gainDb: -6 },
    { at: 540, name: 'summon' },
    { at: 690, name: 'hammerFly', ms: 570 },
    { at: 1260, name: 'catchClang' },
    { at: 1520, name: 'charge', ms: 900 },
    { at: 1860, name: 'crack', gainDb: -4 },
    { at: 1862, name: 'crackle', ms: 320 },
    { at: 1868, name: 'thunder', gainDb: -8 },
    { at: 2540, name: 'crack' },
    { at: 2545, name: 'crackle', ms: 400 },
    { at: 2555, name: 'bigThunder' },
    { at: 2640, name: 'sizzle', ms: 1400 },
    { at: 3020, name: 'crackle', ms: 250 },
    { at: 2855, name: 'dematerialize', ms: 300 },
    { at: 3440, name: 'rumble', ms: 500 },
    { at: 3440, name: 'crackle', ms: 250 }
  ];

  // the engine's own cue sheet when it is loaded (so this list can never drift from what a strike fires), else
  // the copy above
  function defaultCues() {
    var TL = NS.ThorLink;
    return TL && TL.cueSheet && TL.cueSheet.length ? TL.cueSheet : CUES;
  }

  // renderOffline(cues?, totalMs?, { sampleRate, seed, raw }) -> Promise<AudioBuffer> (stereo)
  // Each cue: { at (ms), name, ms?, ...options }. Cues are scheduled in time order.
  function renderOffline(cues, totalMs, opts) {
    opts = opts || {};
    return new Promise(function (resolve, reject) {
      var keep = rand;
      try {
        if (!OAC) throw new Error('OfflineAudioContext unavailable');
        var sr = opts.sampleRate || 48000, len = Math.ceil(((totalMs || 5400) / 1000) * sr);
        if (opts.seed != null) seedRng(opts.seed);
        var octx = new OAC(2, len, sr), OE = buildEnv(octx, !!opts.raw);
        (cues || defaultCues()).slice().sort(function (a, b) { return (a.at || 0) - (b.at || 0); }).forEach(function (c) {
          if (c && Object.prototype.hasOwnProperty.call(SOUNDS, c.name)) {
            var at = Math.max(0, c.at || 0) / 1000 + (c.delayMs > 0 ? Math.min(c.delayMs, 5000) / 1000 : 0);
            schedule(OE, c.name, at, c.ms, c);
          }
        });
        rand = keep;
        var p = octx.startRendering();
        if (p && p.then) p.then(resolve, reject);
        else octx.oncomplete = function (e) { resolve(e.renderedBuffer); };
      } catch (e) {
        rand = keep;
        reject(e);
      }
    });
  }

  // toWav(AudioBuffer) -> ArrayBuffer, 16-bit PCM interleaved
  function toWav(buf) {
    var nc = buf.numberOfChannels, sr = buf.sampleRate, n = buf.length, i, c;
    var out = new ArrayBuffer(44 + n * nc * 2), dv = new DataView(out);
    function str(o, s) { for (var j = 0; j < s.length; j++) dv.setUint8(o + j, s.charCodeAt(j)); }
    str(0, 'RIFF'); dv.setUint32(4, 36 + n * nc * 2, true); str(8, 'WAVE');
    str(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, nc, true);
    dv.setUint32(24, sr, true); dv.setUint32(28, sr * nc * 2, true); dv.setUint16(32, nc * 2, true); dv.setUint16(34, 16, true);
    str(36, 'data'); dv.setUint32(40, n * nc * 2, true);
    var ch = [];
    for (c = 0; c < nc; c++) ch.push(buf.getChannelData(c));
    for (i = 0; i < n; i++) {
      for (c = 0; c < nc; c++) {
        var s = clamp(ch[c][i], -1, 1);
        dv.setInt16(44 + (i * nc + c) * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      }
    }
    return out;
  }

  var API = {
    unlock: unlock,
    setMuted: setMuted,
    isMuted: function () { return muted; },
    play: function (name, ms, o) { return play(name, ms, o); },
    cut: cut,
    prewarm: prewarm,
    state: function () { try { return E ? E.ctx.state : 'none'; } catch (e) { return 'none'; } },
    NAMES: NAMES.slice(),
    CUES: CUES,
    renderOffline: renderOffline,
    toWav: toWav,
    _seed: function (n) { if (n == null) rand = Math.random; else seedRng(n); }
  };
  NAMES.forEach(function (name) {
    API[name] = function (ms, o) { return play(name, ms, o); };
  });
  NS.Audio = API;
})();


/*!
 * thor-link.js : "Mjolnir Summons" link-opener transition engine (prototype v3.4)
 *
 * Part of the ThorProto prototype; later ported to a Bezel (bezel-ui) React component.
 * Vanilla JS, zero dependencies, no network of its own, classic <script> (works from file://).
 *
 * The page stays exactly as it is: no veil, spotlight, cloud band, vignette or page drop. Only the cast and its
 * effects are drawn over the untouched page. A pixel-art arm resolves out of thin air beside the link (an
 * ordered-dither reveal at art resolution with electric sparkle pixels; the forearm's cut end permanently fades
 * out through an ordered-dither gradient, so no hard cut ever floats in the air). The open palm summons Mjolnir,
 * which flies in spinning and buzzes low over the link (its ink shadow sweeps the link text) before the catch.
 * The arm hoists it; streamers and current climbing the arm build the charge, then the hero sky bolt (twice
 * as wide as the two flank channels converging with it) lands on the raised head (an ink-silhouette hit-stop
 * with a pixel starburst). The arm coils, swings through three keys and slams the hammer onto the link (top-band
 * targets and header buttons take a side blow: three keys round from well back on the target's row, the hammer
 * tilted into the bite, its face a quarter of the way into the target), the trunk bolt lands, the face bites
 * 1 art px and holds through the hit-stop, then the arm swings the hammer clear (10+ art px up, half a head
 * back) and hovers there while the link burns glyph by glyph in full view (gold, orange, then char, with pixel
 * embers and ash over a small dithered char patch and 1 art px cracks along the baseline), and the next page
 * burns through from the impact along an irregular, noise-driven front with a thin char band, a soft scorch and
 * a dithered ember edge. The front burns the viewport at an even rate (an area
 * schedule, never a jump). The arm dissolves where it is, the same way it came. Every small effect (arcs,
 * crawlers, flames, embers, the flight smear, ghosts and shadow) is pixel art on the art grid.
 * Sprites: integer art scale k = 4 at 1280px / DPR 1 (head 120px), 3 css px per art px on a 390px phone, k = 8 at
 * DPR 2. Never fractional. Lightning is built for a light page: every bolt is a saturated indigo glow, a dark ink
 * edge, an azure and sky body and a white core, all drawn source-over, so it reads strongly on white.
 *
 * Public API (contract 5: contract 4 plus renderNext's info argument and state()):
 *   engine.ThorLink.attach(options)              -> detach()   (detach also drops a running strike)
 *   engine.ThorLink.strike(targetEl, href, opts) -> Promise<{href, ms, committed, aborted}>
 *   engine.ThorLink.isRunning()                  -> boolean
 *   engine.ThorLink.state()                      -> 'idle' | 'running' | 'committed' (a committed strike is
 *                                                      finished and replaced by the next click or strike)
 *   options.renderNext(href, info)                  info = { reduced, deadlineMs, whenQuiet }: the engine holds the reveal
 *                                                      until deadlineMs at most (a slow network), then the host
 *                                                      should resolve anyway (e.g. a loading page that fills in)
 * Extras:
 *   engine.ThorLink.defaults   mutable default options (capture sets quality / seed / debug / trace)
 *   engine.ThorLink.stats      timing, flash, placement and quality stats of the last strike, incl.
 *                                 {k, u, dpr, headCss, side, pre, impactFrame, P, Q, palm, buzz, beats[], flashes[]}
 *   engine.ThorLink.debug()    the same placement / scale / beat info for the running strike (else stats)
 *   engine.ThorLink.skip()     fast-forward the running strike (same as Esc or a deliberate later click
 *                                 outside [data-thor="off"]); the commit lands within ~450ms
 *   engine.ThorLink.timeline   the beat constants (base ms); ThorLink.cueSheet the sound cues fired on them
 *   engine.ThorLink.whenQuiet(fn)  run blocking host work in a quiet beat of the running strike
 *   options.clock                 capture only: () => ms virtual time source for deterministic stills
 *   options.trace                 capture only: stats.trace gets one {ms, cast, holes} entry per frame (cast also
 *                                 boxes the live bolts), so a capture can audit the page brightness away from them
 * Events on window: 'thor:start', 'thor:impact', 'thor:done' (detail {href, ms, ...}; thor:impact adds
 *   {k, u, dpr, headCss, side, pre, impactFrame, headClip, P, Q, target} so a capture can log the hammer size and
 *   placement; Q is the arm's home root: where the faded cut end of the forearm sits in the impact pose)
 * Host hooks: [data-thor-shake] wrapper (must contain the top bar; no position:fixed inside it) takes two short
 *   kicks: 3px as the sky bolt lands, <= 6px on the impact (no roll, <= 200ms). Nothing else ever moves or tints
 *   the page. [data-thor-avoid] elements are kept clear of the cast. html[data-thor-arrived] is set for 700ms
 *   after the commit.
 *
 * Consumes (all optional and guarded, so this file loads alone):
 *   engine.Hammer.create(1)  contract 1, pixel-art Mjolnir (built-in fallback hammer if missing)
 *   engine.Hand.create(1)    contract 2, pixel-art arm (no Hand: the hammer floats on its own). If the
 *                               sprite does not already dither its cut end (src.cutFade / art.cutFade, or
 *                               detected), the engine applies the ordered-dither fade itself.
 *   engine.Audio.*           contract 3, synthesized cues (missing v3 cues fall back to v1 ones)
 *
 * Architecture (React port notes):
 *   - One Strike per click; all state on it. Global caches only for scale-1 sprite kits and soft sprites.
 *   - Two fixed canvases: FX (min(dpr,1.5), 1 at low quality) for bolt glows, page decals (the burning glyphs,
 *     crater, shadows), the burn band and soft particles; PX (native dpr, <= 3) for bolt bodies and sparks
 *     (drawn first, so the opaque sprites cover them and no smooth stroke ever crosses the hand), then the pixel
 *     sprites (integer k upscale, nearest neighbour, integer device positions), then pixel FX snapped to the
 *     sprite's art grid. One fixed <div> layer holds the next page under both.
 *   - The burn-through is a field, not circles: every cell (one art pixel, u css px) gets an ignition time from
 *     an anisotropic distance to the strike point warped by angular and spatial noise (so the front runs along
 *     the text line first and stays ragged), from the fuse along the link, and from the satellite strikes. Each
 *     frame the burned cells become the layer's clip-path (row runs) and a cell-resolution band (dithered ember
 *     edge inside, a thin noisy char band and a soft scorch outside) is drawn over it with one drawImage.
 *   - Placement never moves the page. When the raise does not fit above the link, every pose before the
 *     swing is offset down and away from the link, k steps down once if even that does not fit, and targets in
 *     the top band (and header buttons) get a side blow (heldSide, or its upright key heldSideMid when the tilted
 *     head would leave the screen) whose face bites 25% into the target at its mid height, with the whole head
 *     (and every swing key) on screen.
 *   - Materialise / dissolve: the sprite's own ordered-dither helper (engine.Hand.dither). Fallback: the
 *     engine's dissolveImg (8x8 Bayer) for a sprite without it.
 *   - One rAF loop. Main clock t = (now - t0) / durationScale ("base ms"). The burn clock bt follows t but
 *     holds while renderNext is slow (at most ~1.4s: the arm keeps hovering and the link keeps burning on its
 *     glyph clock), then runs at most 1.35x until it has caught up (never a racing reveal); only after the
 *     commit does the ember tail catch up 3x. The world clock (particles, orbit) freezes in hit-stops (catch,
 *     sky bolt, impact) and crawls during the held breath.
 *   - Host work that blocks (building a big next page) can wait for a quiet beat: ThorLink.whenQuiet(fn) (also
 *     passed to renderNext as info.whenQuiet) runs it right after a frame that is not near the catch, the sky
 *     bolt, the slam or the restrike, one job per frame.
 *   - The engine never mutates other host elements: neighbour glows and scorches are canvas-drawn. It only
 *     touches the struck element (data-thor-state), the [data-thor-shake] wrapper (the kicks) and the root
 *     (aria-busy, data-thor-arrived).
 *   - Photosensitivity: three budgeted white flashes (sky bolt, impact, restrike), each gone by 120ms (a
 *     <= 40ms decay), gated on performance.now (max 3 per strike, max 2 per trailing 1050ms, min 330ms apart).
 *     Nothing else is full screen. Auto quality (decided from real frame times at 700ms and again as the burn
 *     starts) only thins particles and smoke and drops the FX canvas to 1x; the lightning is never weakened.
 */
(function (global) {
  'use strict';
  if (!global || !global.document) return;
  const doc = global.document;
  const NS = ENGINE;
  const TAU = Math.PI * 2;
  const DEG = Math.PI / 180;

  /* ====================================================================
   * 0. TIMELINE (base ms), PALETTE, DEFAULTS
   * ==================================================================== */
  const T = Object.freeze({
    SPARK: 60,
    MAT: 120, MAT_END: 420, SETTLE: 480,
    CALL: 540, CALL_SET: 600, RUNE1: 560, RUNE2: 610, RUNE3: 660, TETHER: 600, TETHER_END: 720, GLINT: 640, TREMBLE1: 600,
    FLY: 700, ARM_SHAKE: 1180, CATCH: 1260, CATCH_REL: 1320, RECOIL: 1360, RECOIL_OVER: 1390, CATCH_END: 1420,
    RAISE: 1420, RAISE_SET: 1520, CHARGE: 1520, ICE: 1600, LEADER_SKY: 1580, SKY: 1860, SKY_HOLD: 1930,
    PRERENDER: 2060,
    WINDUP: 2240, LEADERS: 2240, TREMBLE: 2300, STREAMER: 2340, COIL_END: 2400, BREATH: 2400,
    // the slam: three keys (hammer -45 -> 0 -> 45 -> 63 -> 90), two frames each, moving every frame along the arc
    SWING: 2440, SWING2: 2473, SMEAR: 2507, SPEED: 2480, RACE: 2507, IMPACT: 2540, HIT2: 2573, SISTER1: 2560, SISTER2: 2585,
    HITSTOP_END: 2630, PUNCH: 2630, PUNCH_END: 2740, SAT1: 2740, SAT2: 2800,
    // the rebound: the face stays planted through the hit-stop, kicks 4 art px up (50ms), then the arm swings the
    // hammer clear of the link on an eased arc (10+ art px up, half a head width back toward the arm), so the
    // burning link is in full view; it hovers there with a tremble and crackle, then dissolves where it is
    LIFT: 2630, LIFT_PEAK: 2680, LIFT_SET: 2820,
    DEMAT: 2860, RESTRIKE: 3020, GLINT2: 3020, HOLE_KICK_END: 3100, DEMAT_END: 3160,
    SURGE: 3440,
    BURN_END: 4080, COMMIT: 4100, EMBERS_OUT: 4450, CANVAS_OFF: 4950, DONE: 5000,
  });
  const FUSE_MS = 460;       // the fuse runs along the link text, glyph by glyph, for about this long
  const GLYPH_THROUGH = 460; // a glyph's paper burns through this long after the fuse reaches it (gold, orange, char)
  const ARM_HOLD_MAX = 900;  // a slow next page: the arm keeps hovering (and the link smouldering) at most this long

  // Arm pose offsets (art px, canonical side, x toward the link; lift / settle: the rebound clear of the link). Every pose before the swing also takes the
  // placement's pre-offset (this.pre): when the raise does not fit above the link, the summon, catch, charge
  // and coil all happen lower and away from the link, so the raise still CLIMBS from the catch (the steeper
  // heldRaised frame alone lifts the fist ~11 art px). The swing frames carry part of the pre-offset, so the
  // slam travels from the coil to the impact pose; their own offsets bow the arc outward.
  const OFF = {
    appear: [-2, 2], raised: [-1, -2], windup: [-3, -1], arc: [-1, -6], swing: [2, -4], smear: [1, -1], lift: [-1, -4], settle: [-15, -11],
  };
  // the side blow's own arc: from the coil it starts well back on the target's row (18 art px, with the cocked
  // head that is more than two head widths of travel), then comes round through two keys into the bite
  const OFF_SIDE = { arc: [-18, 3], swing: [-10, 1], smear: [-4, 0] };
  const ARC_PRE = 0.75, SWING_PRE = 0.45, SMEAR_PRE = 0.15; // share of the pre-offset still carried by the swing keys

  // NES palette tuples used by the VFX (the sprites carry their own palette)
  const RGB = {
    white: [252, 252, 252], ice: [164, 228, 252], cyan: [60, 188, 252], blue: [0, 120, 248], deep: [0, 88, 248],
    violet: [104, 68, 252], indigo: [32, 56, 236], green: [88, 248, 152], pink: [248, 120, 248],
    gold: [248, 184, 0], goldL: [248, 216, 120], orange: [228, 92, 16], red: [168, 16, 0], maroon: [136, 20, 0],
    cream: [252, 224, 168], char: [27, 18, 12], ash: [124, 124, 124], ashL: [188, 188, 188], ink: [6, 10, 20],
    peri: [104, 136, 252], periL: [184, 184, 248], flash: [255, 255, 255], violetD: [68, 40, 188], umber: [80, 48, 0],
    iron: [124, 124, 124],
  };
  // particle palettes that read on a white page (no white / ice: they vanish there)
  const ELEC = [RGB.blue, RGB.cyan, RGB.deep, RGB.violet];
  const ELEC_HOT = [RGB.cyan, RGB.blue, RGB.cyan, RGB.gold];
  const FIRE = [RGB.gold, RGB.orange, RGB.gold, RGB.red];
  const rgbaCache = new Map();
  function rgba(c, a) {
    a = a > 1 ? 1 : a > 0 ? a : 0;
    const r = c[0] | 0, g = c[1] | 0, b = c[2] | 0, q = Math.round(a * 64), key = (((r & 255) << 16) | ((g & 255) << 8) | (b & 255)) * 65 + q;
    let str = rgbaCache.get(key);
    if (!str) {
      str = 'rgba(' + r + ',' + g + ',' + b + ',' + q / 64 + ')';
      if (rgbaCache.size < 8192) rgbaCache.set(key, str);
    }
    return str;
  }
  // pixel flames (cells): w cream, g gold, o orange, r brick, m maroon; drawn with no smoothing on the art grid
  const PIX_FLAMES = [
    ['..g..', '..g..', '.ggg.', '.gwg.', 'gwwwg', 'gwwwg', '.gwg.', '..g..'],
    ['..o..', '.oo..', '.ogo.', 'oggo.', 'oggro', '.ogo.', '..o..'],
    ['.r...', '.rr..', 'rooo.', 'roor.', '.rr..', '..r..'],
    ['.m..', 'mrm.', 'mrm.', '.m..'],
  ];
  const PF_COL = { w: '#fce0a8', g: '#f8b800', o: '#e45c10', r: '#a81000', m: '#881400' };
  function pixFlame(i) {
    const key = 'pflame' + i;
    let c = spriteCache.get(key);
    if (c) return c;
    const rows = PIX_FLAMES[i];
    c = makeCanvas(rows[0].length, rows.length);
    const x = c.getContext('2d');
    rows.forEach((row, y) => { for (let X = 0; X < row.length; X++) { const ch = row.charAt(X); if (ch !== '.') { x.fillStyle = PF_COL[ch]; x.fillRect(X, y, 1, 1); } } });
    spriteCache.set(key, c);
    return c;
  }

  const DEFAULTS = {
    root: null,                 // default document
    selector: 'a[href]',
    renderNext: null,           // async (href, { reduced, deadlineMs }) => HTMLElement | null
    commit: null,               // (href, nextEl) => void
    sound: true,
    durationScale: 1,           // clamped to [0.92, 1.077] so the total stays within 4600-5400ms
    reducedMotion: 'auto',      // 'auto' | 'always' | 'never' (or true / false)
    shakeTarget: null,          // Element | selector; default [data-thor-shake]. Takes the one impact kick.
    avoid: '[data-thor-avoid]', // elements the cast should not cover (e.g. a fixed sound toggle)
    coverColor: null,           // fallback cover (no renderNext); default computed body background
    layerBackground: null,      // background of the next-page layer; default computed body background
    layerClass: '',             // extra class(es) on the next-page layer (for app-scoped CSS)
    quality: 'auto',            // 'auto' | 'high' | 'low' (auto only ever thins particles, never the lightning)
    seed: null,                 // number for reproducible VFX (capture), default random
    scrollTop: true,            // scroll to the top on commit
    hammerSize: null,           // css px target for the hammer head width (default 120 / 105 / 90 by width)
    debug: false,               // draws anchors (root Q, palm, wrist, strikeFace, buzz, P') on the PX canvas
    clock: null,                // capture only: () => ms, a virtual time source that replaces performance.now
    trace: false,               // capture only: per-frame {ms, cast, holes} in stats.trace (page brightness audit)
  };

  /* ====================================================================
   * 1. MATH, EASING
   * ==================================================================== */
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (a, b, v) => (b <= a ? (v >= b ? 1 : 0) : clamp((v - a) / (b - a), 0, 1));
  const Ease = {
    inQuad: (t) => t * t,
    outQuad: (t) => 1 - (1 - t) * (1 - t),
    inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  };
  function rectObj(r) {
    return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  }
  function hits(a, b) { return a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t; }
  function unit(x, y) { const l = Math.hypot(x, y) || 1; return { x: x / l, y: y / l }; }

  /* ====================================================================
   * 2. RNG + NOISE (seeded so a capture can be reproduced)
   * ==================================================================== */
  function makeRand(seed) {
    let a = seed >>> 0;
    const r = function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.range = (lo, hi) => lo + (hi - lo) * r();
    r.int = (lo, hi) => Math.floor(lo + (hi - lo + 1) * r());
    r.pick = (arr) => arr[Math.floor(r() * arr.length)];
    r.sign = () => (r() < 0.5 ? -1 : 1);
    return r;
  }
  // smooth 1D value noise in [-1, 1]
  function makeNoise1(rand) {
    const v = new Float32Array(256);
    for (let i = 0; i < 256; i++) v[i] = rand() * 2 - 1;
    return function (x) {
      const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
      const a = v[i & 255], b = v[(i + 1) & 255];
      return a + (b - a) * u;
    };
  }
  // smooth 2D value noise in [-1, 1] on an integer lattice (seeded), plus a 3-octave fbm of it
  function makeNoise2(rand) {
    const v = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) v[i] = rand() * 2 - 1;
    const at = (x, y) => v[((Math.imul(x, 73856093) ^ Math.imul(y, 19349663)) >>> 0) & 1023];
    const n = function (x, y) {
      const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
      const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
      const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
      return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
    };
    n.fbm = (x, y) => n(x, y) * 0.6 + n(x * 2.03 + 17.1, y * 2.03 - 9.3) * 0.28 + n(x * 4.1 - 31.7, y * 4.1 + 5.9) * 0.12;
    return n;
  }
  // a stable per-cell hash in [0, 1)
  function hash01(x, y, s) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  // white-hot -> char cooling ramp, h in [0,1]
  const HEAT = [[0, 27, 18, 12], [0.2, 136, 20, 0], [0.4, 228, 92, 16], [0.6, 248, 184, 0], [0.8, 248, 216, 120], [1, 252, 252, 252]];
  function heatRGB(h) {
    h = clamp(h, 0, 1);
    for (let i = 1; i < HEAT.length; i++) {
      if (h <= HEAT[i][0]) {
        const a = HEAT[i - 1], b = HEAT[i], u = (h - a[0]) / (b[0] - a[0]);
        return [a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u, a[3] + (b[3] - a[3]) * u];
      }
    }
    return [252, 252, 252];
  }

  /* ====================================================================
   * 3. OFFSCREEN SPRITES (soft glows, brushes, flames, smoke, stars, grain). Cached globally.
   * ==================================================================== */
  function makeCanvas(w, h) {
    const c = doc.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    return c;
  }
  const spriteCache = new Map();
  function radialSprite(key, size, stops) {
    let c = spriteCache.get(key);
    if (c) return c;
    c = makeCanvas(size, size);
    const x = c.getContext('2d');
    const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    for (let i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
    x.fillStyle = g;
    x.fillRect(0, 0, size, size);
    spriteCache.set(key, c);
    return c;
  }
  // soft round brush per colour, stamped along bolt paths for the wide glow layers (no shadowBlur)
  function brush(rgb) {
    const key = 'brush' + rgb.join(',');
    return radialSprite(key, 64, [[0, rgba(rgb, 1)], [0.25, rgba(rgb, 0.7)], [0.55, rgba(rgb, 0.22)], [1, rgba(rgb, 0)]]);
  }

  /* ====================================================================
   * 5. CRATER DECAL (char blot + 6 cracks), built offscreen during the charge
   * ==================================================================== */
  function buildScorch(rand, P, linkW, linkH, u, mobile, baseY) {
    const c = Math.max(2, Math.round(u)), cells = [];
    // a small char patch under the centre of the face's footprint (about a third of the link), so the letters
    // either side of it are seen to burn
    const rx = clamp(0.15 * linkW, 6, mobile ? 12 : 14), ry = clamp(0.3 * linkH, 3, 7);
    const gx0 = Math.floor((P.x - rx * 1.6) / c), gx1 = Math.ceil((P.x + rx * 1.6) / c), gy0 = Math.floor((P.y - ry * 1.6) / c), gy1 = Math.ceil((P.y + ry * 1.6) / c);
    for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
      const dx = ((gx + 0.5) * c - P.x) / rx, dy = ((gy + 0.5) * c - P.y) / ry, dd = dx * dx + dy * dy, bz = bayer(gx, gy);
      if (dd < 1) { if (bz < (1 - dd) * 0.9) cells.push([gx * c, gy * c, dd < 0.2 ? 0 : 1]); }
      else if (dd < 1.7 && bz < 0.3 * (1.7 - dd)) cells.push([gx * c, gy * c, 2]);
    }
    // cracks (1 art px, dark): the two long ones run both ways ALONG the link's baseline (34-60px, wandering at
    // most 3px off it, so they reach out past the hammer's footprint), one or two short ones break off below it
    const by = baseY == null ? P.y : baseY - 1;
    const cracks = [], dirs = [0, Math.PI, Math.PI / 2 + (rand() < 0.5 ? 1 : -1) * rand.range(0.5, 0.8), Math.PI / 2 + (rand() < 0.5 ? 1 : -1) * rand.range(0.9, 1.2)];
    const nC = mobile ? 3 : 4;
    for (let i = 0; i < nC; i++) {
      const base = dirs[i], along = i < 2, len = along ? rand.range(34, 60) : rand.range(14, 24);
      let x = P.x + Math.cos(base) * rx * 0.6, y = along ? by : P.y + ry * 0.6, d = 0, dir = base;
      const pts = [[x, y]];
      while (d < len) {
        const seg = rand.range(5, 9);
        dir = clamp(dir + rand.range(-0.35, 0.35), base - 0.3, base + 0.3);
        x += Math.cos(dir) * seg; y += Math.sin(dir) * seg * 0.8;
        if (along) y = clamp(y, by - 3, by + 3);
        pts.push([x, y]);
        d += seg;
      }
      const cr = { cells: rasterCells(pts, c), r0: Math.hypot(pts[0][0] - P.x, pts[0][1] - P.y), r1: Math.hypot(x - P.x, y - P.y), ph: rand() * TAU };
      if (i === 0) {
        const m = pts[Math.floor(pts.length / 2)], a = base + (rand() < 0.5 ? 0.6 : -0.6), bl = rand.range(6, 12);
        cr.cells = cr.cells.concat(rasterCells([m, [m[0] + Math.cos(a) * bl, m[1] + Math.sin(a) * bl]], c));
      }
      cracks.push(cr);
    }
    return { c, cells, cracks };
  }
  // cells (top-left corners, grid c) along a polyline, 4-connected Bresenham, no repeats
  function rasterCells(pts, c) {
    const out = [], seen = new Set();
    for (let i = 1; i < pts.length; i++) {
      let x0 = Math.floor(pts[i - 1][0] / c), y0 = Math.floor(pts[i - 1][1] / c);
      const x1 = Math.floor(pts[i][0] / c), y1 = Math.floor(pts[i][1] / c);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (let g = 0; g < 400; g++) {
        const k = x0 + ',' + y0;
        if (!seen.has(k)) { seen.add(k); out.push([x0 * c, y0 * c]); }
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; } else if (e2 <= dx) { err += dx; y0 += sy; }
      }
    }
    return out;
  }

  /* ====================================================================
   * 7. PIXEL HELPERS (all sprite kits are built ONCE at scale 1; the engine integer-upscales them)
   * ==================================================================== */
  function pixData(cv) {
    try { return cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; } catch (e) { return null; }
  }
  const amCache = new WeakMap();
  function alphaMap(cv) {
    if (amCache.has(cv)) return amCache.get(cv);
    const d = pixData(cv);
    if (!d) return null;
    const w = cv.width, h = cv.height, a = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) a[i] = d[i * 4 + 3];
    const m = { w, h, a, d };
    amCache.set(cv, m);
    return m;
  }
  function alphaBBox(m) {
    if (!m) return null;
    let x0 = m.w, y0 = m.h, x1 = -1, y1 = -1;
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      if (m.a[y * m.w + x] > 32) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }
  function opaqueNear(m, p, r) {
    if (!m) return false;
    const x0 = Math.max(0, Math.floor(p.x - r)), x1 = Math.min(m.w - 1, Math.ceil(p.x + r));
    const y0 = Math.max(0, Math.floor(p.y - r)), y1 = Math.min(m.h - 1, Math.ceil(p.y + r));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (m.a[y * m.w + x] > 32) return true;
    return false;
  }
  function cloneCanvas(cv) {
    const c = makeCanvas(cv.width, cv.height), x = c.getContext('2d', { willReadFrequently: true });
    x.imageSmoothingEnabled = false;
    x.drawImage(cv, 0, 0);
    return c;
  }
  // amount 1: solid colour silhouette (exact pixel edges); < 1: blend toward the colour
  function tintCanvas(cv, color, amount) {
    const c = cloneCanvas(cv), x = c.getContext('2d');
    x.globalCompositeOperation = 'source-atop';
    x.globalAlpha = amount == null ? 1 : amount;
    x.fillStyle = color;
    x.fillRect(0, 0, c.width, c.height);
    return c;
  }
  // hit flash: every non-outline pixel turns ice blue, the black outline stays (reads on the white flash and
  // on the white page, where a white fill would vanish)
  function whiteCanvas(cv) {
    const c = cloneCanvas(cv), x = c.getContext('2d');
    try {
      const id = x.getImageData(0, 0, c.width, c.height), d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 32) continue;
        if (d[i] + d[i + 1] + d[i + 2] < 40) continue;
        d[i] = 164; d[i + 1] = 228; d[i + 2] = 252;
      }
      x.putImageData(id, 0, 0);
    } catch (e) { return tintCanvas(cv, '#a4e4fc'); }
    return c;
  }
  // the sky-bolt hit-stop: the cast as a dark ink silhouette with a white rim (its outline pixels) and a 1px sky
  // ring outside, so it reads on the white page (ink and sky) and on the bolt glows (the white rim)
  function inkCanvas(cv) {
    const c = cloneCanvas(cv), x = c.getContext('2d');
    try {
      const id = x.getImageData(0, 0, c.width, c.height), d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 32) continue;
        const dark = d[i] + d[i + 1] + d[i + 2] < 40;
        d[i] = dark ? 252 : 10; d[i + 1] = dark ? 252 : 12; d[i + 2] = dark ? 252 : 30; d[i + 3] = 255;
      }
      x.putImageData(id, 0, 0);
    } catch (e) { return tintCanvas(cv, '#0a0c1e'); }
    return glowOutline(c);
  }
  // the arm's drop shadow: its silhouette with the whole cut-end fade zone (and 3 art px more) erased, so the
  // shadow never shows through the dither holes of the fading forearm
  function shadowCanvas(sil, f) {
    const c = cloneCanvas(sil), x = c.getContext('2d');
    try {
      const w = c.width, h = c.height, id = x.getImageData(0, 0, w, h), d = id.data, ax = f.axis || { x: 1, y: 0 };
      const m = alphaMap(f.cv), tm = m ? cutEndT(m, f.root, ax, CUT_HALF) : 0, lim = (isFinite(tm) ? tm : 0) + CUT_FADE + 3;
      for (let y = 0; y < h; y++) for (let X = 0; X < w; X++) {
        if (Math.abs(axisV(X, y, f.root, ax)) > CUT_HALF + 2) continue;
        if (axisT(X, y, f.root, ax) < lim) d[(y * w + X) * 4 + 3] = 0;
      }
      x.putImageData(id, 0, 0);
    } catch (e) { /* tainted: plain silhouette */ }
    return c;
  }
  // electric outline: a 1px #3cbcfc ring outside the silhouette (some pixels #a4e4fc)
  function glowOutline(cv) {
    const c = cloneCanvas(cv), x = c.getContext('2d');
    try {
      const w = c.width, h = c.height, id = x.getImageData(0, 0, w, h), d = id.data, src = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) src[i] = d[i * 4 + 3] > 32 ? 1 : 0;
      const at = (X, Y) => X >= 0 && Y >= 0 && X < w && Y < h && src[Y * w + X];
      for (let y = 0; y < h; y++) for (let X = 0; X < w; X++) {
        if (src[y * w + X] || !(at(X - 1, y) || at(X + 1, y) || at(X, y - 1) || at(X, y + 1))) continue;
        const o = (y * w + X) * 4, hi = (X * 7 + y * 3) % 11 === 0;
        d[o] = hi ? 164 : 60; d[o + 1] = hi ? 228 : 188; d[o + 2] = 252; d[o + 3] = 255;
      }
      x.putImageData(id, 0, 0);
    } catch (e) { /* tainted or unavailable: no glow */ }
    return c;
  }
  // exact 90-degree turns about the centre (lossless for square frames)
  function rot90(cv, q, mirror) {
    const c = makeCanvas(cv.width, cv.height), x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.translate(c.width / 2, c.height / 2);
    if (mirror) x.scale(-1, 1);
    x.rotate((q * Math.PI) / 2);
    x.drawImage(cv, -cv.width / 2, -cv.height / 2);
    return c;
  }
  function emptyLike(w, h) { return makeCanvas(w, h); }
  // an ordered-dither copy of a silhouette in one flat colour: 'half' keeps a 50% checker, 'sparse' one pixel
  // in four (so a shadow or a ghost reads as pixel art, never as an alpha-blended double of the sprite)
  function ditherCopy(cv, rgb, mode) {
    const c = cloneCanvas(cv), x = c.getContext('2d');
    try {
      const id = x.getImageData(0, 0, c.width, c.height), d = id.data;
      for (let y = 0; y < c.height; y++) for (let X = 0; X < c.width; X++) {
        const i = (y * c.width + X) * 4;
        const keep = d[i + 3] >= 32 && (mode === 'sparse' ? !(X & 1) && !(y & 1) : ((X + y) & 1) === 0);
        if (!keep) { d[i + 3] = 0; continue; }
        d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = 255;
      }
      x.putImageData(id, 0, 0);
    } catch (e) { return tintCanvas(cv, 'rgb(' + rgb.join(',') + ')', 0.5); }
    return c;
  }
  // a flight ghost: the orientation's silhouette as a sparse 25% ordered dither of sky pixels (cached)
  function ditherSil(o) {
    if (o.dsil) return o.dsil;
    const c = cloneCanvas(o.cv), x = c.getContext('2d');
    try {
      const id = x.getImageData(0, 0, c.width, c.height), d = id.data;
      for (let y = 0; y < c.height; y++) for (let X = 0; X < c.width; X++) {
        const i = (y * c.width + X) * 4;
        if (d[i + 3] < 32 || (X & 1) || (y & 1)) { d[i + 3] = 0; continue; }
        d[i] = 60; d[i + 1] = 188; d[i + 2] = 252; d[i + 3] = 255;
      }
      x.putImageData(id, 0, 0);
    } catch (e) { return (o.dsil = o.ghost); }
    return (o.dsil = c);
  }

  /* ====================================================================
   * 7b. ORDERED DITHER at art resolution (8x8 Bayer): the forearm's permanent cut-end fade, the
   *     materialise / dissolve masks, and outline-attached sparkle pixels. (The scorch patch, the cracks
   *     and the small arcs are rasterised in cells the same way.)
   * ==================================================================== */
  const BAYER8 = (function () {
    const b = [[0, 32, 8, 40, 2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26], [12, 44, 4, 36, 14, 46, 6, 38], [60, 28, 52, 20, 62, 30, 54, 22],
      [3, 35, 11, 43, 1, 33, 9, 41], [51, 19, 59, 27, 49, 17, 57, 25], [15, 47, 7, 39, 13, 45, 5, 37], [63, 31, 55, 23, 61, 29, 53, 21]];
    const m = new Float32Array(64);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) m[y * 8 + x] = (b[y][x] + 0.5) / 64;
    return m;
  })();
  const bayer = (x, y) => BAYER8[((y & 7) << 3) | (x & 7)];
  const CUT_FADE = 9;   // art px of ordered-dither fade at the forearm's cut end
  const CUT_HALF = 9;   // only pixels within this distance of the forearm axis fade (a hammer nearby never does)

  // projection helpers on a frame's forearm axis (art px, pixel centres)
  function axisT(x, y, root, ax) { return (x + 0.5 - root.x) * ax.x + (y + 0.5 - root.y) * ax.y; }
  function axisV(x, y, root, ax) { return -(x + 0.5 - root.x) * ax.y + (y + 0.5 - root.y) * ax.x; }

  // the cut end of the forearm (the opaque pixel furthest back along the axis, near the axis)
  function cutEndT(m, root, ax, half) {
    let tMin = Infinity;
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      if (m.a[y * m.w + x] < 33 || Math.abs(axisV(x, y, root, ax)) > half) continue;
      const t = axisT(x, y, root, ax);
      if (t < tMin) tMin = t;
    }
    return tMin;
  }

  // Fade the forearm's cut end through an 8x8 Bayer gradient over its last F art px. Returns
  // { cv, tMin, done, pre }: pre = the sprite already dithers its cut end (its first 3px band is far
  // sparser than the arm further up), so nothing is touched.
  function fadeCutEnd(cv, root, ax, F, half) {
    const m = alphaMap(cv);
    if (!m) return { cv, tMin: 0, done: false, pre: false };
    const tMin = cutEndT(m, root, ax, half);
    if (!isFinite(tMin)) return { cv, tMin: 0, done: false, pre: false };
    let n0 = 0, n1 = 0;
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      if (m.a[y * m.w + x] < 33 || Math.abs(axisV(x, y, root, ax)) > half) continue;
      const t = axisT(x, y, root, ax);
      if (t < tMin + 3) n0++;
      else if (t >= tMin + F + 2 && t < tMin + F + 5) n1++;
    }
    if (n1 > 8 && n0 < 0.55 * n1) return { cv, tMin, done: false, pre: true };
    const c = cloneCanvas(cv), g = c.getContext('2d');
    let id;
    try { id = g.getImageData(0, 0, c.width, c.height); } catch (e) { return { cv, tMin, done: false, pre: false }; }
    const d = id.data, W = c.width;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4;
      if (d[o + 3] < 33 || Math.abs(axisV(x, y, root, ax)) > half) continue;
      const f = (axisT(x, y, root, ax) - tMin) / F;
      if (f < 1 && f <= bayer(x, y)) d[o + 3] = 0;
    }
    g.putImageData(id, 0, 0);
    return { cv: c, tMin, done: true, pre: false };
  }

  // transparent pixels 4-adjacent to the silhouette, as [x, y, ownerIndex] triples (sparkles attach here)
  const edgeCache = new WeakMap();
  function edgeList(cv) {
    if (edgeCache.has(cv)) return edgeCache.get(cv);
    const m = alphaMap(cv);
    const out = [];
    if (m) {
      const W = m.w, H = m.h, op = (x, y) => x >= 0 && y >= 0 && x < W && y < H && m.a[y * W + x] > 32;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (op(x, y)) continue;
        let o = -1;
        if (op(x - 1, y)) o = y * W + x - 1; else if (op(x + 1, y)) o = y * W + x + 1;
        else if (op(x, y - 1)) o = (y - 1) * W + x; else if (op(x, y + 1)) o = (y + 1) * W + x;
        if (o >= 0) out.push(x, y, o);
      }
    }
    const arr = Int32Array.from(out);
    edgeCache.set(cv, arr);
    return arr;
  }

  // per-frame dissolve data (built once): opaque pixels, their colours and two thresholds in [0, 1):
  // vin (materialise: the hand condenses first, the cut end last) and vout (dissolve: the cut end goes
  // first, the hammer head last). Each = 8x8 Bayer blended with the normalised distance from the seed.
  function dissolveData(f) {
    if (f.dz) return f.dz;
    const m = alphaMap(f.cv), W = f.W, H = f.H;
    const xs = [], ys = [], cols = [], dIn = [], dOut = [];
    const ax = f.axis || { x: 1, y: 0 };
    const seedIn = f.palm || f.wrist || f.centroid;
    let cut = { x: f.root.x, y: f.root.y };
    if (m) {
      const tm = cutEndT(m, f.root, ax, CUT_HALF);
      if (isFinite(tm)) cut = { x: f.root.x + ax.x * tm, y: f.root.y + ax.y * tm };
    }
    let mi = 1e-3, mo = 1e-3;
    if (m) {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (m.a[i] < 33) continue;
        xs.push(x); ys.push(y);
        cols.push(m.d[i * 4], m.d[i * 4 + 1], m.d[i * 4 + 2], m.a[i]);
        const a = Math.hypot(x + 0.5 - seedIn.x, y + 0.5 - seedIn.y), b = Math.hypot(x + 0.5 - cut.x, y + 0.5 - cut.y);
        dIn.push(a); dOut.push(b);
        if (a > mi) mi = a;
        if (b > mo) mo = b;
      }
    }
    const n = xs.length, vin = new Float32Array(n), vout = new Float32Array(n), own = new Int32Array(W * H).fill(-1);
    for (let i = 0; i < n; i++) {
      const bz = bayer(xs[i], ys[i]);
      vin[i] = Math.min(0.999, 0.55 * bz + 0.45 * (dIn[i] / mi));
      vout[i] = Math.min(0.999, 0.5 * bz + 0.5 * (dOut[i] / mo));
      own[ys[i] * W + xs[i]] = i;
    }
    // sparkle sites: outline-adjacent transparent pixels with the index of the opaque pixel they touch
    const e = edgeList(f.cv), edge = [];
    for (let j = 0; j < e.length; j += 3) { const oi = own[e[j + 2]]; if (oi >= 0) edge.push(e[j], e[j + 1], oi); }
    f.dz = { W, H, n, xs: Int16Array.from(xs), ys: Int16Array.from(ys), rgba: Uint8ClampedArray.from(cols), vin, vout, edge: Int32Array.from(edge) };
    return f.dz;
  }
  const SPARK_COLS = [[0, 120, 248], [60, 188, 252], [0, 88, 248]];
  /* ====================================================================
   * 8. HAMMER KIT (contract 1, at scale 1) + the 16+ lossless spin orientations
   * ==================================================================== */
  const FRAME_NAMES = ['idle', 'raised', 'swing', 'smear', 'impact', 'glowIdle', 'glowImpact'];
  const FRAME_FALLBACK = { glowIdle: 'idle', glowImpact: 'impact', smear: 'swing' };
  const DEFAULT_ANGLES = { idle: 0, glowIdle: 0, raised: -60, swing: -25, smear: 65, impact: 90, glowImpact: 90 };

  const FallbackHammer = {
    angles: DEFAULT_ANGLES,
    create(scale) {
      scale = Math.max(1, Math.round(scale || 1));
      const SW = 22, SH = 36, F = 44;
      const src = new Array(SW * SH).fill(null);
      const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < SW && y < SH) src[y * SW + x] = c; };
      for (let y = 1; y <= 11; y++) for (let x = 1; x <= 20; x++) set(x, y, y <= 3 ? '#fcfcfc' : y <= 7 ? '#bcbcbc' : '#7c7c7c');
      for (let x = 4; x <= 17; x += 2) set(x, 6, '#7c7c7c');
      for (let y = 12; y <= 29; y++) for (let x = 9; x <= 12; x++) set(x, y, x === 9 ? '#e45c10' : (y >> 1) & 1 ? '#881400' : '#a81000');
      for (let x = 8; x <= 13; x++) { set(x, 30, '#f8b800'); set(x, 31, '#ac7c00'); }
      [[9, 32], [12, 32], [9, 33], [10, 33], [11, 33], [12, 33]].forEach((p) => set(p[0], p[1], '#881400'));
      const filled = src.slice();
      const has = (x, y) => x >= 0 && y >= 0 && x < SW && y < SH && !!filled[y * SW + x];
      for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
        if (!filled[y * SW + x] && (has(x - 1, y) || has(x + 1, y) || has(x, y - 1) || has(x, y + 1))) src[y * SW + x] = '#000000';
      }
      const ox = (F - SW) / 2, oy = 22 - 25, C = F / 2; // grip (11, 25) at the frame centre
      const rot = (deg) => {
        const out = new Array(F * F).fill(null), a = deg * DEG, c = Math.cos(a), s = Math.sin(a);
        for (let y = 0; y < F; y++) for (let x = 0; x < F; x++) {
          const dx = x + 0.5 - C, dy = y + 0.5 - C;
          const sx = Math.floor(c * dx + s * dy + C - ox), sy = Math.floor(-s * dx + c * dy + C - oy);
          if (sx >= 0 && sy >= 0 && sx < SW && sy < SH) out[y * F + x] = src[sy * SW + sx];
        }
        return out;
      };
      const merge = (...grids) => grids[0].map((v, i) => { for (const g of grids) if (g[i]) return g[i]; return null; });
      const paint = (grid) => {
        const c = makeCanvas(F * scale, F * scale), x = c.getContext('2d');
        for (let i = 0; i < grid.length; i++) if (grid[i]) { x.fillStyle = grid[i]; x.fillRect((i % F) * scale, Math.floor(i / F) * scale, scale, scale); }
        return c;
      };
      const g0 = rot(0), g90 = rot(90);
      const frames = {
        idle: paint(g0), raised: paint(rot(-60)), swing: paint(rot(-25)), smear: paint(merge(rot(65), rot(45), rot(85))),
        impact: paint(g90),
      };
      frames.glowIdle = glowOutline(frames.idle);
      frames.glowImpact = glowOutline(frames.impact);
      const rp = (p, deg) => { const a = deg * DEG, c = Math.cos(a), s = Math.sin(a), dx = p.x - C, dy = p.y - C; return { x: C + dx * c - dy * s, y: C + dx * s + dy * c }; };
      const grip = { x: C * scale, y: C * scale };
      const sf = rp({ x: ox + 21.5, y: oy + 6.5 }, 90);
      return { frames, width: F * scale, height: F * scale, grip, strikeFace: { x: sf.x * scale, y: sf.y * scale }, angles: DEFAULT_ANGLES };
    },
  };
  function hammerSource() {
    return NS.Hammer && typeof NS.Hammer.create === 'function' ? NS.Hammer : FallbackHammer;
  }

  let hammerKit = null;
  let handKit = null;
  function getHammerKit() {
    const lib = hammerSource();
    if (hammerKit && hammerKit.lib === lib) return hammerKit;
    handKit = null;
    let src = null;
    try { src = lib.create(1); } catch (e) { console.warn('[ThorLink] Hammer.create(1) failed, using fallback', e); }
    if (!src || !src.frames || !src.frames.idle) src = FallbackHammer.create(1);
    const frames = {};
    for (const n of FRAME_NAMES) frames[n] = src.frames[n] || src.frames[FRAME_FALLBACK[n]] || src.frames.idle;
    const W = frames.idle.width, H = frames.idle.height, C = { x: W / 2, y: H / 2 };
    const angles = Object.assign({}, DEFAULT_ANGLES, lib.angles || {}, src.angles || {});
    const amIdle = alphaMap(frames.idle), amImpact = alphaMap(frames.impact);
    const bbIdle = alphaBBox(amIdle) || { x: 0, y: 0, w: W, h: H };
    const bbImpact = alphaBBox(amImpact) || { x: 0, y: 0, w: W, h: H };
    const anc = (n) => (src.anchors && src.anchors[n]) || null;
    const grip0 = src.grip || { x: bbIdle.x + bbIdle.w / 2, y: bbIdle.y + bbIdle.h * 0.82 };
    const sf = src.strikeFace || { x: bbImpact.x + bbImpact.w * 0.8, y: bbImpact.y + bbImpact.h };
    const rotP = (p, deg) => {
      const a = deg * DEG, c = Math.cos(a), s = Math.sin(a), dx = p.x - C.x, dy = p.y - C.y;
      return { x: C.x + dx * c - dy * s, y: C.y + dx * s + dy * c };
    };
    // rotation convention check: the impact grip must land on the handle, opposite the face
    let sign = 1;
    const gP = rotP(grip0, angles.impact), gM = rotP(grip0, -angles.impact);
    const okP = opaqueNear(amImpact, gP, 2), okM = opaqueNear(amImpact, gM, 2);
    if (okM && !okP) sign = -1;
    else if (okP === okM && (gP.x - C.x) * (sf.x - C.x) > 0) sign = -1;
    const grip = {};
    for (const n of FRAME_NAMES) grip[n] = (anc(n) && anc(n).grip) || rotP(grip0, sign * (angles[n] || 0));
    // head box in idle: rows from the top whose opaque width is at least half the bbox width
    let hb = null;
    if (amIdle) {
      let top = -1, bot = -1, l = W, r = -1;
      for (let y = bbIdle.y; y < bbIdle.y + bbIdle.h; y++) {
        let x0 = -1, x1 = -1;
        for (let x = 0; x < W; x++) if (amIdle.a[y * W + x] > 32) { if (x0 < 0) x0 = x; x1 = x; }
        const wide = x0 >= 0 && x1 - x0 + 1 >= bbIdle.w * 0.5;
        if (wide) { if (top < 0) top = y; bot = y; l = Math.min(l, x0); r = Math.max(r, x1); } else if (top >= 0) break;
      }
      if (top >= 0) hb = { l, t: top, w: r - l + 1, h: bot - top + 1 };
    }
    if (!hb) hb = { l: bbIdle.x, t: bbIdle.y, w: bbIdle.w, h: Math.round(bbIdle.h * 0.3) };
    const hc0 = { x: hb.l + hb.w / 2, y: hb.t + hb.h / 2 };
    const headC = {};
    for (const n of FRAME_NAMES) headC[n] = (anc(n) && anc(n).headCenter) || rotP(hc0, sign * (angles[n] || 0));
    let headTop = (anc('impact') && anc('impact').headTop) || null;
    if (!headTop) {
      // scan up from the face in the impact frame
      let y = clamp(Math.round(sf.y) - 1, 0, H - 1), gap = 0, last = y;
      const cx = clamp(Math.round(sf.x), 0, W - 1);
      for (; y >= 0 && amImpact; y--) {
        let op = false;
        for (let dx = -1; dx <= 1; dx++) { const xx = cx + dx; if (xx >= 0 && xx < W && amImpact.a[y * W + xx] > 32) { op = true; break; } }
        if (op) { last = y; gap = 0; } else if (++gap > 2) break;
      }
      headTop = { x: sf.x, y: last };
    }
    const kit = {
      lib, W, H, frames, grip, headC, headBox: hb, bbIdle, bbImpact, angles,
      headW: Number(src.headW) > 4 ? Number(src.headW) : hb.w, headH: Number(src.headH) > 4 ? Number(src.headH) : hb.h,
      strikeFace: { x: sf.x, y: sf.y }, headTop, sign, len: Math.max(8, grip0.y - bbIdle.y),
      ghost: {}, sil: {}, white: {},
    };
    for (const n of FRAME_NAMES) {
      kit.ghost[n] = tintCanvas(frames[n], '#3cbcfc', 0.4);
      kit.sil[n] = tintCanvas(frames[n], '#000000');
      kit.white[n] = whiteCanvas(frames[n]);
    }
    // spin set: the sprite's own clean orientations if exported, else base poses x 4 exact quarter turns x
    // mirror (needs square frames with the grip centred)
    kit.orients = [];
    if (Array.isArray(src.spin) && src.spin.length >= 8 && src.spin[0] && src.spin[0].width === W) {
      const n = src.spin.length;
      src.spin.forEach((cv, i) => {
        const ang = Array.isArray(src.spinAngles) && src.spinAngles[i] != null ? src.spinAngles[i] : (i * 360) / n;
        kit.orients.push({ ang: ((ang % 360) + 360) % 360, cv, ghost: tintCanvas(cv, '#3cbcfc', 0.4) });
      });
      kit.orients.sort((p, q) => p.ang - q.ang);
      hammerKit = kit;
      return kit;
    }
    const centred = W === H && Math.abs(grip.idle.x - C.x) < 0.51 && Math.abs(grip.idle.y - C.y) < 0.51;
    const bases = [['idle', 0], ['swing', angles.swing], ['raised', angles.raised], ['impact', angles.impact]];
    const seen = [];
    const add = (cv, ang) => {
      ang = ((ang % 360) + 360) % 360;
      for (const s of seen) if (Math.min(Math.abs(s - ang), 360 - Math.abs(s - ang)) < 2) return;
      seen.push(ang);
      kit.orients.push({ ang, cv, ghost: tintCanvas(cv, '#3cbcfc', 0.4) });
    };
    for (const b of bases) {
      const cv = frames[b[0]];
      for (let q = 0; q < (centred ? 4 : 1); q++) {
        add(q ? rot90(cv, q, false) : cv, b[1] + q * 90);
        add(rot90(cv, q, true), -(b[1] + q * 90));
      }
    }
    kit.orients.sort((p, q) => p.ang - q.ang);
    hammerKit = kit;
    return kit;
  }
  function pickOrient(kit, deg) {
    deg = ((deg % 360) + 360) % 360;
    let best = kit.orients[0], bd = 1e9;
    for (const o of kit.orients) {
      const d = Math.min(Math.abs(o.ang - deg), 360 - Math.abs(o.ang - deg));
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  }

  /* ====================================================================
   * 9. HAND KIT (contract 2, at scale 1). Real: engine.Hand.create(1) plus derived data
   *    (axes, lengths, rune studs, hammer anchors found by template matching), with the forearm's cut end
   *    faded through an ordered dither unless the sprite already does it. Virtual (no Hand): the same frame
   *    set built from hammer frames only, the hammer floating on its own.
   * ==================================================================== */
  const HAND_FRAMES = ['open', 'catch', 'heldRaised', 'glowHeldRaised', 'heldWindup', 'heldSwing', 'heldSmear', 'heldImpact', 'heldSide', 'heldSideBack', 'heldSideSwing', 'heldSideMid'];
  const HELD_HAMMER = { catch: 'idle', heldRaised: 'raised', glowHeldRaised: 'raised', heldWindup: 'raised', heldSwing: 'swing', heldSmear: 'smear', heldImpact: 'impact', heldSide: 'raised', heldSideBack: 'raised', heldSideSwing: 'raised', heldSideMid: 'raised' };
  // impact frames: the overhead slam, the side blow (hammer tilted into it) and, for a target with too little
  // room above it for the tilted head (a header button), the side blow's upright key
  const IMPACT_FRAMES = { heldImpact: 1, heldSide: 1, heldSideMid: 1 };
  const SIDE = { heldSide: 1, heldSideMid: 1 };
  // virtual grips relative to the root (art px, canonical side): the beat-sheet geometry table
  const VIRTUAL = {
    open: { palm: [36, -3], axisDeg: -5 },
    catch: { g: [36, -3] }, heldRaised: { g: [28, -14] }, glowHeldRaised: { g: [28, -14], glow: 1 }, heldWindup: { g: [24, -17], glow: 1 },
    heldSwing: { g: [34, 1] }, heldSmear: { g: [33, 9] }, heldImpact: { g: [31, 14] }, heldSide: { g: [34, -2] },
    heldSideBack: { g: [27, -12] }, heldSideSwing: { g: [32, -6] }, heldSideMid: { g: [33, -4] },
  };

  // the glyph and recess pixels of each rune stud of a hand frame (the 5x5 boss round each cluster centre),
  // ordered from the root outward
  function runePixels(f) {
    const m = alphaMap(f.cv), out = [];
    if (!m) return out;
    const order = f.runes.slice().sort((a, b) => Math.hypot(a.x - f.root.x, a.y - f.root.y) - Math.hypot(b.x - f.root.x, b.y - f.root.y));
    for (const rc of order) {
      const x0 = Math.floor(rc.x - 2.5), y0 = Math.floor(rc.y - 2.5), glyph = [], recess = [];
      for (let y = y0; y < y0 + 5; y++) for (let x = x0; x < x0 + 5; x++) {
        if (x < 0 || y < 0 || x >= m.w || y >= m.h) continue;
        const i = y * m.w + x;
        if (m.a[i] < 128) continue;
        const r = m.d[i * 4], g = m.d[i * 4 + 1], b = m.d[i * 4 + 2];
        if (isRunePx(r, g, b) || (r > 240 && g > 240 && b > 240 && x > x0 && x < x0 + 4 && y > y0 && y < y0 + 4)) glyph.push([x, y]);
        else if (b > 150 && r < 40 && g < 140) recess.push([x, y]);
      }
      out.push({ glyph, recess });
    }
    return out;
  }
  function isRunePx(r, g, b) {
    return (Math.abs(r - 60) < 14 && Math.abs(g - 188) < 14 && b > 236) || (Math.abs(r - 164) < 14 && Math.abs(g - 228) < 14 && b > 236);
  }

  // find where a hammer frame's head pixels sit inside a hand frame (exact colour match, early abort)
  function matchHammer(hm, hk, hamName) {
    const ham = alphaMap(hk.frames[hamName]);
    if (!ham || !hm) return null;
    const hc = hk.headC[hamName], R = hk.headW * 0.55, pts = [];
    for (let y = 0; y < ham.h; y++) for (let x = 0; x < ham.w; x++) {
      const i = y * ham.w + x;
      if (ham.a[i] < 200 || Math.hypot(x + 0.5 - hc.x, y + 0.5 - hc.y) > R) continue;
      const d = ham.d;
      pts.push(x, y, d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
    }
    const n = pts.length / 5;
    if (n < 24) return null;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let i = 0; i < pts.length; i += 5) { x0 = Math.min(x0, pts[i]); x1 = Math.max(x1, pts[i]); y0 = Math.min(y0, pts[i + 1]); y1 = Math.max(y1, pts[i + 1]); }
    const W = hm.w, H = hm.h, d = hm.d, maxMiss = Math.floor(n * 0.25);
    let best = null, bestHit = 0;
    for (let oy = -y0; oy <= H - 1 - y1; oy++) {
      for (let ox = -x0; ox <= W - 1 - x1; ox++) {
        let miss = 0;
        for (let i = 0; i < pts.length; i += 5) {
          const o = ((pts[i + 1] + oy) * W + pts[i] + ox) * 4;
          if (d[o + 3] < 200 || Math.abs(d[o] - pts[i + 2]) > 6 || Math.abs(d[o + 1] - pts[i + 3]) > 6 || Math.abs(d[o + 2] - pts[i + 4]) > 6) {
            if (++miss > maxMiss) break;
          }
        }
        if (miss <= maxMiss && n - miss > bestHit) { bestHit = n - miss; best = { x: ox, y: oy }; }
      }
    }
    return best && bestHit >= n * 0.75 ? best : null;
  }

  function deriveFrame(kit, name, cv, a, hk) {
    const m = alphaMap(cv), W = cv.width, H = cv.height;
    const bb = alphaBBox(m) || { x: 0, y: 0, w: 0, h: 0 };
    const f = { name, cv, W, H, bb, root: a.root, palm: a.palm || null, sf: a.strikeFace || null, wrist: a.wrist || null, runes: [], pixels: [] };
    // centroid, pixel sample, rune studs
    let sx = 0, sy = 0, cnt = 0;
    const runeMask = m ? new Uint8Array(W * H) : null;
    if (m) {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (m.a[i] < 128) continue;
        sx += x + 0.5; sy += y + 0.5; cnt++;
        const r = m.d[i * 4], g = m.d[i * 4 + 1], b = m.d[i * 4 + 2];
        if (isRunePx(r, g, b)) runeMask[i] = 1;
        f.pixels.push(x, y, r, g, b);
      }
      // rune studs = connected clusters of rune-coloured pixels (largest 3)
      const seen = new Uint8Array(W * H), clusters = [];
      for (let i = 0; i < W * H; i++) {
        if (!runeMask[i] || seen[i]) continue;
        const st = [i]; seen[i] = 1;
        let n = 0, cx = 0, cy = 0;
        while (st.length) {
          const j = st.pop(), x = j % W, y = (j / W) | 0;
          n++; cx += x + 0.5; cy += y + 0.5;
          for (const o of [j - 1, j + 1, j - W, j + W]) if (o >= 0 && o < W * H && runeMask[o] && !seen[o] && Math.abs((o % W) - x) <= 1) { seen[o] = 1; st.push(o); }
        }
        if (n >= 2) clusters.push({ x: cx / n, y: cy / n, n });
      }
      clusters.sort((p, q) => q.n - p.n);
      f.runes = clusters.slice(0, 3);
    }
    if (Array.isArray(a.runes) && a.runes.length) f.runes = a.runes.filter(Boolean).slice(0, 3).map((p) => ({ x: p.x, y: p.y, n: 1 }));
    f.centroid = cnt ? { x: sx / cnt, y: sy / cnt } : { x: f.root.x + 20, y: f.root.y };
    const dir = f.wrist ? unit(f.wrist.x - f.root.x, f.wrist.y - f.root.y)
      : a.axisDeg != null ? { x: Math.cos(a.axisDeg * DEG), y: Math.sin(a.axisDeg * DEG) }
      : unit(f.centroid.x - f.root.x, f.centroid.y - f.root.y);
    f.axis = dir;
    f.top = cnt ? bb.y : f.root.y;
    // hammer anchors inside the frame
    const hn = HELD_HAMMER[name];
    if (hn && hk) {
      let off = a.hammerOffset || null;
      if (!off && m && !kit.virtual) { const mt = matchHammer(m, hk, hn); if (mt) off = mt; }
      if (!off && name === 'catch' && f.palm) off = { x: f.palm.x - hk.grip.idle.x, y: f.palm.y - hk.grip.idle.y };
      if (!off && name === 'heldImpact' && f.sf) off = { x: f.sf.x - hk.strikeFace.x, y: f.sf.y - hk.strikeFace.y };
      if (!off) {
        const gp = f.wrist ? { x: f.wrist.x + dir.x * 3, y: f.wrist.y + dir.y * 3 } : { x: f.root.x + dir.x * 34, y: f.root.y + dir.y * 34 };
        off = { x: gp.x - hk.grip[hn].x, y: gp.y - hk.grip[hn].y, guess: true };
      }
      f.hamOff = off;
      f.grip = a.grip || { x: off.x + hk.grip[hn].x, y: off.y + hk.grip[hn].y };
      f.headC = a.headCenter || { x: off.x + hk.headC[hn].x, y: off.y + hk.headC[hn].y };
      if (name === 'heldImpact') {
        f.headTop = a.headTop || { x: off.x + hk.headTop.x, y: off.y + hk.headTop.y };
        if (!f.sf) f.sf = { x: off.x + hk.strikeFace.x, y: off.y + hk.strikeFace.y };
      } else if (a.headTop) f.headTop = a.headTop;
    }
    // reach along the axis and toward the head (root -> head centroid for held frames)
    const reach = (ax) => {
      let L = 0;
      for (let i = 0; i < f.pixels.length; i += 5) {
        const dd = (f.pixels[i] + 0.5 - f.root.x) * ax.x + (f.pixels[i + 1] + 0.5 - f.root.y) * ax.y;
        if (dd > L) L = dd;
      }
      return L;
    };
    f.L = reach(dir) + 1;
    f.axisR = f.headC ? unit(f.headC.x - f.root.x, f.headC.y - f.root.y) : dir;
    f.Lr = reach(f.axisR) + 2;
    // keep a modest pixel sample (placement and sparkle sampling)
    if (f.pixels.length > 5 * 500) {
      const keep = [], step = Math.ceil(f.pixels.length / 5 / 500);
      for (let i = 0; i < f.pixels.length; i += 5 * step) keep.push(f.pixels[i], f.pixels[i + 1], f.pixels[i + 2], f.pixels[i + 3], f.pixels[i + 4]);
      f.pixels = keep;
    }
    return f;
  }

  function finishHandKit(kit) {
    kit.ghost = {}; kit.sil = {}; kit.white = {}; kit.ice = {}; kit.shadow = {}; kit.ink = {}; kit.shadowD = {}; kit.castD = {};
    for (const n in kit.f) {
      const f = kit.f[n], cv = f.cv;
      kit.ghost[n] = ditherCopy(cv, [60, 188, 252], 'sparse');
      kit.sil[n] = tintCanvas(cv, '#000000');
      kit.white[n] = whiteCanvas(cv);
      kit.ice[n] = tintCanvas(cv, '#3cbcfc');
      kit.shadow[n] = shadowCanvas(kit.sil[n], f);
      kit.shadowD[n] = ditherCopy(kit.shadow[n], [188, 188, 188], 'half');
      kit.castD[n] = ditherCopy(kit.shadow[n], [124, 124, 124], 'half');
      kit.ink[n] = inkCanvas(cv);
    }
    // strike face relative to the root for each impact frame (the overhead slam and the side blow)
    kit.Vs = {};
    for (const n in IMPACT_FRAMES) { const f = kit.f[n]; if (f && f.sf) kit.Vs[n] = { x: f.sf.x - f.root.x, y: f.sf.y - f.root.y }; }
    kit.V = kit.Vs.heldImpact;
    kit.thick = kit.virtual ? 4 : 11; // forearm thickness in art px (contract: about 11u)
    return kit;
  }
  function buildVirtualHand(hk) {
    // place every held hammer frame so that its grip sits at root + VIRTUAL[n].g
    let x0 = 0, y0 = 0, x1 = 0, y1 = 0;
    for (const n of HAND_FRAMES) {
      const v = VIRTUAL[n], hn = HELD_HAMMER[n];
      if (!v.g) continue;
      const gx = v.g[0] - hk.grip[hn].x, gy = v.g[1] - hk.grip[hn].y;
      x0 = Math.min(x0, gx - 1); y0 = Math.min(y0, gy - 1); x1 = Math.max(x1, gx + hk.W + 1); y1 = Math.max(y1, gy + hk.H + 1);
    }
    const root = { x: Math.ceil(-x0) + 2, y: Math.ceil(-y0) + 2 };
    const W = Math.ceil(root.x + x1) + 2, H = Math.ceil(root.y + y1) + 2;
    const kit = { virtual: true, W, H, f: {} };
    for (const n of HAND_FRAMES) {
      const v = VIRTUAL[n], hn = HELD_HAMMER[n];
      const cv = emptyLike(W, H);
      const a = { root: { x: root.x, y: root.y }, axisDeg: v.axisDeg };
      if (v.palm) a.palm = { x: root.x + v.palm[0], y: root.y + v.palm[1] };
      if (v.g) {
        const ox = Math.round(root.x + v.g[0] - hk.grip[hn].x), oy = Math.round(root.y + v.g[1] - hk.grip[hn].y);
        const x = cv.getContext('2d');
        x.imageSmoothingEnabled = false;
        x.drawImage(v.glow ? glowOutline(hk.frames.raised) : hk.frames[hn], ox, oy);
        a.hammerOffset = { x: ox, y: oy };
        if (n === 'catch') a.palm = { x: ox + hk.grip.idle.x, y: oy + hk.grip.idle.y };
        if (n === 'heldImpact') a.strikeFace = { x: ox + hk.strikeFace.x, y: oy + hk.strikeFace.y };
        if (n === 'heldSide' || n === 'heldSideMid') { const g0 = hk.grip.idle; a.strikeFace = { x: ox + g0.x + (hk.headC.idle.x - g0.x) + hk.headW / 2, y: oy + hk.headC.idle.y }; }
        a.wrist = { x: root.x + v.g[0] * 0.85, y: root.y + v.g[1] * 0.85 };
      }
      kit.f[n] = deriveFrame(kit, n, cv, a, hk);
    }
    return finishHandKit(kit);
  }

  // does the sprite declare that it already dithers its own cut end? (hand-sprite v3: art.fade / Hand.fade)
  function spriteFadesCut(src) {
    const flag = (o) => !!(o && (o.cutFade === true || Number(o.cutFade) > 0 || Number(o.fade) > 0));
    return flag(src) || flag(src && src.art) || flag(NS.Hand);
  }

  function getHandKit() {
    const hk = getHammerKit();
    if (handKit && !(handKit.virtual && NS.Hand && typeof NS.Hand.create === 'function')) return handKit;
    const lib = NS.Hand;
    let kit = null;
    if (lib && typeof lib.create === 'function') {
      try {
        const src = lib.create(1);
        const F = src && src.frames, A = (src && src.anchors) || {};
        if (F && F.heldImpact && A.heldImpact && A.heldImpact.root && A.heldImpact.strikeFace) {
          kit = { virtual: false, W: F.heldImpact.width, H: F.heldImpact.height, f: {}, src, cut: { pre: spriteFadesCut(src), faded: 0 } };
          // the cut-end fade, once per frame at scale 1 (before any derived variant is built from it)
          const prep = (cv, an) => {
            if (kit.cut.pre) return cv;
            const ax = an.axis && isFinite(an.axis.x) ? an.axis
              : an.wrist ? unit(an.wrist.x - an.root.x, an.wrist.y - an.root.y) : { x: 1, y: 0 };
            const r = fadeCutEnd(cv, an.root, ax, CUT_FADE, CUT_HALF);
            if (r.pre) kit.cut.pre = true; else if (r.done) kit.cut.faded++;
            return r.cv;
          };
          const fb = { heldWindup: 'glowHeldRaised', glowHeldRaised: 'heldRaised', heldSmear: 'heldSwing', heldSwing: 'heldImpact', heldRaised: 'heldSwing', catch: 'open', heldSide: 'heldImpact', heldSideBack: 'heldWindup', heldSideSwing: 'heldSide', heldSideMid: 'heldSideSwing' };
          for (const n of HAND_FRAMES) {
            let cv = F[n], an = A[n], nn = n, guard = 0;
            while (!cv && fb[nn] && guard++ < 4) { nn = fb[nn]; cv = F[nn]; an = an || A[nn]; }
            if (!cv) cv = F.heldImpact;
            if (n === 'glowHeldRaised' && !F.glowHeldRaised) cv = glowOutline(cv);
            an = Object.assign({}, an || {});
            if (!an.root) an.root = (A[nn] && A[nn].root) || A.heldImpact.root;
            kit.f[n] = deriveFrame(kit, n, prep(cv, an), an, hk);
          }
          for (const n of ['open0', 'open1', 'open2']) {
            if (!F[n]) continue;
            const an = Object.assign({}, A[n] || A.open || {}, { root: (A[n] && A[n].root) || A.open.root });
            kit.f[n] = deriveFrame(kit, n, prep(F[n], an), an, hk);
          }
          finishHandKit(kit);
        }
      } catch (e) { console.warn('[ThorLink] Hand.create(1) failed, the hammer flies on its own', e); kit = null; }
    }
    if (!kit) kit = buildVirtualHand(hk);
    handKit = kit;
    return kit;
  }
  // Mirrored strikes (side -1) flip the whole frame, which would also flip the asymmetric Thurisaz rune on the
  // hammer head. This overlay (scale 1, blitted with the same mirror right after the frame) paints the plate colour
  // over the rune's pixels and the rune itself reflected inside its own box, so on screen it reads unmirrored.
  const RUNE_GOLD = [[172, 124, 0], [248, 184, 0], [248, 216, 120]];
  function runeOverlay(f) {
    if (f.runeOv !== undefined) return f.runeOv;
    f.runeOv = null;
    const m = alphaMap(f.cv);
    if (!m || !f.headC) return null;
    const W = m.w, pts = [], R = 9;
    const gold = (i) => RUNE_GOLD.some((c) => Math.abs(m.d[i * 4] - c[0]) < 6 && Math.abs(m.d[i * 4 + 1] - c[1]) < 6 && Math.abs(m.d[i * 4 + 2] - c[2]) < 6);
    for (let y = Math.max(0, Math.floor(f.headC.y - R)); y < Math.min(m.h, f.headC.y + R); y++) {
      for (let x = Math.max(0, Math.floor(f.headC.x - R)); x < Math.min(W, f.headC.x + R); x++) {
        const i = y * W + x;
        if (m.a[i] > 200 && gold(i)) pts.push([x, y, i]);
      }
    }
    if (pts.length < 3 || pts.length > 48) return null;
    let x0 = W, x1 = -1, y0 = m.h, y1 = -1;
    for (const q of pts) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
    const cnt = new Map(), isG = new Set(pts.map((q) => q[2]));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = y * W + x;
      if (m.a[i] < 200 || isG.has(i)) continue;
      const key = (m.d[i * 4] << 16) | (m.d[i * 4 + 1] << 8) | m.d[i * 4 + 2];
      cnt.set(key, (cnt.get(key) || 0) + 1);
    }
    let plate = -1, best = 0;
    cnt.forEach((v, key) => { if (v > best && key !== 0) { best = v; plate = key; } });
    if (plate < 0) return null;
    const c = makeCanvas(W, m.h), x = c.getContext('2d'), id = x.createImageData(W, m.h), d = id.data;
    const put = (X, Y, r, g, b) => { const o = (Y * W + X) * 4; d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255; };
    for (const q of pts) put(q[0], q[1], plate >> 16, (plate >> 8) & 255, plate & 255);
    for (const q of pts) put(x0 + x1 - q[0], q[1], m.d[q[2] * 4], m.d[q[2] * 4 + 1], m.d[q[2] * 4 + 2]);
    x.putImageData(id, 0, 0);
    return (f.runeOv = c);
  }

  // hammer-head outline sites of a held frame (charge crackle attaches here), cached on the frame
  function headEdge(f, hk) {
    if (f.hEdge) return f.hEdge;
    const e = edgeList(f.cv), out = [];
    if (f.headC) {
      const R = hk.headW * 0.62 + 2;
      for (let j = 0; j < e.length; j += 3) if (Math.hypot(e[j] + 0.5 - f.headC.x, e[j + 1] + 0.5 - f.headC.y) <= R) out.push(e[j], e[j + 1]);
    }
    f.hEdge = Int32Array.from(out);
    return f.hEdge;
  }

  /* ====================================================================
   * 10. LIGHTNING: midpoint displacement with stored offsets (fine levels can be re-randomized for
   *     restrikes), vertex shimmer, primary + sub branches that flicker independently, Path2D cache.
   *     Bolt.fromPoints() copies an existing channel (the restrike reuses the trunk's top 60%).
   * ==================================================================== */
  class Bolt {
    constructor(x0, y0, x1, y1, depth, rand, jit) {
      this.depth = depth; this.n = 1 << depth; this.rand = rand; this.jit = jit == null ? 0.45 : jit;
      this.x0 = x0; this.y0 = y0; this.x1 = x1; this.y1 = y1;
      const N = this.n + 1;
      this.off = new Float32Array(N); this.px = new Float32Array(N); this.py = new Float32Array(N);
      this.sx = new Float32Array(N); this.sy = new Float32Array(N);
      for (let i = 1; i < this.n; i++) this.off[i] = rand() - 0.5;
      this.branches = []; this.ver = 0; this._cache = null; this.fixed = null;
      this.layout();
    }
    static fromPoints(xs, ys, rand) {
      const b = Object.create(Bolt.prototype);
      const n = xs.length - 1;
      b.depth = 0; b.n = n; b.rand = rand; b.jit = 0;
      b.x0 = xs[0]; b.y0 = ys[0]; b.x1 = xs[n]; b.y1 = ys[n];
      b.off = new Float32Array(n + 1); b.px = Float32Array.from(xs); b.py = Float32Array.from(ys);
      b.sx = new Float32Array(n + 1); b.sy = new Float32Array(n + 1);
      b.fixed = { xs: Float32Array.from(xs), ys: Float32Array.from(ys) };
      b.branches = []; b.ver = 0; b._cache = null;
      return b;
    }
    layout() {
      if (this.fixed) { this.anchorBranches(); this.ver++; return; }
      const n = this.n, px = this.px, py = this.py, off = this.off, j = this.jit;
      px[0] = this.x0; py[0] = this.y0; px[n] = this.x1; py[n] = this.y1;
      for (let step = n; step > 1; step >>= 1) {
        const h = step >> 1;
        for (let i = h; i < n; i += step) {
          const ax = px[i - h], ay = py[i - h], bx = px[i + h], by = py[i + h];
          px[i] = (ax + bx) * 0.5 - (by - ay) * off[i] * j;
          py[i] = (ay + by) * 0.5 + (bx - ax) * off[i] * j;
        }
      }
      this.anchorBranches();
      this.ver++;
    }
    // 3 big silhouette kinks on the coarse levels
    kink(count, amp) {
      const idx = [this.n >> 1, this.n >> 2, (3 * this.n) >> 2, this.n >> 3, (5 * this.n) >> 3];
      for (let i = 0; i < Math.min(count, idx.length); i++) if (idx[i] > 0 && idx[i] < this.n) this.off[idx[i]] = (this.rand() < 0.5 ? -1 : 1) * amp * (0.7 + 0.3 * this.rand());
      this.layout();
    }
    anchorBranches() {
      for (const b of this.branches) {
        const x = this.px[b.at] + this.sx[b.at], y = this.py[b.at] + this.sy[b.at];
        b.bolt.x0 = x; b.bolt.y0 = y; b.bolt.x1 = x + b.vx; b.bolt.y1 = y + b.vy;
        b.bolt.layout();
      }
    }
    // primary branches: angMin..angMax degrees off the channel, fracMin..fracMax of the remaining length,
    // each with 0..subMax sub-branches. Branch points come from levels 2-5, never the endpoints.
    addBranches(count, depth, o) {
      o = o || {};
      const n = this.n, cands = [];
      for (let lvl = 2; lvl <= 5; lvl++) { const h = n >> lvl; if (h < 1) continue; for (let i = h; i < n; i += 2 * h) if (i > n * 0.06 && i < n * 0.94) cands.push(i); }
      for (let i = cands.length - 1; i > 0; i--) { const j = Math.floor(this.rand() * (i + 1)); const t = cands[i]; cands[i] = cands[j]; cands[j] = t; }
      const used = new Set();
      for (const i of cands) {
        if (used.size >= count) break;
        let near = false;
        for (const u of used) if (Math.abs(u - i) < n / 24) near = true;
        if (near) continue;
        used.add(i);
        this.branchAt(i, depth, o, 1);
      }
      this.ver++;
      return this;
    }
    branchAt(i, depth, o, level) {
      const n = this.n, px = this.px, py = this.py, r = this.rand;
      const i0 = Math.max(0, i - 2), i1 = Math.min(n, i + 2);
      let dx = px[i1] - px[i0], dy = py[i1] - py[i0];
      const L = Math.hypot(dx, dy) || 1;
      dx /= L; dy /= L;
      const a0 = o.angMin == null ? 20 : o.angMin, a1 = o.angMax == null ? 45 : o.angMax;
      const ang = (a0 + r() * (a1 - a0)) * DEG * (r() < 0.5 ? -1 : 1);
      const c = Math.cos(ang), s = Math.sin(ang), rx = dx * c - dy * s, ry = dx * s + dy * c;
      const f0 = o.fracMin == null ? 0.3 : o.fracMin, f1 = o.fracMax == null ? 0.6 : o.fracMax;
      const len = Math.hypot(this.x1 - px[i], this.y1 - py[i]) * (f0 + r() * (f1 - f0)) * (level > 1 ? 0.6 : 1);
      const bolt = new Bolt(px[i], py[i], px[i] + rx * len, py[i] + ry * len, depth, r, 0.5);
      const br = { at: i, vx: rx * len, vy: ry * len, bolt, level, flick: 1, nextFlick: 0 };
      if (level === 1 && o.subMax && depth > 2) {
        const ns = Math.floor(r() * (o.subMax + 1));
        for (let k = 0; k < ns; k++) bolt.branchAt(Math.max(1, Math.floor(bolt.n * (0.3 + 0.4 * r()))), depth - 1, o, 2);
      }
      this.branches.push(br);
    }
    shimmer(amp) {
      const n = this.n;
      for (let i = 1; i < n; i++) { this.sx[i] = (this.rand() * 2 - 1) * amp; this.sy[i] = (this.rand() * 2 - 1) * amp; }
      for (const b of this.branches) b.bolt.shimmer(amp * 0.8);
      this.anchorBranches();
      this.ver++;
    }
    // re-randomize only the finest `levels` subdivision levels (restrike = same channel)
    rejitterFine(levels) {
      if (this.fixed) { this.shimmer(levels * 1.2); return; }
      const lim = 1 << levels;
      for (let i = 1; i < this.n; i++) if ((i & -i) < lim) this.off[i] = this.rand() - 0.5;
      for (const b of this.branches) b.bolt.rejitterFine(levels);
      this.layout();
    }
    tip(m) { m = clamp(m | 0, 0, this.n); return { x: this.px[m] + this.sx[m], y: this.py[m] + this.sy[m] }; }
    trace(path, m) {
      path.moveTo(this.px[0] + this.sx[0], this.py[0] + this.sy[0]);
      for (let i = 1; i <= m; i++) path.lineTo(this.px[i] + this.sx[i], this.py[i] + this.sy[i]);
    }
    // main path up to vertex `upto`, plus each branch (and its subs) as its own path
    paths(upto) {
      const m = upto == null ? this.n : Math.max(1, Math.min(this.n, upto | 0));
      const c = this._cache;
      if (c && c.ver === this.ver && c.m === m) return c;
      const main = new Path2D();
      this.trace(main, m);
      const br = [];
      for (const b of this.branches) {
        if (b.at > m) continue;
        const p = new Path2D();
        b.bolt.trace(p, b.bolt.n);
        const subs = [];
        for (const sb of b.bolt.branches) { const q = new Path2D(); sb.bolt.trace(q, sb.bolt.n); subs.push({ p: q, b: sb }); }
        br.push({ p, b, subs });
      }
      return (this._cache = { ver: this.ver, m, main, br });
    }
    length() {
      let L = 0;
      for (let i = 1; i <= this.n; i++) L += Math.hypot(this.px[i] - this.px[i - 1], this.py[i] - this.py[i - 1]);
      return L;
    }
  }

  // Bolt styles for a light page, all drawn source-over: widths in css px of the layers
  //   [glow, edge, mid, inner, core]: glow = a soft saturated indigo halo stamped on the FX canvas; edge = a
  //   dark ink channel under the body (what makes the bolt read on white); mid = azure body; inner = sky;
  //   core = white-hot centre. 0 skips a layer. Branches take 0.55 of each width, sub-branches 0.35.
  const BOLT = {
    trunk: [36, 13, 9, 5, 2.5],
    sky: [50, 16, 11, 6, 3.2],       // the hero bolt into the raised hammer: the widest of all
    skyFlank: [24, 8, 5.5, 3, 1.6],  // the two flank channels converging on it: half its width (and drawn fainter)
    sister: [24, 9, 6, 3.2, 1.8],
    restrike: [26, 10, 7, 3.6, 2],
    leader: [18, 6, 4, 2.2, 1.5],
    arc: [0, 4.4, 2.6, 0, 1.2],
    micro: [0, 3.4, 2, 0, 1],
  };
  const BOLT_COL = [RGB.violetD, [24, 16, 72], RGB.blue, RGB.cyan, [255, 255, 255]];
  const BOLT_A = [0.75, 0.85, 1, 1, 1];

  // centripetal Catmull-Rom point between p1 and p2 (Barry-Goldman), t in [0, 1]
  function catmull(p0, p1, p2, p3, t) {
    const td = (p, q) => Math.max(1e-3, Math.sqrt(Math.hypot(q.x - p.x, q.y - p.y)));
    const t1 = td(p0, p1), t2 = t1 + td(p1, p2), t3 = t2 + td(p2, p3), tt = t1 + (t2 - t1) * t;
    const L = (a, b, ta, tb) => { const w = (tt - ta) / (tb - ta); return { x: a.x + (b.x - a.x) * w, y: a.y + (b.y - a.y) * w }; };
    const A1 = L(p0, p1, 0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3);
    return L(L(A1, A2, 0, t2), L(A2, A3, t1, t3), t1, t2);
  }

  /* ====================================================================
   * 11. PARTICLE POOL (no per-frame allocation; swap-pop removal)
   * ==================================================================== */
  class Pool {
    constructor(cap) { this.cap = cap; this.live = []; this.dead = []; }
    spawn() {
      if (this.live.length >= this.cap) return null;
      const p = this.dead.pop() || {};
      this.live.push(p);
      return p;
    }
    step(fn) {
      const L = this.live;
      for (let i = L.length - 1; i >= 0; i--) {
        if (!fn(L[i])) { this.dead.push(L[i]); L[i] = L[L.length - 1]; L.pop(); }
      }
    }
    clear() { while (this.live.length) this.dead.push(this.live.pop()); }
  }

  /* ====================================================================
   * 12. AUDIO + HAPTICS GUARDS (contract 3 is optional; nothing here may throw)
   * ==================================================================== */
  function sfx(name, arg, fb, fbArg, o) {
    const A = NS.Audio;
    if (!A) return;
    try {
      if (typeof A[name] === 'function') { if (o) A[name](arg, o); else if (arg === undefined) A[name](); else A[name](arg); return; }
      if (fb && typeof A[fb] === 'function') { if (o) A[fb](fbArg, o); else if (fbArg === undefined) A[fb](); else A[fb](fbArg); }
    } catch (e) { /* audio must never break the visual */ }
  }
  function vibrate(p) {
    try { if (global.navigator && typeof global.navigator.vibrate === 'function') global.navigator.vibrate(p); } catch (e) { /* no-op */ }
  }

  // main-clock cue sheet: [base ms, method, duration (base ms) or undefined, fallback method, fallback duration, options]
  const CUES = [
    [100, 'materialize', 320, 'crackle', 220, (st) => ({ pan: st.panHand })],
    [300, 'rumble', 2200, null, null, { gainDb: -6 }],
    [540, 'summon', undefined, 'crackle', 360],
    [690, 'hammerFly', 570, 'whoosh', undefined, (st) => ({ side: st.side })],
    [1260, 'catchClang', undefined, 'crackle', 140],
    [1520, 'charge', 900, 'crackle', 880, (st) => ({ vacuumMs: Math.round(120 * st.scale) })],
    [1860, 'crack', undefined, null, null, { gainDb: -4 }],
    [1862, 'crackle', 320],
    [1868, 'thunder', undefined, null, null, { gainDb: -8 }],
    [2540, 'crack'],
    [2545, 'crackle', 400],
    [2555, 'bigThunder', undefined, 'thunder'],
    [2640, 'sizzle', 1400],
    [3020, 'crackle', 250],
    [2855, 'dematerialize', 300, 'crackle', 260, (st) => ({ pan: st.panHand })],
  ];
  const FF_CUES = { crack: 1, bigThunder: 1, sizzle: 1 };

  /* ====================================================================
   * 13. STRIKE: one run of the effect. Methods are split into sections below
   *     (plan, DOM lifecycle, clocks + simulation, rendering, reduced motion) via Object.assign.
   * ==================================================================== */
  let current = null;     // the running Strike, if any
  // Host work that may block the main thread (parsing and building a big next page) waits for a quiet beat of the
  // running strike: never the catch, the sky bolt, the slam or the restrike. One job per frame at most.
  const quietQ = [];
  function whenQuiet(fn) {
    if (typeof fn !== 'function') return;
    if (!current || current.reduced || current.committed || current.finished) { global.setTimeout(fn, 0); return; }
    quietQ.push(fn);
  }
  const BUSY = [[T.CATCH - 80, T.CATCH + 120], [T.SKY - 120, T.SKY + 150], [T.SWING - 160, T.HITSTOP_END + 60], [T.RESTRIKE - 60, T.RESTRIKE + 90]];
  function flushQuiet() {
    while (quietQ.length) { const fn = quietQ.shift(); global.setTimeout(fn, 0); }
  }
  let lastStats = null;
  let liveRegion = null;
  let attachedOpts = null;
  let attachCount = 0;

  class Strike {
    constructor(target, href, opts, evt) {
      this.anchor = target;
      this.href = href;
      this.opts = opts;
      this.evt = evt;
      this.scale = clamp(Number(opts.durationScale) || 1, 0.92, 1.077); // total 4600-5400ms
      this.seed = opts.seed != null ? opts.seed >>> 0 : (Math.random() * 4294967296) >>> 0;
      this.rand = makeRand(this.seed);
      this.noise = makeNoise1(this.rand);
      this.noise2 = makeNoise2(this.rand);
      this.ev = Object.create(null);
      this.cueDone = Object.create(null);
      this.listeners = [];
      this.attrs = [];
      this.R = 0;
      this.burnOffset = 0;
      this.armHold = 0;
      this.gt = 0;
      this.worldT = 0;
      this.wdt = 0;
      this.shake = { x: 0, y: 0 };
      this.domOn = false;
      this.renderState = 'idle';
      this.mounted = false;
      this.committed = false;
      this.finished = false;
      this.waiting = false;
      this.lowQ = opts.quality === 'low';       // particles (auto may switch this on mid-strike)
      this.lowBolts = opts.quality === 'low';   // lightning detail: only an explicit 'low' ever thins it
      this.autoQ = !opts.quality || opts.quality === 'auto';
      this.frameLog = [];
      this.frames = 0;
      this.maxFrame = 0;
      this.flashLog = [];
      this.flashes = [];
      this.beatLog = [];
      this.scrollLocked = false;
      this.dyn = { call: [], catch: [], stream: [], micro: [], elmo: [], ground: [], lock: [] };
      this.trace = opts.trace ? [] : null;
      this.dynAt = Object.create(null);
    }

    start() {
      this.promise = new Promise((res) => { this._resolve = res; });
      this.now = typeof this.opts.clock === 'function' ? this.opts.clock : () => performance.now();
      this.t0 = this.now();
      if (this.opts.sound !== false) sfx('unlock'); // inside the click gesture
      const rm = this.opts.reducedMotion;
      this.reduced = rm === 'always' || rm === true ||
        (rm !== 'never' && rm !== false && !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches));
      const c0 = performance.now();
      this.measure();
      if (this.reduced) { this.runReduced(); return this.promise; }
      const c1 = performance.now();
      this.plan();
      const c2 = performance.now();
      this.setupDOM();
      this.startCost = { measure: Math.round((c1 - c0) * 10) / 10, plan: Math.round((c2 - c1) * 10) / 10, dom: Math.round((performance.now() - c2) * 10) / 10 };
      if (this.opts.sound !== false) sfx('crackle', 80 * this.scale); // the tactile tick, in the click task
      this.dispatch('thor:start', 0);
      this._frame = (now) => this.frame(now);
      this.raf = global.requestAnimationFrame(this._frame);
      if (!this.opts.clock) this.watchdog = global.setTimeout(() => this.finishNow('watchdog'), Math.round(7000 * this.scale));
      return this.promise;
    }

    dispatch(type, ms, extra) {
      try {
        global.dispatchEvent(new CustomEvent(type, { detail: Object.assign({ href: this.href, ms }, extra || {}) }));
      } catch (e) { /* old browsers */ }
    }

    /* ---------- click-time measurement: every rect is read once, now ---------- */
    measure() {
      const a = this.anchor, evt = this.evt;
      const vw = (this.vw = global.innerWidth), vh = (this.vh = global.innerHeight);
      this.layerW = doc.documentElement.clientWidth || vw;
      this.mobile = vw < 600;
      this.devDpr = global.devicePixelRatio || 1;
      this.pxDpr = Math.min(this.devDpr, 3);
      this.fxDpr = this.devDpr >= 2 ? 1 : Math.min(this.devDpr, 1.5);
      const cs = global.getComputedStyle(a);
      const bb = rectObj(a.getBoundingClientRect());
      const rects = Array.prototype.map.call(a.getClientRects(), rectObj).filter((r) => r.w > 0.5 && r.h > 0.5);
      const tag = (a.tagName || '').toUpperCase();
      this.isButton = tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || a.getAttribute('role') === 'button';
      const media = a.querySelector ? a.querySelector('img,svg,canvas,picture,video') : null;
      this.isCard = this.isButton || (bb.w > 200 && bb.h > 48) || (!!media && bb.h > 40);
      const pointer = !!(evt && evt.detail > 0 && evt.clientX != null);
      let hit;
      if (this.isCard || rects.length <= 1) hit = this.isCard ? bb : rects[0] || bb;
      else if (pointer) {
        let best = rects[0], bd = Infinity;
        for (const r of rects) {
          const dx = Math.max(r.l - evt.clientX, 0, evt.clientX - r.r), dy = Math.max(r.t - evt.clientY, 0, evt.clientY - r.b);
          const d = dx * dx + dy * dy;
          if (d < bd) { bd = d; best = r; }
        }
        hit = best;
      } else hit = rects[0];
      this.rects = this.isCard ? [bb] : rects.length ? rects : [bb];
      this.hit = hit;
      this.hitIndex = Math.max(0, this.rects.indexOf(hit));
      this.bb = bb;
      let px, py;
      if (this.isButton) { px = bb.cx; py = bb.cy; }
      else if (this.isCard) {
        px = pointer ? clamp(evt.clientX, bb.l + 8, bb.r - 8) : bb.cx;
        py = pointer ? clamp(evt.clientY, bb.t + 8, bb.b - 8) : bb.t + Math.min(bb.h * 0.35, 40);
      } else {
        px = pointer ? clamp(evt.clientX, hit.l + 2, hit.r - 2) : hit.cx;
        py = hit.t + 0.35 * hit.h;
      }
      this.P0 = { x: clamp(px, 4, vw - 4), y: clamp(py, 4, vh - 4) };
      this.pointerXY = pointer ? { x: evt.clientX, y: evt.clientY } : { x: hit.l + Math.min(10, hit.w / 2), y: hit.cy };
      this.linkW = Math.min(hit.w, 420);
      this.linkH = Math.min(hit.h, 160);
      const fs = parseFloat(cs.fontSize) || 16;
      this.lineH = parseFloat(cs.lineHeight) || fs * 1.3;
      this.textColor = cs.color || '#3366cc';
      this.font = (cs.fontStyle || 'normal') + ' ' + (cs.fontWeight || '400') + ' ' + (cs.fontSize || '16px') + ' ' + (cs.fontFamily || 'sans-serif');
      this.text = (a.textContent || a.value || '').replace(/\s+/g, ' ').trim();
      const solid = (c) => c && c !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(c);
      const bodyBg = global.getComputedStyle(doc.body).backgroundColor, htmlBg = global.getComputedStyle(doc.documentElement).backgroundColor;
      this.pageBg = solid(bodyBg) ? bodyBg : solid(htmlBg) ? htmlBg : '#ffffff';
      // drop / shake wrapper (opt-in): never body or html
      let st = this.opts.shakeTarget;
      if (typeof st === 'string') { try { st = doc.querySelector(st); } catch (e) { st = null; } }
      if (!st) st = doc.querySelector('[data-thor-shake]');
      if (st === doc.body || st === doc.documentElement) st = null;
      this.wrap = st || null;
      this.inWrap = !!(st && st.contains(a));
      // visible links, batch-read once: nearest 40 within 360px (conduction, sisters) + a wider set. Every link
      // of the document is tested (cheap rect test first), and only links a reader can actually see count: not
      // inside [data-thor="off"], [hidden], [inert] or a closed <details>, not visibility:hidden / opacity:0, and
      // not covered by something else at the centre of its first line box
      const root = this.opts.root || doc;
      const all = root.querySelectorAll(this.opts.selector || 'a[href]');
      const list = [];
      const canCheck = !!(all[0] && typeof all[0].checkVisibility === 'function');
      for (let i = 0; i < all.length; i++) {
        const el = all[i];
        if (el === a || a.contains(el) || el.contains(a)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
        if (el.closest('[data-thor="off"],[hidden],[inert],details:not([open])')) continue;
        if (canCheck && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true, contentVisibilityAuto: true })) continue;
        const lines = Array.prototype.map.call(el.getClientRects(), rectObj).filter((q) => q.w > 2 && q.h > 2);
        const L0 = lines[0] || rectObj(r);
        const hx = clamp(L0.cx, 1, vw - 1), hy = clamp(L0.cy, 1, vh - 1), hit = doc.elementFromPoint(hx, hy);
        if (!hit || (hit !== el && !el.contains(hit))) continue;
        const o = rectObj(r);
        o.inWrap = !!(st && st.contains(el));
        o.d = Math.hypot(o.cx - this.P0.x, o.cy - this.P0.y);
        o.text = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 48);
        o.lines = lines.length ? lines : [o];
        o.el = el;
        list.push(o);
      }
      list.sort((p, q) => p.d - q.d);
      this.allLinks = list.slice(0, 160);
      this.links = list.filter((l) => l.d <= 360).slice(0, 40);
      this.linkFont = this.font;
      this.linkColor = this.textColor;
      this.avoid = [];
      if (this.opts.avoid) {
        try { doc.querySelectorAll(this.opts.avoid).forEach((el) => { const r = el.getBoundingClientRect(); if (r.width > 0) this.avoid.push(rectObj(r)); }); } catch (e) { /* bad selector */ }
      }
      // a struck button keeps its form's other controls clear (the side blow comes from the free side, so the
      // hammer head never lies across the search field)
      if (this.isButton && a.closest) {
        const form = a.closest('form');
        if (form) form.querySelectorAll('input,textarea,select,button').forEach((el) => { if (el === a) return; const r = el.getBoundingClientRect(); if (r.width > 0 && r.height > 0) this.avoid.push(rectObj(r)); });
      }
    }

    /* ---------- the plan: scale, placement, cast, flight, lightning, burn ---------- */
    plan() {
      const pc = [], tick = (n) => pc.push(n, performance.now());
      tick('kits');
      this.hk = getHammerKit();
      this.hd = getHandKit();
      tick('place');
      this.planScale();
      this.planPlacement();
      this.planLinks();
      this.planCast();
      tick('flight');
      this.planFlight();
      tick('bolts');
      this.planLightning();
      tick('burn');
      this.planBurn();
      this.planParticles();
      // the engine's own dissolve masks are only needed when the sprite does not dither itself
      if (!this.spriteDither()) {
        const fa = this.hd.f.open0 || this.hd.f.open;
        if (fa) dissolveData(fa);
        dissolveData(this.hd.f[this.impF]);
      }
      tick('end');
      this.planCost = {};
      for (let i = 0; i + 3 < pc.length; i += 2) this.planCost[pc[i]] = Math.round((pc[i + 3] - pc[i + 1]) * 10) / 10;
    }
    spriteDither() {
      const hd = this.hd;
      return !hd.virtual && hd.cut && hd.cut.pre && !this.noSpriteDither && NS.Hand && typeof NS.Hand.dither === 'function';
    }

    // k = device px per art px: the integer whose head width is nearest the target (ties go to the smaller k,
    // never fractional). 1280px at DPR 1: k = 4 (head 120px); 600-1023px: k = 3 (90px, the tie at 105 rounds
    // down); a 390px phone: 3 css px per art px (k = 3 at DPR 1, 9 at DPR 3); DPR 2 desktop: k = 8.
    planScale() {
      const vw = this.vw;
      const target = Number(this.opts.hammerSize) || (vw < 600 ? 90 : vw < 1024 ? 105 : 120);
      this.headTarget = target;
      const x = (target * this.pxDpr) / this.hk.headW, k0 = Math.max(2, Math.floor(x)), k1 = k0 + 1;
      const w = (k) => Math.abs((k * this.hk.headW) / this.pxDpr - target);
      this.setK(w(k0) <= w(k1) ? k0 : k1);
    }
    setK(k) {
      this.k = k;
      this.u = k / this.pxDpr; // css px per art px
    }

    // the three keys the slam passes through on its way to the impact frame (hammer -45 -> 0 -> 45 -> 63 -> 90; the
    // side blow: -45 -> -26.57 -> 0 -> the +26.57 bite)
    swingFrames(impF) {
      const im = impF || this.impF;
      if (!SIDE[im]) return ['heldRaised', 'heldSwing', 'heldSmear'];
      const f = this.hd.f, b = f.heldSideBack ? 'heldSideBack' : 'heldRaised', w = f.heldSideSwing ? 'heldSideSwing' : 'heldRaised';
      return [b, w, im === 'heldSide' && f.heldSideMid ? 'heldSideMid' : w];
    }
    swingOff(impF) { return SIDE[impF || this.impF] ? OFF_SIDE : OFF; }
    // every pose the cast takes: [frame, h, dx, dy, phase] (art px, canonical side), for placement checks.
    // phase: 'pre' (summon, catch), 'sky' (the charge: a little sky above it for the sky bolt), 'coil' (the
    // windup may touch the top edge), 'swing', 'post' (impact and lift, anchored on the link).
    poseSet(pre, impF) {
      const f = this.hd.f, px = pre[0], py = pre[1], R = OFF.raised, W = OFF.windup, sf = this.swingFrames(impF), O = this.swingOff(impF);
      const out = [
        [f.open0 ? 'open0' : 'open', 0, px + OFF.appear[0], py + OFF.appear[1], 'pre'], ['open', -2, px, py, 'pre'], ['catch', -2, px, py, 'pre'],
        ['heldRaised', 0, px + R[0], py + R[1], 'sky'], ['glowHeldRaised', 0, px + R[0], py + R[1], 'sky'],
        ['heldWindup', 0, px + W[0], py + W[1], 'coil'],
        [sf[0], 0, Math.round(px * ARC_PRE) + O.arc[0], Math.round(py * ARC_PRE) + O.arc[1], 'swing'],
        [sf[1], 0, Math.round(px * SWING_PRE) + O.swing[0], Math.round(py * SWING_PRE) + O.swing[1], 'swing'],
        [sf[2], 0, Math.round(px * SMEAR_PRE) + O.smear[0], Math.round(py * SMEAR_PRE) + O.smear[1], 'swing'],
        [impF, 0, 0, 0, 'post'],
      ];
      return out.filter((p) => f[p[0]] && f[p[0]].bb.w);
    }

    // css rect of a hand frame's opaque bbox, for side s with the impact frame's strike face on P
    poseRect(name, h, dx, dy, s, P, impF) {
      const hd = this.hd, f = hd.f[name], u = this.u, V = hd.Vs[impF || this.impF] || hd.V;
      const Qx = P.x - s * V.x * u, Qy = P.y - V.y * u;
      const ox = -h * f.axis.x + (dx || 0), oy = -h * f.axis.y + (dy || 0);
      const x0 = (f.bb.x - f.root.x + ox) * u, x1 = (f.bb.x + f.bb.w - f.root.x + ox) * u;
      const y0 = (f.bb.y - f.root.y + oy) * u, y1 = (f.bb.y + f.bb.h - f.root.y + oy) * u;
      return s > 0 ? { l: Qx + x0, r: Qx + x1, t: Qy + y0, b: Qy + y1 } : { l: Qx - x1, r: Qx - x0, t: Qy + y0, b: Qy + y1 };
    }

    // Placement. The page never moves. The impact pose is anchored on the link. If the summon, catch and
    // charge do not fit above it (the charge keeps a little sky above the head for the sky bolt; the coil may
    // touch the top edge), every pose before the swing takes a pre-offset down (and, when that brings the
    // raised hammer level with the link, away from it): the catch and the charge then happen beside the link
    // and the raise still climbs from the catch. Targets in the top band, where the overhead slam's head would
    // mostly leave the screen, get the side blow (heldSide). k steps down once if the cast still does not fit.
    // Horizontal: the side whose cast fits the viewport best (the faded cut end may leave the screen sooner
    // than the hand), with the strike point slid along the link to pull it inside.
    planPlacement() {
      // the charge keeps 13% of the viewport (48-120px) of sky above the raised head, so the hero sky bolt has
      // a stretch of channel to fall through before it lands
      const vw = this.vw, vh = this.vh, P0 = this.P0, M = 8, Msky = clamp(0.13 * vh, 48, 120);
      const margins = { pre: M, sky: Msky, coil: 0, swing: 4 };
      const box0 = this.isCard || this.isButton ? this.bb : this.hit;
      const fit = (impF) => {
        const u = this.u, fi = this.hd.f[impF], ht = fi.headTop || fi.headC, V = this.hd.Vs[impF];
        // a side blow's face lands in the middle half of the target, as low as needed to keep the head on screen
        let Py = P0.y;
        if (SIDE[impF]) {
          const half = (V.y - (ht.y - fi.root.y)) * u + 3, lo = box0.t + 0.25 * box0.h, hi = box0.t + 0.75 * box0.h;
          Py = clamp(Math.max(box0.cy, half), Math.min(lo, hi), Math.max(lo, hi));
          if (Py < half) Py = Math.min(Math.max(Py, half), box0.b - 2);
        }
        const P = { x: 0, y: Py };
        let need = 0, bottom = -Infinity;
        for (const p of this.poseSet([0, 0], impF)) {
          if (!(p[4] in margins)) continue;
          const r = this.poseRect(p[0], p[1], p[2], p[3], 1, P, impF);
          need = Math.max(need, (margins[p[4]] - r.t) / u);
          bottom = Math.max(bottom, r.b);
        }
        const dy = Math.max(0, Math.ceil(need)), room = Math.max(0, Math.floor((vh - M - bottom) / u));
        const headTopY = Py + (ht.y - fi.root.y - V.y) * u;
        return { impF, k: this.k, Py, dy: Math.min(dy, room), short: Math.max(0, dy - room) * u, headClip: Math.max(0, 1 - headTopY) / (this.hk.headH * u) };
      };
      const choose = () => {
        let c = fit('heldImpact');
        if ((c.headClip > 0.02 || this.isButton && P0.y < 0.3 * vh) && this.hd.f.heldSide && this.hd.Vs.heldSide) {
          // the side blow: tilted into the target when its head fits on screen, else the upright key
          let cs = fit('heldSide');
          if (cs.headClip > 0.01 && this.hd.Vs.heldSideMid) { const cm = fit('heldSideMid'); if (cm.headClip < cs.headClip) cs = cm; }
          if (cs.headClip <= c.headClip) c = cs;
        }
        return c;
      };
      const k0 = this.k;
      let best = choose();
      if ((best.short > 0 || best.headClip > 0.06) && k0 > 2) {
        this.setK(k0 - 1);
        const b2 = choose();
        if (b2.short < best.short - 1 || b2.headClip < best.headClip - 0.05) best = b2; else this.setK(k0);
      }
      this.setK(best.k);
      this.impF = best.impF;
      this.headClip = Math.round(best.headClip * 100) / 100;
      this.shortPx = Math.round(best.short);
      const dy = best.dy, Py = best.Py, s0 = P0.x >= vw / 2 ? 1 : -1;
      const box = this.isCard ? this.bb : this.hit;
      const lo = box.l + (this.isCard ? 8 : 2), hi = box.r - (this.isCard ? 8 : 2);
      const L8 = this.isCard && !this.isButton
        ? { l: P0.x - 60, t: Py - 40, r: P0.x + 60, b: Py + 40 }
        : { l: box.l - 8, t: box.t - 8, r: box.r + 8, b: box.b + 8 };
      const dxs = dy > 0 ? [0, -4, -8, -12, -16, -20, -26, -32, -40] : [0];
      let pick = null;
      for (const s of [s0, -s0]) {
        for (const dx of dxs) {
          const poses = this.poseSet([dx, dy], this.impF);
          const union = (px) => {
            let l = Infinity, r = -Infinity;
            for (const p of poses) { const q = this.poseRect(p[0], p[1], p[2], p[3], s, { x: px, y: Py }); if (q.l < l) l = q.l; if (q.r > r) r = q.r; }
            return { l, r };
          };
          let px = P0.x;
          if (SIDE[this.impF]) {
            // the side blow's face bites a quarter of the way into the target from its near side (at least 2px
            // in), so the blow visibly lands on it and most of the target stays in view
            const sb = this.isCard || this.isButton ? this.bb : this.hit, bite = clamp(0.25 * sb.w, 2, Math.max(2, sb.w - 2));
            px = s > 0 ? sb.l + bite : sb.r - bite;
          } else if (!this.isButton) {
            const U0 = union(px);
            if (U0.l < M) px += M - U0.l; else if (U0.r > vw - M) px -= U0.r - (vw - M);
            px = clamp(clamp(px, Math.min(lo, hi), Math.max(lo, hi)), 4, vw - 4);
          }
          const U = union(px), P = { x: px, y: Py };
          const oL = Math.max(0, M - U.l), oR = Math.max(0, U.r - (vw - M));
          const over = s > 0 ? 0.5 * oL + oR : oL + 0.5 * oR;
          let score = 1 - over / Math.max(1, U.r - U.l), onLink = false;
          for (const p of poses) if (p[4] !== 'swing' && p[4] !== 'post' && hits(this.poseRect(p[0], p[1], p[2], p[3], s, P), L8)) { onLink = true; break; }
          if (onLink) score -= 0.25;
          for (const av of this.avoid) {
            for (const p of poses) if (hits(this.poseRect(p[0], p[1], p[2], p[3], s, P), av)) { score -= 0.2; break; }
          }
          if (s === s0) score += 0.03;
          score -= Math.abs(dx) * 0.002;
          if (!pick || score > pick.score) pick = { s, px, dx, score };
          if (!onLink) break; // the smallest shift that clears the link
        }
      }
      this.side = pick.s;
      this.P = { x: pick.px, y: Py };
      this.pre = [pick.dx, dy];
    }

    // link geometry the bolts, crawlers and flares use (read once at the click, the page never moves)
    planLinks() {
      this.baseline = Math.min(this.hit.b, this.vh - 2);
      this.pointerF = { x: this.pointerXY.x, y: this.pointerXY.y };
      for (const l of this.allLinks) l.d = Math.hypot(l.cx - this.P.x, l.cy - this.P.y);
      this.links = this.allLinks.filter((l) => l.d <= 360).sort((p, q) => p.d - q.d).slice(0, 40);
      for (const L of this.links) {
        let disp = 'inline';
        try { disp = global.getComputedStyle(L.el).display; } catch (e) { /* detached */ }
        L.block = !/^inline/.test(disp) || (L.lines.length === 1 && L.lines[0].w > 0.6 * this.vw);
        L.el = null; // no element references kept past the plan
      }
      for (const L of this.allLinks) L.el = null;
      this.chain = this.links.filter((l) => !l.block).slice(0, 3);
    }

    /* ---------- sprite placement helpers (device px, integer, on the art grid) ---------- */
    // top-left of hand frame `name` pushed h art px back along `axis` (default: the frame's root-to-wrist
    // axis; negative h thrusts forward) plus a canonical offset (dx, dy) in art px, from the home root Q
    handTL(name, h, dx, dy, axis) {
      const f = this.hd.f[name], k = this.k, s = this.side;
      const rootM = s > 0 ? f.root.x : f.W - f.root.x;
      const ax = axis || f.axis;
      const ox = Math.round(s * (-h * ax.x + (dx || 0))), oy = Math.round(-h * ax.y + (dy || 0));
      return { x: Math.round(this.Qdev.x - rootM * k) + ox * k, y: Math.round(this.Qdev.y - f.root.y * k) + oy * k };
    }
    ptDev(name, TL, pt) {
      const f = this.hd.f[name];
      return { x: TL.x + (this.side > 0 ? pt.x : f.W - pt.x) * this.k, y: TL.y + pt.y * this.k };
    }
    ptCss(name, TL, pt) {
      const p = this.ptDev(name, TL, pt);
      return { x: p.x / this.pxDpr, y: p.y / this.pxDpr };
    }
    // snap a css point to the art grid of a pose drawn at device TL (pixel FX next to a sprite sit on its grid)
    snapArt(TL, x, y) {
      const d = this.pxDpr, k = this.k;
      return { x: TL.x + Math.round((x * d - TL.x) / k) * k, y: TL.y + Math.round((y * d - TL.y) / k) * k };
    }

    planCast() {
      const hd = this.hd, k = this.k, s = this.side, d = this.pxDpr, fi = hd.f[this.impF], pre = this.pre;
      const sfM = s > 0 ? fi.sf.x : fi.W - fi.sf.x, rootM = s > 0 ? fi.root.x : fi.W - fi.root.x;
      this.TLi = { x: Math.round(this.P.x * d - sfM * k), y: Math.round(this.P.y * d - fi.sf.y * k) };
      this.Qdev = { x: this.TLi.x + rootM * k, y: this.TLi.y + fi.root.y * k };
      this.Q = { x: this.Qdev.x / d, y: this.Qdev.y / d };
      // the device-snapped strike point (strikeFace lands exactly here)
      this.P = { x: (this.TLi.x + sfM * k) / d, y: (this.TLi.y + fi.sf.y * k) / d };
      this.swingKeys = this.swingFrames();
      this.offR = [pre[0] + OFF.raised[0], pre[1] + OFF.raised[1]];
      this.offW = [pre[0] + OFF.windup[0], pre[1] + OFF.windup[1]];
      const O = this.swingOff();
      this.offA = [Math.round(pre[0] * ARC_PRE) + O.arc[0], Math.round(pre[1] * ARC_PRE) + O.arc[1]];
      this.offS = [Math.round(pre[0] * SWING_PRE) + O.swing[0], Math.round(pre[1] * SWING_PRE) + O.swing[1]];
      this.offM = [Math.round(pre[0] * SMEAR_PRE) + O.smear[0], Math.round(pre[1] * SMEAR_PRE) + O.smear[1]];
      // the rebound: a small kick up off the link, then the arm swings the hammer clear (the overhead slam: 10+
      // art px up and half a head width back toward the arm; the side blow: back along the row and a little up),
      // never off the top edge; when there is no room above, the hammer goes further back instead
      const htI = this.ptCss(this.impF, this.TLi, fi.headTop || fi.headC), upMax = Math.max(0, Math.floor((htI.y - 6) / this.u));
      if (SIDE[this.impF]) { this.offL = [-4, -Math.min(1, upMax)]; this.offLs = [-14, -Math.min(4, upMax)]; }
      else {
        const up = Math.min(-OFF.settle[1], upMax), short = -OFF.settle[1] - up;
        this.offL = [OFF.lift[0], -Math.min(-OFF.lift[1], upMax)];
        this.offLs = [OFF.settle[0] - short, -up];
      }
      // the swing keys must keep the whole head on screen (4px from the top): a key that would leave it is pushed
      // down by whole art px (the slam keeps travelling, it just stays in frame)
      const keys = this.swingKeys, offs = [this.offA, this.offS, this.offM];
      for (let i = 0; i < 3; i++) {
        const f = hd.f[keys[i]];
        if (!f || !f.bb.w) continue;
        const TL = this.handTL(keys[i], 0, offs[i][0], offs[i][1]), top = (TL.y + f.bb.y * k) / d;
        if (top < 4) offs[i][1] += Math.ceil((4 - top) / this.u);
      }
      const fr = hd.f.heldRaised, TLr = this.handTL('heldRaised', 0, this.offR[0], this.offR[1]);
      this.headRaised = this.ptCss('heldRaised', TLr, fr.headC || fr.centroid);
      this.headTopRaised = fr.headTop ? this.ptCss('heldRaised', TLr, fr.headTop) : { x: this.headRaised.x, y: this.headRaised.y - 0.32 * this.hk.headW * this.u };
      this.headImpact = this.ptCss(this.impF, this.TLi, fi.headC);
      this.headTopImpact = this.ptCss(this.impF, this.TLi, fi.headTop || fi.headC);
      this.gripImpact = this.ptCss(this.impF, this.TLi, fi.grip);
      const bi = this.poseRect(this.impF, 0, 0, 0, s, this.P);
      const ham = this.hk, hw = ham.headW * this.u;
      this.hammerBox = { l: this.headImpact.x - hw * 0.7, r: this.headImpact.x + hw * 0.7, t: this.headImpact.y - hw * 0.7, b: this.headImpact.y + hw * 0.7 };
      this.impactBox = bi;
      this.headWc = hw;
      this.headHc = ham.headH * this.u;
      // where the open hand condenses (sparkle motes, stereo position of the materialise / dissolve cues)
      const fo = hd.f.open0 || hd.f.open;
      this.handC = this.ptCss(fo.name, this.handTL(fo.name, 0, pre[0], pre[1]), fo.palm || fo.wrist || fo.centroid);
      this.panHand = clamp((this.handC.x / this.vw) * 2 - 1, -0.7, 0.7);
    }

    // The flight: a centripetal Catmull-Rom through the entry E (a third of the hammer past the edge), the buzz
    // point B low over the link, and the palm; arc-length parameterised, eased by u = 0.45 tn + 0.55 tn^2.
    planFlight() {
      const vw = this.vw, vh = this.vh, s = this.side, u = this.u, hk = this.hk, P = this.P, d = this.pxDpr, k = this.k;
      const fc = this.hd.f.catch;
      // landing: the catch frame's own hammer, so the swap at the catch is pixel exact
      const TLc = this.handTL('catch', -2, this.pre[0], this.pre[1]);
      const off = fc.hamOff || { x: 0, y: 0 }, offX = Math.round(off.x), offY = Math.round(off.y);
      const flyTL = { x: TLc.x + (s > 0 ? offX : fc.W - offX - hk.W) * k, y: TLc.y + offY * k };
      this.flyEndTL = flyTL;
      const grip = { x: (flyTL.x + (hk.W / 2) * k) / d, y: (flyTL.y + (hk.H / 2) * k) / d };
      this.palm = grip;
      const half = (hk.W * u) / 2, hr = Math.max(8, (hk.grip.idle.y - hk.headC.idle.y) * u), hw = this.headWc;
      this.flyR = hr;
      // buzz point: the lowest point of the flight, the pivot just above the link's centre, so the spinning head
      // and its ink shadow sweep across the link text before the hammer turns for the palm
      const lb = this.isCard ? this.bb : this.hit;
      const B = { x: clamp(lb.cx, 0.4 * hw, vw - 0.4 * hw), y: Math.max(lb.t - 10, 0.55 * hr) };
      void P;
      const far = s > 0 ? vw - B.x : B.x;
      // it enters with only a third of it behind the edge, so it is clearly on screen within ~80ms of the first frame
      const E = { x: s > 0 ? vw + 0.3 * half : -0.3 * half, y: clamp(B.y - Math.max(0.16 * vh, 0.5 * far), -0.6 * half, B.y - 30) };
      this.B = B;
      this.E = E;
      const A0 = { x: E.x + (E.x - B.x) * 0.5, y: E.y + (E.y - B.y) * 0.5 };
      const A3 = { x: grip.x + (grip.x - B.x) * 0.6, y: grip.y + (grip.y - B.y) * 0.6 };
      const pts = [A0, E, B, grip, A3], N = 48, xs = [], ys = [];
      for (let seg = 1; seg <= 2; seg++) {
        for (let i = seg === 1 ? 0 : 1; i <= N; i++) {
          const p = catmull(pts[seg - 1], pts[seg], pts[seg + 1], pts[seg + 2], i / N);
          xs.push(p.x); ys.push(p.y);
        }
      }
      const L = new Float32Array(xs.length);
      for (let i = 1; i < xs.length; i++) L[i] = L[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]);
      this.path = { xs: Float32Array.from(xs), ys: Float32Array.from(ys), L, total: L[L.length - 1] || 1 };
      this.pathLen = this.path.total;
      this.buzzU = L[N] / this.path.total;
      const a = this.pathAt(0.97);
      this.flyDir = unit(grip.x - a.x, grip.y - a.y);
      // summon tether: pixel dots every 12px along the reversed path (palm -> entry)
      this.tether = [];
      for (let dd = 18; dd < this.pathLen; dd += 12) {
        const uu = 1 - dd / this.pathLen, p = this.pathAt(uu);
        if (p.x < -10 || p.x > vw + 10 || p.y < -10 || p.y > vh + 10) continue;
        this.tether.push({ u: uu, x: p.x, y: p.y, r: dd / this.pathLen });
      }
    }
    // uu = fraction of the arc length
    pathAt(uu) {
      const pa = this.path, L = pa.L, n = L.length - 1;
      const target = clamp(uu, 0, 1) * pa.total;
      if (target >= L[n]) return { x: pa.xs[n], y: pa.ys[n] };
      let lo = 0, hi = n;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (L[mid] < target) lo = mid; else hi = mid; }
      const f = (target - L[lo]) / (L[hi] - L[lo] || 1);
      return { x: pa.xs[lo] + (pa.xs[hi] - pa.xs[lo]) * f, y: pa.ys[lo] + (pa.ys[hi] - pa.ys[lo]) * f };
    }

    // Every bolt starts above the top edge (no cloud deck any more): the hero sky bolt on a short, steep
    // diagonal from the screen-centre side, the trunk straight down onto the impact head.
    planLightning() {
      const r = this.rand, vw = this.vw, s = this.side, P = this.P, mob = this.mobile, lowB = this.lowBolts;
      const hr = this.headRaised, hw = this.headWc, TOP = 40;
      // the hero bolt (SKY): from above the top edge into the raised head's top edge (the sprite, drawn over
      // the bolts, cuts it off exactly at the outline). Its stepped leader walks down this same channel from
      // LEADER_SKY while streamers leap up off the head to meet it.
      const tgt = { x: this.headTopRaised.x, y: this.headTopRaised.y + 0.6 * this.u };
      this.skyTarget = tgt;
      // it falls steeply (a short diagonal from the screen-centre side), so most of its channel is on screen
      const toward = hr.x < vw / 2 ? 1 : -1, sx = clamp(hr.x + toward * r.range(0.04, 0.1) * vw, 10, vw - 10);
      this.sky = new Bolt(sx, -40, tgt.x, tgt.y, mob ? 6 : 7, r, 0.42);
      this.sky.kink(2, 0.2);
      this.sky.addBranches(mob ? 5 : 7, 5, { angMin: 22, angMax: 58, fracMin: 0.3, fracMax: 0.65, subMax: lowB ? 0 : 2 });
      this.skyStop = Math.round(r.range(0.8, 0.9) * this.sky.n);
      this.skyBolts = [[this.sky, 0]];
      this.skyToward = toward;

      // the charged head reaches for the link: a forked arc from the head's outer corner (the far side from
      // the arm, so it never crosses the fist) down to the link, alive while the sky bolt burns
      const cx0 = hr.x + s * 0.5 * hw, cy0 = hr.y + 0.15 * this.headHc;
      this.skyLink = new Bolt(cx0, cy0, P.x, P.y - 2, mob ? 5 : 6, r, 0.42);
      this.skyLink.addBranches(3, 4, { angMin: 20, angMax: 45, fracMin: 0.2, fracMax: 0.45, subMax: 0 });
      // the main trunk (IMPACT): top edge to the head top
      const ht = this.headTopImpact, tx = ht.x + s * r.range(10, 40);
      this.O = { x: tx, y: -40 };
      this.trunk = new Bolt(tx, -40, ht.x, ht.y + 0.6 * this.u, mob ? 7 : 8, r, 0.45);
      this.trunk.kink(3, 0.3);
      let nb = mob ? r.int(6, 7) : r.int(9, 11);
      if (lowB) nb = Math.ceil(nb / 2);
      this.trunk.addBranches(nb, 5, { angMin: 20, angMax: 50, fracMin: 0.25, fracMax: 0.55, subMax: lowB ? 0 : 2 });
      // stepped leaders hunting toward P, a positive streamer rising to meet them
      this.leaders = [0.45, 0.7].map((stop, i) => {
        const b = new Bolt(clamp(tx + (i ? 1 : -1) * r.range(40, 120), 10, vw - 10), -30, P.x + (i ? 1 : -1) * r.range(10, 60), P.y, 6, r, 0.5);
        b.stopAt = Math.round(stop * b.n);
        return b;
      });
      this.streamer = new Bolt(P.x, P.y - 2, P.x + r.range(-6, 6), P.y - r.range(20, 40), 3, r, 0.5);
      // ground splash along the link baseline
      this.splash = [];
      const nG = r.int(7, 9), base = this.isCard ? P.y : Math.max(P.y, this.baseline - 2);
      for (let i = 0; i < nG; i++) {
        const dir = i % 2 ? 1 : -1, len = r.range(30, 76);
        this.splash.push(new Bolt(P.x + dir * r.range(0, 8), base + 3, P.x + dir * len, base + r.range(2, 12), 4, r, 0.4));
      }
      // sister bolts into the nearest links 140-320px away, outside the hammer box (retargeted over the next
      // page's text once it mounts, so their burn holes open on something to read)
      this.sisters = [];
      const want = lowB || mob ? 1 : 2;
      const cands = this.links.filter((l) => l.d >= 140 && l.d <= 320 && !hits(l, this.impactBox) && l.cy > TOP + 20);
      const picks = [];
      for (const c of cands) { if (picks.length >= want) break; if (picks.every((p) => Math.hypot(p.cx - c.cx, p.cy - c.cy) > 90)) picks.push(c); }
      for (let i = picks.length; i < want; i++) {
        for (let tries = 0; tries < 8; tries++) {
          const ang = r.range(0.15, Math.PI - 0.15) * (r() < 0.25 ? -1 : 1), dd = r.range(200, 320);
          const x = P.x + Math.cos(ang) * dd, y = P.y + Math.sin(ang) * dd * 0.6;
          const box = { l: x - 1, r: x + 1, t: y - 1, b: y + 1 };
          if (x < 20 || x > vw - 20 || y < TOP + 20 || y > this.vh - 20 || hits(box, this.impactBox)) continue;
          picks.push({ cx: x, cy: y, l: x - 30, r: x + 30, t: y - 8, b: y + 8, w: 60, h: 16, fake: true });
          break;
        }
      }
      picks.forEach((L, i) => this.sisters.push(this.makeSister(L, i)));
      this.restrike = null;
      // the dust kick along the baseline on release (replaces any ring round the target): art-pixel chips and
      // a few short streaks within 1.5 head widths, gone in 150ms
      const db = this.isCard ? P.y : Math.max(P.y, this.baseline - 1);
      this.dust = { y: db, chips: [], streaks: [] };
      for (let i = 0; i < 8; i++) {
        const dir = i % 2 ? 1 : -1;
        this.dust.chips.push({ x: P.x + dir * r.range(2, 0.4 * hw), vx: dir * r.range(0.6, 1.5) * hw / 0.15, vy: -r.range(90, 260), c: r.pick([RGB.umber, RGB.iron, RGB.char, RGB.umber]) });
      }
      for (let i = 0; i < 3; i++) {
        const dir = i % 2 ? 1 : -1;
        this.dust.streaks.push({ x: P.x + dir * r.range(0.15, 0.35) * hw, len: r.range(0.18, 0.32) * hw, dir, dy: r.range(-3, 1) });
      }
    }
    // Two more channels converge on the head as the main stroke lands: a steep one from the arm's side and a long
    // diagonal that enters from the far top corner, so the hero beat crosses most of the viewport. Planned at the
    // charge beat (off the click task).
    planSkyExtras() {
      if (this.sky2) return;
      const r = this.rand, vw = this.vw, mob = this.mobile, lowB = this.lowBolts, hr = this.headRaised, tgt = this.skyTarget, toward = this.skyToward;
      const sx2 = clamp(hr.x - toward * r.range(0.1, 0.2) * vw, 10, vw - 10);
      this.sky2 = new Bolt(sx2, -40, tgt.x + r.range(-3, 3), tgt.y, mob ? 6 : 7, r, 0.45);
      this.sky2.kink(2, 0.24);
      this.sky2.addBranches(mob ? 2 : 3, 4, { angMin: 22, angMax: 50, fracMin: 0.25, fracMax: 0.5, subMax: lowB ? 0 : 1 });
      const lx = toward > 0 ? vw * r.range(0.95, 1.0) + 30 : -30 + vw * r.range(0, 0.05);
      this.skyLong = new Bolt(lx, -40, tgt.x + r.range(-3, 3), tgt.y, mob ? 7 : 8, r, 0.36);
      this.skyLong.kink(3, 0.28);
      this.skyLong.addBranches(mob ? 3 : 4, 5, { angMin: 22, angMax: 48, fracMin: 0.2, fracMax: 0.4, subMax: lowB ? 0 : 1 });
      this.skyBolts = [[this.sky, 0], [this.sky2, 18], [this.skyLong, 32]];
    }
    makeSister(L, i) {
      const r = this.rand, P = this.P, vw = this.vw, mob = this.mobile;
      const tx2 = L.cx, ty2 = L.t + 0.35 * (L.b - L.t);
      const sx2 = clamp(P.x + Math.sign(tx2 - P.x || 1) * r.range(0.18, 0.32) * vw, 10, vw - 10);
      const b = new Bolt(sx2, -30, tx2, ty2, mob ? 6 : 7, r, 0.45);
      b.addBranches(3, 4, { angMin: 20, angMax: 45, fracMin: 0.25, fracMax: 0.5, subMax: 0 });
      return { bolt: b, at: i ? T.SISTER2 : T.SISTER1, x: tx2, y: ty2, L };
    }

    // The burn-through field: one cell per art pixel (u css px, 3-6). The ignition times are built once the
    // next page is mounted (buildBurnField), so the satellite strikes can be retargeted over its text first.
    planBurn() {
      const cs = clamp(Math.round(this.u), 3, 6), W = this.layerW, H = this.vh;
      const cols = Math.ceil(W / cs) + 1, rows = Math.ceil(H / cs) + 1, n = cols * rows;
      this.burn = {
        cs, cols, rows, n, ign: null, order: null, ptr: 0, burned: new Uint8Array(n), dOut: new Uint8Array(n), dIn: new Uint8Array(n),
        x0: cols, y0: rows, x1: -1, y1: -1, dirty: false, front: new Int32Array(8000), nFront: 0, path: '', bandAt: -1,
      };
      try { this.clipPathOK = !!(global.CSS && CSS.supports && CSS.supports('clip-path', 'path("M0 0h1v1z")')); } catch (e) { this.clipPathOK = false; }
      this.Rmax = Math.max(Math.hypot(this.P.x, this.P.y), Math.hypot(W - this.P.x, this.P.y), Math.hypot(this.P.x, H - this.P.y), Math.hypot(W - this.P.x, H - this.P.y)) + 24;
      if (this.isCard) this.planFissures(); else this.planFuse();
    }

    // The fuse runs both ways along the link's line boxes from the strike point at one speed, so the whole link
    // has burned in about FUSE_MS. fuseAt(rectIndex, x) = when the fuse reaches x on that line box (base ms).
    planFuse() {
      const rects = this.rects, hi = this.hitIndex, Px = this.P.x, hr = rects[hi] || this.hit;
      const right = [{ rect: hr, ri: hi, from: Px, to: hr.r }], left = [{ rect: hr, ri: hi, from: Px, to: hr.l }];
      for (let i = hi + 1; i < rects.length; i++) right.push({ rect: rects[i], ri: i, from: rects[i].l, to: rects[i].r });
      for (let i = hi - 1; i >= 0; i--) left.push({ rect: rects[i], ri: i, from: rects[i].r, to: rects[i].l });
      const base = (arr) => { let acc = 0; for (const q of arr) { q.base = acc; acc += Math.abs(q.to - q.from); } return acc; };
      const total = Math.max(base(right), base(left), 1);
      this.fuse = { right, left, speed: Math.max(0.05, total / FUSE_MS) };
    }
    fuseAt(ri, x) {
      const F = this.fuse;
      if (!F) return T.PUNCH;
      for (const side of [F.right, F.left]) {
        for (const q of side) {
          if (q.ri !== ri) continue;
          const lo = Math.min(q.from, q.to), hi = Math.max(q.from, q.to);
          if (x < lo - 0.5 || x > hi + 0.5) continue;
          return T.PUNCH + (q.base + Math.abs(x - q.from)) / F.speed;
        }
      }
      return T.PUNCH + Math.abs(x - this.P.x) / F.speed;
    }

    // Ignition time per cell: the main front (an anisotropic distance from the strike point, flattened near it
    // so it runs along the text line first, warped by 1-3 angular lobes and a spatial fbm, then mapped through
    // the burn schedule R(bt)), the link's own line boxes (each glyph's paper burns through GLYPH_THROUGH after
    // the fuse reaches it and the burn spreads slowly off the line), and the satellite strikes (small fronts of
    // their own). Ordered with a counting sort, so each frame only walks the cells that just ignited.
    buildBurnField(force) {
      const B = this.burn, cs = B.cs, cols = B.cols, rows = B.rows, n = B.n, P = this.P, N2 = this.noise2, r = this.rand;
      if (!B.build) {
        const ph = [r() * TAU, r() * TAU, r() * TAU];
        B.build = { y: 0, D: new Float32Array(n), Dmax: 0, ph, amp: this.mobile ? 0.26 : 0.3 };
      }
      const S = B.build, ph = S.ph, amp = S.amp, D = S.D, W = this.layerW, H = this.vh;
      const lobes = (th) => (0.55 * Math.sin(th + ph[0]) + 0.3 * Math.sin(2 * th + ph[1]) + 0.18 * Math.sin(3 * th + ph[2])) / 1.03;
      const yEnd = force ? rows : Math.min(rows, S.y + Math.ceil(rows / 8));
      for (let y = S.y; y < yEnd; y++) {
        const cy = (y + 0.5) * cs, dy = cy - P.y;
        for (let x = 0; x < cols; x++) {
          const cx = (x + 0.5) * cs, dx = cx - P.x, d0 = Math.hypot(dx, dy);
          const ky = 1.15 + 0.75 * Math.exp(-d0 / 180);
          const warp = 1 + amp * lobes(Math.atan2(dy, dx)) + 0.17 * N2.fbm(cx / 170, cy / 170);
          const v = Math.max(0, Math.hypot(dx, dy * ky) * Math.max(0.45, warp) + 9 * N2(cx / 23 + 40, cy / 23));
          D[y * cols + x] = v;
          if (cx < W + cs && cy < H + cs && v > S.Dmax) S.Dmax = v;
        }
      }
      S.y = yEnd;
      if (S.y < rows) return false;
      B.build = null;
      this.Rmax = S.Dmax + 6;
      // The main front burns the cells in the order of their field distance D, and the SHARE of the viewport it
      // has burned by bt follows the area schedule (areaTable: an even sweep with eased ends, about 16% of the
      // viewport per 150ms at most), so the reveal never jumps or switches speed: ign = area^-1(rank of D / n).
      const nb = 2048, Dm = Math.max(1, S.Dmax), hist = new Float64Array(nb + 1);
      for (let i = 0; i < n; i++) hist[Math.min(nb, Math.floor((D[i] / Dm) * nb))]++;
      const cdf = new Float64Array(nb + 2);
      for (let k = 0; k <= nb; k++) cdf[k + 1] = cdf[k] + hist[k] / n;
      const frac = (d) => { const xk = clamp((d / Dm) * nb, 0, nb), k = Math.floor(xk); return cdf[k] + (cdf[k + 1] - cdf[k]) * (xk - k); };
      // D quantiles (burnRadius, the crack glow and the flame speed read the front's reach from them)
      const quant = new Float32Array(257);
      for (let j = 0, k = 0; j <= 256; j++) {
        const f = j / 256;
        while (k < nb && cdf[k + 1] < f) k++;
        const w = cdf[k + 1] - cdf[k];
        quant[j] = ((k + (w > 0 ? clamp((f - cdf[k]) / w, 0, 1) : 0)) / nb) * Dm;
      }
      B.quant = quant;
      const AT = this.areaTable(), at = AT.a, M = at.length;
      const inv = (f) => {
        if (f <= at[0]) return AT.t0;
        let lo = 0, hi = M - 1;
        if (f >= at[hi]) return T.BURN_END;
        while (hi - lo > 1) { const m = (lo + hi) >> 1; if (at[m] < f) lo = m; else hi = m; }
        return AT.t0 + (lo + (f - at[lo]) / Math.max(1e-9, at[hi] - at[lo])) * AT.step;
      };
      const ign = new Float32Array(n);
      for (let i = 0; i < n; i++) ign[i] = inv(frac(D[i]));
      // the link: its line boxes burn through behind the fuse, and the burn creeps off the line slowly
      if (this.fuse && !this.isCard) {
        this.rects.forEach((rc, ri) => {
          const xa = Math.max(0, Math.floor((rc.l - 2) / cs)), xb = Math.min(cols - 1, Math.ceil((rc.r + 2) / cs));
          const ya = Math.max(0, Math.floor((rc.t - 36) / cs)), yb = Math.min(rows - 1, Math.ceil((rc.b + 36) / cs));
          for (let y = ya; y <= yb; y++) {
            const cy = (y + 0.5) * cs, dv = Math.max(0, Math.abs(cy - rc.cy) - rc.h / 2);
            for (let x = xa; x <= xb; x++) {
              const cx = (x + 0.5) * cs, i = y * cols + x;
              const tl = this.fuseAt(ri, clamp(cx, rc.l, rc.r)) + GLYPH_THROUGH + 70 * N2(cx / 9, cy / 9 + 70) + dv / 0.085;
              if (tl < ign[i]) ign[i] = tl;
            }
          }
        });
      }
      // satellites: a spark lands, a scorch speck smoulders, then a small front of its own opens and grows
      this.sats = [];
      if (!this.mobile || this.sisters.length) {
        this.sisters.forEach((sb, i) => {
          if (i > 1) return;
          const s = { x: sb.x, y: sb.y, strikeAt: sb.at, start: i ? T.SAT2 : T.SAT1, lit: false };
          this.sats.push(s);
          const R0 = 150, xa = Math.max(0, Math.floor((s.x - R0) / cs)), xb = Math.min(cols - 1, Math.ceil((s.x + R0) / cs));
          const ya = Math.max(0, Math.floor((s.y - R0) / cs)), yb = Math.min(rows - 1, Math.ceil((s.y + R0) / cs));
          for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) {
            const cx = (x + 0.5) * cs, cy = (y + 0.5) * cs, d = Math.hypot(cx - s.x, (cy - s.y) * 1.25);
            const ts = s.start + 140 + (d * (1 + 0.35 * N2.fbm(cx / 60 + 9, cy / 60 - 4))) / 0.12;
            const i = y * cols + x;
            if (ts < ign[i]) ign[i] = ts;
          }
        });
      }
      // counting sort by whole ms
      const span = Math.ceil(T.BURN_END - T.PUNCH) + 2, cnt = new Uint32Array(span + 1), key = new Uint16Array(n);
      for (let i = 0; i < n; i++) { const k = clamp(Math.floor(ign[i] - T.PUNCH), 0, span); key[i] = k; cnt[k]++; }
      for (let k = 1; k <= span; k++) cnt[k] += cnt[k - 1];
      const order = new Uint32Array(n);
      for (let i = n - 1; i >= 0; i--) order[--cnt[key[i]]] = i;
      B.ign = ign; B.order = order; B.ptr = 0; B.burned.fill(0); B.x0 = cols; B.y0 = rows; B.x1 = -1; B.y1 = -1; B.dirty = true;
      return true;
    }
    ignAt(x, y) {
      const B = this.burn;
      if (!B || !B.ign) return Infinity;
      const cx = clamp(Math.floor(x / B.cs), 0, B.cols - 1), cy = clamp(Math.floor(y / B.cs), 0, B.rows - 1);
      return B.ign[cy * B.cols + cx];
    }

    planFissures() {
      const r = this.rand, b = this.bb, P = this.P, out = [];
      const n = r.int(5, 7);
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * TAU + r.range(-0.3, 0.3);
        const dx = Math.cos(ang), dy = Math.sin(ang);
        const tx = dx > 0 ? (b.r - P.x) / dx : dx < 0 ? (b.l - P.x) / dx : Infinity;
        const ty = dy > 0 ? (b.b - P.y) / dy : dy < 0 ? (b.t - P.y) / dy : Infinity;
        const tt = Math.max(10, Math.min(tx, ty));
        const bolt = new Bolt(P.x, P.y, P.x + dx * tt, P.y + dy * tt, 4, r, 0.3);
        out.push({ path: bolt.paths().main, len: tt });
      }
      this.fissures = out;
    }

    planParticles() {
      const cap = (d, m) => Math.max(4, Math.round((this.mobile ? m : d) * (this.lowQ ? 0.5 : 1)));
      this.pools = {
        sparks: new Pool(cap(140, 70)), debris: new Pool(cap(24, 12)), flames: new Pool(cap(160, 80)),
        embers: new Pool(cap(90, 45)), ash: new Pool(cap(60, 30)), smoke: new Pool(cap(18, 9)), trail: new Pool(cap(36, 20)),
      };
      this.spawnAcc = { flames: 0, embers: 0, ash: 0, smoulder: 0, smoke: 0 };
      this.debrisCols = [this.textColor, '#503000', '#1b120c', '#503000'];
      this.crawlers = [];
      this.crawlLaunched = 0;
      this.underlines = [];        // canvas-drawn neighbour glows and scorches: {l, r, y, glowAt}
    }
  }

  /* ====================================================================
   * 14. STRIKE: DOM LIFECYCLE (style, canvases, layer, wrapper, listeners, commit, cleanup)
   * ==================================================================== */
  function styleText(scale, reduced) {
    const ms = (v) => Math.round(v * scale) + 'ms';
    return [
      '@keyframes thor-ul{from{background-size:0% 2px}to{background-size:100% 2px}}',
      '[data-thor-press]{position:relative!important;top:1px!important}',
      // lock-on: the link keeps its own colour; only a crisp 2px saturated underline (no halo, no text-shadow)
      '[data-thor-state="charged"]:not([data-thor-kind="card"]){' +
        'text-decoration-color:transparent!important;background-image:linear-gradient(#0058f8,#0058f8)!important;background-repeat:no-repeat!important;' +
        'background-position:0 100%!important;background-size:100% 2px;' + (reduced ? '' : 'animation:thor-ul ' + ms(90) + ' linear both;') + 'transition:none!important}',
      '[data-thor-state="charged"][data-thor-kind="card"]{outline:2px solid #0058f8!important;outline-offset:2px!important;transition:none!important}',
      // struck: the engine draws the link's glyphs burning one by one on the canvas, so the DOM text goes clear
      '[data-thor-state="struck"]:not([data-thor-kind="card"]){color:transparent!important;-webkit-text-fill-color:transparent!important;' +
        'text-shadow:none!important;text-decoration-color:transparent!important;background:none!important;transition:none!important}',
      // fallback when the glyphs could not be measured: the text turns hot orange and fades under the fuse
      '[data-thor-state="burning"]{color:#e45c10!important;text-shadow:0 0 3px rgba(248,184,0,.9)!important;text-decoration-color:transparent!important;' +
        'background:none!important;opacity:0!important;transition:opacity ' + ms(500) + ' linear ' + ms(200) + '!important}',
      '[data-thor-state="struck"][data-thor-kind="card"]{outline:none!important;filter:sepia(.55) saturate(1.4) brightness(.72)!important;transition:filter ' + ms(400) + ' linear!important}',
    ].join('\n');
  }

  function makeOverlay(vw, vh, dpr, z) {
    const cv = doc.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.setAttribute('data-thor-canvas', '');
    cv.width = Math.round(vw * dpr);
    cv.height = Math.round(vh * dpr);
    Object.assign(cv.style, {
      position: 'fixed', left: '0', top: '0', width: vw + 'px', height: vh + 'px', margin: '0', padding: '0',
      pointerEvents: 'none', zIndex: String(z), display: 'block', contain: 'strict',
    });
    return cv;
  }

  Object.assign(Strike.prototype, {
    on(target, type, fn, opt) {
      target.addEventListener(type, fn, opt);
      this.listeners.push([target, type, fn, opt]);
    },

    setAttr(el, name, value) {
      if (!el) return;
      if (!this.attrs.some((x) => x[0] === el && x[1] === name)) this.attrs.push([el, name, el.getAttribute(name)]);
      el.setAttribute(name, value);
    },

    injectStyle(reduced) {
      const st = doc.createElement('style');
      st.setAttribute('data-thor-style', '');
      st.textContent = styleText(this.scale, reduced);
      (doc.head || doc.documentElement).appendChild(st);
      this.styleEl = st;
    },

    busyEl() {
      const root = this.opts.root || doc;
      return root.nodeType === 9 ? root.body : root;
    },
    rootEl() {
      const root = this.opts.root || doc;
      return root.nodeType === 9 ? root.documentElement : root;
    },

    setupDOM() {
      this.injectStyle(false);
      if (this.isCard) this.setAttr(this.anchor, 'data-thor-kind', 'card');
      this.setAttr(this.anchor, 'data-thor-state', 'charged');
      if (!this.isCard) {
        try { if (global.getComputedStyle(this.anchor).position === 'static') this.setAttr(this.anchor, 'data-thor-press', ''); } catch (e) { /* no-op */ }
      }
      this.setAttr(this.busyEl(), 'aria-busy', 'true');
      // FX canvas (soft, <= 1.5x) under the PX canvas (crisp, native dpr <= 3)
      if (this.wrap) this.prevTranslate = this.wrap.style.getPropertyValue('translate');
      this.fxCv = makeOverlay(this.vw, this.vh, this.fxDpr, 2147483001);
      this.pxCv = makeOverlay(this.vw, this.vh, this.pxDpr, 2147483002);
      doc.body.appendChild(this.fxCv);
      doc.body.appendChild(this.pxCv);
      this.fx = this.fxCv.getContext('2d');
      this.px = this.pxCv.getContext('2d');
      this.lockScroll();
      this.on(global, 'keydown', (e) => this.onKey(e), true);
      this.on(global, 'click', (e) => this.onAnyClick(e), true);
      this.on(global, 'hashchange', () => this.onNav('hashchange'));
      this.on(global, 'popstate', () => this.onNav('popstate'));
      this.on(doc, 'visibilitychange', () => { if (doc.hidden) this.finishNow('hidden'); });
      this.on(global, 'resize', () => this.onResize());
      try {
        const mq = global.matchMedia && global.matchMedia('(resolution: ' + this.devDpr + 'dppx)');
        if (mq && mq.addEventListener) this.on(mq, 'change', () => this.onResize());
      } catch (e) { /* no-op */ }
    },

    // the app navigated: before the commit the strike is dropped (the app owns the route); after it, the hash the
    // commit itself set is ours, any other one is the reader moving on (Back during the ember tail), so the
    // canvases and embers go at once
    onNav(type) {
      if (this.inCommit) return;
      if (!this.committed) { this.abort(type); return; }
      let h = '';
      try { h = global.location.hash; } catch (e) { /* no-op */ }
      if (h !== this.hashAtCommit) this.finish({ reason: 'navigated' });
    },

    // A resize mid-strike: the canvases and the next-page layer follow the new viewport, and the strike skips
    // ahead so the burn-through reveal still plays (never a jump cut). A width change reflows the page, so the
    // cached geometry is stale: skip right away; a height-only change (mobile toolbars) keeps running.
    onResize() {
      if (this.finished || this.committed) return;
      const vw = global.innerWidth, vh = global.innerHeight, dpr = global.devicePixelRatio || 1;
      if (Math.abs(dpr - this.devDpr) > 0.01) { this.onDprChange(dpr); return; }
      if (Math.abs(vw - this.vw) <= 1 && Math.abs(vh - this.vh) <= 1) return;
      const widthChanged = Math.abs(vw - this.vw) > 1;
      this.vw = vw; this.vh = vh;
      this.layerW = doc.documentElement.clientWidth || vw;
      for (const [cv, dpr] of [[this.fxCv, this.fxDpr], [this.pxCv, this.pxDpr]]) {
        if (!cv) continue;
        cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
        cv.style.width = vw + 'px'; cv.style.height = vh + 'px';
      }
      if (this.layer) { this.layer.style.width = this.layerW + 'px'; this.layer.style.height = vh + 'px'; }
      if (widthChanged) this.fastForward();
    },
    // the window moved to a screen with another pixel ratio (or the page was zoomed): skip ahead, resize both
    // canvases at the new ratio and re-plan the integer art scale so the sprites stay crisp and the same size
    onDprChange(dpr) {
      this.devDpr = dpr;
      const u = this.u;
      this.pxDpr = Math.min(dpr, 3);
      this.fxDpr = this.lowQ || dpr >= 2 ? 1 : Math.min(dpr, 1.5);
      for (const [cv, d] of [[this.fxCv, this.fxDpr], [this.pxCv, this.pxDpr]]) {
        if (!cv) continue;
        cv.width = Math.round(this.vw * d); cv.height = Math.round(this.vh * d);
      }
      this.setK(Math.max(2, Math.round(u * this.pxDpr)));
      this.planCast();
      this.smearCells = null;
      this.fastForward();
    },

    // the wrapper gets its compositor layer on frame 2, so frame 1 (lock-on) stays cheap
    promoteWrap() {
      const el = this.wrap;
      if (!el || this.ev.willChange) return;
      this.ev.willChange = 1;
      this.prevWillChange = el.style.getPropertyValue('will-change');
      if (this.prevTranslate === undefined) this.prevTranslate = el.style.getPropertyValue('translate');
      el.style.setProperty('will-change', 'translate');
    },

    lockScroll() {
      this.scrollLocked = true;
      const sx = global.scrollX, sy = global.scrollY;
      const block = (e) => { if (this.scrollLocked && e.cancelable) e.preventDefault(); };
      this.on(global, 'wheel', block, { passive: false, capture: true });
      this.on(global, 'touchmove', block, { passive: false, capture: true });
      this.on(global, 'scroll', () => {
        if (this.scrollLocked && (global.scrollX !== sx || global.scrollY !== sy)) global.scrollTo(sx, sy);
      }, { passive: true });
    },

    onKey(e) {
      if (!this.scrollLocked) return;
      if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); this.fastForward(); return; }
      const keys = [' ', 'Spacebar', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      const tg = e.target, editable = tg && (tg.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName || ''));
      if (keys.indexOf(e.key) >= 0 && !editable) e.preventDefault();
    },

    // a deliberate second click anywhere skips to the reveal (clicks inside [data-thor="off"] pass through).
    // The rest of a double / triple click (e.detail >= 2) and any click on the struck element within 450ms of
    // the strike are part of the same gesture, not a skip.
    sameGesture(e) {
      const dt = this.now() - this.t0;
      if (dt < 120 || (e.detail || 0) >= 2) return true;
      let tg = e.target;
      if (tg && tg.nodeType !== 1) tg = tg.parentElement;
      return dt < 450 && !!tg && !!this.anchor && (tg === this.anchor || (this.anchor.contains && this.anchor.contains(tg)));
    },
    onAnyClick(e) {
      if (this.finished || this.committed) return;
      if (this.sameGesture(e)) {
        // the second click of a double click on the struck link: swallow it, so it neither skips nor navigates
        let tg = e.target;
        if (tg && tg.nodeType !== 1) tg = tg.parentElement;
        if (tg && this.anchor && (tg === this.anchor || this.anchor.contains(tg))) e.preventDefault();
        return;
      }
      let tg = e.target;
      if (tg && tg.nodeType !== 1) tg = tg.parentElement;
      if (tg && tg.closest && tg.closest('[data-thor="off"]')) return;
      // open-in-new-tab and friends keep working mid-strike: modified or non-primary clicks, and links the
      // engine would never take (target=_blank, download), go to the browser untouched
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      const a = tg && tg.closest ? tg.closest('a[href]') : null;
      if (a && !eligible(a)) return;
      e.preventDefault();
      e.stopPropagation();
      this.fastForward();
    },

    /* ---------- next page: renderNext -> pre-staged fixed layer with a radial mask ---------- */
    startRender() {
      if (this.finished || this.renderState !== 'idle') return;
      const fn = this.opts.renderNext;
      if (typeof fn !== 'function') { this.renderState = 'none'; return; }
      this.renderState = 'pending';
      // the host may hold the reveal for a slow network until deadlineMs (the burn waits, smouldering), then it
      // should hand over a page anyway (a clean loading page that fills itself in)
      const deadlineMs = Math.max(0, Math.round((T.PUNCH + 1350) * this.scale - (this.now() - this.t0)));
      Promise.resolve()
        .then(() => fn(this.href, { reduced: false, deadlineMs, whenQuiet }))
        .then((el) => {
          if (this.finished) return;
          if (el && el.nodeType === 1) { this.pendingEl = el; this.renderState = 'resolved'; } else this.renderState = 'failed';
        }, (err) => {
          console.warn('[ThorLink] renderNext rejected, falling back to navigation', err);
          if (!this.finished) this.renderState = 'failed';
        });
    },


    // mount as soon as the page is ready, but never on the catch, sky-bolt or impact frames
    updateMount(t) {
      if (this.mounted || this.committed) return;
      const st = this.renderState;
      const busy = !this.ff && ((t >= T.CATCH - 30 && t < T.CATCH + 80) || (t >= T.SKY - 10 && t < T.SKY + 60) || (t >= T.BREATH && t < T.HITSTOP_END + 10));
      if (st === 'resolved' && !busy) this.mountLayer(this.pendingEl, false);
      else if ((st === 'none' || st === 'failed') && !busy && t >= 200) this.mountLayer(this.makeCover(), true);
      else if (st === 'pending' && t >= T.PUNCH && this.burnOffset * this.scale > (this.ff ? 300 : 1500)) {
        this.renderState = 'timeout';
        this.mountLayer(this.makeCover(), true);
      }
    },


    makeCover() {
      const d = doc.createElement('div');
      d.style.cssText = 'position:absolute;inset:0;background:' + (this.opts.coverColor || this.pageBg);
      return d;
    },

    mountLayer(el, isCover) {
      const L = doc.createElement('div');
      L.className = ('thor-next-layer ' + (this.opts.layerClass || '')).trim();
      L.setAttribute('aria-hidden', 'true');
      L.setAttribute('inert', '');
      L.style.cssText = [
        'position:fixed', 'left:0', 'top:0', 'margin:0', 'padding:0', 'overflow:hidden', 'pointer-events:none',
        'width:' + this.layerW + 'px', 'height:' + this.vh + 'px', 'z-index:2147483000',
        'background:' + (this.opts.layerBackground || this.pageBg),
        'clip-path:polygon(0 0,0 0,0 0)', 'will-change:clip-path',
      ].join(';');
      L.appendChild(el);
      doc.body.appendChild(L);
      // the next page's text boxes are read one frame later, off the mount frame (a big page lays out first)
      if (!isCover) global.requestAnimationFrame(() => { if (!this.finished && this.nextEl === el) this.seedOverText(el); });
      this.layer = L;
      this.nextEl = el;
      this.isCover = isCover;
      this.mounted = true;
      this.mountAt = this.t;
      // the field needs the final satellite points, so its chunks start once the page is here (see update)
      if (!isCover) {
        const h1 = el.querySelector('h1');
        if (h1) { const r = h1.getBoundingClientRect(); if (r.width > 0) this.titleRect = rectObj(r); }
      }
    },

    // The next page's text boxes (sampled once, right after it mounts): the sister bolts (and the satellite
    // fronts they open) are retargeted onto them while there is still time, so they open on words, not on
    // whitespace. The main front opens under the strike point; the demo lays its lead text there.
    seedOverText(el) {
      let rects = [];
      try {
        const vw = this.layerW, vh = this.vh;
        el.querySelectorAll('h1,h2,h3,p,li,dd,td,th,figcaption,blockquote').forEach((n) => {
          if (rects.length > 120) return;
          const txt = (n.textContent || '').replace(/\s+/g, ' ').trim();
          if (txt.length < 12) return;
          const r = n.getBoundingClientRect();
          if (r.width < 40 || r.height < 8 || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) return;
          rects.push(rectObj(r));
        });
      } catch (e) { rects = []; }
      if (!rects.length) return;
      this.textRects = rects;
      const P = this.P, inText = (x, y, pad) => rects.some((r) => x >= r.l - pad && x <= r.r + pad && y >= r.t - pad && y <= r.b + pad);
      // sisters: keep a landing point that is over text; otherwise move it onto text 140-320px from P
      if (this.t != null && this.t > T.SISTER1 - 60) return;
      const taken = [];
      this.sisters.forEach((sb, i) => {
        if (inText(sb.x, sb.y, 2)) { taken.push(sb); return; }
        const ok = (x, y) => {
          const d = Math.hypot(x - P.x, y - P.y);
          if (d < 140 || d > 320 || y < 60 || y > this.vh - 20 || x < 20 || x > this.vw - 20) return false;
          if (hits({ l: x - 2, r: x + 2, t: y - 2, b: y + 2 }, this.impactBox)) return false;
          return taken.every((o) => Math.hypot(o.x - x, o.y - y) > 90);
        };
        let L = null;
        for (const l of this.links) { if (ok(l.cx, l.cy) && inText(l.cx, l.cy, 0)) { L = l; break; } }
        if (!L) {
          let bestP = null;
          for (const r of rects) {
            for (let k = 0; k < 5; k++) {
              const x = r.l + (r.w * (k + 0.5)) / 5, y = r.cy;
              if (!ok(x, y)) continue;
              const sc = Math.abs(Math.hypot(x - P.x, y - P.y) - 230);
              if (!bestP || sc < bestP.sc) bestP = { x, y, sc };
            }
          }
          if (bestP) L = { cx: bestP.x, cy: bestP.y, l: bestP.x - 30, r: bestP.x + 30, t: bestP.y - 8, b: bestP.y + 8, w: 60, h: 16, fake: true };
        }
        if (!L) { taken.push(sb); return; }
        const ns = this.makeSister(L, i);
        this.sisters[i] = ns;
        taken.push(ns);
      });
      if (this.burn && this.burn.ptr === 0) { this.burn.ign = null; this.burn.build = null; } // rebuilt with the new points
    },

    updateMask() {
      const L = this.layer, B = this.burn;
      if (!L || this.committed || !B) return;
      if (!this.clipPathOK) {
        const r = Math.max(0, this.R).toFixed(1);
        if (r !== this.maskR) { this.maskR = r; L.style.clipPath = 'circle(' + r + 'px at ' + this.P.x.toFixed(1) + 'px ' + this.P.y.toFixed(1) + 'px)'; }
        return;
      }
      if (!B.pathDirty) return;
      B.pathDirty = false;
      const cs = B.cs, cols = B.cols, b = B.burned, parts = [];
      for (let y = Math.max(0, B.y0); y <= B.y1; y++) {
        const row = y * cols;
        let x = Math.max(0, B.x0);
        while (x <= B.x1) {
          if (!b[row + x]) { x++; continue; }
          let e = x + 1;
          while (e <= B.x1 && b[row + e]) e++;
          // rows overlap by half a pixel, so the union never shows a hairline between them
          parts.push('M' + x * cs + ' ' + y * cs + 'h' + (e - x) * cs + 'v' + (cs + 0.5) + 'h' + (x - e) * cs + 'z');
          x = e;
        }
      }
      L.style.clipPath = parts.length ? "path('" + parts.join('') + "')" : 'polygon(0 0,0 0,0 0)';
    },

    /* ---------- the wrapper: the one impact kick, via `translate` (never the layer) ---------- */
    applyWrap() {
      const el = this.wrap;
      if (!el || this.committed) return;
      const x = this.shake.x, y = this.shake.y, on = Math.abs(x) > 0.05 || Math.abs(y) > 0.05;
      if (!on && !this.domOn) return;
      if (this.prevTranslate === undefined) this.prevTranslate = el.style.getPropertyValue('translate');
      if (on) el.style.setProperty('translate', x.toFixed(2) + 'px ' + y.toFixed(2) + 'px');
      else this.restoreWrap(true);
      this.domOn = on;
    },

    restoreWrap(keepWillChange) {
      const el = this.wrap;
      if (!el) return;
      if (this.prevTranslate !== undefined) {
        if (this.prevTranslate) el.style.setProperty('translate', this.prevTranslate); else el.style.removeProperty('translate');
      }
      if (!keepWillChange && this.ev.willChange && !this.ev.willChangeRestored) {
        this.ev.willChangeRestored = 1;
        if (this.prevWillChange) el.style.setProperty('will-change', this.prevWillChange); else el.style.removeProperty('will-change');
      }
    },

    /* ---------- commit: mask none -> commit(href, el) -> remove layer, clear the wrapper, all in one task ---------- */
    doCommit() {
      if (this.committed) return;
      this.committed = true;
      this.commitAt = this.t;
      this.commitReal = this.now() - this.t0;
      this.scrollLocked = false;
      this.shake.x = this.shake.y = 0;
      this.restoreWrap(false);
      const L = this.layer, el = this.nextEl;
      if (L) { L.style.clipPath = 'none'; L.style.removeProperty('will-change'); }
      if (el && !this.isCover && typeof this.opts.commit === 'function') {
        this.inCommit = true; // the host's own hash update fires popstate synchronously in some browsers
        try { this.opts.commit(this.href, el); } catch (e) { console.error('[ThorLink] commit() threw', e); }
        this.inCommit = false;
        try { this.hashAtCommit = global.location.hash; } catch (e) { /* no-op */ }
        if (L && L.parentNode) L.parentNode.removeChild(L);
        this.layer = null;
        if (this.opts.scrollTop !== false) { try { global.scrollTo(0, 0); } catch (e) { /* no-op */ } }
        try {
          const h1 = el.matches && el.matches('h1') ? el : el.querySelector('h1');
          if (h1 && h1.isConnected) {
            const r = h1.getBoundingClientRect();
            // the text run, not the full-width block: the last ember lands beside the words
            let right = r.right;
            try { const rg = doc.createRange(); rg.selectNodeContents(h1); const rr = rg.getBoundingClientRect(); if (rr.width > 0) right = rr.right; } catch (e2) { /* no-op */ }
            if (r.width > 0) this.titleRect = { l: r.left, t: r.top, r: right, b: r.bottom, w: right - r.left, h: r.height, cx: (r.left + right) / 2, cy: r.top + r.height / 2 };
          }
        } catch (e) { /* no-op */ }
        this.focusAndAnnounce(el);
        this.markArrived();
      } else {
        this.navigate();
      }
      this.restoreAttr(this.busyEl(), 'aria-busy');
    },

    markArrived() {
      const root = this.rootEl();
      try {
        root.setAttribute('data-thor-arrived', '');
        global.setTimeout(() => { try { root.removeAttribute('data-thor-arrived'); } catch (e) { /* detached */ } }, 700);
      } catch (e) { /* no-op */ }
    },

    navigate() {
      let same = false;
      try {
        const u = new URL(this.href, global.location.href), l = global.location;
        same = u.origin === l.origin && u.pathname === l.pathname && u.search === l.search;
      } catch (e) { /* cross-document */ }
      try { global.location.assign(this.href); } catch (e) { console.error('[ThorLink] navigation failed', e); }
      if (!same && this.layer) {
        // keep the cover only while the browser is really leaving: if no pagehide follows within 1200ms (a 204,
        // a download, a blocked scheme) the page is shown again
        this.keepCover = true;
        const L = this.layer;
        let leaving = false;
        const onHide = () => { leaving = true; };
        const drop = () => { if (L.parentNode) L.parentNode.removeChild(L); global.removeEventListener('pagehide', onHide); global.removeEventListener('pageshow', onShow); };
        const onShow = (e) => { if (e.persisted) drop(); };
        global.addEventListener('pagehide', onHide);
        global.addEventListener('pageshow', onShow);
        global.setTimeout(() => { if (!leaving && !doc.hidden) drop(); }, 1200);
      }
    },

    focusAndAnnounce(el) {
      const h1 = el.querySelector && (el.matches && el.matches('h1') ? el : el.querySelector('h1'));
      const title = ((h1 && h1.textContent) || doc.title || '').replace(/\s+/g, ' ').trim();
      if (h1) {
        if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1');
        try { h1.focus({ preventScroll: true }); } catch (e) { /* no-op */ }
      }
      try {
        if (!liveRegion || !liveRegion.isConnected) {
          liveRegion = doc.createElement('div');
          liveRegion.setAttribute('aria-live', 'polite');
          liveRegion.setAttribute('data-thor-live', '');
          liveRegion.style.cssText = 'position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;padding:0';
          doc.body.appendChild(liveRegion);
        }
        liveRegion.textContent = '';
        const msg = 'Opened ' + title;
        global.setTimeout(() => { if (liveRegion) liveRegion.textContent = msg; }, 40);
      } catch (e) { /* no-op */ }
    },

    restoreAttr(el, name) {
      for (let i = this.attrs.length - 1; i >= 0; i--) {
        const a = this.attrs[i];
        if (a[0] === el && a[1] === name) {
          if (a[2] == null) el.removeAttribute(name); else el.setAttribute(name, a[2]);
          this.attrs.splice(i, 1);
        }
      }
    },

    /* ---------- exits ---------- */
    // Esc / second click: jump-cut to the impact (if not there yet), then warp the clock so the commit
    // lands within ~450ms. The flash gate still applies (a refused flash becomes a local bloom).
    fastForward() {
      if (this.committed || this.ff || this.finished || this.reduced) return;
      const t = this.t || 0, now = this.now();
      const pre = t < T.IMPACT;
      const tStart = pre ? T.IMPACT - 1 : t;
      this.ff = { tStart, real0: now, rate: Math.max(1, (T.COMMIT - tStart) / 360), pre };
      if (pre) this.ffSkipBefore = T.IMPACT;   // one-shot beats and cues before the impact are skipped
      // fade the summon / flight / charge so the skipped crack lands clean (post-impact tails ring on)
      if (pre) { try { if (NS.Audio && typeof NS.Audio.cut === 'function') NS.Audio.cut(); } catch (e) { /* no-op */ } }
      this.ffAt = t;
    },

    // synchronous finish (watchdog, hidden tab, resize, frame error)
    finishNow(reason) {
      if (this.finished) return;
      if (!this.committed) {
        if (!this.mounted && this.renderState === 'resolved') { this.nextEl = this.pendingEl; this.isCover = false; this.mounted = true; }
        if (this.mounted) this.doCommit();
        else { this.committed = true; this.scrollLocked = false; this.restoreWrap(false); this.navigate(); }
      }
      this.finish({ reason });
    },

    // hashchange / popstate before commit: drop everything, let the app handle the route
    abort(reason) {
      if (this.finished) return;
      try { if (NS.Audio && typeof NS.Audio.cut === 'function') NS.Audio.cut(null, 120); } catch (e) { /* no-op */ }
      this.finish({ aborted: true, reason });
    },

    removeCanvases() {
      if (this.fxCv && this.fxCv.parentNode) this.fxCv.parentNode.removeChild(this.fxCv);
      if (this.pxCv && this.pxCv.parentNode) this.pxCv.parentNode.removeChild(this.pxCv);
    },

    cleanup() {
      try { global.cancelAnimationFrame(this.raf); } catch (e) { /* no-op */ }
      global.clearTimeout(this.watchdog);
      for (const l of this.listeners) l[0].removeEventListener(l[1], l[2], l[3]);
      this.listeners.length = 0;
      this.scrollLocked = false;
      this.removeCanvases();
      if (this.styleEl && this.styleEl.parentNode) this.styleEl.parentNode.removeChild(this.styleEl);
      if (this.layer && !this.keepCover && this.layer.parentNode) this.layer.parentNode.removeChild(this.layer);
      this.restoreWrap(false);
      for (let i = this.attrs.length - 1; i >= 0; i--) {
        const a = this.attrs[i];
        try { if (a[2] == null) a[0].removeAttribute(a[1]); else a[0].setAttribute(a[1], a[2]); } catch (e) { /* detached */ }
      }
      this.attrs.length = 0;
      if (this.pools) for (const k in this.pools) this.pools[k].clear();
      this.dsCv = this.dsCtx = this.dsId = null;
    },

    // placement / scale / beat snapshot (stats, ThorLink.debug(), the capture report)
    info() {
      const r1 = (v) => Math.round(v * 10) / 10, pt = (p) => (p ? { x: Math.round(p.x), y: Math.round(p.y) } : null);
      return {
        k: this.k, u: this.u != null ? r1(this.u) : null, dpr: this.pxDpr, headCss: this.hk && this.u ? Math.round(this.hk.headW * this.u) : null,
        headTarget: this.headTarget || null, side: this.side, pre: this.pre ? this.pre.slice() : null, impactFrame: this.impF || null,
        headClip: this.headClip != null ? this.headClip : null, shortPx: this.shortPx || 0, target: this.targetBox(), strikeInTarget: this.strikeInTarget(),
        P: pt(this.P), Q: pt(this.Q), palm: pt(this.palm), buzz: pt(this.B), entry: pt(this.E), skyTarget: pt(this.skyTarget),
        hand: this.hd ? (this.hd.virtual ? 'virtual' : 'sprite') : null,
        cutFade: this.hd && this.hd.cut ? (this.hd.cut.pre ? 'sprite' : this.hd.cut.faded ? 'engine' : 'none') : null,
        beats: this.beatLog.slice(), flashes: this.flashes.slice(), t: this.t != null ? Math.round(this.t) : null,
        quality: this.lowQ ? 'low' : 'high', bolts: this.lowBolts ? 'low' : 'full', qReason: this.qReason || null,
        glyphs: this.glyphs ? this.glyphs.length : 0,
        neighbours: (this.allLinks || []).slice(0, 40).map((l) => l.text),
      };
    },

    targetBox() {
      const b = this.isCard || this.isButton ? this.bb : this.hit;
      return b ? { l: Math.round(b.l), t: Math.round(b.t), w: Math.round(b.w), h: Math.round(b.h) } : null;
    },
    // the strike lands on the target: the overhead slam's face in the middle half of the box (both axes); the
    // side blow's face 12-40% into the box from its near side and in the middle half of its height
    strikeInTarget() {
      const b = this.isCard || this.isButton ? this.bb : this.hit, P = this.P;
      if (!b || !P) return null;
      const midY = P.y >= b.t + 0.25 * b.h - 1 && P.y <= b.b - 0.25 * b.h + 1;
      if (SIDE[this.impF]) {
        const d = this.side > 0 ? P.x - b.l : b.r - P.x;
        return midY && d >= Math.min(2, 0.12 * b.w) - 1 && d <= 0.4 * b.w + 1;
      }
      return midY && P.x >= b.l + 0.25 * b.w - 1 && P.x <= b.r - 0.25 * b.w + 1;
    },

    finish(info) {
      if (this.finished) return;
      this.finished = true;
      this.cleanup();
      const ms = Math.round(this.now() - this.t0);
      if (current === this) current = null;
      const ft = this.frameLog.slice().sort((p, q) => p - q);
      lastStats = Object.assign(this.reduced ? {} : this.info(), {
        href: this.href, seed: this.seed, ms, reduced: !!this.reduced, frames: this.frames, timeline: 'v3',
        avgFrameMs: ft.length ? Math.round((ft.reduce((s, v) => s + v, 0) / ft.length) * 10) / 10 : 0,
        p95FrameMs: ft.length ? Math.round(ft[Math.floor(ft.length * 0.95)] * 10) / 10 : 0,
        maxFrameMs: Math.round(this.maxFrame * 10) / 10, quality: this.lowQ ? 'low' : 'high',
        waitedMs: Math.round((this.maxWait || 0) * this.scale), committed: this.committed,
        commitMs: this.commitReal != null ? Math.round(this.commitReal) : null,
        aborted: !!(info && info.aborted), reason: (info && info.reason) || 'done',
        skipped: !!this.ff, skipAtMs: this.ff ? Math.round(this.ffAt * this.scale) : null,
        startCost: this.startCost || null, planCost: this.planCost || null,
        slowFrames: (this.slow || []).slice(0, 24), slowRender: (this.slowRender || []).slice(0, 40),
        trace: this.trace || undefined,
      });
      flushQuiet();
      this.dispatch('thor:done', ms, { committed: this.committed, aborted: lastStats.aborted });
      this._resolve({ href: this.href, ms, committed: this.committed, aborted: lastStats.aborted });
    },
  });

  /* ====================================================================
   * 15. STRIKE: CLOCKS + SIMULATION (no drawing here)
   * ==================================================================== */
  // one-shot beats on the main clock: [base ms, handler suffix] (time order)
  const EVENTS = [
    [T.SPARK, 'Spark'], [T.MAT, 'Materialize'], [T.CALL, 'Call'], [T.FLY, 'Fly'], [T.CATCH, 'Catch'], [T.CHARGE, 'Charge'], [T.SKY, 'Sky'], [T.PRERENDER, 'Prerender'],
    [T.IMPACT, 'Impact'], [T.HITSTOP_END, 'Release'], [T.LIFT, 'Lift'], [T.RESTRIKE, 'Restrike'], [T.DEMAT, 'Dematerialize'],
    [T.DEMAT_END, 'Gone'],
  ];

  Object.assign(Strike.prototype, {
    frame() {
      if (this.finished) return;
      this.raf = global.requestAnimationFrame(this._frame);
      const now = this.now();
      if (now - this.t0 > 7000 * this.scale + 400) { this.finishNow('watchdog'); return; }
      try { this.tick(now); } catch (err) { console.error('[ThorLink] frame error', err); this.finishNow('error'); }
    },

    tick(now) {
      const S = this.scale;
      const realDt = this.lastNow != null ? now - this.lastNow : 16.7;
      this.lastNow = now;
      let t;
      if (this.ff) t = this.ff.tStart + ((Math.max(now, this.ff.real0) - this.ff.real0) / S) * this.ff.rate;
      else t = Math.max(0, (now - this.t0) / S);
      this.t = t;
      const dt = (clamp(realDt, 0, 50) / S) * (this.ff ? this.ff.rate : 1);
      this.frames++;
      if (this.frames > 1) {
        this.frameLog.push(realDt);
        if (realDt > this.maxFrame) this.maxFrame = realDt;
        if (realDt > 30) (this.slow = this.slow || []).push([Math.round(this.prevT || 0), Math.round(realDt)]);
      }
      // renderNext starts after the first painted frame, so a heavy builder never delays the lock-on
      if (this.frames === 1) global.setTimeout(() => this.startRender(), 0);
      if (this.frames === 2) this.promoteWrap();
      this.adaptQuality(t);
      this.updateMount(t);
      const bt = (this.bt = this.burnClock(t, dt));
      this.runCues(t);
      const u0 = performance.now();
      this.update(t, bt, dt);
      if (this.finished) return;
      const r0 = performance.now();
      this.render(t, bt);
      const rc = performance.now() - r0;
      if (rc > 12 || r0 - u0 > 8) (this.slowRender = this.slowRender || []).push([Math.round(t), Math.round(r0 - u0), Math.round(rc)]);
      this.prevT = t;
      this.checkEnd(t, bt);
      // a queued host job runs right after this frame (a task, so the frame presents first), in a quiet beat only
      if (quietQ.length && !this.finished && (this.ff || this.isQuiet(t)) && (this.quietAt == null || now - this.quietAt > 40)) {
        this.quietAt = now;
        const fn = quietQ.shift();
        global.setTimeout(() => { try { fn(); } catch (e) { console.error('[ThorLink] whenQuiet job threw', e); } }, 0);
      }
    },
    // the beats a long task must never land on (base ms): a job only starts with at least 200ms of runway before
    // the next of them
    isQuiet(t) {
      for (const w of BUSY) if (t >= w[0] - 200 && t < w[1]) return false;
      return true;
    },

    // Adaptive quality from the real frame times (rAF to rAF, so compositor and raster stalls count): decided at
    // 700ms from whatever has arrived (4+ samples; a slow device has few), and checked again over the first 10
    // frames of the burn, the expensive phase. Only a genuinely slow device (median > 26ms) drops, and the drop
    // only halves the particles, stops the smoke and draws the FX canvas at 1x: the lightning (channels,
    // branches, glow layers) is never weakened by it.
    adaptQuality(t) {
      if (!this.autoQ || this.lowQ) return;
      if (!this.ev.q1 && t >= 700) {
        const f = this.frameLog.slice(2);
        if (f.length >= 6 || t >= 1000) { this.ev.q1 = 1; if (f.length >= 4) this.judgeFrames(f, 'start'); }
      }
      if (!this.ev.q2 && this.ev.eImpact && this.bt >= T.PUNCH + 160) {
        this.ev.q2 = 1;
        const f = this.frameLog.slice(-12);
        if (f.length >= 8) this.judgeFrames(f, 'burn');
      }
    },
    // the start: the median frame over 26ms; the burn (the expensive phase): the p90 frame over 24ms
    judgeFrames(f, phase) {
      const s = f.slice().sort((a, b) => a - b), med = s[Math.floor(s.length / 2)], p90 = s[Math.min(s.length - 1, Math.floor(s.length * 0.9))];
      if (phase === 'burn' ? p90 <= 24 : med <= 26) return;
      this.lowQ = true;
      this.qReason = phase + (phase === 'burn' ? ': p90 frame ' + Math.round(p90) : ': median frame ' + Math.round(med)) + 'ms over ' + s.length;
      for (const k in this.pools) this.pools[k].cap = Math.max(4, Math.floor(this.pools[k].cap / 2));
      this.pools.smoke.cap = 0;
      if (this.fxCv && this.fxDpr > 1) {
        this.fxDpr = 1;
        this.fxCv.width = Math.round(this.vw); this.fxCv.height = Math.round(this.vh);
      }
    },

    // Burn clock: held at the punch while the next page is not mounted (the link smoulders, the arm hovers), then
    // it never races to catch up: the reveal runs at most 1.35x its schedule (the front still sweeps at an even,
    // photosensitivity-safe rate) and the commit and the end move later instead; only after the commit, when the
    // full-screen front is gone and just a few embers settle, does the tail catch up 3x (click to done stays
    // under 5400ms even after the longest hold, ~1400ms).
    // The glyph clock gt lets the link's letters keep burning through a hold: it runs up to 320ms ahead of bt.
    burnClock(t, dt) {
      if (!this.mounted && !this.committed && t >= T.PUNCH) {
        this.waiting = true;
        this.burnOffset = t - T.PUNCH;
        this.maxWait = Math.max(this.maxWait || 0, this.burnOffset);
      } else {
        this.waiting = false;
        if (this.burnOffset > 0 && this.mounted) this.burnOffset = Math.max(0, this.burnOffset - (this.committed ? 2 : 0.35) * dt);
      }
      const bt = t - this.burnOffset;
      this.gt = Math.min(t, bt + 320);
      return bt;
    },

    runCues(t) {
      if (this.opts.sound === false) return;
      const S = this.scale;
      for (let i = 0; i < CUES.length; i++) {
        const c = CUES[i], tc = c[1] === 'dematerialize' ? t - this.armHold : t;
        if (this.cueDone[i] || tc < c[0]) continue;
        this.cueDone[i] = 1;
        if (this.ffSkipBefore && c[0] < this.ffSkipBefore) continue;
        if (this.ff && !FF_CUES[c[1]]) continue;
        if (!this.ff && (tc - c[0]) * S > 250) continue; // too late: skip rather than play out of sync
        sfx(c[1], c[2] == null ? undefined : c[2] * S, c[3], c[4] == null ? undefined : c[4] * S, typeof c[5] === 'function' ? c[5](this) : c[5]);
      }
    },

    logBeat(name, baseMs) {
      this.beatLog.push({ name, baseMs: Math.round(baseMs), ms: Math.round(this.now() - this.t0) });
    },

    runEvents(t) {
      for (const e of EVENTS) {
        const key = 'e' + e[1];
        if (this.ev[key] || t < e[0]) continue;
        if (e[1] === 'Restrike' && !this.ff && !this.flashAllowed()) {
          // wait up to 100ms real for the gate, so frame jitter never costs the budgeted F2
          if (this.restrikeWait == null) this.restrikeWait = this.now();
          if (this.now() - this.restrikeWait < 100) continue;
        }
        // the arm's own beats wait out the arm hold (a slow page: it keeps hovering instead of leaving)
        if ((e[1] === 'Dematerialize' || e[1] === 'Gone') && t - this.armHold < e[0]) continue;
        this.ev[key] = 1;
        if (this.ffSkipBefore && e[0] < this.ffSkipBefore) continue;
        this.logBeat(e[1], e[0]);
        this['on' + e[1]](t);
      }
    },

    every(key, ms, t) {
      const q = Math.floor(t / ms);
      if (this.dynAt[key] === q) return false;
      this.dynAt[key] = q;
      return true;
    },

    /* ---------- photosensitivity gate (real ms): <= 3 flashes, <= 2 per trailing 1050ms, >= 330ms apart ---------- */
    flashAllowed() {
      const now = this.now(), L = this.flashLog;
      if (L.length >= 3) return false;
      if (L.length && now - L[L.length - 1] < 330) return false;
      let n = 0;
      for (const x of L) if (now - x < 1050) n++;
      return n < 2;
    },
    takeFlash(name, t) {
      const ok = this.flashAllowed(), now = this.now();
      if (ok) this.flashLog.push(now);
      this.flashes.push({ name, ms: Math.round(now - this.t0), baseMs: Math.round(t), refused: !ok });
      return ok;
    },

    /* ---------- one-shot beats ---------- */
    // 60ms after the click: the first electric pixels snap in toward the spot where the hand will condense,
    // so the click is answered at once (the dither reveal itself runs 120-420)
    onSpark() {
      const r = this.rand, c = this.handC, sq = Math.max(1, Math.round(this.u));
      for (let i = 0; i < 10; i++) {
        const a = r() * TAU, d0 = r.range(40, 90) * (this.u / 4 + 0.25), sp = r.range(120, 240);
        const p = this.spark(c.x + Math.cos(a) * d0, c.y + Math.sin(a) * d0 * 0.7, -Math.cos(a) * sp, -Math.sin(a) * sp * 0.7, r.range(180, 300), r.pick(ELEC), 1, 0, 3.2, null);
        if (p) { p.sq = sq; p.snap = 1; }
      }
    },
    // more motes snap in as the hand resolves out of thin air
    onMaterialize() {
      const r = this.rand, c = this.handC, sq = Math.max(1, Math.round(this.u));
      for (let i = 0; i < 12; i++) {
        const a = r() * TAU, d0 = r.range(30, 70) * (this.u / 4 + 0.25), sp = r.range(140, 300);
        const p = this.spark(c.x + Math.cos(a) * d0, c.y + Math.sin(a) * d0 * 0.7, -Math.cos(a) * sp, -Math.sin(a) * sp * 0.7, r.range(150, 260), r.pick(ELEC), 1, 0, 3.2, null);
        if (p) { p.sq = sq; p.snap = 1; }
      }
    },
    onCall(t) { this.callAt = t; },
    onCharge() { this.planSkyExtras(); },
    onFly() { /* beat marker: Mjolnir leaves the far edge */ },
    onCatch(t) {
      const r = this.rand, pm = this.palm, back = Math.atan2(-this.flyDir.y, -this.flyDir.x), d1 = 0.45 * this.headWc;
      for (let i = 0; i < 12; i++) {
        const a = back + r.range(-1.2, 1.2), sp = r.range(220, 420), d0 = d1 + r.range(0, 10);
        const p = this.spark(pm.x + Math.cos(a) * d0, pm.y + Math.sin(a) * d0, Math.cos(a) * sp, Math.sin(a) * sp, r.range(150, 260), r.pick(ELEC), 1.4, 900, 3.2, null);
        if (p) p.sq = Math.max(1.5, Math.round(this.u * 0.75));
      }
      this.catchAt = t;
      vibrate(20);
    },
    // the hero beat: the sky bolt lands on the raised hammer
    // the hero beat: three channels land on the raised hammer; a 2-frame ink-silhouette hit-stop, a pixel
    // starburst off the head, a burst of art-pixel sparks and a 3px kick (the only full-screen light is FS)
    onSky(t) {
      const r = this.rand, h = this.skyTarget;
      this.skyAt = t;
      if (this.takeFlash('FS', t)) this.fs = { at: t, peak: 0.5 }; else this.fsBloom = t;
      const cols = [RGB.cyan, RGB.blue, RGB.cyan, RGB.deep, RGB.blue];
      const sq = Math.max(1, Math.round(this.u));
      for (let i = 0; i < 18; i++) {
        const a = -Math.PI / 2 + r.range(-1.6, 1.6), sp = r.range(200, 460);
        const p = this.spark(h.x + Math.cos(a) * 8, h.y + Math.sin(a) * 8, Math.cos(a) * sp, Math.sin(a) * sp - 80, r.range(180, 300), r.pick(cols), 1.4, 900, 3.2, null);
        if (p) { p.sq = sq; p.snap = 1; }
      }
      vibrate(30);
    },
    onPrerender() {
      if (!this.crater) this.crater = buildScorch(this.rand, this.P, this.linkW, this.linkH, this.u, this.mobile, this.isCard ? null : this.baseline);
      for (let i = 0; i < 4; i++) pixFlame(i);
      this.measureGlyphs();

    },
    // every glyph of the link, measured once (Range rects per character), so the canvas can burn them one by one
    measureGlyphs() {
      if (this.glyphs || this.isCard) return;
      const out = [], fonts = new Map();
      try {
        const tw = doc.createTreeWalker(this.anchor, NodeFilter.SHOW_TEXT), rg = doc.createRange();
        let node;
        while ((node = tw.nextNode()) && out.length < 160) {
          const s = node.nodeValue, el = node.parentElement;
          let st = fonts.get(el);
          if (!st) {
            const cs = global.getComputedStyle(el);
            st = { font: (cs.fontStyle || 'normal') + ' ' + (cs.fontWeight || '400') + ' ' + (cs.fontSize || '16px') + ' ' + (cs.fontFamily || 'sans-serif'), color: cs.color || this.textColor };
            fonts.set(el, st);
          }
          for (let i = 0; i < s.length && out.length < 160; i++) {
            const c = s.charCodeAt(i);
            if (c === 32 || c === 9 || c === 10 || c === 13 || c === 160) continue;
            const j = c >= 0xd800 && c <= 0xdbff ? i + 2 : i + 1;
            rg.setStart(node, i); rg.setEnd(node, Math.min(j, s.length));
            const rr = rg.getClientRects()[0];
            if (rr && rr.width > 0.5) {
              let ri = 0, bd = Infinity;
              this.rects.forEach((q, qi) => { const dd = Math.abs(q.cy - (rr.top + rr.height / 2)); if (dd < bd) { bd = dd; ri = qi; } });
              const cx = rr.left + rr.width / 2;
              out.push({ ch: s.slice(i, j), l: rr.left, t: rr.top, w: rr.width, h: rr.height, font: st.font, color: st.color, at: this.fuseAt(ri, cx), seed: out.length * 7 + 3 });
            }
            i = j - 1;
          }
        }
      } catch (e) { /* no Range support: the DOM fallback burns the link */ }
      this.glyphs = out.length ? out : null;
    },
    onImpact(t) {
      const P = this.P, r = this.rand;
      if (!this.isCard) this.measureGlyphs();
      this.setAttr(this.anchor, 'data-thor-state', this.isCard || this.glyphs ? 'struck' : 'burning');
      const peak = this.ff ? 0.5 : 0.85;
      if (this.takeFlash('F1', t)) this.f1 = { at: t, peak }; else this.f1Bloom = t;
      if (!this.crater) this.crater = buildScorch(this.rand, this.P, this.linkW, this.linkH, this.u, this.mobile, this.isCard ? null : this.baseline);
      // frozen starburst: spawned now, hangs through the 90ms hit-stop, explodes on release
      const cols = [RGB.cyan, RGB.gold, RGB.blue, RGB.orange, RGB.cyan];
      const n = this.lowQ ? 20 : 40;
      for (let i = 0; i < n; i++) {
        const a = r.range(-175, -5) * DEG, sp = r.range(350, 950), d = r.range(4, 30);
        this.spark(P.x + Math.cos(a) * d, P.y + Math.sin(a) * d, Math.cos(a) * sp, Math.sin(a) * sp, r.range(380, 720), r.pick(cols), r.range(1.2, 2.4), 1600, 2.2, this.isCard ? null : this.baseline);
      }
      for (let i = 0; i < 12; i++) {
        const p = this.pools.debris.spawn();
        if (!p) break;
        const a = r.range(-170, -10) * DEG, sp = r.range(200, 650);
        p.x = P.x + r.range(-this.linkW / 3, this.linkW / 3); p.y = P.y + r.range(-4, 4);
        p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp; p.size = r.range(3, 6);
        p.col = r.pick(this.debrisCols); p.rot = r() * TAU; p.vr = r.range(-14, 14); p.age = 0; p.life = r.range(380, 600);
      }
      const inf = this.info();
      this.dispatch('thor:impact', Math.round(this.now() - this.t0), {
        k: inf.k, u: inf.u, dpr: inf.dpr, headCss: inf.headCss, side: inf.side, pre: inf.pre, impactFrame: inf.impactFrame, headClip: inf.headClip, P: inf.P, Q: inf.Q,
        target: inf.target, strikeInTarget: inf.strikeInTarget,
      });
      vibrate([40, 30, 20]);
    },
    onRelease(t) { this.shockAt = t; },
    // the rebound: a few embers kick up off the struck spot as the hammer springs clear (no smoke over the
    // letters: they must read while they burn)
    onLift() { this.burst(this.P.x, this.P.y - 4, 6, 60, 180); },
    onRestrike(t) {
      const r = this.rand, P = this.P;
      this.restrikeAt = t;
      if (this.takeFlash('F2', t)) this.f2 = { at: t, peak: 0.65 }; else this.f2Bloom = t;
      // the return stroke reuses the top 60% of the trunk channel, then forks into the uncovered hole
      const tr = this.trunk, m = Math.round(tr.n * 0.6), xs = [], ys = [];
      for (let i = 0; i <= m; i++) { xs.push(tr.px[i]); ys.push(tr.py[i]); }
      const top = Bolt.fromPoints(xs, ys, r);
      top.shimmer(1.5);
      const s0 = top.tip(m);
      const fork = new Bolt(s0.x, s0.y, P.x, P.y - 2, this.mobile ? 5 : 6, r, 0.45);
      fork.addBranches(4, 4, { angMin: 20, angMax: 50, fracMin: 0.3, fracMax: 0.6, subMax: 0 });
      this.restrike = { top, fork, at: t };
    },
    // the arm lets go of the world: it dissolves from the cut end toward the hammer head
    onDematerialize(t) { this.dematAt = t; },
    onGone(t) {
      const r = this.rand, h = this.lastHead || this.headImpact;
      this.goneAt = t;
      for (let i = 0; i < 10; i++) {
        const a = r() * TAU, sp = r.range(90, 240);
        const p = this.spark(h.x, h.y, Math.cos(a) * sp, Math.sin(a) * sp - 60, r.range(200, 360), r.pick(ELEC), 1, 300, 2.5, null);
        if (p) p.sq = Math.max(1, Math.round(this.u * 0.75));
      }
    },

    /* ---------- per-frame simulation ---------- */
    update(t, bt, dt) {
      const ev = this.ev;
      const stop = (t >= T.CATCH && t < T.CATCH_REL) || (t >= T.SKY && t < T.SKY_HOLD) || (t >= T.IMPACT && t < T.HITSTOP_END);
      let w = stop ? 0 : dt;
      if (t >= T.BREATH && t < T.SWING) w *= 0.15; // held breath
      this.wdt = w;
      this.worldT += w;
      this.orbitA = (this.orbitA || 0) + (t < T.SKY ? 2 : lerp(2, 4, prog(T.SKY, T.WINDUP, t))) * TAU * (w / 1000);
      if (this.waiting && !this.ff && t >= T.LIFT_SET && t - this.armHold < T.DEMAT && this.armHold < ARM_HOLD_MAX) this.armHold = Math.min(ARM_HOLD_MAX, this.armHold + dt);
      this.runEvents(t);
      this.pose = this.armAt(t);
      this.fly = this.flyAt(t);
      if (this.fly && this.buzzAt == null && this.fly.u >= this.buzzU) { this.buzzAt = t; this.logBeat('Buzz', t); }
      if (this.pose && IMPACT_FRAMES[this.pose.frame]) { const h = this.headNow(); if (h) this.lastHead = h; }
      this.updateDyn(t);
      this.updateBurn(t, bt);
      this.updateSisters(t, bt);
      if (ev.eImpact && !this.committed) { if (this.isCard) this.spawnCardFlames(bt); else this.spawnFuse(bt, w / 1000); }
      if (this.mounted && !this.committed && bt >= T.PUNCH) this.spawnRim(bt, w / 1000);
      if (this.waiting) this.spawnSmoulder(w / 1000);
      if (!this.committed) this.updateFlares(bt);
      this.updateCrawlers(t);
      this.spawnTrail(t, w / 1000);
      this.stepParticles(w / 1000, t);
      this.shake = this.computeShake(t);
      this.applyWrap();
      this.updateMask();
      if (this.trace && this.trace.length < 900) this.traceFrame(t);
    },
    // capture only: where the cast and the holes are this frame (css px), for the page-brightness audit
    traceFrame(t) {
      const d = this.pxDpr, k = this.k, cast = [];
      const p = this.pose;
      if (p) {
        const f = this.hd.f[p.frame], bx = this.side > 0 ? f.bb.x : f.W - f.bb.x - f.bb.w;
        cast.push([(p.TL.x + bx * k) / d, (p.TL.y + f.bb.y * k) / d, (f.bb.w * k) / d, (f.bb.h * k) / d].map(Math.round));
      }
      if (this.fly) cast.push([this.fly.TL.x / d, this.fly.TL.y / d, (this.hk.W * k) / d, (this.hk.H * k) / d].map(Math.round));
      // live bolts count as cast too (their ink channels are not page dimming)
      const box = (b, pad) => {
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        const walk = (q) => { for (let i = 0; i <= q.n; i++) { const x = q.px[i], y = q.py[i]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } for (const br of q.branches) walk(br.bolt); };
        walk(b);
        cast.push([x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad].map(Math.round));
      };
      for (const sb of this.skyBolts || []) if (this.skyHalo(t - sb[1]) > 0.02 && t < T.SKY + 800) box(sb[0], 30);
      if (this.trunkHalo(t) > 0.02 && t < T.IMPACT + 600) box(this.trunk, 30);
      for (const sb of this.sisters) if (this.sisterHalo(t, sb.at) > 0.02) box(sb.bolt, 24);
      if (this.restrike && this.restrikeHalo(t) > 0.02) { box(this.restrike.top, 24); box(this.restrike.fork, 24); }
      const holes = [], B = this.burn;
      if (B && B.x1 >= 0) {
        const cs = B.cs, l = B.x0 * cs, tp = B.y0 * cs, rr = (B.x1 + 1) * cs, bb = (B.y1 + 1) * cs;
        holes.push([Math.round((l + rr) / 2), Math.round((tp + bb) / 2), Math.round(Math.hypot(rr - l, bb - tp) / 2)]);
      }
      this.trace.push({ ms: Math.round(this.now() - this.t0), t: Math.round(t), cast, holes });
    },

    /* ---------- the arm: pose-to-pose on twos (materialise, swing and dissolve on ones) ---------- */
    quantArm(t) {
      if ((t >= T.MAT && t < T.MAT_END) || (t >= T.SWING && t < T.LIFT_SET) || (t >= T.DEMAT && t < T.DEMAT_END)) return t;
      const phases = [T.MAT_END, T.CALL, T.CATCH, T.CATCH_REL, T.RAISE, T.CHARGE, T.SKY, T.WINDUP, T.HITSTOP_END, T.LIFT_SET];
      let start = 0;
      for (const p of phases) if (t >= p) start = p;
      const step = 1000 / 30;
      return start + Math.floor((t - start) / step) * step;
    },
    // {frame, h, dx, dy, mat}: h pushes back along the frame's own axis (negative thrusts), (dx, dy) is the
    // art-px offset from the home root, mat = {mode: 'in' | 'out', p} while it materialises / dissolves. Every
    // pose before the swing carries the placement's pre-offset.
    armPose(tq) {
      const hd = this.hd, pre = this.pre;
      // a slow next page: the hover after the rebound stretches by the arm hold (the arm clock pauses there)
      if (tq >= T.LIFT_SET && this.armHold) tq = Math.max(T.LIFT_SET, tq - this.armHold);
      if (tq < T.MAT || tq >= T.DEMAT_END) return null;
      const mix = (a, b, u) => [Math.round(lerp(a[0], b[0], u)), Math.round(lerp(a[1], b[1], u))];
      if (tq < T.CALL) {
        // resolves out of thin air a touch low and back, then drifts into place
        const off = mix(OFF.appear, [0, 0], Ease.outCubic(prog(T.MAT, T.SETTLE, tq)));
        return { frame: hd.f.open0 ? 'open0' : 'open', h: 0, dx: pre[0] + off[0], dy: pre[1] + off[1], mat: tq < T.MAT_END ? { mode: 'in', p: prog(T.MAT, T.MAT_END, tq) } : null };
      }
      if (tq < T.CATCH) {
        // the call: the open palm thrusts toward the incoming hammer, the vambrace runes ignite one by one
        let frame = 'open';
        if (hd.f.open0 && tq < T.RUNE3) frame = tq < T.RUNE1 ? 'open0' : tq < T.RUNE2 ? 'open1' : 'open2';
        if (!hd.f[frame]) frame = 'open';
        return { frame, h: -2 * Ease.outBack(prog(T.CALL, T.CALL_SET, tq)), dx: pre[0], dy: pre[1] };
      }
      if (tq < T.CATCH_END) {
        let h = -2;
        if (tq >= T.CATCH_REL) {
          if (tq < T.RECOIL) h = lerp(-2, 3, Ease.outQuad(prog(T.CATCH_REL, T.RECOIL, tq)));
          else if (tq < T.RECOIL_OVER) h = lerp(3, -1, Ease.inOutQuad(prog(T.RECOIL, T.RECOIL_OVER, tq)));
          else h = lerp(-1, 0, Ease.outQuad(prog(T.RECOIL_OVER, T.CATCH_END, tq)));
        }
        return { frame: 'catch', h, dx: pre[0], dy: pre[1] };
      }
      if (tq < T.SWING) {
        // the hoist: the steeper raised frame lifts the fist ~11 art px above the catch grip and the arm keeps
        // climbing into the hero pose (with a 2px arc over the top); hold through the charge; then the arm goes
        // up and back and the hammer cocks over the shoulder for the windup
        let off = this.offR, arc = 0;
        if (tq < T.RAISE_SET) { const u = prog(T.RAISE, T.RAISE_SET, tq); off = mix([pre[0] + 3, pre[1] + 6], this.offR, Ease.outQuad(u)); arc = -Math.round(2 * Math.sin(Math.PI * u)); }
        else if (tq >= T.WINDUP) off = mix(this.offR, this.offW, Ease.outQuad(prog(T.WINDUP, T.COIL_END, tq)));
        let frame = 'glowHeldRaised';
        if (tq < T.CHARGE) frame = 'heldRaised';
        else if (tq < T.SKY) frame = this.streamLive ? 'glowHeldRaised' : 'heldRaised';
        else if (tq >= T.WINDUP + 40) frame = 'heldWindup'; // up and back, cocked over the shoulder for the slam
        return { frame, h: 0, dx: off[0], dy: off[1] + arc };
      }
      if (tq < T.IMPACT) {
        // the slam: three keys of two frames each (hammer 0, 45, 63 deg); within its frames each key keeps
        // travelling half the way to the next key, so the head moves on every frame and the pause comes after
        // the contact (the hit-stop), never before it
        const seg = tq < T.SWING2 ? 0 : tq < T.SMEAR ? 1 : 2;
        const a = [T.SWING, T.SWING2, T.SMEAR][seg], b = [T.SWING2, T.SMEAR, T.IMPACT][seg];
        const from = [this.offA, this.offS, this.offM][seg], to = [this.offS, this.offM, [0, 0]][seg];
        const off = mix(from, to, 0.5 * prog(a, b, tq));
        return { frame: this.swingKeys[seg], h: 0, dx: off[0], dy: off[1] };
      }
      if (tq < T.LIFT) {
        // contact: for two frames the face bites 1-2 art px past the strike point (the squash), then the
        // hit-stop holds it planted on the target
        const bite = tq < T.IMPACT + 34 ? (SIDE[this.impF] ? [2, 0] : [0, 1]) : [0, 0];
        return { frame: this.impF, h: 0, dx: bite[0], dy: bite[1] };
      }
      // the rebound: a 4 art px kick up off the link (50ms), then an eased arc that rises first and swings back
      // toward the arm (140ms, a new position every frame) to a hover well clear of the link, so the burning
      // letters are in full view; the arm hovers there (tremble and crackle) and dissolves where it is
      let off;
      if (tq < T.LIFT_PEAK) off = mix([0, 0], this.offL, Ease.outQuad(prog(T.LIFT, T.LIFT_PEAK, tq)));
      else if (tq < T.LIFT_SET) {
        const u = prog(T.LIFT_PEAK, T.LIFT_SET, tq), L = this.offL, Ls = this.offLs;
        off = [Math.round(lerp(L[0], Ls[0], Ease.inOutQuad(u))), Math.round(lerp(L[1], Ls[1], Ease.outCubic(u)))];
      } else off = this.offLs;
      const p = { frame: this.impF, h: 0, dx: off[0], dy: off[1] };
      if (tq >= T.DEMAT) p.mat = { mode: 'out', p: prog(T.DEMAT, T.DEMAT_END - 12, tq) };
      return p;
    },
    armAt(t) {
      const tq = this.quantArm(t), p = this.armPose(tq);
      if (!p || !this.hd.f[p.frame]) return null;
      let tx = 0, ty = 0;
      const tremble = (t >= T.TREMBLE1 && t < T.TREMBLE1 + 34) || (t >= T.ARM_SHAKE && t < T.CATCH - 24) || (t >= T.TREMBLE && t < T.SWING) ||
        (t >= T.SKY_HOLD && t < T.SKY_HOLD + 70);
      if (tremble && !this.ff && !p.mat) { const q = this.rand(); if (q < 0.4) tx = this.rand() < 0.5 ? -1 : 1; else if (q < 0.8) ty = this.rand() < 0.5 ? -1 : 1; }
      // the hover after the rebound: a slow 1px tremble (a new offset every 60ms, never still for long)
      if (t >= T.LIFT_SET && t < T.DEMAT + 140 + this.armHold && !this.ff) {
        if (!this.hov || this.every('hover', 60, t)) { const q = this.rand(); this.hov = q < 0.35 ? [this.rand() < 0.5 ? -1 : 1, 0] : q < 0.7 ? [0, -1] : [0, 0]; }
        tx += this.hov[0]; ty += this.hov[1];
      }
      p.tq = tq;
      p.TL = this.handTL(p.frame, p.h, p.dx + tx, p.dy + ty, p.axis);
      return p;
    },
    poseTL(p) { return this.handTL(p.frame, p.h, p.dx || 0, p.dy || 0, p.axis); },
    // how much of the arm is on screen (1 = solid), for glows and blooms that belong to it
    armVis() {
      const p = this.pose;
      if (!p) return 0;
      if (!p.mat) return 1;
      return p.mat.mode === 'in' ? p.mat.p : 1 - p.mat.p;
    },
    // current anchors of the cast (css), or null
    headNow() {
      const p = this.pose;
      if (!p) return null;
      const f = this.hd.f[p.frame];
      return f.headC ? this.ptCss(p.frame, p.TL, f.headC) : null;
    },

    /* ---------- the flight: arc-length eased spline, 16+ lossless orientations stepped at 30fps ---------- */
    flyAt(t) {
      if (t < T.FLY || t >= T.CATCH || this.ffSkipBefore) return null;
      const tn = prog(T.FLY, T.CATCH, t), uu = 0.45 * tn + 0.55 * tn * tn;
      const p = this.pathAt(uu);
      const step = 1000 / 30, tq = T.FLY + Math.floor((t - T.FLY) / step) * step;
      const tnq = prog(T.FLY, T.CATCH, tq), uq = 0.45 * tnq + 0.55 * tnq * tnq;
      let ang = 720 * Math.pow(1 - uq, 1.3);
      if (t >= T.CATCH - 90) ang = 0;
      const d = this.pxDpr, k = this.k, hk = this.hk;
      return { x: p.x, y: p.y, u: uu, ang, o: pickOrient(hk, ang), TL: { x: Math.round(p.x * d - (hk.W / 2) * k), y: Math.round(p.y * d - (hk.H / 2) * k) } };
    },

    /* ---------- short-lived arcs, re-rolled on their own cadence ---------- */
    updateDyn(t) {
      const r = this.rand, D = this.dyn;
      if (this.ff && this.ff.pre) { D.call.length = 0; D.catch.length = 0; D.stream.length = 0; D.micro.length = 0; D.elmo.length = 0; D.lock.length = 0; }
      // the call: arcs crackle off the open palm toward the far side the hammer will come from
      if (t >= T.CALL && t < T.CALL + 240 && this.every('call', 40, t)) {
        D.call.length = 0;
        const pm = this.palm, base = Math.atan2(this.E.y - pm.y, this.E.x - pm.x);
        for (let i = 0; i < 3; i++) {
          const a = base + r.range(-0.7, 0.7), len = r.range(16, 40) * (this.u / 4 + 0.3);
          D.call.push(new Bolt(pm.x, pm.y, pm.x + Math.cos(a) * len, pm.y + Math.sin(a) * len, 3, r, 0.5));
        }
      }
      if (t >= T.CALL + 240) D.call.length = 0;
      // the catch: 6 radial arcs from the palm keep moving through the hit-stop
      if (t >= T.CATCH && t < T.CATCH + 150 && this.every('catch', 33, t)) {
        D.catch.length = 0;
        const pm = this.palm;
        for (let i = 0; i < 6; i++) {
          const a = (i * TAU) / 6 + r.range(-0.4, 0.4), len = r.range(24, 60);
          D.catch.push(new Bolt(pm.x, pm.y, pm.x + Math.cos(a) * len, pm.y + Math.sin(a) * len, 3, r, 0.5));
        }
      }
      if (t >= T.CATCH + 150) D.catch.length = 0;
      // the build-up: upward streamers leap off the raised head to meet the sky leader, from the charge on, 2-4 per
      // 50ms tick and reaching further as the bolt nears; the head flickers to its charged palette with them from
      // T.ICE, more often as it builds
      if (t >= T.CHARGE && t < T.SKY && this.every('stream', 50, t)) {
        D.stream.length = 0;
        this.streamLive = false;
        const h = this.headNow(), hw = this.headWc;
        if (h) {
          const pr = prog(T.CHARGE, T.SKY, t), n = t > T.SKY - 160 ? 4 : r.int(2, 3), reach = lerp(0.5, 1.0, pr);
          for (let i = 0; i < n; i++) {
            const x0 = h.x + r.range(-0.35, 0.35) * hw, y0 = h.y - 0.4 * hw, a = -Math.PI / 2 + r.range(-0.6, 0.6), len = reach * r.range(30, 70);
            D.stream.push(new Bolt(x0, y0, x0 + Math.cos(a) * len, y0 + Math.sin(a) * len, 3, r, 0.5));
          }
          this.streamLive = t >= T.ICE && r() < lerp(0.45, 0.9, pr);
        }
      }
      // current climbing from the vambrace runes up over the fist and the handle (pixel cells on the sprite)
      if (t >= T.CHARGE + 40 && t < T.SKY && this.every('climb', 90, t)) this.launchClimb(t);
      if (t >= T.SKY) { D.stream.length = 0; this.streamLive = false; }
      // the link answers the charge: a 1px electric crackle flickers along its underline until the impact
      if (t >= T.SKY && t < T.IMPACT && !this.isCard && this.every('lock', 45, t)) {
        D.lock.length = 0;
        for (const rc of this.rects) {
          const n = rc.w > 120 ? 2 : 1;
          for (let i = 0; i < n; i++) {
            if (r() < 0.25) continue;
            const len = Math.min(rc.w, r.range(12, 30)), x0 = r.range(rc.l, Math.max(rc.l, rc.r - len)), y = rc.b - 1;
            D.lock.push(new Bolt(x0, y, x0 + len, y + r.range(-1.5, 1.5), 3, r, 0.7));
          }
        }
      }
      if (t >= T.IMPACT) D.lock.length = 0;
      // micro arcs leaping off the charged head
      if (t >= T.SKY && t < T.SWING && this.every('micro', 33, t)) {
        D.micro.length = 0;
        const h = this.headNow();
        if (h) {
          const n = r.int(4, 6), R0 = this.headWc * 0.42;
          for (let i = 0; i < n; i++) {
            const a = r() * TAU, x = h.x + Math.cos(a) * R0, y = h.y + Math.sin(a) * R0 * 0.8, b = a + r.range(-0.9, 0.9), len = r.range(10, 24);
            D.micro.push(new Bolt(x, y, x + Math.cos(b) * len, y + Math.sin(b) * len, 3, r, 0.6));
          }
        }
      }
      if (t >= T.SWING) D.micro.length = 0;
      // St Elmo's fire: arcs hop between the charged link and its 3 nearest links
      if (t >= T.SKY + 80 && t < T.SWING && this.every('elmo', 50, t)) {
        D.elmo.length = 0;
        const h = this.hit;
        for (const L of this.chain) {
          if (r() < 0.3) continue;
          const x0 = r.range(h.l, h.r), y0 = L.cy < h.cy ? h.t : h.b, x1 = clamp(x0 + r.range(-40, 40), L.l, L.r), y1 = L.cy < h.cy ? L.b : L.t;
          if (Math.hypot(x1 - x0, y1 - y0) > 220) continue;
          D.elmo.push({ bolt: new Bolt(x0, y0, x1, y1, 4, r, 0.4), a: r.range(0.5, 1) });
        }
      }
      if (t >= T.SWING) D.elmo.length = 0;
      // arcs crawling around the impact: short chords hopping along a flattened ring round the strike point
      // they crawl round the struck spot above and below the line of text, never across the burning letters
      if (t >= T.IMPACT && t < T.IMPACT + 320 && this.every('ground', 40, t)) {
        D.ground.length = 0;
        const P = this.P, lb = this.isCard ? this.bb : this.hit, R0 = Math.max(34, Math.min(this.linkW * 0.6, 110)) * lerp(0.9, 1.4, prog(T.IMPACT, T.IMPACT + 320, t));
        const ry = Math.max(lb.h * 0.5 + 14, R0 * 0.5); // above and below the line of text, never across its letters
        for (let i = 0; i < 3; i++) {
          const up = i % 2 ? 1 : -1, a0 = up * r.range(0.4, 0.6) * Math.PI, a1 = a0 + r.sign() * r.range(0.1, 0.2) * Math.PI * 0.5, q = r.range(0.95, 1.1);
          D.ground.push(new Bolt(P.x + Math.cos(a0) * R0 * q, P.y + Math.sin(a0) * ry * q, P.x + Math.cos(a1) * R0 * q, P.y + Math.sin(a1) * ry * q, 3, r, 0.55));
        }
      }
      if (t >= T.IMPACT + 320) D.ground.length = 0;
      // big bolts shimmer every 50ms; the trunk restrikes once on its own channel at +66
      if (this.every('shimmer', 50, t)) {
        const amp = 1 + r();
        if (t >= T.LEADER_SKY && t < T.SKY + 300) this.sky.shimmer(t < T.SKY ? 0.6 : amp);
        if (t >= T.SKY && t < T.SKY + 330 && this.sky2) { this.sky2.shimmer(amp); this.skyLong.shimmer(amp); }
        if (t >= T.LEADERS && t < T.IMPACT) for (const l of this.leaders) l.shimmer(amp);
        if (t >= T.IMPACT && t < T.IMPACT + 400) { this.trunk.shimmer(amp); for (const g of this.splash) g.shimmer(amp); }
        for (const sb of this.sisters) if (t >= sb.at && t < sb.at + 300) sb.bolt.shimmer(amp);
        if (this.restrike && t < T.RESTRIKE + 220) { this.restrike.top.shimmer(1.2); this.restrike.fork.shimmer(amp); }
      }
      if (!this.ev.skyRe && t >= T.SKY + 110 && t < T.SKY + 400) { this.ev.skyRe = 1; this.sky.rejitterFine(2); if (this.skyLong) this.skyLong.rejitterFine(2); }
      if (!this.ev.restrikeA && t >= T.IMPACT + 66 && t < T.IMPACT + 400) { this.ev.restrikeA = 1; this.trunk.rejitterFine(2); }
      if (t >= T.IMPACT && t < T.IMPACT + 220) {
        for (const b of this.trunk.branches) if (t >= b.nextFlick) { b.flick = b.flick > 0.7 ? 0.35 : 1; b.nextFlick = t + r.range(33, 66); }
      }
      if (t >= T.SKY && t < T.SKY + 230) {
        for (const sb of this.skyBolts) for (const b of sb[0].branches) if (t >= b.nextFlick) { b.flick = b.flick > 0.7 ? 0.4 : 1; b.nextFlick = t + r.range(33, 70); }
      }
    },

    // one climbing spark: from a vambrace rune stud over the wrist and the fist to the handle, in the current
    // pose's art pixels (so it rides the sprite), 130ms
    launchClimb(t) {
      const p = this.pose;
      if (!p || p.mat) return;
      const f = this.hd.f[p.frame];
      if (!f.runes || !f.runes.length || !f.grip) return;
      const r = this.rand, ru = f.runes[r.int(0, f.runes.length - 1)], end = f.headC || f.grip, pts = [];
      const way = [[ru.x, ru.y], [f.wrist ? f.wrist.x : f.grip.x, f.wrist ? f.wrist.y : f.grip.y], [f.grip.x, f.grip.y], [lerp(f.grip.x, end.x, 0.55), lerp(f.grip.y, end.y, 0.55)]];
      for (let i = 1; i < way.length; i++) {
        const a = way[i - 1], b = way[i], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1])));
        for (let j = i === 1 ? 0 : 1; j <= n; j++) pts.push([Math.floor(lerp(a[0], b[0], j / n) + (j % 3 === 1 ? r.sign() * 0.6 : 0)), Math.floor(lerp(a[1], b[1], j / n) + (j % 3 === 2 ? r.sign() * 0.6 : 0))]);
      }
      this.climbs = this.climbs || [];
      this.climbs.push({ frame: p.frame, pts, t0: t, t1: t + 130 });
      if (this.climbs.length > 4) this.climbs.shift();
    },

    /* ---------- the burn: schedule R(bt), the field walk, the satellites, the surge ---------- */
    // R(bt): the main front's reach, in field distance units (css px before the noise warp). A small puncture
    // at the impact, a creep while the link burns, a kick on the restrike, then the surge (monotone, because
    // buildBurnField inverts it).
    // The area schedule (share of the viewport the main front has burned, from the punch to BURN_END): a small
    // puncture, a creep while the link burns, the restrike's kick, then an even sweep that eases in over 160ms and
    // out over 120ms. The sweep's rate is solved so the share reaches exactly 1 at BURN_END (about 1.1e-3 per ms,
    // i.e. at most ~16% of the viewport per 150ms; never a jump, never a switch of speed).
    areaTable() {
      if (this._area) return this._area;
      const t0 = T.PUNCH, t1 = T.BURN_END, step = 2, M = Math.ceil((t1 - t0) / step) + 1;
      const kick = 6e-4, early = [[T.PUNCH, 8e-6], [T.PUNCH_END, 3e-6], [T.RESTRIKE, 3e-6], [T.HOLE_KICK_END, kick]];
      const lin = (pts, t) => { for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return lerp(pts[i - 1][1], pts[i][1], prog(pts[i - 1][0], pts[i][0], t)); return pts[pts.length - 1][1]; };
      const tA = T.HOLE_KICK_END, tB = tA + 160, tC = t1 - 120;
      const shape = (t, rmax) => (t < tA ? lin(early, t) : t < tB ? lerp(kick, rmax, Ease.inOutQuad(prog(tA, tB, t))) : t < tC ? rmax : rmax * (1 - Ease.inQuad(prog(tC, t1, t))));
      const integ = (rmax) => { let acc = 0; for (let t = t0; t < t1; t += 1) acc += shape(t + 0.5, rmax); return acc; };
      const i0 = integ(0), i1 = integ(1), rmax = (1 - i0) / Math.max(1e-6, i1 - i0);
      const a = new Float32Array(M);
      let acc = 0, t = t0;
      for (let i = 1; i < M; i++) { for (let k = 0; k < step; k++, t++) acc += shape(t + 0.5, rmax); a[i] = acc; }
      for (let i = 0; i < M; i++) a[i] = Math.min(1, a[i] / Math.max(1e-6, a[M - 1]));
      this._area = { t0, step, a, rmax };
      return this._area;
    },
    areaAt(bt) {
      const A = this.areaTable(), x = (bt - A.t0) / A.step, i = Math.floor(x);
      if (i < 0) return 0;
      if (i >= A.a.length - 1) return 1;
      return lerp(A.a[i], A.a[i + 1], x - i);
    },
    burnRadius(bt) {
      const q = this.burn && this.burn.quant;
      if (q) {
        if (bt < T.PUNCH) return 0;
        const x = this.areaAt(bt) * 256, i = Math.min(255, Math.floor(x));
        return lerp(q[i], q[i + 1], x - i);
      }
      const Rm = this.Rmax, Rs = Math.max(96, 0.3 * Rm);
      if (bt < T.PUNCH) return 0;
      if (bt < T.PUNCH_END) return 9 * Ease.outCubic(prog(T.PUNCH, T.PUNCH_END, bt));
      if (bt < T.RESTRIKE) return lerp(9, 18, prog(T.PUNCH_END, T.RESTRIKE, bt));
      if (bt < T.HOLE_KICK_END) return lerp(18, 84, Ease.outCubic(prog(T.RESTRIKE, T.HOLE_KICK_END, bt)));
      if (bt < T.SURGE) return lerp(84, Rs, Ease.inQuad(prog(T.HOLE_KICK_END, T.SURGE, bt)));
      return lerp(Rs, Rm, Ease.outCubic(prog(T.SURGE, T.BURN_END, bt)));
    },
    burnSpeed(bt) { return Math.max(0.02, (this.burnRadius(bt + 8) - this.burnRadius(bt)) / 8); },

    updateBurn(t, bt) {
      const B = this.burn;
      this.R = this.mounted ? this.burnRadius(bt) : 0;
      if (!B || !this.mounted || this.committed) return;
      if (!B.ign && (t >= T.PRERENDER || bt >= T.PUNCH)) this.buildBurnField(bt >= T.PUNCH);
      if (bt < T.PUNCH || !B.ign) return;
      const ign = B.ign, ord = B.order, burned = B.burned, cols = B.cols;
      let p = B.ptr;
      while (p < ord.length && ign[ord[p]] <= bt) {
        const i = ord[p++], x = i % cols, y = (i / cols) | 0;
        burned[i] = 1;
        if (x < B.x0) B.x0 = x; if (x > B.x1) B.x1 = x; if (y < B.y0) B.y0 = y; if (y > B.y1) B.y1 = y;
      }
      if (p !== B.ptr) { B.ptr = p; B.dirty = true; B.pathDirty = true; }
      if (this.surgeAt == null && bt >= T.SURGE) this.onSurge(bt);
    },

    // the side strikes: a white-blue spark where each sister bolt lands, a scorch speck that smoulders, then it
    // catches (an ember burst) and its own small front opens there
    updateSisters(t, bt) {
      const r = this.rand;
      for (const sb of this.sisters) {
        if (sb.sparked || t < sb.at || this.ff) continue;
        sb.sparked = 1;
        for (let i = 0; i < 12; i++) {
          const a = r() * TAU, sp = r.range(160, 460);
          const q = this.spark(sb.x, sb.y, Math.cos(a) * sp, Math.sin(a) * sp - 120, r.range(200, 380), r.pick([RGB.white, RGB.cyan, RGB.blue, RGB.cyan]), 1.4, 1400, 2.2, null);
          if (q && i % 2) q.sq = Math.max(1, Math.round(this.u * 0.75));
        }
      }
      for (const s of this.sats || []) {
        if (s.lit || bt < s.start + 120) continue;
        s.lit = true;
        this.burst(s.x, s.y, 10, 50, 180);
      }
    },

    onSurge(bt) {
      this.surgeAt = bt;
      this.logBeat('Surge', T.SURGE);
      const r = this.rand, B = this.burn;
      for (let i = 0; i < 40 && B && B.nFront; i++) {
        const c = this.frontCell(), sp = r.range(150, 400);
        if (!c) break;
        this.ember(c.x, c.y, c.nx * sp + 30, c.ny * sp - 60, r.range(500, 900));
      }
      if (this.opts.sound !== false && !this.ff) { sfx('rumble', 500 * this.scale); sfx('crackle', 250 * this.scale); }
      vibrate(12);
    },
    // a random cell on the burn front (css centre) with its outward normal (the ignition-time gradient)
    frontCell() {
      const B = this.burn;
      if (!B || !B.nFront) return null;
      const i = B.front[(this.rand() * B.nFront) | 0], cols = B.cols, cs = B.cs, ign = B.ign;
      const x = i % cols, y = (i / cols) | 0;
      const gx = (ign[Math.min(i + 1, B.n - 1)] - ign[Math.max(i - 1, 0)]), gy = (ign[Math.min(i + cols, B.n - 1)] - ign[Math.max(i - cols, 0)]);
      const l = Math.hypot(gx, gy) || 1;
      return { x: (x + 0.5) * cs, y: (y + 0.5) * cs, nx: gx / l, ny: gy / l, i };
    },

    /* ---------- spawners ---------- */
    spark(x, y, vx, vy, life, col, w, g, drag, floor) {
      const p = this.pools.sparks.spawn();
      if (!p) return null;
      p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.age = 0; p.life = life; p.col = col; p.w = w; p.sq = 0;
      p.g = g == null ? 1600 : g; p.drag = drag == null ? 1.6 : drag; p.floor = floor == null ? null : floor; p.bounced = false;
      return p;
    },
    ember(x, y, vx, vy, life) {
      const p = this.pools.embers.spawn();
      if (!p) return null;
      const r = this.rand;
      p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.age = 0; p.life = life; p.size = r() < 0.7 ? 2 : 3; p.ph = r() * TAU; p.fq = r.range(0.02, 0.05); p.settle = 0;
      return p;
    },
    ash(x, y, vx, vy, life) {
      const p = this.pools.ash.spawn();
      if (!p) return null;
      const r = this.rand;
      p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.age = 0; p.life = life; p.size = r.range(2, 4.5); p.rot = r() * TAU; p.vr = r.range(-8, 8);
      p.col = r() < 0.7 ? RGB.ash : RGB.ashL; p.settle = 0; p.ph = r() * TAU;
      return p;
    },
    puff(x, y, scale) {
      const s = this.pools.smoke.spawn(), r = this.rand;
      if (!s) return;
      s.x = x; s.y = y; s.vx = r.range(-10, 30); s.vy = -r.range(20, 60); s.size = r.range(14, 24) * (scale || 1); s.age = 0; s.life = r.range(500, 900);
    },
    flame(x, y, size, life, vx, vy) {
      const p = this.pools.flames.spawn();
      if (!p) return null;
      const r = this.rand;
      p.hi = -1; p.x = x; p.y = y; p.size = size; p.age = 0; p.life = life; p.vx = vx; p.vy = vy; p.ph = r() * TAU; p.sw = r.range(6, 16);
      return p;
    },
    burst(x, y, n, s0, s1) {
      const r = this.rand;
      for (let i = 0; i < n; i++) {
        const a = r() * TAU, sp = r.range(s0, s1);
        this.ember(x, y, Math.cos(a) * sp + 20, Math.sin(a) * sp - 40, r.range(400, 800));
      }
    },

    // a glyph's burn age: the glyph clock (it keeps burning through a hold), but never more than 140ms ahead of the
    // burn clock once past the char stage, so a charred letter waits for the hole that swallows it
    glyphAge(g, bt) { return Math.min(this.gt - g.at, Math.max(bt - g.at + 140, 400)); },
    spawnFuse(bt, dts) {
      const gt = this.gt;
      if (!this.fuse || gt < T.PUNCH) return;
      const r = this.rand;
      if (gt <= T.PUNCH + FUSE_MS + 40) {
        const fs = this.fuseState(gt);
        for (const hd of fs.heads) {
          const y = hd.rect.t + hd.rect.h * 0.5;
          if (r() < 0.75) this.spark(hd.x, y, r.range(-140, 140), r.range(-300, -80), r.range(200, 360), r() < 0.5 ? RGB.gold : RGB.orange, 1.2, 900, 1.5, hd.rect.b);
        }
      }
      // glyphs: embers rise off the burning letters, ash drops off the charred ones
      if (this.glyphs && dts) {
        this.spawnAcc.glyph = (this.spawnAcc.glyph || 0) + 22 * dts;
        for (; this.spawnAcc.glyph >= 1; this.spawnAcc.glyph--) {
          const g = this.glyphs[(r() * this.glyphs.length) | 0], a = this.glyphAge(g, bt);
          if (a > 80 && a < 300) this.ember(g.l + r() * g.w, g.t + g.h * r.range(0.55, 0.9), r.range(-20, 30), -r.range(30, 90), r.range(300, 600));
          else if (a >= 300 && a < GLYPH_THROUGH + 120) { const q = this.ash(g.l + r() * g.w, g.t + g.h * 0.7, r.range(-18, 18), r.range(10, 40), r.range(700, 1100)); if (q) q.fall = 1; }
        }
      }
    },
    fuseState(bt) {
      const F = this.fuse, d = Math.max(0, bt - T.PUNCH) * F.speed;
      const ranges = new Map(), heads = [];
      for (const side of [F.right, F.left]) {
        let rem = d;
        for (const seg of side) {
          const L = Math.abs(seg.to - seg.from), cov = Math.min(rem, L), dir = seg.to >= seg.from ? 1 : -1;
          if (cov <= 0) break;
          const x1 = seg.from + dir * cov, lo = Math.min(seg.from, x1), hi = Math.max(seg.from, x1);
          const cur = ranges.get(seg.rect);
          ranges.set(seg.rect, cur ? [Math.min(cur[0], lo), Math.max(cur[1], hi)] : [lo, hi]);
          rem -= cov;
          if (cov < L) { heads.push({ x: x1, rect: seg.rect, dir }); break; }
        }
      }
      return { ranges, heads };
    },
    spawnCardFlames(bt) {
      if (bt < T.PUNCH || bt > T.PUNCH + 360) return;
      const b = this.bb, r = this.rand, per = 2 * (b.w + b.h);
      for (let i = 0; i < 3; i++) {
        let u = r() * per, x, y;
        if (u < b.w) { x = b.l + u; y = b.t; } else if ((u -= b.w) < b.h) { x = b.r; y = b.t + u; } else if ((u -= b.h) < b.w) { x = b.r - u; y = b.b; } else { u -= b.w; x = b.l; y = b.b - u; }
        if (x < -10 || x > this.vw + 10 || y < -10 || y > this.vh + 10) continue;
        this.flame(x, y, r.range(12, 24), r.range(250, 450), r.range(-15, 25), -r.range(40, 100));
      }
    },
    // the burn front feeds the fire: flames ride outward with the front, embers fly off it, ash lifts off the
    // old page just ahead of it (rates scale with the front's length on screen)
    spawnRim(bt, dts) {
      const B = this.burn;
      if (!dts || !B || !B.nFront) return;
      const r = this.rand, acc = this.spawnAcc, per = B.nFront * B.cs;
      const surge = this.surgeAt != null && bt < this.surgeAt + 220 ? 1.5 : 1, v = Math.min(1.2, this.burnSpeed(bt)) * 1000;
      acc.flames += clamp(per * 0.12, 10, 420) * surge * dts;
      acc.embers += clamp(per * 0.022, 3, 70) * dts;
      acc.ash += clamp(per * 0.02, 2, 50) * dts;
      const mob = this.mobile ? 0.75 : 1;
      for (; acc.flames >= 1; acc.flames--) {
        const c = this.frontCell();
        if (!c || c.ny > 0.6 && r() < 0.5) continue; // fire climbs: fronts facing up burn brighter
        this.flame(c.x, c.y, r.range(16, 40) * mob, r.range(180, 380), c.nx * v * 0.8, c.ny * v * 0.8 - 40);
      }
      for (; acc.embers >= 1; acc.embers--) {
        const c = this.frontCell(), sp = r.range(60, 220);
        if (c) this.ember(c.x, c.y, c.nx * sp + 30, c.ny * sp - 60, r.range(500, 1000));
      }
      for (; acc.ash >= 1; acc.ash--) {
        const c = this.frontCell(), o = r.range(8, 26);
        if (c) this.ash(c.x + c.nx * o, c.y + c.ny * o, r.range(20, 70), -r.range(40, 100), r.range(700, 1200));
      }
    },
    spawnSmoulder(dts) {
      const r = this.rand;
      this.spawnAcc.smoulder += 8 * dts;
      for (; this.spawnAcc.smoulder >= 1; this.spawnAcc.smoulder--) {
        this.ember(this.P.x + r.range(-20, 20), this.P.y + r.range(-6, 6), r.range(-10, 30), -r.range(30, 80), r.range(400, 700));
      }
    },
    // as the front nears each cached link, it flares: 3 sparks + a 150ms gold underline
    updateFlares(bt) {
      if (!this.mounted || bt < T.PUNCH_END) return;
      const r = this.rand;
      let n = 0;
      this.flaresTotal = this.flaresTotal || 0;
      for (const L of this.links) {
        if (L.flareAt != null) continue;
        if (n >= 2 || this.flaresTotal >= 30) break;
        if (bt < this.ignAt(L.cx, L.b - 1) - 140) continue;
        L.flareAt = bt; n++; this.flaresTotal++;
        for (let i = 0; i < 3; i++) this.spark(L.cx + r.range(-0.3, 0.3) * L.w, L.b, r.range(-90, 90), r.range(-260, -120), r.range(220, 360), RGB.gold, 1.2, 1100, 1.4, L.b);
      }
    },

    /* ---------- residual crawlers: hop along link underlines, glowing and scorching them ---------- */
    updateCrawlers(t) {
      if (this.ff || t < T.HITSTOP_END || t > T.IMPACT + 700) return;
      const N = this.lowQ ? 3 : this.mobile ? 3 : 6;
      let alive = 0;
      for (const c of this.crawlers) if (t < c.t1) alive++;
      if (this.crawlLaunched < N && alive < 3 && this.every('crawlLaunch', 40, t)) { this.launchCrawler(t); this.crawlLaunched++; }
      for (const c of this.crawlers) {
        for (const h of c.hops) {
          if (!h.L || h.marked || t < (h.along ? h.t0 : h.t1)) continue;
          h.marked = true;
          if (!h.L.scorched && !h.L.block) {
            h.L.scorched = true;
            for (const ln of h.L.lines.slice(0, 2)) this.underlines.push({ l: ln.l, r: Math.min(ln.r, ln.l + 300), y: ln.b - 1, glowAt: t });
          }
        }
      }
    },
    launchCrawler(t) {
      const r = this.rand, hops = [];
      let x = this.P.x + r.range(-6, 6), y = this.isCard ? this.P.y : this.baseline + 2, tt = t;
      const n = r.int(3, 5);
      for (let i = 0; i < n; i++) {
        let best = null, bd = 140;
        for (const L of this.links) {
          if (L.claimed || L.block) continue;
          const ux = clamp(x, L.l, L.r), uy = L.b - 1, d = Math.hypot(ux - x, uy - y);
          if (d < bd && d > 4) { bd = d; best = L; }
        }
        let x1, y1;
        if (best) { best.claimed = true; x1 = clamp(x + r.range(-20, 20), best.l, best.r); y1 = best.b - 1; }
        else { x1 = x + r.sign() * r.range(60, 120); y1 = y + (r() < 0.35 ? this.lineH : 0) + r.range(-3, 3); }
        x1 = clamp(x1, 4, this.vw - 4); y1 = clamp(y1, 4, this.vh - 4);
        const dur = r.range(50, 70);
        hops.push({ x0: x, y0: y, x1, y1, t0: tt, t1: tt + dur, L: best });
        tt += dur; x = x1; y = y1;
        if (best && i < n - 1) {
          const ex = x1 - best.l < best.r - x1 ? Math.min(best.r, best.l + 360) : best.l, dur2 = clamp(Math.abs(ex - x1) / r.range(0.6, 0.9), 40, 110);
          hops.push({ x0: x1, y0: y1, x1: ex, y1, t0: tt, t1: tt + dur2, L: best, along: true });
          tt += dur2; x = ex; i++;
        }
      }
      this.crawlers.push({ hops, t0: t, t1: tt });
    },

    /* ---------- trails: flight sparks, lift smoke ---------- */
    spawnTrail(t, dts) {
      const r = this.rand, fl = this.fly;
      if (fl && this.every('trail', 40, t)) {
        const p = this.pools.trail.spawn();
        if (p) {
          p.x = fl.x + r.range(-8, 8); p.y = fl.y - this.headHc * 0.6 + r.range(-8, 8);
          p.vx = -this.flyDir.x * r.range(40, 120) + r.range(-30, 30); p.vy = -this.flyDir.y * r.range(40, 120) + r.range(-60, 0);
          p.g = 600; p.age = 0; p.life = r.range(260, 420); p.col = r.pick([RGB.blue, RGB.cyan, RGB.gold]); p.size = Math.max(1.5, Math.round(this.u * 0.75));
        }
      }
      if (t >= T.LIFT && t < T.LIFT + 180 && dts) {
        this.spawnAcc.smoke += 26 * dts;
        const h = this.headNow();
        for (; this.spawnAcc.smoke >= 1; this.spawnAcc.smoke--) if (h) this.puff(h.x + r.range(-12, 12), h.y + r.range(-6, 6), 0.6);
      }
    },

    stepParticles(dts, t) {
      const pl = this.pools, r = this.rand, dms = dts * 1000;
      if (!dts) return; // hit-stop: everything hangs, ages too
      pl.sparks.step((p) => {
        p.age += dms;
        if (p.age >= p.life) return false;
        const d = Math.exp(-p.drag * dts);
        p.vx *= d; p.vy *= d; p.vy += p.g * dts;
        p.x += p.vx * dts; p.y += p.vy * dts;
        if (p.floor != null && !p.bounced && p.vy > 0 && p.y > p.floor) { p.y = p.floor; p.vy *= -0.35; p.vx *= 0.7; p.bounced = true; }
        return true;
      });
      pl.trail.step((p) => {
        p.age += dms;
        if (p.age >= p.life) return false;
        p.vx *= Math.exp(-1.2 * dts); p.vy = p.vy * Math.exp(-1.2 * dts) + p.g * dts;
        p.x += p.vx * dts; p.y += p.vy * dts;
        return true;
      });
      pl.debris.step((p) => {
        p.age += dms;
        if (p.age >= p.life) return false;
        p.vx *= Math.exp(-0.6 * dts); p.vy += 2200 * dts;
        p.x += p.vx * dts; p.y += p.vy * dts; p.rot += p.vr * dts;
        return p.y < this.vh + 40;
      });
      pl.flames.step((p) => {
        p.age += dms;
        if (p.age >= p.life) {
          return false;
        }
        p.vy -= 160 * dts; p.vx *= Math.exp(-1.5 * dts); p.vy *= Math.exp(-0.8 * dts);
        p.x += (p.vx + Math.sin(p.ph + p.age * 0.012) * p.sw) * dts; p.y += p.vy * dts;
        return true;
      });
      pl.smoke.step((p) => {
        p.age += dms;
        if (p.age >= p.life) return false;
        p.vx += 12 * dts; p.vy -= 10 * dts; p.x += p.vx * dts; p.y += p.vy * dts; p.size += 22 * dts;
        return true;
      });
      pl.embers.step((p) => {
        p.age += dms;
        if (p.age >= p.life) return false;
        if (p.settle) { // drift down over the new page: gravity, drag, sway
          p.vx *= Math.exp(-1.6 * dts); p.vy = p.vy * Math.exp(-1.6 * dts) + 260 * dts;
          p.x += (p.vx + Math.sin(p.ph + p.age * 0.006) * 14) * dts; p.y += p.vy * dts;
          return true;
        }
        const d = Math.exp(-1.2 * dts);
        p.vx = p.vx * d + 40 * dts; p.vy = p.vy * d - 70 * dts;
        p.x += p.vx * dts; p.y += p.vy * dts;
        return true;
      });
      pl.ash.step((p) => {
        p.age += dms;
        if (p.age >= p.life) return false;
        const d = Math.exp(-0.8 * dts);
        if (p.settle || p.fall) { p.vx = p.vx * d; p.vy = p.vy * d + (p.fall ? 90 : 160) * dts; p.x += (p.vx + Math.sin(p.ph + p.age * 0.005) * 10) * dts; }
        else { p.vx = p.vx * d + 25 * dts; p.vy = p.vy * d - 15 * dts; p.x += p.vx * dts; }
        p.y += p.vy * dts; p.rot += p.vr * dts;
        return true;
      });
    },

    /* ---------- camera: one short impact kick on release (<= 6px desktop, <= 4px phone, no roll, 200ms).
     * Nothing else ever moves the page. ---------- */
    computeShake(t) {
      const out = this._shake || (this._shake = { x: 0, y: 0 });
      out.x = 0; out.y = 0;
      if (this.committed || this.ff) return out;
      if (this.skyAt != null && t >= this.skyAt && t < this.skyAt + 110) {
        const u = prog(this.skyAt, this.skyAt + 110, t), a = (this.mobile ? 2 : 3) * (1 - u) * (1 - u);
        out.y = u < 0.18 ? a : a * this.noise(t * 0.03 + 11.7);
        out.x = 0.4 * a * this.noise(t * 0.03);
        return out;
      }
      if (t < T.HITSTOP_END || t >= T.HITSTOP_END + 200) return out;
      const u = prog(T.HITSTOP_END, T.HITSTOP_END + 200, t), a = (this.mobile ? 4 : 6) * (1 - u) * (1 - u), ts = (t / 1000) * 30;
      out.y = u < 0.12 ? a : a * this.noise(ts + 57.3);
      out.x = 0.5 * a * this.noise(ts);
      return out;
    },

    checkEnd(t, bt) {
      if (!this.committed && this.mounted && (bt >= T.COMMIT || (this.ff && bt >= T.BURN_END + 10))) {
        this.doCommit();
        this.onCommitParticles(bt);
      }
      if (!this.committed) return;
      if (this.ff) { if (this.now() - this.t0 - this.commitReal > 70) this.finish(); return; }
      if (bt >= T.CANVAS_OFF && !this.ev.canvasOff) {
        this.ev.canvasOff = 1;
        this.removeCanvases();
        if (this.styleEl && this.styleEl.parentNode) this.styleEl.parentNode.removeChild(this.styleEl);
      }
      if (bt >= T.DONE) this.finish();
    },

    onCommitParticles(bt) {
      this.pools.flames.step((p) => { p.life = Math.min(p.life, p.age + 120); return true; });
      this.pools.sparks.step((p) => { p.life = Math.min(p.life, p.age + 80); return true; });
      this.pools.trail.clear();
      this.pools.smoke.clear();
      this.pools.debris.clear();
      this.pools.ash.clear();
      // the embers still in the air fall away and are out by EMBERS_OUT (at most 16, none spawned over the new
      // page: its title and images stay clean)
      const remain = Math.max(60, T.EMBERS_OUT - bt), r = this.rand;
      let kept = 0;
      const keep = (p) => {
        if (kept >= 16 || p.y < -10 || p.y > this.vh + 10) return false;
        kept++;
        p.settle = 1;
        p.vx *= 0.3; p.vy = Math.max(40, p.vy * 0.2);
        p.life = p.age + r.range(remain * 0.4, remain * 0.95);
        return true;
      };
      this.pools.embers.step(keep);
    },
  });

  /* ====================================================================
   * 16. STRIKE: RENDERING. FX canvas (soft) under PX canvas (crisp). The page itself is never tinted: both
   *     canvases are transparent except where an effect is drawn.
   *     FX: page decals (the burning glyphs, scorch, cracks, flares, the cast's and the flyer's shadows) punched
   *         out wherever the page has burned through, then the burn band (cell grid: dithered ember edge, thin
   *         noisy char band, soft scorch), bolt glows (source-over indigo), afterimages, the three white flashes,
   *         soft particles and pixel smoke.
   *     PX: bolt bodies (ink edge, azure, sky, white core), arcs, pixel speed lines and sparks FIRST, then the
   *         sprites over them (so no smooth stroke crosses the hand: a bolt that reaches the hammer ends at its
   *         outline), then pixel FX on the sprite's art grid (rune glyphs, outline walkers, crackle, twinkles,
   *         the catch rays and the sky starburst).
   * ==================================================================== */
  Object.assign(Strike.prototype, {
    render(t, bt) {
      if (this.ev.canvasOff) return;
      this.renderFX(t, bt);
      this.renderPX(t, bt);
    },

    /* =============================== FX =============================== */
    renderFX(t, bt) {
      const ctx = this.fx, d = this.fxDpr, sh = this.shake;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, this.fxCv.width, this.fxCv.height);
      ctx.imageSmoothingEnabled = true;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setTransform(d, 0, 0, d, sh.x * d, sh.y * d);
      if (!this.committed) {
        this.drawPageDecals(ctx, t, bt);
        this.drawBurn(ctx, t, bt);
        ctx.setTransform(d, 0, 0, d, sh.x * d, sh.y * d);
      }
      this.drawBoltGlows(ctx, t);
      this.drawAfterimages(ctx, t);
      this.drawFlashes(ctx, t);
      if (this.f1 && t >= T.IMPACT && t < T.HIT2) this.drawLinkSilhouette(ctx);
      this.drawSoftParticles(ctx, t, bt);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    },

    // The burn on the FX canvas, at the field's cell resolution (one art pixel per cell), never shaken (the next
    // page's layer does not move): the decals under burned cells are punched out (destination-out with the cell
    // mask), then the band goes on top. Band cells (recomputed when the front moves, else every 2 frames for the
    // flicker): inside the front a dithered ember edge (pale gold, orange, maroon); outside it a 1-2 cell char
    // band broken up by noise, then 5 cells of soft brown scorch fading out. Front cells are kept for the fire.
    drawBurn(ctx, t, bt) {
      const B = this.burn;
      if (!B || !B.ign || B.x1 < 0 || !this.mounted) return;
      const cols = B.cols, rows = B.rows, cs = B.cs, d = this.fxDpr;
      if (!this.bandCv || this.bandCv.width !== cols || this.bandCv.height !== rows) {
        this.bandCv = makeCanvas(cols, rows); this.bandCtx = this.bandCv.getContext('2d');
        this.maskCv = makeCanvas(cols, rows); this.maskCtx = this.maskCv.getContext('2d');
        this.bandImg = this.bandCtx.createImageData(cols, rows); this.maskImg = this.maskCtx.createImageData(cols, rows);
        this.band32 = new Uint32Array(this.bandImg.data.buffer); this.mask32 = new Uint32Array(this.maskImg.data.buffer);
      }
      const flick = Math.floor(bt / 50);
      if (B.dirty || flick !== B.bandAt) { this.computeBand(bt, flick); B.dirty = false; B.bandAt = flick; }
      ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(this.maskCv, 0, 0, cols * cs, rows * cs);
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(this.bandCv, 0, 0, cols * cs, rows * cs);
      ctx.imageSmoothingEnabled = true;
      this.drawRimArcs(ctx, bt);
      this.drawSatSpecks(ctx, bt);
    },
    computeBand(bt, flick) {
      const B = this.burn, cols = B.cols, rows = B.rows, b = B.burned, dO = B.dOut, dI = B.dIn, N2 = this.noise2;
      const band = this.band32, mask = this.mask32;
      const x0 = Math.max(0, B.x0 - 9), x1 = Math.min(cols - 1, B.x1 + 9), y0 = Math.max(0, B.y0 - 9), y1 = Math.min(rows - 1, B.y1 + 9);
      band.fill(0); mask.fill(0);
      // chamfer distances (8-neighbour, capped): dOut for the old page's cells, dIn for the burned ones
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = y * cols + x; dO[i] = b[i] ? 0 : 9; dI[i] = b[i] ? 5 : 0; }
      const pass = (D, fwd) => {
        const ys = fwd ? y0 : y1, ye = fwd ? y1 + 1 : y0 - 1, st = fwd ? 1 : -1;
        for (let y = ys; y !== ye; y += st) {
          const xs = fwd ? x0 : x1, xe = fwd ? x1 + 1 : x0 - 1;
          for (let x = xs; x !== xe; x += st) {
            const i = y * cols + x;
            let v = D[i];
            if (!v) continue;
            const px = x - st, py = y - st;
            if (px >= x0 && px <= x1) { const w = D[i - st] + 1; if (w < v) v = w; }
            if (py >= y0 && py <= y1) {
              const row = i - st * cols;
              let w = D[row] + 1; if (w < v) v = w;
              if (x - 1 >= x0) { w = D[row - 1] + 1; if (w < v) v = w; }
              if (x + 1 <= x1) { w = D[row + 1] + 1; if (w < v) v = w; }
            }
            D[i] = v;
          }
        }
      };
      pass(dO, true); pass(dO, false); pass(dI, true); pass(dI, false);
      const C = (r, g, bb, a) => ((a << 24) | (bb << 16) | (g << 8) | r) >>> 0;
      // as the sweep runs, the band lightens and thins a little, blended over 300ms (never switched in one frame,
      // so no dark ring vanishes at once)
      const soft = prog(T.SURGE - 150, T.SURGE + 150, bt), m = 1 - 0.38 * soft, late = 1 - 0.4 * prog(T.SURGE, T.SURGE + 300, bt);
      const GOLD = C(248, 216, 120, 255), ORANGE = C(228, 92, 16, 255), RED = C(168, 16, 0, 230), MASK = C(0, 0, 0, 255);
      const CHAR = C(27, 18, 12, Math.round(250 * m)), UMBER = C(80, 48, 0, Math.round(235 * m)), BURNT = C(110, 58, 22, Math.round(150 * m));
      const CHAR2 = C(80, 48, 0, Math.round(150 * m)), BURNT2 = C(110, 58, 22, Math.round(92 * m));
      let nf = 0;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const i = y * cols + x, bz = bayer(x, y);
        if (b[i]) {
          mask[i] = MASK;
          const di = dI[i];
          if (di > 3) continue;
          if (di === 1 && nf < B.front.length) B.front[nf++] = i;
          const h = hash01(x, y, flick);
          if (di === 1) band[i] = bz < 0.72 * late ? (h < 0.5 ? GOLD : ORANGE) : 0;
          else if (di === 2) band[i] = bz < 0.42 * late ? (h < 0.3 ? GOLD : ORANGE) : 0;
          else band[i] = bz < 0.16 * late ? RED : 0;
          continue;
        }
        const o = dO[i];
        if (o > 7) continue;
        const nz = N2(x * 0.37 + 3.1, y * 0.37 - 7.7);
        if (o === 1) band[i] = nz < 0.12 - 0.3 * soft ? CHAR : nz < 0.42 ? UMBER : BURNT;
        else if (o === 2) band[i] = nz < -0.4 - 0.3 * soft ? CHAR : nz < -0.05 ? CHAR2 : BURNT2;
        else {
          const a = Math.round(255 * 0.3 * m * (1 - (o - 3) / 5) * (0.7 + 0.3 * nz));
          band[i] = a > 0 ? C(110, 58, 22, a) : 0;
        }
      }
      B.nFront = nf;
      this.bandCtx.putImageData(this.bandImg, 0, 0);
      this.maskCtx.putImageData(this.maskImg, 0, 0);
    },
    // until just after the surge, short electric arcs jump between nearby cells of the front
    drawRimArcs(ctx, bt) {
      const B = this.burn;
      if (bt >= T.SURGE + 220 || !B.nFront || this.ff) return;
      if (!this.rimArcs || this.every('rimArc', 50, bt)) {
        this.rimArcs = [];
        for (let k = 0; k < 3; k++) {
          const a = this.frontCell();
          if (!a) break;
          let best = null;
          for (let j = 0; j < 12; j++) { const c = this.frontCell(), dd = Math.hypot(c.x - a.x, c.y - a.y); if (dd > 10 && dd < 46 && (!best || dd > best.d)) best = { c, d: dd }; }
          if (best) this.rimArcs.push(new Bolt(a.x + a.nx * 3, a.y + a.ny * 3, best.c.x + best.c.nx * 3, best.c.y + best.c.ny * 3, 3, this.rand, 0.5));
        }
      }
      const fa = 0.85 * (1 - prog(T.SURGE - 80, T.SURGE + 220, bt));
      for (const bo of this.rimArcs) this.strokeBolt(ctx, bo, fa, BOLT.micro, { layers: [1, 2, 4] });
    },
    // a satellite before it opens: a scorch speck that smoulders (pixel cells, an ember at its heart)
    drawSatSpecks(ctx, bt) {
      const B = this.burn, cs = B.cs, t = this.t;
      for (const s of this.sats || []) {
        if (t < s.strikeAt + 30 || bt > s.start + 220) continue;
        const g = clamp((t - s.strikeAt - 30) / 160, 0, 1), rad = 1 + Math.round(g), cx = Math.floor(s.x / cs), cy = Math.floor(s.y / cs), fl = Math.floor(bt / 50);
        for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
          const dd = Math.abs(dx) + Math.abs(dy);
          if (dd > rad) continue;
          const h = hash01(cx + dx, cy + dy, fl);
          ctx.fillStyle = dd === 0 ? (fl % 2 ? '#fce0a8' : '#f8b800') : dd < rad ? (h < 0.5 ? '#f8b800' : '#e45c10') : h < 0.6 ? '#e45c10' : '#881400';
          ctx.fillRect((cx + dx) * cs, (cy + dy) * cs, cs, cs);
        }
        // the wisp: two or three grey cells drifting up off it
        const age = t - s.strikeAt - 30;
        for (let j = 0; j < 3; j++) {
          const yy = cy - 2 - j - Math.floor(age / 90), xx = cx + Math.round(Math.sin((age + j * 70) / 120));
          if (hash01(xx, yy, j) < 0.75 - j * 0.2) { ctx.fillStyle = j ? 'rgba(188,188,188,0.6)' : 'rgba(124,124,124,0.65)'; ctx.fillRect(xx * cs, yy * cs, cs, cs); }
        }
      }
    },

    // a hand / hammer frame on the FX canvas at css coords (mirrored for side -1)
    drawSpriteCss(ctx, img, x, y, u) {
      const w = img.width * u, h = img.height * u;
      if (this.side > 0) ctx.drawImage(img, x, y, w, h);
      else { ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, w, h); ctx.restore(); }
    },

    /* ---------- page decals (page-attached; they burn away with the old page) ---------- */
    drawPageDecals(ctx, t, bt) {
      const uc = Math.max(2, Math.round(this.u / 2));
      for (const ul of this.underlines) {
        const gy = Math.floor(ul.y / uc);
        for (let gx = Math.floor(ul.l / uc); gx * uc < ul.r; gx++) {
          const b = bayer(gx, gy);
          if (b > 0.72) continue;
          ctx.fillStyle = b < 0.3 ? 'rgba(27,18,12,0.85)' : 'rgba(80,48,0,0.7)';
          ctx.fillRect(gx * uc, gy * uc, uc, uc);
        }
      }
      if (this.ev.eImpact) {
        this.drawCrater(ctx, t);
        if (this.isCard) this.drawFissures(ctx, bt); else this.drawGlyphs(ctx, bt);
      }
      this.drawCastShadow(ctx, t);
      this.drawFlyShadow(ctx, t);
      // a crawler that ran along a neighbour's underline leaves it lit for 150ms (azure cells under the glyphs)
      for (const ul of this.underlines) {
        const a = 1 - (t - ul.glowAt) / 150;
        if (a <= 0) continue;
        ctx.fillStyle = rgba(RGB.blue, a);
        const gy = Math.floor((ul.y - uc) / uc);
        for (let gx = Math.floor(ul.l / uc); gx * uc < ul.r; gx++) if ((gx + gy) % 2 === 0 || a > 0.6) ctx.fillRect(gx * uc, gy * uc, uc, uc);
      }
      this.drawLinkFlares(ctx, bt);
      ctx.globalAlpha = 1;
    },
    drawCrater(ctx, t) {
      const cr = this.crater;
      if (!cr) return;
      const P = this.P, c = cr.c, grow = Math.min(1, 0.4 + (t - T.IMPACT) / 80);
      // light enough that the burning letters drawn over it stay readable
      const cols = ['rgba(80,48,0,0.6)', 'rgba(110,58,22,0.42)', 'rgba(110,58,22,0.28)'];
      for (let k = 0; k < 3; k++) {
        ctx.fillStyle = cols[k];
        for (const q of cr.cells) if (q[2] === k && (grow >= 1 || hash01(q[0], q[1], 4) < grow)) ctx.fillRect(q[0], q[1], c, c);
      }
      const cool = 1 - prog(T.IMPACT, T.IMPACT + 700, t);
      for (const ck of cr.cracks) {
        let h = 0.78 * cool;
        if (this.R > 0) { const mid = (ck.r0 + ck.r1) / 2, half = (ck.r1 - ck.r0) / 2 + 30; h += 0.6 * clamp(1 - Math.abs(this.R + 34 - mid) / half, 0, 1); }
        if (this.waiting) h += 0.25 * (0.5 + 0.5 * Math.sin((t / 1000) * TAU * 1.2 + ck.ph));
        h = clamp(h, 0, 1);
        ctx.fillStyle = 'rgba(16,10,6,0.9)';
        for (const q of ck.cells) ctx.fillRect(q[0], q[1], c, c);
        if (h < 0.06) continue;
        ctx.fillStyle = rgba(heatRGB(0.35 + 0.55 * h), Math.min(1, 0.25 + 0.75 * h));
        const ph = Math.floor(t / 60);
        for (let i = 0; i < ck.cells.length; i++) if ((i + ph) % 3 !== 0) ctx.fillRect(ck.cells[i][0], ck.cells[i][1], c, c);
      }
      void P;
    },
    // The link burns glyph by glyph behind the fuse (the DOM text went clear at the impact): each letter is
    // drawn where it was, in its own font, and ages from the moment the fuse reaches it: link colour, white-hot
    // gold with an orange rim, burning orange flickering toward rust, then char eaten ragged by noise. Pixel
    // embers sit on the baseline under the burning letters. The burn field opens the paper under each letter
    // GLYPH_THROUGH after the fuse (the page decals are punched there), so the letters fall into the reveal.
    drawGlyphs(ctx, bt) {
      const G = this.glyphs;
      if (!G) return;
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
      ctx.lineJoin = 'round';
      let font = '';
      for (const g of G) {
        const a = this.glyphAge(g, bt);
        if (a > GLYPH_THROUGH + 160) continue;
        if (g.font !== font) {
          font = g.font; ctx.font = font;
          const m = ctx.measureText('Hg');
          this.glyphAsc = m.fontBoundingBoxAscent || null;
        }
        if (g.base == null) g.base = this.glyphAsc ? g.t + this.glyphAsc : g.t + g.h * 0.8;
        const x = g.l, y = g.base, h = hash01(g.seed, Math.floor(bt / 60), 5);
        if (a < 0) {
          ctx.fillStyle = g.color;
          ctx.fillText(g.ch, x, y);
          continue;
        }
        if (a < 90) {
          ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(228,92,16,0.95)'; ctx.strokeText(g.ch, x, y);
          ctx.fillStyle = h < 0.5 ? '#f8d878' : '#fcfcfc'; ctx.fillText(g.ch, x, y);
        } else if (a < 260) {
          const u = (a - 90) / 170;
          ctx.lineWidth = 1.3; ctx.strokeStyle = rgba(RGB.maroon, 0.8 * (1 - 0.5 * u)); ctx.strokeText(g.ch, x, y);
          ctx.fillStyle = h < 0.25 ? '#f8b800' : rgba(heatRGB(0.6 - 0.25 * u), 1); ctx.fillText(g.ch, x, y);
        } else {
          const u = clamp((a - 260) / 200, 0, 1);
          ctx.fillStyle = rgba(heatRGB(0.32 - 0.32 * u), 0.96); ctx.fillText(g.ch, x, y);
          // the char crumbles: noise eats pixels out of the letter
          if (u > 0.05) {
            ctx.globalCompositeOperation = 'destination-out';
            const step = 2, lim = 0.12 + 0.4 * u;
            for (let yy = g.t + g.h * 0.15; yy < g.t + g.h * 0.95; yy += step) {
              for (let xx = g.l; xx < g.l + g.w; xx += step) if (hash01(Math.round(xx), Math.round(yy), 9) < lim) ctx.fillRect(xx, yy, step, step);
            }
            ctx.globalCompositeOperation = 'source-over';
          }
        }
        // pixel embers on the baseline under the burning letters
        if (a > 60 && a < 520) {
          const ex = Math.round(g.l + hash01(g.seed, 3, 1) * g.w), ey = Math.round(y + 1);
          ctx.fillStyle = h < 0.5 ? '#f8b800' : '#e45c10';
          ctx.fillRect(ex, ey, 2, 2);
        }
      }
      // the fuse head: a hot point riding along each line box
      if (this.fuse && this.gt >= T.PUNCH && this.gt < T.PUNCH + FUSE_MS + 40) {
        const fs = this.fuseState(this.gt);
        for (const hd of fs.heads) {
          const S = hd.rect.h * 1.1 + 6;
          ctx.globalAlpha = 0.9;
          const c = Math.max(2, Math.round(this.u / 2)), fx = Math.round(hd.x / c) * c, fy = Math.round(hd.rect.cy / c) * c;
          void S;
          ctx.fillStyle = '#e45c10'; ctx.fillRect(fx - 2 * c, fy - c, 4 * c, 2 * c); ctx.fillRect(fx - c, fy - 2 * c, 2 * c, 4 * c);
          ctx.fillStyle = (Math.floor(bt / 40) % 2) ? '#fce0a8' : '#f8b800'; ctx.fillRect(fx - c, fy - c, 2 * c, 2 * c);
          ctx.globalAlpha = 1;
        }
      }
    },
    drawFissures(ctx, bt) {
      const b = this.bb;
      ctx.save();
      ctx.beginPath(); ctx.rect(b.l, b.t, b.w, b.h); ctx.clip();
      const ca = 0.55 * prog(T.PUNCH, T.PUNCH + 310, bt);
      if (ca > 0) { ctx.fillStyle = rgba(RGB.char, ca); ctx.fillRect(b.l, b.t, b.w, b.h); }
      const h = Math.min(prog(T.IMPACT, T.IMPACT + 60, bt), 1 - 0.7 * prog(T.IMPACT + 200, T.IMPACT + 800, bt));
      for (const f of this.fissures) {
        ctx.strokeStyle = rgba(RGB.orange, 0.5 * h); ctx.lineWidth = 4; ctx.stroke(f.path);
        ctx.strokeStyle = rgba(heatRGB(0.45 + 0.5 * h), 0.9 * h); ctx.lineWidth = 1.6; ctx.stroke(f.path);
      }
      ctx.restore();
    },
    // as the burn front nears a neighbour link, its underline flares gold for 150ms (crisp, no halo)
    drawLinkFlares(ctx, bt) {
      const uc = Math.max(2, Math.round(this.u / 2));
      for (const L of this.links) {
        if (L.flareAt == null || L.block) continue;
        const u = (bt - L.flareAt) / 150;
        if (u < 0 || u >= 1) continue;
        for (const ln of L.lines.slice(0, 2)) {
          const gy = Math.floor((ln.b - uc) / uc);
          for (let gx = Math.floor(ln.l / uc); gx * uc < Math.min(ln.r, ln.l + 320); gx++) {
            ctx.fillStyle = (gx + Math.floor(bt / 40)) % 3 ? rgba(RGB.orange, 0.85 * (1 - u)) : rgba(RGB.gold, 1 - u);
            ctx.fillRect(gx * uc, gy * uc, uc, uc);
          }
        }
      }
    },
    // hard cast shadows of arm and hammer, thrown away from the trunk (impact to the end of the punch)
    drawCastShadow(ctx, t) {
      if (t < T.IMPACT || t >= T.PUNCH_END || this.ff || !this.pose) return;
      const p = this.pose, dir = unit(this.P.x - this.O.x, this.P.y - this.O.y);
      if (t >= T.IMPACT + 140 + 0.6 * (T.PUNCH_END - T.IMPACT - 140)) return;
      const o = 3 * this.u;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      this.drawSpriteCss(ctx, this.hd.castD[p.frame], p.TL.x / this.pxDpr + Math.round(dir.x * 3) * this.u, p.TL.y / this.pxDpr + Math.round(dir.y * 3) * this.u, this.u);
      ctx.restore();
      ctx.imageSmoothingEnabled = true;
      void o;
    },
    // the flying hammer's ink shadow on the link's line: darkest as the hammer passes low over the link, so it
    // visibly sweeps across the link text
    drawFlyShadow(ctx, t) {
      const fl = this.fly;
      if (!fl) return;
      const lb = this.isCard ? this.bb : this.hit, near = 1 - clamp((Math.abs(fl.y - lb.cy) - 40) / 220, 0, 1);
      const w = 0.75 * this.headWc, dens = near * prog(T.FLY, T.FLY + 80, t);
      if (dens < 0.05) return;
      const c = Math.max(2, Math.round(this.u)), gy0 = Math.floor((lb.cy - c) / c);
      ctx.fillStyle = 'rgba(6,10,20,0.6)';
      for (let gy = gy0; gy < gy0 + 2; gy++) for (let gx = Math.floor((fl.x - w / 2) / c); gx * c < fl.x + w / 2; gx++) {
        const edge = Math.abs((gx + 0.5) * c - fl.x) / (w / 2);
        if (bayer(gx, gy) < dens * (0.75 - 0.4 * edge * edge)) ctx.fillRect(gx * c, gy * c, c, c);
      }
    },

    /* ---------- bolt drawing helpers (all source-over: built for a light page) ---------- */
    stampLine(ctx, img, b, w, sp, upto) {
      const px = b.px, py = b.py, sx = b.sx, sy = b.sy, n = upto == null ? b.n : Math.max(1, Math.min(b.n, upto | 0));
      let acc = sp;
      for (let i = 1; i <= n; i++) {
        const x0 = px[i - 1] + sx[i - 1], y0 = py[i - 1] + sy[i - 1], x1 = px[i] + sx[i], y1 = py[i] + sy[i];
        const ddx = x1 - x0, ddy = y1 - y0, L = Math.sqrt(ddx * ddx + ddy * ddy);
        let tt = 0;
        while (acc + (L - tt) >= sp) {
          tt += sp - acc;
          const f = L ? tt / L : 0;
          ctx.drawImage(img, x0 + (x1 - x0) * f - w / 2, y0 + (y1 - y0) * f - w / 2, w, w);
          acc = 0;
        }
        acc += L - tt;
      }
    },
    // the glow layer: a soft saturated indigo brush stamped along the channel, source-over (never additive,
    // never shadowBlur), so the bolt carries a coloured halo on white
    stampBolt(ctx, bolt, st, a, upto) {
      if (a <= 0.01) return;
      const w = st[0] * (this.mobile ? 0.75 : 1);
      if (!w) return;
      const sp = Math.max(3, w * 0.3), per = Math.min(1, BOLT_A[0] * a * (sp / w) * 2.2), img = brush(BOLT_COL[0]);
      ctx.globalAlpha = per;
      this.stampLine(ctx, img, bolt, w, sp, upto);
      for (const br of bolt.branches) {
        if (upto != null && br.at > upto) continue;
        ctx.globalAlpha = per * (br.flick == null ? 1 : br.flick) * 0.85;
        this.stampLine(ctx, img, br.bolt, w * 0.6, sp * 0.6);
        for (const sb of br.bolt.branches) this.stampLine(ctx, img, sb.bolt, w * 0.4, sp * 0.4);
      }
      ctx.globalAlpha = 1;
    },
    // the bolt body as strokes: dark ink edge, azure, sky, white core (layers 1-4 of the style)
    strokeBolt(ctx, bolt, a, st, o) {
      if (a <= 0.01) return;
      o = o || {};
      const Pp = bolt.paths(o.upto), mw = this.mobile ? 0.75 : 1, layers = o.layers || [1, 2, 3, 4];
      for (const li of layers) {
        const w = st[li] * mw;
        if (!w) continue;
        const al = Math.min(1, BOLT_A[li] * a), col = BOLT_COL[li];
        ctx.strokeStyle = rgba(col, al);
        ctx.lineWidth = w;
        ctx.stroke(Pp.main);
        if (o.noBranches) continue;
        for (const br of Pp.br) {
          const fa = br.b.flick == null ? 1 : br.b.flick;
          ctx.strokeStyle = rgba(col, al * fa);
          ctx.lineWidth = Math.max(0.8, w * 0.55);
          ctx.stroke(br.p);
          if (br.subs.length) { ctx.lineWidth = Math.max(0.6, w * 0.35); for (const sb of br.subs) ctx.stroke(sb.p); }
        }
      }
    },

    // a small arc as pixel art: its polyline rasterised into cells of size c (azure, every third cell sky), so the
    // short crackles (crawlers, ground arcs, the link's lock-on) are 1-cell zigzags, not smooth strokes
    pixBolt(ctx, b, c, a, upto) {
      if (a <= 0.02) return;
      const n = upto == null ? b.n : Math.max(1, Math.min(b.n, upto | 0)), pts = [];
      for (let i = 0; i <= n; i++) pts.push([b.px[i] + b.sx[i], b.py[i] + b.sy[i]]);
      const cells = rasterCells(pts, c);
      ctx.globalAlpha = Math.min(1, a);
      for (let i = 0; i < cells.length; i++) { ctx.fillStyle = i % 3 === 1 ? '#3cbcfc' : '#0078f8'; ctx.fillRect(cells[i][0], cells[i][1], c, c); }
      ctx.globalAlpha = 1;
    },

    /* ---------- bolt intensity schedules (cores flicker; halos only ever decay) ---------- */
    // the hero bolt: a long, re-striking core (local flicker only; the full-screen flash is FS alone)
    skyCore(t) {
      if (this.skyAt == null || t < this.skyAt) return 0;
      const d = t - this.skyAt;
      return d < 25 ? 1 : d < 55 ? 0.6 : d < 110 ? 1 : d < 150 ? 0.55 : d < 190 ? 0.9 : d < 270 ? 0.9 * (1 - (d - 190) / 80) : 0;
    },
    // halos follow the cores and are gone within ~150ms of them, so no soft lilac stain is left on the page
    skyHalo(t) { if (this.skyAt == null || t < this.skyAt) return 0; const d = t - this.skyAt; return d < 200 ? 1 - 0.4 * d / 200 : 0.6 * Math.exp(-(d - 200) / 45); },
    // the sky leader steps down its channel from LEADER_SKY, stalling short of the head until the stroke
    skyLeaderUpto(t) {
      const steps = Math.floor((t - T.LEADER_SKY) / 45) + 1, total = Math.ceil((T.SKY - T.LEADER_SKY) / 45);
      return Math.max(1, Math.min(this.skyStop, Math.round((steps / total) * this.skyStop)));
    },
    trunkCore(t) {
      if (t < T.IMPACT) return 0;
      const d = t - T.IMPACT;
      if (d < 33) return 1;
      if (d < 66) return 0.55;
      if (d < 120) return 1;
      if (d < 200) return 0.8 + 0.08 * this.noise(t * 0.05);
      if (d < 380) return 0.8 * (1 - (d - 200) / 180);
      return 0;
    },
    trunkHalo(t) { if (t < T.IMPACT) return 0; const d = t - T.IMPACT; return d < 33 ? 1 : d < 200 ? 1 - 0.4 * (d - 33) / 167 : 0.6 * Math.exp(-(d - 200) / 50); },
    restrikeCore(t) {
      const R = this.restrike;
      if (!R || t < R.at) return 0;
      const d = t - R.at;
      return d < 17 ? 0.9 : d < 40 ? lerp(0.9, 0.6, (d - 17) / 23) : d < 210 ? 0.6 * (1 - (d - 40) / 170) : 0;
    },
    restrikeHalo(t) { const R = this.restrike; return !R || t < R.at ? 0 : Math.exp(-(t - R.at) / 80); },
    sisterCore(t, at) {
      const d = t - at;
      return d < 0 ? 0 : d < 33 ? 1 : d < 50 ? 0.5 : d < 90 ? 0.9 : d < 250 ? 0.9 * (1 - (d - 90) / 160) : 0;
    },
    sisterHalo(t, at) { return t < at ? 0 : Math.exp(-(t - at) / 85); },
    leaderSteps(t, l) { const steps = Math.floor((t - T.LEADERS) / 40) + 1; return Math.min(l.stopAt, (steps * l.n) / 8); },

    // glow layers of every big bolt (FX canvas, under the PX bodies and the sprites)
    drawBoltGlows(ctx, t) {
      if (this.ff && this.ff.pre && t < T.IMPACT) return;
      if (t >= T.LEADER_SKY && t < T.SKY) this.stampBolt(ctx, this.sky, BOLT.leader, 0.6, this.skyLeaderUpto(t));
      if (t < T.SKY + 800) {
        for (const sb of this.skyBolts) { const sk = this.skyHalo(t - sb[1]); if (sk > 0.02) this.stampBolt(ctx, sb[0], sb[1] ? BOLT.skyFlank : BOLT.sky, sk * (sb[1] ? 0.5 : 1)); }
        const sk0 = this.skyHalo(t);
        if (sk0 > 0.02) this.stampBolt(ctx, this.skyLink, BOLT.sister, 0.85 * sk0);
      }
      if (t >= T.LEADERS && t < T.IMPACT) for (const l of this.leaders) this.stampBolt(ctx, l, BOLT.leader, 0.5, this.leaderSteps(t, l));
      const th = this.trunkHalo(t);
      if (th > 0.02 && t < T.IMPACT + 600) this.stampBolt(ctx, this.trunk, BOLT.trunk, th);
      for (const sb of this.sisters) { const h = this.sisterHalo(t, sb.at); if (h > 0.02) this.stampBolt(ctx, sb.bolt, BOLT.sister, h); }
      const rh = this.restrikeHalo(t);
      if (rh > 0.02) { this.stampBolt(ctx, this.restrike.top, BOLT.restrike, rh); this.stampBolt(ctx, this.restrike.fork, BOLT.restrike, rh); }
    },

    drawAfterimages(ctx, t) {
      const w = Math.max(1, this.u);
      const ghost = (bolt, t0) => {
        if (t < t0 || t >= t0 + 120) return;
        const u = prog(t0, t0 + 120, t);
        ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
        ctx.strokeStyle = rgba(RGB.blue, 0.3 * (1 - u)); ctx.lineWidth = w;
        ctx.stroke(bolt.paths().main);
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      };
      if (this.skyAt != null) { ghost(this.sky, this.skyAt + 270); if (this.skyLong) ghost(this.skyLong, this.skyAt + 290); }
      if (this.ev.eImpact) ghost(this.trunk, T.IMPACT + 380);
      if (this.restrike) { ghost(this.restrike.top, T.RESTRIKE + 210); ghost(this.restrike.fork, T.RESTRIKE + 210); }
    },

    // The three budgeted flashes: a pure white source-over washout (it blanks the page for a moment, it never
    // tints or dims it), held for at most 2 frames, decaying with tau <= 40ms and gone by 120ms.
    flashVeil(t) {
      let a = 0;
      const one = (f, hold, tau, gone) => {
        if (!f || t < f.at) return 0;
        const d = t - f.at;
        if (d >= gone) return 0;
        const v = d < hold ? f.peak : f.peak * Math.exp(-(d - hold) / tau);
        return v * (1 - prog(gone - 30, gone, d));
      };
      a = Math.max(one(this.fs, 25, 35, 110), one(this.f1, 33, 40, 120), one(this.f2, 25, 35, 110));
      return { a: a < 0.004 ? 0 : a, c: RGB.flash };
    },
    // Local bloom only: the flash lights the strike point and fades out within a few hundred px, so the
    // rest of the page keeps its normal look (no full-screen washout).
    drawFlashes(ctx, t) {
      const v = this.flashVeil(t);
      if (!v.a || !this.P) return;
      const R = Math.max(180, Math.min(this.vw, this.vh) * 0.38);
      const g = ctx.createRadialGradient(this.P.x, this.P.y, 0, this.P.x, this.P.y, R);
      g.addColorStop(0, rgba(v.c, v.a));
      g.addColorStop(0.35, rgba(v.c, v.a * 0.55));
      g.addColorStop(1, rgba(v.c, 0));
      ctx.fillStyle = g;
      ctx.fillRect(this.P.x - R, this.P.y - R, R * 2, R * 2);
    },
    // manga impact frame: the struck link as a solid black silhouette over the flash
    drawLinkSilhouette(ctx) {
      ctx.fillStyle = '#000';
      if (!this.isCard && this.rects.length === 1 && this.text) {
        const r = this.rects[0];
        ctx.save();
        ctx.font = this.font;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        const w = ctx.measureText(this.text).width || r.w;
        ctx.translate(r.l, r.cy);
        ctx.scale(clamp(r.w / w, 0.5, 2), 1);
        ctx.fillText(this.text, 0, 0);
        ctx.restore();
      } else {
        for (const r of this.rects) ctx.fillRect(r.l, r.t + r.h * 0.12, r.w, r.h * 0.76);
      }
    },

    drawSoftParticles(ctx, t, bt) {
      const pl = this.pools;
      // smoke: ordered-dither pixel puffs on the art grid (no airbrushed blobs in a pixel-art scene)
      const cs = Math.max(2, Math.round(this.u));
      for (const p of pl.smoke.live) {
        const u = p.age / p.life, dens = 0.5 * (1 - u) * Math.min(1, u * 5), R = p.size;
        if (dens < 0.03) continue;
        const gx = Math.floor((p.x - R) / cs), gy = Math.floor((p.y - R) / cs), n = Math.ceil((2 * R) / cs);
        ctx.fillStyle = u < 0.5 ? '#7c7c7c' : '#bcbcbc';
        for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
          const cx = (gx + i + 0.5) * cs, cy = (gy + j + 0.5) * cs, dd = Math.hypot(cx - p.x, cy - p.y) / R;
          if (dd >= 1) continue;
          if (hash01(gx + i, gy + j, 77) < dens * (1 - dd * dd)) ctx.fillRect((gx + i) * cs, (gy + j) * cs, cs, cs);
        }
      }
      // flames: source-over, so the fire licking past the char band onto the white page still shows
      ctx.imageSmoothingEnabled = false;
      for (const p of pl.flames.live) {
        const u = p.age / p.life, sp = pixFlame(Math.min(3, (u * 4) | 0));
        const c = Math.max(2, Math.round((p.size * (0.6 + 0.5 * Math.sin(Math.PI * Math.min(1, u * 1.1)))) / 7));
        const w = sp.width * c, h = sp.height * c, x = Math.round((p.x - w / 2) / c) * c, y = Math.round((p.y - h) / c) * c;
        if ((Math.floor(p.age / 70) + (p.ph > 3 ? 1 : 0)) % 2) { ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(sp, 0, 0, w, h); ctx.restore(); }
        else ctx.drawImage(sp, x, y, w, h);
      }
      ctx.imageSmoothingEnabled = true;
      // embers: rust / maroon squares with a gold core (read on the white page and on the char)
      for (const p of pl.embers.live) {
        const u = p.age / p.life, fl = 0.6 + 0.4 * Math.sin(p.ph + p.age * p.fq), a = 1 - u * u, sz = p.size >= 3 ? 4 : 2;
        const x = Math.round(p.x / 2) * 2, y = Math.round(p.y / 2) * 2;
        if (p.settle && hash01(x >> 1, y >> 1, Math.floor(p.age / 50)) > a) continue; // settling embers dither out
        ctx.fillStyle = rgba(u > 0.6 ? RGB.maroon : RGB.orange, a);
        ctx.fillRect(x, y, sz, sz);
        if (sz > 2) { ctx.fillStyle = rgba(RGB.gold, fl * a); ctx.fillRect(x + 1, y + 1, 2, 2); }
      }
      for (const p of pl.debris.live) {
        const u = p.age / p.life, sq = Math.abs(Math.cos(p.rot));
        ctx.globalAlpha = 1 - Math.max(0, (u - 0.7) / 0.3);
        ctx.fillStyle = p.col;
        ctx.fillRect(Math.round(p.x - p.size / 2), Math.round(p.y - (p.size * sq) / 2), Math.round(p.size), Math.max(1, Math.round(p.size * sq)));
      }
      for (const p of pl.ash.live) {
        const u = p.age / p.life, sq = Math.abs(Math.cos(p.rot));
        ctx.globalAlpha = 0.85 * (1 - u);
        ctx.fillStyle = rgba(this.committed ? [96, 96, 96] : p.col, 1);
        ctx.fillRect(p.x - p.size / 2, p.y - (p.size * sq) / 2, p.size, Math.max(0.8, p.size * sq * 0.7));
      }
      ctx.globalAlpha = 1;
    },

    /* =============================== PX =============================== */
    renderPX(t, bt) {
      const ctx = this.px, d = this.pxDpr, sh = this.shake;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, this.pxCv.width, this.pxCv.height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.imageSmoothingEnabled = true;
      const css = () => ctx.setTransform(d, 0, 0, d, sh.x * d, sh.y * d);
      const ox = Math.round(sh.x * d), oy = Math.round(sh.y * d);
      // 1. everything smooth goes UNDER the sprites
      css();
      this.drawBoltsFront(ctx, t);
      this.drawCrawlers(ctx, t);
      this.drawCallFx(ctx, t);
      this.drawDust(ctx, t);
      this.drawCrispParticles(ctx, t, ox, oy, false);
      this.drawSpeedLines(ctx, t, ox, oy);
      // 2. the sprites
      this.drawHandShadow(ctx, t, ox, oy);
      const flyOver = !!this.fly && t >= T.CATCH - 60;
      if (!flyOver) this.drawFlyer(ctx, t, ox, oy);
      this.drawSmear(ctx, t, ox, oy);
      this.drawArm(ctx, t, ox, oy);
      if (flyOver) this.drawFlyer(ctx, t, ox, oy);
      // 3. pixel FX on the sprite's art grid
      this.drawRunes(ctx, t, ox, oy);
      this.drawOrbit(ctx, t, ox, oy);
      this.drawAttached(ctx, t, ox, oy);
      this.drawClimbs(ctx, t, ox, oy);
      this.drawGlints(ctx, t, ox, oy);
      this.drawClickSpark(ctx, t, ox, oy);
      this.drawCatchRays(ctx, t, ox, oy);
      this.drawSkyBurst(ctx, t, ox, oy);
      // 4. the motes that belong to the hand (on its art grid, never on its pixels)
      css();
      this.drawCrispParticles(ctx, t, ox, oy, true);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      if (this.opts.debug) { css(); this.drawDebug(ctx, t); }
    },

    // blit a scale-1 frame at an integer device position with an integer k upscale (nearest neighbour)
    blitK(ctx, img, x, y, a, op) {
      const k = this.k, w = img.width * k, h = img.height * k;
      ctx.globalAlpha = a;
      ctx.globalCompositeOperation = op || 'source-over';
      if (this.side > 0) ctx.setTransform(1, 0, 0, 1, x, y); else ctx.setTransform(-1, 0, 0, 1, x + w, y);
      ctx.drawImage(img, 0, 0, w, h);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    },
    // one art-pixel square at art coords (ax, ay) of a frame drawn at device TL (mirrored for side -1)
    artPx(ctx, TL, W, ax, ay) {
      const k = this.k;
      ctx.fillRect(TL.x + (this.side > 0 ? ax : W - 1 - ax) * k, TL.y + ay * k, k, k);
    },
    // a pixel-art twinkle at a device point on the art grid: sky centre, azure then cobalt arms
    pixStar(ctx, X, Y, arm, a) {
      if (a <= 0.02) return;
      const k = this.k;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = Math.min(1, a);
      ctx.fillStyle = '#3cbcfc';
      ctx.fillRect(X, Y, k, k);
      for (let i = 1; i <= arm; i++) {
        ctx.fillStyle = i === 1 ? '#0078f8' : '#0058f8';
        ctx.fillRect(X + i * k, Y, k, k); ctx.fillRect(X - i * k, Y, k, k); ctx.fillRect(X, Y + i * k, k, k); ctx.fillRect(X, Y - i * k, k, k);
      }
      ctx.globalAlpha = 1;
    },
    // the TL of whatever sprite is on screen (for snapping pixel FX to its grid), else the impact pose's
    gridTL() { return this.pose ? this.pose.TL : this.fly ? this.fly.TL : this.TLi; },

    // The arm materialising (mode 'in', p 0 -> 1) or dissolving ('out', p 0 -> 1), as a scale-1 frame.
    // Prefers the sprite's own ordered-dither helper (engine.Hand.dither: Bayer + jitter, electric front,
    // twinkle pixels) when the sprite also owns the cut-end fade; else the engine's dissolveImg below. The
    // dissolve grows from the hammer head, so the faded cut end leaves first and the head winks out last. The
    // sprite memoises each step per frame (not per strike), so a strike after the first builds no canvases.
    ditherFrame(name, mat, t) {
      const lib = NS.Hand, f = this.hd.f[name];
      if (this.spriteDither()) {
        try {
          const q = mat.mode === 'in' ? mat.p : 1 - mat.p;
          // in: condenses outward from the hand; out: a strong distance bias, so the faded cut end goes first and
          // the last pixels wink out round the hammer head (never a whole-frame screen door)
          const o = { seed: 3, bias: mat.mode === 'out' ? 0.62 : 0.42 };
          if (mat.mode === 'out' && f.headC) o.from = { x: Math.round(f.headC.x), y: Math.round(f.headC.y) };
          const cv = lib.dither(name, q, o);
          if (cv && cv.width === f.W && cv.height === f.H) return cv;
        } catch (e) { /* fall through to the engine's dissolve */ }
        this.noSpriteDither = true;
      }
      return this.dissolveImg(name, mat.p, mat.mode, t);
    },

    // Materialise / dissolve at art resolution: the frame's pixels pass an 8x8 Bayer threshold blended
    // with their distance from a seed (in: the hand first; out: the cut end first, the hammer head last),
    // the frontier pixels flash electric blue, and a few sparkle pixels sit on the outline next to it.
    dissolveImg(name, p, mode, t) {
      const f = this.hd.f[name], z = dissolveData(f);
      if (!this.dsCv || this.dsCv.width !== z.W || this.dsCv.height !== z.H) {
        this.dsCv = makeCanvas(z.W, z.H);
        this.dsCtx = this.dsCv.getContext('2d');
        this.dsId = this.dsCtx.createImageData(z.W, z.H);
      }
      const d = this.dsId.data, vv = mode === 'in' ? z.vin : z.vout, band = 0.08, flick = Math.floor(t / 33), W = z.W;
      d.fill(0);
      for (let i = 0; i < z.n; i++) {
        const v = vv[i];
        const show = mode === 'in' ? v < p : v >= p;
        if (!show) continue;
        const o = (z.ys[i] * W + z.xs[i]) * 4;
        const edge = mode === 'in' ? v >= p - band : v < p + band;
        if (edge && p > 0.001 && p < 0.999) {
          const c = SPARK_COLS[(z.xs[i] * 7 + z.ys[i] * 13 + flick * 5) % 3];
          d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
        } else {
          d[o] = z.rgba[i * 4]; d[o + 1] = z.rgba[i * 4 + 1]; d[o + 2] = z.rgba[i * 4 + 2]; d[o + 3] = z.rgba[i * 4 + 3];
        }
      }
      if (p > 0.001 && p < 0.999) {
        const e = z.edge;
        for (let j = 0; j < e.length; j += 3) {
          const v = vv[e[j + 2]];
          const near = mode === 'in' ? v < p && v >= p - 1.8 * band : v >= p - 0.8 * band && v < p + band;
          if (!near || (e[j] * 3 + e[j + 1] * 5 + flick) % 4 !== 0) continue;
          const o = (e[j + 1] * W + e[j]) * 4, c = SPARK_COLS[(e[j] + flick) & 1];
          d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
        }
      }
      this.dsCtx.putImageData(this.dsId, 0, 0);
      return this.dsCv;
    },

    // the call: the tether of pixel dots the hammer eats, and a pixel twinkle where it will appear
    drawCallFx(ctx, t) {
      if (this.ff && this.ff.pre) return;
      if (t >= T.TETHER && t < T.CATCH) {
        const reveal = prog(T.TETHER, T.TETHER_END, t), fu = this.fly ? this.fly.u : -1, sz = Math.max(2, Math.round(this.u * 0.75));
        for (let i = 0; i < this.tether.length; i++) {
          const dt = this.tether[i];
          if (dt.r > reveal || dt.u <= fu) continue;
          const pulse = 0.65 + 0.35 * Math.sin(t * 0.02 + i * 0.7);
          ctx.fillStyle = rgba(i % 2 ? RGB.cyan : RGB.blue, 0.85 * pulse);
          ctx.fillRect(Math.round(dt.x - sz / 2), Math.round(dt.y - sz / 2), sz, sz);
        }
      }
      if (t >= T.GLINT && t < T.GLINT + 130) {
        const u = prog(T.GLINT, T.GLINT + 130, t), d = this.pxDpr;
        const x = clamp(this.E.x, 16, this.vw - 16), y = clamp(this.E.y, 16, this.vh - 16);
        this.pixStar(ctx, Math.round(x * d), Math.round(y * d), u < 0.5 ? 2 : 1, 1 - u);
        ctx.setTransform(d, 0, 0, d, this.shake.x * d, this.shake.y * d);
      }
    },

    drawFlyer(ctx, t, ox, oy) {
      const fl = this.fly;
      if (!fl) return;
      const hk = this.hk, d = this.pxDpr, k = this.k;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      // the spin smear: art-grid cells in three stepped bands (sky outside, ice, azure inside) along the arc the
      // head swept over the last 45ms, at most 80 degrees, thinning toward the tail (never a closed ring)
      const prev = this.flyAt(t - 45);
      if (prev && t < T.CATCH - 110) {
        const span = clamp(prev.ang - fl.ang, 0, 80);
        if (span > 6) {
          const rr = (hk.grip.idle.y - hk.headC.idle.y) * this.u, hh = this.headHc, sd = this.side, seen = new Set();
          const cols = ['#0078f8', '#a4e4fc', '#3cbcfc'];
          for (let j = 0; j <= 28; j++) {
            const f = j / 28, rad = (fl.ang + span * f) * DEG, dx = sd * Math.sin(rad), dy = -Math.cos(rad);
            for (let w = -1; w <= 1; w++) {
              const R = rr + w * hh * 0.34, q = this.snapArt(fl.TL, fl.x + dx * R, fl.y + dy * R), key = q.x * 7919 + q.y;
              if (seen.has(key) || hash01(q.x, q.y, 3) > 1 - 0.85 * f) continue;
              seen.add(key);
              ctx.fillStyle = cols[w + 1];
              ctx.fillRect(q.x + ox, q.y + oy, k, k);
            }
          }
        }
      }
      // one flat ghost 20ms behind: a sparse ordered dither of the silhouette in sky (no alpha blending)
      for (let i = 1; i >= 1; i--) {
        const g = this.flyAt(t - i * 20);
        if (g) this.blitK(ctx, ditherSil(g.o), g.TL.x + ox, g.TL.y + oy, 1, 'source-over');
      }
      this.blitK(ctx, fl.o.cv, fl.TL.x + ox, fl.TL.y + oy, 1, 'source-over');
      // V shock cone at the leading edge on the dead-straight final stretch, as art-pixel dashes
      if (t >= T.CATCH - 90) {
        const dir = this.flyDir, half = 0.55 * hk.W * this.u * 0.5, tipx = fl.x + dir.x * half, tipy = fl.y + dir.y * half;
        ctx.fillStyle = '#0078f8';
        for (const sgn of [-1, 1]) {
          const a = Math.atan2(-dir.y, -dir.x) + sgn * 0.45;
          for (let dd = 0; dd <= 28; dd += this.u) { const q = this.snapArt(fl.TL, tipx + Math.cos(a) * dd, tipy + Math.sin(a) * dd); ctx.fillRect(q.x + ox, q.y + oy, k, k); }
        }
      }
      ctx.imageSmoothingEnabled = true;
      ctx.setTransform(d, 0, 0, d, this.shake.x * d, this.shake.y * d);
    },

    // stepped pixel smear crescent (sky / ice / azure bands) on the art grid, built on first use
    buildSmear() {
      const hd = this.hd, k = this.k, s = this.side;
      const pr = this.armPose(SIDE[this.impF] ? T.SWING : T.SWING - 1);
      if (!pr) { this.smearCells = []; return; }
      const fr = hd.f[pr.frame], fi = hd.f[this.impF];
      if (!fr.headC || !fi.headC) { this.smearCells = []; return; }
      const Hr = this.ptDev(pr.frame, this.poseTL(pr), fr.headC), Hi = this.ptDev(this.impF, this.TLi, fi.headC);
      const W = this.ptDev(this.impF, this.TLi, fi.grip || fi.wrist || fi.root);
      const a0 = Math.atan2(Hr.y - W.y, Hr.x - W.x), a1 = Math.atan2(Hi.y - W.y, Hi.x - W.x);
      let da = a1 - a0;
      if (s > 0) { while (da <= 0) da += TAU; while (da > TAU) da -= TAU; } else { while (da >= 0) da -= TAU; while (da < -TAU) da += TAU; }
      const r0 = Math.hypot(Hr.x - W.x, Hr.y - W.y), r1 = Math.hypot(Hi.x - W.x, Hi.y - W.y);
      const thick = this.hk.headH * k * 1.1, cells = new Map();
      for (let i = 0; i <= 140; i++) {
        const u = i / 140, a = a0 + da * u, rad = lerp(r0, r1, u), tw = thick * Math.pow(u, 0.8);
        for (let w = -tw / 2; w <= tw / 2; w += k * 0.5) {
          const x = W.x + Math.cos(a) * (rad + w), y = W.y + Math.sin(a) * (rad + w);
          const cx = Math.floor((x - this.TLi.x) / k), cy = Math.floor((y - this.TLi.y) / k);
          const band = w > tw / 6 ? 0 : w > -tw / 6 ? 1 : 2, key = cx + ',' + cy, old = cells.get(key);
          if (!old || band < old.band) cells.set(key, { cx, cy, band, u });
        }
      }
      this.smearCells = Array.from(cells.values());
    },
    drawSmear(ctx, t, ox, oy) {
      if (t < T.SMEAR || t >= T.IMPACT + 50 || this.ff) return;
      if (!this.smearCells) this.buildSmear();
      const k = this.k, show = prog(T.SMEAR - 20, T.IMPACT, t), rec = prog(T.IMPACT, T.IMPACT + 50, t), cut = Math.floor(rec * 3.2);
      const cols = ['rgba(60,188,252,0.9)', 'rgba(164,228,252,0.95)', 'rgba(0,120,248,0.85)'];
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      for (let b = 0; b < 3; b++) {
        if (b < cut) continue;
        ctx.fillStyle = cols[b];
        for (const c of this.smearCells) {
          if (c.band !== b || c.u > show + 0.02 || c.u < rec) continue;
          ctx.fillRect(this.TLi.x + c.cx * k + ox, this.TLi.y + c.cy * k + oy, k, k);
        }
      }
    },

    // the arm's drop shadow on the page: whole art px down-right (light from the top left), with the cut-end
    // fade zone erased so it never shows through the fading forearm; fades with the arm
    // a 50% ordered-dither silhouette in light grey (never an alpha copy); not during the charge hero pose, so the
    // money shot keeps one clean silhouette, and not while the arm is still mostly dither
    drawHandShadow(ctx, t, ox, oy) {
      const p = this.pose;
      if (!p || this.ff || (t >= T.IMPACT && t < T.PUNCH_END) || (t >= T.CHARGE && t < T.SWING) || this.armVis() < 0.6) return;
      const k = this.k;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      this.blitK(ctx, this.hd.shadowD[p.frame], p.TL.x + ox + (this.side > 0 ? 2 : -2) * k, p.TL.y + oy + 3 * k, 1, 'source-over');
    },

    drawArm(ctx, t, ox, oy) {
      const p = this.pose;
      if (!p) return;
      const hd = this.hd, k = this.k, d = this.pxDpr;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      // ghosts (sparse sky dither, never alpha): one frame behind through the swing, and a 2-frame pose ghost on
      // each pose change
      const ghosts = [];
      if (t >= T.SWING && t < T.IMPACT) ghosts.push(17);
      for (const g of ghosts) {
        const gp = this.armPose(this.quantArm(t - g));
        if (gp && !gp.mat) { const TL = this.poseTL(gp); this.blitK(ctx, hd.ghost[gp.frame], TL.x + ox, TL.y + oy, 1, 'source-over'); }
      }
      const fam = (n) => (/^open/.test(n) ? 'open' : /Raised$/.test(n) ? 'raised' : n);
      if (this.lastPoseFrame && fam(this.lastPoseFrame) !== fam(p.frame)) this.poseGhost = { pose: this.lastPose, until: t + 34 };
      this.lastPoseFrame = p.frame;
      this.lastPose = { frame: p.frame, TL: p.TL };
      if (this.poseGhost && t < this.poseGhost.until && !ghosts.length && !p.mat && !(t >= T.CHARGE && t < T.WINDUP)) {
        const gp = this.poseGhost.pose;
        this.blitK(ctx, hd.ghost[gp.frame], gp.TL.x + ox, gp.TL.y + oy, 1, 'source-over');
      }
      // sky-bolt backlight: a sky rim light along the edges facing the bolt (1 art px up)
      if (this.skyAt != null && t >= this.skyAt && t < this.skyAt + 240 && !this.ff && !p.mat) {
        this.blitK(ctx, hd.ice[p.frame], p.TL.x + ox, p.TL.y + oy - k, 0.95 * (1 - prog(this.skyAt + 40, this.skyAt + 240, t)), 'source-over');
      }
      let img = hd.f[p.frame].cv;
      if (IMPACT_FRAMES[p.frame] && t >= T.IMPACT && t < T.HIT2 && !this.ff) img = hd.white[p.frame];
      if (this.skyAt != null && t >= this.skyAt && t < this.skyAt + 34 && !this.ff) img = hd.ink[p.frame] || hd.white[p.frame];
      if (p.mat) img = this.ditherFrame(p.frame, p.mat, t);
      this.blitK(ctx, img, p.TL.x + ox, p.TL.y + oy, 1, 'source-over');
      if (this.side < 0 && img === hd.f[p.frame].cv) { const ov = runeOverlay(hd.f[p.frame]); if (ov) this.blitK(ctx, ov, p.TL.x + ox, p.TL.y + oy, 1, 'source-over'); }
      // the catch: hand and hammer blend 60% toward the hit colour for one frame (local, not the forearm)
      if (p.frame === 'catch' && t >= T.CATCH && t < T.CATCH + 17) this.blitK(ctx, this.catchHitImg(), p.TL.x + ox, p.TL.y + oy, 1, 'source-over');
      ctx.restore();
      ctx.imageSmoothingEnabled = true;
    },

    // the catch frame's hit colour (ice with the black outline kept) on the hand and the hammer only: the forearm
    // (every pixel behind the wrist along the arm's axis, near the axis) is cleared, at scale 1, once, so the hit
    // colour follows the parts' own pixel edges
    catchHitImg() {
      if (this._catchHit) return this._catchHit;
      const f = this.hd.f.catch, src = this.hd.white.catch, c = cloneCanvas(src), x = c.getContext('2d'), ax = f.axis || { x: 1, y: 0 };
      const w = f.wrist || f.palm || f.centroid, tW = (w.x - f.root.x) * ax.x + (w.y - f.root.y) * ax.y;
      try {
        const id = x.getImageData(0, 0, c.width, c.height), dd = id.data;
        for (let y = 0; y < c.height; y++) for (let X = 0; X < c.width; X++) {
          if (axisT(X, y, f.root, ax) < tW - 1 && Math.abs(axisV(X, y, f.root, ax)) <= CUT_HALF + 2) dd[(y * c.width + X) * 4 + 3] = 0;
        }
        x.putImageData(id, 0, 0);
      } catch (e) { /* tainted: the whole frame */ }
      return (this._catchHit = c);
    },

    // Vambrace rune studs, as a palette swap inside each stud only: the 3x3 glyph alternates sky and white every
    // 90ms and its recess cobalt and azure (studs out of phase), from each rune's ignition through the charge;
    // the glyphs flash white at the catch and as the sky bolt runs down the arm. No pixel outside a stud.
    drawRunes(ctx, t, ox, oy) {
      const p = this.pose;
      if (!p || this.hd.virtual || p.mat || this.ff) return;
      const f = this.hd.f[p.frame];
      if (!f.runes.length) return;
      if (!f.runePx) f.runePx = runePixels(f);
      const TL = { x: p.TL.x + ox, y: p.TL.y + oy };
      const charged = t >= T.SKY && t < T.LIFT, calling = t >= T.RUNE1 && t < T.CATCH + 120;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      f.runePx.forEach((R, i) => {
        const white = (t >= T.CATCH && t < T.CATCH + 34) || (this.skyAt != null && t >= this.skyAt + 30 * i && t < this.skyAt + 30 * i + 50);
        const lit = charged || (calling && t >= [T.RUNE1, T.RUNE2, T.RUNE3][Math.min(i, 2)]);
        if (!white && !lit) return;
        const ph = (Math.floor(t / 90) + i) & 1, mir = this.side < 0;
        let gx0 = 1e9, gx1 = -1e9;
        if (mir) for (const q of R.glyph.concat(R.recess)) { gx0 = Math.min(gx0, q[0]); gx1 = Math.max(gx1, q[0]); }
        const rec = ph ? '#0058f8' : '#0078f8';
        if (mir) { ctx.fillStyle = rec; for (const q of R.glyph) this.artPx(ctx, TL, f.W, q[0], q[1]); }
        ctx.fillStyle = white || ph ? '#fcfcfc' : '#3cbcfc';
        for (const q of R.glyph) this.artPx(ctx, TL, f.W, mir ? gx0 + gx1 - q[0] : q[0], q[1]);
        if (white) return;
        ctx.fillStyle = rec;
        for (const q of R.recess) if (!mir || !R.glyph.some((g) => g[1] === q[1] && gx0 + gx1 - g[0] === q[0])) this.artPx(ctx, TL, f.W, q[0], q[1]);
      });
    },

    // charge: sparks that walk ALONG the hammer head's outline (outline-adjacent art pixels, ordered by angle
    // round the head), so they are always attached to the metal; 4 before the sky bolt, 8 after, fewer as the
    // coil gathers the charge into the head
    drawOrbit(ctx, t, ox, oy) {
      if (t < T.CHARGE || t >= T.COIL_END + 100 || this.ff) return;
      const p = this.pose;
      if (!p || p.mat) return;
      const f = this.hd.f[p.frame];
      if (!f.headC) return;
      if (!f.hRing) {
        const e = headEdge(f, this.hk), arr = [];
        for (let j = 0; j < e.length; j += 2) arr.push({ x: e[j], y: e[j + 1], a: Math.atan2(e[j + 1] + 0.5 - f.headC.y, e[j] + 0.5 - f.headC.x) });
        arr.sort((q, w) => q.a - w.a);
        f.hRing = arr;
      }
      const ring = f.hRing;
      if (!ring.length) return;
      const n = Math.round((t < T.SKY ? 4 : 8) * (1 - 0.75 * prog(T.WINDUP, T.COIL_END + 100, t)));
      const TL = { x: p.TL.x + ox, y: p.TL.y + oy };
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      for (let i = 0; i < n; i++) {
        let a = this.orbitA + (i * TAU) / n;
        a = Math.atan2(Math.sin(a), Math.cos(a));
        let lo = 0, hi = ring.length - 1;
        while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (ring[mid].a < a) lo = mid; else hi = mid; }
        const q = Math.abs(ring[lo].a - a) < Math.abs(ring[hi].a - a) ? ring[lo] : ring[hi];
        ctx.fillStyle = i % 2 ? '#3cbcfc' : '#0078f8';
        this.artPx(ctx, TL, f.W, q.x, q.y);
      }
    },

    // crackle pixels attached to the outline (never floating off it): on the flying hammer, round the charged
    // head, and on the pinned head after the impact. Re-picked every frame, so they flicker. Saturated colours
    // (sky next to the metal, azure, cobalt), so they read on a white page.
    drawAttached(ctx, t, ox, oy) {
      if (this.ff) return;
      const r = this.rand;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      const fl = this.fly;
      if (fl) {
        const e = edgeList(fl.o.cv), n = e.length / 3;
        if (n) {
          const TL = { x: fl.TL.x + ox, y: fl.TL.y + oy };
          for (let i = 0; i < 3; i++) {
            const j = Math.floor(r() * n) * 3;
            ctx.fillStyle = r() < 0.5 ? '#3cbcfc' : '#0078f8';
            this.artPx(ctx, TL, fl.o.cv.width, e[j], e[j + 1]);
          }
        }
      }
      const p = this.pose;
      const charged = t >= T.CHARGE && t < T.SWING, pinned = t >= T.IMPACT && t - this.armHold < T.DEMAT + 100;
      if (p && !p.mat && (charged || pinned)) {
        const f = this.hd.f[p.frame], e = headEdge(f, this.hk), n = e.length / 2;
        if (n) {
          const TL = { x: p.TL.x + ox, y: p.TL.y + oy };
          const m = charged ? (t < T.SKY ? (this.streamLive ? 3 : 1) : 6) : 3;
          for (let i = 0; i < m; i++) {
            const j = Math.floor(r() * n) * 2;
            ctx.fillStyle = r() < 0.45 ? '#3cbcfc' : r() < 0.75 ? '#0078f8' : '#0058f8';
            this.artPx(ctx, TL, f.W, e[j], e[j + 1]);
          }
        }
      }
    },

    // the charge climbing the arm: each spark is a 4-cell run moving along its path (rune -> wrist -> fist ->
    // handle) in the pose's own art pixels, white at the head, then sky, azure, cobalt
    drawClimbs(ctx, t, ox, oy) {
      const p = this.pose;
      if (!this.climbs || !p || p.mat || this.ff || t >= T.SKY) return;
      const f = this.hd.f[p.frame], TL = { x: p.TL.x + ox, y: p.TL.y + oy }, cols = ['#fcfcfc', '#3cbcfc', '#0078f8', '#0058f8'];
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      for (const c of this.climbs) {
        if (c.frame !== p.frame || t < c.t0 || t >= c.t1) continue;
        const head = Math.floor(prog(c.t0, c.t1, t) * (c.pts.length + 3));
        for (let j = 0; j < 4; j++) {
          const q = c.pts[head - j];
          if (!q) continue;
          ctx.fillStyle = cols[j];
          this.artPx(ctx, TL, f.W, q[0], q[1]);
        }
      }
    },
    // the click is answered on the very first frames: a pixel twinkle where the link was struck, on the art grid
    drawClickSpark(ctx, t, ox, oy) {
      if (t >= 150 || this.ff) return;
      const d = this.pxDpr, k = this.k, X = Math.round((this.P0.x * d) / k) * k + ox, Y = Math.round((this.P0.y * d) / k) * k + oy;
      this.pixStar(ctx, X, Y, t < 70 ? 2 : 1, 1 - (t / 150) * (t / 150));
    },

    // every bolt body and arc (PX canvas, drawn BEFORE the sprites so the opaque pixel art covers them)
    drawBoltsFront(ctx, t) {
      const D = this.dyn, pre = this.ff && this.ff.pre && t < T.IMPACT;
      if (!pre) {
        if (D.call.length) { const a = 0.95 * (1 - prog(T.CALL + 140, T.CALL + 240, t)); for (const b of D.call) this.strokeBolt(ctx, b, a, BOLT.micro, {}); }
        const ca = 1 - prog(T.CATCH, T.CATCH + 150, t);
        for (const b of D.catch) this.strokeBolt(ctx, b, ca, BOLT.micro, {});
        // the sky leader steps down its channel; streamers leap up off the head to meet it
        if (t >= T.LEADER_SKY && t < T.SKY) this.strokeBolt(ctx, this.sky, 0.95, BOLT.leader, { upto: this.skyLeaderUpto(t) });
        for (const b of D.stream) this.strokeBolt(ctx, b, 0.9, BOLT.micro, {});
        for (const b of D.micro) this.strokeBolt(ctx, b, 0.85, BOLT.micro, {});
        for (const e of D.elmo) this.strokeBolt(ctx, e.bolt, e.a, BOLT.micro, {});
        for (const b of D.lock) this.pixBolt(ctx, b, Math.max(2, Math.round(this.u)), 0.9);
        for (const sb of this.skyBolts) { const sc = this.skyCore(t - sb[1]); if (sc > 0) this.strokeBolt(ctx, sb[0], sc * (sb[1] ? 0.6 : 1), sb[1] ? BOLT.skyFlank : BOLT.sky, {}); }
        const sc0 = this.skyCore(t);
        if (sc0 > 0) this.strokeBolt(ctx, this.skyLink, 0.85 * sc0, BOLT.sister, {});
        if (t >= T.LEADERS && t < T.IMPACT) for (const l of this.leaders) this.strokeBolt(ctx, l, 0.85, BOLT.leader, { upto: this.leaderSteps(t, l), noBranches: true });
        if (t >= T.STREAMER && t < T.IMPACT) this.strokeBolt(ctx, this.streamer, 0.6 + 0.4 * this.rand(), BOLT.micro, { layers: [1, 3, 4] });
        if (t >= T.RACE && t < T.IMPACT) this.strokeBolt(ctx, this.trunk, 0.85, BOLT.leader, { upto: Math.max(1, this.trunk.n * prog(T.RACE, T.IMPACT, t)), noBranches: true });
      }
      const tc = this.trunkCore(t);
      if (tc > 0) {
        this.strokeBolt(ctx, this.trunk, tc, BOLT.trunk, {});
        const sa = tc * 0.9 * (1 - prog(T.IMPACT + 70, T.IMPACT + 190, t));
        if (sa > 0.01) for (const g of this.splash) this.pixBolt(ctx, g, Math.max(2, Math.round(this.u / 2)), sa);
      }
      if (D.ground.length) {
        const ga = 0.9 * (1 - prog(T.IMPACT + 200, T.IMPACT + 320, t));
        for (const b of D.ground) this.pixBolt(ctx, b, Math.max(2, Math.round(this.u / 2)), ga);
      }
      for (const sb of this.sisters) { const c = this.sisterCore(t, sb.at); if (c > 0) this.strokeBolt(ctx, sb.bolt, c, BOLT.sister, {}); }
      const rc = this.restrikeCore(t);
      if (rc > 0) { this.strokeBolt(ctx, this.restrike.top, rc, BOLT.restrike, {}); this.strokeBolt(ctx, this.restrike.fork, rc, BOLT.restrike, {}); }
    },

    // residual crawlers: one cached bolt per hop, drawn partially as the arc runs along it
    drawCrawlers(ctx, t) {
      if (this.ff) return;
      const r = this.rand;
      for (const c of this.crawlers) {
        if (t < c.t0 || t > c.t1 + 40) continue;
        for (const h of c.hops) {
          let a = 1, u;
          if (t < h.t0) continue;
          if (t <= h.t1) u = (t - h.t0) / (h.t1 - h.t0 || 1);
          else if (t < h.t1 + 40) { u = 1; a = 1 - (t - h.t1) / 40; } else continue;
          if (Math.hypot((h.x1 - h.x0) * u, (h.y1 - h.y0) * u) < 2) continue;
          if (!h.bolt) h.bolt = new Bolt(h.x0, h.y0, h.x1, h.y1, 3, r, h.along ? 0.18 : 0.3);
          else if (this.every('crawlJit', 40, t)) h.bolt.rejitterFine(1);
          this.pixBolt(ctx, h.bolt, Math.max(2, Math.round(this.u / 2)), a, Math.max(1, Math.round(u * h.bolt.n)));
        }
      }
    },

    // the catch slap: eight short rays of art-pixel dashes burst off the palm, on the catch pose's art grid
    // (no ring: a circle round the hand would read as a summoning circle)
    drawCatchRays(ctx, t, ox, oy) {
      if (this.catchAt == null || t >= T.CATCH + 200 || this.ff) return;
      const u = prog(T.CATCH, T.CATCH + 200, t), pm = this.palm, hw = this.headWc, k = this.k, TL = this.gridTL();
      const e = Ease.outCubic(u), step = this.u;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + Math.PI / 8, c = Math.cos(a), sn = Math.sin(a);
        const r0 = hw * (0.26 + 0.3 * e), len = hw * (i % 2 ? 0.12 : 0.2) * (1 - 0.6 * u);
        let j = 0;
        for (let dd = 0; dd <= len; dd += step, j++) {
          const q = this.snapArt(TL, pm.x + c * (r0 + dd), pm.y + sn * (r0 + dd));
          ctx.fillStyle = rgba(j ? RGB.blue : RGB.cyan, 0.95 * (1 - u * u));
          ctx.fillRect(q.x + ox, q.y + oy, k, k);
        }
      }
    },

    // the impact's ground beat (on release, <= 150ms): art-pixel chips kicked low along the link's baseline
    // and 3 short horizontal streaks, all within 1.5 head widths. Never a closed outline round the target.
    drawDust(ctx, t) {
      if (this.shockAt == null || this.ff || t >= this.shockAt + 150) return;
      const u = prog(this.shockAt, this.shockAt + 150, t), dt = (t - this.shockAt) / 1000, D = this.dust, sq = Math.max(1, this.u);
      for (const c of D.chips) {
        const x = c.x + c.vx * dt, y = Math.min(D.y, D.y + c.vy * dt + 0.5 * 2200 * dt * dt);
        ctx.fillStyle = rgba(c.c, 1 - u * u);
        ctx.fillRect(Math.round(x - sq / 2), Math.round(y - sq), sq, sq);
      }
      ctx.lineCap = 'butt';
      for (const st of D.streaks) {
        const x0 = st.x + st.dir * st.len * 1.4 * u, len = st.len * (1 - 0.5 * u);
        ctx.strokeStyle = rgba([60, 44, 32], 0.6 * (1 - u)); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x0, D.y + st.dy); ctx.lineTo(x0 + st.dir * len, D.y + st.dy); ctx.stroke();
      }
      ctx.lineCap = 'round';
    },

    // manga speed lines converging on the link, as 1-art-px ink and cobalt dashes on the impact pose's art grid
    drawSpeedLines(ctx, t, ox, oy) {
      if (t < T.SPEED || t >= T.IMPACT + 30 || this.ff) return;
      if (!this.speed) {
        const r = this.rand;
        this.speed = [];
        for (let i = 0; i < 14; i++) this.speed.push({ a: r() * TAU, len: r.range(50, 130), ink: r() < 0.6 });
      }
      const u = prog(T.SPEED, T.IMPACT + 30, t), rin = lerp(170, 40, Ease.outQuad(u)), a = 0.9 * (1 - prog(T.IMPACT, T.IMPACT + 30, t));
      const k = this.k, step = 2 * this.u, P = this.P;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = a;
      for (const s of this.speed) {
        const c = Math.cos(s.a), sn = Math.sin(s.a);
        ctx.fillStyle = s.ink ? '#141030' : '#0058f8';
        for (let dd = 0; dd < s.len; dd += step) {
          const q = this.snapArt(this.TLi, P.x + c * (rin + dd), P.y + sn * (rin + dd));
          ctx.fillRect(q.x + ox, q.y + oy, k, k);
        }
      }
      ctx.globalAlpha = 1;
      ctx.setTransform(this.pxDpr, 0, 0, this.pxDpr, this.shake.x * this.pxDpr, this.shake.y * this.pxDpr);
    },
    // the sky bolt's starburst: 8 rays of art-pixel dashes off the head for 130ms (white at the root, then sky,
    // azure and cobalt, so they read on the bolt glow and on the white page)
    drawSkyBurst(ctx, t, ox, oy) {
      if (this.skyAt == null || t < this.skyAt || t >= this.skyAt + 130 || this.ff) return;
      const u = prog(this.skyAt, this.skyAt + 130, t), h = this.headNow() || this.skyTarget, hw = this.headWc, k = this.k, TL = this.gridTL();
      const e = Ease.outCubic(u), step = Math.max(this.u, 3);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1 - u * u;
      for (let i = 0; i < 8; i++) {
        const an = (i / 8) * TAU + 0.2, c = Math.cos(an), sn = Math.sin(an);
        const r0 = hw * (0.5 + 0.35 * e), len = hw * (i % 2 ? 0.35 : 0.7) * (1 - 0.45 * u);
        let j = 0;
        for (let dd = 0; dd <= len; dd += step, j++) {
          const q = this.snapArt(TL, h.x + c * (r0 + dd), h.y + sn * (r0 + dd) * 0.8);
          ctx.fillStyle = j === 0 ? '#fcfcfc' : j < 3 ? '#3cbcfc' : j < 5 ? '#0078f8' : '#0058f8';
          ctx.fillRect(q.x + ox, q.y + oy, k, k);
        }
      }
      ctx.globalAlpha = 1;
    },

    // pixel twinkles: where the sky bolt touches the hammer, the head's last wink as it dissolves, and the
    // final glint as the arm is gone
    drawGlints(ctx, t, ox, oy) {
      if (this.ff) return;
      const TL = this.gridTL();
      const star = (x, y, arm, a) => { const q = this.snapArt(TL, x, y); this.pixStar(ctx, q.x + ox, q.y + oy, arm, a); };
      if (this.skyAt != null && t < this.skyAt + 160) { const u = prog(this.skyAt, this.skyAt + 160, t); star(this.skyTarget.x, this.skyTarget.y - 2 * this.u, u < 0.4 ? 3 : u < 0.75 ? 2 : 1, 1 - u * u); }
      if (t >= T.GLINT2 && t < T.GLINT2 + 120) {
        const u = prog(T.GLINT2, T.GLINT2 + 120, t), h = this.headNow() || this.lastHead || this.P;
        star(h.x, h.y, u < 0.5 ? 2 : 1, 1 - u);
      }
      if (this.goneAt != null && t < this.goneAt + 200) {
        const u = prog(this.goneAt, this.goneAt + 200, t), h = this.lastHead || this.headImpact;
        star(h.x, h.y, u < 0.5 ? 1 : 0, 1 - u);
      }
    },

    // over = false: every spark and trail square (under the sprites); true: only the hand's snapped motes
    drawCrispParticles(ctx, t, ox, oy, over) {
      const pl = this.pools, d = this.pxDpr;
      const TL = this.pose ? this.pose.TL : null;
      for (const p of pl.sparks.live) {
        const u = p.age / p.life;
        if (!!(p.snap && TL) !== over) continue;
        if (p.sq) {
          ctx.fillStyle = rgba(p.col, 1 - u * u);
          if (p.snap && TL) {
            // motes that belong to the hand sit on its art grid, and never on top of its opaque pixels
            const q = this.snapArt(TL, p.x, p.y), k = this.k, f = this.hd.f[this.pose.frame], m = alphaMap(f.cv);
            let ax = Math.round((q.x - TL.x) / k);
            const ay = Math.round((q.y - TL.y) / k);
            if (this.side < 0) ax = f.W - 1 - ax;
            if (m && ax >= 0 && ay >= 0 && ax < m.w && ay < m.h && m.a[ay * m.w + ax] > 32) continue;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.fillRect(q.x + ox, q.y + oy, k, k);
            ctx.setTransform(d, 0, 0, d, this.shake.x * d, this.shake.y * d);
          } else ctx.fillRect(Math.round(p.x - p.sq / 2), Math.round(p.y - p.sq / 2), p.sq, p.sq);
          continue;
        }
        const sx = p.vx * 0.016, sy = p.vy * 0.016, L = Math.hypot(sx, sy);
        const f = L > 26 ? 26 / L : L < 2 ? (L ? 2 / L : 0) : 1;
        ctx.beginPath(); ctx.moveTo(p.x - sx * f, p.y - sy * f); ctx.lineTo(p.x + 0.01, p.y);
        if (!this.lowQ) { ctx.strokeStyle = rgba(p.col, 0.2 * (1 - u)); ctx.lineWidth = p.w * 3; ctx.stroke(); }
        ctx.strokeStyle = rgba(p.col, 1 - u * u);
        ctx.lineWidth = p.w;
        ctx.stroke();
      }
      if (over) return;
      for (const p of pl.trail.live) {
        const u = p.age / p.life;
        ctx.fillStyle = rgba(p.col, 1 - u * u);
        ctx.fillRect(Math.round(p.x - p.size / 2), Math.round(p.y - p.size / 2), p.size, p.size);
      }
    },

    drawDebug(ctx, t) {
      const mark = (p, col, label) => {
        if (!p) return;
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(p.x - 6, p.y); ctx.lineTo(p.x + 6, p.y); ctx.moveTo(p.x, p.y - 6); ctx.lineTo(p.x, p.y + 6); ctx.stroke();
        ctx.font = '10px monospace'; ctx.fillText(label, p.x + 7, p.y - 6);
      };
      ctx.globalCompositeOperation = 'source-over';
      mark(this.Q, '#ff00ff', 'Q (home root)');
      mark(this.P, '#ff3030', "P'");
      mark(this.palm, '#30ff30', 'palm');
      mark(this.B, '#8080ff', 'buzz');
      mark(this.skyTarget, '#00ffff', 'sky');
      const p = this.pose;
      if (p) {
        const f = this.hd.f[p.frame];
        mark(this.ptCss(p.frame, p.TL, f.root), '#ffff00', 'root ' + p.frame);
        if (f.wrist) mark(this.ptCss(p.frame, p.TL, f.wrist), '#00ffff', 'wrist');
        if (f.sf) mark(this.ptCss(p.frame, p.TL, f.sf), '#ff8000', 'strikeFace');
        if (f.headC) mark(this.ptCss(p.frame, p.TL, f.headC), '#ffffff', 'head');
      }
      if (this.fly) mark(this.fly, '#8080ff', 'grip');
      ctx.font = '11px monospace';
      ctx.fillStyle = '#c000c0';
      ctx.fillText('k=' + this.k + ' u=' + Math.round(this.u * 100) / 100 + ' head=' + Math.round(this.hk.headW * this.u) + 'px pre=' + this.pre.join(',') + ' impact=' + this.impF + ' t=' + Math.round(t), 8, this.vh - 10);
    },
  });

  /* ====================================================================
   * 17. REDUCED MOTION: no arm, flight, bolts, shake or flash.
   *     The cross-fade starts in the click task (a layer in the page colour, 150ms) and the next page drops
   *     into it as soon as renderNext resolves (usually during the fade); the commit follows the fade, so
   *     click to done stays under 300ms even when the page takes a moment to build. One soft crackle at most.
   * ==================================================================== */
  Object.assign(Strike.prototype, {
    runReduced() {
      this.injectStyle(true);
      if (this.isCard) this.setAttr(this.anchor, 'data-thor-kind', 'card');
      this.setAttr(this.anchor, 'data-thor-state', 'charged');
      this.setAttr(this.busyEl(), 'aria-busy', 'true');
      this.lockScroll();
      this.on(global, 'hashchange', () => this.onNav('hashchange'));
      this.dispatch('thor:start', 0);
      if (this.opts.sound !== false) sfx('crackle', 120);
      this.watchdog = global.setTimeout(() => this.finishNow('watchdog'), 4000);
      const L = doc.createElement('div');
      L.className = ('thor-next-layer ' + (this.opts.layerClass || '')).trim();
      L.setAttribute('aria-hidden', 'true');
      L.setAttribute('inert', '');
      L.style.cssText = [
        'position:fixed', 'left:0', 'top:0', 'overflow:hidden', 'pointer-events:none', 'z-index:2147483000',
        'width:' + this.layerW + 'px', 'height:' + this.vh + 'px', 'opacity:0',
        'background:' + (this.opts.layerBackground || this.pageBg),
        'transition:opacity 150ms cubic-bezier(.23,1,.32,1)',
      ].join(';');
      doc.body.appendChild(L);
      this.layer = L; this.mounted = true; this.isCover = true;
      void L.offsetWidth; // commit the opacity:0 start state before fading in
      L.style.opacity = '1';
      let el, faded = false, done = false;
      const tryCommit = () => {
        if (done || this.finished || !faded || el === undefined) return;
        done = true;
        this.nextEl = el; this.isCover = !el;
        this.doCommit();
        global.setTimeout(() => this.finish(), 16);
      };
      global.setTimeout(() => { faded = true; tryCommit(); }, 160);
      const decide = (e) => {
        if (el !== undefined || this.finished) return;
        global.clearTimeout(cap);
        el = e && e.nodeType === 1 ? e : null;
        L.appendChild(el || this.makeCover());
        tryCommit();
      };
      // the page has 180ms to arrive (the host is told: deadlineMs 150); after that the strike commits without it
      // and lets the host render the route itself, so click to done stays under 300ms on any device
      const cap = global.setTimeout(() => decide(null), 180);
      if (typeof this.opts.renderNext === 'function') {
        Promise.resolve().then(() => this.opts.renderNext(this.href, { reduced: true, deadlineMs: 150, whenQuiet })).then(decide, () => decide(null));
      } else decide(null);
    },
  });

  /* ====================================================================
   * 18. PUBLIC API
   * ==================================================================== */
  function eligible(a) {
    const href = a.getAttribute('href');
    if (href == null || href === '' || href === '#' || /^\s*javascript:/i.test(href)) return false;
    const target = (a.getAttribute('target') || '').toLowerCase();
    if (target && target !== '_self' && target !== '_top' && target !== '_parent') return false; // _blank, named frames
    if (a.hasAttribute('download')) return false;
    if (a.closest('[data-thor="off"]')) return false;
    return true;
  }

  // warm the expensive caches (scale-1 kits, template matches, soft sprites, bolt brushes) while idle, one step
  // per idle slot (several when the slot has time left), so a tap during load never waits behind all of it
  function prewarm() {
    const steps = [
      () => getHammerKit(),
      () => { if (NS.Hand && typeof NS.Hand.create === 'function') NS.Hand.create(1); },
      () => getHandKit(),
      () => { for (let i = 0; i < 4; i++) pixFlame(i); for (const c of BOLT_COL) brush(c); },
    ];
    let i = 0;
    const ric = typeof global.requestIdleCallback === 'function';
    const run = (dl) => {
      try {
        do { steps[i++](); } while (i < steps.length && dl && typeof dl.timeRemaining === 'function' && dl.timeRemaining() > 12);
      } catch (e) { i = steps.length; /* best effort */ }
      if (i < steps.length) schedule();
    };
    const schedule = () => { if (ric) global.requestIdleCallback(run, { timeout: 1200 }); else global.setTimeout(run, 120); };
    schedule();
  }

  function attach(options) {
    const base = Object.assign({}, options || {});
    const root = base.root || doc;
    attachedOpts = base;
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      let tg = e.target;
      if (tg && tg.nodeType !== 1) tg = tg.parentElement;
      if (!tg || !tg.closest) return;
      const sel = base.selector || API.defaults.selector || DEFAULTS.selector;
      const a = tg.closest(sel);
      if (!a || (root !== doc && !root.contains(a))) return;
      if (!eligible(a)) return;
      e.preventDefault();
      // a strike that has already committed (only its embers settle on the new page) is finished at once and
      // the new click strikes; no stacking otherwise: a deliberate click during a strike skips it, the rest of a
      // double click does not
      if (current && current.committed) current.finish({ reason: 'replaced' });
      if (current) { if (!current.sameGesture(e)) current.fastForward(); return; }
      strike(a, a.getAttribute('href'), Object.assign({}, base, { _event: { clientX: e.clientX, clientY: e.clientY, detail: e.detail } }));
    };
    root.addEventListener('click', onClick);
    attachCount++;
    // prime audio on the first press anywhere: the AudioContext and its buffers are built during the
    // press (pointerdown precedes click), not in the click task that must paint the lock-on within 16ms
    const prime = () => {
      global.removeEventListener('pointerdown', prime, true);
      global.removeEventListener('keydown', prime, true);
      if (base.sound !== false && API.defaults.sound !== false) sfx('unlock');
    };
    global.addEventListener('pointerdown', prime, true);
    global.addEventListener('keydown', prime, true);
    prewarm();
    let detached = false;
    return function detach() {
      if (detached) return;
      detached = true;
      root.removeEventListener('click', onClick);
      global.removeEventListener('pointerdown', prime, true);
      global.removeEventListener('keydown', prime, true);
      if (attachedOpts === base) attachedOpts = null;
      // an unmounting host never gets a commit into a dead tree: a running strike is dropped
      if (current) { try { current.abort('detach'); } catch (e) { /* no-op */ } }
      if (--attachCount <= 0) {
        attachCount = 0;
        if (liveRegion && liveRegion.parentNode) liveRegion.parentNode.removeChild(liveRegion);
        liveRegion = null;
      }
    };
  }

  // href is passed through as written (e.g. '#/wiki/thor'). Any element can be the target (e.g. a
  // search submit button); options default to the ones given to attach().
  function strike(targetEl, href, options) {
    if (current && current.committed) current.finish({ reason: 'replaced' });
    if (current) return Promise.resolve({ href, ms: 0, committed: false, aborted: false, skipped: true });
    if (!targetEl || targetEl.nodeType !== 1) return Promise.reject(new TypeError('ThorLink.strike: a target element is required'));
    const opts = Object.assign({}, DEFAULTS, API.defaults, attachedOpts || {}, options || {});
    if (href == null) href = targetEl.getAttribute('href') || targetEl.href || '';
    const run = new Strike(targetEl, String(href), opts, opts._event || null);
    current = run;
    try {
      return run.start();
    } catch (e) {
      console.error('[ThorLink] strike failed to start, navigating plainly', e);
      try { run.finishNow('error'); } catch (e2) { /* ignore */ }
      if (current === run) current = null;
      return run.promise || Promise.resolve({ href, ms: 0, committed: false, aborted: true });
    }
  }

  const API = {
    version: '3.4.0',
    attach,
    strike,
    isRunning: () => !!current,
    // 'idle' | 'running' | 'committed' (committed: the next page is in, only the embers are settling; a new
    // strike finishes it at once)
    state: () => (!current ? 'idle' : current.committed ? 'committed' : 'running'),
    skip: () => { if (current) current.fastForward(); },
    abort: (reason) => { if (current && !current.committed) { try { current.abort(reason || 'host'); } catch (e) { /* no-op */ } } },
    // run fn in a quiet beat of the running strike (at once when none is running): for host work that blocks
    whenQuiet,
    prewarm,
    defaults: Object.assign({}, DEFAULTS),
    timeline: T,
    // the main-clock cue sheet as { at, name, ms, ...options } (audio.js renders its default soundtrack from it)
    cueSheet: [{ at: 0, name: 'crackle', ms: 80 }].concat(CUES.map((c) => Object.assign({ at: c[0], name: c[1] }, c[2] != null ? { ms: c[2] } : {}, c[5] && typeof c[5] === 'object' ? c[5] : {})))
      .concat([{ at: T.SURGE, name: 'rumble', ms: 500 }, { at: T.SURGE, name: 'crackle', ms: 250 }]),
    get stats() { return lastStats; },
    debug: () => (current && !current.reduced && current.hk ? current.info() : lastStats),
    _kits: () => ({ hammer: getHammerKit(), hand: getHandKit() }),
  };
  NS.ThorLink = API;
})(typeof window !== 'undefined' ? window : undefined);

  return ENGINE;
}


/* ---------------- React API ---------------- */

let engineCache: any = null;
function getEngine(): any {
  if (typeof window === "undefined") return null;
  if (!engineCache) engineCache = buildEngine(window);
  return engineCache;
}

export type ThorStrikeState = "idle" | "running" | "committed";

export type ThorStrikeResult = {
  href: string;
  ms: number;
  committed: boolean;
  aborted: boolean;
  skipped?: boolean;
};

export type ThorStrikeOptions = {
  /** Runs at the commit beat with the href. Without it the browser navigates to the href. */
  onNavigate?: (href: string) => void;
  /** Viewport point the click came from (defaults to the target's centre). */
  clientX?: number;
  clientY?: number;
};

export type ThorStrikeApi = {
  /** Strike any element (a link, a submit button). Resolves when the strike is done. */
  strike: (target: Element, href: string, options?: ThorStrikeOptions) => Promise<ThorStrikeResult | null>;
  /** Fast-forward the running strike: the commit lands within about 450ms. */
  skip: () => void;
  /** Drop a strike that has not committed yet, without navigating. */
  cancel: () => void;
  isRunning: () => boolean;
  state: () => ThorStrikeState;
};

export type ThorLinkProviderProps = {
  children?: ReactNode;
  /** Web Audio sound effects, started only after a user gesture. Default true. */
  sound?: boolean;
  /** Multiplies the hammer size (head width 120px on desktop, 105px on tablets, 90px on phones). Default 1. */
  scale?: number;
  /**
   * Awaited (at most 1.5s) before the page burns through, for example to
   * fetch the next route's data. The arm keeps hovering while it runs.
   */
  reveal?: (href: string) => Promise<void> | void;
  /** "auto" follows prefers-reduced-motion. "always" forces the 300ms crossfade. Default "auto". */
  reducedMotion?: "auto" | "always" | "never";
};

type Settings = Required<Pick<ThorLinkProviderProps, "sound" | "scale" | "reducedMotion">> &
  Pick<ThorLinkProviderProps, "reveal">;

const REVEAL_CAP_MS = 1500;

function createRunner(read: () => Settings): ThorStrikeApi & { owns: (el: Element) => boolean } {
  let active: Element | null = null;
  const api = {
    strike(target: Element, href: string, options: ThorStrikeOptions = {}) {
      const E = getEngine();
      if (!E) return Promise.resolve(null);
      const TL = E.ThorLink;
      if (TL.state() === "running") {
        TL.skip();
        return Promise.resolve(null);
      }
      const s = read();
      const vw = window.innerWidth;
      const base = vw < 600 ? 90 : vw < 1024 ? 105 : 120;
      const r = target.getBoundingClientRect();
      const opts: any = {
        sound: s.sound,
        reducedMotion: s.reducedMotion,
        hammerSize: Math.max(48, Math.round(base * (s.scale > 0 ? s.scale : 1))),
        _event: {
          clientX: options.clientX ?? r.left + r.width / 2,
          clientY: options.clientY ?? r.top + r.height / 2,
          detail: 1,
        },
      };
      const onNavigate = options.onNavigate;
      if (onNavigate) {
        opts.renderNext = async (h: string) => {
          if (s.reveal) {
            let timer = 0;
            await Promise.race([
              Promise.resolve()
                .then(() => s.reveal!(h))
                .catch(() => undefined),
              new Promise<void>((res) => {
                timer = window.setTimeout(res, REVEAL_CAP_MS);
              }),
            ]);
            window.clearTimeout(timer);
          }
          const sheet = document.createElement("div");
          sheet.style.cssText = "position:absolute;inset:0";
          return sheet;
        };
        opts.commit = (h: string) => {
          flushSync(() => onNavigate(h));
        };
      }
      active = target;
      const done = (res: ThorStrikeResult) => {
        if (active === target) active = null;
        return res;
      };
      return Promise.resolve(TL.strike(target, href, opts)).then(done);
    },
    skip() {
      getEngine()?.ThorLink.skip();
    },
    cancel() {
      getEngine()?.ThorLink.abort("cancel");
    },
    isRunning() {
      return !!getEngine()?.ThorLink.isRunning();
    },
    state(): ThorStrikeState {
      return getEngine()?.ThorLink.state() ?? "idle";
    },
    owns(el: Element) {
      return active === el;
    },
  };
  return api;
}

const DEFAULTS: Settings = { sound: true, scale: 1, reducedMotion: "auto", reveal: undefined };
const defaultRunner = createRunner(() => DEFAULTS);
const ThorContext = createContext<ReturnType<typeof createRunner>>(defaultRunner);

export function ThorLinkProvider({
  children,
  sound = true,
  scale = 1,
  reveal,
  reducedMotion = "auto",
}: ThorLinkProviderProps) {
  const settings = useRef<Settings>({ sound, scale, reveal, reducedMotion });
  settings.current = { sound, scale, reveal, reducedMotion };
  const runner = useMemo(() => createRunner(() => settings.current), []);

  // Build the sprite kits in idle time, and open the audio context on the first press (a user gesture).
  useEffect(() => {
    const E = getEngine();
    if (!E) return;
    try {
      E.ThorLink.prewarm();
    } catch {
      /* best effort */
    }
    const prime = () => {
      window.removeEventListener("pointerdown", prime, true);
      window.removeEventListener("keydown", prime, true);
      if (settings.current.sound) {
        try {
          E.Audio && E.Audio.unlock();
        } catch {
          /* audio never breaks the visual */
        }
      }
    };
    window.addEventListener("pointerdown", prime, true);
    window.addEventListener("keydown", prime, true);
    return () => {
      window.removeEventListener("pointerdown", prime, true);
      window.removeEventListener("keydown", prime, true);
      runner.cancel();
    };
  }, [runner]);

  return <ThorContext.Provider value={runner}>{children}</ThorContext.Provider>;
}

/** Strike from your own code: `const thor = useThorStrike(); thor.strike(button, "/next", { onNavigate })`. */
export function useThorStrike(): ThorStrikeApi {
  return useContext(ThorContext);
}

export type ThorLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  /** Runs at the commit beat (about 4.1s) with the href. Without it the browser navigates there. */
  onNavigate?: (href: string) => void;
  /** Called once per href on hover, focus or press, so the next route can start loading early. */
  onPrefetch?: (href: string) => void;
  children?: ReactNode;
};

function passesThrough(e: ReactMouseEvent<HTMLAnchorElement>, a: HTMLAnchorElement) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return true;
  const target = (a.getAttribute("target") || "").toLowerCase();
  if (target && target !== "_self" && target !== "_top" && target !== "_parent") return true;
  if (a.hasAttribute("download")) return true;
  const href = a.getAttribute("href");
  if (!href || href === "#" || /^\s*javascript:/i.test(href)) return true;
  return false;
}

export const ThorLink = forwardRef<HTMLAnchorElement, ThorLinkProps>(function ThorLink(
  { href, onNavigate, onPrefetch, onClick, onPointerEnter, onPointerDown, onFocus, children, ...rest },
  forwarded,
) {
  const runner = useContext(ThorContext);
  const own = useRef<HTMLAnchorElement | null>(null);
  const prefetched = useRef<string | null>(null);

  const setRef = useCallback(
    (el: HTMLAnchorElement | null) => {
      own.current = el;
      if (typeof forwarded === "function") forwarded(el);
      else if (forwarded) forwarded.current = el;
    },
    [forwarded],
  );

  const prefetch = () => {
    if (!onPrefetch || prefetched.current === href) return;
    prefetched.current = href;
    onPrefetch(href);
  };

  // An unmounted link never gets a commit into a dead tree.
  useEffect(
    () => () => {
      const el = own.current;
      if (el && runner.owns(el) && runner.state() === "running") runner.cancel();
    },
    [runner],
  );

  return (
    <a
      {...rest}
      ref={setRef}
      href={href}
      data-thor-link=""
      onPointerEnter={(e: ReactPointerEvent<HTMLAnchorElement>) => {
        onPointerEnter?.(e);
        prefetch();
      }}
      onPointerDown={(e: ReactPointerEvent<HTMLAnchorElement>) => {
        onPointerDown?.(e);
        prefetch();
      }}
      onFocus={(e: ReactFocusEvent<HTMLAnchorElement>) => {
        onFocus?.(e);
        prefetch();
      }}
      onClick={(e: ReactMouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        const a = e.currentTarget;
        if (passesThrough(e, a)) return;
        e.preventDefault();
        prefetch();
        const keyboard = e.detail === 0;
        void runner.strike(a, href, {
          onNavigate,
          clientX: keyboard ? undefined : e.clientX,
          clientY: keyboard ? undefined : e.clientY,
        });
      }}
    >
      {children}
    </a>
  );
});
