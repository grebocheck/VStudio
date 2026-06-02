import { px, scaledPoint, scaledVec3, FRAME_COUNT } from './core';
import type { LottieValue, Vec2, Vec3, ScalarKey, OffsetKey, ScaleKey, StickerLayerMotion } from './core';

const hexToRgba = (hex: string, fallback: string): [number, number, number, number] => {
  const safe = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(hex) ? hex : fallback;
  const raw = safe.slice(1);
  const expanded =
    raw.length === 3
      ? raw
          .split('')
          .map((char) => char + char)
          .join('')
      : raw;
  const alpha = expanded.length === 8 ? parseInt(expanded.slice(6, 8), 16) / 255 : 1;
  return [
    parseInt(expanded.slice(0, 2), 16) / 255,
    parseInt(expanded.slice(2, 4), 16) / 255,
    parseInt(expanded.slice(4, 6), 16) / 255,
    alpha,
  ];
};

const fill = (color: string, fallback = '#ffffff', opacity = 100): LottieValue => ({
  ty: 'fl',
  c: { a: 0, k: hexToRgba(color, fallback) },
  o: { a: 0, k: Math.max(0, Math.min(100, Math.round(opacity))) },
  r: 1,
});

const stroke = (color: string, width: number, fallback = '#1c1917', opacity = 100): LottieValue => ({
  ty: 'st',
  c: { a: 0, k: hexToRgba(color, fallback) },
  o: { a: 0, k: Math.max(0, Math.min(100, Math.round(opacity))) },
  w: { a: 0, k: px(width) },
  lc: 2,
  lj: 2,
  ml: 4,
});

const ellipse = (cx: number, cy: number, width: number, height: number): LottieValue => ({
  ty: 'el',
  p: { a: 0, k: scaledPoint([cx, cy]) },
  s: { a: 0, k: [px(width), px(height)] },
  d: 1,
});

const rect = (cx: number, cy: number, width: number, height: number, radius = 0): LottieValue => ({
  ty: 'rc',
  p: { a: 0, k: scaledPoint([cx, cy]) },
  s: { a: 0, k: [px(width), px(height)] },
  r: { a: 0, k: px(radius) },
  d: 1,
});

const smoothPath = (points: Vec2[], closed = true, tension = 0.18): LottieValue => {
  const lastIndex = points.length - 1;
  const handles = points.map((point, index) => {
    const prev = closed ? points[(index - 1 + points.length) % points.length] : points[Math.max(0, index - 1)];
    const next = closed ? points[(index + 1) % points.length] : points[Math.min(lastIndex, index + 1)];
    if (!closed && (index === 0 || index === lastIndex)) {
      return { incoming: [0, 0] as Vec2, outgoing: [0, 0] as Vec2 };
    }

    const dx = (next[0] - prev[0]) * tension;
    const dy = (next[1] - prev[1]) * tension;
    return {
      incoming: [px(-dx), px(-dy)] as Vec2,
      outgoing: [px(dx), px(dy)] as Vec2,
    };
  });

  return {
    ty: 'sh',
    ks: {
      a: 0,
      k: {
        i: handles.map(({ incoming }) => incoming),
        o: handles.map(({ outgoing }) => outgoing),
        v: points.map(scaledPoint),
        c: closed,
      },
    },
  };
};

const linePath = (points: Vec2[]): LottieValue => smoothPath(points, false, 0.16);

const groupTransform = (): LottieValue => ({
  ty: 'tr',
  p: { a: 0, k: [0, 0] },
  a: { a: 0, k: [0, 0] },
  s: { a: 0, k: [100, 100] },
  r: { a: 0, k: 0 },
  o: { a: 0, k: 100 },
  sk: { a: 0, k: 0 },
  sa: { a: 0, k: 0 },
});

const group = (name: string, items: LottieValue[]): LottieValue => ({
  ty: 'gr',
  nm: name,
  it: [...items, groupTransform()],
});

const valueDimensions = (value: number | number[]) => (Array.isArray(value) ? value.length : 1);

const easingFor = (value: number | number[], mode: 'soft' | 'snap' | 'linear' = 'soft') => {
  const dimensions = valueDimensions(value);
  const curve =
    mode === 'linear'
      ? { ix: 0, iy: 0, ox: 1, oy: 1 }
      : mode === 'snap'
        ? { ix: 0.82, iy: 1, ox: 0.18, oy: 0 }
        : { ix: 0.667, iy: 1, ox: 0.333, oy: 0 };

  return {
    i: { x: Array(dimensions).fill(curve.ix), y: Array(dimensions).fill(curve.iy) },
    o: { x: Array(dimensions).fill(curve.ox), y: Array(dimensions).fill(curve.oy) },
  };
};

const animatedKeyframe = (
  time: number,
  value: number | number[],
  endValue?: number | number[],
  ease: 'soft' | 'snap' | 'linear' = 'soft',
): LottieValue => {
  const start = Array.isArray(value) ? value : [value];
  const end = endValue === undefined ? undefined : Array.isArray(endValue) ? endValue : [endValue];
  return {
    t: time,
    s: start,
    ...(end ? { e: end } : {}),
    ...easingFor(start, ease),
  };
};

const closeKeys = <T extends [number, ...number[]]>(keys: T[]): T[] => {
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (last[0] === FRAME_COUNT && first.slice(1).every((value, index) => value === last[index + 1])) return keys;
  return [...keys, [FRAME_COUNT, ...first.slice(1)] as T];
};

const offsetProperty = (anchor: Vec2, keys?: OffsetKey[]): LottieValue => {
  if (!keys || keys.length === 0) return { a: 0, k: scaledVec3([anchor[0], anchor[1], 0]) };
  const closed = closeKeys(keys);
  return {
    a: 1,
    k: closed.map(([frame, x, y], index) =>
      animatedKeyframe(
        frame,
        scaledVec3([anchor[0] + x, anchor[1] + y, 0]),
        closed[index + 1]
          ? scaledVec3([anchor[0] + closed[index + 1][1], anchor[1] + closed[index + 1][2], 0])
          : undefined,
      ),
    ),
  };
};

const scaleProperty = (keys?: ScaleKey[]): LottieValue => {
  if (!keys || keys.length === 0) return { a: 0, k: [100, 100, 100] };
  const closed = closeKeys(keys);
  const scaleValue = ([, x, y = x]: ScaleKey): Vec3 => [x, y, 100];
  return {
    a: 1,
    k: closed.map((key, index) =>
      animatedKeyframe(key[0], scaleValue(key), closed[index + 1] ? scaleValue(closed[index + 1]) : undefined),
    ),
  };
};

const scalarProperty = (
  fallback: number,
  keys?: ScalarKey[],
  ease: 'soft' | 'snap' | 'linear' = 'soft',
): LottieValue => {
  if (!keys || keys.length === 0) return { a: 0, k: fallback };
  const closed = closeKeys(keys);
  return {
    a: 1,
    k: closed.map(([frame, value], index) =>
      animatedKeyframe(frame, value, closed[index + 1] ? closed[index + 1][1] : undefined, ease),
    ),
  };
};

const layer = (index: number, name: string, shapes: LottieValue[], motion: StickerLayerMotion): LottieValue => ({
  ddd: 0,
  ind: index,
  ty: 4,
  nm: name,
  sr: 1,
  ks: {
    o: scalarProperty(100, motion.opacity),
    r: scalarProperty(0, motion.rotation, name.includes('dizzy') ? 'linear' : 'soft'),
    p: offsetProperty(motion.anchor, motion.position),
    a: { a: 0, k: scaledVec3([motion.anchor[0], motion.anchor[1], 0]) },
    s: scaleProperty(motion.scale),
  },
  ao: 0,
  shapes,
  ip: 0,
  op: FRAME_COUNT,
  st: 0,
  bm: 0,
});

const heartPath = (cx: number, cy: number, size: number): LottieValue =>
  smoothPath(
    [
      [cx, cy + size * 0.72],
      [cx - size * 0.92, cy + size * 0.14],
      [cx - size * 0.72, cy - size * 0.62],
      [cx - size * 0.12, cy - size * 0.44],
      [cx, cy - size * 0.2],
      [cx + size * 0.12, cy - size * 0.44],
      [cx + size * 0.72, cy - size * 0.62],
      [cx + size * 0.92, cy + size * 0.14],
    ],
    true,
    0.24,
  );

const sparklePath = (cx: number, cy: number, size: number): LottieValue =>
  smoothPath(
    [
      [cx, cy - size],
      [cx + size * 0.25, cy - size * 0.25],
      [cx + size, cy],
      [cx + size * 0.25, cy + size * 0.25],
      [cx, cy + size],
      [cx - size * 0.25, cy + size * 0.25],
      [cx - size, cy],
      [cx - size * 0.25, cy - size * 0.25],
    ],
    true,
    0.08,
  );

const tearDropPath = (cx: number, cy: number, size: number): LottieValue =>
  smoothPath(
    [
      [cx, cy - size],
      [cx - size * 0.72, cy + size * 0.08],
      [cx - size * 0.36, cy + size * 0.82],
      [cx, cy + size],
      [cx + size * 0.36, cy + size * 0.82],
      [cx + size * 0.72, cy + size * 0.08],
    ],
    true,
    0.22,
  );

const spiralPath = (cx: number, cy: number, turns: number, radius: number): LottieValue => {
  const points: Vec2[] = [];
  const count = 28;
  for (let index = 0; index < count; index += 1) {
    const ratio = index / (count - 1);
    const angle = ratio * turns * Math.PI * 2;
    const currentRadius = radius * ratio;
    points.push([cx + Math.cos(angle) * currentRadius, cy + Math.sin(angle) * currentRadius * 0.62]);
  }
  return smoothPath(points, false, 0.12);
};

const hslSafeOutline = '#1c1917';

export {
  fill,
  stroke,
  ellipse,
  rect,
  smoothPath,
  linePath,
  group,
  layer,
  heartPath,
  sparklePath,
  tearDropPath,
  spiralPath,
  hslSafeOutline,
};
