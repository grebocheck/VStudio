import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { parseHTML } from 'linkedom';
import { DEFAULT_CONFIG, INITIAL_PRESET, MIYA_NOCTURNE_PRESET, PARAMETRIC_PRESETS, PRESETS } from '../presets';
import { MAX_CUSTOM_PRESETS, MAX_PROJECT_FILE_BYTES } from '../lib/avatarProject';
import { STORAGE_KEYS } from '../lib/storage';
import { parseImportedProject, useAvatarStore, type AvatarStore } from './useAvatarStore';

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

describe('useAvatarStore project workflow', () => {
  let root: Root;
  let store: AvatarStore;
  let storage: Map<string, string>;

  function Harness() {
    store = useAvatarStore();
    return null;
  }

  async function mount() {
    await act(async () => root.render(createElement(Harness)));
  }

  const projectFile = (raw: unknown): File => ({ size: 1, text: async () => JSON.stringify(raw) }) as File;

  beforeEach(() => {
    const { window, document } = parseHTML('<html><body><main></main></body></html>');
    storage = new Map();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    });
    vi.stubGlobal('window', window);
    vi.stubGlobal('document', document);
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    root = createRoot(document.querySelector('main')!);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('starts a new studio with Aurelia and preserves the model through saved presentation changes', async () => {
    await mount();
    expect(store.config.modelId).toBe('aurelia-3d');
    expect(store.activePresetKey).toBe(INITIAL_PRESET.id);
    await act(async () =>
      store.editConfig((previous) => ({ ...previous, modelFraming: 'full', modelGlow: true, motionIntensity: 1.35 })),
    );
    await act(async () => store.saveCurrentAsPreset('My Aurelia'));
    const saved = store.customPresets[0];
    await act(async () => store.applyPreset(PARAMETRIC_PRESETS[0]));
    expect(store.config.modelId).toBe('parametric');
    await act(async () => store.applyPreset(saved));
    expect(store.config.modelId).toBe('aurelia-3d');
    expect(store.config.modelFraming).toBe('full');
    expect(store.config.modelGlow).toBe(true);
    expect(store.config.motionIntensity).toBe(1.35);
  });

  it('restores old saved characters without changing their renderer or active preset', async () => {
    storage.set(STORAGE_KEYS.config, JSON.stringify(PARAMETRIC_PRESETS[0].config));
    await mount();
    expect(store.config.modelId).toBe('parametric');
    expect(store.config.name).toBe(PARAMETRIC_PRESETS[0].config.name);
    expect(store.activePresetKey).toBe(PARAMETRIC_PRESETS[0].id);
  });

  it('restores an existing Miya project at natural motion without clearing its preset selection', async () => {
    const oldConfig = { ...MIYA_NOCTURNE_PRESET.config };
    delete oldConfig.motionIntensity;
    storage.set(STORAGE_KEYS.config, JSON.stringify(oldConfig));
    storage.set(STORAGE_KEYS.activePresetKey, JSON.stringify(MIYA_NOCTURNE_PRESET.id));
    await mount();
    expect(store.config.motionIntensity).toBe(1);
    expect(store.activePresetKey).toBe(MIYA_NOCTURNE_PRESET.id);
  });

  it('imports old model files as parametric even when the current model is 3D', async () => {
    await mount();
    await act(async () => store.importProject(projectFile({ config: { name: 'Legacy character' } })));
    expect(store.config.modelId).toBe('parametric');
    await act(async () => store.undo());
    expect(store.config.modelId).toBe('aurelia-3d');
  });

  it('groups rapid functional edits, ignores no-ops, and restores preset selection', async () => {
    await mount();
    const original = store.config;
    expect(store.activePresetKey).toBe(PRESETS[0].id);
    await act(async () => {
      store.editConfig((previous) => ({ ...previous }));
    });
    expect(store.activePresetKey).toBe(PRESETS[0].id);
    expect(store.canUndo).toBe(false);
    await act(async () => {
      store.editConfig((previous) => ({ ...previous, name: 'A' }));
      store.editConfig((previous) => ({ ...previous, name: previous.name + 'B' }));
      store.editConfig((previous) => ({ ...previous, name: previous.name + 'C' }));
    });
    expect(store.config.name).toBe('ABC');
    expect(store.activePresetKey).toBeNull();
    await act(async () => store.undo());
    expect(store.config).toEqual(original);
    expect(store.activePresetKey).toBe(PRESETS[0].id);
    expect(store.canUndo).toBe(false);
    expect(store.canRedo).toBe(true);
    await act(async () => store.redo());
    expect(store.config.name).toBe('ABC');
    expect(JSON.parse(storage.get(STORAGE_KEYS.config)!)).toEqual(store.config);
  });

  it('restores an applied preset and a randomized look as individual commands', async () => {
    await mount();
    await act(async () => store.applyPreset(PRESETS[1]));
    const preset = store.config;
    await act(async () => store.randomizeAvatar());
    const variation = store.config;
    expect(variation.name).toBe(preset.name);
    expect(variation.lore).toBe(preset.lore);
    await act(async () => store.undo());
    expect(store.config).toEqual(preset);
    expect(store.activePresetKey).toBe(PRESETS[1].id);
    await act(async () => store.redo());
    expect(store.config).toEqual(variation);
  });

  it('makes saves and deletions undoable without mutating saved character snapshots', async () => {
    await mount();
    await act(async () => store.saveCurrentAsPreset('  Favorite  '));
    const saved = store.customPresets[0];
    expect(saved.name).toBe('Favorite');
    await act(async () => store.editConfig((previous) => ({ ...previous, name: 'Edited' })));
    expect(store.customPresets[0].config.name).toBe(saved.config.name);
    await act(async () => store.deleteCustomPreset(saved.id));
    expect(store.customPresets).toEqual([]);
    await act(async () => store.undo());
    expect(store.customPresets).toEqual([saved]);
    expect(() => store.saveCurrentAsPreset(' ')).toThrow(/name/);
  });

  it('imports config and library atomically and undoes both together', async () => {
    await mount();
    const original = store.config;
    await act(async () => {
      await store.importProject(
        projectFile({
          version: 1,
          config: { ...PRESETS[1].config, name: 'Imported' },
          customPresets: [{ name: 'Also imported', config: PRESETS[2].config }],
        }),
      );
    });
    expect(store.config.name).toBe('Imported');
    expect(store.customPresets).toHaveLength(1);
    expect(store.customPresets[0].id).toMatch(/^custom-/);
    await act(async () => store.undo());
    expect(store.config).toEqual(original);
    expect(store.customPresets).toEqual([]);
    await act(async () => store.redo());
    expect(store.config.name).toBe('Imported');
    expect(store.customPresets).toHaveLength(1);
  });

  it('rejects malformed/oversized imports without changing the document', async () => {
    await mount();
    const original = store.config;
    const read = vi.fn();
    await expect(
      store.importProject({ size: MAX_PROJECT_FILE_BYTES + 1, text: read } as unknown as File),
    ).rejects.toThrow(/2 MB/);
    expect(read).not.toHaveBeenCalled();
    await expect(store.importProject({ size: 1, text: async () => '{broken' } as File)).rejects.toThrow(/JSON/);
    await expect(store.importProject(projectFile({ version: 100, config: DEFAULT_CONFIG }))).rejects.toThrow(/version/);
    expect(store.config).toBe(original);
    expect(store.canUndo).toBe(false);
  });

  it('rejects full-library imports and saves without partially applying config changes', async () => {
    storage.set(
      STORAGE_KEYS.customPresets,
      JSON.stringify(
        Array.from({ length: MAX_CUSTOM_PRESETS }, (_, index) => ({
          id: `custom-${index}`,
          name: `Saved ${index}`,
          config: DEFAULT_CONFIG,
        })),
      ),
    );
    await mount();
    const original = store.config;
    expect(() => store.saveCurrentAsPreset('Overflow')).toThrow(/full/);
    await expect(
      store.importProject(
        projectFile({
          config: { ...DEFAULT_CONFIG, name: 'Must not appear' },
          customPresets: [{ config: DEFAULT_CONFIG }],
        }),
      ),
    ).rejects.toThrow(/limit/);
    expect(store.config).toBe(original);
    expect(store.customPresets).toHaveLength(MAX_CUSTOM_PRESETS);
    expect(store.canUndo).toBe(false);
  });

  it('repairs malformed persisted libraries and stale active preset keys on startup', async () => {
    storage.set(STORAGE_KEYS.customPresets, JSON.stringify([null, { name: 'Missing config' }]));
    storage.set(STORAGE_KEYS.activePresetKey, JSON.stringify('nonexistent'));
    storage.set(STORAGE_KEYS.config, JSON.stringify({ ...DEFAULT_CONFIG, hairColor: 'invalid' }));
    await mount();
    expect(store.customPresets).toEqual([]);
    expect(store.activePresetKey).toBeNull();
    expect(store.config.hairColor).toBe(DEFAULT_CONFIG.hairColor);
  });
});
