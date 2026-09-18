import { describe, expect, it } from 'vitest';
import { formatBytes, formatPercent, formatRecordingDuration, gifFrameDelay } from './useAvatarRecorder';

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

  it('formats and clamps progress percentages', () => {
    expect(formatPercent(-1)).toBe('0%');
    expect(formatPercent(0.424)).toBe('42%');
    expect(formatPercent(2)).toBe('100%');
  });
});

describe('GIF playback timing', () => {
  it('preserves a two-second interval at 12 fps despite GIF centisecond precision', () => {
    const times = Array.from({ length: 25 }, (_, frame) => (frame * 2000) / 24);
    const delays = times.slice(0, -1).map((at, index) => gifFrameDelay(at, times[index + 1]));
    expect(delays.reduce((sum, delay) => sum + delay, 0)).toBe(2000);
    expect(new Set(delays)).toEqual(new Set([80, 90]));
  });
  it('keeps natural speed when slow snapshots capture fewer frames', () => {
    const times = [0, 367, 701, 1035, 1402, 1782, 2000];
    const delays = times.slice(0, -1).map((at, index) => gifFrameDelay(at, times[index + 1]));
    expect(delays).toEqual([370, 330, 340, 360, 380, 220]);
    expect(delays.reduce((sum, delay) => sum + delay, 0)).toBe(2000);
  });
});
