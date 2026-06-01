import { describe, expect, it } from 'vitest';
import {
  DESKTOP_MIN_WIDTH,
  isDesktopViewport,
  nextOnboardingStep,
  ONBOARDING_STEP_COUNT,
  previousOnboardingStep,
} from './onboarding';

describe('isDesktopViewport', () => {
  it('uses the Tailwind lg breakpoint for the full studio workspace', () => {
    expect(isDesktopViewport(DESKTOP_MIN_WIDTH - 1)).toBe(false);
    expect(isDesktopViewport(DESKTOP_MIN_WIDTH)).toBe(true);
  });
});

describe('onboarding step navigation', () => {
  it('moves between steps without leaving the supported range', () => {
    expect(nextOnboardingStep(0)).toBe(1);
    expect(nextOnboardingStep(ONBOARDING_STEP_COUNT - 1)).toBe(ONBOARDING_STEP_COUNT - 1);
    expect(previousOnboardingStep(1)).toBe(0);
    expect(previousOnboardingStep(0)).toBe(0);
  });
});
