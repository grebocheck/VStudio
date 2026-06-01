import { describe, expect, it } from 'vitest';
import { INITIAL_RIG } from '../presets';
import { areRightSidebarPropsEqual, type RightSidebarProps } from './RightSidebar';

const createProps = (overrides: Partial<RightSidebarProps> = {}) =>
  ({
    activeSidebarTab: 'presets',
    rig: INITIAL_RIG,
    overlayCount: 0,
    ...overrides,
  }) as RightSidebarProps;

describe('areRightSidebarPropsEqual', () => {
  it('ignores live rig frames while the manual rigging panel is hidden', () => {
    const previous = createProps();
    const next = createProps({ rig: { ...INITIAL_RIG, angleX: 12 } });

    expect(areRightSidebarPropsEqual(previous, next)).toBe(true);
  });

  it('renders live rig frames while the manual rigging panel is visible', () => {
    const previous = createProps({ activeSidebarTab: 'rigging' });
    const next = createProps({ activeSidebarTab: 'rigging', rig: { ...INITIAL_RIG, angleX: 12 } });

    expect(areRightSidebarPropsEqual(previous, next)).toBe(false);
  });

  it('renders ordinary prop changes on every panel', () => {
    const previous = createProps();
    const next = createProps({ overlayCount: 1 });

    expect(areRightSidebarPropsEqual(previous, next)).toBe(false);
  });
});
