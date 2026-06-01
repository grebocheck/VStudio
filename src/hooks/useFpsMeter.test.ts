import { describe, expect, it } from 'vitest';
import { calculateFps } from './useFpsMeter';

describe('calculateFps', () => {
  it('calculates and rounds the measured frame rate to one decimal place', () => {
    expect(calculateFps(59, 1_003)).toBe(58.8);
  });

  it('returns zero for empty or invalid samples', () => {
    expect(calculateFps(0, 1_000)).toBe(0);
    expect(calculateFps(60, 0)).toBe(0);
  });
});
