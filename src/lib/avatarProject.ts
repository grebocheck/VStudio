import type { AvatarConfig, PresetAvatar } from '../types';
import { DEFAULT_CONFIG, PRESETS } from '../presets';
import { mergeConfig } from './sanitizeConfig';

export const MAX_CUSTOM_PRESETS = 50;
export const MAX_PROJECT_FILE_BYTES = 2 * 1024 * 1024;

export interface ImportedProject {
  config?: AvatarConfig;
  customPresets?: PresetAvatar[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

function readConfig(raw: unknown): AvatarConfig | null {
  if (!isRecord(raw)) return null;
  const config = mergeConfig(DEFAULT_CONFIG, raw);
  return Object.keys(raw).some((key) => Object.hasOwn(config, key)) ? config : null;
}

/** Malformed persisted entries must never reach the renderer or preset list. */
export function sanitizeCustomPresets(raw: unknown): PresetAvatar[] {
  if (!Array.isArray(raw)) return [];
  const presets: PresetAvatar[] = [];
  const usedIds = new Set(PRESETS.map((preset) => preset.id));
  for (const [index, entry] of raw.slice(0, MAX_CUSTOM_PRESETS).entries()) {
    if (!isRecord(entry)) continue;
    const config = readConfig(entry.config);
    if (!config) continue;
    let id =
      typeof entry.id === 'string' && /^custom-[a-zA-Z0-9_-]{1,100}$/.test(entry.id)
        ? entry.id
        : `custom-restored-${index}`;
    while (usedIds.has(id)) id = `${id}-${index}`;
    usedIds.add(id);
    const name = typeof entry.name === 'string' ? entry.name.trim().slice(0, 80) : '';
    presets.push({ id, name: name || config.name.trim() || `Avatar ${index + 1}`, config });
  }
  return presets;
}

export function parseImportedProject(raw: unknown): ImportedProject {
  if (!isRecord(raw)) throw new Error('Invalid V-Studio project file.');
  if (raw.version !== undefined && raw.version !== 1) {
    throw new Error('Unsupported project version. Open a version 1 V-Studio project.');
  }
  if (Array.isArray(raw.customPresets) && raw.customPresets.length > MAX_CUSTOM_PRESETS) {
    throw new Error(`A project can contain at most ${MAX_CUSTOM_PRESETS} saved characters.`);
  }
  const project: ImportedProject = {};
  if (raw.config !== undefined) {
    const config = readConfig(raw.config);
    if (!config) throw new Error('The project contains an invalid avatar configuration.');
    project.config = config;
  }
  if (raw.customPresets !== undefined) {
    if (!Array.isArray(raw.customPresets)) throw new Error('The saved character list must be an array.');
    project.customPresets = sanitizeCustomPresets(raw.customPresets);
  }
  if (!project.config && !project.customPresets?.length) {
    throw new Error('No avatar config or custom presets found in the project file.');
  }
  return project;
}

export function projectFileName(name: string): string {
  const safe = name
    .normalize('NFKC')
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\p{Cc}/gu, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 60);
  return `${safe || 'vstudio-avatar'}.vstudio.json`;
}
