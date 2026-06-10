import { describe, it, expect } from 'vitest';
import { mergeConfig } from './sanitizeConfig';
import { DEFAULT_CONFIG } from '../presets';

describe('mergeConfig', () => {
  it('returns the base unchanged for null/garbage input', () => {
    expect(mergeConfig(DEFAULT_CONFIG, null)).toEqual(DEFAULT_CONFIG);
    expect(mergeConfig(DEFAULT_CONFIG, undefined)).toEqual(DEFAULT_CONFIG);
    // @ts-expect-error testing runtime robustness against wrong types
    expect(mergeConfig(DEFAULT_CONFIG, 'nope')).toEqual(DEFAULT_CONFIG);
  });

  it('accepts valid enum values and rejects invalid ones', () => {
    const out = mergeConfig(DEFAULT_CONFIG, { pupilStyle: 'star', clothingStyle: 'maid' });
    expect(out.pupilStyle).toBe('star');
    expect(out.clothingStyle).toBe('maid');

    const bad = mergeConfig(DEFAULT_CONFIG, { pupilStyle: 'lasers' as never });
    expect(bad.pupilStyle).toBe(DEFAULT_CONFIG.pupilStyle);
  });

  it('accepts valid HEX colors and rejects malformed ones', () => {
    expect(mergeConfig(DEFAULT_CONFIG, { hairColor: '#abc' }).hairColor).toBe('#abc');
    expect(mergeConfig(DEFAULT_CONFIG, { hairColor: '#aabbccdd' }).hairColor).toBe('#aabbccdd');
    expect(mergeConfig(DEFAULT_CONFIG, { hairColor: 'red' }).hairColor).toBe(DEFAULT_CONFIG.hairColor);
    expect(mergeConfig(DEFAULT_CONFIG, { hairColor: '#xyz123' }).hairColor).toBe(DEFAULT_CONFIG.hairColor);
  });

  it('clamps numeric ranges', () => {
    expect(mergeConfig(DEFAULT_CONFIG, { blushOpacity: 5 }).blushOpacity).toBe(1);
    expect(mergeConfig(DEFAULT_CONFIG, { blushOpacity: -2 }).blushOpacity).toBe(0);
    expect(mergeConfig(DEFAULT_CONFIG, { headSize: 99 }).headSize).toBe(1.2);
    expect(mergeConfig(DEFAULT_CONFIG, { headSize: 0 }).headSize).toBe(0.8);
  });

  it('caps free-text length and coerces booleans', () => {
    const longName = 'x'.repeat(200);
    expect(mergeConfig(DEFAULT_CONFIG, { name: longName }).name.length).toBe(60);
    expect(mergeConfig(DEFAULT_CONFIG, { hasFangs: true }).hasFangs).toBe(true);
    // non-boolean ignored
    expect(mergeConfig(DEFAULT_CONFIG, { hasFangs: 'yes' as never }).hasFangs).toBe(DEFAULT_CONFIG.hasFangs);
  });

  it('accepts the Phase-1 face detailing enums and rejects junk values', () => {
    const out = mergeConfig(DEFAULT_CONFIG, {
      irisStyle: 'galaxy',
      eyeHighlightStyle: 'double-spark',
      mouthShape: 'pouty',
      lipStyle: 'glossy',
      toothStyle: 'sharp-teeth',
      faceScar: 'eye-scar',
      earDecoration: 'piercing',
    });
    expect(out.irisStyle).toBe('galaxy');
    expect(out.eyeHighlightStyle).toBe('double-spark');
    expect(out.mouthShape).toBe('pouty');
    expect(out.lipStyle).toBe('glossy');
    expect(out.toothStyle).toBe('sharp-teeth');
    expect(out.faceScar).toBe('eye-scar');
    expect(out.earDecoration).toBe('piercing');

    const bad = mergeConfig(DEFAULT_CONFIG, {
      irisStyle: 'laser' as never,
      toothStyle: 'gold' as never,
      faceScar: 'everywhere' as never,
    });
    expect(bad.irisStyle).toBe(DEFAULT_CONFIG.irisStyle);
    expect(bad.toothStyle).toBe(DEFAULT_CONFIG.toothStyle);
    expect(bad.faceScar).toBe(DEFAULT_CONFIG.faceScar);
  });

  it('validates lipColor as HEX', () => {
    expect(mergeConfig(DEFAULT_CONFIG, { lipColor: '#ff3366' }).lipColor).toBe('#ff3366');
    expect(mergeConfig(DEFAULT_CONFIG, { lipColor: 'crimson' }).lipColor).toBe(DEFAULT_CONFIG.lipColor);
  });

  it('does not mutate the base config', () => {
    const snapshot = JSON.stringify(DEFAULT_CONFIG);
    mergeConfig(DEFAULT_CONFIG, { hairColor: '#000000', headSize: 1.1 });
    expect(JSON.stringify(DEFAULT_CONFIG)).toBe(snapshot);
  });
});
