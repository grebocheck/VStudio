import type { AvatarConfig, PresetAvatar } from '../types';

export const AVATAR_HISTORY_LIMIT = 60;
export const EDIT_GROUP_WINDOW_MS = 500;

/** One project snapshot. Presets and their configs are immutable after creation. */
export interface AvatarDocument {
  config: AvatarConfig;
  activePresetKey: string | null;
  customPresets: PresetAvatar[];
}

export interface AvatarHistory {
  past: AvatarDocument[];
  present: AvatarDocument;
  future: AvatarDocument[];
  lastEdit: { key: string; time: number } | null;
}

export function sameAvatarConfig(left: AvatarConfig, right: AvatarConfig): boolean {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)] as (keyof AvatarConfig)[]);
  return [...keys].every((key) => Object.is(left[key], right[key]));
}

export function avatarEditKey(left: AvatarConfig, right: AvatarConfig): string {
  return [...new Set([...Object.keys(left), ...Object.keys(right)] as (keyof AvatarConfig)[])]
    .filter((key) => !Object.is(left[key], right[key]))
    .sort()
    .join(',');
}

function sameDocument(left: AvatarDocument, right: AvatarDocument): boolean {
  return (
    left.activePresetKey === right.activePresetKey &&
    sameAvatarConfig(left.config, right.config) &&
    left.customPresets.length === right.customPresets.length &&
    left.customPresets.every((preset, index) => {
      const other = right.customPresets[index];
      return preset.id === other.id && preset.name === other.name && sameAvatarConfig(preset.config, other.config);
    })
  );
}

export function createAvatarHistory(present: AvatarDocument): AvatarHistory {
  return { past: [], present, future: [], lastEdit: null };
}

/** A slider drag / text edit becomes one undo step; commands always start a new step. */
export function commitAvatarDocument(
  history: AvatarHistory,
  present: AvatarDocument,
  groupKey?: string,
  time = Date.now(),
): AvatarHistory {
  if (sameDocument(history.present, present)) return history;
  const grouped =
    Boolean(groupKey) &&
    history.lastEdit?.key === groupKey &&
    time >= history.lastEdit.time &&
    time - history.lastEdit.time <= EDIT_GROUP_WINDOW_MS &&
    history.past.length > 0 &&
    history.future.length === 0;
  const past = grouped ? history.past : [...history.past, history.present].slice(-AVATAR_HISTORY_LIMIT);

  // Moving a control back to its original value should not leave an empty undo step.
  if (grouped && sameDocument(past[past.length - 1], present)) {
    return { past: past.slice(0, -1), present, future: [], lastEdit: null };
  }
  return {
    past,
    present,
    future: [],
    lastEdit: groupKey ? { key: groupKey, time } : null,
  };
}

export function undoAvatarHistory(history: AvatarHistory): AvatarHistory {
  const present = history.past.at(-1);
  if (!present) return history;
  return {
    past: history.past.slice(0, -1),
    present,
    future: [history.present, ...history.future],
    lastEdit: null,
  };
}

export function redoAvatarHistory(history: AvatarHistory): AvatarHistory {
  const present = history.future[0];
  if (!present) return history;
  return {
    past: [...history.past, history.present].slice(-AVATAR_HISTORY_LIMIT),
    present,
    future: history.future.slice(1),
    lastEdit: null,
  };
}
