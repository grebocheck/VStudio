import { describe, expect, it } from 'vitest';
import { gunzipSync } from 'node:zlib';
import { DEFAULT_CONFIG } from '../presets';
import {
  buildTelegramStickerLottie,
  createTelegramStickerPack,
  createZipBlob,
  TELEGRAM_EMOTION_ANIMATION_PRESETS,
  TELEGRAM_STICKER_DURATION_SECONDS,
  TELEGRAM_STICKER_FPS,
  TELEGRAM_STICKER_MAX_TGS_BYTES,
  TELEGRAM_STICKER_SIZE,
  TELEGRAM_STICKER_SPECS,
  validateTelegramStickerLottie,
  validateTelegramStickerSize,
} from './telegramStickers';
import { gzipString } from './telegram/zip';

type AnyRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is AnyRecord => typeof value === 'object' && value !== null;

const collectShapePaths = (value: unknown): AnyRecord[] => {
  if (!isRecord(value)) return [];
  const own = value.ty === 'sh' ? [value] : [];
  const children = Array.isArray(value.it) ? value.it.flatMap(collectShapePaths) : [];
  const rootLayerChildren = Array.isArray(value.layers) ? value.layers.flatMap(collectShapePaths) : [];
  const layerChildren = Array.isArray(value.shapes) ? value.shapes.flatMap(collectShapePaths) : [];
  return [...own, ...children, ...rootLayerChildren, ...layerChildren];
};

const hasCurvedHandles = (shape: AnyRecord) => {
  const ks = isRecord(shape.ks) ? shape.ks : null;
  const firstKeyPath =
    ks && Array.isArray(ks.k) && isRecord(ks.k[0]) && Array.isArray(ks.k[0].s) && isRecord(ks.k[0].s[0])
      ? ks.k[0].s[0]
      : null;
  const k = ks && isRecord(ks.k) && !Array.isArray(ks.k) ? ks.k : firstKeyPath;
  const handles = [...(Array.isArray(k?.i) ? k.i : []), ...(Array.isArray(k?.o) ? k.o : [])];
  return handles.some(
    (handle) => Array.isArray(handle) && handle.some((value) => typeof value === 'number' && Math.abs(value) > 0.01),
  );
};

const collectAnimatedProperties = (value: unknown): AnyRecord[] => {
  if (!isRecord(value)) return [];
  const own = value.a === 1 && Array.isArray(value.k) ? [value] : [];
  const nested = Object.values(value).flatMap((child) => {
    if (Array.isArray(child)) return child.flatMap(collectAnimatedProperties);
    return collectAnimatedProperties(child);
  });
  return [...own, ...nested];
};

const animatedSignature = (lottie: AnyRecord) =>
  (Array.isArray(lottie.layers) ? lottie.layers : [])
    .map((layer) => (isRecord(layer) ? `${layer.nm}:${JSON.stringify(collectAnimatedProperties(layer))}` : ''))
    .join('|');

const collectAnimatedKeyframes = (lottie: AnyRecord): AnyRecord[] =>
  collectAnimatedProperties(lottie).flatMap((prop) => (prop.k as unknown[]).filter(isRecord));

const handleIsLinear = (handle: unknown) => {
  if (!isRecord(handle)) return false;
  if (typeof handle.x === 'number' && typeof handle.y === 'number') return Math.abs(handle.x - handle.y) < 0.001;
  if (!Array.isArray(handle.x) || !Array.isArray(handle.y)) return false;
  return (
    handle.x.length === handle.y.length && handle.x.every((value, index) => Math.abs(value - handle.y[index]) < 0.001)
  );
};

const collectCanvasPoints = (value: unknown): number[][] => {
  if (!isRecord(value)) return [];
  const own: number[][] = [];
  if (value.ty === 'sh' && isRecord(value.ks) && isRecord(value.ks.k) && Array.isArray(value.ks.k.v)) {
    own.push(...(value.ks.k.v.filter(Array.isArray) as number[][]));
  }
  if (value.ty === 'sh' && isRecord(value.ks) && Array.isArray(value.ks.k)) {
    for (const keyframe of value.ks.k.filter(isRecord)) {
      const path = Array.isArray(keyframe.s) && isRecord(keyframe.s[0]) ? keyframe.s[0] : null;
      if (path && Array.isArray(path.v)) own.push(...(path.v.filter(Array.isArray) as number[][]));
    }
  }
  if ((value.ty === 'el' || value.ty === 'rc') && isRecord(value.p) && Array.isArray(value.p.k)) {
    if (typeof value.p.k[0] === 'number') own.push(value.p.k as number[]);
    for (const keyframe of value.p.k.filter(isRecord)) if (Array.isArray(keyframe.s)) own.push(keyframe.s as number[]);
  }
  const children = Array.isArray(value.it) ? value.it.flatMap(collectCanvasPoints) : [];
  const layerChildren = Array.isArray(value.shapes) ? value.shapes.flatMap(collectCanvasPoints) : [];
  return [...own, ...children, ...layerChildren];
};

describe('telegram sticker generator', () => {
  it('builds Telegram-safe Lottie dimensions and timing', () => {
    const lottie = buildTelegramStickerLottie(DEFAULT_CONFIG, TELEGRAM_STICKER_SPECS[0]);

    expect(lottie.w).toBe(TELEGRAM_STICKER_SIZE);
    expect(lottie.h).toBe(TELEGRAM_STICKER_SIZE);
    expect(lottie.fr).toBe(TELEGRAM_STICKER_FPS);
    expect(lottie.op).toBe(TELEGRAM_STICKER_FPS * TELEGRAM_STICKER_DURATION_SECONDS);
    expect(lottie.tgs).toBe(1);
    expect(lottie.assets).toEqual([]);
  });

  it('keeps layer transforms static and bakes motion into absolute canvas geometry', () => {
    const lottie = buildTelegramStickerLottie(DEFAULT_CONFIG, TELEGRAM_STICKER_SPECS[0]) as AnyRecord;
    const layers = lottie.layers as AnyRecord[];
    const body = layers.find((layer) => layer.nm === 'body')!;
    const points = collectCanvasPoints(body);

    expect(layers.every((layer) => JSON.stringify((layer.ks as AnyRecord).p) === '{"a":0,"k":[0,0,0]}')).toBe(true);
    expect(layers.every((layer) => JSON.stringify((layer.ks as AnyRecord).a) === '{"a":0,"k":[0,0,0]}')).toBe(true);
    expect(collectAnimatedProperties(body).some((prop) => Array.isArray(prop.k) && isRecord(prop.k[0]?.s?.[0]))).toBe(
      true,
    );
    expect(points.every((point) => point[0] >= 0 && point[0] <= 512 && point[1] >= 0 && point[1] <= 512)).toBe(true);
  });

  it('omits background layers for transparent sticker exports', () => {
    const lottie = buildTelegramStickerLottie(
      { ...DEFAULT_CONFIG, backgroundStyle: 'green-screen' },
      TELEGRAM_STICKER_SPECS[1],
    );
    const layerNames = (lottie.layers as Array<{ nm: string }>).map((layer) => layer.nm.toLowerCase());

    expect(layerNames.some((name) => name.includes('background'))).toBe(false);
  });

  it('ships every stream emote with an animation preset', () => {
    expect(TELEGRAM_STICKER_SPECS).toHaveLength(9);
    expect(TELEGRAM_STICKER_SPECS.map((spec) => spec.slug)).toEqual([
      'happy',
      'love',
      'starry',
      'smug',
      'shocked',
      'angry',
      'cry',
      'cool',
      'dizzy',
    ]);
    expect(Object.keys(TELEGRAM_EMOTION_ANIMATION_PRESETS).sort()).toEqual(
      TELEGRAM_STICKER_SPECS.map((spec) => spec.slug).sort(),
    );
  });

  it('uses Bezier curve handles instead of line-only polygon fragments', () => {
    const lottie = buildTelegramStickerLottie(DEFAULT_CONFIG, TELEGRAM_STICKER_SPECS[0]);
    const paths = collectShapePaths(lottie);

    expect(paths.length).toBeGreaterThan(10);
    expect(paths.filter(hasCurvedHandles).length).toBeGreaterThan(8);
  });

  it('paints layers front-to-back so the face is not buried behind hair/head', () => {
    const lottie = buildTelegramStickerLottie(DEFAULT_CONFIG, TELEGRAM_STICKER_SPECS[0]);
    const names = (lottie.layers as Array<{ nm: string }>).map((layer) => layer.nm);
    const indexOf = (name: string) => names.indexOf(name);

    // Lottie paints array index 0 on top. Front features must come first.
    expect(indexOf('face-expression')).toBeLessThan(indexOf('head-base'));
    expect(indexOf('face-eyes')).toBeLessThan(indexOf('head-base'));
    expect(indexOf('head-base')).toBeLessThan(indexOf('body'));
    expect(indexOf('body')).toBeLessThan(indexOf('back-hair'));
    // Front hair (bangs/sidelocks) frames the face in front of the head.
    expect(indexOf('front-hair')).toBeLessThan(indexOf('face-eyes'));
    expect(indexOf('front-hair')).toBeLessThan(indexOf('head-base'));
    // Back hair is the rear-most content layer.
    expect(indexOf('back-hair')).toBe(names.length - 1);
  });

  it('gives every emotion a distinct animated motion signature', () => {
    const signatures = TELEGRAM_STICKER_SPECS.map((spec) =>
      animatedSignature(buildTelegramStickerLottie(DEFAULT_CONFIG, spec)),
    );

    expect(new Set(signatures).size).toBe(TELEGRAM_STICKER_SPECS.length);
  });

  it('uses Telegram-safe linear keyframe interpolation', () => {
    const lottie = buildTelegramStickerLottie(DEFAULT_CONFIG, TELEGRAM_STICKER_SPECS[0]);
    const keyedFrames = collectAnimatedKeyframes(lottie).filter((keyframe) => 'i' in keyframe || 'o' in keyframe);

    expect(keyedFrames.length).toBeGreaterThan(0);
    expect(keyedFrames.every((keyframe) => handleIsLinear(keyframe.i) && handleIsLinear(keyframe.o))).toBe(true);
  });

  it('uses Bodymovin-TG-style keyframes without explicit end values', () => {
    const lottie = buildTelegramStickerLottie(DEFAULT_CONFIG, TELEGRAM_STICKER_SPECS[0]);

    for (const prop of collectAnimatedProperties(lottie)) {
      const keys = (prop.k as AnyRecord[]).filter(isRecord);
      expect(keys.some((keyframe) => 'e' in keyframe)).toBe(false);
      expect(keys.at(-1)).not.toHaveProperty('i');
      expect(keys.at(-1)).not.toHaveProperty('o');
    }
  });

  it('does not emit duplicate keyframe times inside animated properties', () => {
    for (const spec of TELEGRAM_STICKER_SPECS) {
      const lottie = buildTelegramStickerLottie(DEFAULT_CONFIG, spec) as AnyRecord;
      for (const prop of collectAnimatedProperties(lottie)) {
        const frames = (prop.k as AnyRecord[]).map((keyframe) => keyframe.t);
        expect(new Set(frames).size, spec.slug).toBe(frames.length);
      }
    }
  });

  it('validates generated stickers against Telegram TGS restrictions', () => {
    for (const spec of TELEGRAM_STICKER_SPECS) {
      const lottie = buildTelegramStickerLottie(DEFAULT_CONFIG, spec);
      const errors = validateTelegramStickerLottie(lottie).filter((issue) => issue.severity === 'error');

      expect(errors, spec.slug).toEqual([]);
    }
  });

  it('rejects unsupported Lottie features and oversized TGS payloads', () => {
    const lottie = buildTelegramStickerLottie(DEFAULT_CONFIG, TELEGRAM_STICKER_SPECS[0]) as AnyRecord;
    const bad = {
      ...lottie,
      assets: [{ id: 'image_0' }],
      layers: [
        ...(lottie.layers as unknown[]),
        {
          ddd: 0,
          ty: 2,
          nm: 'image-layer',
          ks: {},
          shapes: [],
          ip: 0,
          op: TELEGRAM_STICKER_FPS * TELEGRAM_STICKER_DURATION_SECONDS,
          st: 0,
        },
      ],
    };

    expect(validateTelegramStickerLottie(bad).map((issue) => issue.code)).toEqual(
      expect.arrayContaining(['telegram.assets.unsupported', 'telegram.layer.non_shape']),
    );
    expect(validateTelegramStickerSize(TELEGRAM_STICKER_MAX_TGS_BYTES + 1)[0]?.code).toBe('telegram.size.too_large');
  });

  it('rejects animated layers that leave the 512x512 sticker canvas', () => {
    const lottie = buildTelegramStickerLottie(DEFAULT_CONFIG, TELEGRAM_STICKER_SPECS[0]) as AnyRecord;
    const body = (lottie.layers as AnyRecord[]).find((layer) => layer.nm === 'body')!;
    const path = collectShapePaths(body)[0];
    const ks = path.ks as AnyRecord;
    const firstPath = (ks.k as AnyRecord[])[0].s[0] as AnyRecord;

    firstPath.v = (firstPath.v as number[][]).map(([x, y]) => [x + 600, y]);

    expect(validateTelegramStickerLottie(lottie).map((issue) => issue.code)).toContain('telegram.bounds.out_of_canvas');
  });

  it('creates a readable ZIP container for sticker packs', async () => {
    const zip = createZipBlob([{ name: 'manifest.json', data: '{"ok":true}' }], new Date('2026-06-01T00:00:00Z'));
    const bytes = new Uint8Array(await zip.arrayBuffer());

    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    expect(bytes[2]).toBe(0x03);
    expect(bytes[3]).toBe(0x04);
  });

  it('creates gzipped Bodymovin JSON for individual .tgs files', async () => {
    const lottie = buildTelegramStickerLottie(DEFAULT_CONFIG, TELEGRAM_STICKER_SPECS[0]);
    const tgs = await gzipString(JSON.stringify(lottie));
    const inflated = JSON.parse(gunzipSync(tgs).toString('utf8')) as AnyRecord;

    expect(tgs[0]).toBe(0x1f);
    expect(tgs[1]).toBe(0x8b);
    expect(inflated.tgs).toBe(1);
    expect(inflated.w).toBe(TELEGRAM_STICKER_SIZE);
    expect(inflated.fr).toBe(TELEGRAM_STICKER_FPS);
  });

  const exportIt = typeof CompressionStream === 'undefined' ? it.skip : it;

  exportIt('exports a validated pack whose individual .tgs files fit Telegram limits', async () => {
    const pack = await createTelegramStickerPack(DEFAULT_CONFIG, 'Miya', new Date('2026-06-01T00:00:00Z'));

    expect(pack.manifest.validated).toBe(true);
    expect(pack.manifest.stickers).toHaveLength(TELEGRAM_STICKER_SPECS.length);
    expect(Math.max(...pack.manifest.stickers.map((sticker) => sticker.sizeBytes))).toBeLessThanOrEqual(
      TELEGRAM_STICKER_MAX_TGS_BYTES,
    );
    expect(pack.manifest.stickers.every((sticker) => sticker.validation.passed)).toBe(true);
  });
});
