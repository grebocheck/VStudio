import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../presets';
import {
  buildTelegramStickerLottie,
  createZipBlob,
  TELEGRAM_STICKER_DURATION_SECONDS,
  TELEGRAM_STICKER_FPS,
  TELEGRAM_STICKER_SIZE,
  TELEGRAM_STICKER_SPECS,
} from './telegramStickers';

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

  it('ships the stream emote set as individual Telegram stickers', () => {
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
  });

  it('creates a readable ZIP container for sticker packs', async () => {
    const zip = createZipBlob([{ name: 'manifest.json', data: '{"ok":true}' }], new Date('2026-06-01T00:00:00Z'));
    const bytes = new Uint8Array(await zip.arrayBuffer());

    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    expect(bytes[2]).toBe(0x03);
    expect(bytes[3]).toBe(0x04);
  });
});
