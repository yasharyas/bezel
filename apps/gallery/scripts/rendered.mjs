/**
 * Rendered contrast: what the components actually paint, measured in a
 * browser. Shared by scripts/check-rendered.mjs (the browser run, which writes
 * the record) and scripts/check-rendered-record.mjs (the build gate, which
 * reads it).
 *
 * The token gate and the gallery gate measure colours as declared. Neither can
 * see a colour a component hard-codes, a demo's own styling, or an opacity
 * stacked three wrappers up. This measures the pixels' inputs as the browser
 * resolved them: every visible text node, every icon, every focus ring and
 * every form-control boundary inside each component preview.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const galleryRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
export const repoRoot = join(galleryRoot, "..", "..");
export const RECORD_PATH = join(galleryRoot, "src", "lib", "rendered-contrast.json");

/* ------------------------------------------------------------- fingerprint */

/**
 * Everything that decides what colour a preview paints. If any of it changes,
 * the record no longer describes the gallery and the build refuses it until
 * the browser run is repeated.
 */
export const FINGERPRINT_INPUTS = [
  "packages/ui/src",
  "apps/gallery/src/previews",
  "apps/gallery/src/components/preview",
  "apps/gallery/src/app/(frame)",
  "apps/gallery/src/app/globals.css",
  "apps/gallery/tailwind.config.js",
  "apps/gallery/scripts/rendered.mjs",
  "apps/gallery/scripts/check-rendered.mjs",
];

export function fingerprint() {
  const files = [];
  const walk = (abs) => {
    if (statSync(abs).isDirectory()) {
      for (const name of readdirSync(abs).sort()) walk(join(abs, name));
    } else if (/\.(tsx?|jsx?|mjs|css)$/.test(abs)) {
      files.push(abs);
    }
  };
  for (const input of FINGERPRINT_INPUTS) walk(join(repoRoot, input));
  const hash = createHash("sha256");
  for (const file of files.sort()) {
    // Line endings are normalised so a Windows checkout and CI agree.
    hash.update(relative(repoRoot, file).split(sep).join("/"));
    hash.update("\0");
    hash.update(readFileSync(file, "utf8").replace(/\r\n/g, "\n"));
    hash.update("\0");
  }
  return { hash: hash.digest("hex").slice(0, 16), files: files.length };
}

/* ------------------------------------------------------ in-page measurement */

/**
 * Runs inside the preview's document (the stage on /component/<slug>, or the
 * iframe document for frame previews). Serialised by Playwright, so it must
 * not close over anything outside itself.
 *
 * The bars are WCAG 2.2 AA: text 4.5:1, or 3:1 at 24px, or 18.66px bold;
 * icons, focus rings and control edges 3:1 (1.4.11).
 *
 * For each thing it measures it asks the browser which elements are painted
 * at that point (`elementsFromPoint`, in paint order), then composites their
 * background colours bottom to top with each opacity group applied the way
 * the compositor applies it. That yields two pixels, one under a glyph and one
 * beside it, and the ratio is taken between those. Siblings positioned behind
 * the text count, overlays in front of it count, and so does an opacity on any
 * ancestor. A background image, gradient, canvas, video, image or SVG shape in
 * that stack makes the pair "not measurable": it is reported, never guessed.
 */
export function measureInPage(opts) {
  const doc = document;
  const root = opts.root ? doc.querySelector(opts.root) : doc.body;
  if (!root) return { error: `no element matches ${opts.root}` };

  /* ---------------------------------------------------------------- setup */

  // Hit testing must see every layer, including pointer-events: none overlays
  // and inert subtrees. Both are restored before returning.
  const force = doc.createElement("style");
  force.textContent = "*,*::before,*::after{pointer-events:auto!important}";
  doc.head.appendChild(force);
  const inert = [...root.querySelectorAll("[inert]")];
  for (const el of inert) el.removeAttribute("inert");

  const csCache = new Map();
  const cs = (el) => {
    let s = csCache.get(el);
    if (!s) csCache.set(el, (s = getComputedStyle(el)));
    return s;
  };

  /* --------------------------------------------------------------- colour */

  const canvas = doc.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const parsed = new Map();
  /** Any CSS colour to [r, g, b, a] in sRGB, via the browser's own conversion. */
  const parse = (value) => {
    if (!value || value === "none") return null;
    if (parsed.has(value)) return parsed.get(value);
    let out = null;
    const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)$/.exec(value);
    if (m) {
      const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : +m[4];
      out = [+m[1], +m[2], +m[3], a];
    } else if (value === "transparent") {
      out = [0, 0, 0, 0];
    } else if (!value.startsWith("url(")) {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.fillStyle = value;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      out = [d[0], d[1], d[2], d[3] / 255];
    }
    parsed.set(value, out);
    return out;
  };

  const TRANSPARENT = { r: 0, g: 0, b: 0, a: 0 };
  const premul = ([r, g, b, a]) => ({ r: r * a, g: g * a, b: b * a, a });
  // An unknown layer is one whose colour at the point cannot be read from
  // styles. "strict" ones (blend modes, colour filters) change the colours of
  // other layers too, so nothing about the pair can be said; the rest paint a
  // colour that is merely unknown, which can still be bounded (see settle).
  const unknown = (why, kind = "paint") => ({ unknown: true, why, kind, a: 1 });
  const scale = (c, k) => (k <= 0 ? TRANSPARENT : c.unknown ? c : { r: c.r * k, g: c.g * k, b: c.b * k, a: c.a * k });
  /** Premultiplied source-over. */
  const over = (top, bottom) => {
    if (top.a <= 0.001 && !top.unknown) return bottom;
    if (top.unknown) return top;
    if (top.a >= 0.999) return top;
    if (bottom.unknown) return bottom;
    const k = 1 - top.a;
    return { r: top.r + bottom.r * k, g: top.g + bottom.g * k, b: top.b + bottom.b * k, a: top.a + bottom.a * k };
  };
  const flat = (c) => {
    const o = over(c, { r: 255, g: 255, b: 255, a: 1 });
    return [o.r, o.g, o.b].map((v) => Math.round(Math.max(0, Math.min(255, v))));
  };
  const lum = ([r, g, b]) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)];
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  const hex = ([r, g, b]) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;

  /* --------------------------------------------------------------- layers */

  const REPLACED = new Set(["img", "video", "canvas", "iframe", "object", "embed"]);
  const SHAPES = new Set(["path", "circle", "rect", "ellipse", "line", "polyline", "polygon", "use", "image"]);

  /** What an element paints at a point that lies inside its box. */
  const paintOf = (el) => {
    const s = cs(el);
    const tag = el.localName;
    if (s.mixBlendMode && s.mixBlendMode !== "normal") return unknown(`mix-blend-mode: ${s.mixBlendMode}`, "strict");
    // A filter repaints the element and everything in it: a blur smears its
    // colour into a gradient, and the colour functions change it outright.
    // A drop shadow or a zero blur leaves the colour at this point alone.
    if (s.filter && s.filter !== "none") {
      const fns = s.filter.match(/[a-z-]+\([^)]*\)/g) ?? [];
      const identity = /^(blur\(0(px)?\)|(brightness|contrast|saturate|opacity)\(1\)|(grayscale|sepia|invert)\(0\)|hue-rotate\(0deg\))$/;
      const moves = fns.filter((f) => !/^drop-shadow/.test(f) && !identity.test(f));
      if (moves.length) return /^blur/.test(moves[0]) ? unknown("blurred layer", "blur") : unknown(`filter: ${moves[0]}`, "strict");
    }
    if (REPLACED.has(tag)) return unknown(tag === "img" ? "image" : tag);
    if (el instanceof SVGElement && tag !== "svg") {
      // Hit testing only returns an SVG shape where it actually paints.
      if (SHAPES.has(tag)) return unknown("svg shape");
      return TRANSPARENT;
    }
    if (s.backgroundImage && s.backgroundImage !== "none") {
      return unknown(/gradient\(/.test(s.backgroundImage) ? "gradient" : "background image");
    }
    const bg = parse(s.backgroundColor);
    return bg ? premul(bg) : TRANSPARENT;
  };

  const opacityOf = (el) => {
    const v = parseFloat(cs(el).opacity);
    return Number.isFinite(v) ? v : 1;
  };

  /** Ancestors-or-self with opacity < 1, outermost first: the opacity groups. */
  const groupCache = new Map();
  const groupsOf = (el) => {
    if (groupCache.has(el)) return groupCache.get(el);
    const chain = [];
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) if (opacityOf(e) < 1) chain.unshift(e);
    groupCache.set(el, chain);
    return chain;
  };

  /**
   * Composite entries (bottom to top), applying opacity groups as groups.
   * `sub`, when given, stands in for every unknown layer.
   */
  const composite = (entries, depth = 0, sub = null) => {
    let acc = TRANSPARENT;
    for (let i = 0; i < entries.length; ) {
      const g = entries[i].groups[depth];
      if (g) {
        let j = i;
        while (j < entries.length && entries[j].groups[depth] === g) j++;
        acc = over(scale(composite(entries.slice(i, j), depth + 1, sub), opacityOf(g)), acc);
        i = j;
      } else {
        const paint = entries[i].paint;
        acc = over(paint.unknown && sub ? sub : paint, acc);
        i++;
      }
    }
    return acc;
  };

  /**
   * Resolve the two pixels. When a layer's colour is unknown (an image, a
   * gradient, a blurred shape) it is replaced in turn by black, mid grey and
   * white. If that moves either pixel by no more than 10% of the range, the
   * layer is nearly covered and the worst of the three ratios is a guaranteed
   * floor, reported as such. Otherwise the pair is not measurable.
   */
  const settle = (bgEntries, fgEntries, anchor) => {
    const unknowns = [...bgEntries, ...fgEntries].filter((e) => e.paint.unknown);
    if (!unknowns.length) return { fg: flat(composite(fgEntries)), bg: flat(composite(bgEntries)) };
    // A blur on the mark's own ancestor blurs the mark itself.
    const strict = unknowns.find((e) => e.paint.kind === "strict" || (e.paint.kind === "blur" && e.el.contains(anchor)));
    if (strict) return { unknown: strict.paint.why };
    const pairs = [0, 128, 255].map((v) => {
      const sub = { r: v, g: v, b: v, a: 1 };
      return { fg: flat(composite(fgEntries, 0, sub)), bg: flat(composite(bgEntries, 0, sub)) };
    });
    const spread =
      Math.max(...[0, 1, 2].flatMap((i) => [pairs[2].fg[i] - pairs[0].fg[i], pairs[2].bg[i] - pairs[0].bg[i]].map(Math.abs))) / 255;
    if (spread > 0.1) return { unknown: unknowns[0].paint.why };
    const worst = pairs.reduce((a, b) => (ratio(a.fg, a.bg) <= ratio(b.fg, b.bg) ? a : b));
    // Less than one colour level of difference: the layer is fully covered.
    if (spread * 255 < 1) return worst;
    return { ...worst, bounded: `worst case over a ${unknowns[0].paint.why} ${Math.max(1, Math.round(spread * 100))}% visible` };
  };

  /**
   * Painted ::before / ::after layers of `el` that cover (x, y). Hit testing
   * reports a pseudo-element as its originating element, so these are looked
   * up by hand. An absolutely positioned pseudo-element is located from its
   * used box and 2D transform. One that cannot be located (a 3D transform, or
   * a containing block other than its element) is taken to cover the point
   * and makes the pair not measurable, rather than letting it pass.
   */
  const pseudoLayers = (el, x, y) => {
    if (!(el instanceof HTMLElement)) return [];
    const out = [];
    for (const which of ["::before", "::after"]) {
      const p = getComputedStyle(el, which);
      if (!p.content || p.content === "none" || p.content === "normal") continue;
      if (p.display === "none" || p.visibility === "hidden") continue;
      const op = parseFloat(p.opacity);
      if (!(op > 0)) continue;
      const image = p.backgroundImage && p.backgroundImage !== "none";
      const colour = parse(p.backgroundColor);
      if (!image && !(colour && colour[3] > 0)) continue;
      if (p.position !== "absolute" && p.position !== "fixed") continue;
      let located = false;
      if (cs(el).position !== "static" && !/matrix3d|perspective/.test(p.transform)) {
        const r = el.getBoundingClientRect();
        const s = cs(el);
        const left = r.left + (parseFloat(s.borderLeftWidth) || 0) + (parseFloat(p.left) || 0) + (parseFloat(p.marginLeft) || 0);
        const top = r.top + (parseFloat(s.borderTopWidth) || 0) + (parseFloat(p.top) || 0) + (parseFloat(p.marginTop) || 0);
        const w = ["width", "paddingLeft", "paddingRight", "borderLeftWidth", "borderRightWidth"].reduce((t, k) => t + (parseFloat(p[k]) || 0), 0);
        const h = ["height", "paddingTop", "paddingBottom", "borderTopWidth", "borderBottomWidth"].reduce((t, k) => t + (parseFloat(p[k]) || 0), 0);
        // A 2D transform moves the box about its transform-origin.
        let corners = [[left, top], [left + w, top], [left, top + h], [left + w, top + h]];
        const m = /^matrix\(([^)]+)\)$/.exec(p.transform);
        if (m) {
          const [a, b, c, d, e, f] = m[1].split(",").map(parseFloat);
          const [ox, oy] = p.transformOrigin.split(" ").map(parseFloat);
          corners = corners.map(([cx, cy]) => {
            const [dx, dy] = [cx - left - ox, cy - top - oy];
            return [left + ox + a * dx + c * dy + e, top + oy + b * dx + d * dy + f];
          });
        }
        if (p.transform === "none" || m) {
          located = true;
          const xs = corners.map((c) => c[0]);
          const ys = corners.map((c) => c[1]);
          if (!(x >= Math.min(...xs) && x <= Math.max(...xs) && y >= Math.min(...ys) && y <= Math.max(...ys))) continue;
        }
      }
      const masked = (p.webkitMaskImage && p.webkitMaskImage !== "none") || (p.maskImage && p.maskImage !== "none");
      let paint;
      if (!located) paint = unknown(`${which} layer of unknown extent`);
      else if (masked) paint = unknown(`masked ${which} layer`);
      else if (image) paint = unknown(/gradient\(/.test(p.backgroundImage) ? `${which} gradient` : `${which} image`);
      else paint = scale(premul(colour), op);
      out.push({ paint, above: (parseInt(p.zIndex, 10) || 0) > 0 });
    }
    return out;
  };

  /**
   * The two pixels at (x, y): with the mark painted just above `anchor`, and
   * without it. `skip` elements (the mark's own subtree) are left out.
   * `occluded`: an opaque layer in front hides the mark. `covered`: a
   * translucent layer over most of the page, a modal backdrop, dims it.
   */
  const pixelsAt = (x, y, anchor, mark, markOwner, skip) => {
    const stack = doc.elementsFromPoint(x, y);
    const at = stack.indexOf(anchor);
    if (at < 0) return { hidden: true };
    const under = [];
    const top = [];
    let covered = false;
    let occluded = false;
    for (let i = stack.length - 1; i >= 0; i--) {
      const el = stack[i];
      if (el === force) continue;
      const groups = groupsOf(el);
      if (i < at) {
        if (anchor.contains(el) || (skip && skip.contains(el))) continue;
        if (el.contains(anchor)) {
          // An ancestor reported above its descendant: one of its
          // pseudo-elements is stacked over the content.
          for (const layer of pseudoLayers(el, x, y)) if (layer.above) top.push({ el, paint: layer.paint, groups });
          continue;
        }
        const paint = paintOf(el);
        top.push({ el, paint, groups });
        const layers = pseudoLayers(el, x, y);
        for (const layer of layers) top.push({ el, paint: layer.paint, groups });
        // An image or canvas in front leaves the pair unknown, below. A solid
        // opaque layer in front hides the mark outright.
        const alpha = paint.unknown ? 0 : groups.reduce((t, g) => t * opacityOf(g), paint.a);
        if (alpha >= 0.98) occluded = true;
        else if (alpha > 0.02) {
          // A translucent layer over most of the document is a backdrop that
          // dims the page behind a modal. Anything smaller is part of the
          // design and is composited like any other layer.
          const b = el.getBoundingClientRect();
          if (b.width * b.height >= 0.5 * vw * vh) covered = true;
        }
        continue;
      }
      if (i > at && skip && skip !== anchor && skip.contains(el)) continue;
      under.push({ el, paint: paintOf(el), groups });
      for (const layer of pseudoLayers(el, x, y)) if (!(el.contains(anchor) && layer.above)) under.push({ el, paint: layer.paint, groups });
    }
    const markEntry = { el: markOwner, paint: mark, groups: groupsOf(markOwner) };
    return { ...settle([...under, ...top], [...under, markEntry, ...top], anchor), covered, occluded };
  };

  /* ---------------------------------------------------------- description */

  const describe = (el) => {
    const tag = el.localName;
    const raw = el.getAttribute("class") || "";
    const cls = raw
      .split(/\s+/)
      .filter((c) => c && !/^(hover|focus|group|peer|motion|md|sm|lg|xl|dark|active|disabled|aria|data):/.test(c))
      .slice(0, 4);
    return cls.length ? `${tag}.${cls.join(".")}` : tag;
  };
  const snippet = (text) => {
    const t = text.replace(/\s+/g, " ").trim();
    return t.length > 48 ? `${t.slice(0, 47)}…` : t;
  };

  const visuallyHidden = (el) => {
    for (let e = el; e && e !== root.parentElement; e = e.parentElement) {
      const s = cs(e);
      if (s.display === "none" || s.visibility === "hidden") return true;
      const r = e.getBoundingClientRect();
      if (s.position === "absolute" && r.width <= 1 && r.height <= 1) return true;
      if (/rect\(0(px)?,? 0(px)?,? 0(px)?,? 0(px)?\)/.test(s.clip)) return true;
    }
    return false;
  };

  const ariaHidden = (el) => !!el.closest('[aria-hidden="true"]');
  const disabled = (el) =>
    !!el.closest(":disabled, [aria-disabled='true']") ||
    !!el.closest("fieldset:disabled");

  /* ---------------------------------------------------------------- text */

  const items = [];
  const counts = { textNodes: 0, hidden: 0, offscreen: 0 };
  const vw = doc.documentElement.clientWidth;
  const vh = doc.documentElement.clientHeight;
  const inView = (x, y) => x >= 0 && y >= 0 && x < vw && y < vh;

  const byElement = new Map();
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.nodeValue || !n.nodeValue.trim()) continue;
    const el = n.parentElement;
    if (!el || ["script", "style", "noscript", "template", "title"].includes(el.localName)) continue;
    counts.textNodes++;
    if (!byElement.has(el)) byElement.set(el, []);
    byElement.get(el).push(n);
  }

  // aria-hidden text is decoration only when it repeats text a sighted reader
  // can already see (a depth layer, a marquee's loop copy). aria-hidden text
  // that is the only visible form of its words (per-letter spans with an
  // sr-only twin) is still text, and is gated as text.
  const norm = (t) => (t || "").toLowerCase().replace(/\s+/g, "");
  const corpus = [...byElement.keys()]
    .filter((e) => !ariaHidden(e) && !visuallyHidden(e))
    .map((e) => norm(e.textContent))
    .join("|");
  const duplicate = (el) => {
    let e = el;
    let k = norm(e.textContent);
    while (k.length < 3 && e.parentElement && root.contains(e.parentElement)) {
      e = e.parentElement;
      k = norm(e.textContent);
    }
    return k.length > 0 && corpus.includes(k);
  };
  const effectiveAlpha = (el, a) => groupsOf(el).reduce((t, g) => t * opacityOf(g), a);

  for (const [el, nodes] of byElement) {
    if (visuallyHidden(el)) {
      counts.hidden++;
      continue;
    }
    const s = cs(el);
    const isSvgText = el instanceof SVGElement;
    const text = nodes.map((n) => n.nodeValue).join(" ");
    // The colour a glyph is filled with.
    let glyph = null;
    let why = null;
    if (isSvgText) {
      if (/url\(/.test(s.fill)) why = "svg gradient fill";
      else {
        const f = parse(s.fill);
        if (f) glyph = [f[0], f[1], f[2], f[3] * (parseFloat(s.fillOpacity) || 0)];
      }
    } else {
      const fill = parse(s.webkitTextFillColor) || parse(s.color);
      if (fill && fill[3] === 0) {
        if (/text/.test(s.webkitBackgroundClip || s.backgroundClip)) why = "gradient text";
        else if (parseFloat(s.webkitTextStrokeWidth) > 0) why = "outlined text";
        else {
          counts.hidden++;
          continue;
        }
      } else glyph = fill;
    }
    // Faded out entirely (opacity 0 somewhere up the tree): not showing.
    if (glyph && effectiveAlpha(el, glyph[3]) < 0.05) {
      counts.hidden++;
      continue;
    }

    // Sample the first, middle and last line box.
    const rects = [];
    for (const n of nodes) {
      const range = doc.createRange();
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) if (r.width > 1 && r.height > 1) rects.push(r);
    }
    if (!rects.length) {
      counts.hidden++;
      continue;
    }
    const picks = [...new Set([rects[0], rects[Math.floor(rects.length / 2)], rects[rects.length - 1]])];
    let worst = null;
    let seen = false;
    let offscreen = true;
    let covered = false;
    let unknownWhy = why;
    for (const r of picks) {
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      if (!inView(x, y)) continue;
      offscreen = false;
      if (why) {
        const probe = pixelsAt(x, y, el, TRANSPARENT, el, null);
        if (!probe.hidden && !probe.occluded) seen = true;
        continue;
      }
      const px = pixelsAt(x, y, el, premul(glyph), el, null);
      if (px.hidden || px.occluded) continue;
      seen = true;
      if (px.covered) covered = true;
      if (px.unknown) {
        unknownWhy = unknownWhy || px.unknown;
        continue;
      }
      const value = ratio(px.fg, px.bg);
      if (!worst || value < worst.value) worst = { value, fg: px.fg, bg: px.bg, bound: px.bounded };
    }
    if (offscreen) {
      counts.offscreen++;
      continue;
    }
    if (!seen) {
      counts.hidden++;
      continue;
    }
    const size = parseFloat(s.fontSize);
    const weight = parseInt(s.fontWeight, 10) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    let status = worst ? "measured" : "unmeasurable";
    let reason = worst ? null : unknownWhy;
    if (ariaHidden(el) && duplicate(el)) status = "decorative";
    else if (disabled(el)) status = "disabled";
    else if (covered) {
      status = "exempt";
      reason = "behind an overlay such as a modal backdrop";
    }
    items.push({
      kind: "text",
      element: describe(el),
      text: snippet(text),
      size: Math.round(size * 10) / 10,
      weight,
      min: large ? 3 : 4.5,
      status,
      why: reason,
      fg: worst ? hex(worst.fg) : null,
      bg: worst ? hex(worst.bg) : null,
      ratio: worst ? Math.round(worst.value * 100) / 100 : null,
      ...(worst?.bound ? { bound: worst.bound } : {}),
    });
  }

  /* ------------------------------------------- placeholders and field text */

  for (const field of root.querySelectorAll("input, textarea, select")) {
    const type = (field.getAttribute("type") || "text").toLowerCase();
    if (field.localName === "input" && !/^(text|search|email|url|tel|password|number)$/.test(type)) continue;
    if (visuallyHidden(field)) continue;
    const r = field.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const x = r.left + Math.min(24, r.width / 2);
    const y = r.top + r.height / 2;
    if (!inView(x, y)) continue;
    const showingPlaceholder = "placeholder" in field && field.placeholder && !field.value;
    const s = showingPlaceholder ? getComputedStyle(field, "::placeholder") : cs(field);
    const value = showingPlaceholder ? field.placeholder : field.localName === "select" ? field.selectedOptions?.[0]?.text ?? "" : field.value;
    if (!value || !value.trim()) continue;
    const glyph = parse(s.webkitTextFillColor) || parse(s.color);
    if (!glyph) continue;
    const px = pixelsAt(x, y, field, premul(glyph), field, null);
    if (px.hidden || px.occluded) continue;
    const size = parseFloat(cs(field).fontSize);
    items.push({
      kind: "text",
      element: `${describe(field)}${showingPlaceholder ? "::placeholder" : ""}`,
      text: snippet(value),
      size,
      weight: parseInt(cs(field).fontWeight, 10) || 400,
      min: size >= 24 ? 3 : 4.5,
      status: disabled(field) ? "disabled" : px.covered ? "exempt" : px.unknown ? "unmeasurable" : "measured",
      why: px.covered ? "behind an overlay such as a modal backdrop" : px.unknown || null,
      fg: px.fg ? hex(px.fg) : null,
      bg: px.bg ? hex(px.bg) : null,
      ratio: px.fg ? Math.round(ratio(px.fg, px.bg) * 100) / 100 : null,
      ...(px.bounded ? { bound: px.bounded } : {}),
    });
  }

  /* ---------------------------------------------------------------- icons */

  const INTERACTIVE = "a[href], button, [role=button], [role=link], [role=tab], [role=menuitem], [role=switch], [role=checkbox], summary, label";
  const hasVisibleText = (el) => {
    const w = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (n.nodeValue.trim() && n.parentElement && !visuallyHidden(n.parentElement) && !ariaHidden(n.parentElement)) return true;
    }
    return false;
  };

  for (const svg of root.querySelectorAll("svg")) {
    if (svg.ownerSVGElement) continue; // nested svg
    if (visuallyHidden(svg)) continue;
    const r = svg.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    if (!inView(x, y)) continue;
    if (Math.max(r.width, r.height) > 64) continue; // illustrations, not icons
    if (effectiveAlpha(svg, 1) < 0.05) continue; // faded out
    // Every distinct paint the icon's visible shapes use. The icon is judged by
    // its most visible one, so a spinner's faint track does not fail it.
    const paints = new Map();
    let unknownWhy = null;
    for (const shape of svg.querySelectorAll("path, circle, rect, ellipse, line, polyline, polygon")) {
      const ss = getComputedStyle(shape);
      if (ss.display === "none" || ss.visibility === "hidden") continue;
      const strokeW = parseFloat(ss.strokeWidth) || 0;
      for (const [paint, alpha] of [
        [strokeW > 0 ? ss.stroke : "none", parseFloat(ss.strokeOpacity)],
        [ss.fill, parseFloat(ss.fillOpacity)],
      ]) {
        if (!paint || paint === "none") continue;
        if (/url\(/.test(paint)) {
          unknownWhy = "svg gradient paint";
          continue;
        }
        const c = parse(paint);
        if (!c || c[3] === 0) continue;
        const a = c[3] * (Number.isFinite(alpha) ? alpha : 1);
        if (a <= 0 || effectiveAlpha(shape, a) < 0.05) continue;
        // Two shapes in one colour at different opacities are different marks
        // (a spinner's faint track and its arc).
        const k = `${c.slice(0, 3).join(",")},${effectiveAlpha(shape, a).toFixed(3)}`;
        if (!paints.has(k)) paints.set(k, { mark: [c[0], c[1], c[2], a], owner: shape });
      }
    }
    const control = svg.closest(INTERACTIVE);
    const labelled = svg.closest('[role="img"][aria-label], [role="img"][aria-labelledby]') || svg.querySelector("title");
    // An icon is meaningful unless the component marks it aria-hidden, and
    // even then when it is the only thing identifying a control.
    let role;
    if (control && root.contains(control) && !hasVisibleText(control)) role = "icon-only control";
    else if (labelled) role = "labelled graphic";
    else if (!ariaHidden(svg)) role = "exposed graphic";
    else role = "decorative";
    const base = { kind: "icon", element: describe(svg), text: role, min: 3 };
    if (!paints.size) {
      if (unknownWhy) items.push({ ...base, status: role === "decorative" ? "decorative" : "unmeasurable", why: unknownWhy, fg: null, bg: null, ratio: null });
      continue;
    }
    let best = null;
    let covered = false;
    for (const { mark, owner } of [...paints.values()].slice(0, 4)) {
      const px = pixelsAt(x, y, svg, premul(mark), owner, svg);
      if (px.hidden || px.occluded) continue;
      if (px.covered) covered = true;
      if (px.unknown) {
        unknownWhy = unknownWhy || px.unknown;
        continue;
      }
      const value = ratio(px.fg, px.bg);
      if (!best || value > best.value) best = { value, fg: px.fg, bg: px.bg, bound: px.bounded };
    }
    if (!best && !unknownWhy) continue;
    let status = best ? "measured" : "unmeasurable";
    let why = best ? null : unknownWhy;
    if (role === "decorative") status = "decorative";
    else if (disabled(svg)) status = "disabled";
    else if (covered) {
      status = "exempt";
      why = "behind an overlay such as a modal backdrop";
    }
    items.push({
      ...base,
      status,
      why,
      fg: best ? hex(best.fg) : null,
      bg: best ? hex(best.bg) : null,
      ratio: best ? Math.round(best.value * 100) / 100 : null,
      ...(best?.bound ? { bound: best.bound } : {}),
    });
  }

  /* ---------------------------------------------- form control boundaries */

  const outside = (el, side, gap) => {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    return side === "left" ? [r.left - gap, cy] : side === "right" ? [r.right + gap, cy] : side === "top" ? [cx, r.top - gap] : [cx, r.bottom + gap];
  };
  /** The ground just outside an element: everything at that point but it. */
  const groundAt = (x, y, el) => {
    if (!inView(x, y)) return null;
    const stack = doc.elementsFromPoint(x, y).filter((e) => e !== force && !el.contains(e));
    const entries = stack.reverse().map((e) => ({ el: e, paint: paintOf(e), groups: groupsOf(e) }));
    const unknownLayer = entries.find((e) => e.paint.unknown);
    return unknownLayer ? { unknown: unknownLayer.paint.why } : { rgb: flat(composite(entries)) };
  };

  /** The ground an element sits on: the colour found on most of its four sides. */
  const groundOf = (el) => {
    const found = [];
    let why = null;
    for (const side of ["left", "right", "top", "bottom"]) {
      const g = groundAt(...outside(el, side, 3), el);
      if (!g) continue;
      if (g.unknown) why = g.unknown;
      else found.push(g.rgb);
    }
    if (!found.length) return why ? { unknown: why } : null;
    const tally = new Map();
    for (const rgb of found) tally.set(hex(rgb), [...(tally.get(hex(rgb)) ?? []), rgb]);
    const [top] = [...tally.values()].sort((a, b) => b.length - a.length || ratio(a[0], [255, 255, 255]) - ratio(b[0], [255, 255, 255]));
    return { rgb: top[0] };
  };

  /**
   * What identifies a control's edge: its strongest border side, or its own
   * fill against the ground. `drawn` is false when neither differs from the
   * ground at all, which is a control with no boundary rather than a faint one.
   */
  const boundaryOf = (el) => {
    const ground = groundOf(el);
    if (!ground) return null;
    if (ground.unknown) return { unknown: ground.unknown };
    const s = cs(el);
    const r = el.getBoundingClientRect();
    let best = null;
    const consider = (what, rgb) => {
      const v = ratio(rgb, ground.rgb);
      if (!best || v > best.value) best = { what, value: v, rgb };
    };
    for (const side of ["Top", "Right", "Bottom", "Left"]) {
      if (parseFloat(s[`border${side}Width`]) > 0 && s[`border${side}Style`] !== "none") {
        const c = parse(s[`border${side}Color`]);
        if (c && c[3] > 0) consider(`border-${side.toLowerCase()}`, flat(over(premul(c), premul([...ground.rgb, 1]))));
      }
    }
    const fill = pixelsAt(r.left + Math.min(6, r.width / 2), r.top + r.height / 2, el, TRANSPARENT, el, null);
    if (fill.unknown) return { unknown: fill.unknown };
    if (fill.bg) consider("fill", fill.bg);
    if (!best) return null;
    const sides = ["Top", "Right", "Bottom", "Left"].filter((side) => parseFloat(s[`border${side}Width`]) > 0 && s[`border${side}Style`] !== "none").length;
    return { ...best, ground: ground.rgb, drawn: best.value > 1.1, sides };
  };

  const FIELDS =
    "input:not([type=hidden]):not([type=range]):not([type=file]):not([type=submit]):not([type=button]):not([type=color]):not([type=image]):not([type=reset]), textarea, select, [role=textbox], [role=checkbox], [role=switch], [role=radio], [role=combobox]";
  for (const field of root.querySelectorAll(FIELDS)) {
    const s = cs(field);
    if (s.display === "none") continue;
    const box = /checkbox|radio/.test(field.getAttribute("type") || "") && field.localName === "input";
    // A native checkbox or radio is drawn by the browser, not the component.
    if (box && !visuallyHidden(field) && s.appearance !== "none") continue;
    // A visually hidden input is drawn by its peer: the element right after it,
    // or the label wrapping it.
    let target = field;
    if (visuallyHidden(field)) {
      target = field.nextElementSibling && !visuallyHidden(field.nextElementSibling) ? field.nextElementSibling : null;
      if (!target) continue;
    }
    const r = target.getBoundingClientRect();
    if (r.width < 4 || r.height < 4 || !inView(r.left + r.width / 2, r.top + r.height / 2)) continue;
    const name = field.getAttribute("aria-label") || field.getAttribute("placeholder") || field.getAttribute("role") || field.getAttribute("type") || field.localName;
    // A bare input inside a styled wrapper: the wrapper is the boundary.
    let measured = null;
    let owner = target;
    for (let e = target, depth = 0; e && depth < 3 && root.contains(e); e = e.parentElement, depth++) {
      const b = boundaryOf(e);
      if (!b) continue;
      // A wrapper counts as the field's edge only if it encloses it: a full
      // border or its own fill. A single rule under a header is a divider.
      if (e !== target && !b.unknown && b.what !== "fill" && b.sides < 4) continue;
      if (b.unknown || b.drawn) {
        measured = b;
        owner = e;
        break;
      }
    }
    const base = { kind: "boundary", element: describe(owner), min: 3 };
    if (!measured) {
      items.push({ ...base, text: name, status: "exempt", why: "no boundary drawn", fg: null, bg: null, ratio: null });
      continue;
    }
    if (measured.unknown) {
      items.push({ ...base, text: name, status: "unmeasurable", why: measured.unknown, fg: null, bg: null, ratio: null });
      continue;
    }
    items.push({
      ...base,
      text: `${name} (${owner === target ? "" : "wrapper "}${measured.what})`,
      status: disabled(field) ? "disabled" : "measured",
      why: null,
      fg: hex(measured.rgb),
      bg: hex(measured.ground),
      ratio: Math.round(measured.value * 100) / 100,
    });
  }


  /* ---------------------------------------------------------------- focus */

  // Focus rings, measured by focusing each control in turn. Only on request,
  // and after everything else, because focusing things can open menus.
  if (opts.focus) {
    const RING_SOURCES = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';
    const signature = (e) => {
      const s = cs(e);
      return [s.outlineStyle, s.outlineWidth, s.outlineColor, s.outlineOffset, s.boxShadow, s.borderColor, s.backgroundColor].join("|");
    };
    const settleTransitions = (els) => {
      for (const e of els) {
        for (const a of e.getAnimations()) {
          try {
            if (a.constructor.name === "CSSTransition") a.finish();
          } catch {
            /* not finishable */
          }
        }
      }
    };
    /** Outline and Tailwind-style box-shadow rings, each with where it sits relative to the edge. */
    const ringsOf = (e) => {
      const s = cs(e);
      const out = [];
      const ow = parseFloat(s.outlineWidth) || 0;
      if (s.outlineStyle !== "none" && ow > 0) {
        const c = parse(s.outlineColor);
        if (c && c[3] > 0) out.push({ c, what: "outline", from: parseFloat(s.outlineOffset) || 0, to: (parseFloat(s.outlineOffset) || 0) + ow });
      }
      if (s.boxShadow && s.boxShadow !== "none") {
        let previous = 0;
        for (const part of s.boxShadow.split(/,(?![^(]*\))/)) {
          const colour = /(rgba?\([^)]*\)|#[0-9a-f]{3,8}|color\([^)]*\)|oklch\([^)]*\))/i.exec(part)?.[1];
          if (!colour) continue;
          const inset = /\binset\b/.test(part);
          const nums = part.replace(colour, "").replace("inset", "").trim().split(/\s+/).map(parseFloat);
          const [dx = 0, dy = 0, blur = 0, spread = 0] = nums;
          if (dx !== 0 || dy !== 0 || blur !== 0 || spread <= 0) continue;
          const c = parse(colour);
          if (c && c[3] > 0) out.push({ c, what: inset ? "inset ring" : "ring", from: inset ? -spread : previous, to: inset ? 0 : spread });
          if (!inset) previous = Math.max(previous, spread);
        }
      }
      return out;
    };
    const around = (el) => {
      const list = [el, ...el.querySelectorAll("*")].slice(0, 20);
      let sib = el.nextElementSibling;
      for (let n = 0; sib && n < 2; n++, sib = sib.nextElementSibling) list.push(sib, ...[...sib.querySelectorAll("*")].slice(0, 12));
      for (let a = el.parentElement, d = 0; a && d < 3 && root.contains(a); a = a.parentElement, d++) list.push(a);
      return list;
    };
    const label = (el) =>
      snippet(el.getAttribute("aria-label") || el.textContent || el.getAttribute("placeholder") || el.getAttribute("title") || el.localName).slice(0, 40);

    // Only what a keyboard user can Tab to needs a ring.
    const sources = [...root.querySelectorAll(RING_SOURCES)].filter((el) => {
      if (el.matches(':disabled, [tabindex="-1"]')) return false;
      const s = cs(el);
      return s.display !== "none" && s.visibility !== "hidden";
    });
    for (const el of sources.slice(0, 40)) {
      const near = around(el);
      if (doc.activeElement && doc.activeElement !== doc.body) doc.activeElement.blur();
      // Focusing scrolls a control into view, but frames focus with
      // preventScroll, so scroll a clipped control into view first.
      if (!visuallyHidden(el)) {
        const shown = () => {
          const b = el.getBoundingClientRect();
          const [x, y] = [b.left + b.width / 2, b.top + b.height / 2];
          return inView(x, y) && doc.elementsFromPoint(x, y).some((e) => e === el || el.contains(e));
        };
        if (!shown()) el.scrollIntoView({ block: "nearest", inline: "nearest" });
        if (!shown()) {
          items.push({ kind: "focus", element: describe(el), min: 3, text: label(el), status: "unmeasurable", why: "control not visible where it sits", fg: null, bg: null, ratio: null });
          continue;
        }
        const b = el.getBoundingClientRect();
        if (pixelsAt(b.left + b.width / 2, b.top + b.height / 2, el, TRANSPARENT, el, null).covered) {
          items.push({ kind: "focus", element: describe(el), min: 3, text: label(el), status: "exempt", why: "behind an overlay such as a modal backdrop", fg: null, bg: null, ratio: null });
          continue;
        }
      }
      // Everything in the preview is watched, not just the control: a focus
      // indicator can be drawn on a peer, a wrapper or a copy elsewhere.
      const watched = [...new Set([...near, ...root.querySelectorAll("*")])];
      settleTransitions(watched);
      const before = watched.map(signature);
      el.focus({ preventScroll: true });
      if (doc.activeElement !== el) continue;
      const base = { kind: "focus", element: describe(el), min: 3 };
      if (!el.matches(":focus-visible")) {
        items.push({ ...base, text: label(el), status: "unmeasurable", why: ":focus-visible did not apply", fg: null, bg: null, ratio: null });
        continue;
      }
      settleTransitions(watched);
      const changed = watched.filter((e, i) => signature(e) !== before[i] && !visuallyHidden(e));
      const owners = changed.filter((e) => ringsOf(e).length);
      if (!owners.length) {
        const why = changed.length ? "focus changes colour but draws no outline or ring" : "no visible change on focus";
        items.push({ ...base, text: label(el), status: "unmeasurable", why, fg: null, bg: null, ratio: null });
        continue;
      }
      // The browser's own ring (outline-style: auto) is drawn in two tones so
      // it shows on any ground; it is reported, not measured.
      const drawn = (o) => ringsOf(o).filter((r) => !(r.what === "outline" && cs(o).outlineStyle === "auto"));
      if (owners.every((o) => !drawn(o).length)) {
        items.push({ ...base, text: label(el), status: "exempt", why: "browser default ring (two-tone)", fg: null, bg: null, ratio: null });
        continue;
      }
      // Each ring that appeared is measured, and the indicator is as visible as
      // the best of them. An outset ring meets the surface the control sits on:
      // whatever is painted behind its centre once the control is set aside.
      // An inset ring is measured where it is drawn, with anything stacked over
      // the control in front of it, so a ring under an opaque layer scores 1:1.
      let best = null;
      let why = null;
      for (const owner of owners) {
        const rings = drawn(owner);
        if (!rings.length) continue;
        const ring = rings.sort((a, b) => b.to - a.to)[0];
        const r = owner.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        let fg;
        let bg;
        let bound;
        if (ring.to > 0) {
          const g = inView(cx, cy) ? groundAt(cx, cy, owner) : null;
          if (!g) why = why || "control outside the viewport";
          else if (g.unknown) why = why || g.unknown;
          else {
            bg = g.rgb;
            fg = flat(over(premul(ring.c), premul([...bg, 1])));
          }
        } else {
          const d = -(ring.from + ring.to) / 2;
          const p = inView(r.left + d, cy) ? pixelsAt(r.left + d, cy, owner, premul(ring.c), owner, null) : { hidden: true };
          if (p.hidden) why = why || "control outside the viewport";
          else if (p.unknown) why = why || p.unknown;
          else {
            fg = p.fg;
            bound = p.bounded;
            bg = p.bg;
          }
        }
        if (!fg) continue;
        const value = ratio(fg, bg);
        if (!best || value > best.value) best = { value, fg, bg, owner, what: ring.what, bound };
      }
      if (!best) {
        items.push({ ...base, text: label(el), status: "unmeasurable", why, fg: null, bg: null, ratio: null });
        continue;
      }
      const where = best.owner === el ? "" : el.contains(best.owner) || best.owner.contains(el) || near.includes(best.owner) ? `on ${best.owner.localName}, ` : "on a copy, ";
      items.push({
        ...base,
        text: `${label(el)} (${where}${best.what})`,
        status: "measured",
        why: null,
        fg: hex(best.fg),
        bg: hex(best.bg),
        ratio: Math.round(best.value * 100) / 100,
        ...(best.bound ? { bound: best.bound } : {}),
      });
    }
    if (doc.activeElement && doc.activeElement !== doc.body) doc.activeElement.blur();
  }

  /* -------------------------------------------------------------- restore */

  force.remove();
  for (const el of inert) el.setAttribute("inert", "");
  return { items, counts };
}
