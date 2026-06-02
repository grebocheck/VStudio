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
};

const readShapeBounds = (shape: Record<string, unknown>): Array<[number, number, number, number]> => {
  const type = shape.ty;
  if (type === 'sh' && isRecord(shape.ks) && isRecord(shape.ks.k) && Array.isArray(shape.ks.k.v)) {
    const vertices = shape.ks.k.v.filter(Array.isArray) as unknown[][];
    const xs = vertices.map((point) => point[0]).filter((value): value is number => typeof value === 'number');
    const ys = vertices.map((point) => point[1]).filter((value): value is number => typeof value === 'number');
    if (xs.length > 0 && ys.length > 0) return [[Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]];
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
    for (const [x1, y1, x2, y2] of readShapeBounds(item)) {
      if (
        x1 < -CURVE_BOUNDS_MARGIN ||
        y1 < -CURVE_BOUNDS_MARGIN ||
        x2 > TELEGRAM_STICKER_SIZE + CURVE_BOUNDS_MARGIN ||
        y2 > TELEGRAM_STICKER_SIZE + CURVE_BOUNDS_MARGIN
      ) {
        issues.push({
          severity: 'warning',
          code: 'telegram.bounds.loose_shape',
          message: 'Shape geometry extends far outside the 512x512 sticker canvas.',
          path: shapePath,
        });
      }
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
