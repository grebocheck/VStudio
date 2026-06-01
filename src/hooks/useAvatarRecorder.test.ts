import { describe, expect, it } from 'vitest';
import { formatBytes, formatRecordingDuration } from './useAvatarRecorder';

describe('avatar recorder formatting helpers', () => {
  it('formats elapsed recording time as m:ss', () => {
    expect(formatRecordingDuration(0)).toBe('0:00');
    expect(formatRecordingDuration(9_999)).toBe('0:09');
    expect(formatRecordingDuration(65_100)).toBe('1:05');
  });

  it('formats output file sizes', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(2 * 1024 * 1024)).toBe('2.0 MB');
  });
});
