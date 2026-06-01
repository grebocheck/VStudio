import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../presets';
import { parseImportedProject } from './useAvatarStore';

describe('parseImportedProject', () => {
  it('accepts a project config and sanitizes invalid fields', () => {
    const project = parseImportedProject({
      config: {
        name: 'Imported Avatar',
        hairColor: 'not-a-color',
        blushOpacity: 99,
      },
    });

    expect(project.config?.name).toBe('Imported Avatar');
    expect(project.config?.hairColor).toBe(DEFAULT_CONFIG.hairColor);
    expect(project.config?.blushOpacity).toBe(1);
  });

  it('normalizes custom presets and drops malformed entries', () => {
    const project = parseImportedProject({
      customPresets: [
        'bad',
        {
          name: 'Valid Preset',
          config: { clothingStyle: 'maid', headSize: 99 },
        },
      ],
    });

    expect(project.customPresets).toHaveLength(1);
    expect(project.customPresets?.[0].name).toBe('Valid Preset');
    expect(project.customPresets?.[0].config.clothingStyle).toBe('maid');
    expect(project.customPresets?.[0].config.headSize).toBe(1.2);
  });

  it('rejects empty or malformed project files', () => {
    expect(() => parseImportedProject(null)).toThrow();
    expect(() => parseImportedProject({ customPresets: [] })).toThrow();
  });
});
