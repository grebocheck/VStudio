import { useCallback, useEffect, useState } from 'react';
import type React from 'react';
import { AvatarConfig, PresetAvatar } from '../types';
import { DEFAULT_CONFIG } from '../presets';
import { mergeConfig } from '../lib/sanitizeConfig';
import { loadJSON, saveJSON, STORAGE_KEYS } from '../lib/storage';

interface ImportedProject {
  config?: Partial<AvatarConfig>;
  customPresets?: PresetAvatar[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export const parseImportedProject = (raw: unknown): ImportedProject => {
  if (!isRecord(raw)) throw new Error('Invalid V-Studio project file.');

  const project: ImportedProject = {};
  if (isRecord(raw.config)) {
    project.config = mergeConfig(DEFAULT_CONFIG, raw.config as Partial<AvatarConfig>);
  }
  if (Array.isArray(raw.customPresets)) {
    project.customPresets = raw.customPresets
      .filter(isRecord)
      .map((preset, index) => ({
        id: typeof preset.id === 'string' ? preset.id : `imported-${index}`,
        name: typeof preset.name === 'string' ? preset.name.slice(0, 80) : `Imported ${index + 1}`,
        config: mergeConfig(DEFAULT_CONFIG, isRecord(preset.config) ? preset.config as Partial<AvatarConfig> : {}),
      }));
  }

  if (!project.config && !project.customPresets?.length) {
    throw new Error('No avatar config or custom presets found in the project file.');
  }

  return project;
};

export interface AvatarStore {
  config: AvatarConfig;
  /** Built-in preset id currently shown, or null for custom/AI/edited avatars. */
  activePresetKey: string | null;
  customPresets: PresetAvatar[];
  /** Apply a (built-in or custom) preset wholesale. */
  applyPreset: (preset: PresetAvatar) => void;
  /** Manual edit from the UI — clears the active preset key. */
  editConfig: React.Dispatch<React.SetStateAction<AvatarConfig>>;
  /** Replace config from an untrusted source (AI / import), sanitized + merged. */
  mergeIntoConfig: (partial: Partial<AvatarConfig>) => void;
  saveCurrentAsPreset: (label: string) => void;
  deleteCustomPreset: (id: string) => void;
  exportProject: () => void;
  importProject: (file: File) => Promise<void>;
}

export function useAvatarStore(): AvatarStore {
  const [config, setConfig] = useState<AvatarConfig>(() =>
    mergeConfig(DEFAULT_CONFIG, loadJSON<Partial<AvatarConfig>>(STORAGE_KEYS.config, DEFAULT_CONFIG)),
  );
  const [activePresetKey, setActivePresetKey] = useState<string | null>(() =>
    loadJSON<string | null>(STORAGE_KEYS.activePresetKey, 'cyber-neko'),
  );
  const [customPresets, setCustomPresets] = useState<PresetAvatar[]>(() =>
    loadJSON<PresetAvatar[]>(STORAGE_KEYS.customPresets, []),
  );

  // Best-effort persistence.
  useEffect(() => saveJSON(STORAGE_KEYS.config, config), [config]);
  useEffect(() => saveJSON(STORAGE_KEYS.activePresetKey, activePresetKey), [activePresetKey]);
  useEffect(() => saveJSON(STORAGE_KEYS.customPresets, customPresets), [customPresets]);

  const applyPreset = useCallback((preset: PresetAvatar) => {
    setConfig(preset.config);
    setActivePresetKey(preset.id);
  }, []);

  // Wrap setConfig so any manual edit detaches from the active preset.
  const editConfig = useCallback<React.Dispatch<React.SetStateAction<AvatarConfig>>>((update) => {
    setActivePresetKey(null);
    setConfig(update);
  }, []);

  const mergeIntoConfig = useCallback((partial: Partial<AvatarConfig>) => {
    setActivePresetKey(null);
    setConfig((prev) => mergeConfig(prev, partial));
  }, []);

  const saveCurrentAsPreset = useCallback((label: string) => {
    setCustomPresets((prev) => [
      ...prev,
      { id: `custom-${Date.now()}`, name: label, config: { ...config } },
    ]);
  }, [config]);

  const deleteCustomPreset = useCallback((id: string) => {
    setCustomPresets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const exportProject = useCallback(() => {
    const blob = new Blob([JSON.stringify({ version: 1, config, customPresets }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(config.name || 'vstudio-avatar').replace(/\s+/g, '_')}.vstudio.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [config, customPresets]);

  const importProject = useCallback(async (file: File) => {
    const text = await file.text();
    const data = parseImportedProject(JSON.parse(text));
    if (data.config) {
      setActivePresetKey(null);
      setConfig((prev) => mergeConfig(prev, data.config));
    }
    if (Array.isArray(data.customPresets)) {
      setCustomPresets((prev) => [
        ...prev,
        ...data.customPresets.map((p) => ({
          ...p,
          id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        })),
      ]);
    }
  }, []);

  return {
    config,
    activePresetKey,
    customPresets,
    applyPreset,
    editConfig,
    mergeIntoConfig,
    saveCurrentAsPreset,
    deleteCustomPreset,
    exportProject,
    importProject,
  };
}
