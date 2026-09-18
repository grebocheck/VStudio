import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../../presets';
import { TELEGRAM_STICKER_SPECS } from './core';
import {
  createStaticTelegramStickerPack,
  stickerImportReadme,
  TELEGRAM_STICKER_MAX_PNG_BYTES,
  validateStaticStickerSize,
  validateStickerPixels,
} from './staticPack';

const transparentPixels = () => new Uint8ClampedArray(512 * 512 * 4);

describe('static Telegram export safeguards', () => {
  it('rejects blank, opaque and incorrectly sized images', () => {
    expect(() => validateStickerPixels(transparentPixels(), 512, 512)).toThrow('empty');
    const pixels = transparentPixels();
    pixels.fill(255);
    expect(() => validateStickerPixels(pixels, 512, 512)).toThrow('transparent');
    expect(() => validateStickerPixels(pixels, 256, 512)).toThrow('512');
    expect(() => validateStickerPixels(new Uint8ClampedArray(4), 512, 512)).toThrow('complete');
  });

  it('accepts a visible image with alpha and enforces the exact 512 KiB limit', () => {
    const pixels = transparentPixels();
    pixels[1003] = 255;
    expect(() => validateStickerPixels(pixels, 512, 512)).not.toThrow();
    expect(() => validateStaticStickerSize(TELEGRAM_STICKER_MAX_PNG_BYTES)).not.toThrow();
    expect(() => validateStaticStickerSize(TELEGRAM_STICKER_MAX_PNG_BYTES + 1)).toThrow('512 KB');
    expect(() => validateStaticStickerSize(0)).toThrow('empty');
  });

  it('rejects an empty selection before rendering', async () => {
    await expect(createStaticTelegramStickerPack(DEFAULT_CONFIG, 'Miya', { specs: [] })).rejects.toThrow('Choose');
  });

  it('provides both languages, upload commands and the selected emoji map', () => {
    const instructions = stickerImportReadme(
      [{ spec: TELEGRAM_STICKER_SPECS[0], fileName: 'miya-happy.png', blob: new Blob() }],
      'Miya',
    );
    expect(instructions).toContain('ДОДАТИ В TELEGRAM');
    expect(instructions).toContain('ADD TO TELEGRAM');
    expect(instructions).toContain('miya-happy.png → 😊');
    expect(instructions).toContain('/newpack');
    expect(instructions).toContain('/publish');
    expect(instructions).toContain('does not import ZIP');
    expect(instructions).not.toContain('miya-angry.png');
  });
});
