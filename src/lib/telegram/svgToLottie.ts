// SVG → Lottie geometry converter.
//
// Pure, framework-free helpers that turn the avatar's SVG primitives into the
// Lottie shape vocabulary that Telegram TGS understands. The avatar is authored
// on a 0 0 400 400 viewBox — the same BASE_SIZE the rest of the generator uses —
// so every emitted coordinate is run through `scaledPoint`/`px` to land on the
// 512×512 sticker canvas.
//
// Telegram TGS cannot represent SVG filters, masks or clip paths, so callers are
// expected to drop those nodes before/while walking. Gradients resolve to a
// representative solid colour.
import { px, scaledPoint, TELEGRAM_STICKER_FPS, TELEGRAM_STICKER_SIZE, FRAME_COUNT } from './core';
import { group, layer } from './lottie';
import { TELEGRAM_EMOTION_ANIMATION_PRESETS } from './presets';
import type {
  LottieValue,
  Vec2,
  StickerLayerMotion,
  TelegramEmotionAnimationPreset,
  TelegramStickerSpec,
} from './core';
import type { AvatarConfig } from '../../types';

export type Rgb = [number, number, number];

export interface ParsedColor {
  rgb: Rgb;
  alpha: number; // 0..1
}

const NAMED_COLORS: Record<string, string> = {
  white: '#ffffff',
  black: '#000000',
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  yellow: '#ffff00',
  orange: '#ffa500',
  pink: '#ffc0cb',
  purple: '#800080',
  gray: '#808080',
  grey: '#808080',
  silver: '#c0c0c0',
  gold: '#ffd700',
  cyan: '#00ffff',
  magenta: '#ff00ff',
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Parse a CSS/SVG colour string into linear 0..1 RGB plus alpha. */
export function parseColor(input: string | null | undefined): ParsedColor | null {
  if (!input) return null;
  let s = input.trim().toLowerCase();
  if (s === '' || s === 'none' || s === 'transparent' || s === 'currentcolor') return null;
  if (s.startsWith('url(')) return null; // gradient/pattern resolved elsewhere
  if (NAMED_COLORS[s]) s = NAMED_COLORS[s];

  if (s.startsWith('#')) {
    let h = s.slice(1);
    if (h.length === 3 || h.length === 4) {
      h = h
        .split('')
        .map((c) => c + c)
        .join('');
    }
    if (h.length !== 6 && h.length !== 8) return null;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if ([r, g, b].some((v) => Number.isNaN(v))) return null;
    const alpha = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return { rgb: [r / 255, g / 255, b / 255], alpha: clamp01(alpha) };
  }

  const match = s.match(/^rgba?\(([^)]+)\)$/);
  if (match) {
    const parts = match[1].split(/[, /]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const channel = (p: string) => (p.endsWith('%') ? (parseFloat(p) / 100) * 255 : parseFloat(p));
    const r = channel(parts[0]);
    const g = channel(parts[1]);
    const b = channel(parts[2]);
    if ([r, g, b].some((v) => Number.isNaN(v))) return null;
    const alpha = parts[3] !== undefined ? clamp01(parseFloat(parts[3])) : 1;
    return { rgb: [clamp01(r / 255), clamp01(g / 255), clamp01(b / 255)], alpha };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Affine transforms — SVG matrix convention [a b c d e f]:
//   x' = a*x + c*y + e ;  y' = b*x + d*y + f
// ---------------------------------------------------------------------------
export type Matrix = [number, number, number, number, number, number];
export const IDENTITY_MATRIX: Matrix = [1, 0, 0, 1, 0, 0];

export function multiplyMatrix(m1: Matrix, m2: Matrix): Matrix {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

export function applyToPoint(m: Matrix, [x, y]: Vec2): Vec2 {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

/** True when the matrix has no rotation/skew (axis-aligned scale + translate). */
const isAxisAligned = (m: Matrix) => Math.abs(m[1]) < 1e-6 && Math.abs(m[2]) < 1e-6;

const DEG2RAD = Math.PI / 180;

/** Parse an SVG `transform` attribute into a single composed matrix. */
export function parseTransform(value: string | null | undefined): Matrix {
  if (!value) return IDENTITY_MATRIX;
  let result = IDENTITY_MATRIX;
  const re = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value)) !== null) {
    const fn = m[1];
    const args = m[2]
      .split(/[, ]+/)
      .map((a) => parseFloat(a))
      .filter((n) => !Number.isNaN(n));
    let next: Matrix = IDENTITY_MATRIX;
    if (fn === 'matrix' && args.length === 6) {
      next = args as Matrix;
    } else if (fn === 'translate') {
      next = [1, 0, 0, 1, args[0] || 0, args[1] || 0];
    } else if (fn === 'scale') {
      const sx = args[0] ?? 1;
      next = [sx, 0, 0, args[1] ?? sx, 0, 0];
    } else if (fn === 'rotate') {
      const a = (args[0] || 0) * DEG2RAD;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const rot: Matrix = [cos, sin, -sin, cos, 0, 0];
      if (args.length >= 3) {
        const cx = args[1];
        const cy = args[2];
        next = multiplyMatrix([1, 0, 0, 1, cx, cy], multiplyMatrix(rot, [1, 0, 0, 1, -cx, -cy]));
      } else {
        next = rot;
      }
    } else if (fn === 'skewX') {
      next = [1, 0, Math.tan((args[0] || 0) * DEG2RAD), 1, 0, 0];
    } else if (fn === 'skewY') {
      next = [1, Math.tan((args[0] || 0) * DEG2RAD), 0, 1, 0, 0];
    }
    result = multiplyMatrix(result, next);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Path data → Lottie bezier subpaths
// ---------------------------------------------------------------------------
export interface SvgSubpath {
  closed: boolean;
  v: Vec2[]; // absolute vertices
  i: Vec2[]; // in-tangents relative to the matching vertex
  o: Vec2[]; // out-tangents relative to the matching vertex
}

const tokenizePath = (d: string): Array<string | number> => {
  const tokens: Array<string | number> = [];
  const re = /([MmLlHhVvCcSsQqTtAaZz])|(-?\d*\.?\d+(?:e[-+]?\d+)?)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d)) !== null) {
    tokens.push(m[1] !== undefined ? m[1] : parseFloat(m[2]));
  }
  return tokens;
};

/** Parse an SVG path `d` string into absolute bezier subpaths (Lottie tangent form). */
export function parsePathData(d: string): SvgSubpath[] {
  const tokens = tokenizePath(d);
  const subpaths: SvgSubpath[] = [];
  let sub: SvgSubpath | null = null;

  let cx = 0;
  let cy = 0;
  let startX = 0;
  let startY = 0;
  let prevCubicCtrl: Vec2 | null = null;
  let prevQuadCtrl: Vec2 | null = null;
  let index = 0;

  const num = () => tokens[index++] as number;
  const startSub = () => {
    sub = { closed: false, v: [], i: [], o: [] };
    subpaths.push(sub);
  };
  const pushVertex = (x: number, y: number) => {
    if (!sub) startSub();
    sub!.v.push([x, y]);
    sub!.i.push([0, 0]);
    sub!.o.push([0, 0]);
  };
  const setOut = (dx: number, dy: number) => {
    if (sub && sub.o.length) sub.o[sub.o.length - 1] = [dx, dy];
  };
  const setIn = (dx: number, dy: number) => {
    if (sub && sub.i.length) sub.i[sub.i.length - 1] = [dx, dy];
  };

  let cmd = '';
  while (index < tokens.length) {
    const token = tokens[index];
    if (typeof token === 'string') {
      cmd = token;
      index++;
    } else if (cmd === '') {
      index++;
      continue;
    }
    const rel = cmd === cmd.toLowerCase();
    const base = cmd.toUpperCase();

    if (base === 'M') {
      const x = (rel ? cx : 0) + num();
      const y = (rel ? cy : 0) + num();
      startSub();
      pushVertex(x, y);
      cx = startX = x;
      cy = startY = y;
      cmd = rel ? 'l' : 'L'; // implicit lineto for subsequent pairs
      prevCubicCtrl = prevQuadCtrl = null;
    } else if (base === 'L') {
      const x = (rel ? cx : 0) + num();
      const y = (rel ? cy : 0) + num();
      pushVertex(x, y);
      cx = x;
      cy = y;
      prevCubicCtrl = prevQuadCtrl = null;
    } else if (base === 'H') {
      const x = (rel ? cx : 0) + num();
      pushVertex(x, cy);
      cx = x;
      prevCubicCtrl = prevQuadCtrl = null;
    } else if (base === 'V') {
      const y = (rel ? cy : 0) + num();
      pushVertex(cx, y);
      cy = y;
      prevCubicCtrl = prevQuadCtrl = null;
    } else if (base === 'C' || base === 'S') {
      let c1x: number;
      let c1y: number;
      if (base === 'C') {
        c1x = (rel ? cx : 0) + num();
        c1y = (rel ? cy : 0) + num();
      } else {
        // smooth: reflect previous cubic control about the current point
        c1x = prevCubicCtrl ? 2 * cx - prevCubicCtrl[0] : cx;
        c1y = prevCubicCtrl ? 2 * cy - prevCubicCtrl[1] : cy;
      }
      const c2x = (rel ? cx : 0) + num();
      const c2y = (rel ? cy : 0) + num();
      const ex = (rel ? cx : 0) + num();
      const ey = (rel ? cy : 0) + num();
      setOut(c1x - cx, c1y - cy);
      pushVertex(ex, ey);
      setIn(c2x - ex, c2y - ey);
      prevCubicCtrl = [c2x, c2y];
      prevQuadCtrl = null;
      cx = ex;
      cy = ey;
    } else if (base === 'Q' || base === 'T') {
      let qx: number;
      let qy: number;
      if (base === 'Q') {
        qx = (rel ? cx : 0) + num();
        qy = (rel ? cy : 0) + num();
      } else {
        qx = prevQuadCtrl ? 2 * cx - prevQuadCtrl[0] : cx;
        qy = prevQuadCtrl ? 2 * cy - prevQuadCtrl[1] : cy;
      }
      const ex = (rel ? cx : 0) + num();
      const ey = (rel ? cy : 0) + num();
      // quadratic → cubic control points
      const c1x = cx + (2 / 3) * (qx - cx);
      const c1y = cy + (2 / 3) * (qy - cy);
      const c2x = ex + (2 / 3) * (qx - ex);
      const c2y = ey + (2 / 3) * (qy - ey);
      setOut(c1x - cx, c1y - cy);
      pushVertex(ex, ey);
      setIn(c2x - ex, c2y - ey);
      prevQuadCtrl = [qx, qy];
      prevCubicCtrl = null;
      cx = ex;
      cy = ey;
    } else if (base === 'A') {
      // Arc — approximated by a straight segment to the endpoint (rare).
      num();
      num();
      num();
      num();
      num();
      const ex = (rel ? cx : 0) + num();
      const ey = (rel ? cy : 0) + num();
      pushVertex(ex, ey);
      cx = ex;
      cy = ey;
      prevCubicCtrl = prevQuadCtrl = null;
    } else if (base === 'Z') {
      if (sub) {
        sub.closed = true;
        // Z returns to the subpath start; drop a duplicate trailing vertex.
        const last = sub.v[sub.v.length - 1];
        if (last && Math.abs(last[0] - startX) < 1e-6 && Math.abs(last[1] - startY) < 1e-6 && sub.v.length > 1) {
          sub.v.pop();
          sub.i.pop();
          sub.o.pop();
        }
      }
      cx = startX;
      cy = startY;
      prevCubicCtrl = prevQuadCtrl = null;
    } else {
      index++;
    }
  }

  return subpaths.filter((s) => s.v.length > 0);
}

// ---------------------------------------------------------------------------
// Shape emitters (pure: take geometry + matrix, return Lottie shape items)
// ---------------------------------------------------------------------------
const scaledDelta = (dx: number, dy: number): Vec2 => [px(dx), px(dy)];

/** One transformed bezier subpath → a Lottie `sh` shape. */
export function subpathToShape(sub: SvgSubpath, m: Matrix): LottieValue {
  const v: Vec2[] = [];
  const i: Vec2[] = [];
  const o: Vec2[] = [];
  for (let k = 0; k < sub.v.length; k += 1) {
    const absV = applyToPoint(m, sub.v[k]);
    const absIn = applyToPoint(m, [sub.v[k][0] + sub.i[k][0], sub.v[k][1] + sub.i[k][1]]);
    const absOut = applyToPoint(m, [sub.v[k][0] + sub.o[k][0], sub.v[k][1] + sub.o[k][1]]);
    v.push(scaledPoint(absV));
    i.push(scaledDelta(absIn[0] - absV[0], absIn[1] - absV[1]));
    o.push(scaledDelta(absOut[0] - absV[0], absOut[1] - absV[1]));
  }
  return { ty: 'sh', ks: { a: 0, k: { i, o, v, c: sub.closed } } };
}

export function pathToShapes(d: string, m: Matrix): LottieValue[] {
  return parsePathData(d).map((sub) => subpathToShape(sub, m));
}

// Unit circle approximated with four cubic beziers (kappa).
const KAPPA = 0.5522847498;
const ellipseSubpath = (cx: number, cy: number, rx: number, ry: number): SvgSubpath => {
  const ox = rx * KAPPA;
  const oy = ry * KAPPA;
  return {
    closed: true,
    v: [
      [cx + rx, cy],
      [cx, cy + ry],
      [cx - rx, cy],
      [cx, cy - ry],
    ],
    o: [
      [0, oy],
      [-ox, 0],
      [0, -oy],
      [ox, 0],
    ],
    i: [
      [0, -oy],
      [ox, 0],
      [0, oy],
      [-ox, 0],
    ],
  };
};

export function ellipseToShapes(cx: number, cy: number, rx: number, ry: number, m: Matrix): LottieValue[] {
  if (isAxisAligned(m)) {
    const c = applyToPoint(m, [cx, cy]);
    return [
      {
        ty: 'el',
        p: { a: 0, k: scaledPoint(c) },
        s: { a: 0, k: [px(rx * 2 * Math.abs(m[0])), px(ry * 2 * Math.abs(m[3]))] },
        d: 1,
      },
    ];
  }
  return [subpathToShape(ellipseSubpath(cx, cy, rx, ry), m)];
}

export function rectToShapes(x: number, y: number, w: number, h: number, radius: number, m: Matrix): LottieValue[] {
  if (isAxisAligned(m)) {
    const c = applyToPoint(m, [x + w / 2, y + h / 2]);
    return [
      {
        ty: 'rc',
        p: { a: 0, k: scaledPoint(c) },
        s: { a: 0, k: [px(w * Math.abs(m[0])), px(h * Math.abs(m[3]))] },
        r: { a: 0, k: px(radius * Math.abs(m[0])) },
        d: 1,
      },
    ];
  }
  const sub: SvgSubpath = {
    closed: true,
    v: [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ],
    i: [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    o: [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
  };
  return [subpathToShape(sub, m)];
}

export function polyToShapes(points: Vec2[], closed: boolean, m: Matrix): LottieValue[] {
  if (points.length === 0) return [];
  const zero = points.map(() => [0, 0] as Vec2);
  return [subpathToShape({ closed, v: points, i: zero, o: zero }, m)];
}

// ---------------------------------------------------------------------------
// Lottie fill / stroke from parsed paint
// ---------------------------------------------------------------------------
const round01 = (value: number) => Math.round(clamp01(value) * 100);

export function fillItem(color: ParsedColor, opacity: number): LottieValue {
  return { ty: 'fl', c: { a: 0, k: [...color.rgb, 1] }, o: { a: 0, k: round01(color.alpha * opacity) }, r: 1 };
}

export function strokeItem(color: ParsedColor, widthPx: number, opacity: number, cap = 2, join = 2): LottieValue {
  return {
    ty: 'st',
    c: { a: 0, k: [...color.rgb, 1] },
    o: { a: 0, k: round01(color.alpha * opacity) },
    w: { a: 0, k: px(Math.max(0.1, widthPx)) },
    lc: cap,
    lj: join,
    ml: 4,
  };
}

// ---------------------------------------------------------------------------
// Gradients — resolved to real Lottie gradient fills (`gf`). rlottie renders
// these, so the avatar's hair gradients survive into the sticker.
// ---------------------------------------------------------------------------
interface GradientStop {
  offset: number;
  rgb: Rgb;
  alpha: number;
}
interface GradientDef {
  type: 1 | 2; // 1 linear, 2 radial
  coords: [number, number, number, number]; // linear: x1 y1 x2 y2 ; radial: cx cy r _
  userSpace: boolean;
  stops: GradientStop[];
}

interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

const styleMapEl = (el: Element): Record<string, string> => {
  const style = el.getAttribute('style');
  if (!style) return {};
  const out: Record<string, string> = {};
  for (const decl of style.split(';')) {
    const idx = decl.indexOf(':');
    if (idx > 0) out[decl.slice(0, idx).trim()] = decl.slice(idx + 1).trim();
  }
  return out;
};

const coord = (raw: string | null, fallback: number): number => {
  if (raw === null) return fallback;
  const value = raw.trim().endsWith('%') ? parseFloat(raw) / 100 : parseFloat(raw);
  return Number.isNaN(value) ? fallback : value;
};

/** Collect every gradient def in the tree, keyed by id. */
export function parseGradients(root: Element): Map<string, GradientDef> {
  const map = new Map<string, GradientDef>();
  const visit = (el: Element) => {
    const tag = el.tagName.toLowerCase();
    if (tag === 'lineargradient' || tag === 'radialgradient') {
      const id = el.getAttribute('id');
      if (id) {
        const stops: GradientStop[] = Array.from(el.children)
          .filter((c) => c.tagName.toLowerCase() === 'stop')
          .map((s) => {
            const css = styleMapEl(s);
            const c = parseColor(css['stop-color'] ?? s.getAttribute('stop-color')) ?? { rgb: [0, 0, 0], alpha: 1 };
            const so = parseFloat(css['stop-opacity'] ?? s.getAttribute('stop-opacity') ?? '1');
            return {
              offset: coord(s.getAttribute('offset'), 0),
              rgb: c.rgb,
              alpha: c.alpha * (Number.isNaN(so) ? 1 : so),
            };
          });
        if (stops.length) {
          const userSpace = el.getAttribute('gradientUnits') === 'userSpaceOnUse';
          map.set(
            id,
            tag === 'radialgradient'
              ? {
                  type: 2,
                  coords: [
                    coord(el.getAttribute('cx'), 0.5),
                    coord(el.getAttribute('cy'), 0.5),
                    coord(el.getAttribute('r'), 0.5),
                    0,
                  ],
                  userSpace,
                  stops,
                }
              : {
                  type: 1,
                  coords: [
                    coord(el.getAttribute('x1'), 0),
                    coord(el.getAttribute('y1'), 0),
                    coord(el.getAttribute('x2'), 1),
                    coord(el.getAttribute('y2'), 0),
                  ],
                  userSpace,
                  stops,
                },
          );
        }
      }
    }
    for (const child of Array.from(el.children)) visit(child);
  };
  visit(root);
  return map;
}

const urlRef = (value: string | null): string | null => {
  const m = value?.match(/^url\(["']?#([^"')]+)["']?\)$/);
  return m ? m[1] : null;
};

const bboxOfShapes = (shapes: LottieValue[]): BBox | null => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const grow = (x: number, y: number) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };
  for (const s of shapes) {
    if (s.ty === 'el' || s.ty === 'rc') {
      const p = (s.p as { k: number[] }).k;
      const sz = (s.s as { k: number[] }).k;
      grow(p[0] - sz[0] / 2, p[1] - sz[1] / 2);
      grow(p[0] + sz[0] / 2, p[1] + sz[1] / 2);
    } else if (s.ty === 'sh') {
      for (const v of (s.ks as { k: { v: number[][] } }).k.v) grow(v[0], v[1]);
    }
  }
  if (!Number.isFinite(minX)) return null;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
};

function gradientFillItem(def: GradientDef, bbox: BBox, m: Matrix, opacity: number): LottieValue {
  const stopData: number[] = [];
  for (const st of def.stops) stopData.push(st.offset, st.rgb[0], st.rgb[1], st.rgb[2]);

  const toPoint = (fx: number, fy: number): Vec2 => {
    if (def.userSpace) {
      const p = applyToPoint(m, [fx, fy]);
      return scaledPoint(p);
    }
    return [bbox.x + fx * bbox.w, bbox.y + fy * bbox.h];
  };

  let start: Vec2;
  let end: Vec2;
  if (def.type === 2) {
    const [cx, cy, r] = def.coords;
    start = toPoint(cx, cy);
    end = def.userSpace
      ? scaledPoint(applyToPoint(m, [def.coords[0] + r, def.coords[1]]))
      : [bbox.x + (cx + r) * bbox.w, bbox.y + cy * bbox.h];
  } else {
    start = toPoint(def.coords[0], def.coords[1]);
    end = toPoint(def.coords[2], def.coords[3]);
  }

  return {
    ty: 'gf',
    o: { a: 0, k: round01(opacity) },
    r: 1,
    g: { p: def.stops.length, k: { a: 0, k: stopData } },
    s: { a: 0, k: start },
    e: { a: 0, k: end },
    t: def.type,
  };
}

// ---------------------------------------------------------------------------
// DOM walk: SVG element tree → Lottie shape groups
//
// Filters, masks, clip paths and gradient/pattern defs have no TGS equivalent,
// so those nodes are skipped (a filtered shape keeps its geometry but loses the
// blur/glow). Element `transform` attributes are baked into the geometry; CSS
// `style.transform` driving the live rig is intentionally ignored — sticker
// motion is supplied by the animation presets at a neutral pose.
// ---------------------------------------------------------------------------
const SKIP_TAGS = new Set([
  'defs',
  'filter',
  'clippath',
  'mask',
  'lineargradient',
  'radialgradient',
  'pattern',
  'style',
  'title',
  'desc',
  'metadata',
]);
const SHAPE_TAGS = new Set(['path', 'ellipse', 'circle', 'rect', 'line', 'polygon', 'polyline']);

const TARGET_NODES = ['back-hair', 'chest', 'head-outline', 'face', 'front-hair', 'accessory', 'overlay'] as const;
export type RigNodeName = (typeof TARGET_NODES)[number];

export interface RigNodeLayer {
  node: RigNodeName;
  items: LottieValue[];
}

const styleMap = (el: Element): Record<string, string> => {
  const style = el.getAttribute('style');
  if (!style) return {};
  const out: Record<string, string> = {};
  for (const decl of style.split(';')) {
    const idx = decl.indexOf(':');
    if (idx > 0) out[decl.slice(0, idx).trim()] = decl.slice(idx + 1).trim();
  }
  return out;
};

const readProp = (el: Element, css: Record<string, string>, name: string): string | null =>
  css[name] ?? el.getAttribute(name);

const num = (el: Element, name: string, fallback = 0): number => {
  const raw = el.getAttribute(name);
  const value = raw === null ? NaN : parseFloat(raw);
  return Number.isNaN(value) ? fallback : value;
};

const parsePoints = (raw: string | null): Vec2[] => {
  if (!raw) return [];
  const nums = raw
    .split(/[\s,]+/)
    .map((n) => parseFloat(n))
    .filter((n) => !Number.isNaN(n));
  const pts: Vec2[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i], nums[i + 1]]);
  return pts;
};

const matrixScale = (m: Matrix) => Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])) || 1;

const shapeElementToShapes = (el: Element, m: Matrix): LottieValue[] => {
  switch (el.tagName.toLowerCase()) {
    case 'path':
      return pathToShapes(el.getAttribute('d') ?? '', m);
    case 'ellipse':
      return ellipseToShapes(num(el, 'cx'), num(el, 'cy'), num(el, 'rx'), num(el, 'ry'), m);
    case 'circle':
      return ellipseToShapes(num(el, 'cx'), num(el, 'cy'), num(el, 'r'), num(el, 'r'), m);
    case 'rect':
      return rectToShapes(num(el, 'x'), num(el, 'y'), num(el, 'width'), num(el, 'height'), num(el, 'rx'), m);
    case 'line':
      return polyToShapes(
        [
          [num(el, 'x1'), num(el, 'y1')],
          [num(el, 'x2'), num(el, 'y2')],
        ],
        false,
        m,
      );
    case 'polygon':
      return polyToShapes(parsePoints(el.getAttribute('points')), true, m);
    case 'polyline':
      return polyToShapes(parsePoints(el.getAttribute('points')), false, m);
    default:
      return [];
  }
};

const shapeElementToGroup = (
  el: Element,
  m: Matrix,
  inheritedOpacity: number,
  gradients: Map<string, GradientDef>,
): LottieValue | null => {
  const shapes = shapeElementToShapes(el, m);
  if (shapes.length === 0) return null;

  const css = styleMap(el);
  const opacity = inheritedOpacity * (parseFloat(readProp(el, css, 'opacity') ?? '1') || 1);
  const items: LottieValue[] = [...shapes];

  let painted = false;
  const fillRaw = readProp(el, css, 'fill');
  const fillOpacity = parseFloat(readProp(el, css, 'fill-opacity') ?? '1');
  const fillO = opacity * (Number.isNaN(fillOpacity) ? 1 : fillOpacity);
  const fillGradientId = urlRef(fillRaw);
  if (fillGradientId && gradients.has(fillGradientId)) {
    const bbox = bboxOfShapes(shapes);
    if (bbox) {
      items.push(gradientFillItem(gradients.get(fillGradientId)!, bbox, m, fillO));
      painted = true;
    }
  } else {
    const fill = parseColor(fillRaw);
    if (fill) {
      items.push(fillItem(fill, fillO));
      painted = true;
    }
  }

  const stroke = parseColor(readProp(el, css, 'stroke'));
  if (stroke) {
    const strokeOpacity = parseFloat(readProp(el, css, 'stroke-opacity') ?? '1');
    const width = parseFloat(readProp(el, css, 'stroke-width') ?? '1') || 1;
    items.push(strokeItem(stroke, width * matrixScale(m), opacity * (Number.isNaN(strokeOpacity) ? 1 : strokeOpacity)));
    painted = true;
  }

  if (!painted) return null; // invisible geometry
  return group(el.tagName.toLowerCase(), items);
};

/**
 * Walk the avatar SVG and bucket every shape under its enclosing `data-rig-node`
 * target. Returns one entry per recognised rig node, in authored back-to-front
 * order, ready to be wrapped into animated Lottie layers.
 */
export function extractRigNodeLayers(svgRoot: Element): RigNodeLayer[] {
  const buckets = new Map<RigNodeName, LottieValue[]>();
  const gradients = parseGradients(svgRoot);

  const visit = (el: Element, matrix: Matrix, node: RigNodeName | null, inheritedOpacity: number) => {
    const tag = el.tagName.toLowerCase();
    if (SKIP_TAGS.has(tag)) return;
    const css = styleMap(el);
    if (readProp(el, css, 'display') === 'none') return;

    const declared = el.getAttribute('data-rig-node');
    const target = (TARGET_NODES as readonly string[]).includes(declared ?? '') ? (declared as RigNodeName) : node;
    const localMatrix = multiplyMatrix(matrix, parseTransform(el.getAttribute('transform')));
    const opacity = inheritedOpacity * (parseFloat(readProp(el, css, 'opacity') ?? '1') || 1);

    if (SHAPE_TAGS.has(tag)) {
      if (!target) return;
      const groupItem = shapeElementToGroup(el, localMatrix, opacity, gradients);
      if (groupItem) {
        const arr = buckets.get(target) ?? [];
        if (!buckets.has(target)) buckets.set(target, arr);
        arr.push(groupItem);
      }
      return;
    }

    for (const child of Array.from(el.children)) visit(child, localMatrix, target, opacity);
  };

  visit(svgRoot, IDENTITY_MATRIX, null, 1);

  return TARGET_NODES.filter((node) => (buckets.get(node)?.length ?? 0) > 0).map((node) => ({
    node,
    items: buckets.get(node)!,
  }));
}

// ---------------------------------------------------------------------------
// Rig-node layers → animated Lottie document (motion supplied by emotion presets)
// ---------------------------------------------------------------------------
const NODE_LAYER: Record<
  RigNodeName,
  { name: string; pick: (p: TelegramEmotionAnimationPreset) => StickerLayerMotion }
> = {
  'back-hair': { name: 'back-hair', pick: (p) => p.hair },
  chest: { name: 'body', pick: (p) => p.body },
  'head-outline': { name: 'head-base', pick: (p) => p.head },
  face: { name: 'face', pick: (p) => p.expression },
  'front-hair': { name: 'front-hair', pick: (p) => p.hair },
  accessory: { name: 'accessory', pick: (p) => p.accessory },
  overlay: { name: 'overlay', pick: (p) => p.overlay },
};

/** Wrap extracted rig-node geometry into animated, front-to-back Lottie layers. */
export function lottieFromRigLayers(
  rigLayers: RigNodeLayer[],
  config: AvatarConfig,
  spec: TelegramStickerSpec,
): LottieValue {
  const preset = TELEGRAM_EMOTION_ANIMATION_PRESETS[spec.slug];
  const backToFront = rigLayers
    .map((rl, idx) => {
      const cfg = NODE_LAYER[rl.node];
      return layer(idx + 1, cfg.name, rl.items, cfg.pick(preset));
    })
    .filter((item) => Array.isArray(item.shapes) && item.shapes.length > 0);

  // Lottie paints index 0 on top — emit front-to-back and renumber `ind`.
  const layers = backToFront.reverse().map((item, index) => ({ ...item, ind: index + 1 }));

  return {
    v: '5.7.4',
    fr: TELEGRAM_STICKER_FPS,
    ip: 0,
    op: FRAME_COUNT,
    w: TELEGRAM_STICKER_SIZE,
    h: TELEGRAM_STICKER_SIZE,
    nm: `${config.name || 'V-Studio'} ${spec.label} Telegram sticker`,
    ddd: 0,
    assets: [],
    layers,
    markers: [],
  };
}
