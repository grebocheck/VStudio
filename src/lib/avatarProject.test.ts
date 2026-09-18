import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../presets';
import { MAX_CUSTOM_PRESETS, parseImportedProject, projectFileName, sanitizeCustomPresets } from './avatarProject';

describe('project validation and recovery', () => {
  it('rejects unsupported versions and malformed structures before importing', () => {
    for (const raw of [
      { version: 2, config: DEFAULT_CONFIG },
      { config: [] },
      { config: {} },
      { config: { unrelated: true } },
      { customPresets: {} },
      { customPresets: [null, {}, { config: [] }] },
    ]) {
      expect(() => parseImportedProject(raw)).toThrow();
    }
  });

  it('rejects oversized imports and limits persisted recovery', () => {
    const customPresets = Array.from({ length: MAX_CUSTOM_PRESETS + 1 }, () => ({ config: DEFAULT_CONFIG }));
    expect(() => parseImportedProject({ customPresets })).toThrow(/at most 50/);
    expect(sanitizeCustomPresets(customPresets)).toHaveLength(MAX_CUSTOM_PRESETS);
  });

  it('recovers only valid saved characters, unique IDs, and bounded names', () => {
    const presets = sanitizeCustomPresets([
      null,
      { name: 'missing config' },
      { id: 'custom-one', name: '  Saved  ', config: { ...DEFAULT_CONFIG, hairColor: 'url(bad)' } },
      { id: 'custom-one', name: 'x'.repeat(150), config: DEFAULT_CONFIG },
      { id: 'cyber-neko', name: '', config: DEFAULT_CONFIG },
    ]);
    expect(presets).toHaveLength(3);
    expect(new Set(presets.map((preset) => preset.id)).size).toBe(3);
    expect(presets[0].name).toBe('Saved');
    expect(presets[0].config.hairColor).toBe(DEFAULT_CONFIG.hairColor);
    expect(presets[1].name).toHaveLength(80);
    expect(presets[2].id).toMatch(/^custom-/);
    expect(sanitizeCustomPresets({ malformed: true })).toEqual([]);
  });

  it('uses portable project filenames while preserving Unicode names', () => {
    expect(projectFileName('  Моя Мія / стрім?  ')).toBe('Моя_Мія_стрім.vstudio.json');
    expect(projectFileName('../\\:*?"<>|\u0000')).toBe('vstudio-avatar.vstudio.json');
  });
});
