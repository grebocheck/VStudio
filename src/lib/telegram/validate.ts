import {
  TELEGRAM_STICKER_SIZE,
  TELEGRAM_STICKER_FPS,
  TELEGRAM_STICKER_MAX_TGS_BYTES,
  FRAME_COUNT,
  CURVE_BOUNDS_MARGIN,
  FORBIDDEN_SHAPE_TYPES,
  ALLOWED_SHAPE_TYPES,
} from './core';
import type { LottieValue, TelegramStickerValidationIssue } from './core';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asNumberArray = (value: unknown): number[] | null => {
  if (typeof value === 'number') return [value];
  if (!Array.isArray(value)) return null;
  return value.every((item) => typeof item === 'number') ? value : null;
};

const valuesMatch = (left: unknown, right: unknown) => {
  const leftNumbers = asNumberArray(left);
  const rightNumbers = asNumberArray(right);
  if (!leftNumbers || !rightNumbers || leftNumbers.length !== rightNumbers.length) return false;
  return leftNumbers.every((value, index) => Math.abs(value - rightNumbers[index]) < 0.001);
};

const handleIsLinear = (handle: unknown) => {
  if (!isRecord(handle)) return false;
  const x = asNumberArray(handle.x);
  const y = asNumberArray(handle.y);
  if (!x || !y || x.length !== y.length) return false;
  return x.every((value, index) => Math.abs(value - y[index]) < 0.001);
};

const inspectAnimatedLoop = (prop: unknown, path: string, issues: TelegramStickerValidationIssue[]) => {
  if (!isRecord(prop) || prop.a !== 1 || !Array.isArray(prop.k)) return;
  const keys = prop.k.filter(isRecord);
  if (keys.length < 2) {
    issues.push({
      severity: 'warning',
      code: 'telegram.loop.too_few_keyframes',
      message: 'Animated property has fewer than two keyframes.',
      path,
    });
    return;
  }
  const first = keys[0];
  const last = keys[keys.length - 1];
  const times = keys.map((key) => key.t).filter((value): value is number => typeof value === 'number');
  if (new Set(times).size !== times.length) {
    issues.push({
      severity: 'error',
      code: 'telegram.keyframe.duplicate_time',
      message: 'Animated property contains duplicate keyframe times.',
      path,
    });
  }
  if (first.t !== 0 || last.t !== FRAME_COUNT) {
    issues.push({
      severity: 'error',
      code: 'telegram.loop.frame_bounds',
      message: `Animated property must start at frame 0 and end at frame ${FRAME_COUNT}.`,
      path,
    });
  }
  if (!valuesMatch(first.s, last.s)) {
    issues.push({
      severity: 'error',
      code: 'telegram.loop.open_property',
      message: 'Animated property does not return to its first value at the end of the sticker loop.',
      path,
    });
  }
  keys.forEach((key, index) => {
    if ('e' in key) {
      issues.push({
        severity: 'error',
        code: 'telegram.keyframe.explicit_end_value',
        message:
          'Telegram Bodymovin-TG keyframes should use the next keyframe start value instead of an explicit end value.',
        path: `${path}.k[${index}]`,
      });
    }
    if (index === keys.length - 1) return;
    if (!handleIsLinear(key.i) || !handleIsLinear(key.o)) {
      issues.push({
        severity: 'error',
        code: 'telegram.keyframe.bezier_easing',
        message: 'Telegram animated stickers should use linear keyframe interpolation, not custom Bezier easing.',
        path: `${path}.k[${index}]`,
      });
    }
  });
  const finalKey = keys[keys.length - 1];
  if ('i' in finalKey || 'o' in finalKey) {
    issues.push({
      severity: 'error',
      code: 'telegram.keyframe.final_easing',
      message: 'Final keyframe should not contain easing handles.',
      path: `${path}.k[${keys.length - 1}]`,
    });
  }
};

type Bounds = [number, number, number, number];

const unionBounds = (bounds: Bounds[]): Bounds | null => {
  if (bounds.length === 0) return null;
  return bounds.reduce<Bounds>(
    (acc, current) => [
      Math.min(acc[0], current[0]),
      Math.min(acc[1], current[1]),
      Math.max(acc[2], current[2]),
      Math.max(acc[3], current[3]),
    ],
    [Infinity, Infinity, -Infinity, -Infinity],
  );
};

const readShapeBounds = (shape: Record<string, unknown>): Bounds[] => {
  const type = shape.ty;
  if (type === 'sh' && isRecord(shape.ks) && isRecord(shape.ks.k) && Array.isArray(shape.ks.k.v)) {
    const vertices = shape.ks.k.v.filter(Array.isArray) as unknown[][];
    const xs = vertices.map((point) => point[0]).filter((value): value is number => typeof value === 'number');
    const ys = vertices.map((point) => point[1]).filter((value): value is number => typeof value === 'number');
    if (xs.length > 0 && ys.length > 0) return [[Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]];
  }
  if (type === 'sh' && isRecord(shape.ks) && Array.isArray(shape.ks.k)) {
    return shape.ks.k.flatMap((keyframe) => {
      if (!isRecord(keyframe)) return [];
      const paths = [
        ...(Array.isArray(keyframe.s) ? keyframe.s : []),
        ...(Array.isArray(keyframe.e) ? keyframe.e : []),
      ];
      return paths.flatMap((path) => {
        if (!isRecord(path) || !Array.isArray(path.v)) return [];
        const vertices = path.v.filter(Array.isArray) as unknown[][];
        const xs = vertices.map((point) => point[0]).filter((value): value is number => typeof value === 'number');
        const ys = vertices.map((point) => point[1]).filter((value): value is number => typeof value === 'number');
        return xs.length > 0 && ys.length > 0
          ? ([[Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]] as Bounds[])
          : [];
      });
    });
  }
  if ((type === 'el' || type === 'rc') && isRecord(shape.p) && isRecord(shape.s)) {
    const center = asNumberArray(shape.p.k);
    const size = asNumberArray(shape.s.k);
    if (center && size && center.length >= 2 && size.length >= 2) {
      return [[center[0] - size[0] / 2, center[1] - size[1] / 2, center[0] + size[0] / 2, center[1] + size[1] / 2]];
    }
  }
  return [];
};

const collectShapeBounds = (items: unknown): Bounds[] => {
  if (!Array.isArray(items)) return [];
  const bounds: Bounds[] = [];
  for (const item of items) {
    if (!isRecord(item)) continue;
    bounds.push(...readShapeBounds(item), ...collectShapeBounds(item.it));
  }
  return bounds;
};

const numericTuple = (value: unknown, fallback: number[]): number[] => {
  const numbers = asNumberArray(value);
  return numbers && numbers.length > 0 ? numbers : fallback;
};

const animatedFrames = (prop: unknown): number[] => {
  if (!isRecord(prop) || prop.a !== 1 || !Array.isArray(prop.k)) return [];
  return prop.k
    .filter(isRecord)
    .map((key) => key.t)
    .filter((value): value is number => typeof value === 'number');
};

const propertyValueAtFrame = (prop: unknown, fallback: number[], frame: number): number[] => {
  if (!isRecord(prop)) return fallback;
  if (prop.a !== 1 || !Array.isArray(prop.k)) return numericTuple(prop.k, fallback);

  const keys = prop.k.filter(isRecord).filter((key) => typeof key.t === 'number');
  if (keys.length === 0) return fallback;
  if (frame <= (keys[0].t as number)) return numericTuple(keys[0].s, fallback);

  for (let index = 0; index < keys.length - 1; index += 1) {
    const current = keys[index];
    const next = keys[index + 1];
    const startFrame = current.t as number;
    const endFrame = next.t as number;
    if (frame < startFrame || frame > endFrame) continue;
    const start = numericTuple(current.s, fallback);
    const end = numericTuple(current.e ?? next.s, start);
    if (frame === startFrame || endFrame === startFrame) return start;
    const progress = (frame - startFrame) / (endFrame - startFrame);
    return start.map((value, valueIndex) => value + ((end[valueIndex] ?? value) - value) * progress);
  }

  return numericTuple(keys[keys.length - 1].s, fallback);
};

const layerBoundsAtFrame = (bounds: Bounds, ks: Record<string, unknown>, frame: number): Bounds => {
  const anchor = propertyValueAtFrame(ks.a, [0, 0, 0], frame);
  const position = propertyValueAtFrame(ks.p, anchor, frame);
  const scale = propertyValueAtFrame(ks.s, [100, 100, 100], frame);
  const rotation = propertyValueAtFrame(ks.r, [0], frame)[0] ?? 0;
  const radians = (rotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const sx = (scale[0] ?? 100) / 100;
  const sy = (scale[1] ?? scale[0] ?? 100) / 100;

  const corners = [
    [bounds[0], bounds[1]],
    [bounds[2], bounds[1]],
    [bounds[2], bounds[3]],
    [bounds[0], bounds[3]],
  ].map(([x, y]) => {
    const dx = (x - (anchor[0] ?? 0)) * sx;
    const dy = (y - (anchor[1] ?? 0)) * sy;
    return [position[0] + dx * cos - dy * sin, position[1] + dx * sin + dy * cos];
  });

  return [
    Math.min(...corners.map(([x]) => x)),
    Math.min(...corners.map(([, y]) => y)),
    Math.max(...corners.map(([x]) => x)),
    Math.max(...corners.map(([, y]) => y)),
  ];
};

const inspectLayerAnimatedBounds = (
  layerValue: Record<string, unknown>,
  layerPath: string,
  issues: TelegramStickerValidationIssue[],
) => {
  if (!isRecord(layerValue.ks)) return;
  const staticBounds = unionBounds(collectShapeBounds(layerValue.shapes));
  if (!staticBounds) return;
  const frames = Array.from(
    new Set([
      0,
      FRAME_COUNT,
      ...animatedFrames(layerValue.ks.p),
      ...animatedFrames(layerValue.ks.s),
      ...animatedFrames(layerValue.ks.r),
    ]),
  ).sort((left, right) => left - right);

  for (const frame of frames) {
    const bounds = layerBoundsAtFrame(staticBounds, layerValue.ks, frame);
    if (
      bounds[0] < -CURVE_BOUNDS_MARGIN ||
      bounds[1] < -CURVE_BOUNDS_MARGIN ||
      bounds[2] > TELEGRAM_STICKER_SIZE + CURVE_BOUNDS_MARGIN ||
      bounds[3] > TELEGRAM_STICKER_SIZE + CURVE_BOUNDS_MARGIN
    ) {
      issues.push({
        severity: 'error',
        code: 'telegram.bounds.out_of_canvas',
        message: 'Animated sticker layer leaves the 512x512 canvas.',
        path: `${layerPath}.frame[${frame}]`,
      });
      return;
    }
  }
};

const inspectShapes = (items: unknown, path: string, issues: TelegramStickerValidationIssue[]) => {
  if (!Array.isArray(items)) return;
  for (const [index, item] of items.entries()) {
    if (!isRecord(item)) continue;
    const shapePath = `${path}.shapes[${index}]`;
    const type = typeof item.ty === 'string' ? item.ty : '';
    if (FORBIDDEN_SHAPE_TYPES.has(type)) {
      issues.push({
        severity: 'error',
        code: `telegram.unsupported_shape.${type}`,
        message: `Telegram animated stickers do not support Lottie shape type "${type}".`,
        path: shapePath,
      });
    } else if (type && !ALLOWED_SHAPE_TYPES.has(type)) {
      issues.push({
        severity: 'warning',
        code: `telegram.unknown_shape.${type}`,
        message: `Shape type "${type}" is not in the generator allow-list.`,
        path: shapePath,
      });
    }
    if (type === 'tr') {
      inspectAnimatedLoop(item.p, `${shapePath}.p`, issues);
      inspectAnimatedLoop(item.s, `${shapePath}.s`, issues);
      inspectAnimatedLoop(item.r, `${shapePath}.r`, issues);
      inspectAnimatedLoop(item.o, `${shapePath}.o`, issues);
    }
    if (Array.isArray(item.it)) inspectShapes(item.it, shapePath, issues);
  }
};

export function validateTelegramStickerLottie(lottie: LottieValue): TelegramStickerValidationIssue[] {
  const issues: TelegramStickerValidationIssue[] = [];
  if (lottie.w !== TELEGRAM_STICKER_SIZE || lottie.h !== TELEGRAM_STICKER_SIZE) {
    issues.push({
      severity: 'error',
      code: 'telegram.canvas.invalid_size',
      message: 'Telegram animated stickers must use a 512x512 canvas.',
      path: 'root',
    });
  }
  if (lottie.fr !== TELEGRAM_STICKER_FPS || lottie.op !== FRAME_COUNT) {
    issues.push({
      severity: 'error',
      code: 'telegram.timing.invalid',
      message: 'Telegram animated stickers must be 60 FPS and no longer than 3 seconds.',
      path: 'root',
    });
  }
  if (Array.isArray(lottie.assets) && lottie.assets.length > 0) {
    issues.push({
      severity: 'error',
      code: 'telegram.assets.unsupported',
      message: 'Telegram animated stickers cannot use raster/image assets.',
      path: 'assets',
    });
  }
  if (!Array.isArray(lottie.layers)) {
    issues.push({
      severity: 'error',
      code: 'telegram.layers.missing',
      message: 'Sticker Lottie payload must contain shape layers.',
      path: 'layers',
    });
    return issues;
  }

  for (const [index, layerValue] of lottie.layers.entries()) {
    if (!isRecord(layerValue)) continue;
    const layerPath = `layers[${index}]`;
    const name = String(layerValue.nm ?? '').toLowerCase();
    if (name.includes('background')) {
      issues.push({
        severity: 'error',
        code: 'telegram.background.disallowed',
        message: 'Sticker exports must remain transparent and must not include background layers.',
        path: layerPath,
      });
    }
    if (layerValue.ty !== 4) {
      issues.push({
        severity: 'error',
        code: 'telegram.layer.non_shape',
        message: 'Telegram TGS stickers should contain vector shape layers only.',
        path: layerPath,
      });
    }
    if (layerValue.ddd !== 0) {
      issues.push({
        severity: 'error',
        code: 'telegram.layer.3d',
        message: 'Telegram animated stickers do not support 3D layers.',
        path: layerPath,
      });
    }
    if ('ef' in layerValue || 'masksProperties' in layerValue || layerValue.hasMask) {
      issues.push({
        severity: 'error',
        code: 'telegram.layer.effects_or_masks',
        message: 'Telegram animated stickers do not support effects or masks.',
        path: layerPath,
      });
    }
    if (typeof layerValue.sr === 'number' && layerValue.sr !== 1) {
      issues.push({
        severity: 'error',
        code: 'telegram.layer.time_stretch',
        message: 'Telegram animated stickers do not support time-stretched layers.',
        path: layerPath,
      });
    }
    if (isRecord(layerValue.ks)) {
      inspectAnimatedLoop(layerValue.ks.p, `${layerPath}.ks.p`, issues);
      inspectAnimatedLoop(layerValue.ks.s, `${layerPath}.ks.s`, issues);
      inspectAnimatedLoop(layerValue.ks.r, `${layerPath}.ks.r`, issues);
      inspectAnimatedLoop(layerValue.ks.o, `${layerPath}.ks.o`, issues);
    }
    inspectShapes(layerValue.shapes, layerPath, issues);
    inspectLayerAnimatedBounds(layerValue, layerPath, issues);
  }

  return issues;
}

export function validateTelegramStickerSize(
  sizeBytes: number,
  fileName = 'sticker.tgs',
): TelegramStickerValidationIssue[] {
  return sizeBytes > TELEGRAM_STICKER_MAX_TGS_BYTES
    ? [
        {
          severity: 'error',
          code: 'telegram.size.too_large',
          message: `${fileName} is ${sizeBytes} bytes; Telegram animated stickers must stay under ${TELEGRAM_STICKER_MAX_TGS_BYTES} bytes.`,
          path: fileName,
        },
      ]
    : [];
}

const summarizeValidation = (issues: TelegramStickerValidationIssue[]) => ({
  passed: issues.every((issue) => issue.severity !== 'error'),
  errorCount: issues.filter((issue) => issue.severity === 'error').length,
  warningCount: issues.filter((issue) => issue.severity === 'warning').length,
  issueCodes: Array.from(new Set(issues.map((issue) => issue.code))),
});

const throwIfInvalid = (fileName: string, issues: TelegramStickerValidationIssue[]) => {
  const errors = issues.filter((issue) => issue.severity === 'error');
  if (errors.length === 0) return;
  throw new Error(
    `Telegram sticker validation failed for ${fileName}: ${errors
      .slice(0, 3)
      .map((issue) => issue.message)
      .join(' ')}`,
  );
};

export { summarizeValidation, throwIfInvalid };
