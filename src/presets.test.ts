import { describe, it, expect } from 'vitest';
import { PRESETS, localizePreset } from './presets';
import { en } from './i18n/en';
import { uk } from './i18n/uk';

describe('preset localization', () => {
  it('every built-in preset has matching _name/_lore in both locales', () => {
    for (const preset of PRESETS) {
      for (const locale of [en, uk]) {
        const stats = locale.presetStats as Record<string, string>;
        expect(stats[`${preset.id}_name`], `${preset.id}_name missing`).toBeTruthy();
        expect(stats[`${preset.id}_lore`], `${preset.id}_lore missing`).toBeTruthy();
      }
    }
  });

  it('localizePreset resolves a known key', () => {
    const result = localizePreset('cyber-neko', en);
    expect(result).not.toBeNull();
    expect(result?.name).toContain('Miya');
  });

  it('localizePreset returns null for null or unknown keys (custom/AI avatars)', () => {
    expect(localizePreset(null, en)).toBeNull();
    expect(localizePreset('custom-12345', en)).toBeNull();
  });
});
