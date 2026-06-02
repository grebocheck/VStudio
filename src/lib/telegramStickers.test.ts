import { describe, expect, it } from 'vitest';
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
  const k = ks && isRecord(ks.k) ? ks.k : null;
  const handles = [...(Array.isArray(k?.i) ? k.i : []), ...(Array.isArray(k?.o) ? k.o : [])];
  return handles.some(
    (handle) => Array.isArray(handle) && handle.some((value) => typeof value === 'number' && Math.abs(value) > 0.01),
  );
};

const animatedSignature = (lottie: AnyRecord) =>
  (Array.isArray(lottie.layers) ? lottie.layers : [])
    .map((layer) => {
      if (!isRecord(layer) || !isRecord(layer.ks)) return '';
      return `${layer.nm}:${JSON.stringify({
        p: layer.ks.p,
        s: layer.ks.s,
        r: layer.ks.r,
        o: layer.ks.o,
      })}`;
    })
    .join('|');

describe('telegram sticker generator', () => {
  it('builds Telegram-safe Lottie dimensions and timing', () => {
    const lottie = buildTelegramStickerLottie(DEFAULT_CONFIG, TELEGRAM_STICKER_SPECS[0]);

    expect(lottie.w).toBe(TELEGRAM_STICKER_SIZE);
    expect(lottie.h).toBe(TELEGRAM_STICKER_SIZE);
    expect(lottie.fr).toBe(TELEGRAM_STICKER_FPS);
    expect(lottie.op).toBe(TELEGRAM_STICKER_FPS * TELEGRAM_STICKER_DURATION_SECONDS);
    expect(lottie.assets).toEqual([]);
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

  it('creates a readable ZIP container for sticker packs', async () => {
    const zip = createZipBlob([{ name: 'manifest.json', data: '{"ok":true}' }], new Date('2026-06-01T00:00:00Z'));
    const bytes = new Uint8Array(await zip.arrayBuffer());

    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    expect(bytes[2]).toBe(0x03);
    expect(bytes[3]).toBe(0x04);
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
