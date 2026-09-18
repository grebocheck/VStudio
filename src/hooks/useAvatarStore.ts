import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import type { AvatarConfig, PresetAvatar } from '../types';
import { DEFAULT_CONFIG, INITIAL_CONFIG, INITIAL_PRESET, PARAMETRIC_PRESETS, PRESETS } from '../presets';
import { mergeConfig } from '../lib/sanitizeConfig';
import { loadJSON, saveJSON, STORAGE_KEYS } from '../lib/storage';
import {
  avatarEditKey,
  commitAvatarDocument,
  createAvatarHistory,
  redoAvatarHistory,
  sameAvatarConfig,
  undoAvatarHistory,
  type AvatarHistory,
} from '../lib/avatarHistory';
import {
  MAX_CUSTOM_PRESETS,
  MAX_PROJECT_FILE_BYTES,
  parseImportedProject,
  projectFileName,
  sanitizeCustomPresets,
} from '../lib/avatarProject';
import { createAvatarVariation } from '../lib/avatarVariations';

// Kept here for compatibility with callers that previously imported this helper.
export { parseImportedProject } from '../lib/avatarProject';

function restoreHistory(): AvatarHistory {
  const customPresets = sanitizeCustomPresets(loadJSON<unknown>(STORAGE_KEYS.customPresets, []));
  const storedConfig = loadJSON<Partial<AvatarConfig> | null>(STORAGE_KEYS.config, null);
  const config = storedConfig === null ? { ...INITIAL_CONFIG } : mergeConfig(DEFAULT_CONFIG, storedConfig);
  const storedKey = loadJSON<unknown>(
    STORAGE_KEYS.activePresetKey,
    storedConfig === null ? INITIAL_PRESET.id : PARAMETRIC_PRESETS[0].id,
  );
  const preset = [...PRESETS, ...customPresets].find((item) => item.id === storedKey);
  const activePresetKey =
    preset && sameAvatarConfig(mergeConfig(DEFAULT_CONFIG, preset.config), config) ? preset.id : null;
  return createAvatarHistory({ config, activePresetKey, customPresets });
}

function createPresetId(): string {
  const unique = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `custom-${unique}`;
}

export interface AvatarStore {
  config: AvatarConfig;
  /** Built-in/custom preset currently shown, or null for an edited character. */
  activePresetKey: string | null;
  customPresets: PresetAvatar[];
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  randomizeAvatar: () => void;
  /** Apply a built-in or custom preset as one undoable action. */
  applyPreset: (preset: PresetAvatar) => void;
  /** Consecutive changes to the same controls are grouped in undo history. */
  editConfig: React.Dispatch<React.SetStateAction<AvatarConfig>>;
  /** Merge and sanitize an untrusted partial config (e.g. an AI result). */
  mergeIntoConfig: (partial: Partial<AvatarConfig>) => void;
  saveCurrentAsPreset: (label: string) => void;
  deleteCustomPreset: (id: string) => void;
  exportProject: () => void;
  importProject: (file: File) => Promise<void>;
}

export function useAvatarStore(): AvatarStore {
  const [history, setHistory] = useState(restoreHistory);
  const historyRef = useRef(history);
  const { config, activePresetKey, customPresets } = history.present;

  // Compute event transitions synchronously, so validation errors can be shown by
  // callers and rapid edits/imports always see the latest committed document.
  const updateHistory = useCallback((update: (current: AvatarHistory) => AvatarHistory) => {
    const next = update(historyRef.current);
    if (next !== historyRef.current) {
      historyRef.current = next;
      setHistory(next);
    }
  }, []);

  useEffect(() => saveJSON(STORAGE_KEYS.config, config), [config]);
  useEffect(() => saveJSON(STORAGE_KEYS.activePresetKey, activePresetKey), [activePresetKey]);
  useEffect(() => saveJSON(STORAGE_KEYS.customPresets, customPresets), [customPresets]);

  const undo = useCallback(() => updateHistory(undoAvatarHistory), [updateHistory]);
  const redo = useCallback(() => updateHistory(redoAvatarHistory), [updateHistory]);

  const applyPreset = useCallback(
    (preset: PresetAvatar) => {
      updateHistory((current) =>
        commitAvatarDocument(current, {
          ...current.present,
          config: mergeConfig(DEFAULT_CONFIG, preset.config),
          activePresetKey: preset.id,
        }),
      );
    },
    [updateHistory],
  );

  const editConfig = useCallback<React.Dispatch<React.SetStateAction<AvatarConfig>>>(
    (update) => {
      updateHistory((current) => {
        const previous = current.present.config;
        const incoming = typeof update === 'function' ? update({ ...previous }) : update;
        const next = mergeConfig(DEFAULT_CONFIG, incoming);
        if (sameAvatarConfig(previous, next)) return current;
        return commitAvatarDocument(
          current,
          { ...current.present, config: next, activePresetKey: null },
          avatarEditKey(previous, next),
        );
      });
    },
    [updateHistory],
  );

  const mergeIntoConfig = useCallback(
    (partial: Partial<AvatarConfig>) => {
      updateHistory((current) => {
        const next = mergeConfig(current.present.config, partial);
        if (sameAvatarConfig(current.present.config, next)) return current;
        return commitAvatarDocument(current, { ...current.present, config: next, activePresetKey: null });
      });
    },
    [updateHistory],
  );

  const randomizeAvatar = useCallback(() => {
    updateHistory((current) =>
      commitAvatarDocument(current, {
        ...current.present,
        config: createAvatarVariation(current.present.config),
        activePresetKey: null,
      }),
    );
  }, [updateHistory]);

  const saveCurrentAsPreset = useCallback(
    (label: string) => {
      const name = label.trim().slice(0, 80);
      if (!name) throw new Error('Enter a name for your character.');
      updateHistory((current) => {
        if (current.present.customPresets.length >= MAX_CUSTOM_PRESETS) {
          throw new Error(
            `Your library is full (${MAX_CUSTOM_PRESETS} characters). Export it or remove a character first.`,
          );
        }
        const preset = { id: createPresetId(), name, config: { ...current.present.config } };
        return commitAvatarDocument(current, {
          ...current.present,
          activePresetKey: preset.id,
          customPresets: [...current.present.customPresets, preset],
        });
      });
    },
    [updateHistory],
  );

  const deleteCustomPreset = useCallback(
    (id: string) => {
      updateHistory((current) =>
        commitAvatarDocument(current, {
          ...current.present,
          activePresetKey: current.present.activePresetKey === id ? null : current.present.activePresetKey,
          customPresets: current.present.customPresets.filter((preset) => preset.id !== id),
        }),
      );
    },
    [updateHistory],
  );

  const exportProject = useCallback(() => {
    const current = historyRef.current.present;
    const blob = new Blob(
      [JSON.stringify({ version: 1, config: current.config, customPresets: current.customPresets }, null, 2)],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = projectFileName(current.config.name);
    document.body.appendChild(link);
    try {
      link.click();
    } finally {
      link.remove();
      // Keep the URL alive until the browser has started the download.
      setTimeout(() => URL.revokeObjectURL(url), 1_000);
    }
  }, []);

  const importProject = useCallback(
    async (file: File) => {
      if (file.size > MAX_PROJECT_FILE_BYTES) throw new Error('Project files must be smaller than 2 MB.');
      const text = await file.text();
      let raw: unknown;
      try {
        raw = JSON.parse(text);
      } catch {
        throw new Error('This file is not valid JSON. Choose a .vstudio.json project.');
      }
      const data = parseImportedProject(raw);
      const importedPresets = (data.customPresets ?? []).map((preset) => ({ ...preset, id: createPresetId() }));
      updateHistory((current) => {
        if (current.present.customPresets.length + importedPresets.length > MAX_CUSTOM_PRESETS) {
          throw new Error(
            `Import would exceed the library limit of ${MAX_CUSTOM_PRESETS} characters. Remove some characters first.`,
          );
        }
        return commitAvatarDocument(current, {
          config: data.config ?? current.present.config,
          activePresetKey: data.config ? null : current.present.activePresetKey,
          customPresets: [...current.present.customPresets, ...importedPresets],
        });
      });
    },
    [updateHistory],
  );

  return {
    config,
    activePresetKey,
    customPresets,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    undo,
    redo,
    randomizeAvatar,
    applyPreset,
    editConfig,
    mergeIntoConfig,
    saveCurrentAsPreset,
    deleteCustomPreset,
    exportProject,
    importProject,
  };
}
