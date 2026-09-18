import { describe, it, expect } from 'vitest';
import { mergeConfig } from './sanitizeConfig';
import { DEFAULT_CONFIG, MIYA_NOCTURNE_PRESET } from '../presets';

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

  it('round-trips authored model settings while rejecting unsupported assets and framing', () => {
    const illustrated = mergeConfig(DEFAULT_CONFIG, {
      ...MIYA_NOCTURNE_PRESET.config,
      modelFraming: 'halfbody',
      modelGlow: true,
    });
    expect(illustrated.modelId).toBe('miya-nocturne');
    expect(illustrated.modelFraming).toBe('halfbody');
    expect(illustrated.modelGlow).toBe(true);
    const invalid = mergeConfig(illustrated, {
      modelId: 'https://example.com/model.svg' as never,
      modelFraming: 'unknown' as never,
      modelGlow: 'yes' as never,
    });
    expect(invalid).toEqual(illustrated);
    expect(mergeConfig(DEFAULT_CONFIG, { name: 'Old project' }).modelId).toBe('parametric');
    expect(mergeConfig(DEFAULT_CONFIG, { modelId: 'aurelia-3d', modelFraming: 'full' })).toMatchObject({
      modelId: 'aurelia-3d',
      modelFraming: 'full',
    });
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

  it('bounds motion energy and preserves the natural value on invalid imports', () => {
    const model = MIYA_NOCTURNE_PRESET.config;
    expect(mergeConfig(model, { motionIntensity: 0.55 }).motionIntensity).toBe(0.55);
    expect(mergeConfig(model, { motionIntensity: -1 }).motionIntensity).toBe(0.35);
    expect(mergeConfig(model, { motionIntensity: 90 }).motionIntensity).toBe(1.5);
    for (const value of [NaN, Infinity, -Infinity, 'high', null]) {
      expect(mergeConfig(model, { motionIntensity: value as never }).motionIntensity).toBe(1);
    }
  });

  it('ignores non-finite numbers instead of letting NaN reach SVG geometry', () => {
    for (const value of [NaN, Infinity, -Infinity]) {
      expect(mergeConfig(DEFAULT_CONFIG, { headSize: value }).headSize).toBe(DEFAULT_CONFIG.headSize);
      expect(mergeConfig(DEFAULT_CONFIG, { blushOpacity: value }).blushOpacity).toBe(DEFAULT_CONFIG.blushOpacity);
    }
  });

  it('round-trips valid expressions and rejects unknown expressions', () => {
    expect(mergeConfig(DEFAULT_CONFIG, { activeEmotion: 'happy' }).activeEmotion).toBe('happy');
    expect(mergeConfig(DEFAULT_CONFIG, { activeEmotion: 'invalid' as never }).activeEmotion).toBe(
      DEFAULT_CONFIG.activeEmotion,
    );
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
