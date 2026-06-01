import { describe, expect, it } from 'vitest';
import { avatarExportFileName, safeExportFileName, timestampForFileName } from './avatarExport';

describe('avatar export helpers', () => {
  it('sanitizes export file names', () => {
    expect(safeExportFileName('  Neon Cat / Alert!  ')).toBe('Neon_Cat_Alert');
    expect(safeExportFileName('')).toBe('vstudio-avatar');
  });

  it('formats stable export timestamps', () => {
    expect(timestampForFileName(new Date('2026-06-01T13:45:06.000Z'))).toBe('2026-06-01-13-45-06');
  });

  it('builds export file names with clean extensions', () => {
    const date = new Date('2026-06-01T13:45:06.000Z');
    expect(avatarExportFileName('Miya Cyber', '.png', date)).toBe('Miya_Cyber-2026-06-01-13-45-06.png');
  });
});
