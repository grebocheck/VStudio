import { px, scaledPoint, FRAME_COUNT } from './core';
import type { LottieValue, Vec2, ScalarKey, OffsetKey, ScaleKey, StickerLayerMotion } from './core';

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

const easingFor = (value: number | number[]) => {
  const dimensions = valueDimensions(value);

  return {
    i: { x: Array(dimensions).fill(0.833), y: Array(dimensions).fill(0.833) },
    o: { x: Array(dimensions).fill(0.167), y: Array(dimensions).fill(0.167) },
  };
};

const animatedKeyframe = (time: number, value: number | number[], hasNext = true): LottieValue => {
  const start = Array.isArray(value) ? value : [value];
  return {
    t: time,
    s: start,
    ...(hasNext ? easingFor(start) : {}),
  };
};

const closeKeys = <T extends [number, ...number[]]>(keys: T[]): T[] => {
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (last[0] === FRAME_COUNT && first.slice(1).every((value, index) => value === last[index + 1])) return keys;
  if (last[0] === FRAME_COUNT) return [...keys.slice(0, -1), [FRAME_COUNT, ...first.slice(1)] as T];
  return [...keys, [FRAME_COUNT, ...first.slice(1)] as T];
};

const scalarProperty = (fallback: number, keys?: ScalarKey[]): LottieValue => {
  if (!keys || keys.length === 0) return { a: 0, k: fallback };
  const closed = closeKeys(keys);
  return {
    a: 1,
    k: closed.map(([frame, value], index) => animatedKeyframe(frame, value, index < closed.length - 1)),
  };
};

const motionFrames = (motion: StickerLayerMotion): number[] =>
  Array.from(
    new Set([
      0,
      FRAME_COUNT,
      ...(motion.position ?? []).map(([frame]) => frame),
      ...(motion.scale ?? []).map(([frame]) => frame),
      ...(motion.rotation ?? []).map(([frame]) => frame),
    ]),
  ).sort((left, right) => left - right);

const sampleClosedScalar = (keys: ScalarKey[] | undefined, fallback: number, frame: number): number => {
  if (!keys || keys.length === 0) return fallback;
  const closed = closeKeys(keys);
  const first = closed[0];
  if (frame <= first[0]) return first[1];
  for (let index = 0; index < closed.length - 1; index += 1) {
    const current = closed[index];
    const next = closed[index + 1];
    if (frame < current[0] || frame > next[0]) continue;
    if (frame === current[0] || current[0] === next[0]) return current[1];
    const progress = (frame - current[0]) / (next[0] - current[0]);
    return current[1] + (next[1] - current[1]) * progress;
  }
  return closed[closed.length - 1][1];
};

const sampleClosedOffset = (keys: OffsetKey[] | undefined, frame: number): Vec2 => {
  if (!keys || keys.length === 0) return [0, 0];
  const closed = closeKeys(keys);
  const first = closed[0];
  if (frame <= first[0]) return [first[1], first[2]];
  for (let index = 0; index < closed.length - 1; index += 1) {
    const current = closed[index];
    const next = closed[index + 1];
    if (frame < current[0] || frame > next[0]) continue;
    if (frame === current[0] || current[0] === next[0]) return [current[1], current[2]];
    const progress = (frame - current[0]) / (next[0] - current[0]);
    return [current[1] + (next[1] - current[1]) * progress, current[2] + (next[2] - current[2]) * progress];
  }
  const last = closed[closed.length - 1];
  return [last[1], last[2]];
};

const sampleClosedScale = (keys: ScaleKey[] | undefined, frame: number): Vec2 => {
  if (!keys || keys.length === 0) return [100, 100];
  const closed = closeKeys(keys);
  const first = closed[0];
  if (frame <= first[0]) return [first[1], first[2] ?? first[1]];
  for (let index = 0; index < closed.length - 1; index += 1) {
    const current = closed[index];
    const next = closed[index + 1];
    const currentY = current[2] ?? current[1];
    const nextY = next[2] ?? next[1];
    if (frame < current[0] || frame > next[0]) continue;
    if (frame === current[0] || current[0] === next[0]) return [current[1], currentY];
    const progress = (frame - current[0]) / (next[0] - current[0]);
    return [current[1] + (next[1] - current[1]) * progress, currentY + (nextY - currentY) * progress];
  }
  const last = closed[closed.length - 1];
  return [last[1], last[2] ?? last[1]];
};

const roundPoint = ([x, y]: Vec2): Vec2 => [Math.round(x * 100) / 100, Math.round(y * 100) / 100];

const transformPoint = (point: Vec2, motion: StickerLayerMotion, frame: number): Vec2 => {
  const anchor = scaledPoint(motion.anchor);
  const offset = sampleClosedOffset(motion.position, frame);
  const position = scaledPoint([motion.anchor[0] + offset[0], motion.anchor[1] + offset[1]]);
  const scale = sampleClosedScale(motion.scale, frame);
  const rotation = (sampleClosedScalar(motion.rotation, 0, frame) * Math.PI) / 180;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const dx = (point[0] - anchor[0]) * (scale[0] / 100);
  const dy = (point[1] - anchor[1]) * (scale[1] / 100);
  return roundPoint([position[0] + dx * cos - dy * sin, position[1] + dx * sin + dy * cos]);
};

const transformDelta = (delta: Vec2, motion: StickerLayerMotion, frame: number): Vec2 => {
  const scale = sampleClosedScale(motion.scale, frame);
  const rotation = (sampleClosedScalar(motion.rotation, 0, frame) * Math.PI) / 180;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const dx = delta[0] * (scale[0] / 100);
  const dy = delta[1] * (scale[1] / 100);
  return roundPoint([dx * cos - dy * sin, dx * sin + dy * cos]);
};

const staticNumberArray = (prop: unknown): number[] | null => {
  if (!prop || typeof prop !== 'object' || Array.isArray(prop)) return null;
  const value = (prop as Record<string, unknown>).k;
  return Array.isArray(value) && value.every((item) => typeof item === 'number') ? value : null;
};

const pathKeyframe = (frame: number, value: LottieValue, hasNext = true): LottieValue => ({
  t: frame,
  s: [value],
  ...(hasNext
    ? {
        i: { x: 0.833, y: 0.833 },
        o: { x: 0.167, y: 0.167 },
      }
    : {}),
});

const bakePath = (shape: LottieValue, motion: StickerLayerMotion, frames: number[]): LottieValue => {
  if (!shape.ks || typeof shape.ks !== 'object' || Array.isArray(shape.ks)) return shape;
  const ks = shape.ks as Record<string, unknown>;
  if (!ks.k || typeof ks.k !== 'object' || Array.isArray(ks.k)) return shape;
  const path = ks.k as Record<string, unknown>;
  if (!Array.isArray(path.v) || !Array.isArray(path.i) || !Array.isArray(path.o)) return shape;

  const bakedAt = (frame: number): LottieValue => ({
    ...path,
    v: (path.v as Vec2[]).map((point) => transformPoint(point, motion, frame)),
    i: (path.i as Vec2[]).map((delta) => transformDelta(delta, motion, frame)),
    o: (path.o as Vec2[]).map((delta) => transformDelta(delta, motion, frame)),
  });
  const values = frames.map(bakedAt);

  return {
    ...shape,
    ks: {
      ...ks,
      a: 1,
      k: frames.map((frame, index) => pathKeyframe(frame, values[index], index < frames.length - 1)),
    },
  };
};

const bakePointProperty = (prop: unknown, motion: StickerLayerMotion, frames: number[]): LottieValue | unknown => {
  const point = staticNumberArray(prop);
  if (!point || point.length < 2) return prop;
  const values = frames.map((frame) => transformPoint([point[0], point[1]], motion, frame));
  return {
    ...(prop as Record<string, unknown>),
    a: 1,
    k: frames.map((frame, index) => animatedKeyframe(frame, values[index], index < frames.length - 1)),
  };
};

const bakeSizeProperty = (prop: unknown, motion: StickerLayerMotion, frames: number[]): LottieValue | unknown => {
  const size = staticNumberArray(prop);
  if (!size || size.length < 2) return prop;
  const values = frames.map((frame) => {
    const scale = sampleClosedScale(motion.scale, frame);
    return [Math.round(size[0] * (scale[0] / 100) * 100) / 100, Math.round(size[1] * (scale[1] / 100) * 100) / 100];
  });
  return {
    ...(prop as Record<string, unknown>),
    a: 1,
    k: frames.map((frame, index) => animatedKeyframe(frame, values[index], index < frames.length - 1)),
  };
};

const bakeShapeMotion = (item: LottieValue, motion: StickerLayerMotion, frames: number[]): LottieValue => {
  let baked = { ...item };
  if (item.ty === 'sh') {
    baked = bakePath(item, motion, frames);
  } else if (item.ty === 'el' || item.ty === 'rc') {
    baked.p = bakePointProperty(item.p, motion, frames);
    baked.s = bakeSizeProperty(item.s, motion, frames);
  } else if (item.ty === 'gf' || item.ty === 'gs') {
    baked.s = bakePointProperty(item.s, motion, frames);
    baked.e = bakePointProperty(item.e, motion, frames);
  }

  if (Array.isArray(item.it)) baked.it = item.it.map((child) => bakeShapeMotion(child, motion, frames));
  return baked;
};

const bakeMotionIntoShapes = (shapes: LottieValue[], motion: StickerLayerMotion): LottieValue[] => {
  if (!motion.position && !motion.scale && !motion.rotation) return shapes;
  const frames = motionFrames(motion);
  return shapes.map((shape) => bakeShapeMotion(shape, motion, frames));
};

const layer = (index: number, name: string, shapes: LottieValue[], motion: StickerLayerMotion): LottieValue => ({
  ddd: 0,
  ind: index,
  ty: 4,
  nm: name,
  sr: 1,
  ks: {
    o: scalarProperty(100, motion.opacity),
    r: { a: 0, k: 0 },
    p: { a: 0, k: [0, 0, 0] },
    a: { a: 0, k: [0, 0, 0] },
    s: { a: 0, k: [100, 100, 100] },
  },
  ao: 0,
  shapes: bakeMotionIntoShapes(shapes, motion),
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
