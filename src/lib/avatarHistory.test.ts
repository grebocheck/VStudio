import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../presets';
import {
  AVATAR_HISTORY_LIMIT,
  avatarEditKey,
  commitAvatarDocument,
  createAvatarHistory,
  redoAvatarHistory,
  undoAvatarHistory,
  type AvatarDocument,
} from './avatarHistory';

const document = (): AvatarDocument => ({ config: { ...DEFAULT_CONFIG }, activePresetKey: null, customPresets: [] });

describe('avatar project history', () => {
  it('groups a slider drag and restores its initial value with a single undo', () => {
    const start = document();
    let history = createAvatarHistory(start);
    for (let index = 1; index <= 8; index++) {
      history = commitAvatarDocument(
        history,
        { ...start, config: { ...start.config, headSize: 0.8 + index * 0.04 } },
        'headSize',
        index * 100,
      );
    }
    expect(history.past).toHaveLength(1);
    const undone = undoAvatarHistory(history);
    expect(undone.present).toEqual(start);
    expect(redoAvatarHistory(undone).present).toEqual(history.present);
  });

  it('separates different controls, pauses, and preset commands', () => {
    const start = document();
    let history = createAvatarHistory(start);
    const edit = (key: string, value: string, time: number) => {
      history = commitAvatarDocument(
        history,
        { ...history.present, config: { ...history.present.config, [key]: value } },
        key,
        time,
      );
    };
    edit('hairColor', '#123456', 100);
    edit('eyeColor', '#654321', 110);
    edit('eyeColor', '#abcdef', 1_000);
    history = commitAvatarDocument(history, { ...start, activePresetKey: 'starter' });
    edit('eyeColor', '#654321', 1_100);
    expect(history.past).toHaveLength(5);
  });

  it('ignores no-ops and keeps the redo branch', () => {
    const start = document();
    const changed = commitAvatarDocument(createAvatarHistory(start), { ...start, activePresetKey: 'starter' });
    const undone = undoAvatarHistory(changed);
    const noOp = commitAvatarDocument(undone, { ...start, config: { ...start.config } }, 'name');
    expect(noOp).toBe(undone);
    expect(noOp.future).toHaveLength(1);
  });

  it('discards redo after a new change and does not group across undo', () => {
    const start = document();
    const changed = commitAvatarDocument(
      createAvatarHistory(start),
      { ...start, config: { ...start.config, name: 'First' } },
      'name',
      100,
    );
    const undone = undoAvatarHistory(changed);
    const branched = commitAvatarDocument(
      undone,
      { ...start, config: { ...start.config, name: 'Second' } },
      'name',
      200,
    );
    expect(branched.future).toEqual([]);
    expect(undoAvatarHistory(branched).present).toEqual(start);
  });

  it('removes a grouped change that returns to its starting value', () => {
    const start = document();
    const changed = commitAvatarDocument(
      createAvatarHistory(start),
      { ...start, config: { ...start.config, name: 'Draft' } },
      'name',
      100,
    );
    expect(commitAvatarDocument(changed, start, 'name', 200).past).toEqual([]);
  });

  it('restores config, preset selection, and imported library together', () => {
    const start = document();
    const imported = {
      config: { ...start.config, name: 'Imported' },
      activePresetKey: 'custom-imported',
      customPresets: [{ id: 'custom-imported', name: 'Saved', config: { ...start.config } }],
    };
    const changed = commitAvatarDocument(createAvatarHistory(start), imported);
    expect(undoAvatarHistory(changed).present).toEqual(start);
    expect(redoAvatarHistory(undoAvatarHistory(changed)).present).toEqual(imported);
  });

  it('bounds retained history and safely handles empty undo/redo', () => {
    const start = document();
    const empty = createAvatarHistory(start);
    expect(undoAvatarHistory(empty)).toBe(empty);
    expect(redoAvatarHistory(empty)).toBe(empty);
    let history = empty;
    for (let index = 0; index < AVATAR_HISTORY_LIMIT + 10; index++) {
      history = commitAvatarDocument(history, { ...start, config: { ...start.config, name: String(index) } });
    }
    expect(history.past).toHaveLength(AVATAR_HISTORY_LIMIT);
    for (let index = 0; index < AVATAR_HISTORY_LIMIT; index++) history = undoAvatarHistory(history);
    expect(history.present.config.name).toBe('9');
    expect(history.future).toHaveLength(AVATAR_HISTORY_LIMIT);
  });

  it('gives the same group key regardless of field insertion order', () => {
    expect(avatarEditKey(DEFAULT_CONFIG, { ...DEFAULT_CONFIG, name: 'New', lore: 'Story' })).toBe('lore,name');
  });
});
