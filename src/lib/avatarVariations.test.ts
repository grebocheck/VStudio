import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, MIYA_NOCTURNE_PRESET, PRESETS } from '../presets';
import { createAvatarVariation } from './avatarVariations';
import { mergeConfig } from './sanitizeConfig';

describe('curated avatar variations', () => {
  it('preserves character identity and coordinates the palette', () => {
    const current = { ...DEFAULT_CONFIG, name: 'Мія', lore: 'My story' };
    const before = JSON.stringify(PRESETS);
    const variation = createAvatarVariation(current, () => 0.4);
    expect(variation.name).toBe(current.name);
    expect(variation.lore).toBe(current.lore);
    expect(variation.hairColor).toBe(variation.eyebrowColor);
    expect(variation.clothingColor2).toBe(variation.accessoryColor);
    expect(variation.eyeColorRight).toBe(variation.eyeColor);
    expect(variation.activeEmotion).toBe('none');
    expect(JSON.stringify(PRESETS)).toBe(before);
  });

  it('only generates supported configurations from complete starter silhouettes', () => {
    const looks = new Set<string>();
    for (let index = 0; index < 100; index++) {
      const variation = createAvatarVariation(DEFAULT_CONFIG, () => index / 100);
      expect(mergeConfig(DEFAULT_CONFIG, variation)).toEqual(variation);
      expect(PRESETS.some((preset) => preset.config.hairStyleBack === variation.hairStyleBack)).toBe(true);
      expect(PRESETS.some((preset) => preset.config.clothingStyle === variation.clothingStyle)).toBe(true);
      looks.add(JSON.stringify(variation));
    }
    expect(looks.size).toBeGreaterThan(6);
  });

  it('only randomizes editable models when starting from the authored illustration', () => {
    for (const random of [0, 0.25, 0.5, 0.75, 0.999]) {
      const variation = createAvatarVariation(MIYA_NOCTURNE_PRESET.config, () => random);
      expect(variation.modelId).toBe('parametric');
      expect(variation.name).toBe(MIYA_NOCTURNE_PRESET.config.name);
    }
  });
});
