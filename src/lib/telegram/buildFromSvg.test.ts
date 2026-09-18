import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../../presets';
import { TELEGRAM_STICKER_SPECS } from './core';
import { buildTelegramStickerLottieFromAvatar } from './buildFromSvg';
import { buildTelegramStickerLottie } from './build';
import { createTelegramStickerPack } from './pack';

describe('illustrated model TGS compatibility', () => {
  it('rejects illustrated models before dropping their image layers', () => {
    expect(() =>
      buildTelegramStickerLottieFromAvatar({ ...DEFAULT_CONFIG, modelId: 'miya-nocturne' }, TELEGRAM_STICKER_SPECS[0]),
    ).toThrow('Export PNG');
  });

  it('rejects 3D models through both vector builders and the pack API', async () => {
    const config = { ...DEFAULT_CONFIG, modelId: 'aurelia-3d' as const };
    expect(() => buildTelegramStickerLottie(config, TELEGRAM_STICKER_SPECS[0])).toThrow('3D model');
    expect(() => buildTelegramStickerLottieFromAvatar(config, TELEGRAM_STICKER_SPECS[0])).toThrow('3D model');
    await expect(createTelegramStickerPack(config, 'Aurelia')).rejects.toThrow('3D model');
  });

  it('also rejects procedural replacement artwork through the public pack API', async () => {
    const config = { ...DEFAULT_CONFIG, modelId: 'miya-nocturne' as const };
    expect(() => buildTelegramStickerLottie(config, TELEGRAM_STICKER_SPECS[0])).toThrow('Export PNG');
    await expect(createTelegramStickerPack(config, 'Nocturne')).rejects.toThrow('Export PNG');
  });
});
